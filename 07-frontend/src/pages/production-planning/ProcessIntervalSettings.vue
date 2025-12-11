<template>
  <StandardTablePage
    page-title="工序间隔设置"
    settings-key="processIntervalSettings"
    :table-data="tableData"
    :columns="allColumns"
    :loading="loading"
    :total="pagination.total"
    :current-page="pagination.page"
    :page-size="pagination.pageSize"
    :show-create="true"
    :show-page-settings="true"
    :show-selection="true"
    :show-filter="true"
    :show-pagination="true"
    :show-enhanced-toolbar="true"
    :show-add="false"
    :show-batch-delete="true"
    :show-export="true"
    :show-import="true"
    :show-print="true"
    :show-breadcrumb="false"
    :show-business-vars="false"
    :default-settings="defaultSettings"
    @create="handleAdd"
    @selection-change="handleSelectionChange"
    @page-change="handlePageChange"
    @size-change="handleSizeChange"
    @batch-delete="handleBatchDelete"
    @export="handleExport"
    @import="handleImport"
    @refresh="loadData"
  >
    <!-- 搜索表单 -->
    <template #search-form>
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="上道工序">
          <el-input 
            v-model="searchForm.previousProcess" 
            placeholder="请输入上道工序名称" 
            clearable 
          />
        </el-form-item>
        <el-form-item label="下道工序">
          <el-input 
            v-model="searchForm.nextProcess" 
            placeholder="请输入下道工序名称" 
            clearable 
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </template>

    <!-- 操作列 -->
    <template #actions="{ row }">
      <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
      <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
    </template>
  </StandardTablePage>

  <!-- 新增/编辑对话框 -->
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑工序间隔' : '新增工序间隔'"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item label="上道工序名称" prop="previousProcess">
        <el-select 
          v-model="formData.previousProcess" 
          placeholder="请选择上道工序" 
          filterable
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="process in processList"
            :key="process.value"
            :label="process.label"
            :value="process.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="下道工序名称" prop="nextProcess">
        <el-select 
          v-model="formData.nextProcess" 
          placeholder="请选择下道工序" 
          filterable
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="process in processList"
            :key="process.value"
            :label="process.label"
            :value="process.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="间隔单位" prop="intervalUnit">
        <el-select v-model="formData.intervalUnit" placeholder="请选择间隔单位" style="width: 100%">
          <el-option label="小时" value="小时" />
          <el-option label="天" value="天" />
        </el-select>
      </el-form-item>
      <el-form-item label="数值" prop="intervalValue">
        <el-input-number 
          v-model="formData.intervalValue" 
          :min="0" 
          :precision="2" 
          style="width: 100%" 
          placeholder="请输入间隔数值"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input 
          v-model="formData.remark" 
          type="textarea" 
          :rows="3" 
          placeholder="请输入备注" 
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'

// ========== 数据状态 ==========
const tableData = ref([])
const selectedRows = ref([])
const loading = ref(false)
const processList = ref([])  // ✅ 需求1：工序列表数据

// ========== 搜索表单 ==========
const searchForm = reactive({
  previousProcess: '',
  nextProcess: ''
})

// ========== 分页 ==========
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// ========== 对话框 ==========
const dialogVisible = ref(false)
const isEdit = ref(false)

// ========== 表单数据 ==========
const formData = ref({})
const formRef = ref(null)

// ========== 表单验证规则 ==========
const formRules = {
  previousProcess: [{ required: true, message: '请选择上道工序名称', trigger: 'change' }],
  nextProcess: [
    { required: true, message: '请选择下道工序名称', trigger: 'change' },
    { 
      validator: (rule, value, callback) => {
        // ✅ 需求2：防重复验证
        if (value && formData.value.previousProcess) {
          const savedData = localStorage.getItem('processIntervalData')
          const allData = savedData ? JSON.parse(savedData) : []
          
          // 检查是否已存在相同的组合
          const duplicate = allData.find(item => {
            // 编辑时排除自己
            if (isEdit.value && item.id === formData.value.id) {
              return false
            }
            return item.previousProcess === formData.value.previousProcess && 
                   item.nextProcess === value
          })
          
          if (duplicate) {
            callback(new Error(`该工序间隔已存在：${formData.value.previousProcess} → ${value}`))
          } else {
            callback()
          }
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ],
  intervalUnit: [{ required: true, message: '请选择间隔单位', trigger: 'change' }],
  intervalValue: [{ required: true, message: '请输入间隔数值', trigger: 'blur' }]
}

// ========== 默认设置 ==========
const defaultSettings = {
  exportFilePrefix: '工序间隔设置',
  codePrefix: 'PI'
}

// ========== 所有列定义 ==========
const allColumns = ref([
  { prop: 'selection', label: '选择', type: 'selection', width: 55, fixed: 'left', visible: true },
  { prop: 'serialNo', label: '序号', width: 80, sortable: true, visible: true },
  { prop: 'previousProcess', label: '上道工序名称', width: 150, sortable: true, filterable: true, visible: true },
  { prop: 'nextProcess', label: '下道工序名称', width: 150, sortable: true, filterable: true, visible: true },
  { prop: 'intervalUnit', label: '间隔单位', width: 120, filterable: true, visible: true },
  { prop: 'intervalValue', label: '数值', width: 120, sortable: true, align: 'right', visible: true },
  { prop: 'remark', label: '备注', width: 200, visible: true },
  { prop: 'actions', label: '操作', width: 180, fixed: 'right', slot: 'actions', visible: true }
])

// ========== 业务方法 ==========
// ✅ 需求1：加载工序列表（从后端API）
const loadProcessList = async () => {
  try {
    console.log('🔍 开始加载工序列表...')
    
    // 从后端API加载工序列表数据
    const response = await fetch('http://192.168.2.229:3005/api/processes/list')
    const result = await response.json()
    
    if (result.code === 200 && result.data) {
      const allProcesses = result.data
      console.log('📊 从后端获取的工序数据:', allProcesses)
      
      // 只需要工序名称字段，过滤掉空值
      processList.value = allProcesses
        .filter(p => p.process_name && p.process_name.trim())
        .map(p => ({
          label: p.process_name,
          value: p.process_name
        }))
      
      console.log(`✅ 加载工序列表成功，共 ${processList.value.length} 条数据`)
      console.log('👀 处理后的下拉选项:', processList.value)
    } else {
      processList.value = []
      console.warn('⚠️ 未从后端获取到工序列表数据')
      ElMessage.warning('未获取到工序列表数据，请检查后端服务')
    }
  } catch (error) {
    console.error('❌ 加载工序列表失败:', error)
    processList.value = []
    ElMessage.error('加载工序列表失败: ' + (error.message || '网络错误'))
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // 从localStorage加载数据
    const savedData = localStorage.getItem('processIntervalData')
    if (savedData) {
      const allData = JSON.parse(savedData)
      
      // 应用搜索过滤
      let filteredData = allData
      if (searchForm.previousProcess) {
        filteredData = filteredData.filter(item => 
          item.previousProcess.includes(searchForm.previousProcess)
        )
      }
      if (searchForm.nextProcess) {
        filteredData = filteredData.filter(item => 
          item.nextProcess.includes(searchForm.nextProcess)
        )
      }
      
      // 分页
      const start = (pagination.page - 1) * pagination.pageSize
      const end = start + pagination.pageSize
      tableData.value = filteredData.slice(start, end).map((item, index) => ({
        ...item,
        serialNo: start + index + 1
      }))
      pagination.total = filteredData.length
    } else {
      // ✅ 如果localStorage中没有数据，初始化一些默认数据
      console.log('🔧 localStorage为空，初始化默认工序间隔数据...')
      const defaultData = []
      
      // 等待工序列表加载完成后，创建一些默认间隔
      if (processList.value.length > 0) {
        // 创建一些常见的工序间隔示例
        const commonIntervals = [
          { previous: '激光下料', next: '冲床', unit: '小时', value: 2, remark: '下料后冲压间隔' },
          { previous: '冲床', next: '折弯', unit: '小时', value: 1, remark: '冲压后折弯间隔' },
          { previous: '折弯', next: '焊接', unit: '小时', value: 3, remark: '折弯后焊接间隔' },
          { previous: '人工焊接', next: '机器打磨', unit: '小时', value: 4, remark: '焊接后打磨间隔' },
          { previous: '机器打磨', next: '喷塑', unit: '小时', value: 2, remark: '打磨后喷塑间隔' }
        ]
        
        // 只创建存在于工序列表中的间隔
        commonIntervals.forEach((interval, index) => {
          const previousExists = processList.value.some(p => p.value === interval.previous)
          const nextExists = processList.value.some(p => p.value === interval.next)
          
          if (previousExists && nextExists) {
            defaultData.push({
              id: index + 1,
              previousProcess: interval.previous,
              nextProcess: interval.next,
              intervalUnit: interval.unit,
              intervalValue: interval.value,
              remark: interval.remark,
              createdAt: new Date().toISOString()
            })
          }
        })
        
        // 保存到localStorage
        localStorage.setItem('processIntervalData', JSON.stringify(defaultData))
        console.log(`✅ 创建了 ${defaultData.length} 条默认工序间隔数据`)
      }
      
      // 应用搜索过滤和分页
      let filteredData = defaultData
      if (searchForm.previousProcess) {
        filteredData = filteredData.filter(item => 
          item.previousProcess.includes(searchForm.previousProcess)
        )
      }
      if (searchForm.nextProcess) {
        filteredData = filteredData.filter(item => 
          item.nextProcess.includes(searchForm.nextProcess)
        )
      }
      
      const start = (pagination.page - 1) * pagination.pageSize
      const end = start + pagination.pageSize
      tableData.value = filteredData.slice(start, end).map((item, index) => ({
        ...item,
        serialNo: start + index + 1
      }))
      pagination.total = filteredData.length
    }
    
    ElMessage.success(tableData.value.length > 0 ? '数据加载成功' : '暂无数据，请添加工序间隔')
  } catch (error) {
    console.error('❌ 加载数据失败:', error)
    ElMessage.error('加载数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.previousProcess = ''
  searchForm.nextProcess = ''
  pagination.page = 1
  loadData()
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  formData.value = {
    previousProcess: '',
    nextProcess: '',
    intervalUnit: '小时',
    intervalValue: 0,
    remark: ''
  }
  // ✅ 打开弹窗时重新加载工序列表
  loadProcessList()
  console.log('👀 当前工序列表数据:', processList.value)
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

// 保存
const handleSave = async () => {
  try {
    await formRef.value.validate()
    
    // 从localStorage读取现有数据
    const savedData = localStorage.getItem('processIntervalData')
    let allData = savedData ? JSON.parse(savedData) : []
    
    if (isEdit.value) {
      // 更新现有数据
      const index = allData.findIndex(item => item.id === formData.value.id)
      if (index !== -1) {
        allData[index] = { ...formData.value }
      }
    } else {
      // 新增数据
      const newId = allData.length > 0 
        ? Math.max(...allData.map(item => item.id)) + 1 
        : 1
      allData.push({
        ...formData.value,
        id: newId,
        createdAt: new Date().toISOString()
      })
    }
    
    // 保存到localStorage
    localStorage.setItem('processIntervalData', JSON.stringify(allData))
    
    ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('❌ 保存失败:', error)
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条工序间隔设置吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 从localStorage读取现有数据
    const savedData = localStorage.getItem('processIntervalData')
    let allData = savedData ? JSON.parse(savedData) : []
    
    // 删除数据
    allData = allData.filter(item => item.id !== row.id)
    
    // 保存到localStorage
    localStorage.setItem('processIntervalData', JSON.stringify(allData))
    
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条数据')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条数据吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 从localStorage读取现有数据
    const savedData = localStorage.getItem('processIntervalData')
    let allData = savedData ? JSON.parse(savedData) : []
    
    // 批量删除
    const idsToDelete = selectedRows.value.map(row => row.id)
    allData = allData.filter(item => !idsToDelete.includes(item.id))
    
    // 保存到localStorage
    localStorage.setItem('processIntervalData', JSON.stringify(allData))
    
    ElMessage.success('批量删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 选择变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

// 每页条数变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

// 导入
const handleImport = () => {
  ElMessage.info('导入功能开发中...')
}

// ========== 生命周期 ==========
onMounted(async () => {
  await loadProcessList()  // ✅ 先加载工序列表
  loadData()  // 然后加载间隔数据
})
</script>

<style scoped>
/* 组件样式 */
</style>
