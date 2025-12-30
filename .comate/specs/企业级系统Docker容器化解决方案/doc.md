# 企业级系统Docker容器化解决方案

## 需求场景
用户在Windows 10环境下运行企业级系统时，经常出现页面打不开、服务器内部错误、500错误、404错误、端口不统一等问题，需要一个一劳永逸的解决方案。

## 架构技术方案
采用Docker容器化技术，将整个系统打包为统一的容器环境，包含：
1. 后端Node.js服务容器
2. 前端Vue.js服务容器  
3. MySQL数据库容器
4. Redis缓存容器
5. Nginx反向代理容器
6. Jenkins CI/CD容器

## 影响文件
- 新建文件：`docker-compose.yml`（完整版本）、`Dockerfile`（多个）
- 修改文件：后端配置文件、前端配置文件、环境变量文件
- 影响目录：`docker/`、`backend/`、`07-frontend/`

## 实现细节

### 1. 后端Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3005
CMD ["npm", "start"]
```

### 2. 前端Dockerfile  
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### 3. Nginx反向代理配置
```nginx
events { worker_connections 1024; }
http {
    upstream backend {
        server backend:3005;
    }
    upstream frontend {
        server frontend:80;
    }
    server {
        listen 80;
        location /api/ {
            proxy_pass http://backend;
        }
        location / {
            proxy_pass http://frontend;
        }
    }
}
```

### 4. 完整docker-compose.yml
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: enterprise-mysql
    environment:
      MYSQL_ROOT_PASSWORD: enterprise123456
      MYSQL_DATABASE: enterprise_brain
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d
    restart: unless-stopped
    networks:
      - enterprise-network

  redis:
    image: redis:7-alpine
    container_name: enterprise-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - enterprise-network

  backend:
    build: ./backend
    container_name: enterprise-backend
    ports:
      - "3005:3005"
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: enterprise_brain
      DB_USER: root
      DB_PASSWORD: enterprise123456
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - mysql
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
      - uploads_data:/app/uploads
    restart: unless-stopped
    networks:
      - enterprise-network

  frontend:
    build: ./07-frontend
    container_name: enterprise-frontend
    ports:
      - "3006:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - enterprise-network

  nginx:
    image: nginx:alpine
    container_name: enterprise-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - enterprise-network

  jenkins:
    image: jenkins/jenkins:lts
    container_name: enterprise-jenkins
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins_data:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
    networks:
      - enterprise-network

volumes:
  mysql_data:
  redis_data:
  uploads_data:
  jenkins_data:

networks:
  enterprise-network:
    driver: bridge
```

## 边界条件与异常处理
- 数据库连接失败自动重试机制
- 容器启动顺序依赖管理
- 健康检查和自动重启策略
- 日志统一收集和错误监控
- 数据持久化和备份策略

## 数据流动路径
1. 用户请求 → Nginx(80) → 前端容器 → API请求 → Nginx → 后端容器 → 数据库容器
2. 静态资源通过Nginx直接提供
3. 数据库操作通过容器内网络通信
4. Redis缓存处理会话和临时数据

## 预期成果
- 一键启动整个系统：`docker-compose up -d`
- 统一入口：http://localhost (Nginx反向代理)
- 稳定运行环境，消除端口冲突和依赖问题
- 自动化部署和监控
- 完整的日志和错误追踪系统
- 数据持久化和备份机制
- 开发和生产环境一致性

## Windows 10系统适配方案
- Docker Desktop for Windows安装配置
- WSL2后端优化
- 文件系统性能调优
- 端口映射和网络配置
- 防火墙和安全设置

## 运维监控方案
- Jenkins自动化CI/CD流水线
- 容器健康检查和自动重启
- 统一日志收集和分析
- 性能监控和告警
- 自动备份和恢复机制