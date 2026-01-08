import os
import multiprocessing

bind = f"0.0.0.0:{os.getenv('PORT', '8080')}"
workers = 2
worker_class = 'sync'
timeout = 120
keepalive = 5
max_requests = 1000
max_requests_jitter = 50
preload_app = True  # Load app before forking workers
accesslog = '-'
errorlog = '-'
loglevel = 'info'
