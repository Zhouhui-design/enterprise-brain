<template>
<<<<<<< HEAD
  <div class="bom-selector">
    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" label-width="100px">
        <el-form-item label="物料编码">
          <el-input v-model="searchForm.materialCode" placeholder="请输入物料编码" />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="searchForm.materialName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="BOM版本">
          <el-input v-model="searchForm.bomVersion" placeholder="请输入BOM版本" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="全部" value="" />
            <el-option label="激活" value="active" />
            <el-option label="废弃" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- BOM列表 -->
    <el-table
      v-loading="loading"
      :data="bomList"
      stripe
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
      style="width: 100%"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="materialCode" label="物料编码" width="120" />
      <el-table-column prop="materialName" label="物料名称" width="180" />
      <el-table-column prop="specification" label="规格型号" width="150" />
      <el-table-column prop="bomVersion" label="BOM版本" width="100" />
      <el-table-column prop="versionDescription" label="版本说明" min-width="150" />
      <el-table-column prop="createdBy" label="创建人" width="100" />
      <el-table-column prop="createdAt" label="创建时间" width="150" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '激活' : '废弃' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button type="primary" text @click="handleViewDetails(row)">查看明细</el-button>
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

    <!-- BOM明细对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="detailDialogTitle"
      width="900px"
      @close="handleDetailDialogClose"
    >
      <div v-if="selectedBOM" class="bom-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="物料编码">{{ selectedBOM.materialCode }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ selectedBOM.materialName }}</el-descriptions-item>
          <el-descriptions-item label="规格型号">{{ selectedBOM.specification }}</el-descriptions-item>
          <el-descriptions-item label="单位">{{ selectedBOM.unit }}</el-descriptions-item>
          <el-descriptions-item label="BOM版本">{{ selectedBOM.bomVersion }}</el-descriptions-item>
          <el-descriptions-item label="版本说明">{{ selectedBOM.versionDescription }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ selectedBOM.createdBy }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedBOM.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="最后修改人" :span="2">{{ selectedBOM.updatedBy || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="bom-components">
          <h3>BOM组件明细</h3>
          <el-table :data="selectedBOM.components" stripe size="small" border>
            <el-table-column prop="materialCode" label="组件编码" width="120" />
            <el-table-column prop="materialName" label="组件名称" width="150" />
            <el-table-column prop="specification" label="规格型号" width="120" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="usageQuantity" label="用量" width="80" align="right" />
            <el-table-column prop="scrapRate" label="损耗率" width="80" align="right">
              <template #default="{ row }">
                {{ row.scrapRate }}%
              </template>
            </el-table-column>
            <el-table-column prop="effectiveQuantity" label="有效数量" width="100" align="right">
              <template #default="{ row }">
                {{ row.effectiveQuantity }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="备注" min-width="150" />
          </el-table>
        </div>

        <div class="bom-summary">
          <h4>汇总信息</h4>
          <div class="summary-item">
            <span class="label">组件总数：</span>
            <span class="value">{{ selectedBOM.components.length }} 项</span>
          </div>
          <div class="summary-item">
            <span class="label">物料成本：</span>
            <span class="value">{{ selectedBOM.totalCost }} 元</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleSelectBOM(selectedBOM)">选择此BOM</el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineEmits, defineProps, watch } from 'vue'

// 类型定义
interface BOM {
  id: string
  materialCode: string
  materialName: string
  specification: string
  unit: string
  bomVersion: string
  versionDescription: string
  status: string
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
  components?: BOMComponent[]
  totalCost?: number
}

interface BOMComponent {
  materialCode: string
  materialName: string
  specification: string
  unit: string
  usageQuantity: number
  scrapRate: number
  effectiveQuantity: number
  description?: string
}

// Props定义
const props = defineProps<{
  visible?: boolean
  selectedBOMs?: BOM[]
  multiple?: boolean
}>()

// Emits定义
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', boms: BOM[]): void
  (e: 'confirm', boms: BOM[]): void
}>()

// 响应式数据
const loading = ref(false)
const detailDialogVisible = ref(false)
const detailDialogTitle = ref('BOM明细')
const selectedBOM = ref<BOM | null>(null)
const selectedItems = ref<BOM[]>([])

// 搜索表单
const searchForm = reactive({
  materialCode: '',
  materialName: '',
  bomVersion: '',
  status: ''
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// BOM列表
const bomList = ref<BOM[]>([])

// 监听selectedBOMs变化
watch(() => props.selectedBOMs, (newVal) => {
  if (newVal) {
    selectedItems.value = [...newVal]
  }
}, { deep: true })

// 获取BOM列表
const getBOMList = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    const mockData: BOM[] = [
      {
        id: '1',
        materialCode: 'PROD001',
        materialName: '智能控制器',
        specification: '型号：CTRL-2024',
        unit: '台',
        bomVersion: 'V1.0',
        versionDescription: '初始版本',
        status: 'active',
        createdBy: '张三',
        createdAt: '2024-01-01 10:00:00',
        totalCost: 120.5
      },
      {
        id: '2',
        materialCode: 'PROD001',
        materialName: '智能控制器',
        specification: '型号：CTRL-2024',
        unit: '台',
        bomVersion: 'V1.1',
        versionDescription: '优化PCB布局',
        status: 'active',
        createdBy: '李四',
        createdAt: '2024-01-15 14:30:00',
        updatedBy: '王五',
        updatedAt: '2024-01-16 09:00:00',
        totalCost: 115.8
      },
      {
        id: '3',
        materialCode: 'PROD002',
        materialName: '传感器模组',
        specification: '型号：SENSOR-100',
        unit: '套',
        bomVersion: 'V1.0',
        versionDescription: '初始版本',
        status: 'active',
        createdBy: '赵六',
        createdAt: '2024-01-10 11:20:00',
        totalCost: 85.6
      },
      {
        id: '4',
        materialCode: 'PROD003',
        materialName: '电源模块',
        specification: '型号：POWER-5V2A',
        unit: '个',
        bomVersion: 'V1.0',
        versionDescription: '初始版本',
        status: 'active',
        createdBy: '孙七',
        createdAt: '2024-01-05 16:40:00',
        totalCost: 35.2
      },
      {
        id: '5',
        materialCode: 'PROD004',
        materialName: '控制面板',
        specification: '型号：PANEL-240',
        unit: '件',
        bomVersion: 'V1.0',
        versionDescription: '初始版本',
        status: 'active',
        createdBy: '钱八',
        createdAt: '2024-01-12 13:15:00',
        totalCost: 65.4
      },
      {
        id: '6',
        materialCode: 'PROD001',
        materialName: '智能控制器',
        specification: '型号：CTRL-2023',
        unit: '台',
        bomVersion: 'V0.9',
        versionDescription: '原型版本',
        status: 'inactive',
        createdBy: '张三',
        createdAt: '2023-12-20 09:30:00',
        totalCost: 130.0
      },
      {
        id: '7',
        materialCode: 'PROD005',
        materialName: '连接线束',
        specification: '型号：CABLE-KIT',
        unit: '条',
        bomVersion: 'V1.0',
        versionDescription: '初始版本',
        status: 'active',
        createdBy: '周九',
        createdAt: '2024-01-08 15:25:00',
        totalCost: 15.8
      }
    ]
    
    // 过滤数据
    let filteredData = [...mockData]
    if (searchForm.materialCode) {
      filteredData = filteredData.filter(item => 
        item.materialCode.includes(searchForm.materialCode)
      )
    }
    if (searchForm.materialName) {
      filteredData = filteredData.filter(item => 
        item.materialName.includes(searchForm.materialName)
      )
    }
    if (searchForm.bomVersion) {
      filteredData = filteredData.filter(item => 
        item.bomVersion.includes(searchForm.bomVersion)
      )
    }
    if (searchForm.status) {
      filteredData = filteredData.filter(item => 
        item.status === searchForm.status
      )
    }
    
    // 更新分页数据
    pagination.total = filteredData.length
    bomList.value = filteredData.slice(
      (pagination.currentPage - 1) * pagination.pageSize,
      pagination.currentPage * pagination.pageSize
    )
  } catch (error) {
    console.error('获取BOM列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取BOM明细
const getBOMDetails = async (bomId: string): Promise<BOM> => {
  // 模拟API调用
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 模拟明细数据
  const mockComponents: BOMComponent[] = [
    {
      materialCode: 'MAT001',
      materialName: 'PCB电路板',
      specification: 'FR-4 2层 100x150mm',
      unit: '张',
      usageQuantity: 1,
      scrapRate: 2,
      effectiveQuantity: 1.02
    },
    {
      materialCode: 'MAT002',
      materialName: '电阻器',
      specification: '10KΩ 0805 5%',
      unit: '个',
      usageQuantity: 5,
      scrapRate: 1,
      effectiveQuantity: 5.05
    },
    {
      materialCode: 'MAT003',
      materialName: '微控制器',
      specification: 'STM32F103C8T6',
      unit: '片',
      usageQuantity: 1,
      scrapRate: 0.5,
      effectiveQuantity: 1.005
    },
    {
      materialCode: 'MAT004',
      materialName: '电容',
      specification: '100nF 0805 10%',
      unit: '个',
      usageQuantity: 3,
      scrapRate: 1,
      effectiveQuantity: 3.03
    },
    {
      materialCode: 'MAT008',
      materialName: '显示屏',
      specification: '2.4寸 TFT 320x240',
      unit: '个',
      usageQuantity: 1,
      scrapRate: 0.5,
      effectiveQuantity: 1.005,
      description: '注意：安装时避免挤压'
    }
  ]
  
  const mockDetail: BOM = {
    id: bomId,
    materialCode: 'PROD001',
    materialName: '智能控制器',
    specification: '型号：CTRL-2024',
    unit: '台',
    bomVersion: 'V1.1',
    versionDescription: '优化PCB布局',
    status: 'active',
    createdBy: '李四',
    createdAt: '2024-01-15 14:30:00',
    updatedBy: '王五',
    updatedAt: '2024-01-16 09:00:00',
    components: mockComponents,
    totalCost: 115.8
  }
  
  return mockDetail
}

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1
  getBOMList()
}

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    materialCode: '',
    materialName: '',
    bomVersion: '',
    status: ''
  })
  pagination.currentPage = 1
  getBOMList()
}

// 处理选择变更
const handleSelectionChange = (selection: BOM[]) => {
  selectedItems.value = selection
  emit('select', selection)
}

// 处理行点击
const handleRowClick = (row: BOM, column: any, event: Event) => {
  if (!props.multiple) {
    // 单选模式下，点击行即选中
    selectedItems.value = [row]
    emit('select', selectedItems.value)
  }
}

// 处理查看明细
const handleViewDetails = async (bom: BOM) => {
  loading.value = true
  try {
    selectedBOM.value = await getBOMDetails(bom.id)
    detailDialogTitle.value = `${bom.materialName} - ${bom.bomVersion} 明细`
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取BOM明细失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理选择
const handleSelect = (bom: BOM) => {
  if (props.multiple) {
    const index = selectedItems.value.findIndex(item => item.id === bom.id)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    } else {
      selectedItems.value.push(bom)
    }
  } else {
    selectedItems.value = [bom]
    emit('confirm', selectedItems.value)
    emit('update:visible', false)
  }
  emit('select', selectedItems.value)
}

// 处理选择BOM
const handleSelectBOM = (bom: BOM) => {
  if (props.multiple) {
    const index = selectedItems.value.findIndex(item => item.id === bom.id)
    if (index === -1) {
      selectedItems.value.push(bom)
    }
  } else {
    selectedItems.value = [bom]
  }
  emit('select', selectedItems.value)
  detailDialogVisible.value = false
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  getBOMList()
}

// 处理页码变化
const handleCurrentChange = (current: number) => {
  pagination.currentPage = current
  getBOMList()
}

// 处理明细对话框关闭
const handleDetailDialogClose = () => {
  selectedBOM.value = null
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
  refresh: getBOMList
})

// 组件挂载时获取数据
getBOMList()
</script>

<style scoped>
.bom-selector {
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

.bom-details {
  padding: 10px;
}

.bom-components {
  margin-top: 20px;
}

.bom-components h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
}

.bom-summary {
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.bom-summary h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 500;
}

.summary-item {
  display: inline-block;
  margin-right: 30px;
  margin-bottom: 10px;
}

.summary-item .label {
  color: #606266;
  font-size: 14px;
}

.summary-item .value {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
=======
  <el-dialog
    v-model="visible"
    title="BOM选择器"
    width="900px"
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <div class="bom-selector">
      <!-- 搜索区域 -->
      <div class="search-section">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="BOM版本">
            <el-input
              v-model="searchForm.version"
              placeholder="请输入BOM版本"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
              style="width: 120px"
            >
              <el-option label="已激活" value="active" />
              <el-option label="草稿" value="draft" />
              <el-option label="已停用" value="inactive" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
            <el-button @click="handleReset" :icon="Refresh">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- BOM列表 -->
      <div class="bom-list">
        <el-table
          :data="bomList"
          v-loading="loading"
          @row-click="handleRowClick"
          highlight-current-row
          height="300"
        >
          <el-table-column type="radio" width="50" />
          <el-table-column type="index" width="60" label="序号" />
          <el-table-column prop="version" label="BOM版本" width="120" />
          <el-table-column prop="productName" label="产品名称" min-width="150" />
          <el-table-column prop="productCode" label="产品编码" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="materialCount" label="物料数量" width="100" />
          <el-table-column prop="createdBy" label="创建人" width="100" />
          <el-table-column prop="createdAt" label="创建时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- BOM详情 -->
      <div class="bom-detail" v-if="selectedBOM">
        <h4>BOM物料清单</h4>
        <el-table
          :data="selectedBOM.materials"
          border
          size="small"
          max-height="200"
        >
          <el-table-column type="index" width="50" label="序号" />
          <el-table-column prop="materialCode" label="物料编码" width="120" />
          <el-table-column prop="materialName" label="物料名称" min-width="150" />
          <el-table-column prop="specification" label="规格型号" width="120" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="quantity" label="单耗" width="80" />
          <el-table-column prop="stock" label="库存数量" width="100" />
          <el-table-column label="库存状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStockStatusType(row.stock, row.quantity)" size="small">
                {{ getStockStatus(row.stock, row.quantity) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedBOM">
          确认选择
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  productId: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

// 响应式数据
const visible = ref(false)
const loading = ref(false)
const bomList = ref([])
const selectedBOM = ref(null)

// 搜索表单
const searchForm = reactive({
  version: '',
  status: 'active'
})

// 监听显示状态
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 方法
const handleOpen = () => {
  loadBOMList()
}

const handleSearch = () => {
  loadBOMList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    version: '',
    status: 'active'
  })
  handleSearch()
}

const handleRowClick = (row) => {
  selectedBOM.value = row
}

const handleCancel = () => {
  visible.value = false
  selectedBOM.value = null
}

const handleConfirm = () => {
  if (!selectedBOM.value) {
    ElMessage.warning('请选择一个BOM')
    return
  }
  
  emit('select', selectedBOM.value)
  visible.value = false
  selectedBOM.value = null
}

// 工具方法
const getStatusTagType = (status) => {
  const map = {
    active: 'success',
    draft: 'warning',
    inactive: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    active: '已激活',
    draft: '草稿',
    inactive: '已停用'
  }
  return map[status] || status
}

const getStockStatusType = (stock, required) => {
  if (stock >= required) return 'success'
  if (stock > 0) return 'warning'
  return 'danger'
}

const getStockStatus = (stock, required) => {
  if (stock >= required) return '充足'
  if (stock > 0) return '不足'
  return '缺料'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

// 加载数据
const loadBOMList = async () => {
  loading.value = true
  try {
    // 这里调用API获取BOM列表
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    bomList.value = [
      {
        id: 1,
        version: 'V1.0',
        productName: '产品A',
        productCode: 'P001',
        status: 'active',
        materialCount: 5,
        createdBy: '张三',
        createdAt: '2024-01-01',
        materials: [
          {
            materialCode: 'M001',
            materialName: '物料A',
            specification: '规格A',
            unit: '个',
            quantity: 2,
            stock: 1000
          },
          {
            materialCode: 'M002',
            materialName: '物料B',
            specification: '规格B',
            unit: 'kg',
            quantity: 1.5,
            stock: 500
          },
          {
            materialCode: 'M003',
            materialName: '物料C',
            specification: '规格C',
            unit: '套',
            quantity: 1,
            stock: 50
          }
        ]
      },
      {
        id: 2,
        version: 'V2.0',
        productName: '产品A',
        productCode: 'P001',
        status: 'active',
        materialCount: 4,
        createdBy: '李四',
        createdAt: '2024-01-15',
        materials: [
          {
            materialCode: 'M001',
            materialName: '物料A',
            specification: '规格A',
            unit: '个',
            quantity: 2,
            stock: 1000
          },
          {
            materialCode: 'M002',
            materialName: '物料B',
            specification: '规格B',
            unit: 'kg',
            quantity: 1.2,
            stock: 500
          },
          {
            materialCode: 'M004',
            materialName: '物料D',
            specification: '规格D',
            unit: '件',
            quantity: 1,
            stock: 200
          }
        ]
      }
    ].filter(bom => {
      if (props.productId && bom.productCode !== `P${String(props.productId).padStart(3, '0')}`) {
        return false
      }
      if (searchForm.version && !bom.version.toLowerCase().includes(searchForm.version.toLowerCase())) {
        return false
      }
      if (searchForm.status && bom.status !== searchForm.status) {
        return false
      }
      return true
    })
  } catch (error) {
    ElMessage.error('获取BOM列表失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.bom-selector {
  .search-section {
    margin-bottom: 20px;
  }
  
  .bom-list {
    margin-bottom: 20px;
  }
  
  .bom-detail {
    h4 {
      margin: 0 0 12px 0;
      color: #303133;
      border-bottom: 1px solid #e4e7ed;
      padding-bottom: 8px;
    }
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
>>>>>>> origin/develop
}
</style>