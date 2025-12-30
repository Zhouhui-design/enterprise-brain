# 企业级Brain系统防火墙配置指南

## 🔥 Windows防火墙配置

### 1. 基本端口开放

为企业级Brain系统开放必要端口：

```powershell
# 以管理员身份运行PowerShell

# 定义企业级Brain端口号
$ports = @(80, 3005, 3006, 3306, 6379, 8080, 9090, 3001, 9100, 9121)

# 为每个端口创建入站规则
foreach ($port in $ports) {
    $ruleName = "Enterprise-Brain-Port-$port"
    
    # 检查规则是否已存在
    $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    
    if ($existingRule) {
        Write-Host "规则已存在，更新: $ruleName" -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName $ruleName
    }
    
    # 创建新规则
    New-NetFirewallRule -DisplayName $ruleName `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort $port `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Description "企业级Brain系统端口 $port"
    
    Write-Host "✅ 已创建防火墙规则: $ruleName (端口 $port)" -ForegroundColor Green
}

Write-Host "🎉 防火墙配置完成！" -ForegroundColor Green
```

### 2. 应用程序特定规则

```powershell
# Docker Desktop规则
$dockerRule = "Docker Desktop"
if (-not (Get-NetFirewallRule -DisplayName $dockerRule -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $dockerRule `
        -Direction Inbound `
        -Program "C:\Program Files\Docker\Docker\Docker Desktop.exe" `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Description "允许Docker Desktop网络访问"
    
    Write-Host "✅ Docker Desktop规则已创建" -ForegroundColor Green
}

# Node.js应用规则
$nodeRule = "Node.js Applications"
if (-not (Get-NetFirewallRule -DisplayName $nodeRule -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $nodeRule `
        -Direction Inbound `
        -Program "node.exe" `
        -Action Allow `
        -Profile Domain,Private,Public `
        -LocalPort 3005,3006 `
        -Description "允许Node.js应用网络访问"
    
    Write-Host "✅ Node.js应用规则已创建" -ForegroundColor Green
}
```

### 3. WSL2网络规则

```powershell
# WSL2网络接口规则
$wslRule = "WSL2 Network"
if (-not (Get-NetFirewallRule -DisplayName $wslRule -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $wslRule `
        -Direction Inbound `
        -InterfaceAlias "vEthernet (WSL)" `
        -Action Allow `
        -Profile Domain,Private,Public `
        -LocalPort 80,3005,3006,3306,6379,8080,9090,3001 `
        -Description "允许WSL2网络访问"
    
    Write-Host "✅ WSL2网络规则已创建" -ForegroundColor Green
}
```

## 🛡️ 高级安全配置

### 1. 网络区域配置

```powershell
# 配置网络区域
function Set-NetworkZone {
    param(
        [string]$NetworkName,
        [string]$Zone
    )
    
    $adapter = Get-NetAdapter | Where-Object {$_.Name -like "*$NetworkName*"}
    if ($adapter) {
        $profile = Get-NetConnectionProfile -InterfaceAlias $adapter.InterfaceAlias
        if ($profile.NetworkCategory -ne $Zone) {
            Set-NetConnectionProfile -InterfaceAlias $adapter.InterfaceAlias -NetworkCategory $Zone
            Write-Host "✅ 已设置网络 $NetworkName 为 $Zone 区域" -ForegroundColor Green
        }
    }
}

# 设置开发网络为专用网络
Set-NetworkZone -NetworkName "Ethernet" -Zone "Private"
Set-NetworkZone -NetworkName "Wi-Fi" -Zone "Private"
```

### 2. IP地址限制

```powershell
# 限制特定IP访问（生产环境）
$allowedIPs = @("192.168.1.0/24", "10.0.0.0/8", "127.0.0.1")

foreach ($ip in $allowedIPs) {
    $ruleName = "Enterprise-Brain-Allowed-IP-$($ip -replace '[^a-zA-Z0-9]', '-')"
    
    New-NetFirewallRule -DisplayName $ruleName `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 3306,6379 `
        -RemoteAddress $ip `
        -Action Allow `
        -Profile Domain,Private `
        -Description "允许IP $ip 访问数据库和缓存服务"
    
    Write-Host "✅ 已创建IP限制规则: $ruleName" -ForegroundColor Green
}
```

### 3. 日志和监控配置

```powershell
# 启用防火墙日志
$firewallPolicy = Get-NetFirewallProfile -All
foreach ($profile in $firewallPolicy) {
    $profile.LogAllowed = $true
    $profile.LogBlocked = $true
    $profile.LogFileName = "%systemroot%\system32\LogFiles\Firewall\pfirewall.log"
    $profile.LogMaxSizeKilobytes = 10240  # 10MB
    
    Set-NetFirewallProfile -InputObject $profile
}

Write-Host "✅ 防火墙日志已启用" -ForegroundColor Green

# 查看防火墙日志
function Get-FirewallLogs {
    $logPath = "$env:SystemRoot\system32\LogFiles\Firewall\pfirewall.log"
    if (Test-Path $logPath) {
        Get-Content $logPath -Tail 100 | Where-Object {$_ -match "ALLOW|DENY"}
    } else {
        Write-Host "防火墙日志文件不存在" -ForegroundColor Yellow
    }
}
```

## 🌐 企业级防火墙配置

### 1. 组策略配置（企业环境）

```powershell
# 导出当前防火墙策略
function Export-FirewallPolicy {
    $exportPath = "C:\backup\firewall-policy.wfw"
    
    # 导出防火墙策略
    New-NetFirewallRule -DisplayName "Enterprise-Brain-Backup" -Action Allow
    Export-PolicyStore -PolicyStore $exportPath -PolicyStoreType Domain
    
    Write-Host "✅ 防火墙策略已导出到: $exportPath" -ForegroundColor Green
}

# 导入防火墙策略
function Import-FirewallPolicy {
    param([string]$ImportPath)
    
    if (Test-Path $ImportPath) {
        Import-PolicyStore -PolicyStore $ImportPath -PolicyStoreType Domain
        Write-Host "✅ 防火墙策略已导入" -ForegroundColor Green
    } else {
        Write-Host "❌ 策略文件不存在: $ImportPath" -ForegroundColor Red
    }
}
```

### 2. 网络段隔离

```powershell
# 创建网络段隔离规则
$networkSegments = @{
    "Development" = "192.168.10.0/24"
    "Testing"     = "192.168.20.0/24"
    "Production"  = "192.168.30.0/24"
    "Management"  = "192.168.100.0/24"
}

foreach ($segment in $networkSegments.GetEnumerator()) {
    $segmentName = $segment.Key
    $segmentIP = $segment.Value
    
    # 开发段：允许所有端口（开发环境）
    if ($segmentName -eq "Development") {
        New-NetFirewallRule -DisplayName "Enterprise-Brain-$segmentName-FullAccess" `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPort Any `
            -RemoteAddress $segmentIP `
            -Action Allow `
            -Profile Private `
            -Description "开发段完全访问"
    }
    # 生产段：仅允许必要端口
    elseif ($segmentName -eq "Production") {
        $productionPorts = "80,443,3306,6379,3005,3006"
        New-NetFirewallRule -DisplayName "Enterprise-Brain-$segmentName-Restricted" `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPort $productionPorts `
            -RemoteAddress $segmentIP `
            -Action Allow `
            -Profile Private `
            -Description "生产段限制访问"
    }
    
    Write-Host "✅ 已配置网络段: $segmentName ($segmentIP)" -ForegroundColor Green
}
```

## 🔍 防火墙诊断和故障排除

### 1. 连接测试脚本

```powershell
# 企业级Brain端口连接测试
function Test-EnterpriseBrainPorts {
    Write-Host "🔍 测试企业级Brain端口连接性..." -ForegroundColor Yellow
    
    $ports = @{
        80     = "HTTP (Nginx)"
        3005   = "Backend API"
        3006   = "Frontend"
        3306   = "MySQL"
        6379   = "Redis"
        8080   = "Jenkins"
        9090   = "Prometheus"
        3001   = "Grafana"
    }
    
    foreach ($port in $ports.GetEnumerator()) {
        $portNumber = $port.Key
        $serviceName = $port.Value
        
        try {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $tcpClient.Connect("localhost", $portNumber)
            $tcpClient.Close()
            Write-Host "✅ 端口 $portNumber ($serviceName) - 连接正常" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ 端口 $portNumber ($serviceName) - 连接失败" -ForegroundColor Red
            Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Gray
        }
    }
}
```

### 2. 防火墙规则审计

```powershell
# 防火墙规则审计
function Audit-FirewallRules {
    Write-Host "?? 防火墙规则审计报告" -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Yellow
    
    # 获取企业级Brain相关规则
    $enterpriseRules = Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Enterprise-Brain*"}
    
    Write-Host "`n📊 规则统计:" -ForegroundColor Cyan
    Write-Host "   总规则数: $($enterpriseRules.Count)" -ForegroundColor White
    Write-Host "   允许规则: $($enterpriseRules | Where-Object {$_.Action -eq 'Allow'} | Count)" -ForegroundColor Green
    Write-Host "   拒绝规则: $($enterpriseRules | Where-Object {$_.Action -eq 'Block'} | Count)" -ForegroundColor Red
    
    Write-Host "`n📋 规则详情:" -ForegroundColor Cyan
    foreach ($rule in $enterpriseRules) {
        $status = if ($rule.Enabled) { "✅ 启用" } else { "❌ 禁用" }
        Write-Host "   $($rule.DisplayName)" -ForegroundColor White
        Write-Host "     状态: $status" -ForegroundColor $(if ($rule.Enabled) {"Green"} else {"Red"})
        Write-Host "     端口: $($rule.LocalPort)" -ForegroundColor Yellow
        Write-Host "     协议: $($rule.Protocol)" -ForegroundColor Yellow
        Write-Host "     操作: $($rule.Action)" -ForegroundColor $(if ($rule.Action -eq "Allow") {"Green"} else {"Red"})
        Write-Host ""
    }
}
```

### 3. 自动化修复脚本

```powershell
# 防火墙问题自动修复
function Repair-FirewallIssues {
    param(
        [switch]$Force
    )
    
    Write-Host "🔧 检查并修复防火墙问题..." -ForegroundColor Yellow
    
    # 检查必要端口
    $requiredPorts = @(80, 3005, 3006, 3306, 6379, 8080, 9090, 3001)
    
    foreach ($port in $requiredPorts) {
        $rule = Get-NetFirewallRule -DisplayName "Enterprise-Brain-Port-$port" -ErrorAction SilentlyContinue
        
        if (-not $rule) {
            Write-Host "⚠️ 端口 $port 缺少防火墙规则，正在创建..." -ForegroundColor Yellow
            
            New-NetFirewallRule -DisplayName "Enterprise-Brain-Port-$port" `
                -Direction Inbound `
                -Protocol TCP `
                -LocalPort $port `
                -Action Allow `
                -Profile Domain,Private,Public `
                -Description "企业级Brain系统端口 $port" `
                -Force:$Force
            
            Write-Host "✅ 已创建端口 $port 的防火墙规则" -ForegroundColor Green
        }
    }
    
    # 检查Docker规则
    $dockerRule = Get-NetFirewallRule -DisplayName "Docker Desktop" -ErrorAction SilentlyContinue
    if (-not $dockerRule) {
        Write-Host "⚠️ Docker Desktop规则缺失，正在创建..." -ForegroundColor Yellow
        
        New-NetFirewallRule -DisplayName "Docker Desktop" `
            -Direction Inbound `
            -Program "C:\Program Files\Docker\Docker\Docker Desktop.exe" `
            -Action Allow `
            -Profile Domain,Private,Public `
            -Description "允许Docker Desktop网络访问" `
            -Force:$Force
        
        Write-Host "✅ 已创建Docker Desktop防火墙规则" -ForegroundColor Green
    }
    
    Write-Host "🎉 防火墙问题修复完成！" -ForegroundColor Green
}
```

## 📊 监控和维护

### 1. 实时监控脚本

```powershell
# 防火墙实时监控
function Start-FirewallMonitoring {
    $logPath = "$env:SystemRoot\system32\LogFiles\Firewall\pfirewall.log"
    
    if (-not (Test-Path $logPath)) {
        Write-Host "❌ 防火墙日志文件不存在，请先启用日志记录" -ForegroundColor Red
        return
    }
    
    Write-Host "🔍 开始监控防火墙日志... (按Ctrl+C停止)" -ForegroundColor Yellow
    
    $lastPosition = 0
    
    while ($true) {
        try {
            if (Test-Path $logPath) {
                $logContent = Get-Content $logPath
                $newLines = $logContent[$lastPosition..($logContent.Count-1)]
                
                foreach ($line in $newLines) {
                    if ($line -match "DROP|DENY") {
                        Write-Host "🚫 阻止连接: $line" -ForegroundColor Red
                    }
                    elseif ($line -match "ALLOW|ACCEPT") {
                        Write-Host "✅ 允许连接: $line" -ForegroundColor Green
                    }
                }
                
                $lastPosition = $logContent.Count
            }
            
            Start-Sleep -Seconds 1
        }
        catch {
            Write-Host "❌ 监控错误: $($_.Exception.Message)" -ForegroundColor Red
            Start-Sleep -Seconds 5
        }
    }
}
```

### 2. 定期维护脚本

```powershell
# 每周防火墙维护
function Weekly-FirewallMaintenance {
    Write-Host "🔧 执行每周防火墙维护..." -ForegroundColor Yellow
    
    # 清理重复规则
    $rules = Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Enterprise-Brain*"}
    $groupedRules = $rules | Group-Object DisplayName
    
    foreach ($group in $groupedRules) {
        if ($group.Count -gt 1) {
            Write-Host "🗑️ 清理重复规则: $($group.Name)" -ForegroundColor Yellow
            $group.Group | Select-Object -Skip 1 | Remove-NetFirewallRule
        }
    }
    
    # 备份当前配置
    $backupPath = "C:\backup\firewall-rules-$(Get-Date -Format 'yyyyMMdd').xml"
    Get-NetFirewallRule | Export-Clixml -Path $backupPath
    
    Write-Host "✅ 防火墙维护完成" -ForegroundColor Green
    Write-Host "📁 备份文件: $backupPath" -ForegroundColor Blue
}

# 调用维护函数
Weekly-FirewallMaintenance
```

## 📋 配置检查清单

### ✅ 基本配置检查
- [ ] 所有企业级Brain端口已开放 (80, 3005, 3006, 3306, 6379, 8080, 9090, 3001)
- [ ] Docker Desktop防火墙规则已创建
- [ ] WSL2网络接口规则已配置
- [ ] Node.js应用程序规则已设置

### ✅ 安全配置检查
- [ ] 网络区域正确配置（专用网络）
- [ ] IP地址访问限制已设置（生产环境）
- [ ] 防火墙日志记录已启用
- [ ] 网络段隔离规则已配置

### ✅ 监控配置检查
- [ ] 端口连接测试脚本可正常运行
- [ ] 防火墙规则审计功能正常
- [ ] 自动修复脚本已配置
- [ ] 实时监控脚本已设置

### ✅ 维护配置检查
- [ ] 定期维护脚本已创建
- [ ] 配置备份机制已建立
- [ ] 故障排除文档已准备
- [ ] 应急响应流程已制定

## 🆘️ 应急响应

### 快速禁用防火墙（紧急情况）
```powershell
# 紧急情况下临时禁用防火墙
Set-NetFirewallProfile -All -Enabled False
Write-Host "⚠️ 防火墙已临时禁用！请及时重新启用。" -ForegroundColor Red
```

### 快速重新启用防火墙
```powershell
# 重新启用防火墙
Set-NetFirewallProfile -All -Enabled True
Write-Host "✅ 防火墙已重新启用" -ForegroundColor Green
```

---

**注意**: 防火墙配置是系统安全的重要组成部分，请在充分理解影响的前提下进行配置修改。
