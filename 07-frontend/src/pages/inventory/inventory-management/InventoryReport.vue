<template>
  <div class="inventory-report-container">
    <el-card shadow="hover">
      <el-tabs v-model="activeTab">
        <!-- 库存报表 -->
        <el-tab-pane label="库存报表" name="inventory">
          <el-form :model="inventoryQuery" :inline="true">
            <el-form-item label="仓库">
              <el-select v-model="inventoryQuery.warehouseId" placeholder="请选择仓库" clearable>
                <el-option label="全部" value="" />
                <el-option label="主仓库" value="1" />
                <el-option label="分仓库A" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="产品类别">
              <el-select v-model="inventoryQuery.category" placeholder="请选择类别" clearable>
                <el-option label="全部" value="" />
                <el-option label="原材料" value="material" />
                <el-option label="成品" value="product" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadInventoryReport">查询</el-button>
              <el-button @click="exportReport('inventory')">导出</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="inventoryReportData" border v-loading="loading" show-summary>
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="productCode" label="产品编码" width="150" />
            <el-table-column prop="productName" label="产品名称" width="200" />
            <el-table-column prop="category" label="类别" width="100" />
            <el-table-column prop="quantity" label="库存数量" width="120" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="unitPrice" label="单价" width="100" />
            <el-table-column label="库存金额" width="150">
              <template #default="scope">
                ¥{{ (scope.row.quantity * scope.row.unitPrice).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="warehouseName" label="仓库" width="120" />
            <el-table-column prop="locationName" label="库位" width="120" />
          </el-table>
        </el-tab-pane>

        <!-- 出入库报表 -->
        <el-tab-pane label="出入库报表" name="inout">
          <el-form :model="inoutQuery" :inline="true">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="inoutQuery.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item label="业务类型">
              <el-select v-model="inoutQuery.type" placeholder="请选择类型" clearable>
                <el-option label="全部" value="" />
                <el-option label="入库" value="in" />
                <el-option label="出库" value="out" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadInOutReport">查询</el-button>
              <el-button @click="exportReport('inout')">导出</el-button>
            </el-form-item>
          </el-form>

          <!-- 汇总卡片 -->
          <el-row :gutter="20" class="summary-row">
            <el-col :span="8">
              <el-statistic title="入库总数" :value="inoutSummary.totalIn" suffix="件" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="出库总数" :value="inoutSummary.totalOut" suffix="件" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="净增量" :value="inoutSummary.netChange" suffix="件" />
            </el-col>
          </el-row>

          <el-table :data="inoutReportData" border v-loading="loading">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="date" label="日期" width="150" />
            <el-table-column prop="productName" label="产品" width="200" />
            <el-table-column label="类型" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'in' ? 'success' : 'danger'">
                  {{ scope.row.type === 'in' ? '入库' : '出库' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="120" />
            <el-table-column prop="businessType" label="业务类型" width="120" />
            <el-table-column prop="documentNo" label="单据号" width="180" />
            <el-table-column prop="operator" label="操作人" width="100" />
          </el-table>
        </el-tab-pane>

        <!-- 库存周转率 -->
        <el-tab-pane label="库存周转率" name="turnover">
          <el-form :model="turnoverQuery" :inline="true">
            <el-form-item label="统计周期">
              <el-select v-model="turnoverQuery.period" placeholder="请选择周期">
                <el-option label="本月" value="month" />
                <el-option label="本季度" value="quarter" />
                <el-option label="本年" value="year" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadTurnoverReport">查询</el-button>
              <el-button @click="exportReport('turnover')">导出</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="turnoverReportData" border v-loading="loading">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="productName" label="产品名称" width="200" />
            <el-table-column prop="avgInventory" label="平均库存" width="120" />
            <el-table-column prop="totalSales" label="总销量" width="120" />
            <el-table-column label="周转率" width="120">
              <template #default="scope">
                {{ scope.row.turnoverRate.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="周转天数" width="120">
              <template #default="scope">
                {{ scope.row.turnoverDays }} 天
              </template>
            </el-table-column>
            <el-table-column label="评级" width="100">
              <template #default="scope">
                <el-tag :type="getTurnoverRateType(scope.row.turnoverRate)">
                  {{ getTurnoverRateText(scope.row.turnoverRate) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 呆滞库存分析 -->
        <el-tab-pane label="呆滞库存分析" name="stagnant">
          <el-form :model="stagnantQuery" :inline="true">
            <el-form-item label="呆滞天数">
              <el-input-number v-model="stagnantQuery.days" :min="30" :max="365" />
              <span style="margin-left: 10px;">天</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadStagnantReport">查询</el-button>
              <el-button @click="exportReport('stagnant')">导出</el-button>
            </el-form-item>
          </el-form>

          <el-alert
            title="呆滞库存提示"
            type="warning"
            :closable="false"
            style="margin-bottom: 20px;"
          >
            以下产品超过 {{ stagnantQuery.days }} 天无出库记录，建议及时处理
          </el-alert>

          <el-table :data="stagnantReportData" border v-loading="loading">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="productCode" label="产品编码" width="150" />
            <el-table-column prop="productName" label="产品名称" width="200" />
            <el-table-column prop="quantity" label="库存数量" width="120" />
            <el-table-column prop="stagnantDays" label="呆滞天数" width="120">
              <template #default="scope">
                <el-tag type="danger">{{ scope.row.stagnantDays }} 天</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastOutTime" label="最后出库时间" width="180" />
            <el-table-column prop="inventoryValue" label="库存金额" width="150">
              <template #default="scope">
                ¥{{ scope.row.inventoryValue.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="建议" width="150">
              <template #default="scope">
                <el-tag type="warning">
                  {{ scope.row.stagnantDays > 180 ? '紧急处理' : '关注' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { inventoryReportApi } from '@/api/inventory'

// 响应式数据
const activeTab = ref('inventory')
const loading = ref(false)
const inventoryReportData = ref([])
const inoutReportData = ref([])
const turnoverReportData = ref([])
const stagnantReportData = ref([])

const inoutSummary = reactive({
  totalIn: 0,
  totalOut: 0,
  netChange: 0
})

const inventoryQuery = reactive({
  warehouseId: '',
  category: ''
})

const inoutQuery = reactive({
  dateRange: [],
  type: ''
})

const turnoverQuery = reactive({
  period: 'month'
})

const stagnantQuery = reactive({
  days: 90
})

// 方法
const loadInventoryReport = async () => {
  loading.value = true
  try {
    const res = await inventoryReportApi.getInventoryReport(inventoryQuery)
    inventoryReportData.value = res.data || mockInventoryData()
  } catch (error) {
    console.error('加载库存报表失败:', error)
    inventoryReportData.value = mockInventoryData()
  } finally {
    loading.value = false
  }
}

const loadInOutReport = async () => {
  loading.value = true
  try {
    const res = await inventoryReportApi.getInOutReport(inoutQuery)
    inoutReportData.value = res.data?.list || mockInOutData()
    Object.assign(inoutSummary, res.data?.summary || {
      totalIn: 5000,
      totalOut: 3500,
      netChange: 1500
    })
  } catch (error) {
    console.error('加载出入库报表失败:', error)
    inoutReportData.value = mockInOutData()
  } finally {
    loading.value = false
  }
}

const loadTurnoverReport = async () => {
  loading.value = true
  try {
    const res = await inventoryReportApi.getTurnoverReport(turnoverQuery)
    turnoverReportData.value = res.data || mockTurnoverData()
  } catch (error) {
    console.error('加载周转率报表失败:', error)
    turnoverReportData.value = mockTurnoverData()
  } finally {
    loading.value = false
  }
}

const loadStagnantReport = async () => {
  loading.value = true
  try {
    const res = await inventoryReportApi.getInventoryReport({ stagnantDays: stagnantQuery.days })
    stagnantReportData.value = res.data || mockStagnantData()
  } catch (error) {
    console.error('加载呆滞库存分析失败:', error)
    stagnantReportData.value = mockStagnantData()
  } finally {
    loading.value = false
  }
}

const exportReport = async (type) => {
  try {
    ElMessage.success('正在导出报表...')
    await inventoryReportApi.exportReport({ type })
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const getTurnoverRateType = (rate) => {
  if (rate >= 6) return 'success'
  if (rate >= 3) return 'warning'
  return 'danger'
}

const getTurnoverRateText = (rate) => {
  if (rate >= 6) return '优秀'
  if (rate >= 3) return '良好'
  return '较差'
}

const mockInventoryData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    productCode: `P${String(i + 1001).padStart(6, '0')}`,
    productName: `产品${i + 1}`,
    category: i % 2 === 0 ? '原材料' : '成品',
    quantity: Math.floor(Math.random() * 1000),
    unit: '件',
    unitPrice: (Math.random() * 100 + 50).toFixed(2),
    warehouseName: '主仓库',
    locationName: `A-${i + 1}-01`
  }))
}

const mockInOutData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    date: '2024-01-15',
    productName: `产品${i + 1}`,
    type: i % 2 === 0 ? 'in' : 'out',
    quantity: Math.floor(Math.random() * 100),
    businessType: i % 2 === 0 ? '采购入库' : '销售出库',
    documentNo: `DOC${String(Date.now() + i).slice(-10)}`,
    operator: '张三'
  }))
}

const mockTurnoverData = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    productName: `产品${i + 1}`,
    avgInventory: Math.floor(Math.random() * 500) + 100,
    totalSales: Math.floor(Math.random() * 2000) + 500,
    turnoverRate: (Math.random() * 8 + 1).toFixed(2),
    turnoverDays: Math.floor(Math.random() * 100) + 30
  }))
}

const mockStagnantData = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    productCode: `P${String(i + 2001).padStart(6, '0')}`,
    productName: `呆滞产品${i + 1}`,
    quantity: Math.floor(Math.random() * 200) + 50,
    stagnantDays: Math.floor(Math.random() * 200) + 90,
    lastOutTime: '2023-10-15 10:00:00',
    inventoryValue: (Math.random() * 10000 + 1000).toFixed(2)
  }))
}

onMounted(() => {
  loadInventoryReport()
})
</script>

<style scoped>
.inventory-report-container {
  padding: 20px;
}

.summary-row {
  margin: 20px 0;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
