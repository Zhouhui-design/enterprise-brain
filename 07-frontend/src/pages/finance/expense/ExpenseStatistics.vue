<template>
  <div class="placeholder-page">
    <el-card>
      <h2>{{ title }}</h2>
      <el-empty description="此页面正在开发中..." />
    </el-card>
  </div>
</template>

<script setup>
import { ref } from "vue"

const title = ref("费用统计")
</script>

<style scoped>
.placeholder-page {
  padding: 20px;
}
</style>

