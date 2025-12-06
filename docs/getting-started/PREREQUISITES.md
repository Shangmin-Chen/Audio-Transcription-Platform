# Prerequisites

This guide will help you check if you have the correct versions of required software and provide installation instructions if needed.

## Required Software

### Java JDK 21

The Maven wrapper (`mvnw`) requires Java JDK 21 to build and run the Spring Boot backend.

#### Check Your Version

```bash
java -version
```

You should see output indicating Java 21 (e.g., `openjdk version "21.x.x"`).

#### Installation

**macOS (using Homebrew):**
```bash
brew install openjdk@21
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install openjdk-21-jdk
```

**Windows:**
1. Download OpenJDK 21 from [Adoptium](https://adoptium.net/) or [Oracle](https://www.oracle.com/java/technologies/downloads/#java21)
2. Run the installer and follow the setup wizard
3. Add Java to your PATH environment variable

**Verify Installation:**
```bash
java -version
javac -version
```

### Python 3.12

The Python transcription service requires Python 3.12 specifically.

#### Check Your Version

```bash
python3 --version
# or
python --version
```

You should see `Python 3.12.x`.

#### Installation

**macOS (using Homebrew):**
```bash
brew install python@3.12
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.12 python3.12-venv python3.12-pip
```

**Windows:**
1. Download Python 3.12 from [python.org](https://www.python.org/downloads/)
2. Run the installer
3. **Important:** Check "Add Python to PATH" during installation

**Verify Installation:**
```bash
python3 --version
python3 -m pip --version
```

**Note:** If you have multiple Python versions installed, you may need to use `python3.12` explicitly instead of `python3`.

### ⚠️ CRITICAL: Virtual Environment Must Use Python 3.12

**This is the most important step for Python setup!** When creating the virtual environment for the Python service, you **MUST** use Python 3.12 specifically. Using the wrong Python version will cause the service to fail.

#### Creating the Virtual Environment

**Always use Python 3.12 explicitly when creating the venv:**

```bash
# Correct way - explicitly use python3.12
cd python-service
python3.12 -m venv venv

# If python3.12 is not available, check your installation
# On macOS/Linux, you may need to use the full path:
# /usr/local/bin/python3.12 -m venv venv
# or
# /opt/homebrew/bin/python3.12 -m venv venv
```

**❌ WRONG - Do NOT do this:**
```bash
# This may use a different Python version!
python3 -m venv venv  # ❌ Don't use this
python -m venv venv    # ❌ Don't use this
```

#### Verify Your Virtual Environment Uses Python 3.12

After creating the venv, verify it's using the correct version:

```bash
# Activate the virtual environment
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate      # On Windows

# Check the Python version in the venv
python --version
# Should output: Python 3.12.x

# If it shows a different version, delete the venv and recreate it with python3.12
```

#### Why This Matters

- The Python service dependencies are built for Python 3.12
- Using a different Python version (even 3.11 or 3.13) can cause:
  - Package installation failures
  - Runtime errors
  - Incompatibility with required libraries
  - Transcription service failures

**If you see errors about Python version or package compatibility, the first thing to check is whether your venv was created with Python 3.12.**

### Node.js and npm

The React frontend requires Node.js 18 or higher and npm.

#### Check Your Version

```bash
node --version
npm --version
```

You should see Node.js v18.x or higher (e.g., `v18.17.0` or `v20.x.x`).

#### Installation

**macOS (using Homebrew):**
```bash
brew install node@18
# or for the latest LTS version
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Windows:**
1. Download Node.js 18 LTS from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the setup wizard
3. The installer will add Node.js and npm to your PATH

**Using nvm (Node Version Manager) - Recommended:**

If you need to manage multiple Node.js versions:

**macOS/Linux:**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 18
nvm install 18
nvm use 18
```

**Windows:**
Use [nvm-windows](https://github.com/coreybutler/nvm-windows):
```bash
nvm install 18.17.0
nvm use 18.17.0
```

**Verify Installation:**
```bash
node --version
npm --version
```

### FFmpeg (Required for Python Service)

FFmpeg is required for audio processing in the Python transcription service.

#### Check Your Version

```bash
ffmpeg -version
```

#### Installation

**macOS (using Homebrew):**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
1. Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract the archive
3. Add the `bin` folder to your PATH environment variable

**Verify Installation:**
```bash
ffmpeg -version
```

## Quick Verification Checklist

Before starting development, verify all prerequisites:

- [ ] Java JDK 21 installed (`java -version` shows 21.x.x)
- [ ] Python 3.12 installed (`python3 --version` or `python3.12 --version` shows 3.12.x)
- [ ] **⚠️ Virtual environment created with Python 3.12** (`cd python-service && source venv/bin/activate && python --version` shows 3.12.x)
- [ ] Node.js 18+ installed (`node --version` shows v18.x or higher)
- [ ] npm installed (`npm --version` shows version)
- [ ] FFmpeg installed (`ffmpeg -version` shows version)

**Important:** The virtual environment Python version check is critical! If your venv was created with the wrong Python version, the Python service will fail.

## Troubleshooting

### Java Version Issues

- **Wrong Java version:** If you have multiple Java versions, set `JAVA_HOME`:
  ```bash
  export JAVA_HOME=/path/to/java-21
  ```
- **mvnw not working:** Ensure Java 21 is in your PATH and `JAVA_HOME` is set correctly.

### Python Version Issues

- **Wrong Python version:** Use `python3.12` explicitly instead of `python3` if you have multiple versions.
- **pip not found:** Install pip: `python3.12 -m ensurepip --upgrade`
- **⚠️ Virtual environment using wrong Python version:** This is the #1 cause of Python service issues!
  - **Solution:** Delete the existing venv and recreate it with Python 3.12:
    ```bash
    # Remove old venv
    rm -rf python-service/venv  # On macOS/Linux
    # or
    rmdir /s python-service\venv  # On Windows
    
    # Recreate with Python 3.12
    cd python-service
    python3.12 -m venv venv
    source venv/bin/activate  # Activate it
    python --version  # Verify it shows Python 3.12.x
    ```
  - **Check venv Python version:** After activating venv, run `python --version` - it MUST show Python 3.12.x
  - **Common mistake:** Creating venv with `python3` or `python` instead of `python3.12` explicitly

### Node.js Version Issues

- **Wrong Node version:** Use `nvm` to switch between versions if you have multiple installations.
- **npm install fails:** Try clearing npm cache: `npm cache clean --force`

### FFmpeg Issues

- **Command not found:** Ensure FFmpeg is in your PATH environment variable.
- **macOS:** If using Homebrew, ensure `/opt/homebrew/bin` or `/usr/local/bin` is in your PATH.

## Next Steps

Once all prerequisites are installed and verified, proceed to:
- **[Quick Start Guide](QUICK_START.md)** - Get the application running quickly
- **[Local Installation](../README.md#local-installation-without-docker)** - Detailed local setup instructions
