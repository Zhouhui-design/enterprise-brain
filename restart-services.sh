#!/bin/bash

# 企业大脑项目一键重启服务脚本
# 功能：停止所有服务、清理缓存、重启后端和前端服务

echo "=== 企业大脑项目服务重启脚本 ==="
echo ""

# 定义项目根目录
PROJECT_ROOT="/home/sardensy/enterprise-brain/enterpise-brain"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/07-frontend"

# 检查目录是否存在
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ 后端目录不存在: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ 前端目录不存在: $FRONTEND_DIR"
    exit 1
fi

echo "📁 项目根目录: $PROJECT_ROOT"
echo "🔧 后端目录: $BACKEND_DIR"
echo "🎨 前端目录: $FRONTEND_DIR"
echo ""

# 函数：停止所有Node.js进程
stop_all_services() {
    echo "🛑 正在停止所有Node.js服务进程..."
    
    # 停止后端进程
    pkill -f "node.*server.js" 2>/dev/null && echo "✅ 后端服务已停止" || echo "ℹ️ 没有找到运行的后端服务"
    
    # 停止前端开发服务器
    pkill -f "npm run dev" 2>/dev/null && echo "✅ 前端开发服务器已停止" || echo "ℹ️ 没有找到运行的前端服务"
    
    # 等待进程完全停止
    sleep 2
    echo ""
}

# 函数：清理前端缓存
clean_frontend_cache() {
    echo "🧹 正在清理前端缓存..."
    cd "$FRONTEND_DIR"
    
    # 清理Vite缓存
    if [ -d "node_modules/.vite" ]; then
        rm -rf node_modules/.vite
        echo "✅ Vite缓存已清理"
    else
        echo "ℹ️ 未找到Vite缓存目录"
    fi
    
    # 清理dist目录
    if [ -d "dist" ]; then
        rm -rf dist
        echo "✅ 构建目录已清理"
    fi
    
    echo ""
}

# 函数：重启后端服务
restart_backend() {
    echo "🚀 正在启动后端服务..."
    cd "$BACKEND_DIR"
    
    # 检查node_modules是否存在
    if [ ! -d "node_modules" ]; then
        echo "📦 安装后端依赖..."
        npm install
    fi
    
    # 启动后端服务（后台运行）
    nohup node --max-old-space-size=512 server.js > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PROJECT_ROOT/07-frontend/logs/backend.pid"
    
    # 等待服务启动
    sleep 3
    
    # 检查服务是否正常启动
    if ps -p $BACKEND_PID > /dev/null; then
        echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
        echo "📊 后端日志文件: $BACKEND_DIR/backend.log"
    else
        echo "❌ 后端服务启动失败"
        echo "🔍 请检查日志文件: $BACKEND_DIR/backend.log"
    fi
    
    echo ""
}

# 函数：重启前端服务
restart_frontend() {
    echo "🎨 正在启动前端开发服务器..."
    cd "$FRONTEND_DIR"
    
    # 检查node_modules是否存在
    if [ ! -d "node_modules" ]; then
        echo "📦 安装前端依赖..."
        npm install
    fi
    
    # 启动前端开发服务器（后台运行）
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$FRONTEND_DIR/logs/frontend.pid"
    
    # 等待服务启动
    echo "⏳ 等待前端服务启动..."
    sleep 5
    
    # 检查服务是否正常启动
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "✅ 前端开发服务器已启动 (PID: $FRONTEND_PID)"
        echo "📊 前端日志文件: $FRONTEND_DIR/frontend.log"
        echo "🌐 前端服务地址: http://localhost:5173"
    else
        echo "❌ 前端服务启动失败"
        echo "🔍 请检查日志文件: $FRONTEND_DIR/frontend.log"
    fi
    
    echo ""
}

# 函数：检查服务状态
check_services_status() {
    echo "🔍 检查服务状态..."
    
    # 检查后端服务
    BACKEND_PID=$(cat "$PROJECT_ROOT/07-frontend/logs/backend.pid" 2>/dev/null)
    if [ -n "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null; then
        echo "✅ 后端服务运行中 (PID: $BACKEND_PID)"
    else
        echo "❌ 后端服务未运行"
    fi
    
    # 检查前端服务
    FRONTEND_PID=$(cat "$FRONTEND_DIR/logs/frontend.pid" 2>/dev/null)
    if [ -n "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null; then
        echo "✅ 前端服务运行中 (PID: $FRONTEND_PID)"
    else
        echo "❌ 前端服务未运行"
    fi
    
    echo ""
}

# 主执行流程
main() {
    case "${1:-restart}" in
        "stop")
            stop_all_services
            ;;
        "clean")
            clean_frontend_cache
            ;;
        "start")
            restart_backend
            restart_frontend
            ;;
        "status")
            check_services_status
            ;;
        "restart"|"*")
            stop_all_services
            clean_frontend_cache
            restart_backend
            restart_frontend
            check_services_status
            ;;
    esac
    
    echo "=== 脚本执行完成 ==="
}

# 显示使用说明
show_usage() {
    echo "使用方法:"
    echo "  ./restart-services.sh [命令]"
    echo ""
    echo "可用命令:"
    echo "  restart  - 重启所有服务（默认）"
    echo "  stop     - 停止所有服务"
    echo "  clean    - 清理前端缓存"
    echo "  start    - 启动所有服务"
    echo "  status   - 检查服务状态"
    echo ""
}

# 处理帮助参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

# 执行主函数
main "$@"