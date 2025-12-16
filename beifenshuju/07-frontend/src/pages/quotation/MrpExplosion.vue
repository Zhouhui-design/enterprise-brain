<template>
  <div class="mrp-explosion-container">
    <!-- 页面标题 -->
    <el-card class="page-header-card" shadow="never">
      <div class="page-header">
        <h2 class="page-title">MRP物料需求展开</h2>
        <div class="page-description">基于主生产计划和物料清单，展开计算各层级物料的需求数量和时间</div>
      </div>
    </el-card>

    <!-- 操作工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="left-actions">
          <el-button type="primary" @click="startExplosion" :loading="explosionLoading">
            <i class="el-icon-refresh-right"></i> 开始展开
          </el-button>
          <el-button @click="resetParameters">
            <i class="el-icon-refresh"></i> 重置参数
          </el-button>
        </div>
        <div class="right-actions">
          <el-button @click="exportExplosionReport">
            <i class="el-icon-download"></i> 导出报告
          </el-button>
          <el-button @click="saveExplosionScenario">
            <i class="el-icon-save"></i> 保存方案
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 参数设置区域 -->
    <el-card class="params-card">
      <div slot="header" class="params-header">
        <span>展开参数设置</span>
      </div>
      
      <div class="params-content">
        <!-- 父项选择 -->
        <el-form :inline="true" :model="explosionParams" class="inline-form">
          <el-form-item label="父项物料:">
            <el-select v-model="explosionParams.parentItem" placeholder="请选择父项物料" filterable style="width: 240px;">
              <el-option v-for="item in materialOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="需求数量:">
            <el-input-number v-model="explosionParams.requiredQuantity" :min="1" :step="1" style="width: 120px;"></el-input-number>
          </el-form-item>
          
          <el-form-item label="需求日期:">
            <el-date-picker
              v-model="explosionParams.requiredDate"
              type="date"
              placeholder="选择日期"
              style="width: 140px;"
            ></el-date-picker>
          </el-form-item>
          
          <el-form-item label="展开深度:">
            <el-select v-model="explosionParams.explosionDepth" placeholder="展开深度" style="width: 120px;">
              <el-option label="1级" :value="1"></el-option>
              <el-option label="2级" :value="2"></el-option>
              <el-option label="3级" :value="3"></el-option>
              <el-option label="全部" :value="0"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        
        <!-- 其他展开选项 -->
        <div class="explosion-options">
          <h3>展开选项</h3>
          <el-checkbox-group v-model="explosionOptions">
            <el-checkbox label="includeZeroStock" border>包含零库存物料</el-checkbox>
            <el-checkbox label="considerSubstitutes" border>考虑替代物料</el-checkbox>
            <el-checkbox label="showPurchaseItems" border>仅显示采购件</el-checkbox>
            <el-checkbox label="showManufacturedItems" border>仅显示自制件</el-checkbox>
            <el-checkbox label="showCriticalItems" border>高亮显示短缺物料</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
    </el-card>

    <!-- 过滤条件区域 -->
    <el-card class="filter-card">
      <div slot="header" class="filter-header">
        <span>结果过滤</span>
      </div>
      
      <div class="filter-content">
        <el-form :inline="true" :model="filterParams" class="filter-form">
          <el-form-item label="物料编码:">
            <el-input v-model="filterParams.materialCode" placeholder="输入物料编码" style="width: 160px;"></el-input>
          </el-form-item>
          
          <el-form-item label="物料名称:">
            <el-input v-model="filterParams.materialName" placeholder="输入物料名称" style="width: 180px;"></el-input>
          </el-form-item>
          
          <el-form-item label="物料类型:">
            <el-select v-model="filterParams.materialType" placeholder="选择物料类型" style="width: 120px;">
              <el-option label="全部" :value="''"></el-option>
              <el-option label="原材料" :value="'RM'"></el-option>
              <el-option label="半成品" :value="'SFG'"></el-option>
              <el-option label="成品" :value="'FG'"></el-option>
              <el-option label="外购件" :value="'PUR'"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="库存状态:">
            <el-select v-model="filterParams.stockStatus" placeholder="库存状态" style="width: 120px;">
              <el-option label="全部" :value="''"></el-option>
              <el-option label="有库存" :value="'inStock'"></el-option>
              <el-option label="短缺" :value="'shortage'"></el-option>
              <el-option label="零库存" :value="'zeroStock'"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="applyFilter">筛选</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 结果概览 -->
    <el-card class="overview-card" v-if="explosionResults.length > 0">
      <div slot="header" class="overview-header">
        <span>展开结果概览</span>
      </div>
      
      <div class="overview-stats">
        <el-statistic :value="totalItems" suffix="个" title="总物料项数" :precision="0"></el-statistic>
        <el-statistic :value="purchasedItems" suffix="个" title="采购物料数" :precision="0"></el-statistic>
        <el-statistic :value="manufacturedItems" suffix="个" title="自制物料数" :precision="0"></el-statistic>
        <el-statistic :value="criticalItems" suffix="个" title="短缺物料数" :precision="0"></el-statistic>
        <el-statistic :value="totalValue" suffix="元" title="物料需求总金额" :precision="2" :formatter="(value) => `¥${value.toLocaleString()}`"></el-statistic>
      </div>
    </el-card>

    <!-- 展开结果树 -->
    <el-card class="result-card" v-if="explosionResults.length > 0">
      <div slot="header" class="result-header">
        <div class="result-title">物料展开层级结构</div>
        <div class="result-actions">
          <el-button @click="expandAll" size="small">全部展开</el-button>
          <el-button @click="collapseAll" size="small">全部收起</el-button>
          <el-button @click="refreshTree" size="small">刷新</el-button>
        </div>
      </div>
      
      <div class="tree-container">
        <el-tree
          :data="filteredResults"
          :props="treeProps"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          @node-click="handleNodeClick"
          @node-expand="handleNodeExpand"
          @node-collapse="handleNodeCollapse"
        >
          <template v-slot="{ node, data }">
            <div class="tree-node-content">
              <div class="node-main-info">
                <span :class="getNodeStatusClass(data)">{{ data.materialCode }} - {{ data.materialName }}</span>
                <span v-if="data.level > 0" class="quantity-info">
                  用量: {{ data.quantityPerParent }} 单位/父项
                </span>
              </div>
              
              <div class="node-details">
                <div class="detail-item">
                  <span class="label">需求数量:</span>
                  <span class="value">{{ data.requiredQuantity }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">现有库存:</span>
                  <span class="value" :class="{ 'stock-critical': data.stockQuantity < data.requiredQuantity }">
                    {{ data.stockQuantity }}
                  </span>
                </div>
                <div class="detail-item" v-if="data.stockQuantity < data.requiredQuantity">
                  <span class="label">短缺数量:</span>
                  <span class="value shortage">{{ data.requiredQuantity - data.stockQuantity }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">物料类型:</span>
                  <span class="value">{{ getMaterialTypeText(data.materialType) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">提前期:</span>
                  <span class="value">{{ data.leadTime }} 天</span>
                </div>
              </div>
              
              <div class="node-actions">
                <el-button size="mini" @click.stop="showMaterialDetail(data)">详情</el-button>
                <el-button size="mini" @click.stop="showRequirements(data)">需求</el-button>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
    </el-card>

    <!-- 空状态提示 -->
    <el-empty description="暂无展开数据，请设置参数后点击开始展开" v-else-if="!explosionLoading"></el-empty>
    <el-skeleton :loading="explosionLoading" animated v-else>
      <el-skeleton-item variant="p" style="width: 50%; margin-bottom: 20px;"></el-skeleton-item>
      <el-skeleton-item variant="p" style="width: 70%;"></el-skeleton-item>
    </el-skeleton>

    <!-- 物料详情对话框 -->
    <el-dialog title="物料详情" :visible.sync="materialDetailVisible" width="60%">
      <div class="material-detail" v-if="selectedMaterial">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="物料编码">{{ selectedMaterial.materialCode }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ selectedMaterial.materialName }}</el-descriptions-item>
          <el-descriptions-item label="物料类型">{{ getMaterialTypeText(selectedMaterial.materialType) }}</el-descriptions-item>
          <el-descriptions-item label="单位">{{ selectedMaterial.unit }}</el-descriptions-item>
          <el-descriptions-item label="当前库存">{{ selectedMaterial.stockQuantity }}</el-descriptions-item>
          <el-descriptions-item label="安全库存">{{ selectedMaterial.safetyStock }}</el-descriptions-item>
          <el-descriptions-item label="采购提前期">{{ selectedMaterial.leadTime }} 天</el-descriptions-item>
          <el-descriptions-item label="供应商" v-if="selectedMaterial.supplierName">{{ selectedMaterial.supplierName }}</el-descriptions-item>
          <el-descriptions-item label="物料成本">{{ formatCurrency(selectedMaterial.unitCost) }}</el-descriptions-item>
          <el-descriptions-item label="BOM层级">{{ selectedMaterial.level }}</el-descriptions-item>
          <el-descriptions-item label="父项物料" :span="2">{{ selectedMaterial.parentMaterialCode }} - {{ selectedMaterial.parentMaterialName }}</el-descriptions-item>
          <el-descriptions-item label="用量比例" :span="2">每 {{ selectedMaterial.quantityPerParent }} {{ selectedMaterial.unit }} 用于 1 个父项</el-descriptions-item>
        </el-descriptions>
        
        <!-- 时间分段需求 -->
        <div class="time-phased-demand" v-if="selectedMaterial.timePhasedDemand && selectedMaterial.timePhasedDemand.length > 0">
          <h4>时间分段需求</h4>
          <el-table :data="selectedMaterial.timePhasedDemand" style="width: 100%">
            <el-table-column prop="date" label="日期" width="120"></el-table-column>
            <el-table-column prop="grossDemand" label="毛需求" width="100"></el-table-column>
            <el-table-column prop="scheduledReceipts" label="计划入库" width="100"></el-table-column>
            <el-table-column prop="projectedOnHand" label="预计可用库存" width="120"></el-table-column>
            <el-table-column prop="plannedOrder" label="计划订单" width="100"></el-table-column>
          </el-table>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="materialDetailVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 需求详情对话框 -->
    <el-dialog title="物料需求明细" :visible.sync="requirementDetailVisible" width="70%">
      <div class="requirement-detail" v-if="selectedRequirement">
        <h3>{{ selectedRequirement.materialCode }} - {{ selectedRequirement.materialName }}</h3>
        <el-table :data="selectedRequirement.requirements" style="width: 100%">
          <el-table-column prop="source" label="需求来源" width="120"></el-table-column>
          <el-table-column prop="sourceOrder" label="来源单号" width="150"></el-table-column>
          <el-table-column prop="quantity" label="需求数量" width="100"></el-table-column>
          <el-table-column prop="dueDate" label="需求日期" width="120"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="notes" label="备注"></el-table-column>
        </el-table>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="requirementDetailVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'MrpExplosion',
  data() {
    return {
      // 展开参数
      explosionParams: {
        parentItem: '',
        requiredQuantity: 1,
        requiredDate: new Date(),
        explosionDepth: 0 // 0表示全部展开
      },
      
      // 展开选项
      explosionOptions: ['includeZeroStock'],
      
      // 过滤参数
      filterParams: {
        materialCode: '',
        materialName: '',
        materialType: '',
        stockStatus: ''
      },
      
      // 物料选项
      materialOptions: [],
      
      // 展开结果
      explosionResults: [],
      
      // 过滤后的结果
      filteredResults: [],
      
      // 树配置
      treeProps: {
        children: 'children',
        label: 'materialName'
      },
      
      // 状态标志
      explosionLoading: false,
      materialDetailVisible: false,
      requirementDetailVisible: false,
      
      // 选中的数据
      selectedMaterial: null,
      selectedRequirement: null,
      
      // 统计信息
      totalItems: 0,
      purchasedItems: 0,
      manufacturedItems: 0,
      criticalItems: 0,
      totalValue: 0
    }
  },
  
  computed: {
    // 计算统计信息
    calculateStats() {
      if (!this.explosionResults || this.explosionResults.length === 0) {
        return {
          total: 0,
          purchased: 0,
          manufactured: 0,
          critical: 0,
          value: 0
        }
      }
      
      // 扁平化树结构进行统计
      const flattenItems = (items, result = []) => {
        items.forEach(item => {
          result.push(item)
          if (item.children && item.children.length > 0) {
            flattenItems(item.children, result)
          }
        })
        return result
      }
      
      const allItems = flattenItems(this.explosionResults)
      const total = allItems.length
      const purchased = allItems.filter(item => ['RM', 'PUR'].includes(item.materialType)).length
      const manufactured = allItems.filter(item => ['SFG', 'FG'].includes(item.materialType)).length
      const critical = allItems.filter(item => item.stockQuantity < item.requiredQuantity).length
      const value = allItems.reduce((sum, item) => sum + (item.unitCost * item.requiredQuantity), 0)
      
      return {
        total,
        purchased,
        manufactured,
        critical,
        value
      }
    }
  },
  
  created() {
    this.loadMaterialOptions()
  },
  
  methods: {
    // 加载物料选项
    loadMaterialOptions() {
      // 模拟数据，实际应用中应从API获取
      this.materialOptions = [
        { value: 'FG001', label: 'FG001 - 成品A' },
        { value: 'FG002', label: 'FG002 - 成品B' },
        { value: 'FG003', label: 'FG003 - 成品C' },
        { value: 'SFG001', label: 'SFG001 - 半成品A' },
        { value: 'SFG002', label: 'SFG002 - 半成品B' }
      ]
      
      // 默认选择第一个物料
      if (this.materialOptions.length > 0) {
        this.explosionParams.parentItem = this.materialOptions[0].value
      }
    },
    
    // 开始展开计算
    startExplosion() {
      if (!this.explosionParams.parentItem) {
        this.$message.warning('请选择父项物料')
        return
      }
      
      this.explosionLoading = true
      
      // 模拟API请求延迟
      setTimeout(() => {
        // 生成模拟数据
        this.generateMockExplosionData()
        
        // 应用过滤
        this.applyFilter()
        
        // 更新统计信息
        this.updateStats()
        
        this.explosionLoading = false
      }, 1500)
    },
    
    // 生成模拟展开数据
    generateMockExplosionData() {
      const parentItem = this.explosionParams.parentItem
      const explosionDepth = this.explosionParams.explosionDepth
      
      // 模拟展开结果数据
      this.explosionResults = [
        {
          id: '1',
          materialCode: parentItem,
          materialName: this.materialOptions.find(opt => opt.value === parentItem)?.label.split(' - ')[1] || '成品A',
          materialType: 'FG',
          unit: '个',
          level: 0,
          quantityPerParent: 1,
          requiredQuantity: this.explosionParams.requiredQuantity,
          stockQuantity: Math.floor(Math.random() * 50),
          safetyStock: 10,
          leadTime: 0,
          unitCost: 1000,
          parentMaterialCode: '',
          parentMaterialName: '',
          supplierName: '',
          children: []
        }
      ]
      
      // 根据展开深度生成子级数据
      if (explosionDepth === 0 || explosionDepth >= 1) {
        this.generateLevel1Data(this.explosionResults[0])
      }
      
      if (explosionDepth === 0 || explosionDepth >= 2) {
        this.explosionResults[0].children.forEach(child => {
          this.generateLevel2Data(child)
        })
      }
      
      if (explosionDepth === 0 || explosionDepth >= 3) {
        this.explosionResults[0].children.forEach(child => {
          if (child.children) {
            child.children.forEach(grandChild => {
              this.generateLevel3Data(grandChild)
            })
          }
        })
      }
      
      // 为每个物料添加时间分段需求和需求明细
      this.addTimePhasedDemandAndRequirements(this.explosionResults)
    },
    
    // 生成一级物料数据
    generateLevel1Data(parent) {
      const materials = [
        { code: 'SFG001', name: '半成品A', type: 'SFG', quantity: 2 },
        { code: 'SFG002', name: '半成品B', type: 'SFG', quantity: 1 },
        { code: 'PUR001', name: '外购件A', type: 'PUR', quantity: 3 },
        { code: 'RM001', name: '原材料A', type: 'RM', quantity: 5 }
      ]
      
      parent.children = materials.map((mat, index) => ({
        id: `1-${index + 1}`,
        materialCode: mat.code,
        materialName: mat.name,
        materialType: mat.type,
        unit: '个',
        level: 1,
        quantityPerParent: mat.quantity,
        requiredQuantity: mat.quantity * this.explosionParams.requiredQuantity,
        stockQuantity: Math.floor(Math.random() * 100),
        safetyStock: 20,
        leadTime: mat.type === 'RM' ? 10 : 5,
        unitCost: mat.type === 'RM' ? 100 : 200,
        parentMaterialCode: parent.materialCode,
        parentMaterialName: parent.materialName,
        supplierName: mat.type === 'RM' || mat.type === 'PUR' ? `供应商${index + 1}` : '',
        children: []
      }))
    },
    
    // 生成二级物料数据
    generateLevel2Data(parent) {
      // 只为半成品生成下一级物料
      if (parent.materialType !== 'SFG') return
      
      const materials = [
        { code: 'RM002', name: '原材料B', type: 'RM', quantity: 4 },
        { code: 'RM003', name: '原材料C', type: 'RM', quantity: 3 },
        { code: 'PUR002', name: '外购件B', type: 'PUR', quantity: 2 }
      ]
      
      parent.children = materials.map((mat, index) => ({
        id: `${parent.id}-${index + 1}`,
        materialCode: mat.code,
        materialName: mat.name,
        materialType: mat.type,
        unit: '个',
        level: 2,
        quantityPerParent: mat.quantity,
        requiredQuantity: mat.quantity * parent.requiredQuantity,
        stockQuantity: Math.floor(Math.random() * 150),
        safetyStock: 30,
        leadTime: 15,
        unitCost: Math.floor(Math.random() * 50) + 50,
        parentMaterialCode: parent.materialCode,
        parentMaterialName: parent.materialName,
        supplierName: `供应商${index + 3}`,
        children: []
      }))
    },
    
    // 生成三级物料数据
    generateLevel3Data(parent) {
      // 只为特定原材料生成下一级物料
      if (parent.materialType !== 'RM' || !['RM002', 'RM003'].includes(parent.materialCode)) return
      
      const materials = [
        { code: 'RM004', name: '原材料D', type: 'RM', quantity: 2 },
        { code: 'RM005', name: '原材料E', type: 'RM', quantity: 1 }
      ]
      
      parent.children = materials.map((mat, index) => ({
        id: `${parent.id}-${index + 1}`,
        materialCode: mat.code,
        materialName: mat.name,
        materialType: mat.type,
        unit: '个',
        level: 3,
        quantityPerParent: mat.quantity,
        requiredQuantity: mat.quantity * parent.requiredQuantity,
        stockQuantity: Math.floor(Math.random() * 200),
        safetyStock: 40,
        leadTime: 20,
        unitCost: Math.floor(Math.random() * 30) + 20,
        parentMaterialCode: parent.materialCode,
        parentMaterialName: parent.materialName,
        supplierName: `供应商${index + 6}`,
        children: []
      }))
    },
    
    // 添加时间分段需求和需求明细
    addTimePhasedDemandAndRequirements(items) {
      items.forEach(item => {
        // 生成时间分段需求
        item.timePhasedDemand = this.generateTimePhasedDemand(item)
        
        // 生成需求明细
        item.requirements = this.generateRequirements(item)
        
        // 递归处理子项
        if (item.children && item.children.length > 0) {
          this.addTimePhasedDemandAndRequirements(item.children)
        }
      })
    },
    
    // 生成时间分段需求
    generateTimePhasedDemand(item) {
      const demand = []
      const today = new Date(this.explosionParams.requiredDate)
      
      // 生成未来6周的需求数据
      for (let i = 0; i < 6; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i * 7) // 每周
        
        const grossDemand = i === 0 ? item.requiredQuantity : Math.floor(Math.random() * 50)
        const scheduledReceipts = Math.floor(Math.random() * 100)
        let projectedOnHand = item.stockQuantity + scheduledReceipts - grossDemand
        projectedOnHand = projectedOnHand < 0 ? 0 : projectedOnHand
        
        demand.push({
          date: date.toISOString().split('T')[0],
          grossDemand,
          scheduledReceipts,
          projectedOnHand,
          plannedOrder: projectedOnHand < item.safetyStock ? Math.ceil((item.safetyStock - projectedOnHand) / 10) * 10 : 0
        })
      }
      
      return demand
    },
    
    // 生成需求明细
    generateRequirements(item) {
      const sources = ['生产订单', '销售订单', '预测', '安全库存']
      const statuses = ['已确认', '计划中', '已取消', '已完成']
      const requirements = []
      
      // 生成3-5条需求明细
      const count = Math.floor(Math.random() * 3) + 3
      const today = new Date(this.explosionParams.requiredDate)
      
      for (let i = 0; i < count; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - Math.floor(Math.random() * 30)) // 过去30天内
        
        const quantity = Math.floor(Math.random() * 100) + 10
        const source = sources[Math.floor(Math.random() * sources.length)]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        
        requirements.push({
          source,
          sourceOrder: `${source.slice(0, 2).toUpperCase()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          quantity,
          dueDate: date.toISOString().split('T')[0],
          status,
          notes: `需求来源: ${source}`
        })
      }
      
      return requirements
    },
    
    // 应用过滤条件
    applyFilter() {
      let filtered = JSON.parse(JSON.stringify(this.explosionResults))
      
      // 过滤函数
      const filterItems = (items) => {
        return items.filter(item => {
          // 应用过滤条件
          let match = true
          
          if (this.filterParams.materialCode && !item.materialCode.includes(this.filterParams.materialCode)) {
            match = false
          }
          
          if (this.filterParams.materialName && !item.materialName.includes(this.filterParams.materialName)) {
            match = false
          }
          
          if (this.filterParams.materialType && item.materialType !== this.filterParams.materialType) {
            match = false
          }
          
          if (this.filterParams.stockStatus) {
            switch (this.filterParams.stockStatus) {
              case 'inStock':
                match = match && item.stockQuantity > 0
                break
              case 'shortage':
                match = match && item.stockQuantity < item.requiredQuantity
                break
              case 'zeroStock':
                match = match && item.stockQuantity === 0
                break
            }
          }
          
          // 递归过滤子项
          if (match && item.children && item.children.length > 0) {
            const filteredChildren = filterItems(item.children)
            item.children = filteredChildren
            // 如果父项匹配但没有子项匹配，则仍然保留父项
            return true
          }
          
          return match
        })
      }
      
      this.filteredResults = filterItems(filtered)
    },
    
    // 重置过滤条件
    resetFilter() {
      this.filterParams = {
        materialCode: '',
        materialName: '',
        materialType: '',
        stockStatus: ''
      }
      this.applyFilter()
    },
    
    // 重置展开参数
    resetParameters() {
      this.explosionParams = {
        parentItem: this.materialOptions.length > 0 ? this.materialOptions[0].value : '',
        requiredQuantity: 1,
        requiredDate: new Date(),
        explosionDepth: 0
      }
      
      this.explosionOptions = ['includeZeroStock']
      this.explosionResults = []
      this.filteredResults = []
      this.updateStats()
    },
    
    // 更新统计信息
    updateStats() {
      const stats = this.calculateStats
      this.totalItems = stats.total
      this.purchasedItems = stats.purchased
      this.manufacturedItems = stats.manufactured
      this.criticalItems = stats.critical
      this.totalValue = stats.value
    },
    
    // 获取物料类型文本
    getMaterialTypeText(type) {
      const typeMap = {
        'RM': '原材料',
        'SFG': '半成品',
        'FG': '成品',
        'PUR': '外购件'
      }
      return typeMap[type] || type
    },
    
    // 获取节点状态样式类
    getNodeStatusClass(data) {
      const classes = ['node-name']
      
      // 根据库存状态添加样式
      if (data.stockQuantity < data.safetyStock) {
        classes.push('stock-warning')
      }
      
      if (data.stockQuantity < data.requiredQuantity) {
        classes.push('stock-critical')
      }
      
      // 根据层级添加样式
      if (data.level === 0) {
        classes.push('level-0')
      } else if (data.level === 1) {
        classes.push('level-1')
      } else if (data.level === 2) {
        classes.push('level-2')
      } else {
        classes.push('level-3')
      }
      
      return classes
    },
    
    // 获取状态标签类型
    getStatusTagType(status) {
      switch (status) {
        case '已确认':
          return 'success'
        case '计划中':
          return 'primary'
        case '已取消':
          return 'danger'
        case '已完成':
          return 'info'
        default:
          return 'default'
      }
    },
    
    // 格式化货币
    formatCurrency(value) {
      return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    
    // 显示物料详情
    showMaterialDetail(material) {
      this.selectedMaterial = JSON.parse(JSON.stringify(material))
      this.materialDetailVisible = true
    },
    
    // 显示需求详情
    showRequirements(material) {
      this.selectedRequirement = JSON.parse(JSON.stringify(material))
      this.requirementDetailVisible = true
    },
    
    // 处理节点点击
    handleNodeClick(data, node) {
      console.log('点击节点:', data)
    },
    
    // 处理节点展开
    handleNodeExpand(data, node) {
      console.log('展开节点:', data)
    },
    
    // 处理节点收起
    handleNodeCollapse(data, node) {
      console.log('收起节点:', data)
    },
    
    // 展开所有节点
    expandAll() {
      this.$nextTick(() => {
        const tree = this.$el.querySelector('.el-tree')
        if (tree) {
          const nodes = tree.querySelectorAll('.el-tree-node')
          nodes.forEach(node => {
            this.$refs.tree && this.$refs.tree.expandNode(node.data)
          })
        }
      })
    },
    
    // 收起所有节点
    collapseAll() {
      this.$nextTick(() => {
        const tree = this.$el.querySelector('.el-tree')
        if (tree) {
          const nodes = tree.querySelectorAll('.el-tree-node')
          nodes.forEach(node => {
            this.$refs.tree && this.$refs.tree.collapseNode(node.data)
          })
        }
      })
    },
    
    // 刷新树
    refreshTree() {
      this.applyFilter()
      this.$message.success('已刷新物料展开结果')
    },
    
    // 导出报告
    exportExplosionReport() {
      if (this.explosionResults.length === 0) {
        this.$message.warning('暂无数据可导出')
        return
      }
      
      // 模拟导出功能
      this.$message.success('报告导出成功')
    },
    
    // 保存展开方案
    saveExplosionScenario() {
      if (this.explosionResults.length === 0) {
        this.$message.warning('暂无数据可保存')
        return
      }
      
      // 模拟保存功能
      this.$prompt('请输入方案名称', '保存展开方案', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: `展开方案_${new Date().toLocaleDateString()}`
      }).then(({ value }) => {
        this.$message.success(`方案"${value}"保存成功`)
      }).catch(() => {
        // 取消操作
      })
    }
  }
}
</script>

<style scoped>
.mrp-explosion-container {
  padding: 20px;
}

/* 页面头部 */
.page-header {
  margin-bottom: 10px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.page-description {
  color: #606266;
  font-size: 14px;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-actions, .right-actions {
  display: flex;
  gap: 10px;
}

/* 参数设置卡片 */
.params-content {
  padding: 10px 0;
}

.inline-form {
  margin-bottom: 20px;
}

.explosion-options {
  margin-top: 20px;
}

.explosion-options h3 {
  font-size: 14px;
  margin-bottom: 10px;
  color: #606266;
}

.explosion-options .el-checkbox {
  margin-right: 20px;
  margin-bottom: 10px;
}

/* 过滤卡片 */
.filter-content {
  padding: 10px 0;
}

/* 概览卡片 */
.overview-stats {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}

.overview-stats .el-statistic {
  min-width: 180px;
  text-align: center;
  padding: 10px;
}

/* 结果卡片 */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-title {
  font-weight: 500;
}

.result-actions {
  display: flex;
  gap: 8px;
}

/* 树容器 */
.tree-container {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}

/* 树节点样式 */
.tree-node-content {
  padding: 8px 0;
  min-height: 80px;
  border-bottom: 1px solid #f0f0f0;
}

.tree-node-content:last-child {
  border-bottom: none;
}

.node-main-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.node-name {
  font-weight: 500;
  font-size: 14px;
}

.quantity-info {
  font-size: 12px;
  color: #606266;
}

.node-details {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.detail-item .label {
  color: #606266;
  margin-right: 5px;
}

.detail-item .value {
  font-weight: 500;
}

.detail-item .shortage {
  color: #f56c6c;
  font-weight: 600;
}

.stock-critical {
  color: #f56c6c !important;
}

.stock-warning {
  color: #e6a23c;
}

.level-0 {
  font-weight: 600;
  font-size: 15px !important;
}

.level-1 {
  color: #606266;
}

.level-2 {
  color: #909399;
}

.level-3 {
  color: #c0c4cc;
}

.node-actions {
  display: flex;
  gap: 5px;
}

/* 对话框样式 */
.material-detail h4 {
  margin: 20px 0 10px 0;
  color: #606266;
}

.time-phased-demand {
  margin-top: 20px;
}

.requirement-detail h3 {
  margin-bottom: 15px;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .left-actions, .right-actions {
    justify-content: center;
  }
  
  .inline-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .inline-form .el-form-item {
    margin-bottom: 0;
  }
  
  .overview-stats {
    flex-direction: column;
    align-items: center;
  }
  
  .overview-stats .el-statistic {
    width: 100%;
  }
  
  .node-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>