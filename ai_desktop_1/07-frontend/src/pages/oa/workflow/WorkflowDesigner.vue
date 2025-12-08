<template>
  <div class="workflow-designer">
    <!-- 工业风格头部区域 -->
    <header class="designer-header">
      <div class="header-left">
        <div class="title-section">
          <h1 class="page-title">工作流设计器</h1>
          <div class="breadcrumb">
            <span class="breadcrumb-item">OA系统</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item active">工作流设计</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <button class="action-btn secondary" @click="handleSave">
          <i class="fas fa-save"></i>
          <span>保存草稿</span>
        </button>
        <button class="action-btn primary" @click="handleDeploy">
          <i class="fas fa-rocket"></i>
          <span>部署工作流</span>
        </button>
      </div>
    </header>

    <!-- 主设计区域 -->
    <main class="designer-main">
      <!-- 工具箱面板 -->
      <aside class="toolbox-panel">
        <div class="panel-header">
          <h3 class="panel-title">节点工具箱</h3>
          <div class="panel-divider"></div>
        </div>
        
        <div class="node-categories">
          <div class="category-section">
            <h4 class="category-title">基础节点</h4>
            <div class="node-list">
              <div 
                class="node-item start-node" 
                draggable="true" 
                @dragstart="handleDragStart('start')"
              >
                <div class="node-icon">
                  <i class="fas fa-play-circle"></i>
                </div>
                <div class="node-info">
                  <span class="node-name">开始节点</span>
                  <span class="node-desc">工作流起点</span>
                </div>
              </div>
              
              <div 
                class="node-item task-node" 
                draggable="true" 
                @dragstart="handleDragStart('task')"
              >
                <div class="node-icon">
                  <i class="fas fa-tasks"></i>
                </div>
                <div class="node-info">
                  <span class="node-name">任务节点</span>
                  <span class="node-desc">执行具体任务</span>
                </div>
              </div>
              
              <div 
                class="node-item approval-node" 
                draggable="true" 
                @dragstart="handleDragStart('approval')"
              >
                <div class="node-icon">
                  <i class="fas fa-user-check"></i>
                </div>
                <div class="node-info">
                  <span class="node-name">审批节点</span>
                  <span class="node-desc">需要审批确认</span>
                </div>
              </div>
              
              <div 
                class="node-item end-node" 
                draggable="true" 
                @dragstart="handleDragStart('end')"
              >
                <div class="node-icon">
                  <i class="fas fa-stop-circle"></i>
                </div>
                <div class="node-info">
                  <span class="node-name">结束节点</span>
                  <span class="node-desc">工作流终点</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 设计画布区域 -->
      <section class="canvas-section">
        <div class="canvas-toolbar">
          <div class="toolbar-left">
            <button class="toolbar-btn" @click="handleZoomIn">
              <i class="fas fa-search-plus"></i>
            </button>
            <button class="toolbar-btn" @click="handleZoomOut">
              <i class="fas fa-search-minus"></i>
            </button>
            <button class="toolbar-btn" @click="handleReset">
              <i class="fas fa-compress"></i>
            </button>
          </div>
          <div class="toolbar-center">
            <span class="zoom-indicator">{{ zoomLevel }}%</span>
          </div>
          <div class="toolbar-right">
            <button class="toolbar-btn" @click="handleGridToggle">
              <i class="fas fa-th"></i>
            </button>
            <button class="toolbar-btn" @click="handleClear">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div 
          class="design-canvas" 
          :class="{ 'show-grid': showGrid }"
          @drop="handleDrop" 
          @dragover="handleDragOver"
          @wheel="handleWheel"
        >
          <!-- 网格背景 -->
          <div class="grid-overlay" v-if="showGrid"></div>
          
          <!-- 连接线容器 -->
          <svg class="connections-layer">
            <path 
              v-for="connection in connections" 
              :key="connection.id"
              :d="connection.path"
              class="connection-line"
            />
          </svg>
          
          <!-- 工作流节点 -->
          <div 
            v-for="node in nodes" 
            :key="node.id"
            class="workflow-node"
            :class="`node-${node.type} ${node.selected ? 'selected' : ''}`"
            :style="{ 
              left: node.x + 'px', 
              top: node.y + 'px',
              transform: `scale(${zoomLevel / 100})`
            }"
            @click="selectNode(node)"
            @mousedown="startDrag(node, $event)"
          >
            <div class="node-connector connector-top"></div>
            <div class="node-connector connector-right"></div>
            <div class="node-connector connector-bottom"></div>
            <div class="node-connector connector-left"></div>
            
            <div class="node-content">
              <div class="node-icon-large">
                <i :class="getNodeIcon(node.type)"></i>
              </div>
              <div class="node-label">{{ node.name }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 属性面板 -->
      <aside class="properties-panel" v-if="selectedNode">
        <div class="panel-header">
          <h3 class="panel-title">节点属性</h3>
          <div class="panel-divider"></div>
        </div>
        
        <div class="properties-content">
          <div class="property-group">
            <label class="property-label">节点名称</label>
            <input 
              v-model="selectedNode.name" 
              type="text" 
              class="property-input"
              placeholder="输入节点名称"
            />
          </div>
          
          <div class="property-group">
            <label class="property-label">节点描述</label>
            <textarea 
              v-model="selectedNode.description" 
              class="property-textarea"
              placeholder="输入节点描述"
              rows="3"
            ></textarea>
          </div>
          
          <div class="property-group" v-if="selectedNode.type === 'approval'">
            <label class="property-label">审批人</label>
            <select v-model="selectedNode.approver" class="property-select">
              <option value="">选择审批人</option>
              <option value="manager">部门经理</option>
              <option value="director">总监</option>
              <option value="ceo">CEO</option>
            </select>
          </div>
          
          <div class="property-group" v-if="selectedNode.type === 'task'">
            <label class="property-label">执行人</label>
            <select v-model="selectedNode.assignee" class="property-select">
              <option value="">选择执行人</option>
              <option value="user1">张三</option>
              <option value="user2">李四</option>
              <option value="user3">王五</option>
            </select>
          </div>
          
          <div class="property-actions">
            <button class="property-btn danger" @click="deleteNode(selectedNode)">
              <i class="fas fa-trash"></i>
              <span>删除节点</span>
            </button>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

// 响应式数据
const nodes = ref([])
const connections = ref([])
const selectedNode = ref(null)
const zoomLevel = ref(100)
const showGrid = ref(true)
const dragNodeType = ref('')
const isDragging = ref(false)
const draggedNode = ref(null)
const dragOffset = reactive({ x: 0, y: 0 })

// 拖拽开始
const handleDragStart = (type) => {
  dragNodeType.value = type
}

// 拖拽经过
const handleDragOver = (e) => {
  e.preventDefault()
}

// 放置节点
const handleDrop = (e) => {
  e.preventDefault()
  if (!dragNodeType.value) return
  
  const rect = e.currentTarget.getBoundingClientRect()
  const x = (e.clientX - rect.left) / (zoomLevel.value / 100)
  const y = (e.clientY - rect.top) / (zoomLevel.value / 100)
  
  const newNode = {
    id: Date.now(),
    type: dragNodeType.value,
    name: getNodeName(dragNodeType.value),
    description: '',
    x: x - 60,
    y: y - 40,
    approver: '',
    assignee: '',
    selected: false
  }
  
  nodes.value.push(newNode)
  dragNodeType.value = ''
}

// 获取节点名称
const getNodeName = (type) => {
  const names = {
    start: '开始节点',
    task: '任务节点',
    approval: '审批节点',
    end: '结束节点'
  }
  return names[type] || '未知节点'
}

// 获取节点图标
const getNodeIcon = (type) => {
  const icons = {
    start: 'fas fa-play-circle',
    task: 'fas fa-tasks',
    approval: 'fas fa-user-check',
    end: 'fas fa-stop-circle'
  }
  return icons[type] || 'fas fa-cube'
}

// 选择节点
const selectNode = (node) => {
  nodes.value.forEach(n => n.selected = false)
  node.selected = true
  selectedNode.value = node
}

// 开始拖拽节点
const startDrag = (node, e) => {
  if (e.button !== 0) return // 只响应左键
  
  isDragging.value = true
  draggedNode.value = node
  selectNode(node)
  
  const rect = e.currentTarget.getBoundingClientRect()
  dragOffset.x = e.clientX - rect.left
  dragOffset.y = e.clientY - rect.top
  
  e.preventDefault()
}

// 鼠标移动
const handleMouseMove = (e) => {
  if (!isDragging.value || !draggedNode.value) return
  
  const canvas = document.querySelector('.design-canvas')
  const rect = canvas.getBoundingClientRect()
  
  const x = (e.clientX - rect.left - dragOffset.x) / (zoomLevel.value / 100)
  const y = (e.clientY - rect.top - dragOffset.y) / (zoomLevel.value / 100)
  
  draggedNode.value.x = Math.max(0, Math.min(x, rect.width - 120))
  draggedNode.value.y = Math.max(0, Math.min(y, rect.height - 80))
}

// 鼠标松开
const handleMouseUp = () => {
  isDragging.value = false
  draggedNode.value = null
}

// 删除节点
const deleteNode = (node) => {
  const index = nodes.value.findIndex(n => n.id === node.id)
  if (index > -1) {
    nodes.value.splice(index, 1)
    selectedNode.value = null
  }
}

// 缩放控制
const handleZoomIn = () => {
  zoomLevel.value = Math.min(200, zoomLevel.value + 10)
}

const handleZoomOut = () => {
  zoomLevel.value = Math.max(50, zoomLevel.value - 10)
}

const handleReset = () => {
  zoomLevel.value = 100
}

const handleWheel = (e) => {
  if (e.ctrlKey) {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }
}

// 网格切换
const handleGridToggle = () => {
  showGrid.value = !showGrid.value
}

// 清空画布
const handleClear = () => {
  if (confirm('确定要清空所有节点吗？')) {
    nodes.value = []
    connections.value = []
    selectedNode.value = null
  }
}

// 保存工作流
const handleSave = () => {
  const workflowData = {
    nodes: nodes.value,
    connections: connections.value,
    metadata: {
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    }
  }
  console.log('保存工作流:', workflowData)
  // 这里可以调用API保存到后端
}

// 部署工作流
const handleDeploy = () => {
  if (nodes.value.length === 0) {
    alert('请先设计工作流节点')
    return
  }
  
  // 验证工作流完整性
  const hasStart = nodes.value.some(n => n.type === 'start')
  const hasEnd = nodes.value.some(n => n.type === 'end')
  
  if (!hasStart || !hasEnd) {
    alert('工作流必须包含开始节点和结束节点')
    return
  }
  
  const deployData = {
    nodes: nodes.value,
    connections: connections.value,
    deployTime: new Date().toISOString()
  }
  console.log('部署工作流:', deployData)
  // 这里可以调用API部署工作流
}

// 生命周期
onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600&display=swap');

/* CSS变量定义 */
:root {
  --primary-color: #2C3E50;
  --secondary-color: #34495E;
  --accent-color: #E67E22;
  --background-color: #ECF0F1;
  --text-color: #2C3E50;
  --border-color: #BDC3C7;
  --success-color: #27AE60;
  --warning-color: #F39C12;
  --danger-color: #E74C3C;
}

/* 基础样式 */
* {
  box-sizing: border-box;
}

.workflow-designer {
  font-family: 'Source Sans Pro', sans-serif;
  background: var(--background-color);
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: var(--text-color);
}

/* 头部样式 */
.designer-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 100;
}

.designer-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent-color);
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.breadcrumb {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.9;
}

.breadcrumb-item {
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb-item.active {
  color: white;
  font-weight: 600;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.header-right {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-btn.primary {
  background: var(--accent-color);
  color: white;
}

.action-btn.primary:hover {
  background: #D35400;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.4);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 主设计区域 */
.designer-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 工具箱面板 */
.toolbox-panel {
  width: 320px;
  background: white;
  border-right: 2px solid var(--border-color);
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 2px solid var(--border-color);
}

.panel-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--primary-color);
}

.panel-divider {
  height: 3px;
  background: var(--accent-color);
  margin-top: 0.75rem;
  border-radius: 2px;
}

.node-categories {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

.category-section {
  margin-bottom: 1.5rem;
}

.category-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--secondary-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: move;
  transition: all 0.3s ease;
  background: white;
}

.node-item:hover {
  border-color: var(--accent-color);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.15);
}

.node-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.125rem;
}

.start-node .node-icon {
  background: var(--success-color);
}

.task-node .node-icon {
  background: #3498DB;
}

.approval-node .node-icon {
  background: var(--warning-color);
}

.end-node .node-icon {
  background: var(--danger-color);
}

.node-info {
  flex: 1;
}

.node-name {
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--primary-color);
}

.node-desc {
  display: block;
  font-size: 0.75rem;
  color: #7F8C8D;
  margin-top: 0.25rem;
}

/* 画布区域 */
.canvas-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.canvas-toolbar {
  background: white;
  border-bottom: 2px solid var(--border-color);
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--secondary-color);
}

.toolbar-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.zoom-indicator {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--secondary-color);
  min-width: 50px;
  text-align: center;
}

.design-canvas {
  flex: 1;
  position: relative;
  background: white;
  overflow: auto;
  background-image: 
    linear-gradient(rgba(189, 195, 199, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(189, 195, 199, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

.design-canvas.show-grid {
  background-image: 
    linear-gradient(rgba(189, 195, 199, 0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(189, 195, 199, 0.2) 1px, transparent 1px);
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(44, 62, 80, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(44, 62, 80, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.connection-line {
  stroke: var(--secondary-color);
  stroke-width: 2;
  fill: none;
}

/* 工作流节点 */
.workflow-node {
  position: absolute;
  width: 120px;
  min-height: 80px;
  border-radius: 10px;
  cursor: move;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  transform-origin: center center;
}

.workflow-node:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transform: scale(1.02);
}

.workflow-node.selected {
  box-shadow: 0 0 0 3px var(--accent-color);
  z-index: 20;
}

.node-start {
  border-color: var(--success-color);
  border-width: 3px;
}

.node-task {
  border-color: #3498DB;
  border-width: 3px;
}

.node-approval {
  border-color: var(--warning-color);
  border-width: 3px;
}

.node-end {
  border-color: var(--danger-color);
  border-width: 3px;
}

.node-connector {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--accent-color);
  border: 2px solid white;
  border-radius: 50%;
  z-index: 15;
}

.connector-top {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.connector-right {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.connector-bottom {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.connector-left {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.node-content {
  padding: 1rem;
  text-align: center;
  pointer-events: none;
}

.node-icon-large {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.node-start .node-icon-large {
  color: var(--success-color);
}

.node-task .node-icon-large {
  color: #3498DB;
}

.node-approval .node-icon-large {
  color: var(--warning-color);
}

.node-end .node-icon-large {
  color: var(--danger-color);
}

.node-label {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--primary-color);
}

/* 属性面板 */
.properties-panel {
  width: 320px;
  background: white;
  border-left: 2px solid var(--border-color);
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.properties-content {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

.property-group {
  margin-bottom: 1.5rem;
}

.property-label {
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--secondary-color);
  margin-bottom: 0.5rem;
}

.property-input,
.property-select,
.property-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 0.875rem;
  transition: border-color 0.3s ease;
}

.property-input:focus,
.property-select:focus,
.property-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.property-textarea {
  resize: vertical;
  min-height: 80px;
}

.property-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 2rem;
}

.property-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
}

.property-btn.danger {
  background: var(--danger-color);
  color: white;
}

.property-btn.danger:hover {
  background: #C0392B;
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .toolbox-panel {
    width: 280px;
  }
  
  .properties-panel {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .designer-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .toolbox-panel,
  .properties-panel {
    width: 100%;
    position: absolute;
    height: 50%;
    z-index: 50;
  }
}
</style>