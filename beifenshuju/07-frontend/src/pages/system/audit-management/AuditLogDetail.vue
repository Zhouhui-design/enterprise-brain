<template>
  <el-dialog v-model="isShow" title="审计日志详情" width="800px" :before-close="handleClose">
    <el-card v-if="auditLog" shadow="never">
      <el-descriptions title="日志信息" border>
        <el-descriptions-item label="ID">{{ auditLog.id }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ auditLog.userName }}</el-descriptions-item>
        <el-descriptions-item label="操作内容">{{ auditLog.operation }}</el-descriptions-item>
        <el-descriptions-item label="操作模块">{{ auditLog.module }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ auditLog.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ auditLog.operationTime }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">操作详情</el-divider>
      <div class="detail-content" v-html="formatDetails(auditLog.details)"></div>
    </el-card>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { auditLogApi } from '@/api/system/audit';

// 响应式数据
const isShow = ref(false);
const auditLog = ref(null);
const logId = ref(null);

// 格式化详情
const formatDetails = (details) => {
  if (!details) return '<p>无详情信息</p>';
  try {
    const obj = JSON.parse(details);
    return `<pre>${JSON.stringify(obj, null, 2)}</pre>`;
  } catch (e) {
    return `<p>${details}</p>`;
  }
};

// 获取详情
const getAuditLogDetail = async (id) => {
  try {
    const res = await auditLogApi.getAuditLogById(id);
    auditLog.value = res;
  } catch (error) {
    console.error('获取审计日志详情失败:', error);
  }
};

// 监听ID变化
watch(logId, (newVal) => {
  if (newVal) {
    getAuditLogDetail(newVal);
  }
});

// 打开弹窗
const open = (id) => {
  logId.value = id;
  isShow.value = true;
};

// 关闭弹窗
const handleClose = () => {
  isShow.value = false;
  setTimeout(() => {
    auditLog.value = null;
    logId.value = null;
  }, 300);
};

// 暴露方法
defineExpose({
  open
});
</script>

<style scoped>
.detail-content {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
}

pre {
  font-family: monospace;
  white-space: pre-wrap;
}
</style>
