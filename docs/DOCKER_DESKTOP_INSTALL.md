# Docker Desktop 安装指南 (Windows)

## 📋 系统要求

### 最低系统要求
- **操作系统**: Windows 10 64-bit: Pro, Enterprise, or Education (Build 1903或更高版本)
- **内存**: 至少4GB RAM
- **CPU**: 64位处理器，支持虚拟化技术(VT-x)
- **存储**: 至少10GB可用磁盘空间

### 推荐系统配置
- **操作系统**: Windows 11 64-bit
- **内存**: 8GB RAM或更多
- **CPU**: 多核处理器，支持虚拟化
- **存储**: SSD，至少20GB可用空间

## 🚀 安装步骤

### 方法1：官方安装程序（推荐）

#### 1.1 下载Docker Desktop
1. 访问 [Docker Desktop官方下载页面](https://www.docker.com/products/docker-desktop/)
2. 点击 "Download for Windows"
3. 选择 "Windows with WSL 2 support"

#### 1.2 安装Docker Desktop
1. 双击下载的 `Docker Desktop Installer.exe`
2. 按照安装向导进行安装：
   - ✅ 勾选 "Use WSL 2 instead of Hyper-V"（推荐）
   - ✅ 勾选 "Add shortcut to desktop"
3. 等待安装完成
4. 重启计算机

#### 1.3 启动和配置
1. 启动Docker Desktop
2. 等待初始化完成（可能需要几分钟）
3. 如果看到WSL 2安装提示，点击"安装"
4. 设置Docker Hub账号或跳过

### 方法2：通过Microsoft Store安装

#### 2.1 从Microsoft Store安装
1. 打开Microsoft Store
2. 搜索 "Docker Desktop"
3. 点击"获取"并等待安装完成
4. 启动应用并完成初始配置

## ⚙️ WSL 2配置优化

### 启用WSL 2功能
```powershell
# 以管理员身份运行PowerShell

# 启用WSL功能
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 启用虚拟机平台功能
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 重启计算机
Restart-Computer

# 设置WSL 2为默认版本
wsl --set-default-version 2
```

### 安装Linux发行版
```powershell
# 从Microsoft Store安装Ubuntu（推荐）
# 或使用以下命令：
wsl --install -d Ubuntu
```

### WSL 2性能优化配置
创建WSL 2配置文件 `%USERPROFILE%\.wslconfig`:

```ini
# WSL 2 配置文件
[wsl2]
# 分配的内存大小（GB）
memory=4

# 分配的处理器核心数
processors=4

# 交换空间大小（GB）
swap=4

# WSL 2虚拟磁盘最大大小（GB）
localStorageSize=80

# 启用内核日志
debugKernel=true

# 启用WSL性能
nestedVirtualization=true

# 网络模式
networkingMode=mirrored

# DNS隧道
dnsTunneling=true

# 防火墙设置
firewall=true

# 自动代理
autoProxy=true
```

重启WSL:
```powershell
wsl --shutdown
wsl
```

## 🛠️ Docker Desktop配置

### 资源配置
1. 打开Docker Desktop设置
2. 进入 "Resources" → "Advanced"
3. 配置资源限制：
   - **CPU**: 4核心
   - **Memory**: 4GB
   - **Swap**: 1GB
   - **Disk image size**: 20GB
   - **Disk image location**: 选择SSD路径

### 文件共享配置
1. 进入 "Resources" → "File Sharing"
2. 添加需要共享的目录：
   - `C:\Users\sardenesy\Projects`
   - 其他项目目录
3. 设置文件共享权限

### 网络配置
1. 进入 "Resources" → "Network"
2. 配置网络设置：
   - **DNS Server**: 自动检测
   - **Hostnames**: 启用
   - **Network interfaces**: 自动配置

## 🔧 企业级系统配置

### 镜像仓库配置
```powershell
# 配置私有镜像仓库
docker login your-registry.com

# 配置镜像加速器（可选）
# 创建或编辑 %USERPROFILE%\.docker\daemon.json
{
  "registry-mirrors": [
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn"
  ],
  "insecure-registries": ["your-registry.com"]
}
```

### 企业级Brain项目专用配置
```powershell
# 切换到项目目录
cd C:\Users\sardenesy\Projects\enterpise-brain

# 验证Docker环境
docker --version
docker-compose --version

# 测试Docker服务
docker run --rm hello-world
```

## 🔍 故障排除

### 常见问题及解决方案

#### 1. WSL 2未正确安装
**错误信息**: `WSL 2 installation failed`

**解决方案**:
```powershell
# 更新WSL
wsl --update

# 重置WSL
wsl --shutdown
wsl --unregister Ubuntu

# 重新安装
wsl --install -d Ubuntu
```

#### 2. 虚拟化未启用
**错误信息**: `VT-X/AMD-V not enabled`

**解决方案**:
1. 重启计算机进入BIOS
2. 启用虚拟化技术(VT-x/AMD-V)
3. 保存并重启
4. 验证虚拟化状态：
```powershell
systeminfo | Select-String "Virtualization"
```

#### 3. Docker Desktop启动失败
**错误信息**: `Docker Desktop failed to start`

**解决方案**:
```powershell
# 重置Docker Desktop
wsl --shutdown
# 删除Docker配置文件
Remove-Item -Path "$env:USERPROFILE\.docker" -Recurse -Force
# 重新启动Docker Desktop
```

#### 4. 权限问题
**错误信息**: `Permission denied`

**解决方案**:
```powershell
# 添加用户到docker-users组（如果使用Hyper-V后端）
net localgroup docker-users /add
net localgroup docker-users $env:USERNAME /add

# 重新登录或重启Docker Desktop
```

#### 5. 端口冲突
**错误信息**: `Port already in use`

**解决方案**:
```powershell
# 查看端口占用
netstat -ano | findstr :80

# 停止占用端口的服务
taskkill /PID <PID> /F

# 或修改docker-compose.yml中的端口映射
```

## 📊 性能优化建议

### 1. SSD存储
- 将Docker虚拟磁盘放置在SSD上
- 配置足够的磁盘空间（至少20GB）

### 2. 内存管理
- 分配足够的内存（建议4GB以上）
- 定期清理未使用的镜像和容器：
```powershell
docker system prune -a
```

### 3. 网络优化
- 使用有线网络连接
- 配置合适的DNS服务器
- 启用网络性能模式

### 4. WSL 2优化
- 使用最新版本的WSL 2
- 配置合适的内存和处理器限制
- 定期重启WSL：
```powershell
wsl --shutdown
```

## 🔄 维护任务

### 日常维护
```powershell
# 每周执行的清理任务
docker system prune -f
docker volume prune -f
docker network prune -f

# 查看磁盘使用情况
docker system df

# 更新Docker Desktop
```

### 定期备份
```powershell
# 备份Docker配置
Copy-Item "$env:USERPROFILE\.docker" "C:\backup\docker-config" -Recurse

# 备份WSL发行版
wsl --export Ubuntu C:\backup\wsl-ubuntu.tar
```

## 📚 参考资源

- [Docker Desktop官方文档](https://docs.docker.com/desktop/windows/)
- [WSL 2官方文档](https://docs.microsoft.com/en-us/windows/wsl/)
- [Docker Desktop发行说明](https://docs.docker.com/desktop/release-notes/)
- [企业级Brain项目文档](./README.md)

## 🆘️ 获取帮助

如果遇到问题，可以通过以下方式获取帮助：
1. **Docker Desktop日志**: 帮助 → Troubleshoot → 收集日志
2. **WSL日志**: `wsl --verbose`
3. **项目GitHub Issues**: 提交问题报告
4. **技术支持**: 联系技术支持团队

---

**注意**: 本安装指南针对企业级Brain项目优化，确保所有功能在Windows环境下正常运行。
