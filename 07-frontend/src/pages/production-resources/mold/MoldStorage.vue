<template>
  <div class="mold-storage">
    <div class="header">
      <h1>模具仓储</h1>
      <div class="actions">
        <el-button type="primary" @click="handleAddStorage">新增仓储记录</el-button>
        <el-button @click="handleBatchPrint">批量打印</el-button>
      </div>
    </div>

    <!-- 搜索筛选栏 -->
    <div class="filter-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="模具编号/名称">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="请输入编号或名称" 
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="仓储区域">
          <el-select v-model="searchForm.area" placeholder="全部区域" clearable>
            <el-option v-for="area in areaList" :key="area" :label="area" :value="area" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="在库" value="in_stock" />
            <el-option label="使用中" value="in_use" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon primary">
          <Box />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalMolds }}</div>
          <div class="stat-label">仓储总数</div>
          <div class="stat-unit">套</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <CheckCircle />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ inStockMolds }}</div>
          <div class="stat-label">在库模具</div>
          <div class="stat-unit">套</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <Cpu />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ inUseMolds }}</div>
          <div class="stat-label">使用中</div>
          <div class="stat-unit">套</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger">
          <Tools />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ maintenanceMolds }}</div>
          <div class="stat-label">维护中</div>
          <div class="stat-unit">套</div>
        </div>
      </div>
    </div>

    <!-- 仓储地图 -->
    <el-card class="map-card">
      <template #header>
        <div class="card-header">
          <span>仓储布局地图</span>
          <el-select v-model="selectedArea" placeholder="选择区域" style="width: 150px;">
            <el-option label="全部区域" value="all" />
            <el-option v-for="area in areaList" :key="area" :label="area" :value="area" />
          </el-select>
        </div>
      </template>
      <div class="storage-map">
        <div 
          v-for="rack in storageRacks" 
          :key="rack.id"
          class="storage-rack"
          :class="{ 'selected': selectedRack === rack.id }"
          @click="selectRack(rack.id)"
        >
          <div class="rack-header">
            <span class="rack-id">{{ rack.id }}</span>
            <span class="rack-capacity">{{ rack.usedSlots }}/{{ rack.totalSlots }}</span>
          </div>
          <div class="rack-slots">
            <div 
              v-for="(slot, index) in rack.slots" 
              :key="index"
              class="rack-slot"
              :class="slot.status || 'empty'"
              :title="slot.mold ? `${slot.mold.code} - ${slot.mold.name}` : '空槽位'"
            >
              <div v-if="slot.mold" class="slot-content">
                <span class="mold-code">{{ slot.mold.code }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 仓储记录列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <h3>模具仓储记录</h3>
        <div class="table-actions">
          <el-select v-model="viewMode" placeholder="显示模式">
            <el-option label="表格视图" value="table" />
            <el-option label="列表视图" value="list" />
          </el-select>
        </div>
      </div>

      <!-- 表格视图 -->
      <el-table 
        v-if="viewMode === 'table'"
        :data="paginatedStorageRecords" 
        style="width: 100%"
        v-loading="loading"
        @sort-change="handleSort"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="moldCode" label="模具编号" width="120" sortable />
        <el-table-column prop="moldName" label="模具名称" width="180" sortable />
        <el-table-column prop="area" label="仓储区域" width="120" />
        <el-table-column prop="location" label="位置" width="150">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.location }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="storageDate" label="入库日期" width="120" sortable />
        <el-table-column prop="lastMoveDate" label="最近移动" width="120" sortable />
        <el-table-column prop="remark" label="备注" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)">查看</el-button>
            <el-button link @click="handleMove(scope.row)">移库</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 列表视图 -->
      <div v-else-if="viewMode === 'list'" class="storage-list">
        <el-card 
          v-for="record in paginatedStorageRecords" 
          :key="record.id"
          class="storage-item"
          shadow="hover"
        >
          <div class="storage-item-header">
            <div class="item-info">
              <h4>{{ record.moldName }}</h4>
              <span class="mold-code">{{ record.moldCode }}</span>
            </div>
            <el-tag :type="getStatusType(record.status)">{{ getStatusText(record.status) }}</el-tag>
          </div>
          <div class="storage-item-content">
            <div class="info-row">
              <span class="label">仓储位置:</span>
              <span class="value">{{ record.area }} - {{ record.location }}</span>
            </div>
            <div class="info-row">
              <span class="label">入库日期:</span>
              <span class="value">{{ record.storageDate }}</span>
            </div>
            <div class="info-row">
              <span class="label">最近移动:</span>
              <span class="value">{{ record.lastMoveDate }}</span>
            </div>
            <div v-if="record.remark" class="info-row">
              <span class="label">备注:</span>
              <span class="value">{{ record.remark }}</span>
            </div>
          </div>
          <div class="storage-item-actions">
            <el-button size="small" @click="handleView(record)">查看详情</el-button>
            <el-button size="small" type="primary" @click="handleMove(record)">移库</el-button>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredStorageRecords.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑仓储记录对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增仓储记录' : '编辑仓储记录'"
      width="600px"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="模具编号" prop="moldCode">
          <el-select v-model="formData.moldCode" placeholder="请选择模具" filterable>
            <el-option 
              v-for="mold in availableMolds" 
              :key="mold.code" 
              :label="`${mold.code} - ${mold.name}`" 
              :value="mold.code" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="仓储区域" prop="area">
          <el-select v-model="formData.area" placeholder="请选择区域">
            <el-option v-for="area in areaList" :key="area" :label="area" :value="area" />
          </el-select>
        </el-form-item>
        <el-form-item label="存储位置" prop="location">
          <el-select v-model="formData.location" placeholder="请选择位置">
            <el-option v-for="loc in getAvailableLocations(formData.area)" :key="loc" :label="loc" :value="loc" />
          </el-select>
        </el-form-item>
        <el-form-item label="入库日期" prop="storageDate">
          <el-date-picker v-model="formData.storageDate" type="date" placeholder="选择日期" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="在库" value="in_stock" />
            <el-option label="使用中" value="in_use" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 模具移库对话框 -->
    <el-dialog
      v-model="moveDialogVisible"
      title="模具移库"
      width="500px"
    >
      <el-form :model="moveFormData" :rules="moveFormRules" ref="moveFormRef" label-width="100px">
        <el-form-item label="当前位置">
          <el-input :value="currentLocation" disabled style="background: #f5f7fa;" />
        </el-form-item>
        <el-form-item label="目标区域" prop="targetArea">
          <el-select v-model="moveFormData.targetArea" placeholder="请选择目标区域">
            <el-option v-for="area in areaList" :key="area" :label="area" :value="area" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标位置" prop="targetLocation">
          <el-select v-model="moveFormData.targetLocation" placeholder="请选择目标位置">
            <el-option v-for="loc in getAvailableLocations(moveFormData.targetArea)" :key="loc" :label="loc" :value="loc" />
          </el-select>
        </el-form-item>
        <el-form-item label="移库日期" prop="moveDate">
          <el-date-picker v-model="moveFormData.moveDate" type="date" placeholder="选择日期" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="移库原因" prop="reason">
          <el-input v-model="moveFormData.reason" type="textarea" :rows="2" placeholder="请输入移库原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleMoveSubmit">确认移库</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`仓储详情 - ${selectedRecord?.moldName || ''}`"
      width="700px"
    >
      <div v-if="selectedRecord" class="storage-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模具编号">{{ selectedRecord.moldCode }}</el-descriptions-item>
          <el-descriptions-item label="模具名称">{{ selectedRecord.moldName }}</el-descriptions-item>
          <el-descriptions-item label="仓储区域">{{ selectedRecord.area }}</el-descriptions-item>
          <el-descriptions-item label="存储位置">{{ selectedRecord.location }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedRecord.status)">{{ getStatusText(selectedRecord.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="入库日期">{{ selectedRecord.storageDate }}</el-descriptions-item>
          <el-descriptions-item label="最近移动">{{ selectedRecord.lastMoveDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedRecord.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="move-history">
          <h3>移库历史</h3>
          <el-table :data="selectedRecord.moveHistory" style="width: 100%; margin-top: 10px;">
            <el-table-column prop="date" label="移库日期" width="120" />
            <el-table-column prop="fromLocation" label="原位置" width="120" />
            <el-table-column prop="toLocation" label="新位置" width="120" />
            <el-table-column prop="reason" label="原因" />
            <el-table-column prop="operator" label="操作人" width="100" />
          </el-table>
          <div v-if="!selectedRecord.moveHistory || selectedRecord.moveHistory.length === 0" class="empty-state">
            暂无移库历史
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Box, CheckCircle, Cpu, Tools, Map, Move, Plus, Printer } from '@element-plus/icons-vue'

// 响应式数据
const storageRecords = ref([])
const loading = ref(false)
const searchForm = reactive({
  keyword: '',
  area: '',
  status: ''
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const viewMode = ref('table')
const selectedArea = ref('all')
const selectedRack = ref(null)

// 对话框相关
const dialogVisible = ref(false)
const moveDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogType = ref('add')
const selectedRecord = ref(null)
const formRef = ref(null)
const moveFormRef = ref(null)

// 表单数据
const formData = reactive({
  moldCode: '',
  moldName: '',
  area: '',
  location: '',
  status: 'in_stock',
  storageDate: '',
  remark: ''
})

const moveFormData = reactive({
  targetArea: '',
  targetLocation: '',
  moveDate: '',
  reason: ''
})

// 表单验证规则
const formRules = reactive({
  moldCode: [{ required: true, message: '请选择模具', trigger: 'change' }],
  area: [{ required: true, message: '请选择仓储区域', trigger: 'change' }],
  location: [{ required: true, message: '请选择存储位置', trigger: 'change' }],
  storageDate: [{ required: true, message: '请选择入库日期', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

const moveFormRules = reactive({
  targetArea: [{ required: true, message: '请选择目标区域', trigger: 'change' }],
  targetLocation: [{ required: true, message: '请选择目标位置', trigger: 'change' }],
  moveDate: [{ required: true, message: '请选择移库日期', trigger: 'change' }],
  reason: [{ required: true, message: '请输入移库原因', trigger: 'change' }]
})

// 区域和位置数据
const areaList = ref(['模房A区', '模房B区', '模房C区', '维修区', '备用区'])
const locationMap = {
  '模房A区': ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10'],
  '模房B区': ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10'],
  '模房C区': ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10'],
  '维修区': ['M01', 'M02', 'M03', 'M04', 'M05'],
  '备用区': ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08']
}

// 计算属性
const filteredStorageRecords = computed(() => {
  return storageRecords.value.filter(record => {
    // 关键词搜索
    if (searchForm.keyword) {
      const keyword = searchForm.keyword.toLowerCase()
      if (!record.moldCode.toLowerCase().includes(keyword) && 
          !record.moldName.toLowerCase().includes(keyword)) {
        return false
      }
    }
    
    // 区域筛选
    if (searchForm.area && record.area !== searchForm.area) {
      return false
    }
    
    // 状态筛选
    if (searchForm.status && record.status !== searchForm.status) {
      return false
    }
    
    return true
  })
})

const paginatedStorageRecords = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredStorageRecords.value.slice(startIndex, endIndex)
})

// 统计数据
const totalMolds = computed(() => storageRecords.value.length)
const inStockMolds = computed(() => 
  storageRecords.value.filter(record => record.status === 'in_stock').length
)
const inUseMolds = computed(() => 
  storageRecords.value.filter(record => record.status === 'in_use').length
)
const maintenanceMolds = computed(() => 
  storageRecords.value.filter(record => record.status === 'maintenance').length
)

// 可用模具（模拟数据）
const availableMolds = ref([
  { code: 'M001', name: '产品A上模' },
  { code: 'M002', name: '产品B下模' },
  { code: 'M003', name: '产品C侧模' },
  { code: 'M004', name: '产品A下模' },
  { code: 'M005', name: '产品D前模' },
  { code: 'M006', name: '产品E后模' },
  { code: 'M007', name: '产品F上模' },
  { code: 'M008', name: '产品G下模' },
  { code: 'M009', name: '产品H前模' },
  { code: 'M010', name: '产品I后模' }
])

// 仓储架数据
const storageRacks = ref([
  {
    id: 'A架',
    area: '模房A区',
    totalSlots: 20,
    usedSlots: 8,
    slots: Array(20).fill(null).map((_, index) => {
      if (index < 8) {
        return {
          status: ['in_stock', 'in_use', 'maintenance'][Math.floor(Math.random() * 3)],
          mold: availableMolds.value[index % availableMolds.value.length]
        }
      }
      return { status: 'empty' }
    })
  },
  {
    id: 'B架',
    area: '模房B区',
    totalSlots: 20,
    usedSlots: 12,
    slots: Array(20).fill(null).map((_, index) => {
      if (index < 12) {
        return {
          status: ['in_stock', 'in_use', 'maintenance'][Math.floor(Math.random() * 3)],
          mold: availableMolds.value[(index + 5) % availableMolds.value.length]
        }
      }
      return { status: 'empty' }
    })
  },
  {
    id: 'C架',
    area: '模房C区',
    totalSlots: 20,
    usedSlots: 6,
    slots: Array(20).fill(null).map((_, index) => {
      if (index < 6) {
        return {
          status: ['in_stock', 'in_use', 'maintenance'][Math.floor(Math.random() * 3)],
          mold: availableMolds.value[(index + 8) % availableMolds.value.length]
        }
      }
      return { status: 'empty' }
    })
  }
])

// 当前位置（用于移库对话框）
const currentLocation = computed(() => {
  if (!selectedRecord) return ''
  return `${selectedRecord.area} - ${selectedRecord.location}`
})

// 生命周期钩子
onMounted(() => {
  loadStorageRecords()
})

// 方法
const loadStorageRecords = () => {
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    storageRecords.value = [
      {
        id: 1,
        moldCode: 'M001',
        moldName: '产品A上模',
        area: '模房A区',
        location: 'A01',
        status: 'in_use',
        storageDate: '2023-01-15',
        lastMoveDate: '2023-12-01',
        remark: '正常使用中',
        moveHistory: [
          {
            date: '2023-12-01',
            fromLocation: 'A02',
            toLocation: 'A01',
            reason: '调整位置',
            operator: '张师傅'
          },
          {
            date: '2023-06-15',
            fromLocation: 'B05',
            toLocation: 'A02',
            reason: '区域调整',
            operator: '李师傅'
          }
        ]
      },
      {
        id: 2,
        moldCode: 'M002',
        moldName: '产品B下模',
        area: '模房B区',
        location: 'B03',
        status: 'maintenance',
        storageDate: '2023-03-20',
        lastMoveDate: '2024-01-05',
        remark: '需要更换配件',
        moveHistory: [
          {
            date: '2024-01-05',
            fromLocation: 'B02',
            toLocation: 'B03',
            reason: '送修',
            operator: '王师傅'
          }
        ]
      },
      {
        id: 3,
        moldCode: 'M003',
        moldName: '产品C侧模',
        area: '模房C区',
        location: 'C04',
        status: 'in_stock',
        storageDate: '2023-11-05',
        lastMoveDate: null,
        remark: '备用模具',
        moveHistory: []
      },
      {
        id: 4,
        moldCode: 'M004',
        moldName: '产品A下模',
        area: '模房A区',
        location: 'A05',
        status: 'in_use',
        storageDate: '2022-12-25',
        lastMoveDate: '2023-10-15',
        remark: '',
        moveHistory: [
          {
            date: '2023-10-15',
            fromLocation: 'A07',
            toLocation: 'A05',
            reason: '正常周转',
            operator: '赵师傅'
          }
        ]
      },
      {
        id: 5,
        moldCode: 'M005',
        moldName: '产品D前模',
        area: '模房B区',
        location: 'B07',
        status: 'in_stock',
        storageDate: '2023-12-15',
        lastMoveDate: null,
        remark: '新品模具',
        moveHistory: []
      },
      {
        id: 6,
        moldCode: 'M006',
        moldName: '产品E后模',
        area: '维修区',
        location: 'M01',
        status: 'maintenance',
        storageDate: '2022-06-10',
        lastMoveDate: '2023-11-10',
        remark: '待报废',
        moveHistory: [
          {
            date: '2023-11-10',
            fromLocation: 'C08',
            toLocation: 'M01',
            reason: '故障维修',
            operator: '刘师傅'
          }
        ]
      }
    ]
    loading.value = false
  }, 500)
}

const getStatusType = (status) => {
  const types = {
    in_stock: 'success',
    in_use: 'info',
    maintenance: 'warning'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    in_stock: '在库',
    in_use: '使用中',
    maintenance: '维护中'
  }
  return texts[status] || '未知'
}

const getAvailableLocations = (area) => {
  return locationMap[area] || []
}

const selectRack = (rackId) => {
  selectedRack.value = selectedRack.value === rackId ? null : rackId
}

// 搜索和重置
const handleSearch = () => {
  currentPage.value = 1
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    area: '',
    status: ''
  })
  currentPage.value = 1
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}

// 排序处理
const handleSort = (sort) => {
  // 排序逻辑可以在这里实现
  console.log('Sort:', sort)
}

// 查看详情
const handleView = (record) => {
  selectedRecord.value = { ...record }
  detailDialogVisible.value = true
}

// 新增仓储记录
const handleAddStorage = () => {
  dialogType.value = 'add'
  Object.assign(formData, {
    moldCode: '',
    moldName: '',
    area: '',
    location: '',
    status: 'in_stock',
    storageDate: new Date().toISOString().split('T')[0],
    remark: ''
  })
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    // 查找模具名称
    const selectedMold = availableMolds.value.find(m => m.code === formData.moldCode)
    if (selectedMold) {
      formData.moldName = selectedMold.name
    }
    
    if (dialogType.value === 'add') {
      // 新增记录
      const newRecord = {
        id: Date.now(),
        ...formData,
        moveHistory: []
      }
      storageRecords.value.unshift(newRecord)
      ElMessage.success('仓储记录创建成功')
    } else {
      // 更新记录
      const index = storageRecords.value.findIndex(r => r.id === selectedRecord.value.id)
      if (index !== -1) {
        storageRecords.value[index] = {
          ...storageRecords.value[index],
          ...formData
        }
        ElMessage.success('仓储记录更新成功')
      }
    }
    
    dialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 移库
const handleMove = (record) => {
  selectedRecord.value = { ...record }
  Object.assign(moveFormData, {
    targetArea: record.area,
    targetLocation: record.location,
    moveDate: new Date().toISOString().split('T')[0],
    reason: ''
  })
  moveDialogVisible.value = true
}

// 提交移库
const handleMoveSubmit = async () => {
  try {
    await moveFormRef.value.validate()
    
    // 更新记录
    const index = storageRecords.value.findIndex(r => r.id === selectedRecord.value.id)
    if (index !== -1) {
      // 记录移库历史
      const moveRecord = {
        date: moveFormData.moveDate,
        fromLocation: `${selectedRecord.value.area} - ${selectedRecord.value.location}`,
        toLocation: `${moveFormData.targetArea} - ${moveFormData.targetLocation}`,
        reason: moveFormData.reason,
        operator: '当前用户'
      }
      
      // 更新记录
      storageRecords.value[index] = {
        ...storageRecords.value[index],
        area: moveFormData.targetArea,
        location: moveFormData.targetLocation,
        lastMoveDate: moveFormData.moveDate,
        moveHistory: [moveRecord, ...(storageRecords.value[index].moveHistory || [])]
      }
      
      ElMessage.success('移库操作成功')
    }
    
    moveDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 删除记录
const handleDelete = (record) => {
  ElMessageBox.confirm(
    `确定要删除模具 ${record.moldCode} 的仓储记录吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = storageRecords.value.findIndex(r => r.id === record.id)
    if (index !== -1) {
      storageRecords.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 批量打印
const handleBatchPrint = () => {
  ElMessage.success('批量打印功能已触发')
}
</script>

<style scoped>
.mold-storage {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #303133;
}

.actions {
  display: flex;
  gap: 10px;
}

.filter-bar {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 28px;
  margin-right: 20px;
  color: white;
}

.stat-icon.primary {
  background-color: #409EFF;
}

.stat-icon.success {
  background-color: #67C23A;
}

.stat-icon.warning {
  background-color: #E6A23C;
}

.stat-icon.danger {
  background-color: #F56C6C;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  display: flex;
  align-items: baseline;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-unit {
  font-size: 16px;
  color: #909399;
  margin-left: 5px;
  font-weight: normal;
}

.map-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.storage-map {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.storage-rack {
  background: #f5f7fa;
  border: 2px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.storage-rack:hover {
  border-color: #dcdfe6;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.storage-rack.selected {
  border-color: #409EFF;
  background: #ecf5ff;
}

.rack-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.rack-id {
  font-weight: bold;
  color: #303133;
  font-size: 16px;
}

.rack-capacity {
  color: #909399;
  font-size: 14px;
}

.rack-slots {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.rack-slot {
  aspect-ratio: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.3s;
}

.rack-slot.empty {
  background: #f5f7fa;
  border: 1px dashed #dcdfe6;
}

.rack-slot.in_stock {
  background: #f0f9ff;
  border: 1px solid #91d5ff;
  color: #1890ff;
}

.rack-slot.in_use {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.rack-slot.maintenance {
  background: #fff7e6;
  border: 1px solid #ffd591;
  color: #fa8c16;
}

.slot-content {
  text-align: center;
}

.mold-code {
  font-weight: bold;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h3 {
  margin: 0;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 列表视图样式 */
.storage-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.storage-item {
  height: 100%;
}

.storage-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.item-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #303133;
}

.item-info .mold-code {
  color: #909399;
  font-size: 14px;
}

.storage-item-content {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row .label {
  width: 80px;
  color: #909399;
}

.info-row .value {
  flex: 1;
  color: #303133;
}

.storage-item-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 详情页样式 */
.storage-detail {
  padding: 10px 0;
}

.move-history {
  margin-top: 30px;
}

.move-history h3 {
  margin: 0 0 15px 0;
  color: #303133;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .storage-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .filter-bar {
    overflow-x: auto;
  }
  
  .rack-slots {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .info-row {
    flex-direction: column;
  }
  
  .info-row .label {
    width: auto;
  }
}
</style>

cat > mold/MoldSchedule.vue <<'EOF'
<template>
  <div class="mold-schedule">
    <h1>模具排程管理</h1>
    <!-- 模具排程内容 -->
  </div>
</template>

<script setup>
// 模具排程逻辑
</script>
EOF

# 创建剩余的工装管理文件
cat > tooling/ToolingIssue.vue <<'EOF'
<template>
  <div class="tooling-issue">
    <h1>工装领用管理</h1>
    <!-- 工装领用内容 -->
  </div>
</template>

<script setup>
// 工装领用逻辑
</script>
EOF

cat > tooling/ToolingReturn.vue <<'EOF'
<template>
  <div class="tooling-return">
    <h1>工装归还管理</h1>
    <!-- 工装归还内容 -->
  </div>
</template>

<script setup>
// 工装归还逻辑
</script>
EOF

# 创建剩余的夹具管理文件
cat > fixture/FixtureSetup.vue <<'EOF'
<template>
  <div class="fixture-setup">
    <h1>夹具安装管理</h1>
    <!-- 夹具安装内容 -->
  </div>
</template>

<script setup>
// 夹具安装逻辑
</script>
EOF

cat > fixture/FixtureMaintenance.vue <<'EOF'
<template>
  <div class="fixture-maintenance">
    <h1>夹具保养管理</h1>
    <!-- 夹具保养内容 -->
  </div>
</template>

<script setup>
// 夹具保养逻辑
</script>
EOF