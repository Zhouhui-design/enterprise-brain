# 销售订单产品合并功能 - 快速修复指南

## 🎯 修复目标

实现销售订单提交后，**每个产品独占一行**，且每行包含完整的订单信息。

---

## ⚡ 快速修复（3步完成）

### 步骤 1：修复数据库

```bash
cd c:/Users/sardenesy/Projects/enterpise-brain
mysql -u root -pzH754277289hUi~197547 < fix-sales-orders-table.sql
```

### 步骤 2：重启服务

```bash
fix-and-restart.bat
```

### 步骤 3：测试验证

1. 访问：http://localhost:3003/sales/orders/create
2. 填写客户名称，添加 2 个产品
3. 提交订单
4. 访问：http://localhost:3003/sales/orders/list
5. 验证：应该看到 2 行数据

---

## 📁 重要文件

| 文件名 | 用途 |
|-------|------|
| `fix-sales-orders-table.sql` | 数据库表结构修复脚本 |
| `fix-and-restart.bat` | 一键修复并重启服务 |
| `销售订单产品合并逻辑说明.md` | 详细技术文档 |
| `测试指南-销售订单产品合并.md` | 完整测试步骤 |
| `修复总结-销售订单产品合并.md` | 修复总结和数据流程图 |

---

## ✅ 修复内容

### 1. 数据库表（新增字段）

```sql
ALTER TABLE sales_orders ADD COLUMN product_code VARCHAR(100);
ALTER TABLE sales_orders ADD COLUMN product_name VARCHAR(200);
ALTER TABLE sales_orders ADD COLUMN product_spec VARCHAR(200);
ALTER TABLE sales_orders ADD COLUMN order_quantity DECIMAL(10,2);
ALTER TABLE sales_orders ADD COLUMN output_process VARCHAR(200);
ALTER TABLE sales_orders ADD COLUMN product_source VARCHAR(100);
-- ... 更多字段
```

### 2. 前端提交格式

**文件**：`07-frontend/src/pages/sales/sales-order/SalesOrderCreate.vue` (第1361行)

```javascript
products: validProducts.map(p => ({
  productCode: p.productCode,          // ✅ 驼峰命名
  productName: p.productName,
  orderQuantity: p.orderQuantity,
  outputProcess: p.outputProcess,
  productSource: p.productSource
}))
```

### 3. 前端字段映射

**文件**：`07-frontend/src/features/sales-order/composables/useSalesOrderList.ts` (第40行)

```typescript
const mapOrderFields = (order: any) => {
  return {
    // 基本信息
    customerName: order.customer_name || order.customerName,
    salesperson: order.salesperson,
    
    // 产品信息（🆕 新增）
    productCode: order.product_code || order.productCode,
    productName: order.product_name || order.productName,
    orderQuantity: order.order_quantity || order.orderQuantity,
    outputProcess: order.output_process || order.outputProcess,
    productSource: order.product_source || order.productSource
  }
}
```

### 4. 后端逻辑（已正确，无需修改）

**文件**：`backend/routes/salesOrders.js` (第99-192行)

```javascript
// 为每个产品创建独立的订单记录
for (const product of products) {
  await connection.execute(`
    INSERT INTO sales_orders (..., product_code, product_name, ...)
    VALUES (...)
  `);
}
```

---

## 🧪 验证测试

### 快速测试

```sql
-- 查看最近的订单（应该有多行，每行一个产品）
SELECT 
  internal_order_no, 
  customer_name, 
  product_code, 
  product_name, 
  order_quantity
FROM sales_orders
ORDER BY created_at DESC
LIMIT 5;
```

**预期结果**：

| internal_order_no | customer_name | product_code | product_name | order_quantity |
|-------------------|---------------|--------------|--------------|----------------|
| SO2025120001      | 费瓦          | PROD_A       | 产品A        | 10.00          |
| SO2025120002      | 费瓦          | PROD_B       | 产品B        | 20.00          |

---

## 🐛 常见问题

### Q1: 提交订单报错 "Unknown column 'product_code'"

**A**: 数据库表没有产品字段，运行修复脚本：
```bash
mysql -u root -pzH754277289hUi~197547 < fix-sales-orders-table.sql
```

### Q2: 列表显示 "-"

**A**: 检查字段映射是否包含产品字段：
```typescript
productCode: order.product_code || order.productCode,
```

### Q3: 只插入1条记录

**A**: 检查后端循环逻辑，确保 `for (const product of products)` 正常执行

---

## 📚 详细文档

- **技术实现**：查看 `销售订单产品合并逻辑说明.md`
- **测试步骤**：查看 `测试指南-销售订单产品合并.md`
- **修复总结**：查看 `修复总结-销售订单产品合并.md`

---

## 🎉 完成标志

- [x] 数据库表包含产品字段
- [x] 后端循环创建订单记录
- [x] 前端使用驼峰命名提交
- [x] 前端字段映射包含产品信息
- [x] 前端列表简化加载逻辑
- [ ] 提交订单测试通过
- [ ] 列表显示测试通过
- [ ] 数据库验证通过

---

**修复完成！开始测试吧！** 🚀

有任何问题，请查看详细文档或联系开发团队。
