// 表格排序Hook
import { ref, computed } from 'vue'

export function useTableSort(data, defaultSort = {}) {
  const sortProp = ref(defaultSort.prop || '')
  const sortOrder = ref(defaultSort.order || '')
  
  const sortedData = computed(() => {
    if (!sortProp.value || !sortOrder.value) {
      return data.value
    }
    
    return [...data.value].sort((a, b) => {
      const aVal = a[sortProp.value]
      const bVal = b[sortProp.value]
      
      if (aVal === bVal) return 0
      
      const result = aVal > bVal ? 1 : -1
      return sortOrder.value === 'ascending' ? result : -result
    })
  })
  
  const handleSort = ({ prop, order }) => {
    sortProp.value = prop
    sortOrder.value = order
  }
  
  const resetSort = () => {
    sortProp.value = ''
    sortOrder.value = ''
  }
  
  return {
    sortProp,
    sortOrder,
    sortedData,
    handleSort,
    resetSort
  }
}
