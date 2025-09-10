// 🚀 PM2 Ecosystem Configuration for CRM Reclutamento
module.exports = {
  apps: [{
    name: 'crm-reclutamento-backend',
    script: 'dist/server.js',
    cwd: '/var/www/crm-reclutamento/backend',
    
    // ⚡ Performance & Scaling
    instances: 2, // 2 instances for load balancing
    exec_mode: 'cluster',
    
    // 🔧 Environment
    env_file: '.env.production',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    
    // 📊 Logging
    log_file: '/var/log/pm2/crm-backend.log',
    error_file: '/var/log/pm2/crm-backend-error.log',
    out_file: '/var/log/pm2/crm-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 🔄 Auto-restart & Monitoring
    autorestart: true,
    watch: false, // Don't watch in production
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 5,
    
    // 🚨 Error handling
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // 🎯 Advanced options
    node_args: '--max_old_space_size=1024',
    
    // 📈 Monitoring
    pmx: true,
    automation: false
  }],
  
  // 📋 Deployment configuration (optional)
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/crm-reclutamento.git',
      path: '/var/www/crm-reclutamento',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm ci --only=production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};