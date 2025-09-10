# Deployment Guide - CRM Reclutamento

Guida completa per il deployment del sistema CRM in produzione.

## 🚀 Deployment Options

### Option 1: Docker Compose (Raccomandato)
Deployment completo con database PostgreSQL incluso.

### Option 2: Cloud Services  
Deployment su servizi cloud con database managed.

### Option 3: Server Dedicato
Installazione su server Windows/Linux dedicato.

---

## 🐳 Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM disponibili
- 10GB spazio disco

### Quick Start
```bash
# Clone del progetto
git clone <your-repository-url>
cd crm-reclutamento

# Configurazione environment
cp backend/.env.example backend/.env
# Modifica il file .env con le tue configurazioni

# Avvio completo
docker-compose up -d

# Verifica stato servizi  
docker-compose ps
```

### Services Mapping
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`  
- **Database**: `localhost:5432`
- **Prisma Studio**: `http://localhost:5555` (optional)

---

## ☁️ Cloud Deployment

### AWS Deployment

#### 1. Database (RDS PostgreSQL)
```bash
# Crea RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier crm-reclutamento-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username crmuser \
  --master-user-password YourSecurePassword123 \
  --allocated-storage 20
```

#### 2. Backend (Elastic Beanstalk)
```bash
# Deploy backend API
cd backend
eb init crm-backend --platform node.js
eb create crm-production
eb deploy
```

#### 3. Frontend (S3 + CloudFront)
```bash
# Build e deploy frontend
cd frontend
npm run build
aws s3 sync dist/ s3://crm-frontend-bucket --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Azure Deployment

#### 1. Database (Azure PostgreSQL)
```bash
az postgres server create \
  --resource-group crm-resources \
  --name crm-db-server \
  --location westeurope \
  --admin-user crmadmin \
  --admin-password YourSecurePassword123 \
  --sku-name B_Gen5_1
```

#### 2. Backend (App Service)
```bash
# Deploy backend
cd backend
az webapp up --name crm-backend-api --resource-group crm-resources
```

#### 3. Frontend (Static Web Apps)
```bash
# Deploy frontend
cd frontend
az staticwebapp create \
  --name crm-frontend \
  --resource-group crm-resources \
  --source . \
  --location westeurope
```

---

## 🖥️ Server Deployment

### Linux Server (Ubuntu 22.04)

#### 1. System Prerequisites
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx as reverse proxy
sudo apt install nginx
```

#### 2. Database Setup
```bash
# Configure PostgreSQL
sudo -u postgres createuser --interactive crmuser
sudo -u postgres createdb crm_reclutamento
sudo -u postgres psql -c "ALTER USER crmuser PASSWORD 'YourSecurePassword123';"

# Import schema
sudo -u postgres psql -d crm_reclutamento -f database/schema.sql
```

#### 3. Backend Deployment
```bash
# Clone and setup backend
cd /opt
sudo git clone <your-repository-url> crm-reclutamento
cd crm-reclutamento/backend

# Install dependencies
sudo npm ci --production

# Configure environment
sudo cp .env.example .env
sudo nano .env  # Edit with production values

# Build application  
sudo npm run build

# Start with PM2
sudo pm2 start dist/server.js --name crm-backend
sudo pm2 startup
sudo pm2 save
```

#### 4. Frontend Deployment
```bash
# Build frontend
cd ../frontend
sudo npm ci
sudo npm run build

# Deploy to Nginx
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
```

#### 5. Nginx Configuration
```nginx
# /etc/nginx/sites-available/crm
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Windows Server

#### 1. Prerequisites
```powershell
# Install Node.js 18
winget install OpenJS.NodeJS

# Install PostgreSQL
winget install PostgreSQL.PostgreSQL

# Install PM2
npm install -g pm2
npm install -g pm2-windows-service
pm2-service-install
```

#### 2. Application Setup
```powershell
# Clone repository
git clone <your-repository-url> C:\inetpub\crm-reclutamento
cd C:\inetpub\crm-reclutamento\backend

# Install and build
npm ci --production
Copy-Item .env.example .env
# Edit .env file with production values
npm run build

# Start with PM2
pm2 start dist/server.js --name crm-backend
pm2 startup
pm2 save
```

#### 3. IIS Configuration (Frontend)
1. Install IIS with ASP.NET Core Hosting Bundle
2. Create new site pointing to `frontend/dist`
3. Configure URL Rewrite for SPA routing
4. Setup reverse proxy for `/api` to `http://localhost:3001`

---

## 🔧 Production Configuration

### Environment Variables (.env)
```env
# Production Database
DATABASE_URL="postgresql://crmuser:password@prod-db-host:5432/crm_reclutamento"

# Server
NODE_ENV=production
PORT=3001

# Security
JWT_SECRET="your-super-secure-32-char-secret-key"
JWT_EXPIRES_IN="24h"

# Email (Production SMTP)
SMTP_HOST="smtp.yourdomain.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="your-smtp-password"
EMAIL_FROM="CRM Reclutamento <noreply@yourdomain.com>"

# Google Meet (Production)
GOOGLE_CLIENT_ID="your-production-google-client-id"
GOOGLE_CLIENT_SECRET="your-production-google-secret"
GOOGLE_REDIRECT_URI="https://yourdomain.com/auth/google/callback"

# Windows Phone Integration
WINDOWS_PHONE_API_ENDPOINT="https://your-windows-phone-api.com"
WINDOWS_PHONE_API_KEY="your-production-api-key"

# CORS
CORS_ORIGIN="https://yourdomain.com"

# Security Headers
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
```

### Database Optimization
```sql
-- Production database tuning
-- Add to postgresql.conf

shared_buffers = 256MB
effective_cache_size = 1GB  
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_segments = 8
wal_buffers = 1MB
random_page_cost = 1.1

-- Additional indexes for performance
CREATE INDEX CONCURRENTLY idx_candidates_email_lower ON candidates(lower(email));
CREATE INDEX CONCURRENTLY idx_interviews_scheduled_date ON interviews(scheduled_date) WHERE status = 'SCHEDULED';
CREATE INDEX CONCURRENTLY idx_communications_created_at ON communications(created_at DESC);
```

---

## 📊 Monitoring & Logging

### Application Monitoring
```javascript
// Add to backend/src/middleware/monitoring.ts
import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
};
```

### Health Checks
```bash
# Add health check endpoints
curl https://yourdomain.com/api/health
curl https://yourdomain.com/api/health/db
curl https://yourdomain.com/api/health/services
```

### Log Rotation (Linux)
```bash
# /etc/logrotate.d/crm
/var/log/crm/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
```

---

## 🔒 Security Checklist

### ✅ SSL/TLS Configuration
- [ ] SSL certificate installed (Let's Encrypt or commercial)
- [ ] HTTP → HTTPS redirect configured  
- [ ] HSTS headers enabled
- [ ] SSL rating A+ on SSL Labs

### ✅ Application Security
- [ ] Environment variables secured
- [ ] Database credentials encrypted
- [ ] JWT secrets rotated
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

### ✅ Infrastructure Security  
- [ ] Firewall configured (only 80, 443, SSH open)
- [ ] Database not exposed to internet
- [ ] Regular security updates scheduled
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured

---

## 💾 Backup Strategy

### Database Backup
```bash
# Daily automated backup
#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
pg_dump -h localhost -U crmuser -d crm_reclutamento | gzip > /backups/crm_backup_$DATE.sql.gz

# Keep only last 30 days
find /backups -name "crm_backup_*.sql.gz" -mtime +30 -delete
```

### Application Backup
```bash
# Code and configuration backup
tar -czf /backups/crm_app_$(date +%Y%m%d).tar.gz \
  /opt/crm-reclutamento \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git
```

---

## 📈 Performance Optimization

### Backend Optimization
- Enable gzip compression
- Use connection pooling for database
- Implement Redis caching for sessions
- Add CDN for static assets
- Configure proper indexes

### Frontend Optimization  
- Code splitting for routes
- Image optimization and lazy loading
- Service Worker for caching
- Bundle analysis and tree shaking
- Progressive Web App features

---

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U crmuser -d crm_reclutamento -c "SELECT 1;"

# Check logs
sudo journalctl -u postgresql
```

#### Frontend Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Email Not Sending
```bash
# Test SMTP connection
telnet smtp.yourdomain.com 587

# Check email service logs
pm2 logs crm-backend | grep -i email
```

---

## 📞 Support

Per supporto deployment contattare:
- **Email**: support@yourdomain.com
- **Documentation**: https://docs.yourdomain.com/crm
- **Issues**: https://github.com/yourorg/crm-reclutamento/issues

**Happy Deployment! 🚀**