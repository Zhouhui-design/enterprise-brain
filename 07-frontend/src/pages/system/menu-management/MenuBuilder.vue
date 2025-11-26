<template>
  <div class="menu-builder-container">
    <el-card shadow="never" class="menu-builder-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">菜单管理</span>
          <el-button 
            type="primary" 
            icon="el-icon-plus" 
            size="small"
            @click="handleAddMenu"
            :disabled="!hasCreatePermission"
          >
            新增菜单
          </el-button>
        </div>
      </template>
      
      <!-- 菜单树形结构 -->
      <div class="menu-tree-container">
        <el-tree
          ref="menuTree"
          :data="menuTreeData"
          :props="defaultProps"
          :expand-on-click-node="false"
          @node-click="handleNodeClick"
          @node-contextmenu="handleContextMenu"
          class="custom-tree"
        >
          <template #default="{ node, data }">
            <div class="tree-node-content">
              <span class="menu-icon" v-if="data.menuIcon">
                <i :class="data.menuIcon"></i>
              </span>
              <span class="menu-name">{{ data.menuName }}</span>
              <span class="menu-path">{{ data.menuPath }}</span>
              <span class="menu-status" :class="{ 'enabled': data.isEnabled, 'disabled': !data.isEnabled }">
                {{ data.isEnabled ? '启用' : '禁用' }}
              </span>
            </div>
          </template>
        </el-tree>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next, jumper"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 右键菜单 -->
    <el-dropdown
      ref="contextMenu"
      trigger="click"
      :style="contextMenuStyle"
      @command="handleContextMenuCommand"
    >
      <span class="context-menu-trigger"></span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="add" :disabled="!hasCreatePermission">
            <i class="el-icon-plus"></i> 新增子菜单
          </el-dropdown-item>
          <el-dropdown-item command="edit" :disabled="!hasUpdatePermission">
            <i class="el-icon-edit"></i> 编辑菜单
          </el-dropdown-item>
          <el-dropdown-item command="delete" :disabled="!hasDeletePermission">
            <i class="el-icon-delete"></i> 删除菜单
          </el-dropdown-item>
          <el-dropdown-item 
            command="toggleStatus" 
            :disabled="!hasUpdatePermission"
          >
            <i :class="selectedMenu?.isEnabled ? 'el-icon-close' : 'el-icon-check'"></i>
            {{ selectedMenu?.isEnabled ? '禁用菜单' : '启用菜单' }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    
    <!-- 菜单编辑器对话框 -->
    <menu-editor
      v-model:visible="editorVisible"
      :menu-data="selectedMenu"
      @saved="handleMenuSaved"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import MenuEditor from '@/pages/system/components/MenuEditor.vue'

export default {
  name: 'MenuBuilder',
  components: {
    MenuEditor
  },
  setup() {
    const menuTreeData = ref([])
    const selectedMenu = ref(null)
    const editorVisible = ref(false)
    const contextMenu = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(20)
    const total = ref(0)
    
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
      display: 'none'
    })
    
    // 加载菜单树数据
    const loadMenuTree = async () => {
      try {
        const response = await axios.get('/api/system/menu/tree/full')
        menuTreeData.value = response.data
        total.value = response.data.length
      } catch (error) {
        ElMessage.error('加载菜单失败')
        console.error('Failed to load menu tree:', error)
      }
    }
    
    // 处理添加菜单
    const handleAddMenu = () => {
      selectedMenu.value = null
      editorVisible.value = true
    }
    
    // 处理节点点击
    const handleNodeClick = (data) => {
      selectedMenu.value = data
    }
    
    // 处理右键菜单
    const handleContextMenu = (event, data) => {
      event.preventDefault()
      selectedMenu.value = data
      
      // 显示右键菜单
      contextMenuStyle.left = event.clientX + 'px'
      contextMenuStyle.top = event.clientY + 'px'
      contextMenuStyle.display = 'block'
      
      nextTick(() => {
        contextMenu.value.show()
      })
      
      // 点击其他区域关闭右键菜单
      const closeContextMenu = () => {
        contextMenuStyle.display = 'none'
        document.removeEventListener('click', closeContextMenu)
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
          // 添加子菜单
          selectedMenu.value = {
            parentId: selectedMenu.value.id,
            menuLevel: selectedMenu.value.menuLevel + 1
          }
          editorVisible.value = true
          break
        case 'edit':
          // 编辑菜单
          editorVisible.value = true
          break
        case 'delete':
          // 删除菜单
          handleDeleteMenu(selectedMenu.value.id)
          break
        case 'toggleStatus':
          // 切换启用状态
          await handleToggleStatus(selectedMenu.value.id, !selectedMenu.value.isEnabled)
          break
      }
    }
    
    // 删除菜单
    const handleDeleteMenu = async (menuId) => {
      try {
        await axios.delete(`/api/system/menu/${menuId}`)
        ElMessage.success('删除成功')
        loadMenuTree() // 重新加载菜单树
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '删除失败')
      }
    }
    
    // 切换菜单状态
    const handleToggleStatus = async (menuId, isEnabled) => {
      try {
        // 这里需要调用更新菜单的接口，只修改isEnabled字段
        await axios.put(`/api/system/menu/${menuId}`, {
          ...selectedMenu.value,
          isEnabled
        })
        ElMessage.success(isEnabled ? '启用成功' : '禁用成功')
        loadMenuTree() // 重新加载菜单树
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }
    
    // 菜单保存成功后的回调
    const handleMenuSaved = () => {
      ElMessage.success('保存成功')
      loadMenuTree() // 重新加载菜单树
    }
    
    // 处理分页变化
    const handleCurrentChange = (page) => {
      currentPage.value = page
      // 这里可以根据分页加载菜单，目前是一次性加载全部
    }
    
    // 权限检查辅助函数
    const hasPermission = (permission) => {
      // 从store获取用户权限
      const permissions = ['SYSTEM:MENU:VIEW', 'SYSTEM:MENU:CREATE', 'SYSTEM:MENU:UPDATE', 'SYSTEM:MENU:DELETE'] // 示例权限
      return permissions.includes(permission)
    }
    
    onMounted(() => {
      loadMenuTree()
    })
    
    return {
      menuTreeData,
      selectedMenu,
      editorVisible,
      contextMenu,
      contextMenuStyle,
      defaultProps,
      currentPage,
      pageSize,
      total,
      hasCreatePermission,
      hasUpdatePermission,
      hasDeletePermission,
      handleAddMenu,
      handleNodeClick,
      handleContextMenu,
      handleContextMenuCommand,
      handleMenuSaved,
      handleCurrentChange
    }
  }
}
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

.menu-tree-container {
  max-height: 600px;
  overflow-y: auto;
  padding: 10px 0;
}

.custom-tree {
  background: transparent;
}

.tree-node-content {
  display: flex;
  align-items: center;
  padding: 4px 0;
  min-height: 32px;
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
}

.menu-path {
  margin: 0 12px;
  padding: 2px 8px;
  background-color: #ecf5ff;
  color: #409eff;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
}

.menu-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.menu-status.enabled {
  background-color: #f0f9eb;
  color: #67c23a;
}

.menu-status.disabled {
  background-color: #fef0f0;
  color: #f56c6c;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.context-menu-trigger {
  width: 1px;
  height: 1px;
  opacity: 0;
  position: absolute;
}
</style>