#!/bin/bash

# Whisperrr Setup Script
# Main setup script for Whisperrr that checks prerequisites and configures
# environment variables for multi-service communication.
#
# Use this script when:
# - Setting up for the first time (checks prerequisites)
# - Configuring for remote development (different host/IP)
# - Using custom ports instead of defaults
#
# For localhost development with default ports, you can skip this script.

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track prerequisite check results
PREREQ_FAILED=0

# Default values
DEFAULT_HOST="localhost"
DEFAULT_FRONTEND_PORT=3737
DEFAULT_BACKEND_PORT=7331
DEFAULT_PYTHON_PORT=5001

# Function to check Java JDK 21
check_java() {
    echo -n "Checking Java JDK 21... "
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1)
        if echo "$JAVA_VERSION" | grep -q "21\."; then
            echo -e "${GREEN}✓${NC} Found: $JAVA_VERSION"
            return 0
        else
            echo -e "${RED}✗${NC} Wrong version: $JAVA_VERSION (need JDK 21)"
            echo -e "  ${YELLOW}Install: See docs/getting-started/PREREQUISITES.md${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} Not found"
        echo -e "  ${YELLOW}Install: See docs/getting-started/PREREQUISITES.md${NC}"
        return 1
    fi
}

# Function to check Python 3.12
check_python() {
    echo -n "Checking Python 3.12... "
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version 2>&1)
        if echo "$PYTHON_VERSION" | grep -q "Python 3.12"; then
            echo -e "${GREEN}✓${NC} Found: $PYTHON_VERSION"
            return 0
        else
            echo -e "${RED}✗${NC} Wrong version: $PYTHON_VERSION (need 3.12)"
            echo -e "  ${YELLOW}Install: See docs/getting-started/PREREQUISITES.md${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} Not found"
        echo -e "  ${YELLOW}Install: See docs/getting-started/PREREQUISITES.md${NC}"
        return 1
    fi
}

# Function to check Node.js 18+
check_node() {
    echo -n "Checking Node.js 18+... "
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version 2>&1)
        NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')
        if [ "$NODE_MAJOR" -ge 18 ] 2>/dev/null; then
            echo -e "${GREEN}✓${NC} Found: $NODE_VERSION"
            return 0
        else
            echo -e "${RED}✗${NC} Wrong version: $NODE_VERSION (need 18+)"
            echo -e "  ${YELLOW}Install: See docs/getting-started/PREREQUISITES.md${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} Not found"
        echo -e "  ${YELLOW}Install: See docs/getting-started/PREREQUISITES.md${NC}"
        return 1
    fi
}

# Function to check FFmpeg
check_ffmpeg() {
    echo -n "Checking FFmpeg... "
    if command -v ffmpeg &> /dev/null; then
        FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -n 1)
        echo -e "${GREEN}✓${NC} Found: $FFMPEG_VERSION"
        return 0
    else
        echo -e "${RED}✗${NC} Not found"
        echo -e "  ${YELLOW}Install: See docs/getting-started/PREREQUISITES.md${NC}"
        return 1
    fi
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Whisperrr Setup Script                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}Checking Prerequisites...${NC}"
echo ""

if ! check_java; then
    PREREQ_FAILED=1
fi

if ! check_python; then
    PREREQ_FAILED=1
fi

if ! check_node; then
    PREREQ_FAILED=1
fi

if ! check_ffmpeg; then
    PREREQ_FAILED=1
fi

echo ""

if [ $PREREQ_FAILED -eq 1 ]; then
    echo -e "${YELLOW}⚠️  Warning: Some prerequisites are missing or incorrect.${NC}"
    echo -e "${YELLOW}   You can continue with setup, but services may not work properly.${NC}"
    echo -e "${YELLOW}   See docs/getting-started/PREREQUISITES.md for installation help.${NC}"
    echo ""
    read -p "Continue with environment setup anyway? (y/N): " CONTINUE
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    echo ""
fi

echo -e "${BLUE}Environment Configuration${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo ""

# Function to validate IP address format (basic check)
validate_ip() {
    local ip=$1
    if [[ $ip == "localhost" ]] || [[ $ip == "127.0.0.1" ]]; then
        return 0
    fi
    # Basic IP validation (IPv4)
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        IFS='.' read -ra ADDR <<< "$ip"
        for i in "${ADDR[@]}"; do
            if [[ $i -gt 255 ]]; then
                return 1
            fi
        done
        return 0
    fi
    return 1
}

# Function to validate port number
validate_port() {
    local port=$1
    if [[ $port =~ ^[0-9]+$ ]] && [ "$port" -ge 1 ] && [ "$port" -le 65535 ]; then
        return 0
    fi
    return 1
}

# Function to build URL from host and port
build_url() {
    local host=$1
    local port=$2
    # Auto-detect protocol or default to http
    if [[ $host == https://* ]]; then
        echo "$host:$port"
    else
        echo "http://$host:$port"
    fi
}

# Prompt for remote deployment mode
echo -e "${YELLOW}Set up for remote deployment? (y/N)${NC}"
echo -e "  (Yes: Configure multiple hosts per service for CORS)"
echo -e "  (No:  Use simple single-host configuration)"
read -p "Remote deployment [N]: " REMOTE_DEPLOYMENT
REMOTE_DEPLOYMENT=${REMOTE_DEPLOYMENT:-N}

# Initialize arrays for remote deployment mode
FRONTEND_HOSTS=()
FRONTEND_PORTS=()
FRONTEND_URLS=()
BACKEND_HOSTS=()
BACKEND_PORTS=()
BACKEND_URLS=()
PYTHON_HOSTS=()
PYTHON_PORTS=()
PYTHON_URLS=()

if [[ $REMOTE_DEPLOYMENT =~ ^[Yy]$ ]]; then
    # Remote deployment mode - collect multiple hosts per service
    echo ""
    echo -e "${BLUE}Remote Deployment Mode - Multi-Host Configuration${NC}"
    echo ""
    
    # Collect Frontend hosts
    echo -e "${YELLOW}Frontend Service Configuration${NC}"
    while true; do
        echo -e "Enter the frontend host (IP or domain):"
        read -p "Frontend Host: " host
        if [ -z "$host" ]; then
            echo -e "${YELLOW}Host cannot be empty.${NC}"
            continue
        fi
        
        echo -e "Enter the frontend port:"
        read -p "Frontend Port [${DEFAULT_FRONTEND_PORT}]: " port
        port=${port:-$DEFAULT_FRONTEND_PORT}
        
        if ! validate_port "$port"; then
            echo -e "${YELLOW}Warning: Invalid port number. Using default ${DEFAULT_FRONTEND_PORT}${NC}"
            port=$DEFAULT_FRONTEND_PORT
        fi
        
        FRONTEND_HOSTS+=("$host")
        FRONTEND_PORTS+=("$port")
        FRONTEND_URLS+=("$(build_url "$host" "$port")")
        
        echo ""
        read -p "Add more frontend hosts? (y/N): " add_more
        if [[ ! $add_more =~ ^[Yy]$ ]]; then
            break
        fi
    done
    
    # Collect Backend hosts
    echo ""
    echo -e "${YELLOW}Backend Service Configuration${NC}"
    while true; do
        echo -e "Enter the backend host (IP or domain):"
        read -p "Backend Host: " host
        if [ -z "$host" ]; then
            echo -e "${YELLOW}Host cannot be empty.${NC}"
            continue
        fi
        
        echo -e "Enter the backend port:"
        read -p "Backend Port [${DEFAULT_BACKEND_PORT}]: " port
        port=${port:-$DEFAULT_BACKEND_PORT}
        
        if ! validate_port "$port"; then
            echo -e "${YELLOW}Warning: Invalid port number. Using default ${DEFAULT_BACKEND_PORT}${NC}"
            port=$DEFAULT_BACKEND_PORT
        fi
        
        BACKEND_HOSTS+=("$host")
        BACKEND_PORTS+=("$port")
        BACKEND_URLS+=("$(build_url "$host" "$port")")
        
        echo ""
        read -p "Add more backend hosts? (y/N): " add_more
        if [[ ! $add_more =~ ^[Yy]$ ]]; then
            break
        fi
    done
    
    # Collect Python service hosts
    echo ""
    echo -e "${YELLOW}Python Service Configuration${NC}"
    while true; do
        echo -e "Enter the Python service host (IP or domain):"
        read -p "Python Host: " host
        if [ -z "$host" ]; then
            echo -e "${YELLOW}Host cannot be empty.${NC}"
            continue
        fi
        
        echo -e "Enter the Python service port:"
        read -p "Python Port [${DEFAULT_PYTHON_PORT}]: " port
        port=${port:-$DEFAULT_PYTHON_PORT}
        
        if ! validate_port "$port"; then
            echo -e "${YELLOW}Warning: Invalid port number. Using default ${DEFAULT_PYTHON_PORT}${NC}"
            port=$DEFAULT_PYTHON_PORT
        fi
        
        PYTHON_HOSTS+=("$host")
        PYTHON_PORTS+=("$port")
        PYTHON_URLS+=("$(build_url "$host" "$port")")
        
        echo ""
        read -p "Add more Python service hosts? (y/N): " add_more
        if [[ ! $add_more =~ ^[Yy]$ ]]; then
            break
        fi
    done
    
    # Use first entries for single URL variables (for backward compatibility)
    HOST="${FRONTEND_HOSTS[0]}"
    FRONTEND_PORT="${FRONTEND_PORTS[0]}"
    BACKEND_PORT="${BACKEND_PORTS[0]}"
    PYTHON_PORT="${PYTHON_PORTS[0]}"
    FRONTEND_URL="${FRONTEND_URLS[0]}"
    BACKEND_URL="${BACKEND_URLS[0]}"
    PYTHON_URL="${PYTHON_URLS[0]}"
    BACKEND_API_URL="${BACKEND_URL}/api"
    
    # Build comma-separated CORS origins
    IFS=','
    CORS_ALLOWED_ORIGINS="${FRONTEND_URLS[*]}"
    CORS_ORIGINS="${FRONTEND_URLS[*]},${BACKEND_URLS[*]}"
    unset IFS
    
else
    # Simple mode - single host configuration
    echo ""
    echo -e "${YELLOW}Enter the host IP address or hostname:${NC}"
    echo -e "  (Use 'localhost' or '127.0.0.1' for local development)"
    echo -e "  (Use an IP address like '192.168.1.100' for remote deployment)"
    read -p "Host [${DEFAULT_HOST}]: " HOST
    HOST=${HOST:-$DEFAULT_HOST}
    
    # Validate host
    if ! validate_ip "$HOST" && [[ ! $HOST =~ ^[a-zA-Z0-9.-]+$ ]]; then
        echo -e "${YELLOW}Warning: Host format may be invalid. Continuing anyway...${NC}"
    fi
    
    # Prompt for frontend port
    echo ""
    echo -e "${YELLOW}Enter the frontend port:${NC}"
    read -p "Frontend Port [${DEFAULT_FRONTEND_PORT}]: " FRONTEND_PORT
    FRONTEND_PORT=${FRONTEND_PORT:-$DEFAULT_FRONTEND_PORT}
    
    # Validate frontend port
    if ! validate_port "$FRONTEND_PORT"; then
        echo -e "${YELLOW}Warning: Invalid port number. Using default ${DEFAULT_FRONTEND_PORT}${NC}"
        FRONTEND_PORT=$DEFAULT_FRONTEND_PORT
    fi
    
    # Prompt for backend port
    echo ""
    echo -e "${YELLOW}Enter the backend port:${NC}"
    read -p "Backend Port [${DEFAULT_BACKEND_PORT}]: " BACKEND_PORT
    BACKEND_PORT=${BACKEND_PORT:-$DEFAULT_BACKEND_PORT}
    
    # Validate backend port
    if ! validate_port "$BACKEND_PORT"; then
        echo -e "${YELLOW}Warning: Invalid port number. Using default ${DEFAULT_BACKEND_PORT}${NC}"
        BACKEND_PORT=$DEFAULT_BACKEND_PORT
    fi
    
    # Prompt for python service port
    echo ""
    echo -e "${YELLOW}Enter the Python service port:${NC}"
    read -p "Python Service Port [${DEFAULT_PYTHON_PORT}]: " PYTHON_PORT
    PYTHON_PORT=${PYTHON_PORT:-$DEFAULT_PYTHON_PORT}
    
    # Validate python port
    if ! validate_port "$PYTHON_PORT"; then
        echo -e "${YELLOW}Warning: Invalid port number. Using default ${DEFAULT_PYTHON_PORT}${NC}"
        PYTHON_PORT=$DEFAULT_PYTHON_PORT
    fi
    
    # Construct URLs
    FRONTEND_URL="http://${HOST}:${FRONTEND_PORT}"
    BACKEND_URL="http://${HOST}:${BACKEND_PORT}"
    PYTHON_URL="http://${HOST}:${PYTHON_PORT}"
    BACKEND_API_URL="${BACKEND_URL}/api"
    
    # Set CORS origins (comma-separated)
    CORS_ALLOWED_ORIGINS="${FRONTEND_URL}"
    CORS_ORIGINS="${FRONTEND_URL},${BACKEND_URL}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Configuration Summary:${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"

if [[ $REMOTE_DEPLOYMENT =~ ^[Yy]$ ]]; then
    # Display all hosts in remote mode
    echo -e "${BLUE}Frontend Hosts:${NC}"
    for i in "${!FRONTEND_HOSTS[@]}"; do
        echo -e "  ${FRONTEND_HOSTS[$i]}:${FRONTEND_PORTS[$i]} -> ${FRONTEND_URLS[$i]}"
    done
    echo ""
    echo -e "${BLUE}Backend Hosts:${NC}"
    for i in "${!BACKEND_HOSTS[@]}"; do
        echo -e "  ${BACKEND_HOSTS[$i]}:${BACKEND_PORTS[$i]} -> ${BACKEND_URLS[$i]}"
    done
    echo ""
    echo -e "${BLUE}Python Service Hosts:${NC}"
    for i in "${!PYTHON_HOSTS[@]}"; do
        echo -e "  ${PYTHON_HOSTS[$i]}:${PYTHON_PORTS[$i]} -> ${PYTHON_URLS[$i]}"
    done
else
    # Simple mode display
    echo -e "Host:              ${BLUE}${HOST}${NC}"
    echo -e "Frontend Port:     ${BLUE}${FRONTEND_PORT}${NC}"
    echo -e "Backend Port:      ${BLUE}${BACKEND_PORT}${NC}"
    echo -e "Python Port:       ${BLUE}${PYTHON_PORT}${NC}"
fi

echo ""
echo -e "${GREEN}Environment Variables to be exported:${NC}"
echo -e "  REACT_APP_API_URL=${BLUE}${BACKEND_API_URL}${NC}"
echo -e "  WHISPERRR_SERVICE_URL=${BLUE}${PYTHON_URL}${NC}"
echo -e "  CORS_ALLOWED_ORIGINS=${BLUE}${CORS_ALLOWED_ORIGINS}${NC}"
echo -e "  CORS_ORIGINS=${BLUE}${CORS_ORIGINS}${NC}"
echo ""

# Create component-specific .env files
echo -e "${BLUE}Generating component .env files...${NC}"
echo ""

# Frontend .env file
FRONTEND_ENV_FILE="frontend/.env"
cat > "$FRONTEND_ENV_FILE" << EOF
# Whisperrr Frontend Environment Variables
# This file is automatically read by React at build/start time
# Generated by setup-env.sh on $(date)
# To update, run setup-env.sh and restart the frontend
# To reset to defaults, run: ./cleanup-env.sh

REACT_APP_API_URL=${BACKEND_API_URL}
EOF
echo -e "${GREEN}✓ Frontend .env file created at ${FRONTEND_ENV_FILE}${NC}"

# Backend .env file
BACKEND_ENV_FILE="backend/.env"
cat > "$BACKEND_ENV_FILE" << EOF
# Whisperrr Backend Environment Variables
# This file is automatically read by Spring Boot at startup (via spring-dotenv)
# Generated by setup-env.sh on $(date)
# To update, run setup-env.sh and restart the backend
# To reset to defaults, run: ./cleanup-env.sh

CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
WHISPERRR_SERVICE_URL=${PYTHON_URL}
EOF
echo -e "${GREEN}✓ Backend .env file created at ${BACKEND_ENV_FILE}${NC}"

# Python service .env file
PYTHON_ENV_FILE="python-service/.env"
cat > "$PYTHON_ENV_FILE" << EOF
# Whisperrr Python Service Environment Variables
# This file is automatically read by FastAPI/Pydantic Settings at startup
# Generated by setup-env.sh on $(date)
# To update, run setup-env.sh and restart the Python service
# To reset to defaults, run: ./cleanup-env.sh

CORS_ORIGINS=${CORS_ORIGINS}
EOF
echo -e "${GREEN}✓ Python service .env file created at ${PYTHON_ENV_FILE}${NC}"
echo ""

# Generate cleanup script
CLEANUP_SCRIPT="cleanup-env.sh"
echo -e "${BLUE}Generating cleanup script...${NC}"
cat > "$CLEANUP_SCRIPT" << 'CLEANUP_EOF'
#!/bin/bash

# Whisperrr Cleanup Script
# Interactive script to reset services to default localhost configuration
# by removing .env files from each service directory.
#
# This script will:
# - Prompt you for each service (Frontend, Backend, Python Service)
# - Ask if you want to delete its .env file
# - Default answer is "yes" (press Enter to confirm)
# - Only prompt for services that have .env files

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Whisperrr Cleanup Script                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}This script will help you remove .env files to reset services to defaults.${NC}"
echo ""

# Function to cleanup a service's .env file
cleanup_service_env() {
    local service_name=$1
    local env_file=$2
    
    if [ -f "$env_file" ]; then
        echo -e "${YELLOW}Found ${service_name} .env file: ${env_file}${NC}"
        read -p "Delete ${service_name} .env file? [Y/n]: " confirm
        confirm=${confirm:-Y}
        
        if [[ $confirm =~ ^[Yy]$ ]]; then
            rm -f "$env_file"
            if [ ! -f "$env_file" ]; then
                echo -e "${GREEN}✓ Deleted ${service_name} .env file${NC}"
                return 0
            else
                echo -e "${RED}✗ Failed to delete ${service_name} .env file${NC}"
                return 1
            fi
        else
            echo -e "${BLUE}  Skipped ${service_name} .env file${NC}"
            return 0
        fi
    else
        echo -e "${BLUE}  No ${service_name} .env file found (already using defaults)${NC}"
        return 0
    fi
}

# Cleanup each service
echo -e "${BLUE}Checking for .env files...${NC}"
echo ""

cleanup_service_env "Frontend" "frontend/.env"
echo ""

cleanup_service_env "Backend" "backend/.env"
echo ""

cleanup_service_env "Python Service" "python-service/.env"
echo ""

echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Cleanup Complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  • Restart services to use default configuration"
echo "  • To reconfigure, run: ./setup-env.sh"
echo ""
CLEANUP_EOF

chmod +x "$CLEANUP_SCRIPT"
echo -e "${GREEN}✓ Cleanup script created at ${CLEANUP_SCRIPT}${NC}"
echo ""

echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Start the Python service: cd python-service && uvicorn app.main:app --host 0.0.0.0 --port ${PYTHON_PORT}"
echo "  2. Start the Backend service: cd backend && ./mvnw spring-boot:run"
echo "  3. Start the Frontend service: cd frontend && npm start"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo "  • Each service automatically reads its .env file at startup"
echo "  • No need to source any files - services load .env files automatically"
echo "  • Restart services after running setup-env.sh to apply changes"
echo "  • To reset to defaults, run: ./cleanup-env.sh"
echo ""
