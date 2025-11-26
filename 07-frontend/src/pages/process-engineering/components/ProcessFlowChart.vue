<template>
  <div class="process-flow-chart">
    <div class="chart-header">
      <div class="header-left">
        <h3>{{ title || '工艺流程图' }}</h3>
        <el-tag v-if="processInfo" type="primary">{{ processInfo.name }}</el-tag>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button size="small" @click="handleZoomIn" :disabled="!canZoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button size="small" @click="handleZoomOut" :disabled="!canZoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button size="small" @click="handleResetZoom">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-button-group>
        <el-button size="small" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 流程图画布 -->
    <div class="chart-container" ref="chartContainer">
      <svg
        ref="svgRef"
        :width="canvasWidth"
        :height="canvasHeight"
        class="flow-chart-svg"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @wheel="handleWheel"
      >
        <!-- 定义箭头标记 -->
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#409EFF" />
          </marker>
        </defs>

        <!-- 网格背景 -->
        <g v-if="showGrid" class="grid-pattern">
          <!-- 水平线 -->
          <line
            v-for="i in Math.ceil(canvasHeight / gridSize)"
            :key="'h-' + i"
            :x1="0"
            :y1="i * gridSize"
            :x2="canvasWidth"
            :y2="i * gridSize"
            stroke="#f0f0f0"
            stroke-width="1"
          />
          <!-- 垂直线 -->
          <line
            v-for="i in Math.ceil(canvasWidth / gridSize)"
            :key="'v-' + i"
            :x1="i * gridSize"
            :y1="0"
            :x2="i * gridSize"
            :y2="canvasHeight"
            stroke="#f0f0f0"
            stroke-width="1"
          />
        </g>

        <!-- 流程节点 -->
        <g
          v-for="node in flowNodes"
          :key="node.id"
          :transform="`translate(${node.x}, ${node.y})`"
          class="node-group"
          @click="handleNodeClick(node)"
          @mouseenter="handleNodeHover(node, true)"
          @mouseleave="handleNodeHover(node, false)"
        >
          <!-- 节点背景 -->
          <rect
            :width="node.width"
            :height="node.height"
            :rx="node.borderRadius || 8"
            :fill="getNodeColor(node)"
            :stroke="getNodeBorderColor(node)"
            :stroke-width="2"
            class="node-rect"
          />
          
          <!-- 节点图标 -->
          <g
            :transform="`translate(${node.width / 2 - 12}, ${node.height / 2 - 12})`"
            class="node-icon"
          >
            <component :is="getNodeIcon(node.type)" />
          </g>
          
          <!-- 节点文字 -->
          <text
            :x="node.width / 2"
            :y="node.height + 20"
            text-anchor="middle"
            class="node-text"
            :fill="getTextColor(node.type)"
          >
            {{ node.name }}
          </text>
        </g>

        <!-- 连接线 -->
        <g
          v-for="connection in flowConnections"
          :key="`${connection.from}-${connection.to}`"
          class="connection-group"
        >
          <path
            :d="getConnectionPath(connection)"
            :stroke="getConnectionColor(connection.type)"
            :stroke-width="2"
            fill="none"
            marker-end="url(#arrowhead)"
            class="connection-path"
          />
          
          <!-- 连接线标签 -->
          <text
            v-if="connection.label"
            :x="getConnectionLabelPosition(connection).x"
            :y="getConnectionLabelPosition(connection).y"
            text-anchor="middle"
            class="connection-label"
            fill="#606266"
          >
            {{ connection.label }}
          </text>
        </g>
      </svg>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar" v-if="showToolbar">
      <el-button-group>
        <el-button
          size="small"
          :type="currentTool === 'select' ? 'primary' : ''"
          @click="setTool('select')"
        >
          <el-icon><Pointer /></el-icon>
          选择
        </el-button>
        <el-button
          size="small"
          :type="currentTool === 'pan' ? 'primary' : ''"
          @click="setTool('pan')"
        >
          <el-icon><Rank /></el-icon>
          平移
        </el-button>
      </el-button-group>
      
      <el-divider direction="vertical" />
      
      <el-button-group>
        <el-button size="small" @click="toggleGrid">
          <el-icon><Grid /></el-icon>
          网格
        </el-button>
        <el-button size="small" @click="toggleMinimap">
          <el-icon><Monitor /></el-icon>
          小地图
        </el-button>
      </el-button-group>
    </div>

    <!-- 小地图 -->
    <div class="minimap" v-if="showMinimap" @click="handleMinimapClick">
      <div class="minimap-container">
        <svg
          :width="minimapWidth"
          :height="minimapHeight"
          class="minimap-svg"
        >
          <!-- 小地图视口 -->
          <rect
            :x="viewportX"
            :y="viewportY"
            :width="viewportWidth"
            :height="viewportHeight"
            fill="rgba(64, 158, 255, 0.2)"
            stroke="#409EFF"
            stroke-width="1"
            class="viewport-rect"
          />
          
          <!-- 简化的流程节点 -->
          <rect
            v-for="node in flowNodes"
            :key="'mini-' + node.id"
            :x="node.x * minimapScale"
            :y="node.y * minimapScale"
            :width="node.width * minimapScale"
            :height="node.height * minimapScale"
            :fill="getNodeColor(node)"
            :rx="4"
            class="minimap-node"
          />
        </svg>
      </div>
    </div>

    <!-- 节点详情弹窗 -->
    <div
      v-if="hoveredNode && showTooltip"
      class="node-tooltip"
      :style="tooltipStyle"
    >
      <div class="tooltip-header">
        <strong>{{ hoveredNode.name }}</strong>
        <el-tag :type="getNodeTypeColor(hoveredNode.type)" size="small">
          {{ getNodeTypeText(hoveredNode.type) }}
        </el-tag>
      </div>
      <div class="tooltip-content">
        <p v-if="hoveredNode.description">{{ hoveredNode.description }}</p>
        <p><strong>处理时间:</strong> {{ hoveredNode.processTime || 'N/A' }}</p>
        <p><strong>负责人:</strong> {{ hoveredNode.responsible || 'N/A' }}</p>
      </div>
    </div>

    <!-- 属性面板 -->
    <div class="properties-panel" v-if="selectedNode && showProperties">
      <div class="panel-header">
        <h4>节点属性</h4>
        <el-button type="text" size="small" @click="showProperties = false">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="panel-content">
        <el-form :model="selectedNode" label-width="80px" size="small">
          <el-form-item label="节点名称">
            <el-input v-model="selectedNode.name" />
          </el-form-item>
          <el-form-item label="节点类型">
            <el-select v-model="selectedNode.type">
              <el-option label="开始" value="start" />
              <el-option label="处理" value="process" />
              <el-option label="决策" value="decision" />
              <el-option label="结束" value="end" />
            </el-select>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="selectedNode.description" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="处理时间">
            <el-input v-model="selectedNode.processTime">
              <template #append>分钟</template>
            </el-input>
          </el-form-item>
          <el-form-item label="负责人">
            <el-input v-model="selectedNode.responsible" />
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ZoomIn,
  ZoomOut,
  Refresh,
  Download,
  Pointer,
  Rank,
  Grid,
  Monitor,
  Close,
  VideoPlay,
  Document,
  Switch,
  Share,
  Timer
} from '@element-plus/icons-vue'

const props = defineProps({
  processId: {
    type: [String, Number],
    required: true
  },
  processData: {
    type: Object,
    default: () => ({})
  }
})

// 响应式数据
const svgRef = ref(null)
const chartContainer = ref(null)
const canvasWidth = ref(1200)
const canvasHeight = ref(800)
const zoomLevel = ref(1)
const gridSize = ref(20)
const showGrid = ref(true)
const showToolbar = ref(true)
const showMinimap = ref(false)
const showProperties = ref(false)
const currentTool = ref('select')
const hoveredNode = ref(null)
const selectedNode = ref(null)
const showTooltip = ref(false)
const tooltipStyle = reactive({ left: '0px', top: '0px' })

// 小地图相关
const minimapScale = computed(() => 0.1)
const minimapWidth = computed(() => 200)
const minimapHeight = computed(() => 150)
const viewportX = ref(0)
const viewportY = ref(0)
const viewportWidth = computed(() => 100 * minimapScale.value)
const viewportHeight = computed(() => 80 * minimapScale.value)

// 流程节点数据
const flowNodes = ref([
  {
    id: 'start',
    name: '开始',
    type: 'start',
    x: 100,
    y: 50,
    width: 100,
    height: 60,
    borderRadius: 30,
    description: '流程开始',
    processTime: 0,
    responsible: ''
  },
  {
    id: 'material-prep',
    name: '材料准备',
    type: 'process',
    x: 300,
    y: 50,
    width: 120,
    height: 80,
    description: '准备所需原材料',
    processTime: 15,
    responsible: '材料管理员'
  },
  {
    id: 'quality-check',
    name: '质量检查',
    type: 'process',
    x: 500,
    y: 50,
    width: 120,
    height: 80,
    description: '检查原材料质量',
    processTime: 10,
    responsible: '质检员'
  },
  {
    id: 'decision',
    name: '质量判断',
    type: 'decision',
    x: 700,
    y: 50,
    width: 100,
    height: 100,
    description: '判断材料是否合格',
    processTime: 5,
    responsible: '质检员'
  },
  {
    id: 'main-process',
    name: '主工艺',
    type: 'process',
    x: 650,
    y: 200,
    width: 150,
    height: 80,
    description: '执行主要加工工艺',
    processTime: 45,
    responsible: '操作员'
  },
  {
    id: 'rework',
    name: '返工处理',
    type: 'process',
    x: 450,
    y: 200,
    width: 120,
    height: 80,
    description: '不合格材料返工处理',
    processTime: 30,
    responsible: '操作员'
  },
  {
    id: 'final-check',
    name: '最终检验',
    type: 'process',
    x: 500,
    y: 350,
    width: 120,
    height: 80,
    description: '最终质量检验',
    processTime: 15,
    responsible: '质检员'
  },
  {
    id: 'packaging',
    name: '包装',
    type: 'process',
    x: 700,
    y: 350,
    width: 120,
    height: 80,
    description: '产品包装处理',
    processTime: 20,
    responsible: '包装员'
  },
  {
    id: 'end',
    name: '结束',
    type: 'end',
    x: 900,
    y: 375,
    width: 100,
    height: 60,
    borderRadius: 30,
    description: '流程结束',
    processTime: 0,
    responsible: ''
  }
])

// 流程连接线数据
const flowConnections = ref([
  {
    from: 'start',
    to: 'material-prep',
    type: 'normal',
    label: ''
  },
  {
    from: 'material-prep',
    to: 'quality-check',
    type: 'normal',
    label: '15min'
  },
  {
    from: 'quality-check',
    to: 'decision',
    type: 'normal',
    label: '10min'
  },
  {
    from: 'decision',
    to: 'main-process',
    type: 'normal',
    label: '合格'
  },
  {
    from: 'decision',
    to: 'rework',
    type: 'normal',
    label: '不合格'
  },
  {
    from: 'rework',
    to: 'material-prep',
    type: 'normal',
    label: '重新准备'
  },
  {
    from: 'main-process',
    to: 'final-check',
    type: 'normal',
    label: '45min'
  },
  {
    from: 'final-check',
    to: 'packaging',
    type: 'normal',
    label: '15min'
  },
  {
    from: 'packaging',
    to: 'end',
    type: 'normal',
    label: '20min'
  }
])

// 计算属性
const canZoomIn = computed(() => zoomLevel.value < 3)
const canZoomOut = computed(() => zoomLevel.value > 0.3)

// 工艺信息
const processInfo = computed(() => {
  return props.processData || {
    name: '机械装配工艺流程',
    version: 'v2.0'
  }
})

const title = computed(() => {
  return props.processData?.name || '工艺流程图'
})

// 节点颜色映射
const getNodeColor = (node) => {
  const colorMap = {
    start: '#67C23A',
    end: '#F56C6C',
    process: '#409EFF',
    decision: '#E6A23C'
  }
  return colorMap[node.type] || '#909399'
}

const getNodeBorderColor = (node) => {
  const colorMap = {
    start: '#5daf34',
    end: '#f56c6c',
    process: '#409eff',
    decision: '#e6a23c'
  }
  return colorMap[node.type] || '#909399'
}

const getTextColor = (type) => {
  return type === 'start' || type === 'end' ? '#ffffff' : '#1d2129'
}

const getNodeIcon = (type) => {
  const iconMap = {
    start: VideoPlay,
    end: Document,
    process: Timer,
    decision: Switch
  }
  return iconMap[type] || Timer
}

const getNodeTypeColor = (type) => {
  const colorMap = {
    start: 'success',
    end: 'danger',
    process: 'primary',
    decision: 'warning'
  }
  return colorMap[type] || 'info'
}

const getNodeTypeText = (type) => {
  const textMap = {
    start: '开始',
    end: '结束',
    process: '处理',
    decision: '决策'
  }
  return textMap[type] || type
}

// 连接线颜色映射
const getConnectionColor = (type) => {
  return type === 'normal' ? '#409EFF' : '#E6A23C'
}

// 获取连接线路径
const getConnectionPath = (connection) => {
  const fromNode = flowNodes.value.find(n => n.id === connection.from)
  const toNode = flowNodes.value.find(n => n.id === connection.to)
  
  if (!fromNode || !toNode) return ''
  
  const fromX = fromNode.x + fromNode.width / 2
  const fromY = fromNode.y + fromNode.height / 2
  const toX = toNode.x + toNode.width / 2
  const toY = toNode.y + toNode.height / 2
  
  // 简单的直角连接线
  if (fromNode.type === 'decision') {
    // 从决策节点出来的连接线
    return `M ${fromX} ${fromY + fromNode.height / 2} L ${toX} ${toY - toNode.height / 2} L ${toX} ${toY}`
  } else {
    // 普通连接线
    const midX = (fromX + toX) / 2
    const midY = (fromY + toY) / 2
    return `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`
  }
}

// 获取连接线标签位置
const getConnectionLabelPosition = (connection) => {
  const fromNode = flowNodes.value.find(n => n.id === connection.from)
  const toNode = flowNodes.value.find(n => n.id === connection.to)
  
  if (!fromNode || !toNode || !connection.label) return { x: 0, y: 0 }
  
  const fromX = fromNode.x + fromNode.width / 2
  const fromY = fromNode.y + fromNode.height / 2
  const toX = toNode.x + toNode.width / 2
  const toY = toNode.y + toNode.height / 2
  
  return {
    x: (fromX + toX) / 2,
    y: (fromY + toY) / 2
  }
}

// 事件处理函数
const handleZoomIn = () => {
  if (canZoomIn.value) {
    zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3)
  }
}

const handleZoomOut = () => {
  if (canZoomOut.value) {
    zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.3)
  }
}

const handleResetZoom = () => {
  zoomLevel.value = 1
}

const handleExport = () => {
  ElMessage.success('导出流程图功能开发中...')
}

const setTool = (tool) => {
  currentTool.value = tool
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

const toggleMinimap = () => {
  showMinimap.value = !showMinimap.value
}

const handleNodeClick = (node) => {
  selectedNode.value = node
  showProperties.value = true
}

const handleNodeHover = (node, isHovering) => {
  if (isHovering) {
    hoveredNode.value = node
    showTooltip.value = true
    
    nextTick(() => {
      if (chartContainer.value) {
        const rect = chartContainer.value.getBoundingClientRect()
        tooltipStyle.left = rect.left + 20 + 'px'
        tooltipStyle.top = rect.top + 20 + 'px'
      }
    })
  } else {
    showTooltip.value = false
    hoveredNode.value = null
  }
}

const handleMinimapClick = (event) => {
  // 计算点击位置并更新视口
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // 这里可以添加视口跳转逻辑
  console.log('Minimap clicked:', x, y)
}

// 鼠标事件处理
const isDragging = ref(false)
const dragStart = reactive({ x: 0, y: 0 })

const handleMouseDown = (event) => {
  if (currentTool.value === 'pan') {
    isDragging.value = true
    dragStart.x = event.clientX
    dragStart.y = event.clientY
    chartContainer.value.style.cursor = 'grabbing'
  }
}

const handleMouseMove = (event) => {
  if (isDragging.value && currentTool.value === 'pan') {
    const deltaX = event.clientX - dragStart.x
    const deltaY = event.clientY - dragStart.y
    
    // 这里可以添加平移逻辑
    console.log('Dragging:', deltaX, deltaY)
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  chartContainer.value.style.cursor = currentTool.value === 'pan' ? 'grab' : 'default'
}

const handleWheel = (event) => {
  if (event.ctrlKey) {
    event.preventDefault()
    if (event.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }
}

onMounted(() => {
  // 初始化小地图视口位置
  viewportX.value = 50
  viewportY.value = 30
})

onUnmounted(() => {
  // 清理事件监听
})
</script>

<style scoped>
.process-flow-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: white;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left h3 {
  margin: 0;
  color: #1d2129;
}

.header-right {
  display: flex;
  gap: 10px;
}

.chart-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: white;
}

.flow-chart-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.grid-pattern {
  pointer-events: none;
}

.node-group {
  cursor: pointer;
  transition: all 0.2s;
}

.node-group:hover {
  filter: brightness(1.1);
}

.node-rect {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.node-icon {
  pointer-events: none;
}

.node-text {
  font-size: 12px;
  font-weight: bold;
  pointer-events: none;
}

.connection-group {
  pointer-events: none;
}

.connection-path {
  stroke-dasharray: 0;
  transition: stroke-dasharray 0.3s;
}

.connection-label {
  font-size: 12px;
  background-color: white;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 10px;
  display: flex;
  gap: 15px;
  align-items: center;
}

.minimap {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.minimap-container {
  width: 100%;
  height: 100%;
}

.minimap-svg {
  width: 100%;
  height: 100%;
}

.minimap-node {
  stroke: #e4e7ed;
  stroke-width: 1;
}

.viewport-rect {
  stroke-dasharray: 5, 5;
  animation: dash 0.5s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}

.node-tooltip {
  position: fixed;
  background-color: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  z-index: 1000;
  min-width: 200px;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.tooltip-header strong {
  color: #1d2129;
}

.tooltip-content p {
  margin: 4px 0;
  color: #606266;
  font-size: 13px;
}

.tooltip-content strong {
  color: #1d2129;
}

.properties-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 300px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.panel-header h4 {
  margin: 0;
  color: #1d2129;
}

.panel-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .toolbar {
    top: 10px;
    left: 10px;
    padding: 8px;
    flex-wrap: wrap;
  }
  
  .properties-panel {
    width: 250px;
    right: 10px;
    top: 10px;
  }
  
  .minimap {
    bottom: 10px;
    right: 10px;
  }
}
</style>