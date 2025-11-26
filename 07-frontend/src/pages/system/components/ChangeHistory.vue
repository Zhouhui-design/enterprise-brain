<template>
  <el-dialog v-model="isShow" title="数据变更历史" width="800px" :before-close="handleClose">
    <el-card shadow="never">
      <el-table :data="changeHistory" border style="width: 100%;">
        <el-table-column prop="changeTime" label="变更时间" width="200"></el-table-column>
        <el-table-column prop="changeType" label="变更类型" width="120">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.changeType)">
              {{ scope.row.changeType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorId" label="操作人ID" width="120"></el-table-column>
        <el-table-column label="变更内容">
          <template #default="scope">
            <el-popover trigger="hover" placement="top" width="600">
              <div class="change-content">
                <p><strong>旧值:</strong></p>
                <pre>{{ formatJson(scope.row.oldValue) }}</pre>
                <p><strong>新值:</strong></p>
                <pre>{{ formatJson(scope.row.newValue) }}</pre>
              </div>
              <span slot="reference">查看变更</span>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { dataChangeApi } from '@/api/system/audit';

// 响应式数据
const isShow = ref(false);
const changeHistory = ref([]);
const tableName = ref('');
const recordId = ref('');

// 获取标签类型
const getTagType = (changeType) => {
  switch (changeType) {
    case 'INSERT':
      return 'success';
    case 'UPDATE':
      return 'warning';
    case 'DELETE':
      return 'danger';
    default:
      return 'info';
  }
};

// 格式化JSON
const formatJson = (jsonStr) => {
  if (!jsonStr) return '无';
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch (e) {
    return jsonStr;
  }
};

// 获取变更历史
const getChangeHistory = async () => {
  try {
    const params = {
      tableName: tableName.value,
      recordId: recordId.value,
      pageNum: 1,
      pageSize: 100
    };
    const res = await dataChangeApi.getDataChanges(params);
    changeHistory.value = res.records;
  } catch (error) {
    console.error('获取变更历史失败:', error);
  }
};

// 监听参数变化
watch([tableName, recordId], ([newTable, newRecord]) => {
  if (newTable && newRecord) {
    getChangeHistory();
  }
});

// 打开弹窗
const open = (table, record) => {
  tableName.value = table;
  recordId.value = record;
  isShow.value = true;
};

// 关闭弹窗
const handleClose = () => {
  isShow.value = false;
  setTimeout(() => {
    changeHistory.value = [];
    tableName.value = '';
    recordId.value = '';
  }, 300);
};

// 暴露方法
defineExpose({
  open
});
</script>

<style scoped>
.change-content {
  max-height: 400px;
  overflow: auto;
  font-family: monospace;
}

pre {
  white-space: pre-wrap;
  margin: 5px 0;
  padding: 5px;
  background-color: #f9f9f9;
  border-radius: 4px;
}
</style>
