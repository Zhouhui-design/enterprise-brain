<template>
  <el-select
    v-model="selectedRoles"
    multiple
    filterable
    clearable
    placeholder="请选择角色"
    style="width: 100%"
  >
    <el-option
      v-for="role in roleList"
      :key="role.id"
      :label="role.roleName"
      :value="role.id"
    ></el-option>
  </el-select>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { defineProps, defineEmits } from 'vue'
import { getRoleList } from '@/services/api/roleService'

// 定义 props
const props = defineProps({
  modelValue: {
    type: [Array, Number, String],
    default: () => []
  },
  multiple: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['update:modelValue'])

const selectedRoles = ref([])
const roleList = ref([])

// 加载角色列表
const loadRoleList = async () => {
  try {
    const res = await getRoleList()
    roleList.value = res.data
  } catch (err) {
    console.error('获取角色列表失败:', err)
  }
}

// 初始化
onMounted(() => {
  loadRoleList()
  selectedRoles.value = props.modelValue
})

// 监听选中值变化
watch(selectedRoles, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  selectedRoles.value = newVal
})
</script>
