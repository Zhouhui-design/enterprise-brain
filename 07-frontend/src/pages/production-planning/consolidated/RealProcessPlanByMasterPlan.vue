<template>
  <StandardTablePage
    page-title="打包工序计划 - 按来源主计划编号合并"
    settings-key="realProcessPlanByMasterPlanV1"
    :table-data="tableData"
    :columns="consolidatedColumns"
    :loading="loading"
    :total="pagination.total"
    :current-page="pagination.page"
    :page-size="pagination.pageSize"
    :show-breadcrumb="true"
    :breadcrumb-items="breadcrumbItems"
    :show-pagination="true"
    :show-enhanced-toolbar="true"
    :show-export="true"
    :show-print="true"
    @page-change="handlePageChange"
    @size-change="handleSizeChange"
    @export="handleExport"
    @refresh="loadData"
  >
    <!-- 返回按钮 -->
    <template #header-actions>
      <el-button 
        type="primary" 
        plain 
        size="small" 
        @click="goBack"
      >
        <el-icon><Back /></el-icon>
        返回打包工序计划
      </el-button>
    </template>

    <!-- 产品图片列 -->
    <template #column-productImage="{ row }">
      <el-image
        v-if="row.productImage"
        :src="row.productImage"
        :preview-src-list="[row.productImage]"
        fit="cover"
        style="width: 50px; height: 50px; border-radius: 4px;"
      />
      <span v-else style="color: #999;">无图片</span>
    </template>

    <!-- 操作列 -->
    <template #column-actions="{ row }">
      <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
      <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
    </template>
  </StandardTablePage>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'
import { formatDateYMD } from '@/utils/dateFormatter'

const router = useRouter()
const tableData = ref([])
const loading = ref(false)

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0
})

// 面包屑
const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '计划&物控', to: '' },
  { title: '打包工序计划', to: '/production-planning/real-process-plan' },
  { title: '按来源主计划编号合并', to: '' }
]

// 列配置（基础字段 + 当天剩余可用工时）
const consolidatedColumns = ref([
  { 
    prop: 'rowIndex', 
    label: '序号', 
    width: 80, 
    sortable: false, 
    filterable: false, 
    visible: true,
    formatter: (row, column, cellValue, index) => (pagination.page - 1) * pagination.pageSize + index + 1 
  },
  { prop: 'planNo', label: '统筹计划编号', width: 160, sortable: true, fixed: 'left', visible: true },
  { prop: 'salesOrderNo', label: '来源主计划编号编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'customerOrderNo', label: '客户订单编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'productCode', label: '生产产品编号', width: 140, sortable: true, filterable: true, visible: true },
  { prop: 'productName', label: '生产产品名称', width: 180, sortable: true, filterable: true, visible: true },
  { prop: 'productImage', label: '产品图片', width: 100, slot: 'productImage', visible: true },
  { prop: 'processName', label: '工序名称', width: 140, sortable: true, filterable: true, visible: true },
  { prop: 'scheduleDate', label: '计划排程日期', width: 120, sortable: true, visible: true,
    formatter: (row) => formatDateYMD(row.scheduleDate) },
  
  // ✅ 合并数据字段
  { prop: 'scheduleQuantity', label: '合并排程数量', width: 130, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.scheduleQuantity !== undefined ? parseFloat(row.scheduleQuantity).toFixed(2) : '0.00' },
  { prop: 'scheduledWorkHours', label: '合并排程工时', width: 130, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.scheduledWorkHours !== undefined ? parseFloat(row.scheduledWorkHours).toFixed(2) : '0.00' },
  
  // ✅ 新增字段：当天剩余可用工时
  { prop: 'dailyRemainingHours', label: '当天剩余可用工时', width: 150, sortable: true, align: 'right', visible: true,
    formatter: (row) => {
      const dailyTotal = parseFloat(row.dailyTotalHours || 0)
      const scheduled = parseFloat(row.scheduledWorkHours || 0)
      const occupied = parseFloat(row.dailyScheduledHours || 0)
      const remaining = dailyTotal - scheduled - occupied
      return remaining.toFixed(2)
    }
  },
  
  { prop: 'dailyTotalHours', label: '当天总工时', width: 120, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.dailyTotalHours !== undefined ? parseFloat(row.dailyTotalHours).toFixed(2) : '0.00' },
  { prop: 'dailyScheduledHours', label: '当天已排程工时', width: 150, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.dailyScheduledHours !== undefined ? parseFloat(row.dailyScheduledHours).toFixed(2) : '0.00' },
  { prop: 'mergedPlanCount', label: '合并计划数', width: 120, sortable: true, align: 'right', visible: true,
    formatter: (row) => row.mergedPlanCount || 0 },
  { prop: 'mergedPlanNos', label: '合并计划编号列表', width: 200, visible: true },
  
  { prop: 'completionDate', label: '计划完工日期', width: 120, sortable: true, visible: true,
    formatter: (row) => formatDateYMD(row.completionDate) },
  { prop: 'promiseDeliveryDate', label: '订单承诺交期', width: 120, sortable: true, visible: true,
    formatter: (row) => formatDateYMD(row.promiseDeliveryDate) },
  { prop: 'customerName', label: '客户名称', width: 150, filterable: true, visible: true },
  { prop: 'workshopName', label: '车间名称', width: 120, filterable: true, visible: true },
  
  { prop: 'actions', label: '操作', width: 180, slot: 'actions', fixed: 'right', visible: true }
])

// 加载合并后的数据
const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用后端API获取统筹数据
    // const response = await consolidationApi.getData({
    //   processType: 'packing',
    //   mergeRule: 'sales_order',
    //   page: pagination.page,
    //   pageSize: pagination.pageSize
    // })
    
    // 临时示例数据（用于验证页面结构）
    tableData.value = [
      {
        planNo: 'CONSO2025001',
        salesOrderNo: 'SO2025001',
        customerOrderNo: 'CUS001',
        productCode: 'P001',
        productName: '示例产品',
        processName: '打包',
        scheduleDate: new Date('2025-12-20'),
        scheduleQuantity: 100,
        scheduledWorkHours: 8.5,
        dailyTotalHours: 16,
        dailyScheduledHours: 6,
        dailyRemainingHours: 1.5,  // 16 - 8.5 - 6 = 1.5
        mergedPlanCount: 3,
        mergedPlanNos: 'RPP2025001, RPP2025002, RPP2025003',
        completionDate: new Date('2025-12-25'),
        promiseDeliveryDate: new Date('2025-12-30'),
        customerName: '示例客户',
        workshopName: '生产一车间'
      }
    ]
    
    pagination.total = 1
    
    ElMessage.success('统筹数据加载完成（示例数据）')
  } catch (error) {
    console.error('加载统筹数据失败:', error)
    ElMessage.error('加载统筹数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 返回打包工序计划
const goBack = () => {
  router.push('/production-planning/real-process-plan')
}

// 分页处理
const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

// 编辑
const handleEdit = (row) => {
  ElMessage.info('编辑功能开发中...')
  console.log('编辑统筹计划:', row)
}

// 删除
const handleDelete = (row) => {
  ElMessage.info('删除功能开发中...')
  console.log('删除统筹计划:', row)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* 样式保持与原页面一致 */
</style>
