#!/bin/sh
set -e

echo "Waiting for database..."

for i in $(seq 1 30); do
  python -c "
import pymysql, os, sys
try:
    pymysql.connect(
        host='db',
        user=os.environ['MYSQL_USER'],
        password=os.environ['MYSQL_PASSWORD'],
        db=os.environ['MYSQL_DATABASE']
    )
    sys.exit(0)
except Exception:
    sys.exit(1)
" && echo "Database is ready!" && break || echo "Attempt $i/30 failed, retrying in 3s..." && sleep 3
done

alembic upgrade head
gunicorn app.main:app --config gunicorn.conf.py