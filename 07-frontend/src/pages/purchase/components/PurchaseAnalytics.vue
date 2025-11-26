<template>
  <div class="purchase-analytics">
    <el-card class="analytics-card">
      <div slot="header" class="card-header">
        <span>采购数据分析</span>
        <div class="header-actions">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateRangeChange"
          ></el-date-picker>
          <el-button type="primary" @click="refreshData">刷新</el-button>
          <el-button @click="exportReport">导出报告</el-button>
        </div>
      </div>
      
      <!-- 统计卡片 -->
      <div class="stats-cards">
        <el-card class="stat-card primary">
          <div class="stat-content">
            <div class="stat-number">{{ totalPurchaseAmount.toLocaleString('zh-CN') }}</div>
            <div class="stat-label">采购总额 (元)</div>
          </div>
          <div class="stat-icon">
            <i class="el-icon-money"></i>
          </div>
        </el-card>
        
        <el-card class="stat-card success">
          <div class="stat-content">
            <div class="stat-number">{{ totalPurchaseOrders }}</div>
            <div class="stat-label">采购订单数</div>
          </div>
          <div class="stat-icon">
            <i class="el-icon-document"></i>
          </div>
        </el-card>
        
        <el-card class="stat-card warning">
          <div class="stat-content">
            <div class="stat-number">{{ totalSuppliers }}</div>
            <div class="stat-label">供应商数量</div>
          </div>
          <div class="stat-icon">
            <i class="el-icon-user"></i>
          </div>
        </el-card>
        
        <el-card class="stat-card info">
          <div class="stat-content">
            <div class="stat-number">{{ avgDeliveryTime }}天</div>
            <div class="stat-label">平均交货期</div>
          </div>
          <div class="stat-icon">
            <i class="el-icon-time"></i>
          </div>
        </el-card>
      </div>
      
      <!-- 图表区域 -->
      <div class="charts-container">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="chart-card">
              <div slot="header" class="chart-header">
                <span>采购金额趋势</span>
                <el-select v-model="chartPeriod" @change="updateCharts">
                  <el-option label="月度" value="month"></el-option>
                  <el-option label="季度" value="quarter"></el-option>
                  <el-option label="年度" value="year"></el-option>
                </el-select>
              </div>
              <div class="chart-content">
                <canvas ref="trendChart" height="300"></canvas>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card class="chart-card">
              <div slot="header" class="chart-header">
                <span>供应商采购分布</span>
              </div>
              <div class="chart-content">
                <canvas ref="supplierChart" height="300"></canvas>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card class="chart-card">
              <div slot="header" class="chart-header">
                <span>物料类别采购分布</span>
              </div>
              <div class="chart-content">
                <canvas ref="categoryChart" height="300"></canvas>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card class="chart-card">
              <div slot="header" class="chart-header">
                <span>采购订单状态分布</span>
              </div>
              <div class="chart-content">
                <canvas ref="statusChart" height="300"></canvas>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="供应商">
            <el-select v-model="filterForm.supplierId" placeholder="选择供应商" clearable>
              <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="物料类别">
            <el-select v-model="filterForm.categoryId" placeholder="选择物料类别" clearable>
              <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="订单状态">
            <el-select v-model="filterForm.status" placeholder="选择订单状态" clearable>
              <el-option label="已创建" value="created"></el-option>
              <el-option label="已审核" value="approved"></el-option>
              <el-option label="已下单" value="ordered"></el-option>
              <el-option label="已收货" value="received"></el-option>
              <el-option label="已完成" value="completed"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="applyFilters">应用筛选</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 详细数据表格 -->
      <div class="data-table">
        <el-table :data="purchaseData" stripe style="width: 100%">
          <el-table-column prop="orderNumber" label="订单编号" width="180"></el-table-column>
          <el-table-column prop="supplierName" label="供应商" width="150"></el-table-column>
          <el-table-column prop="orderDate" label="下单日期" width="120"></el-table-column>
          <el-table-column prop="deliveryDate" label="交货日期" width="120"></el-table-column>
          <el-table-column prop="totalAmount" label="订单金额" width="120" align="right">
            <template slot-scope="scope">{{ scope.row.totalAmount.toLocaleString('zh-CN') }} 元</template>
          </el-table-column>
          <el-table-column prop="status" label="订单状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="categoryName" label="主要物料类别" width="120"></el-table-column>
          <el-table-column prop="deliveryTime" label="实际交货期" width="100">
            <template slot-scope="scope">{{ scope.row.deliveryTime }}天</template>
          </el-table-column>
          <el-table-column prop="qualityScore" label="质量评分" width="100" align="center">
            <template slot-scope="scope">
              <div class="quality-score">
                <el-rate v-model="scope.row.qualityScore" disabled :max="5"></el-rate>
              </div>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalDataCount"
            :page-sizes="[10, 20, 50, 100]"
            v-model="currentPage"
            v-model:page-size="pageSize"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
import Chart from 'chart.js'

export default {
  name: 'PurchaseAnalytics',
  data() {
    return {
      // 日期范围
      dateRange: [new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1), new Date()],
      // 图表周期
      chartPeriod: 'month',
      // 统计数据
      totalPurchaseAmount: 0,
      totalPurchaseOrders: 0,
      totalSuppliers: 0,
      avgDeliveryTime: 0,
      // 筛选表单
      filterForm: {
        supplierId: '',
        categoryId: '',
        status: ''
      },
      // 供应商列表
      suppliers: [],
      // 物料类别列表
      categories: [],
      // 采购数据
      purchaseData: [],
      // 分页信息
      currentPage: 1,
      pageSize: 20,
      totalDataCount: 0,
      // 图表实例
      trendChart: null,
      supplierChart: null,
      categoryChart: null,
      statusChart: null
    }
  },
  mounted() {
    this.initializeData()
  },
  beforeDestroy() {
    // 销毁图表实例
    if (this.trendChart) {
      this.trendChart.destroy()
    }
    if (this.supplierChart) {
      this.supplierChart.destroy()
    }
    if (this.categoryChart) {
      this.categoryChart.destroy()
    }
    if (this.statusChart) {
      this.statusChart.destroy()
    }
  },
  methods: {
    // 初始化数据
    async initializeData() {
      // 在实际应用中，这里会调用API获取数据
      this.loadMockData()
      this.initializeCharts()
    },
    
    // 加载模拟数据
    loadMockData() {
      // 模拟统计数据
      this.totalPurchaseAmount = 12580000
      this.totalPurchaseOrders = 326
      this.totalSuppliers = 48
      this.avgDeliveryTime = 12
      
      // 模拟供应商数据
      this.suppliers = [
        { id: '1', name: '供应商A' },
        { id: '2', name: '供应商B' },
        { id: '3', name: '供应商C' },
        { id: '4', name: '供应商D' },
        { id: '5', name: '供应商E' }
      ]
      
      // 模拟物料类别数据
      this.categories = [
        { id: '1', name: '原材料' },
        { id: '2', name: '零部件' },
        { id: '3', name: '设备' },
        { id: '4', name: '办公用品' },
        { id: '5', name: '服务' }
      ]
      
      // 模拟采购数据
      const statuses = ['created', 'approved', 'ordered', 'received', 'completed']
      const statusTexts = {
        'created': '已创建',
        'approved': '已审核',
        'ordered': '已下单',
        'received': '已收货',
        'completed': '已完成'
      }
      const supplierNames = ['供应商A', '供应商B', '供应商C', '供应商D', '供应商E']
      const categoryNames = ['原材料', '零部件', '设备', '办公用品', '服务']
      
      this.purchaseData = []
      for (let i = 1; i <= this.pageSize; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const supplierIndex = Math.floor(Math.random() * supplierNames.length)
        const categoryIndex = Math.floor(Math.random() * categoryNames.length)
        const orderDate = new Date()
        orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 180))
        const deliveryDate = new Date(orderDate)
        deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 30) + 5)
        
        this.purchaseData.push({
          id: i,
          orderNumber: `PO-${2023}-${String(i).padStart(4, '0')}`,
          supplierId: String(supplierIndex + 1),
          supplierName: supplierNames[supplierIndex],
          orderDate: this.formatDate(orderDate),
          deliveryDate: this.formatDate(deliveryDate),
          totalAmount: Math.floor(Math.random() * 1000000) + 10000,
          status: status,
          statusText: statusTexts[status],
          categoryId: String(categoryIndex + 1),
          categoryName: categoryNames[categoryIndex],
          deliveryTime: Math.floor(Math.random() * 20) + 5,
          qualityScore: Math.floor(Math.random() * 2) + 4 // 4-5分
        })
      }
      
      this.totalDataCount = 326
    },
    
    // 初始化图表
    initializeCharts() {
      this.$nextTick(() => {
        this.createTrendChart()
        this.createSupplierChart()
        this.createCategoryChart()
        this.createStatusChart()
      })
    },
    
    // 创建趋势图表
    createTrendChart() {
      const ctx = this.$refs.trendChart.getContext('2d')
      
      // 模拟数据
      const labels = this.chartPeriod === 'month' 
        ? ['1月', '2月', '3月', '4月', '5月', '6月']
        : this.chartPeriod === 'quarter' 
          ? ['Q1', 'Q2', 'Q3', 'Q4']
          : ['2021', '2022', '2023']
      
      const data = [1800000, 2100000, 1950000, 2300000, 2500000, 1930000]
      
      this.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: '采购金额 (元)',
            data: data,
            borderColor: '#409EFF',
            backgroundColor: 'rgba(64, 158, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.parsed.y.toLocaleString('zh-CN') + ' 元'
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return value.toLocaleString('zh-CN')
                }
              }
            }
          }
        }
      })
    },
    
    // 创建供应商分布图表
    createSupplierChart() {
      const ctx = this.$refs.supplierChart.getContext('2d')
      
      // 模拟数据
      const labels = ['供应商A', '供应商B', '供应商C', '供应商D', '供应商E', '其他']
      const data = [35, 25, 15, 10, 8, 7]
      const backgroundColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#C0C4CC']
      
      this.supplierChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.label + ': ' + context.parsed + '%'
                }
              }
            }
          }
        }
      })
    },
    
    // 创建物料类别分布图表
    createCategoryChart() {
      const ctx = this.$refs.categoryChart.getContext('2d')
      
      // 模拟数据
      const labels = ['原材料', '零部件', '设备', '办公用品', '服务']
      const data = [45, 25, 15, 10, 5]
      const backgroundColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
      
      this.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.label + ': ' + context.parsed + '%'
                }
              }
            }
          }
        }
      })
    },
    
    // 创建订单状态分布图表
    createStatusChart() {
      const ctx = this.$refs.statusChart.getContext('2d')
      
      // 模拟数据
      const labels = ['已创建', '已审核', '已下单', '已收货', '已完成']
      const data = [15, 25, 20, 20, 20]
      const backgroundColors = ['#909399', '#409EFF', '#E6A23C', '#67C23A', '#F56C6C']
      
      this.statusChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '订单数量',
            data: data,
            backgroundColor: backgroundColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      })
    },
    
    // 更新图表
    updateCharts() {
      if (this.trendChart) {
        this.trendChart.destroy()
      }
      this.createTrendChart()
    },
    
    // 处理日期范围变化
    handleDateRangeChange() {
      this.refreshData()
    },
    
    // 刷新数据
    refreshData() {
      // 在实际应用中，这里会重新调用API获取数据
      this.loadMockData()
      this.updateCharts()
      this.$message.success('数据已刷新')
    },
    
    // 导出报告
    exportReport() {
      // 在实际应用中，这里会调用API导出报告
      this.$message.success('报告导出成功')
    },
    
    // 应用筛选
    applyFilters() {
      // 在实际应用中，这里会根据筛选条件重新获取数据
      this.refreshData()
    },
    
    // 重置筛选
    resetFilters() {
      this.filterForm = {
        supplierId: '',
        categoryId: '',
        status: ''
      }
    },
    
    // 分页大小变化
    handleSizeChange(size) {
      this.pageSize = size
      this.loadMockData()
    },
    
    // 当前页变化
    handleCurrentChange(current) {
      this.currentPage = current
      this.loadMockData()
    },
    
    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        'created': 'info',
        'approved': 'primary',
        'ordered': 'warning',
        'received': 'success',
        'completed': 'success'
      }
      return typeMap[status] || 'default'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        'created': '已创建',
        'approved': '已审核',
        'ordered': '已下单',
        'received': '已收货',
        'completed': '已完成'
      }
      return textMap[status] || status
    },
    
    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }
}
</script>

<style scoped>
.purchase-analytics {
  padding: 20px;
  background-color: #f5f7fa;
}

.analytics-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-card.primary {
  border-left: 4px solid #409EFF;
}

.stat-card.success {
  border-left: 4px solid #67C23A;
}

.stat-card.warning {
  border-left: 4px solid #E6A23C;
}

.stat-card.info {
  border-left: 4px solid #909399;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-icon {
  font-size: 36px;
  color: #C0C4CC;
  margin-left: 20px;
}

.charts-container {
  margin-bottom: 30px;
}

.chart-card {
  height: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
}

.chart-content {
  height: 300px;
  position: relative;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.data-table {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.quality-score {
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>