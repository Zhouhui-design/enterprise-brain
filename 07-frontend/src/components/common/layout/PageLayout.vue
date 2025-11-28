<template>
  <div class="page-layout" :class="layoutClasses">
    <slot name="header">
      <PageHeader v-if="showHeader" :title="title" :subtitle="subtitle">
        <template #actions>
          <slot name="header-actions"></slot>
        </template>
      </PageHeader>
    </slot>

    <div class="page-layout__content" :class="contentClasses">
      <slot name="sidebar">
        <SidebarMenu v-if="showSidebar" :menuItems="menuItems" :collapsed="sidebarCollapsed" />
      </slot>
      
      <main class="page-layout__main" :class="mainClasses">
        <slot name="breadcrumb">
          <BreadcrumbNav v-if="showBreadcrumb" :items="breadcrumbItems" />
        </slot>
        
        <div class="page-layout__body">
          <slot></slot>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from './PageHeader.vue'
import SidebarMenu from './SidebarMenu.vue'
import BreadcrumbNav from './BreadcrumbNav.vue'

interface MenuItem {
  id: string
  label: string
  icon?: string
  path?: string
  children?: MenuItem[]
}

interface BreadcrumbItem {
  label: string
  path?: string
}

interface Props {
  title?: string
  subtitle?: string
  showHeader?: boolean
  showSidebar?: boolean
  showBreadcrumb?: boolean
  sidebarCollapsed?: boolean
  menuItems?: MenuItem[]
  breadcrumbItems?: BreadcrumbItem[]
  layoutVariant?: 'default' | 'fluid' | 'compact' | 'wide'
}

const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  showSidebar: false,
  showBreadcrumb: true,
  sidebarCollapsed: false,
  menuItems: () => [],
  breadcrumbItems: () => [],
  layoutVariant: 'default'
})

const layoutClasses = computed(() => [
  `page-layout--${props.layoutVariant}`,
  {
    'page-layout--with-sidebar': props.showSidebar,
    'page-layout--sidebar-collapsed': props.sidebarCollapsed
  }
])

const contentClasses = computed(() => [
  'page-layout__content-wrapper',
  {
    'page-layout__content-wrapper--with-sidebar': props.showSidebar
  }
])

const mainClasses = computed(() => [
  'page-layout__main-content',
  {
    'page-layout__main-content--with-sidebar': props.showSidebar
  }
])
</script>

<style scoped>
.page-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  font-family: 'Space Mono', monospace;
  color: #1a202c;
}

.page-layout--fluid {
  max-width: none;
}

.page-layout--compact {
  max-width: 1200px;
  margin: 0 auto;
}

.page-layout--wide {
  max-width: 1400px;
  margin: 0 auto;
}

.page-layout--default {
  max-width: 1280px;
  margin: 0 auto;
}

.page-layout__content-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-layout__content-wrapper--with-sidebar {
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  padding: 0 2rem;
}

.page-layout--sidebar-collapsed .page-layout__content-wrapper--with-sidebar {
  grid-template-columns: 80px 1fr;
  gap: 1rem;
}

.page-layout__main-content {
  padding: 2rem 0;
  min-height: calc(100vh - 200px);
}

.page-layout__main-content--with-sidebar {
  padding: 2rem 0 2rem 1rem;
}

.page-layout__body {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 
    0 4px 6px -1px rgba(45, 55, 72, 0.1),
    0 2px 4px -1px rgba(45, 55, 72, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(237, 137, 54, 0.1);
  position: relative;
  overflow: hidden;
}

.page-layout__body::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ed8936 0%, #38b2ac 100%);
  opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .page-layout__content-wrapper--with-sidebar {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 0 1rem;
  }
  
  .page-layout__main-content--with-sidebar {
    padding: 2rem 0;
  }
}

@media (max-width: 640px) {
  .page-layout__main-content {
    padding: 1rem 0;
  }
  
  .page-layout__body {
    padding: 1.5rem;
    border-radius: 8px;
  }
}
</style>