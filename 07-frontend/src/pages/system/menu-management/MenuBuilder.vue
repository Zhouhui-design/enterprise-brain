<template>
  <div class="menu-builder-container">
    <el-card shadow="never" class="menu-builder-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">菜单管理</span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              icon="Plus" 
              size="small"
              @click="handleAddMenu"
              :disabled="!hasCreatePermission"
            >
              新增根菜单
            </el-button>
            <el-button 
              type="success" 
              icon="Refresh" 
              size="small"
              @click="refreshTree"
              :loading="loading"
            >
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-input
              v-model="searchQuery"
              placeholder="搜索菜单名称、路径、权限码"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="statusFilter"
              placeholder="状态筛选"
              clearable
              @change="handleFilter"
            >
              <el-option label="全部" value="" />
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="levelFilter"
              placeholder="层级筛选"
              clearable
              @change="handleFilter"
            >
              <el-option label="全部" value="" />
              <el-option label="一级菜单" value="1" />
              <el-option label="二级菜单" value="2" />
              <el-option label="三级菜单" value="3" />
            </el-select>
          </el-col>
        </el-row>
      </div>
      
      <!-- 菜单树形结构 -->
      <div class="menu-tree-container">
        <el-tree
          ref="menuTree"
          :data="filteredMenuData"
          :props="defaultProps"
          :expand-on-click-node="false"
          :default-expand-all="false"
          :filter-node-method="filterNode"
          @node-click="handleNodeClick"
          @node-contextmenu="handleContextMenu"
          class="custom-tree"
          node-key="id"
          :highlight-current="true"
        >
          <template #default="{ node, data }">
            <div class="tree-node-content" @click.stop>
              <span class="menu-icon" v-if="data.menuIcon">
                <el-icon :class="data.menuIcon"></el-icon>
              </span>
              <span class="menu-name">{{ data.menuName }}</span>
              <span class="menu-path" v-if="data.menuPath">{{ data.menuPath }}</span>
              <span class="menu-code" v-if="data.permissionCode">{{ data.permissionCode }}</span>
              <span class="menu-level-badge" :class="`level-${data.menuLevel}`">
                L{{ data.menuLevel }}
              </span>
              <span 
                class="menu-status" 
                :class="{ 'enabled': data.isEnabled, 'disabled': !data.isEnabled }"
              >
                {{ data.isEnabled ? '启用' : '禁用' }}
              </span>
              <span class="menu-actions" v-if="showActions" @click.stop>
                <el-button
                  type="text"
                  size="small"
                  icon="Plus"
                  @click="handleAddChildMenu(data)"
                  :disabled="!hasCreatePermission"
                  title="添加子菜单"
                />
                <el-button
                  type="text"
                  size="small"
                  icon="Edit"
                  @click="handleEditMenu(data)"
                  :disabled="!hasUpdatePermission"
                  title="编辑"
                />
                <el-button
                  type="text"
                  size="small"
                  icon="Delete"
                  @click="handleDeleteMenu(data)"
                  :disabled="!hasDeletePermission"
                  title="删除"
                />
              </span>
            </div>
          </template>
        </el-tree>
      </div>
      
      <!-- 统计信息 -->
      <div class="statistics-bar">
        <el-descriptions :column="4" size="small">
          <el-descriptions-item label="总菜单数">
            <el-tag type="info">{{ totalCount }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="启用菜单">
            <el-tag type="success">{{ enabledCount }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="禁用菜单">
            <el-tag type="danger">{{ disabledCount }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最大层级">
            <el-tag type="warning">{{ maxLevel }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
    
    <!-- 右键菜单 -->
    <el-dropdown
      ref="contextMenu"
      trigger="contextmenu"
      :style="contextMenuStyle"
      @command="handleContextMenuCommand"
    >
      <span class="context-menu-trigger"></span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="add" :disabled="!hasCreatePermission">
            <el-icon><Plus /></el-icon> 新增子菜单
          </el-dropdown-item>
          <el-dropdown-item command="edit" :disabled="!hasUpdatePermission">
            <el-icon><Edit /></el-icon> 编辑菜单
          </el-dropdown-item>
          <el-dropdown-item command="delete" :disabled="!hasDeletePermission">
            <el-icon><Delete /></el-icon> 删除菜单
          </el-dropdown-item>
          <el-dropdown-item 
            command="toggleStatus" 
            :disabled="!hasUpdatePermission"
          >
            <el-icon><Switch /></el-icon>
            {{ selectedMenu?.isEnabled ? '禁用菜单' : '启用菜单' }}
          </el-dropdown-item>
          <el-dropdown-item command="copy" :disabled="!hasCreatePermission">
            <el-icon><CopyDocument /></el-icon> 复制菜单
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    
    <!-- 菜单编辑器对话框 -->
    <menu-editor
      v-model:visible="editorVisible"
      :menu-data="selectedMenu"
      :parent-menu="parentMenu"
      @saved="handleMenuSaved"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Plus, Edit, Delete, Search, Switch, CopyDocument } from '@element-plus/icons-vue'
import { systemApi } from '@/services'
import MenuEditor from '../components/MenuEditor.vue'

// 响应式数据
const menuTree = ref(null)
const contextMenu = ref(null)
const menuTreeData = ref([])
const selectedMenu = ref(null)
const parentMenu = ref(null)
const editorVisible = ref(false)
const loading = ref(false)
const showActions = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const levelFilter = ref('')

// 权限控制
const hasCreatePermission = computed(() => {
  return hasPermission('SYSTEM:MENU:CREATE')
})

const hasUpdatePermission = computed(() => {
  return hasPermission('SYSTEM:MENU:UPDATE')
})

const hasDeletePermission = computed(() => {
  return hasPermission('SYSTEM:MENU:DELETE')
})

// 菜单树配置
const defaultProps = {
  children: 'children',
  label: 'menuName'
}

// 右键菜单样式
const contextMenuStyle = reactive({
  position: 'absolute',
  left: '0px',
  top: '0px',
  display: 'none',
  zIndex: 9999
})

// 过滤后的菜单数据
const filteredMenuData = ref([])

// 统计信息
const totalCount = computed(() => {
  return countMenus(menuTreeData.value)
})

const enabledCount = computed(() => {
  return countMenus(menuTreeData.value, true)
})

const disabledCount = computed(() => {
  return countMenus(menuTreeData.value, false)
})

const maxLevel = computed(() => {
  return getMaxLevel(menuTreeData.value)
})

// 加载菜单树数据
const loadMenuTree = async () => {
  loading.value = true
  try {
    const response = await systemApi.menu.getTree()
    menuTreeData.value = response.data || []
    filteredMenuData.value = [...menuTreeData.value]
  } catch (error) {
    ElMessage.error('加载菜单失败: ' + (error.message || '未知错误'))
    console.error('Failed to load menu tree:', error)
  } finally {
    loading.value = false
  }
}

// 计算菜单数量
const countMenus = (menus, enabled = null) => {
  let count = 0
  const countRecursive = (items) => {
    items.forEach(item => {
      if (enabled === null || item.isEnabled === enabled) {
        count++
      }
      if (item.children && item.children.length > 0) {
        countRecursive(item.children)
      }
    })
  }
  countRecursive(menus)
  return count
}

// 获取最大层级
const getMaxLevel = (menus, currentLevel = 1) => {
  let max = currentLevel
  menus.forEach(menu => {
    if (menu.children && menu.children.length > 0) {
      const childMax = getMaxLevel(menu.children, currentLevel + 1)
      max = Math.max(max, childMax)
    }
  })
  return max
}

// 搜索功能
const handleSearch = (value) => {
  if (menuTree.value) {
    menuTree.value.filter(value)
  }
}

// 节点过滤
const filterNode = (value, data) => {
  if (!value) return true
  
  const searchTerm = value.toLowerCase()
  return (
    data.menuName.toLowerCase().includes(searchTerm) ||
    (data.menuPath && data.menuPath.toLowerCase().includes(searchTerm)) ||
    (data.permissionCode && data.permissionCode.toLowerCase().includes(searchTerm))
  )
}

// 筛选功能
const handleFilter = () => {
  let filtered = [...menuTreeData.value]
  
  if (statusFilter.value) {
    const enabled = statusFilter.value === 'enabled'
    filtered = filterByStatus(filtered, enabled)
  }
  
  if (levelFilter.value) {
    const level = parseInt(levelFilter.value)
    filtered = filterByLevel(filtered, level)
  }
  
  filteredMenuData.value = filtered
}

// 按状态筛选
const filterByStatus = (menus, enabled) => {
  const result = []
  menus.forEach(menu => {
    if (menu.isEnabled === enabled) {
      const filteredMenu = { ...menu }
      if (menu.children && menu.children.length > 0) {
        filteredMenu.children = filterByStatus(menu.children, enabled)
      }
      result.push(filteredMenu)
    }
  })
  return result
}

// 按层级筛选
const filterByLevel = (menus, targetLevel) => {
  const result = []
  menus.forEach(menu => {
    if (menu.menuLevel === targetLevel) {
      result.push(menu)
    }
    if (menu.children && menu.children.length > 0) {
      result.push(...filterByLevel(menu.children, targetLevel))
    }
  })
  return result
}

// 刷新树
const refreshTree = () => {
  loadMenuTree()
  ElNotification({
    title: '刷新成功',
    message: '菜单数据已更新',
    type: 'success',
    duration: 2000
  })
}

// 处理添加根菜单
const handleAddMenu = () => {
  selectedMenu.value = null
  parentMenu.value = null
  editorVisible.value = true
}

// 处理添加子菜单
const handleAddChildMenu = (parentData) => {
  selectedMenu.value = {
    parentId: parentData.id,
    menuLevel: (parentData.menuLevel || 0) + 1,
    parentName: parentData.menuName
  }
  parentMenu.value = parentData
  editorVisible.value = true
}

// 处理编辑菜单
const handleEditMenu = (menuData) => {
  selectedMenu.value = { ...menuData }
  parentMenu.value = null
  editorVisible.value = true
}

// 处理节点点击
const handleNodeClick = (data) => {
  selectedMenu.value = data
  showActions.value = true
}

// 处理右键菜单
const handleContextMenu = (event, data) => {
  event.preventDefault()
  event.stopPropagation()
  
  selectedMenu.value = data
  parentMenu.value = null
  
  // 显示右键菜单
  contextMenuStyle.left = event.clientX + 'px'
  contextMenuStyle.top = event.clientY + 'px'
  contextMenuStyle.display = 'block'
  
  nextTick(() => {
    contextMenu.value.handleOpen()
  })
  
  // 点击其他区域关闭右键菜单
  const closeContextMenu = (e) => {
    if (!e.target.closest('.el-dropdown')) {
      contextMenuStyle.display = 'none'
      document.removeEventListener('click', closeContextMenu)
    }
  }
  
  setTimeout(() => {
    document.addEventListener('click', closeContextMenu)
  }, 0)
}

// 处理右键菜单命令
const handleContextMenuCommand = async (command) => {
  contextMenuStyle.display = 'none'
  
  switch (command) {
    case 'add':
      handleAddChildMenu(selectedMenu.value)
      break
    case 'edit':
      handleEditMenu(selectedMenu.value)
      break
    case 'delete':
      handleDeleteMenu(selectedMenu.value)
      break
    case 'toggleStatus':
      await handleToggleStatus(selectedMenu.value)
      break
    case 'copy':
      handleCopyMenu(selectedMenu.value)
      break
  }
}

// 删除菜单
const handleDeleteMenu = async (menuData) => {
  try {
    // 检查是否有子菜单
    if (menuData.children && menuData.children.length > 0) {
      ElMessage.warning('请先删除子菜单')
      return
    }
    
    await ElMessageBox.confirm(
      `确定要删除菜单"${menuData.menuName}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await systemApi.menu.delete(menuData.id)
    ElMessage.success('删除成功')
    await loadMenuTree()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 切换菜单状态
const handleToggleStatus = async (menuData) => {
  try {
    const newStatus = !menuData.isEnabled
    const action = newStatus ? '启用' : '禁用'
    
    await ElMessageBox.confirm(
      `确定要${action}菜单"${menuData.menuName}"吗？`,
      `确认${action}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await systemApi.menu.updateStatus(menuData.id, newStatus)
    ElMessage.success(`${action}成功`)
    await loadMenuTree()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

// 复制菜单
const handleCopyMenu = async (menuData) => {
  try {
    const copiedMenu = {
      ...menuData,
      id: undefined,
      menuName: `${menuData.menuName} (副本)`,
      sortOrder: (menuData.sortOrder || 0) + 1
    }
    
    selectedMenu.value = copiedMenu
    parentMenu.value = null
    editorVisible.value = true
  } catch (error) {
    ElMessage.error('复制菜单失败')
  }
}

// 菜单保存成功后的回调
const handleMenuSaved = () => {
  ElMessage.success('保存成功')
  loadMenuTree()
  selectedMenu.value = null
  parentMenu.value = null
}

// 权限检查辅助函数
const hasPermission = (permission) => {
  // 这里应该从store或auth服务获取用户权限
  const userPermissions = ['SYSTEM:MENU:VIEW', 'SYSTEM:MENU:CREATE', 'SYSTEM:MENU:UPDATE', 'SYSTEM:MENU:DELETE']
  return userPermissions.includes(permission)
}

// 监听搜索和筛选变化
watch([searchQuery, statusFilter, levelFilter], () => {
  handleFilter()
})

onMounted(() => {
  loadMenuTree()
  
  // 监听ESC键关闭右键菜单
  const handleEscKey = (e) => {
    if (e.key === 'Escape') {
      contextMenuStyle.display = 'none'
    }
  }
  document.addEventListener('keydown', handleEscKey)
})
</script>

<style scoped>
.menu-builder-container {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}

.menu-builder-card {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.search-bar {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 6px;
}

.menu-tree-container {
  max-height: 600px;
  overflow-y: auto;
  padding: 10px 0;
  background-color: white;
  border-radius: 6px;
}

.custom-tree {
  background: transparent;
}

.tree-node-content {
  display: flex;
  align-items: center;
  padding: 8px 0;
  min-height: 40px;
  position: relative;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.tree-node-content:hover {
  background-color: #f5f7fa;
  padding-left: 8px;
  margin-left: -8px;
}

.menu-icon {
  margin-right: 8px;
  color: #606266;
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.menu-name {
  flex: 1;
  font-weight: 500;
  color: #303133;
  margin-right: 8px;
}

.menu-path {
  margin: 0 8px;
  padding: 2px 8px;
  background-color: #ecf5ff;
  color: #409eff;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
  font-family: 'Monaco', 'Menlo', monospace;
}

.menu-code {
  margin: 0 8px;
  padding: 2px 8px;
  background-color: #f0f9eb;
  color: #67c23a;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
  font-family: 'Monaco', 'Menlo', monospace;
}

.menu-level-badge {
  margin: 0 8px;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.menu-level-badge.level-1 {
  background-color: #e1f3d8;
  color: #67c23a;
}

.menu-level-badge.level-2 {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.menu-level-badge.level-3 {
  background-color: #fde2e2;
  color: #f56c6c;
}

.menu-status {
  margin: 0 8px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  font-weight: 500;
}

.menu-status.enabled {
  background-color: #f0f9eb;
  color: #67c23a;
}

.menu-status.disabled {
  background-color: #fef0f0;
  color: #f56c6c;
}

.menu-actions {
  display: none;
  gap: 4px;
  margin-left: 8px;
}

.tree-node-content:hover .menu-actions {
  display: flex;
}

.statistics-bar {
  margin-top: 20px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 6px;
  border-top: 2px solid #409eff;
}

.context-menu-trigger {
  width: 1px;
  height: 1px;
  opacity: 0;
  position: absolute;
}

/* 滚动条样式 */
.menu-tree-container::-webkit-scrollbar {
  width: 6px;
}

.menu-tree-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.menu-tree-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.menu-tree-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menu-builder-container {
    padding: 12px;
  }
  
  .search-bar .el-row {
    --el-row-gutter: 8px;
  }
  
  .tree-node-content {
    flex-wrap: wrap;
  }
  
  .menu-path,
  .menu-code,
  .menu-level-badge {
    margin: 2px 4px;
  }
}
</style>