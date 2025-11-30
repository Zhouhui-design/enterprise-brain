<template>
  <div class="sales-order-list-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>销售订单管理</h2>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
        <el-button type="danger" :disabled="!hasSelection" @click="handleManualTerminate">手动终止</el-button>
        <el-button @click="handleDraft">草稿箱</el-button>
        <el-button type="danger" :disabled="!hasSelection" @click="handleDelete">删除</el-button>
        <el-button @click="handleFieldManagement">字段管理</el-button>
        <el-button @click="handleImport">导入</el-button>
        <el-button @click="handleExport">导出</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
        <el-button @click="handleChange">变更</el-button>
        <el-button @click="handlePrint">打印</el-button>
        <el-button @click="handlePause">暂停</el-button>
        <el-button type="primary" @click="handleSettings" circle>
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-area">
      <el-input 
        v-model="searchText" 
        placeholder="搜索订单编号、客户名称..." 
        clearable
        style="width: 300px; margin-right: 10px;"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="订单状态" clearable style="width: 150px; margin-right: 10px;">
        <el-option label="全部" value="" />
        <el-option label="草稿" value="draft" />
        <el-option label="待审核" value="pending" />
        <el-option label="已审核" value="approved" />
        <el-option label="生产中" value="production" />
        <el-option label="已发货" value="shipped" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
        <el-option label="手动终止" value="terminated" />
      </el-select>
    </div>

    <!-- 主表格 -->
    <div class="table-container">
      <el-table
        ref="tableRef"
        :data="filteredTableData"
        stripe
        border
        :height="tableHeight"
        @selection-change="handleSelectionChange"
        :row-style="getRowStyle"
      >
        <el-table-column type="selection" width="55" fixed="left" />
        <el-table-column prop="orderStatus" label="订单状态" width="100" fixed="left">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.orderStatus)">{{ row.orderStatus || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="internalOrderNo" label="内部销售订单编号" width="160" fixed="left" />
        <el-table-column prop="customerOrderNo" label="客户订单编号" width="150" />
        <el-table-column prop="customerName" label="客户名称" width="150" />
        <el-table-column prop="salesperson" label="销售员" width="100" />
        <el-table-column prop="quotationNo" label="报价单号" width="140" />
        <el-table-column prop="orderTime" label="下单时间" width="160" />
        <el-table-column prop="promisedDelivery" label="承诺交期" width="120" />
        <el-table-column prop="returnOrderNo" label="销售退货单号" width="140" />
        <el-table-column prop="deliveryMethod" label="送货方式" width="120" />
        <el-table-column prop="salesDepartment" label="销售部门" width="120" />
        <el-table-column prop="orderCurrency" label="订单币种" width="100" />
        <el-table-column prop="currentExchangeRate" label="当前汇率" width="100" />
        <el-table-column prop="taxRate" label="税率" width="80" />
        <el-table-column prop="customerDelivery" label="客户交期" width="120" />
        <el-table-column prop="estimatedCompletionDate" label="预计完成日期" width="140" />
        <el-table-column prop="orderAttachment" label="订单附件" width="100">
          <template #default="{ row }">
            <el-button v-if="row.orderAttachment" link type="primary" size="small">查看</el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNotes" label="订单说明" width="150" show-overflow-tooltip />
        <el-table-column prop="totalAmountExcludingTax" label="订单总金额（未税）" width="160" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.totalAmountExcludingTax) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmountIncludingTax" label="订单总金额（含税）" width="160" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.totalAmountIncludingTax) }}
          </template>
        </el-table-column>
        <el-table-column prop="packagingMethod" label="包装方式" width="120" />
        <el-table-column prop="packagingRequirements" label="包装需求描述" width="150" show-overflow-tooltip />
        <el-table-column prop="packagingAttachment" label="包装附件" width="100">
          <template #default="{ row }">
            <el-button v-if="row.packagingAttachment" link type="primary" size="small">查看</el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="consignee" label="收货人" width="100" />
        <el-table-column prop="deliveryAddress" label="收货地址" width="200" show-overflow-tooltip />
        <el-table-column prop="billRecipient" label="账单收件人" width="120" />
        <el-table-column prop="billAddress" label="账单收件地址" width="200" show-overflow-tooltip />
        <el-table-column prop="paymentMethod" label="收款方式" width="120" />
        <el-table-column prop="advancePaymentRatio" label="预收占比" width="100" />
        <el-table-column prop="fees" label="手续费或其他费用" width="140" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.fees) }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentPlan" label="回款计划" width="120" />
        <el-table-column prop="totalReceivable" label="应回款总额" width="140" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.totalReceivable) }}
          </template>
        </el-table-column>
        <el-table-column prop="plannedPaymentDate" label="计划回款日期" width="140" />
        <el-table-column prop="plannedPaymentAmount" label="计划回款金额" width="140" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.plannedPaymentAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="orderType" label="订单类型" width="100" />
        
        <!-- 产品相关字段 -->
        <el-table-column prop="productCode" label="产品编号" width="140" />
        <el-table-column prop="productName" label="产品名称" width="150" />
        <el-table-column prop="productImage" label="产品图片" width="100">
          <template #default="{ row }">
            <el-image v-if="row.productImage" :src="row.productImage" style="width: 50px; height: 50px;" fit="cover" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="salesBomSelection" label="销售BOM选择" width="140" />
        <el-table-column prop="majorCategory" label="大类" width="100" />
        <el-table-column prop="middleCategory" label="中类" width="100" />
        <el-table-column prop="minorCategory" label="小类" width="100" />
        <el-table-column prop="productSource" label="产品来源" width="100" />
        <el-table-column prop="productSpec" label="产品规格" width="150" show-overflow-tooltip />
        <el-table-column prop="productColor" label="产品颜色" width="100" />
        <el-table-column prop="productMaterial" label="产品材质" width="120" />
        <el-table-column prop="productDescription" label="产品详述" width="200" show-overflow-tooltip />
        <el-table-column prop="realtimeInventory" label="实时库存" width="100" align="right" />
        <el-table-column prop="availableInventory" label="可销售库存" width="120" align="right" />
        <el-table-column prop="effectiveInventory" label="有效库存" width="100" align="right" />
        <el-table-column prop="estimatedBalance" label="预计结存" width="100" align="right" />
        <el-table-column prop="productUnit" label="产品单位" width="100" />
        <el-table-column prop="orderQuantity" label="订单数量" width="100" align="right" />
        <el-table-column prop="unitPriceExcludingTax" label="销售单价（未税）" width="150" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.unitPriceExcludingTax) }}
          </template>
        </el-table-column>
        <el-table-column prop="productTaxRate" label="税率" width="80" />
        <el-table-column prop="unitPriceIncludingTax" label="含税单价" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.unitPriceIncludingTax) }}
          </template>
        </el-table-column>
        <el-table-column prop="amountExcludingTax" label="金额（未税）" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.amountExcludingTax) }}
          </template>
        </el-table-column>
        <el-table-column prop="amountIncludingTax" label="含税金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.amountIncludingTax) }}
          </template>
        </el-table-column>
        <el-table-column prop="appliedShipmentQty" label="已申请发货数量" width="140" align="right" />
        <el-table-column prop="unappliedShipmentQty" label="未申请发货数量" width="140" align="right" />
        <el-table-column prop="shippedQty" label="已发货数量" width="120" align="right" />
        <el-table-column prop="unshippedQty" label="未发货数量" width="120" align="right" />
        <el-table-column prop="receivedAmount" label="已回款金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.receivedAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="unreceivedAmount" label="未回款金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.unreceivedAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="hasAfterSales" label="是否有售后" width="120">
          <template #default="{ row }">
            <el-tag :type="row.hasAfterSales ? 'warning' : 'success'">{{ row.hasAfterSales ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="afterSalesDetails" label="售后详情" width="150" show-overflow-tooltip />
        <el-table-column prop="afterSalesOrderNo" label="售后订单号" width="140" />
        
        <!-- 操作列 -->
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handleView(row)">查看</el-button>
            <el-button link type="danger" @click="handleDeleteRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 页面设置对话框 -->
    <el-dialog v-model="settingsVisible" title="页面设置" width="800px">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="流程设置" name="workflow">
          <el-form label-width="120px">
            <el-form-item label="审批流程">
              <el-select v-model="settings.approvalFlow" style="width: 100%;">
                <el-option label="单级审批" value="single" />
                <el-option label="多级审批" value="multi" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="菜单设置" name="menu">
          <el-form label-width="120px">
            <el-form-item label="菜单位置">
              <el-radio-group v-model="settings.menuPosition">
                <el-radio label="top">顶部</el-radio>
                <el-radio label="left">左侧</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="颜色设置" name="color">
          <el-form label-width="120px">
            <el-form-item label="主题色">
              <el-color-picker v-model="settings.themeColor" />
            </el-form-item>
            <el-form-item label="页面背景色">
              <el-color-picker v-model="settings.backgroundColor" />
            </el-form-item>
            <el-form-item label="表格行背景色">
              <el-color-picker v-model="settings.tableRowColor" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="编码设置" name="encoding">
          <el-form label-width="120px">
            <el-form-item label="订单编号规则">
              <el-input v-model="settings.orderNoRule" placeholder="如: SO{YYYY}{MM}{DD}{####}" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="settingsVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSettings">保存</el-button>
      </template>
    </el-dialog>

    <!-- 字段管理对话框 -->
    <el-dialog v-model="fieldManagementVisible" title="字段管理" width="600px">
      <el-checkbox-group v-model="visibleFields">
        <div v-for="field in allFields" :key="field.prop" style="margin-bottom: 10px;">
          <el-checkbox :label="field.prop">{{ field.label }}</el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="fieldManagementVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveFieldSettings">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增订单对话框 -->
    <el-dialog 
      v-model="createDialogVisible" 
      title="新增销售订单" 
      width="90%" 
      :close-on-click-modal="false"
      destroy-on-close
    >
      <SalesOrderCreate @success="handleCreateSuccess" @cancel="createDialogVisible = false" />
    </el-dialog>

    <!-- 编辑订单对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      title="编辑销售订单" 
      width="90%" 
      :close-on-click-modal="false"
      destroy-on-close
    >
      <SalesOrderCreate 
        :order-data="currentOrder" 
        :is-edit="true"
        @success="handleEditSuccess" 
        @cancel="editDialogVisible = false" 
      />
    </el-dialog>

    <!-- 查看订单对话框 -->
    <el-dialog 
      v-model="viewDialogVisible" 
      title="销售订单详情" 
      width="80%" 
      :close-on-click-modal="false"
    >
      <SalesOrderView 
        :order-data="currentOrder" 
        @close="viewDialogVisible = false" 
      />
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入销售订单" width="500px">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持 xlsx/xls 格式文件，大小不超过 10MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportConfirm">确定导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Setting, Plus, UploadFilled } from '@element-plus/icons-vue'
import SalesOrderCreate from './SalesOrderCreate.vue'
import SalesOrderView from './SalesOrderView.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 数据
const tableRef = ref(null)
const searchText = ref('')
const statusFilter = ref('')
const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const tableHeight = ref(600)
const settingsVisible = ref(false)
const fieldManagementVisible = ref(false)
const createDialogVisible = ref(false)
const editDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const importDialogVisible = ref(false)
const currentOrder = ref(null)
const activeTab = ref('workflow')

// 表格数据（模拟数据）
const tableData = ref([
  {
    id: 1,
    orderStatus: '待审核',
    internalOrderNo: 'SO2025112900001',
    customerOrderNo: 'CO-2025-001',
    customerName: '测试客户A',
    salesperson: '张三',
    quotationNo: 'QT-2025-001',
    orderTime: '2025-11-29 10:00:00',
    promisedDelivery: '2025-12-15',
    returnOrderNo: '',
    deliveryMethod: '快递',
    salesDepartment: '华东区',
    orderCurrency: 'CNY',
    currentExchangeRate: '1.00',
    taxRate: '13%',
    customerDelivery: '2025-12-15',
    estimatedCompletionDate: '2025-12-10',
    orderAttachment: '',
    orderNotes: '客户要求加急',
    totalAmountExcludingTax: 100000,
    totalAmountIncludingTax: 113000,
    packagingMethod: '纸箱',
    packagingRequirements: '需要防震包装',
    packagingAttachment: '',
    consignee: '李四',
    deliveryAddress: '上海市浦东新区XX路XX号',
    billRecipient: '财务部',
    billAddress: '上海市浦东新区XX路XX号',
    paymentMethod: '银行转账',
    advancePaymentRatio: '30%',
    fees: 500,
    paymentPlan: '3期',
    totalReceivable: 113000,
    plannedPaymentDate: '2025-12-20',
    plannedPaymentAmount: 37667,
    createTime: '2025-11-29 09:00:00',
    orderType: '标准订单',
    productCode: 'P001',
    productName: '测试产品',
    productImage: '',
    salesBomSelection: 'BOM-001',
    majorCategory: '电子产品',
    middleCategory: '手机',
    minorCategory: '智能手机',
    productSource: '自产',
    productSpec: '6.5寸屏',
    productColor: '黑色',
    productMaterial: '铝合金',
    productDescription: '高端智能手机',
    realtimeInventory: 1000,
    availableInventory: 800,
    effectiveInventory: 900,
    estimatedBalance: 700,
    productUnit: '台',
    orderQuantity: 100,
    unitPriceExcludingTax: 1000,
    productTaxRate: '13%',
    unitPriceIncludingTax: 1130,
    amountExcludingTax: 100000,
    amountIncludingTax: 113000,
    appliedShipmentQty: 0,
    unappliedShipmentQty: 100,
    shippedQty: 0,
    unshippedQty: 100,
    receivedAmount: 0,
    unreceivedAmount: 113000,
    hasAfterSales: false,
    afterSalesDetails: '',
    afterSalesOrderNo: ''
  }
])

// 下一个订单ID
const nextOrderId = ref(2)

// 所有字段配置
const allFields = ref([
  { prop: 'orderStatus', label: '订单状态' },
  { prop: 'internalOrderNo', label: '内部销售订单编号' },
  { prop: 'customerOrderNo', label: '客户订单编号' },
  { prop: 'customerName', label: '客户名称' },
  // ... 其他字段
])

const visibleFields = ref([])

// 设置
const settings = ref({
  approvalFlow: 'single',
  menuPosition: 'left',
  themeColor: '#409EFF',
  backgroundColor: '#f5f7fa',
  tableRowColor: '#ffffff',
  orderNoRule: 'SO{YYYY}{MM}{DD}{####}'
})

// 计算属性
const hasSelection = computed(() => selectedRows.value.length > 0)

const filteredTableData = computed(() => {
  let data = tableData.value
  
  // 搜索过滤
  if (searchText.value) {
    data = data.filter(row => 
      row.internalOrderNo.includes(searchText.value) ||
      row.customerName.includes(searchText.value)
    )
  }
  
  // 状态过滤
  if (statusFilter.value) {
    data = data.filter(row => row.orderStatus === statusFilter.value)
  }
  
  totalCount.value = data.length
  return data.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
})

// 方法
const formatCurrency = (value) => {
  if (!value) return '¥0.00'
  return `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const getStatusType = (status) => {
  const typeMap = {
    '草稿': 'info',
    '待审核': 'warning',
    '已审核': 'success',
    '生产中': 'primary',
    '已发货': 'primary',
    '已完成': 'success',
    '已取消': 'danger',
    '手动终止': 'danger'
  }
  return typeMap[status] || 'info'
}

const getRowStyle = ({ row }) => {
  return {
    backgroundColor: settings.value.tableRowColor
  }
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 工具栏操作
const handleCreate = () => {
  createDialogVisible.value = true
}

const handleCreateSuccess = (orderData) => {
  // 生成订单编号
  const today = new Date()
  const orderNo = `SO${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}${String(nextOrderId.value).padStart(5, '0')}`
  
  // 添加新订单
  const newOrder = {
    ...orderData,
    id: nextOrderId.value,
    internalOrderNo: orderNo,
    orderStatus: '草稿',
    createTime: new Date().toLocaleString('zh-CN')
  }
  
  tableData.value.unshift(newOrder)
  nextOrderId.value++
  
  createDialogVisible.value = false
  ElMessage.success(`订单"${orderNo}"创建成功！`)
}

const handleManualTerminate = async () => {
  try {
    await ElMessageBox.confirm(`确定要终止选中的 ${selectedRows.value.length} 个订单吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 更新订单状态为手动终止
    selectedRows.value.forEach(row => {
      const order = tableData.value.find(o => o.id === row.id)
      if (order) {
        order.orderStatus = '手动终止'
      }
    })
    
    selectedRows.value = []
    ElMessage.success('订单已手动终止')
  } catch {}
}

const handleDraft = () => {
  ElMessage.info('打开草稿箱')
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个订单吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 删除选中的订单
    const deleteIds = selectedRows.value.map(row => row.id)
    tableData.value = tableData.value.filter(row => !deleteIds.includes(row.id))
    selectedRows.value = []
    
    ElMessage.success('删除成功')
  } catch {}
}

const handleDeleteRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除订单"${row.internalOrderNo}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {}
}

const handleEdit = (row) => {
  currentOrder.value = { ...row }
  editDialogVisible.value = true
}

const handleEditSuccess = (orderData) => {
  const index = tableData.value.findIndex(o => o.id === orderData.id)
  if (index !== -1) {
    tableData.value[index] = {
      ...orderData,
      updateTime: new Date().toLocaleString('zh-CN')
    }
  }
  editDialogVisible.value = false
  ElMessage.success('订单更新成功')
}

const handleView = (row) => {
  currentOrder.value = { ...row }
  viewDialogVisible.value = true
}

const handleFieldManagement = () => {
  fieldManagementVisible.value = true
}

const handleImport = () => {
  importDialogVisible.value = true
}

const handleFileChange = (file) => {
  console.log('选择文件:', file)
}

const handleImportConfirm = () => {
  ElMessage.success('导入成功')
  importDialogVisible.value = false
}

const handleExport = () => {
  // 导出当前筛选的数据
  const dataToExport = filteredTableData.value
  
  // 模拟CSV导出（实际项目中可使用xlsx库）
  let csvContent = '订单状态,内部订单编号,客户订单编号,客户名称,销售员\n'
  dataToExport.forEach(row => {
    csvContent += `${row.orderStatus},${row.internalOrderNo},${row.customerOrderNo},${row.customerName},${row.salesperson}\n`
  })
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `销售订单_${new Date().getTime()}.csv`
  link.click()
  
  ElMessage.success(`导出成功，共 ${dataToExport.length} 条记录`)
}

const handleRefresh = () => {
  ElMessage.success('刷新成功')
}

const handleChange = () => {
  ElMessage.info('变更功能')
}

const handlePrint = () => {
  window.print()
}

const handlePause = () => {
  ElMessage.info('暂停功能')
}

const handleSettings = () => {
  settingsVisible.value = true
}

const handleSaveSettings = () => {
  // 保存设置到localStorage
  localStorage.setItem('salesOrderSettings', JSON.stringify(settings.value))
  ElMessage.success('设置已保存')
  settingsVisible.value = false
  // 应用设置
  applySettings()
}

const handleSaveFieldSettings = () => {
  localStorage.setItem('salesOrderVisibleFields', JSON.stringify(visibleFields.value))
  ElMessage.success('字段设置已保存')
  fieldManagementVisible.value = false
}

const applySettings = () => {
  // 应用主题色
  document.documentElement.style.setProperty('--el-color-primary', settings.value.themeColor)
  // 应用背景色
  const container = document.querySelector('.sales-order-list-container')
  if (container) {
    container.style.backgroundColor = settings.value.backgroundColor
  }
}

// 生命周期
onMounted(() => {
  // 加载保存的设置
  const savedSettings = localStorage.getItem('salesOrderSettings')
  if (savedSettings) {
    settings.value = JSON.parse(savedSettings)
    applySettings()
  }
  
  // 加载字段设置
  const savedFields = localStorage.getItem('salesOrderVisibleFields')
  if (savedFields) {
    visibleFields.value = JSON.parse(savedFields)
  } else {
    visibleFields.value = allFields.value.map(f => f.prop)
  }
  
  // 计算表格高度
  const updateTableHeight = () => {
    const windowHeight = window.innerHeight
    tableHeight.value = windowHeight - 300
  }
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
})
</script>

<style scoped>
.sales-order-list-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-left h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.search-area {
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-container {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 打印样式 */
@media print {
  .toolbar,
  .search-area,
  .pagination-container {
    display: none;
  }
}
</style>
