<template>
  <div class="mrp-matrix-container">
    <div class="matrix-header">
      <h3 class="matrix-title">{{ title || 'MRP矩阵视图' }}</h3>
      <div class="matrix-controls">
        <el-button size="small" type="primary" @click="refreshMatrix">刷新</el-button>
        <el-button size="small" @click="exportToExcel">导出Excel</el-button>
        <el-dropdown trigger="click" @command="handleViewOption">
          <el-button size="small">
            视图选项 <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="showNetDemand">显示净需求</el-dropdown-item>
            <el-dropdown-item command="showGrossDemand">显示毛需求</el-dropdown-item>
            <el-dropdown-item command="showInventory">显示库存状态</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>

    <div class="matrix-filters">
      <el-form :inline="true" :model="filterForm" size="small">
        <el-form-item label="物料类型">
          <el-select v-model="filterForm.materialType" placeholder="选择物料类型">
            <el-option label="原材料" value="raw"></el-option>
            <el-option label="半成品" value="semi"></el-option>
            <el-option label="成品" value="finished"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="短缺状态">
          <el-select v-model="filterForm.shortageStatus" placeholder="选择短缺状态">
            <el-option label="全部" value="all"></el-option>
            <el-option label="短缺" value="shortage"></el-option>
            <el-option label="充足" value="sufficient"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilters">应用筛选</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="matrix-scroll-container">
      <table class="mrp-matrix-table">
        <thead>
          <tr>
            <th class="fixed-column material-info">物料信息</th>
            <th class="fixed-column material-id">物料编码</th>
            <th class="fixed-column material-name">物料名称</th>
            <th class="fixed-column unit">单位</th>
            <th class="fixed-column current-stock">当前库存</th>
            <th class="fixed-column safety-stock">安全库存</th>
            <th v-for="(period, index) in timePeriods" :key="index" class="time-column">
              <div class="period-header">
                <div class="period-date">{{ formatDate(period.date) }}</div>
                <div class="period-type">{{ period.type }}</div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in filteredMatrixData" :key="rowIndex" 
              :class="{ 'highlight-row': row.isHighlighted }">
            <td class="fixed-column material-info">
              <div class="material-icon">
                <i :class="getMaterialIconClass(row.materialType)"></i>
              </div>
            </td>
            <td class="fixed-column material-id">{{ row.materialCode }}</td>
            <td class="fixed-column material-name">{{ row.materialName }}</td>
            <td class="fixed-column unit">{{ row.unit }}</td>
            <td class="fixed-column current-stock" :class="getStockClass(row.currentStock, row.safetyStock)">
              {{ row.currentStock }}
            </td>
            <td class="fixed-column safety-stock">{{ row.safetyStock }}</td>
            <td v-for="(cell, cellIndex) in row.cells" :key="cellIndex" 
                :class="getCellStyle(cell)">
              <div class="cell-content">
                <div v-if="showGrossDemand" class="gross-demand" :class="{ 'negative': cell.grossDemand < 0 }">
                  {{ cell.grossDemand || '-' }}
                </div>
                <div v-if="showNetDemand" class="net-demand" :class="{ 'negative': cell.netDemand < 0, 'positive': cell.netDemand > 0 }">
                  {{ cell.netDemand || '-' }}
                </div>
                <div v-if="showPlannedReceipts" class="planned-receipts">
                  {{ cell.plannedReceipts || '-' }}
                </div>
                <div v-if="showPlannedOrders" class="planned-orders">
                  {{ cell.plannedOrders || '-' }}
                </div>
                <div v-if="showInventory" class="projected-inventory" :class="{ 
                  'below-safety': cell.projectedInventory < row.safetyStock,
                  'negative': cell.projectedInventory < 0 
                }">
                  {{ cell.projectedInventory || '-' }}
                </div>
              </div>
              <div v-if="cell.hasException" class="exception-indicator" 
                   @click="showCellDetails(row, cell, cellIndex)" 
                   title="查看异常详情">
                <i class="el-icon-warning"></i>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页控件 -->
    <div class="matrix-pagination">
      <el-pagination
        background
        :current-page="pagination.currentPage"
        :page-sizes="pagination.pageSizes"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalRows"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 单元格详情对话框 -->
    <el-dialog
      :title="`物料: ${selectedCell ? selectedCell.materialName : ''} - 期间: ${selectedCell ? formatDate(selectedCell.periodDate) : ''}`"
      :visible.sync="cellDetailsVisible"
      width="60%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedCell" class="cell-details">
        <el-descriptions border :column="1">
          <el-descriptions-item label="物料编码">{{ selectedCell.materialCode }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ selectedCell.materialName }}</el-descriptions-item>
          <el-descriptions-item label="当前期间">
            {{ formatDate(selectedCell.periodDate) }} ({{ selectedCell.periodType }})
          </el-descriptions-item>
          <el-descriptions-item label="毛需求">{{ selectedCell.cellData.grossDemand || 0 }}</el-descriptions-item>
          <el-descriptions-item label="计划接收量">{{ selectedCell.cellData.plannedReceipts || 0 }}</el-descriptions-item>
          <el-descriptions-item label="预计库存量">{{ selectedCell.cellData.projectedInventory || 0 }}</el-descriptions-item>
          <el-descriptions-item label="净需求">{{ selectedCell.cellData.netDemand || 0 }}</el-descriptions-item>
          <el-descriptions-item label="计划订单">{{ selectedCell.cellData.plannedOrders || 0 }}</el-descriptions-item>
          <el-descriptions-item label="安全库存">{{ selectedCell.safetyStock }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="selectedCell.cellData.exceptions && selectedCell.cellData.exceptions.length > 0" class="exceptions-section">
          <h4>异常信息</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(exception, index) in selectedCell.cellData.exceptions"
              :key="index"
              :timestamp="exception.timestamp"
              :type="exception.type"
            >
              {{ exception.message }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'MrpMatrix',
  props: {
    title: {
      type: String,
      default: 'MRP矩阵视图'
    },
    initialData: {
      type: Array,
      default: () => []
    },
    timePeriods: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      // 矩阵数据
      matrixData: [],
      // 筛选表单
      filterForm: {
        materialType: '',
        shortageStatus: 'all'
      },
      // 视图选项
      showGrossDemand: true,
      showNetDemand: true,
      showPlannedReceipts: true,
      showPlannedOrders: true,
      showInventory: true,
      // 分页信息
      pagination: {
        currentPage: 1,
        pageSize: 10,
        pageSizes: [10, 20, 50, 100]
      },
      // 单元格详情
      cellDetailsVisible: false,
      selectedCell: null
    }
  },
  computed: {
    // 计算过滤后的数据
    filteredMatrixData() {
      let data = [...this.matrixData]
      
      // 应用物料类型过滤
      if (this.filterForm.materialType) {
        data = data.filter(row => row.materialType === this.filterForm.materialType)
      }
      
      // 应用短缺状态过滤
      if (this.filterForm.shortageStatus !== 'all') {
        if (this.filterForm.shortageStatus === 'shortage') {
          data = data.filter(row => 
            row.cells.some(cell => cell.projectedInventory < row.safetyStock || cell.projectedInventory < 0)
          )
        } else if (this.filterForm.shortageStatus === 'sufficient') {
          data = data.filter(row => 
            !row.cells.some(cell => cell.projectedInventory < row.safetyStock || cell.projectedInventory < 0)
          )
        }
      }
      
      // 分页处理
      const start = (this.pagination.currentPage - 1) * this.pagination.pageSize
      const end = start + this.pagination.pageSize
      return data.slice(start, end)
    },
    // 总数据行数
    totalRows() {
      let data = [...this.matrixData]
      
      // 应用物料类型过滤
      if (this.filterForm.materialType) {
        data = data.filter(row => row.materialType === this.filterForm.materialType)
      }
      
      // 应用短缺状态过滤
      if (this.filterForm.shortageStatus !== 'all') {
        if (this.filterForm.shortageStatus === 'shortage') {
          data = data.filter(row => 
            row.cells.some(cell => cell.projectedInventory < row.safetyStock || cell.projectedInventory < 0)
          )
        } else if (this.filterForm.shortageStatus === 'sufficient') {
          data = data.filter(row => 
            !row.cells.some(cell => cell.projectedInventory < row.safetyStock || cell.projectedInventory < 0)
          )
        }
      }
      
      return data.length
    }
  },
  watch: {
    initialData: {
      handler(newData) {
        if (newData && newData.length > 0) {
          this.matrixData = newData
        } else {
          this.generateMockData()
        }
      },
      immediate: true
    },
    timePeriods: {
      handler(newPeriods) {
        if (newPeriods && newPeriods.length > 0 && this.matrixData.length === 0) {
          this.generateMockData()
        }
      },
      immediate: true
    }
  },
  mounted() {
    // 如果没有提供初始数据，生成模拟数据
    if (!this.initialData || this.initialData.length === 0) {
      this.generateMockData()
    }
  },
  methods: {
    // 生成模拟数据
    generateMockData() {
      const periods = this.timePeriods.length > 0 ? this.timePeriods : this.generateTimePeriods(12)
      
      const materials = [
        { code: 'RM001', name: '钢材', type: 'raw', unit: '吨' },
        { code: 'RM002', name: '铝材', type: 'raw', unit: '吨' },
        { code: 'RM003', name: '塑料粒子', type: 'raw', unit: '公斤' },
        { code: 'SM001', name: '机加工件A', type: 'semi', unit: '件' },
        { code: 'SM002', name: '焊接组件B', type: 'semi', unit: '套' },
        { code: 'SM003', name: '电子模块C', type: 'semi', unit: '个' },
        { code: 'FG001', name: '成品设备X', type: 'finished', unit: '台' },
        { code: 'FG002', name: '成品设备Y', type: 'finished', unit: '台' },
        { code: 'FG003', name: '配件包Z', type: 'finished', unit: '套' }
      ]
      
      this.matrixData = materials.map(material => {
        const currentStock = Math.floor(Math.random() * 1000)
        const safetyStock = Math.floor(currentStock * 0.3)
        
        return {
          materialCode: material.code,
          materialName: material.name,
          materialType: material.type,
          unit: material.unit,
          currentStock,
          safetyStock,
          isHighlighted: material.type === 'finished',
          cells: periods.map(period => this.generateCellData(material, period, currentStock, safetyStock))
        }
      })
    },
    // 生成时间周期
    generateTimePeriods(count) {
      const periods = []
      const today = new Date()
      
      for (let i = 0; i < count; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i * 7) // 每周
        
        periods.push({
          date: date.toISOString().split('T')[0],
          type: i % 4 === 0 ? '季度' : i % 2 === 0 ? '双周' : '周'
        })
      }
      
      return periods
    },
    // 生成单元格数据
    generateCellData(material, period, currentStock, safetyStock) {
      const baseValue = Math.floor(Math.random() * 100)
      const grossDemand = material.type === 'finished' ? baseValue * 2 : baseValue
      const plannedReceipts = Math.floor(Math.random() * 50)
      const projectedInventory = Math.max(0, currentStock + plannedReceipts - grossDemand)
      const netDemand = projectedInventory < safetyStock ? safetyStock - projectedInventory : 0
      const plannedOrders = netDemand > 0 ? Math.ceil(netDemand / 20) * 20 : 0 // 按20的倍数
      
      // 随机生成异常信息
      const hasException = projectedInventory < safetyStock || projectedInventory < 0
      const exceptions = hasException ? [{
        type: projectedInventory < 0 ? 'danger' : 'warning',
        message: projectedInventory < 0 ? '库存不足' : '低于安全库存',
        timestamp: new Date().toLocaleString()
      }] : []
      
      return {
        grossDemand,
        plannedReceipts,
        projectedInventory,
        netDemand,
        plannedOrders,
        hasException,
        exceptions
      }
    },
    // 获取物料图标类名
    getMaterialIconClass(materialType) {
      switch (materialType) {
        case 'raw':
          return 'el-icon-document-text'
        case 'semi':
          return 'el-icon-s-operation'
        case 'finished':
          return 'el-icon-goods'
        default:
          return 'el-icon-help'
      }
    },
    // 获取库存样式类名
    getStockClass(stock, safetyStock) {
      if (stock < 0) return 'stock-negative'
      if (stock < safetyStock) return 'stock-below-safety'
      return 'stock-sufficient'
    },
    // 获取单元格样式类名
    getCellStyle(cell) {
      const classes = []
      if (cell.projectedInventory < 0) classes.push('cell-negative')
      if (cell.projectedInventory < this.safetyStock) classes.push('cell-below-safety')
      if (cell.hasException) classes.push('cell-exception')
      return classes
    },
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },
    // 应用筛选
    applyFilters() {
      this.pagination.currentPage = 1 // 重置为第一页
    },
    // 重置筛选
    resetFilters() {
      this.filterForm = {
        materialType: '',
        shortageStatus: 'all'
      }
      this.pagination.currentPage = 1
    },
    // 处理视图选项
    handleViewOption(command) {
      switch (command) {
        case 'showNetDemand':
          this.showNetDemand = true
          this.showGrossDemand = false
          this.showInventory = false
          break
        case 'showGrossDemand':
          this.showNetDemand = false
          this.showGrossDemand = true
          this.showInventory = false
          break
        case 'showInventory':
          this.showNetDemand = false
          this.showGrossDemand = false
          this.showInventory = true
          break
      }
    },
    // 显示单元格详情
    showCellDetails(row, cell, cellIndex) {
      this.selectedCell = {
        materialCode: row.materialCode,
        materialName: row.materialName,
        periodDate: this.timePeriods[cellIndex]?.date,
        periodType: this.timePeriods[cellIndex]?.type,
        safetyStock: row.safetyStock,
        cellData: cell
      }
      this.cellDetailsVisible = true
    },
    // 刷新矩阵数据
    refreshMatrix() {
      this.$emit('refresh')
      // 如果没有外部数据源，重新生成模拟数据
      this.generateMockData()
    },
    // 导出Excel
    exportToExcel() {
      // 这里可以实现实际的Excel导出逻辑
      this.$message.success('导出成功！')
    },
    // 分页处理
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.currentPage = 1
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
    }
  }
}
</script>

<style scoped>
.mrp-matrix-container {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.matrix-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.matrix-controls {
  display: flex;
  gap: 8px;
}

.matrix-filters {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.matrix-scroll-container {
  flex: 1;
  overflow: auto;
  position: relative;
  min-height: 400px;
}

.mrp-matrix-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.mrp-matrix-table th,
.mrp-matrix-table td {
  padding: 8px;
  text-align: center;
  border: 1px solid #e0e0e0;
  min-width: 100px;
}

.mrp-matrix-table th {
  background-color: #f5f7fa;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 10;
}

.mrp-matrix-table td {
  position: relative;
}

.fixed-column {
  position: sticky;
  left: 0;
  background-color: #fafafa;
  z-index: 5;
  min-width: 120px;
}

.fixed-column.material-info {
  left: 0;
  width: 60px;
  min-width: 60px;
}

.fixed-column.material-id {
  left: 60px;
  width: 100px;
}

.fixed-column.material-name {
  left: 160px;
  width: 140px;
}

.fixed-column.unit {
  left: 300px;
  width: 80px;
}

.fixed-column.current-stock {
  left: 380px;
  width: 100px;
}

.fixed-column.safety-stock {
  left: 480px;
  width: 100px;
}

.time-column {
  min-width: 120px;
}

.period-header {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.period-date {
  font-size: 12px;
  font-weight: 500;
}

.period-type {
  font-size: 10px;
  color: #909399;
}

.cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 12px;
}

.cell-content > div {
  width: 100%;
  padding: 2px 0;
}

.gross-demand {
  color: #606266;
}

.gross-demand.negative {
  color: #f56c6c;
}

.net-demand {
  font-weight: 500;
  color: #606266;
}

.net-demand.negative {
  color: #f56c6c;
}

.net-demand.positive {
  color: #67c23a;
}

.planned-receipts {
  color: #409eff;
}

.planned-orders {
  color: #e6a23c;
  font-weight: 500;
}

.projected-inventory {
  font-weight: 500;
}

.projected-inventory.below-safety {
  color: #e6a23c;
}

.projected-inventory.negative {
  color: #f56c6c;
}

.exception-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  color: #e6a23c;
  cursor: pointer;
}

.exception-indicator:hover {
  color: #f56c6c;
}

.highlight-row {
  background-color: #f0f9ff;
}

.stock-negative {
  color: #f56c6c;
  font-weight: bold;
}

.stock-below-safety {
  color: #e6a23c;
  font-weight: 500;
}

.stock-sufficient {
  color: #67c23a;
}

.cell-negative {
  background-color: #fef0f0;
}

.cell-below-safety {
  background-color: #fdf6ec;
}

.cell-exception {
  border: 2px solid #e6a23c;
}

.material-icon {
  font-size: 16px;
  display: flex;
  justify-content: center;
}

.matrix-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.cell-details {
  padding: 10px;
}

.exceptions-section {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #e0e0e0;
}

.exceptions-section h4 {
  margin-bottom: 10px;
  color: #606266;
}
</style>