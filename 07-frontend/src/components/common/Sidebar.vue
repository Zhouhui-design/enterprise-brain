<!-- 优化后的模板部分 -->
<template>
  <el-aside class="sidebar" :width="isCollapse ? '64px' : '200px'">
    <el-menu
      :default-active="currentRoute"  <!-- 动态绑定当前路由 -->
      class="sidebar-menu"
      :collapse="isCollapse"
      background-color="#0f172a"
      text-color="#fff"
      active-text-color="#1989fa"
      unique-opened  <!-- 保持只有一个子菜单展开 -->
    >
      <!-- 循环渲染有权限的菜单 -->
      <template v-for="(menu, index) in filteredMenuList" :key="menu.key">  <!-- 使用唯一key -->
        <!-- 无子女菜单 -->
        <el-menu-item
          v-if="!menu.children"
          :index="menu.path"  <!-- 使用路径作为索引更可靠 -->
          @click="goToPath(menu.path)"
        >
          <component :is="resolveIcon(menu.icon)" />  <!-- 图标解析函数 -->
          <template #title>{{ menu.name }}</template>
        </el-menu-item>

        <!-- 有子菜单 -->
        <el-sub-menu v-else :index="menu.path">
          <template #title>
            <component :is="resolveIcon(menu.icon)" />
            <span>{{ menu.name }}</span>
          </template>
          <el-menu-item
            v-for="(subMenu, subIndex) in menu.children"
            :key="subMenu.key"
            :index="subMenu.path"
            @click="goToPath(subMenu.path)"
          >
            {{ subMenu.name }}
          </el-menu-item>
        </el-sub-menu>
      </template>
    </el-menu>
    <div class="collapse-btn" @click="toggleCollapse">
      <el-icon>{{ isCollapse ? <ArrowRight /> : <ArrowLeft /> }}</el-icon>
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
// 导入所有可能用到的图标
import * as Icons from '@element-plus/icons-vue';
import menuList from '@/utils/menu.ts';
import { useUserStore } from '@/stores/user';  // 假设存在用户权限存储

const router = useRouter();
const route = useRoute();
const isCollapse = ref(false);
const userStore = useUserStore();

// 动态获取当前路由
const currentRoute = computed(() => route.path);

// 权限过滤菜单
const filteredMenuList = computed(() => {
  const hasPermission = (menu: any) => {
    // 没有权限要求的菜单默认显示
    if (!menu.permission) return true;
    // 检查用户是否有该权限
    return userStore.permissions.includes(menu.permission);
  };

  // 递归过滤菜单
  const filterMenu = (menus: any[]) => {
    return menus
      .filter(hasPermission)
      .map(menu => {
        if (menu.children) {
          return { ...menu, children: filterMenu(menu.children) };
        }
        return menu;
      })
      .filter(menu => !menu.children || menu.children.length > 0); // 过滤空的子菜单
  };

  return filterMenu(menuList);
});

// 解析图标组件
const resolveIcon = (iconName: string) => {
  if (!iconName) return null;
  return Icons[iconName as keyof typeof Icons] || null;
};

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

const goToPath = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
/* 增加菜单交互样式优化 */
.sidebar-menu {
  height: calc(100% - 40px);
  border-right: none;
}

.collapse-btn {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  border-top: 1px solid #1e293b;
}

.collapse-btn:hover {
  background-color: #1e293b;
}

/* 优化子菜单展开/折叠动画 */
::v-deep .el-sub-menu .el-sub-menu__title,
::v-deep .el-menu-item {
  transition: all 0.2s ease;
}

::v-deep .el-menu-item.is-active {
  background-color: rgba(25, 137, 250, 0.1) !important;
}
</style>
