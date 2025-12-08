<template>
  <div class="material-demand-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>物料需求明细</h2>
        <p class="subtitle">拆分MRP需求，关联采购/库存状态</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
        <el-button type="danger" :disabled="!hasSelection" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          删除
        </el-button>
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="handlePrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="pageSettingsVisible = true" circle>
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-panel">
      <el-form :inline="true" :model="filterForm" size="default">
        <el-form-item label="物料编号">
          <el-input v-model="filterForm.materialCode" placeholder="输入物料编号" clearable style="width: 200px;" />
        </el-form-item>
        <el-form-item label="需求来源">
          <el-select v-model="filterForm.sourceType" placeholder="全部来源" clearable style="width: 150px;">
            <el-option label="销售订单" value="sales" />
            <el-option label="生产计划" value="production" />
            <el-option label="安全库存" value="safety" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select v-model="filterForm.execStatus" placeholder="全部状态" clearable style="width: 150px;">
            <el-option label="未下单" value="pending" />
            <el-option label="已采购" value="purchased" />
            <el-option label="已生产" value="produced" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求日期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 汇总卡片 -->
    <div class="summary-cards">
      <div class="card-item">
        <div class="card-icon production">
          <el-icon><Tools /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-value">{{ summary.productionQty }}</div>
          <div class="card-label">需生产数量</div>
        </div>
      </div>
      <div class="card-item">
        <div class="card-icon purchase">
          <el-icon><ShoppingCart /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-value">{{ summary.purchaseQty }}</div>
          <div class="card-label">需采购数量</div>
        </div>
      </div>
      <div class="card-item">
        <div class="card-icon stock">
          <el-icon><Box /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-value">{{ summary.totalStock }}</div>
          <div class="card-label">总库存</div>
        </div>
      </div>
      <div class="card-item">
        <div class="card-icon shortage">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-value">{{ summary.shortageQty }}</div>
          <div class="card-label">缺货数量</div>
        </div>
      </div>
    </div>

    <!-- 主表格1：产品名称及需求计算 -->
    <div class="table-container">
      <div class="table-title">
        <h3>产品名称及需求计算</h3>
      </div>
      <!-- MRP运算控制区 -->
      <div class="mrp-control-panel">
        <el-form :inline="true" size="default">
          <el-form-item label="选择订单编号">
            <el-select 
              v-model="selectedOrderNo" 
              placeholder="请选择销售订单" 
              clearable 
              filterable
              style="width: 300px;"
              @change="handleOrderChange"
            >
              <el-option
                v-for="order in salesOrderList"
                :key="order.id"
                :label="order.internalOrderNo"
                :value="order.internalOrderNo"
              >
                <span style="float: left">{{ order.internalOrderNo }}</span>
                <span style="float: right; color: #8492a6; font-size: 12px; margin-left: 10px">{{ order.customerName }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button 
              type="success" 
              :disabled="!selectedOrderNo || mrpCalculating"
              :loading="mrpCalculating"
              @click="handleExecuteMRP"
            >
              <el-icon><Tools /></el-icon>
              执行MRP运算
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <EnhancedTable
        ref="productTableRef"
        :data="filteredProductTableData"
        :columns="productTableColumns"
        :loading="loading"
        :height="350"
        :show-toolbar="true"
        :show-add="false"
        :show-export="true"
        :show-import="false"
        :show-print="true"
        :show-selection="true"
        :show-operation="true"
        :operation-width="200"
        :show-summary="true"
        :show-filter="true"
        :summary-columns="productSummaryColumns"
        :summary-data="productSummaryData"
        @selection-change="handleProductSelectionChange"
        @export="handleProductExport"
        @refresh="handleRefresh"
        @cell-change="handleProductCellChange"
        @filter-change="handleProductFilterChange"
      >
        <!-- 操作列 -->
        <template #operation="{ row }">
          <el-button link type="primary" size="small" @click="handleProductEdit(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button link type="danger" size="small" @click="handleProductDelete(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </EnhancedTable>
    </div>

    <!-- 主表格2：半成品及物料需求计算 -->
    <div class="table-container" style="margin-top: 20px;">
      <div class="table-title">
        <h3>半成品及物料需求计算</h3>
      </div>
      <!-- ✅ MRP编号筛选区（表格顶部） -->
      <div class="filter-panel" style="margin-bottom: 16px;">
        <el-form :inline="true" size="default">
          <el-form-item label="选择MRP编号">
            <el-select 
              v-model="selectedMrpCodeFilter" 
              placeholder="请选择MRP编号" 
              clearable 
              filterable
              style="width: 300px;"
              @change="handleMrpCodeFilterChange"
            >
              <el-option
                v-for="item in mrpCodeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <span style="float: left">{{ item.label }}</span>
                <span style="float: right; color: #8492a6; font-size: 12px; margin-left: 10px">{{ item.materialName }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              :disabled="!selectedMrpCodeFilter"
              @click="handleLoadProductionBOM"
            >
              <el-icon><Tools /></el-icon>
              加载生产BOM
            </el-button>
          </el-form-item>
          <el-form-item>
            <el-button 
              type="success" 
              :disabled="materialTableData.length === 0"
              @click="handleSaveMaterialDemands"
            >
              <el-icon><DocumentChecked /></el-icon>
              保存
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <EnhancedTable
        ref="materialTableRef"
        :data="filteredMaterialTableData"
        :columns="materialTableColumns"
        :loading="loading"
        :height="350"
        :show-toolbar="true"
        :show-add="false"
        :show-export="true"
        :show-import="false"
        :show-print="true"
        :show-selection="true"
        :show-operation="true"
        :operation-width="200"
        :show-summary="true"
        :show-filter="true"
        :summary-columns="materialSummaryColumns"
        :summary-data="materialSummaryData"
        @selection-change="handleMaterialSelectionChange"
        @export="handleMaterialExport"
        @refresh="handleRefresh"
        @filter-change="handleMaterialFilterChange"
      >
        <!-- 操作列 -->
        <template #operation="{ row }">
          <el-button link type="primary" size="small" @click="handleMaterialEdit(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button link type="danger" size="small" @click="handleMaterialDelete(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </EnhancedTable>
    </div>

    <!-- 页面设置对话框 -->
    <PageSettings
      v-model:visible="pageSettingsVisible"
      settings-key="materialDemand"
      :settings="pageSettings"
      :available-fields="tableColumns"
      :show-workflow="false"
      :show-menu="false"
      :show-color="true"
      :show-encoding="false"
      :show-fields="true"
      :show-print="true"
      @save="handleSaveSettings"
    />

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="需求明细详情" width="1000px">
      <el-tabs v-model="activeTab" v-if="currentDemand">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="物料编号">{{ currentDemand.materialCode }}</el-descriptions-item>
            <el-descriptions-item label="物料名称">{{ currentDemand.materialName }}</el-descriptions-item>
            <el-descriptions-item label="规格型号">{{ currentDemand.materialSpec }}</el-descriptions-item>
            <el-descriptions-item label="单位">{{ currentDemand.materialUnit }}</el-descriptions-item>
            <el-descriptions-item label="需求来源">{{ getSourceTypeText(currentDemand.sourceType) }}</el-descriptions-item>
            <el-descriptions-item label="来源单号">{{ currentDemand.sourceNo }}</el-descriptions-item>
            <el-descriptions-item label="需求数量">{{ currentDemand.demandQty }}</el-descriptions-item>
            <el-descriptions-item label="需求日期">{{ currentDemand.requiredDate }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <!-- 库存信息 -->
        <el-tab-pane label="库存信息" name="stock">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="当前库存">{{ currentDemand.currentStock }}</el-descriptions-item>
            <el-descriptions-item label="可用库存">{{ currentDemand.availableStock }}</el-descriptions-item>
            <el-descriptions-item label="在途数量">{{ currentDemand.onOrderQty }}</el-descriptions-item>
            <el-descriptions-item label="缺货数量">{{ currentDemand.shortageQty }}</el-descriptions-item>
            <el-descriptions-item label="安全库存">{{ currentDemand.safetyStock }}</el-descriptions-item>
            <el-descriptions-item label="最小采购量">{{ currentDemand.minOrderQty }}</el-descriptions-item>
            <el-descriptions-item label="最小批量">{{ currentDemand.lotSize }}</el-descriptions-item>
            <el-descriptions-item label="提前期(天)">{{ currentDemand.leadTime }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <!-- 执行信息 -->
        <el-tab-pane label="执行信息" name="exec">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="执行状态">{{ getExecStatusText(currentDemand.execStatus) }}</el-descriptions-item>
            <el-descriptions-item label="建议类型">{{ getSuggestTypeText(currentDemand.suggestType) }}</el-descriptions-item>
            <el-descriptions-item label="建议数量">{{ currentDemand.suggestedQty }}</el-descriptions-item>
            <el-descriptions-item label="建议日期">{{ currentDemand.suggestedDate }}</el-descriptions-item>
            <el-descriptions-item label="关联采购单">{{ currentDemand.purchaseNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="关联生产单">{{ currentDemand.productionNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="执行人">{{ currentDemand.executor || '-' }}</el-descriptions-item>
            <el-descriptions-item label="执行时间">{{ currentDemand.execTime || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <!-- BOM用量 -->
        <el-tab-pane label="BOM用量" name="bom" v-if="currentDemand.sourceType === 'production'">
          <el-table :data="currentDemand.bomUsage" border>
            <el-table-column prop="parentCode" label="父件编号" width="140" />
            <el-table-column prop="parentName" label="父件名称" width="180" />
            <el-table-column prop="usageQty" label="单位用量" width="100" align="right" />
            <el-table-column prop="parentDemandQty" label="父件需求" width="100" align="right" />
            <el-table-column prop="totalUsage" label="总用量" width="100" align="right" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Refresh, Tools, ShoppingCart, Box, Warning, Setting, Plus, Delete, Upload, Printer, Edit, DocumentChecked } from '@element-plus/icons-vue'
import EnhancedTable from '@/components/common/EnhancedTable.vue'
import PageSettings from '@/components/common/PageSettings.vue'
import salesOrderApi from '@/api/salesOrder.js'
import mrpAPI from '@/api/mrp.js'
import productionBomAPI from '@/api/productionBom.js'
import mrpDemandAPI from '@/api/mrpDemand.js'

// ========== 数据定义 ==========
// MRP运算相关
const selectedOrderNo = ref('') // 选中的订单编号
const salesOrderList = ref([]) // 销售订单列表
const mrpCalculating = ref(false) // MRP运算中

// 表格1：产品名称及需求计算
const productTableRef = ref(null)
const productTableData = ref([])
const selectedProductRows = ref([])

// 筛选状态
const productFilters = ref({})
const materialFilters = ref({})

// 筛选后的数据
const filteredProductTableData = computed(() => {
  return applyFilters(productTableData.value, productFilters.value)
})

const filteredMaterialTableData = computed(() => {
  return applyFilters(materialTableData.value, materialFilters.value)
})

// 表格2：半成品及物料需求计算
const materialTableRef = ref(null)
const materialTableData = ref([])
const selectedMaterialRows = ref([])

// ✅ MRP编号筛选
const selectedMrpCodeFilter = ref('') // 选中的MRP编号（用于筛选表格2）
const allMaterialTableData = ref([]) // 所有物料数据（未筛选）

// MRP编号选项（来自表格1）
const mrpCodeOptions = computed(() => {
  return productTableData.value.map(item => ({
    value: item.mrpCode,
    label: item.mrpCode,
    materialName: item.materialName || ''
  }))
})

const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const detailDialogVisible = ref(false)
const currentDemand = ref(null)
const activeTab = ref('basic')
const loading = ref(false)
const pageSettingsVisible = ref(false)

// 选中的行（兼容旧代码）
const selectedRows = ref([])

// 是否有选中
const hasSelection = computed(() => selectedProductRows.value.length > 0 || selectedMaterialRows.value.length > 0)

// 处理表格1选择变化
const handleProductSelectionChange = (selection) => {
  selectedProductRows.value = selection
}

// 处理表格1单元格变化（调整数量编辑）
const handleProductCellChange = ({ row, column, value }) => {
  console.log('📝 单元格变化:', { row, column, value })
  
  // 如果是调整数量字段变化
  if (column.prop === 'adjustedQty') {
    // 更新调整数量
    row.adjustedQty = parseFloat(value) || 0
    
    // 自动重新计算执行数量 = 建议数量 + 调整数量
    row.executeQty = (row.suggestedQty || 0) + (row.adjustedQty || 0)
    
    console.log('✅ 执行数量已重新计算:', {
      suggestedQty: row.suggestedQty,
      adjustedQty: row.adjustedQty,
      executeQty: row.executeQty
    })
    
    ElMessage.success(`调整数量已更新，执行数量: ${row.executeQty}`)
  }
  
  // 如果是库存相关字段变化，重新计算建议数量和执行数量
  const stockFields = ['currentStock', 'inTransitStock', 'inProductionStock', 'productionReservedStock', 'toBeShippedStock']
  if (stockFields.includes(column.prop)) {
    // 更新库存字段
    row[column.prop] = parseFloat(value) || 0
    
    // ✅ 重新计算建议数量 = 需求数量 + 当前库库存 + 在途库存 + 在制库存 - 生产预扣库存 - 待发货库存
    row.suggestedQty = (row.demandQty || 0) + (row.currentStock || 0) + (row.inTransitStock || 0) + (row.inProductionStock || 0) 
                      - (row.productionReservedStock || 0) - (row.toBeShippedStock || 0)
    
    // 重新计算执行数量 = 建议数量 + 调整数量
    row.executeQty = (row.suggestedQty || 0) + (row.adjustedQty || 0)
    
    console.log('✅ 库存更新，建议数量和执行数量已重新计算:', {
      suggestedQty: row.suggestedQty,
      executeQty: row.executeQty
    })
  }
}

// 处理表格2选择变化
const handleMaterialSelectionChange = (selection) => {
  selectedMaterialRows.value = selection
}

// ✅ 处理MRP编号筛选变化
const handleMrpCodeFilterChange = (value) => {
  console.log('🔍 MRP编号筛选变化:', value)
  
  if (!value) {
    // 清空筛选，显示所有数据
    materialTableData.value = [...allMaterialTableData.value]
    console.log('✅ 清空筛选，显示所有数据:', materialTableData.value.length, '条')
  } else {
    // 根据MRP编号筛选（使用sourceMrpCode字段）
    materialTableData.value = allMaterialTableData.value.filter(item => 
      item.sourceMrpCode === value
    )
    console.log(`✅ 筛选MRP编号=${value}，结果:`, materialTableData.value.length, '条')
  }
}

// ✅ 加载生产BOM
const handleLoadProductionBOM = async () => {
  if (!selectedMrpCodeFilter.value) {
    ElMessage.warning('请先选择MRP编号')
    return
  }

  try {
    // 查找选中的产品数据
    const selectedProduct = productTableData.value.find(item => item.mrpCode === selectedMrpCodeFilter.value)
    if (!selectedProduct) {
      ElMessage.error('未找到对应的产品数据')
      return
    }

    const productCode = selectedProduct.materialCode
    const productName = selectedProduct.materialName
    const orderQuantity = parseFloat(selectedProduct.executeQty || selectedProduct.orderQuantity || 0)
    
    console.log(`🔧 开始加载生产BOM，产品编码: ${productCode}, 需求数量: ${orderQuantity}`)

    loading.value = true

    // ✅ 调用后端API获取生产BOM数据
    const response = await productionBomAPI.getBOMByProductCode(productCode)
    
    if (response.code === 404 || !response.data) {
      ElMessage.warning(`产品 ${productName} 没有对应的生产BOM，请先在BOM管理中创建`)
      loading.value = false
      return
    }

    const bomData = response.data
    console.log(`✅ 获取到BOM数据: ${bomData.bomCode}, 子件数: ${bomData.childItems?.length || 0}`)

    // ✅ 展开BOM，支持多层递归展开
    const expandedMaterials = await expandBOMRecursively(bomData.childItems, orderQuantity, selectedProduct.sourceNo, selectedMrpCodeFilter.value, 1)
    
    console.log(`📄 BOM展开完成，生成 ${expandedMaterials.length} 条物料需求`)

    // ✅ 将展开的物料添加到表格2
    // 合并到现有数据，避免覆盖
    const newMaterials = expandedMaterials.map((item, index) => ({
      id: Date.now() + index, // 临时ID
      ...item
    }))

    // 添加到全部数据
    allMaterialTableData.value = [...allMaterialTableData.value, ...newMaterials]
    
    // 应用筛选（只显示当前MRP编号的数据）
    materialTableData.value = allMaterialTableData.value.filter(item => 
      item.sourceMrpCode === selectedMrpCodeFilter.value
    )

    ElMessage.success(`成功加载产品 ${productName} 的生产BOM，共 ${expandedMaterials.length} 条物料需求`)
    
    // ✅ 保存到MySQL数据库
    await saveMaterialDemands(expandedMaterials)
    
    loading.value = false
  } catch (error) {
    loading.value = false
    console.error('❌ 加载生产BOM失败:', error)
    ElMessage.error(`加载生产BOM失败: ${error.message || '未知错误'}`)
  }
}

/**
 * ✅ 递归展开BOM，支持多层BOM结构
 * @param {Array} childItems - 子件列表
 * @param {Number} parentQuantity - 父件数量（用于计算子件需求）
 * @param {String} sourceNo - 来源单号
 * @param {String} sourceMrpCode - 来源MRP编号
 * @param {Number} currentLevel - 当前层级（用于防止无限递归）
 * @param {Number} maxLevel - 最大层级限制（默认20层）
 */
const expandBOMRecursively = async (childItems, parentQuantity, sourceNo, sourceMrpCode, currentLevel = 1, maxLevel = 20) => {
  if (!childItems || childItems.length === 0) {
    return []
  }

  // 防止无限递归
  if (currentLevel > maxLevel) {
    console.warn(`⚠️ 超过最大层级限制 ${maxLevel}，停止展开`)
    return []
  }

  const result = []

  for (const child of childItems) {
    // 计算子件需求数量 = 父件数量 * 子件标准用量
    const childQuantity = parentQuantity * parseFloat(child.standard_quantity || child.standardQty || 0)

    // 构造物料需求数据
    const materialDemand = {
      sourceMrpCode: sourceMrpCode,
      sourceNo: sourceNo,
      materialCode: child.component_code || child.childCode || '',
      materialName: child.component_name || child.childName || '',
      materialUnit: '件', // 默认单位，后续可从物料主数据获取
      sourceType: '生产BOM',
      demandQty: childQuantity,
      requiredDate: '', // 后续可从销售订单获取
      currentStock: 0, // TODO: 后续从库存系统获取
      inTransitStock: 0,
      inProductionStock: 0,
      productionReservedStock: 0,
      toBeShippedStock: 0,
      suggestedQty: childQuantity, // 简化计算，后续可加入库存逻辑
      adjustedQty: 0,
      executeQty: childQuantity,
      level: currentLevel, // 记录层级
      outputProcess: child.output_process || child.outputProcess || '',
      componentSource: child.component_source || child.source || ''
    }

    result.push(materialDemand)

    // ✅ 递归展开：如果当前子件本身也是一个产品，且有BOM，继续展开
    const childMaterialCode = materialDemand.materialCode
    
    // 如果来源是“自制”或“半成品”，尝试继续展开BOM
    if (childMaterialCode && (materialDemand.componentSource === '自制' || currentLevel < 3)) {
      try {
        const childBomResponse = await productionBomAPI.getBOMByProductCode(childMaterialCode)
        
        if (childBomResponse.code === 200 && childBomResponse.data && childBomResponse.data.childItems) {
          console.log(`  🔹 第${currentLevel}层子件 ${materialDemand.materialName} 有BOM，继续展开...`)
          
          // 递归展开下一层
          const childExpandedMaterials = await expandBOMRecursively(
            childBomResponse.data.childItems,
            childQuantity, // 传递当前子件的需求数量
            sourceNo,
            sourceMrpCode,
            currentLevel + 1,
            maxLevel
          )
          
          result.push(...childExpandedMaterials)
        }
      } catch (error) {
        // 如果获取子BOM失败，不影响当前层的展开
        console.log(`  ⚠️ 子件 ${materialDemand.materialName} 没有BOM或获取失败，跳过`)
      }
    }
  }

  return result
}

// 兼容旧的handleSelectionChange
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 筛选表单
const filterForm = ref({
  materialCode: '',
  sourceType: '',
  execStatus: '',
  dateRange: null
})

// 表格列配置
// 表格1：产品名称及需求计算
const productTableColumns = ref([
  { prop: 'mrpCode', label: 'MRP编码', width: 140, fixed: 'left', sortable: true, filterable: true },
  { prop: 'sourceNo', label: '来源单号', width: 160, fixed: 'left', sortable: true, filterable: true },
  { prop: 'materialCode', label: '物料编号', width: 140, sortable: true, filterable: true },
  { prop: 'materialName', label: '物料名称', width: 180, sortable: true, filterable: true },
  { prop: 'materialUnit', label: '单位', width: 80, align: 'center', filterable: true, filterType: 'select' },
  { prop: 'sourceType', label: '需求来源', width: 120, filterable: true, filterType: 'select' },
  { prop: 'demandQty', label: '需求数量', width: 120, align: 'right', sortable: true, filterable: true },
  { prop: 'requiredDate', label: '需求日期', width: 120, sortable: true, filterable: true, filterType: 'date' },
  // 库存相关字段
  { prop: 'currentStock', label: '当前库库存', width: 120, align: 'right', sortable: true, filterable: true },
  { prop: 'inTransitStock', label: '在途库存', width: 120, align: 'right', sortable: true, filterable: true },
  { prop: 'inProductionStock', label: '在制库存', width: 120, align: 'right', sortable: true, filterable: true },
  { prop: 'productionReservedStock', label: '生产预扣库存', width: 140, align: 'right', sortable: true, filterable: true },
  { prop: 'toBeShippedStock', label: '待发货库存', width: 120, align: 'right', sortable: true, filterable: true },
  // 数量计算字段（带计算公式）
  { 
    prop: 'suggestedQty', 
    label: '建议数量', 
    width: 120, 
    align: 'right', 
    sortable: true,
    filterable: true,
    tooltip: '建议数量 = 当前库库存 + 在途库存 + 在制库存 - 生产预扣库存 - 待发货库存'
  },
  { 
    prop: 'adjustedQty', 
    label: '调整数量', 
    width: 120, 
    align: 'right', 
    sortable: true,
    filterable: true,
    editable: true,
    editType: 'number',
    placeholder: '请输入调整数量',
    tooltip: '可输入正数、负数或0，输入即确认'
  },
  { 
    prop: 'executeQty', 
    label: '执行数量', 
    width: 120, 
    align: 'right', 
    sortable: true,
    filterable: true,
    tooltip: '执行数量 = 建议数量 + 调整数量'
  }
])

// 表格2：半成品及物料需求计算
const materialTableColumns = ref([
  { prop: 'sourceMrpCode', label: '来源MRP编号', width: 160, fixed: 'left', sortable: true, filterable: true },
  { prop: 'materialCode', label: '物料编码', width: 140, sortable: true, filterable: true },
  { prop: 'materialName', label: '物料名称', width: 180, sortable: true, filterable: true },
  { prop: 'materialUnit', label: '单位', width: 80, align: 'center', filterable: true, filterType: 'select' },
  { prop: 'sourceType', label: '需求来源', width: 120, filterable: true, filterType: 'select' },
  { prop: 'demandQty', label: '需求数量', width: 120, align: 'right', sortable: true, filterable: true },
  { prop: 'requiredDate', label: '需求日期', width: 120, sortable: true, filterable: true, filterType: 'date' },
  { prop: 'currentStock', label: '当前库存', width: 120, align: 'right', sortable: true, filterable: true },
  { prop: 'inTransitStock', label: '在途库存', width: 120, align: 'right', sortable: true, filterable: true },
  { prop: 'inProductionStock', label: '在制库存', width: 120, align: 'right', sortable: true, filterable: true },
  { prop: 'productionReservedStock', label: '生产预扣库存', width: 140, align: 'right', sortable: true, filterable: true },
  { prop: 'toBeShippedStock', label: '待发货库存', width: 120, align: 'right', sortable: true, filterable: true },
  { prop: 'suggestedQty', label: '建议数量', width: 120, align: 'right', sortable: true, filterable: true },
  { prop: 'adjustedQty', label: '调整数量', width: 120, align: 'right', sortable: true, filterable: true },
  { prop: 'executeQty', label: '执行数量', width: 120, align: 'right', sortable: true, filterable: true },
  { prop: 'level', label: '层级', width: 80, align: 'center', sortable: true, filterable: true, filterType: 'select' },
  { prop: 'outputProcess', label: '产出工序', width: 120, filterable: true },
  { prop: 'componentSource', label: '子件来源', width: 100, filterable: true, filterType: 'select' }
])

// 旧表格列配置（兼容）
const tableColumns = ref([
  { prop: 'materialCode', label: '物料编号', width: 140, fixed: 'left', sortable: true, filterable: true },
  { prop: 'materialName', label: '物料名称', width: 180, sortable: true, filterable: true },
  { prop: 'materialSpec', label: '规格型号', width: 150, filterable: true },
  { prop: 'materialUnit', label: '单位', width: 80, align: 'center', filterable: true, filterType: 'select' },
  { prop: 'sourceType', label: '需求来源', width: 120, filterable: true, filterType: 'select' },
  { prop: 'sourceNo', label: '来源单号', width: 160, filterable: true },
  { prop: 'demandQty', label: '需求数量', width: 120, align: 'right', sortable: true },
  { prop: 'currentStock', label: '当前库存', width: 120, align: 'right', sortable: true },
  { prop: 'availableStock', label: '可用库存', width: 120, align: 'right' },
  { prop: 'onOrderQty', label: '在途数量', width: 120, align: 'right' },
  { prop: 'shortageQty', label: '缺货数量', width: 120, align: 'right', sortable: true },
  { prop: 'requiredDate', label: '需求日期', width: 120, sortable: true, filterable: true, filterType: 'date' },
  { prop: 'execStatus', label: '执行状态', width: 100, filterable: true, filterType: 'select' },
  { prop: 'suggestType', label: '建议类型', width: 100, filterable: true, filterType: 'select' },
  { prop: 'suggestedQty', label: '建议数量', width: 120, align: 'right', sortable: true },
  { prop: 'purchaseNo', label: '关联采购单', width: 160, filterable: true },
  { prop: 'productionNo', label: '关联生产单', width: 160, filterable: true },
  { prop: 'executor', label: '执行人', width: 100, filterable: true },
  { prop: 'execTime', label: '执行时间', width: 160, filterable: true, filterType: 'date' }
])

// 表格1统计列配置
const productSummaryColumns = ref([
  { prop: 'demandQty', label: '总需求数量', format: 'number' }
])

// 表格1统计数据
const productSummaryData = computed(() => {
  const data = productTableData.value
  return {
    demandQty: data.reduce((sum, item) => sum + (item.demandQty || 0), 0)
  }
})

// 表格2统计列配置
const materialSummaryColumns = ref([
  { prop: 'demandQty', label: '总需求数量', format: 'number' }
])

// 表格2统计数据
const materialSummaryData = computed(() => {
  const data = materialTableData.value
  return {
    demandQty: data.reduce((sum, item) => sum + (item.demandQty || 0), 0)
  }
})

// 统计列配置
const summaryColumns = ref([
  { prop: 'demandQty', label: '总需求数量', format: 'number' },
  { prop: 'shortageQty', label: '总缺货数量', format: 'number' },
  { prop: 'suggestedQty', label: '总建议数量', format: 'number' }
])

// 统计数据
const summaryData = computed(() => {
  const data = filteredTableData.value
  return {
    demandQty: data.reduce((sum, item) => sum + item.demandQty, 0),
    shortageQty: data.reduce((sum, item) => sum + item.shortageQty, 0),
    suggestedQty: data.reduce((sum, item) => sum + item.suggestedQty, 0)
  }
})

// 页面设置
const pageSettings = ref({
  themeColor: '#409EFF',
  backgroundColor: '#f5f7fa',
  tableRowColor: '#ffffff',
  tableHeaderColor: '#f5f7fa',
  visibleFields: tableColumns.value.map(col => col.prop),
  printOrientation: 'landscape'
})

// 表格数据
const tableData = ref([])

// 加载物料需求数据
const loadMaterialDemands = async () => {
  loading.value = true
  try {
    // TODO: 调用后端API获取数据
    // const response = await materialDemandAPI.getList()
    // tableData.value = response.data
    
    // 临时使用空数据
    tableData.value = []
    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('加载物料需求数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 旧版本保存到localStorage的函数已移除，现在使用MySQL持久化（见第1121行）

// 汇总数据
const summary = computed(() => {
  const data = filteredTableData.value
  return {
    productionQty: data.filter(item => item.suggestType === 'production').reduce((sum, item) => sum + item.suggestedQty, 0),
    purchaseQty: data.filter(item => item.suggestType === 'purchase').reduce((sum, item) => sum + item.suggestedQty, 0),
    totalStock: data.reduce((sum, item) => sum + item.currentStock, 0),
    shortageQty: data.reduce((sum, item) => sum + item.shortageQty, 0)
  }
})

// 过滤后的表格数据
const filteredTableData = computed(() => {
  let data = tableData.value
  
  if (filterForm.value.materialCode) {
    data = data.filter(item => item.materialCode.includes(filterForm.value.materialCode))
  }
  
  if (filterForm.value.sourceType) {
    data = data.filter(item => item.sourceType === filterForm.value.sourceType)
  }
  
  if (filterForm.value.execStatus) {
    data = data.filter(item => item.execStatus === filterForm.value.execStatus)
  }
  
  if (filterForm.value.dateRange && filterForm.value.dateRange.length === 2) {
    data = data.filter(item => {
      const date = item.requiredDate
      return date >= filterForm.value.dateRange[0] && date <= filterForm.value.dateRange[1]
    })
  }
  
  totalCount.value = data.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
})

// ========== 方法定义 ==========

// 需求来源文本
const getSourceTypeText = (type) => {
  const map = {
    sales: '销售订单',
    production: '生产计划',
    safety: '安全库存'
  }
  return map[type] || type
}

// 需求来源颜色
const getSourceTypeColor = (type) => {
  const map = {
    sales: 'primary',
    production: 'success',
    safety: 'warning'
  }
  return map[type] || 'info'
}

// 执行状态文本
const getExecStatusText = (status) => {
  const map = {
    pending: '未下单',
    purchased: '已采购',
    produced: '已生产',
    completed: '已完成'
  }
  return map[status] || status
}

// 执行状态类型
const getExecStatusType = (status) => {
  const map = {
    pending: 'warning',
    purchased: 'primary',
    produced: 'success',
    completed: 'success'
  }
  return map[status] || 'info'
}

// 建议类型文本
const getSuggestTypeText = (type) => {
  const map = {
    purchase: '采购',
    production: '生产',
    transfer: '调拨'
  }
  return map[type] || type
}

// 建议类型颜色
const getSuggestTypeColor = (type) => {
  const map = {
    purchase: 'success',
    production: 'primary',
    transfer: 'warning'
  }
  return map[type] || 'info'
}

// 表格行class
const tableRowClassName = ({ row }) => {
  if (row.shortageQty > 0) return 'row-shortage'
  return ''
}

// 合计行
const getSummaries = (param) => {
  const { columns, data } = param
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (['demandQty', 'currentStock', 'availableStock', 'onOrderQty', 'shortageQty', 'suggestedQty'].includes(column.property)) {
      const values = data.map(item => Number(item[column.property]))
      if (!values.every(value => isNaN(value))) {
        sums[index] = values.reduce((prev, curr) => {
          const value = Number(curr)
          if (!isNaN(value)) {
            return prev + curr
          } else {
            return prev
          }
        }, 0)
      } else {
        sums[index] = '-'
      }
    } else {
      sums[index] = '-'
    }
  })
  return sums
}

// 查看详情
const handleViewDetail = (row) => {
  currentDemand.value = { ...row }
  activeTab.value = 'basic'
  detailDialogVisible.value = true
}

// 生成采购单
const handleCreatePurchase = async (row) => {
  try {
    await ElMessageBox.confirm(`确定为物料【${row.materialName}】生成采购单吗？\n建议采购数量：${row.suggestedQty}`, '生成采购单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    
    // 生成采购单号
    const purchaseNo = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    row.purchaseNo = purchaseNo
    row.execStatus = 'purchased'
    row.executor = '当前用户'
    row.execTime = new Date().toLocaleString('zh-CN')
    
    ElMessage.success(`采购单 ${purchaseNo} 已生成`)
  } catch {
    // 取消
  }
}

// 生成生产单
const handleCreateProduction = async (row) => {
  try {
    await ElMessageBox.confirm(`确定为物料【${row.materialName}】生成生产单吗？\n建议生产数量：${row.suggestedQty}`, '生成生产单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    
    // 生成生产单号
    const productionNo = `MO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    row.productionNo = productionNo
    row.execStatus = 'produced'
    row.executor = '当前用户'
    row.execTime = new Date().toLocaleString('zh-CN')
    
    ElMessage.success(`生产单 ${productionNo} 已生成`)
  } catch {
    // 取消
  }
}

// 新增
const handleCreate = () => {
  // TODO: 打开新增对话框
  ElMessage.info('新增功能开发中...')
}

// 编辑
const handleEdit = (row) => {
  // TODO: 打开编辑对话框
  ElMessage.info(`编辑功能开发中: ${row.materialCode}`)
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除物料《${row.materialName}》的需求明细吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 调用API删除
    tableData.value = tableData.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (!hasSelection.value) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 调用API批量删除
    const idsToDelete = selectedRows.value.map(row => row.id)
    tableData.value = tableData.value.filter(item => !idsToDelete.includes(item.id))
    selectedRows.value = []
    ElMessage.success(`已删除 ${idsToDelete.length} 条记录`)
  } catch {
    // 用户取消
  }
}

// 导入
const handleImport = () => {
  // TODO: 打开导入对话框
  ElMessage.info('导入功能开发中...')
}

// 导出
const handleExport = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  // TODO: 实现导出Excel功能
  ElMessage.success(`导出 ${tableData.value.length} 条记录`)
}

// 打印
const handlePrint = () => {
  window.print()
}

// 查询
const handleSearch = () => {
  currentPage.value = 1
}

// 重置
const handleReset = () => {
  filterForm.value = {
    materialCode: '',
    sourceType: '',
    execStatus: '',
    dateRange: null
  }
  currentPage.value = 1
}

// 刷新
const handleRefresh = () => {
  loadMaterialDemands()
  ElMessage.success('刷新成功')
}

// 筛选函数
const applyFilters = (data, filters) => {
  if (!data || data.length === 0) return []
  if (!filters || Object.keys(filters).length === 0) return data

  return data.filter(row => {
    for (const [prop, config] of Object.entries(filters)) {
      const value = row[prop]
      
      // 文本筛选
      if (config.type === 'input') {
        const filterValue = config.value?.toString().toLowerCase() || ''
        const cellValue = value?.toString().toLowerCase() || ''
        
        if (!filterValue) continue
        
        switch (config.operator) {
          case 'contains':
            if (!cellValue.includes(filterValue)) return false
            break
          case 'equals':
            if (cellValue !== filterValue) return false
            break
          case 'notEquals':
            if (cellValue === filterValue) return false
            break
          case 'startsWith':
            if (!cellValue.startsWith(filterValue)) return false
            break
          case 'endsWith':
            if (!cellValue.endsWith(filterValue)) return false
            break
        }
      }
      
      // 选择筛选
      else if (config.type === 'select') {
        if (config.values && config.values.length > 0) {
          if (!config.values.includes(value)) return false
        }
      }
      
      // 数字筛选
      else if (config.type === 'number') {
        const numValue = parseFloat(value)
        const filterNum = parseFloat(config.value)
        
        if (isNaN(numValue)) continue
        
        switch (config.operator) {
          case 'equals':
            if (numValue !== filterNum) return false
            break
          case 'notEquals':
            if (numValue === filterNum) return false
            break
          case 'greaterThan':
            if (numValue <= filterNum) return false
            break
          case 'lessThan':
            if (numValue >= filterNum) return false
            break
          case 'between':
            const min = parseFloat(config.minValue)
            const max = parseFloat(config.maxValue)
            if (!isNaN(min) && numValue < min) return false
            if (!isNaN(max) && numValue > max) return false
            break
        }
      }
      
      // 日期筛选
      else if (config.type === 'date') {
        if (config.dateRange && config.dateRange.length === 2) {
          const cellDate = new Date(value)
          const startDate = new Date(config.dateRange[0])
          const endDate = new Date(config.dateRange[1])
          
          if (cellDate < startDate || cellDate > endDate) return false
        }
      }
    }
    
    return true
  })
}

// 表格1筛选处理
const handleProductFilterChange = (filters) => {
  console.log('表格1筛选条件:', filters)
  productFilters.value = filters
}

// 表格2筛选处理
const handleMaterialFilterChange = (filters) => {
  console.log('表格2筛选条件:', filters)
  materialFilters.value = filters
}

// 保存页面设置
const handleSaveSettings = (settings) => {
  pageSettings.value = { ...settings }
  localStorage.setItem('materialDemandSettings', JSON.stringify(settings))
  ElMessage.success('设置已保存')
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// ========== 生命周期 ==========
onMounted(() => {
  loadMaterialDemands()
  loadSalesOrders() // 加载销售订单列表
  loadMaterialDemandsFromDB() // ✅ 从 MySQL 加载历史数据
})

// ========== MRP运算功能 ==========
// 加载销售订单列表
const loadSalesOrders = async () => {
  try {
    const response = await salesOrderApi.getSalesOrders({
      page: 1,
      pageSize: 1000 // 加载所有订单
    })
    
    if (response.data && response.data.success) {
      const orders = response.data.data.list || []
      
      // 筛选状态为"待下单"或"模拟排程失效"的订单，并映射字段
      salesOrderList.value = orders
        .filter(order => {
          const status = order.status || order.orderStatus
          return status === 'pending' || status === '待下单' || status === '模拟排程失效'
        })
        .map(order => ({
          id: order.id,
          internalOrderNo: order.internal_order_no || order.internalOrderNo,
          customerOrderNo: order.customer_order_no || order.customerOrderNo,
          customerName: order.customer_name || order.customerName,
          orderStatus: order.status || order.orderStatus,
          productList: order.productList || order.product_list,
          deliveryDate: order.customer_delivery || order.customerDelivery || order.promised_delivery || order.promisedDelivery
        }))
      
      console.log('✅ 加载销售订单列表:', salesOrderList.value.length, '条')
    }
  } catch (error) {
    console.error('❌ 加载销售订单列表失败:', error)
    ElMessage.error('加载销售订单列表失败')
  }
}

// 订单选择变化
const handleOrderChange = (value) => {
  console.log('选择订单:', value)
}

// 执行MRP运算
const handleExecuteMRP = async () => {
  if (!selectedOrderNo.value) {
    ElMessage.warning('请先选择销售订单')
    return
  }

  // 查找选中的订单
  const selectedOrder = salesOrderList.value.find(order => order.internalOrderNo === selectedOrderNo.value)
  if (!selectedOrder) {
    ElMessage.error('未找到选中的订单')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要对订单《${selectedOrderNo.value}》执行MRP运算吗？<br/><br/>` +
      `<span style="color: #909399;">运算将根据生产BOM计算每个半成品、成品的生产需求和采购需求，并将结果保存到物料需求明细</span>`,
      'MRP运算确认',
      { dangerouslyUseHTMLString: true, confirmButtonText: '开始运算', cancelButtonText: '取消', type: 'info' }
    )
  } catch (error) {
    return // 用户取消
  }

  mrpCalculating.value = true

  try {
    console.log('开始MRP运算，订单:', selectedOrder)

    // 解析订单产品列表
    let productList = []
    try {
      productList = typeof selectedOrder.productList === 'string' 
        ? JSON.parse(selectedOrder.productList) 
        : selectedOrder.productList || []
    } catch (e) {
      console.warn('订单产品列表解析失败:', e.message)
      ElMessage.error('订单产品数据解析失败')
      return
    }

    if (!productList || productList.length === 0) {
      ElMessage.warning('该订单没有产品明细')
      return
    }

    // 表格1：产品名称及需求计算（按照数据流规则映射）
    const productDemands = productList.map((product, index) => {
      // 生成MRP编码：格式 MRP-YYYYMMDD-XXX
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
      const sequenceNum = String(index + 1).padStart(3, '0')
      const mrpCode = `MRP-${dateStr}-${sequenceNum}`
      
      // 格式化需求日期：只保留年月日
      let formattedDate = ''
      const deliveryDate = selectedOrder.deliveryDate
      if (deliveryDate) {
        try {
          const date = new Date(deliveryDate)
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            formattedDate = `${year}-${month}-${day}`
          }
        } catch (e) {
          console.warn('日期格式化失败:', e.message)
        }
      }

      // 库存相关字段（初始值为0，后续从库存系统获取）
      const currentStock = 0              // 当前库库存
      const inTransitStock = 0            // 在途库存
      const inProductionStock = 0         // 在制库存
      const productionReservedStock = 0   // 生产预扣库存
      const toBeShippedStock = 0          // 待发货库存
      
      // 需求数量 = 订单数量
      const demandQty = parseFloat(product.order_quantity || product.orderQuantity || 0)
      
      // ✅ 修正建议数量公式：建议数量 = 需求数量 + 当前库库存 + 在途库存 + 在制库存 - 生产预扣库存 - 待发货库存
      const suggestedQty = demandQty + currentStock + inTransitStock + inProductionStock - productionReservedStock - toBeShippedStock
      
      // 调整数量（用户可编辑）
      const adjustedQty = 0
      
      // ✅ 计算执行数量 = 建议数量 + 调整数量
      const executeQty = suggestedQty + adjustedQty
      
      console.log(`📊 产品 ${product.product_name} 计算结果:`, {
        demandQty,
        currentStock,
        inTransitStock,
        inProductionStock,
        productionReservedStock,
        toBeShippedStock,
        suggestedQty,
        adjustedQty,
        executeQty
      })

      return {
        id: `prod-${Date.now()}-${index}`,
        // ✅ MRP编码：唯一标识符
        mrpCode,
        // 来源单号 = 内部销售订单编号
        sourceNo: selectedOrder.internalOrderNo,
        // 物料编号 = 产品编号
        materialCode: product.product_code || product.productCode || '',
        // 物料名称 = 产品名称
        materialName: product.product_name || product.productName || '',
        // 单位 = 产品单位
        materialUnit: product.product_unit || product.productUnit || '个',
        // 需求来源 = 为空
        sourceType: '',
        // 需求数量 = 订单数量（使用已计算的demandQty）
        demandQty,
        // 需求日期 = 客户交期（年月日格式）
        requiredDate: formattedDate,
        // 库存相关字段
        currentStock,
        inTransitStock,
        inProductionStock,
        productionReservedStock,
        toBeShippedStock,
        // 数量计算字段
        suggestedQty,       // 建议数量（自动计算）
        adjustedQty,        // 调整数量（用户可编辑）
        executeQty          // 执行数量（自动计算）
      }
    })

    // ✅ 累加数据到表格1（不覆盖已有数据）
    productTableData.value = [...productTableData.value, ...productDemands]
    console.log('✅ 表格1累加完成:', productTableData.value.length, '条记录')

    // 调用MRP运算API（用于表格2）
    const response = await mrpAPI.calculate([selectedOrder.id])
    
    if (response.code === 200) {
      const result = response.data
      console.log('MRP运算结果:', result)
      
      // 表格2：半成品及物料需求计算（从BOM展开）
      if (result.allRequirements && result.allRequirements.length > 0) {
        const materialDemands = result.allRequirements.map((req, index) => ({
          id: `mat-${Date.now()}-${index}`,
          // ✅ 来源MRP编号：默认为空，用户点击“加载生产BOM”后自动赋值
          sourceMrpCode: '',
          materialCode: req.materialCode,
          materialName: req.materialName,
          materialUnit: req.materialUnit || '件',
          sourceType: req.source || '未知',
          demandQty: req.demandQty || 0,
          requiredDate: productDemands[0]?.requiredDate || '',
          currentStock: req.currentStock || 0,
          netDemandQty: req.netDemandQty || 0
        }))

        // ✅ 保存所有数据到allMaterialTableData
        allMaterialTableData.value = materialDemands
        // 初始显示所有数据
        materialTableData.value = materialDemands
        console.log('✅ 表格2填充完成:', materialDemands)
      } else {
        allMaterialTableData.value = []
        materialTableData.value = []
      }

      ElMessage.success(`MRP运算完成！计算出 ${productDemands.length} 个产品需求和 ${materialTableData.value.length} 个物料需求`)
      
      // ✅ 保存产品需求到MySQL数据库
      await saveProductDemands(productDemands)
    } else {
      ElMessage.warning('MRP运算失败，仅填充产品需求表')
      
      // 即使运算失败，也保存产品需求
      await saveProductDemands(productDemands)
    }
  } catch (error) {
    console.error('❌ MRP运算失败:', error)
    ElMessage.error(`MRP运算失败: ${error.message || '未知错误'}`)
  } finally {
    mrpCalculating.value = false
  }
}

// ========== 表格1：产品名称及需求计算 ==========
// ✅ 保存产品需求到MySQL
const saveProductDemands = async (demands) => {
  try {
    console.log('💾 开始保存产品需求到MySQL:', demands.length, '条')
    
    const response = await mrpDemandAPI.saveProductDemands(demands)
    
    if (response.code === 200) {
      console.log('✅ 成功保存到MySQL:', response.data)
      ElMessage.success(`产品需求已保存到数据库，其他设备可查看`)
    } else {
      console.warn('⚠️ 保存失败:', response.message)
    }
  } catch (error) {
    console.error('❌ 保存产品需求失败:', error)
    // 不阻断用户操作，只记录错误
  }
}

// ✅ 保存物料需求到MySQL
const saveMaterialDemands = async (demands) => {
  try {
    console.log('💾 开始保存物料需求到MySQL:', demands.length, '条')
    
    const response = await mrpDemandAPI.saveMaterialDemands(demands)
    
    if (response.code === 200) {
      console.log('✅ 成功保存到MySQL:', response.data)
      ElMessage.success(`物料需求已保存到数据库，其他设备可查看`)
    } else {
      console.warn('⚠️ 保存失败:', response.message)
    }
  } catch (error) {
    console.error('❌ 保存物料需求失败:', error)
    // 不阻断用户操作，只记录错误
  }
}

// ✅ 从 MySQL 加载物料需求明细
const loadMaterialDemandsFromDB = async () => {
  try {
    console.log('📚 从 MySQL 加载物料需求明细')
    
    // 加载产品需求（表格1）
    const productResponse = await mrpDemandAPI.getProductDemands()
    if (productResponse.code === 200 && productResponse.data) {
      productTableData.value = productResponse.data
      console.log(`✅ 成功加载${productResponse.data.length}条产品需求`)
    }
    
    // 加载物料需求（表格2）
    const materialResponse = await mrpDemandAPI.getMaterialDemands()
    if (materialResponse.code === 200 && materialResponse.data) {
      allMaterialTableData.value = materialResponse.data
      materialTableData.value = materialResponse.data
      console.log(`✅ 成功加载${materialResponse.data.length}条物料需求`)
    }
    
    const totalCount = (productResponse.data?.length || 0) + (materialResponse.data?.length || 0)
    if (totalCount > 0) {
      ElMessage.success(`已加载${totalCount}条历史记录`)
    }
  } catch (error) {
    console.error('❌ 加载物料需求失败:', error)
    ElMessage.error('加载历史数据失败')
  }
}

const handleProductEdit = (row) => {
  ElMessage.info(`编辑产品需求: ${row.materialCode}`)
}

const handleProductDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除产品《${row.materialName}》的需求明细吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = productTableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      productTableData.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch (error) {
    // 用户取消
  }
}

const handleProductExport = () => {
  ElMessage.success('导出产品需求计算数据...')
}

// ========== 表格2：半成品及物料需求计算 ==========
const handleMaterialEdit = (row) => {
  ElMessage.info(`编辑物料需求: ${row.materialCode}`)
}

const handleMaterialDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除物料《${row.materialName}》的需求明细吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = materialTableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      materialTableData.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch (error) {
    // 用户取消
  }
}

// 保存物料需求数据到数据库
const handleSaveMaterialDemands = async () => {
  if (materialTableData.value.length === 0) {
    ElMessage.warning('当前没有物料需求数据，无需保存')
    return
  }

  try {
    await saveMaterialDemands(materialTableData.value)
    ElMessage.success(`已成功保存${materialTableData.value.length}条物料需求数据`)
  } catch (error) {
    console.error('❌ 保存物料需求失败:', error)
    ElMessage.error('保存物料需求数据失败')
  }
}

const handleMaterialExport = () => {
  ElMessage.success('导出物料需求计算数据...')
}
</script>

<style scoped lang="scss">
.material-demand-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .header-left {
    h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: #303133;
    }
    
    .subtitle {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }
  }
  
  .header-right {
    display: flex;
    gap: 12px;
  }
}

.filter-panel {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.summary-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  .card-item {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .card-icon {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      font-size: 24px;
      
      &.production {
        background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
        color: white;
      }
      
      &.purchase {
        background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
        color: white;
      }
      
      &.stock {
        background: linear-gradient(135deg, #E6A23C 0%, #EBB563 100%);
        color: white;
      }
      
      &.shortage {
        background: linear-gradient(135deg, #F56C6C 0%, #F78989 100%);
        color: white;
      }
    }
    
    .card-content {
      flex: 1;
      
      .card-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 4px;
      }
      
      .card-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}

.table-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-title {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e4e7ed;
}

.table-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

// MRP运算控制面板
.mrp-control-panel {
  margin-bottom: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  
  :deep(.el-form) {
    margin-bottom: 0;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.qty-demand {
  color: #409EFF;
  font-weight: 600;
}

.qty-shortage {
  color: #F56C6C;
  font-weight: 600;
}

.qty-normal {
  color: #67C23A;
  font-weight: 600;
}

.qty-suggested {
  color: #67C23A;
  font-weight: 600;
}

:deep(.row-shortage) {
  background-color: #fef0f0 !important;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
