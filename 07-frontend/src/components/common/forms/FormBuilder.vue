<template>
  <div class="form-builder-container">
    <div class="builder-layout">
      <!-- 左侧工具栏 -->
      <div class="builder-toolbar">
        <h3>表单元素</h3>
        <div class="toolbox-categories">
          <el-tabs v-model="activeCategory">
            <el-tab-pane label="基础" name="basic">
              <div class="field-components">
                <div
                  v-for="field in basicFields"
                  :key="field.type"
                  class="field-component-item"
                  @click="addField(field)"
                  :title="field.label"
                >
                  <el-icon :size="20" class="field-icon">{{ field.icon }}</el-icon>
                  <span>{{ field.label }}</span>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="选择" name="select">
              <div class="field-components">
                <div
                  v-for="field in selectFields"
                  :key="field.type"
                  class="field-component-item"
                  @click="addField(field)"
                  :title="field.label"
                >
                  <el-icon :size="20" class="field-icon">{{ field.icon }}</el-icon>
                  <span>{{ field.label }}</span>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="高级" name="advanced">
              <div class="field-components">
                <div
                  v-for="field in advancedFields"
                  :key="field.type"
                  class="field-component-item"
                  @click="addField(field)"
                  :title="field.label"
                >
                  <el-icon :size="20" class="field-icon">{{ field.icon }}</el-icon>
                  <span>{{ field.label }}</span>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 中间预览区域 -->
      <div class="builder-preview">
        <div class="preview-header">
          <h3>表单预览</h3>
          <div class="preview-actions">
            <el-button
              type="primary"
              size="small"
              @click="generateForm"
              :loading="isGenerating"
            >
              生成表单代码
            </el-button>
          </div>
        </div>
        
        <div class="preview-content">
          <DynamicForm
            ref="dynamicFormRef"
            :fields="formConfig.fields"
            v-model="formData"
            :rules="formConfig.rules"
            :show-actions="showFormActions"
          />
        </div>
      </div>

      <!-- 右侧配置面板 -->
      <div class="builder-config" v-if="selectedField">
        <div class="config-header">
          <h3>字段配置</h3>
          <div class="config-actions">
            <el-button
              type="danger"
              icon="el-icon-delete"
              size="small"
              @click="removeField"
              circle
              title="删除字段"
            ></el-button>
            <el-button
              type="info"
              icon="el-icon-top"
              size="small"
              @click="moveFieldUp"
              :disabled="!canMoveUp"
              circle
              title="上移"
            ></el-button>
            <el-button
              type="info"
              icon="el-icon-bottom"
              size="small"
              @click="moveFieldDown"
              :disabled="!canMoveDown"
              circle
              title="下移"
            ></el-button>
          </div>
        </div>
        
        <div class="config-content">
          <el-form
            ref="configFormRef"
            :model="selectedField"
            label-width="80px"
            size="small"
          >
            <!-- 基本信息 -->
            <el-form-item label="标签名">
              <el-input v-model="selectedField.label" placeholder="输入标签名"></el-input>
            </el-form-item>
            
            <el-form-item label="字段名">
              <el-input v-model="selectedField.prop" placeholder="输入字段名" @blur="updateProp"></el-input>
            </el-form-item>
            
            <el-form-item label="类型">
              <el-select v-model="selectedField.type" disabled>
                <el-option
                  v-for="option in fieldTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                ></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="必填">
              <el-switch v-model="selectedField.required" @change="updateRules"></el-switch>
            </el-form-item>
            
            <el-form-item label="禁用">
              <el-switch v-model="selectedField.disabled"></el-switch>
            </el-form-item>
            
            <el-form-item label="隐藏">
              <el-switch v-model="selectedField.hidden"></el-switch>
            </el-form-item>
            
            <!-- 占位符 -->
            <el-form-item label="占位符">
              <el-input v-model="selectedField.placeholder" placeholder="输入占位符"></el-input>
            </el-form-item>
            
            <!-- 默认值 -->
            <el-form-item label="默认值">
              <el-input v-model="selectedField.default" placeholder="输入默认值"></el-input>
            </el-form-item>
            
            <!-- 帮助信息 -->
            <el-form-item label="帮助信息">
              <el-input
                v-model="selectedField.help"
                placeholder="输入帮助信息"
                type="textarea"
                :rows="2"
              ></el-input>
            </el-form-item>
            
            <!-- 宽度 -->
            <el-form-item label="宽度">
              <el-input-number
                v-model="selectedField.width"
                :min="100"
                :max="1000"
                size="small"
                controls-position="right"
              ></el-input-number>
              <span style="margin-left: 10px;">px</span>
            </el-form-item>
            
            <!-- 验证规则 -->
            <el-form-item label="验证规则">
              <el-button
                type="primary"
                size="small"
                @click="showValidationRules = !showValidationRules"
              >
                {{ showValidationRules ? '隐藏规则' : '配置规则' }}
              </el-button>
            </el-form-item>
            
            <!-- 验证规则详情 -->
            <el-collapse v-if="showValidationRules">
              <el-collapse-item title="验证规则详情">
                <el-form-item label="最小长度">
                  <el-input-number
                    v-model="validationConfig.min"
                    :min="0"
                    size="small"
                    controls-position="right"
                    @change="updateRules"
                  ></el-input-number>
                </el-form-item>
                
                <el-form-item label="最大长度">
                  <el-input-number
                    v-model="validationConfig.max"
                    :min="0"
                    size="small"
                    controls-position="right"
                    @change="updateRules"
                  ></el-input-number>
                </el-form-item>
                
                <el-form-item label="正则表达式">
                  <el-input
                    v-model="validationConfig.pattern"
                    placeholder="输入正则表达式"
                    @change="updateRules"
                  ></el-input>
                </el-form-item>
                
                <el-form-item label="自定义校验">
                  <el-input
                    v-model="validationConfig.validator"
                    placeholder="输入自定义校验函数名"
                  ></el-input>
                </el-form-item>
                
                <el-form-item label="触发方式">
                  <el-select
                    v-model="validationConfig.trigger"
                    placeholder="选择触发方式"
                    @change="updateRules"
                  >
                    <el-option label="失焦" value="blur"></el-option>
                    <el-option label="输入" value="change"></el-option>
                    <el-option label="两者" value="blur,change"></el-option>
                  </el-select>
                </el-form-item>
              </el-collapse-item>
            </el-collapse>
            
            <!-- 特定类型字段的配置 -->
            <template v-if="selectedField.type === 'select' || selectedField.type === 'radio'">
              <el-form-item label="选项配置">
                <div class="options-config">
                  <div
                    v-for="(option, index) in selectedFieldOptions"
                    :key="index"
                    class="option-item"
                  >
                    <el-input
                      v-model="option.label"
                      placeholder="选项文本"
                      size="small"
                      style="width: 45%; margin-right: 10px;"
                    ></el-input>
                    <el-input
                      v-model="option.value"
                      placeholder="选项值"
                      size="small"
                      style="width: 45%; margin-right: 10px;"
                    ></el-input>
                    <el-button
                      type="danger"
                      icon="el-icon-delete"
                      size="small"
                      @click="removeOption(index)"
                      circle
                    ></el-button>
                  </div>
                  <el-button
                    type="primary"
                    icon="el-icon-plus"
                    size="small"
                    @click="addOption"
                    style="margin-top: 10px;"
                  >
                    添加选项
                  </el-button>
                </div>
              </el-form-item>
            </template>
          </el-form>
        </div>
      </div>
    </div>
    
    <!-- 表单代码生成结果弹窗 -->
    <el-dialog
      v-model="showCodeDialog"
      title="生成的表单代码"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="code-content">
        <el-tabs v-model="activeCodeTab">
          <el-tab-pane label="模板代码" name="template">
            <el-scrollbar height="400px">
              <pre><code class="language-vue">{{ generatedTemplateCode }}</code></pre>
            </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="配置对象" name="config">
            <el-scrollbar height="400px">
              <pre><code class="language-javascript">{{ generatedConfigCode }}</code></pre>
            </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="数据模型" name="data">
            <el-scrollbar height="400px">
              <pre><code class="language-javascript">{{ generatedDataCode }}</code></pre>
            </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="showCodeDialog = false">关闭</el-button>
        <el-button type="primary" @click="copyCode">复制代码</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DynamicForm from './DynamicForm.vue'

// 引入图标
import {
  Document,
  Edit,
  Select,
  Calendar,
  UploadFilled,
  Check,
  CircleCheck,
  SwitchButton,
  Scale,
  Star,
  ColorPicker,
  Plus,
  Delete,
  ArrowUp,
  ArrowDown,
  Setting
} from '@element-plus/icons-vue'

// Props 定义
const props = defineProps({
  // 初始表单配置
  initialConfig: {
    type: Object,
    default: () => ({
      fields: [],
      rules: {}
    })
  },
  // 是否显示表单操作按钮
  showFormActions: {
    type: Boolean,
    default: true
  }
})

// Emits 定义
const emit = defineEmits(['update:config', 'generate', 'add-field', 'remove-field', 'update-field'])

// 表单引用
const dynamicFormRef = ref(null)
const configFormRef = ref(null)

// 响应式数据
const activeCategory = ref('basic')
const showValidationRules = ref(false)
const showCodeDialog = ref(false)
const activeCodeTab = ref('template')
const isGenerating = ref(false)
const selectedFieldIndex = ref(-1)

// 表单配置
const formConfig = reactive({
  fields: [],
  rules: {}
})

// 表单数据
const formData = reactive({})

// 验证配置
const validationConfig = reactive({
  min: undefined,
  max: undefined,
  pattern: '',
  validator: '',
  trigger: 'blur,change'
})

// 字段类型选项
const fieldTypeOptions = [
  { label: '单行输入', value: 'input' },
  { label: '下拉选择', value: 'select' },
  { label: '日期选择', value: 'date' },
  { label: '文件上传', value: 'upload' },
  { label: '复选框', value: 'checkbox' },
  { label: '单选框', value: 'radio' },
  { label: '开关', value: 'switch' },
  { label: '滑块', value: 'slider' },
  { label: '评分', value: 'rate' },
  { label: '颜色选择', value: 'color' }
]

// 可用字段组件
const basicFields = [
  { type: 'input', label: '单行输入', icon: Document },
  { type: 'textarea', label: '多行输入', icon: Edit },
  { type: 'date', label: '日期选择', icon: Calendar },
  { type: 'upload', label: '文件上传', icon: UploadFilled }
]

const selectFields = [
  { type: 'select', label: '下拉选择', icon: Select },
  { type: 'checkbox', label: '复选框组', icon: Check },
  { type: 'radio', label: '单选框组', icon: CircleCheck },
  { type: 'switch', label: '开关', icon: SwitchButton }
]

const advancedFields = [
  { type: 'slider', label: '滑块', icon: Scale },
  { type: 'rate', label: '评分', icon: Star },
  { type: 'color', label: '颜色选择', icon: ColorPicker }
]

// 计算属性
const selectedField = computed(() => {
  return selectedFieldIndex.value >= 0 ? formConfig.fields[selectedFieldIndex.value] : null
})

const selectedFieldOptions = computed({
  get: () => {
    if (!selectedField.value || !selectedField.value.componentProps) {
      return []
    }
    return selectedField.value.componentProps.options || []
  },
  set: (value) => {
    if (!selectedField.value) return
    
    if (!selectedField.value.componentProps) {
      selectedField.value.componentProps = {}
    }
    selectedField.value.componentProps.options = value
  }
})

const canMoveUp = computed(() => {
  return selectedFieldIndex.value > 0
})

const canMoveDown = computed(() => {
  return selectedFieldIndex.value < formConfig.fields.length - 1
})

const generatedTemplateCode = computed(() => {
  return `<template>
  <DynamicForm
    :fields="formConfig.fields"
    v-model="formData"
    :rules="formConfig.rules"
    @submit="handleSubmit"
    @reset="handleReset"
  />
</template>`
})

const generatedConfigCode = computed(() => {
  const config = JSON.stringify(formConfig, null, 2)
  return `const formConfig = ${config};`
})

const generatedDataCode = computed(() => {
  const data = JSON.stringify(formData, null, 2)
  return `const formData = ${data};`
})

// 监听初始配置变化
watch(() => props.initialConfig, (newConfig) => {
  if (newConfig) {
    formConfig.fields = [...newConfig.fields]
    formConfig.rules = { ...newConfig.rules }
    // 初始化表单数据
    initializeFormData()
  }
}, { deep: true, immediate: true })

// 监听表单配置变化
watch(() => formConfig.fields, () => {
  emit('update:config', { ...formConfig })
  initializeFormData()
}, { deep: true })

// 监听选中字段变化
watch(selectedField, (newField) => {
  if (newField) {
    // 同步验证配置
    syncValidationConfig()
    // 初始化组件属性
    if (!newField.componentProps) {
      newField.componentProps = {}
    }
    
    // 为特定类型字段初始化选项
    if ((newField.type === 'select' || newField.type === 'radio') && 
        !newField.componentProps.options) {
      newField.componentProps.options = [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' }
      ]
    }
  }
}, { immediate: true })

// 生命周期钩子
onMounted(() => {
  console.log('FormBuilder mounted')
})

// 初始化表单数据
function initializeFormData() {
  formConfig.fields.forEach(field => {
    if (!(field.prop in formData)) {
      formData[field.prop] = field.default !== undefined ? field.default : null
    }
  })
}

// 添加字段
function addField(fieldTemplate) {
  const newField = {
    type: fieldTemplate.type,
    label: fieldTemplate.label,
    prop: generateUniqueProp(fieldTemplate.type),
    required: false,
    disabled: false,
    hidden: false,
    placeholder: `请输入${fieldTemplate.label}`,
    default: null,
    help: '',
    width: 300,
    componentProps: {}
  }
  
  // 为特定类型设置默认值
  if (fieldTemplate.type === 'checkbox') {
    newField.default = []
  } else if (fieldTemplate.type === 'switch') {
    newField.default = false
  }
  
  formConfig.fields.push(newField)
  selectedFieldIndex.value = formConfig.fields.length - 1
  
  emit('add-field', newField, formConfig.fields.length - 1)
  
  ElMessage.success(`已添加${fieldTemplate.label}字段`)
}

// 生成唯一字段名
function generateUniqueProp(type) {
  let counter = 1
  let baseProp = type
  
  while (formConfig.fields.some(field => field.prop === baseProp)) {
    baseProp = `${type}${counter++}`
  }
  
  return baseProp
}

// 移除字段
function removeField() {
  if (selectedFieldIndex.value < 0) return
  
  ElMessageBox.confirm('确定要删除该字段吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const removedField = formConfig.fields.splice(selectedFieldIndex.value, 1)
    
    // 删除对应的验证规则
    if (removedField[0]?.prop && formConfig.rules[removedField[0].prop]) {
      delete formConfig.rules[removedField[0].prop]
    }
    
    // 删除表单数据
    if (removedField[0]?.prop && formData[removedField[0].prop] !== undefined) {
      delete formData[removedField[0].prop]
    }
    
    selectedFieldIndex.value = -1
    
    emit('remove-field', removedField[0])
    ElMessage.success('字段已删除')
  }).catch(() => {
    // 取消删除
  })
}

// 移动字段上移
function moveFieldUp() {
  if (!canMoveUp.value) return
  
  const temp = formConfig.fields[selectedFieldIndex.value - 1]
  formConfig.fields[selectedFieldIndex.value - 1] = formConfig.fields[selectedFieldIndex.value]
  formConfig.fields[selectedFieldIndex.value] = temp
  selectedFieldIndex.value--
  
  emit('update-field', formConfig.fields)
}

// 移动字段下移
function moveFieldDown() {
  if (!canMoveDown.value) return
  
  const temp = formConfig.fields[selectedFieldIndex.value + 1]
  formConfig.fields[selectedFieldIndex.value + 1] = formConfig.fields[selectedFieldIndex.value]
  formConfig.fields[selectedFieldIndex.value] = temp
  selectedFieldIndex.value++
  
  emit('update-field', formConfig.fields)
}

// 更新字段名
function updateProp() {
  if (!selectedField.value) return
  
  // 检查字段名是否重复
  const isDuplicate = formConfig.fields.some((field, index) => {
    return field.prop === selectedField.value.prop && index !== selectedFieldIndex.value
  })
  
  if (isDuplicate) {
    ElMessage.warning('字段名已存在，请修改')
    // 生成一个唯一的字段名
    selectedField.value.prop = generateUniqueProp(selectedField.value.type)
  }
  
  // 同步验证规则的键名
  if (formConfig.rules && formConfig.rules[selectedField.value.prop]) {
    // 这里简化处理，实际应用中需要更复杂的逻辑
  }
}

// 同步验证配置
function syncValidationConfig() {
  if (!selectedField.value || !formConfig.rules || !formConfig.rules[selectedField.value.prop]) {
    // 重置验证配置
    validationConfig.min = undefined
    validationConfig.max = undefined
    validationConfig.pattern = ''
    validationConfig.validator = ''
    validationConfig.trigger = 'blur,change'
    return
  }
  
  const rule = formConfig.rules[selectedField.value.prop][0]
  if (rule) {
    validationConfig.min = rule.min
    validationConfig.max = rule.max
    validationConfig.pattern = rule.pattern || ''
    validationConfig.validator = rule.validator || ''
    validationConfig.trigger = rule.trigger || 'blur,change'
  }
}

// 更新验证规则
function updateRules() {
  if (!selectedField.value) return
  
  const prop = selectedField.value.prop
  const rules = []
  
  if (selectedField.value.required) {
    rules.push({
      required: true,
      message: `请输入${selectedField.value.label}`,
      trigger: validationConfig.trigger
    })
  }
  
  if (validationConfig.min !== undefined && validationConfig.min > 0) {
    rules.push({
      min: validationConfig.min,
      message: `长度不能小于${validationConfig.min}个字符`,
      trigger: validationConfig.trigger
    })
  }
  
  if (validationConfig.max !== undefined && validationConfig.max > 0) {
    rules.push({
      max: validationConfig.max,
      message: `长度不能大于${validationConfig.max}个字符`,
      trigger: validationConfig.trigger
    })
  }
  
  if (validationConfig.pattern) {
    rules.push({
      pattern: new RegExp(validationConfig.pattern),
      message: `请输入有效的${selectedField.value.label}`,
      trigger: validationConfig.trigger
    })
  }
  
  if (rules.length > 0) {
    formConfig.rules[prop] = rules
  } else {
    delete formConfig.rules[prop]
  }
}

// 添加选项
function addOption() {
  selectedFieldOptions.value.push({
    label: `选项${selectedFieldOptions.value.length + 1}`,
    value: `${selectedFieldOptions.value.length + 1}`
  })
}

// 移除选项
function removeOption(index) {
  selectedFieldOptions.value.splice(index, 1)
}

// 生成表单代码
async function generateForm() {
  isGenerating.value = true
  
  try {
    // 验证所有字段
    const hasInvalidFields = formConfig.fields.some(field => !field.prop || !field.label)
    
    if (hasInvalidFields) {
      ElMessage.warning('请完善所有字段的属性')
      return
    }
    
    // 显示代码对话框
    showCodeDialog.value = true
    
    emit('generate', {
      template: generatedTemplateCode.value,
      config: generatedConfigCode.value,
      data: generatedDataCode.value
    })
  } catch (error) {
    ElMessage.error('生成代码失败')
    console.error('Generate form error:', error)
  } finally {
    isGenerating.value = false
  }
}

// 复制代码
async function copyCode() {
  let codeToCopy = ''
  
  switch (activeCodeTab.value) {
    case 'template':
      codeToCopy = generatedTemplateCode.value
      break
    case 'config':
      codeToCopy = generatedConfigCode.value
      break
    case 'data':
      codeToCopy = generatedDataCode.value
      break
  }
  
  try {
    await navigator.clipboard.writeText(codeToCopy)
    ElMessage.success('代码已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
    console.error('Copy code error:', error)
  }
}

// 选择字段进行编辑
function selectFieldForEdit(index) {
  selectedFieldIndex.value = index
  
  nextTick(() => {
    // 滚动到配置区域
    const configEl = document.querySelector('.builder-config')
    if (configEl) {
      configEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

// 导出表单配置
function exportFormConfig() {
  const configStr = JSON.stringify(formConfig, null, 2)
  const blob = new Blob([configStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'form-config.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 导入表单配置
function importFormConfig(file) {
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target.result)
      if (config.fields && Array.isArray(config.fields)) {
        formConfig.fields = config.fields
        formConfig.rules = config.rules || {}
        initializeFormData()
        selectedFieldIndex.value = -1
        ElMessage.success('表单配置导入成功')
      } else {
        ElMessage.error('配置格式错误')
      }
    } catch (error) {
      ElMessage.error('导入失败，请检查文件格式')
      console.error('Import config error:', error)
    }
  }
  reader.readAsText(file)
}

// 清空表单
function clearForm() {
  ElMessageBox.confirm('确定要清空当前表单吗？', '确认清空', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    formConfig.fields = []
    formConfig.rules = {}
    Object.keys(formData).forEach(key => {
      delete formData[key]
    })
    selectedFieldIndex.value = -1
    ElMessage.success('表单已清空')
  }).catch(() => {
    // 取消清空
  })
}

// 暴露公共方法
defineExpose({
  // 表单操作
  addField,
  removeField,
  moveFieldUp,
  moveFieldDown,
  selectFieldForEdit,
  // 配置导出导入
  exportFormConfig,
  importFormConfig,
  clearForm,
  generateForm,
  // 表单配置
  formConfig,
  formData
})
</script>

<style scoped>
.form-builder-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.builder-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 工具栏样式 */
.builder-toolbar {
  width: 260px;
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  padding: 20px;
  overflow-y: auto;
}

.builder-toolbar h3 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.field-components {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.field-component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px 10px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.field-component-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.field-icon {
  margin-bottom: 5px;
  color: #409eff;
}

.field-component-item span {
  font-size: 12px;
  color: #606266;
}

/* 预览区域样式 */
.builder-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.preview-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.preview-content {
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

/* 配置面板样式 */
.builder-config {
  width: 360px;
  background-color: #fff;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.config-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.config-actions {
  display: flex;
  gap: 5px;
}

.config-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 选项配置样式 */
.options-config {
  margin-top: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

/* 代码内容样式 */
.code-content {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
}

.code-content pre {
  margin: 0;
  background-color: #f6f8fa;
  border-radius: 4px;
  padding: 16px;
  overflow-x: auto;
}

.code-content code {
  background-color: transparent;
  padding: 0;
  font-size: 14px;
}

/* 响应式设计 */
@media screen and (max-width: 1200px) {
  .builder-toolbar {
    width: 220px;
  }
  
  .builder-config {
    width: 300px;
  }
  
  .field-components {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 768px) {
  .builder-layout {
    flex-direction: column;
  }
  
  .builder-toolbar,
  .builder-config {
    width: 100%;
    border: none;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .builder-preview {
    flex: 1;
    min-height: 400px;
  }
}
</style>