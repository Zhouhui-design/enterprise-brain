#!/bin/bash

echo "=== 安装同步脚本 ==="

# 创建脚本
cat > push_backup.sh << 'SCRIPT_EOF'
#!/bin/bash
# 推送脚本内容...
# 这里放上面完整的push_backup.sh内容
SCRIPT_EOF

cat > pull_restore.sh << 'SCRIPT_EOF'
#!/bin/bash
# 拉取脚本内容...
# 这里放上面完整的pull_restore.sh内容
SCRIPT_EOF

cat > sync_manager.sh << 'SCRIPT_EOF'
#!/bin/bash
# 管理脚本内容...
# 这里放上面完整的sync_manager.sh内容
SCRIPT_EOF

# 设置权限
chmod +x push_backup.sh pull_restore.sh sync_manager.sh

echo "✓ 脚本已创建"
echo ""
echo "使用方法："
echo "  ./push_backup.sh    # 推送"
echo "  ./pull_restore.sh   # 拉取"
echo "  ./sync_manager.sh   # 管理菜单"
