cat > fixture/FixtureManagement.vue <<'EOF'
<template>
  <div class="fixture-management">
    <div class="header">
      <h1>夹具管理</h1>
      <div class="actions">
        <el-button type="primary" @click="handleAdd">新增夹具</el-button>
        <el-button @click="handleImport">导入夹具</el-button>
      </div>
    </div>

    <el-table :data="fixtureList" style="width: 100%">
      <el-table-column prop="code" label="夹具编号" width="120" />
      <el-table-column prop="name" label="夹具名称" />
      <el-table-column prop="type" label="夹具类型" />
      <el-table-column prop="specification" label="规格型号" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="applicableProduct" label="适用产品" />
      <el-table-column prop="currentLocation" label="当前位置" />
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

const fixtureList = ref([])

onMounted(() => {
  loadFixtureList()
})

const loadFixtureList = () => {
  // 模拟数据
  fixtureList.value = [
    {
      id: 1,
      code: 'F001',
      name: 'CNC夹具A',
      type: 'CNC夹具',
      specification: 'F-CNC-001',
      status: 'in_use',
      applicableProduct: '产品A',
      currentLocation: 'CNC机床1'
    },
    {
      id: 2,
      code: 'F002',
      name: '检测夹具B',
      type: '检测夹具',
      specification: 'F-TEST-001',
      status: 'standby',
      applicableProduct: '产品B',
      currentLocation: '检测室'
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
  console.log('新增夹具')
}

const handleImport = () => {
  console.log('导入夹具')
}

const handleView = (fixture) => {
  console.log('查看夹具:', fixture)
}

const handleEdit = (fixture) => {
  console.log('编辑夹具:', fixture)
}

const handleDelete = (fixture) => {
  console.log('删除夹具:', fixture)
}
</script>

<style scoped>
.fixture-management {
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