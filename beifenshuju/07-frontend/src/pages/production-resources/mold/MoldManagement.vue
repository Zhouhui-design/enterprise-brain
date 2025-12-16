cat > mold/MoldManagement.vue <<'EOF'
<template>
  <div class="mold-management">
    <div class="header">
      <h1>模具管理</h1>
      <div class="actions">
        <el-button type="primary" @click="handleAdd">新增模具</el-button>
        <el-button @click="handleImport">导入模具</el-button>
      </div>
    </div>

    <el-table :data="moldList" style="width: 100%">
      <el-table-column prop="code" label="模具编号" width="120" />
      <el-table-column prop="name" label="模具名称" />
      <el-table-column prop="model" label="模具型号" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="currentProduct" label="当前产品" />
      <el-table-column prop="totalShots" label="总模次" width="100" />
      <el-table-column prop="lastMaintenance" label="最后保养" width="120" />
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

const moldList = ref([])

onMounted(() => {
  loadMoldList()
})

const loadMoldList = () => {
  // 模拟数据
  moldList.value = [
    {
      id: 1,
      code: 'M001',
      name: '产品A上模',
      model: 'M-A-001',
      status: 'in_use',
      currentProduct: '产品A',
      totalShots: 15000,
      lastMaintenance: '2024-01-10'
    },
    {
      id: 2,
      code: 'M002',
      name: '产品B下模',
      model: 'M-B-001',
      status: 'maintenance',
      currentProduct: '产品B',
      totalShots: 12000,
      lastMaintenance: '2024-01-12'
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
  console.log('新增模具')
}

const handleImport = () => {
  console.log('导入模具')
}

const handleView = (mold) => {
  console.log('查看模具:', mold)
}

const handleEdit = (mold) => {
  console.log('编辑模具:', mold)
}

const handleDelete = (mold) => {
  console.log('删除模具:', mold)
}
</script>

<style scoped>
.mold-management {
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