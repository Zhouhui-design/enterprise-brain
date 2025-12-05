<template>
  <div class="material-demand-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>物料需求明细</h2>
        <p class="subtitle">拆分MRP需求，关联采购/库存状态</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出明细
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="pageSettingsVisible = true">
          <el-icon><Setting /></el-icon>
          页面设置
        </el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-panel">
      <el-form :inline="true" :model="filterForm" size="default">
        <el-form-item label="物料编号">
          <el-input v-model="filterForm.materialCode" placeholder="输入物料编号" clearable style="width: 200px;" />
        </el-form-item>
        <el-form-item label="需求来源">
          <el-select v-model="filterForm.sourceType" placeholder="全部来源" clearable style="width: 150px;">
            <el-option label="销售订单" value="sales" />
            <el-option label="生产计划" value="production" />
            <el-option label="安全库存" value="safety" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select v-model="filterForm.execStatus" placeholder="全部状态" clearable style="width: 150px;">
            <el-option label="未下单" value="pending" />
            <el-option label="已采购" value="purchased" />
            <el-option label="已生产" value="produced" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求日期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 汇总卡片 -->
    <div class="summary-cards">
      <div class="card-item">
        <div class="card-icon production">
          <el-icon><Tools /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-value">{{ summary.productionQty }}</div>
          <div class="card-label">需生产数量</div>
        </div>
      </div>
      <div class="card-item">
        <div class="card-icon purchase">
          <el-icon><ShoppingCart /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-value">{{ summary.purchaseQty }}</div>
          <div class="card-label">需采购数量</div>
        </div>
      </div>
      <div class="card-item">
        <div class="card-icon stock">
          <el-icon><Box /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-value">{{ summary.totalStock }}</div>
          <div class="card-label">总库存</div>
        </div>
      </div>
      <div class="card-item">
        <div class="card-icon shortage">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-value">{{ summary.shortageQty }}</div>
          <div class="card-label">缺货数量</div>
        </div>
      </div>
    </div>

    <!-- 主表格 -->
    <div class="table-container">
      <EnhancedTable
        ref="tableRef"
        :data="filteredTableData"
        :columns="tableColumns"
        :loading="loading"
        :height="tableHeight"
        :show-toolbar="true"
        :show-add="false"
        :show-export="true"
        :show-import="false"
        :show-print="true"
        :show-selection="false"
        :show-operation="true"
        :operation-width="240"
        :show-summary="true"
        :summary-columns="summaryColumns"
        :summary-data="summaryData"
        :row-class-name="tableRowClassName"
        @export="handleExport"
        @refresh="handleRefresh"
      >
        <!-- 自定义列 -->
        <template #column-sourceType="{ row }">
          <el-tag :type="getSourceTypeColor(row.sourceType)" size="small">
            {{ getSourceTypeText(row.sourceType) }}
          </el-tag>
        </template>
        
        <template #column-execStatus="{ row }">
          <el-tag :type="getExecStatusType(row.execStatus)" size="small">
            {{ getExecStatusText(row.execStatus) }}
          </el-tag>
        </template>
        
        <template #column-suggestType="{ row }">
          <el-tag :type="getSuggestTypeColor(row.suggestType)" size="small">
            {{ getSuggestTypeText(row.suggestType) }}
          </el-tag>
        </template>
        
        <template #column-demandQty="{ row }">
          <span class="qty-demand">{{ row.demandQty }}</span>
        </template>
        
        <template #column-shortageQty="{ row }">
          <span :class="row.shortageQty > 0 ? 'qty-shortage' : 'qty-normal'">
            {{ row.shortageQty }}
          </span>
        </template>
        
        <template #column-suggestedQty="{ row }">
          <span class="qty-suggested">{{ row.suggestedQty }}</span>
        </template>
        
        <!-- 操作列 -->
        <template #operation="{ row }">
          <el-button size="small" @click="handleViewDetail(row)">详情</el-button>
          <el-button 
            v-if="row.execStatus === 'pending' && row.suggestType === 'purchase'"
            type="primary" 
            size="small" 
            @click="handleCreatePurchase(row)"
          >
            生成采购单
          </el-button>
          <el-button 
            v-if="row.execStatus === 'pending' && row.suggestType === 'production'"
            type="success" 
            size="small" 
            @click="handleCreateProduction(row)"
          >
            生成生产单
          </el-button>
        </template>
      </EnhancedTable>
    </div>

    <!-- 页面设置对话框 -->
    <PageSettings
      v-model:visible="pageSettingsVisible"
      :settings="pageSettings"
      :available-fields="tableColumns"
      :show-workflow="false"
      :show-menu="false"
      :show-color="true"
      :show-encoding="false"
      :show-fields="true"
      :show-print="true"
      @save="handleSaveSettings"
    />

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="需求明细详情" width="1000px">
      <el-tabs v-model="activeTab" v-if="currentDemand">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="物料编号">{{ currentDemand.materialCode }}</el-descriptions-item>
            <el-descriptions-item label="物料名称">{{ currentDemand.materialName }}</el-descriptions-item>
            <el-descriptions-item label="规格型号">{{ currentDemand.materialSpec }}</el-descriptions-item>
            <el-descriptions-item label="单位">{{ currentDemand.materialUnit }}</el-descriptions-item>
            <el-descriptions-item label="需求来源">{{ getSourceTypeText(currentDemand.sourceType) }}</el-descriptions-item>
            <el-descriptions-item label="来源单号">{{ currentDemand.sourceNo }}</el-descriptions-item>
            <el-descriptions-item label="需求数量">{{ currentDemand.demandQty }}</el-descriptions-item>
            <el-descriptions-item label="需求日期">{{ currentDemand.requiredDate }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <!-- 库存信息 -->
        <el-tab-pane label="库存信息" name="stock">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="当前库存">{{ currentDemand.currentStock }}</el-descriptions-item>
            <el-descriptions-item label="可用库存">{{ currentDemand.availableStock }}</el-descriptions-item>
            <el-descriptions-item label="在途数量">{{ currentDemand.onOrderQty }}</el-descriptions-item>
            <el-descriptions-item label="缺货数量">{{ currentDemand.shortageQty }}</el-descriptions-item>
            <el-descriptions-item label="安全库存">{{ currentDemand.safetyStock }}</el-descriptions-item>
            <el-descriptions-item label="最小采购量">{{ currentDemand.minOrderQty }}</el-descriptions-item>
            <el-descriptions-item label="最小批量">{{ currentDemand.lotSize }}</el-descriptions-item>
            <el-descriptions-item label="提前期(天)">{{ currentDemand.leadTime }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <!-- 执行信息 -->
        <el-tab-pane label="执行信息" name="exec">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="执行状态">{{ getExecStatusText(currentDemand.execStatus) }}</el-descriptions-item>
            <el-descriptions-item label="建议类型">{{ getSuggestTypeText(currentDemand.suggestType) }}</el-descriptions-item>
            <el-descriptions-item label="建议数量">{{ currentDemand.suggestedQty }}</el-descriptions-item>
            <el-descriptions-item label="建议日期">{{ currentDemand.suggestedDate }}</el-descriptions-item>
            <el-descriptions-item label="关联采购单">{{ currentDemand.purchaseNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="关联生产单">{{ currentDemand.productionNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="执行人">{{ currentDemand.executor || '-' }}</el-descriptions-item>
            <el-descriptions-item label="执行时间">{{ currentDemand.execTime || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <!-- BOM用量 -->
        <el-tab-pane label="BOM用量" name="bom" v-if="currentDemand.sourceType === 'production'">
          <el-table :data="currentDemand.bomUsage" border>
            <el-table-column prop="parentCode" label="父件编号" width="140" />
            <el-table-column prop="parentName" label="父件名称" width="180" />
            <el-table-column prop="usageQty" label="单位用量" width="100" align="right" />
            <el-table-column prop="parentDemandQty" label="父件需求" width="100" align="right" />
            <el-table-column prop="totalUsage" label="总用量" width="100" align="right" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Refresh, Tools, ShoppingCart, Box, Warning, Setting } from '@element-plus/icons-vue'
import EnhancedTable from '@/components/common/EnhancedTable.vue'
import PageSettings from '@/components/common/PageSettings.vue'

// ========== 数据定义 ==========
const tableRef = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const tableHeight = ref(600)
const detailDialogVisible = ref(false)
const currentDemand = ref(null)
const activeTab = ref('basic')
const loading = ref(false)
const pageSettingsVisible = ref(false)

// 筛选表单
const filterForm = ref({
  materialCode: '',
  sourceType: '',
  execStatus: '',
  dateRange: null
})

// 表格列配置
const tableColumns = ref([
  { prop: 'materialCode', label: '物料编号', width: 140, fixed: 'left', sortable: true },
  { prop: 'materialName', label: '物料名称', width: 180, sortable: true },
  { prop: 'materialSpec', label: '规格型号', width: 150 },
  { prop: 'materialUnit', label: '单位', width: 80, align: 'center' },
  { prop: 'sourceType', label: '需求来源', width: 120 },
  { prop: 'sourceNo', label: '来源单号', width: 160 },
  { prop: 'demandQty', label: '需求数量', width: 120, align: 'right', sortable: true },
  { prop: 'currentStock', label: '当前库存', width: 120, align: 'right', sortable: true },
  { prop: 'availableStock', label: '可用库存', width: 120, align: 'right' },
  { prop: 'onOrderQty', label: '在途数量', width: 120, align: 'right' },
  { prop: 'shortageQty', label: '缺货数量', width: 120, align: 'right', sortable: true },
  { prop: 'requiredDate', label: '需求日期', width: 120, sortable: true },
  { prop: 'execStatus', label: '执行状态', width: 100 },
  { prop: 'suggestType', label: '建议类型', width: 100 },
  { prop: 'suggestedQty', label: '建议数量', width: 120, align: 'right', sortable: true },
  { prop: 'purchaseNo', label: '关联采购单', width: 160 },
  { prop: 'productionNo', label: '关联生产单', width: 160 },
  { prop: 'executor', label: '执行人', width: 100 },
  { prop: 'execTime', label: '执行时间', width: 160 }
])

// 统计列配置
const summaryColumns = ref([
  { prop: 'demandQty', label: '总需求数量', format: 'number' },
  { prop: 'shortageQty', label: '总缺货数量', format: 'number' },
  { prop: 'suggestedQty', label: '总建议数量', format: 'number' }
])

// 统计数据
const summaryData = computed(() => {
  const data = filteredTableData.value
  return {
    demandQty: data.reduce((sum, item) => sum + item.demandQty, 0),
    shortageQty: data.reduce((sum, item) => sum + item.shortageQty, 0),
    suggestedQty: data.reduce((sum, item) => sum + item.suggestedQty, 0)
  }
})

// 页面设置
const pageSettings = ref({
  themeColor: '#409EFF',
  backgroundColor: '#f5f7fa',
  tableRowColor: '#ffffff',
  tableHeaderColor: '#f5f7fa',
  visibleFields: tableColumns.value.map(col => col.prop),
  printOrientation: 'landscape'
})

// 表格数据（模拟数据）
const tableData = ref([
  {
    id: '1',
    materialCode: 'M001',
    materialName: '铝合金板材',
    materialSpec: '6061-T6 2mm',
    materialUnit: 'kg',
    sourceType: 'production',
    sourceNo: 'MO-20251205-001',
    demandQty: 500,
    currentStock: 200,
    availableStock: 150,
    onOrderQty: 100,
    shortageQty: 250,
    requiredDate: '2025-12-15',
    execStatus: 'pending',
    suggestType: 'purchase',
    suggestedQty: 300,
    suggestedDate: '2025-12-10',
    purchaseNo: '',
    productionNo: '',
    executor: '',
    execTime: '',
    safetyStock: 100,
    minOrderQty: 50,
    lotSize: 10,
    leadTime: 7,
    bomUsage: [
      { parentCode: 'P001', parentName: '机箱', usageQty: 2.5, parentDemandQty: 200, totalUsage: 500 }
    ]
  },
  {
    id: '2',
    materialCode: 'M002',
    materialName: '不锈钢管',
    materialSpec: '304 Φ50×3',
    materialUnit: 'm',
    sourceType: 'sales',
    sourceNo: 'SO-20251205-001',
    demandQty: 1000,
    currentStock: 50,
    availableStock: 30,
    onOrderQty: 0,
    shortageQty: 970,
    requiredDate: '2025-12-20',
    execStatus: 'pending',
    suggestType: 'purchase',
    suggestedQty: 1000,
    suggestedDate: '2025-12-12',
    purchaseNo: '',
    productionNo: '',
    executor: '',
    execTime: '',
    safetyStock: 50,
    minOrderQty: 100,
    lotSize: 50,
    leadTime: 10,
    bomUsage: []
  },
  {
    id: '3',
    materialCode: 'M003',
    materialName: '电机',
    materialSpec: 'AC220V 1.5KW',
    materialUnit: '台',
    sourceType: 'production',
    sourceNo: 'MO-20251204-001',
    demandQty: 50,
    currentStock: 30,
    availableStock: 25,
    onOrderQty: 20,
    shortageQty: 5,
    requiredDate: '2025-12-18',
    execStatus: 'purchased',
    suggestType: 'purchase',
    suggestedQty: 20,
    suggestedDate: '2025-12-13',
    purchaseNo: 'PO-20251205-001',
    productionNo: '',
    executor: '张三',
    execTime: '2025-12-05 10:00:00',
    safetyStock: 10,
    minOrderQty: 5,
    lotSize: 1,
    leadTime: 5,
    bomUsage: [
      { parentCode: 'P002', parentName: '风机', usageQty: 1, parentDemandQty: 50, totalUsage: 50 }
    ]
  }
])

// 汇总数据
const summary = computed(() => {
  const data = filteredTableData.value
  return {
    productionQty: data.filter(item => item.suggestType === 'production').reduce((sum, item) => sum + item.suggestedQty, 0),
    purchaseQty: data.filter(item => item.suggestType === 'purchase').reduce((sum, item) => sum + item.suggestedQty, 0),
    totalStock: data.reduce((sum, item) => sum + item.currentStock, 0),
    shortageQty: data.reduce((sum, item) => sum + item.shortageQty, 0)
  }
})

// 过滤后的表格数据
const filteredTableData = computed(() => {
  let data = tableData.value
  
  if (filterForm.value.materialCode) {
    data = data.filter(item => item.materialCode.includes(filterForm.value.materialCode))
  }
  
  if (filterForm.value.sourceType) {
    data = data.filter(item => item.sourceType === filterForm.value.sourceType)
  }
  
  if (filterForm.value.execStatus) {
    data = data.filter(item => item.execStatus === filterForm.value.execStatus)
  }
  
  if (filterForm.value.dateRange && filterForm.value.dateRange.length === 2) {
    data = data.filter(item => {
      const date = item.requiredDate
      return date >= filterForm.value.dateRange[0] && date <= filterForm.value.dateRange[1]
    })
  }
  
  totalCount.value = data.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
})

// ========== 方法定义 ==========

// 需求来源文本
const getSourceTypeText = (type) => {
  const map = {
    sales: '销售订单',
    production: '生产计划',
    safety: '安全库存'
  }
  return map[type] || type
}

// 需求来源颜色
const getSourceTypeColor = (type) => {
  const map = {
    sales: 'primary',
    production: 'success',
    safety: 'warning'
  }
  return map[type] || ''
}

// 执行状态文本
const getExecStatusText = (status) => {
  const map = {
    pending: '未下单',
    purchased: '已采购',
    produced: '已生产',
    completed: '已完成'
  }
  return map[status] || status
}

// 执行状态类型
const getExecStatusType = (status) => {
  const map = {
    pending: 'warning',
    purchased: 'primary',
    produced: 'success',
    completed: 'success'
  }
  return map[status] || ''
}

// 建议类型文本
const getSuggestTypeText = (type) => {
  const map = {
    purchase: '采购',
    production: '生产',
    transfer: '调拨'
  }
  return map[type] || type
}

// 建议类型颜色
const getSuggestTypeColor = (type) => {
  const map = {
    purchase: 'success',
    production: 'primary',
    transfer: 'warning'
  }
  return map[type] || ''
}

// 表格行class
const tableRowClassName = ({ row }) => {
  if (row.shortageQty > 0) return 'row-shortage'
  return ''
}

// 合计行
const getSummaries = (param) => {
  const { columns, data } = param
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (['demandQty', 'currentStock', 'availableStock', 'onOrderQty', 'shortageQty', 'suggestedQty'].includes(column.property)) {
      const values = data.map(item => Number(item[column.property]))
      if (!values.every(value => isNaN(value))) {
        sums[index] = values.reduce((prev, curr) => {
          const value = Number(curr)
          if (!isNaN(value)) {
            return prev + curr
          } else {
            return prev
          }
        }, 0)
      } else {
        sums[index] = '-'
      }
    } else {
      sums[index] = '-'
    }
  })
  return sums
}

// 查看详情
const handleViewDetail = (row) => {
  currentDemand.value = { ...row }
  activeTab.value = 'basic'
  detailDialogVisible.value = true
}

// 生成采购单
const handleCreatePurchase = async (row) => {
  try {
    await ElMessageBox.confirm(`确定为物料【${row.materialName}】生成采购单吗？\n建议采购数量：${row.suggestedQty}`, '生成采购单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    
    // 生成采购单号
    const purchaseNo = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    row.purchaseNo = purchaseNo
    row.execStatus = 'purchased'
    row.executor = '当前用户'
    row.execTime = new Date().toLocaleString('zh-CN')
    
    // 保存到localStorage
    saveMaterialDemands()
    
    ElMessage.success(`采购单 ${purchaseNo} 已生成`)
  } catch {
    // 取消
  }
}

// 生成生产单
const handleCreateProduction = async (row) => {
  try {
    await ElMessageBox.confirm(`确定为物料【${row.materialName}】生成生产单吗？\n建议生产数量：${row.suggestedQty}`, '生成生产单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    
    // 生成生产单号
    const productionNo = `MO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    row.productionNo = productionNo
    row.execStatus = 'produced'
    row.executor = '当前用户'
    row.execTime = new Date().toLocaleString('zh-CN')
    
    // 保存到localStorage
    saveMaterialDemands()
    
    ElMessage.success(`生产单 ${productionNo} 已生成`)
  } catch {
    // 取消
  }
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

// 查询
const handleSearch = () => {
  currentPage.value = 1
}

// 重置
const handleReset = () => {
  filterForm.value = {
    materialCode: '',
    sourceType: '',
    execStatus: '',
    dateRange: null
  }
  currentPage.value = 1
}

// 刷新
const handleRefresh = () => {
  loadMaterialDemands()
  ElMessage.success('刷新成功')
}

// 保存页面设置
const handleSaveSettings = (settings) => {
  pageSettings.value = { ...settings }
  localStorage.setItem('materialDemandSettings', JSON.stringify(settings))
  ElMessage.success('设置已保存')
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 保存到localStorage
const saveMaterialDemands = () => {
  localStorage.setItem('materialDemandData', JSON.stringify(tableData.value))
}

// 从localStorage加载
const loadMaterialDemands = () => {
  const data = localStorage.getItem('materialDemandData')
  if (data) {
    tableData.value = JSON.parse(data)
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  loadMaterialDemands()
  
  // 计算表格高度
  const updateTableHeight = () => {
    tableHeight.value = window.innerHeight - 480
  }
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
})
</script>

<style scoped lang="scss">
.material-demand-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .header-left {
    h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: #303133;
    }
    
    .subtitle {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }
  }
  
  .header-right {
    display: flex;
    gap: 12px;
  }
}

.filter-panel {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.summary-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  .card-item {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .card-icon {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      font-size: 24px;
      
      &.production {
        background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
        color: white;
      }
      
      &.purchase {
        background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
        color: white;
      }
      
      &.stock {
        background: linear-gradient(135deg, #E6A23C 0%, #EBB563 100%);
        color: white;
      }
      
      &.shortage {
        background: linear-gradient(135deg, #F56C6C 0%, #F78989 100%);
        color: white;
      }
    }
    
    .card-content {
      flex: 1;
      
      .card-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 4px;
      }
      
      .card-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}

.table-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qty-demand {
  color: #409EFF;
  font-weight: 600;
}

.qty-shortage {
  color: #F56C6C;
  font-weight: 600;
}

.qty-normal {
  color: #67C23A;
  font-weight: 600;
}

.qty-suggested {
  color: #67C23A;
  font-weight: 600;
}

:deep(.row-shortage) {
  background-color: #fef0f0 !important;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
