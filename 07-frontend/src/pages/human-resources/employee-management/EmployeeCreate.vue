<template>
  <div class="employee-create-container">
    <el-page-header :content="isEditMode ? '编辑员工' : '新增员工'" @back="$router.back()" />
    
    <el-card class="main-card" shadow="hover">
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="基本信息" />
        <el-step title="工作信息" />
        <el-step title="薪资信息" />
        <el-step title="完成" />
      </el-steps>

      <el-form :model="employeeForm" :rules="rules" ref="employeeFormRef" label-width="120px" class="employee-form">
        <!-- 步骤1：基本信息 -->
        <div v-show="activeStep === 0" class="step-content">
          <h3>基本信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="employeeForm.name" placeholder="请输入姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="employeeForm.gender">
                  <el-radio label="男">男</el-radio>
                  <el-radio label="女">女</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="出生日期" prop="birthDate">
                <el-date-picker v-model="employeeForm.birthDate" type="date" placeholder="选择日期" style="width: 100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证号" prop="idCard">
                <el-input v-model="employeeForm.idCard" placeholder="请输入身份证号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="employeeForm.phone" placeholder="请输入手机号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="employeeForm.email" placeholder="请输入邮箱" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="现居地址">
            <el-input v-model="employeeForm.address" type="textarea" :rows="2" placeholder="请输入现居地址" />
          </el-form-item>
        </div>

        <!-- 步骤2：工作信息 -->
        <div v-show="activeStep === 1" class="step-content">
          <h3>工作信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="工号" prop="employeeNo">
                <el-input v-model="employeeForm.employeeNo" placeholder="系统自动生成" :disabled="isEditMode" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="入职日期" prop="entryDate">
                <el-date-picker v-model="employeeForm.entryDate" type="date" placeholder="选择日期" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="部门" prop="departmentId">
                <el-select v-model="employeeForm.departmentId" placeholder="请选择部门" style="width: 100%;">
                  <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="职位" prop="positionId">
                <el-select v-model="employeeForm.positionId" placeholder="请选择职位" style="width: 100%;">
                  <el-option v-for="pos in positions" :key="pos.id" :label="pos.name" :value="pos.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="员工状态" prop="status">
                <el-select v-model="employeeForm.status" placeholder="请选择状态" style="width: 100%;">
                  <el-option label="试用期" value="probation" />
                  <el-option label="正式" value="active" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="直属上级">
                <el-select v-model="employeeForm.supervisorId" placeholder="请选择上级" clearable style="width: 100%;">
                  <el-option label="无" :value="null" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 步骤3：薪资信息 -->
        <div v-show="activeStep === 2" class="step-content">
          <h3>薪资信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="基本工资">
                <el-input-number v-model="employeeForm.baseSalary" :min="0" :precision="2" style="width: 100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="岗位工资">
                <el-input-number v-model="employeeForm.positionSalary" :min="0" :precision="2" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="绩效工资">
                <el-input-number v-model="employeeForm.performanceSalary" :min="0" :precision="2" style="width: 100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="补贴">
                <el-input-number v-model="employeeForm.allowance" :min="0" :precision="2" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="备注">
            <el-input v-model="employeeForm.salaryRemark" type="textarea" :rows="3" placeholder="薪资相关备注" />
          </el-form-item>
        </div>

        <!-- 步骤4：完成 -->
        <div v-show="activeStep === 3" class="step-content">
          <el-result icon="success" title="员工信息填写完成" sub-title="请确认信息无误后提交">
            <template #extra>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="姓名">{{ employeeForm.name }}</el-descriptions-item>
                <el-descriptions-item label="性别">{{ employeeForm.gender }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ employeeForm.phone }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{ employeeForm.email }}</el-descriptions-item>
                <el-descriptions-item label="入职日期">{{ employeeForm.entryDate }}</el-descriptions-item>
                <el-descriptions-item label="状态">{{ employeeForm.status }}</el-descriptions-item>
              </el-descriptions>
            </template>
          </el-result>
        </div>

        <!-- 步骤按钮 -->
        <div class="step-actions">
          <el-button v-if="activeStep > 0" @click="activeStep--">上一步</el-button>
          <el-button v-if="activeStep < 3" type="primary" @click="nextStep">下一步</el-button>
          <el-button v-if="activeStep === 3" type="success" @click="submitForm" :loading="submitting">提交</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { employeeApi, departmentApi, positionApi } from '@/api/hr/employee'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 响应式数据
const activeStep = ref(0)
const submitting = ref(false)
const employeeFormRef = ref(null)
const departments = ref([])
const positions = ref([])

const isEditMode = computed(() => route.query.mode === 'edit')

const employeeForm = reactive({
  id: null,
  name: '',
  gender: '男',
  birthDate: '',
  idCard: '',
  phone: '',
  email: '',
  address: '',
  employeeNo: '',
  entryDate: '',
  departmentId: '',
  positionId: '',
  status: 'probation',
  supervisorId: null,
  baseSalary: 0,
  positionSalary: 0,
  performanceSalary: 0,
  allowance: 0,
  salaryRemark: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  entryDate: [{ required: true, message: '请选择入职日期', trigger: 'change' }],
  departmentId: [{ required: true, message: '请选择部门', trigger: 'change' }],
  positionId: [{ required: true, message: '请选择职位', trigger: 'change' }]
}

// 方法
const nextStep = async () => {
  try {
    await employeeFormRef.value.validateField(getStepFields(activeStep.value))
    activeStep.value++
  } catch (error) {
    ElMessage.error('请填写完整信息')
  }
}

const getStepFields = (step) => {
  const fieldMap = {
    0: ['name', 'gender', 'phone', 'email'],
    1: ['entryDate', 'departmentId', 'positionId'],
    2: []
  }
  return fieldMap[step] || []
}

const submitForm = async () => {
  try {
    await employeeFormRef.value.validate()
    submitting.value = true
    
    if (isEditMode.value) {
      await employeeApi.updateEmployee(employeeForm)
      ElMessage.success('员工信息更新成功')
    } else {
      await employeeApi.createEmployee(employeeForm)
      ElMessage.success('员工创建成功')
    }
    
    router.push('/human-resources/employee-management/list')
  } catch (error) {
    if (error !== false) {
      ElMessage.error(isEditMode.value ? '更新失败' : '创建失败')
    }
  } finally {
    submitting.value = false
  }
}

const loadDepartments = async () => {
  try {
    const res = await departmentApi.getDepartmentList()
    departments.value = res.data || [
      { id: 1, name: '研发部' },
      { id: 2, name: '销售部' }
    ]
  } catch (error) {
    departments.value = []
  }
}

const loadPositions = async () => {
  try {
    const res = await positionApi.getPositionList()
    positions.value = res.data || [
      { id: 1, name: '工程师' },
      { id: 2, name: '经理' }
    ]
  } catch (error) {
    positions.value = []
  }
}

onMounted(() => {
  loadDepartments()
  loadPositions()
  
  if (isEditMode.value && route.query.id) {
    // 加载员工数据
    employeeApi.getEmployeeDetail(route.query.id).then(res => {
      Object.assign(employeeForm, res.data)
    })
  } else {
    // 生成工号
    employeeForm.employeeNo = `EMP${Date.now().toString().slice(-6)}`
  }
})
</script>

<style scoped>
.employee-create-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}

.employee-form {
  margin-top: 40px;
}

.step-content {
  min-height: 400px;
  padding: 20px;
}

.step-content h3 {
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: bold;
}

.step-actions {
  text-align: center;
  margin-top: 30px;
}
</style>
