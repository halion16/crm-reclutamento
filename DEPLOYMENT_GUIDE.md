# 🚀 CRM Reclutamento - Guida al Deployment in Produzione

## 📋 PREREQUISITI

### Server Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **RAM**: Minimo 4GB, raccomandato 8GB+
- **CPU**: 2+ cores
- **Storage**: 50GB+ disponibili
- **Network**: Porte 80, 443, 3001, 5432 aperte

### Software Requirements
- Node.js 18.x o superiore
- PostgreSQL 14+ o MySQL 8+
- Nginx (reverse proxy)
- PM2 (process manager)
- SSL Certificate (Let's Encrypt)

## 🔧 STEP 1: SETUP SERVER

### 1.1 Installazione Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 1.2 Installazione PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Configurazione database
sudo -u postgres createuser --interactive --pwprompt
sudo -u postgres createdb crm_reclutamento_prod
```

### 1.3 Installazione PM2 e Nginx
```bash
sudo npm install -g pm2
sudo apt install nginx
```

## 🗄️ STEP 2: CONFIGURAZIONE DATABASE

### 2.1 Setup PostgreSQL
```sql
-- Connetti a PostgreSQL come superuser
sudo -u postgres psql

-- Crea utente per l'applicazione
CREATE USER crm_user WITH PASSWORD 'your_secure_password_here';

-- Crea database
CREATE DATABASE crm_reclutamento_prod OWNER crm_user;

-- Assegna permessi
GRANT ALL PRIVILEGES ON DATABASE crm_reclutamento_prod TO crm_user;

-- Exit
\q
```

### 2.2 Configurazione Environment Variables
Crea file `.env.production` nel backend:

```bash
# Database
DATABASE_URL="postgresql://crm_user:your_secure_password_here@localhost:5432/crm_reclutamento_prod"

# Server
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# JWT
JWT_SECRET=your_super_secure_jwt_secret_here_minimum_32_chars

# OpenAI (se utilizzato)
OPENAI_API_KEY=your_openai_api_key_here

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SMS (Skebby)
SKEBBY_USERNAME=your_skebby_username
SKEBBY_PASSWORD=your_skebby_password

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## 🏗️ STEP 3: BUILD E DEPLOY

### 3.1 Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/your-username/crm-reclutamento.git
sudo chown -R $USER:$USER crm-reclutamento
cd crm-reclutamento
```

### 3.2 Backend Setup
```bash
cd backend

# Installa dipendenze
npm ci --only=production

# Genera Prisma Client
npm run db:generate

# Esegui migrations
npm run db:migrate

# Build TypeScript
npm run build

# Test build
node dist/server.js
```

### 3.3 Frontend Setup
```bash
cd ../frontend

# Installa dipendenze
npm ci

# Crea file .env.production
echo "VITE_API_URL=https://your-domain.com/api" > .env.production

# Build per produzione
npm run build

# Test build locale
npm run preview
```

## 🔒 STEP 4: CONFIGURAZIONE NGINX

### 4.1 Configurazione SSL (Let's Encrypt)
```bash
# Installa Certbot
sudo apt install certbot python3-certbot-nginx

# Ottieni certificato SSL
sudo certbot --nginx -d your-domain.com
```

### 4.2 File /etc/nginx/sites-available/crm-reclutamento
```nginx
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://your-domain.com$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss:; font-src 'self'";

    # Frontend (React)
    root /var/www/crm-reclutamento/frontend/dist;
    index index.html;

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API routes (Backend)
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

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4.3 Attiva configurazione
```bash
sudo ln -s /etc/nginx/sites-available/crm-reclutamento /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔄 STEP 5: PROCESS MANAGEMENT (PM2)

### 5.1 File ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'crm-reclutamento-backend',
    script: 'dist/server.js',
    cwd: '/var/www/crm-reclutamento/backend',
    instances: 2,
    exec_mode: 'cluster',
    env_file: '.env.production',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: '/var/log/pm2/crm-backend.log',
    error_file: '/var/log/pm2/crm-backend-error.log',
    out_file: '/var/log/pm2/crm-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 5
  }]
};
```

### 5.2 Start applicazione
```bash
cd /var/www/crm-reclutamento/backend

# Start con PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup

# Monitor
pm2 monitor
```

## 📊 STEP 6: MONITORING E LOGGING

### 6.1 Configurazione Log Rotation
```bash
sudo nano /etc/logrotate.d/crm-reclutamento
```

```
/var/log/pm2/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 6.2 Health Check Script
```bash
#!/bin/bash
# /var/www/crm-reclutamento/healthcheck.sh

API_URL="https://your-domain.com/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): API is healthy"
else
    echo "$(date): API is down (HTTP $RESPONSE)"
    # Restart PM2 process
    pm2 restart crm-reclutamento-backend
fi
```

### 6.3 Cron job per health check
```bash
crontab -e

# Add this line
*/5 * * * * /var/www/crm-reclutamento/healthcheck.sh >> /var/log/crm-healthcheck.log 2>&1
```

## 🔄 STEP 7: CI/CD SETUP (GitHub Actions)

### 7.1 File .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies and build
      run: |
        # Backend
        cd backend
        npm ci
        npm run build
        
        # Frontend
        cd ../frontend
        npm ci
        npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/crm-reclutamento
          git pull origin main
          
          # Backend
          cd backend
          npm ci --only=production
          npm run build
          pm2 restart crm-reclutamento-backend
          
          # Frontend
          cd ../frontend
          npm ci
          npm run build
          
          # Restart Nginx
          sudo systemctl reload nginx
```

## 🔒 STEP 8: SECURITY CHECKLIST

- [ ] SSL Certificate installato e configurato
- [ ] Firewall configurato (UFW)
- [ ] Database con password sicure
- [ ] JWT secrets sicuri
- [ ] Rate limiting attivo
- [ ] CORS configurato correttamente  
- [ ] Security headers in Nginx
- [ ] Log rotation configurato
- [ ] Backup database automatici
- [ ] Monitoring attivo

## 🎯 STEP 9: POST-DEPLOYMENT

### 9.1 Test funzionalità
1. Registrazione/Login utenti
2. Creazione candidati
3. Programmazione colloqui
4. Chat sistema
5. Workflow kanban
6. Notifiche real-time
7. Sistema SMS/Email

### 9.2 Performance monitoring
- Tempo di risposta API < 500ms
- Memoria RAM < 80%
- CPU usage < 70%
- Database connections healthy

### 9.3 Backup strategy
```bash
# Database backup script
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U crm_user crm_reclutamento_prod > backup_$BACKUP_DATE.sql
aws s3 cp backup_$BACKUP_DATE.sql s3://your-backup-bucket/
```

## 📞 SUPPORT

Per supporto post-deployment:
- Log backend: `/var/log/pm2/crm-backend.log`
- Log Nginx: `/var/log/nginx/access.log`  
- PM2 status: `pm2 status`
- Database status: `systemctl status postgresql`

---

🎉 **Complimenti! La tua app CRM Reclutamento è ora in produzione!**