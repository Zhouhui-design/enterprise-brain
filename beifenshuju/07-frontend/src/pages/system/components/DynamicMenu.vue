<template>
  <el-menu :default-active="activeMenu" class="dynamic-menu" router>
    <template v-for="menu in menus" :key="menu.id">
      <el-submenu v-if="menu.children && menu.children.length > 0" :index="menu.menuPath">
        <template #title>
          <i :class="menu.menuIcon"></i>
          <span>{{ menu.menuName }}</span>
        </template>
        <template v-for="subMenu in menu.children" :key="subMenu.id">
          <el-menu-item :index="subMenu.menuPath" v-if="!subMenu.children || subMenu.children.length === 0">
            <i :class="subMenu.menuIcon"></i>
            <span>{{ subMenu.menuName }}</span>
          </el-menu-item>
        </template>
      </el-submenu>
      <el-menu-item v-else :index="menu.menuPath">
        <i :class="menu.menuIcon"></i>
        <span>{{ menu.menuName }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

export default {
  name: 'DynamicMenu',
  props: {
    userId: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    const menus = ref([])
    
    const activeMenu = computed(() => {
      return route.path || '/'
    })
    
    const loadMenus = async () => {
      try {
        const response = await axios.get(`/api/system/menu/tree/user/${props.userId}`)
        menus.value = response.data
      } catch (error) {
        console.error('Failed to load menus:', error)
      }
    }
    
    onMounted(() => {
      loadMenus()
    })
    
    return {
      menus,
      activeMenu
    }
  }
}
</script>

<style scoped>
.dynamic-menu {
  height: 100%;
  border-right: none;
}
</style>