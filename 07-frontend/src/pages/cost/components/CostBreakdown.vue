<template>
  <div class="cost-breakdown-container">
    <div class="filter-section">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="成本期间">
          <el-date-picker
            v-model="filterForm.period"
            type="month"
            placeholder="选择月份"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="成本类型">
          <el-select v-model="filterForm.costType" placeholder="选择成本类型" clearable>
            <el-option label="直接成本" value="direct" />
            <el-option label="间接成本" value="indirect" />
            <el-option label="固定成本" value="fixed" />
            <el-option label="变动成本" value="variable" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="filterForm.department" placeholder="选择部门" clearable>
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="refreshData" icon="el-icon-search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="breakdown-content">
      <!-- 成本构成图表 -->
      <div class="chart-section">
        <div class="chart-card">
          <div class="chart-header">
            <h3>成本构成分析</h3>
          </div>
          <div class="chart-content">
            <div ref="pieChart" class="chart"></div>
          </div>
        </div>
      </div>
      
      <!-- 成本明细表格 -->
      <div class="table-section">
        <div class="table-header">
          <h3>成本明细</h3>
          <el-button type="primary" size="small" @click="exportData" icon="el-icon-download">导出</el-button>
        </div>
        <el-table
          :data="filteredCostDetails"
          style="width: 100%"
          border
          @sort-change="handleSortChange"
        >
          <el-table-column prop="code" label="成本编码" width="120" />
          <el-table-column prop="name" label="成本项目" width="200">
            <template v-slot="scope">
              <el-tooltip :content="scope.row.description" placement="top">
                <div class="cost-item-name">{{ scope.row.name }}</div>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="成本类别" width="120">
            <template v-slot="scope">
              <el-tag :type="getCategoryTag(scope.row.category)">{{ scope.row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="department" label="所属部门" width="100" />
          <el-table-column prop="amount" label="成本金额" width="120" sortable="custom">
            <template v-slot="scope">
              <span class="amount">{{ formatCurrency(scope.row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="percentage" label="占比" width="100" sortable="custom">
            <template v-slot="scope">
              <div class="percentage-info">
                <span class="percentage">{{ scope.row.percentage.toFixed(2) }}%</span>
                <el-progress :percentage="scope.row.percentage" :stroke-width="6" />
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="trend" label="趋势" width="100">
            <template v-slot="scope">
              <span :class="getTrendClass(scope.row.trend)">
                <i :class="getTrendIcon(scope.row.trend)"></i>
                {{ scope.row.trend }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="responsible" label="负责人" width="100" />
          <el-table-column prop="period" label="期间" width="120" />
          <el-table-column label="操作" width="120" fixed="right">
            <template v-slot="scope">
              <el-button size="mini" type="primary" @click="viewDetails(scope.row)" icon="el-icon-view">查看</el-button>
              <el-button size="mini" type="success" @click="editCost(scope.row)" icon="el-icon-edit">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            background
            layout="prev, pager, next, jumper, sizes, total"
            :total="filteredCostDetails.length"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
    
    <!-- 成本详情对话框 -->
    <el-dialog
      :title="dialog.title"
      :visible.sync="dialog.visible"
      width="70%"
      :close-on-click-modal="false"
    >
      <div v-if="dialog.type === 'view'" class="cost-detail-content">
        <div class="detail-card">
          <div class="detail-header">
            <h3>{{ currentCost.name }}</h3>
            <div class="detail-meta">
              <span class="meta-item"><strong>编码:</strong> {{ currentCost.code }}</span>
              <span class="meta-item"><strong>类别:</strong> {{ currentCost.category }}</span>
              <span class="meta-item"><strong>期间:</strong> {{ currentCost.period }}</span>
            </div>
          </div>
          
          <div class="detail-body">
            <div class="detail-row">
              <div class="detail-item">
                <label>成本金额:</label>
                <span class="cost-amount">{{ formatCurrency(currentCost.amount) }}</span>
              </div>
              <div class="detail-item">
                <label>占总成本比例:</label>
                <span>{{ currentCost.percentage.toFixed(2) }}%</span>
              </div>
              <div class="detail-item">
                <label>同比变化:</label>
                <span :class="getTrendClass(currentCost.trend)">
                  <i :class="getTrendIcon(currentCost.trend)"></i>
                  {{ currentCost.trend }}%
                </span>
              </div>
              <div class="detail-item">
                <label>负责人:</label>
                <span>{{ currentCost.responsible }}</span>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>成本描述</h4>
              <p>{{ currentCost.description || '暂无描述信息' }}</p>
            </div>
            
            <div class="detail-section">
              <h4>成本构成明细</h4>
              <el-table
                :data="currentCost.compositionDetails"
                style="width: 100%"
                size="small"
              >
                <el-table-column prop="item" label="子项" width="180" />
                <el-table-column prop="amount" label="金额">
                  <template v-slot="scope">{{ formatCurrency(scope.row.amount) }}</template>
                </el-table-column>
                <el-table-column prop="percentage" label="占比" width="100">
                  <template v-slot="scope">{{ scope.row.percentage.toFixed(2) }}%</template>
                </el-table-column>
                <el-table-column prop="notes" label="说明" />
              </el-table>
            </div>
            
            <div class="detail-section">
              <h4>历史趋势</h4>
              <div ref="trendChart" class="trend-chart"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="cost-edit-content">
        <el-form ref="costForm" :model="costForm" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="成本编码" prop="code" :rules="[{ required: true, message: '请输入成本编码', trigger: 'blur' }]">
                <el-input v-model="costForm.code" placeholder="请输入成本编码" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="成本项目" prop="name" :rules="[{ required: true, message: '请输入成本项目', trigger: 'blur' }]">
                <el-input v-model="costForm.name" placeholder="请输入成本项目" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="成本类别" prop="category" :rules="[{ required: true, message: '请选择成本类别', trigger: 'change' }]">
                <el-select v-model="costForm.category" placeholder="请选择成本类别">
                  <el-option label="人力成本" value="人力成本" />
                  <el-option label="原材料" value="原材料" />
                  <el-option label="制造费用" value="制造费用" />
                  <el-option label="管理费用" value="管理费用" />
                  <el-option label="销售费用" value="销售费用" />
                  <el-option label="研发费用" value="研发费用" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属部门" prop="department" :rules="[{ required: true, message: '请输入所属部门', trigger: 'blur' }]">
                <el-input v-model="costForm.department" placeholder="请输入所属部门" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="成本金额" prop="amount" :rules="[{ required: true, message: '请输入成本金额', trigger: 'blur' }]">
                <el-input-number v-model.number="costForm.amount" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="负责人" prop="responsible" :rules="[{ required: true, message: '请输入负责人', trigger: 'blur' }]">
                <el-input v-model="costForm.responsible" placeholder="请输入负责人" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="成本描述" prop="description">
                <el-input v-model="costForm.description" type="textarea" rows="3" placeholder="请输入成本描述" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        
        <!-- 成本构成明细 -->
        <div class="composition-section">
          <h4>成本构成明细</h4>
          <el-table
            :data="costForm.compositionDetails"
            style="width: 100%"
            border
            size="small"
          >
            <el-table-column prop="item" label="子项" width="150">
              <template v-slot="scope">
                <el-input v-model="scope.row.item" placeholder="子项名称" />
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120">
              <template v-slot="scope">
                <el-input-number v-model.number="scope.row.amount" :min="0" :precision="2" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="说明">
              <template v-slot="scope">
                <el-input v-model="scope.row.notes" placeholder="说明" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template v-slot="scope">
                <el-button type="danger" size="mini" @click="removeCompositionItem(scope.row)" icon="el-icon-delete" />
              </template>
            </el-table-column>
          </el-table>
          <div class="composition-footer">
            <el-button type="primary" size="small" @click="addCompositionItem" icon="el-icon-plus">添加明细项</el-button>
          </div>
        </div>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button v-if="dialog.type !== 'view'" type="primary" @click="saveCost">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'CostBreakdown',
  data() {
    return {
      filterForm: {
        period: new Date(),
        costType: '',
        department: ''
      },
      departments: [
        { id: 1, name: '财务部' },
        { id: 2, name: '研发部' },
        { id: 3, name: '销售部' },
        { id: 4, name: '生产部' },
        { id: 5, name: '行政部' }
      ],
      costDetails: [
        {
          id: 1,
          code: 'CD001',
          name: '员工薪资',
          category: '人力成本',
          department: '研发部',
          amount: 250000,
          percentage: 35.21,
          trend: 2.5,
          responsible: '张三',
          period: '2023-10',
          description: '研发部门月度人员薪资费用'
        },
        {
          id: 2,
          code: 'CD002',
          name: '原材料采购',
          category: '原材料',
          department: '生产部',
          amount: 180000,
          percentage: 25.35,
          trend: -1.8,
          responsible: '李四',
          period: '2023-10',
          description: '主要原材料采购成本'
        },
        {
          id: 3,
          code: 'CD003',
          name: '设备折旧',
          category: '制造费用',
          department: '生产部',
          amount: 85000,
          percentage: 11.97,
          trend: 0,
          responsible: '王五',
          period: '2023-10',
          description: '生产设备月度折旧'
        },
        {
          id: 4,
          code: 'CD004',
          name: '办公费用',
          category: '管理费用',
          department: '行政部',
          amount: 45000,
          percentage: 6.34,
          trend: 1.2,
          responsible: '赵六',
          period: '2023-10',
          description: '公司日常办公开支'
        },
        {
          id: 5,
          code: 'CD005',
          name: '市场推广',
          category: '销售费用',
          department: '销售部',
          amount: 75000,
          percentage: 10.56,
          trend: 5.3,
          responsible: '钱七',
          period: '2023-10',
          description: '产品市场推广费用'
        },
        {
          id: 6,
          code: 'CD006',
          name: '研发项目费用',
          category: '研发费用',
          department: '研发部',
          amount: 75000,
          percentage: 10.56,
          trend: 8.7,
          responsible: '孙八',
          period: '2023-10',
          description: '新产品研发投入'
        }
      ],
      pageSize: 10,
      currentPage: 1,
      sortField: '',
      sortOrder: '',
      dialog: {
        visible: false,
        title: '',
        type: 'view' // view, edit
      },
      currentCost: {},
      costForm: {
        code: '',
        name: '',
        category: '',
        department: '',
        amount: 0,
        responsible: '',
        description: '',
        compositionDetails: []
      },
      pieChart: null,
      trendChart: null
    }
  },
  computed: {
    filteredCostDetails() {
      let result = [...this.costDetails]
      
      // 按字段排序
      if (this.sortField) {
        result.sort((a, b) => {
          let valueA = a[this.sortField]
          let valueB = b[this.sortField]
          
          if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase()
            valueB = valueB.toLowerCase()
          }
          
          if (this.sortOrder === 'ascending') {
            return valueA > valueB ? 1 : -1
          } else {
            return valueA < valueB ? 1 : -1
          }
        })
      }
      
      return result
    },
    paginatedCostDetails() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredCostDetails.slice(start, end)
    },
    chartData() {
      return this.costDetails.map(item => ({
        name: item.name,
        value: item.amount
      }))
    }
  },
  mounted() {
    this.initPieChart()
    this.$nextTick(() => {
      window.addEventListener('resize', this.handleResize)
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this.pieChart) {
      this.pieChart.dispose()
    }
    if (this.trendChart) {
      this.trendChart.dispose()
    }
  },
  methods: {
    formatCurrency(amount) {
      return '¥' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    
    initPieChart() {
      const chartDom = this.$refs.pieChart
      if (!chartDom) return
      
      this.pieChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: this.chartData.map(item => item.name)
        },
        series: [
          {
            name: '成本构成',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: this.chartData
          }
        ]
      }
      this.pieChart.setOption(option)
    },
    
    initTrendChart() {
      const chartDom = this.$refs.trendChart
      if (!chartDom) return
      
      this.trendChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            let result = params[0].name + '<br/>'
            params.forEach(param => {
              result += `${param.marker}${param.seriesName}: ¥${param.value.toLocaleString()}<br/>`
            })
            return result
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月']
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: function(value) {
              return (value / 10000) + '万'
            }
          }
        },
        series: [
          {
            name: '成本金额',
            type: 'line',
            smooth: true,
            data: [220000, 230000, 225000, 240000, 245000, 250000, 248000, 252000, 255000, 250000]
          }
        ]
      }
      this.trendChart.setOption(option)
    },
    
    handleResize() {
      if (this.pieChart) {
        this.pieChart.resize()
      }
      if (this.trendChart) {
        this.trendChart.resize()
      }
    },
    
    getCategoryTag(category) {
      const tagMap = {
        '人力成本': 'primary',
        '原材料': 'success',
        '制造费用': 'warning',
        '管理费用': 'info',
        '销售费用': 'danger',
        '研发费用': 'purple'
      }
      return tagMap[category] || 'info'
    },
    
    getTrendClass(trend) {
      if (trend > 0) return 'trend-up'
      if (trend < 0) return 'trend-down'
      return 'trend-flat'
    },
    
    getTrendIcon(trend) {
      if (trend > 0) return 'el-icon-arrow-up'
      if (trend < 0) return 'el-icon-arrow-down'
      return 'el-icon-minus'
    },
    
    handleSortChange({ prop, order }) {
      this.sortField = prop
      this.sortOrder = order
    },
    
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    },
    
    handleCurrentChange(current) {
      this.currentPage = current
    },
    
    refreshData() {
      // 模拟刷新数据
      this.$message.success('数据已刷新')
    },
    
    exportData() {
      // 模拟导出数据
      this.$message.success('导出成功')
    },
    
    viewDetails(cost) {
      this.currentCost = { ...cost }
      // 模拟加载详细数据
      this.currentCost.compositionDetails = [
        { item: '基本工资', amount: 150000, percentage: 60, notes: '月度基本工资' },
        { item: '绩效奖金', amount: 60000, percentage: 24, notes: '月度绩效发放' },
        { item: '社保公积金', amount: 30000, percentage: 12, notes: '社保及公积金缴纳' },
        { item: '其他补贴', amount: 10000, percentage: 4, notes: '交通、餐补等' }
      ]
      this.dialog = {
        visible: true,
        title: `成本详情 - ${cost.name}`,
        type: 'view'
      }
      this.$nextTick(() => {
        this.initTrendChart()
      })
    },
    
    editCost(cost) {
      this.costForm = {
        code: cost.code,
        name: cost.name,
        category: cost.category,
        department: cost.department,
        amount: cost.amount,
        responsible: cost.responsible,
        description: cost.description || '',
        compositionDetails: [
          { id: 1, item: '基本工资', amount: 150000, notes: '月度基本工资' },
          { id: 2, item: '绩效奖金', amount: 60000, notes: '月度绩效发放' }
        ]
      }
      this.dialog = {
        visible: true,
        title: `编辑成本 - ${cost.name}`,
        type: 'edit'
      }
    },
    
    addCompositionItem() {
      this.costForm.compositionDetails.push({
        id: Date.now(),
        item: '',
        amount: 0,
        notes: ''
      })
    },
    
    removeCompositionItem(item) {
      const index = this.costForm.compositionDetails.findIndex(i => i.id === item.id)
      if (index > -1) {
        this.costForm.compositionDetails.splice(index, 1)
      }
    },
    
    saveCost() {
      // 模拟保存操作
      setTimeout(() => {
        this.dialog.visible = false
        this.$message.success('保存成功')
      }, 500)
    }
  }
}
</script>

<style scoped>
.cost-breakdown-container {
  padding: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-form {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.breakdown-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.chart-section {
  height: fit-content;
}

.chart-card {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.chart-header {
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.chart-content {
  height: 400px;
}

.chart {
  width: 100%;
  height: 100%;
}

.table-section {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.table-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.amount {
  font-weight: bold;
  color: #303133;
}

.percentage-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.percentage {
  font-weight: bold;
  color: #409eff;
}

.trend-up {
  color: #f56c6c;
}

.trend-down {
  color: #67c23a;
}

.trend-flat {
  color: #909399;
}

.cost-item-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 对话框样式 */
.cost-detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.detail-card {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 0;
}

.detail-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.detail-header h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.detail-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 14px;
  color: #606266;
}

.detail-body {
  padding: 20px;
}

.detail-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-item label {
  font-size: 14px;
  color: #606266;
}

.cost-amount {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.detail-section {
  margin-top: 25px;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.detail-section p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.trend-chart {
  width: 100%;
  height: 300px;
}

.cost-edit-content {
  max-height: 600px;
  overflow-y: auto;
}

.composition-section {
  margin-top: 30px;
}

.composition-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.composition-footer {
  margin-top: 15px;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .breakdown-content {
    grid-template-columns: 1fr;
  }
  
  .chart-content {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .detail-row {
    grid-template-columns: 1fr;
  }
  
  .detail-meta {
    flex-direction: column;
    gap: 10px;
  }
}
</style>