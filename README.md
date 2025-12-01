# Whisperrr - AI-Powered Audio Transcription Platform

A production-ready, full-stack audio transcription platform that leverages Faster Whisper (faster-whisper) to provide high-quality speech-to-text conversion. Built with modern technologies including Spring Boot, FastAPI, and React TypeScript. Faster Whisper is up to 4x faster than OpenAI's Whisper with less memory usage, powered by CTranslate2.

## 🎯 Overview

Whisperrr transforms audio content into accurate, searchable text using state-of-the-art AI technology. Upload a file and get instant transcription results - no database setup, no job queuing, no polling required.

## ✨ Key Features

- **Instant Transcription**: Upload and get results immediately
- **High Accuracy**: Powered by Faster Whisper AI models (tiny to large-v3)
- **Fast Performance**: Up to 4x faster than OpenAI Whisper with less memory usage
- **Multi-Language**: Support for 99+ languages with automatic detection
- **Multiple Formats**: MP3, WAV, M4A, FLAC, OGG, WMA (up to 25MB)
- **Stateless Architecture**: No database required - simplified deployment
- **Modern UI**: Responsive React interface with drag-and-drop upload
- **Production Ready**: Comprehensive error handling and monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│  React Frontend │◄──►│ Spring Boot API  │◄──►│   Python    │
│   (Port 3000)   │    │   (Port 8080)   │    │  Service    │
│                 │    │                 │    │ (Port 8000) │
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
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# Python Service: http://localhost:8000
```

### View Logs

```bash
docker compose logs -f
```

### Stop Services

```bash
docker compose down
```

## 📁 Project Structure

```
Whisperrr/
├── frontend/          # React TypeScript Frontend
├── backend/           # Spring Boot API Proxy
├── python-service/    # FastAPI Transcription Service
└── docker-compose.yml # Docker Compose configuration
```

## ⚙️ Configuration

### Environment Variables

#### Backend (`backend/src/main/resources/application.properties`)
```properties
server.port=8080
whisperrr.service.url=http://localhost:8000
cors.allowed-origins=http://localhost:3000,http://localhost:3001
spring.servlet.multipart.max-file-size=25MB
```

#### Python Service (`python-service/.env`)
```bash
MODEL_SIZE=base                    # tiny, base, small, medium, large, large-v2, large-v3
MAX_FILE_SIZE_MB=25
CORS_ORIGINS=http://localhost:8080,http://localhost:3000
LOG_LEVEL=INFO
```

#### Frontend (`frontend/.env`)
```bash
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_MAX_FILE_SIZE=25
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

**Interactive API Documentation**: http://localhost:8000/docs

### Example Usage

```bash
# Upload and transcribe audio file
curl -X POST http://localhost:8080/api/audio/transcribe \
  -F "audioFile=@recording.mp3"
```

## 🎯 How to Use

1. **Start the Application**: Run `docker compose up -d`
2. **Open Browser**: Navigate to `http://localhost:3000`
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
- Check Python service health: `curl http://localhost:8000/health`
- Verify model is loaded: `curl http://localhost:8000/model/info`
- Check available system resources

### File Upload Failures
- Verify file size is under 25MB
- Check file format is supported (MP3, WAV, M4A, FLAC, OGG, WMA)
- Review backend logs for specific errors

## 📚 Documentation

- **[OVERVIEW.md](OVERVIEW.md)** - Detailed technical architecture guide
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
