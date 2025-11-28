<template>
  <div class="pagination-table-wrapper">
    <BaseTable
      ref="baseTableRef"
      :data="paginatedData"
      :columns="columns"
      :show-pagination="true"
      :total="total"
      :page-num="currentPage"
      :page-size="currentPageSize"
      v-bind="$attrs"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template v-for="(_, slot) in $slots" #[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </BaseTable>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseTable from './BaseTable.vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  pageNum: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  total: { type: Number, default: 0 }
})

const emit = defineEmits(['update:pageNum', 'update:pageSize', 'page-change'])

const baseTableRef = ref(null)
const currentPage = ref(props.pageNum)
const currentPageSize = ref(props.pageSize)

const paginatedData = computed(() => props.data)

watch(() => props.pageNum, val => currentPage.value = val)
watch(() => props.pageSize, val => currentPageSize.value = val)

const handlePageChange = ({ page, pageSize }) => {
  currentPage.value = page
  emit('update:pageNum', page)
  emit('page-change', { page, pageSize })
}

const handleSizeChange = ({ page, pageSize }) => {
  currentPageSize.value = pageSize
  emit('update:pageSize', pageSize)
  emit('page-change', { page, pageSize })
}

defineExpose({ baseTableRef })
</script>
