# Scan Info Tech, providing enterprise networking products and IT solutions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.111 |
| Server | Gunicorn + UvicornWorker |
| Database | MySQL 8 via SQLAlchemy ORM |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Image Storage | Cloudinary SDK |
| Containerisation | Docker (multi-stage) + Docker Compose |
| DB Admin UI | phpMyAdmin |

---

## Project Structure

```
scan_info_tech/
backend/
  ├── app/
  │   ├── main.py            # App factory, lifespan, routers, error handlers
  │   ├── config.py          # Pydantic Settings (env-driven)
  │   ├── database.py        # Engine, SessionLocal, get_db()
  │   ├── models/            # SQLAlchemy ORM models
  │   ├── schemas/           # Pydantic v2 request/response schemas
  │   ├── routes/            # FastAPI routers (one file per domain)
  │   ├── services/          # Business logic (no HTTP concerns)
  │   ├── core/              # Security helpers + FastAPI dependencies
  │   └── utils/             # Cloudinary wrapper
  ├── alembic/               # Database migration scripts
  ├── requirements.txt
  ├── gunicorn.conf.py       # Production Gunicorn config
  ├── Dockerfile             # Multi-stage build
  ├── docker-compose.yml     # app + MySQL 8 + phpMyAdmin
  └── .env.example
```

---

## Quick Start (Docker)

### 1. Clone & configure environment

```bash
git clone <repo-url> scan_info_tech
cd scan_info_tech
cp .env.example .env
# Edit .env — fill in your real secrets
```

### 2. Build & start all services

```bash
docker compose up --build -d
```

Services:
- **API** → http://localhost:8000
- **Swagger UI** → http://localhost:8000/docs
- **phpMyAdmin** → http://localhost:8080
- **MySQL** → localhost:3306

### 3. Run database migrations

```bash
docker compose exec app alembic upgrade head
```

### 4. Health check

```bash
curl http://localhost:8000/health
```

---

## Local Development (without Docker)

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Set DATABASE_URL to your local MySQL
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

---

## Running with Gunicorn (production)

```bash
gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  --config gunicorn.conf.py
```

Worker count is auto-calculated: `(2 × CPU cores) + 1`

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | `mysql+pymysql://user:pass@host:3306/dbname` |
| `JWT_SECRET_KEY` | Long random string — keep secret |
| `JWT_ALGORITHM` | `HS256` (default) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL in minutes (default 60) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `MYSQL_ROOT_PASSWORD` | MySQL root password (Docker only) |
| `MYSQL_DATABASE` | Schema name (Docker only) |
| `MYSQL_USER` | MySQL app user (Docker only) |
| `MYSQL_PASSWORD` | MySQL app password (Docker only) |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register new user (auto-creates wallet) |
| POST | `/auth/login` | ❌ | Login → returns JWT bearer token |

### Products (Public)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | ❌ | List products (paginated) |
| GET | `/products/{id}` | ❌ | Product detail |

### Cart (Public / Guest-friendly)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/cart/add` | ❌ | Add item — pass `user_id` or omit for guest |
| PATCH | `/cart/update-qty` | ❌ | Change quantity; set 0 to remove |

### Orders (Protected)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders/checkout` | ✅ JWT | Checkout cart item, deduct stock |
| GET | `/orders/history` | ✅ JWT | Authenticated user's order history |

### Admin — Read

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/orders` | ✅ Admin | All orders across all users |
| GET | `/admin/users` | ✅ Admin | All registered users |
| GET | `/admin/products` | ✅ Admin | All products |

### Inventory Management (Admin)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/inventory/product` | ✅ Admin | Create product + upload image to Cloudinary |
| PUT | `/inventory/product/{id}` | ✅ Admin | Update product + replace Cloudinary image |
| DELETE | `/inventory/product/{id}` | ✅ Admin | Delete product + remove Cloudinary image |

> Inventory endpoints accept `multipart/form-data` (use Swagger UI or `curl -F`).

---

## Database Migrations

```bash
# Apply all pending migrations
docker compose exec app alembic upgrade head

# Auto-generate a new migration after model changes
docker compose exec app alembic revision --autogenerate -m "describe change"

# Roll back one step
docker compose exec app alembic downgrade -1

# View migration history
docker compose exec app alembic history --verbose
```

---

## Making a User an Admin

Connect to MySQL via phpMyAdmin (http://localhost:8080) or:

```bash
docker compose exec db mysql -u scanuser -pscanpassword scaninfotech \
  -e "UPDATE users SET is_admin = 1 WHERE email = 'you@example.com';"
```

---

## Security Checklist for Production

- [ ] Set a long random `JWT_SECRET_KEY` (use `openssl rand -hex 32`)
- [ ] Restrict `CORS` `allow_origins` to your actual frontend domain
- [ ] Use a managed DB (e.g. AWS RDS / PlanetScale) — not the Docker MySQL
- [ ] Put Gunicorn behind Nginx or a cloud load balancer
- [ ] Enable HTTPS (TLS termination at proxy level)
- [ ] Rotate Cloudinary credentials regularly
- [ ] Never commit `.env` — add it to `.gitignore` ✅ (already done)
