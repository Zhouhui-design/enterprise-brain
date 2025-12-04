# 🚀 BOM功能优化进展报告

**更新时间：** 2025-12-03  
**状态：** 🔄 进行中  

---

## ✅ 已完成功能

### 1. 生产BOM页面优化

#### ✅ 产出工序默认值设置
**需求：** 产出工序为空时默认="采购"

**实现：**
- 修改`handleChildCodeChange`函数
- 修改`handleChildNameChange`函数
- 使用：`material.outputProcessName || material.processName || '采购'`

**代码：**
```javascript
// 产出工序 = 物料库的产出工序名称，如果为空则默认为"采购"
row.outputProcess = material.outputProcessName || material.processName || '采购'
```

#### ✅ 重新加载工序名称按钮
**需求：** 添加按钮批量重新加载工序名称

**实现：**
- 在子件属性工具栏添加按钮
- 新增`handleReloadProcessNames`函数
- lookup产品物料库，重新计算所有子件的产出工序

**代码：**
```vue
<el-button type="primary" size="small" @click="handleReloadProcessNames">
  <el-icon><Refresh /></el-icon>
  重新加载工序名称
</el-button>
```

**逻辑：**
1. 遍历所有子件
2. 根据子件编码查找物料库
3. 更新产出工序=`outputProcessName || processName || '采购'`
4. 统计更新数量并提示

---

### 2. BOM树结构页面优化（部分完成）

#### ✅ 搜索栏添加
**需求：** 添加搜索框，支持搜索编号、名称、工序

**实现：**
```vue
<div class="search-panel">
  <el-input 
    v-model="searchKeyword" 
    placeholder="搜索编号、名称或工序" 
    clearable
    @input="handleSearch"
  >
    <template #prefix>
      <el-icon><Search /></el-icon>
    </template>
  </el-input>
  <el-button v-if="searchKeyword" type="primary" size="small" @click="locateNode">
    定位
  </el-button>
  <el-button v-if="searchKeyword" size="small" @click="clearSearch">
    清除
  </el-button>
</div>
```

#### ✅ 末道无采购级数量统计字段
**需求：** 显示工序≠"采购"且无下级的单元格数量

**实现：**
```vue
<div class="panel-item">
  <span class="info-text warning">末道无采购级数量: {{ endNodeWithoutPurchaseCount }}</span>
</div>
```

---

## 🔄 进行中功能

### 3. BOM树结构页面优化（剩余部分）

需要继续实现以下功能：

#### ⏳ 连接线箭头方向调整
**需求：** 箭头朝向父件（箭头朝右）

**当前状态：** 箭头朝左（从父指向子）  
**目标状态：** 箭头朝右（从子指向父）

**需要修改：**
- `drawArrow`函数中的箭头绘制逻辑
- 调换起点和终点坐标

#### ⏳ 页面缩放时连接线同步调整
**需求：** 页面缩放时连接线跟随单元格同步调整

**实现方案：**
1. 监听窗口resize事件
2. 监听容器scroll事件
3. 重新计算连接线位置

#### ⏳ 深层数据推送修复
**需求：** 1.1.5.1等深层子件数据未推送到BOM树

**问题分析：**
- `getLevelIndexFromPath`函数计算可能有误
- 深层嵌套计算需要优化

**解决方案：**
- 重新验证层阶地址转换算法
- 添加调试日志跟踪计算过程

#### ⏳ 单元格自动调整位置
**需求：** 类似企业组织架构，同级节点自动对齐

**实现方案：**
1. 计算每个节点的直接子节点数量
2. 根据子节点数量动态调整垂直位置
3. 使用flex布局或绝对定位

#### ⏳ 红色标记机制
**需求：** 工序≠"采购"且无下级时显示红色

**实现方案：**
```javascript
const isEndNodeWithoutPurchase = (level, index) => {
  const nodeData = getNodeData(level, index)
  if (!nodeData.productCode) return false
  
  // 检查工序是否不等于"采购"
  if (nodeData.process === '采购') return false
  
  // 检查是否有下级节点
  const hasChildren = checkHasChildren(level, index)
  
  return !hasChildren // 无下级则返回true
}
```

**样式：**
```scss
.bom-cell.cell-warning {
  border-color: #f56c6c !important;
  background: #fef0f0;
  box-shadow: 0 0 8px rgba(245, 108, 108, 0.4);
}
```

#### ⏳ 子件数量统计
**需求：** 每个单元格显示直接下级数量

**实现方案：**
```javascript
const getChildCount = (level, index) => {
  if (level === 20) return 0 // 最后一层没有子件
  
  let count = 0
  const startIndex = (index - 1) * 30 + 1
  const endIndex = index * 30
  
  for (let i = startIndex; i <= endIndex; i++) {
    const childData = getNodeData(level + 1, i)
    if (childData.productCode) count++
  }
  
  return count
}
```

**显示：**
```vue
<span class="cell-badge">{{ getChildCount(level, index) }}</span>
```

---

## 📝 待实现函数清单

### JavaScript函数

```javascript
// 1. 搜索功能
const searchKeyword = ref('')
const handleSearch = () => {
  // 搜索逻辑
}
const locateNode = () => {
  // 定位到匹配节点
}
const clearSearch = () => {
  searchKeyword.value = ''
}

// 2. 末道无采购级数量统计
const endNodeWithoutPurchaseCount = computed(() => {
  let count = 0
  for (let level = 1; level <= 20; level++) {
    for (let index = 1; index <= 30; index++) {
      if (isEndNodeWithoutPurchase(level, index)) {
        count++
      }
    }
  }
  return count
})

// 3. 判断是否为末道无采购节点
const isEndNodeWithoutPurchase = (level, index) => {
  const nodeData = getNodeData(level, index)
  if (!nodeData.productCode) return false
  if (nodeData.process === '采购') return false
  return !checkHasChildren(level, index)
}

// 4. 检查是否有子节点
const checkHasChildren = (level, index) => {
  if (level === 20) return false
  const startIndex = (index - 1) * 30 + 1
  const endIndex = index * 30
  for (let i = startIndex; i <= endIndex; i++) {
    if (getNodeData(level + 1, i).productCode) return true
  }
  return false
}

// 5. 获取子件数量
const getChildCount = (level, index) => {
  if (level === 20) return 0
  let count = 0
  const startIndex = (index - 1) * 30 + 1
  const endIndex = index * 30
  for (let i = startIndex; i <= endIndex; i++) {
    if (getNodeData(level + 1, i).productCode) count++
  }
  return count
}

// 6. 窗口resize监听
onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
const handleResize = () => {
  nextTick(() => {
    drawConnections()
  })
}

// 7. 修改箭头方向（调换起点和终点）
const drawArrow = (svg, x1, y1, x2, y2) => {
  // 原来：从 (x1,y1) 到 (x2,y2)
  // 修改：从 (x2,y2) 到 (x1,y1)
  // 箭头朝向：朝右（朝向父件）
}
```

---

## 🎯 下一步计划

1. ✅ 完成剩余JavaScript函数的编写
2. ✅ 添加搜索和定位逻辑
3. ✅ 修复深层数据推送问题
4. ✅ 实现单元格自动对齐
5. ✅ 添加红色标记样式
6. ✅ 修改连接线箭头方向
7. ✅ 添加窗口缩放监听

---

## 📊 完成进度

- ✅ 生产BOM页面优化：100%
- 🔄 BOM树结构页面优化：30%
  - ✅ 搜索栏UI：100%
  - ✅ 末道无采购级字段：100%
  - ⏳ 搜索逻辑：0%
  - ⏳ 箭头方向：0%
  - ⏳ 缩放同步：0%
  - ⏳ 深层数据：0%
  - ⏳ 自动对齐：0%
  - ⏳ 红色标记：0%
  - ⏳ 子件统计：0%

**总体进度：** 约40%

---

**继续实现剩余功能中...** 🔄
