<template>
  <div class="permission-manager">
    <el-tree
      :data="permissionTree"
      :props="treeProps"
      :checked-keys="checkedPermissions"
      show-checkbox
      node-key="id"
      @check-change="handleCheckChange"
    ></el-tree>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { defineProps, defineEmits } from 'vue'
import { getPermissionTree } from '@/services/api/permissionService'

// 定义 props
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

// 定义事件
const emit = defineEmits(['update:modelValue'])

const permissionTree = ref([])
const checkedPermissions = ref([])
const treeProps = {
  label: 'name',
  children: 'children'
}

// 加载权限树
const loadPermissionTree = async () => {
  try {
    const res = await getPermissionTree()
    permissionTree.value = res.data
  } catch (err) {
    console.error('获取权限树失败:', err)
  }
}

// 初始化
onMounted(() => {
  loadPermissionTree()
  checkedPermissions.value = props.modelValue
})

// 处理勾选变化
const handleCheckChange = (data, checked, indeterminate) => {
  emit('update:modelValue', checkedPermissions.value)
}

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  checkedPermissions.value = newVal
})
</script>

<style scoped>
.permission-manager {
  margin-top: 10px;
}
</style>
