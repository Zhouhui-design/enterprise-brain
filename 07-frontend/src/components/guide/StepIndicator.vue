<template>
  <div class="step-indicator" :class="{ 'step-indicator--vertical': vertical }">
    <!-- 步骤列表 -->
    <div class="step-list" :class="{ 'step-list--vertical': vertical }">
      <div
        v-for="(step, index) in steps"
        :key="step.id || index"
        class="step-item"
        :class="{
          'step-item--active': index + 1 === currentStep,
          'step-item--completed': index + 1 < currentStep,
          'step-item--clickable': clickable
        }"
        @click="handleStepClick(index + 1, step)"
      >
        <!-- 步骤图标 -->
        <div class="step-icon">
          <i 
            v-if="index + 1 < currentStep" 
            class="fas fa-check step-icon__completed"
          ></i>
          <i 
            v-else-if="index + 1 === currentStep" 
            :class="step.icon || 'fas fa-circle'"
            class="step-icon__active"
          ></i>
          <i 
            v-else 
            class="fas fa-circle step-icon__pending"
          ></i>
        </div>

        <!-- 步骤内容 -->
        <div class="step-content" v-if="showLabels">
          <div class="step-title">{{ step.title || `步骤 ${index + 1}` }}</div>
          <div class="step-description" v-if="step.description">
            {{ step.description }}
          </div>
        </div>

        <!-- 连接线 -->
        <div 
          v-if="index < steps.length - 1"
          class="step-connector"
          :class="{
            'step-connector--vertical': vertical,
            'step-connector--completed': index + 1 < currentStep
          }"
        ></div>
      </div>
    </div>

    <!-- 进度信息 -->
    <div class="progress-info" v-if="showProgress">
      <div class="progress-text">
        <span class="progress-current">{{ currentStep }}</span>
        <span class="progress-separator">/</span>
        <span class="progress-total">{{ totalSteps }}</span>
      </div>
      <div class="progress-percentage">
        {{ Math.round((currentStep / totalSteps) * 100) }}%
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-bar" v-if="showProgressBar">
      <div 
        class="progress-bar__fill"
        :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
      ></div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'StepIndicator',
  
  props: {
    // 当前步骤
    currentStep: {
      type: Number,
      required: true,
      validator: value => value > 0
    },
    
    // 总步骤数
    totalSteps: {
      type: Number,
      required: true,
      validator: value => value > 0
    },
    
    // 步骤详细信息
    steps: {
      type: Array,
      default: () => []
    },
    
    // 是否为垂直布局
    vertical: {
      type: Boolean,
      default: false
    },
    
    // 是否显示标签
    showLabels: {
      type: Boolean,
      default: true
    },
    
    // 是否显示进度信息
    showProgress: {
      type: Boolean,
      default: true
    },
    
    // 是否显示进度条
    showProgressBar: {
      type: Boolean,
      default: false
    },
    
    // 是否可点击跳转
    clickable: {
      type: Boolean,
      default: true
    }
  },

  emits: ['step-click'],

  setup(props, { emit }) {
    // 计算属性
    const hasSteps = computed(() => props.steps && props.steps.length > 0)
    
    const effectiveSteps = computed(() => {
      if (hasSteps.value) {
        return props.steps
      }
      
      // 如果没有提供步骤信息，生成默认步骤
      return Array.from({ length: props.totalSteps }, (_, index) => ({
        id: `step-${index + 1}`,
        title: `步骤 ${index + 1}`,
        description: ''
      }))
    })

    // 处理步骤点击
    const handleStepClick = (stepNumber, stepInfo) => {
      if (!props.clickable || stepNumber === props.currentStep) {
        return
      }
      
      emit('step-click', {
        step: stepNumber,
        stepInfo: stepInfo
      })
    }

    return {
      hasSteps,
      effectiveSteps,
      handleStepClick
    }
  }
})
</script>

<style scoped>
.step-indicator {
  width: 100%;
  position: relative;
}

.step-indicator--vertical {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.step-list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  margin-bottom: 16px;
}

.step-list--vertical {
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 0;
}

.step-item {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
}

.step-item--clickable {
  cursor: pointer;
}

.step-item--clickable:hover .step-icon {
  transform: scale(1.1);
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  background-color: #ecf0f1;
  color: #95a5a6;
  border: 2px solid #bdc3c7;
  transition: all 0.3s ease;
  position: relative;
}

.step-item--active .step-icon {
  background-color: #3498db;
  border-color: #2980b9;
  color: white;
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2);
}

.step-item--completed .step-icon {
  background-color: #27ae60;
  border-color: #229954;
  color: white;
}

.step-icon__active {
  animation: pulse 2s infinite;
}

.step-icon__completed {
  font-size: 16px;
}

.step-icon__pending {
  opacity: 0.6;
}

.step-content {
  margin-left: 12px;
  max-width: 200px;
}

.step-list--vertical .step-content {
  margin-left: 16px;
  margin-bottom: 24px;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-item--active .step-title {
  color: #3498db;
}

.step-item--completed .step-title {
  color: #27ae60;
}

.step-description {
  font-size: 12px;
  color: #7f8c8d;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.step-connector {
  position: absolute;
  background-color: #bdc3c7;
  z-index: 1;
}

.step-item:not(:last-child) .step-connector {
  left: 32px;
  width: calc(100% - 32px);
  height: 2px;
  top: 50%;
  transform: translateY(-50%);
}

.step-list--vertical .step-connector {
  left: 16px;
  width: 2px;
  height: 40px;
  top: 32px;
  transform: none;
}

.step-connector--completed {
  background-color: #27ae60;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-text {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.progress-current {
  color: #3498db;
  font-size: 18px;
}

.progress-separator {
  margin: 0 4px;
  color: #95a5a6;
}

.progress-total {
  color: #7f8c8d;
}

.progress-percentage {
  font-size: 14px;
  font-weight: 500;
  color: #7f8c8d;
  background-color: #ecf0f1;
  padding: 4px 8px;
  border-radius: 12px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #ecf0f1;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 垂直布局样式调整 */
.step-indicator--vertical .progress-info {
  margin-top: 16px;
  margin-bottom: 8px;
}

.step-indicator--vertical .progress-bar {
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .step-content {
    max-width: 120px;
  }
  
  .step-description {
    display: none;
  }
  
  .step-title {
    font-size: 12px;
  }
  
  .step-icon {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .step-item:not(:last-child) .step-connector {
    left: 28px;
    width: calc(100% - 28px);
  }
  
  .step-list--vertical .step-connector {
    left: 14px;
  }
}

@media (max-width: 480px) {
  .step-content {
    margin-left: 8px;
    max-width: 100px;
  }
  
  .progress-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* 动画效果 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(52, 152, 219, 0.1);
  }
  100% {
    box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2);
  }
}

/* 无障碍访问 */
.step-item:focus {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

.step-icon:focus {
  outline: none;
}
</style>