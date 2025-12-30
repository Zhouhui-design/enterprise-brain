# 客户台账数据库集成修复需求文档

## 需求场景
用户在客户台账页面创建客户时，遇到"服务器内部错误"的问题，数据只能保存到本地存储，无法正确保存到MySQL数据库。需要修复客户数据的数据库集成问题，确保数据能够正确持久化到MySQL，并且与生产BOM、物料数据库、产品手册、工序列表、销售订单、采购计划、库存列表等模块保持一致的数据存储方式。

## 问题分析

### 1. 数据库字段映射问题
**问题**：后端API代码中使用的字段名与数据库实际字段名不匹配
- 后端期望：`customer_name`, `customer_code`, `contact_person`, `contact_phone`, `contact_email`, `contact_address`
- 数据库实际：`name`, `type`, `level`, `contact_person`, `phone`, `address`

**影响**：导致SQL插入/更新操作失败，字段无法正确映射

### 2. API响应格式不一致
**问题**：前端期望`response.data.success`格式，但后端返回格式可能不匹配
- 前端期望：`{ success: true, data: {...} }`
- 实际可能：`{ success: true }`或不同格式

**影响**：前端无法正确解析API响应，导致"Cannot read property 'success' of undefined"错误

### 3. 数据持久化机制缺陷
**问题**：当前实现只保存到localStorage作为备选方案，没有正确处理数据库保存失败的情况

**影响**：数据只存在浏览器本地，无法跨设备同步，代码更新时可能丢失

## 架构技术方案

### 1. 数据库表结构优化
- 修复customers表字段映射，确保前后端字段名称一致
- 添加缺失的业务字段：`customer_code`, `contact_email`, `company`, `industry`, `region`, `tax_number`, `sales_person`, `remark`等
- 保持与其他模块一致的数据结构设计

### 2. 后端API标准化
- 统一API响应格式，确保所有接口返回`{ success: boolean, data: any, message?: string }`格式
- 修复字段映射逻辑，确保数据库操作使用正确的字段名
- 增强错误处理和日志记录

### 3. 前端数据处理优化
- 优化API调用逻辑，增强错误处理
- 改进本地存储机制，仅作为离线备选方案
- 添加数据同步机制，确保线上线下数据一致性

## 影响文件

### 1. 数据库相关（修改类型：数据库结构）
- `backend/migrations/` - 新增customers表结构迁移脚本
- `数据库` - customers表字段更新

### 2. 后端API相关（修改类型：接口逻辑）
- `backend/routes/customers.js` - 修复字段映射和响应格式
- `backend/config/database.js` - 确保数据库连接配置正确

### 3. 前端页面相关（修改类型：组件逻辑）
- `07-frontend/src/pages/sales/customers/CustomerList.vue` - 优化API调用和错误处理
- `07-frontend/src/pages/sales/customers/CustomerCreate.vue` - 确保表单数据格式正确
- `07-frontend/src/api/customer.js` - 验证API接口调用

## 实现细节

### 1. 数据库表结构更新
```sql
-- 添加缺失字段到customers表
ALTER TABLE customers 
ADD COLUMN customer_code VARCHAR(50) UNIQUE AFTER id,
ADD COLUMN customer_name VARCHAR(255) AFTER name,
ADD COLUMN contact_email VARCHAR(255) AFTER phone,
ADD COLUMN company VARCHAR(255) AFTER address,
ADD COLUMN industry VARCHAR(100) AFTER company,
ADD COLUMN region VARCHAR(100) AFTER industry,
ADD COLUMN tax_number VARCHAR(100) AFTER region,
ADD COLUMN sales_person VARCHAR(100) AFTER tax_number,
ADD COLUMN remark TEXT AFTER sales_person,
ADD COLUMN created_by VARCHAR(100) AFTER remark,
ADD COLUMN updated_by VARCHAR(100) AFTER created_by;

-- 数据迁移：将name字段数据复制到customer_name
UPDATE customers SET customer_name = name WHERE customer_name IS NULL;

-- 添加索引优化查询性能
CREATE INDEX idx_customer_code ON customers(customer_code);
CREATE INDEX idx_customer_name ON customers(customer_name);
CREATE INDEX idx_customer_type ON customers(customer_type);
CREATE INDEX idx_status ON customers(status);
```

### 2. 后端API字段映射修复
```javascript
// customers.js - 创建客户接口修复
router.post('/', async (req, res) => {
  try {
    const {
      customerCode,
      customerName,
      customerType = 'regular',
      status = 'active',
      contactPerson,
      contactPhone,
      contactEmail,
      contactAddress,
      company,
      industry,
      region,
      taxNumber,
      creditLimit = 0,
      salesPerson,
      remark,
      createdBy = 'admin'
    } = req.body;

    // 使用正确的数据库字段名
    const insertSQL = `
      INSERT INTO customers (
        customer_code, customer_name, customer_type, status,
        contact_person, contact_phone, contact_email, contact_address,
        company, industry, region, tax_number,
        credit_limit, sales_person, remark, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(insertSQL, [
      customerCode, customerName, customerType, status,
      contactPerson, contactPhone, contactEmail, contactAddress,
      company, industry, region, taxNumber,
      creditLimit, salesPerson, remark, createdBy
    ]);

    // 确保返回统一格式
    res.json({
      success: true,
      message: '创建客户成功',
      data: {
        id: result.insertId,
        customer_code: customerCode,
        customer_name: customerName
        // ...其他字段
      }
    });
  } catch (error) {
    console.error('创建客户失败:', error);
    res.status(500).json({
      success: false,
      message: '创建客户失败',
      error: error.message
    });
  }
});
```

### 3. 前端API调用优化
```javascript
// CustomerList.vue - handleCreateSuccess方法修复
const handleCreateSuccess = async (newCustomerData) => {
  try {
    console.log('正在创建客户:', newCustomerData);
    
    const response = await customerApi.createCustomer({
      customerCode: newCustomerData.customerCode,
      customerName: newCustomerData.customerName,
      customerType: newCustomerData.customerType || 'regular',
      status: newCustomerData.status || 'active',
      contactPerson: newCustomerData.contactPerson,
      contactPhone: newCustomerData.contactPhone,
      contactEmail: newCustomerData.contactEmail,
      contactAddress: newCustomerData.address, // 注意字段映射
      company: newCustomerData.company || newCustomerData.customerName,
      industry: newCustomerData.industry,
      region: newCustomerData.region,
      taxNumber: newCustomerData.taxNumber,
      creditLimit: newCustomerData.creditLimit || 0,
      salesPerson: newCustomerData.salesPerson,
      remark: newCustomerData.remark,
      createdBy: 'admin'
    });
    
    // 检查响应格式
    if (response.data && response.data.success) {
      const savedCustomer = response.data.data;
      const newCustomer = {
        id: savedCustomer.id,
        customerCode: savedCustomer.customer_code,
        customerName: savedCustomer.customer_name,
        customerType: savedCustomer.customer_type,
        status: savedCustomer.status,
        contactPerson: savedCustomer.contact_person,
        contactPhone: savedCustomer.contact_phone,
        contactEmail: savedCustomer.contact_email,
        company: savedCustomer.company,
        industry: savedCustomer.industry,
        region: savedCustomer.region,
        address: savedCustomer.contact_address,
        createTime: new Date(savedCustomer.created_at).toLocaleString('zh-CN')
      };
      
      tableData.value.unshift(newCustomer);
      saveCustomerData(tableData.value); // 同步到本地存储
      
      // 更新统计
      stats.value.total++;
      if (savedCustomer.customer_type === 'vip') stats.value.vip++;
      if (savedCustomer.status === 'active') stats.value.active++;
      
      createDialogVisible.value = false;
      ElMessage.success(`客户"${savedCustomer.customer_name}"创建成功！`);
      currentPage.value = 1;
    } else {
      throw new Error(response.data?.message || '创建失败');
    }
  } catch (error) {
    console.error('创建客户失败:', error);
    ElMessage.error(`创建失败：${error.message}`);
  }
};
```

## 边界条件与异常处理

### 1. 数据库连接异常
- 检测数据库连接状态，连接失败时提供明确的错误信息
- 实现连接池管理，避免连接泄漏
- 添加数据库健康检查机制

### 2. 字段验证
- 客户名称必填验证，不允许空值
- 客户编号唯一性检查，避免重复
- 联系电话格式验证，确保符合手机号格式
- 邮箱格式验证，确保符合email格式

### 3. 并发操作
- 处理同时创建相同客户编号的冲突
- 实现乐观锁机制，避免数据更新冲突
- 添加事务处理，确保数据一致性

## 数据流动路径

```
用户填写表单 → 前端验证 → API调用 → 后端验证 → 数据库操作 → 响应返回 → 前端更新 → 本地存储备份
     ↓              ↓           ↓          ↓           ↓          ↓          ↓
  表单数据提交   格式检查    HTTP请求   字段验证    SQL执行    JSON响应   界面刷新
```

### 正常流程
1. 用户在CustomerCreate.vue填写客户信息
2. 前端验证必填字段和格式
3. 调用customerApi.createCustomer发送POST请求
4. 后端customers路由接收请求，验证数据
5. 执行SQL INSERT操作，保存到MySQL数据库
6. 返回成功响应，包含新创建的客户ID
7. 前端接收到成功响应，更新本地数据
8. 同步更新localStorage作为备份

### 异常流程
1. 数据库连接失败 → 返回500错误 → 前端显示错误提示
2. 字段验证失败 → 返回400错误 → 前端显示具体验证错误
3. 客户编号重复 → 返回409错误 → 前端提示修改编号
4. 网络请求失败 → 触发catch → 前端显示网络错误提示

## 预期成果

### 1. 功能完整性
- ✅ 客户信息能够正确保存到MySQL数据库
- ✅ 新增、编辑、删除功能正常工作
- ✅ 数据在页面刷新后仍然存在
- ✅ 与其他模块数据保持一致的存储方式

### 2. 用户体验
- ✅ 创建客户时不再出现"服务器内部错误"
- ✅ 操作成功后显示正确的成功提示
- ✅ 错误情况下提供清晰的错误信息
- ✅ 页面加载速度快，数据实时更新

### 3. 系统稳定性
- ✅ 数据库连接稳定，支持并发操作
- ✅ 异常处理完善，系统不会崩溃
- ✅ 数据一致性保证，避免数据丢失
- ✅ 与生产环境其他模块兼容

### 4. 开发维护性
- ✅ 代码结构清晰，易于维护
- ✅ API接口标准化，便于扩展
- ✅ 错误日志完善，便于调试
- ✅ 数据库结构规范，支持后续功能扩展

## 测试验证清单

### 1. 基础功能测试
- [ ] 创建新客户，验证数据库保存成功
- [ ] 编辑现有客户，验证更新正确
- [ ] 删除客户，验证数据正确删除
- [ ] 查看客户列表，验证数据完整显示

### 2. 异常情况测试
- [ ] 数据库连接中断时的错误处理
- [ ] 重复客户编号的错误提示
- [ ] 必填字段为空的验证
- [ ] 网络请求失败的处理

### 3. 数据一致性测试
- [ ] 页面刷新后数据保持
- [ ] 多浏览器访问数据同步
- [ ] 与其他模块数据关联正确
- [ ] 本地存储与数据库数据一致

### 4. 性能测试
- [ ] 大量客户数据时的页面加载速度
- [ ] 并发创建客户的处理能力
- [ ] 数据库查询响应时间
- [ ] 内存使用情况监控