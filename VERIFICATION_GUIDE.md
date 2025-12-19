# ✅ 备料计划功能验证指南

## 📋 修复内容

### 1. 主生产计划"执行排程"功能修复
**文件**: `07-frontend/src/pages/production-planning/ProductionPlanList.vue`

**问题**: 
- 检查 `result.code === 200`，但 `request.js` 响应拦截器已经解包数据
- 导致执行排程失败，无法生成备料计划

**修复**:
```javascript
// ❌ 修复前
if (result && result.code === 200) {
  const materialPlanCount = result.data?.materialPlanCount || 0;
  // ...
}

// ✅ 修复后
const result = await api.executeSchedule(selectedPlan.id);
const materialPlanCount = result?.materialPlanCount || 0;
const processPlanCount = result?.processPlanCount || 0;
```

### 2. 备料计划页面数据加载优化
**文件**: `07-frontend/src/pages/production-planning/MaterialPreparationPlan.vue`

**优化**:
- 添加详细的请求/响应日志
- 显示具体的加载数量
- 更清晰的错误提示

## 🧪 验证步骤

### 步骤1: 后端API验证
```bash
cd /home/sardensy/enterprise-brain/enterpise-brain
node test-material-prep-api.js
```

**期望输出**:
```
✅ 所有测试通过！
📊 测试总结:
   ✅ 数据库连接: 正常
   ✅ 数据总数: 63 条
   ✅ SQL查询: 正常
   ✅ Service调用: 正常
   ✅ 返回格式: { list: [], total: 63, page: 1, pageSize: 20 }
```

### 步骤2: 启动前端服务
```bash
cd /home/sardensy/enterprise-brain/enterpise-brain/07-frontend
npm run dev
```

### 步骤3: 验证备料计划页面
1. 打开浏览器访问：`http://localhost:5173`
2. 登录系统
3. 导航到：**计划管控 → 生产计划 → 备料计划**
4. 检查页面是否正常加载
5. 查看浏览器控制台日志：
   ```
   📤 备料计划请求参数: { page: 1, pageSize: 20, ... }
   📥 备料计划响应数据: { list: [...], total: 63 }
      - list数量: 20
      - total: 63
   ✅ 数据加载成功，共 63 条记录
   ```

### 步骤4: 验证主生产计划"执行排程"
1. 导航到：**计划管控 → 生产计划 → 主生产计划**
2. 选择一条主生产计划
3. 点击"执行排程"按钮
4. 期望结果：
   - ✅ 显示成功提示：`排程执行成功！生成备料计划: X 条`
   - ✅ 备料计划数据增加
   - ✅ 控制台无错误

### 步骤5: 验证数据流
1. 在主生产计划页面执行排程
2. 立即切换到备料计划页面
3. 点击"刷新"按钮
4. 验证新增的备料计划是否显示
5. 检查字段映射是否正确：
   - 来源主计划编号 = 主生产计划编号
   - 物料编号/名称 = BOM子件信息
   - 需求数量 = BOM用量 × 主计划排程数量

## 📊 数据库验证

### 验证备料计划数据
```bash
# 连接MySQL
mysql -u root -p enterprise_brain

# 查看备料计划总数
SELECT COUNT(*) as total FROM material_preparation_plans;

# 查看最新的备料计划
SELECT 
  id, plan_no, source_plan_no, material_code, material_name,
  demand_quantity, demand_date, created_at
FROM material_preparation_plans
ORDER BY created_at DESC
LIMIT 5;
```

## 🔍 问题排查

### 如果备料计划页面加载失败
1. 检查浏览器控制台错误
2. 检查Network请求是否成功（状态码200）
3. 查看响应数据格式是否正确
4. 运行后端API测试脚本验证数据库

### 如果执行排程失败
1. 检查浏览器控制台错误信息
2. 查看后端日志: `tail -f backend/logs/app.log`
3. 验证主生产计划是否已经关联BOM
4. 检查BOM数据是否完整

## ✅ 验证成功标准

- [ ] 后端API测试通过（63条数据）
- [ ] 备料计划页面正常加载
- [ ] 表格显示数据（20条/页，共63条）
- [ ] 主生产计划执行排程成功
- [ ] 新增备料计划数据正确
- [ ] 字段映射符合规则
- [ ] 无控制台错误
- [ ] 分页功能正常

## 📝 注意事项

1. **自动推送已禁用**: 备料计划到工序计划/采购计划的自动推送已暂时禁用
2. **数据格式**: 所有API返回的数据已经过 `request.js` 解包，不包含 `code` 字段
3. **日志输出**: 前端添加了详细的调试日志，便于问题排查
4. **需求日期**: 部分备料计划的需求日期可能为null，这是正常的

## 🚀 下一步工作

完成验证后，可以考虑：
1. 重新启用备料计划的自动推送规则
2. 优化需求日期计算逻辑
3. 补充缺失的字段数据
