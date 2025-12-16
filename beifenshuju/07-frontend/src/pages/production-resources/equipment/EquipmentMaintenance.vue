cat > production-resources/equipment/EquipmentMaintenance.vue <<'EOF'
<template>
  <div class="equipment-maintenance">
    <div class="header">
      <h1>设备保养管理</h1>
      <el-button type="primary" @click="handleCreatePlan">创建保养计划</el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="保养计划" name="plans">
        <maintenance-plan-list />
      </el-tab-pane>
      <el-tab-pane label="保养记录" name="records">
        <maintenance-record-list />
      </el-tab-pane>
      <el-tab-pane label="保养标准" name="standards">
        <maintenance-standard-list />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MaintenancePlanList from './components/MaintenancePlanList.vue'
import MaintenanceRecordList from './components/MaintenanceRecordList.vue'
import MaintenanceStandardList from './components/MaintenanceStandardList.vue'

const activeTab = ref('plans')

const handleCreatePlan = () => {
  console.log('创建保养计划')
}
</script>

<style scoped>
.equipment-maintenance {
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