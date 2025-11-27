<template>
  <div class="theme-demo">
    <!-- 主题配置面板 -->
    <el-card class="config-panel" shadow="hover">
      <template #header>
        <div class="panel-header">
          <el-icon><Setting /></el-icon>
          <span>主题配置中心</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="card">
        <!-- 主题选择 -->
        <el-tab-pane label="主题选择" name="themes">
          <div class="theme-grid">
            <div 
              v-for="(theme, key) in themePresets" 
              :key="key"
              :class="['theme-card', { active: currentTheme === key }]"
              @click="switchTheme(key)"
            >
              <div class="theme-preview" :style="{ background: theme.primary }"></div>
              <div class="theme-info">
                <h4>{{ theme.name }}</h4>
                <p>{{ theme.description }}</p>
              </div>
              <el-icon v-if="currentTheme === key" class="check-icon"><Check /></el-icon>
            </div>
          </div>
        </el-tab-pane>

        <!-- 颜色定制 -->
        <el-tab-pane label="颜色定制" name="colors">
          <ColorPicker 
            v-model="customColors"
            @change="handleColorChange"
          />
        </el-tab-pane>

        <!-- 布局设置 -->
        <el-tab-pane label="布局设置" name="layout">
          <LayoutCustomizer 
            v-model="layoutConfig"
            @change="handleLayoutChange"
          />
        </el-tab-pane>

        <!-- 组件设置 -->
        <el-tab-pane label="组件设置" name="components">
          <el-form :model="componentConfig" label-width="120px">
            <el-form-item label="组件尺寸">
              <el-radio-group v-model="componentConfig.size">
                <el-radio-button label="small">小</el-radio-button>
                <el-radio-button label="medium">中</el-radio-button>
                <el-radio-button label="large">大</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="圆角大小">
              <el-slider 
                v-model="componentConfig.borderRadius"
                :min="0"
                :max="20"
                :step="2"
                show-input
              />
            </el-form-item>

            <el-form-item label="阴影强度">
              <el-select v-model="componentConfig.shadow">
                <el-option label="无阴影" value="none" />
                <el-option label="小阴影" value="small" />
                <el-option label="中阴影" value="medium" />
                <el-option label="大阴影" value="large" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" @click="saveConfig">
          <el-icon><Save /></el-icon>
          保存配置
        </el-button>
        <el-button @click="resetConfig">
          <el-icon><RefreshLeft /></el-icon>
          重置默认
        </el-button>
        <el-button @click="exportConfig">
          <el-icon><Download /></el-icon>
          导出配置
        </el-button>
        <el-button @click="importConfig">
          <el-icon><Upload /></el-icon>
          导入配置
        </el-button>
      </div>
    </el-card>

    <!-- 效果预览区域 -->
    <el-card class="preview-panel" shadow="hover">
      <template #header>
        <div class="panel-header">
          <el-icon><View /></el-icon>
          <span>效果预览</span>
        </div>
      </template>

      <!-- 按钮预览 -->
      <div class="preview-section">
        <h3>按钮组件</h3>
        <div class="button-preview">
          <el-button>默认按钮</el-button>
          <el-button type="primary">主要按钮</el-button>
          <el-button type="success">成功按钮</el-button>
          <el-button type="warning">警告按钮</el-button>
          <el-button type="danger">危险按钮</el-button>
          <el-button type="info">信息按钮</el-button>
        </div>
      </div>

      <!-- 表格预览 -->
      <div class="preview-section">
        <h3>表格组件</h3>
        <el-table :data="tableData" style="width: 100%">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.status === 'active' ? '活跃' : '非活跃' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="date" label="日期" />
          <el-table-column label="操作">
            <template #default>
              <el-button type="primary" link>编辑</el-button>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 表单预览 -->
      <div class="preview-section">
        <h3>表单组件</h3>
        <el-form :model="formData" label-width="80px">
          <el-form-item label="输入框">
            <el-input v-model="formData.input" placeholder="请输入内容" />
          </el-form-item>
          <el-form-item label="选择器">
            <el-select v-model="formData.select" placeholder="请选择">
              <el-option label="选项1" value="1" />
              <el-option label="选项2" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="开关">
            <el-switch v-model="formData.switch" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 卡片预览 -->
      <div class="preview-section">
        <h3>卡片组件</h3>
        <div class="card-grid">
          <el-card v-for="i in 4" :key="i" shadow="hover">
            <div class="card-content">
              <el-icon size="32"><Document /></el-icon>
              <h4>示例卡片 {{ i }}</h4>
              <p>这是一个示例卡片内容</p>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { 
  Setting, Check, Save, RefreshLeft, Download, Upload, View, Document 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ColorPicker, LayoutCustomizer } from '@/components/theme'
import { useTheme, THEME_PRESETS } from '@/components/theme'

const { 
  currentTheme, 
  switchTheme, 
  updateTheme, 
  saveThemeConfig, 
  resetTheme 
} = useTheme()

// 响应式数据
const activeTab = ref('themes')
const themePresets = reactive(THEME_PRESETS)

const customColors = reactive({
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  info: '#1890ff'
})

const layoutConfig = reactive({
  sidebarPosition: 'left',
  contentWidth: 'fluid',
  headerStyle: 'fixed'
})

const componentConfig = reactive({
  size: 'medium',
  borderRadius: 6,
  shadow: 'medium'
})

const formData = reactive({
  input: '',
  select: '',
  switch: false
})

const tableData = reactive([
  { name: '张三', status: 'active', date: '2024-01-01' },
  { name: '李四', status: 'inactive', date: '2024-01-02' },
  { name: '王五', status: 'active', date: '2024-01-03' }
])

// 方法
const handleColorChange = (colors) => {
  updateTheme({ customColors: colors })
}

const handleLayoutChange = (layout) => {
  updateTheme({ layout })
}

const saveConfig = async () => {
  try {
    const config = {
      theme: currentTheme.value,
      customColors,
      layout: layoutConfig,
      components: componentConfig
    }
    
    await saveThemeConfig(config)
    ElMessage.success('主题配置保存成功！')
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  }
}

const resetConfig = async () => {
  try {
    await ElMessageBox.confirm('确定要重置为默认配置吗？', '确认重置', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await resetTheme()
    ElMessage.success('已重置为默认配置')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重置失败：' + error.message)
    }
  }
}

const exportConfig = () => {
  const config = {
    theme: currentTheme.value,
    customColors,
    layout: layoutConfig,
    components: componentConfig
  }
  
  const dataStr = JSON.stringify(config, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
  
  const exportFileDefaultName = `theme-config-${Date.now()}.json`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
  
  ElMessage.success('配置已导出')
}

const importConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result)
          
          // 应用导入的配置
          if (config.theme) {
            switchTheme(config.theme)
          }
          
          if (config.customColors) {
            Object.assign(customColors, config.customColors)
            handleColorChange(customColors)
          }
          
          if (config.layout) {
            Object.assign(layoutConfig, config.layout)
            handleLayoutChange(layoutConfig)
          }
          
          if (config.components) {
            Object.assign(componentConfig, config.components)
          }
          
          ElMessage.success('配置导入成功')
        } catch (error) {
          ElMessage.error('配置文件格式错误')
        }
      }
      reader.readAsText(file)
    }
  }
  
  input.click()
}

// 生命周期
onMounted(() => {
  // 可以在这里加载已保存的配置
})
</script>

<style scoped lang="scss">
.theme-demo {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.config-panel,
.preview-panel {
  margin-bottom: 24px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

// 主题网格
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.theme-card {
  position: relative;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary);
    transform: translateY(-2px);
  }

  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.theme-preview {
  width: 100%;
  height: 60px;
  border-radius: 4px;
  margin-bottom: 12px;
}

.theme-info {
  h4 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 12px;
    color: #666;
  }
}

.check-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--el-color-primary);
  font-size: 20px;
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e1e5e9;
}

// 预览区域
.preview-section {
  margin-bottom: 32px;

  h3 {
    margin-bottom: 16px;
    color: #333;
  }
}

.button-preview {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.card-content {
  text-align: center;
  
  h4 {
    margin: 12px 0 8px 0;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .theme-demo {
    padding: 16px;
  }
  
  .theme-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
  
  .button-preview {
    flex-direction: column;
  }
}
</style>