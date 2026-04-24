"""
app/main.py
FastAPI application factory with lifespan management, middleware,
router registration, and global exception handlers.
"""
import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import check_db_connection
from app.routes import auth, products, cart, orders, admin, inventory

#  Logging 
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)
settings = get_settings()


#  Lifespan 
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀  Starting %s [%s]", settings.app_name, settings.app_env)

    # Check database connection
    if not check_db_connection():
        logger.critical("❌  Cannot reach the database — aborting startup")
        sys.exit(1)
    logger.info("✅  Database connection verified")
    yield
    logger.info("🛑  Shutting down %s", settings.app_name)


#  App factory 
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="Scan Info Tech, providing enterprise networking products and IT solutions",
        docs_url="/docs" if not settings.debug is False else "/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    #  CORS 
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],   # Restrict to your frontend domain in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    #  Routers 
    app.include_router(auth.router)
    app.include_router(products.router)
    app.include_router(cart.router)
    app.include_router(orders.router)
    app.include_router(admin.router)
    app.include_router(inventory.router)

    #  Health endpoint 
    @app.get("/health", tags=["Health"])
    def health_check():
        db_ok = check_db_connection()
        return {
            "status": "healthy" if db_ok else "degraded",
            "app": settings.app_name,
            "environment": settings.app_env,
            "database": "up" if db_ok else "down",
        }

    #  Global exception handlers 
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception on %s %s", request.method, request.url)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal error occurred. Please try again later."},
        )

    return app


app = create_app()
