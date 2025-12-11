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
        <div class="fields-panel">
          <div class="panel-header">
            <el-alert 
              title="拖拽调整字段顺序，勾选控制显示/隐藏" 
              type="info" 
              :closable="false"
              style="margin-bottom: 15px;"
            />
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-weight: 600; color: #303133;">字段列表</span>
              <el-button type="primary" link size="small" @click="resetFields">重置</el-button>
            </div>
          </div>
          
          <el-divider style="margin: 10px 0;" />
          
          <!-- ✅ 使用 draggable 替换原有的 checkbox-group -->
          <div class="column-list">
            <draggable
              v-model="localFieldsList"
              item-key="prop"
              handle=".drag-handle"
              @end="handleFieldDragEnd"
            >
              <template #item="{ element }">
                <div class="field-item">
                  <div class="field-item-left">
                    <el-icon class="drag-handle"><Rank /></el-icon>
                    <el-checkbox
                      :model-value="element.visible"
                      @update:model-value="(val) => updateFieldVisibility(element, val)"
                      :label="element.label"
                    />
                  </div>
                  <div class="field-item-right">
                    <el-tag v-if="element.fixed" size="small" type="info">固定</el-tag>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>
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
        <!-- ✅ 业务变量 - 按钮列表 -->
        <div v-if="businessVarButtons && businessVarButtons.length > 0" style="margin-bottom: 24px;">
          <el-form label-width="140px">
            <el-form-item 
              v-for="btn in businessVarButtons" 
              :key="btn.value" 
              :label="btn.label"
            >
              <el-button type="primary" @click="btn.onClick">打开</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-divider v-if="businessVarButtons && businessVarButtons.length > 0 && businessVarSelects && businessVarSelects.length > 0" />

        <!-- ✅ 业务变量 - 下拉选择列表 -->
        <div v-if="businessVarSelects && businessVarSelects.length > 0">
          <el-form label-width="140px">
            <el-form-item 
              v-for="select in businessVarSelects" 
              :key="select.value" 
              :label="select.label"
            >
              <el-select 
                v-model="localSettings[select.value]" 
                style="width: 100%;"
                :placeholder="'请选择' + select.label"
              >
                <el-option 
                  v-for="option in select.options" 
                  :key="option.value" 
                  :label="option.label" 
                  :value="option.value" 
                />
              </el-select>
              <!-- ✅ 文案说明（HTML格式） -->
              <div v-if="select.description" v-html="select.description" style="margin-top: 8px;"></div>
              <!-- ✅ 温馨提示 -->
              <el-alert 
                v-if="select.tip" 
                :title="select.tip" 
                type="info" 
                :closable="false"
                style="margin-top: 10px;"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 自定义业务变量插槽，允许每个页面定制 -->
        <slot name="business-vars" :settings="localSettings">
          <!-- 默认通用业务变量（如果没有插槽内容） -->
          <div v-if="!businessVarButtons || businessVarButtons.length === 0">
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
              
              <el-divider />
              
              <el-form-item label="提前入库期">
                <el-input-number 
                  v-model="localSettings.advanceStorageDays" 
                  :min="0" 
                  :max="365" 
                  placeholder="请输入提前天数"
                  style="width: 200px;"
                />
                <span style="margin-left: 10px; color: #909399;">天</span>
              </el-form-item>
              <el-alert 
                title="提前入库期：计划入库日期 = 订单承诺交期 - 提前入库期" 
                type="info" 
                :closable="false"
                style="margin-top: 10px;"
              />
            </el-form>
          </div>
        </slot>
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
import { Rank } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'

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
  // ✅ 业务变量 - 按钮配置
  businessVarButtons: {
    type: Array,
    default: () => []
  },
  // ✅ 业务变量 - 下拉选择配置
  businessVarSelects: {
    type: Array,
    default: () => []
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
  advanceStorageDays: 0,
  
  // 合并用户提供的默认设置
  ...props.defaultSettings
})

// 本地设置
const localSettings = ref(loadSettings())

// ✅ 新增：字段列表（包含visible属性）
const localFieldsList = ref([])
const originalFieldsList = ref([])

// ✅ 初始化字段列表
const initFieldsList = () => {
  if (props.availableFields && props.availableFields.length > 0) {
    const visibleFields = localSettings.value.visibleFields || []
    localFieldsList.value = props.availableFields.map(field => ({
      ...field,
      visible: visibleFields.includes(field.prop)
    }))
    originalFieldsList.value = JSON.parse(JSON.stringify(localFieldsList.value))
    console.log('✅ 字段列表初始化:', localFieldsList.value.length, '个字段')
  }
}

// ✅ 监听字段变化
watch(() => [props.availableFields, visible.value], ([newFields, isVisible]) => {
  if (isVisible && newFields && newFields.length > 0) {
    initFieldsList()
  }
}, { immediate: true, deep: true })

// ✅ 更新字段可见性
const updateFieldVisibility = (field, visible) => {
  field.visible = visible
  console.log(`✅ 字段可见性更新: ${field.label} -> ${visible}`)
}

// ✅ 拖拽结束事件
const handleFieldDragEnd = () => {
  console.log('✅ 字段顺序已更新:', localFieldsList.value.map(f => f.label).join(', '))
}

// ✅ 重置字段
const resetFields = () => {
  localFieldsList.value = JSON.parse(JSON.stringify(originalFieldsList.value))
  ElMessage.info('已重置字段设置')
}

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
    // ✅ 保存字段顺序和可见性
    if (localFieldsList.value.length > 0) {
      localSettings.value.fields = localFieldsList.value
      localSettings.value.visibleFields = localFieldsList.value
        .filter(f => f.visible)
        .map(f => f.prop)
      
      console.log('✅ 保存字段设置:', {
        字段总数: localFieldsList.value.length,
        可见字段: localSettings.value.visibleFields.length,
        字段顺序: localFieldsList.value.map(f => f.label)
      })
    }
    
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

/* ✅ 新增：字段管理样式 */
.fields-panel {
  padding: 5px;
}

.panel-header {
  margin-bottom: 10px;
}

.column-list {
  max-height: 400px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 5px;
  border-radius: 4px;
  cursor: move;
  transition: background-color 0.2s;
}

.field-item:hover {
  background-color: #f5f7fa;
}

.field-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.drag-handle {
  cursor: move;
  color: #909399;
  font-size: 16px;
}

.drag-handle:hover {
  color: #409eff;
}

.field-item-right {
  margin-left: 10px;
}

.column-list :deep(.el-checkbox) {
  width: 100%;
}

.column-list :deep(.el-checkbox__label) {
  color: #606266;
  font-size: 14px;
}
</style>
