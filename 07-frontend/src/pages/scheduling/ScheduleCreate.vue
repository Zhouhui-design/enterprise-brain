<template>
  <div class="schedule-create">
    <div class="page-header">
      <h1>{{ isEdit ? '编辑生产排程' : '新建生产排程' }}</h1>
      <el-button @click="handleBack">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
    </div>
    
    <el-card shadow="never">
      <el-form 
        v-model="scheduleForm" 
        :rules="rules" 
        ref="scheduleFormRef"
        label-width="120px"
        class="schedule-form"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <h3 class="section-title">基本信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="排程编号" prop="scheduleCode">
                <el-input v-model="scheduleForm.scheduleCode" :disabled="isEdit" placeholder="系统自动生成" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="关联生产计划" prop="productionPlanId">
                <el-select v-model="scheduleForm.productionPlanId" placeholder="请选择生产计划">
                  <el-option 
                    v-for="plan in productionPlans" 
                    :key="plan.id" 
                    :label="plan.planCode + ' - ' + plan.productName" 
                    :value="plan.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="产品" prop="productId">
                <el-select v-model="scheduleForm.productId" placeholder="请选择产品">
                  <el-option 
                    v-for="product in products" 
                    :key="product.id" 
                    :label="product.name" 
                    :value="product.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="计划数量" prop="quantity">
                <el-input-number 
                  v-model="scheduleForm.quantity" 
                  :min="1" 
                  :step="1" 
                  placeholder="请输入计划数量"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开始日期" prop="startDate">
                <el-date-picker 
                  v-model="scheduleForm.startDate" 
                  type="date" 
                  placeholder="请选择开始日期"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束日期" prop="endDate">
                <el-date-picker 
                  v-model="scheduleForm.endDate" 
                  type="date" 
                  placeholder="请选择结束日期"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="排程描述" prop="description">
                <el-input 
                  v-model="scheduleForm.description" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="请输入排程描述"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        
        <!-- 生产资源配置 -->
        <div class="form-section">
          <h3 class="section-title">生产资源配置</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="生产车间" prop="workshopId">
                <el-select v-model="scheduleForm.workshopId" placeholder="请选择生产车间">
                  <el-option 
                    v-for="workshop in workshops" 
                    :key="workshop.id" 
                    :label="workshop.name" 
                    :value="workshop.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="生产线" prop="productionLineId">
                <el-select v-model="scheduleForm.productionLineId" placeholder="请选择生产线">
                  <el-option 
                    v-for="line in productionLines" 
                    :key="line.id" 
                    :label="line.name" 
                    :value="line.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="负责人" prop="managerId">
                <el-select v-model="scheduleForm.managerId" placeholder="请选择负责人">
                  <el-option 
                    v-for="manager in managers" 
                    :key="manager.id" 
                    :label="manager.name" 
                    :value="manager.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="优先级" prop="priority">
                <el-select v-model="scheduleForm.priority" placeholder="请选择优先级">
                  <el-option label="低" value="low" />
                  <el-option label="中" value="medium" />
                  <el-option label="高" value="high" />
                  <el-option label="紧急" value="urgent" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        
        <!-- 工序配置 -->
        <div class="form-section">
          <h3 class="section-title">工序配置</h3>
          <el-button type="primary" size="small" @click="handleAddProcess">
            <el-icon><Plus /></el-icon> 添加工序
          </el-button>
          <el-table 
            :data="scheduleForm.processes" 
            style="width: 100%" 
            border
            class="process-table"
            v-loading="loading"
          >
            <el-table-column prop="processName" label="工序名称" width="180" />
            <el-table-column prop="processSequence" label="工序顺序" width="100" />
            <el-table-column prop="equipment" label="设备" width="150" />
            <el-table-column prop="estimatedTime" label="预计工时(小时)" width="150" />
            <el-table-column prop="requiredQuantity" label="所需数量" width="120" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row, $index }">
                <el-button type="danger" size="small" @click="handleDeleteProcess(row, $index)">
                  删除
                </el-button>
                <el-button size="small" @click="handleEditProcess(row, $index)" style="margin-left: 8px;">
                  编辑
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button @click="handleBack">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
          <el-button type="success" @click="handleSubmitAndView" :loading="submitting">保存并查看</el-button>
        </div>
      </el-form>
    </el-card>
    
    <!-- 工序配置对话框 -->
    <el-dialog
      title="工序配置"
      v-model="processDialogVisible"
      width="600px"
      @close="handleProcessDialogClose"
    >
      <el-form 
        v-model="currentProcess" 
        :rules="processRules" 
        ref="processFormRef"
        label-width="100px"
      >
        <el-form-item label="工序名称" prop="processName">
          <el-input v-model="currentProcess.processName" placeholder="请输入工序名称" />
        </el-form-item>
        <el-form-item label="工序顺序" prop="processSequence">
          <el-input-number 
            v-model="currentProcess.processSequence" 
            :min="1" 
            :step="1" 
            placeholder="请输入工序顺序"
          />
        </el-form-item>
        <el-form-item label="设备" prop="equipment">
          <el-select v-model="currentProcess.equipment" placeholder="请选择设备">
            <el-option 
              v-for="eq in equipmentList" 
              :key="eq.id" 
              :label="eq.name" 
              :value="eq.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预计工时(小时)" prop="estimatedTime">
          <el-input-number 
            v-model="currentProcess.estimatedTime" 
            :min="0.1" 
            :step="0.1" 
            placeholder="请输入预计工时"
          />
        </el-form-item>
        <el-form-item label="所需数量" prop="requiredQuantity">
          <el-input-number 
            v-model="currentProcess.requiredQuantity" 
            :min="1" 
            :step="1" 
            placeholder="请输入所需数量"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleProcessDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSaveProcess">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import type { ElForm } from 'element-plus'

// 定义类型
interface ProductionPlan {
  id: number
  planCode: string
  productName: string
}

interface Product {
  id: number
  name: string
}

interface Workshop {
  id: number
  name: string
}

interface ProductionLine {
  id: number
  name: string
}

interface Manager {
  id: number
  name: string
}

interface Equipment {
  id: number
  name: string
}

interface Process {
  processName: string
  processSequence: number
  equipment: string
  estimatedTime: number
  requiredQuantity: number
}

interface ScheduleForm {
  id?: string
  scheduleCode: string
  productionPlanId: number | ''
  productId: number | ''
  quantity: number
  startDate: string
  endDate: string
  description: string
  workshopId: number | ''
  productionLineId: number | ''
  managerId: number | ''
  priority: string
  processes: Process[]
}

// 响应式数据
const isEdit = ref(false)
const scheduleId = ref('')
const loading = ref(false)
const submitting = ref(false)
const processDialogVisible = ref(false)
const currentProcessIndex = ref(-1)

const scheduleFormRef = ref<InstanceType<typeof ElForm>>()
const processFormRef = ref<InstanceType<typeof ElForm>>()

const scheduleForm = reactive<ScheduleForm>({
  scheduleCode: '',
  productionPlanId: '',
  productId: '',
  quantity: 1,
  startDate: '',
  endDate: '',
  description: '',
  workshopId: '',
  productionLineId: '',
  managerId: '',
  priority: 'medium',
  processes: []
})

const currentProcess = reactive<Process>({
  processName: '',
  processSequence: 1,
  equipment: '',
  estimatedTime: 1,
  requiredQuantity: 1
})

// 模拟数据
const productionPlans = ref<ProductionPlan[]>([
  { id: 1, planCode: 'PP2023001', productName: '产品A' },
  { id: 2, planCode: 'PP2023002', productName: '产品B' }
])

const products = ref<Product[]>([
  { id: 1, name: '产品A' },
  { id: 2, name: '产品B' },
  { id: 3, name: '产品C' },
  { id: 4, name: '产品D' }
])

const workshops = ref<Workshop[]>([
  { id: 1, name: '1号车间' },
  { id: 2, name: '2号车间' },
  { id: 3, name: '3号车间' }
])

const productionLines = ref<ProductionLine[]>([
  { id: 1, name: '生产线A' },
  { id: 2, name: '生产线B' },
  { id: 3, name: '生产线C' }
])

const managers = ref<Manager[]>([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' }
])

const equipmentList = ref<Equipment[]>([
  { id: 1, name: '数控车床A' },
  { id: 2, name: '数控车床B' },
  { id: 3, name: '铣床A' },
  { id: 4, name: '铣床B' },
  { id: 5, name: '钻床A' }
])

// 表单验证规则
const rules = reactive({
  productionPlanId: [{ required: true, message: '请选择生产计划', trigger: 'blur' }],
  productId: [{ required: true, message: '请选择产品', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入计划数量', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'blur' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'blur' }],
  workshopId: [{ required: true, message: '请选择生产车间', trigger: 'blur' }],
  productionLineId: [{ required: true, message: '请选择生产线', trigger: 'blur' }],
  managerId: [{ required: true, message: '请选择负责人', trigger: 'blur' }]
})

const processRules = reactive({
  processName: [{ required: true, message: '请输入工序名称', trigger: 'blur' }],
  processSequence: [{ required: true, message: '请输入工序顺序', trigger: 'blur' }],
  equipment: [{ required: true, message: '请选择设备', trigger: 'blur' }],
  estimatedTime: [{ required: true, message: '请输入预计工时', trigger: 'blur' }],
  requiredQuantity: [{ required: true, message: '请输入所需数量', trigger: 'blur' }]
})

// 路由
const route = useRoute()
const router = useRouter()

// 组件挂载时检查是否为编辑模式
onMounted(() => {
  checkEditMode()
})

// 检查是否为编辑模式
const checkEditMode = () => {
  const id = route.query.id as string
  if (id) {
    isEdit.value = true
    scheduleId.value = id
    loadScheduleData()
  } else {
    // 生成排程编号
    generateScheduleCode()
  }
}

// 生成排程编号
const generateScheduleCode = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  scheduleForm.scheduleCode = `SC${year}${month}${day}${random}`
}

// 加载排程数据
const loadScheduleData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 使用 Object.assign 避免直接替换响应式对象
    Object.assign(scheduleForm, {
      id: scheduleId.value,
      scheduleCode: 'SC2023001',
      productionPlanId: 1,
      productId: 1,
      quantity: 500,
      startDate: '2023-07-15',
      endDate: '2023-07-25',
      description: '产品A的生产排程',
      workshopId: 1,
      productionLineId: 1,
      managerId: 1,
      priority: 'high',
      processes: [
        {
          processName: '车削加工',
          processSequence: 1,
          equipment: '数控车床A',
          estimatedTime: 8,
          requiredQuantity: 500
        },
        {
          processName: '铣削加工',
          processSequence: 2,
          equipment: '铣床A',
          estimatedTime: 6,
          requiredQuantity: 500
        },
        {
          processName: '钻孔加工',
          processSequence: 3,
          equipment: '钻床A',
          estimatedTime: 4,
          requiredQuantity: 500
        }
      ]
    })
  } catch (error) {
    ElMessage.error('加载排程数据失败')
    console.error('加载排程数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 返回列表
const handleBack = () => {
  router.push('/scheduling/list')
}

// 添加工序
const handleAddProcess = () => {
  // 重置当前工序表单
  Object.assign(currentProcess, {
    processName: '',
    processSequence: scheduleForm.processes.length + 1,
    equipment: '',
    estimatedTime: 1,
    requiredQuantity: 1
  })
  currentProcessIndex.value = -1
  processDialogVisible.value = true
}

// 编辑工序
const handleEditProcess = (row: Process, index: number) => {
  // 复制当前工序数据
  Object.assign(currentProcess, { ...row })
  currentProcessIndex.value = index
  processDialogVisible.value = true
}

// 删除工序
const handleDeleteProcess = async (row: Process, index: number) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除工序「${row.processName}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    scheduleForm.processes.splice(index, 1)
    ElMessage.success('删除成功')
  } catch (error) {
    // 取消删除，不需要处理
  }
}

// 保存工序
const handleSaveProcess = () => {
  processFormRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        if (currentProcessIndex.value === -1) {
          // 添加新工序
          scheduleForm.processes.push({ ...currentProcess })
        } else {
          // 更新现有工序
          scheduleForm.processes[currentProcessIndex.value] = { ...currentProcess }
        }
        processDialogVisible.value = false
        ElMessage.success('工序配置成功')
      } catch (error) {
        ElMessage.error('保存工序失败')
      }
    }
  })
}

// 关闭工序对话框
const handleProcessDialogClose = () => {
  processDialogVisible.value = false
  processFormRef.value?.resetFields()
}

// 提交表单
const handleSubmit = async () => {
  if (!scheduleFormRef.value) return
  
  scheduleFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 模拟保存操作
        await new Promise(resolve => setTimeout(resolve, 800))
        ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
        handleBack()
      } catch (error) {
        ElMessage.error(isEdit.value ? '编辑失败' : '创建失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 保存并查看
const handleSubmitAndView = async () => {
  if (!scheduleFormRef.value) return
  
  scheduleFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 模拟保存操作
        await new Promise(resolve => setTimeout(resolve, 800))
        ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
        router.push(`/scheduling/board?id=${scheduleId.value || 1}`)
      } catch (error) {
        ElMessage.error(isEdit.value ? '编辑失败' : '创建失败')
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>

<style scoped>
.schedule-create {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.schedule-form {
  padding: 20px 0;
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.process-table {
  margin-top: 15px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>