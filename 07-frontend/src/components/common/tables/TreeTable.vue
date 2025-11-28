<template>
  <div class="tree-table-wrapper">
    <BaseTable
      ref="baseTableRef"
      :data="treeData"
      :columns="columns"
      :row-key="rowKey"
      :tree-props="treeProps"
      :default-expand-all="defaultExpandAll"
      v-bind="$attrs"
      @row-click="handleRowClick"
    >
      <!-- 自定义插槽透传 -->
      <template v-for="(_, slot) in $slots" #[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
      
      <!-- 操作列 -->
      <template #action="{ row, $index }">
        <el-button
          v-if="showExpandBtn && hasChildren(row)"
          type="primary"
          size="small"
          link
          @click="toggleExpand(row)"
        >
          {{ isExpanded(row) ? '收起' : '展开' }}
        </el-button>
        <el-button
          v-if="showAddChildBtn"
          type="primary"
          size="small"
          :icon="Plus"
          link
          @click="handleAddChild(row)"
        >
          添加子节点
        </el-button>
        <el-button
          v-if="showDeleteBtn"
          type="danger"
          size="small"
          :icon="Delete"
          link
          @click="handleDelete(row, $index)"
        >
          删除
        </el-button>
        <slot name="action" :row="row" :index="$index" />
      </template>
    </BaseTable>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import BaseTable from './BaseTable.vue'

const props = defineProps({
  // 树形数据
  data: {
    type: Array,
    default: () => []
  },
  // 列配置
  columns: {
    type: Array,
    default: () => []
  },
  // 行数据的 Key
  rowKey: {
    type: String,
    default: 'id'
  },
  // 树形配置
  treeProps: {
    type: Object,
    default: () => ({ children: 'children', hasChildren: 'hasChildren' })
  },
  // 默认展开所有
  defaultExpandAll: {
    type: Boolean,
    default: false
  },
  // 是否显示展开按钮
  showExpandBtn: {
    type: Boolean,
    default: false
  },
  // 是否显示添加子节点按钮
  showAddChildBtn: {
    type: Boolean,
    default: false
  },
  // 是否显示删除按钮
  showDeleteBtn: {
    type: Boolean,
    default: false
  },
  // 新节点默认数据
  defaultNode: {
    type: Object,
    default: () => ({})
  },
  // 是否需要确认删除
  confirmDelete: {
    type: Boolean,
    default: true
  },
  // 懒加载方法
  lazy: {
    type: Boolean,
    default: false
  },
  // 加载子节点数据的函数
  load: {
    type: Function,
    default: null
  }
})

const emit = defineEmits([
  'update:data',
  'add-child',
  'delete',
  'row-click',
  'expand-change'
])

const baseTableRef = ref(null)
const treeData = ref([])
const expandedKeys = ref(new Set())

// 监听数据变化
watch(() => props.data, (newVal) => {
  treeData.value = JSON.parse(JSON.stringify(newVal || []))
}, { immediate: true, deep: true })

// 判断是否有子节点
const hasChildren = (row) => {
  const childrenKey = props.treeProps.children || 'children'
  return row[childrenKey] && row[childrenKey].length > 0
}

// 判断节点是否展开
const isExpanded = (row) => {
  return expandedKeys.value.has(row[props.rowKey])
}

// 切换展开状态
const toggleExpand = (row) => {
  const key = row[props.rowKey]
  if (expandedKeys.value.has(key)) {
    expandedKeys.value.delete(key)
  } else {
    expandedKeys.value.add(key)
  }
  emit('expand-change', { row, expanded: expandedKeys.value.has(key) })
}

// 行点击
const handleRowClick = (row, column, event) => {
  emit('row-click', row, column, event)
}

// 添加子节点
const handleAddChild = (parentRow) => {
  const childrenKey = props.treeProps.children || 'children'
  
  if (!parentRow[childrenKey]) {
    parentRow[childrenKey] = []
  }
  
  const newNode = {
    ...props.defaultNode,
    [props.rowKey]: `new_${Date.now()}`,
    _isNew: true,
    _parentId: parentRow[props.rowKey]
  }
  
  parentRow[childrenKey].push(newNode)
  
  // 自动展开父节点
  expandedKeys.value.add(parentRow[props.rowKey])
  
  emit('update:data', treeData.value)
  emit('add-child', { parent: parentRow, child: newNode })
  
  ElMessage.success('添加成功')
}

// 删除节点
const handleDelete = async (row, index) => {
  if (props.confirmDelete) {
    try {
      await ElMessageBox.confirm(
        hasChildren(row) ? '删除节点将同时删除其所有子节点，确定要删除吗？' : '确定要删除这个节点吗？',
        '提示',
        { type: 'warning' }
      )
    } catch {
      return
    }
  }
  
  // 递归删除节点
  const deleteNode = (nodes, targetRow) => {
    const childrenKey = props.treeProps.children || 'children'
    
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i][props.rowKey] === targetRow[props.rowKey]) {
        nodes.splice(i, 1)
        return true
      }
      
      if (nodes[i][childrenKey]) {
        if (deleteNode(nodes[i][childrenKey], targetRow)) {
          return true
        }
      }
    }
    return false
  }
  
  deleteNode(treeData.value, row)
  
  emit('update:data', treeData.value)
  emit('delete', { row, index })
  
  ElMessage.success('删除成功')
}

// 展开所有节点
const expandAll = () => {
  const collectKeys = (nodes) => {
    const childrenKey = props.treeProps.children || 'children'
    nodes.forEach(node => {
      expandedKeys.value.add(node[props.rowKey])
      if (node[childrenKey]) {
        collectKeys(node[childrenKey])
      }
    })
  }
  collectKeys(treeData.value)
}

// 收起所有节点
const collapseAll = () => {
  expandedKeys.value.clear()
}

// 展开指定节点
const expandNode = (key) => {
  expandedKeys.value.add(key)
}

// 收起指定节点
const collapseNode = (key) => {
  expandedKeys.value.delete(key)
}

// 获取所有节点（扁平化）
const getAllNodes = () => {
  const result = []
  const childrenKey = props.treeProps.children || 'children'
  
  const traverse = (nodes) => {
    nodes.forEach(node => {
      result.push(node)
      if (node[childrenKey]) {
        traverse(node[childrenKey])
      }
    })
  }
  
  traverse(treeData.value)
  return result
}

// 根据条件查找节点
const findNode = (predicate) => {
  const childrenKey = props.treeProps.children || 'children'
  
  const traverse = (nodes) => {
    for (const node of nodes) {
      if (predicate(node)) {
        return node
      }
      if (node[childrenKey]) {
        const found = traverse(node[childrenKey])
        if (found) return found
      }
    }
    return null
  }
  
  return traverse(treeData.value)
}

// 根据 key 查找节点
const getNodeByKey = (key) => {
  return findNode(node => node[props.rowKey] === key)
}

// 获取父节点
const getParentNode = (childKey) => {
  const childrenKey = props.treeProps.children || 'children'
  
  const traverse = (nodes, parent = null) => {
    for (const node of nodes) {
      if (node[props.rowKey] === childKey) {
        return parent
      }
      if (node[childrenKey]) {
        const found = traverse(node[childrenKey], node)
        if (found) return found
      }
    }
    return null
  }
  
  return traverse(treeData.value)
}

// 获取节点路径
const getNodePath = (key) => {
  const childrenKey = props.treeProps.children || 'children'
  const path = []
  
  const traverse = (nodes) => {
    for (const node of nodes) {
      path.push(node)
      if (node[props.rowKey] === key) {
        return true
      }
      if (node[childrenKey] && traverse(node[childrenKey])) {
        return true
      }
      path.pop()
    }
    return false
  }
  
  traverse(treeData.value)
  return path
}

// 暴露方法
defineExpose({
  expandAll,
  collapseAll,
  expandNode,
  collapseNode,
  getAllNodes,
  findNode,
  getNodeByKey,
  getParentNode,
  getNodePath,
  baseTableRef
})
</script>

<style scoped lang="scss">
.tree-table-wrapper {
  width: 100%;
}
</style>
