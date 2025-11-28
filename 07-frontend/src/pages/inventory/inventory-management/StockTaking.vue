<template>
  <div class="stock-taking-container">
    <el-page-header content="库存盘点" @back="$router.back()" />
    
    <el-card class="main-card" shadow="hover">
      <el-tabs v-model="activeTab">
        <!-- 创建盘点任务 -->
        <el-tab-pane label="创建盘点" name="create">
          <el-form :model="takingForm" :rules="rules" ref="takingFormRef" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="盘点名称" prop="name">
                  <el-input v-model="takingForm.name" placeholder="请输入盘点名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="盘点类型" prop="type">
                  <el-select v-model="takingForm.type" placeholder="请选择盘点类型">
                    <el-option label="全盘" value="full" />
                    <el-option label="抽盘" value="sample" />
                    <el-option label="动态盘点" value="dynamic" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="盘点仓库" prop="warehouseId">
                  <el-select v-model="takingForm.warehouseId" placeholder="请选择仓库">
                    <el-option 
                      v-for="wh in warehouses" 
                      :key="wh.id" 
                      :label="wh.name" 
                      :value="wh.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="计划时间" prop="planTime">
                  <el-date-picker
                    v-model="takingForm.planTime"
                    type="datetime"
                    placeholder="请选择计划时间"
                    style="width: 100%;"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="盘点人员" prop="assignees">
              <el-select v-model="takingForm.assignees" multiple placeholder="请选择盘点人员">
                <el-option label="张三" value="1" />
                <el-option label="李四" value="2" />
                <el-option label="王五" value="3" />
              </el-select>
            </el-form-item>

            <el-form-item label="备注">
              <el-input 
                v-model="takingForm.remark" 
                type="textarea" 
                :rows="3"
                placeholder="请输入备注"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitTaking" :loading="submitting">
                创建盘点任务
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 盘点任务列表 -->
        <el-tab-pane label="盘点任务" name="list">
          <el-form :model="searchForm" :inline="true">
            <el-form-item label="任务名称">
              <el-input v-model="searchForm.name" placeholder="请输入任务名称" clearable />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                <el-option label="待盘点" value="pending" />
                <el-option label="盘点中" value="checking" />
                <el-option label="待复核" value="reviewing" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadTakingList">查询</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="takingList" border v-loading="loading">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="taskNo" label="任务编号" width="150" />
            <el-table-column prop="name" label="任务名称" width="180" />
            <el-table-column prop="type" label="盘点类型" width="100">
              <template #default="scope">
                <el-tag>{{ getTypeText(scope.row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="warehouseName" label="仓库" width="120" />
            <el-table-column prop="totalItems" label="盘点项目" width="100" />
            <el-table-column prop="checkedItems" label="已盘项目" width="100" />
            <el-table-column label="盘点进度" width="150">
              <template #default="scope">
                <el-progress 
                  :percentage="Math.floor(scope.row.checkedItems / scope.row.totalItems * 100)" 
                  :color="customColors"
                />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="creator" label="创建人" width="100" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column label="操作" fixed="right" width="220">
              <template #default="scope">
                <el-button type="primary" size="small" link @click="viewDetail(scope.row)">
                  详情
                </el-button>
                <el-button 
                  v-if="scope.row.status === 'pending' || scope.row.status === 'checking'" 
                  type="success" 
                  size="small" 
                  link 
                  @click="startTaking(scope.row)"
                >
                  开始盘点
                </el-button>
                <el-button 
                  v-if="scope.row.status === 'reviewing'" 
                  type="warning" 
                  size="small" 
                  link 
                  @click="completeTaking(scope.row)"
                >
                  完成
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="pageNum"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadTakingList"
            @current-change="loadTakingList"
            style="margin-top: 20px; justify-content: flex-end;"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 盘点详情对话框 -->
    <el-dialog v-model="showDetail" title="盘点详情" width="900px">
      <el-descriptions :column="2" border v-if="currentTask">
        <el-descriptions-item label="任务编号">{{ currentTask.taskNo }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ currentTask.name }}</el-descriptions-item>
        <el-descriptions-item label="盘点类型">{{ getTypeText(currentTask.type) }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ currentTask.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentTask.status)">
            {{ getStatusText(currentTask.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentTask.creator }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentTask.createTime }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>盘点明细</el-divider>

      <el-table :data="takingDetails" border max-height="400">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="productCode" label="产品编码" width="150" />
        <el-table-column prop="productName" label="产品名称" width="180" />
        <el-table-column prop="bookQuantity" label="账面数量" width="100" />
        <el-table-column label="实盘数量" width="150">
          <template #default="scope">
            <el-input-number 
              v-model="scope.row.actualQuantity" 
              :min="0"
              size="small"
              :disabled="currentTask.status === 'completed'"
            />
          </template>
        </el-table-column>
        <el-table-column label="差异" width="100">
          <template #default="scope">
            <span :style="{ color: getDifferenceColor(scope.row) }">
              {{ scope.row.actualQuantity - scope.row.bookQuantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注">
          <template #default="scope">
            <el-input 
              v-model="scope.row.remark" 
              size="small"
              :disabled="currentTask.status === 'completed'"
            />
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button 
          v-if="currentTask.status !== 'completed'" 
          type="primary" 
          @click="saveTakingData"
        >
          保存
        </el-button>
        <el-button @click="showDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { stockTakingApi } from '@/api/inventory'

// 响应式数据
const activeTab = ref('list')
const loading = ref(false)
const submitting = ref(false)
const showDetail = ref(false)
const takingFormRef = ref(null)
const warehouses = ref([])
const takingList = ref([])
const currentTask = ref(null)
const takingDetails = ref([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

const customColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
]

const takingForm = reactive({
  name: '',
  type: 'full',
  warehouseId: '',
  planTime: '',
  assignees: [],
  remark: ''
})

const searchForm = reactive({
  name: '',
  status: ''
})

const rules = {
  name: [{ required: true, message: '请输入盘点名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择盘点类型', trigger: 'change' }],
  warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
  planTime: [{ required: true, message: '请选择计划时间', trigger: 'change' }],
  assignees: [{ required: true, message: '请选择盘点人员', trigger: 'change' }]
}

// 方法
const loadTakingList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    const res = await stockTakingApi.getStockTakingList(params)
    takingList.value = res.data?.records || mockTakingList()
    total.value = res.data?.total || 15
  } catch (error) {
    console.error('加载盘点任务失败:', error)
    takingList.value = mockTakingList()
  } finally {
    loading.value = false
  }
}

const submitTaking = async () => {
  try {
    await takingFormRef.value.validate()
    submitting.value = true
    await stockTakingApi.createStockTaking(takingForm)
    ElMessage.success('盘点任务创建成功')
    resetForm()
    activeTab.value = 'list'
    loadTakingList()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('创建盘点任务失败')
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  takingFormRef.value?.resetFields()
}

const viewDetail = async (row) => {
  try {
    const res = await stockTakingApi.getStockTakingDetail(row.id)
    currentTask.value = row
    takingDetails.value = res.data?.details || mockTakingDetails()
    showDetail.value = true
  } catch (error) {
    console.error('加载盘点详情失败:', error)
    currentTask.value = row
    takingDetails.value = mockTakingDetails()
    showDetail.value = true
  }
}

const startTaking = (row) => {
  ElMessage.success('开始盘点任务')
  viewDetail(row)
}

const saveTakingData = async () => {
  try {
    await stockTakingApi.submitStockTaking({
      taskId: currentTask.value.id,
      details: takingDetails.value
    })
    ElMessage.success('保存成功')
    showDetail.value = false
    loadTakingList()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const completeTaking = async (row) => {
  ElMessageBox.confirm('确认完成该盘点任务？', '确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await stockTakingApi.completeStockTaking(row.id)
      ElMessage.success('盘点任务已完成')
      loadTakingList()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

const getDifferenceColor = (row) => {
  const diff = row.actualQuantity - row.bookQuantity
  if (diff > 0) return '#67c23a'
  if (diff < 0) return '#f56c6c'
  return '#909399'
}

const getTypeText = (type) => {
  const textMap = {
    full: '全盘',
    sample: '抽盘',
    dynamic: '动态盘点'
  }
  return textMap[type] || '未知'
}

const getStatusType = (status) => {
  const typeMap = {
    pending: 'info',
    checking: 'primary',
    reviewing: 'warning',
    completed: 'success'
  }
  return typeMap[status] || ''
}

const getStatusText = (status) => {
  const textMap = {
    pending: '待盘点',
    checking: '盘点中',
    reviewing: '待复核',
    completed: '已完成'
  }
  return textMap[status] || '未知'
}

const mockTakingList = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    taskNo: `ST${String(Date.now() + i).slice(-10)}`,
    name: `${['全盘', '抽盘'][i % 2]}任务${i + 1}`,
    type: ['full', 'sample'][i % 2],
    warehouseName: '主仓库',
    totalItems: 50,
    checkedItems: Math.floor(Math.random() * 50),
    status: ['pending', 'checking', 'reviewing', 'completed'][i % 4],
    creator: '张三',
    createTime: '2024-01-15 10:00:00'
  }))
}

const mockTakingDetails = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    productId: i + 1,
    productCode: `P${String(i + 1001).padStart(6, '0')}`,
    productName: `产品${i + 1}`,
    bookQuantity: Math.floor(Math.random() * 500) + 100,
    actualQuantity: Math.floor(Math.random() * 500) + 100,
    remark: ''
  }))
}

onMounted(() => {
  warehouses.value = [
    { id: 1, name: '主仓库' },
    { id: 2, name: '分仓库A' }
  ]
  
  if (activeTab.value === 'list') {
    loadTakingList()
  }
})
</script>

<style scoped>
.stock-taking-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}
</style>
