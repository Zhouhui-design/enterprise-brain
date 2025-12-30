# 企业级Brain系统故障排除指南

## 🎯 故障排除原则

### 基本思路
1. **分层诊断**：从底层到应用层逐步排查
2. **日志驱动**：充分利用日志信息定位问题
3. **快速恢复**：优先恢复服务，再深入分析
4. **文档记录**：记录问题和解决方案，形成知识库

### 诊断工具
- **系统日志**：Windows事件查看器、Linux系统日志
- **应用日志**：企业级Brain应用日志、Docker容器日志
- **网络工具**：ping、telnet、netstat、curl
- **性能工具**：任务管理器、资源监视器、Docker stats

## 🐳 Docker相关问题

### 1. Docker Desktop启动失败

#### 症状表现
- Docker Desktop无法启动
- 提示"Failed to start"
- 系统资源占用过高

#### 诊断步骤
```powershell
# 检查Docker服务状态
Get-Service docker
Get-Service com.docker.service

# 检查系统资源
Get-Process | Where-Object {$_.ProcessName -like "*docker*"} | Format-Table Name, CPU, WorkingSet

# 检查网络配置
Get-NetAdapter | Where-Object {$_.Name -like "*Docker*" -or $_.Name -like "*WSL*"}

# 检查Hyper-V状态
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All
```

#### 解决方案
```powershell
# 方案1：重置Docker Desktop
wsl --shutdown
Remove-Item -Path "$env:USERPROFILE\.docker" -Recurse -Force
Remove-Item -Path "$env:APPDATA\Docker" -Recurse -Force
# 重新启动Docker Desktop

# 方案2：重启WSL服务
wsl --shutdown
wsl --unregister docker-desktop
wsl --unregister docker-desktop-data
# 重启Docker Desktop

# 方案3：清理Docker系统
docker system prune -a -f
docker volume prune -f
docker network prune -f
```

### 2. 容器启动失败

#### 症状表现
- `docker-compose up` 失败
- 容器启动后立即退出
- 健康检查失败

#### 诊断步骤
```powershell
# 查看容器日志
docker-compose logs [service-name]
docker logs [container-name]

# 检查容器状态
docker ps -a
docker-compose ps

# 检查资源使用
docker stats
docker system df

# 检查网络连接
docker network ls
docker network inspect [network-name]
```

#### 常见问题解决

**端口冲突**
```powershell
# 检查端口占用
netstat -ano | findstr :3005
netstat -ano | findstr :3006

# 释放端口
taskkill /PID [PID] /F

# 或修改docker-compose.yml中的端口映射
```

**资源不足**
```powershell
# 检查系统资源
Get-Counter "\\Processor(_Total)\\% Processor Time"
Get-Counter "\\Memory\\Available MBytes"

# 释放资源
# 停止其他Docker容器
docker stop $(docker ps -q)

# 或增加Docker资源限制
# 在Docker Desktop设置中增加内存和CPU限制
```

**配置错误**
```powershell
# 验证docker-compose.yml
docker-compose config

# 检查环境变量
Get-Content .env

# 重新构建容器
docker-compose build --no-cache
```

### 3. 网络连接问题

#### 症状表现
- 容器间无法通信
- 外部无法访问容器服务
- DNS解析失败

#### 诊断步骤
```powershell
# 检查网络配置
docker network ls
docker network inspect enterprise-brain_default

# 测试容器间连通性
docker exec backend ping mysql
docker exec backend ping redis

# 检查端口映射
docker port [container-name]

# 测试外部访问
curl -I http://localhost:3005/health
```

#### 解决方案
```powershell
# 重建网络
docker-compose down
docker network prune -f
docker-compose up -d

# 重启网络服务
Restart-Service docker

# 配置DNS
# 在docker-compose.yml中添加DNS配置
dns:
  - 8.8.8.8
  - 114.114.114.114
```

## 🗄️ 数据库相关问题

### 1. MySQL连接失败

#### 症状表现
- 应用无法连接数据库
- `ECONNREFUSED` 错误
- 连接超时

#### 诊断步骤
```powershell
# 检查MySQL容器状态
docker-compose ps mysql
docker logs mysql

# 测试数据库连接
docker exec mysql mysql -u root -p -e "SHOW DATABASES;"

# 检查网络连通性
docker exec backend telnet mysql 3306

# 检查配置文件
docker exec mysql cat /etc/mysql/my.cnf
```

#### 解决方案

**数据库未启动**
```powershell
# 启动MySQL服务
docker-compose up -d mysql

# 等待数据库初始化
docker logs -f mysql
# 看到 "MySQL init process done. Ready for start up." 表示启动完成
```

**权限问题**
```powershell
# 重新创建用户
docker exec mysql mysql -u root -p -e "
CREATE USER IF NOT EXISTS 'enterprise_user'@'%' IDENTIFIED BY 'enterprise_pass';
GRANT ALL PRIVILEGES ON *.* TO 'enterprise_user'@'%';
FLUSH PRIVILEGES;
"

# 重启MySQL容器
docker-compose restart mysql
```

**配置问题**
```mysql
# 检查my.cnf配置
[mysqld]
bind-address = 0.0.0.0
port = 3306
max_connections = 100
innodb_buffer_pool_size = 256M
```

### 2. Redis连接问题

#### 症状表现
- 缓存操作失败
- 连接被拒绝
- 内存不足错误

#### 诊断步骤
```powershell
# 检查Redis容器
docker-compose ps redis
docker logs redis

# 测试Redis连接
docker exec redis redis-cli ping

# 检查Redis配置
docker exec redis redis-cli CONFIG GET "*"

# 检查内存使用
docker exec redis redis-cli INFO memory
```

#### 解决方案
```powershell
# 重启Redis服务
docker-compose restart redis

# 清理Redis数据
docker exec redis redis-cli FLUSHALL

# 优化Redis配置
# 在redis.conf中增加
maxmemory 512mb
maxmemory-policy allkeys-lru
```

## 🌐 网络相关问题

### 1. 端口访问问题

#### 症状表现
- 无法访问Web服务
- 浏览器显示连接被拒绝
- API调用失败

#### 诊断步骤
```powershell
# 检查端口监听
netstat -ano | findstr :80

# 检查防火墙规则
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Enterprise*"}

# 测试本地访问
curl -I http://localhost
telnet localhost 80

# 检查代理设置
netsh winhttp show proxy
```

#### 解决方案

**防火墙问题**
```powershell
# 添加防火墙规则
New-NetFirewallRule -DisplayName "Enterprise-Brain-HTTP" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 80 `
    -Action Allow `
    -Profile Private

# 禁用防火墙（临时测试）
Set-NetFirewallProfile -All -Enabled False
```

**Nginx配置问题**
```nginx
# 检查nginx.conf配置
server {
    listen 80;
    server_name localhost;
    
    location / {
        proxy_pass http://frontend:3006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://backend:3005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. DNS解析问题

#### 症状表现
- 域名无法解析
- 服务间通信失败
- 外部API调用失败

#### 诊断步骤
```powershell
# 测试DNS解析
nslookup google.com
nslookup mysql

# 检查hosts文件
Get-Content $env:SystemRoot\System32\drivers\etc\hosts

# 测试网络连通性
ping 8.8.8.8
tracert google.com
```

#### 解决方案
```powershell
# 清理DNS缓存
Clear-DnsClientCache

# 配置DNS服务器
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("8.8.8.8","8.8.4.4")

# 添加hosts记录
Add-Content -Path "$env:SystemRoot\System32\drivers\etc\hosts" -Value "127.0.0.1 mysql"
```

## 🚀 应用相关问题

### 1. 前端构建失败

#### 症状表现
- npm build 失败
- 编译错误
- 内存溢出

#### 诊断步骤
```powershell
# 检查Node.js版本
node --version
npm --version

# 检查依赖安装
npm ls --depth=0

# 查看构建日志
npm run build

# 检查磁盘空间
Get-PSDrive -PSProvider FileSystem
```

#### 解决方案

**依赖问题**
```powershell
# 清理并重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**内存问题**
```powershell
# 增加Node.js内存限制
set NODE_OPTIONS=--max-old-space-size=4096

# 或者修改package.json
"scripts": {
  "build": "node --max-old-space-size=4096 node_modules/.bin/vue-cli-service build"
}
```

**权限问题**
```powershell
# 以管理员身份运行
# 或者设置文件权限
icacls . /grant "Everyone:(OI)(CI)F" /T
```

### 2. 后端服务异常

#### 症状表现
- API返回500错误
- 服务无响应
- 内存泄漏

#### 诊断步骤
```powershell
# 查看应用日志
docker-compose logs backend

# 检查服务状态
curl http://localhost:3005/health

# 检查进程状态
docker exec backend ps aux

# 查看错误日志
docker exec backend tail -f logs/error.log
```

#### 解决方案

**数据库连接失败**
```javascript
// 检查数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// 添加连接重试机制
const retryConnection = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('Database connected successfully');
      break;
    } catch (error) {
      console.log(`Connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};
```

**内存泄漏**
```javascript
// 监控内存使用
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`
  });
}, 30000);

// 优化数据库查询
const users = await User.findAll({
  limit: 100,
  offset: page * 100,
  attributes: ['id', 'name', 'email'] // 只选择需要的字段
});
```

## 📊 性能相关问题

### 1. 系统响应缓慢

#### 症状表现
- 页面加载缓慢
- API响应时间长
- 资源占用率高

#### 诊断步骤
```powershell
# 检查系统资源
Get-Counter "\\Processor(_Total)\\% Processor Time"
Get-Counter "\\Memory\\Available MBytes"
Get-Counter "\\PhysicalDisk(_Total)\\Avg. Disk sec/Read"

# 检查Docker资源使用
docker stats

# 检查网络延迟
ping -n 10 8.8.8.8

# 检查应用性能
curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3005/health
```

#### 优化方案

**系统资源优化**
```powershell
# 增加虚拟内存
$cs = Get-WmiObject -Class Win32_ComputerSystem
$cs.AutomaticManagedPagefile = $false
$cs.Put()

$pf = Get-WmiObject -Class Win32_PageFileSetting
$pf.InitialSize = 8192  # 8GB
$pf.MaximumSize = 8192
$pf.Put()
```

**数据库优化**
```sql
-- 查看慢查询
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';

-- 分析查询执行计划
EXPLAIN SELECT * FROM users WHERE name = 'test';

-- 优化索引
CREATE INDEX idx_users_name ON users(name);
```

**应用优化**
```javascript
// 启用压缩
const compression = require('compression');
app.use(compression());

// 添加缓存
const apicache = require('apicache');
const cache = apicache.middleware('1 hour');

app.get('/api/data', cache, (req, res) => {
  // 处理请求
});

// 连接池优化
const pool = mysql.createPool({
  connectionLimit: 20,
  acquireTimeout: 60000,
  timeout: 60000
});
```

## 🔧 监控和日志分析

### 1. 日志收集分析

```powershell
# 收集系统日志
Get-EventLog -LogName Application -Newest 100 | Export-Csv application-log.csv

# 收集Docker日志
docker-compose logs --tail=1000 > docker-compose.log

# 收集应用日志
docker-compose exec backend cat logs/app.log > backend.log
docker-compose exec frontend cat logs/access.log > frontend.log
```

### 2. 性能监控

```powershell
# 创建性能监控脚本
$monitorScript = {
    while ($true) {
        $cpu = Get-Counter "\\Processor(_Total)\\% Processor Time"
        $memory = Get-Counter "\\Memory\\Available MBytes"
        $disk = Get-Counter "\\PhysicalDisk(_Total)\\Avg. Disk sec/Read"
        
        Write-Host "$(Get-Date): CPU=$($cpu.CounterSamples.CookedValue)%, Memory=$($memory.CounterSamples.CookedValue)MB, Disk=$([math]::Round($disk.CounterSamples.CookedValue * 1000, 2))ms"
        Start-Sleep -Seconds 60
    }
}

# 启动监控
Start-Job -ScriptBlock $monitorScript -Name "SystemMonitor"
```

## 📋 应急响应流程

### 1. 服务完全宕机

#### 快速响应步骤
1. **评估影响范围**
   - 确定影响的服务和用户
   - 评估业务影响程度

2. **快速恢复**
   ```powershell
   # 重启所有服务
   docker-compose down
   docker-compose up -d
   
   # 检查服务状态
   docker-compose ps
   curl http://localhost/health
   ```

3. **通知相关人员**
   - 技术团队
   - 业务部门
   - 管理层

### 2. 数据损坏处理

#### 数据恢复流程
```powershell
# 1. 停止应用服务，防止进一步损坏
docker-compose stop backend frontend

# 2. 备份当前数据（可能损坏）
docker-compose exec mysql mysqldump -u root -p enterprise_brain > backup-damaged.sql

# 3. 从最近的备份恢复
docker-compose exec mysql mysql -u root -p enterprise_brain < backup-20231201_120000.sql

# 4. 验证数据完整性
docker-compose exec mysql mysql -u root -p -e "SELECT COUNT(*) FROM users;"

# 5. 重启服务
docker-compose up -d
```

### 3. 安全事件响应

#### 安全威胁处理
1. **隔离受影响系统**
   ```powershell
   # 断开网络连接
   Disable-NetAdapter -Name "Ethernet"
   
   # 停止可疑服务
   docker-compose down
   ```

2. **收集证据**
   ```powershell
   # 备份日志
   Copy-Item -Path "logs\*" -Destination "security-backup\logs" -Recurse
   
   # 导出系统配置
   systeminfo > security-backup\system-info.txt
   ```

3. **修复和加固**
   ```powershell
   # 更新系统补丁
   Install-WindowsUpdate -MicrosoftUpdate -AcceptAll -AutoRestart
   
   # 更新容器镜像
   docker-compose pull
   docker-compose up -d
   ```

## 📚 知识库维护

### 问题记录模板

```markdown
# 问题记录

## 问题描述
- 症状表现：
- 影响范围：
- 发生时间：

## 诊断过程
- 初步检查：
- 详细分析：
- 根本原因：

## 解决方案
- 临时解决方案：
- 永久解决方案：
- 预防措施：

## 相关资源
- 参考文档：
- 相关日志：
- 联系人：

## 后续跟进
- 验证结果：
- 监控要点：
- 改进建议：
```

### 自动化故障检测

```powershell
# 创建故障检测脚本
function Monitor-SystemHealth {
    $issues = @()
    
    # 检查服务状态
    $services = @("mysql", "redis", "backend", "frontend", "nginx")
    foreach ($service in $services) {
        $status = docker-compose ps -q $service
        if (-not $status) {
            $issues += "服务 $service 未运行"
        }
    }
    
    # 检查端口访问
    $ports = @(80, 3005, 3006, 3306, 6379)
    foreach ($port in $ports) {
        if (-not (Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue)) {
            $issues += "端口 $port 无法访问"
        }
    }
    
    # 检查磁盘空间
    $drives = Get-PSDrive -PSProvider FileSystem
    foreach ($drive in $drives) {
        $freePercent = ($drive.Free / ($drive.Used + $drive.Free)) * 100
        if ($freePercent -lt 10) {
            $issues += "磁盘 $($drive.Name) 空间不足"
        }
    }
    
    # 发送告警
    if ($issues.Count -gt 0) {
        $subject = "企业级Brain系统告警"
        $body = $issues -join "`n"
        Send-MailMessage -To "admin@company.com" -From "monitor@company.com" -Subject $subject -Body $body
    }
}

# 定期执行监控
Register-ScheduledTask -Trigger (New-ScheduledTaskTrigger -Daily -At 9am) -Action (New-ScheduledTaskAction -PowerShell -ScriptBlock { Monitor-SystemHealth }) -TaskName "Enterprise-Brain-Health-Monitor"
```

---

**注意**: 本故障排除指南会根据实际使用情况持续更新和完善。遇到新问题时，请及时记录并更新此文档。
