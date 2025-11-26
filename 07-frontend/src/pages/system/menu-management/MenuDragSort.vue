<template>
  <div class="menu-drag-sort-container">
    <el-card shadow="never" class="menu-sort-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">菜单拖拽排序</span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              size="small"
              @click="saveSort"
              :loading="saving"
            >
              保存排序
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="sort-instructions">
        <el-alert
          title="操作说明"
          type="info"
          description="拖拽菜单到目标位置进行排序，完成后点击保存排序按钮"
          show-icon
          :closable="false"
        />
      </div>
      
      <!-- 菜单拖拽区域 -->
      <div class="drag-container">
        <el-tree
          ref="dragTree"
          :data="menuTreeData"
          :props="defaultProps"
          :draggable="true"
          :allow-drop="allowDrop"
          @node-drag-start="handleDragStart"
          @node-drag-over="handleDragOver"
          @node-drag-end="handleDragEnd"
          class="drag-tree"
        >
          <template #default="{ node, data }">
            <div class="drag-node-content">
              <i class="el-icon-rank drag-handle"></i>
              <span class="menu-icon" v-if="data.menuIcon">
                <i :class="data.menuIcon"></i>
              </span>
              <span class="menu-name">{{ data.menuName }}</span>
              <span class="menu-level-tag">
                层级 {{ data.menuLevel }}
              </span>
            </div>
          </template>
        </el-tree>
      </div>
    </el-card>
    
    <!-- 排序后的JSON预览 -->
    <el-card shadow="never" class="sort-preview-card">
      <template #header>
        <div class="preview-header">
          <span>排序结果预览</span>
        </div>
      </template>
      <div class="sort-json-preview">
        <pre>{{ formattedSortData }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
  name: 'MenuDragSort',
  setup() {
    const dragTree = ref(null)
    const menuTreeData = ref([])
    const saving = ref(false)
    const hasChanges = ref(false)
    
    // 菜单树配置
    const defaultProps = {
      children: 'children',
      label: 'menuName'
    }
    
    // 加载菜单数据
    const loadMenuData = async () => {
      try {
        const response = await axios.get('/api/system/menu/tree/full')
        // 深拷贝数据，避免直接修改原始数据
        menuTreeData.value = JSON.parse(JSON.stringify(response.data))
        hasChanges.value = false
      } catch (error) {
        ElMessage.error('加载菜单失败')
        console.error('Failed to load menu data:', error)
      }
    }
    
    // 允许拖拽条件
    const allowDrop = (draggingNode, dropNode, type) => {
      // 不允许拖拽到子菜单层级过深（最多3级）
      if (type === 'inner') {
        return dropNode.level < 3
      }
      // 允许放置为兄弟节点
      return true
    }
    
    // 拖拽开始
    const handleDragStart = (draggingNode) => {
      console.log('Drag start:', draggingNode.data.menuName)
    }
    
    // 拖拽经过
    const handleDragOver = (draggingNode, dropNode, type) => {
      // 可以在这里添加拖拽提示或视觉反馈
    }
    
    // 拖拽结束
    const handleDragEnd = () => {
      hasChanges.value = true
    }
    
    // 格式化排序数据为JSON预览
    const formattedSortData = computed(() => {
      // 提取排序数据
      const extractSortData = (menus) => {
        return menus.map(menu => ({
          id: menu.id,
          menuName: menu.menuName,
          sortOrder: menu.sortOrder,
          parentId: menu.parentId,
          children: menu.children ? extractSortData(menu.children) : []
        }))
      }
      
      const sortData = extractSortData(menuTreeData.value)
      return JSON.stringify(sortData, null, 2)
    })
    
    // 保存排序
    const saveSort = async () => {
      if (!hasChanges.value) {
        ElMessage.warning('没有进行排序调整')
        return
      }
      
      saving.value = true
      try {
        // 收集排序数据
        const collectSortRequests = (menus, parentId = null) => {
          let sortRequests = []
          let order = 0
          
          menus.forEach(menu => {
            // 更新菜单排序和层级
            sortRequests.push({
              menuId: menu.id,
              sortOrder: order++
            })
            
            // 递归处理子菜单
            if (menu.children && menu.children.length > 0) {
              sortRequests = sortRequests.concat(collectSortRequests(menu.children, menu.id))
            }
          })
          
          return sortRequests
        }
        
        const sortItems = collectSortRequests(menuTreeData.value)
        
        // 发送保存请求
        await axios.post('/api/system/menu/sort', {
          menuItems: sortItems
        })
        
        ElMessage.success('排序保存成功')
        hasChanges.value = false
        
        // 重新加载数据以更新后端返回的排序值
        await loadMenuData()
      } catch (error) {
        ElMessage.error('排序保存失败')
        console.error('Failed to save sort:', error)
        // 恢复原始数据
        await loadMenuData()
      } finally {
        saving.value = false
      }
    }
    
    onMounted(() => {
      loadMenuData()
    })
    
    return {
      dragTree,
      menuTreeData,
      defaultProps,
      saving,
      formattedSortData,
      allowDrop,
      handleDragStart,
      handleDragOver,
      handleDragEnd,
      saveSort
    }
  }
}
</script>

<style scoped>
.menu-drag-sort-container {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}

.menu-sort-card,
.sort-preview-card {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.card-header,
.preview-header {
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

.sort-instructions {
  margin-bottom: 20px;
}

.drag-container {
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 20px;
  min-height: 400px;
}

.drag-tree {
  background: transparent;
}

.drag-node-content {
  display: flex;
  align-items: center;
  padding: 6px 0;
  cursor: pointer;
  min-height: 36px;
  transition: all 0.3s ease;
}

.drag-node-content:hover {
  background-color: #f5f7fa;
  padding-left: 8px;
  margin-left: -8px;
  border-radius: 4px;
}

.drag-handle {
  margin-right: 12px;
  color: #c0c4cc;
  cursor: move;
  font-size: 16px;
  width: 20px;
  text-align: center;
  transition: color 0.3s;
}

.drag-node-content:hover .drag-handle {
  color: #409eff;
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

.menu-level-tag {
  padding: 2px 8px;
  background-color: #f4f4f5;
  color: #909399;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
}

.sort-json-preview {
  background-color: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 16px;
  max-height: 300px;
  overflow: auto;
}

.sort-json-preview pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #606266;
}
</style>