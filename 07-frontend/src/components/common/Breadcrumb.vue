<template>
  <div class="breadcrumb-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item
        v-for="(item, index) in breadcrumbData"
        :key="index"
        :to="item.path ? { path: item.path } : null"
      >
        <i v-if="item.icon" :class="item.icon" style="margin-right: 5px;"></i>
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface BreadcrumbItem {
  title: string
  path?: string
  icon?: string
}

const route = useRoute()

const breadcrumbData = computed<BreadcrumbItem[]>(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  const breadcrumbs: BreadcrumbItem[] = [
    { title: '首页', path: '/dashboard', icon: 'fas fa-home' }
  ]
  
  matched.forEach(item => {
    breadcrumbs.push({
      title: item.meta?.title as string,
      path: item.path,
      icon: item.meta?.icon as string
    })
  })
  
  return breadcrumbs
})
</script>

<style scoped>
.breadcrumb-container {
  padding: 16px 0;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.el-breadcrumb {
  font-size: 14px;
}

.el-breadcrumb :deep(.el-breadcrumb__inner) {
  color: #666;
  transition: color 0.3s;
}

.el-breadcrumb :deep(.el-breadcrumb__inner:hover) {
  color: #409eff;
}

.el-breadcrumb :deep(.el-breadcrumb__inner.is-link) {
  color: #409eff;
  font-weight: 500;
}
</style>