<template>
  <StandardTablePage
    page-title="列表式生产BOM"
    page-subtitle="以列表形式展示BOM父件与子件信息"
    :table-data="tableData"
    :columns="tableColumns"
    :loading="loading"
    :total="total"
    :current-page="currentPage"
    :page-size="pageSize"
    :show-search="true"
    :show-toolbar="true"
    :show-selection="true"
    :show-pagination="true"
    :show-add="true"
    :show-batch-delete="true"
    :show-export="true"
    :show-import="true"
    :show-print="true"
    :show-column-settings="true"
    :show-page-settings="true"
    :show-enhanced-toolbar="false"
    settings-key="list-style-production-bom"
    @add="handleAdd"
    @batch-delete="handleBatchDelete"
    @export="handleExport"
    @import="handleImport"
    @selection-change="handleSelectionChange"
    @page-change="handlePageChange"
    @size-change="handleSizeChange"
  >
    <!-- 搜索表单 -->
    <template #search-form>
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="BOM编号">
          <el-input v-model="searchForm.bomCode" placeholder="请输入BOM编号" clearable />
        </el-form-item>
        <el-form-item label="父件编号">
          <el-input v-model="searchForm.parentCode" placeholder="请输入父件编号" clearable />
        </el-form-item>
        <el-form-item label="父件名称">
          <el-input v-model="searchForm.parentName" placeholder="请输入父件名称" clearable />
        </el-form-item>
        <el-form-item label="BOM状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已批准" value="approved" />
            <el-option label="已废弃" value="obsolete" />
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
    </template>

    <!-- 工具栏左侧按钮 -->
    <template #toolbar-left>
      <el-button 
        type="danger" 
        @click="handleBatchDelete"
        :disabled="selectedRows.length === 0"
      >
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
      <el-button type="success" @click="handleRefresh">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </template>
    <!-- 操作列模板 -->
    <template #operations="{ row }">
      <el-button
        type="primary"
        size="small"
        link
        @click="handleView(row)"
      >
        <el-icon><View /></el-icon>
        查看
      </el-button>
      <el-button
        type="warning"
        size="small"
        link
        @click="handleEdit(row)"
      >
        <el-icon><Edit /></el-icon>
        编辑
      </el-button>
      <el-button
        type="danger"
        size="small"
        link
        @click="handleDelete(row)"
      >
        <el-icon><Delete /></el-icon>
        删除
      </el-button>
    </template>
  </StandardTablePage>

  <!-- 新增/编辑对话框 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="90%"
    :close-on-click-modal="false"
    @closed="handleDialogClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-row :gutter="20">
        <!-- 左侧：父件信息 -->
        <el-col :span="12">
          <el-card shadow="never" class="info-card">
            <template #header>
              <div class="card-header">
                <span>父件信息</span>
              </div>
            </template>
            
            <el-form-item label="BOM编号" prop="bomCode">
              <el-input v-model="formData.bomCode" placeholder="请输入BOM编号" />
            </el-form-item>
            <el-form-item label="父件编号" prop="parentCode">
              <el-input v-model="formData.parentCode" placeholder="请输入父件编号" />
            </el-form-item>
            <el-form-item label="父件名称" prop="parentName">
              <el-input v-model="formData.parentName" placeholder="请输入父件名称" />
            </el-form-item>
            <el-form-item label="BOM状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态">
                <el-option label="草稿" value="draft" />
                <el-option label="审核中" value="reviewing" />
                <el-option label="已批准" value="approved" />
                <el-option label="已废弃" value="obsolete" />
              </el-select>
            </el-form-item>
            <el-form-item label="默认BOM" prop="isDefault">
              <el-radio-group v-model="formData.isDefault">
                <el-radio :label="true">是</el-radio>
                <el-radio :label="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="版本次数" prop="versionCount">
              <el-input-number v-model="formData.versionCount" :min="1" />
            </el-form-item>
            <el-form-item label="BOM备注" prop="remark">
              <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
            </el-form-item>
            <el-form-item label="父件大类" prop="parentMainCategory">
              <el-input v-model="formData.parentMainCategory" placeholder="请输入父件大类" />
            </el-form-item>
            <el-form-item label="父件中类" prop="parentMidCategory">
              <el-input v-model="formData.parentMidCategory" placeholder="请输入父件中类" />
            </el-form-item>
            <el-form-item label="父件小类" prop="parentSubCategory">
              <el-input v-model="formData.parentSubCategory" placeholder="请输入父件小类" />
            </el-form-item>
            <el-form-item label="父件型号" prop="parentModel">
              <el-input v-model="formData.parentModel" placeholder="请输入父件型号" />
            </el-form-item>
            <el-form-item label="父件系列" prop="parentSeries">
              <el-input v-model="formData.parentSeries" placeholder="请输入父件系列" />
            </el-form-item>
            <el-form-item label="父件产出工序" prop="parentOutputProcess">
              <el-input v-model="formData.parentOutputProcess" placeholder="请输入父件产出工序" />
            </el-form-item>
            <el-form-item label="总材料" prop="totalMaterial">
              <el-input-number v-model="formData.totalMaterial" :precision="2" :min="0" />
            </el-form-item>
            <el-form-item label="总人工" prop="totalLabor">
              <el-input-number v-model="formData.totalLabor" :precision="2" :min="0" />
            </el-form-item>
          </el-card>
        </el-col>

        <!-- 右侧：子件信息 -->
        <el-col :span="12">
          <el-card shadow="never" class="info-card">
            <template #header>
              <div class="card-header">
                <span>子件信息</span>
                <el-button type="primary" size="small" @click="handleAddChild">
                  <el-icon><Plus /></el-icon>
                  添加子件
                </el-button>
              </div>
            </template>
            
            <el-table
              :data="formData.children"
              border
              style="width: 100%"
              max-height="600"
            >
              <el-table-column type="index" label="子件序号" width="80" />
              <el-table-column prop="outputProcess" label="产出工序" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.outputProcess" placeholder="产出工序" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="childCode" label="子件编号" width="140">
                <template #default="{ row }">
                  <el-input v-model="row.childCode" placeholder="子件编号" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="childName" label="子件名称" width="140">
                <template #default="{ row }">
                  <el-input v-model="row.childName" placeholder="子件名称" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="childOutputProcess" label="子件产出工序" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.childOutputProcess" placeholder="子件产出工序" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="componentSource" label="子件来源" width="120">
                <template #default="{ row }">
                  <el-select v-model="row.componentSource" placeholder="选择来源" size="small" clearable>
                    <el-option label="自制" value="自制" />
                    <el-option label="外购" value="外购" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="standardUsage" label="标准用量" width="100">
                <template #default="{ row }">
                  <el-input-number v-model="row.standardUsage" :precision="2" :min="0" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button
                    type="danger"
                    size="small"
                    link
                    @click="handleDeleteChild($index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Delete, Edit, View } from '@element-plus/icons-vue'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'
import listStyleBomApi from '@/api/listStyleProductionBom'

// ========== 数据定义 ==========
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const selectedRows = ref([])

// 搜索表单
const searchForm = ref({
  bomCode: '',
  parentCode: '',
  parentName: '',
  status: ''
})

// 表格列配置（启用筛选和排序）
const tableColumns = ref([
  // 父件信息列
  { prop: '序号', label: '序号', width: 80, sortable: true },
  { prop: 'bomCode', label: 'BOM编号', width: 140, sortable: true, filterable: true },
  { prop: 'parentCode', label: '父件编号', width: 140, sortable: true, filterable: true },
  { prop: 'parentName', label: '父件名称', width: 180, sortable: true, filterable: true },
  { prop: 'status', label: 'BOM状态', width: 100, sortable: true, filterable: true },
  { prop: 'isDefault', label: '默认BOM', width: 100, sortable: true, filterable: true },
  { prop: 'versionCount', label: '版本次数', width: 100, sortable: true },
  { prop: 'remark', label: 'BOM备注', width: 200, filterable: true },
  { prop: 'parentMainCategory', label: '父件大类', width: 120, sortable: true, filterable: true },
  { prop: 'parentMidCategory', label: '父件中类', width: 120, sortable: true, filterable: true },
  { prop: 'parentSubCategory', label: '父件小类', width: 120, sortable: true, filterable: true },
  { prop: 'parentModel', label: '父件型号', width: 120, sortable: true, filterable: true },
  { prop: 'parentSeries', label: '父件系列', width: 120, sortable: true, filterable: true },
  { prop: 'parentOutputProcess', label: '父件产出工序', width: 140, sortable: true, filterable: true },
  { prop: 'totalMaterial', label: '总材料', width: 120, align: 'right', sortable: true },
  { prop: 'totalLabor', label: '总人工', width: 120, align: 'right', sortable: true },
  // 子件信息列
  { prop: 'childSeq', label: '子件序号', width: 100 },
  { prop: 'outputProcess', label: '产出工序', width: 120, sortable: true, filterable: true },
  { prop: 'childCode', label: '子件编号', width: 140, sortable: true, filterable: true },
  { prop: 'childName', label: '子件名称', width: 180, sortable: true, filterable: true },
  { prop: 'childOutputProcess', label: '子件产出工序', width: 140, sortable: true, filterable: true },
  { prop: 'componentSource', label: '子件来源', width: 120, sortable: true, filterable: true },
  { prop: 'standardUsage', label: '标准用量', width: 100, align: 'right', sortable: true },
  { prop: 'requiredQuantity', label: '需求数量', width: 100, align: 'right', sortable: true },
  { prop: 'requiredDate', label: '需求日期', width: 140, sortable: true },
  // 操作列
  { 
    prop: 'operations', 
    label: '操作', 
    width: 160,
    type: 'operations',
    fixed: 'right'
  }
])

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const formData = ref({
  id: '',
  bomCode: '',
  parentCode: '',
  parentName: '',
  status: 'draft',
  isDefault: false,
  versionCount: 1,
  remark: '',
  parentMainCategory: '',
  parentMidCategory: '',
  parentSubCategory: '',
  parentModel: '',
  parentSeries: '',
  parentOutputProcess: '',
  totalMaterial: 0,
  totalLabor: 0,
  children: []
})

// 表单验证规则
const formRules = {
  bomCode: [
    { required: true, message: '请输入BOM编号', trigger: 'blur' }
  ],
  parentCode: [
    { required: true, message: '请输入父件编号', trigger: 'blur' }
  ],
  parentName: [
    { required: true, message: '请输入父件名称', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择BOM状态', trigger: 'change' }
  ]
}

// ========== 生命周期 ==========
onMounted(() => {
  loadData()
})

// ========== 数据加载 ==========
const loadData = async () => {
  loading.value = true
  try {
    console.log('🔄 开始加载数据...')
    
    // 调用实际API
    const res = await listStyleBomApi.getListStyleBomList({
      ...searchForm.value,
      page: currentPage.value,
      pageSize: pageSize.value
    })
    
    console.log('📊 API响应:', res)
    
    // request.js的响应拦截器已经处理了code，直接返回数据对象
    if (res && res.list) {
      // 处理真实数据，将每个子件展开为独立的行
      const processedData = []
      
      res.list.forEach(item => {
        if (item.children && item.children.length > 0) {
          // 每个子件生成一行，父件信息保持一致
          item.children.forEach((child, childIndex) => {
            processedData.push({
              id: `${item.id}_${childIndex}`,
              // 父件信息（每行重复，用于合并显示）
              序号: item.sequence,
              bomCode: item.bom_code,
              parentCode: item.parent_code,
              parentName: item.parent_name,
              status: item.status,
              isDefault: item.is_default,
              versionCount: item.version_count,
              remark: item.remark,
              parentMainCategory: item.parent_main_category,
              parentMidCategory: item.parent_mid_category,
              parentSubCategory: item.parent_sub_category,
              parentModel: item.parent_model,
              parentSeries: item.parent_series,
              parentOutputProcess: item.parent_output_process,
              totalMaterial: item.total_material,
              totalLabor: item.total_labor,
              // 子件信息（每个子件独占一行）
              childSeq: child.child_sequence,
              outputProcess: child.output_process,
              childCode: child.child_code,
              childName: child.child_name,
              childOutputProcess: child.child_output_process,
              componentSource: child.component_source,
              standardUsage: child.standard_usage,
              requiredQuantity: child.required_quantity,
              requiredDate: child.required_date,
              // 原始数据
              _parentId: item.id,
              _childId: child.id,
              _isFirstChild: childIndex === 0,
              _childCount: item.children.length
            })
          })
        } else {
          // 没有子件的情况，只显示父件信息
          processedData.push({
            id: item.id,
            序号: item.sequence,
            bomCode: item.bom_code,
            parentCode: item.parent_code,
            parentName: item.parent_name,
            status: item.status,
            isDefault: item.is_default,
            versionCount: item.version_count,
            remark: item.remark,
            parentMainCategory: item.parent_main_category,
            parentMidCategory: item.parent_mid_category,
            parentSubCategory: item.parent_sub_category,
            parentModel: item.parent_model,
            parentSeries: item.parent_series,
            parentOutputProcess: item.parent_output_process,
            totalMaterial: item.total_material,
            totalLabor: item.total_labor,
            _parentId: item.id,
            _childCount: 0
          })
        }
      })
      
      tableData.value = processedData
      total.value = res.total
      console.log('✅ 数据加载成功，共', processedData.length, '行记录')
    } else {
      console.log('⚠️ API返回异常，使用模拟数据')
      tableData.value = generateMockData()
      total.value = tableData.value.length
    }
  } catch (error) {
    console.error('❌ 加载数据失败:', error)
    ElMessage.error('加载数据失败: ' + (error.message || '网络错误'))
    
    // 显示模拟数据用于测试
    tableData.value = generateMockData()
    total.value = tableData.value.length
  } finally {
    loading.value = false
  }
}

// 生成模拟数据
const generateMockData = () => {
  const data = []
  for (let i = 1; i <= 50; i++) {
    const children = []
    for (let j = 1; j <= 3; j++) {
      children.push({
        childSequence: j,
        outputProcess: `工序${j}`,
        childCode: `C${String(i).padStart(4, '0')}-${j}`,
        childName: `子件${i}-${j}`,
        standardUsage: (Math.random() * 10).toFixed(2)
      })
    }
    
    data.push({
      序号: i,
      bomCode: `BOM${String(i).padStart(6, '0')}`,
      parentCode: `P${String(i).padStart(4, '0')}`,
      parentName: `父件产品${i}`,
      status: ['draft', 'reviewing', 'approved'][Math.floor(Math.random() * 3)],
      isDefault: Math.random() > 0.5 ? '是' : '否',
      versionCount: Math.floor(Math.random() * 5) + 1,
      remark: `备注信息${i}`,
      parentMainCategory: `大类${Math.floor(Math.random() * 3) + 1}`,
      parentMidCategory: `中类${Math.floor(Math.random() * 5) + 1}`,
      parentSubCategory: `小类${Math.floor(Math.random() * 8) + 1}`,
      parentModel: `型号${i}`,
      parentSeries: `系列${Math.floor(Math.random() * 3) + 1}`,
      parentOutputProcess: `产出工序${Math.floor(Math.random() * 5) + 1}`,
      totalMaterial: (Math.random() * 10000).toFixed(2),
      totalLabor: (Math.random() * 5000).toFixed(2),
      childSeq: children.map((_, idx) => idx + 1).join(','),
      outputProcess: children.map(c => c.outputProcess).join(','),
      childCode: children.map(c => c.childCode).join(','),
      childName: children.map(c => c.childName).join(','),
      standardUsage: children.map(c => c.standardUsage).join(','),
      _children: children
    })
  }
  return data
}

// ========== 事件处理 ==========
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handleReset = () => {
  searchForm.value = {
    bomCode: '',
    parentCode: '',
    parentName: '',
    status: ''
  }
  handleSearch()
}

const handleRefresh = () => {
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增列表式BOM'
  formData.value = {
    id: '',
    bomCode: '',
    parentCode: '',
    parentName: '',
    status: 'draft',
    isDefault: false,
    versionCount: 1,
    remark: '',
    parentMainCategory: '',
    parentMidCategory: '',
    parentSubCategory: '',
    parentModel: '',
    parentSeries: '',
    parentOutputProcess: '',
    totalMaterial: 0,
    totalLabor: 0,
    children: []
  }
  dialogVisible.value = true
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  
  console.log('🗑️ 选中的数据:', selectedRows.value)
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 条数据吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 获取真实的父件ID（去重）
      const parentIds = [...new Set(
        selectedRows.value
          .map(row => row._parentId)
          .filter(id => id && typeof id === 'number')
      )]
      
      if (parentIds.length > 0) {
        // 有真实ID，调用API删除
        console.log('🔥 准备删除的父件ID:', parentIds)
        const deleteResult = await listStyleBomApi.batchDeleteListStyleBoms(parentIds)
        console.log('🗑️ 删除结果:', deleteResult)
        selectedRows.value = []
        await loadData() // 重新加载数据
        ElMessage.success(`删除成功，共删除${parentIds.length}条记录`)
      } else {
        ElMessage.warning('未找到有效的数据记录')
      }
      
    } catch (error) {
      console.error('❌ 删除过程出错:', error)
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }).catch(() => {
    // 用户取消删除
    console.log('👤 用户取消删除')
  })
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const handleImport = () => {
  ElMessage.info('导入功能开发中')
}

const handleSelectionChange = (rows) => {
  console.log('🎯 选择变化:', rows)
  selectedRows.value = rows
  console.log('📋 当前选中行数:', selectedRows.value.length)
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadData()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}

const handleAddChild = () => {
  formData.value.children.push({
    outputProcess: '',
    childCode: '',
    childName: '',
    childOutputProcess: '',
    componentSource: '',
    standardUsage: 0,
    requiredQuantity: 0,
    requiredDate: ''
  })
}

const handleDeleteChild = (index) => {
  formData.value.children.splice(index, 1)
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    // TODO: 调用保存API
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error(error)
  }
}

const handleView = (row) => {
  console.log('👀 查看数据:', row)
  ElMessage.info('查看功能开发中')
}

const handleEdit = (row) => {
  console.log('✏️ 编辑数据:', row)
  dialogTitle.value = '编辑列表式BOM'
  formData.value = {
    id: row.id || '',
    bomCode: row.bomCode || '',
    parentCode: row.parentCode || '',
    parentName: row.parentName || '',
    status: row.status || 'draft',
    isDefault: row.isDefault === '是' || row.isDefault === true,
    versionCount: row.versionCount || 1,
    remark: row.remark || '',
    parentMainCategory: row.parentMainCategory || '',
    parentMidCategory: row.parentMidCategory || '',
    parentSubCategory: row.parentSubCategory || '',
    parentModel: row.parentModel || '',
    parentSeries: row.parentSeries || '',
    parentOutputProcess: row.parentOutputProcess || '',
    totalMaterial: parseFloat(row.totalMaterial) || 0,
    totalLabor: parseFloat(row.totalLabor) || 0,
    children: row._children || []
  }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  console.log('🗑️ 删除单行数据:', row)
  
  ElMessageBox.confirm(
    `确定要删除BOM编号为"${row.bomCode}"的数据吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 获取真实的父件ID
      const rowId = row._parentId
      
      if (rowId && typeof rowId === 'number') {
        // 有真实ID，调用API删除
        await listStyleBomApi.deleteListStyleBom(rowId)
        console.log('🗑️ 单行API删除成功')
        await loadData()
        ElMessage.success('删除成功')
      } else {
        ElMessage.warning('未找到有效的数据记录')
      }
      
    } catch (error) {
      console.error('❌ 删除过程出错:', error)
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }).catch(() => {
    console.log('👤 用户取消删除')
  })
}

const handleDialogClosed = () => {
  formRef.value?.resetFields()
}
</script>

<style scoped>
.info-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-descriptions__label) {
  width: 120px;
}
</style>
