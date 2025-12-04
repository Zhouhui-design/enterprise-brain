#!/bin/bash

##############################################################################
# 企业大脑 - 一键数据恢复快捷脚本
# 适用场景：刚更新IDE后快速恢复数据
##############################################################################

WORKSPACE_ROOT="/home/sardenesy/ai_workspaces/ai_desktop_3"
BACKUP_ROOT="${WORKSPACE_ROOT}/beifenshuju"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          🔄 企业大脑数据快速恢复工具 v1.0                 ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 查找最新备份
echo "🔍 正在查找最新的数据备份..."
LATEST_BACKUP=$(ls -t "${BACKUP_ROOT}"/localStorage_backup_*.json 2>/dev/null | head -n1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ 错误：未找到备份文件！"
    echo ""
    echo "备份文件应该位于: ${BACKUP_ROOT}/"
    echo "文件名格式: localStorage_backup_*.json"
    echo ""
    exit 1
fi

BACKUP_NAME=$(basename "$LATEST_BACKUP")
BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)

echo "✅ 找到最新备份："
echo "   文件: $BACKUP_NAME"
echo "   大小: $BACKUP_SIZE"
echo "   路径: $LATEST_BACKUP"
echo ""

# 检查HTTP服务是否运行
if ! lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "🚀 正在启动数据恢复服务器..."
    cd "$WORKSPACE_ROOT"
    python3 -m http.server 8888 > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 2
    echo "✅ 服务器已启动 (PID: $SERVER_PID)"
    echo ""
else
    echo "ℹ️  恢复服务器已在运行中"
    echo ""
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     📋 操作指南                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "请按照以下步骤操作："
echo ""
echo "步骤1️⃣ - 打开浏览器访问恢复工具"
echo "────────────────────────────────────────────────────────────"
echo "   🔗 http://localhost:8888/scripts/browser-data-restore.html"
echo ""
echo "步骤2️⃣ - 选择备份文件"
echo "────────────────────────────────────────────────────────────"
echo "   1. 点击页面上的 [📁 选择备份文件] 按钮"
echo "   2. 浏览到: $BACKUP_ROOT/"
echo "   3. 选择文件: $BACKUP_NAME"
echo ""
echo "步骤3️⃣ - 恢复数据"
echo "────────────────────────────────────────────────────────────"
echo "   1. 点击 [🔄 恢复数据] 按钮"
echo "   2. 确认恢复操作"
echo "   3. 等待进度条完成"
echo "   4. 查看日志确认成功"
echo ""
echo "步骤4️⃣ - 完成"
echo "────────────────────────────────────────────────────────────"
echo "   1. 恢复完成后刷新页面 (F5)"
echo "   2. 检查数据是否正常"
echo "   3. 返回系统主页开始使用"
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     🔧 快捷方式                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "如果您熟悉浏览器控制台，可以使用快捷恢复："
echo ""
echo "1. 访问系统主页: http://localhost:3001"
echo "2. 按 F12 打开开发者工具"
echo "3. 切换到 Console 标签页"
echo "4. 运行以下命令："
echo ""
echo "   fetch('file://$LATEST_BACKUP')"
echo "     .then(r => r.json())"
echo "     .then(data => {"
echo "       // 恢复代码（见文档）"
echo "     })"
echo ""
echo "详细恢复代码请参考: $WORKSPACE_ROOT/scripts/README.md"
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     ⚠️  注意事项                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  恢复数据会覆盖当前浏览器中的所有数据"
echo "⚠️  建议在恢复前关闭其他系统标签页"
echo "⚠️  恢复完成后务必刷新页面"
echo "⚠️  如遇问题请查看恢复工具的日志输出"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "按 Ctrl+C 可以停止服务器（恢复完成后）"
echo ""

# 询问是否自动打开浏览器
read -p "是否自动在浏览器中打开恢复工具？(y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 正在打开浏览器..."
    
    # 尝试不同的浏览器命令
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:8888/scripts/browser-data-restore.html" 2>/dev/null &
    elif command -v gnome-open &> /dev/null; then
        gnome-open "http://localhost:8888/scripts/browser-data-restore.html" 2>/dev/null &
    elif command -v google-chrome &> /dev/null; then
        google-chrome "http://localhost:8888/scripts/browser-data-restore.html" 2>/dev/null &
    elif command -v firefox &> /dev/null; then
        firefox "http://localhost:8888/scripts/browser-data-restore.html" 2>/dev/null &
    else
        echo "⚠️  无法自动打开浏览器，请手动访问："
        echo "   http://localhost:8888/scripts/browser-data-restore.html"
    fi
    
    echo ""
    echo "✅ 浏览器已打开恢复工具页面"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "服务器正在运行中，按 Ctrl+C 停止..."
echo "════════════════════════════════════════════════════════════"
echo ""

# 保持脚本运行
wait
