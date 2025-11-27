// 表格拖拽Hook
import { ref } from 'vue'
import Sortable from 'sortablejs'

export function useTableDrag(options = {}) {
  const sortableInstance = ref(null)
  
  const initDrag = (el, onUpdate) => {
    if (!el) return
    
    sortableInstance.value = Sortable.create(el, {
      animation: 150,
      handle: options.handle || '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      ...options,
      onUpdate: (evt) => {
        if (onUpdate) {
          onUpdate(evt)
        }
      }
    })
  }
  
  const destroyDrag = () => {
    if (sortableInstance.value) {
      sortableInstance.value.destroy()
      sortableInstance.value = null
    }
  }
  
  return {
    sortableInstance,
    initDrag,
    destroyDrag
  }
}
