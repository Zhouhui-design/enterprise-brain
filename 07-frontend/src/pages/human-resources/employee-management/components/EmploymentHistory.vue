<template>
  <div class="employment-history-component">
    <el-timeline>
      <el-timeline-item
        v-for="(item, index) in historyList"
        :key="index"
        :timestamp="item.date"
        :type="getTimelineType(item.type)"
        :icon="getTimelineIcon(item.type)"
        placement="top"
      >
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ item.title }}</span>
              <el-tag :type="getEventType(item.type)" size="small">
                {{ getEventText(item.type) }}
              </el-tag>
            </div>
          </template>
          
          <el-descriptions :column="2" size="small">
            <el-descriptions-item label="事件类型" v-if="item.type">
              {{ getEventText(item.type) }}
            </el-descriptions-item>
            <el-descriptions-item label="发生时间">
              {{ item.date }}
            </el-descriptions-item>
            
            <el-descriptions-item label="原部门" v-if="item.fromDepartment">
              {{ item.fromDepartment }}
            </el-descriptions-item>
            <el-descriptions-item label="新部门" v-if="item.toDepartment">
              {{ item.toDepartment }}
            </el-descriptions-item>
            
            <el-descriptions-item label="原职位" v-if="item.fromPosition">
              {{ item.fromPosition }}
            </el-descriptions-item>
            <el-descriptions-item label="新职位" v-if="item.toPosition">
              {{ item.toPosition }}
            </el-descriptions-item>
            
            <el-descriptions-item label="调整前薪资" v-if="item.fromSalary">
              ¥{{ item.fromSalary }}
            </el-descriptions-item>
            <el-descriptions-item label="调整后薪资" v-if="item.toSalary">
              ¥{{ item.toSalary }}
            </el-descriptions-item>
            
            <el-descriptions-item label="备注" :span="2" v-if="item.remark">
              {{ item.remark }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-timeline-item>
    </el-timeline>

    <!-- 空状态 -->
    <el-empty v-if="historyList.length === 0" description="暂无履历记录" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  User, 
  Promotion, 
  Money, 
  Document, 
  SwitchButton,
  CircleCheck,
  Warning
} from '@element-plus/icons-vue'

const props = defineProps({
  employeeId: {
    type: [String, Number],
    required: true
  }
})

const historyList = ref([])

// 加载履历记录
const loadHistory = async () => {
  try {
    // TODO: 调用API获取履历记录
    // const res = await employeeApi.getEmployeeHistory(props.employeeId)
    // historyList.value = res.data
    
    // Mock数据
    historyList.value = [
      {
        id: 1,
        type: 'onboarding',
        title: '入职',
        date: '2020-01-15',
        toDepartment: '研发部',
        toPosition: '初级工程师',
        toSalary: 8000,
        remark: '通过校招入职'
      },
      {
        id: 2,
        type: 'promotion',
        title: '晋升',
        date: '2021-06-01',
        fromPosition: '初级工程师',
        toPosition: '中级工程师',
        fromSalary: 8000,
        toSalary: 12000,
        remark: '工作表现优秀，技术能力突出'
      },
      {
        id: 3,
        type: 'transfer',
        title: '部门调动',
        date: '2022-03-15',
        fromDepartment: '研发部',
        toDepartment: '架构部',
        fromPosition: '中级工程师',
        toPosition: '架构师',
        fromSalary: 12000,
        toSalary: 18000,
        remark: '调任架构部负责系统设计'
      },
      {
        id: 4,
        type: 'salary_adjustment',
        title: '薪资调整',
        date: '2023-01-01',
        fromSalary: 18000,
        toSalary: 20000,
        remark: '年度调薪'
      },
      {
        id: 5,
        type: 'promotion',
        title: '晋升',
        date: '2024-01-01',
        fromPosition: '架构师',
        toPosition: '高级架构师',
        fromSalary: 20000,
        toSalary: 25000,
        remark: '晋升为高级架构师'
      }
    ]
  } catch (error) {
    console.error('加载履历记录失败:', error)
  }
}

// 获取时间线类型
const getTimelineType = (type) => {
  const typeMap = {
    onboarding: 'success',
    promotion: 'primary',
    transfer: 'warning',
    salary_adjustment: 'info',
    offboarding: 'danger',
    award: 'success',
    penalty: 'danger'
  }
  return typeMap[type] || 'primary'
}

// 获取时间线图标
const getTimelineIcon = (type) => {
  const iconMap = {
    onboarding: User,
    promotion: Promotion,
    transfer: SwitchButton,
    salary_adjustment: Money,
    offboarding: Warning,
    award: CircleCheck,
    penalty: Warning
  }
  return iconMap[type] || Document
}

// 获取事件类型
const getEventType = (type) => {
  const typeMap = {
    onboarding: 'success',
    promotion: 'primary',
    transfer: 'warning',
    salary_adjustment: 'info',
    offboarding: 'danger',
    award: 'success',
    penalty: 'danger'
  }
  return typeMap[type] || ''
}

// 获取事件文本
const getEventText = (type) => {
  const textMap = {
    onboarding: '入职',
    promotion: '晋升',
    transfer: '调动',
    salary_adjustment: '薪资调整',
    offboarding: '离职',
    award: '奖励',
    penalty: '处罚'
  }
  return textMap[type] || '其他'
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.employment-history-component {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-timeline-item__timestamp) {
  font-weight: bold;
  color: #606266;
}
</style>
