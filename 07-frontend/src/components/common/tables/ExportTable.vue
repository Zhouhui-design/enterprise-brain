<template>
  <div class="export-table-wrapper">
    <BaseTable
      ref="baseTableRef"
      :data="data"
      :columns="columns"
      v-bind="$attrs"
    >
      <template v-for="(_, slot) in $slots" #[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </BaseTable>
    
    <div v-if="showExportBtn" class="export-actions">
      <el-button :icon="Download" @click="exportExcel">
        导出Excel
      </el-button>
      <el-button :icon="Download" @click="exportCSV">
        导出CSV
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import BaseTable from './BaseTable.vue'
import * as XLSX from 'xlsx'

const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  showExportBtn: { type: Boolean, default: true },
  fileName: { type: String, default: 'export' }
})

const baseTableRef = ref(null)

const exportExcel = () => {
  try {
    const exportData = props.data.map(row => {
      const item = {}
      props.columns.forEach(col => {
        if (!col.hidden) {
          item[col.label] = row[col.prop]
        }
      })
      return item
    })
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `${props.fileName}.xlsx`)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const exportCSV = () => {
  try {
    let csv = props.columns.filter(col => !col.hidden).map(col => col.label).join(',') + '\n'
    
    props.data.forEach(row => {
      const values = props.columns.filter(col => !col.hidden).map(col => {
        const val = row[col.prop] || ''
        return `"${String(val).replace(/"/g, '""')}"`
      })
      csv += values.join(',') + '\n'
    })
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${props.fileName}.csv`
    link.click()
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

defineExpose({ baseTableRef, exportExcel, exportCSV })
</script>

<style scoped lang="scss">
.export-table-wrapper {
  .export-actions {
    margin-top: 16px;
    text-align: right;
  }
}
</style>
