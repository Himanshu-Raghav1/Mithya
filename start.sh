#!/bin/bash
# Start the background worker (Playwright scraper) in the background
python workers.py &

# Start the Flask API server using gunicorn in the foreground
# Azure sets the PORT environment variable (usually 80 or 8080)
gunicorn --bind=0.0.0.0:${PORT:-8000} --timeout 120 app:app
