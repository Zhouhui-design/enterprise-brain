<template>
  <div class="purchase-order-create">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>{{ isEdit ? '编辑采购订单' : '新建采购订单' }}</h1>
    </div>

    <!-- 采购订单表单 -->
    <el-form
      ref="orderFormRef"
      :model="orderForm"
      :rules="rules"
      label-width="100px"
      class="order-form"
    >
      <!-- 基本信息 -->
      <el-card class="mb-4">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
          </div>
        </template>
        <div class="form-row">
          <el-form-item label="订单编号" prop="orderNo" :span="6">
            <el-input v-model="orderForm.orderNo" placeholder="系统自动生成" disabled></el-input>
          </el-form-item>
          <el-form-item label="订单日期" prop="orderDate" :span="6">
            <el-date-picker
              v-model="orderForm.orderDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>
          <el-form-item label="供应商" prop="supplierId" :span="6">
            <el-select
              v-model="orderForm.supplierId"
              placeholder="请选择供应商"
              @change="handleSupplierChange"
            >
              <el-option
                v-for="supplier in suppliers"
                :key="supplier.id"
                :label="supplier.name"
                :value="supplier.id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="联系人" prop="contactPerson" :span="6">
            <el-input v-model="orderForm.contactPerson" placeholder="请输入联系人"></el-input>
          </el-form-item>
          <el-form-item label="联系电话" prop="contactPhone" :span="6">
            <el-input v-model="orderForm.contactPhone" placeholder="请输入联系电话"></el-input>
          </el-form-item>
          <el-form-item label="预计到货日期" prop="expectedDeliveryDate" :span="6">
            <el-date-picker
              v-model="orderForm.expectedDeliveryDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>
          <el-form-item label="备注" prop="remark" :span="12">
            <el-input v-model="orderForm.remark" type="textarea" rows="2" placeholder="请输入备注信息"></el-input>
          </el-form-item>
        </div>
      </el-card>

      <!-- 订单物料明细 -->
      <el-card class="mb-4">
        <template #header>
          <div class="card-header">
            <span>订单物料明细</span>
            <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAddItem">
              添加物料
            </el-button>
          </div>
        </template>
        
        <el-table
          :data="orderForm.items"
          border
          style="width: 100%"
          @selection-change="handleItemSelectionChange"
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="itemNo" label="物料编码" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.itemNo" placeholder="请输入物料编码"></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="itemName" label="物料名称" width="200">
            <template slot-scope="scope">
              <el-input v-model="scope.row.itemName" placeholder="请输入物料名称"></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="specification" label="规格型号" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.specification" placeholder="请输入规格型号"></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="80">
            <template slot-scope="scope">
              <el-select v-model="scope.row.unit" placeholder="单位">
                <el-option label="个" value="个"></el-option>
                <el-option label="件" value="件"></el-option>
                <el-option label="箱" value="箱"></el-option>
                <el-option label="套" value="套"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="orderQuantity" label="订购数量" width="120">
            <template slot-scope="scope">
              <el-input
                v-model.number="scope.row.orderQuantity"
                type="number"
                min="1"
                placeholder="请输入数量"
                @change="handleQuantityChange(scope.row)"
              ></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="单价" width="120">
            <template slot-scope="scope">
              <el-input
                v-model.number="scope.row.unitPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="请输入单价"
                @change="handlePriceChange(scope.row)"
              ></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="totalPrice" label="金额" width="120">
            <template slot-scope="scope">
              <span>{{ formatCurrency(scope.row.totalPrice) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="deliveryDate" label="交货日期" width="150">
            <template slot-scope="scope">
              <el-date-picker
                v-model="scope.row.deliveryDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              ></el-date-picker>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="100">
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="请输入备注"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template slot-scope="scope">
              <el-button size="small" type="danger" icon="el-icon-delete" @click="handleDeleteItem(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 批量操作 -->
        <div class="batch-operations mt-3">
          <el-button size="small" type="danger" @click="handleBatchDelete" :disabled="selectedItems.length === 0">
            批量删除
          </el-button>
          <el-button size="small" type="primary" @click="handleImportItems">
            导入物料
          </el-button>
        </div>

        <!-- 订单总额 -->
        <div class="order-summary mt-4 text-right">
          <el-descriptions border column="2" :column-setting="[{ type: 'flex', flex: 4 }, { type: 'flex', flex: 1 }]">
            <el-descriptions-item label="订单总额">{{ formatCurrency(orderForm.totalAmount) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>
    </el-form>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave('draft')">保存草稿</el-button>
      <el-button type="success" @click="handleSave('submit')">提交订单</el-button>
    </div>

    <!-- 确认对话框 -->
    <el-dialog
      :title="confirmDialogTitle"
      :visible.sync="confirmDialogVisible"
      width="400px"
    >
      <p>{{ confirmDialogMessage }}</p>
      <div slot="footer" class="dialog-footer">
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAction">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as purchaseApi from '@/api/purchase'
import { mockSuppliers } from '@/utils/mockData'; // 导入模拟数据作为备份

export default {
  name: 'PurchaseOrderCreate',
  props: {
    orderId: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      // 判断是否是编辑模式
      isEdit: false,
      // 采购订单表单
      orderForm: {
        id: null,
        orderNo: '',
        orderDate: new Date(),
        supplierId: '',
        supplierName: '',
        contactPerson: '',
        contactPhone: '',
        expectedDeliveryDate: '',
        remark: '',
        totalAmount: 0,
        status: 'PENDING',
        items: []
      },
      // 供应商列表
      suppliers: [],
      // 选中的物料
      selectedItems: [],
      // 表单验证规则
      rules: {
        supplierId: [
          { required: true, message: '请选择供应商', trigger: 'blur' }
        ],
        contactPerson: [
          { required: true, message: '请输入联系人', trigger: 'blur' }
        ],
        contactPhone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        expectedDeliveryDate: [
          { required: true, message: '请选择预计到货日期', trigger: 'change' }
        ]
      },
      // 确认对话框
      confirmDialogVisible: false,
      confirmDialogTitle: '',
      confirmDialogMessage: '',
      confirmAction: null
    }
  },
  created() {
    this.initData()
  },
  methods: {
    // 初始化数据
    initData() {
      this.loadSuppliers()
      if (this.orderId) {
        this.isEdit = true
        this.loadOrderDetail()
      } else {
        // 新增时生成订单编号
        this.generateOrderNo()
      }
    },
    // 加载供应商列表
    async loadSuppliers() {
      try {
        const response = await purchaseApi.getSuppliers()
        this.suppliers = response.data || []
        this.$message.success('供应商数据加载成功')
      } catch (error) {
        console.error('获取供应商列表失败:', error)
        // 使用模拟数据作为备份
        this.suppliers = mockSuppliers || [
          { id: 1, name: '供应商A', contactPerson: '张三', contactPhone: '13800138001' },
          { id: 2, name: '供应商B', contactPerson: '李四', contactPhone: '13800138002' },
          { id: 3, name: '供应商C', contactPerson: '王五', contactPhone: '13800138003' },
          { id: 4, name: '供应商D', contactPerson: '赵六', contactPhone: '13800138004' }
        ]
        this.$message.warning('加载供应商数据失败，已使用本地数据')
      }
    },
    // 加载订单详情
    async loadOrderDetail() {
      try {
        const response = await purchaseApi.getPurchaseOrderDetail(this.orderId)
        this.orderForm = response.data || {}
        // 计算总金额
        this.calculateTotalAmount()
      } catch (error) {
        console.error('获取订单详情失败:', error)
        this.$message.error('获取订单详情失败，请稍后重试')
        // 使用模拟数据作为备份
        this.orderForm = {
          id: this.orderId,
          orderNo: `PO${new Date().getFullYear()}${String(this.orderId).padStart(4, '0')}`,
          orderDate: new Date(),
          supplierId: 1,
          supplierName: '供应商A',
          contactPerson: '张三',
          contactPhone: '13800138001',
          expectedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          remark: '请按时交货',
          totalAmount: 0,
          status: 'PENDING',
          items: [
            {
              id: 1,
              itemNo: 'ITEM1001',
              itemName: '测试物料1',
              specification: '规格1',
              unit: '个',
              orderQuantity: 10,
              unitPrice: 100,
              totalPrice: 1000,
              deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              remark: ''
            },
            {
              id: 2,
              itemNo: 'ITEM1002',
              itemName: '测试物料2',
              specification: '规格2',
              unit: '件',
              orderQuantity: 5,
              unitPrice: 200,
              totalPrice: 1000,
              deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              remark: ''
            }
          ]
        }
        this.calculateTotalAmount()
      }
    },
    // 生成订单编号
    generateOrderNo() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      this.orderForm.orderNo = `PO${year}${month}${day}${random}`
    },
    // 供应商变更处理
    handleSupplierChange(supplierId) {
      const supplier = this.suppliers.find(s => s.id === supplierId)
      if (supplier) {
        this.orderForm.supplierName = supplier.name
        this.orderForm.contactPerson = supplier.contactPerson
        this.orderForm.contactPhone = supplier.contactPhone
      }
    },
    // 添加物料
    handleAddItem() {
      const newItem = {
        id: Date.now(), // 临时ID
        itemNo: '',
        itemName: '',
        specification: '',
        unit: '个',
        orderQuantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        deliveryDate: new Date(),
        remark: ''
      }
      this.orderForm.items.push(newItem)
    },
    // 删除物料
    handleDeleteItem(item) {
      const index = this.orderForm.items.findIndex(i => i.id === item.id)
      if (index > -1) {
        this.orderForm.items.splice(index, 1)
        this.calculateTotalAmount()
      }
    },
    // 批量删除物料
    handleBatchDelete() {
      this.confirmDialogTitle = '批量删除确认'
      this.confirmDialogMessage = `确定要删除选中的 ${this.selectedItems.length} 个物料吗？`
      this.confirmAction = () => {
        this.selectedItems.forEach(item => {
          const index = this.orderForm.items.findIndex(i => i.id === item.id)
          if (index > -1) {
            this.orderForm.items.splice(index, 1)
          }
        })
        this.selectedItems = []
        this.calculateTotalAmount()
        this.confirmDialogVisible = false
      }
      this.confirmDialogVisible = true
    },
    // 导入物料
    async handleImportItems() {
      try {
        // 这里可以实现文件上传逻辑，然后调用API导入
        const response = await purchaseApi.importPurchaseOrderItems()
        if (response.data && response.data.items) {
          this.orderForm.items.push(...response.data.items)
          this.calculateTotalAmount()
          this.$message.success('物料导入成功')
        } else {
          this.$message.warning('未导入任何物料数据')
        }
      } catch (error) {
        console.error('导入物料失败:', error)
        this.$message.error('导入物料失败，请稍后重试')
        // 可以在这里添加降级方案，例如提示用户手动添加物料
      }
    },
    // 数量变更处理
    handleQuantityChange(item) {
      item.totalPrice = item.orderQuantity * item.unitPrice
      this.calculateTotalAmount()
    },
    // 单价变更处理
    handlePriceChange(item) {
      item.totalPrice = item.orderQuantity * item.unitPrice
      this.calculateTotalAmount()
    },
    // 计算总金额
    calculateTotalAmount() {
      this.orderForm.totalAmount = this.orderForm.items.reduce((sum, item) => {
        return sum + (item.totalPrice || 0)
      }, 0)
    },
    // 物料选择变更
    handleItemSelectionChange(selection) {
      this.selectedItems = selection
    },
    // 格式化货币
    formatCurrency(value) {
      if (!value) return '¥0.00'
      return `¥${Number(value).toFixed(2)}`
    },
    // 保存订单
    async handleSave(type) {
      this.$refs.orderFormRef.validate(async (valid) => {
        if (valid) {
          // 验证物料明细
          if (this.orderForm.items.length === 0) {
            this.$message.error('请至少添加一个物料')
            return
          }
          
          // 验证每个物料的必填项
          for (let i = 0; i < this.orderForm.items.length; i++) {
            const item = this.orderForm.items[i]
            if (!item.itemNo) {
              this.$message.error(`第 ${i + 1} 行物料编码不能为空`)
              return
            }
            if (!item.itemName) {
              this.$message.error(`第 ${i + 1} 行物料名称不能为空`)
              return
            }
            if (!item.orderQuantity || item.orderQuantity <= 0) {
              this.$message.error(`第 ${i + 1} 行订购数量必须大于0`)
              return
            }
            if (!item.unitPrice || item.unitPrice < 0) {
              this.$message.error(`第 ${i + 1} 行单价必须大于等于0`)
              return
            }
          }
          
          try {
            const saveData = {
              ...this.orderForm,
              status: type === 'draft' ? 'DRAFT' : 'PENDING'
            }
            
            let response
            if (this.isEdit) {
              response = await purchaseApi.updatePurchaseOrder(saveData)
            } else {
              response = await purchaseApi.createPurchaseOrder(saveData)
            }
            
            const actionText = type === 'draft' ? '保存草稿' : '提交订单'
            this.$message.success(`${actionText}成功`)
            // 跳转到列表页面
            this.$router.push('/purchase/order-list')
          } catch (error) {
            console.error('保存订单失败:', error)
            this.$message.error('保存订单失败，请稍后重试')
            
            // 询问用户是否保存到本地作为备份
            this.$confirm('是否将当前订单数据保存到本地作为备份？', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }).then(() => {
              // 这里可以添加保存到本地存储的逻辑
              localStorage.setItem('draftPurchaseOrder', JSON.stringify(this.orderForm))
              this.$message.success('订单数据已保存到本地')
            }).catch(() => {
              // 用户取消保存到本地
            })
          }
        } else {
          this.$message.error('请检查表单填写是否正确')
          return false
        }
      })
    },
    // 取消操作
    handleCancel() {
      this.$confirm('确定要离开当前页面吗？未保存的内容将丢失。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$router.push('/purchase/order-list')
      })
    },
    // 处理确认操作
    handleConfirmAction() {
      if (this.confirmAction) {
        this.confirmAction()
      }
    }
  }
}
</script>

<style scoped>
.purchase-order-create {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.order-form {
  background: #fff;
  padding: 0;
}

.mb-4 {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  margin: -10px;
}

.form-row .el-form-item {
  margin: 10px;
}

.batch-operations {
  display: flex;
  gap: 10px;
}

.mt-3 {
  margin-top: 15px;
}

.mt-4 {
  margin-top: 20px;
}

.order-summary {
  margin-top: 20px;
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.action-buttons .el-button {
  margin: 0 10px;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}
</style>