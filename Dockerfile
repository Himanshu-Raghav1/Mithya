# Use the official Microsoft Playwright image because it has all browser dependencies pre-installed!
FROM mcr.microsoft.com/playwright/python:v1.41.0-jammy

# Set the working directory
WORKDIR /app

# Copy requirement list and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend files
COPY app.py .
COPY workers.py .
COPY test.py .
COPY start.sh .

# Make the start script executable
RUN chmod +x start.sh

# Expose the port the app runs on
EXPOSE 8000

# Run the incredibly handy start.sh script to launch both API and Scraper 
CMD ["./start.sh"]
