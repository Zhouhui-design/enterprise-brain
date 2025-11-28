<template>
  <div class="validation-helper">
    <!-- 验证状态指示器 -->
    <div 
      v-if="showIndicator"
      class="validation-indicator"
      :class="{
        'validation-indicator--valid': isValid,
        'validation-indicator--invalid': isInvalid,
        'validation-indicator--warning': hasWarnings,
        'validation-indicator--checking': isChecking
      }"
    >
      <i :class="indicatorIcon"></i>
      <span class="indicator-text">{{ indicatorText }}</span>
    </div>

    <!-- 实时验证提示 -->
    <div
      v-if="showRealtimeHelp && currentValidation"
      class="realtime-help"
      :class="`realtime-help--${currentValidation.type}`"
    >
      <div class="realtime-help__header">
        <i :class="currentValidation.icon"></i>
        <span class="realtime-help__title">{{ currentValidation.title }}</span>
      </div>
      <div class="realtime-help__content">
        <p>{{ currentValidation.message }}</p>
        
        <!-- 具体的验证规则 -->
        <div v-if="currentValidation.rules && currentValidation.rules.length > 0" class="validation-rules">
          <div
            v-for="(rule, index) in currentValidation.rules"
            :key="index"
            class="rule-item"
            :class="{ 'rule-item--passed': rule.passed }"
          >
            <i :class="rule.passed ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
            <span>{{ rule.description }}</span>
          </div>
        </div>

        <!-- 示例输入 -->
        <div v-if="currentValidation.example" class="validation-example">
          <div class="example-label">示例：</div>
          <code class="example-value">{{ currentValidation.example }}</code>
        </div>

        <!-- 建议操作 -->
        <div v-if="currentValidation.suggestions" class="validation-suggestions">
          <div class="suggestions-label">建议操作：</div>
          <ul class="suggestions-list">
            <li v-for="(suggestion, index) in currentValidation.suggestions" :key="index">
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div v-if="currentValidation.actions" class="realtime-help__actions">
        <button
          v-for="action in currentValidation.actions"
          :key="action.id"
          class="help-action"
          :class="`help-action--${action.type || 'default'}`"
          @click="handleActionClick(action)"
        >
          <i :class="action.icon"></i>
          {{ action.label }}
        </button>
      </div>
    </div>

    <!-- 防错提示条 -->
    <div
      v-if="showErrorPrevention && errorPreventionMessage"
      class="error-prevention-bar"
      :class="`error-prevention-bar--${errorPreventionMessage.type}`"
    >
      <div class="prevention-content">
        <i :class="errorPreventionMessage.icon"></i>
        <div class="prevention-message">
          <div class="prevention-title">{{ errorPreventionMessage.title }}</div>
          <div class="prevention-description">{{ errorPreventionMessage.description }}</div>
        </div>
      </div>
      
      <div class="prevention-actions">
        <button
          v-if="errorPreventionMessage.primaryAction"
          class="prevention-action prevention-action--primary"
          @click="handlePreventionAction(errorPreventionMessage.primaryAction)"
        >
          {{ errorPreventionMessage.primaryAction.label }}
        </button>
        <button
          v-if="errorPreventionMessage.secondaryAction"
          class="prevention-action prevention-action--secondary"
          @click="handlePreventionAction(errorPreventionMessage.secondaryAction)"
        >
          {{ errorPreventionMessage.secondaryAction.label }}
        </button>
      </div>
    </div>

    <!-- 字段验证状态 -->
    <div
      v-for="(field, fieldKey) in fieldValidations"
      :key="fieldKey"
      class="field-validation"
      :class="`field-validation--${field.status}`"
    >
      <div class="field-validation__label">
        {{ field.label }}
      </div>
      <div class="field-validation__status">
        <i :class="field.icon"></i>
        <span>{{ field.message }}</span>
      </div>
      
      <!-- 字段级详细验证 -->
      <div v-if="showFieldDetails && field.details" class="field-validation__details">
        <div
          v-for="detail in field.details"
          :key="detail.rule"
          class="detail-item"
          :class="{ 'detail-item--passed': detail.passed }"
        >
          <i :class="detail.passed ? 'fas fa-check' : 'fas fa-times'"></i>
          <span>{{ detail.description }}</span>
        </div>
      </div>
    </div>

    <!-- 批量验证结果 -->
    <div v-if="showBatchResults && batchResults" class="batch-validation-results">
      <div class="batch-results__header">
        <h4>验证结果汇总</h4>
        <div class="batch-summary">
          <span class="summary-item summary-item--success">
            <i class="fas fa-check-circle"></i>
            {{ batchResults.passed }} 通过
          </span>
          <span class="summary-item summary-item--warning">
            <i class="fas fa-exclamation-triangle"></i>
            {{ batchResults.warnings }} 警告
          </span>
          <span class="summary-item summary-item--error">
            <i class="fas fa-times-circle"></i>
            {{ batchResults.failed }} 失败
          </span>
        </div>
      </div>
      
      <div class="batch-results__content">
        <div
          v-for="result in batchResults.results"
          :key="result.field"
          class="batch-result-item"
          :class="`batch-result-item--${result.status}`"
        >
          <div class="result-field">{{ result.field }}</div>
          <div class="result-message">{{ result.message }}</div>
        </div>
      </div>
    </div>

    <!-- 智能建议卡片 -->
    <div v-if="showSmartSuggestions && smartSuggestions.length > 0" class="smart-suggestions">
      <div class="suggestions-header">
        <i class="fas fa-lightbulb"></i>
        <h4>智能建议</h4>
      </div>
      <div class="suggestions-list">
        <div
          v-for="suggestion in smartSuggestions"
          :key="suggestion.id"
          class="suggestion-card"
          @click="applySuggestion(suggestion)"
        >
          <div class="suggestion-card__header">
            <i :class="suggestion.icon"></i>
            <div class="suggestion-card__title">{{ suggestion.title }}</div>
          </div>
          <div class="suggestion-card__description">
            {{ suggestion.description }}
          </div>
          <div v-if="suggestion.preview" class="suggestion-card__preview">
            <code>{{ suggestion.preview }}</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useValidation } from './hooks/useValidation'
import { useErrorPrevention } from './hooks/useErrorPrevention'
import { InputValidator } from '@/utils/validation/input-validator'
import { BusinessRules } from '@/utils/validation/business-rules'

export default defineComponent({
  name: 'ValidationHelper',
  
  props: {
    // 要验证的数据
    data: {
      type: [Object, String, Number],
      default: null
    },
    
    // 验证规则配置
    rules: {
      type: Object,
      default: () => ({})
    },
    
    // 验证类型
    validationType: {
      type: String,
      default: 'input',
      validator: value => ['input', 'business', 'data', 'form'].includes(value)
    },
    
    // 显示配置
    showIndicator: {
      type: Boolean,
      default: true
    },
    
    showRealtimeHelp: {
      type: Boolean,
      default: true
    },
    
    showErrorPrevention: {
      type: Boolean,
      default: true
    },
    
    showFieldDetails: {
      type: Boolean,
      default: false
    },
    
    showBatchResults: {
      type: Boolean,
      default: false
    },
    
    showSmartSuggestions: {
      type: Boolean,
      default: true
    },
    
    // 实时验证模式
    realtimeMode: {
      type: String,
      default: 'onChange',
      validator: value => ['onChange', 'onBlur', 'onSubmit'].includes(value)
    },
    
    // 防错级别
    preventionLevel: {
      type: String,
      default: 'moderate',
      validator: value => ['strict', 'moderate', 'relaxed'].includes(value)
    }
  },

  emits: [
    'validation-change',
    'validation-complete',
    'error-prevented',
    'suggestion-applied',
    'action-clicked'
  ],

  setup(props, { emit }) {
    const {
      validate,
      validateField,
      batchValidate,
      currentValidation,
      validationResults,
      isValid,
      isInvalid,
      hasWarnings,
      isChecking
    } = useValidation(props.validationType)

    const {
      preventError,
      checkPotentialErrors,
      errorPreventionMessage
    } = useErrorPrevention(props.preventionLevel)

    // 响应式数据
    const fieldValidations = ref({})
    const batchResults = ref(null)
    const smartSuggestions = ref([])

    // 计算属性
    const indicatorIcon = computed(() => {
      if (isChecking.value) return 'fas fa-spinner fa-spin'
      if (isValid.value) return 'fas fa-check-circle'
      if (isInvalid.value) return 'fas fa-times-circle'
      if (hasWarnings.value) return 'fas fa-exclamation-triangle'
      return 'fas fa-question-circle'
    })

    const indicatorText = computed(() => {
      if (isChecking.value) return '验证中...'
      if (isValid.value) return '验证通过'
      if (isInvalid.value) return '验证失败'
      if (hasWarnings.value) return '存在警告'
      return '待验证'
    })

    // 方法
    const performValidation = async (data, rules) => {
      try {
        const result = await validate(data, rules)
        
        // 更新字段验证状态
        if (result.fieldResults) {
          fieldValidations.value = result.fieldResults
        }
        
        // 检查潜在错误
        if (props.showErrorPrevention) {
          await checkPotentialErrors(data, rules)
        }
        
        // 生成智能建议
        if (props.showSmartSuggestions && !isValid.value) {
          generateSmartSuggestions(data, rules, result)
        }
        
        emit('validation-change', {
          isValid: isValid.value,
          results: result
        })
        
        return result
      } catch (error) {
        console.error('Validation error:', error)
        emit('validation-change', {
          isValid: false,
          error: error.message
        })
      }
    }

    const generateSmartSuggestions = (data, rules, validationResult) => {
      const suggestions = []
      
      // 基于验证结果生成建议
      if (validationResult.errors && validationResult.errors.length > 0) {
        validationResult.errors.forEach(error => {
          if (error.suggestion) {
            suggestions.push({
              id: `error-${error.field}`,
              type: 'error-fix',
              title: `修复${error.field}错误`,
              description: error.message,
              suggestion: error.suggestion,
              icon: 'fas fa-tools'
            })
          }
        })
      }
      
      // 基于业务规则生成建议
      if (props.validationType === 'business') {
        const businessSuggestions = BusinessRules.generateSuggestions(data, validationResult)
        suggestions.push(...businessSuggestions)
      }
      
      // 基于输入模式生成建议
      if (props.validationType === 'input') {
        const inputSuggestions = InputValidator.generateSuggestions(data, validationResult)
        suggestions.push(...inputSuggestions)
      }
      
      smartSuggestions.value = suggestions
    }

    const applySuggestion = (suggestion) => {
      emit('suggestion-applied', suggestion)
      
      // 重新验证
      if (suggestion.suggestion) {
        performValidation(props.data, props.rules)
      }
    }

    const handleActionClick = (action) => {
      emit('action-clicked', action)
      
      // 处理特殊动作
      if (action.type === 'fix') {
        // 自动修复
        const fixedData = action.fixFunction(props.data)
        performValidation(fixedData, props.rules)
      } else if (action.type === 'validate') {
        // 重新验证
        performValidation(props.data, props.rules)
      }
    }

    const handlePreventionAction = (action) => {
      emit('error-prevented', action)
      
      if (action.type === 'continue') {
        // 继续操作
        emit('validation-complete', { continue: true })
      } else if (action.type === 'cancel') {
        // 取消操作
        emit('validation-complete', { continue: false })
      }
    }

    // 批量验证
    const performBatchValidation = async (dataArray, rules) => {
      try {
        const results = await batchValidate(dataArray, rules)
        batchResults.value = results
        emit('validation-complete', { batch: true, results })
        return results
      } catch (error) {
        console.error('Batch validation error:', error)
      }
    }

    // 监听数据变化
    watch(() => props.data, (newData) => {
      if (newData !== null && props.realtimeMode === 'onChange') {
        performValidation(newData, props.rules)
      }
    }, { deep: true })

    watch(() => props.rules, (newRules) => {
      if (props.data !== null) {
        performValidation(props.data, newRules)
      }
    }, { deep: true })

    // 生命周期
    onMounted(() => {
      // 初始验证
      if (props.data !== null) {
        performValidation(props.data, props.rules)
      }
    })

    // 暴露方法
    const validate = () => performValidation(props.data, props.rules)
    const validateField = (field, value) => validateField(field, value, props.rules)
    const batchValidate = (dataArray) => performBatchValidation(dataArray, props.rules)

    return {
      // 状态
      currentValidation,
      validationResults,
      isValid,
      isInvalid,
      hasWarnings,
      isChecking,
      fieldValidations,
      batchResults,
      smartSuggestions,
      errorPreventionMessage,
      
      // 计算属性
      indicatorIcon,
      indicatorText,
      
      // 方法
      validate,
      validateField,
      batchValidate,
      applySuggestion,
      handleActionClick,
      handlePreventionAction,
      performValidation
    }
  }
})
</script>

<style scoped>
.validation-helper {
  position: relative;
  width: 100%;
}

/* 验证状态指示器 */
.validation-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.validation-indicator--valid {
  background: #e8f8f5;
  color: #27ae60;
  border: 1px solid #27ae60;
}

.validation-indicator--invalid {
  background: #fdf2f2;
  color: #e74c3c;
  border: 1px solid #e74c3c;
}

.validation-indicator--warning {
  background: #fff9e6;
  color: #f39c12;
  border: 1px solid #f39c12;
}

.validation-indicator--checking {
  background: #f8f9fa;
  color: #95a5a6;
  border: 1px solid #bdc3c7;
}

.indicator-text {
  font-weight: 500;
}

/* 实时验证提示 */
.realtime-help {
  margin-top: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid;
  animation: slideDown 0.2s ease-out;
}

.realtime-help--success {
  background: #e8f8f5;
  border-color: #27ae60;
  color: #27ae60;
}

.realtime-help--error {
  background: #fdf2f2;
  border-color: #e74c3c;
  color: #e74c3c;
}

.realtime-help--warning {
  background: #fff9e6;
  border-color: #f39c12;
  color: #f39c12;
}

.realtime-help--info {
  background: #e8f4fd;
  border-color: #3498db;
  color: #3498db;
}

.realtime-help__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
}

.realtime-help__title {
  font-size: 16px;
}

.realtime-help__content {
  margin-bottom: 16px;
}

.realtime-help__content p {
  margin: 0 0 12px 0;
  line-height: 1.5;
}

/* 验证规则 */
.validation-rules {
  margin: 12px 0;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
}

.rule-item--passed {
  color: #27ae60;
}

.rule-item:not(.rule-item--passed) {
  color: #e74c3c;
}

/* 示例输入 */
.validation-example {
  margin: 12px 0;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
}

.example-label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  opacity: 0.8;
}

.example-value {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

/* 建议操作 */
.validation-suggestions {
  margin: 12px 0;
}

.suggestions-label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  opacity: 0.8;
}

.suggestions-list {
  margin: 0;
  padding-left: 16px;
}

.suggestions-list li {
  margin-bottom: 6px;
  font-size: 14px;
}

.realtime-help__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.help-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.help-action--primary {
  background: #3498db;
  color: white;
}

.help-action--primary:hover {
  background: #2980b9;
}

.help-action--secondary {
  background: #ecf0f1;
  color: #7f8c8d;
}

.help-action--secondary:hover {
  background: #bdc3c7;
  color: #2c3e50;
}

/* 防错提示条 */
.error-prevention-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 12px 0;
  border: 1px solid;
}

.error-prevention-bar--error {
  background: #fdf2f2;
  border-color: #e74c3c;
}

.error-prevention-bar--warning {
  background: #fff9e6;
  border-color: #f39c12;
}

.error-prevention-bar--info {
  background: #e8f4fd;
  border-color: #3498db;
}

.prevention-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.prevention-message {
  flex: 1;
}

.prevention-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.prevention-description {
  font-size: 14px;
  opacity: 0.8;
}

.prevention-actions {
  display: flex;
  gap: 8px;
}

.prevention-action {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.prevention-action--primary {
  background: #3498db;
  color: white;
}

.prevention-action--secondary {
  background: #ecf0f1;
  color: #7f8c8d;
}

/* 字段验证状态 */
.field-validation {
  margin: 12px 0;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ecf0f1;
}

.field-validation--valid {
  border-color: #27ae60;
  background: #e8f8f5;
}

.field-validation--invalid {
  border-color: #e74c3c;
  background: #fdf2f2;
}

.field-validation--warning {
  border-color: #f39c12;
  background: #fff9e6;
}

.field-validation__label {
  font-weight: 600;
  margin-bottom: 8px;
}

.field-validation__status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.field-validation__details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 14px;
}

.detail-item--passed {
  color: #27ae60;
}

.detail-item:not(.detail-item--passed) {
  color: #e74c3c;
}

/* 批量验证结果 */
.batch-validation-results {
  margin: 16px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.batch-results__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.batch-results__header h4 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.batch-summary {
  display: flex;
  gap: 16px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.summary-item--success { color: #27ae60; }
.summary-item--warning { color: #f39c12; }
.summary-item--error { color: #e74c3c; }

.batch-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 14px;
}

.batch-result-item--valid {
  background: #e8f8f5;
  color: #27ae60;
}

.batch-result-item--invalid {
  background: #fdf2f2;
  color: #e74c3c;
}

.batch-result-item--warning {
  background: #fff9e6;
  color: #f39c12;
}

.result-field {
  font-weight: 600;
}

.result-message {
  opacity: 0.8;
}

/* 智能建议卡片 */
.smart-suggestions {
  margin: 16px 0;
}

.suggestions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #3498db;
}

.suggestions-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-card {
  padding: 16px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3498db;
}

.suggestion-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.suggestion-card__header i {
  color: #3498db;
  font-size: 18px;
}

.suggestion-card__title {
  font-weight: 600;
  color: #2c3e50;
}

.suggestion-card__description {
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.4;
  margin-bottom: 8px;
}

.suggestion-card__preview {
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #3498db;
}

.suggestion-card__preview code {
  font-size: 12px;
  color: #2c3e50;
}

/* 动画效果 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-prevention-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .prevention-actions {
    width: 100%;
    justify-content: stretch;
  }

  .prevention-action {
    flex: 1;
  }

  .batch-results__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .realtime-help__actions {
    flex-direction: column;
    width: 100%;
  }

  .help-action {
    width: 100%;
    justify-content: center;
  }
}
</style>