<template>
  <div class="receipt-create-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>创建回厂单</h2>
      <div class="header-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>
    </div>

    <!-- 创建表单 -->
    <el-card class="create-card">
      <el-form
        ref="receiptForm"
        :model="receiptForm"
        :rules="formRules"
        label-width="120px"
      >
        <!-- 基本信息 -->
        <el-divider>基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="回厂单号" prop="receiptNo">
              <el-input
                v-model="receiptForm.receiptNo"
                placeholder="自动生成"
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="回厂日期" prop="receiptDate">
              <el-date-picker
                v-model="receiptForm.receiptDate"
                type="date"
                placeholder="选择回厂日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="到货方式" prop="deliveryType">
              <el-select
                v-model="receiptForm.deliveryType"
                placeholder="选择到货方式"
                style="width: 100%"
              >
                <el-option label="快递" value="EXPRESS" />
                <el-option label="物流" value="LOGISTICS" />
                <el-option label="自提" value="SELF_PICKUP" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="采购订单号" prop="purchaseOrderNo">
              <el-select
                v-model="receiptForm.purchaseOrderNo"
                placeholder="选择采购订单号"
                style="width: 100%"
                @change="handleOrderChange"
              >
                <el-option
                  v-for="order in purchaseOrders"
                  :key="order.orderNo"
                  :label="order.orderNo"
                  :value="order.orderNo"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单日期">
              <el-input
                v-model="receiptForm.orderDate"
                placeholder="自动带出"
                readonly
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 供应商信息 -->
        <el-divider>供应商信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplierId">
              <el-select
                v-model="receiptForm.supplierId"
                placeholder="选择供应商"
                style="width: 100%"
                @change="handleSupplierChange"
              >
                <el-option
                  v-for="supplier in suppliers"
                  :key="supplier.id"
                  :label="supplier.name"
                  :value="supplier.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商联系人">
              <el-input
                v-model="receiptForm.supplierContact"
                placeholder="自动带出"
                readonly
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商电话">
              <el-input
                v-model="receiptForm.supplierPhone"
                placeholder="自动带出"
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商地址">
              <el-input
                v-model="receiptForm.supplierAddress"
                placeholder="自动带出"
                readonly
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 回厂明细 -->
        <el-divider>回厂明细</el-divider>
        <div class="receipt-items-section">
          <div class="items-header">
            <span>明细列表</span>
            <div class="items-actions">
              <el-button
                type="primary"
                size="small"
                @click="showAddItemDialog"
              >
                <i class="el-icon-plus"></i> 添加入库项
              </el-button>
              <el-button
                size="small"
                @click="batchAddItems"
              >
                <i class="el-icon-upload2"></i> 批量添加
              </el-button>
            </div>
          </div>

          <el-table
            v-loading="itemsLoading"
            :data="receiptForm.items"
            style="width: 100%"
            border
          >
            <el-table-column prop="itemNo" label="项号" width="80" align="center" />
            <el-table-column prop="productCode" label="产品编码" width="120" align="center" />
            <el-table-column prop="productName" label="产品名称" min-width="150">
              <template slot-scope="scope">
                <el-tooltip :content="scope.row.productSpec || '无规格信息'" placement="top">
                  <span>{{ scope.row.productName }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="productSpec" label="规格型号" width="150" align="center" />
            <el-table-column prop="unit" label="单位" width="80" align="center" />
            <el-table-column prop="orderQuantity" label="订单数量" width="100" align="center" />
            <el-table-column prop="receivedQuantity" label="实收数量" width="100" align="center">
              <template slot-scope="scope">
                <el-input-number
                  v-model="scope.row.receivedQuantity"
                  :min="0"
                  :step="0.01"
                  size="small"
                  @change="updateTotalAmount"
                />
              </template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="单价(¥)" width="100" align="center">
              <template slot-scope="scope">
                <el-input-number
                  v-model="scope.row.unitPrice"
                  :min="0"
                  :step="0.01"
                  size="small"
                  @change="updateTotalAmount"
                />
              </template>
            </el-table-column>
            <el-table-column prop="totalPrice" label="金额(¥)" width="120" align="center">
              <template slot-scope="scope">
                <span class="amount">{{ (scope.row.receivedQuantity * scope.row.unitPrice).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="batchNo" label="批次号" width="120" align="center">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.batchNo"
                  placeholder="请输入批次号"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template slot-scope="scope">
                <el-button
                  type="primary"
                  size="mini"
                  @click="editItem(scope.row, scope.$index)"
                  style="margin-bottom: 5px;"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="mini"
                  @click="deleteItem(scope.$index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="total-info" v-if="receiptForm.items.length > 0">
            <div class="total-item">
              <span>合计数量：</span>
              <span class="total-value">{{ totalQuantity }}</span>
            </div>
            <div class="total-item">
              <span>合计金额：</span>
              <span class="total-amount">¥{{ totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- 其他信息 -->
        <el-divider>其他信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收货人" prop="receiver">
              <el-input
                v-model="receiptForm.receiver"
                placeholder="请输入收货人"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收货部门" prop="receiveDepartment">
              <el-input
                v-model="receiptForm.receiveDepartment"
                placeholder="请输入收货部门"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input
                v-model="receiptForm.remark"
                type="textarea"
                placeholder="请输入备注信息"
                :rows="3"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 添加入库项对话框 -->
    <el-dialog
      title="添加入库项"
      :visible.sync="addItemDialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="itemForm"
        :model="currentItem"
        :rules="itemFormRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品编码" prop="productCode">
              <el-input v-model="currentItem.productCode" placeholder="请输入产品编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="currentItem.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规格型号" prop="productSpec">
              <el-input v-model="currentItem.productSpec" placeholder="请输入规格型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="currentItem.unit" placeholder="请输入单位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="订单数量" prop="orderQuantity">
              <el-input-number
                v-model="currentItem.orderQuantity"
                :min="0"
                :step="0.01"
                placeholder="请输入订单数量"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实收数量" prop="receivedQuantity">
              <el-input-number
                v-model="currentItem.receivedQuantity"
                :min="0"
                :step="0.01"
                placeholder="请输入实收数量"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单价" prop="unitPrice">
              <el-input-number
                v-model="currentItem.unitPrice"
                :min="0"
                :step="0.01"
                placeholder="请输入单价"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="批次号" prop="batchNo">
              <el-input v-model="currentItem.batchNo" placeholder="请输入批次号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input
                v-model="currentItem.itemRemark"
                type="textarea"
                placeholder="请输入备注信息"
                :rows="2"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addItemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveItem">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ReceiptCreate',
  data() {
    return {
      receiptForm: {
        receiptNo: this.generateReceiptNo(),
        receiptDate: new Date(),
        deliveryType: 'EXPRESS',
        purchaseOrderNo: '',
        orderDate: '',
        supplierId: '',
        supplierName: '',
        supplierContact: '',
        supplierPhone: '',
        supplierAddress: '',
        receiver: '',
        receiveDepartment: '',
        remark: '',
        items: []
      },
      currentItem: {
        itemNo: '',
        productCode: '',
        productName: '',
        productSpec: '',
        unit: '',
        orderQuantity: 0,
        receivedQuantity: 0,
        unitPrice: 0,
        batchNo: '',
        itemRemark: ''
      },
      editingIndex: -1,
      addItemDialogVisible: false,
      itemsLoading: false,
      suppliers: [
        { id: 1, name: '供应商A', contact: '张三', phone: '13800138001', address: '北京市朝阳区XX路1号' },
        { id: 2, name: '供应商B', contact: '李四', phone: '13900139001', address: '上海市浦东新区XX路2号' },
        { id: 3, name: '供应商C', contact: '王五', phone: '13700137001', address: '广州市天河区XX路3号' },
        { id: 4, name: '供应商D', contact: '赵六', phone: '13600136001', address: '深圳市南山区XX路4号' }
      ],
      purchaseOrders: [
        { orderNo: 'PO20231225001', orderDate: '2023-12-25' },
        { orderNo: 'PO20231226001', orderDate: '2023-12-26' },
        { orderNo: 'PO20231227001', orderDate: '2023-12-27' },
        { orderNo: 'PO20231228001', orderDate: '2023-12-28' }
      ],
      formRules: {
        receiptDate: [
          { required: true, message: '请选择回厂日期', trigger: 'change' }
        ],
        deliveryType: [
          { required: true, message: '请选择到货方式', trigger: 'change' }
        ],
        purchaseOrderNo: [
          { required: true, message: '请选择采购订单号', trigger: 'change' }
        ],
        supplierId: [
          { required: true, message: '请选择供应商', trigger: 'change' }
        ],
        receiver: [
          { required: true, message: '请输入收货人', trigger: 'blur' }
        ],
        receiveDepartment: [
          { required: true, message: '请输入收货部门', trigger: 'blur' }
        ]
      },
      itemFormRules: {
        productCode: [
          { required: true, message: '请输入产品编码', trigger: 'blur' }
        ],
        productName: [
          { required: true, message: '请输入产品名称', trigger: 'blur' }
        ],
        unit: [
          { required: true, message: '请输入单位', trigger: 'blur' }
        ],
        receivedQuantity: [
          { required: true, message: '请输入实收数量', trigger: 'blur' },
          { type: 'number', min: 0.01, message: '实收数量必须大于0', trigger: 'blur' }
        ],
        unitPrice: [
          { required: true, message: '请输入单价', trigger: 'blur' },
          { type: 'number', min: 0.01, message: '单价必须大于0', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    // 计算总数量
    totalQuantity() {
      return this.receiptForm.items.reduce((total, item) => total + (item.receivedQuantity || 0), 0)
    },
    // 计算总金额
    totalAmount() {
      return this.receiptForm.items.reduce((total, item) => 
        total + (item.receivedQuantity || 0) * (item.unitPrice || 0), 0
      )
    }
  },
  methods: {
    // 生成回厂单号
    generateReceiptNo() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
      return `RC${year}${month}${day}${random}`
    },
    
    // 处理采购订单选择变化
    handleOrderChange(orderNo) {
      const order = this.purchaseOrders.find(o => o.orderNo === orderNo)
      if (order) {
        this.receiptForm.orderDate = order.orderDate
      }
    },
    
    // 处理供应商选择变化
    handleSupplierChange(supplierId) {
      const supplier = this.suppliers.find(s => s.id === supplierId)
      if (supplier) {
        this.receiptForm.supplierName = supplier.name
        this.receiptForm.supplierContact = supplier.contact
        this.receiptForm.supplierPhone = supplier.phone
        this.receiptForm.supplierAddress = supplier.address
      }
    },
    
    // 更新总金额
    updateTotalAmount() {
      // 计算逻辑通过computed属性自动处理
    },
    
    // 显示添加入库项对话框
    showAddItemDialog() {
      this.editingIndex = -1
      this.currentItem = {
        itemNo: this.generateItemNo(),
        productCode: '',
        productName: '',
        productSpec: '',
        unit: '',
        orderQuantity: 0,
        receivedQuantity: 0,
        unitPrice: 0,
        batchNo: '',
        itemRemark: ''
      }
      this.addItemDialogVisible = true
    },
    
    // 生成项号
    generateItemNo() {
      const maxNo = Math.max(0, ...this.receiptForm.items.map(item => parseInt(item.itemNo) || 0))
      return String(maxNo + 1).padStart(3, '0')
    },
    
    // 编辑入库项
    editItem(item, index) {
      this.editingIndex = index
      this.currentItem = JSON.parse(JSON.stringify(item))
      this.addItemDialogVisible = true
    },
    
    // 删除入库项
    deleteItem(index) {
      this.$confirm('确定要删除这条入库项吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.receiptForm.items.splice(index, 1)
        // 重新排序项号
        this.receiptForm.items.forEach((item, idx) => {
          item.itemNo = String(idx + 1).padStart(3, '0')
        })
        this.$message.success('删除成功')
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    // 保存入库项
    saveItem() {
      this.$refs.itemForm.validate((valid) => {
        if (valid) {
          if (this.editingIndex >= 0) {
            // 编辑操作
            this.receiptForm.items[this.editingIndex] = JSON.parse(JSON.stringify(this.currentItem))
            this.$message.success('编辑成功')
          } else {
            // 新增操作
            this.receiptForm.items.push(JSON.parse(JSON.stringify(this.currentItem)))
            this.$message.success('添加成功')
          }
          this.addItemDialogVisible = false
        } else {
          this.$message.error('请填写完整的表单信息')
          return false
        }
      })
    },
    
    // 批量添加入库项
    batchAddItems() {
      this.$message.info('批量添加功能待实现')
      // 这里可以实现批量添加逻辑，比如从采购订单导入
    },
    
    // 保存回厂单
    handleSave() {
      if (this.receiptForm.items.length === 0) {
        this.$message.error('请至少添加一条入库明细')
        return
      }
      
      this.$refs.receiptForm.validate((valid) => {
        if (valid) {
          // 模拟保存操作
          this.$confirm('确定要保存回厂单吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }).then(() => {
            // 模拟API调用
            setTimeout(() => {
              this.$message.success('保存成功')
              this.$router.push('/receipt/list')
            }, 500)
          }).catch(() => {
            this.$message.info('已取消保存')
          })
        } else {
          this.$message.error('请填写完整的表单信息')
          return false
        }
      })
    },
    
    // 取消操作
    handleCancel() {
      this.$confirm('确定要放弃编辑吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$router.push('/receipt/list')
      }).catch(() => {
        // 继续编辑
      })
    }
  }
}
</script>

<style scoped>
.receipt-create-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.create-card {
  margin-bottom: 20px;
}

.receipt-items-section {
  margin-bottom: 20px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.items-header span {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.items-actions {
  display: flex;
  gap: 10px;
}

.total-info {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #EBEEF5;
}

.total-item {
  margin-left: 30px;
  font-size: 14px;
  color: #606266;
}

.total-value {
  font-weight: 600;
  color: #303133;
  margin-left: 10px;
}

.total-amount {
  font-weight: 600;
  color: #67C23A;
  margin-left: 10px;
  font-size: 16px;
}

.amount {
  font-weight: 500;
  color: #67C23A;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .items-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .items-actions {
    justify-content: center;
  }
  
  .total-info {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .total-item {
    margin-left: 0;
    text-align: right;
  }
}
</style>