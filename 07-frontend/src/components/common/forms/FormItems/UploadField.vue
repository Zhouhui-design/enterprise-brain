<template>
  <el-form-item
    :label="label"
    :prop="prop"
    :rules="rules"
    :required="required"
    :error="error"
    :validate-status="validateStatus"
    :size="size"
    :class="customClass"
    :style="customStyle"
  >
    <!-- 文件上传组件 -->
    <el-upload
      v-model:file-list="fileList"
      :action="action"
      :headers="headers"
      :method="method"
      :multiple="multiple"
      :data="data"
      :name="name"
      :with-credentials="withCredentials"
      :show-file-list="showFileList"
      :drag="drag"
      :accept="accept"
      :limit="limit"
      :before-upload="handleBeforeUpload"
      :before-remove="handleBeforeRemove"
      :on-progress="handleProgress"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :on-exceed="handleExceed"
      :on-download="handleDownload"
      :on-change="handleChange"
      :on-drop="handleDrop"
      :file-list="modelValue"
      :disabled="disabled"
      :auto-upload="autoUpload"
      :list-type="listType"
      :http-request="httpRequest"
      :upload-after-complete="uploadAfterComplete"
      :preview-src-list="previewSrcList"
      :upload-icon="uploadIcon"
      :placeholder="placeholder"
      :default-file-list="defaultFileList"
      :class="uploadClass"
      :id="id"
    >
      <!-- 拖拽上传区域 -->
      <template v-if="drag">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          <span>{{ dragText || '拖拽文件到此区域上传' }}</span>
          <span class="el-upload__text-desc" v-if="dragTextDesc">{{ dragTextDesc }}</span>
        </div>
        <template v-if="$slots.tip">
          <div class="el-upload__tip"><slot name="tip"></slot></div>
        </template>
        <template v-else-if="tip">
          <div class="el-upload__tip">{{ tip }}</div>
        </template>
      </template>
      
      <!-- 点击上传区域 -->
      <template v-else>
        <!-- 自定义上传按钮 -->
        <template v-if="$slots.trigger">
          <slot name="trigger"></slot>
        </template>
        
        <!-- 默认上传按钮 -->
        <template v-else>
          <el-button :size="size" :type="buttonType" :icon="buttonIcon">
            {{ multiple ? '选择多个文件' : '选择文件' }}
          </el-button>
        </template>
        
        <!-- 自定义文件列表 -->
        <template v-if="$slots.default">
          <slot v-bind="{ fileList: modelValue, disabled: disabled }"></slot>
        </template>
        
        <!-- 提示文本 -->
        <template v-if="$slots.tip">
          <div class="el-upload__tip"><slot name="tip"></slot></div>
        </template>
        <template v-else-if="tip">
          <div class="el-upload__tip">{{ tip }}</div>
        </template>
      </template>
      
      <!-- 自定义预览模板 -->
      <template #file="{ file }" v-if="$slots.file">
        <slot name="file" :file="file"></slot>
      </template>
      
      <!-- 自定义列表项 -->
      <template #list-header v-if="$slots['list-header']">
        <slot name="list-header"></slot>
      </template>
      
      <template #list-footer v-if="$slots['list-footer']">
        <slot name="list-footer"></slot>
      </template>
    </el-upload>
    
    <!-- 文件预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="previewDialogTitle"
      :width="previewDialogWidth"
      @close="handlePreviewClose"
      class="upload-preview-dialog"
    >
      <!-- 图片预览 -->
      <div v-if="isImagePreview" class="image-preview-container">
        <img :src="currentPreviewFile.url" alt="预览" class="preview-image" />
        <div class="preview-info">
          <span class="preview-name">{{ currentPreviewFile.name }}</span>
          <span class="preview-size">{{ formatFileSize(currentPreviewFile.size) }}</span>
        </div>
      </div>
      
      <!-- 其他文件类型预览 -->
      <div v-else class="other-preview-container">
        <div class="file-info">
          <el-icon class="file-icon"><Document /></el-icon>
          <div class="file-details">
            <div class="file-name">{{ currentPreviewFile.name }}</div>
            <div class="file-meta">
              <span>大小: {{ formatFileSize(currentPreviewFile.size) }}</span>
              <span v-if="currentPreviewFile.type">类型: {{ currentPreviewFile.type }}</span>
            </div>
          </div>
        </div>
        <el-button type="primary" @click="handleDownloadFile(currentPreviewFile)" :disabled="!currentPreviewFile.url">
          下载文件
        </el-button>
      </div>
    </el-dialog>
    
    <!-- 帮助文本 -->
    <template #help v-if="help || $slots.help">
      <slot name="help">{{ help }}</slot>
    </template>
  </el-form-item>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElUpload, ElButton, ElDialog, ElMessage } from 'element-plus'
import { UploadFilled, Document } from '@element-plus/icons-vue'

// 定义Props
const props = defineProps({
  // 绑定值（文件列表）
  modelValue: {
    type: Array,
    default: () => []
  },
  // 字段标签
  label: {
    type: String,
    default: ''
  },
  // 字段属性名，用于表单验证
  prop: {
    type: String,
    required: true
  },
  // 表单验证规则
  rules: {
    type: [Object, Array],
    default: () => {}
  },
  // 是否必填
  required: {
    type: Boolean,
    default: false
  },
  // 上传接口地址
  action: {
    type: String,
    default: ''
  },
  // 请求头
  headers: {
    type: Object,
    default: () => ({})
  },
  // 请求方法
  method: {
    type: String,
    default: 'post'
  },
  // 是否支持多选
  multiple: {
    type: Boolean,
    default: false
  },
  // 上传额外参数
  data: {
    type: [Object, Function],
    default: () => ({})
  },
  // 文件字段名
  name: {
    type: String,
    default: 'file'
  },
  // 是否携带凭证
  withCredentials: {
    type: Boolean,
    default: false
  },
  // 是否显示文件列表
  showFileList: {
    type: Boolean,
    default: true
  },
  // 是否启用拖拽上传
  drag: {
    type: Boolean,
    default: false
  },
  // 接受的文件类型
  accept: {
    type: String,
    default: ''
  },
  // 最大允许上传数量
  limit: {
    type: Number,
    default: 0
  },
  // 上传前钩子
  beforeUpload: {
    type: Function,
    default: null
  },
  // 移除前钩子
  beforeRemove: {
    type: Function,
    default: null
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否自动上传
  autoUpload: {
    type: Boolean,
    default: true
  },
  // 文件列表类型
  listType: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'picture', 'picture-card'].includes(value)
  },
  // 自定义上传方法
  httpRequest: {
    type: Function,
    default: null
  },
  // 上传完成后是否自动清除列表
  uploadAfterComplete: {
    type: Boolean,
    default: false
  },
  // 预览图列表
  previewSrcList: {
    type: Array,
    default: () => []
  },
  // 上传图标
  uploadIcon: {
    type: [String, Object],
    default: ''
  },
  // 占位文本
  placeholder: {
    type: String,
    default: ''
  },
  // 默认文件列表
  defaultFileList: {
    type: Array,
    default: () => []
  },
  // 拖拽上传文本
  dragText: {
    type: String,
    default: '拖拽文件到此区域上传'
  },
  // 拖拽上传描述
  dragTextDesc: {
    type: String,
    default: ''
  },
  // 提示文本
  tip: {
    type: String,
    default: ''
  },
  // 组件大小
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  // 按钮类型
  buttonType: {
    type: String,
    default: 'primary'
  },
  // 按钮图标
  buttonIcon: {
    type: [String, Object],
    default: 'el-icon-plus'
  },
  // 上传类名
  uploadClass: {
    type: [String, Array, Object],
    default: ''
  },
  // 自定义类名
  customClass: {
    type: [String, Array, Object],
    default: ''
  },
  // 自定义样式
  customStyle: {
    type: [String, Object],
    default: ''
  },
  // 错误提示信息
  error: {
    type: String,
    default: ''
  },
  // 验证状态
  validateStatus: {
    type: String,
    default: '',
    validator: (value) => ['', 'success', 'error', 'validating', 'warning'].includes(value)
  },
  // 帮助文本
  help: {
    type: String,
    default: ''
  },
  // id属性
  id: {
    type: String,
    default: ''
  }
})

// 定义Emits
const emit = defineEmits([
  'update:modelValue',
  'change',
  'before-upload',
  'before-remove',
  'progress',
  'success',
  'error',
  'preview',
  'remove',
  'exceed',
  'download',
  'drop',
  'upload-start',
  'upload-end'
])

// 内部状态
const fileList = ref([...props.modelValue])
const previewDialogVisible = ref(false)
const currentPreviewFile = ref({})
const isUploading = ref(false)

// 预览对话框配置
const previewDialogTitle = computed(() => currentPreviewFile.value.name || '文件预览')
const previewDialogWidth = computed(() => isImagePreview.value ? '80%' : '500px')

// 是否为图片预览
const isImagePreview = computed(() => {
  if (!currentPreviewFile.value.name) return false
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp']
  const extension = currentPreviewFile.value.name.split('.').pop()?.toLowerCase()
  return imageExtensions.includes(extension)
})

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  fileList.value = [...newValue]
}, { deep: true, immediate: true })

// 监听fileList变化
watch(fileList, (newValue) => {
  emit('update:modelValue', [...newValue])
}, { deep: true })

// 生命周期
onMounted(() => {
  // 初始化默认文件列表
  if (props.defaultFileList.length > 0) {
    fileList.value = [...props.defaultFileList]
  }
})

// 格式化文件大小
const formatFileSize = (size) => {
  if (!size || size <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(size) / Math.log(k))
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 处理上传前
const handleBeforeUpload = (rawFile) => {
  // 触发上传开始事件
  emit('upload-start', rawFile)
  
  // 调用自定义beforeUpload钩子
  if (props.beforeUpload) {
    const result = props.beforeUpload(rawFile)
    if (result === false || result && result.then && result.catch) {
      // 如果返回false或Promise，则等待Promise完成
      return result
    }
  }
  
  // 文件类型验证
  if (props.accept && !rawFile.name.match(new RegExp(props.accept.replace(/,/g, '|')))) {
    ElMessage.error(`不支持的文件类型，请上传${props.accept}格式的文件`)
    return false
  }
  
  return true
}

// 处理移除前
const handleBeforeRemove = (file, uploadFiles) => {
  if (props.beforeRemove) {
    const result = props.beforeRemove(file, uploadFiles)
    if (result === false || result && result.then && result.catch) {
      return result
    }
  }
  return true
}

// 处理上传进度
const handleProgress = (event, file, fileList) => {
  emit('progress', event, file, fileList)
}

// 处理上传成功
const handleSuccess = (response, file, fileList) => {
  // 触发上传结束事件
  emit('upload-end', { success: true, file, response })
  
  // 处理响应数据
  if (response && response.url) {
    file.url = response.url
  }
  
  // 触发成功事件
  emit('success', response, file, fileList)
  emit('change', fileList)
  
  // 上传完成后是否清除列表
  if (props.uploadAfterComplete) {
    nextTick(() => {
      fileList.value = []
    })
  }
}

// 处理上传错误
const handleError = (err, file, fileList) => {
  // 触发上传结束事件
  emit('upload-end', { success: false, file, error: err })
  
  // 显示错误信息
  ElMessage.error('上传失败，请重试')
  
  // 触发错误事件
  emit('error', err, file, fileList)
}

// 处理文件预览
const handlePreview = (file) => {
  currentPreviewFile.value = file
  previewDialogVisible.value = true
  emit('preview', file)
}

// 处理预览关闭
const handlePreviewClose = () => {
  currentPreviewFile.value = {}
  previewDialogVisible.value = false
}

// 处理文件移除
const handleRemove = (file, uploadFiles) => {
  // 更新文件列表
  fileList.value = uploadFiles
  emit('remove', file, uploadFiles)
  emit('change', uploadFiles)
}

// 处理文件超出限制
const handleExceed = (files, fileList) => {
  ElMessage.warning(`最多只能上传${props.limit}个文件`)
  emit('exceed', files, fileList)
}

// 处理文件下载
const handleDownload = (file) => {
  emit('download', file)
}

// 处理文件下载（自定义方法）
const handleDownloadFile = (file) => {
  if (!file.url) {
    ElMessage.warning('文件下载地址不存在')
    return
  }
  
  // 创建下载链接
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.name || 'download'
  link.click()
}

// 处理文件变化
const handleChange = (file, uploadFiles) => {
  // 更新文件列表
  fileList.value = uploadFiles
  emit('change', uploadFiles)
  
  // 处理自动上传状态
  if (props.autoUpload) {
    isUploading.value = uploadFiles.some(f => f.status === 'uploading')
  }
}

// 处理拖拽上传
const handleDrop = (event) => {
  emit('drop', event)
}

// 手动上传
const submitUpload = () => {
  const uploadElement = document.querySelector(`#${props.id}`)
  if (uploadElement) {
    const uploadInstance = uploadElement.__vueParentComponent
    if (uploadInstance && uploadInstance.submitUpload) {
      uploadInstance.submitUpload()
    }
  }
}

// 手动取消上传
const abortUpload = (file) => {
  const uploadElement = document.querySelector(`#${props.id}`)
  if (uploadElement) {
    const uploadInstance = uploadElement.__vueParentComponent
    if (uploadInstance && uploadInstance.abortUpload) {
      uploadInstance.abortUpload(file)
    }
  }
}

// 清空文件列表
const clearFiles = () => {
  fileList.value = []
  emit('update:modelValue', [])
}

// 获取文件列表
const getFileList = () => {
  return [...fileList.value]
}

// 添加文件
const addFile = (file) => {
  if (!file || !file.name) return
  
  // 检查文件数量限制
  if (props.limit > 0 && fileList.value.length >= props.limit) {
    ElMessage.warning(`最多只能上传${props.limit}个文件`)
    return false
  }
  
  // 检查是否已存在相同文件
  const exists = fileList.value.some(f => f.name === file.name && f.size === file.size)
  if (exists) {
    ElMessage.warning('文件已存在')
    return false
  }
  
  // 添加文件到列表
  const newFile = {
    name: file.name,
    size: file.size,
    type: file.type,
    uid: Date.now() + Math.random().toString(36).substr(2),
    status: 'success'
  }
  
  fileList.value.push(newFile)
  return true
}

// 移除文件
const removeFile = (file) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
    return true
  }
  return false
}

// 获取上传状态
const getUploadStatus = () => {
  return {
    isUploading: isUploading.value,
    totalCount: fileList.value.length,
    successCount: fileList.value.filter(f => f.status === 'success').length,
    errorCount: fileList.value.filter(f => f.status === 'fail').length,
    uploadingCount: fileList.value.filter(f => f.status === 'uploading').length
  }
}

// 暴露公共方法
defineExpose({
  // 上传操作
  submitUpload,
  abortUpload,
  // 文件管理
  clearFiles,
  getFileList,
  addFile,
  removeFile,
  // 状态查询
  getUploadStatus,
  // 辅助方法
  formatFileSize,
  handleDownloadFile
})
</script>

<style scoped>
/* 自定义上传组件样式 */
:deep(.el-upload) {
  width: 100%;
}

/* 拖拽上传样式 */
:deep(.el-upload-dragger) {
  width: 100%;
  border-style: dashed;
  border-color: var(--el-border-color);
  background-color: var(--el-fill-color-blank);
  transition: all 0.3s;
}

:deep(.el-upload-dragger:hover:not(.is-disabled)) {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

:deep(.el-upload-dragger.is-disabled) {
  border-color: var(--el-border-color-light);
  background-color: var(--el-fill-color-blank);
}

/* 文件列表样式 */
:deep(.el-upload-list) {
  margin-top: 10px;
  width: 100%;
}

:deep(.el-upload-list__item) {
  transition: all 0.3s;
}

:deep(.el-upload-list__item:hover) {
  background-color: var(--el-fill-color-light);
}

/* 图片上传样式 */
:deep(.el-upload-list--picture .el-upload-list__item),
:deep(.el-upload-list--picture-card .el-upload-list__item) {
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

:deep(.el-upload-list--picture-card .el-upload-list__item-thumbnail) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 上传文件图标 */
:deep(.el-upload-list__item-icon) {
  color: var(--el-text-color-secondary);
}

/* 上传按钮样式 */
:deep(.el-upload__button) {
  display: inline-block;
}

/* 错误状态样式 */
:deep(.el-upload-list__item.is-error .el-upload-list__item-name) {
  color: var(--el-color-danger);
}

/* 成功状态样式 */
:deep(.el-upload-list__item.is-success .el-upload-list__item-icon) {
  color: var(--el-color-success);
}

/* 提示文本样式 */
:deep(.el-upload__tip) {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-top: 5px;
}

/* 预览对话框样式 */
.upload-preview-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.image-preview-container {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: var(--el-border-radius-base);
}

.preview-info {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.preview-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.preview-size {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.other-preview-container {
  text-align: center;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 30px;
  background-color: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
  margin-bottom: 30px;
}

.file-icon {
  font-size: 64px;
  color: var(--el-text-color-secondary);
}

.file-details {
  text-align: left;
}

.file-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}

.file-meta {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  :deep(.el-upload-dragger) {
    padding: 30px 20px;
  }
  
  :deep(.el-upload-list--picture-card) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 10px;
  }
  
  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 100%;
    height: 80px;
    margin: 0;
  }
  
  .file-info {
    flex-direction: column;
    gap: 15px;
    padding: 20px;
  }
  
  .file-details {
    text-align: center;
  }
}
</style>