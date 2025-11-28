<template>
  <div class="file-uploader">
    <el-upload
      v-model:file-list="fileList"
      class="upload-demo"
      :action="uploadUrl"
      :multiple="multiple"
      :limit="limit"
      :on-exceed="handleExceed"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-progress="handleProgress"
      :on-remove="handleRemove"
      :before-upload="beforeUpload"
      :before-remove="beforeRemove"
      :accept="accept"
      :disabled="disabled"
      :auto-upload="autoUpload"
      drag
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将文件拖到此处，或 <em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          <span v-if="fileType === 'image'">支持 jpg/png/jpeg/gif/webp 格式，单个文件大小不超过 {{ maxSize / 1024 }}MB</span>
          <span v-else-if="fileType === 'document'">支持 doc/docx/pdf/xlsx/xls/ppt/pptx/txt 格式，单个文件大小不超过 {{ maxSize / 1024 }}MB</span>
          <span v-else>{{ accept }} 格式，单个文件大小不超过 {{ maxSize / 1024 }}MB</span>
          <span v-if="limit > 0">，最多上传 {{ limit }} 个文件</span>
        </div>
      </template>
      
      <!-- 自定义文件列表 -->
      <template #file="{ file }">
        <div class="custom-file-item">
          <!-- 文件图标或预览 -->
          <div class="file-preview">
            <el-image
              v-if="isImage(file.name)"
              :src="file.url || file.thumbUrl"
              :preview-src-list="getPreviewSrcList"
              fit="cover"
              class="image-preview"
            />
            <el-icon v-else class="file-icon"><document /></el-icon>
          </div>
          
          <!-- 文件信息 -->
          <div class="file-info">
            <div class="file-name" :title="file.name">{{ truncateFileName(file.name, 15) }}</div>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              
              <!-- 上传进度 -->
              <div v-if="file.status === 'uploading'" class="upload-progress">
                <el-progress :percentage="file.percentage || 0" :stroke-width="6" />
              </div>
              
              <!-- 上传状态 -->
              <div v-else class="file-status">
                <el-icon v-if="file.status === 'success'" class="status-icon success"><success /></el-icon>
                <el-icon v-else-if="file.status === 'error'" class="status-icon error"><close /></el-icon>
              </div>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="file-actions">
            <el-button
              v-if="file.status !== 'uploading' && !disabled"
              type="text"
              size="small"
              @click.stop="handleRemove(file)"
              class="remove-btn"
            >
              <el-icon><delete /></el-icon>
            </el-button>
          </div>
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document, Success, Close, Delete } from '@element-plus/icons-vue'

// 文件类型定义
interface UploadFile {
  name: string
  url?: string
  thumbUrl?: string
  size: number
  status?: 'ready' | 'uploading' | 'success' | 'error'
  percentage?: number
  raw?: File
  uid: string
}

// Props 定义
interface Props {
  modelValue?: UploadFile[]
  fileType?: 'image' | 'document' | 'all'
  maxSize?: number // 单位 KB
  limit?: number
  multiple?: boolean
  accept?: string
  uploadUrl?: string
  disabled?: boolean
  autoUpload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  fileType: 'all',
  maxSize: 1024 * 10, // 默认10MB
  limit: 0, // 0表示不限制
  multiple: true,
  accept: '',
  uploadUrl: '/api/upload', // 默认上传地址
  disabled: false,
  autoUpload: true
})

// Emits 定义
const emit = defineEmits<{
  'update:modelValue': [files: UploadFile[]]
  'change': [files: UploadFile[]]
  'success': [file: UploadFile, response: any]
  'error': [error: any, file: UploadFile]
  'upload-progress': [file: UploadFile, percentage: number]
}>()

// 文件列表
const fileList = ref<UploadFile[]>([])

// 根据文件类型自动设置accept
const computedAccept = computed(() => {
  if (props.accept) return props.accept
  
  switch (props.fileType) {
    case 'image':
      return 'image/jpg,image/jpeg,image/png,image/gif,image/webp'
    case 'document':
      return 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain'
    default:
      return ''
  }
})

// 获取预览图片列表（用于图片预览功能）
const getPreviewSrcList = computed(() => {
  return fileList.value
    .filter(file => isImage(file.name) && (file.url || file.thumbUrl))
    .map(file => file.url || file.thumbUrl || '')
})

// 判断是否为图片文件
const isImage = (filename: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return imageExtensions.includes(ext)
}

// 格式化文件大小
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 B'
  
  if (bytes < 1024) {
    return bytes + ' B'
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB'
  } else {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }
}

// 截断文件名
const truncateFileName = (filename: string, maxLength: number): string => {
  if (filename.length <= maxLength) return filename
  
  const extIndex = filename.lastIndexOf('.')
  if (extIndex > 0) {
    const ext = filename.substring(extIndex)
    const name = filename.substring(0, extIndex)
    const availableLength = maxLength - ext.length
    return name.substring(0, availableLength) + '...' + ext
  }
  
  return filename.substring(0, maxLength) + '...'
}

// 文件超出数量限制处理
const handleExceed = (files: File[], uploadFiles: UploadFile[]) => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
}

// 上传成功处理
const handleSuccess = (response: any, file: UploadFile, uploadFiles: UploadFile[]) => {
  emit('success', file, response)
  emit('update:modelValue', uploadFiles)
  emit('change', uploadFiles)
}

// 上传失败处理
const handleError = (error: any, file: UploadFile, uploadFiles: UploadFile[]) => {
  ElMessage.error('文件上传失败')
  emit('error', error, file)
}

// 上传进度处理
const handleProgress = (evt: ProgressEvent, file: UploadFile) => {
  const percentage = evt.loaded / evt.total! * 100
  emit('upload-progress', file, percentage)
}

// 删除文件处理
const handleRemove = (file: UploadFile) => {
  fileList.value = fileList.value.filter(f => f.uid !== file.uid)
  emit('update:modelValue', fileList.value)
  emit('change', fileList.value)
}

// 上传前验证
const beforeUpload = (rawFile: File): boolean | Promise<boolean> => {
  // 验证文件大小
  if (rawFile.size > props.maxSize * 1024) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize / 1024}MB`)
    return false
  }
  
  // 验证文件类型
  if (computedAccept.value && !computedAccept.value.includes(rawFile.type)) {
    ElMessage.error('文件类型不符合要求')
    return false
  }
  
  return true
}

// 删除前确认
const beforeRemove = (file: UploadFile): boolean | Promise<boolean> => {
  return new Promise(resolve => {
    ElMessage.confirm(`确定要删除文件「${file.name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        resolve(true)
      })
      .catch(() => {
        resolve(false)
      })
  })
}

// 监听外部传入的文件列表变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && Array.isArray(newValue)) {
      fileList.value = [...newValue]
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.file-uploader {
  width: 100%;
}

.upload-demo {
  width: 100%;
}

.custom-file-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 8px;
  background-color: #fafafa;
  transition: all 0.3s;
}

.custom-file-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-preview {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 24px;
  color: #909399;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.upload-progress {
  flex: 1;
  height: 6px;
}

.file-status {
  display: flex;
  align-items: center;
}

.status-icon {
  font-size: 14px;
  margin-left: 4px;
}

.status-icon.success {
  color: #67c23a;
}

.status-icon.error {
  color: #f56c6c;
}

.file-actions {
  margin-left: 12px;
}

.remove-btn {
  color: #909399;
  padding: 0;
  width: 24px;
  height: 24px;
  min-width: 24px;
  font-size: 14px;
}

.remove-btn:hover {
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .custom-file-item {
    flex-wrap: wrap;
  }
  
  .file-info {
    flex-basis: calc(100% - 76px);
  }
  
  .upload-progress {
    flex-basis: 100%;
    margin-top: 4px;
  }
}
</style>