<template>
  <div class="capacity-planning">
    <el-page-header :title="'产能规划'" :content="'分析和规划生产产能'" />
    
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="时间周期">
          <el-date-picker
            v-model="dateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            value-format="yyyy-MM"
          />
        </el-form-item>
        <el-form-item label="车间">
          <el-select v-model="searchForm.workshopId" placeholder="请选择车间" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="workshop in workshops" :key="workshop.id" :label="workshop.name" :value="workshop.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="生产线">
          <el-select v-model="searchForm.productionLineId" placeholder="请选择生产线" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="line in productionLines" :key="line.id" :label="line.name" :value="line.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-row :gutter="20">
      <!-- 产能概览 -->
      <el-col :span="24">
        <el-card class="overview-card">
          <div class="card-header">
            <h3>产能概览</h3>
            <el-select v-model="viewMode" placeholder="视图模式">
              <el-option label="月视图" value="month" />
              <el-option label="周视图" value="week" />
              <el-option label="日视图" value="day" />
            </el-select>
          </div>
          <div class="overview-stats">
            <el-statistic :value="totalCapacity" suffix="件" title="总产能" />
            <el-statistic :value="plannedProduction" suffix="件" title="计划产量" />
            <el-statistic :value="actualProduction" suffix="件" title="实际产量" />
            <el-statistic :value="utilizationRate" suffix="%" :precision="2" title="产能利用率" />
          </div>
          <div class="chart-container">
            <!-- 这里可以集成ECharts或其他图表库 -->
            <div class="chart-placeholder">产能趋势图表区域</div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 产能明细 -->
      <el-col :span="16">
        <el-card class="detail-card">
          <h3>产能明细</h3>
          <el-table
            v-loading="loading"
            :data="capacityDetails"
            style="width: 100%"
          >
            <el-table-column prop="period" label="时间段" width="150" />
            <el-table-column prop="workshopName" label="车间" width="120" />
            <el-table-column prop="productionLineName" label="生产线" width="120" />
            <el-table-column prop="capacity" label="理论产能" width="120" align="right" />
            <el-table-column prop="planned" label="计划使用" width="120" align="right" />
            <el-table-column prop="actual" label="实际使用" width="120" align="right" />
            <el-table-column prop="available" label="可用产能" width="120" align="right">
              <template #default="scope">
                <span :class="{ 'available-low': scope.row.available < 0 }">
                  {{ scope.row.available }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="utilization" label="利用率" width="100" align="right">
              <template #default="scope">
                <span :class="{ 'utilization-high': scope.row.utilization > 90 }">
                  {{ scope.row.utilization.toFixed(2) }}%
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <!-- 产能预警 -->
      <el-col :span="8">
        <el-card class="alert-card">
          <h3>产能预警</h3>
          <el-empty v-if="capacityAlerts.length === 0" description="暂无预警信息" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="(alert, index) in capacityAlerts"
              :key="index"
              :timestamp="alert.timestamp"
              :type="alert.type"
            >
              {{ alert.message }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import capacityLoadAPI from '@/api/capacityLoad'

export default {
  name: 'CapacityPlanning',
  setup() {
    // 数据
    const loading = ref(false)
    const dateRange = ref([])
    const viewMode = ref('month')
    const workshops = ref([])
    const productionLines = ref([])
    
    const searchForm = reactive({
      workshopId: '',
      productionLineId: ''
    })
    
    // 概览数据
    const totalCapacity = ref(0)
    const plannedProduction = ref(0)
    const actualProduction = ref(0)
    const utilizationRate = ref(0)
    
    // 明细数据
    const capacityDetails = ref([])
    
    // 预警数据
    const capacityAlerts = ref([])
    
    // 方法
    const handleSearch = async () => {
      loading.value = true
      try {
        // 获取产能明细数据
        const params = {
          startDate: dateRange.value?.[0],
          endDate: dateRange.value?.[1],
          workshopId: searchForm.workshopId,
          productionLineId: searchForm.productionLineId
        }
        
        const response = await capacityLoadAPI.getList(params)
        
        // 处理API返回数据
        if (response && response.code === 200) {
          capacityDetails.value = response.data?.records || []
          
          // 计算概览数据
          totalCapacity.value = capacityDetails.value.reduce((sum, item) => sum + (item.capacity || 0), 0)
          plannedProduction.value = capacityDetails.value.reduce((sum, item) => sum + (item.planned || 0), 0)
          actualProduction.value = capacityDetails.value.reduce((sum, item) => sum + (item.actual || 0), 0)
          utilizationRate.value = totalCapacity.value > 0 ? (plannedProduction.value / totalCapacity.value) * 100 : 0
          
          // 生成预警信息
          capacityAlerts.value = capacityDetails.value
            .filter(item => item.utilization > 90)
            .map(item => ({
              timestamp: item.period,
              type: 'warning',
              message: `${item.workshopName}在${item.period}产能利用率高达${item.utilization.toFixed(2)}%`
            }))
        } else {
          throw new Error(response?.message || '获取数据失败')
        }
      } catch (error) {
        console.error('获取产能数据失败:', error)
        ElMessage.error('获取产能数据失败: ' + (error.message || '未知错误'))
      } finally {
        loading.value = false
      }
    }
    
    const handleReset = () => {
      dateRange.value = []
      searchForm.workshopId = ''
      searchForm.productionLineId = ''
      capacityDetails.value = []
      capacityAlerts.value = []
      totalCapacity.value = 0
      plannedProduction.value = 0
      actualProduction.value = 0
      utilizationRate.value = 0
    }
    
    // 初始化数据
    const initData = async () => {
      try {
        // 模拟获取车间和生产线数据
        workshops.value = [
          { id: '1', name: '装配车间' },
          { id: '2', name: '加工车间' },
          { id: '3', name: '包装车间' }
        ]
        
        productionLines.value = [
          { id: '1', name: '装配线A' },
          { id: '2', name: '装配线B' },
          { id: '3', name: '加工线A' },
          { id: '4', name: '包装线A' }
        ]
        
        // 默认加载当前月度数据
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        dateRange.value = [
          startOfMonth.toISOString().slice(0, 7),
          endOfMonth.toISOString().slice(0, 7)
        ]
        
        await handleSearch()
      } catch (error) {
        console.error('初始化数据失败:', error)
        ElMessage.error('初始化数据失败: ' + (error.message || '未知错误'))
      }
    }
    
    // 生命周期
    onMounted(() => {
      initData()
    })
    
    return {
      // 数据
      loading,
      dateRange,
      viewMode,
      workshops,
      productionLines,
      searchForm,
      totalCapacity,
      plannedProduction,
      actualProduction,
      utilizationRate,
      capacityDetails,
      capacityAlerts,
      
      // 方法
      handleSearch,
      handleReset
    }
  }
}
</script>

<style scoped>
.capacity-planning {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.overview-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  border: 1px solid #eee;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  color: #999;
}

.available-low {
  color: #f56c6c;
  font-weight: bold;
}

.utilization-high {
  color: #e6a23c;
  font-weight: bold;
}
</style>
</script>
</template>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>
</script>