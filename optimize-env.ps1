# 企业级Brain环境优化脚本
Write-Host "=== 🚀 环境优化开始 ===" -ForegroundColor Green

# 1. 配置NPM国内镜像
Write-Host "📦 配置NPM国内镜像..." -ForegroundColor Cyan
npm config set registry https://registry.npmmirror.com

# 2. 后端依赖安装
Write-Host "📦 安装后端依赖..." -ForegroundColor Cyan
Set-Location backend
npm install --registry=https://registry.npmmirror.com

# 3. 前端依赖安装
Write-Host "📦 安装前端依赖..." -ForegroundColor Cyan
Set-Location ..\07-frontend
npm install --registry=https://registry.npmmirror.com

# 4. 创建日志目录
Write-Host "📁 创建日志目录..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "..\logs"
New-Item -ItemType Directory -Force -Path "..\data"

# 5. 环境配置完成
Write-Host "✅ 环境优化完成！" -ForegroundColor Green
Write-Host "后端地址: http://localhost:3005" -ForegroundColor White
Write-Host "前端地址: http://localhost:5173" -ForegroundColor White
Write-Host "启动命令:" -ForegroundColor Yellow
Write-Host "后端: cd backend && npm start" -ForegroundColor White
Write-Host "前端: cd 07-frontend && npm run dev" -ForegroundColor White
Write-Host "===============================" -ForegroundColor Green
