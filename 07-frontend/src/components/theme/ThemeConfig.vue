<template>
  <div class="theme-config">
    <el-card>
      <template #header>
        <div class="config-header">
          <span>主题配置</span>
          <el-button size="small" @click="resetAllThemes">重置所有</el-button>
        </div>
      </template>

      <!-- 预设主题选择 -->
      <div class="theme-section">
        <h4 class="section-title">预设主题</h4>
        <div class="preset-themes">
          <div
            v-for="theme in presetThemes"
            :key="theme.name"
            class="theme-card"
            :class="{ active: currentThemeName === theme.name }"
            @click="selectTheme(theme.name)"
          >
            <div class="theme-preview">
              <div class="preview-header" :style="{ backgroundColor: theme.primaryColor }"></div>
              <div class="preview-sidebar" :style="{ backgroundColor: theme.backgroundColor, borderRight: `1px solid ${theme.borderColor}` }"></div>
              <div class="preview-content" :style="{ backgroundColor: theme.backgroundColor, color: theme.textColor }">
                <div class="preview-text"></div>
                <div class="preview-button" :style="{ backgroundColor: theme.primaryColor }"></div>
              </div>
            </div>
            <div class="theme-info">
              <div class="theme-name">{{ theme.label }}</div>
              <div class="theme-mode">{{ theme.mode === 'dark' ? '深色' : '浅色' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 自定义主题 -->
      <div class="theme-section">
        <div class="section-header">
          <h4 class="section-title">自定义主题</h4>
          <el-button size="small" type="primary" @click="createCustomTheme">新建主题</el-button>
        </div>
        
        <div class="custom-themes" v-if="customThemeList.length > 0">
          <div
            v-for="theme in customThemeList"
            :key="theme.name"
            class="custom-theme-item"
          >
            <div class="theme-card-preview">
              <div class="mini-preview" :style="getMiniPreviewStyle(theme)"></div>
            </div>
            <div class="theme-details">
              <span class="theme-name">{{ theme.name }}</span>
              <div class="theme-actions">
                <el-button size="small" @click="editCustomTheme(theme.name)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteCustomTheme(theme.name)">删除</el-button>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无自定义主题" :image-size="100" />
      </div>

      <!-- 主题编辑器 -->
      <div class="theme-section" v-if="showEditor">
        <div class="section-header">
          <h4 class="section-title">编辑主题: {{ editingThemeName }}</h4>
          <el-button size="small" @click="closeEditor">关闭</el-button>
        </div>

        <el-form :model="currentEditTheme" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <h5 class="subsection-title">基础颜色</h5>
              <el-form-item label="主色调">
                <ColorPicker v-model="currentEditTheme.primaryColor" />
              </el-form-item>
              <el-form-item label="次要色">
                <ColorPicker v-model="currentEditTheme.secondaryColor" />
              </el-form-item>
              <el-form-item label="背景色">
                <ColorPicker v-model="currentEditTheme.backgroundColor" />
              </el-form-item>
              <el-form-item label="文字色">
                <ColorPicker v-model="currentEditTheme.textColor" />
              </el-form-item>
              <el-form-item label="边框色">
                <ColorPicker v-model="currentEditTheme.borderColor" />
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <h5 class="subsection-title">状态颜色</h5>
              <el-form-item label="成功色">
                <ColorPicker v-model="currentEditTheme.successColor" />
              </el-form-item>
              <el-form-item label="警告色">
                <ColorPicker v-model="currentEditTheme.warningColor" />
              </el-form-item>
              <el-form-item label="危险色">
                <ColorPicker v-model="currentEditTheme.dangerColor" />
              </el-form-item>
              <el-form-item label="信息色">
                <ColorPicker v-model="currentEditTheme.infoColor" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <h5 class="subsection-title">布局设置</h5>
              <el-form-item label="侧边栏宽度">
                <el-slider
                  v-model="currentEditTheme.layout.sidebarWidth"
                  :min="180"
                  :max="300"
                  show-input
                />
              </el-form-item>
              <el-form-item label="头部高度">
                <el-slider
                  v-model="currentEditTheme.layout.headerHeight"
                  :min="50"
                  :max="80"
                  show-input
                />
              </el-form-item>
              <el-form-item label="内容边距">
                <el-slider
                  v-model="currentEditTheme.layout.contentPadding"
                  :min="10"
                  :max="40"
                  show-input
                />
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <h5 class="subsection-title">组件设置</h5>
              <el-form-item label="圆角大小">
                <el-slider
                  v-model="currentEditTheme.components.borderRadius"
                  :min="0"
                  :max="12"
                  show-input
                />
              </el-form-item>
              <el-form-item label="字体大小">
                <el-input v-model="currentEditTheme.components.fontSize" placeholder="14px" />
              </el-form-item>
              <el-form-item label="字体族">
                <el-input v-model="currentEditTheme.components.fontFamily" />
              </el-form-item>
            </el-col>
          </el-row>

          <div class="custom-properties" v-if="currentEditTheme.customProperties">
            <h5 class="subsection-title">自定义属性</h5>
            <div
              v-for="(value, key, index) in currentEditTheme.customProperties"
              :key="key"
              class="custom-property-item"
            >
              <el-input v-model="propertyKeys[index]" placeholder="属性名" />
              <el-input v-model="propertyValues[index]" placeholder="属性值" />
              <el-button size="small" type="danger" @click="removeCustomProperty(index)">删除</el-button>
            </div>
            <el-button size="small" @click="addCustomProperty">添加自定义属性</el-button>
          </div>

          <div class="theme-actions">
            <el-button @click="closeEditor">取消</el-button>
            <el-button type="primary" @click="saveTheme">保存主题</el-button>
            <el-button @click="exportTheme">导出主题</el-button>
          </div>
        </el-form>
      </div>

      <!-- 主题预览 -->
      <div class="theme-section" v-if="currentTheme">
        <h4 class="section-title">当前主题预览</h4>
        <div class="theme-preview-large">
          <div class="preview-app">
            <div class="preview-layout">
              <div class="preview-header-large" :style="headerStyle">
                <div class="preview-logo"></div>
                <div class="preview-nav">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div class="preview-body">
                <div class="preview-sidebar-large" :style="sidebarStyle">
                  <div class="preview-menu-items">
                    <div v-for="i in 5" :key="i" class="preview-menu-item" :style="menuItemStyle"></div>
                  </div>
                </div>
                <div class="preview-content-large" :style="contentStyle">
                  <div class="preview-card" :style="cardStyle">
                    <div class="preview-card-header"></div>
                    <div class="preview-card-content">
                      <div class="preview-line" :style="lineStyle"></div>
                      <div class="preview-line short" :style="lineStyle"></div>
                      <div class="preview-button-large" :style="buttonStyle"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 主题导入对话框 -->
    <el-dialog v-model="showImportDialog" title="导入主题" width="400px">
      <el-upload
        class="theme-upload"
        drag
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleThemeImport"
        accept=".json"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将主题文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">只能上传 .json 格式的主题文件</div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import ColorPicker from './ColorPicker.vue'

interface ThemeService {
  theme: any
  setTheme: (name: string) => void
  updateThemeProperty: (property: string, value: string) => void
  resetTheme: (name?: string) => void
  getAvailableThemes: () => string[]
  getCustomThemes: () => string[]
  exportTheme: (name: string) => void
  importTheme: (file: File) => Promise<any>
  currentThemeName: string
}

const themeService = inject('themeService') as ThemeService

const showEditor = ref(false)
const showImportDialog = ref(false)
const editingThemeName = ref('')
const customThemeList = ref<any[]>([])

const defaultTheme = {
  name: '',
  mode: 'light' as 'light' | 'dark',
  primaryColor: '#409EFF',
  secondaryColor: '#79bbff',
  backgroundColor: '#ffffff',
  textColor: '#303133',
  borderColor: '#dcdfe6',
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  successColor: '#67C23A',
  warningColor: '#E6A23C',
  dangerColor: '#F56C6C',
  infoColor: '#909399',
  layout: {
    sidebarWidth: 250,
    headerHeight: 60,
    contentPadding: 20
  },
  components: {
    borderRadius: 4,
    fontSize: '14px',
    fontFamily: 'Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif'
  },
  customProperties: {}
}

const currentEditTheme = ref({ ...defaultTheme })
const propertyKeys = ref<string[]>([])
const propertyValues = ref<string[]>([])

const presetThemes = [
  {
    name: 'default',
    label: '默认主题',
    mode: 'light',
    primaryColor: '#409EFF',
    secondaryColor: '#79bbff',
    backgroundColor: '#ffffff',
    textColor: '#303133',
    borderColor: '#dcdfe6',
    successColor: '#67C23A',
    warningColor: '#E6A23C',
    dangerColor: '#F56C6C',
    infoColor: '#909399'
  },
  {
    name: 'dark',
    label: '深色主题',
    mode: 'dark',
    primaryColor: '#409EFF',
    secondaryColor: '#79bbff',
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    borderColor: '#434343',
    successColor: '#67C23A',
    warningColor: '#E6A23C',
    dangerColor: '#F56C6C',
    infoColor: '#909399'
  },
  {
    name: 'blue',
    label: '蓝色主题',
    mode: 'light',
    primaryColor: '#1890ff',
    secondaryColor: '#40a9ff',
    backgroundColor: '#f0f5ff',
    textColor: '#262626',
    borderColor: '#d9d9d9',
    successColor: '#52c41a',
    warningColor: '#faad14',
    dangerColor: '#ff4d4f',
    infoColor: '#1890ff'
  },
  {
    name: 'green',
    label: '绿色主题',
    mode: 'light',
    primaryColor: '#52c41a',
    secondaryColor: '#73d13d',
    backgroundColor: '#f6ffed',
    textColor: '#262626',
    borderColor: '#d9d9d9',
    successColor: '#52c41a',
    warningColor: '#faad14',
    dangerColor: '#ff4d4f',
    infoColor: '#1890ff'
  }
]

const currentThemeName = computed(() => themeService.currentThemeName)
const currentTheme = computed(() => themeService.theme)

const headerStyle = computed(() => ({
  backgroundColor: currentTheme.value.primaryColor,
  height: `${currentTheme.value.layout.headerHeight}px`
}))

const sidebarStyle = computed(() => ({
  backgroundColor: currentTheme.value.backgroundColor,
  borderRight: `1px solid ${currentTheme.value.borderColor}`,
  width: `${currentTheme.value.layout.sidebarWidth}px`
}))

const contentStyle = computed(() => ({
  backgroundColor: currentTheme.value.backgroundColor,
  padding: `${currentTheme.value.layout.contentPadding}px`,
  color: currentTheme.value.textColor
}))

const cardStyle = computed(() => ({
  backgroundColor: currentTheme.value.backgroundColor,
  border: `1px solid ${currentTheme.value.borderColor}`,
  borderRadius: `${currentTheme.value.components.borderRadius}px`,
  boxShadow: `0 2px 4px ${currentTheme.value.shadowColor}`
}))

const buttonStyle = computed(() => ({
  backgroundColor: currentTheme.value.primaryColor,
  borderRadius: `${currentTheme.value.components.borderRadius}px`
}))

const lineStyle = computed(() => ({
  backgroundColor: currentTheme.value.textColor,
  opacity: 0.6
}))

const menuItemStyle = computed(() => ({
  color: currentTheme.value.textColor,
  borderRadius: `${currentTheme.value.components.borderRadius}px`
}))

const selectTheme = (themeName: string) => {
  themeService.setTheme(themeName)
}

const createCustomTheme = () => {
  editingThemeName.value = `custom-${Date.now()}`
  currentEditTheme.value = { ...defaultTheme, name: editingThemeName.value }
  propertyKeys.value = []
  propertyValues.value = []
  showEditor.value = true
}

const editCustomTheme = (themeName: string) => {
  editingThemeName.value = themeName
  const theme = customThemeList.value.find(t => t.name === themeName)
  if (theme) {
    currentEditTheme.value = { ...theme }
    const entries = Object.entries(theme.customProperties || {})
    propertyKeys.value = entries.map(([key]) => key)
    propertyValues.value = entries.map(([, value]) => value)
  }
  showEditor.value = true
}

const deleteCustomTheme = (themeName: string) => {
  ElMessageBox.confirm('确认删除此主题？', '确认删除', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    themeService.resetTheme(themeName)
    loadCustomThemes()
    ElMessage.success('主题已删除')
  })
}

const closeEditor = () => {
  showEditor.value = false
  editingThemeName.value = ''
  currentEditTheme.value = { ...defaultTheme }
  propertyKeys.value = []
  propertyValues.value = []
}

const saveTheme = () => {
  const customProps: Record<string, string> = {}
  propertyKeys.value.forEach((key, index) => {
    if (key && propertyValues.value[index]) {
      customProps[key] = propertyValues.value[index]
    }
  })
  
  currentEditTheme.value.customProperties = customProps
  themeService.setTheme(editingThemeName.value, currentEditTheme.value)
  loadCustomThemes()
  ElMessage.success('主题已保存')
  closeEditor()
}

const exportTheme = () => {
  themeService.exportTheme(editingThemeName.value)
}

const handleThemeImport = (file: any) => {
  themeService.importTheme(file.raw).then(() => {
    loadCustomThemes()
    showImportDialog.value = false
    ElMessage.success('主题导入成功')
  }).catch(() => {
    ElMessage.error('主题导入失败')
  })
}

const getMiniPreviewStyle = (theme: any) => {
  return {
    '--primary-color': theme.primaryColor,
    '--background-color': theme.backgroundColor,
    '--text-color': theme.textColor,
    '--border-color': theme.borderColor
  }
}

const addCustomProperty = () => {
  propertyKeys.value.push('')
  propertyValues.value.push('')
}

const removeCustomProperty = (index: number) => {
  propertyKeys.value.splice(index, 1)
  propertyValues.value.splice(index, 1)
}

const resetAllThemes = () => {
  ElMessageBox.confirm('确认重置所有主题？这将删除所有自定义主题。', '确认重置', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    themeService.resetTheme()
    loadCustomThemes()
    ElMessage.success('所有主题已重置')
  })
}

const loadCustomThemes = () => {
  const customNames = themeService.getCustomThemes()
  customThemeList.value = customNames.map(name => ({
    name,
    ...JSON.parse(localStorage.getItem(`${name}-theme`) || '{}')
  }))
}

onMounted(() => {
  loadCustomThemes()
})
</script>

<style scoped>
.theme-config {
  max-width: 1200px;
  margin: 0 auto;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.theme-section {
  margin-bottom: 24px;
  padding: 20px;
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 16px 0;
  color: var(--text-color, #303133);
  font-size: 16px;
  font-weight: 500;
}

.subsection-title {
  margin: 20px 0 12px 0;
  color: var(--text-color, #606266);
  font-size: 14px;
  font-weight: 500;
}

.preset-themes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.theme-card {
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.theme-card:hover {
  border-color: var(--primary-color, #409eff);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-card.active {
  border-color: var(--primary-color, #409eff);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.theme-preview {
  height: 100px;
  position: relative;
  background: #f5f5f5;
  display: flex;
}

.preview-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 25px;
}

.preview-sidebar {
  position: absolute;
  top: 25px;
  left: 0;
  bottom: 0;
  width: 30%;
}

.preview-content {
  position: absolute;
  top: 25px;
  left: 30%;
  right: 0;
  bottom: 0;
  padding: 4px;
}

.preview-text {
  height: 4px;
  background: currentColor;
  opacity: 0.6;
  border-radius: 2px;
  margin-bottom: 3px;
}

.preview-button {
  width: 20px;
  height: 8px;
  border-radius: 2px;
  margin-top: 6px;
}

.theme-info {
  padding: 12px;
  text-align: center;
}

.theme-name {
  font-weight: 500;
  color: var(--text-color, #303133);
  margin-bottom: 4px;
}

.theme-mode {
  font-size: 12px;
  color: var(--text-color, #909399);
}

.custom-themes {
  min-height: 200px;
}

.custom-theme-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 6px;
  margin-bottom: 8px;
}

.theme-card-preview {
  width: 60px;
  height: 40px;
  margin-right: 12px;
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 4px;
  overflow: hidden;
}

.mini-preview {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--background-color);
}

.mini-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: var(--primary-color);
}

.mini-preview::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 30%;
  bottom: 0;
  background: var(--background-color);
  border-right: 1px solid var(--border-color);
}

.theme-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.theme-actions {
  display: flex;
  gap: 8px;
}

.custom-property-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.custom-property-item .el-input {
  flex: 1;
}

.theme-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, #ebeef5);
}

.theme-preview-large {
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 8px;
  overflow: hidden;
  height: 300px;
}

.preview-app {
  width: 100%;
  height: 100%;
}

.preview-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-header-large {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  color: white;
}

.preview-logo {
  width: 80px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.preview-nav {
  display: flex;
  gap: 12px;
}

.preview-nav span {
  width: 40px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.preview-body {
  flex: 1;
  display: flex;
}

.preview-sidebar-large {
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.preview-menu-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-menu-item {
  height: 20px;
  background: var(--text-color);
  opacity: 0.2;
}

.preview-content-large {
  flex: 1;
  padding: 16px;
}

.preview-card {
  padding: 16px;
  margin-bottom: 16px;
}

.preview-card-header {
  height: 16px;
  background: var(--text-color);
  opacity: 0.1;
  border-radius: 2px;
  margin-bottom: 12px;
}

.preview-card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-line {
  height: 8px;
  background: currentColor;
  opacity: 0.2;
  border-radius: 2px;
}

.preview-line.short {
  width: 60%;
}

.preview-button-large {
  width: 80px;
  height: 24px;
  border-radius: 4px;
  margin-top: 12px;
}

.theme-upload {
  width: 100%;
}
</style>