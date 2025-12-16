<template>
  <div class="product-manual-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>产品手册</h2>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增产品
        </el-button>
        <el-button type="danger" :disabled="!hasSelection" @click="handleBatchDelete">批量删除</el-button>
        <el-button type="primary" :disabled="!hasSelection" @click="handleRdSample">
          <el-icon><Promotion /></el-icon>
          研发打样
        </el-button>
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
        <el-form-item label="产品编号">
          <el-input v-model="searchForm.productCode" placeholder="请输入产品编号" clearable />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="产品分类">
          <el-select v-model="searchForm.category" placeholder="请选择分类" clearable>
            <el-option label="电子元件" value="电子元件" />
            <el-option label="机械配件" value="机械配件" />
            <el-option label="化工原料" value="化工原料" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="在售" value="在售" />
            <el-option label="停产" value="停产" />
            <el-option label="研发中" value="研发中" />
          </el-select>
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
            <div class="stat-label">产品总数</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #67C23A;">
            <el-icon :size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.onSale }}</div>
            <div class="stat-label">在售产品</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #E6A23C;">
            <el-icon :size="24"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.lowStock }}</div>
            <div class="stat-label">库存预警</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #F56C6C;">
            <el-icon :size="24"><CircleClose /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.discontinued }}</div>
            <div class="stat-label">已停产</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主表格 -->
    <el-table 
      ref="tableRef"
      :data="filteredTableData" 
      stripe 
      border
      :height="tableHeight"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" fixed="left" />
      <el-table-column prop="productCode" label="产品编号" width="140" fixed="left" />
      <el-table-column prop="productName" label="产品名称" width="180" fixed="left">
        <template #default="{ row }">
          <el-link type="primary" @click="handleView(row)">{{ row.productName }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="productImage" label="产品图片" width="100">
        <template #default="{ row }">
          <el-image 
            v-if="row.productImage"
            :src="row.productImage" 
            :preview-src-list="[row.productImage]"
            :preview-teleported="true"
            style="width: 50px; height: 50px; cursor: pointer;"
            fit="cover"
          />
          <span v-else style="color: #909399;">无图片</span>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="产品分类" width="120" />
      <el-table-column prop="subCategory" label="产品子类" width="120" />
      <el-table-column prop="specification" label="规格型号" width="150" />
      <el-table-column prop="unit" label="单位" width="80" />
      <el-table-column prop="source" label="来源" width="150">
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
          <span v-else style="color: #909399;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="outputProcessName" label="产出工序名称" width="140">
        <template #default="{ row }">
          <span v-if="row.outputProcessName">{{ row.outputProcessName }}</span>
          <span v-else style="color: #909399;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="产品状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === '在售'" type="success">在售</el-tag>
          <el-tag v-else-if="row.status === '停产'" type="danger">停产</el-tag>
          <el-tag v-else-if="row.status === '研发中'" type="warning">研发中</el-tag>
          <el-tag v-else>{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="draftPerson" label="制图人员" width="120" />
      <el-table-column prop="samplePerson" label="打样人员" width="120" />
      <el-table-column prop="qcPerson" label="质检人员" width="120" />
      <el-table-column prop="bomMaintainer" label="BOM维护人员" width="140" />
      <el-table-column prop="materialMaintainer" label="产品物料库维护人员" width="160" />
      <el-table-column prop="productStatus" label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.productStatus === '正常'" type="success">正常</el-tag>
          <el-tag v-else-if="row.productStatus === '待审核'" type="warning">待审核</el-tag>
          <el-tag v-else-if="row.productStatus === '已废弃'" type="info">已废弃</el-tag>
          <el-tag v-else>{{ row.productStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="version" label="版本号" width="100" />
      <el-table-column prop="isEnabled" label="是否启用" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.isEnabled" type="success">是</el-tag>
          <el-tag v-else type="info">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="productDescription" label="产品详述" width="250" show-overflow-tooltip />
      <el-table-column prop="dataCompleteDate" label="资料完善日期" width="140" />
      <el-table-column prop="attachments" label="附件" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.attachments && row.attachments.length > 0" type="success">
            {{ row.attachments.length }}
          </el-tag>
          <span v-else style="color: #909399;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="salePrice" label="销售单价" width="120" align="right">
        <template #default="{ row }">
          ¥{{ row.salePrice?.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="costPrice" label="成本单价" width="120" align="right">
        <template #default="{ row }">
          ¥{{ row.costPrice?.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="当前库存" width="100" align="right" />
      <el-table-column prop="minStock" label="最小库存" width="100" align="right" />
      <el-table-column prop="material" label="主要材质" width="120" />
      <el-table-column prop="color" label="颜色" width="100" />
      <el-table-column prop="weight" label="重量(kg)" width="100" align="right" />
      <el-table-column prop="size" label="尺寸" width="150" />
      <el-table-column prop="supplier" label="主供应商" width="150" />
      <el-table-column prop="leadTime" label="生产周期(天)" width="120" align="right" />
      <el-table-column prop="qualityStandard" label="质量标准" width="150" />
      <el-table-column prop="certification" label="认证证书" width="150" />
      <el-table-column prop="productManager" label="产品经理" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column prop="remark" label="备注" width="200" />
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
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑产品对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      :title="dialogTitle" 
      width="90%" 
      :close-on-click-modal="false"
      destroy-on-close
    >
      <ProductManualEdit 
        :product-data="currentProduct" 
        :is-edit="isEdit"
        @success="handleEditSuccess" 
        @cancel="editDialogVisible = false" 
      />
    </el-dialog>

    <!-- 查看产品详情对话框 -->
    <el-dialog 
      v-model="viewDialogVisible" 
      title="产品详情" 
      width="80%" 
      :close-on-click-modal="false"
    >
      <ProductManualView 
        :product-data="currentProduct" 
        @close="viewDialogVisible = false" 
      />
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入产品数据" width="500px">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
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
import { 
  Search, Plus, Upload, Download, Printer, Refresh, 
  Box, CircleCheck, Warning, CircleClose, UploadFilled, Promotion 
} from '@element-plus/icons-vue'
import ProductManualEdit from './ProductManualEdit.vue'
import ProductManualView from './ProductManualView.vue'
import productManualAPI from '@/api/productManual'

// 数据
const tableRef = ref(null)
const searchForm = ref({
  productCode: '',
  productName: '',
  category: '',
  status: ''
})

const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const tableHeight = ref(600)
const editDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const importDialogVisible = ref(false)
const currentProduct = ref(null)
const isEdit = ref(false)

// 统计数据
const stats = ref({
  total: 0,
  onSale: 0,
  lowStock: 0,
  discontinued: 0
})

// 表格数据（从localStorage加载）
const tableData = ref([])

// 下一个产品ID
const nextProductId = ref(1)

// 计算属性
const hasSelection = computed(() => selectedRows.value.length > 0)

const filteredTableData = computed(() => {
  let data = tableData.value
  
  if (searchForm.value.productCode) {
    data = data.filter(item => 
      item.productCode.toLowerCase().includes(searchForm.value.productCode.toLowerCase())
    )
  }
  if (searchForm.value.productName) {
    data = data.filter(item => 
      item.productName.toLowerCase().includes(searchForm.value.productName.toLowerCase())
    )
  }
  if (searchForm.value.category) {
    data = data.filter(item => item.category === searchForm.value.category)
  }
  if (searchForm.value.status) {
    data = data.filter(item => item.status === searchForm.value.status)
  }
  
  totalCount.value = data.length
  return data
})

const dialogTitle = computed(() => isEdit.value ? '编辑产品' : '新增产品')

// 更新统计数据
const updateStats = () => {
  stats.value.total = tableData.value.length
  stats.value.onSale = tableData.value.filter(p => p.status === '在售').length
  stats.value.lowStock = tableData.value.filter(p => p.stock < p.minStock).length
  stats.value.discontinued = tableData.value.filter(p => p.status === '停产').length
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    productCode: '',
    productName: '',
    category: '',
    status: ''
  }
  handleSearch()
}

// 新增产品
const handleCreate = () => {
  currentProduct.value = null
  isEdit.value = false
  editDialogVisible.value = true
}

// 编辑产品
const handleEdit = (row) => {
  currentProduct.value = { ...row }
  isEdit.value = true
  editDialogVisible.value = true
}

// 查看产品
const handleView = (row) => {
  currentProduct.value = { ...row }
  viewDialogVisible.value = true
}

// 删除产品
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除产品“${row.productName}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用后端API删除数据
    try {
      const response = await productManualAPI.delete(row.id)
      
      if (response.code === 200) {
        // 后端删除成功，更新前端数据
        const index = tableData.value.findIndex(item => item.id === row.id)
        if (index !== -1) {
          tableData.value.splice(index, 1)
          // 同步到localStorage
          localStorage.setItem('productManualData', JSON.stringify(tableData.value))
          updateStats()
        }
        ElMessage.success('删除成功')
      } else {
        throw new Error(response.message || '删除失败')
      }
    } catch (apiError) {
      console.error('调用删除API失败:', apiError)
      ElMessage.error('删除失败: ' + (apiError.response?.data?.message || apiError.message))
    }
  } catch (error) {
    // 用户取消删除
    if (error !== 'cancel') {
      console.error('删除操作失败:', error)
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个产品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const deleteIds = selectedRows.value.map(row => row.id)
    
    // 调用后端API批量删除
    try {
      const response = await productManualAPI.batchDelete(deleteIds)
      
      if (response.code === 200) {
        // 后端删除成功，更新前端数据
        tableData.value = tableData.value.filter(row => !deleteIds.includes(row.id))
        selectedRows.value = []
        // 同步到localStorage
        localStorage.setItem('productManualData', JSON.stringify(tableData.value))
        updateStats()
        ElMessage.success(`批量删除成功，共删除 ${response.data.deletedCount} 条记录`)
      } else {
        throw new Error(response.message || '批量删除失败')
      }
    } catch (apiError) {
      console.error('调用批量删除API失败:', apiError)
      ElMessage.error('批量删除失败: ' + (apiError.response?.data?.message || apiError.message))
    }
  } catch (error) {
    // 用户取消删除
    if (error !== 'cancel') {
      console.error('批量删除操作失败:', error)
    }
  }
}

// 研发打样 - 将选中的产品转化为研发项目
const handleRdSample = async () => {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一个产品')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定将选中的 ${selectedRows.value.length} 个产品提交到研发项目管理？`, 
      '研发打样', 
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 获取或初始化项目管理的localStorage数据
    let projectList = []
    const storedProjects = localStorage.getItem('projectManagementData')
    if (storedProjects) {
      try {
        projectList = JSON.parse(storedProjects)
      } catch (e) {
        console.error('解析项目数据失败:', e)
        projectList = []
      }
    }
    
    // 获取下一个项目ID
    let nextId = 1
    if (projectList.length > 0) {
      const maxId = Math.max(...projectList.map(p => p.id || 0))
      nextId = maxId + 1
    }
    
    // 转化选中的产品为研发项目
    const newProjects = selectedRows.value.map((product, index) => {
      return {
        id: nextId + index,
        projectCode: product.productCode, // 项目编号 = 产品编号
        projectName: product.productName, // 项目名称 = 产品名称
        sourceOrderNo: product.productCode, // 来源单号 = 产品编号
        sourcePerson: '产品经理',
        description: product.productDescription || product.remark || '', // 项目描述 = 产品详述
        status: 'planning',
        priority: '中',
        manager: product.samplePerson || '待分配',
        budget: product.costPrice * 10 || 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        requiredDate: product.dataCompleteDate || '', // 需要完成日期 = 资料完善日期
        plannedDate: product.dataCompleteDate || '',
        progress: 0,
        members: [
          product.draftPerson,
          product.samplePerson,
          product.qcPerson,
          product.bomMaintainer
        ].filter(Boolean),
        attachments: product.attachments || [], // 附件 = 产品附件
        images: product.productImage ? [product.productImage] : []
      }
    })
    
    // 添加到项目列表
    projectList.unshift(...newProjects)
    
    // 保存到localStorage
    localStorage.setItem('projectManagementData', JSON.stringify(projectList))
    
    ElMessage.success(`成功创建 ${newProjects.length} 个研发项目，请到项目管理页面查看`)
    
    // 清空选中
    selectedRows.value = []
    
  } catch (e) {
    // 用户取消操作
    if (e !== 'cancel') {
      console.error('研发打样失败:', e)
    }
  }
}

// 编辑成功回调
const handleEditSuccess = async (productData) => {
  try {
    if (isEdit.value) {
      // 更新产品 - 调用后端API
      const response = await productManualAPI.update(productData.id, productData)
      
      if (response.code === 200) {
        // 后端更新成功，更新前端数据
        const index = tableData.value.findIndex(p => p.id === productData.id)
        if (index !== -1) {
          tableData.value[index] = {
            ...productData,
            updateTime: new Date().toLocaleString('zh-CN')
          }
        }
        
        // 同步到localStorage
        localStorage.setItem('productManualData', JSON.stringify(tableData.value))
        
        ElMessage.success('产品更新成功')
        editDialogVisible.value = false
        updateStats()
      } else {
        throw new Error(response.message || '更新失败')
      }
    } else {
      // 新增产品 - 调用后端API
      console.log('📤 准备发送创建产品请求:', productData)
      const response = await productManualAPI.create(productData)
      console.log('📥 收到后端响应:', response)
      
      if (response.code === 200 && response.data) {
        // 后端创建成功，使用后端返回的数据
        const newProduct = {
          ...response.data,
          createTime: new Date().toLocaleString('zh-CN'),
          updateTime: new Date().toLocaleString('zh-CN')
        }
        
        // 添加到前端表格
        tableData.value.unshift(newProduct)
        nextProductId.value++
        
        // 同步到localStorage
        localStorage.setItem('productManualData', JSON.stringify(tableData.value))
        localStorage.setItem('productManualNextId', nextProductId.value.toString())
        
        ElMessage.success('产品创建成功')
        editDialogVisible.value = false
        updateStats()
        
        console.log('✅ 产品已保存到后端，产品编号:', newProduct.productCode)
      } else {
        throw new Error(response.message || '创建失败')
      }
    }
  } catch (error) {
    console.error('❌ 保存产品失败:', error)
    console.error('❌ 错误详情:', {
      message: error.message,
      response: error.response,
      request: error.request,
      stack: error.stack
    })
    ElMessage.error('保存失败: ' + (error.response?.data?.message || error.message))
    // 即使保存失败,也不要更新前端数据
    throw error
  }
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
}

// 文件选择
const handleFileChange = (file) => {
  console.log('选择文件:', file)
}

// 确认导入
const handleImportConfirm = () => {
  ElMessage.success('导入成功')
  importDialogVisible.value = false
}

// 导出
const handleExport = () => {
  ElMessage.success('导出成功')
}

// 打印
const handlePrint = () => {
  window.print()
}

// 刷新
const handleRefresh = async () => {
  await loadData()
  ElMessage.success('刷新成功')
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 从后端加载数据
const loadData = async () => {
  try {  
    console.log('🔄 开始从后端加载产品手册数据...')
    const response = await productManualAPI.getAll()
    
    if (response.code === 200 && Array.isArray(response.data)) {
      tableData.value = response.data
      console.log('✅ 产品手册数据加载成功，共', response.data.length, '条')
      
      // 同步到localStorage作为缓存
      localStorage.setItem('productManualData', JSON.stringify(response.data))
      
      // 更新统计
      updateStats()
    } else {
      console.warn('⚠️ 后端返回数据格式异常:', response)
      ElMessage.warning('数据加载异常')
    }
  } catch (error) {
    console.error('❌ 加载产品手册数据失败:', error)
    
    // 失败时尝试从localStorage加载缓存
    const storedData = localStorage.getItem('productManualData')
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          tableData.value = parsedData
          console.log('📦 从缓存加载产品数据:', parsedData.length, '条')
          ElMessage.info('已从缓存加载数据')
          updateStats()
          return
        }
      } catch (e) {
        console.error('缓存数据解析失败:', e)
      }
    }
    
    ElMessage.error('加载数据失败: ' + error.message)
  }
}

// 生命周期
onMounted(async () => {
  // 首先从后端加载最新数据
  await loadData()
  
  // 加载下一个产品ID
  const storedNextId = localStorage.getItem('productManualNextId')
  if (storedNextId) {
    nextProductId.value = parseInt(storedNextId, 10)
  }
  
  const updateTableHeight = () => {
    const windowHeight = window.innerHeight
    tableHeight.value = windowHeight - 520
  }
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
})
</script>

<style scoped>
.product-manual-container {
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
  grid-template-columns: repeat(4, 1fr);
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

@media (max-width: 1400px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media print {
  .toolbar, .search-section, .pagination-container {
    display: none;
  }
}
</style>
