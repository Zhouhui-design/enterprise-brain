<template>
  <div class="menu-preview">
    <h3>菜单预览</h3>
    <el-menu :default-active="activePath" class="preview-menu" mode="horizontal">
      <template v-for="menu in previewMenus" :key="menu.id">
        <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.menuPath">
          <template #title>{{ menu.menuName }}</template>
          <template v-for="subMenu in menu.children" :key="subMenu.id">
            <el-menu-item :index="subMenu.menuPath">{{ subMenu.menuName }}</el-menu-item>
          </template>
        </el-sub-menu>
        <el-menu-item v-else :index="menu.menuPath">{{ menu.menuName }}</el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: 'MenuPreview',
  props: {
    userId: {
      type: Number,
      default: 1 // 默认用户ID
    }
  },
  setup(props) {
    const previewMenus = ref([])
    const activePath = ref('/')
    
    const loadPreviewMenus = async () => {
      try {
        const response = await axios.get(`/api/system/menu/tree/user/${props.userId}`)
        previewMenus.value = response.data
      } catch (error) {
        console.error('Failed to load preview menus:', error)
      }
    }
    
    onMounted(() => {
      loadPreviewMenus()
    })
    
    return {
      previewMenus,
      activePath
    }
  }
}
</script>

<style scoped>
.menu-preview {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-menu {
  background: transparent;
}
</style>