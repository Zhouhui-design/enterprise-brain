<template>
  <div class="design-viewer" :class="{ 'full-mode': mode === 'full' }">
    <!-- 查看器头部工具栏 -->
    <div class="viewer-toolbar" v-if="mode !== 'review'">
      <div class="toolbar-left">
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
        
        <el-divider direction="vertical" />
        
        <el-button-group>
          <el-button size="small" @click="handleRotateLeft">
            <el-icon><RefreshLeft /></el-icon>
          </el-button>
          <el-button size="small" @click="handleRotateRight">
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </el-button-group>
        
        <el-divider direction="vertical" />
        
        <el-button-group>
          <el-button size="small" @click="handleFitWidth">适应宽度</el-button>
          <el-button size="small" @click="handleFitHeight">适应高度</el-button>
          <el-button size="small" @click="handleFitScreen">适应屏幕</el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-center">
        <span class="zoom-info">{{ Math.round(zoomLevel * 100) }}%</span>
      </div>
      
      <div class="toolbar-right">
        <el-button size="small" @click="handleFullscreen" v-if="mode !== 'full'">
          <el-icon><FullScreen /></el-icon>
          全屏
        </el-button>
        <el-button size="small" @click="handleDownload" type="primary">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
        <el-button size="small" @click="handlePrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
      </div>
    </div>

    <!-- 评审模式工具栏 -->
    <div class="review-toolbar" v-if="mode === 'review'">
      <div class="toolbar-left">
        <el-button-group>
          <el-button size="small" @click="handleZoomIn" :disabled="!canZoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button size="small" @click="handleZoomOut" :disabled="!canZoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
        </el-button-group>
        
        <el-divider direction="vertical" />
        
        <el-button-group>
          <el-button size="small" type="primary" @click="setTool('comment')" :class="{ active: currentTool === 'comment' }">
            <el-icon><ChatDotRound /></el-icon>
            评论
          </el-button>
          <el-button size="small" type="danger" @click="setTool('highlight')" :class="{ active: currentTool === 'highlight' }">
            <el-icon><Highlight /></el-icon>
            高亮
          </el-button>
          <el-button size="small" type="warning" @click="setTool('draw')" :class="{ active: currentTool === 'draw' }">
            <el-icon><EditPen /></el-icon>
            标注
          </el-button>
          <el-button size="small" type="info" @click="setTool('select')" :class="{ active: currentTool === 'select' }">
            <el-icon><Pointer /></el-icon>
            选择
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-center">
        <span class="zoom-info">{{ Math.round(zoomLevel * 100) }}%</span>
      </div>
      
      <div class="toolbar-right">
        <el-button size="small" @click="handleSaveComments" type="primary">
          <el-icon><Check /></el-icon>
          保存评审
        </el-button>
        <el-button size="small" @click="handleClearComments">
          <el-icon><Delete /></el-icon>
          清除标注
        </el-button>
      </div>
    </div>

    <!-- 主查看区域 -->
    <div class="viewer-container" ref="viewerContainer">
      <!-- 文件信息栏 -->
      <div class="file-info-bar" v-if="designInfo">
        <div class="file-info">
          <span class="file-name">{{ designInfo.name }}</span>
          <el-tag size="small" :type="getFileTypeColor(designInfo.type)">
            {{ designInfo.type.toUpperCase() }}
          </el-tag>
          <span class="file-size">{{ formatFileSize(designInfo.size) }}</span>
          <span class="update-time">更新时间: {{ formatTime(designInfo.updateTime) }}</span>
        </div>
      </div>

      <!-- 查看器主体 -->
      <div class="viewer-main" ref="viewerMain" @wheel="handleWheel" @mousedown="handleMouseDown">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-loading-spinner />
          <p>正在加载设计文件...</p>
        </div>

        <!-- PDF查看器 -->
        <div v-else-if="fileType === 'pdf'" class="pdf-viewer" ref="pdfViewer">
          <iframe
            v-if="pdfUrl"
            :src="pdfUrl"
            width="100%"
            :height="viewerHeight"
            frameborder="0"
            @load="handlePdfLoad"
          ></iframe>
          <div v-else class="pdf-placeholder">
            <el-icon size="64" color="#909399"><Document /></el-icon>
            <p>PDF文件加载失败</p>
          </div>
        </div>

        <!-- 图片查看器 -->
        <div v-else-if="['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType)" class="image-viewer">
          <div class="image-container" :style="imageContainerStyle">
            <img
              :src="imageUrl"
              :style="imageStyle"
              @load="handleImageLoad"
              @error="handleImageError"
              draggable="false"
            />
            
            <!-- 评审标注层 -->
            <div class="annotation-layer" v-if="mode === 'review'" @click="handleAnnotationClick">
              <!-- 评论标注 -->
              <div
                v-for="comment in annotations.comments"
                :key="comment.id"
                class="comment-annotation"
                :style="{ left: comment.x + 'px', top: comment.y + 'px' }"
                @click.stop="showCommentDetail(comment)"
              >
                <el-icon><ChatDotRound /></el-icon>
                <span class="comment-number">{{ comment.number }}</span>
              </div>
              
              <!-- 高亮区域 -->
              <div
                v-for="highlight in annotations.highlights"
                :key="highlight.id"
                class="highlight-annotation"
                :style="{
                  left: highlight.x + 'px',
                  top: highlight.y + 'px',
                  width: highlight.width + 'px',
                  height: highlight.height + 'px'
                }"
                :style="{ backgroundColor: highlight.color + '40', borderColor: highlight.color }"
              ></div>
              
              <!-- 绘制标注 -->
              <svg class="draw-layer" :width="canvasWidth" :height="canvasHeight">
                <path
                  v-for="drawing in annotations.drawings"
                  :key="drawing.id"
                  :d="drawing.path"
                  :stroke="drawing.color"
                  :stroke-width="drawing.width"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- CAD文件查看器 -->
        <div v-else-if="['dwg', 'dxf'].includes(fileType)" class="cad-viewer">
          <div class="cad-container">
            <canvas ref="cadCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
            <div class="cad-controls">
              <el-button size="small" @click="handleCadPan">平移</el-button>
              <el-button size="small" @click="handleCadZoomWindow">窗口缩放</el-button>
              <el-button size="small" @click="handleCadZoomAll">显示全部</el-button>
              <el-button size="small" @click="handleCadRotate">旋转</el-button>
            </div>
          </div>
        </div>

        <!-- 3D模型查看器 -->
        <div v-else-if="['step', 'stp', 'iges', 'igs'].includes(fileType)" class="model-viewer">
          <div class="model-container">
            <canvas ref="modelCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
            <div class="model-controls">
              <el-button size="small" @click="handleModelRotate">旋转</el-button>
              <el-button size="small" @click="handleModelPan">平移</el-button>
              <el-button size="small" @click="handleModelZoom">缩放</el-button>
              <el-button size="small" @click="handleModelResetView">重置视图</el-button>
              <el-button size="small" @click="handleModelWireframe">线框模式</el-button>
            </div>
          </div>
        </div>

        <!-- 不支持的文件类型 -->
        <div v-else class="unsupported-viewer">
          <el-icon size="64" color="#909399"><DocumentRemove /></el-icon>
          <h3>不支持的文件类型</h3>
          <p>当前文件类型 ({{ fileType }}) 暂不支持在线预览</p>
          <el-button type="primary" @click="handleDownload">下载文件</el-button>
        </div>
      </div>

      <!-- 页面导航 (PDF) -->
      <div class="page-navigation" v-if="fileType === 'pdf' && totalPages > 1">
        <el-button size="small" @click="prevPage" :disabled="currentPage <= 1">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <el-button size="small" @click="nextPage" :disabled="currentPage >= totalPages">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-input-number
          v-model="jumpToPage"
          :min="1"
          :max="totalPages"
          size="small"
          style="width: 80px; margin-left: 10px;"
          @change="handleJumpPage"
        />
      </div>
    </div>

    <!-- 评论详情对话框 -->
    <el-dialog
      v-model="commentDialogVisible"
      title="评论详情"
      width="500px"
    >
      <div v-if="selectedComment" class="comment-detail">
        <div class="comment-author">
          <el-avatar size="small">{{ selectedComment.author.charAt(0) }}</el-avatar>
          <span>{{ selectedComment.author }}</span>
          <span class="comment-time">{{ formatTime(selectedComment.time) }}</span>
        </div>
        <div class="comment-content">{{ selectedComment.content }}</div>
      </div>
      <template #footer>
        <el-button @click="commentDialogVisible = false">关闭</el-button>
        <el-button type="danger" @click="handleDeleteComment">删除</el-button>
      </template>
    </el-dialog>

    <!-- 添加评论对话框 -->
    <el-dialog
      v-model="addCommentDialogVisible"
      title="添加评论"
      width="500px"
    >
      <el-form>
        <el-form-item label="评论内容">
          <el-input
            v-model="newCommentContent"
            type="textarea"
            :rows="4"
            placeholder="请输入评论内容"
          />
        </el-form-item>
        <el-form-item label="评论类型">
          <el-radio-group v-model="newCommentType">
            <el-radio label="suggestion">建议</el-radio>
            <el-radio label="issue">问题</el-radio>
            <el-radio label="approval">同意</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addCommentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddComment">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ZoomIn,
  ZoomOut,
  Refresh,
  RefreshLeft,
  RefreshRight,
  FullScreen,
  Download,
  Printer,
  ChatDotRound,
  Highlight,
  EditPen,
  Pointer,
  Check,
  Delete,
  Document,
  DocumentRemove,
  ArrowLeft,
  ArrowRight
} from '@element-plus/icons-vue'

const props = defineProps({
  designId: {
    type: [String, Number],
    required: true
  },
  mode: {
    type: String,
    default: 'view', // view, review, full
    validator: (value) => ['view', 'review', 'full'].includes(value)
  }
})

// 响应式数据
const viewerContainer = ref(null)
const viewerMain = ref(null)
const pdfViewer = ref(null)
const cadCanvas = ref(null)
const modelCanvas = ref(null)

const loading = ref(false)
const zoomLevel = ref(1)
const rotation = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const jumpToPage = ref(1)
const currentTool = ref('select')
const isDragging = ref(false)
const dragStart = reactive({ x: 0, y: 0 })
const canvasSize = reactive({ width: 800, height: 600 })

// 文件信息
const designInfo = ref(null)
const fileType = ref('')
const pdfUrl = ref('')
const imageUrl = ref('')

// 评审相关
const commentDialogVisible = ref(false)
const addCommentDialogVisible = ref(false)
const selectedComment = ref(null)
const newCommentContent = ref('')
const newCommentType = ref('suggestion')
const isDrawing = ref(false)
const drawingPath = ref([])

// 标注数据
const annotations = reactive({
  comments: [
    {
      id: 1,
      number: 1,
      x: 100,
      y: 150,
      author: '张三',
      content: '这里的设计需要优化',
      time: '2024-03-15 10:30:00',
      type: 'suggestion'
    },
    {
      id: 2,
      number: 2,
      x: 300,
      y: 250,
      author: '李四',
      content: '这个尺寸标注有误',
      time: '2024-03-15 11:20:00',
      type: 'issue'
    }
  ],
  highlights: [
    {
      id: 1,
      x: 200,
      y: 200,
      width: 150,
      height: 100,
      color: '#ff6b6b'
    }
  ],
  drawings: [
    {
      id: 1,
      path: 'M 250 300 L 350 400 L 450 350',
      color: '#4ecdc4',
      width: 3
    }
  ]
})

// 计算属性
const canZoomIn = computed(() => zoomLevel.value < 5)
const canZoomOut = computed(() => zoomLevel.value > 0.1)
const viewerHeight = computed(() => props.mode === 'full' ? 'calc(100vh - 120px)' : '500px')
const canvasWidth = computed(() => canvasSize.width)
const canvasHeight = computed(() => canvasSize.height)

const imageContainerStyle = computed(() => ({
  width: canvasWidth.value + 'px',
  height: canvasHeight.value + 'px',
  transform: `scale(${zoomLevel.value}) rotate(${rotation.value}deg)`
}))

const imageStyle = computed(() => ({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain'
}))

// 工具方法
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const getFileTypeColor = (type) => {
  const colorMap = {
    pdf: 'danger',
    jpg: 'success',
    png: 'success',
    dwg: 'primary',
    step: 'warning'
  }
  return colorMap[type] || 'info'
}

// 加载设计文件
const loadDesignFile = async () => {
  loading.value = true
  
  try {
    // 模拟加载设计信息
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    designInfo.value = {
      id: props.designId,
      name: '机械臂装配图.dwg',
      type: 'dwg',
      size: 5242880,
      updateTime: '2024-03-15 14:30:00'
    }
    
    fileType.value = designInfo.value.type
    
    // 根据文件类型加载对应的内容
    if (fileType.value === 'pdf') {
      pdfUrl.value = '/api/designs/' + props.designId + '/pdf'
      totalPages.value = 10
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType.value)) {
      imageUrl.value = '/api/designs/' + props.designId + '/image'
    } else if (['dwg', 'dxf'].includes(fileType.value)) {
      initCadViewer()
    } else if (['step', 'stp', 'iges', 'igs'].includes(fileType.value)) {
      initModelViewer()
    }
    
    // 设置画布大小
    updateCanvasSize()
    
  } catch (error) {
    console.error('加载设计文件失败:', error)
    ElMessage.error('加载设计文件失败')
  } finally {
    loading.value = false
  }
}

// 更新画布大小
const updateCanvasSize = () => {
  if (viewerMain.value) {
    const rect = viewerMain.value.getBoundingClientRect()
    canvasSize.width = rect.width
    canvasSize.height = rect.height - 100 // 减去工具栏高度
  }
}

// 初始化CAD查看器
const initCadViewer = () => {
  nextTick(() => {
    if (cadCanvas.value) {
      const ctx = cadCanvas.value.getContext('2d')
      // 这里应该集成CAD查看库，如OpenLayers.js或其他CAD解析库
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
      ctx.fillStyle = '#333'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('CAD文件查看器', canvasWidth.value / 2, canvasHeight.value / 2)
    }
  })
}

// 初始化3D模型查看器
const initModelViewer = () => {
  nextTick(() => {
    if (modelCanvas.value) {
      const ctx = modelCanvas.value.getContext('2d')
      // 这里应该集成3D查看库，如Three.js
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
      ctx.fillStyle = '#333'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('3D模型查看器', canvasWidth.value / 2, canvasHeight.value / 2)
    }
  })
}

// 事件处理函数
const handleZoomIn = () => {
  if (canZoomIn.value) {
    zoomLevel.value = Math.min(zoomLevel.value * 1.2, 5)
  }
}

const handleZoomOut = () => {
  if (canZoomOut.value) {
    zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.1)
  }
}

const handleResetZoom = () => {
  zoomLevel.value = 1
  rotation.value = 0
}

const handleRotateLeft = () => {
  rotation.value -= 90
}

const handleRotateRight = () => {
  rotation.value += 90
}

const handleFitWidth = () => {
  // 实现适应宽度的逻辑
  ElMessage.info('适应宽度')
}

const handleFitHeight = () => {
  // 实现适应高度的逻辑
  ElMessage.info('适应高度')
}

const handleFitScreen = () => {
  // 实现适应屏幕的逻辑
  ElMessage.info('适应屏幕')
}

const handleFullscreen = () => {
  // 实现全屏逻辑
  ElMessage.info('全屏查看')
}

const handleDownload = () => {
  ElMessage.success('开始下载设计文件')
}

const handlePrint = () => {
  window.print()
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

const handleMouseDown = (event) => {
  if (props.mode === 'review' && currentTool.value !== 'select') {
    isDragging.value = true
    dragStart.x = event.offsetX
    dragStart.y = event.offsetY
    
    if (currentTool.value === 'draw') {
      drawingPath.value = [[dragStart.x, dragStart.y]]
    }
  }
}

const handleMouseMove = (event) => {
  if (isDragging.value && props.mode === 'review') {
    const currentX = event.offsetX
    const currentY = event.offsetY
    
    if (currentTool.value === 'draw') {
      drawingPath.value.push([currentX, currentY])
    }
  }
}

const handleMouseUp = (event) => {
  if (isDragging.value && props.mode === 'review') {
    const endX = event.offsetX
    const endY = event.offsetY
    
    if (currentTool.value === 'comment') {
      addCommentDialogVisible.value = true
    } else if (currentTool.value === 'highlight') {
      const highlight = {
        id: Date.now(),
        x: Math.min(dragStart.x, endX),
        y: Math.min(dragStart.y, endY),
        width: Math.abs(endX - dragStart.x),
        height: Math.abs(endY - dragStart.y),
        color: '#ff6b6b'
      }
      annotations.highlights.push(highlight)
    } else if (currentTool.value === 'draw' && drawingPath.value.length > 1) {
      const pathString = drawingPath.value.map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`
      ).join(' ')
      
      const drawing = {
        id: Date.now(),
        path: pathString,
        color: '#4ecdc4',
        width: 3
      }
      annotations.drawings.push(drawing)
      drawingPath.value = []
    }
    
    isDragging.value = false
  }
}

const handleAnnotationClick = (event) => {
  if (currentTool.value === 'select') {
    return
  }
  
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  if (currentTool.value === 'comment') {
    addCommentDialogVisible.value = true
  }
}

// 评审工具相关
const setTool = (tool) => {
  currentTool.value = tool
  viewerContainer.value.style.cursor = tool === 'select' ? 'default' : 'crosshair'
}

const showCommentDetail = (comment) => {
  selectedComment.value = comment
  commentDialogVisible.value = true
}

const handleAddComment = () => {
  if (!newCommentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  const comment = {
    id: Date.now(),
    number: annotations.comments.length + 1,
    x: 200 + Math.random() * 200,
    y: 150 + Math.random() * 200,
    author: '当前用户',
    content: newCommentContent.value,
    time: new Date().toISOString(),
    type: newCommentType.value
  }
  
  annotations.comments.push(comment)
  addCommentDialogVisible.value = false
  newCommentContent.value = ''
  ElMessage.success('评论添加成功')
}

const handleDeleteComment = () => {
  if (selectedComment.value) {
    const index = annotations.comments.findIndex(c => c.id === selectedComment.value.id)
    if (index > -1) {
      annotations.comments.splice(index, 1)
      commentDialogVisible.value = false
      ElMessage.success('评论删除成功')
    }
  }
}

const handleSaveComments = () => {
  ElMessage.success('评审意见保存成功')
}

const handleClearComments = () => {
  ElMessageBox.confirm('确定清除所有标注吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    annotations.comments = []
    annotations.highlights = []
    annotations.drawings = []
    ElMessage.success('标注已清除')
  })
}

// PDF相关
const handlePdfLoad = () => {
  loading.value = false
}

const handleImageLoad = () => {
  loading.value = false
}

const handleImageError = () => {
  loading.value = false
  ElMessage.error('图片加载失败')
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const handleJumpPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// CAD相关
const handleCadPan = () => {
  ElMessage.info('CAD平移模式')
}

const handleCadZoomWindow = () => {
  ElMessage.info('CAD窗口缩放')
}

const handleCadZoomAll = () => {
  ElMessage.info('显示全部')
}

const handleCadRotate = () => {
  ElMessage.info('CAD旋转')
}

// 3D模型相关
const handleModelRotate = () => {
  ElMessage.info('3D模型旋转')
}

const handleModelPan = () => {
  ElMessage.info('3D模型平移')
}

const handleModelZoom = () => {
  ElMessage.info('3D模型缩放')
}

const handleModelResetView = () => {
  ElMessage.info('重置3D视图')
}

const handleModelWireframe = () => {
  ElMessage.info('切换线框模式')
}

// 生命周期
onMounted(() => {
  loadDesignFile()
  
  // 监听鼠标移动和释放事件
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  
  // 监听窗口大小变化
  window.addEventListener('resize', updateCanvasSize)
})

onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('resize', updateCanvasSize)
})
</script>

<style scoped>
.design-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.design-viewer.full-mode {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background-color: #1a1a1a;
}

.viewer-toolbar,
.review-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: white;
  border-bottom: 1px solid #dcdfe6;
  flex-shrink: 0;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zoom-info {
  font-size: 14px;
  color: #606266;
  min-width: 50px;
  text-align: center;
}

.viewer-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-info-bar {
  padding: 8px 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 13px;
  color: #606266;
}

.file-name {
  font-weight: bold;
  color: #1d2129;
}

.viewer-main {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.loading-container p {
  margin-top: 15px;
}

.pdf-viewer,
.image-viewer,
.cad-viewer,
.model-viewer {
  width: 100%;
  height: 100%;
  position: relative;
}

.pdf-placeholder,
.unsupported-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.pdf-placeholder p,
.unsupported-viewer h3,
.unsupported-viewer p {
  margin: 10px 0;
}

.image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
  transition: transform 0.3s ease;
}

.image-container img {
  display: block;
  user-select: none;
}

.annotation-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.annotation-layer.show-pointer {
  pointer-events: auto;
}

.comment-annotation {
  position: absolute;
  background-color: #409EFF;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.comment-number {
  font-weight: bold;
}

.highlight-annotation {
  position: absolute;
  border: 2px solid;
  border-radius: 4px;
  pointer-events: auto;
  cursor: pointer;
}

.draw-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.cad-controls,
.model-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.page-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 10px;
  background-color: white;
  border-top: 1px solid #dcdfe6;
  flex-shrink: 0;
}

.page-info {
  font-size: 14px;
  color: #606266;
  min-width: 80px;
  text-align: center;
}

.comment-detail {
  padding: 15px 0;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-author span {
  font-weight: bold;
  color: #1d2129;
}

.comment-time {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.comment-content {
  color: #606266;
  line-height: 1.5;
}

.active {
  background-color: #409EFF !important;
  color: white !important;
}

/* 全屏模式样式调整 */
.design-viewer.full-mode .viewer-toolbar,
.design-viewer.full-mode .review-toolbar {
  background-color: #2d2d2d;
  border-color: #404040;
}

.design-viewer.full-mode .zoom-info,
.design-viewer.full-mode .file-info {
  color: #cccccc;
}

.design-viewer.full-mode .file-info-bar {
  background-color: #2d2d2d;
  border-color: #404040;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .viewer-toolbar,
  .review-toolbar {
    flex-direction: column;
    gap: 10px;
    padding: 8px;
  }
  
  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
  
  .file-info {
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
  }
  
  .cad-controls,
  .model-controls {
    bottom: 10px;
    padding: 8px;
  }
  
  .cad-controls .el-button,
  .model-controls .el-button {
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>