cat > tooling/ToolingManagement.vue <<'EOF'
<template>
  <div class="tooling-management">
    <div class="header">
      <h1>工装管理</h1>
      <div class="actions">
        <el-button type="primary" @click="handleAdd">新增工装</el-button>
        <el-button @click="handleImport">导入工装</el-button>
      </div>
    </div>

    <el-table :data="toolingList" style="width: 100%">
      <el-table-column prop="code" label="工装编号" width="120" />
      <el-table-column prop="name" label="工装名称" />
      <el-table-column prop="type" label="工装类型" />
      <el-table-column prop="specification" label="规格型号" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="currentLocation" label="当前位置" />
      <el-table-column prop="lastCheck" label="最后检查" width="120" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button link type="primary" @click="handleView(scope.row)">查看</el-button>
          <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const toolingList = ref([])

onMounted(() => {
  loadToolingList()
})

const loadToolingList = () => {
  // 模拟数据
  toolingList.value = [
    {
      id: 1,
      code: 'T001',
      name: '夹具A',
      type: '夹具',
      specification: 'J-A-001',
      status: 'in_use',
      currentLocation: '生产线1',
      lastCheck: '2024-01-08'
    },
    {
      id: 2,
      code: 'T002',
      name: '刀具B',
      type: '刀具',
      specification: 'D-B-001',
      status: 'maintenance',
      currentLocation: '工具室',
      lastCheck: '2024-01-10'
    }
  ]
}

const getStatusType = (status) => {
  const types = {
    in_use: 'success',
    standby: 'info',
    maintenance: 'warning',
    broken: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    in_use: '使用中',
    standby: '待机',
    maintenance: '保养中',
    broken: '故障'
  }
  return texts[status] || '未知'
}

const handleAdd = () => {
  console.log('新增工装')
}

const handleImport = () => {
  console.log('导入工装')
}

const handleView = (tooling) => {
  console.log('查看工装:', tooling)
}

const handleEdit = (tooling) => {
  console.log('编辑工装:', tooling)
}

const handleDelete = (tooling) => {
  console.log('删除工装:', tooling)
}
</script>

<style scoped>
.tooling-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
EOF