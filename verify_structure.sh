#!/bin/bash
echo "=== 项目目录结构验证 ==="

# 检查主要目录
directories=(
    "00-docs/task-assignments/current-tasks"
    "00-docs/task-assignments/task-templates"
    "00-docs/task-management/task-templates"
    "07-frontend/src/pages/finance"
    "07-frontend/src/components/common"
    "07-frontend/src/services/api"
    "08-backend/src/main/java/com/enterprise/brain"
    "08-backend/src/main/resources/db/migration"
    "12-config/environments/development"
)

for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir"
    else
        echo "❌ $dir"
    fi
done

# 检查主要文件
files=(
    "07-frontend/package.json"
    "07-frontend/vite.config.js"
    "08-backend/pom.xml"
    "08-backend/src/main/resources/application.yml"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file"
    fi
done

echo "=== 项目结构创建完成 ==="
