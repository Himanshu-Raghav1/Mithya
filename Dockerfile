# Lean Python image — no Playwright/Chromium needed
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Install C++ build dependencies required for compiling some packages
RUN apt-get update && apt-get install -y build-essential python3-dev gcc g++ libssl-dev libffi-dev curl && rm -rf /var/lib/apt/lists/*

# Copy requirement list and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend files
COPY app.py .
COPY start.sh .

# Make the start script executable
RUN chmod +x start.sh

# Expose the port the app runs on
EXPOSE 8000

# Launch Flask API
CMD ["./start.sh"]
