# 企业级Brain系统部署指南

## 📋 部署概述

### 部署架构
企业级Brain采用Docker容器化部署方案，支持多种部署环境：
- **开发环境**：本地开发调试
- **测试环境**：功能测试和集成测试
- **预生产环境**：生产前验证
- **生产环境**：正式业务运行

### 部署方式
1. **本地部署**：单机Docker Compose部署
2. **集群部署**：多机Docker Swarm/Kubernetes部署
3. **云原生部署**：各大云平台容器服务

## 🛠️ 环境要求

### 硬件要求

#### 最低配置
| 组件 | CPU | 内存 | 存储 | 网络 |
|------|-----|------|------|------|
| 应用服务器 | 4核 | 8GB | 50GB SSD | 100Mbps |
| 数据库服务器 | 2核 | 4GB | 20GB SSD | 100Mbps |
| 缓存服务器 | 2核 | 2GB | 10GB SSD | 100Mbps |

#### 推荐配置
| 组件 | CPU | 内存 | 存储 | 网络 |
|------|-----|------|------|------|
| 应用服务器 | 8核 | 16GB | 100GB SSD | 1Gbps |
| 数据库服务器 | 4核 | 8GB | 50GB SSD | 1Gbps |
| 缓存服务器 | 4核 | 4GB | 20GB SSD | 1Gbps |

### 软件要求

#### 操作系统
- **Windows**: Windows 10/11 Pro, Enterprise
- **Linux**: Ubuntu 20.04+, CentOS 8+, RHEL 8+
- **macOS**: macOS 11+

#### 必需软件
- **Docker**: 20.10+ / Docker Desktop 4.0+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **Node.js**: 18+ (仅本地开发需要)

## 🚀 快速部署

### 1. 环境准备

#### Windows环境
```powershell
# 1. 安装Docker Desktop
# 下载并安装 Docker Desktop for Windows
# 启用WSL2支持

# 2. 配置WSL2
wsl --install
wsl --set-default-version 2

# 3. 验证Docker环境
docker --version
docker-compose --version
```

#### Linux环境
```bash
# 1. 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 4. 添加用户到docker组
sudo usermod -aG docker $USER

# 5. 验证环境
docker --version
docker-compose --version
```

#### macOS环境
```bash
# 1. 安装Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装Docker Desktop
brew install --cask docker

# 3. 启动Docker Desktop
# 手动启动Docker Desktop应用

# 4. 验证环境
docker --version
docker-compose --version
```

### 2. 获取项目代码

```bash
# 克隆项目仓库
git clone https://github.com/your-org/enterprise-brain.git
cd enterprise-brain

# 切换到指定分支
git checkout main

# 拉取最新代码
git pull origin main
```

### 3. 配置环境变量

#### 创建环境配置文件
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境配置
nano .env
```

#### 环境变量配置
```env
# ================================
# 基础配置
# ================================
NODE_ENV=production
APP_NAME=Enterprise Brain
APP_VERSION=1.0.0
BUILD_TIME=2023-12-30T18:00:00Z

# ================================
# 网络端口配置
# ================================
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
BACKEND_PORT=3005
FRONTEND_PORT=3006

# ================================
# 数据库配置
# ================================
DB_HOST=mysql
DB_PORT=3306
DB_NAME=enterprise_brain
DB_USER=enterprise_user
DB_PASSWORD=your_secure_password_here
DB_ROOT_PASSWORD=your_root_password_here

# ================================
# Redis配置
# ================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# ================================
# JWT配置
# ================================
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=24h

# ================================
# 文件上传配置
# ================================
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx

# ================================
# 邮件配置
# ================================
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=Enterprise Brain <noreply@example.com>

# ================================
# 监控配置
# ================================
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
ALERT_EMAIL=admin@example.com

# ================================
# 日志配置
# ================================
LOG_LEVEL=info
LOG_MAX_SIZE=100m
LOG_MAX_FILES=3
```

### 4. 一键部署

#### 使用部署脚本
```bash
# Linux/macOS
./start.sh

# Windows
start.bat
```

#### 手动部署
```bash
# 1. 构建镜像
docker-compose build

# 2. 启动服务
docker-compose up -d

# 3. 查看服务状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f
```

## 🔧 详细部署配置

### 1. 数据库部署

#### MySQL配置优化
```yaml
# docker-compose.yml 中的MySQL配置
mysql:
  image: mysql:8.0
  environment:
    MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    MYSQL_DATABASE: ${DB_NAME}
    MYSQL_USER: ${DB_USER}
    MYSQL_PASSWORD: ${DB_PASSWORD}
  volumes:
    - ./data/mysql:/var/lib/mysql
    - ./mysql/conf/my.cnf:/etc/mysql/conf.d/my.cnf
    - ./mysql/init:/docker-entrypoint-initdb.d
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
    timeout: 20s
    retries: 10
```

#### 数据库初始化脚本
```sql
-- mysql/init/01-init-database.sql
-- 创建应用数据库和用户
CREATE DATABASE IF NOT EXISTS enterprise_brain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建应用用户
CREATE USER IF NOT EXISTS 'enterprise_user'@'%' IDENTIFIED BY 'enterprise_pass';
GRANT ALL PRIVILEGES ON enterprise_brain.* TO 'enterprise_user'@'%';
FLUSH PRIVILEGES;

-- 设置时区
SET GLOBAL time_zone = '+8:00';
```

### 2. 应用服务部署

#### 后端服务配置
```yaml
# docker-compose.yml 中的后端配置
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  environment:
    - NODE_ENV=${NODE_ENV}
    - DB_HOST=${DB_HOST}
    - DB_PORT=${DB_PORT}
    - DB_NAME=${DB_NAME}
    - DB_USER=${DB_USER}
    - DB_PASSWORD=${DB_PASSWORD}
    - REDIS_HOST=${REDIS_HOST}
    - REDIS_PORT=${REDIS_PORT}
    - JWT_SECRET=${JWT_SECRET}
  volumes:
    - ./data/uploads:/app/uploads
    - ./logs:/app/logs
  depends_on:
    mysql:
      condition: service_healthy
    redis:
      condition: service_healthy
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3005/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

#### 前端服务配置
```yaml
# docker-compose.yml 中的前端配置
frontend:
  build:
    context: ./07-frontend
    dockerfile: Dockerfile
    args:
      - VITE_API_BASE_URL=http://localhost:3005
      - VITE_APP_TITLE=Enterprise Brain
  volumes:
    - ./data/uploads:/usr/share/nginx/html/uploads
  depends_on:
    - backend
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3006/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### 3. 反向代理配置

#### Nginx配置
```nginx
# nginx/nginx.conf
upstream backend {
    server backend:3005;
}

upstream frontend {
    server frontend:3006;
}

server {
    listen 80;
    server_name localhost;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # API代理
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件服务
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 文件上传
    location /uploads/ {
        alias /usr/share/nginx/html/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔒 安全配置

### 1. 网络安全

#### 防火墙配置
```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3306/tcp
sudo ufw deny 6379/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --remove-port=3306/tcp
sudo firewall-cmd --permanent --remove-port=6379/tcp
sudo firewall-cmd --reload
```

#### SSL证书配置
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL证书配置
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    # 其他配置...
}
```

### 2. 数据库安全

#### 数据库访问控制
```sql
-- 创建只读用户
CREATE USER 'readonly_user'@'%' IDENTIFIED BY 'readonly_password';
GRANT SELECT ON enterprise_brain.* TO 'readonly_user'@'%';

-- 创建备份用户
CREATE USER 'backup_user'@'%' IDENTIFIED BY 'backup_password';
GRANT SELECT, LOCK TABLES, SHOW VIEW ON enterprise_brain.* TO 'backup_user'@'%';

-- 限制root用户访问
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;
```

### 3. 容器安全

#### 容器安全配置
```yaml
# docker-compose.yml 安全配置
version: '3.8'
services:
  backend:
    build: ./backend
    # 非root用户运行
    user: "1000:1000"
    # 只读根文件系统
    read_only: true
    # 临时文件系统
    tmpfs:
      - /tmp
      - /var/tmp
    # 限制能力
    cap_drop:
      - ALL
    # 只允许必要能力
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
    # 资源限制
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## 📊 监控和日志

### 1. 系统监控

#### Prometheus配置
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'mysql'
    static_configs:
      - targets: ['mysql-exporter:9104']
    
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
      
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3005']
```

#### Grafana仪表板
```json
{
  "dashboard": {
    "title": "Enterprise Brain System Overview",
    "panels": [
      {
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total[5m]) * 100"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes / 1024 / 1024"
          }
        ]
      }
    ]
  }
}
```

### 2. 日志管理

#### 日志配置
```yaml
# docker-compose.yml 日志配置
version: '3.8'
services:
  backend:
    build: ./backend
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "3"
        labels: "service=backend,environment=production"
```

#### 日志收集
```bash
# 创建日志目录
mkdir -p logs/{backend,frontend,nginx,mysql,redis}

# 日志轮转配置
cat > /etc/logrotate.d/enterprise-brain << 'EOF'
/path/to/logs/*/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose restart backend frontend nginx
    endscript
}
EOF
```

## 🔄 备份和恢复

### 1. 数据备份

#### 自动备份脚本
```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/enterprise_brain_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
docker-compose exec -T mysql mysqldump \
    -u root \
    -p$DB_ROOT_PASSWORD \
    --single-transaction \
    --routines \
    --triggers \
    enterprise_brain > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 清理旧备份（保留30天）
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "备份完成: $BACKUP_FILE.gz"
```

#### 定时备份任务
```bash
# 添加到crontab
crontab -e

# 每天凌晨2点执行备份
0 2 * * * /path/to/scripts/backup-database.sh
```

### 2. 系统恢复

#### 数据恢复脚本
```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "用法: $0 <备份文件路径>"
    exit 1
fi

# 停止应用服务
docker-compose stop backend frontend

# 恢复数据库
gunzip -c $BACKUP_FILE | docker-compose exec -T mysql mysql \
    -u root \
    -p$DB_ROOT_PASSWORD \
    enterprise_brain

# 重启所有服务
docker-compose up -d

echo "数据恢复完成"
```

## 🚀 生产环境部署

### 1. 负载均衡配置

#### 多实例部署
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: ./backend
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    
  frontend:
    build: ./07-frontend
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
```

#### 负载均衡器配置
```nginx
# nginx/nginx.lb.conf
upstream backend_cluster {
    least_conn;
    server ba