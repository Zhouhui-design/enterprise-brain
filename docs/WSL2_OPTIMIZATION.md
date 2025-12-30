# WSL2 性能优化配置指南

## 🎯 优化目标

通过优化WSL2配置，提升企业级Brain项目在Windows环境下的运行性能，主要包括：
- 文件系统访问性能提升
- 内存使用优化
- 网络性能改善
- Docker容器性能优化

## 📋 系统检查和准备

### 检查WSL2状态
```powershell
# 检查WSL版本
wsl --version

# 查看已安装的发行版
wsl -l -v

# 检查当前WSL模式
wsl --status
```

### 更新WSL2
```powershell
# 更新WSL2内核
wsl --update

# 检查更新状态
wsl --version
```

## ⚙️ WSL2配置优化

### 1. 创建.wslconfig配置文件

在用户目录下创建 `%USERPROFILE%\.wslconfig` 文件：

```ini
# ================================
# WSL2 性能优化配置
# 企业级Brain项目专用
# ================================

[wsl2]
# 内存配置
memory=8                    # 分配8GB内存（根据实际内存调整）
swap=4                     # 4GB交换空间

# 处理器配置
processors=6                # 分配6个CPU核心（根据CPU核心数调整）

# 存储配置
localStorageSize=100         # 100GB虚拟磁盘空间

# 网络配置
networkingMode=mirrored     # 镜像网络模式（Windows 11 22H00+）
dnsTunneling=true           # DNS隧道
firewall=true               # 防火墙集成
autoProxy=true              # 自动代理

# 性能优化
debugKernel=false            # 关闭内核调试（生产环境）
nestedVirtualization=true   # 嵌套虚拟化
vmIdleTimeout=120000       # 虚拟机空闲超时（毫秒）

# 实验性功能（可选）
experimental.allowed=true    # 启用实验性功能
experimental.localhost=true # 本地主机转发
```

### 2. 应用配置并重启WSL2

```powershell
# 关闭所有WSL发行版
wsl --shutdown

# 重启WSL2
wsl

# 验证配置
wsl --version
```

## 🖥️ Windows系统优化

### 1. 虚拟内存优化

```powershell
# 设置虚拟内存（以管理员身份运行）
# 推荐设置：物理内存的1.5-2倍
# 示例：16GB内存 -> 24GB虚拟内存

# 通过系统设置或PowerShell配置
$cs = Get-WmiObject -Class Win32_ComputerSystem
$cs.AutomaticManagedPagefile = $false
$cs.Put()
$pagefile = Get-WmiObject -Class Win32_PageFileSetting
$pagefile.InitialSize = 24576  # 24GB初始大小
$pagefile.MaximumSize = 24576  # 24GB最大大小
$pagefile.Put()
```

### 2. 文件系统优化

```powershell
# 禁用Windows Defender实时保护（仅开发环境）
# 注意：生产环境请保持安全软件启用
Set-MpPreference -DisableRealtimeMonitoring $true

# 优化NTFS文件系统
# 在C盘根目录创建优化脚本
$script = @'
@echo off
REM 优化文件系统性能
fsutil behavior set disablelastaccess 1
fsutil behavior set encryptpagingfile 0
REM 优化网络
netsh int tcp set global autotuninglevel=disabled
netsh int tcp set global timestamps=disabled
'@
$script | Out-File -FilePath "C:\optimize-system.bat" -Encoding ASCII
```

### 3. 网络优化

```powershell
# 网络适配器优化
Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | ForEach-Object {
    # 禁用大型发送卸载
    Disable-NetAdapterLso -Name $_.Name -NoRestart
    # 禁用接收端缩放
    Disable-NetAdapterRsc -Name $_.Name -NoRestart
}

# TCP/IP优化
netsh int tcp set global autotuninglevel=restricted
netsh int tcp set global ecncapability=enabled
netsh int tcp set global timestamps=disabled
```

## 🐳 Docker Desktop优化

### 1. Docker Desktop配置

```json
{
  "experimental": false,
  "registry-mirrors": [
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn"
  ],
  "kubernetes": false,
  "log-level": "info",
  "memory": 4096,
  "cpus": 4,
  "swap": 1024,
  "data-root": "C:\\ProgramData\\Docker",
  "storage-opts": [
    "size=20G"
  ],
  "hosts": [
    "tcp://0.0.0.0:2376"
  ],
  "tls": true,
  "tlscacert": "C:\\Users\\sardenesy\\.docker\\ca.pem",
  "tlscert": "C:\\Users\\sardenesy\\.docker\\cert.pem",
  "tlskey": "C:\\Users\\sardenesy\\.docker\\key.pem"
}
```

### 2. Docker守护进程配置

创建或编辑 `%USERPROFILE%\.docker\daemon.json`：

```json
{
  "registry-mirrors": [
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn"
  ],
  "insecure-registries": [
    "localhost:5000",
    "127.0.0.1:5000"
  ],
  "debug": false,
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "dns": [
    "8.8.8.8",
    "114.114.114.114"
  ],
  "iptables": false,
  "userland-proxy": false
}
```

## 📁 文件系统性能优化

### 1. 项目文件存储策略

```powershell
# 将项目文件存储在WSL2文件系统中
# 推荐路径：\\wsl$\Ubuntu\home\username\projects

# 或者使用符号链接
# 在WSL2中创建项目目录
wsl -d Ubuntu -- mkdir -p /home/sardenesy/projects

# 在Windows中创建符号链接
# 以管理员身份运行PowerShell
New-Item -ItemType SymbolicLink -Path "C:\projects" -Target "\\wsl$\Ubuntu\home\sardenesy\projects"
```

### 2. Git配置优化

```powershell
# 进入WSL2环境
wsl -d Ubuntu

# 配置Git（在WSL2中）
git config --global core.preloadindex true
git config --global core.fscache true
git config --global gc.auto 256

# 配置文件缓存
git config --global core.untrackedcache true
```

### 3. Node.js项目优化

```powershell
# 在WSL2中配置Node.js
wsl -d Ubuntu

# 设置npm缓存位置
npm config set cache ~/.npm-cache

# 配置Node.js内存限制
echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.bashrc

# 配置Yarn缓存
yarn config set cache-folder ~/.yarn-cache
```

## 🔍 性能监控和调试

### 1. 性能监控脚本

创建 `C:\scripts\wsl-performance-monitor.ps1`：

```powershell
# WSL2性能监控脚本
$wsl_info = wsl --status
$docker_info = docker system info --format "{{json}}"

Write-Host "=== WSL2 Performance Monitor ===" -ForegroundColor Green
Write-Host "Time: $(Get-Date)" -ForegroundColor Yellow

# WSL2状态
Write-Host "`n--- WSL2 Status ---" -ForegroundColor Cyan
Write-Host $wsl_info

# Docker状态
Write-Host "`n--- Docker Status ---" -ForegroundColor Cyan
$docker_info | ConvertFrom-Json | Select-Object NCPU, MemTotal, Architecture

# 磁盘使用
Write-Host "`n--- Disk Usage ---" -ForegroundColor Cyan
wsl -d Ubuntu -- df -h / | Select-Object -Skip 1 | ForEach-Object {
    $parts = $_ -split '\s+'
    Write-Host ("{0,-15} {1,-8} {2,-8} {3,-8} {4}" -f $parts[5], $parts[1], $parts[2], $parts[3], $parts[4])
}

# 内存使用
Write-Host "`n--- Memory Usage ---" -ForegroundColor Cyan
$mem = Get-Process | Where-Object {$_.ProcessName -like "*docker*"} | Measure-Object -Property WorkingSet -Sum
Write-Host "Docker Memory: $([math]::Round($mem.Sum / 1MB, 2)) MB"

# 网络连接
Write-Host "`n--- Network Connections ---" -ForegroundColor Cyan
netstat -an | findstr LISTEN | findstr ":80\|:3306\|:6379\|:3005\|:3006"
```

### 2. 自动化优化脚本

创建 `C:\scripts\wsl-optimize.ps1`：

```powershell
# WSL2自动化优化脚本
param(
    [switch]$Force,
    [switch]$Cleanup
)

Write-Host "=== WSL2 Optimization Script ===" -ForegroundColor Green

# 清理WSL2
if ($Cleanup) {
    Write-Host "Cleaning WSL2..." -ForegroundColor Yellow
    wsl --shutdown
    docker system prune -a -f
    Write-Host "Cleanup completed." -ForegroundColor Green
    exit
}

# 检查系统状态
Write-Host "Checking system status..." -ForegroundColor Yellow
$wsl_status = wsl --status
Write-Host $wsl_status

# 应用配置
if ($Force -or -not (Test-Path "$env:USERPROFILE\.wslconfig")) {
    Write-Host "Applying WSL2 configuration..." -ForegroundColor Yellow
    
    $config = @"
[wsl2]
memory=8
swap=4
processors=6
localStorageSize=100
networkingMode=mirrored
dnsTunneling=true
firewall=true
autoProxy=true
debugKernel=false
nestedVirtualization=true
vmIdleTimeout=120000
"@
    
    $config | Out-File -FilePath "$env:USERPROFILE\.wslconfig" -Encoding UTF8
    Write-Host "Configuration applied." -ForegroundColor Green
}

# 重启WSL2
Write-Host "Restarting WSL2..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 5

# 验证配置
Write-Host "Verifying configuration..." -ForegroundColor Yellow
wsl --version

Write-Host "WSL2 optimization completed!" -ForegroundColor Green
Write-Host "Please restart Docker Desktop to apply changes." -ForegroundColor Yellow
```

## 📈 性能基准测试

### 1. Docker容器启动时间测试

```powershell
# Docker性能测试
function Test-DockerPerformance {
    Write-Host "Testing Docker container startup time..." -ForegroundColor Yellow
    
    $start_time = Get-Date
    docker run --rm alpine echo "Hello World"
    $end_time = Get-Date
    
    $duration = ($end_time - $start_time).TotalMilliseconds
    Write-Host "Container startup time: $duration ms" -ForegroundColor Green
}

Test-DockerPerformance
```

### 2. 文件系统性能测试

```powershell
# 文件系统性能测试
function Test-FileSystemPerformance {
    Write-Host "Testing file system performance..." -ForegroundColor Yellow
    
    $test_file = "C:\temp\test_io.txt"
    $data = "x" * 1024 * 1024  # 1MB
    
    # 写入测试
    $start_time = Get-Date
    $data | Out-File -FilePath $test_file -Encoding UTF8
    $write_time = (Get-Date) - $start_time
    
    # 读取测试
    $start_time = Get-Date
    Get-Content $test_file | Out-Null
    $read_time = (Get-Date) - $start_time
    
    Write-Host "Write 1MB: $($write_time.TotalMilliseconds) ms" -ForegroundColor Green
    Write-Host "Read 1MB: $($read_time.TotalMilliseconds) ms" -ForegroundColor Green
    
    Remove-Item $test_file -Force
}

Test-FileSystemPerformance
```

## 🛠️ 故障排除

### 常见问题解决

#### 1. WSL2启动失败
```powershell
# 重置WSL2
wsl --unregister Ubuntu
wsl --install -d Ubuntu

# 或重新安装
wsl --shutdown
wsl --install
```

#### 2. Docker Desktop连接问题
```powershell
# 重置Docker Desktop
wsl --shutdown
Remove-Item -Path "$env:USERPROFILE\.docker" -Recurse -Force
# 重新启动Docker Desktop
```

#### 3. 性能下降问题
```powershell
# 清理缓存
wsl --shutdown
docker system prune -a -f

# 重新启动
wsl
docker-compose up -d
```

## 📋 维护计划

### 每周维护任务
```powershell
# 创建每周维护脚本
@echo off
echo === WSL2 Weekly Maintenance ===

wsl --shutdown
docker system prune -a -f
docker volume prune -f
wsl

echo Maintenance completed.
```

### 每月维护任务
```powershell
# 创建每月维护脚本
@echo off
echo === WSL2 Monthly Maintenance ===

# 备份WSL配置
copy "%USERPROFILE%\.wslconfig" "C:\backup\wslconfig.bak"

# 清理Docker
docker system prune -a -f --volumes

# 更新WSL内核
wsl --update

echo Monthly maintenance completed.
```

---

**注意**: 本优化配置针对企业级Brain项目量身定制，请根据实际硬件配置调整参数值。
