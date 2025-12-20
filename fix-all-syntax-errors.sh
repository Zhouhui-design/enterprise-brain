#!/bin/bash

# 修复所有工序计划服务文件的语法错误
# 问题：缺少右括号来关闭 if (data.productCode) { 语句块

cd /home/sardensy/enterprise-brain/enterpise-brain/backend/services

echo "🔧 开始修复所有工序计划服务的语法错误..."

for file in *ProcessPlanService.js; do
  if [ -f "$file" ]; then
    echo "📝 检查文件: $file"
    
    # 检查是否有语法错误
    if ! node -c "$file" 2>&1 | grep -q "SyntaxError"; then
      echo "   ✅ 语法正确，跳过"
      continue
    fi
    
    # 查找缺少右括号的行
    # 特征：包含 "// ✅ 计划结束日期" 的前一行应该有 "}"
    line_num=$(grep -n "// ✅ 计划结束日期" "$file" | head -1 | cut -d: -f1)
    
    if [ -n "$line_num" ]; then
      prev_line=$((line_num - 1))
      # 检查前一行是否已经有右括号
      if ! sed -n "${prev_line}p" "$file" | grep -q "^      }"; then
        echo "   🔧 修复: 在第 $line_num 行之前添加缺失的右括号"
        sed -i "${line_num}i\      }" "$file"
      fi
    fi
    
    # 再次检查
    if node -c "$file" 2>&1 | grep -q "SyntaxError"; then
      echo "   ❌ 修复失败，仍有语法错误"
    else
      echo "   ✅ 修复成功"
    fi
  fi
done

echo ""
echo "✅ 批量修复完成！"
