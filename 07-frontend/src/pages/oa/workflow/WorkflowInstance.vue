# 创建 WorkflowInstance.vue
cat > oa/workflow/WorkflowInstance.vue <<'EOF'
<template>
  <div class="workflow-instance">
    <h2>工作流实例</h2>
    <el-table :data="instances">
      <el-table-column prop="id" label="实例ID" />
      <el-table-column prop="name" label="流程名称" />
      <el-table-column prop="status" label="状态" />
      <el-table-column prop="startTime" label="开始时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button link type="primary" @click="handleView(scope.row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
const instances = [
  { id: 'WF001', name: '采购审批流程', status: '进行中', startTime: '2024-01-15 09:00' },
  { id: 'WF002', name: '请假审批流程', status: '已完成', startTime: '2024-01-14 14:00' }
]

const handleView = (instance) => {
  console.log('查看实例:', instance)
}
</script>
EOF

# 创建 MyTask.vue
cat > oa/workflow/MyTask.vue <<'EOF'
<template>
  <div class="my-task">
    <h2>我的任务</h2>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="待办" name="todo">
        <task-list :tasks="todoTasks" />
      </el-tab-pane>
      <el-tab-pane label="已办" name="done">
        <task-list :tasks="doneTasks" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const activeTab = ref('todo')

const tasks = ref([
  { id: 1, name: '采购申请审批', type: 'approval', createTime: '2024-01-15 09:00', status: 'pending' },
  { id: 2, name: '项目立项审核', type: 'review', createTime: '2024-01-14 16:00', status: 'completed' }
])

const todoTasks = computed(() => tasks.value.filter(task => task.status === 'pending'))
const doneTasks = computed(() => tasks.value.filter(task => task.status === 'completed'))
</script>
EOF

# 创建 TaskDelegate.vue
cat > oa/workflow/TaskDelegate.vue <<'EOF'
<template>
  <div class="task-delegate">
    <h2>任务委托</h2>
    <el-form :model="delegateForm" label-width="100px">
      <el-form-item label="委托任务">
        <el-select v-model="delegateForm.taskId" placeholder="选择任务">
          <el-option label="采购审批" value="1" />
          <el-option label="请假审批" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="委托给">
        <el-select v-model="delegateForm.delegateTo" placeholder="选择用户">
          <el-option label="用户A" value="userA" />
          <el-option label="用户B" value="userB" />
        </el-select>
      </el-form-item>
      <el-form-item label="委托时间">
        <el-date-picker
          v-model="delegateForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleDelegate">确认委托</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const delegateForm = ref({
  taskId: '',
  delegateTo: '',
  dateRange: []
})

const handleDelegate = () => {
  console.log('委托任务:', delegateForm.value)
}
</script>
EOF

# 创建 ApprovalChain.vue
cat > oa/workflow/ApprovalChain.vue <<'EOF'
<template>
  <div class="approval-chain">
    <h2>审批链配置</h2>
    <div class="chain-container">
      <div v-for="(node, index) in approvalChain" :key="index" class="chain-node">
        <div class="node-content">
          <div class="node-order">{{ index + 1 }}</div>
          <div class="node-info">
            <div class="node-role">{{ node.role }}</div>
            <div class="node-users">{{ node.users.join(', ') }}</div>
          </div>
        </div>
        <div v-if="index < approvalChain.length - 1" class="node-connector">↓</div>
      </div>
    </div>
    <el-button @click="handleEdit">编辑审批链</el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const approvalChain = ref([
  { role: '部门经理', users: ['张三', '李四'] },
  { role: '财务总监', users: ['王五'] },
  { role: '总经理', users: ['赵六'] }
])

const handleEdit = () => {
  console.log('编辑审批链')
}
</script>

<style scoped>
.chain-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.chain-node {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.node-content {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  background: white;
}

.node-order {
  background: #409eff;
  color: white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.node-connector {
  color: #409eff;
  font-size: 20px;
}
</style>
EOF