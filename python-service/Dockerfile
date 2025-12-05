# Python service Dockerfile
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies including ffmpeg for video/audio conversion
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    mkdir -p /tmp/whisperrr_uploads && \
    chown -R appuser:appuser /app /tmp/whisperrr_uploads

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Change ownership
RUN chown -R appuser:appuser /app

# Expose port
EXPOSE 8000

# Set environment variables for production
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Switch to non-root user
USER appuser

# Run the application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
