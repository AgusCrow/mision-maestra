# Misión Maestra - Deployment Guide

This guide explains how to deploy the Misión Maestra application to production environments.

## Architecture

The application consists of two main components:
1. **Backend**: C# ASP.NET Core Web API with SignalR
2. **Frontend**: Next.js 15 with TypeScript and Tailwind CSS

## Prerequisites

Before deploying, ensure you have:
- Docker and Docker Compose installed
- A domain name for your application
- SSL certificates (recommended for production)

## Quick Start with Docker Compose

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd mision-maestra
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Production Environment Variables
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_SIGNALR_URL=https://your-api-domain.com/hub/mision-maestra

# Database Configuration (SQLite)
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
```

### 3. Deploy the Application
```bash
# Make the deployment script executable
chmod +x deploy.sh

# Deploy all services
./deploy.sh deploy
```

### 4. Verify Deployment
Check that all services are running:
```bash
./deploy.sh status
```

Access the application at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Dashboard: http://localhost:3000/admin

## Manual Deployment

### Backend Deployment

1. **Build the Docker Image**:
```bash
cd backend
docker build -t mision-maestra-backend .
```

2. **Run the Backend Container**:
```bash
docker run -d \
  --name mision-maestra-backend \
  -p 5000:5000 \
  -p 5001:5001 \
  -v $(pwd)/data:/app/data \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ASPNETCORE_URLS=http://+:5000 \
  mision-maestra-backend
```

### Frontend Deployment

1. **Build the Docker Image**:
```bash
docker build -t mision-maestra-frontend .
```

2. **Run the Frontend Container**:
```bash
docker run -d \
  --name mision-maestra-frontend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=http://your-backend-domain:5000/api \
  -e NEXT_PUBLIC_SIGNALR_URL=http://your-backend-domain:5000/hub/mision-maestra \
  mision-maestra-frontend
```

## Cloud Deployment Options

### AWS Deployment

#### Using ECS (Elastic Container Service)

1. **Push images to ECR**:
```bash
# Tag and push backend
docker tag mision-maestra-backend:latest your-account.dkr.ecr.your-region.amazonaws.com/mision-maestra-backend:latest
docker push your-account.dkr.ecr.your-region.amazonaws.com/mision-maestra-backend:latest

# Tag and push frontend
docker tag mision-maestra-frontend:latest your-account.dkr.ecr.your-region.amazonaws.com/mision-maestra-frontend:latest
docker push your-account.dkr.ecr.your-region.amazonaws.com/mision-maestra-frontend:latest
```

2. **Update docker-compose.yml** to use ECR images
3. **Deploy using ECS CLI**:
```bash
ecs-cli compose --project-name mision-maestra up
```

#### Using AWS Elastic Beanstalk

1. **Create Dockerrun.aws.json**:
```json
{
  "AWSEBDockerrunVersion": "2",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.your-region.amazonaws.com/mision-maestra-backend:latest",
      "essential": true,
      "memory": 512,
      "portMappings": [
        {
          "containerPort": 5000,
          "hostPort": 5000
        }
      ],
      "environment": [
        {
          "name": "ASPNETCORE_ENVIRONMENT",
          "value": "Production"
        }
      ]
    },
    {
      "name": "frontend",
      "image": "your-account.dkr.ecr.your-region.amazonaws.com/mision-maestra-frontend:latest",
      "essential": true,
      "memory": 512,
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "NEXT_PUBLIC_API_URL",
          "value": "http://backend:5000/api"
        }
      ]
    }
  ]
}
```

### Google Cloud Platform

#### Using Cloud Run

1. **Build and deploy backend**:
```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/mision-maestra-backend
gcloud run deploy --image gcr.io/PROJECT-ID/mision-maestra-backend --platform managed
```

2. **Build and deploy frontend**:
```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/mision-maestra-frontend
gcloud run deploy --image gcr.io/PROJECT-ID/mision-maestra-frontend --platform managed
```

### Azure Deployment

#### Using Azure Container Instances

1. **Create resource group**:
```bash
az group create --name mision-maestra-rg --location eastus
```

2. **Create container group**:
```bash
az container create \
  --resource-group mision-maestra-rg \
  --name mision-maestra \
  --image mision-maestra-frontend \
  --dns-name-label mision-maestra-unique \
  --ports 3000 \
  --environment-variables \
    'NODE_ENV=production' \
    'NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api'
```

## SSL/TLS Configuration

For production, it's highly recommended to use SSL/TLS. Here are some options:

### Using Nginx as Reverse Proxy

1. **Create nginx.conf**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    
    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # SignalR Hub
    location /hub/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Using Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### Health Checks

The application includes built-in health checks:
- Backend: `GET /api/health`
- Frontend: `GET /` (returns 200 if healthy)

### Logging

Logs can be accessed using:
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f backend
```

### Monitoring with Prometheus/Grafana

To set up monitoring:

1. **Add prometheus.yml**:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mision-maestra-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
```

2. **Update docker-compose.yml** to include Prometheus and Grafana services

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SIGNALR_URL=http://localhost:5000/hub/mision-maestra
```

### Staging
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://staging-api.your-domain.com/api
NEXT_PUBLIC_SIGNALR_URL=https://staging-api.your-domain.com/hub/mision-maestra
```

### Production
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
NEXT_PUBLIC_SIGNALR_URL=https://api.your-domain.com/hub/mision-maestra
```

## Troubleshooting

### Common Issues

1. **Connection Issues Between Services**
   - Ensure both services are on the same Docker network
   - Check environment variables for API URLs
   - Verify CORS settings

2. **Database Connection Issues**
   - Check database file permissions
   - Verify connection string format
   - Ensure database directory exists

3. **SignalR Connection Issues**
   - Check SignalR hub URL configuration
   - Verify CORS settings for WebSocket connections
   - Check firewall settings

### Useful Commands

```bash
# View container status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Restart services
docker-compose restart

# Clean up unused resources
docker system prune -a

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
```

## Security Considerations

1. **Change Default Secrets**: Always change default JWT secrets and passwords
2. **Use HTTPS**: Always use SSL/TLS in production
3. **Environment Variables**: Never commit secrets to version control
4. **Rate Limiting**: Configure appropriate rate limits
5. **CORS**: Restrict CORS origins to your domains only
6. **Database Security**: Use proper file permissions for SQLite database

## Support

For deployment issues or questions:
- Check the logs using `docker-compose logs`
- Review the configuration files
- Ensure all prerequisites are met
- Verify environment variables are set correctly