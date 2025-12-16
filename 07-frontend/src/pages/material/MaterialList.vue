<template>
  <div class="material-list-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>产品物料库</h2>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增物料
        </el-button>
        <el-button type="danger" :disabled="!hasSelection" @click="handleBatchDelete">批量删除</el-button>
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button type="warning" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="handlePrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="showColumnControl = true">
          <el-icon><Setting /></el-icon>
          字段管理
        </el-button>
        <el-button @click="showPageSettings = true">
          <el-icon><Tools /></el-icon>
          页面设置
        </el-button>
      </div>
    </div>

    <!-- 筛选说明提示 -->
    <div class="filter-tip">
      <el-alert
        title="表头筛选功能"
        type="info"
        description="点击表头右侧的筛选图标，可对任意列进行筛选。支持文本、数字、日期等多种筛选类型，可多列同时筛选。"
        :closable="false"
        show-icon
      />
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #409EFF;">
            <el-icon :size="24"><Box /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">物料总数</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #67C23A;">
            <el-icon :size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.active }}</div>
            <div class="stat-label">在用物料</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #E6A23C;">
            <el-icon :size="24"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.categories }}</div>
            <div class="stat-label">物料分类</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主表格 - 使用FilterTable组件 -->
    <FilterTable
      ref="filterTableRef"
      :data="tableData"
      :columns="filterTableColumns"
      :height="tableHeight"
      show-selection
      show-index
      stripe
      border
      @selection-change="handleSelectionChange"
      @filter-change="handleFilterChange"
    >
      <!-- 物料名称自定义渲染 -->
      <template #materialName="{ row }">
        <el-link type="primary" @click="handleView(row)">{{ row.materialName }}</el-link>
      </template>
      
      <!-- 图片自定义渲染 -->
      <template #materialImage="{ row }">
        <el-image 
          v-if="row.materialImage"
          :src="row.materialImage" 
          :preview-src-list="[row.materialImage]"
          :preview-teleported="true"
          style="width: 50px; height: 50px; cursor: pointer;"
          fit="cover"
          lazy
        />
        <span v-else style="color: #909399;">无图片</span>
      </template>
      
      <!-- 来源自定义渲染 -->
      <template #source="{ row }">
        <span v-if="row.source && row.source.length > 0">
          <el-tag 
            v-for="(item, index) in row.source" 
            :key="index" 
            size="small" 
            style="margin-right: 5px;"
          >
            {{ item }}
          </el-tag>
        </span>
        <span v-else>-</span>
      </template>
      
      <!-- 状态自定义渲染 -->
      <template #status="{ row }">
        <el-tag :type="row.status === '在用' ? 'success' : 'info'">{{ row.status }}</el-tag>
      </template>
      
      <!-- 工序单价自定义渲染 -->
      <template #processPrice="{ row }">
        ¥{{ row.processPrice?.toFixed(2) }}
      </template>
      
      <!-- 采购单价自定义渲染 -->
      <template #purchasePrice="{ row }">
        ¥{{ row.purchasePrice?.toFixed(2) }}
      </template>
      
      <!-- 操作列 -->
      <template #operation="{ row }">
        <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="success" size="small" @click="handleView(row)">查看</el-button>
        <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </FilterTable>

    <!-- 分页 -->
    <!-- 分页 - FilterTable内部处理分页，不需要单独的分页组件 -->

    <!-- 新增/编辑物料对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      :title="dialogTitle" 
      width="90%" 
      :close-on-click-modal="false"
      destroy-on-close
    >
      <MaterialEdit 
        :material-data="currentMaterial" 
        :is-edit="isEdit"
        :all-materials="paginatedTableData"
        :current-index="currentMaterialIndex"
        @success="handleEditSuccess" 
        @save="handleSaveOnly"
        @navigate="handleNavigate"
        @cancel="editDialogVisible = false" 
      />
    </el-dialog>

    <!-- 查看物料详情对话框 -->
    <el-dialog 
      v-model="viewDialogVisible" 
      title="物料详情" 
      width="80%" 
      :close-on-click-modal="false"
    >
      <MaterialView 
        :material-data="currentMaterial" 
        @close="viewDialogVisible = false" 
      />
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入物料数据" width="500px">
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

    <!-- 字段管理对话框 -->
    <el-dialog v-model="showColumnControl" title="字段管理" width="600px">
      <div class="column-control-panel">
        <div class="panel-header">
          <span>拖拽调整字段顺序，勾选控制显示/隐藏</span>
        </div>
        <el-divider style="margin: 10px 0;" />
        <el-checkbox-group v-model="visibleFields">
          <div v-for="col in filterTableColumns" :key="col.prop" class="field-item">
            <el-checkbox :label="col.prop">{{ col.label }}</el-checkbox>
          </div>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="showColumnControl = false">取消</el-button>
        <el-button type="primary" @click="handleSaveColumns">保存</el-button>
      </template>
    </el-dialog>

    <!-- 页面设置对话框 -->
    <PageSettings
      v-model="showPageSettings"
      settings-key="material-list"
      :available-fields="filterTableColumns"
      :show-workflow="false"
      :show-menu="false"
      :show-color="true"
      :show-encoding="true"
      :show-fields="true"
      :show-print="true"
      :show-export="true"
      @save="handleSavePageSettings"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, Plus, Upload, Download, Printer, Refresh, UploadFilled,
  Box, CircleCheck, Warning, Setting, Tools
} from '@element-plus/icons-vue'
import * as XLSX from 'xlsx' // 静态导入XLSX库
import FilterTable from '@/components/common/tables/FilterTable.vue'
import MaterialEdit from './MaterialEdit.vue'
import MaterialView from './MaterialView.vue'
import PageSettings from '@/components/common/PageSettings.vue'
// import databaseService from '@/services/DatabaseService.js' // 不再使用IndexedDB
import materialApiService from '@/services/api/materialApiService' // 使用后端API服务

// 使用后端API服务替代IndexedDB
const databaseService = materialApiService

// 数据
const filterTableRef = ref(null)
const tableRef = ref(null)
const searchForm = ref({
  materialCode: '',
  materialName: '',
  majorCategory: ''
})

// FilterTable列配置
const filterTableColumns = ref([
  { prop: 'materialCode', label: '物料编号', width: 150, fixed: 'left', sortable: true, filterable: true },
  { prop: 'materialName', label: '物料名称', width: 200, sortable: true, filterable: true, showCustom: true },
  { prop: 'materialImage', label: '图片', width: 100, showCustom: true },
  { prop: 'sizeSpec', label: '尺寸规格', width: 150, filterable: true },
  { prop: 'color', label: '颜色', width: 100, filterable: true },
  { prop: 'material', label: '材质', width: 120, filterable: true },
  { prop: 'majorCategory', label: '大类', width: 120, sortable: true, filterable: true },
  { prop: 'middleCategory', label: '中类', width: 120, filterable: true },
  { prop: 'minorCategory', label: '小类', width: 120, filterable: true },
  { prop: 'model', label: '型号', width: 120, filterable: true },
  { prop: 'series', label: '系列', width: 120, filterable: true },
  { prop: 'source', label: '来源', width: 120, filterable: true, showCustom: true },
  { prop: 'status', label: '状态', width: 100, filterable: true, showCustom: true },
  { prop: 'stockQuantity', label: '库存', width: 100, align: 'right', sortable: true },
  { prop: 'processPrice', label: '工序单价', width: 120, align: 'right', sortable: true, showCustom: true },
  { prop: 'purchasePrice', label: '采购单价', width: 120, align: 'right', sortable: true, showCustom: true },
  { prop: 'baseUnit', label: '基础单位', width: 100, filterable: true },
  { prop: 'processName', label: '产出工序名称', width: 150, filterable: true },
  { prop: 'standardTime', label: '定时工额', width: 120, align: 'right', sortable: true },
  { prop: 'quotaTime', label: '定额工时', width: 120, align: 'right', sortable: true },
  { prop: 'defaultProcurementLeadTime', label: '默认采购提前期', width: 150, align: 'right', sortable: true },
  { prop: 'minimumPackagingQuantity', label: '最小包装量', width: 130, align: 'right', sortable: true, 
    formatter: (row) => {
      const value = row.minimumPackagingQuantity
      return value !== null && value !== undefined ? value : 1
    }
  },  // ✅ 新增
  { prop: 'createTime', label: '创建时间', width: 160, sortable: true, filterable: true },
  { prop: 'operation', label: '操作', width: 200, fixed: 'right', showCustom: true }  // ✅ 添加操作列
])

// 旧的表格列配置（保留用于导出等功能）
const tableColumns = ref([
  { prop: 'materialCode', label: '物料编码', width: 140, fixed: 'left' },
  { prop: 'bomNumber', label: 'BOM编号', width: 140 },
  { prop: 'materialName', label: '物料名称', width: 180, fixed: 'left' },
  { prop: 'materialImage', label: '图片', width: 100 },
  { prop: 'sizeSpec', label: '尺寸规格', width: 120 },
  { prop: 'color', label: '颜色', width: 80 },
  { prop: 'material', label: '材质', width: 100 },
  { prop: 'majorCategory', label: '大类', width: 100 },
  { prop: 'middleCategory', label: '中类', width: 100 },
  { prop: 'minorCategory', label: '小类', width: 100 },
  { prop: 'model', label: '型号', width: 100 },
  { prop: 'series', label: '系列', width: 100 },
  { prop: 'source', label: '来源', width: 120 },
  { prop: 'description', label: '物料详述', width: 150, showOverflowTooltip: true },
  { prop: 'baseUnit', label: '基础单位', width: 80 },
  { prop: 'saleUnit', label: '销售单位', width: 80 },
  { prop: 'saleConversionRate', label: '销售转化率', width: 100, align: 'right' },
  { prop: 'purchaseUnit', label: '采购单位', width: 80 },
  { prop: 'purchaseConversionRate', label: '采购转化率', width: 100, align: 'right' },
  { prop: 'kgPerPcs', label: 'kg/pcs', width: 80, align: 'right' },
  { prop: 'pcsPerKg', label: 'pcs/kg', width: 80, align: 'right' },
  { prop: 'processName', label: '产出工序名称', width: 120 },
  { prop: 'standardTime', label: '定时工额', width: 80, align: 'right' },
  { prop: 'quotaTime', label: '定额工时', width: 80, align: 'right' },
  { prop: 'minimumPackagingQuantity', label: '最小包装量', width: 100, align: 'right' },
  { prop: 'processPrice', label: '工序单价', width: 100, align: 'right' },
  { prop: 'purchaseCycle', label: '采购周期', width: 80 },
  { prop: 'purchasePrice', label: '采购单价', width: 100, align: 'right' },
  { prop: 'createTime', label: '创建时间', width: 150 }
])

const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const tableHeight = ref(600)
const editDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const importDialogVisible = ref(false)
const currentMaterial = ref(null)
const isEdit = ref(false)
const uploadFile = ref(null) // 存储上传的文件
const currentMaterialIndex = ref(-1) // 当前编辑物料在表格中的索引
const showColumnControl = ref(false) // 字段管理对话框
const showPageSettings = ref(false) // 页面设置对话框
const visibleFields = ref([]) // 可见字段

// 统计数据
const stats = ref({
  total: 0,
  active: 0,
  categories: 0
})

// 表格数据（模拟数据）
const tableData = ref([]) // 初始化为空数组，从localStorage加载数据

// 下一个物料ID
const nextMaterialId = ref(3)

// 计算属性
const hasSelection = computed(() => selectedRows.value.length > 0)

const filteredTableData = computed(() => {
  let data = tableData.value
  
  if (searchForm.value.materialCode) {
    data = data.filter(item => 
      item.materialCode.toLowerCase().includes(searchForm.value.materialCode.toLowerCase())
    )
  }
  if (searchForm.value.materialName) {
    data = data.filter(item => 
      item.materialName.toLowerCase().includes(searchForm.value.materialName.toLowerCase())
    )
  }
  if (searchForm.value.majorCategory) {
    data = data.filter(item => item.majorCategory === searchForm.value.majorCategory)
  }
  
  totalCount.value = data.length
  return data
})

// 分页后的数据
const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTableData.value.slice(start, end)
})

const dialogTitle = computed(() => isEdit.value ? '编辑物料' : '新增物料')

// 更新统计数据
const updateStats = () => {
  stats.value.total = tableData.value.length
  stats.value.active = tableData.value.length
  const categories = new Set(tableData.value.map(m => m.majorCategory))
  stats.value.categories = categories.size
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 搜索防抖定时器
let searchTimer = null

// 搜索
const handleSearch = () => {
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  // 设置新的定时器，延迟300ms执行搜索
  searchTimer = setTimeout(() => {
    currentPage.value = 1
  }, 300)
}

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    materialCode: '',
    materialName: '',
    majorCategory: ''
  }
  
  // 清除搜索定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  handleSearch()
}

// 新增物料
const handleCreate = () => {
  currentMaterial.value = null
  isEdit.value = false
  editDialogVisible.value = true
}

// 编辑物料
const handleEdit = (row) => {
  currentMaterial.value = { ...row }
  // 找到当前物料在分页数据中的索引
  currentMaterialIndex.value = paginatedTableData.value.findIndex(item => item.id === row.id)
  isEdit.value = true
  editDialogVisible.value = true
}

// 查看物料
const handleView = (row) => {
  currentMaterial.value = { ...row }
  viewDialogVisible.value = true
}

// 删除物料
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除物料“${row.materialName}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      // 从数据库删除
      await databaseService.deleteMaterial(row.id)
      updateStats()
      ElMessage.success('删除成功')
    }
  } catch (error) {
    console.error('删除物料失败:', error)
    ElMessage.error('删除物料失败: ' + error.message)
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个物料吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const deleteIds = selectedRows.value.map(row => row.id)
    tableData.value = tableData.value.filter(row => !deleteIds.includes(row.id))
    selectedRows.value = []
    // 从数据库批量删除
    await databaseService.deleteMaterials(deleteIds)
    updateStats()
    ElMessage.success('批量删除成功')
  } catch (error) {
    console.error('批量删除物料失败:', error)
    ElMessage.error('批量删除物料失败: ' + error.message)
  }
}

// 编辑成功回调（提交并关闭）
const handleEditSuccess = async (materialData) => {
  try {
    if (isEdit.value) {
      // 更新物料
      const index = tableData.value.findIndex(m => m.id === materialData.id)
      if (index !== -1) {
        tableData.value[index] = {
          ...materialData,
          updateTime: new Date().toLocaleString('zh-CN')
        }
        // 保存到数据库
        console.log('更新物料到数据库:', tableData.value[index])
        await databaseService.saveMaterial(tableData.value[index])
        ElMessage.success('物料更新成功')
      }
    } else {
      // 新增物料
      const newMaterial = {
        ...materialData,
        id: nextMaterialId.value,
        materialCode: `M${new Date().getFullYear()}${String(nextMaterialId.value).padStart(4, '0')}`,
        createTime: new Date().toLocaleString('zh-CN')
      }
      tableData.value.unshift(newMaterial)
      nextMaterialId.value++
      // 保存到数据库
      console.log('新增物料到数据库:', newMaterial)
      await databaseService.saveMaterial(newMaterial)
      ElMessage.success('物料创建成功')
    }
    
    editDialogVisible.value = false // 关闭对话框
    updateStats()
  } catch (error) {
    console.error('保存物料失败详细信息:', error)
    console.error('错误堆栈:', error.stack)
    ElMessage.error('保存物料失败: ' + (error.message || error))
  }
}

// 只保存，不关闭对话框
const handleSaveOnly = async (materialData) => {
  try {
    if (isEdit.value) {
      // 更新物料
      const index = tableData.value.findIndex(m => m.id === materialData.id)
      if (index !== -1) {
        tableData.value[index] = {
          ...materialData,
          updateTime: new Date().toLocaleString('zh-CN')
        }
        // 保存到数据库
        console.log('更新物料到数据库:', tableData.value[index])
        await databaseService.saveMaterial(tableData.value[index])
      }
    } else {
      // 新增物料
      const newMaterial = {
        ...materialData,
        id: nextMaterialId.value,
        materialCode: `M${new Date().getFullYear()}${String(nextMaterialId.value).padStart(4, '0')}`,
        createTime: new Date().toLocaleString('zh-CN')
      }
      tableData.value.unshift(newMaterial)
      nextMaterialId.value++
      // 保存到数据库
      console.log('新增物料到数据库:', newMaterial)
      await databaseService.saveMaterial(newMaterial)
      // 更新为编辑模式
      isEdit.value = true
      currentMaterial.value = newMaterial
    }
    
    updateStats()
    // 不关闭对话框
  } catch (error) {
    console.error('保存物料失败详细信息:', error)
    console.error('错误堆栈:', error.stack)
    ElMessage.error('保存物料失败: ' + (error.message || error))
  }
}

// 导航到上一项/下一项
const handleNavigate = (direction) => {
  const materials = paginatedTableData.value
  let newIndex = currentMaterialIndex.value
  
  if (direction === 'prev' && newIndex > 0) {
    newIndex--
  } else if (direction === 'next' && newIndex < materials.length - 1) {
    newIndex++
  }
  
  if (newIndex !== currentMaterialIndex.value) {
    currentMaterialIndex.value = newIndex
    currentMaterial.value = { ...materials[newIndex] }
  }
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
}

// 文件选择
const handleFileChange = (file) => {
  uploadFile.value = file
}

// 确认导入
const handleImportConfirm = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  
  try {
    // 读取Excel文件
    const file = uploadFile.value.raw
    const reader = new FileReader()
    
    // 使用Promise来处理异步读取
    const arrayBuffer = await new Promise((resolve, reject) => {
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(e)
      reader.readAsArrayBuffer(file)
    })
    
    const data = new Uint8Array(arrayBuffer)
    const workbook = XLSX.read(data, { type: 'array' })
    
    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // 将工作表转换为JSON
    const importedData = XLSX.utils.sheet_to_json(worksheet)
    
    console.log(`导入数据总条数: ${importedData.length}`)
    
    if (importedData.length === 0) {
      ElMessage.warning('导入文件为空')
      importDialogVisible.value = false
      return
    }
    
    // 准备批量导入的数据
    const materialsToImport = []
    let addedCount = 0
    let updatedCount = 0
    let skipCount = 0
    
    // 遍历导入的数据，转换为后端格式
    for (const item of importedData) {
      try {
        const materialData = {
          material_code: item['物料编码'] || '',
          bom_number: item['BOM编号'] || '',
          material_name: item['物料名称'] || '',
          size_spec: item['尺寸规格'] || '',
          color: item['颜色'] || '',
          material: item['材质'] || '',
          major_category: item['大类'] || '',
          middle_category: item['中类'] || '',
          minor_category: item['小类'] || '',
          model: item['型号'] || '',
          series: item['系列'] || '',
          source: item['来源'] || '',
          description: item['物料详述'] || '',
          material_image: item['物料图片'] || '',
          base_unit: item['基础单位'] || '个',
          sale_unit: item['销售单位'] || '',
          sale_conversion_rate: parseFloat(item['销售转化率']) || 0,
          purchase_unit: item['采购单位'] || '',
          purchase_conversion_rate: parseFloat(item['采购转化率']) || 0,
          kg_per_pcs: parseFloat(item['kg/pcs']) || 0,
          pcs_per_kg: parseFloat(item['pcs/kg']) || 0,
          process_name: item['产出工序名称'] || '',
          standard_time: parseFloat(item['定时工额']) || 0,
          quota_time: parseFloat(item['定额工时']) || 0,
          process_price: parseFloat(item['工序单价']) || 0,
          purchase_cycle: item['采购周期'] || '',
          purchase_price: parseFloat(item['采购单价']) || 0,
          base_price: parseFloat(item['基础单价']) || 0
        }
        
        // 验证必填字段
        if (!materialData.material_code) {
          console.warn(`跳过无物料编码的数据:`, item)
          skipCount++
          continue
        }
        
        materialsToImport.push(materialData)
      } catch (error) {
        console.error(`处理数据失败:`, item, error)
        skipCount++
      }
    }
    
    console.log(`准备导入 ${materialsToImport.length} 条数据，跳过 ${skipCount} 条`)
    
    if (materialsToImport.length === 0) {
      ElMessage.warning('没有有效数据可导入')
      importDialogVisible.value = false
      return
    }
    
    // 调用后端批量导入接口
    const response = await fetch('http://192.168.2.229:3005/api/materials/batch-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(materialsToImport)
    })
    const result = await response.json()
    
    console.log('导入结果:', result)
    
    if (result.code === 200) {
      // 重新加载所有数据
      const reloadedMaterials = await databaseService.getAllMaterials()
      tableData.value = reloadedMaterials
      updateStats()
      
      ElMessage.success(`导入成功！成功 ${result.data.successCount} 条，失败 ${result.data.errorCount} 条，跳过 ${skipCount} 条`)
      importDialogVisible.value = false
    } else {
      ElMessage.error(result.message || '导入失败')
      importDialogVisible.value = false
    }
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败：' + (error.message || '未知错误'))
    importDialogVisible.value = false
  } finally {
    uploadFile.value = null
  }
}

// 导出
const handleExport = async () => {
  try {
    // 检查是否有数据需要导出
    const dataToExport = filteredTableData.value
    
    if (dataToExport.length === 0) {
      ElMessage.warning('没有数据可以导出')
      return
    }
    
    // 准备导出数据，确保所有文本字段都不超过Excel的32767字符限制
    const exportData = dataToExport.map(row => ({
      '物料编码': row.materialCode ? (row.materialCode.length > 32767 ? row.materialCode.substring(0, 32764) + '...' : row.materialCode) : '',
      'BOM编号': row.bomNumber ? (row.bomNumber.length > 32767 ? row.bomNumber.substring(0, 32764) + '...' : row.bomNumber) : '',
      '物料名称': row.materialName ? (row.materialName.length > 32767 ? row.materialName.substring(0, 32764) + '...' : row.materialName) : '',
      '尺寸规格': row.sizeSpec ? (row.sizeSpec.length > 32767 ? row.sizeSpec.substring(0, 32764) + '...' : row.sizeSpec) : '',
      '颜色': row.color ? (row.color.length > 32767 ? row.color.substring(0, 32764) + '...' : row.color) : '',
      '材质': row.material ? (row.material.length > 32767 ? row.material.substring(0, 32764) + '...' : row.material) : '',
      '大类': row.majorCategory ? (row.majorCategory.length > 32767 ? row.majorCategory.substring(0, 32764) + '...' : row.majorCategory) : '',
      '中类': row.middleCategory ? (row.middleCategory.length > 32767 ? row.middleCategory.substring(0, 32764) + '...' : row.middleCategory) : '',
      '小类': row.minorCategory ? (row.minorCategory.length > 32767 ? row.minorCategory.substring(0, 32764) + '...' : row.minorCategory) : '',
      '型号': row.model ? (row.model.length > 32767 ? row.model.substring(0, 32764) + '...' : row.model) : '',
      '系列': row.series ? (row.series.length > 32767 ? row.series.substring(0, 32764) + '...' : row.series) : '',
      '来源': Array.isArray(row.source) ? (row.source.join(',').length > 32767 ? row.source.join(',').substring(0, 32764) + '...' : row.source.join(',')) : (row.source ? (row.source.length > 32767 ? row.source.substring(0, 32764) + '...' : row.source) : ''),
      '物料详述': row.description ? (row.description.length > 32767 ? row.description.substring(0, 32764) + '...' : row.description) : '',
      '物料图片': row.materialImage ? (row.materialImage.length > 32767 ? row.materialImage.substring(0, 32764) + '...' : row.materialImage) : '',
      '基础单位': row.baseUnit ? (row.baseUnit.length > 32767 ? row.baseUnit.substring(0, 32764) + '...' : row.baseUnit) : '',
      '销售单位': row.saleUnit ? (row.saleUnit.length > 32767 ? row.saleUnit.substring(0, 32764) + '...' : row.saleUnit) : '',
      '销售转化率': row.saleConversionRate,
      '采购单位': row.purchaseUnit ? (row.purchaseUnit.length > 32767 ? row.purchaseUnit.substring(0, 32764) + '...' : row.purchaseUnit) : '',
      '采购转化率': row.purchaseConversionRate,
      'kg/pcs': row.kgPerPcs,
      'pcs/kg': row.pcsPerKg,
      '产出工序名称': row.processName ? (row.processName.length > 32767 ? row.processName.substring(0, 32764) + '...' : row.processName) : '',
      '定时工额': row.standardTime,
      '定额工时': row.quotaTime,
      '工序单价': row.processPrice,
      '采购周期': row.purchaseCycle ? (row.purchaseCycle.length > 32767 ? row.purchaseCycle.substring(0, 32764) + '...' : row.purchaseCycle) : '',
      '采购单价': row.purchasePrice,
      '创建时间': row.createTime ? (row.createTime.length > 32767 ? row.createTime.substring(0, 32764) + '...' : row.createTime) : ''
    }))
    
    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '物料库')
    
    // 导出文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `物料库_${timestamp}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    ElMessage.success(`导出成功，共 ${dataToExport.length} 条记录`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败：' + (error.message || '未知错误'))
  }
}

// 打印
const handlePrint = () => {
  window.print()
}

// 刷新
const handleRefresh = async () => {
  try {
    // 从后端重新加载所有数据
    const materials = await databaseService.getAllMaterials()
    tableData.value = materials
    
    // 更新下一个ID
    const maxId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) : 0
    nextMaterialId.value = maxId + 1
    
    updateStats()
    ElMessage.success('刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    ElMessage.error('刷新失败: ' + error.message)
  }
}

// 分页
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// FilterTable事件处理
const handlePageChange = ({ page, pageSize: size }) => {
  currentPage.value = page
  pageSize.value = size
}

const handleTableSizeChange = ({ page, pageSize: size }) => {
  pageSize.value = size
  currentPage.value = page
}

const handleFilterChange = (filters) => {
  console.log('筛选条件更新:', filters)
  // FilterTable组件自动处理筛选，这里可以记录日志或保存筛选状态
  // 如果需要保存筛选配置，可以存到localStorage
  localStorage.setItem('materialFilters', JSON.stringify(filters))
}

// 保存字段设置
const handleSaveColumns = () => {
  try {
    // 保存可见字段到localStorage
    localStorage.setItem('material-list-visible-fields', JSON.stringify(visibleFields.value))
    ElMessage.success('字段设置已保存')
    showColumnControl.value = false
    
    // 重新加载数据以应用新的列配置
    handleRefresh()
  } catch (error) {
    console.error('保存字段设置失败:', error)
    ElMessage.error('保存失败')
  }
}

// 保存页面设置
const handleSavePageSettings = (settings) => {
  try {
    // PageSettings组件已经自动保存到localStorage
    console.log('页面设置已保存:', settings)
    ElMessage.success('页面设置已保存')
    showPageSettings.value = false
    
    // 如果有字段更新，重新加载
    if (settings.visibleFields) {
      visibleFields.value = settings.visibleFields
      handleRefresh()
    }
  } catch (error) {
    console.error('保存页面设置失败:', error)
    ElMessage.error('保存失败')
  }
}

// 生命周期
onMounted(async () => {
  try {
    // 从后端加载物料数据（不再需要初始化IndexedDB）
    const materials = await databaseService.getAllMaterials()
    if (Array.isArray(materials) && materials.length > 0) {
      tableData.value = materials
    }
    
    // 后端API不需要获取下一个ID，数据库会自动生成
    // nextMaterialId.value = await databaseService.getNextMaterialId()
  } catch (error) {
    console.error('数据加载失败:', error)
    ElMessage.warning('无法连接到后端服务器，请确保后端服务正在运行（npm run backend）')
  }
  
  const updateTableHeight = () => {
    const windowHeight = window.innerHeight
    tableHeight.value = windowHeight - 520
  }
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
  updateStats()
  
  // 初始化可见字段
  const savedFields = localStorage.getItem('material-list-visible-fields')
  if (savedFields) {
    visibleFields.value = JSON.parse(savedFields)
  } else {
    // 默认显示所有字段
    visibleFields.value = filterTableColumns.value.map(col => col.prop)
  }
})
</script>

<style scoped>
.material-list-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

.filter-tip {
  margin-bottom: 20px;
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-form {
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 字段管理样式 */
.column-control-panel {
  max-height: 500px;
  overflow-y: auto;
}

.column-control-panel .panel-header {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.column-control-panel .field-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.column-control-panel .field-item:last-child {
  border-bottom: none;
}

/* 打印样式 */
@media print {
  .toolbar,
  .search-section,
  .stats-cards,
  .pagination-container {
    display: none;
  }
}
</style>
