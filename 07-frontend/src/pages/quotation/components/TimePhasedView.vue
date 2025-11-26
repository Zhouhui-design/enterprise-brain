<template>
  <div class="time-phased-view-container">
    <div class="view-header">
      <h3 class="view-title">{{ title || '时间分段视图' }}</h3>
      <div class="view-controls">
        <el-select v-model="periodType" size="small" @change="updateTimePeriods" placeholder="周期类型">
          <el-option label="日" value="day"></el-option>
          <el-option label="周" value="week"></el-option>
          <el-option label="月" value="month"></el-option>
          <el-option label="季度" value="quarter"></el-option>
        </el-select>
        <el-select v-model="timeSpan" size="small" @change="updateTimePeriods" placeholder="时间跨度">
          <el-option label="8个周期" value="8"></el-option>
          <el-option label="12个周期" value="12"></el-option>
          <el-option label="24个周期" value="24"></el-option>
          <el-option label="36个周期" value="36"></el-option>
        </el-select>
        <el-button size="small" type="primary" @click="refreshData">刷新</el-button>
        <el-button size="small" @click="exportData">导出数据</el-button>
        <el-dropdown trigger="click" @command="handleViewOption">
          <el-button size="small">
            视图选项 <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="showAll">显示全部列</el-dropdown-item>
            <el-dropdown-item command="showKeyOnly">仅显示关键列</el-dropdown-item>
            <el-dropdown-item command="customizeColumns">自定义列</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>

    <!-- 物料选择器 -->
    <div class="material-selector">
      <el-form :inline="true" :model="materialFilter" size="small">
        <el-form-item label="物料编码">
          <el-input v-model="materialFilter.code" placeholder="输入物料编码" clearable></el-input>
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="materialFilter.name" placeholder="输入物料名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="物料类型">
          <el-select v-model="materialFilter.type" placeholder="选择物料类型" clearable>
            <el-option label="原材料" value="raw"></el-option>
            <el-option label="半成品" value="semi"></el-option>
            <el-option label="成品" value="finished"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchMaterials">搜索</el-button>
          <el-button @click="clearMaterialFilter">清空</el-button>
        </el-form-item>
      </el-form>
      
      <div class="material-selection">
        <el-transfer
          v-model="selectedMaterialKeys"
          :data="filteredMaterials"
          :titles="['可选物料', '已选物料']"
          :props="{ key: 'id', label: 'displayName', disabled: 'disabled' }"
          @change="onMaterialSelectionChange"
        ></el-transfer>
      </div>
    </div>

    <!-- 时间分段视图内容 -->
    <div class="time-phased-content">
      <!-- 固定表头区域 -->
      <div class="fixed-headers">
        <table class="time-phased-table">
          <thead>
            <tr>
              <th class="material-info-col">物料信息</th>
              <th class="material-code-col">物料编码</th>
              <th class="material-name-col">物料名称</th>
              <th class="unit-col">单位</th>
              <th class="current-stock-col">当前库存</th>
              <th class="safety-stock-col">安全库存</th>
              <th class="lead-time-col">提前期</th>
            </tr>
          </thead>
        </table>
      </div>
      
      <!-- 滚动内容区域 -->
      <div class="scrollable-content">
        <table class="time-phased-table">
          <!-- 周期表头 -->
          <thead>
            <tr>
              <th class="spacer-col"></th>
              <th class="spacer-col"></th>
              <th class="spacer-col"></th>
              <th class="spacer-col"></th>
              <th class="spacer-col"></th>
              <th class="spacer-col"></th>
              <th class="spacer-col"></th>
              <th v-for="(period, index) in timePeriods" :key="index" class="period-header-cell" :colspan="visibleDataTypes.length">
                <div class="period-info">
                  <div class="period-label">{{ formatPeriodLabel(period) }}</div>
                  <div class="period-date">{{ formatPeriodDate(period) }}</div>
                </div>
              </th>
            </tr>
            <tr>
              <th class="spacer-col"></th>
              <th class="spacer-col"></th>
              <th class="spacer-col"></th>
              <th class="spacer-col"></th>
              <th class="spacer-col"></th>
              <th class="spacer-col"></th>
              <th class="spacer-col"></th>
              <th v-for="period in timePeriods" v-for="type in visibleDataTypes" :key="`${period.id}-${type.key}`" 
                  class="data-type-cell" :class="getDataTypeClass(type.key)">
                {{ type.label }}
              </th>
            </tr>
          </thead>
          
          <!-- 数据行 -->
          <tbody>
            <tr v-for="(material, materialIndex) in displayedMaterials" :key="materialIndex">
              <!-- 物料基本信息 -->
              <td class="material-info-col">
                <div class="material-icon">
                  <i :class="getMaterialIconClass(material.type)"></i>
                </div>
              </td>
              <td class="material-code-col">{{ material.code }}</td>
              <td class="material-name-col">{{ material.name }}</td>
              <td class="unit-col">{{ material.unit }}</td>
              <td class="current-stock-col" :class="getStockClass(material.currentStock, material.safetyStock)">
                {{ material.currentStock }}
              </td>
              <td class="safety-stock-col">{{ material.safetyStock }}</td>
              <td class="lead-time-col">{{ material.leadTime }}天</td>
              
              <!-- 时间分段数据 -->
              <td v-for="(period, periodIndex) in timePeriods" v-for="type in visibleDataTypes" :key="`${material.id}-${period.id}-${type.key}`"
                  class="data-cell" 
                  :class="getCellStyle(material, period, type.key)"
                  @dblclick="startEditing(material, period, type.key)">
                <div v-if="!isEditing(material.id, period.id, type.key)" class="cell-value">
                  {{ getCellValue(material, period, type.key) }}
                  <div v-if="hasException(material, period, type.key)" class="exception-indicator" 
                       @click.stop="showExceptionDetails(material, period)">
                    <i class="el-icon-warning"></i>
                  </div>
                </div>
                <div v-else class="cell-edit">
                  <el-input-number
                    v-model="editValue"
                    :min="0"
                    :step="1"
                    :precision="0"
                    size="small"
                    @blur="saveEdit(material, period, type.key)"
                    @change="saveEdit(material, period, type.key)"
                    ref="editInput"
                  ></el-input-number>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 数据类型切换 -->
    <div class="data-type-toggle">
      <el-checkbox-group v-model="enabledDataTypes" @change="onDataTypeChange">
        <el-checkbox-button v-for="type in dataTypeOptions" :key="type.key" :label="type.key">
          {{ type.label }}
        </el-checkbox-button>
      </el-checkbox-group>
    </div>

    <!-- 统计信息 -->
    <div class="summary-stats">
      <el-card class="stat-card" v-for="stat in summaryStatistics" :key="stat.key">
        <div class="stat-content">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value" :class="stat.valueClass">{{ stat.value }}</div>
        </div>
      </el-card>
    </div>

    <!-- 异常详情对话框 -->
    <el-dialog
      title="异常详情"
      :visible.sync="exceptionDetailsVisible"
      width="50%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedException" class="exception-details">
        <el-descriptions border :column="1">
          <el-descriptions-item label="物料编码">{{ selectedException.material.code }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ selectedException.material.name }}</el-descriptions-item>
          <el-descriptions-item label="期间">
            {{ formatPeriodLabel(selectedException.period) }} ({{ formatPeriodDate(selectedException.period) }})
          </el-descriptions-item>
          <el-descriptions-item label="异常类型">{{ getExceptionTypeLabel(selectedException.exception.type) }}</el-descriptions-item>
          <el-descriptions-item label="异常描述">{{ selectedException.exception.description }}</el-descriptions-item>
          <el-descriptions-item label="严重程度">
            <el-tag :type="getExceptionSeverityType(selectedException.exception.severity)">
              {{ getExceptionSeverityLabel(selectedException.exception.severity) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="建议操作">{{ selectedException.exception.suggestion }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 自定义列对话框 -->
    <el-dialog
      title="自定义列显示"
      :visible.sync="customizeColumnsVisible"
      width="40%"
      :close-on-click-modal="false"
    >
      <el-checkbox-group v-model="enabledDataTypes">
        <div v-for="type in dataTypeOptions" :key="type.key" class="customize-item">
          <el-checkbox :label="type.key">{{ type.label }}</el-checkbox>
          <div class="data-type-description">{{ type.description }}</div>
        </div>
      </el-checkbox-group>
      <div slot="footer" class="dialog-footer">
        <el-button @click="customizeColumnsVisible = false">取消</el-button>
        <el-button type="primary" @click="applyColumnSettings">应用</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'TimePhasedView',
  props: {
    title: {
      type: String,
      default: '时间分段视图'
    },
    initialData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      // 周期设置
      periodType: 'week',
      timeSpan: '12',
      timePeriods: [],
      
      // 物料数据
      materials: [],
      selectedMaterialKeys: [],
      materialFilter: {
        code: '',
        name: '',
        type: ''
      },
      
      // 数据类型选项
      dataTypeOptions: [
        { key: 'grossDemand', label: '毛需求', description: '期间内的总需求数量' },
        { key: 'scheduledReceipts', label: '计划接收', description: '已安排但尚未入库的数量' },
        { key: 'projectedInventory', label: '预计库存', description: '期间结束时的预计库存数量' },
        { key: 'netDemand', label: '净需求', description: '考虑库存后的实际需求数量' },
        { key: 'plannedOrders', label: '计划订单', description: '建议下达的订单数量' },
        { key: 'plannedDeliveries', label: '计划交付', description: '计划在该期间交付的数量' }
      ],
      
      // 启用的数据类型
      enabledDataTypes: ['grossDemand', 'projectedInventory', 'netDemand', 'plannedOrders'],
      
      // 编辑状态
      editingCell: null, // { materialId, periodId, dataType }
      editValue: null,
      
      // 异常详情
      exceptionDetailsVisible: false,
      selectedException: null,
      
      // 自定义列对话框
      customizeColumnsVisible: false
    }
  },
  computed: {
    // 过滤后的物料列表
    filteredMaterials() {
      let materials = [...this.materials]
      
      if (this.materialFilter.code) {
        materials = materials.filter(m => m.code.includes(this.materialFilter.code))
      }
      
      if (this.materialFilter.name) {
        materials = materials.filter(m => m.name.includes(this.materialFilter.name))
      }
      
      if (this.materialFilter.type) {
        materials = materials.filter(m => m.type === this.materialFilter.type)
      }
      
      // 格式化显示名称
      return materials.map(m => ({
        ...m,
        displayName: `${m.code} - ${m.name}`
      }))
    },
    
    // 显示的物料数据（包含时间分段数据）
    displayedMaterials() {
      return this.materials
        .filter(m => this.selectedMaterialKeys.includes(m.id))
        .map(material => {
          // 为每个物料生成时间分段数据
          const timeData = {}
          this.timePeriods.forEach(period => {
            timeData[period.id] = this.generateTimePeriodData(material, period)
          })
          
          return {
            ...material,
            timeData
          }
        })
    },
    
    // 可见的数据类型
    visibleDataTypes() {
      return this.dataTypeOptions.filter(type => this.enabledDataTypes.includes(type.key))
    },
    
    // 汇总统计
    summaryStatistics() {
      const totalMaterials = this.displayedMaterials.length
      let totalShortages = 0
      let totalExceptions = 0
      let totalPlannedOrders = 0
      
      this.displayedMaterials.forEach(material => {
        this.timePeriods.forEach(period => {
          const data = material.timeData[period.id]
          if (data.netDemand > 0) totalShortages++
          if (data.exceptions && data.exceptions.length > 0) totalExceptions++
          totalPlannedOrders += data.plannedOrders || 0
        })
      })
      
      return [
        {
          key: 'totalMaterials',
          label: '物料总数',
          value: totalMaterials,
          valueClass: 'value-primary'
        },
        {
          key: 'totalShortages',
          label: '短缺项数',
          value: totalShortages,
          valueClass: totalShortages > 0 ? 'value-danger' : 'value-success'
        },
        {
          key: 'totalExceptions',
          label: '异常项数',
          value: totalExceptions,
          valueClass: totalExceptions > 0 ? 'value-warning' : 'value-success'
        },
        {
          key: 'totalPlannedOrders',
          label: '计划订单量',
          value: totalPlannedOrders,
          valueClass: 'value-info'
        }
      ]
    }
  },
  watch: {
    initialData: {
      handler(newData) {
        if (newData && newData.length > 0) {
          this.materials = newData
          this.updateTimePeriods()
        } else {
          this.generateMockData()
        }
      },
      immediate: true
    }
  },
  mounted() {
    // 初始化时间周期
    this.updateTimePeriods()
    
    // 如果没有提供初始数据，生成模拟数据
    if (!this.initialData || this.initialData.length === 0) {
      this.generateMockData()
    }
  },
  methods: {
    // 生成模拟数据
    generateMockData() {
      const materialTemplates = [
        { code: 'RM001', name: '钢材', type: 'raw', unit: '吨', leadTime: 15 },
        { code: 'RM002', name: '铝材', type: 'raw', unit: '吨', leadTime: 12 },
        { code: 'RM003', name: '铜材', type: 'raw', unit: '吨', leadTime: 10 },
        { code: 'RM004', name: '塑料粒子', type: 'raw', unit: '公斤', leadTime: 7 },
        { code: 'SM001', name: '机加工件A', type: 'semi', unit: '件', leadTime: 5 },
        { code: 'SM002', name: '焊接组件B', type: 'semi', unit: '套', leadTime: 8 },
        { code: 'SM003', name: '电子模块C', type: 'semi', unit: '个', leadTime: 6 },
        { code: 'FG001', name: '成品设备X', type: 'finished', unit: '台', leadTime: 12 },
        { code: 'FG002', name: '成品设备Y', type: 'finished', unit: '台', leadTime: 15 },
        { code: 'FG003', name: '配件包Z', type: 'finished', unit: '套', leadTime: 3 }
      ]
      
      this.materials = materialTemplates.map((template, index) => {
        const currentStock = Math.floor(Math.random() * 1000) + 100
        const safetyStock = Math.floor(currentStock * 0.3)
        
        return {
          id: `mat-${index}`,
          ...template,
          currentStock,
          safetyStock
        }
      })
      
      // 默认选择前3个物料
      this.selectedMaterialKeys = this.materials.slice(0, 3).map(m => m.id)
    },
    
    // 更新时间周期
    updateTimePeriods() {
      const periods = []
      const span = parseInt(this.timeSpan)
      const today = new Date()
      
      for (let i = 0; i < span; i++) {
        const date = new Date(today)
        let periodLabel, periodDate, periodId
        
        switch (this.periodType) {
          case 'day':
            date.setDate(today.getDate() + i)
            periodLabel = `日 ${i + 1}`
            periodDate = date.toISOString().split('T')[0]
            periodId = `day-${i}`
            break
          case 'week':
            date.setDate(today.getDate() + i * 7)
            const weekNum = Math.ceil((date.getDate() + date.getDay()) / 7)
            periodLabel = `周 ${weekNum}`
            periodDate = date.toISOString().split('T')[0]
            periodId = `week-${i}`
            break
          case 'month':
            date.setMonth(today.getMonth() + i)
            periodLabel = `月 ${date.getMonth() + 1}`
            periodDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            periodId = `month-${i}`
            break
          case 'quarter':
            date.setMonth(today.getMonth() + i * 3)
            const quarter = Math.floor(date.getMonth() / 3) + 1
            periodLabel = `Q${quarter}`
            periodDate = `${date.getFullYear()}-Q${quarter}`
            periodId = `quarter-${i}`
            break
        }
        
        periods.push({
          id: periodId,
          index: i,
          label: periodLabel,
          date: periodDate,
          startDate: new Date(date)
        })
      }
      
      this.timePeriods = periods
    },
    
    // 生成时间周期数据
    generateTimePeriodData(material, period) {
      const baseValue = Math.floor(Math.random() * 100)
      
      // 根据物料类型调整数值范围
      let multiplier = 1
      switch (material.type) {
        case 'raw':
          multiplier = 3
          break
        case 'semi':
          multiplier = 2
          break
        case 'finished':
          multiplier = 1
          break
      }
      
      const grossDemand = baseValue * multiplier
      const scheduledReceipts = Math.floor(Math.random() * 50) * multiplier
      const projectedInventory = Math.max(0, material.currentStock + scheduledReceipts - grossDemand)
      const netDemand = projectedInventory < material.safetyStock ? material.safetyStock - projectedInventory : 0
      const plannedOrders = netDemand > 0 ? Math.ceil(netDemand / 10) * 10 : 0
      const plannedDeliveries = plannedOrders
      
      // 随机生成异常信息
      const exceptions = []
      if (projectedInventory < material.safetyStock) {
        exceptions.push({
          type: 'inventory_below_safety',
          description: '预计库存低于安全库存',
          severity: 'warning',
          suggestion: '建议加快采购或生产进度'
        })
      }
      
      if (projectedInventory < 0) {
        exceptions.push({
          type: 'inventory_negative',
          description: '预计库存为负',
          severity: 'danger',
          suggestion: '紧急采购或调整生产计划'
        })
      }
      
      return {
        grossDemand,
        scheduledReceipts,
        projectedInventory,
        netDemand,
        plannedOrders,
        plannedDeliveries,
        exceptions: exceptions.length > 0 ? exceptions : null
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
    
    // 获取数据类型样式类名
    getDataTypeClass(dataType) {
      const typeClasses = {
        'grossDemand': 'data-type-demand',
        'scheduledReceipts': 'data-type-receipt',
        'projectedInventory': 'data-type-inventory',
        'netDemand': 'data-type-net-demand',
        'plannedOrders': 'data-type-order',
        'plannedDeliveries': 'data-type-delivery'
      }
      return typeClasses[dataType] || ''
    },
    
    // 获取单元格样式类名
    getCellStyle(material, period, dataType) {
      const classes = []
      const data = material.timeData[period.id]
      
      // 库存相关样式
      if (dataType === 'projectedInventory') {
        if (data.projectedInventory < 0) classes.push('cell-negative')
        if (data.projectedInventory < material.safetyStock) classes.push('cell-below-safety')
      }
      
      // 需求相关样式
      if (dataType === 'netDemand' && data.netDemand > 0) {
        classes.push('cell-net-demand')
      }
      
      // 异常样式
      if (data.exceptions && data.exceptions.length > 0) {
        classes.push('cell-exception')
      }
      
      return classes
    },
    
    // 获取单元格值
    getCellValue(material, period, dataType) {
      const data = material.timeData[period.id]
      return data[dataType] || '-'
    },
    
    // 检查单元格是否有异常
    hasException(material, period, dataType) {
      const data = material.timeData[period.id]
      return data.exceptions && data.exceptions.length > 0
    },
    
    // 格式化周期标签
    formatPeriodLabel(period) {
      return period.label
    },
    
    // 格式化周期日期
    formatPeriodDate(period) {
      return period.date
    },
    
    // 搜索物料
    searchMaterials() {
      // 搜索逻辑已在 computed 中实现
    },
    
    // 清空物料过滤条件
    clearMaterialFilter() {
      this.materialFilter = {
        code: '',
        name: '',
        type: ''
      }
    },
    
    // 物料选择变化
    onMaterialSelectionChange() {
      // 可以在这里添加选择变化后的逻辑
    },
    
    // 数据类型变化
    onDataTypeChange() {
      // 数据类型变化后的逻辑
    },
    
    // 开始编辑单元格
    startEditing(material, period, dataType) {
      this.editingCell = {
        materialId: material.id,
        periodId: period.id,
        dataType
      }
      
      const data = material.timeData[period.id]
      this.editValue = data[dataType] || 0
      
      this.$nextTick(() => {
        const editInput = this.$refs.editInput
        if (editInput && editInput.focus) {
          editInput.focus()
        }
      })
    },
    
    // 保存编辑
    saveEdit(material, period, dataType) {
      if (this.editingCell) {
        const data = material.timeData[period.id]
        data[dataType] = this.editValue
        
        // 重新计算相关值
        this.recalculateDependentValues(material, period)
        
        this.editingCell = null
        this.editValue = null
        
        this.$message.success('数据已更新')
      }
    },
    
    // 重新计算依赖值
    recalculateDependentValues(material, period) {
      const data = material.timeData[period.id]
      
      // 根据编辑的数据类型重新计算其他相关值
      if (dataType === 'grossDemand' || dataType === 'scheduledReceipts') {
        // 重新计算预计库存
        data.projectedInventory = Math.max(0, material.currentStock + data.scheduledReceipts - data.grossDemand)
        // 重新计算净需求
        data.netDemand = data.projectedInventory < material.safetyStock ? material.safetyStock - data.projectedInventory : 0
        // 重新计算计划订单
        data.plannedOrders = data.netDemand > 0 ? Math.ceil(data.netDemand / 10) * 10 : 0
      }
      
      // 清除或重新生成异常信息
      data.exceptions = null
      const exceptions = []
      if (data.projectedInventory < material.safetyStock) {
        exceptions.push({
          type: 'inventory_below_safety',
          description: '预计库存低于安全库存',
          severity: 'warning',
          suggestion: '建议加快采购或生产进度'
        })
      }
      
      if (data.projectedInventory < 0) {
        exceptions.push({
          type: 'inventory_negative',
          description: '预计库存为负',
          severity: 'danger',
          suggestion: '紧急采购或调整生产计划'
        })
      }
      
      if (exceptions.length > 0) {
        data.exceptions = exceptions
      }
    },
    
    // 检查是否正在编辑
    isEditing(materialId, periodId, dataType) {
      return this.editingCell && 
             this.editingCell.materialId === materialId && 
             this.editingCell.periodId === periodId && 
             this.editingCell.dataType === dataType
    },
    
    // 显示异常详情
    showExceptionDetails(material, period) {
      const data = material.timeData[period.id]
      if (data.exceptions && data.exceptions.length > 0) {
        this.selectedException = {
          material,
          period,
          exception: data.exceptions[0] // 显示第一个异常
        }
        this.exceptionDetailsVisible = true
      }
    },
    
    // 获取异常类型标签
    getExceptionTypeLabel(type) {
      const typeLabels = {
        'inventory_below_safety': '库存低于安全水平',
        'inventory_negative': '库存不足',
        'late_delivery': '交付延迟',
        'over_demand': '需求超预期'
      }
      return typeLabels[type] || type
    },
    
    // 获取异常严重程度类型
    getExceptionSeverityType(severity) {
      const severityTypes = {
        'info': 'info',
        'warning': 'warning',
        'danger': 'danger',
        'success': 'success'
      }
      return severityTypes[severity] || 'info'
    },
    
    // 获取异常严重程度标签
    getExceptionSeverityLabel(severity) {
      const severityLabels = {
        'info': '信息',
        'warning': '警告',
        'danger': '危险',
        'success': '正常'
      }
      return severityLabels[severity] || severity
    },
    
    // 处理视图选项
    handleViewOption(command) {
      switch (command) {
        case 'showAll':
          this.enabledDataTypes = this.dataTypeOptions.map(type => type.key)
          break
        case 'showKeyOnly':
          this.enabledDataTypes = ['grossDemand', 'projectedInventory', 'netDemand', 'plannedOrders']
          break
        case 'customizeColumns':
          this.customizeColumnsVisible = true
          break
      }
    },
    
    // 应用列设置
    applyColumnSettings() {
      // 确保至少有一个数据类型被选中
      if (this.enabledDataTypes.length === 0) {
        this.enabledDataTypes = ['grossDemand']
        this.$message.warning('至少需要选择一个数据列')
      }
      this.customizeColumnsVisible = false
    },
    
    // 刷新数据
    refreshData() {
      this.$emit('refresh')
      // 如果没有外部数据源，重新生成模拟数据
      this.generateMockData()
    },
    
    // 导出数据
    exportData() {
      // 这里可以实现实际的导出逻辑
      this.$message.success('数据导出成功！')
    }
  }
}
</script>

<style scoped>
.time-phased-view-container {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.view-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.view-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.view-controls .el-select {
  width: 120px;
}

.material-selector {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.material-selection {
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.time-phased-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  margin-bottom: 16px;
}

.fixed-headers {
  width: 500px;
  flex-shrink: 0;
  overflow: hidden;
  border-right: 1px solid #e0e0e0;
}

.scrollable-content {
  flex: 1;
  overflow: auto;
}

.time-phased-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.time-phased-table th,
.time-phased-table td {
  padding: 8px;
  text-align: center;
  border: 1px solid #e0e0e0;
  font-size: 12px;
}

.time-phased-table th {
  background-color: #f5f7fa;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 10;
}

.time-phased-table td {
  position: relative;
  height: 40px;
}

/* 固定列宽度 */
.material-info-col { width: 60px; }
.material-code-col { width: 100px; }
.material-name-col { width: 140px; }
.unit-col { width: 80px; }
.current-stock-col { width: 100px; }
.safety-stock-col { width: 100px; }
.lead-time-col { width: 80px; }
.spacer-col { width: 0; padding: 0; border: none; }

/* 周期表头样式 */
.period-header-cell {
  min-width: 200px;
  background-color: #f0f9ff;
}

.period-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.period-label {
  font-weight: 600;
  color: #606266;
}

.period-date {
  font-size: 10px;
  color: #909399;
  margin-top: 2px;
}

/* 数据类型单元格样式 */
.data-type-cell {
  min-width: 80px;
  font-size: 11px;
}

.data-type-demand { background-color: #fef0f0; }
.data-type-receipt { background-color: #f0f9ff; }
.data-type-inventory { background-color: #f0f9ff; }
.data-type-net-demand { background-color: #fdf6ec; }
.data-type-order { background-color: #f0f9ff; }
.data-type-delivery { background-color: #f0f9ff; }

/* 数据单元格样式 */
.data-cell {
  min-width: 80px;
  cursor: pointer;
  transition: all 0.2s;
}

.data-cell:hover {
  background-color: #ecf5ff;
}

.cell-value {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.cell-edit {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.cell-edit .el-input-number {
  width: 100%;
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

/* 单元格状态样式 */
.cell-negative {
  background-color: #fef0f0;
  color: #f56c6c;
  font-weight: 500;
}

.cell-below-safety {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.cell-net-demand {
  background-color: #fdf6ec;
  color: #e6a23c;
  font-weight: 500;
}

.cell-exception {
  border: 2px solid #e6a23c;
}

/* 库存状态样式 */
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

/* 数据类型切换 */
.data-type-toggle {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.data-type-toggle .el-checkbox-button {
  margin-right: 8px;
}

/* 统计信息 */
.summary-stats {
  display: flex;
  gap: 16px;
  margin-top: auto;
}

.stat-card {
  flex: 1;
  min-width: 0;
}

.stat-content {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
}

.value-primary { color: #409EFF; }
.value-success { color: #67C23A; }
.value-warning { color: #E6A23C; }
.value-danger { color: #F56C6C; }
.value-info { color: #909399; }

/* 自定义列对话框样式 */
.customize-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.data-type-description {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 异常详情样式 */
.exception-details {
  padding: 8px;
}

/* 物料图标 */
.material-icon {
  font-size: 16px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .view-controls {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .summary-stats {
    flex-direction: column;
  }
  
  .fixed-headers {
    width: 300px;
  }
  
  .material-info-col { width: 40px; }
  .material-code-col { width: 80px; }
  .material-name-col { width: 100px; }
  .unit-col { width: 60px; }
  .current-stock-col { width: 80px; }
  .safety-stock-col { width: 80px; }
  .lead-time-col { width: 60px; }
  
  .data-cell, .data-type-cell {
    min-width: 60px;
    font-size: 10px;
  }
}
</style>