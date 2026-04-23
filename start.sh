#!/bin/bash
# Mithya Backend — Single Render Web Service (Free)
# Sports scraper removed. Flask-only, lean and fast.

# ---- Flask API (foreground — keeps the service alive) ----
gunicorn --bind=0.0.0.0:${PORT:-8000} --timeout 120 app:app
