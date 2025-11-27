<template>
  <div class="formula-editor">
    <!-- 编辑器按钮 -->
    <el-button
      :icon="FunctionIcon"
      size="small"
      @click="showDialog = true"
      :disabled="disabled"
      title="公式编辑器"
    >
      {{ buttonText || '公式' }}
    </el-button>

    <!-- 公式显示 -->
    <div v-if="displayFormula && formula" class="formula-display">
      <el-tag type="info" size="small">
        {{ formulaDisplay }}
      </el-tag>
    </div>

    <!-- 公式编辑对话框 -->
    <el-dialog
      v-model="showDialog"
      title="公式编辑器"
      width="800px"
      :close-on-click-modal="false"
      @open="initEditor"
    >
      <div class="formula-editor-content">
        <!-- 表达式输入 -->
        <div class="expression-section">
          <div class="section-title">
            <span>表达式</span>
            <div class="expression-actions">
              <el-button size="small" @click="validateFormula" :loading="validating">
                <i class="fas fa-check"></i> 验证
              </el-button>
              <el-button size="small" @click="clearFormula">
                <i class="fas fa-trash"></i> 清空
              </el-button>
            </div>
          </div>
          <el-input
            v-model="currentFormula"
            type="textarea"
            :rows="4"
            placeholder="请输入公式表达式，如: A1 + B2 * SUM(C1:C10)"
            @input="handleExpressionChange"
          />
          <div v-if="validationResult" class="validation-result" :class="validationResult.valid ? 'valid' : 'invalid'">
            <i :class="validationResult.valid ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
            {{ validationResult.message }}
          </div>
        </div>

        <!-- 字段列表 -->
        <div class="fields-section">
          <div class="section-title">
            <span>可用字段</span>
            <el-input
              v-model="fieldSearch"
              placeholder="搜索字段"
              size="small"
              prefix-icon="Search"
              clearable
              style="width: 200px;"
            />
          </div>
          <div class="fields-grid">
            <div
              v-for="field in filteredFields"
              :key="field.key"
              class="field-item"
              @click="insertField(field)"
            >
              <div class="field-name">{{ field.name }}</div>
              <div class="field-key">{{ field.key }}</div>
              <div class="field-type">{{ field.type }}</div>
            </div>
          </div>
        </div>

        <!-- 函数列表 -->
        <div class="functions-section">
          <div class="section-title">
            <span>常用函数</span>
            <el-select v-model="functionCategory" size="small" style="width: 150px;">
              <el-option label="全部" value="all" />
              <el-option label="数学函数" value="math" />
              <el-option label="统计函数" value="stat" />
              <el-option label="文本函数" value="text" />
              <el-option label="日期函数" value="date" />
              <el-option label="逻辑函数" value="logic" />
            </el-select>
          </div>
          <div class="functions-list">
            <div
              v-for="func in filteredFunctions"
              :key="func.name"
              class="function-item"
              @click="insertFunction(func)"
            >
              <div class="function-name">{{ func.name }}</div>
              <div class="function-syntax">{{ func.syntax }}</div>
              <div class="function-desc">{{ func.description }}</div>
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <div class="section-title">快捷操作</div>
          <div class="actions-grid">
            <el-button size="small" @click="insertOperator('+')">加 (+)</el-button>
            <el-button size="small" @click="insertOperator('-')">减 (-)</el-button>
            <el-button size="small" @click="insertOperator('*')">乘 (×)</el-button>
            <el-button size="small" @click="insertOperator('/')">除 (÷)</el-button>
            <el-button size="small" @click="insertOperator('(')">左括号 (</el-button>
            <el-button size="small" @click="insertOperator(')')">右括号 )</el-button>
            <el-button size="small" @click="insertOperator('>')">大于 ></el-button>
            <el-button size="small" @click="insertOperator('<')">小于 <</el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" @click="applyFormula" :disabled="!validationResult?.valid">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Function as FunctionIcon } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Field {
  key: string
  name: string
  type: string
  description?: string
}

interface Function {
  name: string
  syntax: string
  description: string
  category: string
}

interface Validation {
  valid: boolean
  message: string
}

interface Props {
  modelValue?: string
  fields?: Field[]
  disabled?: boolean
  buttonText?: string
  displayFormula?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  fields: () => [],
  disabled: false,
  displayFormula: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  validate: [result: Validation]
}>()

const showDialog = ref(false)
const currentFormula = ref('')
const fieldSearch = ref('')
const functionCategory = ref('all')
const validating = ref(false)
const validationResult = ref<Validation | null>(null)

// 默认函数列表
const defaultFunctions: Function[] = [
  // 数学函数
  { name: 'SUM', syntax: 'SUM(range)', description: '求和', category: 'math' },
  { name: 'AVERAGE', syntax: 'AVERAGE(range)', description: '平均值', category: 'math' },
  { name: 'MAX', syntax: 'MAX(range)', description: '最大值', category: 'math' },
  { name: 'MIN', syntax: 'MIN(range)', description: '最小值', category: 'math' },
  { name: 'ROUND', syntax: 'ROUND(number, digits)', description: '四舍五入', category: 'math' },
  { name: 'ABS', syntax: 'ABS(number)', description: '绝对值', category: 'math' },
  { name: 'POWER', syntax: 'POWER(number, exponent)', description: '幂运算', category: 'math' },
  { name: 'SQRT', syntax: 'SQRT(number)', description: '平方根', category: 'math' },
  
  // 统计函数
  { name: 'COUNT', syntax: 'COUNT(range)', description: '计数', category: 'stat' },
  { name: 'COUNTA', syntax: 'COUNTA(range)', description: '非空计数', category: 'stat' },
  { name: 'MEDIAN', syntax: 'MEDIAN(range)', description: '中位数', category: 'stat' },
  { name: 'STDDEV', syntax: 'STDDEV(range)', description: '标准差', category: 'stat' },
  { name: 'VAR', syntax: 'VAR(range)', description: '方差', category: 'stat' },
  
  // 文本函数
  { name: 'CONCAT', syntax: 'CONCAT(text1, text2, ...)', description: '连接文本', category: 'text' },
  { name: 'LEFT', syntax: 'LEFT(text, num_chars)', description: '左侧文本', category: 'text' },
  { name: 'RIGHT', syntax: 'RIGHT(text, num_chars)', description: '右侧文本', category: 'text' },
  { name: 'MID', syntax: 'MID(text, start_num, num_chars)', description: '中间文本', category: 'text' },
  { name: 'LEN', syntax: 'LEN(text)', description: '文本长度', category: 'text' },
  { name: 'UPPER', syntax: 'UPPER(text)', description: '转大写', category: 'text' },
  { name: 'LOWER', syntax: 'LOWER(text)', description: '转小写', category: 'text' },
  
  // 日期函数
  { name: 'NOW', syntax: 'NOW()', description: '当前时间', category: 'date' },
  { name: 'TODAY', syntax: 'TODAY()', description: '今天', category: 'date' },
  { name: 'YEAR', syntax: 'YEAR(date)', description: '年份', category: 'date' },
  { name: 'MONTH', syntax: 'MONTH(date)', description: '月份', category: 'date' },
  { name: 'DAY', syntax: 'DAY(date)', description: '日期', category: 'date' },
  { name: 'DATEDIF', syntax: 'DATEDIF(start_date, end_date, unit)', description: '日期差', category: 'date' },
  
  // 逻辑函数
  { name: 'IF', syntax: 'IF(logical_test, value_if_true, value_if_false)', description: '条件判断', category: 'logic' },
  { name: 'AND', syntax: 'AND(logical1, logical2, ...)', description: '逻辑与', category: 'logic' },
  { name: 'OR', syntax: 'OR(logical1, logical2, ...)', description: '逻辑或', category: 'logic' },
  { name: 'NOT', syntax: 'NOT(logical)', description: '逻辑非', category: 'logic' },
  { name: 'IFERROR', syntax: 'IFERROR(value, value_if_error)', description: '错误处理', category: 'logic' }
]

// 公式显示
const formula = computed(() => props.modelValue)

const formulaDisplay = computed(() => {
  if (!formula.value) return '未设置公式'
  return formula.value.length > 30 ? formula.value.substring(0, 30) + '...' : formula.value
})

// 过滤字段
const filteredFields = computed(() => {
  if (!fieldSearch.value) return props.fields
  return props.fields.filter(field => 
    field.name.toLowerCase().includes(fieldSearch.value.toLowerCase()) ||
    field.key.toLowerCase().includes(fieldSearch.value.toLowerCase())
  )
})

// 过滤函数
const filteredFunctions = computed(() => {
  if (functionCategory.value === 'all') return defaultFunctions
  return defaultFunctions.filter(func => func.category === functionCategory.value)
})

// 初始化编辑器
const initEditor = () => {
  currentFormula.value = formula.value
  validationResult.value = null
}

// 处理表达式变化
const handleExpressionChange = () => {
  validationResult.value = null
}

// 验证公式
const validateFormula = async () => {
  if (!currentFormula.value.trim()) {
    validationResult.value = {
      valid: false,
      message: '请输入公式表达式'
    }
    return
  }

  validating.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 简单的公式验证逻辑
    const formula = currentFormula.value.trim()
    const isValid = validateFormulaSyntax(formula)
    
    validationResult.value = {
      valid: isValid,
      message: isValid ? '公式格式正确' : '公式格式有误，请检查语法'
    }
    
    emit('validate', validationResult.value)
  } catch (error) {
    validationResult.value = {
      valid: false,
      message: '验证失败：' + (error as Error).message
    }
  } finally {
    validating.value = false
  }
}

// 简单的公式语法验证
const validateFormulaSyntax = (formula: string): boolean => {
  // 检查括号匹配
  let parentheses = 0
  for (let i = 0; i < formula.length; i++) {
    if (formula[i] === '(') parentheses++
    if (formula[i] === ')') parentheses--
    if (parentheses < 0) return false
  }
  if (parentheses !== 0) return false

  // 检查是否包含有效的字段或函数
  const hasValidContent = props.fields.some(field => formula.includes(field.key)) ||
                          defaultFunctions.some(func => formula.includes(func.name)) ||
                          /[A-Z][A-Z0-9_]*\(.*\)/.test(formula)
  
  return hasValidContent
}

// 插入字段
const insertField = (field: Field) => {
  const textarea = document.querySelector('.el-textarea__inner') as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = currentFormula.value
    currentFormula.value = text.substring(0, start) + field.key + text.substring(end)
    
    // 设置光标位置
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + field.key.length
      textarea.focus()
    }, 0)
  }
}

// 插入函数
const insertFunction = (func: Function) => {
  const textarea = document.querySelector('.el-textarea__inner') as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = currentFormula.value
    
    // 生成函数模板
    let functionTemplate = func.name + '()'
    if (func.syntax.includes(',')) {
      // 如果有多个参数，在括号内添加光标位置
      functionTemplate = func.name + '()'
      const cursorPos = start + func.name.length + 1
      currentFormula.value = text.substring(0, start) + functionTemplate + text.substring(end)
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = cursorPos
        textarea.focus()
      }, 0)
    } else {
      currentFormula.value = text.substring(0, start) + functionTemplate + text.substring(end)
    }
  }
}

// 插入操作符
const insertOperator = (operator: string) => {
  const textarea = document.querySelector('.el-textarea__inner') as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = currentFormula.value
    currentFormula.value = text.substring(0, start) + operator + text.substring(end)
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + operator.length
      textarea.focus()
    }, 0)
  }
}

// 清空公式
const clearFormula = () => {
  currentFormula.value = ''
  validationResult.value = null
}

// 应用公式
const applyFormula = () => {
  if (!validationResult.value?.valid) {
    ElMessage.warning('请先验证公式的正确性')
    return
  }
  
  emit('update:modelValue', currentFormula.value)
  emit('change', currentFormula.value)
  showDialog.value = false
  ElMessage.success('公式已应用')
}
</script>

<style scoped>
.formula-editor {
  display: inline-block;
}

.formula-display {
  margin-top: 5px;
}

.formula-editor-content {
  max-height: 60vh;
  overflow-y: auto;
}

.expression-section,
.fields-section,
.functions-section,
.quick-actions {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 500;
  color: #303133;
}

.expression-actions {
  display: flex;
  gap: 5px;
}

.validation-result {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.validation-result.valid {
  background-color: #f0f9ff;
  color: #409eff;
  border: 1px solid #b3d8ff;
}

.validation-result.invalid {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

.field-item {
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.field-item:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.field-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.field-key {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
  margin-bottom: 2px;
}

.field-type {
  font-size: 11px;
  color: #67c23a;
  background-color: #f0f9ff;
  padding: 2px 6px;
  border-radius: 2px;
  display: inline-block;
}

.functions-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.function-item {
  padding: 12px 15px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.function-item:hover {
  background-color: #f5f7fa;
}

.function-item:last-child {
  border-bottom: none;
}

.function-name {
  font-weight: 500;
  color: #409eff;
  margin-bottom: 2px;
}

.function-syntax {
  font-size: 12px;
  color: #606266;
  font-family: monospace;
  margin-bottom: 2px;
}

.function-desc {
  font-size: 12px;
  color: #909399;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-dialog__body) {
  padding: 20px;
}
</style>