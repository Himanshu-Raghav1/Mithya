# Use the official Microsoft Playwright image (focal) to ensure Python 3.10 is used
FROM mcr.microsoft.com/playwright/python:v1.42.0-focal

# Set the working directory
WORKDIR /app

# Install C++ build dependencies required for compiling greenlet from source
RUN apt-get update && apt-get install -y build-essential python3-dev gcc g++

# Copy requirement list and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend files
COPY app.py .
COPY workers.py .
COPY start.sh .

# Make the start script executable
RUN chmod +x start.sh

# Expose the port the app runs on
EXPOSE 8000

# Run the incredibly handy start.sh script to launch both API and Scraper 
CMD ["./start.sh"]
