# 模拟排程工序表被动数据接收修复

## 需求场景具体处理逻辑

模拟排程工序表是一个被动接收数据的页面，不应该主动发起数据获取请求。当前页面在加载时会主动调用API获取数据和统计信息，导致在数据为空时显示404错误。

根据业务流程：
- 销售订单"模拟排程"按钮 → 触发推送数据流 → 模拟排程列表被动获取数据 → 自动触发推送数据到"模拟物料需求明细"表 → "模拟物料需求明细"表被动获取数据 → 自动按规则触发推送到"模拟排程工序表" → "模拟排程工序表"被动获取数据

## 架构技术方案

### 问题分析
1. 前端页面在`onMounted`时主动调用`fetchData()`和`fetchStats()`方法
2. 当数据库中没有数据时，API返回空结果，但前端将其视为错误
3. 页面显示"获取数据失败"的错误提示，这在被动接收数据的场景下是不合适的

### 解决方案
1. 修改前端页面的数据获取逻辑，区分主动获取和被动接收
2. 在无数据时不显示错误提示，而是显示相应的提示信息
3. 保持轮询机制以监听数据更新
4. 优化错误处理逻辑，区分真正的错误和空数据状态

## 影响文件

### 前端文件修改
- **文件类型**: Vue组件页面
- **文件路径**: `07-frontend/src/pages/sales/simulation-scheduling-process-table/index.vue`
- **影响函数**: `fetchData()`, `fetchStats()`, `onMounted()`, `refreshData()`

### 修改内容
1. 修改数据获取逻辑，不将空数据视为错误
2. 优化页面提示信息
3. 调整初始化逻辑
4. 完善错误处理机制

## 实现细节

### 1. 数据获取逻辑优化
```javascript
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterForm
    }
    
    const response = await axios.get('/api/simulation-scheduling-process/list', { params })
    
    if (response.data.success) {
      tableData.value = response.data.data || []
      pagination.total = response.data.pagination?.total || 0
      
      // 不再将空数据视为错误，而是正常状态
      if (tableData.value.length === 0) {
        console.log('模拟排程工序表暂无数据，等待其他页面推送数据')
      }
    } else {
      ElMessage.error(response.data.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    // 只在真正网络错误时显示错误提示
    if (error.response && error.response.status !== 404) {
      ElMessage.error('获取数据失败: ' + error.message)
    }
  } finally {
    loading.value = false
  }
}
```

### 2. 统计信息获取优化
```javascript
const fetchStats = async () => {
  try {
    const response = await axios.get('/api/simulation-scheduling-process/stats')
    
    if (response.data.success) {
      Object.assign(stats, response.data.data || {})
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
    // 不显示错误提示，因为这是被动接收页面
  }
}
```

### 3. 页面提示优化
在模板中添加无数据状态提示：
```html
<!-- 在表格上方添加提示信息 -->
<div v-if="tableData.length === 0 && !loading" class="empty-data-tip">
  <el-alert
    title="模拟排程工序表暂无数据"
    type="info"
    description="此页面为被动接收数据页面，请在销售订单页面点击"模拟排程"按钮来触发数据推送流程"
    show-icon
    :closable="false"
  />
</div>
```

### 4. 初始化逻辑调整
```javascript
onMounted(() => {
  // 不立即获取数据，而是等待被动接收或用户主动刷新
  console.log('模拟排程工序表已加载，等待被动接收数据')
  startPolling() // 保持轮询以监听数据更新
})
```

## 边界条件与异常处理

### 边界条件
1. **数据库表为空**: 显示提示信息而非错误
2. **网络连接失败**: 显示网络错误提示
3. **API服务异常**: 显示服务错误提示
4. **权限不足**: 显示权限错误提示

### 异常处理
1. **404错误**: 在被动接收页面中不视为错误，可能是正常状态
2. **500错误**: 显示服务器内部错误提示
3. **网络超时**: 显示网络超时提示
4. **数据格式错误**: 显示数据格式错误提示

## 数据流动路径

### 修正后的数据流
1. 页面加载 → 显示提示信息 → 启动轮询监听
2. 接收推送数据 → 自动更新表格数据
3. 用户主动刷新 → 重新获取最新数据
4. 数据为空 → 显示友好提示而非错误

### 轮询机制
保持30秒轮询间隔，检查是否有新数据推送
- 有新数据: 自动更新表格和统计信息
- 无数据: 继续轮询，不显示错误

## 预期成果

1. **用户体验改善**: 页面不再显示误导性的"获取数据失败"错误
2. **业务逻辑正确**: 符合被动接收数据的业务场景
3. **错误处理完善**: 区分真正的错误和正常的空数据状态
4. **提示信息友好**: 提供清晰的操作指引
5. **性能优化**: 避免不必要的错误日志和用户提示

修复完成后，用户打开模拟排程工序表时将看到友好的提示信息，而不是错误提示，符合被动接收数据页面的设计理念。