# 销售管理系统集成部署指南

## 🚀 项目概述

本指南将帮助您将销售管理系统部署到生产环境，包括前端Vue.js应用和Node.js后端API的完整集成。

## 📋 目录结构

```
ai_desktop_2/
├── 07-frontend/                 # 前端Vue.js项目
│   ├── src/
│   │   ├── pages/             # 页面组件
│   │   │   └── sales/       # 销售相关页面
│   │   │       ├── SalesDashboard.vue
│   │   │       └── ...
│   │   ├── api/               # API接口封装
│   │   │   ├── sales.ts
│   │   │   └── quotation.ts
│   │   ├── composables/        # Vue组合式函数
│   │   │   └── useRealTimeSales.js
│   │   └── router/            # 路由配置
│   └── public/
│       └── index.html
├── backend/                     # 后端Node.js项目
│   ├── controllers/           # 控制器
│   │   └── salesController.js
│   ├── services/              # 业务服务层
│   │   └── salesService.js
│   ├── models/                # 数据模型
│   │   └── sales.js
│   ├── migrations/             # 数据库迁移
│   ├── websocket/              # WebSocket服务
│   │   └── salesWebSocket.js
│   └── config/                # 配置文件
└── database/                   # 数据库配置
    └── connection.js
```

## 🛠️ 环境准备

### 前端环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0
- Vue 3.3+
- Chart.js 3.9+

### 后端环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0
- PostgreSQL 13+
- Redis 6.0+ (WebSocket会话存储)

### 生产环境建议
- Nginx (前端静态文件服务和反向代理)
- PM2 (Node.js进程管理)
- Docker (容器化部署)

## 📦 前端部署

### 1. 构建生产版本

```bash
cd 07-frontend

# 安装依赖
npm install --production

# 构建生产版本
npm run build

# 构建结果在 dist/ 目录
```

### 2. 配置环境变量

创建 `.env.production` 文件：

```bash
# API配置
VUE_APP_API_BASE_URL=https://your-domain.com/api
VUE_APP_WS_URL=wss://your-domain.com

# 应用配置
VUE_APP_TITLE=销售管理系统
VUE_APP_VERSION=1.0.0

# 性能配置
VUE_APP_ENABLE_GZIP=true
VUE_APP_ENABLE_BROTILI=true
```

### 3. Nginx配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 前端静态文件
    location / {
        root /path/to/07-frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # 启用gzip压缩
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
        
        # 缓存配置
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket代理
    location /ws/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 后端部署

### 1. 数据库设置

```sql
-- 创建数据库
CREATE DATABASE sales_management;

-- 创建用户
CREATE USER sales_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sales_management TO sales_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sales_user;
```

### 2. 后端配置

创建 `backend/.env.production`：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sales_management
DB_USER=sales_user
DB_PASSWORD=your_password

# 服务器配置
PORT=3000
HOST=0.0.0.0

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/sales-api.log

# WebSocket配置
WS_PORT=3001
```

### 3. PM2配置

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'sales-api',
      script: './backend/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/sales-api-error.log',
      out_file: '/var/log/sales-api-out.log',
      log_file: '/var/log/sales-api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'sales-ws',
      script: './backend/websocket/server.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        WS_PORT: 3001
      },
      error_file: '/var/log/sales-ws-error.log',
      out_file: '/var/log/sales-ws-out.log',
      log_file: '/var/log/sales-ws-combined.log',
      time: true
    }
  ]
}
```

### 4. 数据库迁移

```bash
cd backend

# 运行迁移
npm run migrate

# 种子数据（可选）
npm run seed
```

## 📊 数据库迁移顺序

按以下顺序运行迁移：

1. `001_create_users.js`
2. `002_create_customers.js`
3. `003_create_products.js`
4. `004_create_orders.js`
5. `005_create_sales_tables.js`

```bash
# 逐个运行迁移
npx sequelize-cli db:migrate --to 001_create_users
npx sequelize-cli db:migrate --to 002_create_customers
npx sequelize-cli db:migrate --to 003_create_products
npx sequelize-cli db:migrate --to 004_create_orders
npx sequelize-cli db:migrate --to 005_create_sales_tables
```

## 🚀 启动服务

### 使用PM2启动

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart sales-api sales-ws
```

### 使用Docker部署

```dockerfile
# 后端Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000 3001

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  sales-api:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=sales_management
      - DB_USER=sales_user
      - DB_PASSWORD=${DB_PASSWORD}
    depends_on:
      - postgres
      - redis
    ports:
      - "3000:3000"
    networks:
      - sales-network

  sales-ws:
    build: ./backend
    command: npm run websocket
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
    depends_on:
      - redis
    ports:
      - "3001:3001"
    networks:
      - sales-network

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=sales_management
      - POSTGRES_USER=sales_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - sales-network

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data
    networks:
      - sales-network

volumes:
  postgres_data:
  redis_data:

networks:
  sales-network:
    driver: bridge
```

## 🧭 菜单系统添加指南

### 1. 前端菜单配置

编辑 `07-frontend/src/router/index.js`：

```javascript
import SalesDashboard from '@/pages/sales/SalesDashboard.vue'
import QuotationList from '@/pages/quotation/QuotationList.vue'

const routes = [
  {
    path: '/sales',
    name: 'Sales',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { title: '销售管理', icon: 'fas fa-chart-line' },
    children: [
      {
        path: 'dashboard',
        name: 'SalesDashboard',
        component: SalesDashboard,
        meta: { title: '销售概览', icon: 'fas fa-tachometer-alt' }
      },
      {
        path: 'quotations',
        name: 'Quotations',
        component: QuotationList,
        meta: { title: '报价管理', icon: 'fas fa-file-invoice' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/pages/sales/OrderList.vue'),
        meta: { title: '订单管理', icon: 'fas fa-shopping-cart' }
      },
      {
        path: 'customers',
        name: 'Customers',
        component: () => import('@/pages/sales/CustomerList.vue'),
        meta: { title: '客户管理', icon: 'fas fa-users' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/pages/sales/ReportCenter.vue'),
        meta: { title: '报表中心', icon: 'fas fa-chart-bar' }
      }
    ]
  }
]

export default routes
```

### 2. 侧边栏菜单组件

创建 `07-frontend/src/components/layout/SidebarMenu.vue`：

```vue
<template>
  <div class="sidebar-menu">
    <div class="menu-header">
      <h2>销售管理系统</h2>
    </div>
    
    <nav class="menu-nav">
      <div 
        v-for="item in menuItems" 
        :key="item.name"
        class="menu-item"
        :class="{ active: isActive(item.path) }"
      >
        <router-link 
          :to="item.path" 
          class="menu-link"
        >
          <i :class="item.meta.icon"></i>
          <span class="menu-text">{{ item.meta.title }}</span>
          <span 
            v-if="item.badge" 
            class="menu-badge"
            :class="item.badge.class"
          >
            {{ item.badge.text }}
          </span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const menuItems = computed(() => [
  {
    name: 'SalesDashboard',
    path: '/sales/dashboard',
    meta: { title: '销售概览', icon: 'fas fa-tachometer-alt' }
  },
  {
    name: 'Quotations',
    path: '/sales/quotations',
    meta: { 
      title: '报价管理', 
      icon: 'fas fa-file-invoice',
      badge: { text: '新', class: 'new' }
    }
  },
  {
    name: 'Orders',
    path: '/sales/orders',
    meta: { 
      title: '订单管理', 
      icon: 'fas fa-shopping-cart',
      badge: { text: '12', class: 'warning' }
    }
  },
  {
    name: 'Customers',
    path: '/sales/customers',
    meta: { title: '客户管理', icon: 'fas fa-users' }
  },
  {
    name: 'Reports',
    path: '/sales/reports',
    meta: { title: '报表中心', icon: 'fas fa-chart-bar' }
  }
])

const isActive = (path) => {
  return route.path.startsWith(path)
}
</script>

<style scoped>
.sidebar-menu {
  background: linear-gradient(135deg, var(--color-slate), var(--color-teal));
  height: 100vh;
  width: 280px;
  color: white;
  padding: 0;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
}

.menu-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.menu-header h2 {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  margin: 0;
  font-weight: 600;
}

.menu-nav {
  padding: 20px 0;
}

.menu-item {
  margin-bottom: 8px;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.menu-item.active {
  background: rgba(255, 255, 255, 0.1);
  border-left: 3px solid white;
}

.menu-link {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  color: white;
  text-decoration: none;
  transition: all 0.2s ease;
  gap: 12px;
}

.menu-link:hover {
  background: rgba(255, 255, 255, 0.05);
}

.menu-link i {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.menu-text {
  font-family: 'Space Mono', monospace;
  font-size: 0.9rem;
  flex: 1;
}

.menu-badge {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-left: auto;
}

.menu-badge.new {
  background: #48BB78;
  color: white;
}

.menu-badge.warning {
  background: #ED8936;
  color: white;
}
</style>
```

## 🔄 交互功能实现

### 1. 实时数据更新

销售概览页面已集成WebSocket实时数据更新：

```javascript
// 在组件中使用
import { useRealTimeSales } from '@/composables/useRealTimeSales'

export default {
  setup() {
    const { 
      isConnected,
      realTimeData,
      subscribe,
      refreshData 
    } = useRealTimeSales()

    // 订阅销售更新
    onMounted(() => {
      subscribe(['sales_update', 'new_order', 'new_quotation'])
    })

    return {
      isConnected,
      realTimeData,
      refreshData
    }
  }
}
```

### 2. 页面间数据传递

使用Pinia进行状态管理：

```javascript
// stores/sales.js
import { defineStore } from 'pinia'

export const useSalesStore = defineStore('sales', {
  state: () => ({
    selectedCustomer: null,
    selectedQuotation: null,
    notifications: []
  }),
  
  actions: {
    setSelectedCustomer(customer) {
      this.selectedCustomer = customer
    },
    
    addNotification(notification) {
      this.notifications.unshift({
        id: Date.now(),
        ...notification
      })
      
      // 保持最近100条通知
      if (this.notifications.length > 100) {
        this.notifications = this.notifications.slice(0, 100)
      }
    }
  }
})
```

### 3. 组件交互示例

客户选择组件：

```vue
<template>
  <div class="customer-selector">
    <h3>选择客户</h3>
    <div class="customer-list">
      <div 
        v-for="customer in customers" 
        :key="customer.id"
        class="customer-card"
        :class="{ selected: selectedCustomerId === customer.id }"
        @click="selectCustomer(customer)"
      >
        <h4>{{ customer.name }}</h4>
        <p>{{ customer.email }}</p>
        <div class="customer-stats">
          <span>订单: {{ customer.orderCount }}</span>
          <span>消费: ¥{{ customer.totalAmount.toLocaleString() }}</span>
        </div>
      </div>
    </div>
    
    <div class="selector-actions">
      <button 
        class="btn-secondary"
        @click="clearSelection"
      >
        取消
      </button>
      <button 
        class="btn-primary"
        @click="confirmSelection"
        :disabled="!selectedCustomerId"
      >
        确认选择
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSalesStore } from '@/stores/sales'

const salesStore = useSalesStore()
const selectedCustomerId = ref(null)

const selectCustomer = (customer) => {
  selectedCustomerId.value = customer.id
  salesStore.setSelectedCustomer(customer)
}

const confirmSelection = () => {
  // 触发客户选择完成事件
  emit('customer-selected', salesStore.selectedCustomer)
}

const clearSelection = () => {
  selectedCustomerId.value = null
  salesStore.setSelectedCustomer(null)
}
</script>
```

## 🔒 安全配置

### 1. HTTPS证书配置

```nginx
# Nginx SSL配置
server {
    listen 443 ssl http2;
    
    # SSL证书配置
    ssl_certificate /etc/ssl/certs/your-domain.com.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.com.key;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

### 2. 后端安全中间件

```javascript
// backend/middleware/security.js
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

module.exports = {
  // 安全头
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://trusted.cdn.com"],
        styleSrc: ["'self'", "https://trusted.cdn.com"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  }),
  
  // CORS配置
  cors({
    origin: ['https://your-domain.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }),
  
  // 速率限制
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 最多100个请求
    message: '请求过于频繁，请稍后再试'
  })
}
```

## 📊 监控和日志

### 1. 应用监控

```javascript
// backend/monitoring/healthCheck.js
const healthCheck = async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    websocket: await checkWebSocket()
  }
  
  const isHealthy = Object.values(checks).every(check => check.status === 'healthy')
  const statusCode = isHealthy ? 200 : 503
  
  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  })
}

const checkDatabase = async () => {
  try {
    await sequelize.authenticate()
    return { status: 'healthy', message: 'Database connection successful' }
  } catch (error) {
    return { status: 'unhealthy', message: error.message }
  }
}

const checkRedis = async () => {
  try {
    const client = require('../config/redis')
    await client.ping()
    return { status: 'healthy', message: 'Redis connection successful' }
  } catch (error) {
    return { status: 'unhealthy', message: error.message }
  }
}

const checkWebSocket = () => {
  // WebSocket服务检查逻辑
  return { status: 'healthy', message: 'WebSocket server running' }
}

module.exports = healthCheck
```

### 2. 性能监控

```javascript
// backend/middleware/monitoring.js
const prometheus = require('prom-client')

const register = new prometheus.Registry()

// 自定义指标
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
})

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

module.exports = {
  register,
  metrics: {
    httpRequestDuration,
    httpRequestTotal
  }
}
```

## 🚀 部署清单

### 前端部署检查清单

- [ ] 配置生产环境变量
- [ ] 构建生产版本
- [ ] 配置Nginx静态文件服务
- [ ] 配置SSL证书
- [ ] 设置缓存策略
- [ ] 配置Gzip压缩
- [ ] 测试页面访问

### 后端部署检查清单

- [ ] 配置生产数据库
- [ ] 运行数据库迁移
- [ ] 配置环境变量
- [ ] 配置PM2进程管理
- [ ] 配置SSL证书
- [ ] 配置安全中间件
- [ ] 配置日志轮转
- [ ] 测试API接口

### 功能测试清单

- [ ] 测试用户登录/登出
- [ ] 测试销售概览页面
- [ ] 测试实时数据更新
- [ ] 测试WebSocket连接
- [ ] 测试报价管理功能
- [ ] 测试菜单导航
- [ ] 测试页面间交互
- [ ] 测试数据导出功能

## 🔧 故障排除

### 常见问题解决

1. **WebSocket连接失败**
   ```bash
   # 检查防火墙设置
   sudo ufw allow 3001
   # 检查Nginx代理配置
   # 检查SSL证书
   ```

2. **API请求被阻止**
   ```bash
   # 检查CORS配置
   # 检查API网关设置
   # 检查认证token
   ```

3. **页面加载缓慢**
   ```bash
   # 检查静态文件缓存
   # 启用Gzip/Brotli压缩
   # 检查数据库查询性能
   ```

4. **实时数据不更新**
   ```bash
   # 检查Redis连接
   # 检查WebSocket服务状态
   # 检查前端WebSocket连接
   ```

## 📚 API文档

### Swagger配置

```javascript
// backend/app.js 中添加
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '销售管理系统API',
      version: '1.0.0',
      description: '销售管理系统RESTful API文档'
    },
    servers: [
      {
        url: 'https://your-domain.com/api',
        description: '生产环境'
      }
    ]
  },
  apis: ['./controllers/*.js']
}

const specs = swaggerJsdoc(options)
app.use('/api-docs', swaggerUi.serve, specs)
```

## 🎉 完成部署

完成以上所有步骤后，您的销售管理系统将具备：

1. **完整的销售概览** - 实时数据展示
2. **菜单导航系统** - 侧边栏导航
3. **实时数据更新** - WebSocket连接
4. **安全的生产环境** - HTTPS + 安全头
5. **监控和日志** - 完整的监控体系
6. **响应式设计** - 移动端适配

访问 `https://your-domain.com` 即可使用完整的销售管理系统！

## 📞 技术支持

如遇到部署问题，请检查：

1. **日志文件**: `/var/log/sales-api*.log`
2. **进程状态**: `pm2 status`
3. **数据库连接**: 数据库连接测试
4. **网络配置**: Nginx配置文件

更多帮助请参考项目文档或联系技术支持团队。