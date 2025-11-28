<template>
  <div class="image-viewer">
    <!-- 缩略图列表 -->
    <div v-if="showThumbnails" class="thumbnail-container">
      <div
        v-for="(image, index) in images"
        :key="index"
        class="thumbnail-item"
        :class="{ active: activeIndex === index }"
        @click="handleThumbnailClick(index)"
      >
        <el-image
          :src="image.url || image"
          fit="cover"
          :preview-src-list="previewSrcList"
          :initial-index="index"
          :on-prev="handlePrev"
          :on-next="handleNext"
        >
          <template #error>
            <div class="image-fallback">
              <el-icon><picture /></el-icon>
              <span>{{ image.name || '图片' }}</span>
            </div>
          </template>
        </el-image>
      </div>
    </div>

    <!-- 单张图片预览 -->
    <div v-else-if="images.length === 1" class="single-image-container">
      <el-image
        :src="images[0].url || images[0]"
        fit="contain"
        :preview-src-list="previewSrcList"
        :zoom-rate="zoomRate"
        :max-scale="maxScale"
        :min-scale="minScale"
        :preview-teleported="previewTeleported"
        @load="handleLoad"
        @error="handleError"
      >
        <template #error>
          <div class="image-fallback">
            <el-icon><picture /></el-icon>
            <span>{{ images[0].name || '图片' }}</span>
          </div>
        </template>
      </el-image>
    </div>

    <!-- 多张图片轮播 -->
    <div v-else-if="images.length > 1 && !showThumbnails" class="carousel-container">
      <el-carousel
        v-model="activeIndex"
        :interval="0"
        type="card"
        height="300px"
        indicator-position="none"
      >
        <el-carousel-item v-for="(image, index) in images" :key="index">
          <el-image
            :src="image.url || image"
            fit="contain"
            :preview-src-list="previewSrcList"
            :initial-index="index"
            class="carousel-image"
          >
            <template #error>
              <div class="image-fallback">
                <el-icon><picture /></el-icon>
                <span>{{ image.name || '图片' }}</span>
              </div>
            </template>
          </el-image>
        </el-carousel-item>
      </el-carousel>
      
      <!-- 图片指示器 -->
      <div class="carousel-indicator">
        <span>{{ activeIndex + 1 }} / {{ images.length }}</span>
      </div>
    </div>

    <!-- 无图片时显示 -->
    <div v-if="images.length === 0" class="empty-container">
      <el-empty description="暂无图片" :image-size="100" />
    </div>

    <!-- 操作工具栏 -->
    <div v-if="showToolbar && images.length > 0" class="toolbar">
      <el-tooltip effect="dark" content="上一张" placement="top">
        <el-button
          circle
          size="small"
          @click="handlePrev"
          :disabled="activeIndex === 0"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip effect="dark" content="下一张" placement="top">
        <el-button
          circle
          size="small"
          @click="handleNext"
          :disabled="activeIndex === images.length - 1"
        >
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-divider direction="vertical" />
      
      <el-tooltip effect="dark" content="查看原图" placement="top">
        <el-button
          circle
          size="small"
          @click="handleViewOriginal"
        >
          <el-icon><ZoomIn /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip effect="dark" content="下载图片" placement="top">
        <el-button
          circle
          size="small"
          @click="handleDownload"
        >
          <el-icon><Download /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip effect="dark" content="全屏查看" placement="top">
        <el-button
          circle
          size="small"
          @click="handleFullscreen"
        >
          <el-icon><FullScreen /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, ArrowLeft, ArrowRight, ZoomIn, Download, FullScreen } from '@element-plus/icons-vue'

// 图片数据类型
interface ImageItem {
  url: string
  name?: string
  width?: number
  height?: number
}

// Props 定义
interface Props {
  images?: (string | ImageItem)[]
  initialIndex?: number
  showThumbnails?: boolean
  showToolbar?: boolean
  zoomRate?: number
  maxScale?: number
  minScale?: number
  previewTeleported?: boolean
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  images: () => [],
  initialIndex: 0,
  showThumbnails: false,
  showToolbar: true,
  zoomRate: 0.1,
  maxScale: 5,
  minScale: 0.1,
  previewTeleported: true,
  height: 300
})

// Emits 定义
const emit = defineEmits<{
  'update:activeIndex': [index: number]
  'change': [index: number]
  'load': [image: string | ImageItem]
  'error': [error: any, image: string | ImageItem]
  'click': [image: string | ImageItem, index: number]
}>()

// 响应式数据
const activeIndex = ref(props.initialIndex)
const isFullscreen = ref(false)

// 计算预览图片列表
const previewSrcList = computed(() => {
  return props.images.map(image => {
    return typeof image === 'string' ? image : image.url
  })
})

// 处理缩略图点击
const handleThumbnailClick = (index: number) => {
  activeIndex.value = index
  emit('update:activeIndex', index)
  emit('change', index)
}

// 上一张
const handlePrev = () => {
  if (activeIndex.value > 0) {
    activeIndex.value--
    emit('update:activeIndex', activeIndex.value)
    emit('change', activeIndex.value)
  }
}

// 下一张
const handleNext = () => {
  if (activeIndex.value < props.images.length - 1) {
    activeIndex.value++
    emit('update:activeIndex', activeIndex.value)
    emit('change', activeIndex.value)
  }
}

// 图片加载成功
const handleLoad = () => {
  const currentImage = props.images[activeIndex.value]
  emit('load', currentImage)
}

// 图片加载失败
const handleError = (error: any) => {
  const currentImage = props.images[activeIndex.value]
  emit('error', error, currentImage)
}

// 查看原图
const handleViewOriginal = () => {
  const currentImage = props.images[activeIndex.value]
  const imageUrl = typeof currentImage === 'string' ? currentImage : currentImage.url
  
  // 在新窗口打开原图
  window.open(imageUrl, '_blank')
}

// 下载图片
const handleDownload = async () => {
  const currentImage = props.images[activeIndex.value]
  const imageUrl = typeof currentImage === 'string' ? currentImage : currentImage.url
  const imageName = typeof currentImage === 'string' ? `image_${activeIndex.value}` : (currentImage.name || `image_${activeIndex.value}`)
  
  try {
    // 创建一个临时的链接元素
    const link = document.createElement('a')
    
    // 处理跨域图片
    if (imageUrl.includes('://') && !imageUrl.includes(window.location.hostname)) {
      // 对于跨域图片，使用fetch转换为blob
      const response = await fetch(imageUrl, {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      })
      
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      link.href = objectUrl
      
      // 清理
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
      }, 100)
    } else {
      link.href = imageUrl
    }
    
    link.download = imageName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('图片下载成功')
  } catch (error) {
    console.error('下载图片失败:', error)
    ElMessage.error('图片下载失败')
  }
}

// 全屏查看
const handleFullscreen = () => {
  const container = document.querySelector('.image-viewer')
  if (!container) return
  
  if (!isFullscreen.value) {
    // 进入全屏
    if (container.requestFullscreen) {
      container.requestFullscreen()
    } else if (container.msRequestFullscreen) {
      container.msRequestFullscreen()
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen()
    } else if (container.mozRequestFullScreen) {
      container.mozRequestFullScreen()
    }
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    }
  }
}

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!(document.fullscreenElement || 
                         document.msFullscreenElement || 
                         document.webkitFullscreenElement || 
                         document.mozFullScreenElement)
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (isFullscreen.value) {
    switch (event.key) {
      case 'ArrowLeft':
        handlePrev()
        break
      case 'ArrowRight':
        handleNext()
        break
      case 'Escape':
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
        break
    }
  }
}

// 组件挂载
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)
  document.addEventListener('keydown', handleKeydown)
  
  // 初始化activeIndex
  if (props.initialIndex >= 0 && props.initialIndex < props.images.length) {
    activeIndex.value = props.initialIndex
  } else {
    activeIndex.value = 0
  }
})

// 组件卸载
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.image-viewer {
  width: 100%;
  position: relative;
}

/* 缩略图样式 */
.thumbnail-container {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.thumbnail-item {
  width: 100px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.thumbnail-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.thumbnail-item.active {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.thumbnail-item :deep(.el-image) {
  width: 100%;
  height: 100%;
}

/* 单张图片样式 */
.single-image-container {
  width: 100%;
  height: v-bind('props.height');
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.single-image-container :deep(.el-image) {
  max-width: 100%;
  max-height: 100%;
}

/* 轮播图样式 */
.carousel-container {
  position: relative;
}

.carousel-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

/* 空状态样式 */
.empty-container {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 8px;
}

/* 图片加载失败样式 */
.image-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;
  color: #909399;
}

.image-fallback :deep(.el-icon) {
  font-size: 24px;
  margin-bottom: 8px;
}

.image-fallback span {
  font-size: 12px;
}

/* 工具栏样式 */
.toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.toolbar :deep(.el-button) {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
}

.toolbar :deep(.el-button:hover) {
  background-color: rgba(255, 255, 255, 0.3);
}

.toolbar :deep(.el-button.is-disabled) {
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}

.toolbar :deep(.el-divider__vertical) {
  background-color: rgba(255, 255, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .thumbnail-container {
    padding: 12px;
  }
  
  .thumbnail-item {
    width: 80px;
    height: 80px;
  }
  
  .toolbar {
    bottom: 10px;
    padding: 6px 12px;
  }
  
  .toolbar :deep(.el-button) {
    width: 32px;
    height: 32px;
    padding: 0;
  }
  
  .carousel-indicator {
    bottom: 10px;
  }
}
</style>