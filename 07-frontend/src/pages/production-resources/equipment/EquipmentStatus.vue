<template>
  <div class="equipment-status">
    <h1>设备状态监控</h1>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const realTimeStatus = ref([])
const loadingAlerts = ref(false)

onMounted(() => {
  console.log('设备状态页面已加载')
})
</script>

<style scoped>
.equipment-status {
  padding: 20px;
}
</style>