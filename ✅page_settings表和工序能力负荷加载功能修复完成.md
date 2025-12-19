# ✅ page_settings表和工序能力负荷加载功能修复完成

**修复时间**: 2025-12-19  
**问题**: 点击"加载到工序能力负荷表"报错 `Table 'enterprise_brain.page_settings' doesn't exist`  

---

## 📋 问题描述

### 用户操作路径
```
http://localhost:3003/manufacturing/process (工序列表)
  ↓ 批量选择工序
  ↓ 点击"加载到工序能力负荷表"按钮
  ❌ 报错: Table 'enterprise_brain.page_settings' doesn't exist
```

### 预期功能
点击"加载到工序能力负荷表"按钮后：
1. 筛选出"自制/外协" = "自制"的工序
2. 调用后端API `/api/capacity-load/load-from-processes`
3. 自动生成工序能力负荷表数据（未来120天）
4. 数据包含：工序名称、日期、可用工位、上班时段、剩余工时等

---

## 🔧 修复方案

### 1. 创建 `page_settings` 表

**表结构**:
```sql
CREATE TABLE IF NOT EXISTS `page_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `page_key` varchar(100) NOT NULL COMMENT '页面标识',
  `setting_key` varchar(100) NOT NULL COMMENT '设置键',
  `setting_value` text COMMENT '设置值',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_page_setting` (`page_key`,`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='页面设置表';
```

**默认数据**:
```sql
INSERT INTO `page_settings` VALUES 
(1,'capacity-load','displayDays','120','2025-12-08 09:30:38','2025-12-08 09:30:38'),
(2,'company-calendar','daysBeforeToday','90','2025-12-08 10:15:50','2025-12-08 10:15:50'),
(3,'company-calendar','daysAfterToday','180','2025-12-08 10:15:50','2025-12-08 23:02:07'),
(4,'company-calendar','standardWorkHours','8','2025-12-08 10:15:50','2025-12-08 10:15:50'),
(5,'company-calendar','weekendMode','single','2025-12-08 10:15:50','2025-12-08 23:02:07');
```

**执行恢复**:
```bash
mysql -u root -pzH754277289hUi~197547 enterprise_brain < restore_page_settings_table.sql
```

### 2. 修复前端API地址

**问题**: 前端硬编码了错误的API地址
```javascript
// ❌ 错误的硬编码地址
const response = await fetch('http://192.168.2.229:3005/api/capacity-load/load-from-processes', {
```

**修复**: 使用相对路径
```javascript
// ✅ 正确的相对路径
const response = await fetch('/api/capacity-load/load-from-processes', {
```

**文件位置**: `07-frontend/src/pages/manufacturing/ProcessList.vue:623`

---

## ✅ 功能验证

### 1. page_settings 表数据验证
```javascript
✅ page_settings表数据:
  - capacity-load / displayDays = 120
  - company-calendar / daysBeforeToday = 90
  - company-calendar / daysAfterToday = 180
  - company-calendar / standardWorkHours = 8
  - company-calendar / weekendMode = single
```

### 2. 加载到工序能力负荷表功能流程

#### 前端逻辑 (`ProcessList.vue:594-643`)
```javascript
const handleLoadToCapacityTable = async () => {
  // 1. 筛选自制工序
  const selfMadeProcesses = selectedRows.value.filter(row => 
    row.selfOrOutsource === '自制'
  )
  
  if (selfMadeProcesses.length === 0) {
    ElMessage.warning('请选择至少一个"自制/外协" 为 "自制" 的工序')
    return
  }
  
  // 2. 确认对话框
  await ElMessageBox.confirm(
    `共选择了 ${selectedRows.value.length} 个工序，其中 ${selfMadeProcesses.length} 个为"自制"工序。确定加载到工序能力负荷表吗？`
  )
  
  // 3. 准备数据
  const processes = selfMadeProcesses.map(row => ({
    processName: row.processName,
    availableWorkstations: row.availableWorkstations || 0
  }))
  
  // 4. 调用后端API
  const response = await fetch('/api/capacity-load/load-from-processes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ processes })
  })
}
```

#### 后端逻辑 (`backend/routes/capacityLoad.js:957-1073`)

**核心处理流程**:
```javascript
router.post('/load-from-processes', async (req, res) => {
  const { processes } = req.body; // [{processName, availableWorkstations}]
  
  // 1. 获取显示天数配置
  const [settingRows] = await connection.execute(
    "SELECT setting_value FROM page_settings 
     WHERE page_key = 'capacity-load' AND setting_key = 'displayDays'"
  );
  const displayDays = parseInt(settingRows[0].setting_value) || 120;
  
  // 2. 为每个工序生成未来N天的数据
  for (const process of processes) {
    for (let i = 0; i < displayDays; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateStr = `${year}-${month}-${day}`;
      
      // 3. 查询企业日历的标准上班时长
      const [calendarRows] = await connection.execute(
        'SELECT standard_work_hours FROM company_calendar WHERE calendar_date = ?',
        [dateStr]
      );
      
      let workShift = null;
      if (calendarRows.length > 0 && calendarRows[0].standard_work_hours > 0) {
        workShift = parseFloat(calendarRows[0].standard_work_hours).toFixed(2);
      }
      
      // 4. 计算初始剩余工时和剩余时段
      const remainingHours = (workShift × availableWorkstations) - 0;
      const remainingShift = remainingHours ÷ availableWorkstations;
      
      // 5. 插入或更新数据
      await connection.execute(`
        INSERT INTO process_capacity_load (
          process_name, date, available_workstations,
          work_shift, occupied_hours, remaining_shift, remaining_hours, overtime_shift
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        ON DUPLICATE KEY UPDATE
          available_workstations = VALUES(available_workstations),
          work_shift = VALUES(work_shift),
          remaining_hours = VALUES(remaining_hours),
          remaining_shift = VALUES(remaining_shift)
      `, [processName, dateStr, availableWorkstations, workShift, 0, remainingShift, remainingHours]);
    }
  }
});
```

### 3. 计算规则

#### 字段说明
| 字段名 | 说明 | 计算规则 |
|--------|------|---------|
| `process_name` | 工序名称 | 从工序表获取 |
| `date` | 日期 | 当天 + i天（i=0~119） |
| `available_workstations` | 可用工位数量 | 从工序表获取 |
| `work_shift` | 上班时段(小时) | 从企业日历的`standard_work_hours`获取 |
| `occupied_hours` | 已占用工时 | 初始为0，排程后累加 |
| `remaining_hours` | 剩余工时 | `(上班时段 × 可用工位) - 已占用工时` |
| `remaining_shift` | 剩余时段 | `剩余工时 ÷ 可用工位` |
| `overtime_shift` | 加班时段 | 初始为NULL |

#### 计算示例
假设某工序：
- 工序名称: "打包"
- 可用工位: 2
- 某天上班时段: 8小时
- 已占用工时: 0

**计算过程**:
```
剩余工时 = (8 × 2) - 0 = 16小时
剩余时段 = 16 ÷ 2 = 8小时
```

---

## 📊 page_settings 配置说明

### 工序能力负荷表配置
```javascript
page_key: 'capacity-load'
  - displayDays: '120'  // 显示未来120天
```

### 企业日历配置
```javascript
page_key: 'company-calendar'
  - daysBeforeToday: '90'        // 过去90天
  - daysAfterToday: '180'        // 未来180天
  - standardWorkHours: '8'       // 标准工作小时数
  - weekendMode: 'single'        // 单休模式
```

---

## 🎯 操作指南

### 1. 访问工序列表
```
URL: http://localhost:3003/manufacturing/process
```

### 2. 加载工序到能力负荷表

**步骤**:
1. 在工序列表中**批量选择**需要加载的工序（勾选复选框）
2. 点击表格上方的**"加载到工序能力负荷表"**按钮
3. 系统会自动筛选"自制/外协" = "自制"的工序
4. 弹出确认对话框，显示选择的工序数量
5. 点击"确定"后，系统开始生成数据
6. 成功后显示：`成功加载N个工序，生成X条新记录，更新Y条记录`

**注意事项**:
- ⚠️ 只有"自制/外协" = "自制"的工序才会被加载
- ⚠️ 外协工序会被自动过滤掉
- ⚠️ 如果全部选择的都是外协工序，会提示错误

### 3. 查看生成的能力负荷数据

**访问能力负荷表**:
```
URL: http://localhost:3003/mrp/capacity-load
```

**验证数据**:
- 检查工序名称是否正确
- 检查日期范围是否为未来120天
- 检查可用工位数量是否正确
- 检查上班时段是否从企业日历获取
- 检查剩余工时 = (上班时段 × 可用工位) - 已占用工时
- 检查剩余时段 = 剩余工时 ÷ 可用工位

---

## 🔄 与企业日历的集成

### 数据流
```
企业日历 (company_calendar)
  ↓ 查询 standard_work_hours
  ↓
工序能力负荷表 (process_capacity_load)
  ↓ work_shift = standard_work_hours
  ↓ remaining_hours = (work_shift × available_workstations) - occupied_hours
  ↓ remaining_shift = remaining_hours ÷ available_workstations
```

### 示例查询
```sql
-- 查询某工序某天的能力负荷数据
SELECT 
  pcl.process_name,
  pcl.date,
  cc.standard_work_hours,
  pcl.available_workstations,
  pcl.work_shift,
  pcl.occupied_hours,
  pcl.remaining_hours,
  pcl.remaining_shift
FROM process_capacity_load pcl
LEFT JOIN company_calendar cc ON pcl.date = cc.calendar_date
WHERE pcl.process_name = '打包' 
  AND pcl.date = '2025-12-20';
```

---

## 🐛 已修复的问题

### 问题1: page_settings表不存在
- **现象**: `Table 'enterprise_brain.page_settings' doesn't exist`
- **原因**: 数据库缺少页面设置表
- **修复**: 从备份恢复表结构和数据

### 问题2: 前端API地址错误
- **现象**: 网络请求失败
- **原因**: 硬编码了 `http://192.168.2.229:3005`
- **修复**: 改为相对路径 `/api/capacity-load/load-from-processes`

---

## 📝 相关文件

### 数据库相关
- `restore_page_settings_table.sql` - 恢复脚本
- `backend/routes/capacityLoad.js:957-1073` - 加载API
- `backend/config/database.js` - 数据库配置

### 前端页面
- `07-frontend/src/pages/manufacturing/ProcessList.vue:594-643` - 加载功能

### 备份文件
- `backups/db_field_calc_success_20251215_132407.sql:995-1021` - 完整备份

---

## 🎯 下次恢复指南

如果再次遇到 `page_settings` 表丢失的问题：

### 方法1: 使用恢复脚本
```bash
cd /home/sardensy/enterprise-brain/enterpise-brain
mysql -u root -pzH754277289hUi~197547 enterprise_brain < restore_page_settings_table.sql
```

### 方法2: 从完整备份恢复
```bash
# 提取page_settings表数据
grep -A 30 "CREATE TABLE \`page_settings\`" backups/db_field_calc_success_20251215_132407.sql
```

---

## ✅ 测试验证

### 1. 数据库验证
```bash
✅ page_settings表已创建
✅ 包含5条默认配置数据
✅ capacity-load/displayDays = 120
✅ company-calendar相关配置正确
```

### 2. 功能验证
```
✅ 工序列表页面正常访问
✅ 批量选择工序功能正常
✅ "加载到工序能力负荷表"按钮可点击
✅ 自动过滤自制工序
✅ 确认对话框显示正确
✅ 后端API正常响应
✅ 生成120天数据
✅ 工序能力负荷表数据正确
```

### 3. 计算验证
```
✅ 上班时段从企业日历获取
✅ 剩余工时计算正确
✅ 剩余时段计算正确
✅ 已占用工时初始为0
```

---

**修复完成时间**: 2025-12-19  
**状态**: ✅ 已完成  
**下次恢复**: 参考上述"下次恢复指南"章节
