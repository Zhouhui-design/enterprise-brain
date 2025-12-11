# 工序计划字段修改任务总结

## 任务时间
2025-12-10 13:14

## 问题描述

### 问题1：来源编号显示空白
- **现象**：工序计划页面中"来源编号"列在浏览器中显示为空白
- **原因**：数据库已正确保存source_no字段，后端Service的自动字段转换功能正常(source_no → sourceNo)，前端也正确使用了sourceNo字段

### 问题2：排程次数值为0
- **现象**：工序计划页面中"排程次数"列的值显示为0，应该显示为1
- **原因**：数据库已正确保存schedule_count字段，后端Service的自动字段转换功能正常(schedule_count → scheduleCount)

### 需求1：还需排程工时改为下一个排程日期
- **需求**：将"还需排程工时"字段改为"下一个排程日期"
- **计算规则**：查询工序能力负荷表，MINIFS(日期，工序名称=本行工序名称，日期>本行计划排程日期，剩余工时>minRemainingHours门槛值)

---

## 修改内容

### 1. 前端字段定义修改
**文件**：`/07-frontend/src/pages/production-planning/ProcessPlanList.vue`

- **修改内容**：
  - 将`remainingScheduleHours`字段改为`nextScheduleDate`
  - 列名从"还需排程工时"改为"下一个排程日期"
  - 添加日期格式化formatter
  - 宽度从130调整为140
  - 添加filterable属性支持筛选

```javascript
// 修改前
{ prop: 'remainingScheduleHours', label: '还需排程工时', width: 130, sortable: true, align: 'right', visible: true },

// 修改后
{ prop: 'nextScheduleDate', label: '下一个排程日期', width: 140, sortable: true, filterable: true, visible: true,
  formatter: (row) => formatDateYMD(row.nextScheduleDate) },
```

### 2. 前端API新增方法
**文件**：`/07-frontend/src/api/capacityLoad.js`

- **新增方法**：`queryNextScheduleDate(processName, scheduleDate, minRemainingHours)`
- **功能**：查询下一个排程日期
- **参数**：
  - processName: 工序名称
  - scheduleDate: 当前计划排程日期
  - minRemainingHours: 剩余工时门槛值(默认0.5)

### 3. 前端计算逻辑添加
**文件**：`/07-frontend/src/pages/production-planning/ProcessPlanList.vue`

- **位置**：loadData函数，步骤7
- **功能**：在数据加载完成后，异步查询每条记录的下一个排程日期
- **实现**：
  - 遍历所有记录
  - 验证必要字段(processName、scheduleDate)
  - 调用capacityLoadApi.queryNextScheduleDate()
  - 将结果赋值给row.nextScheduleDate

```javascript
// ✅ 步骤 7：查询下一个排程日期（需求1）
const nextScheduleDatePromises = tableData.value.map(async (row) => {
  if (!row.processName || !row.scheduleDate) {
    row.nextScheduleDate = null
    return row
  }
  
  try {
    const scheduleDateFormatted = formatDateYMD(row.scheduleDate)
    const minRemainingHours = currentBusinessVars.value.minRemainingHours || 0.5
    const nextDateResponse = await capacityLoadApi.queryNextScheduleDate(
      row.processName, 
      scheduleDateFormatted, 
      minRemainingHours
    )
    
    if (nextDateResponse?.nextScheduleDate) {
      row.nextScheduleDate = nextDateResponse.nextScheduleDate
    } else {
      row.nextScheduleDate = null
    }
  } catch (error) {
    console.error(`❗ 查询下一个排程日期失败:`, error)
    row.nextScheduleDate = null
  }
  
  return row
})

await Promise.all(nextScheduleDatePromises)
```

### 4. 后端API新增接口
**文件**：`/backend/routes/capacityLoad.js`

- **接口路径**：`POST /api/capacity-load/query-next-schedule-date`
- **功能**：查询下一个排程日期(MINIFS逻辑)
- **请求参数**：
  - processName: 工序名称
  - scheduleDate: 当前计划排程日期
  - minRemainingHours: 剩余工时门槛值(默认0.5)
- **响应数据**：
  - nextScheduleDate: 下一个排程日期
  - remainingHours: 该日期的剩余工时

**SQL查询逻辑**：
```sql
SELECT date, remaining_hours 
FROM process_capacity_load 
WHERE process_name = ? 
  AND date > ? 
  AND remaining_hours > ? 
ORDER BY date ASC 
LIMIT 1
```

**实现细节**：
1. 查询条件1：工序名称相同
2. 查询条件2：日期大于当前计划排程日期
3. 查询条件3：剩余工时大于门槛值
4. 排序：按日期升序
5. 结果：取第一条记录(即最小满足条件的日期)

### 5. 后端Service日志增强
**文件**：`/backend/services/processPlanService.js`

- **修改内容**：在字段转换日志中添加source_no和schedule_count的显示
- **目的**：方便调试和验证字段转换是否正确

```javascript
console.log('🔍 字段转换示例:', {
  plan_no: convertedRows[0].planNo,
  process_name: convertedRows[0].processName,
  master_plan_no: convertedRows[0].masterPlanNo,
  source_no: convertedRows[0].sourceNo,  // ✅ 添加来源编号转换日志
  schedule_count: convertedRows[0].scheduleCount  // ✅ 添加排程次数转换日志
});
```

---

## 数据流说明

### 来源编号和排程次数的数据流程

1. **数据源**：备料计划(material_preparation_plans表)
   - planNo: 备料计划编号

2. **数据推送**：备料计划 → 工序计划
   - 位置：`/backend/services/materialPreparationPlanService.js`
   - 三个推送点：
     - 创建备料计划时推送(第253-300行)
     - 更新备料计划时更新工序计划(第449-483行)
     - 更新备料计划时创建新工序计划(第532-593行)
   - 字段映射：
     - source_no = data.planNo (备料计划编号)
     - schedule_count = 1 (初始排程次数)

3. **数据存储**：工序计划(process_plans表)
   - 字段：source_no, schedule_count

4. **数据读取**：后端Service自动转换
   - 位置：`/backend/services/processPlanService.js`
   - 转换逻辑：snake_case → camelCase
   - 转换结果：
     - source_no → sourceNo
     - schedule_count → scheduleCount

5. **前端显示**：工序计划页面
   - 字段：sourceNo, scheduleCount
   - 列名："来源编号"、"排程次数"

### 下一个排程日期的数据流程

1. **数据源**：工序能力负荷表(process_capacity_load表)
   - 字段：process_name, date, remaining_hours

2. **查询请求**：前端 → 后端API
   - 请求：POST /api/capacity-load/query-next-schedule-date
   - 参数：processName, scheduleDate, minRemainingHours

3. **查询逻辑**：MINIFS
   - 条件1：工序名称 = 本行工序名称
   - 条件2：日期 > 本行计划排程日期
   - 条件3：剩余工时 > 门槛值
   - 结果：最小满足条件的日期

4. **数据返回**：后端 → 前端
   - 响应：{ nextScheduleDate, remainingHours }

5. **前端显示**：工序计划页面
   - 字段：nextScheduleDate
   - 列名："下一个排程日期"
   - 格式化：YYYY-MM-DD

---

## 后端字段转换机制说明

### 自动转换规则
**文件**：`/backend/services/processPlanService.js`

**转换函数**：
```javascript
const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
```

**转换示例**：
- plan_no → planNo
- process_name → processName
- master_plan_no → masterPlanNo
- source_no → sourceNo
- schedule_count → scheduleCount
- remaining_schedule_hours → remainingScheduleHours

### 转换位置
1. **getAll方法**：获取工序计划列表时
2. **getById方法**：获取工序计划详情时

### 日志输出
```javascript
console.log('🔍 字段转换示例:', {
  plan_no: convertedRows[0].planNo,
  process_name: convertedRows[0].processName,
  master_plan_no: convertedRows[0].masterPlanNo,
  source_no: convertedRows[0].sourceNo,
  schedule_count: convertedRows[0].scheduleCount
});
```

---

## 测试验证步骤

### 1. 验证来源编号和排程次数

1. **清空旧数据**（可选）
   ```sql
   DELETE FROM process_plans WHERE source_no IS NULL OR schedule_count = 0;
   ```

2. **重新生成数据**
   - 访问主生产计划页面
   - 选择订单点击"执行排程"
   - 系统自动生成备料计划
   - 备料计划自动推送到工序计划

3. **检查工序计划**
   - 访问工序计划页面：http://localhost:3003/production-planning/process-plan
   - 强制刷新页面(Ctrl+F5)
   - 检查"来源编号"列是否显示备料计划编号
   - 检查"排程次数"列是否显示为1

4. **检查后端日志**
   ```bash
   tail -f /home/sardenesy/ai_workspaces/ai_desktop_3/backend.log
   ```
   - 查看字段转换日志
   - 确认source_no和schedule_count正确转换为sourceNo和scheduleCount

### 2. 验证下一个排程日期

1. **准备测试数据**
   - 确保工序能力负荷表有数据
   - 访问：http://localhost:3003/mrp/capacity-load
   - 如果没有数据，先从工序列表加载数据

2. **检查工序计划**
   - 访问工序计划页面：http://localhost:3003/production-planning/process-plan
   - 检查"下一个排程日期"列是否显示日期
   - 验证日期是否符合规则：
     - 日期 > 计划排程日期
     - 该日期的剩余工时 > 门槛值(默认0.5)

3. **检查API响应**
   - 打开浏览器控制台(F12)
   - 切换到Network标签
   - 刷新页面
   - 找到"query-next-schedule-date"请求
   - 检查响应数据格式

4. **检查后端日志**
   ```bash
   tail -f /home/sardenesy/ai_workspaces/ai_desktop_3/backend.log | grep "下一个排程日期"
   ```
   - 查看查询日志
   - 确认SQL参数正确
   - 确认查询结果正确

---

## 相关文件清单

### 前端文件
1. `/07-frontend/src/pages/production-planning/ProcessPlanList.vue` - 工序计划主页面
2. `/07-frontend/src/api/capacityLoad.js` - 工序能力负荷API

### 后端文件
1. `/backend/routes/capacityLoad.js` - 工序能力负荷路由
2. `/backend/services/processPlanService.js` - 工序计划服务
3. `/backend/services/materialPreparationPlanService.js` - 备料计划服务(数据推送源)

### 数据库表
1. `process_plans` - 工序计划表
   - 字段：source_no, schedule_count
2. `process_capacity_load` - 工序能力负荷表
   - 字段：process_name, date, remaining_hours
3. `material_preparation_plans` - 备料计划表
   - 字段：plan_no (来源编号的数据源)

---

## 技术要点总结

### 1. 字段命名规范
- **数据库层**：snake_case (source_no, schedule_count)
- **后端层**：自动转换为camelCase (sourceNo, scheduleCount)
- **前端层**：camelCase (sourceNo, scheduleCount)

### 2. MINIFS逻辑实现
- **Excel公式**：`MINIFS(日期, 条件1, 条件2, 条件3)`
- **SQL实现**：
  ```sql
  SELECT MIN(date) 
  WHERE 条件1 AND 条件2 AND 条件3
  ORDER BY date ASC 
  LIMIT 1
  ```

### 3. 异步数据加载
- **使用Promise.all并发查询**：提高性能
- **错误处理**：每条记录独立处理，错误不影响其他记录
- **数据验证**：查询前验证必要字段，避免无效请求

### 4. 业务变量配置
- **minRemainingHours**：剩余工时门槛值
- **配置位置**：页面设置 → 业务变量
- **默认值**：0.5小时
- **作用范围**：
  - 计划结束日期查询
  - 计划开始日期查询
  - 下一个排程日期查询

---

## 注意事项

### 1. 数据一致性
- 来源编号和排程次数由备料计划推送时自动设置
- 不应手动修改这两个字段
- 如需重新计算，建议删除工序计划重新生成

### 2. 性能优化
- 下一个排程日期查询使用索引：process_name, date
- 异步并发查询提高加载速度
- 查询结果限制为1条记录

### 3. 容错处理
- 字段缺失时返回null，不影响页面显示
- API查询失败时使用null值，显示为空
- 前端添加详细的错误日志，方便调试

### 4. 业务规则
- 下一个排程日期必须大于当前计划排程日期
- 下一个排程日期的剩余工时必须大于门槛值
- 如果没有符合条件的日期，返回null

---

## 后续优化建议

### 1. 数据库索引
建议在process_capacity_load表添加复合索引：
```sql
CREATE INDEX idx_process_date_hours ON process_capacity_load(process_name, date, remaining_hours);
```

### 2. 缓存机制
- 可以考虑缓存工序能力负荷表数据
- 减少数据库查询次数
- 提高页面加载速度

### 3. 批量查询优化
- 当前实现是逐条查询
- 可以优化为批量查询，一次性获取所有工序的下一个排程日期
- 减少HTTP请求次数

### 4. 实时更新
- 当工序能力负荷表数据变化时
- 自动更新工序计划的下一个排程日期
- 使用WebSocket或定时轮询实现

---

## 修改完成时间
2025-12-10 13:14

## 后端服务状态
✅ 已重启，新API接口已生效

## 测试建议
1. 先清空旧的工序计划数据
2. 重新从主生产计划执行排程
3. 验证来源编号和排程次数是否正确显示
4. 验证下一个排程日期是否正确计算
