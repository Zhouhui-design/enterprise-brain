<template>
  <div class="menu-drag-sort-container">
    <el-card shadow="never" class="menu-sort-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">菜单拖拽排序</span>
          <div class="header-actions">
            <el-button 
              type="warning" 
              size="small"
              @click="resetSort"
              :disabled="!hasChanges"
            >
              <el-icon><RefreshLeft /></el-icon>
              重置排序
            </el-button>
            <el-button 
              type="primary" 
              size="small"
              @click="saveSort"
              :loading="saving"
              :disabled="!hasChanges"
            >
              <el-icon><Check /></el-icon>
              保存排序
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 操作说明 -->
      <div class="sort-instructions">
        <el-alert
          title="操作说明"
          type="info"
          description="拖拽菜单到目标位置进行排序。支持同级排序、跨级移动。完成后点击保存排序按钮。"
          show-icon
          :closable="false"
        />
      </div>
      
      <!-- 排序选项 -->
      <div class="sort-options">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-switch
              v-model="allowCrossLevel"
              active-text="允许跨级拖拽"
              @change="handleOptionChange"
            />
          </el-col>
          <el-col :span="8">
            <el-switch
              v-model="showSortNumbers"
              active-text="显示排序号"
              @change="handleOptionChange"
            />
          </el-col>
          <el-col :span="8">
            <el-switch
              v-model="enableAnimation"
              active-text="启用动画效果"
              @change="handleOptionChange"
            />
          </el-col>
        </el-row>
      </div>
      
      <!-- 菜单拖拽区域 -->
      <div class="drag-container">
        <el-tree
          ref="dragTree"
          :data="menuTreeData"
          :props="defaultProps"
          :draggable="true"
          :allow-drop="allowDrop"
          :highlight-current="true"
          @node-drag-start="handleDragStart"
          @node-drag-over="handleDragOver"
          @node-drag-end="handleDragEnd"
          @node-drop="handleDrop"
          class="drag-tree"
          node-key="id"
          :expand-on-click-node="false"
          :indent="20"
        >
          <template #default="{ node, data }">
            <div class="drag-node-content" :class="{ 'dragging': isDragging && draggingData?.id === data.id }">
              <el-icon class="drag-handle">
                <Rank />
              </el-icon>
              <span class="sort-number" v-if="showSortNumbers">
                {{ data.sortOrder !== undefined ? data.sortOrder : node.data.menuLevel * 100 + node.data.sortOrder }}
              </span>
              <span class="menu-icon" v-if="data.menuIcon">
                <el-icon :class="data.menuIcon"></el-icon>
              </span>
              <span class="menu-name">{{ data.menuName }}</span>
              <span class="menu-path" v-if="data.menuPath">{{ data.menuPath }}</span>
              <span class="menu-level-tag" :class="`level-${data.menuLevel}`">
                L{{ data.menuLevel }}
              </span>
              <span class="menu-children-count" v-if="data.children && data.children.length > 0">
                <el-tag type="info" size="small">{{ data.children.length }}</el-tag>
              </span>
            </div>
          </template>
        </el-tree>
      </div>
      
      <!-- 快速操作 -->
      <div class="quick-actions">
        <el-button-group>
          <el-button 
            size="small" 
            @click="expandAll"
            :icon="expandAll ? 'Fold' : 'Expand'"
          >
            {{ expandAll ? '收起全部' : '展开全部' }}
          </el-button>
          <el-button 
            size="small" 
            @click="autoSort"
            :icon="Sort"
          >
            自动排序
          </el-button>
          <el-button 
            size="small" 
            @click="reverseSort"
            :icon="SortUp"
          >
            反转排序
          </el-button>
        </el-button-group>
      </div>
    </el-card>
    
    <!-- 排序历史记录 -->
    <el-card shadow="never" class="sort-history-card">
      <template #header>
        <div class="history-header">
          <span>排序历史</span>
          <el-button 
            type="text" 
            size="small"
            @click="clearHistory"
            :disabled="sortHistory.length === 0"
          >
            清空历史
          </el-button>
        </div>
      </template>
      
      <div class="history-timeline">
        <el-timeline v-if="sortHistory.length > 0">
          <el-timeline-item
            v-for="(item, index) in sortHistory"
            :key="index"
            :timestamp="item.timestamp"
            :type="item.type"
          >
            <div class="history-item">
              <div class="history-action">{{ item.action }}</div>
              <div class="history-details" v-if="item.details">{{ item.details }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty 
          v-else 
          description="暂无排序历史" 
          :image-size="100"
        />
      </div>
    </el-card>
    
    <!-- 排序预览 -->
    <el-card shadow="never" class="sort-preview-card">
      <template #header>
        <div class="preview-header">
          <span>排序结果预览</span>
          <div class="preview-actions">
            <el-button 
              type="text" 
              size="small"
              @click="exportSortData"
              :disabled="!hasChanges"
            >
              导出数据
            </el-button>
            <el-button 
              type="text" 
              size="small"
              @click="importSortData"
            >
              导入数据
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="sort-json-preview">
        <el-input
          v-model="sortPreview"
          type="textarea"
          :rows="10"
          readonly
          placeholder="排序预览数据..."
        />
      </div>
    </el-card>
    
    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入排序数据"
      width="600px"
    >
      <el-input
        v-model="importData"
        type="textarea"
        :rows="10"
        placeholder="请粘贴排序数据JSON..."
      />
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportData">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { 
  Rank, Check, RefreshLeft, Sort, SortUp, 
  Expand, Fold 
} from '@element-plus/icons-vue'
import { systemApi } from '@/services'

// 响应式数据
const dragTree = ref(null)
const menuTreeData = ref([])
const originalMenuData = ref([])
const saving = ref(false)
const hasChanges = ref(false)
const isDragging = ref(false)
const draggingData = ref(null)
const sortHistory = ref([])
const importDialogVisible = ref(false)
const importData = ref('')
const isExpanded = ref(false)

// 排序选项
const allowCrossLevel = ref(true)
const showSortNumbers = ref(true)
const enableAnimation = ref(true)

// 菜单树配置
const defaultProps = {
  children: 'children',
  label: 'menuName'
}

// 格式化排序数据为JSON预览
const sortPreview = computed(() => {
  const extractSortData = (menus, level = 0) => {
    return menus.map((menu, index) => {
      const item = {
        id: menu.id,
        menuName: menu.menuName,
        sortOrder: menu.sortOrder !== undefined ? menu.sortOrder : index,
        menuLevel: menu.menuLevel,
        parentId: menu.parentId,
        path: menu.menuPath
      }
      
      if (menu.children && menu.children.length > 0) {
        item.children = extractSortData(menu.children, level + 1)
      }
      
      return item
    })
  }
  
  const sortData = extractSortData(menuTreeData.value)
  return JSON.stringify(sortData, null, 2)
})

// 加载菜单数据
const loadMenuData = async () => {
  try {
    const response = await systemApi.menu.getTree()
    const data = response.data || []
    
    // 深拷贝数据，避免直接修改原始数据
    originalMenuData.value = JSON.parse(JSON.stringify(data))
    menuTreeData.value = JSON.parse(JSON.stringify(data))
    hasChanges.value = false
    
    addHistoryItem('加载菜单数据', '成功加载菜单树', 'primary')
  } catch (error) {
    ElMessage.error('加载菜单失败: ' + (error.message || '未知错误'))
    console.error('Failed to load menu data:', error)
  }
}

// 允许拖拽条件
const allowDrop = (draggingNode, dropNode, type) => {
  if (!allowCrossLevel.value) {
    // 不允许跨级拖拽时，只能作为兄弟节点
    return type !== 'inner' && draggingNode.level === dropNode.level
  }
  
  // 允许跨级拖拽时的限制
  if (type === 'inner') {
    // 不允许拖拽到子菜单层级过深（最多3级）
    return dropNode.level < 3
  }
  
  // 允许放置为兄弟节点
  return true
}

// 拖拽开始
const handleDragStart = (draggingNode) => {
  isDragging.value = true
  draggingData.value = draggingNode.data
  console.log('拖拽开始:', draggingNode.data.menuName)
}

// 拖拽经过
const handleDragOver = (draggingNode, dropNode, type) => {
  // 可以在这里添加拖拽提示或视觉反馈
  if (enableAnimation.value) {
    dropNode.$el.classList.add('drag-over')
  }
}

// 拖拽结束
const handleDragEnd = () => {
  isDragging.value = false
  draggingData.value = null
  
  // 移除拖拽样式
  if (enableAnimation.value) {
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over')
    })
  }
}

// 拖拽放置
const handleDrop = (draggingNode, dropNode, dropType, event) => {
  hasChanges.value = true
  
  const dragMenu = draggingNode.data
  const dropMenu = dropNode.data
  
  let action = ''
  if (dropType === 'inner') {
    action = `将"${dragMenu.menuName}"移动到"${dropMenu.menuName}"下`
  } else if (dropType === 'before') {
    action = `将"${dragMenu.menuName}"移动到"${dropMenu.menuName}"之前`
  } else if (dropType === 'after') {
    action = `将"${dragMenu.menuName}"移动到"${dropMenu.menuName}"之后`
  }
  
  addHistoryItem('拖拽操作', action, 'success')
  
  // 更新排序号
  updateSortNumbers()
}

// 更新排序号
const updateSortNumbers = () => {
  const updateSort = (menus, startIndex = 0) => {
    menus.forEach((menu, index) => {
      menu.sortOrder = startIndex + index
      if (menu.children && menu.children.length > 0) {
        updateSort(menu.children, 0)
      }
    })
  }
  
  updateSort(menuTreeData.value)
}

// 重置排序
const resetSort = () => {
  ElMessageBox.confirm(
    '确定要重置到原始排序吗？所有未保存的更改将丢失。',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    menuTreeData.value = JSON.parse(JSON.stringify(originalMenuData.value))
    hasChanges.value = false
    ElMessage.success('已重置到原始排序')
    addHistoryItem('重置排序', '恢复到原始排序状态', 'warning')
  }).catch(() => {
    // 用户取消
  })
}

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
        sortRequests.push({
          menuId: menu.id,
          sortOrder: menu.sortOrder || order,
          parentId: menu.parentId
        })
        
        // 递归处理子菜单
        if (menu.children && menu.children.length > 0) {
          sortRequests = sortRequests.concat(collectSortRequests(menu.children, menu.id))
        }
        
        order++
      })
      
      return sortRequests
    }
    
    const sortItems = collectSortRequests(menuTreeData.value)
    
    // 发送保存请求
    await systemApi.menu.batchUpdate({
      menuItems: sortItems
    })
    
    ElMessage.success('排序保存成功')
    hasChanges.value = false
    
    // 更新原始数据
    originalMenuData.value = JSON.parse(JSON.stringify(menuTreeData.value))
    
    addHistoryItem('保存排序', `成功保存${sortItems.length}个菜单的排序`, 'success')
    
    // 重新加载数据以确保数据一致性
    await loadMenuData()
  } catch (error) {
    ElMessage.error('排序保存失败: ' + (error.message || '未知错误'))
    console.error('Failed to save sort:', error)
  } finally {
    saving.value = false
  }
}

// 展开全部/收起全部
const expandAll = () => {
  if (dragTree.value) {
    const keys = []
    const collectKeys = (menus) => {
      menus.forEach(menu => {
        keys.push(menu.id)
        if (menu.children && menu.children.length > 0) {
          collectKeys(menu.children)
        }
      })
    }
    collectKeys(menuTreeData.value)
    
    if (isExpanded.value) {
      dragTree.value.store.defaultCollapseAll()
    } else {
      dragTree.value.store.defaultExpandAll()
    }
    isExpanded.value = !isExpanded.value
  }
}

// 自动排序
const autoSort = () => {
  const autoSortRecursive = (menus) => {
    return menus.sort((a, b) => {
      // 首先按层级排序
      if (a.menuLevel !== b.menuLevel) {
        return a.menuLevel - b.menuLevel
      }
      // 同层级按名称排序
      return a.menuName.localeCompare(b.menuName, 'zh-CN')
    }).map(menu => {
      if (menu.children && menu.children.length > 0) {
        menu.children = autoSortRecursive(menu.children)
      }
      return menu
    })
  }
  
  menuTreeData.value = autoSortRecursive(menuTreeData.value)
  updateSortNumbers()
  hasChanges.value = true
  
  ElMessage.success('已自动排序')
  addHistoryItem('自动排序', '按层级和名称自动排序', 'success')
}

// 反转排序
const reverseSort = () => {
  const reverseRecursive = (menus) => {
    return menus.reverse().map(menu => {
      if (menu.children && menu.children.length > 0) {
        menu.children = reverseRecursive(menu.children)
      }
      return menu
    })
  }
  
  menuTreeData.value = reverseRecursive(menuTreeData.value)
  updateSortNumbers()
  hasChanges.value = true
  
  ElMessage.success('已反转排序')
  addHistoryItem('反转排序', '反转当前排序顺序', 'warning')
}

// 导出排序数据
const exportSortData = () => {
  const dataStr = JSON.stringify({
    menus: JSON.parse(sortPreview.value),
    exportTime: new Date().toISOString(),
    version: '1.0'
  }, null, 2)
  
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
  const exportFileDefaultName = `menu-sort-${new Date().toISOString().slice(0, 10)}.json`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
  
  ElMessage.success('排序数据已导出')
  addHistoryItem('导出数据', '导出排序数据到文件', 'info')
}

// 导入排序数据
const importSortData = () => {
  importDialogVisible.value = true
}

// 处理导入数据
const handleImportData = () => {
  try {
    const data = JSON.parse(importData.value)
    if (data.menus && Array.isArray(data.menus)) {
      // 这里应该验证数据格式并应用到菜单树
      menuTreeData.value = data.menus
      updateSortNumbers()
      hasChanges.value = true
      
      ElMessage.success('排序数据导入成功')
      importDialogVisible.value = false
      importData.value = ''
      
      addHistoryItem('导入数据', '从文件导入排序数据', 'success')
    } else {
      throw new Error('数据格式不正确')
    }
  } catch (error) {
    ElMessage.error('数据导入失败: ' + error.message)
  }
}

// 清空历史
const clearHistory = () => {
  sortHistory.value = []
  ElMessage.success('历史记录已清空')
}

// 添加历史记录
const addHistoryItem = (action, details, type = 'primary') => {
  sortHistory.value.unshift({
    action,
    details,
    type,
    timestamp: new Date().toLocaleString()
  })
  
  // 限制历史记录数量
  if (sortHistory.value.length > 20) {
    sortHistory.value = sortHistory.value.slice(0, 20)
  }
}

// 处理选项变化
const handleOptionChange = () => {
  // 选项变化时的处理逻辑
  console.log('排序选项已更新')
}

onMounted(() => {
  loadMenuData()
})

// 监听变化
watch(menuTreeData, () => {
  if (JSON.stringify(menuTreeData.value) !== JSON.stringify(originalMenuData.value)) {
    hasChanges.value = true
  }
}, { deep: true })
</script>

<style scoped>
.menu-drag-sort-container {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}

.menu-sort-card,
.sort-history-card,
.sort-preview-card {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.card-header,
.history-header,
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

.header-actions {
  display: flex;
  gap: 8px;
}

.sort-instructions {
  margin-bottom: 20px;
}

.sort-options {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 6px;
}

.drag-container {
  background-color: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 20px;
  min-height: 400px;
  max-height: 600px;
  overflow: auto;
}

.drag-tree {
  background: transparent;
}

.drag-node-content {
  display: flex;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  min-height: 36px;
  transition: all 0.3s ease;
  border-radius: 4px;
  position: relative;
}

.drag-node-content:hover {
  background-color: #f5f7fa;
  padding-left: 8px;
  margin-left: -8px;
}

.drag-node-content.dragging {
  opacity: 0.5;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

.sort-number {
  margin-right: 8px;
  padding: 2px 6px;
  background-color: #e6f7ff;
  color: #1890ff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 3px;
  min-width: 24px;
  text-align: center;
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
  margin: 0 8px;
  padding: 2px 6px;
  background-color: #ecf5ff;
  color: #409eff;
  font-size: 11px;
  border-radius: 3px;
  white-space: nowrap;
  font-family: 'Monaco', 'Menlo', monospace;
}

.menu-level-tag {
  margin: 0 8px;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.menu-level-tag.level-1 {
  background-color: #e1f3d8;
  color: #67c23a;
}

.menu-level-tag.level-2 {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.menu-level-tag.level-3 {
  background-color: #fde2e2;
  color: #f56c6c;
}

.menu-children-count {
  margin-left: 8px;
}

.quick-actions {
  margin-top: 16px;
  text-align: center;
}

.history-timeline {
  max-height: 300px;
  overflow: auto;
  padding: 16px 0;
}

.history-item {
  margin-bottom: 8px;
}

.history-action {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.history-details {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.sort-json-preview {
  margin-top: 16px;
}

.sort-json-preview .el-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

/* 拖拽时的样式 */
.drag-over {
  background-color: #e6f7ff !important;
  border: 2px dashed #409eff !important;
}

/* 滚动条样式 */
.drag-container::-webkit-scrollbar,
.history-timeline::-webkit-scrollbar {
  width: 6px;
}

.drag-container::-webkit-scrollbar-track,
.history-timeline::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.drag-container::-webkit-scrollbar-thumb,
.history-timeline::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.drag-container::-webkit-scrollbar-thumb:hover,
.history-timeline::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menu-drag-sort-container {
    padding: 12px;
  }
  
  .drag-node-content {
    flex-wrap: wrap;
  }
  
  .menu-path,
  .menu-level-tag {
    margin: 2px 4px;
  }
  
  .sort-options .el-row {
    --el-row-gutter: 8px;
  }
}
</style>