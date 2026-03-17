#!/bin/bash
# Mithya Backend — Single Render Web Service (Free)
#
# workers.py runs ONCE and exits (releases all Playwright/Chrome memory).
# The shell loop re-starts it every 3 minutes.
# Between runs: only Flask is in memory (~100MB).  
# During a scrape: peak ~300MB (well under 512MB limit).

# ---- Sports Slot Worker (background timed loop) ----
(
  while true; do
    python -u workers.py
    sleep 180   # 3 minutes before next run
  done
) &

# ---- Flask API (foreground — keeps the service alive) ----
gunicorn --bind=0.0.0.0:${PORT:-8000} --timeout 120 app:app
