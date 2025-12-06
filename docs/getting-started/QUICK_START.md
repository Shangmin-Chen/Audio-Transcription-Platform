# Quick Start Guide

Get Whisperrr up and running quickly. This guide covers both Docker and local development setups.

## Overview

Whisperrr consists of three services:

- **Frontend** (React) - Port 3737 (default)
- **Backend** (Spring Boot) - Port 7331 (default)
- **Python Service** (FastAPI) - Port 5001 (default)

### Setup Options

1. **Docker** - Fastest way to get started (recommended for first-time users)
2. **Local Development** - For development and customization
   - **Localhost** - Default ports, no configuration needed
   - **Remote/Custom** - Use setup script for different hosts or ports

## Prerequisites

Before starting, ensure you have the required software installed:

- **Java JDK 21** - Required for Spring Boot backend
- **Python 3.12** - Required for transcription service (specific version)
- **Node.js 18+** and **npm** - Required for React frontend
- **FFmpeg** - Required for audio processing

**📋 Need help?** See the [Prerequisites Guide](PREREQUISITES.md) for detailed installation instructions.

## Option 1: Docker Setup (Recommended for First-Time Users)

The fastest way to get started:

```bash
# Clone the repository
git clone <repository-url>
cd Whisperrr

# Start all services
docker compose up -d

# Access the application
# Frontend: http://localhost:3737
# Backend API: http://localhost:7331
# Python Service: http://localhost:5001
```

**View logs:**
```bash
docker compose logs -f
```

**Stop services:**
```bash
docker compose down
```

## Option 2: Local Development Setup

### Localhost Development (Default - No Configuration Needed)

If all services run on `localhost` with default ports, no environment variable configuration is needed.

#### Step 1: Start Python Service

```bash
cd python-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start service
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 5001
```

**Note:** First startup downloads the Whisper model (~74 MB), which may take a few minutes.

#### Step 2: Start Backend Service

In a new terminal:

```bash
cd backend
./mvnw spring-boot:run
```

#### Step 3: Start Frontend Service

In a new terminal:

```bash
cd frontend
npm install
npm start
```

**Service URLs:**
- Frontend: http://localhost:3737
- Backend API: http://localhost:7331/api
- Python Service: http://localhost:5001

### Remote Development or Custom Ports

If services run on different hosts or custom ports, use the setup script:

#### Step 1: Run Setup Script

The setup script checks prerequisites and configures environment variables:

```bash
./setup-env.sh
```

The script will:
- Check prerequisites (Java, Python, Node.js, FFmpeg)
- Ask if you want remote deployment mode (for multiple hosts per service)
- Prompt for host IP and ports (single host mode) or multiple hosts per service (remote deployment mode)
- Validate inputs
- Generate component-specific `.env` files for each service:
  - `frontend/.env` - Frontend configuration
  - `backend/.env` - Backend configuration
  - `python-service/.env` - Python service configuration

#### Remote Deployment Mode

When prompted "Set up for remote deployment? (y/N)", choose:

- **No (default)**: Simple single-host configuration
  - Enter one host IP/domain and ports for each service
  - Suitable for most development scenarios

- **Yes**: Multi-host configuration
  - Configure multiple hosts per service (e.g., domain + IP)
  - Useful for scenarios like:
    - Cloudflare tunnel (domain) + direct IP access
    - Multiple network interfaces
    - Load balancing setups
  - The script will prompt you to add multiple hosts for each service
  - CORS will be configured with all frontend URLs (for backend) and all frontend + backend URLs (for Python service)

**Example Remote Deployment Flow:**
```
Set up for remote deployment? (y/N): y

Frontend Service Configuration
Enter the frontend host (IP or domain): x.y.com
Enter the frontend port: 3737
Add more frontend hosts? (y/N): y
Enter the frontend host (IP or domain): 192.168.1.100
Enter the frontend port: 3737
Add more frontend hosts? (y/N): n

Backend Service Configuration
...
```

#### Step 2: Start Services

**No manual activation needed!** Each service automatically reads its `.env` file at startup.

Start services in separate terminals (in this order):

1. **Python Service:**
   ```bash
   cd python-service
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 5001
   ```

2. **Backend Service:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

3. **Frontend Service:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

**Important:** Start services in this order:
1. Python service first (takes longest - model loading)
2. Backend service second
3. Frontend service last

**Note:** Each service automatically loads its `.env` file at startup. No need to manually source or export variables.

## Environment Variables Explained

When services are not running on localhost, you need to configure environment variables so they can communicate. Each service uses its own `.env` file for configuration.

### Quick Setup: Use the Script

The easiest way is using the setup script:

```bash
./setup-env.sh
```

The script generates `.env` files for each service:
- `frontend/.env` - Contains `REACT_APP_API_URL`
- `backend/.env` - Contains `CORS_ALLOWED_ORIGINS` and `WHISPERRR_SERVICE_URL`
- `python-service/.env` - Contains `CORS_ORIGINS`

Each service automatically reads its `.env` file at startup - no manual sourcing needed!

### Resetting to Defaults

To reset services to default localhost configuration, use the interactive cleanup script:

```bash
./cleanup-env.sh
```

The script will prompt you for each service (Frontend, Backend, Python Service) asking if you want to delete its `.env` file. Default answer is "yes" (press Enter to confirm).

### Manual Configuration

If you prefer to create `.env` files manually:

#### Frontend Configuration (`frontend/.env`)

**`REACT_APP_API_URL`**
- **Purpose:** Tells the frontend where to find the backend API
- **Format:** `http://HOST:PORT/api`
- **Example:** `REACT_APP_API_URL=http://192.168.1.100:7331/api`
- **Used by:** Frontend (React reads this at build/start time)

#### Backend Configuration (`backend/.env`)

**`CORS_ALLOWED_ORIGINS`**
- **Purpose:** Configures which frontend URLs the backend accepts (CORS)
- **Format:** Comma-separated list of URLs
- **Example:** `CORS_ALLOWED_ORIGINS=http://192.168.1.100:3737`
- **Used by:** Backend (Spring Boot reads via spring-dotenv)

**`WHISPERRR_SERVICE_URL`**
- **Purpose:** Tells the backend where to find the Python transcription service
- **Format:** `http://HOST:PORT`
- **Example:** `WHISPERRR_SERVICE_URL=http://192.168.1.100:5001`
- **Used by:** Backend (Spring Boot reads via spring-dotenv)

#### Python Service Configuration (`python-service/.env`)

**`CORS_ORIGINS`**
- **Purpose:** Configures which origins the Python service accepts (CORS)
- **Format:** Comma-separated list of URLs
- **Example:** `CORS_ORIGINS=http://192.168.1.100:3737,http://192.168.1.100:7331`
- **Used by:** Python Service (FastAPI/Pydantic reads automatically)

### Configuration Examples

#### Localhost (Default)
No `.env` files needed - services use defaults:
- Frontend: `http://localhost:3737`
- Backend: `http://localhost:7331`
- Python: `http://localhost:5001`

#### Remote IP Address

**`frontend/.env`:**
```
REACT_APP_API_URL=http://192.168.1.100:7331/api
```

**`backend/.env`:**
```
CORS_ALLOWED_ORIGINS=http://192.168.1.100:3737
WHISPERRR_SERVICE_URL=http://192.168.1.100:5001
```

**`python-service/.env`:**
```
CORS_ORIGINS=http://192.168.1.100:3737,http://192.168.1.100:7331
```

#### Multiple Hosts (Remote Deployment Mode)

**`frontend/.env`:**
```
REACT_APP_API_URL=http://x.y.com:7331/api
```

**`backend/.env`:**
```
CORS_ALLOWED_ORIGINS=http://x.y.com:3737,http://192.168.1.100:3737
WHISPERRR_SERVICE_URL=http://x.y.com:5001
```

**`python-service/.env`:**
```
CORS_ORIGINS=http://x.y.com:3737,http://192.168.1.100:3737,http://x.y.com:7331,http://192.168.1.100:7331
```

**Note:** Use the setup script's remote deployment mode to configure multiple hosts easily. The script will generate the correct `.env` files automatically.

#### Custom Ports

**`frontend/.env`:**
```
REACT_APP_API_URL=http://localhost:8080/api
```

**`backend/.env`:**
```
CORS_ALLOWED_ORIGINS=http://localhost:3000
WHISPERRR_SERVICE_URL=http://localhost:9000
```

**`python-service/.env`:**
```
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

## Verification

After starting all services, verify they're working:

### Check Python Service
```bash
curl http://localhost:5001/health
# or with remote IP
curl http://192.168.1.100:5001/health
```

### Check Backend Service
```bash
curl http://localhost:7331/api/audio/health
# or with remote IP
curl http://192.168.1.100:7331/api/audio/health
```

### Check Frontend
Open in browser:
- `http://localhost:3737` (or your configured host/port)

### Python API Documentation
- Interactive API docs: http://localhost:5001/docs

## Troubleshooting

### Prerequisites Issues

**Problem:** Setup script reports missing prerequisites

**Solution:**
- See [Prerequisites Guide](PREREQUISITES.md) for installation instructions
- Verify versions match requirements:
  - Java JDK 21: `java -version`
  - Python 3.12: `python3 --version`
  - Node.js 18+: `node --version`
  - FFmpeg: `ffmpeg -version`

### CORS Errors

**Symptom:** Browser console shows CORS errors:
```
Access to fetch at 'http://...' from origin 'http://...' has been blocked by CORS policy
```

**Solution:**
1. Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL exactly (including port)
2. Verify `CORS_ORIGINS` includes both frontend and backend URLs
3. Check that URLs match exactly (no trailing slashes, correct protocol)
4. Restart services after changing CORS variables

**Example:**
```bash
# Frontend is at http://192.168.1.100:3737
export CORS_ALLOWED_ORIGINS=http://192.168.1.100:3737  # Must match exactly
export CORS_ORIGINS=http://192.168.1.100:3737,http://192.168.1.100:7331
```

### Connection Refused

**Symptom:** Services can't connect to each other

**Solution:**
1. Verify services are running on expected ports
2. Check firewall settings if using remote IPs
3. Ensure environment variables are set in the same shell session where services are started
4. For remote IPs, ensure services bind to `0.0.0.0` not `127.0.0.1`

**Example:**
```bash
# Python service must bind to 0.0.0.0 for remote access
uvicorn app.main:app --host 0.0.0.0 --port 5001
```

### Environment Variables Not Applied

**Symptom:** Services still use default localhost URLs

**Solution:**
1. Ensure `.env` files exist in each service directory
2. For frontend, `.env` file must exist before `npm start` (React reads env vars at start time)
3. Restart services after changing `.env` files
4. Verify `.env` files contain correct values

**Verification:**
```bash
# Check if .env files exist and contain correct values
cat frontend/.env
cat backend/.env
cat python-service/.env
```

**Reset to Defaults:**
```bash
# Interactive cleanup script
./cleanup-env.sh
```

### Frontend Can't Find Backend

**Symptom:** Frontend shows network errors when trying to connect to backend, or frontend calls localhost instead of configured URL

**Solution:**
1. Verify `frontend/.env` contains correct `REACT_APP_API_URL`
2. **CRITICAL: Restart the React dev server** after creating/updating `frontend/.env`
   - React reads environment variables only at dev server start time (not runtime)
   - Stop the dev server (Ctrl+C) and run `npm start` again
   - Changes to `.env` files do NOT take effect until restart
3. Check browser console for API configuration debug messages (look for `[API Config]` logs)
4. Verify backend is running and accessible

**Debug:**
```bash
# Check frontend .env file exists and has correct value
cat frontend/.env

# Verify the value is correct (should match your backend URL)
# Example: REACT_APP_API_URL=http://100.76.98.121:7331/api

# Test backend directly
curl http://your-backend-url/api/audio/health

# Check browser console for:
# - [API Config] logs showing which URL is being used
# - [API Client] logs showing actual API requests
```

**Common Mistakes:**
- ✅ Created `frontend/.env` but forgot to restart dev server
- ✅ Updated `frontend/.env` but dev server was already running
- ✅ `.env` file has wrong path or wrong variable name (must be `REACT_APP_API_URL`)
- ✅ `.env` file has syntax errors (missing `=` sign, quotes in value, etc.)

**Verification:**
When you start the frontend dev server, check the browser console. You should see:
```
[API Config] ============================================
[API Config] Environment Variable Debug Info:
[API Config]   REACT_APP_API_URL: http://100.76.98.121:7331/api
[API Config]   Resolved API URL: http://100.76.98.121:7331/api
[API Config]   ✓ Using API URL from environment variable
[API Config] ============================================
```

If you see "REACT_APP_API_URL: (not set)" or "Using fallback API URL", the `.env` file is not being read - restart the dev server.

### Python Service Issues

- **Model download fails:** Check internet connection. Models download from Hugging Face on first run.
- **Python version error:** Ensure Python 3.12 is installed. Check with `python3 --version`.
- **FFmpeg not found:** Install FFmpeg. See [Prerequisites Guide](PREREQUISITES.md).

### Backend Issues

- **Port 7331 already in use:** Change port in `backend/src/main/resources/application.properties`
- **Java version error:** Ensure Java JDK 21 is installed: `java -version`
- **mvnw not working:** Make sure Java JDK 21 is installed and in your PATH

### Frontend Issues

- **Port 3737 already in use:** Change port in `frontend/package.json` scripts section
- **npm install fails:** Try clearing cache: `npm cache clean --force`
- **Node/npm version issues:** Ensure correct Node.js and npm versions. See [Prerequisites Guide](PREREQUISITES.md).

## Best Practices

1. **Use the setup script** for initial configuration - it validates inputs and prevents errors
2. **The script automatically generates** `.env` files for each service component
3. **No manual sourcing needed** - services automatically read their `.env` files at startup
4. **Restart services after configuration changes** - services load `.env` files at startup
5. **Use consistent host/port values** across all `.env` files
6. **Start services in order:** Python → Backend → Frontend
7. **Test connectivity** after configuration changes
8. **Use cleanup script** to reset to defaults: `./cleanup-env.sh` (interactive prompts)
9. **Document your configuration** - note which IPs/ports you're using
10. **Keep `.env` files in `.gitignore`** - they're already excluded from version control

## Deployment Scenarios

### Local Development (localhost)

No environment variables needed - defaults work out of the box:
- Frontend: `http://localhost:3737`
- Backend: `http://localhost:7331`
- Python: `http://localhost:5001`

### Remote Development (Same Network)

When services run on different machines on the same network:

```bash
# Run setup script with remote IP
./setup-env.sh
# Enter your machine's IP address when prompted
# Script automatically generates .env files for each service
```

### Docker Deployment

Docker Compose handles service discovery automatically using service names. For external access, you may need to configure environment variables if accessing from outside the Docker network.

### Production Deployment

For production, create `.env` files in each service directory or set environment variables in your deployment platform:

**Option 1: Use .env files** (recommended for containerized deployments)
- Create `frontend/.env`, `backend/.env`, and `python-service/.env` with production values
- Services automatically load them at startup

**Option 2: Environment variables** (for systemd, Docker, etc.)
```ini
[Service]
Environment="CORS_ALLOWED_ORIGINS=https://app.example.com"
Environment="WHISPERRR_SERVICE_URL=https://transcribe.example.com"
```

**Note:** Environment variables override `.env` file values, so you can use either approach.

## Next Steps

- **[Prerequisites Guide](PREREQUISITES.md)** - Check versions and install required software
- **[Configuration Guide](../guides/CONFIGURATION.md)** - Detailed configuration options
- **[Architecture Overview](../architecture/OVERVIEW.md)** - Understand the system architecture
- **[Codebase Guide](../development/CODEBASE_GUIDE.md)** - Navigate the codebase

---

**Last Updated:** 2024-01-15
