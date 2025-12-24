<template>
  <div class="standard-table-page" :class="{
    'is-mobile': isMobile,
    'is-tablet': isTablet,
    'is-desktop': isDesktop
  }">
    <!-- 页面标题栏 -->
    <div class="page-header-bar">
      <div class="header-left">
        <h2 class="page-title">{{ pageTitle }}</h2>
        <span v-if="pageSubtitle" class="page-subtitle">{{ pageSubtitle }}</span>
      </div>
      <div class="header-right">
        <slot name="header-actions">
          <el-button v-if="showCreate" type="primary" @click="$emit('create')">
            <el-icon><Plus /></el-icon>
            新增
          </el-button>
          <el-button 
            v-if="showPageSettings" 
            @click.stop="settingsVisible = true" 
            circle
            class="page-settings-trigger"
          >
            <el-icon><Setting /></el-icon>
          </el-button>
        </slot>
      </div>
    </div>

    <!-- ✅ 面包屑导航 -->
    <BreadcrumbNav
      v-if="showBreadcrumb && breadcrumbItems.length > 0"
      :items="breadcrumbItems"
      :variant="breadcrumbVariant"
      :show-home="showBreadcrumbHome"
      class="page-breadcrumb"
    >
      <template #extra>
        <slot name="breadcrumb-extra"></slot>
      </template>
    </BreadcrumbNav>

    <!-- 搜索筛选区 -->
    <el-card v-if="showSearch" class="search-card">
      <slot name="search-form">
        <!-- 外部传入搜索表单 -->
      </slot>
    </el-card>

    <!-- 数据表格区 -->
    <el-card class="data-card">
      <!-- 工具栏（可选） -->
      <div v-if="showToolbar" class="table-toolbar">
        <div class="toolbar-left">
          <slot name="toolbar-left">
            <!-- 自定义工具栏左侧按钮，如"执行排程" -->
          </slot>
        </div>
        <div class="toolbar-right">
          <slot name="toolbar-right">
            <!-- 自定义工具栏右侧按钮 -->
          </slot>
        </div>
      </div>

      <!-- 增强表格组件 -->
      <EnhancedTable
        ref="tableRef"
        :data="computedTableData"
        :columns="visibleColumns"
        :loading="loading"
        :show-selection="showSelection"
        :show-filter="showFilter"
        :show-pagination="showPagination"
        :show-toolbar="showEnhancedToolbar"
        :show-add="showAdd"
        :show-batch-delete="showBatchDelete"
        :show-export="showExport"
        :show-import="showImport"
        :show-print="showPrint"
        :show-column-settings="showColumnSettings"
        :total="total"
        :current-page="currentPage"
        :page-size="computedPageSize"
        :height="computedTableHeight"
        @selection-change="$emit('selection-change', $event)"
        @page-change="$emit('page-change', $event)"
        @size-change="$emit('size-change', $event)"
        @add="$emit('add')"
        @batch-delete="$emit('batch-delete')"
        @export="$emit('export')"
        @import="$emit('import')"
        @refresh="handleRefresh"
      >
        <!-- 透传所有插槽 -->
        <template v-for="(_, slot) in $slots" #[slot]="scope">
          <slot :name="slot" v-bind="scope || {}"></slot>
        </template>
      </EnhancedTable>
    </el-card>

    <!-- ✅ 页面设置组件 -->
    <PageSettings
      v-model="settingsVisible"
      :settings-key="settingsKey"
      :available-fields="columns"
      :show-workflow="showWorkflowSettings"
      :show-menu="showMenuSettings"
      :show-color="showColorSettings"
      :show-encoding="showEncodingSettings"
      :show-fields="!disableColumnSettings"
      :show-print="showPrintSettings"
      :show-export="showExportSettings"
      :show-business-vars="showBusinessVars"
      :business-var-buttons="businessVarButtons"
      :business-var-selects="businessVarSelects"
      :default-settings="defaultSettings"
      @save="handleSettingsSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus, Setting } from '@element-plus/icons-vue'
import EnhancedTable from '@/components/common/EnhancedTable.vue'
import PageSettings from '@/components/common/PageSettings.vue'
import BreadcrumbNav from './BreadcrumbNav.vue'
import { ElMessage } from 'element-plus'
import { useResponsive } from '@/composables/useResponsive'

/**
 * 标准表格页面组件 v2.1
 * 用于ERP系统中所有表格类页面，确保统一风格和功能
 * 
 * 功能特点：
 * 1. 统一的页面布局结构
 * 2. 集成EnhancedTable组件
 * 3. 集成PageSettings组件（支持列拖拽）
 * 4. ✅ 面包屑导航集成
 * 5. ✅ 响应式断点系统
 * 6. ✅ 键盘导航支持
 * 7. ✅ 点击外部关闭
 * 8. 避免重复按钮和功能
 * 9. 标准化的搜索、工具栏、表格区域
 * 
 * 更新记录：
 * - v2.1 (2025-12-08): 集成面包屑导航、响应式断点、键盘导航、点击外部关闭
 * - v2.0 (2025-12-08): 集成PageSettings组件，支持列拖拽、业务变量设置
 * - v1.0: 初始版本
 */

const props = defineProps({
  // ========== 页面基础配置 ==========
  /** 页面标题 */
  pageTitle: {
    type: String,
    required: true
  },
  /** 页面副标题 */
  pageSubtitle: {
    type: String,
    default: ''
  },

  // ========== 功能开关 ==========
  /** 显示搜索区域 */
  showSearch: {
    type: Boolean,
    default: true
  },
  /** 显示工具栏 */
  showToolbar: {
    type: Boolean,
    default: false  // 默认不显示，避免与EnhancedTable工具栏重复
  },
  /** 显示新增按钮（页面右上角） */
  showCreate: {
    type: Boolean,
    default: false
  },
  /** 显示页面设置按钮 */
  showPageSettings: {
    type: Boolean,
    default: true
  },

  // ========== EnhancedTable 配置 ==========
  /** 表格数据 */
  tableData: {
    type: Array,
    required: false,
    default: () => []
  },
  /** 列配置 */
  columns: {
    type: Array,
    required: false,
    default: () => []
  },
  /** 加载状态 */
  loading: {
    type: Boolean,
    default: false
  },
  /** 显示多选框 */
  showSelection: {
    type: Boolean,
    default: true
  },
  /** 显示表头筛选 */
  showFilter: {
    type: Boolean,
    default: true
  },
  /** 显示分页 */
  showPagination: {
    type: Boolean,
    default: true
  },
  /** 显示EnhancedTable内置工具栏 */
  showEnhancedToolbar: {
    type: Boolean,
    default: true  // 默认使用内置工具栏
  },
  
  // ========== EnhancedTable 工具栏按钮 ==========
  /** 显示新增按钮（EnhancedTable工具栏） */
  showAdd: {
    type: Boolean,
    default: false
  },
  /** 显示批量删除按钮 */
  showBatchDelete: {
    type: Boolean,
    default: true
  },
  /** 显示导出按钮 */
  showExport: {
    type: Boolean,
    default: true
  },
  /** 显示导入按钮 */
  showImport: {
    type: Boolean,
    default: true
  },
  /** 显示打印按钮 */
  showPrint: {
    type: Boolean,
    default: false
  },
  /** 显示列设置按钮（EnhancedTable工具栏）*/
  showColumnSettings: {
    type: Boolean,
    default: true
  },

  // ========== 分页配置 ==========
  /** 总记录数 */
  total: {
    type: Number,
    default: 0
  },
  /** 当前页码 */
  currentPage: {
    type: Number,
    default: 1
  },
  /** 每页条数 */
  pageSize: {
    type: Number,
    default: 20
  },
  /** 表格高度 */
  tableHeight: {
    type: String,
    default: 'calc(100vh - 320px)'
  },

  // ========== 页面设置配置 ==========
  /** 设置存储键名 */
  settingsKey: {
    type: String,
    required: true
  },
  /** 显示流程设置 */
  showWorkflowSettings: {
    type: Boolean,
    default: true
  },
  /** 显示菜单设置 */
  showMenuSettings: {
    type: Boolean,
    default: false
  },
  /** 显示颜色设置 */
  showColorSettings: {
    type: Boolean,
    default: true
  },
  /** 显示编码设置 */
  showEncodingSettings: {
    type: Boolean,
    default: true
  },
  /** 显示打印设置 */
  showPrintSettings: {
    type: Boolean,
    default: true
  },
  /** 显示导出设置 */
  showExportSettings: {
    type: Boolean,
    default: true
  },
  /** 显示业务变量 */
  showBusinessVars: {
    type: Boolean,
    default: false
  },
  /** 业务变量 - 按钮配置 */
  businessVarButtons: {
    type: Array,
    default: () => []
  },
  /** 业务变量 - 下拉选择配置 */
  businessVarSelects: {
    type: Array,
    default: () => []
  },
  /** 禁用列设置按钮 */
  disableColumnSettings: {
    type: Boolean,
    default: false
  },
  /** 默认设置 */
  defaultSettings: {
    type: Object,
    default: () => ({})
  },

  // ========== 面包屑导航配置 ==========
  /** 显示面包屑导航 */
  showBreadcrumb: {
    type: Boolean,
    default: true
  },
  /** 面包屑导航项 */
  breadcrumbItems: {
    type: Array,
    default: () => []
  },
  /** 显示面包屑首页 */
  showBreadcrumbHome: {
    type: Boolean,
    default: true
  },
  /** 面包屑变体 */
  breadcrumbVariant: {
    type: String,
    default: 'minimal' // 'default' | 'minimal' | 'detailed'
  }
})

const emit = defineEmits([
  'create',
  'open-settings',
  'selection-change',
  'page-change',
  'size-change',
  'add',
  'batch-delete',
  'export',
  'import',
  'refresh',
  'settings-save',
  'keyboard-search',  // ✅ 键盘搜索
  'keyboard-add'      // ✅ 键盘新增
])

// ✅ 响应式断点系统
const { isMobile, isTablet, isDesktop } = useResponsive()

// ✅ 页面设置状态
const settingsVisible = ref(false)

// ✅ 响应式表格数据（确保响应性）
const computedTableData = computed(() => {
  console.log('🔄 computedTableData 被重新计算, 数量:', props.tableData?.length)
  return props.tableData || []
})

// ✅ 可见列（根据设置过滤）
// 注意：使用 computed 而不是 ref，以便响应 props.columns 的变化
const visibleColumns = computed(() => {
  return (props.columns || []).filter(col => col.visible !== false)
})

// ✅ 响应式表格高度
const computedTableHeight = computed(() => {
  if (props.tableHeight) return props.tableHeight
  if (isMobile.value) return 'calc(100vh - 400px)'
  if (isTablet.value) return 'calc(100vh - 350px)'
  return 'calc(100vh - 320px)'
})

// ✅ 响应式分页大小
const computedPageSize = computed(() => {
  if (props.pageSize) return props.pageSize
  if (isMobile.value) return 10
  if (isTablet.value) return 15
  return 20
})

// ✅ 处理设置保存
const handleSettingsSave = (settings) => {
  console.log('✅ StandardTablePage: 页面设置已保存', settings)
  
  // 发送设置到父组件，由父组件处理列的更新
  emit('settings-save', settings)
  
  // 注意：不在这里显示 ElMessage，由父组件显示
}

// ✅ 处理刷新
const handleRefresh = () => {
  emit('refresh')
  ElMessage.success('刷新成功')
}

// ✅ 键盘导航处理
const handleKeyDown = (event) => {
  // ESC 关闭设置弹窗
  if (event.key === 'Escape') {
    if (settingsVisible.value) {
      settingsVisible.value = false
      console.log('✅ 键盘导航: ESC 关闭设置弹窗')
    }
  }
  
  // Ctrl+F 聚焦搜索
  if (event.ctrlKey && event.key === 'f') {
    event.preventDefault()
    emit('keyboard-search')
    console.log('✅ 键盘导航: Ctrl+F 触发搜索')
  }
  
  // Ctrl+N 新增
  if (event.ctrlKey && event.key === 'n') {
    event.preventDefault()
    emit('keyboard-add')
    console.log('✅ 键盘导航: Ctrl+N 触发新增')
  }
}

// ✅ 点击外部关闭设置弹窗
const handleClickOutside = (event) => {
  // 如果弹窗不可见，直接返回
  if (!settingsVisible.value) return
  
  const target = event.target
  
  // ✅ 重要：排除页面设置按钮本身和弹窗内容
  const isSettingsButton = target.closest('.header-right') || 
                         target.closest('.page-settings-trigger') ||
                         target.closest('button')?.querySelector('.el-icon') ||
                         target.tagName === 'svg' || 
                         target.tagName === 'path'
  
  const isSettingsDialog = target.closest('.el-dialog') || 
                          target.closest('.el-dialog__wrapper') ||
                          target.closest('.page-settings')
  
  // 如果点击的是设置按钮或弹窗内部，不关闭
  if (isSettingsButton || isSettingsDialog) {
    return
  }
  
  // 否则关闭弹窗
  settingsVisible.value = false
  console.log('✅ 点击外部关闭: 设置弹窗已关闭')
}

// ✅ 生命周期：挂载事件监听器
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('click', handleClickOutside)
  console.log('✅ StandardTablePage v2.1: 键盘导航和点击外部关闭已激活')
  console.log('📋 StandardTablePage 接收到的 tableData:', props.tableData)
  console.log('📋 tableData 数量:', props.tableData?.length)
})

// ✅ 生命周期：清理事件监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', handleClickOutside)
  console.log('✅ StandardTablePage v2.1: 事件监听器已清理')
})

// 暴露表格ref，供父组件调用表格方法
const tableRef = ref(null)

defineExpose({
  tableRef,
  settingsVisible
})
</script>

<style scoped>
.standard-table-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* ✅ 响应式样式调整 */
.is-mobile .page-header-bar {
  padding: 12px 16px;
}

.is-mobile .page-title {
  font-size: 18px;
}

.is-mobile .search-card {
  margin-bottom: 16px;
}

.is-mobile .search-card :deep(.el-card__body) {
  padding: 12px;
}

.is-tablet .page-header-bar {
  padding: 14px 18px;
}

.is-tablet .page-title {
  font-size: 19px;
}

/* 页面标题栏 */
.page-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* ✅ 面包屑导航样式 */
.page-breadcrumb {
  margin-bottom: 16px;
}

.is-mobile .page-breadcrumb {
  margin-bottom: 12px;
}

/* 搜索卡片 */
.search-card {
  margin-bottom: 20px;
}

.search-card :deep(.el-card__body) {
  padding: 16px 20px;
}

/* 数据卡片 */
.data-card {
  margin-bottom: 20px;
}

.data-card :deep(.el-card__body) {
  padding: 20px;
}

/* 自定义工具栏 */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
