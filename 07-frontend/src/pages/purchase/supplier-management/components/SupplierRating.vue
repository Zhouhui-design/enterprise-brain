<template>
  <div class="supplier-rating">
    <el-card class="rating-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h3>供应商评分</h3>
            <el-tag :type="getRatingTagType(overallRating)" size="large">
              {{ overallRating }} 分
            </el-tag>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="showRatingDialog = true">
              评分评估
            </el-button>
            <el-button @click="showHistoryDialog = true">
              历史记录
            </el-button>
          </div>
        </div>
      </template>

      <!-- 总体评分展示 -->
      <div class="rating-overview">
        <div class="rating-circle">
          <el-progress
            type="circle"
            :percentage="(overallRating / 5) * 100"
            :color="getProgressColor(overallRating)"
            :width="120"
          >
            <template #default="{ percentage }">
              <span class="rating-value">{{ overallRating }}</span>
              <span class="rating-label">分</span>
            </template>
          </el-progress>
        </div>
        <div class="rating-details">
          <div class="rating-item" v-for="item in ratingDimensions" :key="item.key">
            <div class="item-info">
              <span class="item-label">{{ item.label }}</span>
              <span class="item-value">{{ item.value }}分</span>
            </div>
            <div class="item-progress">
              <el-progress
                :percentage="(item.value / 5) * 100"
                :color="getProgressColor(item.value)"
                :show-text="false"
                :stroke-width="8"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 评分维度详情 -->
      <div class="rating-dimensions">
        <el-row :gutter="20">
          <el-col :span="12" v-for="item in ratingDimensions" :key="item.key">
            <div class="dimension-card">
              <div class="dimension-header">
                <el-icon :class="item.iconClass">
                  <component :is="item.icon" />
                </el-icon>
                <span class="dimension-title">{{ item.label }}</span>
                <el-rate
                  v-model="item.value"
                  disabled
                  show-score
                  score-template="{value}"
                />
              </div>
              <div class="dimension-content">
                <p class="dimension-desc">{{ item.description }}</p>
                <div class="dimension-indicators">
                  <div class="indicator" v-for="indicator in item.indicators" :key="indicator.name">
                    <span class="indicator-name">{{ indicator.name }}</span>
                    <span class="indicator-value">{{ indicator.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 评分趋势 -->
      <div class="rating-trend">
        <h4>评分趋势</h4>
        <div ref="trendChartRef" class="trend-chart"></div>
      </div>
    </el-card>

    <!-- 评分对话框 -->
    <el-dialog
      v-model="showRatingDialog"
      title="供应商评分评估"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="rating-form">
        <div class="form-section" v-for="item in ratingForm" :key="item.key">
          <h5>{{ item.label }}</h5>
          <el-rate
            v-model="item.score"
            :max="5"
            show-text
            :texts="['很差', '较差', '一般', '良好', '优秀']"
          />
          <el-input
            v-model="item.comment"
            type="textarea"
            :rows="2"
            placeholder="请输入评分说明"
            style="margin-top: 10px"
          />
        </div>
        
        <div class="overall-rating">
          <h5>总体评分</h5>
          <el-rate
            v-model="newOverallRating"
            :max="5"
            show-text
            :texts="['很差', '较差', '一般', '良好', '优秀']"
          />
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showRatingDialog = false">取消</el-button>
        <el-button type="primary" @click="handleRatingSubmit" :loading="submitting">
          提交评分
        </el-button>
      </template>
    </el-dialog>

    <!-- 历史记录对话框 -->
    <el-dialog
      v-model="showHistoryDialog"
      title="评分历史记录"
      width="900px"
    >
      <el-table :data="ratingHistory" stripe style="width: 100%">
        <el-table-column type="index" width="60" label="序号" />
        <el-table-column prop="evaluator" label="评估人" width="120" />
        <el-table-column prop="evaluationDate" label="评估日期" width="160">
          <template #default="{ row }">
            {{ formatDate(row.evaluationDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="overallRating" label="总体评分" width="120">
          <template #default="{ row }">
            <el-rate v-model="row.overallRating" disabled />
          </template>
        </el-table-column>
        <el-table-column prop="qualityRating" label="质量评分" width="100">
          <template #default="{ row }">
            {{ row.qualityRating }}分
          </template>
        </el-table-column>
        <el-table-column prop="deliveryRating" label="交付评分" width="100">
          <template #default="{ row }">
            {{ row.deliveryRating }}分
          </template>
        </el-table-column>
        <el-table-column prop="serviceRating" label="服务评分" width="100">
          <template #default="{ row }">
            {{ row.serviceRating }}分
          </template>
        </el-table-column>
        <el-table-column prop="priceRating" label="价格评分" width="100">
          <template #default="{ row }">
            {{ row.priceRating }}分
          </template>
        </el-table-column>
        <el-table-column prop="comments" label="评价说明" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" @click="viewRatingDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <el-button @click="showHistoryDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { 
  Truck, Box, Service, Money, Timer
} from '@element-plus/icons-vue'

const props = defineProps({
  supplierId: {
    type: [String, Number],
    required: true
  },
  supplierName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['rating-updated'])

// 响应式数据
const showRatingDialog = ref(false)
const showHistoryDialog = ref(false)
const submitting = ref(false)
const trendChartRef = ref()
const trendChart = ref()

// 总体评分
const overallRating = ref(4.2)
const newOverallRating = ref(0)

// 评分维度
const ratingDimensions = reactive([
  {
    key: 'quality',
    label: '产品质量',
    value: 4.5,
    icon: Box,
    iconClass: 'quality-icon',
    description: '评估供应商提供产品的质量稳定性和符合性',
    indicators: [
      { name: '合格率', value: '98.5%' },
      { name: '退货率', value: '0.8%' },
      { name: '质量事故', value: '0次' }
    ]
  },
  {
    key: 'delivery',
    label: '交付能力',
    value: 4.0,
    icon: Truck,
    iconClass: 'delivery-icon',
    description: '评估供应商的交付及时性和准确性',
    indicators: [
      { name: '准时率', value: '95.2%' },
      { name: '准确率', value: '99.1%' },
      { name: '平均交付周期', value: '3天' }
    ]
  },
  {
    key: 'service',
    label: '服务水平',
    value: 4.3,
    icon: Service,
    iconClass: 'service-icon',
    description: '评估供应商的售后服务质量和响应速度',
    indicators: [
      { name: '响应时间', value: '2小时' },
      { name: '问题解决率', value: '96.8%' },
      { name: '客户满意度', value: '4.2分' }
    ]
  },
  {
    key: 'price',
    label: '价格竞争力',
    value: 3.8,
    icon: Money,
    iconClass: 'price-icon',
    description: '评估供应商价格的合理性和市场竞争力',
    indicators: [
      { name: '价格水平', value: '中等' },
      { name: '价格稳定性', value: '良好' },
      { name: '成本优势', value: '5.2%' }
    ]
  }
])

// 评分表单
const ratingForm = reactive([
  {
    key: 'quality',
    label: '产品质量评分',
    score: 0,
    comment: ''
  },
  {
    key: 'delivery',
    label: '交付能力评分',
    score: 0,
    comment: ''
  },
  {
    key: 'service',
    label: '服务水平评分',
    score: 0,
    comment: ''
  },
  {
    key: 'price',
    label: '价格竞争力评分',
    score: 0,
    comment: ''
  }
])

// 评分历史
const ratingHistory = ref([
  {
    id: 1,
    evaluator: '张三',
    evaluationDate: '2024-01-15',
    overallRating: 4.2,
    qualityRating: 4.5,
    deliveryRating: 4.0,
    serviceRating: 4.3,
    priceRating: 3.8,
    comments: '产品质量稳定，交付及时，服务态度良好'
  },
  {
    id: 2,
    evaluator: '李四',
    evaluationDate: '2024-02-20',
    overallRating: 4.0,
    qualityRating: 4.3,
    deliveryRating: 3.8,
    serviceRating: 4.1,
    priceRating: 3.9,
    comments: '整体表现良好，交付准时率有提升空间'
  },
  {
    id: 3,
    evaluator: '王五',
    evaluationDate: '2024-03-10',
    overallRating: 4.3,
    qualityRating: 4.6,
    deliveryRating: 4.2,
    serviceRating: 4.4,
    priceRating: 3.7,
    comments: '质量表现优秀，服务响应迅速'
  }
])

// 方法
const getRatingTagType = (rating) => {
  if (rating >= 4.5) return 'success'
  if (rating >= 3.5) return 'primary'
  if (rating >= 2.5) return 'warning'
  return 'danger'
}

const getProgressColor = (rating) => {
  if (rating >= 4.5) return '#67c23a'
  if (rating >= 3.5) return '#409eff'
  if (rating >= 2.5) return '#e6a23c'
  return '#f56c6c'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const handleRatingSubmit = async () => {
  // 验证表单
  const hasEmptyScore = ratingForm.some(item => item.score === 0)
  if (hasEmptyScore) {
    ElMessage.warning('请完成所有维度的评分')
    return
  }
  
  if (newOverallRating.value === 0) {
    ElMessage.warning('请给出总体评分')
    return
  }
  
  submitting.value = true
  try {
    // 这里调用API提交评分
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新评分数据
    ratingForm.forEach((item, index) => {
      ratingDimensions[index].value = item.score
    })
    overallRating.value = newOverallRating.value
    
    ElMessage.success('评分提交成功')
    showRatingDialog.value = false
    emit('rating-updated', overallRating.value)
    
    // 重置表单
    ratingForm.forEach(item => {
      item.score = 0
      item.comment = ''
    })
    newOverallRating.value = 0
  } catch (error) {
    ElMessage.error('评分提交失败')
  } finally {
    submitting.value = false
  }
}

const viewRatingDetail = (row) => {
  ElMessage.info('详情功能开发中...')
}

const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  trendChart.value = echarts.init(trendChartRef.value)
  
  const option = {
    title: {
      text: '评分趋势图',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['总体评分', '质量评分', '交付评分', '服务评分', '价格评分'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 5,
      splitNumber: 5
    },
    series: [
      {
        name: '总体评分',
        type: 'line',
        data: [4.0, 4.2, 4.1, 4.3, 4.2, 4.2],
        itemStyle: { color: '#409eff' }
      },
      {
        name: '质量评分',
        type: 'line',
        data: [4.2, 4.5, 4.3, 4.6, 4.5, 4.5],
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '交付评分',
        type: 'line',
        data: [3.8, 4.0, 3.9, 4.2, 4.0, 4.0],
        itemStyle: { color: '#e6a23c' }
      },
      {
        name: '服务评分',
        type: 'line',
        data: [4.1, 4.3, 4.2, 4.4, 4.3, 4.3],
        itemStyle: { color: '#f56c6c' }
      },
      {
        name: '价格评分',
        type: 'line',
        data: [3.9, 3.8, 3.7, 3.7, 3.8, 3.8],
        itemStyle: { color: '#909399' }
      }
    ]
  }
  
  trendChart.value.setOption(option)
}

const handleResize = () => {
  if (trendChart.value) {
    trendChart.value.resize()
  }
}

onMounted(() => {
  nextTick(() => {
    initTrendChart()
    window.addEventListener('resize', handleResize)
  })
})

// 组件卸载时清理
onUnmounted(() => {
  if (trendChart.value) {
    trendChart.value.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.supplier-rating {
  .rating-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        
        h3 {
          margin: 0;
          color: #303133;
        }
      }
      
      .header-right {
        display: flex;
        gap: 12px;
      }
    }
  }
  
  .rating-overview {
    display: flex;
    align-items: center;
    gap: 40px;
    margin-bottom: 32px;
    
    .rating-circle {
      flex-shrink: 0;
      
      .rating-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
      }
      
      .rating-label {
        font-size: 12px;
        color: #909399;
      }
    }
    
    .rating-details {
      flex: 1;
      
      .rating-item {
        margin-bottom: 16px;
        
        .item-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          
          .item-label {
            font-size: 14px;
            color: #606266;
          }
          
          .item-value {
            font-weight: bold;
            color: #303133;
          }
        }
        
        .item-progress {
          :deep(.el-progress-bar__outer) {
            background-color: #f0f2f5;
          }
        }
      }
    }
  }
  
  .rating-dimensions {
    margin-bottom: 32px;
    
    .dimension-card {
      padding: 20px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      background: #fafafa;
      
      .dimension-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        
        .el-icon {
          font-size: 24px;
          
          &.quality-icon { color: #67c23a; }
          &.delivery-icon { color: #409eff; }
          &.service-icon { color: #f56c6c; }
          &.price-icon { color: #e6a23c; }
        }
        
        .dimension-title {
          font-weight: bold;
          color: #303133;
          flex: 1;
        }
      }
      
      .dimension-content {
        .dimension-desc {
          color: #606266;
          font-size: 13px;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        
        .dimension-indicators {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          
          .indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
            background: #f5f7fa;
            border-radius: 4px;
            
            .indicator-name {
              font-size: 12px;
              color: #909399;
            }
            
            .indicator-value {
              font-size: 12px;
              font-weight: bold;
              color: #409eff;
            }
          }
        }
      }
    }
  }
  
  .rating-trend {
    h4 {
      margin-bottom: 16px;
      color: #303133;
    }
    
    .trend-chart {
      height: 300px;
      width: 100%;
    }
  }
  
  .rating-form {
    .form-section {
      margin-bottom: 24px;
      
      h5 {
        margin-bottom: 12px;
        color: #303133;
        font-weight: bold;
      }
    }
    
    .overall-rating {
      padding-top: 20px;
      border-top: 1px solid #e4e7ed;
      
      h5 {
        margin-bottom: 12px;
        color: #303133;
        font-weight: bold;
      }
    }
  }
}
</style>