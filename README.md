# Whisperrr - AI-Powered Audio Transcription Platform

A production-ready, full-stack audio transcription platform that leverages Faster Whisper (faster-whisper) to provide high-quality speech-to-text conversion. Built with modern technologies including Spring Boot, FastAPI, and React TypeScript. Faster Whisper is up to 4x faster than OpenAI's Whisper with less memory usage, powered by CTranslate2.

## 🎯 Overview

Whisperrr transforms audio content into accurate, searchable text using state-of-the-art AI technology. Upload a file and get instant transcription results - no database setup, no job queuing, no polling required.

## ✨ Key Features

- **Instant Transcription**: Upload and get results immediately
- **High Accuracy**: Powered by Faster Whisper AI models (tiny to large-v3)
- **Fast Performance**: Up to 4x faster than OpenAI Whisper with less memory usage
- **Multi-Language**: Support for 99+ languages with automatic detection
- **Multiple Formats**: MP3, WAV, M4A, FLAC, OGG, WMA (up to 50MB)
- **Segment-Level Timestamping**: View transcription results with precise start and end timestamps for each segment
- **Stateless Architecture**: No database required - simplified deployment
- **Modern UI**: Responsive React interface with drag-and-drop upload
- **Production Ready**: Comprehensive error handling and monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│  React Frontend │◄──►│ Spring Boot API  │◄──►│   Python    │
│   (Port 3737)   │    │   (Port 7331)   │    │  Service    │
│                 │    │                 │    │ (Port 5001) │
│  • File Upload  │    │ • Validation    │    │ • Whisper AI│
│  • Results View │    │ • Proxy/Relay   │    │ • Processing│
└─────────────────┘    └─────────────────┘    └─────────────┘
```

### Service Responsibilities

- **React Frontend**: User interface with drag-and-drop file upload
- **Spring Boot API**: Lightweight proxy for validation and error handling
- **Python Service**: AI-powered transcription using Faster Whisper models (CTranslate2)

## 🚀 Quick Start

### Prerequisites

- **Docker** - For running the application
- **Docker Compose v2** - For orchestrating multiple services

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Whisperrr

# Start all services with Docker Compose
docker compose up -d

# Access the application
# Frontend: http://localhost:3737
# Backend API: http://localhost:7331
# Python Service: http://localhost:5001
```

### View Logs

```bash
docker compose logs -f
```

### Stop Services

```bash
docker compose down
```

## 💻 Local Installation (Without Docker)

If you prefer to run the services locally without Docker, follow these steps:

### Prerequisites

Before starting, ensure you have the following installed:

- **Java JDK 21** - Required for Spring Boot backend
- **Maven 3.6+** - For building Java backend (or use included `mvnw`)
- **Node.js 18+** and **npm** - For React frontend
- **Python 3.12** - For FastAPI transcription service (specific version required)
- **FFmpeg** - For audio processing (required by Python service)

**📋 Need help checking versions or installing prerequisites?** See the [Prerequisites Guide](docs/getting-started/PREREQUISITES.md) for detailed instructions.

### Setup Options

#### Option 1: Localhost Development (Default - No Setup Needed)

If all services run on `localhost` with default ports, no environment variable configuration is needed. Simply start each service:

**Start services in separate terminals:**

1. **Terminal 1 - Python Service:**
   ```bash
   cd python-service
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 5001
   ```

2. **Terminal 2 - Backend Service:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

3. **Terminal 3 - Frontend Service:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

**Service URLs (localhost):**
- Frontend: http://localhost:3737
- Backend API: http://localhost:7331
- Python Service: http://localhost:5001

#### Option 2: Remote Development or Custom Ports

If services run on different hosts or custom ports, use the setup script to configure environment variables:

```bash
# Run the interactive setup script
./setup-env.sh

# Each service automatically reads its .env file at startup
# No need to source any files - just restart services after running setup-env.sh

# Then start services as described above
```

**Note:** The setup script checks prerequisites and configures all necessary environment variables. It supports both:
- **Simple mode** (default): Single host configuration
- **Remote deployment mode**: Multiple hosts per service (e.g., domain + IP) for advanced CORS configuration

For detailed setup instructions including remote deployment mode, see the [Quick Start Guide](docs/getting-started/QUICK_START.md).

### Verify Installation

- **Frontend**: http://localhost:3737
- **Backend API**: http://localhost:7331/api/audio/health
- **Python Service**: http://localhost:5001/health
- **Python API Docs**: http://localhost:5001/docs

### Troubleshooting Local Installation

#### Python Service Issues
- **Model download fails**: Check internet connection. Models are downloaded from Hugging Face on first run.
- **Python version error**: Ensure Python 3.12 is installed (specific version required). Check with `python3 --version`. See [Prerequisites Guide](docs/getting-started/PREREQUISITES.md) for installation help.
- **FFmpeg not found**: Install FFmpeg:
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt-get install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
  - See [Prerequisites Guide](docs/getting-started/PREREQUISITES.md) for detailed instructions.

#### Backend Issues
- **Port 7331 already in use**: Change port in `backend/src/main/resources/application.properties`
- **Java version error**: Ensure Java JDK 21 is installed: `java -version`. The `mvnw` wrapper requires Java JDK to run.
- **mvnw not working**: Make sure Java JDK 21 is installed and in your PATH. See [Prerequisites Guide](docs/getting-started/PREREQUISITES.md) for installation help.

#### Frontend Issues
- **Port 3737 already in use**: Change port in `frontend/package.json` scripts section
- **npm install fails**: Try clearing cache: `npm cache clean --force`
- **Node/npm version issues**: Ensure you have the correct Node.js and npm versions. See [Prerequisites Guide](docs/getting-started/PREREQUISITES.md) for version requirements and installation.
- **Frontend calling localhost instead of configured URL**: 
  - Verify `frontend/.env` file exists and contains `REACT_APP_API_URL`
  - **IMPORTANT:** React reads environment variables only at dev server start time
  - **You must restart the dev server** after creating/updating `frontend/.env` file
  - Stop the dev server (Ctrl+C) and run `npm start` again
  - Check browser console for API configuration debug messages

## 📁 Project Structure

```
Whisperrr/
├── frontend/          # React TypeScript Frontend
├── backend/           # Spring Boot API Proxy
├── python-service/    # FastAPI Transcription Service
├── docs/              # Documentation
└── docker-compose.yml # Docker Compose configuration
```

## ⚙️ Configuration

### Environment Variables

For **localhost development** (default ports), no environment variable configuration is needed.

For **remote development or custom ports**, use the setup script:

```bash
./setup-env.sh
# Script automatically creates .env files for each service
# Restart services after running setup-env.sh to apply changes
```

The setup script automatically configures all required environment variables. It supports:
- **Simple mode**: Single host configuration (default)
- **Remote deployment mode**: Multiple hosts per service for advanced scenarios (e.g., Cloudflare tunnel + direct IP access)

For detailed information about environment variables, multi-host configuration, and advanced setup, see the [Quick Start Guide](docs/getting-started/QUICK_START.md) and [Configuration Guide](docs/guides/CONFIGURATION.md).

### Service-Specific Configuration

#### Backend (`backend/src/main/resources/application.properties`)
```properties
server.port=7331
whisperrr.service.url=http://localhost:5001
cors.allowed-origins=http://localhost:3737,http://localhost:3738
spring.servlet.multipart.max-file-size=50MB
```

#### Python Service (`python-service/app/config.py`)
Default configuration (can be overridden via environment variables):
- Model size: `base` (tiny, base, small, medium, large, large-v2, large-v3)
- Max file size: `50MB`
- CORS origins: `http://localhost:7331,http://localhost:3737`
- Log level: `INFO`

#### Frontend (`frontend/src/utils/constants.ts`)
Default configuration (can be overridden via environment variables):
- Max file size: `50MB`
- API URL: `http://localhost:7331/api`

## 🌐 API Documentation

### Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/audio/transcribe` | Upload and transcribe audio file |
| `GET` | `/api/audio/health` | Service health check |

### Python Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/transcribe` | Direct audio transcription |
| `GET` | `/health` | Service health and model status |
| `GET` | `/model/info` | Current model information |

**Interactive API Documentation**: http://localhost:5001/docs

### Example Usage

```bash
# Upload and transcribe audio file
curl -X POST http://localhost:7331/api/audio/transcribe \
  -F "audioFile=@recording.mp3"
```

## 🎯 How to Use

1. **Start the Application**: Run `docker compose up -d`
2. **Open Browser**: Navigate to `http://localhost:3737`
3. **Upload Audio**: Drag and drop or select an audio file
4. **Get Results**: View transcription results immediately

### Faster Whisper Model Options

| Model | Size | Speed | Accuracy | Best For |
|-------|------|-------|----------|----------|
| `tiny` | 39 MB | ~32x realtime | Basic | Quick drafts |
| `base` | 74 MB | ~16x realtime | Good | General use (default) |
| `small` | 244 MB | ~6x realtime | Better | Balanced quality/speed |
| `medium` | 769 MB | ~2x realtime | High | Important content |
| `large` | 1550 MB | ~1x realtime | Highest | Maximum accuracy |
| `large-v2` | 1550 MB | ~1x realtime | Highest | Latest large model |
| `large-v3` | 1550 MB | ~1x realtime | Highest | Latest large model |

**Performance Note**: Faster Whisper is up to 4x faster than OpenAI Whisper with the same accuracy, using less memory. It uses CTranslate2 for optimized inference on both CPU and GPU.

## 🧪 Development

### Running Tests

```bash
# Backend tests
cd backend && ./mvnw test

# Frontend tests
cd frontend && npm test

# Python service tests
cd python-service && python -m pytest
```

### Code Quality

```bash
# Backend formatting
cd backend && ./mvnw spotless:apply

# Frontend linting
cd frontend && npm run lint

# Python formatting
cd python-service && black app/
```

## 🐛 Troubleshooting

### Services Fail to Start
```bash
# Rebuild and start services
docker compose up -d --build

# Check service logs
docker compose logs -f

# Verify services are running
docker compose ps
```

### CORS Errors
- Verify frontend URL is in `cors.allowed-origins` in backend configuration
- Check both services are running on correct ports

### Transcription Timeouts
- Check Python service health: `curl http://localhost:5001/health`
- Verify model is loaded: `curl http://localhost:5001/model/info`
- Check available system resources

### File Upload Failures
- Verify file size is under 50MB
- Check file format is supported (MP3, WAV, M4A, FLAC, OGG, WMA)
- Review backend logs for specific errors

## 📚 Documentation

- **[Prerequisites](docs/getting-started/PREREQUISITES.md)** - Check versions and install required software (Java, Python, Node.js)
- **[Quick Start Guide](docs/getting-started/QUICK_START.md)** - Complete setup guide including local and remote development
- **[Architecture](docs/architecture/OVERVIEW.md)** - Technical architecture guide
- **[Configuration](docs/guides/CONFIGURATION.md)** - Configuration guide
- **[Codebase Guide](docs/development/CODEBASE_GUIDE.md)** - Developer guide
- **[Documentation Index](docs/README.md)** - Complete documentation index
- **[LICENSE](LICENSE)** - MIT License

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **SYSTRAN** for the Faster Whisper implementation
- **OpenAI** for the original Whisper models
- **CTranslate2** for the fast inference engine
- **Spring Boot Team** for the Java framework
- **FastAPI Team** for the Python web framework
- **React Team** for the frontend library

---

**Built with ❤️ for simplicity and instant results**
