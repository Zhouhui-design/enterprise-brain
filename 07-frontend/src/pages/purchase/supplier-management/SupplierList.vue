<template>
  <div class="supplier-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>供应商管理</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>采购管理</el-breadcrumb-item>
          <el-breadcrumb-item>供应商管理</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          @click="handleAddSupplier"
          :icon="Plus"
        >
          新增供应商
        </el-button>
        <el-button 
          type="success" 
          @click="handleImport"
          :icon="Upload"
        >
          批量导入
        </el-button>
        <el-button 
          type="warning" 
          @click="handleExport"
          :icon="Download"
        >
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card" shadow="never">
      <el-form 
        :model="searchForm" 
        :inline="true" 
        @submit.prevent="handleSearch"
      >
        <el-form-item label="供应商名称">
          <el-input
            v-model="searchForm.supplierName"
            placeholder="请输入供应商名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="供应商编码">
          <el-input
            v-model="searchForm.supplierCode"
            placeholder="请输入供应商编码"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
            <el-option label="待审核" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择类型"
            clearable
            style="width: 150px"
          >
            <el-option label="原材料" value="raw_material" />
            <el-option label="设备" value="equipment" />
            <el-option label="服务" value="service" />
            <el-option label="办公用品" value="office" />
          </el-select>
        </el-form-item>
        <el-form-item label="评分等级">
          <el-select
            v-model="searchForm.rating"
            placeholder="请选择评分"
            clearable
            style="width: 150px"
          >
            <el-option label="5星" value="5" />
            <el-option label="4星" value="4" />
            <el-option label="3星" value="3" />
            <el-option label="2星" value="2" />
            <el-option label="1星" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">
            搜索
          </el-button>
          <el-button @click="handleReset" :icon="Refresh">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <el-icon><Shop /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.total }}</div>
                <div class="stat-label">供应商总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.active }}</div>
                <div class="stat-label">活跃供应商</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <el-icon><Star /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.highRating }}</div>
                <div class="stat-label">高评分供应商</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.new }}</div>
                <div class="stat-label">本月新增</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">
          <span>供应商列表</span>
          <el-tag type="info">共 {{ pagination.total }} 条记录</el-tag>
        </div>
        <div class="table-actions">
          <el-button-group>
            <el-button 
              :type="viewMode === 'table' ? 'primary' : ''"
              @click="viewMode = 'table'"
              size="small"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
            <el-button 
              :type="viewMode === 'card' ? 'primary' : ''"
              @click="viewMode = 'card'"
              size="small"
            >
              <el-icon><List /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 表格视图 -->
      <el-table 
        v-if="viewMode === 'table'"
        :data="tableData" 
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" width="60" label="序号" />
        <el-table-column prop="supplierCode" label="供应商编码" width="120" />
        <el-table-column prop="supplierName" label="供应商名称" min-width="180">
          <template #default="{ row }">
            <div class="supplier-name">
              <el-avatar :size="30" :src="row.logo">
                {{ row.supplierName.charAt(0) }}
              </el-avatar>
              <span>{{ row.supplierName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="供应商类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contactPerson" label="联系人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="rating" label="评分" width="120">
          <template #default="{ row }">
            <el-rate 
              v-model="row.rating" 
              disabled 
              show-score 
              text-color="#ff9900"
              score-template="{value}"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button 
                type="primary" 
                size="small"
                @click="handleView(row)"
                :icon="View"
              >
                查看
              </el-button>
              <el-button 
                type="warning" 
                size="small"
                @click="handleEdit(row)"
                :icon="Edit"
              >
                编辑
              </el-button>
              <el-dropdown @command="(command) => handleDropdownCommand(command, row)">
                <el-button type="info" size="small" :icon="More" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="evaluate">
                      <el-icon><Star /></el-icon>
                      评估
                    </el-dropdown-item>
                    <el-dropdown-item command="performance">
                      <el-icon><TrendCharts /></el-icon>
                      绩效统计
                    </el-dropdown-item>
                    <el-dropdown-item command="contracts">
                      <el-icon><Document /></el-icon>
                      合同管理
                    </el-dropdown-item>
                    <el-dropdown-item command="disable" v-if="row.status === 'active'">
                      <el-icon><Remove /></el-icon>
                      禁用
                    </el-dropdown-item>
                    <el-dropdown-item command="enable" v-else>
                      <el-icon><Check /></el-icon>
                      启用
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <el-row :gutter="20">
          <el-col 
            v-for="item in tableData" 
            :key="item.id" 
            :span="6"
            class="supplier-card-col"
          >
            <el-card class="supplier-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-avatar :size="40" :src="item.logo">
                    {{ item.supplierName.charAt(0) }}
                  </el-avatar>
                  <div class="card-title">
                    <div class="supplier-name">{{ item.supplierName }}</div>
                    <div class="supplier-code">{{ item.supplierCode }}</div>
                  </div>
                  <el-tag :type="getStatusTagType(item.status)" size="small">
                    {{ getStatusLabel(item.status) }}
                  </el-tag>
                </div>
              </template>
              
              <div class="card-content">
                <div class="info-item">
                  <span class="label">类型:</span>
                  <el-tag :type="getTypeTagType(item.type)" size="small">
                    {{ getTypeLabel(item.type) }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="label">联系人:</span>
                  <span>{{ item.contactPerson }}</span>
                </div>
                <div class="info-item">
                  <span class="label">电话:</span>
                  <span>{{ item.phone }}</span>
                </div>
                <div class="info-item">
                  <span class="label">评分:</span>
                  <el-rate v-model="item.rating" disabled size="small" />
                </div>
              </div>
              
              <div class="card-footer">
                <el-button size="small" @click="handleView(item)">查看</el-button>
                <el-button size="small" type="warning" @click="handleEdit(item)">编辑</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 导入对话框 -->
    <el-dialog 
      v-model="importDialogVisible" 
      title="批量导入供应商" 
      width="600px"
    >
      <div class="import-content">
        <el-alert
          title="请按照模板格式准备Excel文件"
          type="info"
          :closable="false"
        />
        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            @change="handleFileChange"
            drag
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 xlsx/xls 文件，且不超过 10MB
              </div>
            </template>
          </el-upload>
        </div>
        <div class="template-download">
          <el-link type="primary" @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载导入模板
          </el-link>
        </div>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportSubmit" :loading="importing">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Upload, Download, Search, Refresh, Grid, List, View, Edit, More,
  Star, TrendCharts, Document, Remove, Check, Delete, Shop, Clock,
  UploadFilled
} from '@element-plus/icons-vue'
import { supplierApi } from '@/api/purchase/supplier'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const viewMode = ref('table')
const tableData = ref([])
const selectedRows = ref([])
const importDialogVisible = ref(false)
const importing = ref(false)
const uploadRef = ref()

// 搜索表单
const searchForm = reactive({
  supplierName: '',
  supplierCode: '',
  status: '',
  type: '',
  rating: ''
})

// 分页
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

// 统计数据
const statistics = reactive({
  total: 0,
  active: 0,
  highRating: 0,
  new: 0
})

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  handleSearch()
}

const handleAddSupplier = () => {
  router.push('/purchase/suppliers/add')
}

const handleView = (row) => {
  router.push(`/purchase/suppliers/detail/${row.id}`)
}

const handleEdit = (row) => {
  router.push(`/purchase/suppliers/edit/${row.id}`)
}

const handleImport = () => {
  importDialogVisible.value = true
}

const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleDropdownCommand = async (command, row) => {
  switch (command) {
    case 'evaluate':
      router.push(`/purchase/suppliers/evaluation/${row.id}`)
      break
    case 'performance':
      router.push(`/purchase/suppliers/performance/${row.id}`)
      break
    case 'contracts':
      router.push(`/purchase/contracts/list?supplierId=${row.id}`)
      break
    case 'disable':
      await updateSupplierStatus(row.id, 'inactive')
      break
    case 'enable':
      await updateSupplierStatus(row.id, 'active')
      break
    case 'delete':
      await handleDelete(row)
      break
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除供应商"${row.supplierName}"吗？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用删除API
    await supplierApi.deleteSupplier(row.id)
    ElMessage.success('删除成功')
    
    // 乐观更新本地数据
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      pagination.total--
    }
    
    fetchData() // 刷新数据确保一致性
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除供应商失败:', error)
      ElMessage.error('删除失败，请重试')
    }
  }
}

const updateSupplierStatus = async (id, status) => {
  try {
    // 调用更新状态API
    await supplierApi.updateSupplierStatus(id, { status })
    ElMessage.success('状态更新成功')
    
    // 乐观更新本地数据
    const item = tableData.value.find(item => item.id === id)
    if (item) {
      item.status = status
    }
    
    fetchData() // 刷新数据确保一致性
  } catch (error) {
    console.error('更新供应商状态失败:', error)
    ElMessage.error('状态更新失败，请重试')
  }
}

const handleFileChange = (file) => {
  // 处理文件选择
}

const handleImportSubmit = async () => {
  if (!uploadRef.value.uploadFiles.length) {
    ElMessage.warning('请选择要导入的文件')
    return
  }
  
  importing.value = true
  try {
    const file = uploadRef.value.uploadFiles[0]
    const formData = new FormData()
    formData.append('file', file.raw)
    
    // 调用导入API
    const response = await supplierApi.importSuppliers(formData)
    
    // 处理导入结果
    if (response && response.data) {
      const { successCount, failCount } = response.data
      let message = `导入成功`
      if (successCount !== undefined) message += `，成功${successCount}条`
      if (failCount !== undefined) message += `，失败${failCount}条`
      ElMessage.success(message)
    } else {
      ElMessage.success('导入成功')
    }
    
    importDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('导入供应商失败:', error)
    ElMessage.error('导入失败，请检查文件格式后重试')
  } finally {
    importing.value = false
    // 清空上传文件
    uploadRef.value.clearFiles()
  }
}

const downloadTemplate = () => {
  ElMessage.success('模板下载功能开发中...')
}

const handleSizeChange = (val) => {
  pagination.size = val
  fetchData()
}

const handleCurrentChange = (val) => {
  pagination.current = val
  fetchData()
}

// 工具方法
const getStatusTagType = (status) => {
  const map = {
    active: 'success',
    inactive: 'danger',
    pending: 'warning'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    active: '启用',
    inactive: '禁用',
    pending: '待审核'
  }
  return map[status] || status
}

const getTypeTagType = (type) => {
  const map = {
    raw_material: 'primary',
    equipment: 'success',
    service: 'warning',
    office: 'info'
  }
  return map[type] || 'info'
}

const getTypeLabel = (type) => {
  const map = {
    raw_material: '原材料',
    equipment: '设备',
    service: '服务',
    office: '办公用品'
  }
  return map[type] || type
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// 模拟数据 - 用于API调用失败时的降级方案
const mockSuppliers = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  supplierCode: `SUP${String(index + 1).padStart(4, '0')}`,
  supplierName: `供应商${index + 1}`,
  type: ['raw_material', 'equipment', 'service', 'office'][index % 4],
  contactPerson: `联系人${index + 1}`,
  phone: `1380013800${index}`,
  email: `supplier${index + 1}@example.com`,
  rating: Math.floor(Math.random() * 5) + 1,
  status: ['active', 'inactive', 'pending'][index % 3],
  createdAt: new Date().toISOString(),
  logo: ''
}))

const mockStatistics = {
  total: 100,
  active: 75,
  highRating: 60,
  new: 12
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    // 调用真实API获取数据
    const [supplierRes, statsRes] = await Promise.all([
      supplierApi.getSupplierList({
        pageNum: pagination.current,
        pageSize: pagination.size,
        ...searchForm
      }),
      supplierApi.getSupplierStatistics()
    ])
    
    // 处理响应数据
    if (supplierRes && supplierRes.data) {
      tableData.value = supplierRes.data.list || []
      pagination.total = supplierRes.data.total || 0
    } else {
      // API返回格式异常时使用模拟数据
      console.warn('供应商列表API返回数据格式异常，使用模拟数据')
      tableData.value = [...mockSuppliers]
      pagination.total = mockStatistics.total
    }
    
    // 更新统计数据
    if (statsRes && statsRes.data) {
      statistics.total = statsRes.data.total || 0
      statistics.active = statsRes.data.active || 0
      statistics.highRating = statsRes.data.highRating || 0
      statistics.new = statsRes.data.new || 0
    } else {
      console.warn('供应商统计API返回数据格式异常，使用模拟数据')
      Object.assign(statistics, mockStatistics)
    }
    
    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('获取供应商数据失败:', error)
    ElMessage.error('获取数据失败，已加载模拟数据')
    
    // API调用失败时使用模拟数据作为降级方案
    tableData.value = [...mockSuppliers]
    pagination.total = mockStatistics.total
    Object.assign(statistics, mockStatistics)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.supplier-list {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .header-left {
      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: #303133;
      }
    }
    
    .header-right {
      display: flex;
      gap: 12px;
    }
  }
  
  .search-card {
    margin-bottom: 20px;
  }
  
  .stats-cards {
    margin-bottom: 20px;
    
    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
        }
        
        .stat-info {
          flex: 1;
          
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #303133;
            line-height: 1;
          }
          
          .stat-label {
            font-size: 14px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }
    }
  }
  
  .table-card {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      .table-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: bold;
      }
    }
    
    .supplier-name {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .card-view {
      .supplier-card-col {
        margin-bottom: 20px;
      }
      
      .supplier-card {
        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          
          .card-title {
            flex: 1;
            
            .supplier-name {
              font-weight: bold;
              margin-bottom: 4px;
            }
            
            .supplier-code {
              font-size: 12px;
              color: #909399;
            }
          }
        }
        
        .card-content {
          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            
            .label {
              color: #909399;
              font-size: 14px;
            }
          }
        }
        
        .card-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 16px;
        }
      }
    }
  }
  
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}

.import-content {
  .upload-area {
    margin: 20px 0;
  }
  
  .template-download {
    text-align: center;
    margin-top: 16px;
  }
}
</style>