#!/bin/bash

# Misión Maestra Deployment Script
# This script helps deploy the application to production

set -e

echo "🚀 Starting Misión Maestra deployment..."

# Configuration
PROJECT_NAME="mision-maestra"
REGISTRY="${REGISTRY:-docker.io}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml not found. Please run this script from the project root."
        exit 1
    fi
    
    log_info "Prerequisites check passed."
}

# Build and deploy services
deploy_services() {
    log_info "Building and deploying services..."
    
    # Stop existing services
    log_info "Stopping existing services..."
    docker-compose down
    
    # Build new images
    log_info "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    log_info "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if docker-compose ps | grep -q "unhealthy"; then
        log_warn "Some services are unhealthy. Checking logs..."
        docker-compose logs backend
        docker-compose logs frontend
        return 1
    fi
    
    log_info "All services are healthy."
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # For SQLite, we don't need separate migrations as Entity Framework will create the database
    # But we can check if the database is accessible
    docker-compose exec backend dotnet ef database update
    
    log_info "Database migrations completed."
}

# Set up environment variables
setup_environment() {
    log_info "Setting up environment variables..."
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        log_info "Creating .env file..."
        cat > .env << EOF
# Production Environment Variables
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_SIGNALR_URL=https://your-api-domain.com/hub/mision-maestra

# Database Configuration (for SQLite)
DATABASE_URL=file:./data/misionmaestra.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ISSUER=MisionMaestra
JWT_AUDIENCE=MisionMaestraApp

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60
EOF
        log_warn "Please update the .env file with your actual domain names and secrets."
    fi
}

# Main deployment function
main() {
    log_info "🚀 Starting Misión Maestra deployment..."
    
    check_prerequisites
    setup_environment
    deploy_services
    run_migrations
    
    log_info "✅ Deployment completed successfully!"
    log_info "🌐 Frontend: http://localhost:3000"
    log_info "🔧 Backend API: http://localhost:5000"
    log_info "📊 Admin Dashboard: http://localhost:3000/admin"
    
    # Show running containers
    log_info "📦 Running containers:"
    docker-compose ps
}

# Handle script arguments
case "${1:-}" in
    "deploy")
        main
        ;;
    "stop")
        log_info "Stopping services..."
        docker-compose down
        ;;
    "restart")
        log_info "Restarting services..."
        docker-compose restart
        ;;
    "logs")
        docker-compose logs -f "${2:-}"
        ;;
    "status")
        docker-compose ps
        ;;
    *)
        echo "Usage: $0 {deploy|stop|restart|logs|status}"
        echo "  deploy  - Deploy the application"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  logs    - Show logs (optionally specify service name)"
        echo "  status  - Show status of all services"
        exit 1
        ;;
esac