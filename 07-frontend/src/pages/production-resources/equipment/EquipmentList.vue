cat > production-resources/equipment/EquipmentList.vue <<'EOF'
<template>
  <div class="equipment-list">
    <div class="header">
      <h1>设备列表</h1>
      <div class="actions">
        <el-button type="primary" @click="handleAdd">新增设备</el-button>
        <el-button @click="handleImport">导入设备</el-button>
        <el-button @click="handleExport">导出设备</el-button>
      </div>
    </div>

    <div class="toolbar">
      <el-input v-model="searchKeyword" placeholder="搜索设备名称/编号..." style="width: 300px">
        <template #append>
          <el-button :icon="Search" />
        </template>
      </el-input>
      
      <el-select v-model="filterStatus" placeholder="设备状态">
        <el-option label="全部" value="" />
        <el-option label="运行中" value="running" />
        <el-option label="待机" value="standby" />
        <el-option label="维修中" value="maintenance" />
        <el-option label="故障" value="broken" />
      </el-select>

      <el-select v-model="filterDepartment" placeholder="所属部门">
        <el-option label="全部" value="" />
        <el-option label="生产一部" value="production1" />
        <el-option label="生产二部" value="production2" />
        <el-option label="质检部" value="quality" />
      </el-select>
    </div>

    <el-table :data="equipmentList" style="width: 100%" v-loading="loading">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="code" label="设备编号" width="120" />
      <el-table-column prop="name" label="设备名称" />
      <el-table-column prop="model" label="设备型号" />
      <el-table-column prop="department" label="所属部门" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastMaintenance" label="最后保养" width="120" />
      <el-table-column prop="utilization" label="利用率" width="100">
        <template #default="scope">
          <el-progress :percentage="scope.row.utilization" :show-text="false" />
          <span style="font-size: 12px">{{ scope.row.utilization }}%</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="handleView(scope.row)">查看</el-button>
          <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'

const searchKeyword = ref('')
const filterStatus = ref('')
const filterDepartment = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

const equipmentList = ref([])

onMounted(() => {
  loadEquipmentList()
})

const loadEquipmentList = () => {
  loading.value = true
  // 模拟数据加载
  setTimeout(() => {
    equipmentList.value = [
      {
        id: 1,
        code: 'EQ001',
        name: '注塑机',
        model: 'ZS-2000',
        department: '生产一部',
        status: 'running',
        lastMaintenance: '2024-01-10',
        utilization: 85
      },
      {
        id: 2,
        code: 'EQ002',
        name: 'CNC机床',
        model: 'CNC-850',
        department: '生产二部',
        status: 'maintenance',
        lastMaintenance: '2024-01-05',
        utilization: 92
      },
      {
        id: 3,
        code: 'EQ003',
        name: '装配机器人',
        model: 'ABB-6700',
        department: '生产一部',
        status: 'standby',
        lastMaintenance: '2024-01-12',
        utilization: 78
      }
    ]
    total.value = equipmentList.value.length
    loading.value = false
  }, 500)
}

const getStatusType = (status) => {
  const types = {
    running: 'success',
    standby: 'info',
    maintenance: 'warning',
    broken: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    running: '运行中',
    standby: '待机',
    maintenance: '维修中',
    broken: '故障'
  }
  return texts[status] || '未知'
}

const handleAdd = () => {
  console.log('新增设备')
}

const handleImport = () => {
  console.log('导入设备')
}

const handleExport = () => {
  console.log('导出设备')
}

const handleView = (equipment) => {
  console.log('查看设备:', equipment)
}

const handleEdit = (equipment) => {
  console.log('编辑设备:', equipment)
}

const handleDelete = (equipment) => {
  console.log('删除设备:', equipment)
}
</script>

<style scoped>
.equipment-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
EOF