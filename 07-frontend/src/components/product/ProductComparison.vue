<template>
  <div class="product-comparison">
    <!-- 比较工具栏 -->
    <el-card shadow="hover" class="comparison-toolbar">
      <template #header>
        <div class="toolbar-header">
          <span class="title">产品比较</span>
          <div class="toolbar-actions">
            <el-button 
              type="text" 
              @click="clearComparison"
              :disabled="comparisonProducts.length === 0"
              :icon="Delete"
            >
              清空比较
            </el-button>
            <el-button 
              type="primary" 
              @click="exportComparison"
              :disabled="comparisonProducts.length < 2"
              :icon="Download"
            >
              导出比较
            </el-button>
          </div>
        </div>
      </template>

      <div class="comparison-status">
        <el-alert
          v-if="comparisonProducts.length === 0"
          title="请选择要比较的产品"
          type="info"
          :closable="false"
        />
        <el-alert
          v-else-if="comparisonProducts.length === 1"
          title="请再选择一个产品进行比较"
          type="warning"
          :closable="false"
        />
        <el-alert
          v-else
          :title="`已选择 ${comparisonProducts.length} 个产品进行比较`"
          type="success"
          :closable="false"
        />
      </div>

      <!-- 比较产品缩略图 -->
      <div class="comparison-products">
        <div
          v-for="(product, index) in comparisonProducts"
          :key="product.id"
          class="comparison-product-item"
        >
          <div class="product-thumbnail">
            <el-image
              :src="product.imageUrl || defaultImage"
              :alt="product.name"
              fit="cover"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            
            <!-- 移除按钮 -->
            <el-button
              type="danger"
              size="small"
              circle
              @click="removeFromComparison(product)"
              :icon="Close"
              class="remove-btn"
            />
          </div>
          
          <div class="product-info">
            <h4 class="product-name" :title="product.name">
              {{ product.name }}
            </h4>
            <div class="product-price">¥{{ formatPrice(product.price) }}</div>
          </div>
        </div>

        <!-- 添加产品占位符 -->
        <div
          v-for="n in (4 - comparisonProducts.length)"
          :key="`placeholder-${n}`"
          class="comparison-product-item placeholder"
        >
          <div class="add-product-placeholder" @click="showProductSelector">
            <el-icon><Plus /></el-icon>
            <span>添加产品</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 比较表格 -->
    <el-card 
      v-if="comparisonProducts.length >= 2"
      shadow="hover"
      class="comparison-table-card"
    >
      <template #header>
        <div class="table-header">
          <span class="title">详细比较</span>
          <div class="view-options">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="differences">差异</el-radio-button>
              <el-radio-button label="important">重要</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <div class="comparison-table-wrapper">
        <el-table
          :data="comparisonTableData"
          :span-method="handleSpanMethod"
          border
          stripe
          highlight-current-row
          class="comparison-table"
        >
          <!-- 产品名称行 -->
          <el-table-column 
            label="产品" 
            prop="productName" 
            width="150"
            fixed="left"
          >
            <template #default="{ row }">
              <div class="comparison-product-cell">
                <el-image
                  :src="row.imageUrl || defaultImage"
                  :alt="row.productName"
                  fit="cover"
                  class="cell-product-image"
                />
                <span class="cell-product-name">{{ row.productName }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- 价格列 -->
          <el-table-column label="价格" prop="price" width="120">
            <template #default="{ row }">
              <span class="price-cell" :class="getPriceClass(row.price, row.category)">
                ¥{{ formatPrice(row.price) }}
              </span>
            </template>
          </el-table-column>

          <!-- 动态生成的比较列 -->
          <el-table-column
            v-for="column in dynamicColumns"
            :key="column.key"
            :label="column.label"
            :width="column.width"
            :min-width="column.minWidth"
          >
            <template #default="{ row }">
              <div class="comparison-cell" :class="getCellClass(row, column.key)">
                <component
                  :is="getCellComponent(column.key)"
                  :value="row[column.key]"
                  :row="row"
                  :column="column"
                />
              </div>
            </template>
          </el-table-column>

          <!-- 评分列 -->
          <el-table-column label="综合评分" width="120">
            <template #default="{ row }">
              <div class="score-cell">
                <el-rate
                  v-model="row.score"
                  disabled
                  show-score
                  text-color="#ff9900"
                />
              </div>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                type="text"
                size="small"
                @click="viewProductDetail(row)"
              >
                详情
              </el-button>
              <el-button
                type="text"
                size="small"
                @click="selectProduct(row)"
              >
                选择
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 比较分析 -->
    <el-card 
      v-if="comparisonProducts.length >= 2"
      shadow="hover"
      class="comparison-analysis-card"
    >
      <template #header>
        <span class="title">智能分析</span>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="analysis-section">
            <h4>性价比分析</h4>
            <div class="value-rank">
              <div
                v-for="(item, index) in valueRanking"
                :key="item.id"
                class="rank-item"
                :class="{ best: index === 0 }"
              >
                <span class="rank">{{ index + 1 }}</span>
                <span class="product">{{ item.name }}</span>
                <span class="score">{{ item.valueScore.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </el-col>

        <el-col :span="12">
          <div class="analysis-section">
            <h4>推荐度分析</h4>
            <div class="recommendation-rank">
              <div
                v-for="(item, index) in recommendationRanking"
                :key="item.id"
                class="rank-item"
                :class="{ best: index === 0 }"
              >
                <span class="rank">{{ index + 1 }}</span>
                <span class="product">{{ item.name }}</span>
                <el-tag
                  :type="item.recommendationType"
                  size="small"
                >
                  {{ item.recommendationText }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 比较雷达图 -->
      <el-row :gutter="20" class="chart-section">
        <el-col :span="24">
          <h4>多维度对比</h4>
          <div ref="radarChartRef" class="radar-chart"></div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 产品选择器弹窗 -->
    <el-dialog
      v-model="selectorVisible"
      title="选择比较产品"
      width="80%"
      top="5vh"
    >
      <ProductSelector
        :multiple="true"
        :max-selection="4 - comparisonProducts.length"
        :exclude-ids="comparisonProducts.map(p => p.id)"
        @confirm="handleSelectorConfirm"
        @cancel="selectorVisible = false"
      />
    </el-dialog>

    <!-- 产品详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="selectedDetailProduct?.name || '产品详情'"
      width="800px"
    >
      <ProductDetail
        v-if="selectedDetailProduct"
        :product="selectedDetailProduct"
      />
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { 
  Delete, 
  Download, 
  Close, 
  Plus, 
  Picture 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProductSelector from './ProductSelector.vue'
import ProductDetail from './ProductDetail.vue'
import * as echarts from 'echarts'

export default {
  name: 'ProductComparison',
  components: {
    Delete,
    Download,
    Close,
    Plus,
    Picture,
    ProductSelector,
    ProductDetail
  },
  props: {
    // 默认比较产品列表
    defaultProducts: {
      type: Array,
      default: () => []
    }
  },
  emits: [
    'product-select',
    'comparison-change'
  ],
  setup(props, { emit }) {
    // ================ 响应式数据 ================
    
    const comparisonProducts = ref([])
    const viewMode = ref('all')
    const selectorVisible = ref(false)
    const detailVisible = ref(false)
    const selectedDetailProduct = ref(null)
    const radarChartRef = ref(null)
    const defaultImage = ref('/images/default-product.png')

    // 比较分析数据
    const valueRanking = ref([])
    const recommendationRanking = ref([])

    // ================ 计算属性 ================
    
    const dynamicColumns = computed(() => {
      const columns = [
        { key: 'category', label: '分类', width: 100 },
        { key: 'brand', label: '品牌', width: 100 },
        { key: 'specifications', label: '规格', width: 150 },
        { key: 'features', label: '特性', width: 200 },
        { key: 'stock', label: '库存', width: 80 },
        { key: 'warranty', label: '保修期', width: 100 },
        { key: 'delivery', label: '配送', width: 100 }
      ]

      // 根据视图模式过滤列
      if (viewMode.value === 'important') {
        return columns.filter(col => ['category', 'price', 'stock', 'warranty'].includes(col.key))
      }

      return columns
    })

    const comparisonTableData = computed(() => {
      if (comparisonProducts.value.length === 0) return []

      // 转换产品数据为表格格式
      return comparisonProducts.value.map(product => ({
        ...product,
        productName: product.name,
        score: calculateProductScore(product),
        valueScore: calculateValueScore(product),
        recommendationType: getRecommendationType(product),
        recommendationText: getRecommendationText(product)
      }))
    })

    // ================ 方法定义 ================

    /**
     * 添加产品到比较列表
     */
    const addToComparison = (product) => {
      if (comparisonProducts.value.length >= 4) {
        ElMessage.warning('最多只能比较4个产品')
        return
      }

      if (comparisonProducts.value.some(p => p.id === product.id)) {
        ElMessage.warning('该产品已在比较列表中')
        return
      }

      comparisonProducts.value.push(product)
      emit('comparison-change', comparisonProducts.value)
      ElMessage.success('已添加到比较列表')
    }

    /**
     * 从比较列表移除产品
     */
    const removeFromComparison = (product) => {
      const index = comparisonProducts.value.findIndex(p => p.id === product.id)
      if (index !== -1) {
        comparisonProducts.value.splice(index, 1)
        emit('comparison-change', comparisonProducts.value)
      }
    }

    /**
     * 清空比较列表
     */
    const clearComparison = () => {
      ElMessageBox.confirm(
        '确定要清空比较列表吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        comparisonProducts.value = []
        emit('comparison-change', [])
        ElMessage.success('已清空比较列表')
      })
    }

    /**
     * 显示产品选择器
     */
    const showProductSelector = () => {
      selectorVisible.value = true
    }

    /**
     * 处理选择器确认
     */
    const handleSelectorConfirm = (products) => {
      products.forEach(product => addToComparison(product))
      selectorVisible.value = false
    }

    /**
     * 查看产品详情
     */
    const viewProductDetail = (product) => {
      selectedDetailProduct.value = product
      detailVisible.value = true
    }

    /**
     * 选择产品
     */
    const selectProduct = (product) => {
      emit('product-select', product)
    }

    /**
     * 计算产品综合评分
     */
    const calculateProductScore = (product) => {
      const scores = {
        price: calculatePriceScore(product.price),
        stock: calculateStockScore(product.stock),
        features: calculateFeaturesScore(product.features),
        quality: calculateQualityScore(product.quality || 0)
      }

      const weights = {
        price: 0.3,
        stock: 0.2,
        features: 0.3,
        quality: 0.2
      }

      return Object.keys(scores).reduce((total, key) => {
        return total + (scores[key] * weights[key])
      }, 0)
    }

    /**
     * 计算价格评分（价格越低分数越高）
     */
    const calculatePriceScore = (price) => {
      const maxPrice = Math.max(...comparisonProducts.value.map(p => p.price))
      return maxPrice > 0 ? (1 - price / maxPrice) * 5 : 5
    }

    /**
     * 计算库存评分
     */
    const calculateStockScore = (stock) => {
      if (stock === 0) return 0
      if (stock < 10) return 2
      if (stock < 50) return 3.5
      return 5
    }

    /**
     * 计算特性评分
     */
    const calculateFeaturesScore = (features) => {
      if (!features || !Array.isArray(features)) return 2.5
      return Math.min(features.length, 5)
    }

    /**
     * 计算质量评分
     */
    const calculateQualityScore = (quality) => {
      return quality || 3
    }

    /**
     * 计算性价比评分
     */
    const calculateValueScore = (product) => {
      const score = calculateProductScore(product)
      return score / (product.price / 1000) // 标准化价格影响
    }

    /**
     * 获取推荐类型
     */
    const getRecommendationType = (product) => {
      const score = calculateProductScore(product)
      const valueScore = calculateValueScore(product)
      
      if (score >= 4.5 && valueScore >= 3.5) return 'success'
      if (score >= 3.5 && valueScore >= 2.5) return 'primary'
      if (score >= 2.5) return 'warning'
      return 'info'
    }

    /**
     * 获取推荐文本
     */
    const getRecommendationText = (product) => {
      const type = getRecommendationType(product)
      const texts = {
        success: '强烈推荐',
        primary: '推荐',
        warning: '一般',
        info: '不推荐'
      }
      return texts[type] || '一般'
    }

    /**
     * 获取价格样式类
     */
    const getPriceClass = (price, category) => {
      const prices = comparisonProducts.value.map(p => p.price)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      
      if (price === minPrice) return 'best-price'
      if (price === maxPrice) return 'worst-price'
      return 'normal-price'
    }

    /**
     * 获取单元格样式类
     */
    const getCellClass = (row, columnKey) => {
      // 检查该列的值是否与众不同
      const values = comparisonProducts.value.map(p => p[columnKey])
      const currentValue = row[columnKey]
      
      if (columnKey === 'stock') {
        if (currentValue === 0) return 'negative'
        if (currentValue === Math.max(...values)) return 'positive'
      }
      
      return ''
    }

    /**
     * 获取单元格组件
     */
    const getCellComponent = (columnKey) => {
      const components = {
        category: 'CategoryCell',
        brand: 'TextCell',
        specifications: 'TextCell',
        features: 'TagsCell',
        stock: 'StockCell',
        warranty: 'TextCell',
        delivery: 'TextCell'
      }
      
      return components[columnKey] || 'TextCell'
    }

    /**
     * 处理表格合并方法
     */
    const handleSpanMethod = ({ row, column, rowIndex, columnIndex }) => {
      // 第一列合并所有产品名称行
      if (columnIndex === 0 && rowIndex === 0) {
        return {
          rowspan: 1,
          colspan: 1
        }
      }
      
      return {
        rowspan: 1,
        colspan: 1
      }
    }

    /**
     * 导出比较结果
     */
    const exportComparison = () => {
      const data = comparisonTableData.value.map(row => ({
        产品名称: row.productName,
        分类: row.categoryName,
        品牌: row.brand,
        价格: row.price,
        库存: row.stock,
        保修期: row.warranty,
        综合评分: row.score.toFixed(2),
        推荐度: row.recommendationText
      }))

      // 这里可以调用导出Excel或PDF的方法
      console.log('导出数据:', data)
      ElMessage.success('比较结果已导出')
    }

    /**
     * 绘制雷达图
     */
    const drawRadarChart = () => {
      if (!radarChartRef.value || comparisonProducts.value.length < 2) {
        return
      }

      const chart = echarts.init(radarChartRef.value)
      
      const dimensions = [
        '价格优势',
        '库存充足',
        '功能丰富',
        '质量可靠',
        '性价比'
      ]
      
      const data = comparisonProducts.value.map(product => {
        return {
          name: product.name,
          value: [
            calculatePriceScore(product.price),
            calculateStockScore(product.stock),
            calculateFeaturesScore(product.features),
            calculateQualityScore(product.quality || 0),
            calculateValueScore(product) * 2
          ]
        }
      })

      const option = {
        title: {
          text: '产品多维度对比',
          left: 'center'
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          data: data.map(item => item.name),
          bottom: 0
        },
        radar: {
          indicator: dimensions.map(name => ({
            name,
            max: 5
          }))
        },
        series: [{
          type: 'radar',
          data: data
        }]
      }

      chart.setOption(option)
      
      // 响应式处理
      window.addEventListener('resize', () => {
        chart.resize()
      })
    }

    /**
     * 更新分析数据
     */
    const updateAnalysis = () => {
      // 性价比排名
      valueRanking.value = [...comparisonProducts.value]
        .map(product => ({
          ...product,
          valueScore: calculateValueScore(product)
        }))
        .sort((a, b) => b.valueScore - a.valueScore)

      // 推荐度排名
      recommendationRanking.value = [...comparisonProducts.value]
        .map(product => ({
          ...product,
          score: calculateProductScore(product),
          recommendationType: getRecommendationType(product),
          recommendationText: getRecommendationText(product)
        }))
        .sort((a, b) => b.score - a.score)

      // 绘制雷达图
      nextTick(() => {
        drawRadarChart()
      })
    }

    /**
     * 格式化价格
     */
    const formatPrice = (price) => {
      return price?.toFixed(2) || '0.00'
    }

    // ================ 生命周期 ================
    
    onMounted(() => {
      // 初始化默认产品
      if (props.defaultProducts.length > 0) {
        comparisonProducts.value = [...props.defaultProducts]
      }
    })

    // ================ 监听器 ================
    
    // 监听比较产品变化，更新分析
    watch(comparisonProducts, (newProducts) => {
      if (newProducts.length >= 2) {
        updateAnalysis()
      }
    }, { deep: true })

    // ================ 返回值 ================
    
    return {
      // 响应式数据
      comparisonProducts,
      viewMode,
      selectorVisible,
      detailVisible,
      selectedDetailProduct,
      radarChartRef,
      defaultImage,
      
      // 计算属性
      dynamicColumns,
      comparisonTableData,
      valueRanking,
      recommendationRanking,
      
      // 方法
      addToComparison,
      removeFromComparison,
      clearComparison,
      showProductSelector,
      handleSelectorConfirm,
      viewProductDetail,
      selectProduct,
      getPriceClass,
      getCellClass,
      getCellComponent,
      handleSpanMethod,
      exportComparison,
      formatPrice
    }
  }
}
</script>

<style lang="scss" scoped>
.product-comparison {
  padding: 20px;

  .comparison-toolbar {
    margin-bottom: 20px;
  }

  .toolbar-header,
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-weight: 600;
      color: #303133;
    }
  }

  .comparison-status {
    margin: 16px 0;
  }

  .comparison-products {
    display: flex;
    gap: 16px;
    margin-top: 16px;
    overflow-x: auto;
    padding-bottom: 8px;

    .comparison-product-item {
      min-width: 120px;
      background: white;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      padding: 12px;
      transition: all 0.3s ease;

      &.placeholder {
        border-style: dashed;
        border-color: #c0c4cc;
      }

      &:hover:not(.placeholder) {
        border-color: #409eff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
      }

      .product-thumbnail {
        position: relative;
        margin-bottom: 12px;

        .el-image {
          width: 100%;
          height: 100px;
          border-radius: 4px;
        }

        .image-error {
          width: 100%;
          height: 100px;
          background: #f5f7fa;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c0c4cc;
          font-size: 24px;
        }

        .remove-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover .remove-btn {
          opacity: 1;
        }
      }

      .product-info {
        text-align: center;

        .product-name {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
          height: 40px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .product-price {
          font-size: 16px;
          font-weight: 700;
          color: #e6a23c;
        }
      }

      .add-product-placeholder {
        width: 100%;
        height: 140px;
        border: 2px dashed #c0c4cc;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #909399;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: #409eff;
          color: #409eff;
        }

        .el-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        span {
          font-size: 12px;
        }
      }
    }
  }

  .comparison-table-card,
  .comparison-analysis-card {
    margin-bottom: 20px;
  }

  .comparison-table-wrapper {
    overflow-x: auto;
  }

  .comparison-table {
    .comparison-product-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .cell-product-image {
        width: 40px;
        height: 40px;
        border-radius: 4px;
      }

      .cell-product-name {
        font-weight: 600;
      }
    }

    .price-cell {
      font-weight: 600;

      &.best-price {
        color: #67c23a;
      }

      &.worst-price {
        color: #f56c6c;
      }
    }

    .comparison-cell {
      &.positive {
        color: #67c23a;
        font-weight: 600;
      }

      &.negative {
        color: #f56c6c;
        font-weight: 600;
      }
    }

    .score-cell {
      display: flex;
      align-items: center;
    }
  }

  .analysis-section {
    h4 {
      margin: 0 0 16px 0;
      color: #303133;
    }

    .value-rank,
    .recommendation-rank {
      .rank-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        margin-bottom: 8px;
        background: #f5f7fa;
        border-radius: 4px;
        transition: all 0.3s ease;

        &.best {
          background: #f0f9ff;
          border: 1px solid #409eff;
        }

        .rank {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #909399;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .best .rank {
          background: #409eff;
        }

        .product {
          flex: 1;
          font-weight: 500;
        }

        .score {
          font-weight: 600;
          color: #409eff;
        }
      }
    }
  }

  .chart-section {
    margin-top: 24px;

    h4 {
      margin: 0 0 16px 0;
      color: #303133;
    }

    .radar-chart {
      width: 100%;
      height: 400px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .product-comparison {
    padding: 10px;

    .comparison-products {
      .comparison-product-item {
        min-width: 100px;

        .product-thumbnail {
          .el-image {
            height: 80px;
          }
        }
      }
    }

    .comparison-table {
      font-size: 12px;
    }
  }
}
</style>