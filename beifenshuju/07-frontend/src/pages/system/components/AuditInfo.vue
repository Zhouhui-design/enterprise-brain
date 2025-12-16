<template>
  <div class="audit-info">
    <el-descriptions title="审计信息" :column="1" border>
      <el-descriptions-item label="操作人">{{ auditInfo.userName || '未知' }}</el-descriptions-item>
      <el-descriptions-item label="操作时间">{{ auditInfo.operationTime || '未知' }}</el-descriptions-item>
      <el-descriptions-item label="操作IP">{{ auditInfo.ipAddress || '未知' }}</el-descriptions-item>
      <el-descriptions-item label="操作内容">{{ auditInfo.operation || '未知' }}</el-descriptions-item>
      <el-descriptions-item label="操作模块">{{ auditInfo.module || '未知' }}</el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 接收审计信息
const props = defineProps({
  auditInfo: {
    type: Object,
    default: () => ({})
  }
});
</script>

<style scoped>
.audit-info {
  margin-bottom: 20px;
}
</style>
