# Scan Info Tech, providing enterprise networking products and IT solutions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.111 + Python 3.11 |
| Server | Gunicorn + UvicornWorker |
| Database | MySQL 8 via SQLAlchemy ORM |
| Migrations | Alembic |
| Auth | JWT (PyJWT) + bcrypt |
| Image Storage | Cloudinary |
| Email | fastapi-mail (Gmail SMTP) |
| Frontend | HTML + Tailwind CSS + Vanilla JS |
| Web Server | Nginx (frontend) |
| Containerisation | Docker + Docker Compose |
| DB Admin UI | phpMyAdmin |

---

## Project Structure

```
SCAN_INFO_TECH/
│
├── .vscode/
│
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── __pycache__/
│   │   ├── core/
│   │   │   ├── __pycache__/
│   │   │   ├── __init__.py
│   │   │   ├── dependencies.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   │   ├── __pycache__/
│   │   │   ├── __init__.py
│   │   │   ├── account.py
│   │   │   ├── cart.py
│   │   │   ├── guest.py
│   │   │   ├── order.py
│   │   │   ├── product.py
│   │   │   ├── transaction.py
│   │   │   └── user.py
│   │   │
│   │   ├── routes/
│   │   │   ├── __pycache__/
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── auth.py
│   │   │   ├── cart.py
│   │   │   ├── inventory.py
│   │   │   ├── orders.py
│   │   │   └── products.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __pycache__/
│   │   │   ├── __init__.py
│   │   │   ├── account.py
│   │   │   ├── cart.py
│   │   │   ├── order.py
│   │   │   ├── product.py
│   │   │   └── user.py
│   │   │
│   │   ├── services/
│   │   │   ├── __pycache__/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── cart_service.py
│   │   │   ├── order_service.py
│   │   │   └── product_service.py
│   │   │
│   │   ├── utils/
│   │   │   ├── __pycache__/
│   │   │   ├── __init__.py
│   │   │   ├── cloudinary.py
│   │   │   └── email.py
│   │   │
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── venv/
│   ├── alembic.ini
│   ├── gunicorn.conf.py
│   └── requirements.txt
│
├── frontend/
│   ├── build/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── img/
│   │   │   ├── auth-bg.jpg
│   │   │   ├── hero.jpg
│   │   │   └── hero2.jpg
│   │   ├── js/
│   │   │    ├── admin.js
│   │   │    ├── api.js
│   │   │    ├── auth.js
│   │   │    ├── cart.js
│   │   │    ├── nav.js
│   │   │    ├── orders.js
│   │   │    └── products.js
│   │   │
│   │   ├── about.html
│   │   ├── admin.html
│   │   ├── cart.html
│   │   ├── forgot-password.html
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── orders.html
│   │   ├── register.html
│   │   └── reset-password.html
│   │    
│   ├── node_modules/
│   ├── src/
│   │     └── input.css
│   ├── package-lock.json
│   ├── package.json
│   └── tailwind.config.js
│
├── .dockerignore
├── .env
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── entrypoint.sh
├── nginx.conf
└── README.md

```

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url> scan_info_tech
cd scan_info_tech
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your real values:

```env
# Database
MYSQL_ROOT_PASSWORD=root_password
MYSQL_DATABASE=scaninfotech
MYSQL_USER=scanuser
MYSQL_PASSWORD=db_password
DATABASE_URL=mysql+pymysql://scanuser:your_db_password@db:3306/scaninfotech

# JWT
JWT_SECRET_KEY=your-very-long-random-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Cloudinary
CLOUDINARY_CLOUD_NAME=cloud_name
CLOUDINARY_API_KEY=api_key
CLOUDINARY_API_SECRET=api_secret

# Mail (Gmail)
MAIL_USERNAME=youremail@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_FROM=youremail@gmail.com
MAIL_FROM_NAME=Scan Info Tech
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_STARTTLS=true
MAIL_SSL_TLS=false
```

### 3. Build the Tailwind CSS

```bash
cd frontend
npm install
npx tailwindcss -i ./src/input.css -o ./build/css/style.css --minify
cd ..
```

### 4. Add your images

Place these in `frontend/build/img/`:
- `logo.png` — your brand logo
- `auth-bg.jpg` — background image for login/register pages
- `hero.jpg` — hero image for the home page
- `placeholder.jpg` — fallback product image

### 5. Start all services

```bash
docker compose up --build -d
```

### 6. Access the platform

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| phpMyAdmin | http://localhost:8080 |

### 7. View logs

```bash
# All services
docker compose logs -f

# Just the backend
docker compose logs -f app

# Just the frontend
docker compose logs -f frontend
```

---

## Making Your First Admin

After the first user registers, promote them to admin via phpMyAdmin:

1. Open http://localhost:8080
2. Login with your `MYSQL_USER` and `MYSQL_PASSWORD`
3. Go to `scaninfotech` → `users` table → **SQL tab**
4. Run:

```sql
UPDATE users SET is_admin = 1, is_verified = 1 WHERE email = 'your@email.com';
```

Then login at http://localhost:3000/login.html and go to http://localhost:3000/admin.html

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register — sends verification email |
| POST | `/auth/login` | ❌ | Login — returns JWT token |
| GET | `/auth/verify?token=xxx` | ❌ | Verify email from link |
| POST | `/auth/resend-verification` | ❌ | Resend verification email |
| POST | `/auth/forgot-password` | ❌ | Request 6-digit OTP via email |
| POST | `/auth/reset-password` | ❌ | Reset password with OTP |

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | ❌ | List all products (paginated) |
| GET | `/products/{id}` | ❌ | Single product detail |

### Cart

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/cart/add` | ✅ | Add item to cart |
| GET | `/cart/my-cart` | ✅ | Get current user's cart |
| PATCH | `/cart/update-qty` | ✅ | Update quantity or remove item |
| DELETE | `/cart/clear` | ✅ | Clear entire cart |

### Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders/checkout` | ✅ | Checkout a cart item |
| GET | `/orders/history` | ✅ | User's order history |

### Admin — Read

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/orders` | ✅ Admin | All orders |
| GET | `/admin/users` | ✅ Admin | All users |
| GET | `/admin/products` | ✅ Admin | All products |

### Admin — User Management

| Method | Endpoint | Body | Description |
|---|---|---|---|
| PATCH | `/admin/users/make-admin` | `{"username": "john"}` | Promote to admin |
| PATCH | `/admin/users/suspend` | `{"username": "john"}` | Suspend account |
| PATCH | `/admin/users/reactivate` | `{"username": "john"}` | Reactivate account |

### Inventory (Admin)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/inventory/product` | ✅ Admin | Create product + Cloudinary upload |
| PUT | `/inventory/product/{id}` | ✅ Admin | Update product + replace image |
| DELETE | `/inventory/product/{id}` | ✅ Admin | Delete product + remove image |

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | App and DB status check |

---

## Database Migrations

Migrations run automatically on startup. To run manually:

```bash
# Apply all pending migrations
docker compose exec app alembic upgrade head

# Create a new migration after model changes
docker compose exec app alembic revision --autogenerate -m "describe change"

# Roll back one step
docker compose exec app alembic downgrade -1

# View history
docker compose exec app alembic history --verbose
```

---

## Gmail App Password Setup

The lockout notification and verification emails use Gmail SMTP.

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Go to https://myaccount.google.com/apppasswords
4. Create a new app password (name it anything)
5. Copy the 16-character password into `.env` as `MAIL_PASSWORD` - no spaces

---

## Frontend Development

To watch and recompile Tailwind CSS during development:

```bash
cd frontend
npm run tailwind
```

To serve the frontend locally without Docker:

```bash
cd frontend
npx serve build
# Open http://localhost:3000
```


## Common Commands

```bash
# Start all services
docker compose up -d

# Rebuild after code changes
docker compose up --build -d

# Restart only the backend (after .py file changes)
docker compose restart app

# Stop everything
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v

# Check running containers
docker compose ps

# Shell into the backend container
docker compose exec app bash
```

---

## Troubleshooting

**App can't connect to database**
```bash
docker compose logs db --tail=20
docker compose restart app
```

**Migrations not running**
```bash
docker compose exec app alembic upgrade head
```

**Frontend not loading**
```bash
docker compose logs frontend --tail=20
# Make sure build/css/style.css exists — run Tailwind compile first
```

**Email not sending**
```bash
docker compose exec app python -c "
import smtplib
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login('youremail@gmail.com', 'your_app_password')
print('SUCCESS')
server.quit()
"
```

**JWT token invalid**
- Make sure you logged in after any `is_admin` or `is_verified` changes
- Token bakes in user state at login time - always re-login after DB changes

---
