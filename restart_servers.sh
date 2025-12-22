#!/bin/bash

# 停止所有服务器进程的函数
stop_servers() {
    echo "🔄 正在停止所有服务器进程..."
    
    # 停止所有后端服务器 (node server.js)
    pkill -f "node --max-old-space-size=512 backend/server.js"
    
    # 停止所有前端开发服务器 (vite)
    pkill -f "npm run dev"
    pkill -f "vite"
    
    echo "✅ 所有服务器进程已停止"
}

# 清除缓存的函数
clear_cache() {
    echo "🔄 正在清除缓存..."
    
    # 清除前端node_modules中的缓存
    if [ -d "07-frontend/node_modules/.vite" ]; then
        rm -rf "07-frontend/node_modules/.vite"
        echo "✅ Vite缓存已清除"
    fi
    
    # 清除npm缓存
    npm cache clean --force
    echo "✅ NPM缓存已清除"
    
    # 清除临时文件
    find . -name "*.log" -o -name "*.pid" | xargs rm -f 2>/dev/null
    echo "✅ 临时文件已清除"
}

# 重启服务器的函数
restart_servers() {
    echo "🔄 正在重启服务器..."
    
    # 启动后端服务器
    echo "📡 启动后端服务器..."
    node --max-old-space-size=512 backend/server.js &
    sleep 3  # 等待服务器启动
    
    # 启动前端开发服务器
    echo "🎨 启动前端开发服务器..."
    cd 07-frontend && npm run dev &
    cd ..
    
    echo "✅ 所有服务器已重启"
    echo ""
    echo "🚀 服务器启动完成！"
    echo "📡 后端服务: http://localhost:3005"
    echo "🎨 前端服务: http://localhost:5173"
}

# 主函数
main() {
    echo "📦 Enterprise Brain 服务器管理脚本"
    echo "===================================="
    
    # 停止所有服务器
    stop_servers
    
    # 清除缓存
    clear_cache
    
    # 重启服务器
    restart_servers
    
    echo ""
    echo "✅ 操作完成！"
}

# 执行主函数
main