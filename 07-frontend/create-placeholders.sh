#!/bin/bash

# 创建占位符Vue页面的脚本

PLACEHOLDER_TEMPLATE='<template>
  <div class="placeholder-page">
    <el-card>
      <h2>{{ title }}</h2>
      <el-empty description="此页面正在开发中..." />
    </el-card>
  </div>
</template>

<script setup>
import { ref } from "vue"

const title = ref("TITLE_PLACEHOLDER")
</script>

<style scoped>
.placeholder-page {
  padding: 20px;
}
</style>
'

# 创建目录和文件的函数
create_placeholder() {
    local file_path=$1
    local title=$2
    local dir_path=$(dirname "$file_path")
    
    # 创建目录（如果不存在）
    mkdir -p "$dir_path"
    
    # 创建文件（如果不存在）
    if [ ! -f "$file_path" ]; then
        echo "$PLACEHOLDER_TEMPLATE" | sed "s/TITLE_PLACEHOLDER/$title/" > "$file_path"
        echo "创建: $file_path"
    fi
}

# 进入项目目录
cd /home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend/src/pages

# 系统管理
create_placeholder "system/Overview.vue" "系统总览"
create_placeholder "system/users/UserList.vue" "用户列表"
create_placeholder "system/users/UserForm.vue" "用户表单"
create_placeholder "system/users/UserProfile.vue" "用户资料"
create_placeholder "system/roles/RoleList.vue" "角色列表"
create_placeholder "system/roles/RoleForm.vue" "角色表单"
create_placeholder "system/roles/PermissionManagement.vue" "权限管理"

# 销售管理
create_placeholder "sales/reports/SalesPerformance.vue" "销售业绩"

# 财务管理 - 缺失的页面
create_placeholder "finance/Overview.vue" "财务总览"
create_placeholder "finance/expense/ExpenseList.vue" "费用报销列表"
create_placeholder "finance/expense/ExpenseApproval.vue" "费用报销审批"
create_placeholder "finance/expense/ExpenseStatistics.vue" "费用统计"
create_placeholder "finance/budget/BudgetList.vue" "预算列表"
create_placeholder "finance/budget/BudgetExecution.vue" "预算执行"
create_placeholder "finance/budget/BudgetAnalysis.vue" "预算分析"
create_placeholder "finance/funds/BankAccounts.vue" "银行账户"
create_placeholder "finance/funds/CashFlow.vue" "现金流管理"
create_placeholder "finance/funds/PaymentManagement.vue" "付款管理"
create_placeholder "finance/funds/ReceivableManagement.vue" "应收管理"
create_placeholder "finance/reports/BalanceSheet.vue" "资产负债表"
create_placeholder "finance/reports/IncomeStatement.vue" "利润表"
create_placeholder "finance/reports/CashFlowStatement.vue" "现金流量表"
create_placeholder "finance/reports/CustomReports.vue" "自定义报表"
create_placeholder "finance/tax/TaxDeclaration.vue" "纳税申报"
create_placeholder "finance/tax/TaxPlanning.vue" "税务筹划"
create_placeholder "finance/tax/TaxAnalysis.vue" "税务分析"

echo "占位符页面创建完成！"
