<template>
  <div class="personal-info-component">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="头像" :span="2">
        <el-avatar :size="80" :src="employee.avatar">
          {{ employee.name?.charAt(0) }}
        </el-avatar>
      </el-descriptions-item>
      
      <el-descriptions-item label="姓名">
        {{ employee.name }}
      </el-descriptions-item>
      <el-descriptions-item label="性别">
        {{ employee.gender }}
      </el-descriptions-item>
      
      <el-descriptions-item label="出生日期">
        {{ employee.birthDate }}
      </el-descriptions-item>
      <el-descriptions-item label="年龄">
        {{ calculateAge(employee.birthDate) }} 岁
      </el-descriptions-item>
      
      <el-descriptions-item label="身份证号">
        {{ employee.idCard }}
      </el-descriptions-item>
      <el-descriptions-item label="民族">
        {{ employee.nation || '汉族' }}
      </el-descriptions-item>
      
      <el-descriptions-item label="手机号">
        {{ employee.phone }}
      </el-descriptions-item>
      <el-descriptions-item label="邮箱">
        {{ employee.email }}
      </el-descriptions-item>
      
      <el-descriptions-item label="婚姻状况">
        {{ getMaritalStatus(employee.maritalStatus) }}
      </el-descriptions-item>
      <el-descriptions-item label="政治面貌">
        {{ employee.politicalStatus || '群众' }}
      </el-descriptions-item>
      
      <el-descriptions-item label="学历">
        {{ employee.education || '本科' }}
      </el-descriptions-item>
      <el-descriptions-item label="毕业院校">
        {{ employee.graduateSchool || '-' }}
      </el-descriptions-item>
      
      <el-descriptions-item label="专业">
        {{ employee.major || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="毕业时间">
        {{ employee.graduateDate || '-' }}
      </el-descriptions-item>
      
      <el-descriptions-item label="现居地址" :span="2">
        {{ employee.address || '-' }}
      </el-descriptions-item>
      
      <el-descriptions-item label="户籍地址" :span="2">
        {{ employee.nativeAddress || '-' }}
      </el-descriptions-item>
      
      <el-descriptions-item label="紧急联系人">
        {{ employee.emergencyContact || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="紧急联系电话">
        {{ employee.emergencyPhone || '-' }}
      </el-descriptions-item>
    </el-descriptions>

    <!-- 操作按钮 -->
    <div class="actions" v-if="editable">
      <el-button type="primary" :icon="Edit" @click="handleEdit">编辑</el-button>
      <el-button :icon="Refresh" @click="emit('refresh')">刷新</el-button>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑个人信息" width="800px">
      <el-form :model="editForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="editForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-radio-group v-model="editForm.gender">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出生日期">
              <el-date-picker v-model="editForm.birthDate" type="date" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号">
              <el-input v-model="editForm.idCard" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="editForm.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="editForm.email" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="婚姻状况">
              <el-select v-model="editForm.maritalStatus" style="width: 100%;">
                <el-option label="未婚" value="single" />
                <el-option label="已婚" value="married" />
                <el-option label="离异" value="divorced" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学历">
              <el-select v-model="editForm.education" style="width: 100%;">
                <el-option label="高中" value="high_school" />
                <el-option label="大专" value="college" />
                <el-option label="本科" value="bachelor" />
                <el-option label="硕士" value="master" />
                <el-option label="博士" value="doctor" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="现居地址">
          <el-input v-model="editForm.address" type="textarea" :rows="2" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="紧急联系人">
              <el-input v-model="editForm.emergencyContact" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="紧急联系电话">
              <el-input v-model="editForm.emergencyPhone" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Refresh } from '@element-plus/icons-vue'
import { employeeApi } from '@/api/hr/employee'

const props = defineProps({
  employee: {
    type: Object,
    required: true,
    default: () => ({})
  },
  editable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['refresh'])

const showEditDialog = ref(false)
const editForm = reactive({})

// 计算年龄
const calculateAge = (birthDate) => {
  if (!birthDate) return '-'
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// 获取婚姻状况文本
const getMaritalStatus = (status) => {
  const map = {
    single: '未婚',
    married: '已婚',
    divorced: '离异',
    widowed: '丧偶'
  }
  return map[status] || '-'
}

// 编辑
const handleEdit = () => {
  Object.assign(editForm, props.employee)
  showEditDialog.value = true
}

// 提交编辑
const submitEdit = async () => {
  try {
    await employeeApi.updateEmployee(editForm)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    emit('refresh')
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

watch(() => props.employee, (newVal) => {
  Object.assign(editForm, newVal)
}, { immediate: true })
</script>

<style scoped>
.personal-info-component {
  padding: 20px;
}

.actions {
  margin-top: 20px;
  text-align: right;
}
</style>
