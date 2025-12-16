<template>
  <div class="product-search-filter">
    <el-card shadow="hover" class="filter-card">
      <template #header>
        <div class="filter-header">
          <span class="title">搜索筛选</span>
          <el-button 
            type="text" 
            @click="resetFilters"
            :icon="Refresh"
          >
            重置
          </el-button>
        </div>
      </template>

      <!-- 搜索框 -->
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索产品名称、编码或描述"
          clearable
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleClear"
          class="search-input"
        />
      </div>

      <!-- 分类筛选 -->
      <div class="filter-section">
        <h4 class="section-title">产品分类</h4>
        <el-select
          v-model="selectedCategory"
          placeholder="请选择分类"
          clearable
          filterable
          @change="handleCategoryChange"
          class="filter-select"
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          >
            <span>{{ category.name }}</span>
            <span class="category-count">({{ category.productCount || 0 }})</span>
          </el-option>
        </el-select>
      </div>

      <!-- 价格区间 -->
      <div class="filter-section">
        <h4 class="section-title">价格区间</h4>
        <div class="price-range">
          <el-input-number
            v-model="priceRange.min"
            placeholder="最低价"
            :min="0"
            :precision="2"
            controls-position="right"
            @change="handlePriceChange"
          />
          <span class="separator">-</span>
          <el-input-number
            v-model="priceRange.max"
            placeholder="最高价"
            :min="0"
            :precision="2"
            controls-position="right"
            @change="handlePriceChange"
          />
        </div>
        
        <!-- 快速价格选择 -->
        <div class="quick-prices">
          <el-tag
            v-for="range in quickPriceRanges"
            :key="range.label"
            :type="isQuickPriceSelected(range) ? 'primary' : 'info'"
            size="small"
            class="price-tag"
            @click="selectQuickPrice(range)"
          >
            {{ range.label }}
          </el-tag>
        </div>
      </div>

      <!-- 库存筛选 -->
      <div class="filter-section">
        <h4 class="section-title">库存状态</h4>
        <el-radio-group 
          v-model="stockFilter"
          @change="handleStockFilterChange"
        >
          <el-radio label="all">全部</el-radio>
          <el-radio label="inStock">有库存</el-radio>
          <el-radio label="lowStock">库存紧张</el-radio>
          <el-radio label="outOfStock">缺货</el-radio>
        </el-radio-group>
      </div>

      <!-- 产品标签 -->
      <div class="filter-section">
        <h4 class="section-title">产品标签</h4>
        <div class="tag-filters">
          <el-checkbox
            v-model="tagFilters.hot"
            @change="handleTagFilterChange"
            class="tag-checkbox"
          >
            热销产品
          </el-checkbox>
          <el-checkbox
            v-model="tagFilters.new"
            @change="handleTagFilterChange"
            class="tag-checkbox"
          >
            新品推荐
          </el-checkbox>
          <el-checkbox
            v-model="tagFilters.discount"
            @change="handleTagFilterChange"
            class="tag-checkbox"
          >
            优惠活动
          </el-checkbox>
        </div>
      </div>

      <!-- 高级筛选 -->
      <div class="filter-section">
        <el-collapse v-model="advancedVisible">
          <el-collapse-item title="高级筛选" name="advanced">
            <!-- 品牌筛选 -->
            <div class="advanced-item">
              <h5>品牌</h5>
              <el-select
                v-model="brandFilter"
                placeholder="请选择品牌"
                clearable
                filterable
                @change="handleBrandChange"
              >
                <el-option
                  v-for="brand in brands"
                  :key="brand.id"
                  :label="brand.name"
                  :value="brand.id"
                />
              </el-select>
            </div>

            <!-- 规格筛选 -->
            <div class="advanced-item">
              <h5>规格</h5>
              <el-select
                v-model="specFilter"
                placeholder="请选择规格"
                clearable
                @change="handleSpecChange"
              >
                <el-option
                  v-for="spec in specs"
                  :key="spec.value"
                  :label="spec.label"
                  :value="spec.value"
                />
              </el-select>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 操作按钮 -->
      <div class="filter-actions">
        <el-button 
          type="primary" 
          @click="applyFilters"
          :icon="Search"
          block
        >
          应用筛选
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'ProductSearchFilter',
  components: {
    Search,
    Refresh
  },
  props: {
    // 分类列表
    categories: {
      type: Array,
      default: () => []
    },
    // 品牌列表
    brands: {
      type: Array,
      default: () => []
    },
    // 规格列表
    specs: {
      type: Array,
      default: () => []
    }
  },
  emits: [
    'filter-change',
    'search',
    'reset'
  ],
  setup(props, { emit }) {
    // ================ 响应式数据 ================
    
    const searchKeyword = ref('')
    const selectedCategory = ref(null)
    const stockFilter = ref('all')
    const brandFilter = ref(null)
    const specFilter = ref(null)
    const advancedVisible = ref([])

    const priceRange = reactive({
      min: null,
      max: null
    })

    const tagFilters = reactive({
      hot: false,
      new: false,
      discount: false
    })

    // 快速价格区间
    const quickPriceRanges = [
      { label: '0-1000', min: 0, max: 1000 },
      { label: '1000-5000', min: 1000, max: 5000 },
      { label: '5000-10000', min: 5000, max: 10000 },
      { label: '10000-50000', min: 10000, max: 50000 },
      { label: '50000+', min: 50000, max: null }
    ]

    // ================ 计算属性 ================
    
    const hasActiveFilters = computed(() => {
      return searchKeyword.value ||
             selectedCategory.value ||
             priceRange.min !== null ||
             priceRange.max !== null ||
             stockFilter.value !== 'all' ||
             brandFilter.value ||
             specFilter.value ||
             tagFilters.hot ||
             tagFilters.new ||
             tagFilters.discount
    })

    // ================ 方法定义 ================

    const handleSearch = () => {
      emit('search', {
        keyword: searchKeyword.value?.trim(),
        filters: getFilters()
      })
    }

    const handleClear = () => {
      searchKeyword.value = ''
      handleSearch()
    }

    const handleCategoryChange = () => {
      applyFilters()
    }

    const handlePriceChange = () => {
      applyFilters()
    }

    const handleStockFilterChange = () => {
      applyFilters()
    }

    const handleBrandChange = () => {
      applyFilters()
    }

    const handleSpecChange = () => {
      applyFilters()
    }

    const handleTagFilterChange = () => {
      applyFilters()
    }

    const selectQuickPrice = (range) => {
      priceRange.min = range.min
      priceRange.max = range.max
      applyFilters()
    }

    const isQuickPriceSelected = (range) => {
      return priceRange.min === range.min && priceRange.max === range.max
    }

    const getFilters = () => {
      const filters = {}

      if (selectedCategory.value) {
        filters.categoryId = selectedCategory.value
      }

      if (priceRange.min !== null || priceRange.max !== null) {
        filters.priceRange = {
          min: priceRange.min,
          max: priceRange.max
        }
      }

      if (stockFilter.value !== 'all') {
        filters.stockFilter = stockFilter.value
      }

      if (brandFilter.value) {
        filters.brandId = brandFilter.value
      }

      if (specFilter.value) {
        filters.spec = specFilter.value
      }

      const activeTags = []
      if (tagFilters.hot) activeTags.push('hot')
      if (tagFilters.new) activeTags.push('new')
      if (tagFilters.discount) activeTags.push('discount')

      if (activeTags.length > 0) {
        filters.tags = activeTags
      }

      return Object.keys(filters).length > 0 ? filters : null
    }

    const applyFilters = () => {
      const filters = getFilters()
      emit('filter-change', filters)
    }

    const resetFilters = () => {
      searchKeyword.value = ''
      selectedCategory.value = null
      priceRange.min = null
      priceRange.max = null
      stockFilter.value = 'all'
      brandFilter.value = null
      specFilter.value = null
      tagFilters.hot = false
      tagFilters.new = false
      tagFilters.discount = false
      advancedVisible.value = []

      emit('reset')
      ElMessage.success('筛选条件已重置')
    }

    // ================ 生命周期 ================
    
    onMounted(() => {
      // 可以在这里加载一些初始数据
    })

    // ================ 返回值 ================
    
    return {
      // 响应式数据
      searchKeyword,
      selectedCategory,
      stockFilter,
      brandFilter,
      specFilter,
      advancedVisible,
      priceRange,
      tagFilters,
      quickPriceRanges,
      
      // 计算属性
      hasActiveFilters,
      
      // 方法
      handleSearch,
      handleClear,
      handleCategoryChange,
      handlePriceChange,
      handleStockFilterChange,
      handleBrandChange,
      handleSpecChange,
      handleTagFilterChange,
      selectQuickPrice,
      isQuickPriceSelected,
      applyFilters,
      resetFilters
    }
  }
}
</script>

<style lang="scss" scoped>
.product-search-filter {
  .filter-card {
    border: none;
    
    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .title {
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .search-section {
    margin-bottom: 20px;
    
    .search-input {
      .el-input__inner {
        height: 40px;
      }
    }
  }

  .filter-section {
    margin-bottom: 20px;
    
    .section-title {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #606266;
    }

    .filter-select {
      width: 100%;
    }

    .price-range {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      
      .el-input-number {
        flex: 1;
      }
      
      .separator {
        margin: 0 8px;
        color: #909399;
      }
    }

    .quick-prices {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .price-tag {
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-1px);
        }
      }
    }

    .tag-filters {
      .tag-checkbox {
        display: block;
        margin-bottom: 8px;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .advanced-item {
      margin-bottom: 16px;
      
      h5 {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: #606266;
      }
      
      .el-select {
        width: 100%;
      }
    }
  }

  .filter-actions {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e4e7ed;
  }
}

// 分类选项样式
.category-count {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

// 单选框组样式
.el-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .el-radio {
    margin-right: 0;
  }
}

// 折叠面板样式
.el-collapse {
  border: none;
  
  .el-collapse-item {
    .el-collapse-item__header {
      border: none;
      font-size: 14px;
      color: #606266;
    }
    
    .el-collapse-item__content {
      padding-bottom: 0;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .product-search-filter {
    .quick-prices {
      .price-tag {
        font-size: 12px;
        padding: 0 8px;
      }
    }
    
    .price-range {
      .el-input-number {
        :deep(.el-input__inner) {
          font-size: 14px;
        }
      }
    }
  }
}
</style>