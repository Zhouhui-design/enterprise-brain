<template>
  <el-dialog v-model="dialogVisible" title="编辑菜单" width="700px">
    <el-form ref="menuForm" :model="menuForm" label-width="120px">
      <el-form-item label="菜单名称" prop="menuName">
        <el-input v-model="menuForm.menuName" placeholder="请输入菜单名称" />
      </el-form-item>
      <el-form-item label="菜单Key" prop="menuKey">
        <el-input v-model="menuForm.menuKey" placeholder="请输入菜单Key" />
      </el-form-item>
      <el-form-item label="菜单图标" prop="menuIcon">
        <el-input v-model="menuForm.menuIcon" placeholder="请输入菜单图标类名" />
      </el-form-item>
      <el-form-item label="菜单路径" prop="menuPath">
        <el-input v-model="menuForm.menuPath" placeholder="请输入菜单路径" />
      </el-form-item>
      <el-form-item label="组件路径" prop="componentPath">
        <el-input v-model="menuForm.componentPath" placeholder="请输入组件路径" />
      </el-form-item>
      <el-form-item label="排序" prop="sortOrder">
        <el-input-number v-model="menuForm.sortOrder" :min="0" />
      </el-form-item>
      <el-form-item label="是否启用">
        <el-switch v-model="menuForm.isEnabled" />
      </el-form-item>
      <el-form-item label="是否显示">
        <el-switch v-model="menuForm.isShow" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="saveMenu">保存</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { ref, reactive } from 'vue'
import axios from 'axios'

export default {
  name: 'MenuEditor',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    menuData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:visible', 'saved'],
  setup(props, { emit }) {
    const dialogVisible = ref(props.visible)
    const menuForm = reactive({
      menuName: '',
      menuKey: '',
      menuIcon: '',
      menuPath: '',
      componentPath: '',
      sortOrder: 0,
      isEnabled: true,
      isShow: true,
      parentId: null
    })
    
    const saveMenu = async () => {
      try {
        if (props.menuData.id) {
          // 更新菜单
          await axios.put(`/api/system/menu/${props.menuData.id}`, menuForm)
        } else {
          // 创建菜单
          await axios.post('/api/system/menu/create', menuForm)
        }
        emit('saved')
        dialogVisible.value = false
      } catch (error) {
        console.error('Failed to save menu:', error)
      }
    }
    
    return {
      dialogVisible,
      menuForm,
      saveMenu
    }
  },
  watch: {
    visible(newVal) {
      this.dialogVisible = newVal
      if (newVal && this.menuData) {
        this.menuForm = { ...this.menuData }
      }
    }
  }
}
</script>