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
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="物料编码">
          <el-input v-model="searchForm.materialCode" placeholder="请输入物料编码" clearable />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="searchForm.materialName" placeholder="请输入物料名称" clearable />
        </el-form-item>
        <el-form-item label="大类">
          <el-input v-model="searchForm.majorCategory" placeholder="请输入大类" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
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

    <!-- 主表格 -->
    <el-table 
      ref="tableRef"
      :data="paginatedTableData" 
      stripe 
      border
      :height="tableHeight"
      @selection-change="handleSelectionChange"
      :scrollbar-always-on="true"
      highlight-current-row
      lazy
    >
      <el-table-column type="selection" width="55" fixed="left" />
      <el-table-column prop="materialCode" label="物料编码" width="140" fixed="left" />
      <el-table-column prop="bomNumber" label="BOM编号" width="140" />
      <el-table-column prop="materialName" label="物料名称" width="180" fixed="left">
        <template #default="{ row }">
          <el-link type="primary" @click="handleView(row)">{{ row.materialName }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="materialImage" label="图片" width="100">
        <template #default="{ row }">
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
      </el-table-column>
      <el-table-column prop="sizeSpec" label="尺寸规格" width="120" />
      <el-table-column prop="color" label="颜色" width="80" />
      <el-table-column prop="material" label="材质" width="100" />
      <el-table-column prop="majorCategory" label="大类" width="100" />
      <el-table-column prop="middleCategory" label="中类" width="100" />
      <el-table-column prop="minorCategory" label="小类" width="100" />
      <el-table-column prop="model" label="型号" width="100" />
      <el-table-column prop="series" label="系列" width="100" />
      <el-table-column prop="source" label="来源" width="120">
        <template #default="{ row }">
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
      </el-table-column>
      <el-table-column prop="description" label="物料详述" width="150" show-overflow-tooltip />
      <el-table-column prop="baseUnit" label="基础单位" width="80" />
      <el-table-column prop="saleUnit" label="销售单位" width="80" />
      <el-table-column prop="saleConversionRate" label="销售转化率" width="100" align="right" />
      <el-table-column prop="purchaseUnit" label="采购单位" width="80" />
      <el-table-column prop="purchaseConversionRate" label="采购转化率" width="100" align="right" />
      <el-table-column prop="kgPerPcs" label="kg/pcs" width="80" align="right" />
      <el-table-column prop="pcsPerKg" label="pcs/kg" width="80" align="right" />
      <el-table-column prop="processName" label="产出工序名称" width="120" />
      <el-table-column prop="standardTime" label="定时工额" width="80" align="right" />
      <el-table-column prop="quotaTime" label="定额工时" width="80" align="right" />
      <el-table-column prop="processPrice" label="工序单价" width="100" align="right">
        <template #default="{ row }">
          ¥{{ row.processPrice?.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="purchaseCycle" label="采购周期" width="80" />
      <el-table-column prop="purchasePrice" label="采购单价" width="100" align="right">
        <template #default="{ row }">
          ¥{{ row.purchasePrice?.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="150" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="success" @click="handleView(row)">查看</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100, 200, 500]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

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
        @success="handleEditSuccess" 
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, Plus, Upload, Download, Printer, Refresh, UploadFilled,
  Box, CircleCheck, Warning
} from '@element-plus/icons-vue'
import * as XLSX from 'xlsx' // 静态导入XLSX库
import MaterialEdit from './MaterialEdit.vue'
import MaterialView from './MaterialView.vue'
import databaseService from '@/services/DatabaseService.js'

// 数据
const tableRef = ref(null)
const searchForm = ref({
  materialCode: '',
  materialName: '',
  majorCategory: ''
})

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

// 编辑成功回调
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
      }
      // 保存到数据库
      await databaseService.saveMaterial(tableData.value[index])
      ElMessage.success('物料更新成功')
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
      await databaseService.saveMaterial(newMaterial)
      ElMessage.success('物料创建成功')
    }
    
    editDialogVisible.value = false
    updateStats()
  } catch (error) {
    console.error('保存物料失败:', error)
    ElMessage.error('保存物料失败: ' + error.message)
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
    
    if (importedData.length === 0) {
      ElMessage.warning('导入文件为空')
      return
    }
    
    // 处理导入数据，根据合并规则更新系统数据
    const existingData = [...tableData.value]
    const newData = []
    let addedCount = 0
    let updatedCount = 0
    
    // 遍历导入的数据
    importedData.forEach(item => {
      // 查找系统中是否已存在该物料编码
      const existingIndex = existingData.findIndex(m => m.materialCode === item['物料编码'])
      
      if (existingIndex === -1) {
        // 规则1: 导入表格有的，系统表格没有 = 新增到系统
        const newMaterial = {
          id: nextMaterialId.value,
          materialCode: item['物料编码'] || '',
          bomNumber: item['BOM编号'] || '',
          materialName: item['物料名称'] || '',
          sizeSpec: item['尺寸规格'] || '',
          color: item['颜色'] || '',
          material: item['材质'] || '',
          majorCategory: item['大类'] || '',
          middleCategory: item['中类'] || '',
          minorCategory: item['小类'] || '',
          model: item['型号'] || '',
          series: item['系列'] || '',
          source: item['来源'] ? item['来源'].split(',') : [],
          description: item['物料详述'] || '',
          materialImage: item['物料图片'] || '',
          baseUnit: item['基础单位'] || '个',
          saleUnit: item['销售单位'] || '',
          saleConversionRate: parseFloat(item['销售转化率']) || 0,
          purchaseUnit: item['采购单位'] || '',
          purchaseConversionRate: parseFloat(item['采购转化率']) || 0,
          kgPerPcs: parseFloat(item['kg/pcs']) || 0,
          pcsPerKg: parseFloat(item['pcs/kg']) || 0,
          processName: item['产出工序名称'] || '',
          standardTime: parseFloat(item['定时工额']) || 0,
          quotaTime: parseFloat(item['定额工时']) || 0,
          processPrice: parseFloat(item['工序单价']) || 0,
          purchaseCycle: item['采购周期'] || '',
          purchasePrice: parseFloat(item['采购单价']) || 0,
          createTime: new Date().toLocaleString('zh-CN')
        }
        
        newData.push(newMaterial)
        nextMaterialId.value++
        addedCount++
      } else {
        // 规则2: 导入表格有的，系统表格也有 = 保留导入表格的
        existingData[existingIndex] = {
          ...existingData[existingIndex],
          materialCode: item['物料编码'] || existingData[existingIndex].materialCode,
          bomNumber: item['BOM编号'] || existingData[existingIndex].bomNumber,
          materialName: item['物料名称'] || existingData[existingIndex].materialName,
          sizeSpec: item['尺寸规格'] || existingData[existingIndex].sizeSpec,
          color: item['颜色'] || existingData[existingIndex].color,
          material: item['材质'] || existingData[existingIndex].material,
          majorCategory: item['大类'] || existingData[existingIndex].majorCategory,
          middleCategory: item['中类'] || existingData[existingIndex].middleCategory,
          minorCategory: item['小类'] || existingData[existingIndex].minorCategory,
          model: item['型号'] || existingData[existingIndex].model,
          series: item['系列'] || existingData[existingIndex].series,
          source: item['来源'] ? item['来源'].split(',') : existingData[existingIndex].source,
          description: item['物料详述'] || existingData[existingIndex].description,
          materialImage: item['物料图片'] || existingData[existingIndex].materialImage,
          baseUnit: item['基础单位'] || existingData[existingIndex].baseUnit,
          saleUnit: item['销售单位'] || existingData[existingIndex].saleUnit,
          saleConversionRate: parseFloat(item['销售转化率']) || existingData[existingIndex].saleConversionRate,
          purchaseUnit: item['采购单位'] || existingData[existingIndex].purchaseUnit,
          purchaseConversionRate: parseFloat(item['采购转化率']) || existingData[existingIndex].purchaseConversionRate,
          kgPerPcs: parseFloat(item['kg/pcs']) || existingData[existingIndex].kgPerPcs,
          pcsPerKg: parseFloat(item['pcs/kg']) || existingData[existingIndex].pcsPerKg,
          processName: item['产出工序名称'] || existingData[existingIndex].processName,
          standardTime: parseFloat(item['定时工额']) || existingData[existingIndex].standardTime,
          quotaTime: parseFloat(item['定额工时']) || existingData[existingIndex].quotaTime,
          processPrice: parseFloat(item['工序单价']) || existingData[existingIndex].processPrice,
          purchaseCycle: item['采购周期'] || existingData[existingIndex].purchaseCycle,
          purchasePrice: parseFloat(item['采购单价']) || existingData[existingIndex].purchasePrice,
          updateTime: new Date().toLocaleString('zh-CN')
        }
        updatedCount++
      }
    })
    
    // 将新数据添加到现有数据前面
    tableData.value = [...newData, ...existingData]
    
    // 规则3: 导入表格没有的，系统表格有 = 保留系统表格的数据（已自动满足）
    
    // 保存到数据库
    // 克隆数据以避免Proxy对象问题
    const materialsToSave = JSON.parse(JSON.stringify(tableData.value))
    await databaseService.saveMaterials(materialsToSave)
    // 更新下一个物料ID
    const maxId = materialsToSave.length > 0 ? Math.max(...materialsToSave.map(m => m.id)) : 0
    nextMaterialId.value = maxId + 1
    
    ElMessage.success(`导入成功！新增 ${addedCount} 条，更新 ${updatedCount} 条`)
    importDialogVisible.value = false
    updateStats()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败：' + (error.message || '未知错误'))
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
const handleRefresh = () => {
  ElMessage.success('刷新成功')
}

// 分页
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 生命周期
onMounted(async () => {
  try {
    // 初始化数据库
    await databaseService.init()
    
    // 从数据库加载物料数据
    const materials = await databaseService.getAllMaterials()
    if (Array.isArray(materials) && materials.length > 0) {
      tableData.value = materials
    }
    
    // 获取下一个物料ID
    nextMaterialId.value = await databaseService.getNextMaterialId()
  } catch (error) {
    console.error('数据库初始化或数据加载失败:', error)
    ElMessage.error('数据加载失败: ' + error.message)
    
    // 降级到localStorage
    const storedData = localStorage.getItem('materialListData')
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          tableData.value = parsedData
        }
      } catch (e) {
        console.error('加载物料数据失败:', e)
      }
    }
    
    // 加载下一个物料ID
    const storedNextId = localStorage.getItem('materialListNextId')
    if (storedNextId) {
      nextMaterialId.value = parseInt(storedNextId, 10)
    }
  }
  
  const updateTableHeight = () => {
    const windowHeight = window.innerHeight
    tableHeight.value = windowHeight - 520
  }
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
  updateStats()
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
