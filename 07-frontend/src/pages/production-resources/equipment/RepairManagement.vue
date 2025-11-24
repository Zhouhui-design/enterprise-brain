cat > production-resources/equipment/RepairManagement.vue <<'EOF'
<template>
  <div class="repair-management">
    <div class="header">
      <h1>设备维修管理</h1>
      <el-button type="primary" @click="handleCreateRepair">创建维修单</el-button>
    </div>

    <div class="toolbar">
      <el-input v-model="searchKeyword" placeholder="搜索设备/维修单号..." style="width: 300px">
        <template #append>
          <el-button :icon="Search" />
        </template>
      </el-input>
      
      <el-select v-model="filterStatus" placeholder="维修状态">
        <el-option label="全部" value="" />
        <el-option label="待接单" value="pending" />
        <el-option label="维修中" value="repairing" />
        <el-option label="待验收" value="waiting_accept" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>

      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
      />
    </div>

    <el-table :data="repairList" style="width: 100%" v-loading="loading">
      <el-table-column prop="repairNo" label="维修单号" width="140" />
      <el-table-column prop="equipmentName" label="设备名称" />
      <el-table-column prop="equipmentCode" label="设备编号" width="120" />
      <el-table-column prop="faultDescription" label="故障描述" />
      <el-table-column prop="reporter" label="报修人" width="100" />
      <el-table-column prop="reportTime" label="报修时间" width="160" />
      <el-table-column prop="assignee" label="维修人" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="handleView(scope.row)">查看</el-button>
          <el-button 
            link 
            type="primary" 
            v-if="scope.row.status === 'pending'" 
            @click="handleAssign(scope.row)"
          >
            派单
          </el-button>
          <el-button 
            link 
            type="success" 
            v-if="scope.row.status === 'repairing'" 
            @click="handleComplete(scope.row)"
          >
            完成
          </el-button>
          <el-button 
            link 
            type="warning" 
            v-if="scope.row.status === 'waiting_accept'" 
            @click="handleAccept(scope.row)"
          >
            验收
          </el-button>
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
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'

const searchKeyword = ref('')
const filterStatus = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

const repairList = ref([])

onMounted(() => {
  loadRepairList()
})

const loadRepairList = () => {
  loading.value = true
  // 模拟数据加载
  setTimeout(() => {
    repairList.value = [
      {
        id: 1,
        repairNo: 'REP20240115001',
        equipmentName: '注塑机',
        equipmentCode: 'EQ001',
        faultDescription: '液压系统压力不足',
        reporter: '张三',
        reportTime: '2024-01-15 09:30:00',
        assignee: '李工',
        status: 'repairing'
      },
      {
        id: 2,
        repairNo: 'REP20240114002',
        equipmentName: 'CNC机床',
        equipmentCode: 'EQ002',
        faultDescription: '主轴异响',
        reporter: '李四',
        reportTime: '2024-01-14 14:20:00',
        assignee: null,
        status: 'pending'
      },
      {
        id: 3,
        repairNo: 'REP20240113003',
        equipmentName: '装配机器人',
        equipmentCode: 'EQ003',
        faultDescription: '定位精度偏差',
        reporter: '王五',
        reportTime: '2024-01-13 11:15:00',
        assignee: '张工',
        status: 'completed'
      }
    ]
    total.value = repairList.value.length
    loading.value = false
  }, 500)
}

const getStatusType = (status) => {
  const types = {
    pending: 'info',
    repairing: 'warning',
    waiting_accept: '',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待接单',
    repairing: '维修中',
    waiting_accept: '待验收',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || '未知'
}

const handleCreateRepair = () => {
  console.log('创建维修单')
}

const handleView = (repair) => {
  console.log('查看维修单:', repair)
}

const handleAssign = (repair) => {
  console.log('派单:', repair)
}

const handleComplete = (repair) => {
  console.log('完成维修:', repair)
}

const handleAccept = (repair) => {
  console.log('验收维修:', repair)
}
</script>

<style scoped>
.repair-management {
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