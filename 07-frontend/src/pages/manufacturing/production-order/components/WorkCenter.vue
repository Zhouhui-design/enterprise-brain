<template>
  <div class="work-center">
    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" label-width="100px">
        <el-form-item label="工作中心编码">
          <el-input v-model="searchForm.code" placeholder="请输入工作中心编码" />
        </el-form-item>
        <el-form-item label="工作中心名称">
          <el-input v-model="searchForm.name" placeholder="请输入工作中心名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型">
            <el-option label="全部" value="" />
            <el-option label="加工" value="processing" />
            <el-option label="装配" value="assembly" />
            <el-option label="质检" value="quality" />
            <el-option label="包装" value="packaging" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="全部" value="" />
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工作中心列表 -->
    <el-table
      v-loading="loading"
      :data="workCenterList"
      stripe
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
      style="width: 100%"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="code" label="工作中心编码" width="120" />
      <el-table-column prop="name" label="工作中心名称" width="180" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.type)">
            {{ getTypeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="150" />
      <el-table-column prop="capacity" label="产能(小时/天)" width="120" align="right" />
      <el-table-column prop="efficiency" label="效率" width="80" align="right">
        <template #default="{ row }">
          {{ row.efficiency }}%
        </template>
      </el-table-column>
      <el-table-column prop="manager" label="负责人" width="100" />
      <el-table-column prop="location" label="位置" width="120" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button text @click="handleSelect(row)">选择</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 工作中心详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="detailDialogTitle"
      width="800px"
      @close="handleDetailDialogClose"
    >
      <div v-if="selectedWorkCenter" class="work-center-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工作中心编码">{{ selectedWorkCenter.code }}</el-descriptions-item>
          <el-descriptions-item label="工作中心名称">{{ selectedWorkCenter.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ getTypeLabel(selectedWorkCenter.type) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ selectedWorkCenter.status === 'active' ? '启用' : '停用' }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedWorkCenter.manager }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ selectedWorkCenter.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ selectedWorkCenter.location }}</el-descriptions-item>
          <el-descriptions-item label="产能(小时/天)">{{ selectedWorkCenter.capacity }}</el-descriptions-item>
          <el-descriptions-item label="效率">{{ selectedWorkCenter.efficiency }}%</el-descriptions-item>
          <el-descriptions-item label="利用率">{{ selectedWorkCenter.utilization }}%</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ selectedWorkCenter.createdBy }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedWorkCenter.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedWorkCenter.description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="equipment-list">
          <h3>设备列表</h3>
          <el-table :data="selectedWorkCenter.equipments" stripe size="small" border>
            <el-table-column prop="equipmentCode" label="设备编码" width="120" />
            <el-table-column prop="equipmentName" label="设备名称" width="150" />
            <el-table-column prop="model" label="型号" width="120" />
            <el-table-column prop="manufacturer" label="制造商" width="120" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleSelectWorkCenter(selectedWorkCenter)">选择</el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineEmits, defineProps, watch } from 'vue'

// 类型定义
interface WorkCenter {
  id: string
  code: string
  name: string
  type: string
  status: string
  description?: string
  capacity: number
  efficiency: number
  utilization: number
  manager: string
  phone?: string
  location: string
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
  equipments?: Equipment[]
}

interface Equipment {
  equipmentCode: string
  equipmentName: string
  model: string
  manufacturer: string
  status: string
}

// Props定义
const props = defineProps<{
  visible?: boolean
  selectedWorkCenters?: WorkCenter[]
  multiple?: boolean
}>()

// Emits定义
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', workCenters: WorkCenter[]): void
  (e: 'confirm', workCenters: WorkCenter[]): void
}>()

// 响应式数据
const loading = ref(false)
const detailDialogVisible = ref(false)
const detailDialogTitle = ref('工作中心详情')
const selectedWorkCenter = ref<WorkCenter | null>(null)
const selectedItems = ref<WorkCenter[]>([])

// 搜索表单
const searchForm = reactive({
  code: '',
  name: '',
  type: '',
  status: ''
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 工作中心列表
const workCenterList = ref<WorkCenter[]>([])

// 监听selectedWorkCenters变化
watch(() => props.selectedWorkCenters, (newVal) => {
  if (newVal) {
    selectedItems.value = [...newVal]
  }
}, { deep: true })

// 获取类型标签类型
const getTypeTagType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'processing': 'primary',
    'assembly': 'success',
    'quality': 'warning',
    'packaging': 'info'
  }
  return typeMap[type] || 'info'
}

// 获取类型标签
const getTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    'processing': '加工',
    'assembly': '装配',
    'quality': '质检',
    'packaging': '包装'
  }
  return typeMap[type] || type
}

// 获取状态标签类型
const getStatusTagType = (status: string): string => {
  return status === 'running' ? 'success' : 
         status === 'maintenance' ? 'warning' : 
         status === 'idle' ? 'info' : 'danger'
}

// 获取状态标签
const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'running': '运行中',
    'maintenance': '维护中',
    'idle': '空闲',
    'fault': '故障'
  }
  return statusMap[status] || status
}

// 获取工作中心列表
const getWorkCenterList = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    const mockData: WorkCenter[] = [
      {
        id: '1',
        code: 'WC001',
        name: 'CNC加工中心',
        type: 'processing',
        status: 'active',
        description: '负责精密零件的数控加工',
        capacity: 20,
        efficiency: 92,
        utilization: 85,
        manager: '张三',
        phone: '13800138001',
        location: 'A栋1楼',
        createdBy: '管理员',
        createdAt: '2024-01-01 10:00:00'
      },
      {
        id: '2',
        code: 'WC002',
        name: '装配生产线',
        type: 'assembly',
        status: 'active',
        description: '负责产品总装',
        capacity: 24,
        efficiency: 88,
        utilization: 78,
        manager: '李四',
        phone: '13800138002',
        location: 'B栋2楼',
        createdBy: '管理员',
        createdAt: '2024-01-01 10:00:00'
      },
      {
        id: '3',
        code: 'WC003',
        name: '质量检测中心',
        type: 'quality',
        status: 'active',
        description: '负责产品质量检测',
        capacity: 16,
        efficiency: 95,
        utilization: 82,
        manager: '王五',
        phone: '13800138003',
        location: 'C栋1楼',
        createdBy: '管理员',
        createdAt: '2024-01-01 10:00:00'
      },
      {
        id: '4',
        code: 'WC004',
        name: '包装车间',
        type: 'packaging',
        status: 'active',
        description: '负责产品包装与装箱',
        capacity: 22,
        efficiency: 85,
        utilization: 75,
        manager: '赵六',
        phone: '13800138004',
        location: 'D栋1楼',
        createdBy: '管理员',
        createdAt: '2024-01-01 10:00:00'
      },
      {
        id: '5',
        code: 'WC005',
        name: '激光切割中心',
        type: 'processing',
        status: 'active',
        description: '负责金属板材激光切割',
        capacity: 18,
        efficiency: 90,
        utilization: 88,
        manager: '钱七',
        phone: '13800138005',
        location: 'A栋2楼',
        createdBy: '管理员',
        createdAt: '2024-01-10 14:30:00'
      },
      {
        id: '6',
        code: 'WC006',
        name: '电子装配线',
        type: 'assembly',
        status: 'active',
        description: '负责电子组件装配',
        capacity: 24,
        efficiency: 93,
        utilization: 80,
        manager: '孙八',
        phone: '13800138006',
        location: 'B栋3楼',
        createdBy: '管理员',
        createdAt: '2024-01-15 09:20:00'
      },
      {
        id: '7',
        code: 'WC007',
        name: '旧加工车间',
        type: 'processing',
        status: 'inactive',
        description: '旧设备车间，暂停用',
        capacity: 15,
        efficiency: 75,
        utilization: 30,
        manager: '周九',
        phone: '13800138007',
        location: 'E栋1楼',
        createdBy: '管理员',
        createdAt: '2023-12-01 16:40:00'
      },
      {
        id: '8',
        code: 'WC008',
        name: '表面处理中心',
        type: 'processing',
        status: 'active',
        description: '负责零件表面处理',
        capacity: 12,
        efficiency: 87,
        utilization: 72,
        manager: '吴十',
        phone: '13800138008',
        location: 'F栋1楼',
        createdBy: '管理员',
        createdAt: '2024-01-20 11:10:00'
      }
    ]
    
    // 过滤数据
    let filteredData = [...mockData]
    if (searchForm.code) {
      filteredData = filteredData.filter(item => 
        item.code.includes(searchForm.code)
      )
    }
    if (searchForm.name) {
      filteredData = filteredData.filter(item => 
        item.name.includes(searchForm.name)
      )
    }
    if (searchForm.type) {
      filteredData = filteredData.filter(item => 
        item.type === searchForm.type
      )
    }
    if (searchForm.status) {
      filteredData = filteredData.filter(item => 
        item.status === searchForm.status
      )
    }
    
    // 更新分页数据
    pagination.total = filteredData.length
    workCenterList.value = filteredData.slice(
      (pagination.currentPage - 1) * pagination.pageSize,
      pagination.currentPage * pagination.pageSize
    )
  } catch (error) {
    console.error('获取工作中心列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取工作中心详情
const getWorkCenterDetails = async (workCenterId: string): Promise<WorkCenter> => {
  // 模拟API调用
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 模拟设备数据
  const mockEquipments: Equipment[] = [
    {
      equipmentCode: 'EQ001',
      equipmentName: 'CNC机床-01',
      model: 'HAAS VF-2',
      manufacturer: '哈斯',
      status: 'running'
    },
    {
      equipmentCode: 'EQ002',
      equipmentName: 'CNC机床-02',
      model: 'MAZAK QT-200',
      manufacturer: '山崎马扎克',
      status: 'running'
    },
    {
      equipmentCode: 'EQ003',
      equipmentName: 'CNC机床-03',
      model: 'DMG MORI DMU 50',
      manufacturer: '德马吉森精机',
      status: 'maintenance'
    },
    {
      equipmentCode: 'EQ004',
      equipmentName: '刀具管理系统',
      model: 'TDS-5000',
      manufacturer: '哈斯',
      status: 'idle'
    },
    {
      equipmentCode: 'EQ005',
      equipmentName: '三坐标测量机',
      model: 'ZEISS CONTURA',
      manufacturer: '蔡司',
      status: 'running'
    }
  ]
  
  const mockDetail: WorkCenter = {
    id: workCenterId,
    code: 'WC001',
    name: 'CNC加工中心',
    type: 'processing',
    status: 'active',
    description: '负责精密零件的数控加工，配备多台高精度CNC机床和辅助设备',
    capacity: 20,
    efficiency: 92,
    utilization: 85,
    manager: '张三',
    phone: '13800138001',
    location: 'A栋1楼',
    createdBy: '管理员',
    createdAt: '2024-01-01 10:00:00',
    updatedBy: '李四',
    updatedAt: '2024-01-15 14:30:00',
    equipments: mockEquipments
  }
  
  return mockDetail
}

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1
  getWorkCenterList()
}

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    code: '',
    name: '',
    type: '',
    status: ''
  })
  pagination.currentPage = 1
  getWorkCenterList()
}

// 处理选择变更
const handleSelectionChange = (selection: WorkCenter[]) => {
  selectedItems.value = selection
  emit('select', selection)
}

// 处理行点击
const handleRowClick = (row: WorkCenter, column: any, event: Event) => {
  if (!props.multiple) {
    // 单选模式下，点击行即选中
    selectedItems.value = [row]
    emit('select', selectedItems.value)
  }
}

// 处理选择
const handleSelect = async (workCenter: WorkCenter) => {
  if (props.multiple) {
    const index = selectedItems.value.findIndex(item => item.id === workCenter.id)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    } else {
      selectedItems.value.push(workCenter)
    }
  } else {
    // 在单选模式下，显示详情后再选择
    loading.value = true
    try {
      const detail = await getWorkCenterDetails(workCenter.id)
      selectedWorkCenter.value = detail
      detailDialogTitle.value = `${detail.name} 详情`
      detailDialogVisible.value = true
    } catch (error) {
      console.error('获取工作中心详情失败:', error)
    } finally {
      loading.value = false
    }
  }
  emit('select', selectedItems.value)
}

// 处理选择工作中心
const handleSelectWorkCenter = (workCenter: WorkCenter) => {
  if (props.multiple) {
    const index = selectedItems.value.findIndex(item => item.id === workCenter.id)
    if (index === -1) {
      selectedItems.value.push(workCenter)
    }
  } else {
    selectedItems.value = [workCenter]
    emit('confirm', selectedItems.value)
    emit('update:visible', false)
  }
  emit('select', selectedItems.value)
  detailDialogVisible.value = false
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  getWorkCenterList()
}

// 处理页码变化
const handleCurrentChange = (current: number) => {
  pagination.currentPage = current
  getWorkCenterList()
}

// 处理明细对话框关闭
const handleDetailDialogClose = () => {
  selectedWorkCenter.value = null
}

// 确认选择
const confirmSelection = () => {
  emit('confirm', selectedItems.value)
  emit('update:visible', false)
}

// 取消选择
const cancelSelection = () => {
  selectedItems.value = []
  emit('update:visible', false)
}

// 导出方法给父组件调用
defineExpose({
  confirmSelection,
  cancelSelection,
  refresh: getWorkCenterList
})

// 组件挂载时获取数据
getWorkCenterList()
</script>

<style scoped>
.work-center {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.work-center-details {
  padding: 10px;
}

.equipment-list {
  margin-top: 20px;
}

.equipment-list h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
}
</style>