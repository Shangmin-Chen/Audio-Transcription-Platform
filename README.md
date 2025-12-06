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

- **Java JDK 21** - Required for Spring Boot backend (the `mvnw` Maven wrapper requires Java JDK to run)
- **Maven 3.6+** - For building Java backend (or use included `mvnw`)
- **Node.js 18+** and **npm** - For React frontend (you may need a specific Node/npm version)
- **Python 3.12** - For FastAPI transcription service (specific version required - see Dockerfile)
- **FFmpeg** - For audio processing (required by Python service)

**📋 Need help checking versions or installing prerequisites?** See the [Prerequisites Guide](docs/getting-started/PREREQUISITES.md) for detailed instructions on checking your current versions and installation steps for each platform.

### Installation Steps

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd Whisperrr
```

#### 2. Start Python Service

The Python service handles audio transcription using Faster Whisper.

```bash
cd python-service

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the service (choose one method)
# Option 1: Using uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 5001

# Option 2: Using python -m (more explicit, doesn't require uvicorn in PATH)
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 5001

# Option 3: Run main.py directly (uses uvicorn.run() in the script)
python3 -m app.main
```

The Python service will be available at `http://localhost:5001`

**Note:** The first startup will download the Whisper model (default: `base`, ~74 MB), which may take a few minutes.

#### 3. Start Backend Service

The Spring Boot backend acts as a proxy and validation layer.

**Note:** The `mvnw` Maven wrapper requires Java JDK 21 to be installed and available in your PATH.

```bash
cd backend

# Build and run (using Maven wrapper)
./mvnw spring-boot:run

# Or if you have Maven installed globally
mvn spring-boot:run
```

The backend API will be available at `http://localhost:7331`

#### 4. Start Frontend Service

The React frontend provides the user interface.

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will be available at `http://localhost:3737` and will automatically open in your browser.

### Running All Services

You'll need to run each service in a separate terminal window:

1. **Terminal 1**: Python service (`cd python-service && uvicorn app.main:app --host 0.0.0.0 --port 5001`)
2. **Terminal 2**: Backend service (`cd backend && ./mvnw spring-boot:run`)
3. **Terminal 3**: Frontend service (`cd frontend && npm start`)

**Important:** Start services in this order:
1. Python service first (it takes longest to start due to model loading)
2. Backend service second
3. Frontend service last

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

#### Backend (`backend/src/main/resources/application.properties`)
```properties
server.port=7331
whisperrr.service.url=http://localhost:5001
cors.allowed-origins=http://localhost:3737,http://localhost:3738
spring.servlet.multipart.max-file-size=50MB
```

#### Python Service (`python-service/app/config.py`)
**Single source of truth:** All defaults are defined in `config.py`. Environment variables can override defaults if needed.

Default configuration:
- Model size: `base` (tiny, base, small, medium, large, large-v2, large-v3)
- Max file size: `50MB`
- CORS origins: `http://localhost:7331,http://localhost:3737`
- Log level: `INFO`

To override defaults, set environment variables:
```bash
export MAX_FILE_SIZE_MB=50
export MODEL_SIZE=small
```

#### Frontend (`frontend/src/utils/constants.ts`)
**Single source of truth:** All defaults are defined in `constants.ts`. Environment variables can override defaults if needed.

Default configuration:
- Max file size: `50MB`
- API URL: `http://localhost:7331/api` (can be overridden via `REACT_APP_API_URL`)

To override defaults, set environment variables at build time:
```bash
export REACT_APP_API_URL=http://localhost:7331/api
export REACT_APP_MAX_FILE_SIZE=50
```

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
- **[Getting Started](docs/getting-started/QUICK_START.md)** - Quick start guide
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
