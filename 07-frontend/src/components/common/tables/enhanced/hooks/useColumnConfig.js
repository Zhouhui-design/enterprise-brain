// 列配置Hook
import { ref, watch } from 'vue'

export function useColumnConfig(columns, storageKey = 'table-column-config') {
  const visibleColumns = ref([])
  const columnWidths = ref({})
  const columnOrder = ref([])
  
  // 初始化列配置
  const initColumns = () => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const config = JSON.parse(saved)
        visibleColumns.value = config.visible || columns.value.map(c => c.prop)
        columnWidths.value = config.widths || {}
        columnOrder.value = config.order || columns.value.map(c => c.prop)
      } catch {
        resetColumns()
      }
    } else {
      resetColumns()
    }
  }
  
  // 重置列配置
  const resetColumns = () => {
    visibleColumns.value = columns.value.map(c => c.prop)
    columnWidths.value = {}
    columnOrder.value = columns.value.map(c => c.prop)
  }
  
  // 保存列配置
  const saveConfig = () => {
    const config = {
      visible: visibleColumns.value,
      widths: columnWidths.value,
      order: columnOrder.value
    }
    localStorage.setItem(storageKey, JSON.stringify(config))
  }
  
  // 切换列可见性
  const toggleColumn = (prop) => {
    const index = visibleColumns.value.indexOf(prop)
    if (index > -1) {
      visibleColumns.value.splice(index, 1)
    } else {
      visibleColumns.value.push(prop)
    }
    saveConfig()
  }
  
  // 设置列宽
  const setColumnWidth = (prop, width) => {
    columnWidths.value[prop] = width
    saveConfig()
  }
  
  // 更新列顺序
  const updateColumnOrder = (newOrder) => {
    columnOrder.value = newOrder
    saveConfig()
  }
  
  watch(columns, initColumns, { immediate: true })
  
  return {
    visibleColumns,
    columnWidths,
    columnOrder,
    initColumns,
    resetColumns,
    toggleColumn,
    setColumnWidth,
    updateColumnOrder,
    saveConfig
  }
}
