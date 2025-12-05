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
      <el-select v-model="statusFilter" placeholder="订单状态" clearable style="width: 180px; margin-right: 10px;">
        <el-option label="全部" value="" />
        <el-option label="待下单" value="待下单" />
        <el-option label="已模拟排程待下单" value="已模拟排程待下单" />
        <el-option label="草稿" value="draft" />
        <el-option label="待审核" value="pending" />
        <el-option label="已审核" value="approved" />
        <el-option label="生产中" value="production" />
        <el-option label="已发货" value="shipped" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
        <el-option label="手动终止" value="terminated" />
      </el-select>
      
      <!-- 模拟排程订单提示 -->
      <el-tag v-if="simulatedOrders.length > 0" type="warning" style="margin-right: 10px;">
        当前有 {{ simulatedOrders.length }} 个模拟排程订单未下单
      </el-tag>
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
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handleView(row)">查看</el-button>
            <el-button 
              link 
              type="warning" 
              @click="handleSimulateScheduling(row)"
              v-if="row.orderStatus === '待下单' || row.orderStatus === '草稿'"
            >
              模拟排程
            </el-button>
            <el-button 
              link 
              type="success" 
              @click="handleConfirmOrder(row)"
              v-if="row.orderStatus === '待下单' || row.orderStatus === '已模拟排程待下单'"
            >
              确认下单
            </el-button>
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
          <el-form label-width="160px">
            <el-form-item label="审批流程">
              <el-select v-model="settings.approvalFlow" style="width: 100%;">
                <el-option label="单级审批" value="single" />
                <el-option label="多级审批" value="multi" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="模拟排程设置" name="scheduling">
          <el-form label-width="200px">
            <el-form-item label="模拟排程失效天数">
              <el-input-number 
                v-model="settings.simulationExpireDays" 
                :min="1" 
                :max="30" 
                style="width: 200px;"
              />
              <span style="margin-left: 10px; color: #909399;">天</span>
            </el-form-item>
            <el-form-item label="说明">
              <el-alert 
                type="info" 
                :closable="false"
                show-icon
              >
                <template #title>
                  <div style="line-height: 1.6;">
                    模拟排程期间，当新增订单的承诺交期减去设置天数小于等于本订单的预计完成日期，<br/>
                    则本订单的模拟排程结果失效，需要重新模拟排程。
                  </div>
                </template>
              </el-alert>
            </el-form-item>
            <el-form-item label="示例">
              <el-alert type="warning" :closable="false">
                <template #title>
                  <div style="line-height: 1.6;">
                    <b>示例：</b>设置失效天数为 3 天<br/>
                    A订单：预计完成日期 = 2025-12-10<br/>
                    B订单（新增）：承诺交期 = 2025-12-12<br/>
                    <b>计算：</b>2025-12-12 - 3天 = 2025-12-09<br/>
                    <b>结果：</b>2025-12-09 < 2025-12-10，<span style="color: #E6A23C;">→ A订单模拟排程失效</span>
                  </div>
                </template>
              </el-alert>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="业务变量设置" name="variables">
          <el-form label-width="160px">
            <el-form-item label="默认币种">
              <el-select v-model="settings.defaultCurrency" style="width: 200px;">
                <el-option label="人民币 (CNY)" value="CNY" />
                <el-option label="美元 (USD)" value="USD" />
                <el-option label="欧元 (EUR)" value="EUR" />
              </el-select>
            </el-form-item>
            <el-form-item label="默认汇率">
              <el-input-number v-model="settings.defaultExchangeRate" :min="0.1" :step="0.1" style="width: 200px;" />
            </el-form-item>
            <el-form-item label="默认税率">
              <el-input-number v-model="settings.defaultTaxRate" :min="0" :max="100" style="width: 200px;" />
              <span style="margin-left: 10px; color: #909399;">%</span>
            </el-form-item>
            <el-form-item label="默认付款方式">
              <el-select v-model="settings.defaultPaymentMethod" style="width: 200px;">
                <el-option label="预付+尾款" value="预付+尾款" />
                <el-option label="货到付款" value="货到付款" />
                <el-option label="月结" value="月结" />
              </el-select>
            </el-form-item>
            <el-form-item label="默认送货方式">
              <el-select v-model="settings.defaultDeliveryMethod" style="width: 200px;">
                <el-option label="快递" value="快递" />
                <el-option label="物流" value="物流" />
                <el-option label="自提" value="自提" />
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
        :order-id="currentOrder?.id" 
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
import { salesOrderApi } from '@/api/salesOrder'
import { Search, Setting, Plus, UploadFilled } from '@element-plus/icons-vue'
import SalesOrderCreate from './SalesOrderCreate.vue'
import SalesOrderView from './SalesOrderView.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 数据
const tableRef = ref(null)
const searchText = ref('')
const statusFilter = ref('')
const simulatingOrderId = ref(null) // 当前正在模拟排程的订单ID
const simulatedOrders = ref([]) // 已模拟排程的订单列表
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
const tableData = ref([])

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
  orderNoRule: 'SO{YYYY}{MM}{DD}{####}',
  simulationExpireDays: 1, // 模拟排程失效天数
  defaultCurrency: 'CNY', // 默认币种
  defaultExchangeRate: 1.0, // 默认汇率
  defaultTaxRate: 13, // 默认税率
  defaultPaymentMethod: '预付+尾款', // 默认付款方式
  defaultDeliveryMethod: '快递' // 默认送货方式
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

// 加载订单数据
const loadOrders = async () => {
  try {
    const response = await salesOrderApi.getSalesOrders({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    
    if (response.data.success) {
      const orders = response.data.data.list
      tableData.value = orders.map(order => ({
        // 基本信息
        id: order.id,
        internalOrderNo: order.internal_order_no,
        customerOrderNo: order.customer_order_no,
        customerName: order.customer_name,
        customerId: order.customer_id,
        salesperson: order.salesperson,
        quotationNo: order.quotation_no,
        orderType: order.order_type,
        orderStatus: order.status || '待下单',
        
        // 时间信息
        orderTime: order.order_time,
        promisedDelivery: order.promised_delivery,
        customerDelivery: order.customer_delivery,
        estimatedCompletionDate: order.estimated_completion_date,
        createTime: new Date(order.created_at).toLocaleString('zh-CN'),
        updateTime: order.updated_at ? new Date(order.updated_at).toLocaleString('zh-CN') : null,
        
        // 销售部门和物流信息
        salesDepartment: order.sales_department,
        deliveryMethod: order.delivery_method,
        returnOrderNo: order.return_order_no,
        
        // 金额信息
        orderCurrency: order.order_currency,
        currentExchangeRate: order.current_exchange_rate,
        taxRate: order.tax_rate,
        totalAmountExcludingTax: order.total_amount_excluding_tax,
        totalAmountIncludingTax: order.total_amount_including_tax,
        totalAmount: order.total_amount,
        
        // 附件和说明
        orderAttachment: order.order_attachment,
        orderNotes: order.order_notes,
        
        // 包装信息
        packagingMethod: order.packaging_method,
        packagingRequirements: order.packaging_requirements,
        packagingAttachment: order.packaging_attachment,
        
        // 收货信息
        consignee: order.consignee,
        deliveryAddress: order.delivery_address,
        billRecipient: order.bill_recipient,
        billAddress: order.bill_address,
        
        // 回款信息
        paymentMethod: order.payment_method,
        advancePaymentRatio: order.advance_payment_ratio,
        fees: order.fees,
        paymentPlan: order.payment_plan,
        totalReceivable: order.total_receivable,
        plannedPaymentDate: order.planned_payment_date,
        plannedPaymentAmount: order.planned_payment_amount,
        receivedAmount: order.received_amount || 0,
        unreceivedAmount: order.unreceived_amount || 0,
        
        // 备注
        remark: order.remark,
        
        // 完整订单数据(用于编辑和查看)
        orderDetail: order
      }))
      totalCount.value = response.data.data.total
      console.log('✅ 从后端加载订单:', tableData.value.length, '条')
    }
  } catch (error) {
    console.error('❌ 加载订单失败:', error)
    ElMessage.error('加载订单数据失败')
  }
}

const handleCreateSuccess = async (orderData) => {
  createDialogVisible.value = false
  ElMessage.success('订单创建成功！')
  await loadOrders() // 重新加载数据
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
    
    const ids = selectedRows.value.map(row => row.id)
    const response = await salesOrderApi.batchDeleteSalesOrders(ids)
    
    if (response.data.success) {
      selectedRows.value = []
      ElMessage.success('删除成功')
      await loadOrders()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleDeleteRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除订单"${row.internalOrderNo}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await salesOrderApi.deleteSalesOrder(row.id)
    if (response.data.success) {
      ElMessage.success('删除成功')
      await loadOrders()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleEdit = async (row) => {
  try {
    // 从后端重新获取完整数据
    const response = await salesOrderApi.getSalesOrderById(row.id)
    if (response.data && response.data.success) {
      currentOrder.value = response.data.data
      editDialogVisible.value = true
    } else {
      ElMessage.error('获取订单详情失败')
    }
  } catch (error) {
    console.error('❌ 获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  }
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

const handleView = async (row) => {
  // 直接传递订单ID,由查看组件自行加载
  currentOrder.value = { id: row.id }
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

const handleRefresh = async () => {
  await loadOrders()
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
  
  // 同步保存到业务设置服务
  import('@/services/businessSettingsService.js').then(({ updateModuleSettings }) => {
    updateModuleSettings('scheduling', {
      simulationExpireDays: settings.value.simulationExpireDays
    })
    updateModuleSettings('order', {
      defaultCurrency: settings.value.defaultCurrency,
      defaultExchangeRate: settings.value.defaultExchangeRate,
      defaultTaxRate: settings.value.defaultTaxRate,
      defaultPaymentMethod: settings.value.defaultPaymentMethod,
      defaultDeliveryMethod: settings.value.defaultDeliveryMethod
    })
  })
  
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

// 模拟排程
const handleSimulateScheduling = async (row) => {
  try {
    // 显示模拟排程说明
    await ElMessageBox.confirm(
      '模拟排程计算期间不考虑同时期模拟排程的订单，只考虑已确认下单的订单。如有需要请联系开发员增加考虑其他模拟排程模式。',
      '模拟排程说明',
      {
        confirmButtonText: '开始模拟排程',
        cancelButtonText: '取消',
        type: 'info',
        dangerouslyUseHTMLString: true
      }
    )

    simulatingOrderId.value = row.id
    ElMessage.loading('正在模拟排程，请稍候...')

    // 调用模拟排程服务
    const { simulateScheduling } = await import('@/services/schedulingSimulationService.js')
    const result = await simulateScheduling({
      orderId: row.id,
      orderData: row,
      excludeSimulatedOrders: true // 不考虑其他模拟排程订单
    })

    if (result.success) {
      // 更新订单状态
      row.orderStatus = '已模拟排程待下单'
      row.estimatedCompletionDate = result.estimatedCompletionDate
      row.simulationDate = new Date().toLocaleString('zh-CN')

      // 添加到已模拟列表
      if (!simulatedOrders.value.find(o => o.id === row.id)) {
        simulatedOrders.value.push({
          id: row.id,
          orderNo: row.internalOrderNo,
          simulationDate: row.simulationDate,
          estimatedCompletionDate: row.estimatedCompletionDate
        })
      }

      // 保存到数据库
      await salesOrderApi.updateSalesOrder(row.id, {
        status: '已模拟排程待下单',
        estimated_completion_date: result.estimatedCompletionDate,
        simulation_result: JSON.stringify(result)
      })

      ElMessage.success(
        `模拟排程完成！预计完成日期：${result.estimatedCompletionDate}\n` +
        `当前有 ${simulatedOrders.value.length} 个模拟排程订单待下单`
      )
    } else {
      ElMessage.error(`模拟排程失败：${result.message}`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('模拟排程错误:', error)
      ElMessage.error('模拟排程失败')
    }
  } finally {
    simulatingOrderId.value = null
  }
}

// 确认下单
const handleConfirmOrder = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要正式下单吗？\n订单编号：${row.internalOrderNo}\n客户：${row.customerName}`,
      '确认下单',
      {
        confirmButtonText: '确认下单',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 更新订单状态为已下单
    row.orderStatus = '已下单'
    row.orderTime = new Date().toLocaleString('zh-CN')

    // 从模拟列表中移除
    const index = simulatedOrders.value.findIndex(o => o.id === row.id)
    if (index !== -1) {
      simulatedOrders.value.splice(index, 1)
    }

    // 保存到数据库
    await salesOrderApi.updateSalesOrder(row.id, {
      status: '已下单',
      order_time: new Date().toISOString()
    })

    ElMessage.success('订单已确认下单！')
    await loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('确认下单错误:', error)
      ElMessage.error('确认下单失败')
    }
  }
}

// 生命周期
onMounted(async () => {
  // 加载订单数据
  await loadOrders()
  
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
