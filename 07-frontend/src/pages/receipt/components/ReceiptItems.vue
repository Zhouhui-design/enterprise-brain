<template>
  <div class="receipt-items-container">
    <!-- 明细项表格 -->
    <el-table
      v-loading="loading"
      :data="items"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      border
    >
      <el-table-column type="selection" width="55" v-if="!readonly"></el-table-column>
      <el-table-column prop="id" label="序号" type="index" width="60"></el-table-column>
      <el-table-column prop="productCode" label="产品编码" min-width="120">
        <template slot-scope="scope">
          <template v-if="readonly">
            {{ scope.row.productCode }}
          </template>
          <template v-else>
            <el-input v-model="scope.row.productCode" placeholder="请输入产品编码" @input="handleItemChange(scope.row)"></el-input>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="productName" label="产品名称" min-width="180">
        <template slot-scope="scope">
          <template v-if="readonly">
            {{ scope.row.productName }}
          </template>
          <template v-else>
            <el-input v-model="scope.row.productName" placeholder="请输入产品名称" @input="handleItemChange(scope.row)"></el-input>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="specification" label="规格型号" min-width="120">
        <template slot-scope="scope">
          <template v-if="readonly">
            {{ scope.row.specification }}
          </template>
          <template v-else>
            <el-input v-model="scope.row.specification" placeholder="请输入规格型号" @input="handleItemChange(scope.row)"></el-input>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="单位" min-width="80">
        <template slot-scope="scope">
          <template v-if="readonly">
            {{ scope.row.unit }}
          </template>
          <template v-else>
            <el-select v-model="scope.row.unit" placeholder="选择单位" @change="handleItemChange(scope.row)">
              <el-option v-for="unit in units" :key="unit.value" :label="unit.label" :value="unit.value"></el-option>
            </el-select>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="orderedQuantity" label="订购数量" min-width="100" align="right">
        <template slot-scope="scope">
          <template v-if="readonly">
            {{ scope.row.orderedQuantity }}
          </template>
          <template v-else>
            <el-input-number v-model.number="scope.row.orderedQuantity" :min="0" @change="handleItemChange(scope.row)"></el-input-number>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="receivedQuantity" label="实收数量" min-width="100" align="right">
        <template slot-scope="scope">
          <template v-if="readonly">
            {{ scope.row.receivedQuantity }}
          </template>
          <template v-else>
            <el-input-number 
              v-model.number="scope.row.receivedQuantity" 
              :min="0" 
              :max="scope.row.orderedQuantity || 999999"
              @change="handleItemChange(scope.row)"
            ></el-input-number>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="unitPrice" label="单价" min-width="100" align="right">
        <template slot-scope="scope">
          <template v-if="readonly">
            {{ formatCurrency(scope.row.unitPrice) }}
          </template>
          <template v-else>
            <el-input-number 
              v-model.number="scope.row.unitPrice" 
              :min="0" 
              :precision="2" 
              @change="handleItemChange(scope.row)"
            ></el-input-number>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="subtotal" label="小计" min-width="120" align="right" :formatter="formatCurrency">
        <template slot-scope="scope">
          {{ formatCurrency(calculateSubtotal(scope.row)) }}
        </template>
      </el-table-column>
      <el-table-column prop="batchNo" label="批次号" min-width="120" v-if="showBatch">
        <template slot-scope="scope">
          <template v-if="readonly">
            {{ scope.row.batchNo }}
          </template>
          <template v-else>
            <el-input v-model="scope.row.batchNo" placeholder="请输入批次号" @input="handleItemChange(scope.row)"></el-input>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="expiryDate" label="有效期至" min-width="120" v-if="showExpiry">
        <template slot-scope="scope">
          <template v-if="readonly">
            {{ formatDate(scope.row.expiryDate) }}
          </template>
          <template v-else>
            <el-date-picker 
              v-model="scope.row.expiryDate" 
              type="date" 
              placeholder="选择日期" 
              value-format="yyyy-MM-dd"
              @change="handleItemChange(scope.row)"
            ></el-date-picker>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="storageLocation" label="存放位置" min-width="120" v-if="showStorage">
        <template slot-scope="scope">
          <template v-if="readonly">
            {{ scope.row.storageLocation }}
          </template>
          <template v-else>
            <el-input v-model="scope.row.storageLocation" placeholder="请输入存放位置" @input="handleItemChange(scope.row)"></el-input>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="150">
        <template slot-scope="scope">
          <template v-if="readonly">
            {{ scope.row.remark }}
          </template>
          <template v-else>
            <el-input v-model="scope.row.remark" placeholder="请输入备注" @input="handleItemChange(scope.row)"></el-input>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="100" align="center" v-if="!readonly">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="editItem(scope.row)">编辑</el-button>
          <el-button type="danger" size="mini" @click="removeItem(scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 工具栏 -->
    <div class="toolbar" v-if="!readonly">
      <el-button type="primary" icon="el-icon-plus" @click="addItem">添加明细</el-button>
      <el-button type="success" icon="el-icon-upload" @click="importItems">导入明细</el-button>
      <el-button type="info" icon="el-icon-download" @click="exportItems">导出明细</el-button>
      <el-button type="warning" icon="el-icon-delete" @click="removeSelectedItems" :disabled="selectedItems.length === 0">批量删除</el-button>
      <el-button type="primary" icon="el-icon-link" @click="linkPurchaseOrder" v-if="enableLinkPurchase">关联采购订单</el-button>
    </div>

    <!-- 汇总信息 -->
    <div class="summary-info">
      <div class="summary-item">
        <span class="summary-label">总项数：</span>
        <span class="summary-value">{{ items.length }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">总数量：</span>
        <span class="summary-value">{{ totalQuantity }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">总金额：</span>
        <span class="summary-value highlight">{{ formatCurrency(totalAmount) }}</span>
      </div>
    </div>

    <!-- 编辑明细对话框 -->
    <el-dialog
      title="编辑明细"
      :visible.sync="editDialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="120px">
        <el-form-item label="产品编码" prop="productCode">
          <el-input v-model="editForm.productCode" placeholder="请输入产品编码" clearable></el-input>
        </el-form-item>
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="editForm.productName" placeholder="请输入产品名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="规格型号" prop="specification">
          <el-input v-model="editForm.specification" placeholder="请输入规格型号" clearable></el-input>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-select v-model="editForm.unit" placeholder="请选择单位">
            <el-option v-for="unit in units" :key="unit.value" :label="unit.label" :value="unit.value"></el-option>
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="订购数量" prop="orderedQuantity">
              <el-input-number v-model.number="editForm.orderedQuantity" :min="0" placeholder="订购数量"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实收数量" prop="receivedQuantity">
              <el-input-number 
                v-model.number="editForm.receivedQuantity" 
                :min="0" 
                :max="editForm.orderedQuantity || 999999" 
                placeholder="实收数量"
              ></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="单价" prop="unitPrice">
          <el-input-number v-model.number="editForm.unitPrice" :min="0" :precision="2" placeholder="单价"></el-input-number>
        </el-form-item>
        <el-form-item v-if="showBatch" label="批次号" prop="batchNo">
          <el-input v-model="editForm.batchNo" placeholder="请输入批次号" clearable></el-input>
        </el-form-item>
        <el-form-item v-if="showExpiry" label="有效期至" prop="expiryDate">
          <el-date-picker v-model="editForm.expiryDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd"></el-date-picker>
        </el-form-item>
        <el-form-item v-if="showStorage" label="存放位置" prop="storageLocation">
          <el-input v-model="editForm.storageLocation" placeholder="请输入存放位置" clearable></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="editForm.remark" placeholder="请输入备注" rows="2"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </div>
    </el-dialog>

    <!-- 关联采购订单对话框 -->
    <el-dialog
      title="关联采购订单"
      :visible.sync="linkPurchaseDialogVisible"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-form :inline="true" :model="purchaseSearchForm" class="search-form">
        <el-form-item label="采购订单号">
          <el-input v-model="purchaseSearchForm.orderNo" placeholder="请输入采购订单号"></el-input>
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="purchaseSearchForm.supplierName" placeholder="请输入供应商名称"></el-input>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="purchaseSearchForm.status" placeholder="请选择状态">
            <el-option label="全部" value=""></el-option>
            <el-option label="已审核" value="APPROVED"></el-option>
            <el-option label="部分到货" value="PARTIALLY_RECEIVED"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchPurchaseOrders">查询</el-button>
          <el-button @click="resetPurchaseSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="purchaseOrdersData"
        style="width: 100%"
        @row-click="selectPurchaseOrder"
        highlight-current-row
      >
        <el-table-column prop="orderNo" label="采购订单号" min-width="150"></el-table-column>
        <el-table-column prop="supplierName" label="供应商" min-width="180"></el-table-column>
        <el-table-column prop="orderDate" label="订单日期" min-width="120" :formatter="formatDate"></el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="订单金额" min-width="120" align="right" :formatter="formatCurrency"></el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, jumper, total"
          :total="purchaseTotal"
          :current-page.sync="purchaseCurrentPage"
          :page-size.sync="purchasePageSize"
          @current-change="handlePurchaseCurrentChange"
          @size-change="handlePurchaseSizeChange"
        ></el-pagination>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="linkPurchaseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmLinkPurchase">确认关联</el-button>
      </div>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog
      title="确认操作"
      :visible.sync="confirmDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <p>{{ confirmMessage }}</p>
      <div slot="footer" class="dialog-footer">
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmAction">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ReceiptItems',
  props: {
    // 明细数据
    items: {
      type: Array,
      default: () => []
    },
    // 是否只读模式
    readonly: {
      type: Boolean,
      default: false
    },
    // 是否显示批次号
    showBatch: {
      type: Boolean,
      default: true
    },
    // 是否显示有效期
    showExpiry: {
      type: Boolean,
      default: true
    },
    // 是否显示存放位置
    showStorage: {
      type: Boolean,
      default: true
    },
    // 是否启用关联采购订单
    enableLinkPurchase: {
      type: Boolean,
      default: true
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // 选中的明细项
      selectedItems: [],
      // 编辑对话框
      editDialogVisible: false,
      editForm: {},
      currentEditIndex: -1,
      // 关联采购订单对话框
      linkPurchaseDialogVisible: false,
      purchaseSearchForm: {
        orderNo: '',
        supplierName: '',
        status: ''
      },
      purchaseOrdersData: [],
      purchaseCurrentPage: 1,
      purchasePageSize: 10,
      purchaseTotal: 0,
      selectedPurchaseOrder: null,
      // 确认对话框
      confirmDialogVisible: false,
      confirmMessage: '',
      confirmActionType: '',
      // 单位选项
      units: [
        { label: '个', value: '个' },
        { label: '件', value: '件' },
        { label: '箱', value: '箱' },
        { label: '袋', value: '袋' },
        { label: '米', value: '米' },
        { label: '千克', value: '千克' },
        { label: '吨', value: '吨' },
        { label: '套', value: '套' }
      ],
      // 编辑表单验证规则
      editRules: {
        productCode: [
          { required: true, message: '请输入产品编码', trigger: 'blur' }
        ],
        productName: [
          { required: true, message: '请输入产品名称', trigger: 'blur' }
        ],
        specification: [
          { required: true, message: '请输入规格型号', trigger: 'blur' }
        ],
        unit: [
          { required: true, message: '请选择单位', trigger: 'change' }
        ],
        orderedQuantity: [
          { required: true, message: '请输入订购数量', trigger: 'blur' },
          { type: 'number', min: 0, message: '订购数量必须大于等于0', trigger: 'blur' }
        ],
        receivedQuantity: [
          { required: true, message: '请输入实收数量', trigger: 'blur' },
          { type: 'number', min: 0, message: '实收数量必须大于等于0', trigger: 'blur' }
        ],
        unitPrice: [
          { required: true, message: '请输入单价', trigger: 'blur' },
          { type: 'number', min: 0, message: '单价必须大于等于0', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    // 计算总数量
    totalQuantity() {
      return this.items.reduce((total, item) => total + (item.receivedQuantity || 0), 0)
    },
    // 计算总金额
    totalAmount() {
      return this.items.reduce((total, item) => total + this.calculateSubtotal(item), 0)
    }
  },
  watch: {
    // 监听明细变化，通知父组件
    items: {
      handler(newValue) {
        this.$emit('change', newValue)
      },
      deep: true
    }
  },
  methods: {
    // 处理明细项变化
    handleItemChange(item) {
      // 重新计算小计
      item.subtotal = this.calculateSubtotal(item)
      // 通知父组件
      this.$emit('change', this.items)
    },
    
    // 计算小计
    calculateSubtotal(item) {
      return (item.receivedQuantity || 0) * (item.unitPrice || 0)
    },
    
    // 添加明细
    addItem() {
      const newItem = {
        id: Date.now().toString(),
        productCode: '',
        productName: '',
        specification: '',
        unit: '',
        orderedQuantity: 0,
        receivedQuantity: 0,
        unitPrice: 0,
        subtotal: 0,
        batchNo: '',
        expiryDate: '',
        storageLocation: '',
        remark: ''
      }
      this.items.push(newItem)
      // 自动打开编辑对话框
      this.editItem(newItem)
    },
    
    // 编辑明细
    editItem(item) {
      this.currentEditIndex = this.items.findIndex(i => i.id === item.id)
      if (this.currentEditIndex !== -1) {
        this.editForm = JSON.parse(JSON.stringify(item))
        this.editDialogVisible = true
      }
    },
    
    // 保存编辑
    saveEdit() {
      this.$refs.editForm.validate((valid) => {
        if (valid) {
          // 重新计算小计
          this.editForm.subtotal = this.calculateSubtotal(this.editForm)
          
          if (this.currentEditIndex !== -1) {
            this.$set(this.items, this.currentEditIndex, this.editForm)
            this.$emit('change', this.items)
            this.editDialogVisible = false
            this.$message.success('编辑成功')
          }
        }
      })
    },
    
    // 删除明细
    removeItem(index) {
      this.confirmMessage = '确定要删除这条明细吗？'
      this.confirmActionType = 'remove'
      this.confirmData = index
      this.confirmDialogVisible = true
    },
    
    // 批量删除
    removeSelectedItems() {
      if (this.selectedItems.length === 0) {
        this.$message.warning('请先选择要删除的明细')
        return
      }
      
      this.confirmMessage = `确定要删除选中的 ${this.selectedItems.length} 条明细吗？`
      this.confirmActionType = 'batchRemove'
      this.confirmDialogVisible = true
    },
    
    // 导入明细
    importItems() {
      this.$message.info('导入功能开发中')
    },
    
    // 导出明细
    exportItems() {
      this.$message.info('导出功能开发中')
    },
    
    // 关联采购订单
    linkPurchaseOrder() {
      this.linkPurchaseDialogVisible = true
      this.searchPurchaseOrders()
    },
    
    // 搜索采购订单
    searchPurchaseOrders() {
      // 模拟采购订单数据
      this.purchaseOrdersData = [
        {
          id: 'po1',
          orderNo: 'PO202401001',
          supplierName: '深圳精密科技有限公司',
          orderDate: '2024-01-10',
          status: 'APPROVED',
          totalAmount: 50000.00,
          items: [
            {
              productCode: 'PROD001',
              productName: '精密轴承',
              specification: '6205ZZ',
              unit: '个',
              quantity: 100,
              unitPrice: 200.00,
              receivedQuantity: 50
            },
            {
              productCode: 'PROD002',
              productName: '密封件',
              specification: 'TC50x65x7',
              unit: '个',
              quantity: 200,
              unitPrice: 100.00,
              receivedQuantity: 100
            }
          ]
        },
        {
          id: 'po2',
          orderNo: 'PO202401002',
          supplierName: '广州电子元件厂',
          orderDate: '2024-01-12',
          status: 'PARTIALLY_RECEIVED',
          totalAmount: 30000.00,
          items: [
            {
              productCode: 'ELEC001',
              productName: '电阻器',
              specification: '100Ω 1/4W',
              unit: '个',
              quantity: 500,
              unitPrice: 20.00,
              receivedQuantity: 200
            },
            {
              productCode: 'ELEC002',
              productName: '电容器',
              specification: '10μF 50V',
              unit: '个',
              quantity: 300,
              unitPrice: 40.00,
              receivedQuantity: 150
            }
          ]
        }
      ]
      this.purchaseTotal = this.purchaseOrdersData.length
    },
    
    // 重置采购订单搜索
    resetPurchaseSearch() {
      this.purchaseSearchForm = {
        orderNo: '',
        supplierName: '',
        status: ''
      }
      this.searchPurchaseOrders()
    },
    
    // 选择采购订单
    selectPurchaseOrder(row) {
      this.selectedPurchaseOrder = row
    },
    
    // 确认关联采购订单
    confirmLinkPurchase() {
      if (this.selectedPurchaseOrder) {
        // 将采购订单的未到货明细添加到回厂单明细中
        const newItems = this.selectedPurchaseOrder.items
          .filter(item => item.quantity > (item.receivedQuantity || 0))
          .map(item => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            productCode: item.productCode,
            productName: item.productName,
            specification: item.specification,
            unit: item.unit,
            orderedQuantity: item.quantity,
            receivedQuantity: 0,
            unitPrice: item.unitPrice,
            subtotal: 0,
            batchNo: '',
            expiryDate: '',
            storageLocation: '',
            remark: ''
          }))
        
        this.items.push(...newItems)
        this.linkPurchaseDialogVisible = false
        this.$message.success(`成功关联 ${newItems.length} 条采购订单明细`)
        this.$emit('change', this.items)
      } else {
        this.$message.warning('请选择一个采购订单')
      }
    },
    
    // 确认操作
    confirmAction() {
      if (this.confirmActionType === 'remove') {
        this.items.splice(this.confirmData, 1)
        this.$message.success('删除成功')
      } else if (this.confirmActionType === 'batchRemove') {
        // 获取选中项的索引并按降序排列，从后往前删除
        const indexes = this.selectedItems
          .map(item => this.items.findIndex(i => i.id === item.id))
          .filter(index => index !== -1)
          .sort((a, b) => b - a)
        
        indexes.forEach(index => {
          this.items.splice(index, 1)
        })
        
        this.selectedItems = []
        this.$message.success(`成功删除 ${indexes.length} 条明细`)
      }
      
      this.confirmDialogVisible = false
      this.$emit('change', this.items)
    },
    
    // 选择行变化
    handleSelectionChange(val) {
      this.selectedItems = val
    },
    
    // 获取状态标签类型
    getStatusTagType(status) {
      const typeMap = {
        'APPROVED': 'success',
        'PARTIALLY_RECEIVED': 'warning'
      }
      return typeMap[status] || 'info'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        'APPROVED': '已审核',
        'PARTIALLY_RECEIVED': '部分到货'
      }
      return textMap[status] || status
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      return date
    },
    
    // 格式化货币
    formatCurrency(value) {
      if (value === null || value === undefined || value === '') return '0.00'
      return Number(value).toFixed(2)
    },
    
    // 采购订单分页处理
    handlePurchaseCurrentChange(val) {
      this.purchaseCurrentPage = val
      this.searchPurchaseOrders()
    },
    
    handlePurchaseSizeChange(val) {
      this.purchasePageSize = val
      this.purchaseCurrentPage = 1
      this.searchPurchaseOrders()
    }
  }
}
</script>

<style scoped>
.receipt-items-container {
  padding: 10px 0;
}

.toolbar {
  margin: 15px 0;
  display: flex;
  gap: 10px;
}

.summary-info {
  margin-top: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  justify-content: flex-end;
  gap: 30px;
}

.summary-item {
  display: flex;
  align-items: center;
}

.summary-label {
  font-weight: bold;
  color: #606266;
  margin-right: 5px;
}

.summary-value {
  color: #333;
  font-size: 16px;
}

.summary-value.highlight {
  color: #f56c6c;
  font-size: 18px;
}

.search-form {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.el-table .el-table__cell {
  padding: 12px 0;
}
</style>