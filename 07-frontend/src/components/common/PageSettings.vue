<template>
  <el-dialog 
    v-model="visible" 
    title="页面设置" 
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-tabs v-model="activeTab">
      <!-- 流程设置 -->
      <el-tab-pane label="流程设置" name="workflow" v-if="showWorkflow">
        <el-form label-width="140px">
          <el-form-item label="审批流程">
            <el-select v-model="localSettings.approvalFlow" style="width: 100%;">
              <el-option label="单级审批" value="single" />
              <el-option label="多级审批" value="multi" />
              <el-option label="自定义" value="custom" />
            </el-select>
          </el-form-item>
          <el-form-item label="是否需要审核">
            <el-switch v-model="localSettings.requireApproval" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <!-- 菜单设置 -->
      <el-tab-pane label="菜单设置" name="menu" v-if="showMenu">
        <el-form label-width="140px">
          <el-form-item label="菜单位置">
            <el-radio-group v-model="localSettings.menuPosition">
              <el-radio label="top">顶部</el-radio>
              <el-radio label="left">左侧</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="显示面包屑">
            <el-switch v-model="localSettings.showBreadcrumb" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <!-- 颜色设置 -->
      <el-tab-pane label="颜色设置" name="color" v-if="showColor">
        <el-form label-width="140px">
          <el-form-item label="主题色">
            <el-color-picker v-model="localSettings.themeColor" />
          </el-form-item>
          <el-form-item label="页面背景色">
            <el-color-picker v-model="localSettings.backgroundColor" />
          </el-form-item>
          <el-form-item label="表格行背景色">
            <el-color-picker v-model="localSettings.tableRowColor" />
          </el-form-item>
          <el-form-item label="表头背景色">
            <el-color-picker v-model="localSettings.tableHeaderColor" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <!-- 编码设置 -->
      <el-tab-pane label="编码设置" name="encoding" v-if="showEncoding">
        <el-form label-width="140px">
          <el-form-item label="编号前缀">
            <el-input v-model="localSettings.codePrefix" placeholder="如: PRO, WO, PO" />
          </el-form-item>
          <el-form-item label="编号规则">
            <el-input v-model="localSettings.codeRule" placeholder="如: {YYYY}{MM}{DD}{####}" />
          </el-form-item>
          <el-form-item label="自动生成编号">
            <el-switch v-model="localSettings.autoGenerateCode" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <!-- 字段管理 -->
      <el-tab-pane label="字段管理" name="fields" v-if="showFields">
        <el-alert 
          title="可以控制表格中显示哪些字段" 
          type="info" 
          :closable="false"
          style="margin-bottom: 20px;"
        />
        <el-checkbox-group v-model="localSettings.visibleFields">
          <el-row>
            <el-col :span="8" v-for="field in availableFields" :key="field.prop">
              <el-checkbox :label="field.prop" style="margin-bottom: 10px;">
                {{ field.label }}
              </el-checkbox>
            </el-col>
          </el-row>
        </el-checkbox-group>
      </el-tab-pane>
      
      <!-- 打印设置 -->
      <el-tab-pane label="打印设置" name="print" v-if="showPrint">
        <el-form label-width="140px">
          <el-form-item label="打印方向">
            <el-radio-group v-model="localSettings.printOrientation">
              <el-radio label="portrait">纵向</el-radio>
              <el-radio label="landscape">横向</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="打印页边距">
            <el-input-number v-model="localSettings.printMargin" :min="0" :max="50" />
            <span style="margin-left: 10px;">mm</span>
          </el-form-item>
          <el-form-item label="显示页眉">
            <el-switch v-model="localSettings.showPrintHeader" />
          </el-form-item>
          <el-form-item label="显示页脚">
            <el-switch v-model="localSettings.showPrintFooter" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <!-- 导出设置 -->
      <el-tab-pane label="导出设置" name="export" v-if="showExport">
        <el-form label-width="140px">
          <el-form-item label="默认导出格式">
            <el-select v-model="localSettings.exportFormat" style="width: 200px;">
              <el-option label="Excel (.xlsx)" value="xlsx" />
              <el-option label="CSV (.csv)" value="csv" />
              <el-option label="PDF (.pdf)" value="pdf" />
            </el-select>
          </el-form-item>
          <el-form-item label="导出文件名前缀">
            <el-input v-model="localSettings.exportFilePrefix" placeholder="如: 工序负荷表" />
          </el-form-item>
          <el-form-item label="导出时包含图片">
            <el-switch v-model="localSettings.exportWithImages" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <!-- 业务变量设置 -->
      <el-tab-pane label="业务变量" name="business" v-if="showBusinessVars">
        <el-form label-width="140px">
          <el-form-item label="显示天数">
            <el-input-number 
              v-model="localSettings.displayDays" 
              :min="1" 
              :max="365" 
              placeholder="请输入显示天数"
              style="width: 200px;"
            />
            <span style="margin-left: 10px; color: #909399;">天</span>
          </el-form-item>
          <el-alert 
            title="显示天数：控制工序能力负荷表展示未来多少天的数据" 
            type="info" 
            :closable="false"
            style="margin-top: 10px;"
          />
        </el-form>
      </el-tab-pane>
    </el-tabs>
    
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleReset">恢复默认</el-button>
      <el-button type="success" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  // 当前页面的设置键名（用于localStorage）
  settingsKey: {
    type: String,
    required: true
  },
  // 可用字段列表
  availableFields: {
    type: Array,
    default: () => []
  },
  // 显示哪些标签页
  showWorkflow: {
    type: Boolean,
    default: true
  },
  showMenu: {
    type: Boolean,
    default: true
  },
  showColor: {
    type: Boolean,
    default: true
  },
  showEncoding: {
    type: Boolean,
    default: true
  },
  showFields: {
    type: Boolean,
    default: true
  },
  showPrint: {
    type: Boolean,
    default: true
  },
  showExport: {
    type: Boolean,
    default: true
  },
  showBusinessVars: {
    type: Boolean,
    default: false
  },
  // 默认设置
  defaultSettings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('workflow')

// 默认设置
const getDefaultSettings = () => ({
  // 流程设置
  approvalFlow: 'single',
  requireApproval: false,
  
  // 菜单设置
  menuPosition: 'left',
  showBreadcrumb: true,
  
  // 颜色设置
  themeColor: '#409EFF',
  backgroundColor: '#f5f7fa',
  tableRowColor: '#ffffff',
  tableHeaderColor: '#f5f7fa',
  
  // 编码设置
  codePrefix: '',
  codeRule: '',
  autoGenerateCode: true,
  
  // 字段管理
  visibleFields: props.availableFields.map(f => f.prop),
  
  // 打印设置
  printOrientation: 'portrait',
  printMargin: 10,
  showPrintHeader: true,
  showPrintFooter: true,
  
  // 导出设置
  exportFormat: 'xlsx',
  exportFilePrefix: '',
  exportWithImages: false,
  
  // 业务变量设置
  displayDays: 30,
  
  // 合并用户提供的默认设置
  ...props.defaultSettings
})

// 本地设置
const localSettings = ref(loadSettings())

// 从localStorage加载设置
function loadSettings() {
  try {
    const saved = localStorage.getItem(props.settingsKey)
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...getDefaultSettings(), ...parsed }
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
  return getDefaultSettings()
}

// 保存设置
function handleSave() {
  try {
    localStorage.setItem(props.settingsKey, JSON.stringify(localSettings.value))
    ElMessage.success('设置已保存')
    emit('save', localSettings.value)
    visible.value = false
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

// 恢复默认
function handleReset() {
  localSettings.value = getDefaultSettings()
  ElMessage.info('已恢复默认设置')
}

// 取消
function handleCancel() {
  localSettings.value = loadSettings()
  emit('cancel')
  visible.value = false
}

// 监听对话框打开，重新加载设置
watch(visible, (newVal) => {
  if (newVal) {
    localSettings.value = loadSettings()
  }
})
</script>

<style scoped>
.el-form {
  max-height: 500px;
  overflow-y: auto;
}
</style>
