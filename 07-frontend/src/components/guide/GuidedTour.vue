<template>
  <div class="guided-tour-container">
    <!-- 引导遮罩层 -->
    <div 
      v-if="tourState.isActive && tourState.currentStep" 
      class="tour-overlay"
      @click="handleOverlayClick"
    >
      <!-- 高亮区域 -->
      <div
        v-if="tourState.currentStep.target"
        class="tour-highlight"
        :style="highlightStyle"
      ></div>

      <!-- 引导提示框 -->
      <div
        v-if="tourState.currentStep"
        class="tour-tooltip"
        :class="[`tour-tooltip--${tourState.currentStep.position || 'bottom'}`]"
        :style="tooltipStyle"
      >
        <!-- 提示框头部 -->
        <div class="tour-tooltip__header">
          <div class="tour-tooltip__title">
            <i :class="tourState.currentStep.icon || 'fas fa-question-circle'"></i>
            {{ tourState.currentStep.title }}
          </div>
          <button 
            class="tour-tooltip__close"
            @click="endTour"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 提示框内容 -->
        <div class="tour-tooltip__content">
          <div class="tour-tooltip__description">
            {{ tourState.currentStep.content }}
          </div>
          
          <!-- 图片或媒体内容 -->
          <img 
            v-if="tourState.currentStep.image"
            :src="tourState.currentStep.image"
            :alt="tourState.currentStep.title"
            class="tour-tooltip__image"
          />
          
          <!-- 视频内容 -->
          <video 
            v-if="tourState.currentStep.video"
            :src="tourState.currentStep.video"
            controls
            class="tour-tooltip__video"
          ></video>

          <!-- 自定义内容插槽 -->
          <slot 
            v-if="tourState.currentStep.slot"
            :name="tourState.currentStep.slot"
            :step="tourState.currentStep"
          ></slot>
        </div>

        <!-- 操作按钮 -->
        <div class="tour-tooltip__actions">
          <button 
            v-if="showPreviousButton"
            class="tour-button tour-button--secondary"
            @click="previousStep"
          >
            <i class="fas fa-arrow-left"></i>
            上一步
          </button>

          <div class="tour-tooltip__progress">
            {{ tourState.currentIndex + 1 }} / {{ tourState.totalSteps }}
          </div>

          <button 
            v-if="isLastStep"
            class="tour-button tour-button--primary"
            @click="completeTour"
          >
            <i class="fas fa-check"></i>
            完成
          </button>
          <button 
            v-else
            class="tour-button tour-button--primary"
            @click="nextStep"
          >
            下一步
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>

        <!-- 附加操作 -->
        <div class="tour-tooltip__extras">
          <button 
            class="tour-tooltip__skip"
            @click="skipTour"
          >
            跳过引导
          </button>
          <button 
            class="tour-tooltip__help"
            @click="showHelp"
          >
            <i class="fas fa-question-circle"></i>
            需要帮助
          </button>
        </div>
      </div>
    </div>

    <!-- 浮动帮助按钮 -->
    <div 
      v-if="!tourState.isActive && showHelpButton"
      class="tour-help-button"
      @click="startTour"
    >
      <i class="fas fa-question-circle"></i>
    </div>

    <!-- 进度指示器 -->
    <StepIndicator
      v-if="tourState.isActive && showStepIndicator"
      :current-step="tourState.currentIndex + 1"
      :total-steps="tourState.totalSteps"
      :steps="tourState.steps"
      @step-click="goToStep"
    />
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useTour } from './hooks/useTour'
import StepIndicator from './StepIndicator.vue'

export default defineComponent({
  name: 'GuidedTour',
  
  components: {
    StepIndicator
  },

  props: {
    // 引导配置
    tourConfig: {
      type: Object,
      default: () => ({})
    },
    
    // 是否显示帮助按钮
    showHelpButton: {
      type: Boolean,
      default: true
    },
    
    // 是否显示步骤指示器
    showStepIndicator: {
      type: Boolean,
      default: true
    },
    
    // 是否允许点击遮罩层关闭
    allowOverlayClose: {
      type: Boolean,
      default: false
    }
  },

  emits: [
    'tour-start',
    'tour-end',
    'step-change',
    'tour-complete',
    'tour-skip'
  ],

  setup(props, { emit }) {
    const {
      tourState,
      startTour,
      endTour,
      nextStep,
      previousStep,
      goToStep,
      skipTour,
      completeTour
    } = useTour(props.tourConfig)

    // 计算属性
    const isLastStep = computed(() => 
      tourState.value.currentIndex === tourState.value.totalSteps - 1
    )

    const showPreviousButton = computed(() => 
      tourState.value.currentIndex > 0
    )

    // 高亮区域样式
    const highlightStyle = computed(() => {
      if (!tourState.value.currentStep?.target) return {}
      
      const element = document.querySelector(tourState.value.currentStep.target)
      if (!element) return {}

      const rect = element.getBoundingClientRect()
      return {
        position: 'fixed',
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        zIndex: 9999,
        pointerEvents: 'none'
      }
    })

    // 提示框样式
    const tooltipStyle = computed(() => {
      if (!tourState.value.currentStep?.target) {
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '500px'
        }
      }

      const target = document.querySelector(tourState.value.currentStep.target)
      if (!target) return {}

      const rect = target.getBoundingClientRect()
      const position = tourState.value.currentStep.position || 'bottom'

      const styles = {
        position: 'fixed',
        zIndex: 10000,
        maxWidth: '400px'
      }

      // 根据位置计算样式
      switch (position) {
        case 'top':
          styles.top = `${rect.top - 20}px`
          styles.left = `${rect.left + rect.width / 2}px`
          styles.transform = 'translateX(-50%) translateY(-100%)'
          break
        case 'bottom':
          styles.top = `${rect.bottom + 20}px`
          styles.left = `${rect.left + rect.width / 2}px`
          styles.transform = 'translateX(-50%)'
          break
        case 'left':
          styles.top = `${rect.top + rect.height / 2}px`
          styles.left = `${rect.left - 20}px`
          styles.transform = 'translateY(-50%) translateX(-100%)'
          break
        case 'right':
          styles.top = `${rect.top + rect.height / 2}px`
          styles.left = `${rect.right + 20}px`
          styles.transform = 'translateY(-50%)'
          break
        default:
          styles.top = '50%'
          styles.left = '50%'
          styles.transform = 'translate(-50%, -50%)'
      }

      return styles
    })

    // 事件处理
    const handleOverlayClick = () => {
      if (props.allowOverlayClose) {
        endTour()
      }
    }

    const showHelp = () => {
      // 显示帮助信息
      emit('show-help')
    }

    // 监听状态变化
    watch(tourState, (newState) => {
      if (newState.isActive) {
        emit('tour-start')
      }
      
      if (newState.currentStep) {
        emit('step-change', {
          step: newState.currentStep,
          index: newState.currentIndex
        })
      }
    }, { deep: true })

    // 生命周期
    onMounted(() => {
      // 可以在这里添加键盘事件监听
      const handleKeydown = (event) => {
        if (!tourState.value.isActive) return

        switch (event.key) {
          case 'Escape':
            endTour()
            break
          case 'ArrowLeft':
            if (showPreviousButton.value) previousStep()
            break
          case 'ArrowRight':
            if (!isLastStep.value) nextStep()
            break
        }
      }

      document.addEventListener('keydown', handleKeydown)

      onBeforeUnmount(() => {
        document.removeEventListener('keydown', handleKeydown)
      })
    })

    return {
      tourState,
      isLastStep,
      showPreviousButton,
      highlightStyle,
      tooltipStyle,
      startTour,
      endTour,
      nextStep,
      previousStep,
      goToStep,
      skipTour,
      completeTour,
      handleOverlayClick,
      showHelp
    }
  }
})
</script>

<style scoped>
.guided-tour-container {
  position: relative;
  z-index: 9998;
}

.tour-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  animation: fadeIn 0.3s ease-in-out;
}

.tour-highlight {
  background-color: rgba(52, 152, 219, 0.3);
  border: 3px solid #3498db;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  animation: pulse 2s infinite;
}

.tour-tooltip {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 0;
  max-width: 500px;
  width: 90%;
  animation: slideUp 0.3s ease-out;
}

.tour-tooltip--top {
  margin-bottom: 20px;
}

.tour-tooltip--bottom {
  margin-top: 20px;
}

.tour-tooltip--left {
  margin-right: 20px;
}

.tour-tooltip--right {
  margin-left: 20px;
}

.tour-tooltip__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #ecf0f1;
}

.tour-tooltip__title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.tour-tooltip__title i {
  margin-right: 10px;
  color: #3498db;
  font-size: 20px;
}

.tour-tooltip__close {
  background: none;
  border: none;
  color: #95a5a6;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.tour-tooltip__close:hover {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.tour-tooltip__content {
  padding: 20px;
}

.tour-tooltip__description {
  color: #34495e;
  line-height: 1.6;
  margin-bottom: 15px;
}

.tour-tooltip__image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 15px 0;
}

.tour-tooltip__video {
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 15px 0;
}

.tour-tooltip__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-top: 1px solid #ecf0f1;
  background-color: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.tour-tooltip__progress {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}

.tour-tooltip__extras {
  display: flex;
  justify-content: space-between;
  padding: 0 20px 20px 20px;
  gap: 10px;
}

.tour-tooltip__skip,
.tour-tooltip__help {
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s ease;
}

.tour-tooltip__skip:hover,
.tour-tooltip__help:hover {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.tour-tooltip__help i {
  margin-right: 5px;
}

.tour-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tour-button i {
  font-size: 12px;
}

.tour-button--primary {
  background-color: #3498db;
  color: white;
}

.tour-button--primary:hover {
  background-color: #2980b9;
}

.tour-button--secondary {
  background-color: #ecf0f1;
  color: #34495e;
}

.tour-button--secondary:hover {
  background-color: #bdc3c7;
}

.tour-help-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  background-color: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(52, 152, 219, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
}

.tour-help-button:hover {
  background-color: #2980b9;
  transform: scale(1.1);
}

.tour-help-button i {
  font-size: 24px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 6px rgba(52, 152, 219, 0.3); }
  50% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 12px rgba(52, 152, 219, 0.1); }
  100% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 6px rgba(52, 152, 219, 0.3); }
}
</style>