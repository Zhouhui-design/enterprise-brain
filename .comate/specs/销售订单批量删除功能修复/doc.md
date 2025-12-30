# 销售订单批量删除功能修复需求文档

## 问题背景

在销售订单管理页面(http://localhost:3007/sales/orders/list)，用户报告了批量删除功能无法正常工作的问题：

1. 页面显示一条空白行数据，订单状态为"pending"，其他字段为"-"
2. 勾选这条数据后点击"批量删除"按钮
3. 页面提示："批量删除失败，请求地址不存在"
4. 控制台输出404错误：`/api/sales-orders/batch-delete`
5. 销售订单应该是空的，不应该有这条空白数据

## 问题分析

### 1. 前端API调用问题
- 前端调用路径：`/api/sales-orders/batch-delete`
- 但后端API不存在该接口
- 前端API文件(`07-frontend/src/api/index.js`)中没有定义`batchDeleteSalesOrders`方法

### 2. 后端路由缺失
- 后端销售订单路由文件(`backend/routes/salesOrders.js`)中没有批量删除的路由处理
- 路由加载器中销售订单映射为`/api/sales-orders`，但没有批量删除子路由

### 3. 前端组合函数问题
- `useSalesOrderList.ts`中的`batchDelete`函数调用了不存在的`salesOrderApi.batchDeleteSalesOrders`方法
- 该函数直接操作前端数据，但没有正确的后端API支持

### 4. 数据显示问题
- 页面显示空白行数据可能是前端模拟数据或初始化问题
- 需要检查数据加载和显示逻辑

## 技术架构分析

### 后端架构
- Node.js Express服务器运行在3005端口
- 路由自动加载机制：`backend/utils/routeLoader.js`
- 销售订单路由：`backend/routes/salesOrders.js`
- 数据库：MySQL/SQLite

### 前端架构
- Vue 3 + TypeScript
- Element Plus UI组件
- 运行在3007端口
- API基础路径：`/api`
- 组合式函数：`useSalesOrderList`, `useSalesOrderActions`

## 解决方案设计

### 1. 后端API开发
**文件路径**: `backend/routes/salesOrders.js`
**新增路由**: `POST /api/sales-orders/batch-delete`

**功能设计**:
```javascript
/**
 * 批量删除销售订单
 * POST /api/sales-orders/batch-delete
 */
router.post('/batch-delete', async (req, res) => {
  let connection;
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的订单ID列表'
      });
    }
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // 批量删除订单
    const [result] = await connection.execute(
      `DELETE FROM sales_orders WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `成功删除${result.affectedRows}条订单`,
      data: {
        deletedCount: result.affectedRows
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('批量删除销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除失败',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});
```

### 2. 前端API修复
**文件路径**: `07-frontend/src/api/index.js`
**新增方法**:
```javascript
// 在salesOrderAPI对象中添加
batchDeleteSalesOrders: (ids) => {
  return api.post('/sales-orders/batch-delete', { ids })
}
```

### 3. 前端组合函数优化
**文件路径**: `07-frontend/src/features/sales-order/composables/useSalesOrderList.ts`
**修复内容**:
- 确保正确调用API方法
- 优化错误处理
- 移除直接操作前端数据的逻辑，依赖后端API

### 4. 数据显示问题修复
**文件路径**: `07-frontend/src/features/sales-order/composables/useSalesOrderList.ts`
**检查点**:
- `loadData`函数中的数据处理逻辑
- 模拟数据清理
- 空数据状态处理

## 影响文件清单

### 后端文件
1. `backend/routes/salesOrders.js` - 新增批量删除路由
2. 无需修改路由加载器，已有正确映射

### 前端文件
1. `07-frontend/src/api/index.js` - 新增批量删除API方法
2. `07-frontend/src/features/sales-order/composables/useSalesOrderList.ts` - 修复batchDelete函数
3. `07-frontend/src/pages/sales/sales-order/SalesOrderListNew2.vue` - 可能需要检查数据初始化

## 边界条件与异常处理

### 前端边界条件
1. 空选择列表：禁用批量删除按钮
2. 网络错误：显示友好错误信息
3. 部分删除成功：显示实际删除数量

### 后端边界条件
1. 空ID数组：返回400错误
2. 无效ID格式：数据库操作异常处理
3. 数据库约束违反：事务回滚
4. 并发删除：使用数据库事务保证一致性

## 数据流动路径

### 正常流程
1. 用户选择要删除的订单
2. 点击批量删除按钮
3. 前端显示确认对话框
4. 调用`/api/sales-orders/batch-delete`
5. 后端验证ID列表
6. 执行数据库删除操作
7. 返回删除结果
8. 前端更新页面数据

### 错误流程
1. 任何步骤失败都会显示错误信息
2. 数据库操作失败会自动回滚
3. 前端不会删除本地数据，除非后端确认成功

## 预期成果

1. 批量删除功能正常工作
2. 删除操作有良好的用户反馈
3. 数据一致性得到保证
4. 页面不再显示异常的空白行数据
5. 错误处理机制完善

## 实现细节

### 事务处理
使用数据库事务确保批量操作的原子性，要么全部成功，要么全部失败。

### 权限控制
(可选) 可以添加权限检查，确保只有有权限的用户才能执行删除操作。

### 日志记录
在关键操作点添加日志，便于问题追踪和调试。

### 性能考虑
大批量删除时考虑分批处理，避免长时间锁定数据库表。

### 用户体验
1. 删除操作前显示确认对话框
2. 操作过程中显示加载状态
3. 操作完成后显示成功/失败提示
4. 自动刷新列表数据
