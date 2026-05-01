"""
Production Gunicorn configuration.
Worker count formula: (2 × CPU cores) + 1
"""
import multiprocessing

#  Server socket 
bind = "0.0.0.0:8000"
backlog = 2048

#  Worker processes 
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1200          # Restart workers after N requests (memory leak guard)
max_requests_jitter = 200    # Randomise restarts to avoid thundering herd
timeout = 120                # Kill worker if it doesn't respond within 2 min
graceful_timeout = 30        # Time to finish in-flight requests on SIGTERM
keepalive = 5

#  Logging 
accesslog = "-"              # stdout
errorlog = "-"               # stdout
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)sµs'

#  Process naming 
proc_name = "scan_info_tech"

#  Security 
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
