<template>
  <div class="operation-guide">
    <!-- 指南头部 -->
    <div class="guide-header">
      <div class="guide-header__content">
        <h2 class="guide-header__title">
          <i :class="guideConfig.icon || 'fas fa-book'"></i>
          {{ guideConfig.title || '操作指南' }}
        </h2>
        <p class="guide-header__description">
          {{ guideConfig.description || '详细的操作流程和最佳实践指导' }}
        </p>
      </div>
      <div class="guide-header__actions">
        <button
          class="guide-button guide-button--expand"
          @click="toggleExpand"
          :class="{ 'guide-button--collapsed': !isExpanded }"
        >
          <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </button>
        <button
          v-if="allowClose"
          class="guide-button guide-button--close"
          @click="closeGuide"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- 指南内容 -->
    <div v-show="isExpanded" class="guide-content">
      <!-- 搜索框 -->
      <div v-if="allowSearch" class="guide-search">
        <div class="search-input">
          <i class="fas fa-search search-icon"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索操作指南..."
            class="search-input__field"
          />
        </div>
      </div>

      <!-- 分类筛选 -->
      <div v-if="categories && categories.length > 0" class="guide-categories">
        <div class="category-tabs">
          <button
            v-for="category in categories"
            :key="category.id"
            class="category-tab"
            :class="{ 'category-tab--active': activeCategory === category.id }"
            @click="selectCategory(category.id)"
          >
            <i :class="category.icon"></i>
            {{ category.name }}
            <span v-if="category.count" class="category-count">({{ category.count }})</span>
          </button>
        </div>
      </div>

      <!-- 操作指南列表 -->
      <div class="guide-list">
        <div
          v-for="guide in filteredGuides"
          :key="guide.id"
          class="guide-item"
          :class="{
            'guide-item--active': activeGuide?.id === guide.id,
            'guide-item--completed': isGuideCompleted(guide.id),
            'guide-item--recommended': guide.recommended
          }"
        >
          <div class="guide-item__header" @click="selectGuide(guide)">
            <div class="guide-item__icon">
              <i :class="guide.icon"></i>
            </div>
            <div class="guide-item__content">
              <div class="guide-item__title">
                {{ guide.title }}
                <span v-if="guide.recommended" class="guide-badge guide-badge--recommended">
                  推荐
                </span>
                <span v-if="guide.difficulty" class="guide-badge guide-badge--difficulty">
                  {{ guide.difficulty }}
                </span>
              </div>
              <div class="guide-item__description">
                {{ guide.description }}
              </div>
              <div class="guide-item__meta">
                <span class="meta-item">
                  <i class="fas fa-clock"></i>
                  {{ guide.duration || '5分钟' }}
                </span>
                <span class="meta-item">
                  <i class="fas fa-layer-group"></i>
                  {{ guide.steps?.length || 0 }} 步骤
                </span>
                <span v-if="guide.category" class="meta-item">
                  <i class="fas fa-tag"></i>
                  {{ getCategoryName(guide.category) }}
                </span>
              </div>
            </div>
            <div class="guide-item__actions">
              <button
                class="action-button action-button--primary"
                @click.stop="startGuide(guide)"
              >
                <i class="fas fa-play"></i>
                开始
              </button>
              <button
                class="action-button action-button--secondary"
                @click.stop="viewGuide(guide)"
              >
                <i class="fas fa-eye"></i>
                查看
              </button>
            </div>
          </div>

          <!-- 指南步骤预览 -->
          <div v-if="activeGuide?.id === guide.id" class="guide-steps">
            <div class="steps-preview">
              <div
                v-for="(step, index) in guide.steps"
                :key="index"
                class="step-preview"
              >
                <div class="step-preview__number">{{ index + 1 }}</div>
                <div class="step-preview__content">
                  <div class="step-preview__title">{{ step.title }}</div>
                  <div class="step-preview__description">{{ step.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredGuides.length === 0" class="guide-empty">
        <i class="fas fa-inbox guide-empty__icon"></i>
        <div class="guide-empty__title">暂无操作指南</div>
        <div class="guide-empty__description">
          {{ searchQuery ? '没有找到匹配的操作指南' : '该分类下暂无操作指南' }}
        </div>
      </div>
    </div>

    <!-- 快速帮助 -->
    <div v-if="showQuickHelp" class="quick-help">
      <div class="quick-help__header">
        <h3>快速帮助</h3>
        <button class="quick-help__close" @click="showQuickHelp = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="quick-help__content">
        <div
          v-for="help in quickHelpItems"
          :key="help.id"
          class="help-item"
          @click="openQuickHelp(help)"
        >
          <i :class="help.icon"></i>
          <span>{{ help.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { useTour } from './hooks/useTour'

export default defineComponent({
  name: 'OperationGuide',
  
  props: {
    // 指南配置
    guideConfig: {
      type: Object,
      default: () => ({})
    },
    
    // 操作指南数据
    guides: {
      type: Array,
      default: () => []
    },
    
    // 分类数据
    categories: {
      type: Array,
      default: () => []
    },
    
    // 是否允许关闭
    allowClose: {
      type: Boolean,
      default: true
    },
    
    // 是否允许搜索
    allowSearch: {
      type: Boolean,
      default: true
    },
    
    // 默认展开状态
    defaultExpanded: {
      type: Boolean,
      default: true
    },
    
    // 已完成的指南ID列表
    completedGuides: {
      type: Array,
      default: () => []
    }
  },

  emits: [
    'guide-select',
    'guide-start',
    'guide-view',
    'guide-close',
    'category-change',
    'quick-help-open'
  ],

  setup(props, { emit }) {
    const { startTour } = useTour()

    // 响应式数据
    const isExpanded = ref(props.defaultExpanded)
    const searchQuery = ref('')
    const activeCategory = ref('all')
    const activeGuide = ref(null)
    const showQuickHelp = ref(false)

    // 计算属性
    const filteredGuides = computed(() => {
      let filtered = props.guides || []

      // 分类筛选
      if (activeCategory.value !== 'all') {
        filtered = filtered.filter(guide => guide.category === activeCategory.value)
      }

      // 搜索筛选
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(guide => 
          guide.title.toLowerCase().includes(query) ||
          guide.description.toLowerCase().includes(query) ||
          guide.tags?.some(tag => tag.toLowerCase().includes(query))
        )
      }

      return filtered
    })

    const quickHelpItems = computed(() => [
      { id: 'shortcuts', title: '快捷键指南', icon: 'fas fa-keyboard' },
      { id: 'troubleshooting', title: '故障排除', icon: 'fas fa-tools' },
      { id: 'faq', title: '常见问题', icon: 'fas fa-question-circle' },
      { id: 'contact', title: '联系支持', icon: 'fas fa-headset' }
    ])

    // 方法
    const toggleExpand = () => {
      isExpanded.value = !isExpanded.value
    }

    const closeGuide = () => {
      emit('guide-close')
    }

    const selectCategory = (categoryId) => {
      activeCategory.value = categoryId
      emit('category-change', categoryId)
    }

    const selectGuide = (guide) => {
      activeGuide.value = activeGuide.value?.id === guide.id ? null : guide
      emit('guide-select', guide)
    }

    const startGuide = (guide) => {
      // 转换为引导游览格式
      const tourConfig = {
        name: guide.id,
        steps: guide.steps || [],
        options: {
          showProgress: true,
          allowSkip: true,
          showHelpButton: false
        }
      }
      
      startTour(tourConfig)
      emit('guide-start', guide)
    }

    const viewGuide = (guide) => {
      emit('guide-view', guide)
    }

    const isGuideCompleted = (guideId) => {
      return props.completedGuides.includes(guideId)
    }

    const getCategoryName = (categoryId) => {
      const category = props.categories.find(cat => cat.id === categoryId)
      return category?.name || categoryId
    }

    const openQuickHelp = (help) => {
      emit('quick-help-open', help)
    }

    // 监听搜索查询变化
    watch(searchQuery, (newQuery) => {
      if (newQuery.trim()) {
        activeCategory.value = 'all'
      }
    })

    onMounted(() => {
      // 如果有推荐指南，默认展开第一个
      if (props.guides.some(guide => guide.recommended)) {
        const recommendedGuide = props.guides.find(guide => guide.recommended)
        if (recommendedGuide) {
          activeGuide.value = recommendedGuide
        }
      }
    })

    return {
      isExpanded,
      searchQuery,
      activeCategory,
      activeGuide,
      showQuickHelp,
      filteredGuides,
      quickHelpItems,
      toggleExpand,
      closeGuide,
      selectCategory,
      selectGuide,
      startGuide,
      viewGuide,
      isGuideCompleted,
      getCategoryName,
      openQuickHelp
    }
  }
})
</script>

<style scoped>
.operation-guide {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #ecf0f1;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa, #ecf0f1);
  border-bottom: 1px solid #e9ecef;
}

.guide-header__content {
  flex: 1;
}

.guide-header__title {
  display: flex;
  align-items: center;
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.guide-header__title i {
  margin-right: 12px;
  color: #3498db;
  font-size: 20px;
}

.guide-header__description {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.5;
}

.guide-header__actions {
  display: flex;
  gap: 8px;
}

.guide-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: white;
  color: #7f8c8d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.guide-button:hover {
  background: #3498db;
  color: white;
  transform: translateY(-1px);
}

.guide-button--collapsed {
  transform: rotate(180deg);
}

.guide-content {
  padding: 20px;
}

.guide-search {
  margin-bottom: 20px;
}

.search-input {
  position: relative;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #95a5a6;
}

.search-input__field {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.search-input__field:focus {
  outline: none;
  border-color: #3498db;
}

.guide-categories {
  margin-bottom: 20px;
}

.category-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  color: #7f8c8d;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 14px;
}

.category-tab:hover {
  border-color: #3498db;
  color: #3498db;
}

.category-tab--active {
  background: #3498db;
  border-color: #3498db;
  color: white;
}

.category-count {
  font-size: 12px;
  opacity: 0.8;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-item {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.guide-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.guide-item--active {
  border-color: #3498db;
  box-shadow: 0 4px 16px rgba(52, 152, 219, 0.2);
}

.guide-item--completed {
  background: #f8fdf8;
  border-color: #27ae60;
}

.guide-item--recommended {
  border-color: #e67e22;
}

.guide-item__header {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
}

.guide-item__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #3498db;
  font-size: 20px;
  flex-shrink: 0;
}

.guide-item--recommended .guide-item__icon {
  background: #fff5e6;
  color: #e67e22;
}

.guide-item--completed .guide-item__icon {
  background: #e8f8f5;
  color: #27ae60;
}

.guide-item__content {
  flex: 1;
  min-width: 0;
}

.guide-item__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 6px;
}

.guide-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.guide-badge--recommended {
  background: #fff5e6;
  color: #e67e22;
}

.guide-badge--difficulty {
  background: #f0f0f0;
  color: #666;
}

.guide-item__description {
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.guide-item__meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #95a5a6;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.guide-item__actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.action-button {
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

.action-button i {
  font-size: 12px;
}

.action-button--primary {
  background: #3498db;
  color: white;
}

.action-button--primary:hover {
  background: #2980b9;
}

.action-button--secondary {
  background: #ecf0f1;
  color: #7f8c8d;
}

.action-button--secondary:hover {
  background: #bdc3c7;
  color: #2c3e50;
}

.guide-steps {
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.steps-preview {
  padding: 16px;
}

.step-preview {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.step-preview:last-child {
  margin-bottom: 0;
}

.step-preview__number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-preview__content {
  flex: 1;
}

.step-preview__title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.step-preview__description {
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.4;
}

.guide-empty {
  text-align: center;
  padding: 60px 20px;
  color: #95a5a6;
}

.guide-empty__icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.guide-empty__title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.guide-empty__description {
  font-size: 14px;
  color: #bdc3c7;
}

.quick-help {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.quick-help__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
}

.quick-help__header h3 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.quick-help__close {
  background: none;
  border: none;
  color: #95a5a6;
  cursor: pointer;
  padding: 4px;
}

.quick-help__content {
  padding: 8px;
}

.help-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.help-item:hover {
  background: #f8f9fa;
}

.help-item i {
  color: #3498db;
  width: 20px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .guide-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .guide-item__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .guide-item__actions {
    margin-left: 0;
    width: 100%;
    justify-content: stretch;
  }

  .action-button {
    flex: 1;
    justify-content: center;
  }

  .quick-help {
    width: calc(100% - 40px);
    right: 20px;
  }
}
</style>