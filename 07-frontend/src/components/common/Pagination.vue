<template>
  <div class="pagination-container">
    <div class="pagination-info" v-if="showTotal">
      共 {{ total }} 条记录，第 {{ currentPage }} / {{ totalPages }} 页
    </div>
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      :layout="layout"
      :background="background"
      :small="small"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      @prev-click="handlePrevClick"
      @next-click="handleNextClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  total: number
  page: number
  limit: number
  pageSizes?: number[]
  layout?: string
  background?: boolean
  small?: boolean
  showTotal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
  small: false,
  showTotal: true
})

const emit = defineEmits<{
  update: [page: number, limit: number]
  'update:page': [page: number]
  'update:limit': [limit: number]
}>()

const currentPage = computed({
  get: () => props.page,
  set: (value: number) => {
    emit('update:page', value)
    emit('update', value, props.limit)
  }
})

const pageSize = computed({
  get: () => props.limit,
  set: (value: number) => {
    emit('update:limit', value)
    emit('update', props.page, value)
  }
})

const totalPages = computed(() => Math.ceil(props.total / props.limit))

const handleSizeChange = (size: number) => {
  pageSize.value = size
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const handlePrevClick = (page: number) => {
  currentPage.value = page
}

const handleNextClick = (page: number) => {
  currentPage.value = page
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  gap: 16px;
}

.pagination-info {
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .pagination-info {
    text-align: center;
  }
}
</style>