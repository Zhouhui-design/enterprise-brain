<template>
  <div class="rich-text-editor">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="editor-toolbar">
      <div class="toolbar-group">
        <!-- 文本样式 -->
        <el-button
          v-for="item in formatButtons"
          :key="item.name"
          type="text"
          :title="item.title"
          :icon="item.icon"
          @click="handleFormat(item.name)"
          :disabled="disabled"
        />
      </div>
      
      <div class="toolbar-group">
        <!-- 字体设置 -->
        <el-select
          v-model="fontFamily"
          placeholder="字体"
          size="small"
          @change="handleFontFamilyChange"
          :disabled="disabled"
          class="toolbar-select"
        >
          <el-option v-for="font in fontFamilies" :key="font.value" :label="font.label" :value="font.value" />
        </el-select>
        
        <el-select
          v-model="fontSize"
          placeholder="字号"
          size="small"
          @change="handleFontSizeChange"
          :disabled="disabled"
          class="toolbar-select"
        >
          <el-option v-for="size in fontSizes" :key="size.value" :label="size.label" :value="size.value" />
        </el-select>
      </div>
      
      <div class="toolbar-group">
        <!-- 颜色设置 -->
        <el-color-picker
          v-model="fontColor"
          size="small"
          show-alpha
          @change="handleFontColorChange"
          :disabled="disabled"
          title="文字颜色"
        />
        
        <el-color-picker
          v-model="backgroundColor"
          size="small"
          show-alpha
          @change="handleBackgroundColorChange"
          :disabled="disabled"
          title="背景颜色"
        />
      </div>
      
      <div class="toolbar-group">
        <!-- 对齐方式 -->
        <el-button-group>
          <el-button
            type="text"
            :icon="AlignLeft"
            @click="handleAlign('left')"
            :disabled="disabled"
            title="左对齐"
          />
          <el-button
            type="text"
            :icon="AlignCenter"
            @click="handleAlign('center')"
            :disabled="disabled"
            title="居中对齐"
          />
          <el-button
            type="text"
            :icon="AlignRight"
            @click="handleAlign('right')"
            :disabled="disabled"
            title="右对齐"
          />
          <el-button
            type="text"
            :icon="AlignJustify"
            @click="handleAlign('justify')"
            :disabled="disabled"
            title="两端对齐"
          />
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <!-- 列表 -->
        <el-button
          type="text"
          :icon="List"
          @click="handleList('ul')"
          :disabled="disabled"
          title="无序列表"
        />
        <el-button
          type="text"
          :icon="OrderedList"
          @click="handleList('ol')"
          :disabled="disabled"
          title="有序列表"
        />
        <el-button
          type="text"
          :icon="LineHeight"
          @click="handleIndent('increase')"
          :disabled="disabled"
          title="增加缩进"
        />
        <el-button
          type="text"
          :icon="DecreaseIndent"
          @click="handleIndent('decrease')"
          :disabled="disabled"
          title="减少缩进"
        />
      </div>
      
      <div class="toolbar-group">
        <!-- 插入操作 -->
        <el-button
          type="text"
          :icon="Picture"
          @click="handleInsertImage"
          :disabled="disabled"
          title="插入图片"
        />
        <el-button
          type="text"
          :icon="DocumentAdd"
          @click="handleInsertTable"
          :disabled="disabled"
          title="插入表格"
        />
        <el-button
          type="text"
          :icon="Link"
          @click="handleInsertLink"
          :disabled="disabled"
          title="插入链接"
        />
      </div>
      
      <div class="toolbar-group">
        <!-- 其他操作 -->
        <el-button
          type="text"
          :icon="Clear"
          @click="handleClearFormat"
          :disabled="disabled"
          title="清除格式"
        />
        <el-button
          type="text"
          :icon="Refresh"
          @click="handleReset"
          :disabled="disabled"
          title="清空编辑器"
        />
      </div>
      
      <!-- 上传图片的input -->
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleImageUpload"
      />
    </div>

    <!-- 编辑器主体 -->
    <div
      class="editor-container"
      :class="{ 'editor-disabled': disabled }"
    >
      <div
        ref="editorRef"
        class="editor"
        :contenteditable="!disabled"
        v-html="modelValue"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @paste="handlePaste"
      ></div>
      
      <!-- 占位符 -->
      <div
        v-if="!modelValue && !disabled && !editorFocused"
        class="editor-placeholder"
        @click="focusEditor"
      >
        {{ placeholder }}
      </div>
    </div>

    <!-- 底部信息栏 -->
    <div v-if="showFooter" class="editor-footer">
      <div class="word-count" v-if="showWordCount">
        字数: {{ wordCount }}
      </div>
      <div class="status-info">
        {{ editorStatus }}
      </div>
    </div>

    <!-- 插入表格对话框 -->
    <el-dialog
      v-model="tableDialogVisible"
      title="插入表格"
      width="300px"
      @close="resetTableDialog"
    >
      <div class="table-config">
        <el-form label-position="top">
          <el-form-item label="行数">
            <el-input-number
              v-model="tableRows"
              :min="1"
              :max="20"
              size="small"
            />
          </el-form-item>
          <el-form-item label="列数">
            <el-input-number
              v-model="tableCols"
              :min="1"
              :max="10"
              size="small"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="tableDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmInsertTable">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 插入链接对话框 -->
    <el-dialog
      v-model="linkDialogVisible"
      title="插入链接"
      width="400px"
      @close="resetLinkDialog"
    >
      <div class="link-config">
        <el-form label-position="top">
          <el-form-item label="链接文本">
            <el-input v-model="linkText" placeholder="请输入链接显示文本" />
          </el-form-item>
          <el-form-item label="链接地址">
            <el-input
              v-model="linkUrl"
              placeholder="请输入链接地址"
              :prefix-icon="Link"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="linkDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmInsertLink">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  OrderedList,
  LineHeight,
  DecreaseIndent,
  Picture,
  DocumentAdd,
  Link,
  Clear,
  Refresh
} from '@element-plus/icons-vue'

// Props 定义
interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  showToolbar?: boolean
  showFooter?: boolean
  showWordCount?: boolean
  maxLength?: number
  minHeight?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入内容...',
  disabled: false,
  showToolbar: true,
  showFooter: true,
  showWordCount: true,
  maxLength: 0,
  minHeight: '200px'
})

// Emits 定义
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'input': [value: string]
  'change': [value: string]
  'focus': [event: Event]
  'blur': [event: Event]
}>()

// 响应式数据
const editorRef = ref<HTMLElement>()
const imageInput = ref<HTMLInputElement>()
const editorFocused = ref(false)
const editorStatus = ref('就绪')

// 工具栏状态
const fontFamily = ref('')
const fontSize = ref('')
const fontColor = ref('')
const backgroundColor = ref('')

// 对话框状态
const tableDialogVisible = ref(false)
const tableRows = ref(3)
const tableCols = ref(3)
const linkDialogVisible = ref(false)
const linkText = ref('')
const linkUrl = ref('')

// 字体和字号选项
const fontFamilies = [
  { label: '默认字体', value: '' },
  { label: '宋体', value: 'SimSun' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' }
]

const fontSizes = [
  { label: '默认', value: '' },
  { label: '小', value: '12px' },
  { label: '正常', value: '14px' },
  { label: '中', value: '16px' },
  { label: '大', value: '18px' },
  { label: '较大', value: '20px' },
  { label: '超大', value: '24px' }
]

// 格式按钮配置
const formatButtons = [
  { name: 'bold', title: '加粗', icon: Bold },
  { name: 'italic', title: '斜体', icon: Italic },
  { name: 'underline', title: '下划线', icon: Underline },
  { name: 'strikeThrough', title: '删除线', icon: Strikethrough }
]

// 计算字数
const wordCount = computed(() => {
  if (!props.modelValue) return 0
  // 移除HTML标签后计算字数
  const text = props.modelValue.replace(/<[^>]+>/g, '')
  return text.length
})

// 执行命令
const execCommand = (command: string, value?: string) => {
  if (props.disabled || !editorRef.value) return
  
  try {
    document.execCommand(command, false, value)
    editorRef.value.focus()
    handleInput()
  } catch (error) {
    console.error('执行命令失败:', error)
  }
}

// 获取选中的文本
const getSelectedText = (): string => {
  const selection = window.getSelection()
  if (selection && selection.toString()) {
    return selection.toString()
  }
  return ''
}

// 处理格式设置
const handleFormat = (format: string) => {
  execCommand(format)
}

// 处理字体变化
const handleFontFamilyChange = () => {
  execCommand('fontName', fontFamily.value || null)
}

// 处理字号变化
const handleFontSizeChange = () => {
  if (fontSize.value) {
    execCommand('fontSize', fontSize.value)
  }
}

// 处理字体颜色变化
const handleFontColorChange = () => {
  execCommand('foreColor', fontColor.value || null)
}

// 处理背景颜色变化
const handleBackgroundColorChange = () => {
  execCommand('backColor', backgroundColor.value || null)
}

// 处理对齐方式
const handleAlign = (align: string) => {
  execCommand(`justify${align.charAt(0).toUpperCase() + align.slice(1)}`)
}

// 处理列表
const handleList = (type: string) => {
  execCommand(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList')
}

// 处理缩进
const handleIndent = (type: string) => {
  execCommand(type === 'increase' ? 'indent' : 'outdent')
}

// 处理插入图片
const handleInsertImage = () => {
  if (imageInput.value) {
    imageInput.value.click()
  }
}

// 处理图片上传
const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  try {
    // 显示加载状态
    editorStatus.value = '上传中...'
    
    // 在实际项目中，这里应该上传到服务器
    // 这里使用本地预览作为示例
    const imageUrl = await getImageUrl(file)
    
    // 插入图片到编辑器
    const img = document.createElement('img')
    img.src = imageUrl
    img.alt = file.name
    img.style.maxWidth = '100%'
    
    // 插入到当前光标位置
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(img)
      
      // 移动光标到图片后面
      range.setStartAfter(img)
      range.setEndAfter(img)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    
    handleInput()
    editorStatus.value = '图片插入成功'
    
    // 重置input
    if (imageInput.value) {
      imageInput.value.value = ''
    }
    
    setTimeout(() => {
      editorStatus.value = '就绪'
    }, 2000)
  } catch (error) {
    console.error('图片上传失败:', error)
    editorStatus.value = '图片上传失败'
    ElMessage.error('图片上传失败')
    
    setTimeout(() => {
      editorStatus.value = '就绪'
    }, 2000)
  }
}

// 获取图片URL（示例方法）
const getImageUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  })
}

// 处理插入表格
const handleInsertTable = () => {
  tableDialogVisible.value = true
}

// 确认插入表格
const confirmInsertTable = () => {
  let tableHtml = '<table style="border-collapse: collapse; width: 100%;">'
  
  for (let i = 0; i < tableRows.value; i++) {
    tableHtml += '<tr>'
    for (let j = 0; j < tableCols.value; j++) {
      tableHtml += '<td style="border: 1px solid #ddd; padding: 8px;">&nbsp;</td>'
    }
    tableHtml += '</tr>'
  }
  
  tableHtml += '</table>'
  
  // 插入表格
  execCommand('insertHTML', tableHtml)
  tableDialogVisible.value = false
  resetTableDialog()
}

// 重置表格对话框
const resetTableDialog = () => {
  tableRows.value = 3
  tableCols.value = 3
}

// 处理插入链接
const handleInsertLink = () => {
  const selectedText = getSelectedText()
  linkText.value = selectedText || ''
  linkDialogVisible.value = true
}

// 确认插入链接
const confirmInsertLink = () => {
  if (!linkUrl.value) {
    ElMessage.warning('请输入链接地址')
    return
  }
  
  execCommand('createLink', linkUrl.value)
  
  // 如果有设置链接文本，替换当前选中的文本
  if (linkText.value) {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const parentNode = range.commonAncestorContainer.parentNode
      if (parentNode && parentNode.tagName === 'A') {
        parentNode.textContent = linkText.value
      }
    }
  }
  
  linkDialogVisible.value = false
  resetLinkDialog()
}

// 重置链接对话框
const resetLinkDialog = () => {
  linkText.value = ''
  linkUrl.value = ''
}

// 清除格式
const handleClearFormat = () => {
  execCommand('removeFormat')
}

// 清空编辑器
const handleReset = () => {
  ElMessageBox.confirm('确定要清空编辑器内容吗？', '清空确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (editorRef.value) {
      editorRef.value.innerHTML = ''
      handleInput()
      ElMessage.success('编辑器已清空')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 编辑器输入事件
const handleInput = () => {
  if (!editorRef.value) return
  
  const value = editorRef.value.innerHTML
  
  // 检查长度限制
  if (props.maxLength > 0 && wordCount.value > props.maxLength) {
    ElMessage.warning(`内容长度不能超过${props.maxLength}个字符`)
    return
  }
  
  emit('update:modelValue', value)
  emit('input', value)
  emit('change', value)
}

// 编辑器聚焦事件
const handleFocus = (event: Event) => {
  editorFocused.value = true
  emit('focus', event)
}

// 编辑器失焦事件
const handleBlur = (event: Event) => {
  editorFocused.value = false
  emit('blur', event)
}

// 处理粘贴事件
const handlePaste = (event: ClipboardEvent) => {
  // 阻止默认粘贴
  event.preventDefault()
  
  // 获取粘贴的文本内容
  const text = event.clipboardData?.getData('text/plain') || ''
  
  // 插入纯文本
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(text))
    handleInput()
  }
}

// 聚焦编辑器
const focusEditor = () => {
  if (editorRef.value) {
    editorRef.value.focus()
  }
}

// 监听外部传入的modelValue变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editorRef.value && editorRef.value.innerHTML !== newValue) {
      editorRef.value.innerHTML = newValue || ''
    }
  },
  { immediate: true }
)

// 监听编辑器高度变化
const resizeObserver = ref<ResizeObserver | null>(null)

onMounted(() => {
  if (editorRef.value) {
    // 设置初始内容
    editorRef.value.innerHTML = props.modelValue || ''
    
    // 监听编辑器大小变化
    resizeObserver.value = new ResizeObserver(() => {
      // 可以在这里处理编辑器大小变化的逻辑
    })
    resizeObserver.value.observe(editorRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver.value && editorRef.value) {
    resizeObserver.value.unobserve(editorRef.value)
    resizeObserver.value.disconnect()
  }
})
</script>

<style scoped>
.rich-text-editor {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 工具栏样式 */
.editor-toolbar {
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  padding: 8px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-select {
  width: 120px;
}

.toolbar-group :deep(.el-button) {
  color: #606266;
  padding: 0;
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 4px;
}

.toolbar-group :deep(.el-button:hover) {
  background-color: #ecf5ff;
  color: #409eff;
  border-color: #c6e2ff;
}

.toolbar-group :deep(.el-button.is-disabled) {
  color: #c0c4cc;
}

/* 编辑器主体样式 */
.editor-container {
  position: relative;
  flex: 1;
  min-height: v-bind('props.minHeight');
}

.editor {
  width: 100%;
  min-height: v-bind('props.minHeight');
  padding: 12px;
  outline: none;
  overflow-y: auto;
  box-sizing: border-box;
  line-height: 1.6;
}

.editor-disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.editor-placeholder {
  position: absolute;
  top: 12px;
  left: 12px;
  color: #909399;
  pointer-events: none;
  user-select: none;
}

/* 底部信息栏样式 */
.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background-color: #f5f7fa;
  border-top: 1px solid #dcdfe6;
  font-size: 12px;
  color: #909399;
}

/* 表格配置样式 */
.table-config,
.link-config {
  padding: 12px 0;
}

.table-config :deep(.el-form-item),
.link-config :deep(.el-form-item) {
  margin-bottom: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-toolbar {
    padding: 6px 8px;
    gap: 4px;
  }
  
  .toolbar-group {
    gap: 2px;
  }
  
  .toolbar-select {
    width: 100px;
  }
  
  .toolbar-group :deep(.el-button) {
    width: 24px;
    height: 24px;
    min-width: 24px;
  }
  
  .editor {
    padding: 10px;
  }
  
  .editor-footer {
    padding: 4px 8px;
  }
}
</style>