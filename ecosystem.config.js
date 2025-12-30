module.exports = {
  apps: [
    {
      name: 'enterprise-brain-backend',
      script: './backend/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3005,
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_NAME: 'enterprise_brain_local',
        DB_USER: 'root',
        DB_PASSWORD: '123456'
      },
      log_file: './logs/backend.log',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true
    },
    {
      name: 'enterprise-brain-frontend',
      script: './07-frontend/package.json',
      args: 'run dev',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        VITE_API_BASE_URL: 'http://localhost:3005',
        VITE_APP_TITLE: 'Enterprise Brain - 开发版'
      },
      log_file: './logs/frontend.log',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true
    }
  ]
};
