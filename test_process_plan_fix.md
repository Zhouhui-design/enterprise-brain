# 工序计划问题修复说明

## 修复内容

### 问题1: 计划开始日期显示错误 ✅

**问题描述**:
- 工序计划编号: PP2025977064812
- 计划结束日期: 2026-01-06 (正确)
- 计划开始日期: 浏览器显示2025-12-16 (错误)

**根本原因**:
- 后端返回字符串日期(如"2026-01-06")
- 前端使用`new Date(row.planStartDate)`时因时区问题导致日期偏移
- 使用`toISOString()`会产生UTC时间,与本地时间不一致

**修复方案**:
1. 改用字符串分割和手动构造日期对象,指定年月日(避免时区影响)
2. 真计划开始日期直接计算为YYYY-MM-DD格式字符串
3. 移除formatter中的重复计算,直接格式化已计算好的字段

**修复代码**:
```javascript
// 旧代码(有问题)
const startDate = new Date(row.planStartDate)
startDate.setDate(startDate.getDate() + 1)
row.realPlanStartDate = startDate.toISOString()

// 新代码(正确)
const [year, month, day] = row.planStartDate.split('-').map(Number)
const startDate = new Date(year, month - 1, day)  // 月份从0开始
startDate.setDate(startDate.getDate() + 1)
const realYear = startDate.getFullYear()
const realMonth = String(startDate.getMonth() + 1).padStart(2, '0')
const realDay = String(startDate.getDate()).padStart(2, '0')
row.realPlanStartDate = `${realYear}-${realMonth}-${realDay}`
```

---

### 问题2: 自增数据未继续生成 ✅

**问题描述**:
- 工序计划编号: PP2025206577610
- 未排数量: 116.00 (>0)
- 期望: 应该继续自增生成新记录
- 实际: 没有继续生成

**根本原因**:
- 代码第869行硬编码: `maxNewRecords = 3`
- 临时限制最多生成3条新记录
- 当已经生成3条后,即使还有未排数量>0的记录也不再继续

**修复方案**:
1. 将`maxNewRecords`从3调整为100(防止无限循环的安全上限)
2. 允许自动循环直到所有记录的未排数量都=0

**修复代码**:
```javascript
// 旧代码(有问题)
let maxNewRecords = 3  // ⚠️ 临时限制:最多生成3条新记录

// 新代码(正确)
let maxNewRecords = 100  // ✅ 取消临时限制:允许生成最多100条新记录(防止无限循环)
```

---

## 验证步骤

### 验证问题1(计划开始日期):
1. 强制刷新页面(Ctrl+F5)
2. 找到工序计划编号=PP2025977064812的记录
3. 检查:
   - 计划结束日期应为: 2026-01-06
   - 计划开始日期应正确显示(根据需求工时反推)
   - 真计划开始日期 = 计划开始日期 + 1天
   - 计划排程日期 = 真计划开始日期

### 验证问题2(自增数据):
1. 找到工序计划编号=PP2025206577610的记录
2. 检查"未排数量"字段
3. 如果未排数量>0,应该看到:
   - 自动生成的新记录(排程次数递增)
   - 新记录的计划排程日期=上一条的"下一个排程日期"
   - 新记录继续计算未排数量
   - 直到所有记录的未排数量都=0

---

## 技术要点

### 时区安全的日期处理:
```javascript
// ❌ 错误方式(会受时区影响)
const date = new Date("2026-01-06")  // 可能变成2026-01-05或2026-01-07
date.toISOString()  // 返回UTC时间

// ✅ 正确方式(不受时区影响)
const [year, month, day] = "2026-01-06".split('-').map(Number)
const date = new Date(year, month - 1, day)  // 明确指定年月日
// 格式化为YYYY-MM-DD字符串
const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
```

### 自增循环安全机制:
1. `maxNewRecords = 100`: 防止无限循环
2. `processedRecords.add()`: 防止同一条记录重复生成
3. `iteration++`: 记录循环次数便于调试
4. 详细日志: 每轮输出生成记录数和原因

---

## 影响范围
- 文件: `/home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend/src/pages/production-planning/ProcessPlanList.vue`
- 修改行数: 约35行
- 影响字段:
  - 计划开始日期
  - 真计划开始日期
  - 计划排程日期
  - 自增记录生成逻辑

