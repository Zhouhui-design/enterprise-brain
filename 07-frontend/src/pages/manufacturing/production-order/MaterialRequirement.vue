<template>
  <div class="material-requirement">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack" type="text">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>物料需求管理</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleGenerateMRP">
          <el-icon><Plus /></el-icon>
          生成物料需求
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="handleSettings">
          <el-icon><Setting /></el-icon>
          设置
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" label-width="100px">
        <el-form-item label="物料编码">
          <el-input v-model="searchForm.materialCode" placeholder="请输入物料编码" />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="searchForm.materialName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderCode" placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="需求状态">
          <el-select v-model="searchForm.status" placeholder="请选择需求状态">
            <el-option label="全部" value="" />
            <el-option label="待请购" value="pending" />
            <el-option label="已请购" value="purchased" />
            <el-option label="已入库" value="received" />
            <el-option label="已分配" value="allocated" />
            <el-option label="已领出" value="issued" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求时间">
          <el-date-picker
            v-model="searchForm.requirementDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 物料需求概览 -->
    <div class="overview-cards">
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ overview.totalRequirements }}</div>
          <div class="overview-label">需求项数</div>
        </div>
        <el-icon class="overview-icon"><List /></el-icon>
      </el-card>
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ overview.pendingPurchase }}</div>
          <div class="overview-label">待请购物料</div>
        </div>
        <el-icon class="overview-icon"><Warning /></el-icon>
      </el-card>
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ overview.shortageQuantity }}</div>
          <div class="overview-label">短缺数量</div>
        </div>
        <el-icon class="overview-icon"><InfoFilled /></el-icon>
      </el-card>
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ overview.allocatedQuantity }}</div>
          <div class="overview-label">已分配数量</div>
        </div>
        <el-icon class="overview-icon"><Check /></el-icon>
      </el-card>
    </div>

    <!-- 物料需求列表 -->
    <el-card class="data-card">
      <template #header>
        <div class="card-header">
          <span>物料需求列表</span>
          <el-checkbox-group v-model="tableDisplayOptions" @change="handleTableOptionsChange">
            <el-checkbox label="showMaterialCode">显示物料编码</el-checkbox>
            <el-checkbox label="showSpecification">显示规格</el-checkbox>
            <el-checkbox label="showUnit">显示单位</el-checkbox>
          </el-checkbox-group>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="materialRequirements"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="materialCode" label="物料编码" width="120" v-if="tableDisplayOptions.includes('showMaterialCode')" />
        <el-table-column prop="materialName" label="物料名称" width="180" />
        <el-table-column prop="specification" label="规格型号" width="150" v-if="tableDisplayOptions.includes('showSpecification')" />
        <el-table-column prop="orderCode" label="订单编号" width="120" />
        <el-table-column prop="productName" label="产品名称" width="150" />
        <el-table-column prop="totalQuantity" label="需求总量" width="100" align="right">
          <template #default="{ row }">
            <span>{{ row.totalQuantity }} {{ tableDisplayOptions.includes('showUnit') ? row.unit : '' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="availableStock" label="可用库存" width="100" align="right">
          <template #default="{ row }">
            <span>{{ row.availableStock }} {{ tableDisplayOptions.includes('showUnit') ? row.unit : '' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="shortageQuantity" label="短缺数量" width="100" align="right">
          <template #default="{ row }">
            <span :class="{ 'shortage': row.shortageQuantity > 0 }">
              {{ row.shortageQuantity }} {{ tableDisplayOptions.includes('showUnit') ? row.unit : '' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="requiredDate" label="需求日期" width="120" />
        <el-table-column label="需求状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" align="center">
          <template #default="{ row }">
            <el-rate v-model="row.priority" :max="3" disabled />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text @click="handleViewDetail(row)">查看详情</el-button>
            <el-button text @click="handlePurchase(row)" v-if="row.status === 'pending'">请购</el-button>
            <el-button text @click="handleAllocate(row)" v-if="row.status === 'received'">分配</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 物料需求详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="物料需求详情"
      width="800px"
      @close="handleDetailDialogClose"
    >
      <div v-if="currentRequirement" class="requirement-detail">
        <!-- 基本信息 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="物料编码">{{ currentRequirement.materialCode }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ currentRequirement.materialName }}</el-descriptions-item>
          <el-descriptions-item label="规格型号">{{ currentRequirement.specification }}</el-descriptions-item>
          <el-descriptions-item label="单位">{{ currentRequirement.unit }}</el-descriptions-item>
          <el-descriptions-item label="订单编号">{{ currentRequirement.orderCode }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ currentRequirement.productName }}</el-descriptions-item>
          <el-descriptions-item label="需求总量">{{ currentRequirement.totalQuantity }}</el-descriptions-item>
          <el-descriptions-item label="已分配数量">{{ currentRequirement.allocatedQuantity }}</el-descriptions-item>
          <el-descriptions-item label="可用库存">{{ currentRequirement.availableStock }}</el-descriptions-item>
          <el-descriptions-item label="短缺数量">{{ currentRequirement.shortageQuantity }}</el-descriptions-item>
          <el-descriptions-item label="需求日期">{{ currentRequirement.requiredDate }}</el-descriptions-item>
          <el-descriptions-item label="需求状态"><el-tag :type="getStatusTagType(currentRequirement.status)">{{ getStatusText(currentRequirement.status) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-rate v-model="currentRequirement.priority" :max="3" disabled />
          </el-descriptions-item>
          <el-descriptions-item label="供应商" :span="2">{{ currentRequirement.supplierName || '未指定' }}</el-descriptions-item>
        </el-descriptions>

        <!-- BOM明细信息 -->
        <div class="bom-details">
          <h3>BOM明细信息</h3>
          <el-table :data="currentRequirement.bomDetails" size="small" stripe>
            <el-table-column prop="productCode" label="产品编码" width="120" />
            <el-table-column prop="productName" label="产品名称" width="150" />
            <el-table-column prop="bomCode" label="BOM版本" width="100" />
            <el-table-column prop="usageQuantity" label="用量" width="80" align="right" />
            <el-table-column prop="requiredQuantity" label="需求数量" width="100" align="right" />
            <el-table-column prop="orderCode" label="订单编号" width="120" />
          </el-table>
        </div>

        <!-- 库存和请购信息 -->
        <div class="inventory-purchase">
          <div class="inventory-info">
            <h3>库存信息</h3>
            <el-table :data="currentRequirement.inventoryInfo" size="small" stripe>
              <el-table-column prop="warehouseName" label="仓库" width="120" />
              <el-table-column prop="location" label="库位" width="100" />
              <el-table-column prop="batchNumber" label="批次" width="120" />
              <el-table-column prop="stockQuantity" label="库存数量" width="100" align="right" />
              <el-table-column prop="availableQuantity" label="可用数量" width="100" align="right" />
              <el-table-column prop="expiryDate" label="有效期" width="120" />
            </el-table>
          </div>
          
          <div class="purchase-info">
            <h3>请购信息</h3>
            <el-table :data="currentRequirement.purchaseInfo" size="small" stripe>
              <el-table-column prop="purchaseOrderCode" label="请购单号" width="120" />
              <el-table-column prop="purchaseQuantity" label="请购数量" width="100" align="right" />
              <el-table-column prop="receivedQuantity" label="已收数量" width="100" align="right" />
              <el-table-column prop="supplierName" label="供应商" width="120" />
              <el-table-column prop="expectedDate" label="预计到货" width="120" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag size="small" :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handlePurchase(currentRequirement)" v-if="currentRequirement?.status === 'pending'">
          创建请购单
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量请购对话框 -->
    <el-dialog
      v-model="batchPurchaseDialogVisible"
      title="批量请购"
      width="700px"
      @close="handleBatchPurchaseDialogClose"
    >
      <el-form :model="batchPurchaseForm" label-width="120px">
        <el-form-item label="供应商">
          <el-select v-model="batchPurchaseForm.supplierId" placeholder="请选择供应商">
            <el-option label="深圳电子元件厂" value="supplier1" />
            <el-option label="广州原材料公司" value="supplier2" />
            <el-option label="上海精密机械厂" value="supplier3" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计到货日期">
          <el-date-picker v-model="batchPurchaseForm.expectedDate" type="date" placeholder="请选择到货日期" />
        </el-form-item>
        <el-form-item label="采购员">
          <el-input v-model="batchPurchaseForm.buyer" placeholder="请输入采购员姓名" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchPurchaseForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
        
        <div class="selected-items">
          <h3>已选择物料 ({{ selectedRequirements.length }})</h3>
          <el-table :data="selectedRequirements" size="small" stripe max-height="200">
            <el-table-column prop="materialName" label="物料名称" width="150" />
            <el-table-column prop="shortageQuantity" label="短缺数量" width="100" align="right">
              <template #default="{ row }">
                <el-input-number
                  v-model="getPurchaseQuantity(row.id)"
                  :min="1"
                  :max="row.shortageQuantity"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="60" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button text @click="handleRemoveFromSelection(row.id)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="batchPurchaseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitBatchPurchase">提交请购</el-button>
      </template>
    </el-dialog>

    <!-- 生成物料需求计划对话框 -->
    <el-dialog
      v-model="generateMRPDialogVisible"
      title="生成物料需求计划"
      width="600px"
      @close="handleGenerateMRPDialogClose"
    >
      <el-form :model="generateMRPForm" label-width="120px">
        <el-form-item label="计划周期">
          <el-date-picker
            v-model="generateMRPForm.planPeriod"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="计划来源">
          <el-checkbox-group v-model="generateMRPForm.planSources">
            <el-checkbox label="sales_order">销售订单</el-checkbox>
            <el-checkbox label="production_order">生产订单</el-checkbox>
            <el-checkbox label="forecast">预测计划</el-checkbox>
            <el-checkbox label="safety_stock">安全库存</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="考虑因素">
          <el-checkbox-group v-model="generateMRPForm.considerations">
            <el-checkbox label="current_stock">现有库存</el-checkbox>
            <el-checkbox label="open_purchase">在途采购</el-checkbox>
            <el-checkbox label="in_process">在制品</el-checkbox>
            <el-checkbox label="safety_stock">安全库存</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="生成方式">
          <el-radio-group v-model="generateMRPForm.generateMethod">
            <el-radio :label="'replace'">覆盖现有计划</el-radio>
            <el-radio :label="'append'">追加到现有计划</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateMRPDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmGenerateMRP">确认生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ArrowLeft, Plus, Refresh, Download, Setting, List, Warning, InfoFilled, Check } from '@element-plus/icons-vue'

// 物料需求类型定义
interface MaterialRequirement {
  id: string
  materialCode: string
  materialName: string
  specification: string
  unit: string
  orderCode: string
  productName: string
  totalQuantity: number
  allocatedQuantity: number
  availableStock: number
  shortageQuantity: number
  requiredDate: string
  status: string
  priority: number
  supplierName?: string
  bomDetails?: BOMDetail[]
  inventoryInfo?: InventoryInfo[]
  purchaseInfo?: PurchaseInfo[]
}

// BOM明细类型定义
interface BOMDetail {
  productCode: string
  productName: string
  bomCode: string
  usageQuantity: number
  requiredQuantity: number
  orderCode: string
}

// 库存信息类型定义
interface InventoryInfo {
  warehouseName: string
  location: string
  batchNumber: string
  stockQuantity: number
  availableQuantity: number
  expiryDate: string
}

// 请购信息类型定义
interface PurchaseInfo {
  purchaseOrderCode: string
  purchaseQuantity: number
  receivedQuantity: number
  supplierName: string
  expectedDate: string
  status: string
}

// 响应式数据
const loading = ref(false)
const detailDialogVisible = ref(false)
const batchPurchaseDialogVisible = ref(false)
const generateMRPDialogVisible = ref(false)
const currentRequirement = ref<MaterialRequirement | null>(null)
const selectedRequirements = ref<MaterialRequirement[]>([])
const purchaseQuantities = ref<Record<string, number>>({})

// 搜索表单
const searchForm = reactive({
  materialCode: '',
  materialName: '',
  orderCode: '',
  status: '',
  requirementDate: null as [Date, Date] | null
})

// 批量请购表单
const batchPurchaseForm = reactive({
  supplierId: '',
  expectedDate: null,
  buyer: '',
  remark: ''
})

// 生成MRP表单
const generateMRPForm = reactive({
  planPeriod: [new Date(), new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)] as [Date, Date],
  planSources: ['production_order', 'sales_order'],
  considerations: ['current_stock', 'open_purchase', 'safety_stock'],
  generateMethod: 'append'
})

// 表格显示选项
const tableDisplayOptions = ref(['showMaterialCode', 'showSpecification', 'showUnit'])

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 概览数据
const overview = reactive({
  totalRequirements: 0,
  pendingPurchase: 0,
  shortageQuantity: 0,
  allocatedQuantity: 0
})

// 物料需求列表
const materialRequirements = ref<MaterialRequirement[]>([])

// 获取物料需求列表
const getMaterialRequirements = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    const mockData: MaterialRequirement[] = [
      {
        id: '1',
        materialCode: 'MAT001',
        materialName: 'PCB电路板',
        specification: 'FR-4 2层 100x150mm',
        unit: '张',
        orderCode: 'PO2024001',
        productName: '智能控制器',
        totalQuantity: 1000,
        allocatedQuantity: 500,
        availableStock: 400,
        shortageQuantity: 600,
        requiredDate: '2024-01-15',
        status: 'pending',
        priority: 3
      },
      {
        id: '2',
        materialCode: 'MAT002',
        materialName: '电阻器',
        specification: '10KΩ 0805 5%',
        unit: '个',
        orderCode: 'PO2024001',
        productName: '智能控制器',
        totalQuantity: 5000,
        allocatedQuantity: 2000,
        availableStock: 3000,
        shortageQuantity: 0,
        requiredDate: '2024-01-15',
        status: 'allocated',
        priority: 2
      },
      {
        id: '3',
        materialCode: 'MAT003',
        materialName: '微控制器',
        specification: 'STM32F103C8T6',
        unit: '片',
        orderCode: 'PO2024002',
        productName: '传感器模组',
        totalQuantity: 500,
        allocatedQuantity: 0,
        availableStock: 0,
        shortageQuantity: 500,
        requiredDate: '2024-01-20',
        status: 'pending',
        priority: 3,
        supplierName: '深圳电子元件厂'
      },
      {
        id: '4',
        materialCode: 'MAT004',
        materialName: '电容',
        specification: '100nF 0805 10%',
        unit: '个',
        orderCode: 'PO2024002',
        productName: '传感器模组',
        totalQuantity: 3000,
        allocatedQuantity: 1500,
        availableStock: 2000,
        shortageQuantity: 0,
        requiredDate: '2024-01-20',
        status: 'allocated',
        priority: 1
      },
      {
        id: '5',
        materialCode: 'MAT005',
        materialName: '电源模块',
        specification: 'DC-DC 5V 2A',
        unit: '个',
        orderCode: 'PO2024003',
        productName: '电源模块',
        totalQuantity: 800,
        allocatedQuantity: 0,
        availableStock: 0,
        shortageQuantity: 800,
        requiredDate: '2024-02-01',
        status: 'purchased',
        priority: 2
      },
      {
        id: '6',
        materialCode: 'MAT006',
        materialName: '外壳',
        specification: 'ABS 黑色',
        unit: '个',
        orderCode: 'PO2024003',
        productName: '电源模块',
        totalQuantity: 800,
        allocatedQuantity: 0,
        availableStock: 0,
        shortageQuantity: 800,
        requiredDate: '2024-02-01',
        status: 'purchased',
        priority: 2
      },
      {
        id: '7',
        materialCode: 'MAT007',
        materialName: '连接线',
        specification: 'USB-A to USB-C 1m',
        unit: '条',
        orderCode: 'PO2024004',
        productName: '控制面板',
        totalQuantity: 1200,
        allocatedQuantity: 1000,
        availableStock: 1200,
        shortageQuantity: 0,
        requiredDate: '2024-01-25',
        status: 'allocated',
        priority: 1
      },
      {
        id: '8',
        materialCode: 'MAT008',
        materialName: '显示屏',
        specification: '2.4寸 TFT 320x240',
        unit: '个',
        orderCode: 'PO2024004',
        productName: '控制面板',
        totalQuantity: 1200,
        allocatedQuantity: 0,
        availableStock: 0,
        shortageQuantity: 1200,
        requiredDate: '2024-01-25',
        status: 'pending',
        priority: 3
      },
      {
        id: '9',
        materialCode: 'MAT009',
        materialName: 'PCB电路板',
        specification: 'FR-4 4层 150x200mm',
        unit: '张',
        orderCode: 'PO2024005',
        productName: '连接线束',
        totalQuantity: 2000,
        allocatedQuantity: 0,
        availableStock: 500,
        shortageQuantity: 1500,
        requiredDate: '2024-01-10',
        status: 'received',
        priority: 2
      },
      {
        id: '10',
        materialCode: 'MAT010',
        materialName: '连接器',
        specification: 'JST XH 2.5mm 4Pin',
        unit: '个',
        orderCode: 'PO2024005',
        productName: '连接线束',
        totalQuantity: 8000,
        allocatedQuantity: 0,
        availableStock: 10000,
        shortageQuantity: 0,
        requiredDate: '2024-01-10',
        status: 'received',
        priority: 1
      }
    ]
    
    // 过滤数据
    let filteredData = [...mockData]
    if (searchForm.materialCode) {
      filteredData = filteredData.filter(item => 
        item.materialCode.includes(searchForm.materialCode)
      )
    }
    if (searchForm.materialName) {
      filteredData = filteredData.filter(item => 
        item.materialName.includes(searchForm.materialName)
      )
    }
    if (searchForm.orderCode) {
      filteredData = filteredData.filter(item => 
        item.orderCode.includes(searchForm.orderCode)
      )
    }
    if (searchForm.status) {
      filteredData = filteredData.filter(item => 
        item.status === searchForm.status
      )
    }
    
    // 更新分页数据
    pagination.total = filteredData.length
    materialRequirements.value = filteredData.slice(
      (pagination.currentPage - 1) * pagination.pageSize,
      pagination.currentPage * pagination.pageSize
    )
    
    // 更新概览数据
    overview.totalRequirements = mockData.length
    overview.pendingPurchase = mockData.filter(item => item.status === 'pending').length
    overview.shortageQuantity = mockData.reduce((sum, item) => sum + Math.max(0, item.shortageQuantity), 0)
    overview.allocatedQuantity = mockData.reduce((sum, item) => sum + item.allocatedQuantity, 0)
  } catch (error) {
    console.error('获取物料需求列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取物料需求详情
const getMaterialRequirementDetail = async (id: string): Promise<MaterialRequirement> => {
  // 模拟API调用
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 模拟详情数据
  const detailData: MaterialRequirement = {
    id,
    materialCode: 'MAT001',
    materialName: 'PCB电路板',
    specification: 'FR-4 2层 100x150mm',
    unit: '张',
    orderCode: 'PO2024001',
    productName: '智能控制器',
    totalQuantity: 1000,
    allocatedQuantity: 500,
    availableStock: 400,
    shortageQuantity: 600,
    requiredDate: '2024-01-15',
    status: 'pending',
    priority: 3,
    bomDetails: [
      {
        productCode: 'PROD001',
        productName: '智能控制器',
        bomCode: 'BOM001V1.0',
        usageQuantity: 1,
        requiredQuantity: 1000,
        orderCode: 'PO2024001'
      }
    ],
    inventoryInfo: [
      {
        warehouseName: '电子仓库',
        location: 'A-01-01',
        batchNumber: 'BATCH001',
        stockQuantity: 500,
        availableQuantity: 400,
        expiryDate: '2025-12-31'
      }
    ],
    purchaseInfo: [
      {
        purchaseOrderCode: 'PR2024001',
        purchaseQuantity: 1000,
        receivedQuantity: 0,
        supplierName: '深圳电路板厂',
        expectedDate: '2024-01-14',
        status: 'pending'
      }
    ]
  }
  
  return detailData
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待请购',
    purchased: '已请购',
    received: '已入库',
    allocated: '已分配',
    issued: '已领出'
  }
  return statusMap[status] || status
}

// 获取状态标签类型
const getStatusTagType = (status: string): string => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    purchased: 'primary',
    received: 'success',
    allocated: 'info',
    issued: 'default'
  }
  return typeMap[status] || 'info'
}

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1
  getMaterialRequirements()
}

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    materialCode: '',
    materialName: '',
    orderCode: '',
    status: '',
    requirementDate: null
  })
  pagination.currentPage = 1
  getMaterialRequirements()
}

// 处理刷新
const handleRefresh = () => {
  getMaterialRequirements()
}

// 处理导出
const handleExport = () => {
  // 模拟导出操作
  ElMessage.success('数据导出成功')
}

// 处理设置
const handleSettings = () => {
  ElMessage.info('打开设置页面')
}

// 处理表格选项变更
const handleTableOptionsChange = () => {
  // 表格显示选项变更
}

// 处理查看详情
const handleViewDetail = async (requirement: MaterialRequirement) => {
  loading.value = true
  try {
    currentRequirement.value = await getMaterialRequirementDetail(requirement.id)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取物料需求详情失败')
  } finally {
    loading.value = false
  }
}

// 处理请购
const handlePurchase = (requirement: MaterialRequirement | null) => {
  if (!requirement) return
  
  // 如果是单个物料请购
  if (selectedRequirements.value.length === 0) {
    selectedRequirements.value = [requirement]
    purchaseQuantities.value[requirement.id] = requirement.shortageQuantity
  }
  
  batchPurchaseDialogVisible.value = true
}

// 处理分配
const handleAllocate = (requirement: MaterialRequirement) => {
  ElMessage.success(`物料 ${requirement.materialName} 分配成功`)
  handleRefresh()
}

// 处理生成物料需求
const handleGenerateMRP = () => {
  generateMRPDialogVisible.value = true
}

// 处理确认生成MRP
const handleConfirmGenerateMRP = async () => {
  loading.value = true
  try {
    // 模拟生成MRP操作
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('物料需求计划生成成功')
    generateMRPDialogVisible.value = false
    getMaterialRequirements()
  } catch (error) {
    ElMessage.error('物料需求计划生成失败')
  } finally {
    loading.value = false
  }
}

// 处理提交批量请购
const handleSubmitBatchPurchase = async () => {
  if (selectedRequirements.value.length === 0) {
    ElMessage.warning('请选择需要请购的物料')
    return
  }
  
  loading.value = true
  try {
    // 模拟批量请购操作
    await new Promise(resolve => setTimeout(resolve, 800))
    ElMessage.success(`成功提交 ${selectedRequirements.value.length} 项物料请购`)
    batchPurchaseDialogVisible.value = false
    selectedRequirements.value = []
    purchaseQuantities.value = {}
    getMaterialRequirements()
  } catch (error) {
    ElMessage.error('批量请购提交失败')
  } finally {
    loading.value = false
  }
}

// 处理选择变更
const handleSelectionChange = (selection: MaterialRequirement[]) => {
  selectedRequirements.value = selection.filter(item => item.status === 'pending')
  
  // 初始化请购数量
  selection.forEach(item => {
    if (!purchaseQuantities.value[item.id]) {
      purchaseQuantities.value[item.id] = item.shortageQuantity
    }
  })
}

// 处理从选择中移除
const handleRemoveFromSelection = (id: string) => {
  const index = selectedRequirements.value.findIndex(item => item.id === id)
  if (index > -1) {
    selectedRequirements.value.splice(index, 1)
    delete purchaseQuantities.value[id]
  }
}

// 获取请购数量
const getPurchaseQuantity = (id: string): number => {
  if (!purchaseQuantities.value[id]) {
    purchaseQuantities.value[id] = 0
  }
  return purchaseQuantities.value[id]
}

// 处理详情对话框关闭
const handleDetailDialogClose = () => {
  currentRequirement.value = null
}

// 处理批量请购对话框关闭
const handleBatchPurchaseDialogClose = () => {
  selectedRequirements.value = []
  purchaseQuantities.value = {}
}

// 处理生成MRP对话框关闭
const handleGenerateMRPDialogClose = () => {
  // 重置表单
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  getMaterialRequirements()
}

// 处理页码变化
const handleCurrentChange = (current: number) => {
  pagination.currentPage = current
  getMaterialRequirements()
}

// 处理返回
const handleBack = () => {
  window.location.href = '/#/manufacturing/production-order/list'
}

// 组件挂载时获取数据
onMounted(() => {
  getMaterialRequirements()
})
</script>

<style scoped>
.material-requirement {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.overview-card {
  position: relative;
  overflow: hidden;
}

.overview-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.overview-number {
  font-size: 32px;
  font-weight: 700;
  color: #1989fa;
}

.overview-label {
  font-size: 14px;
  color: #606266;
}

.overview-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 48px;
  color: rgba(25, 137, 250, 0.1);
}

.data-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shortage {
  color: #f56c6c;
  font-weight: 500;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.requirement-detail {
  padding: 10px;
}

.bom-details,
.inventory-info,
.purchase-info {
  margin-top: 20px;
}

.bom-details h3,
.inventory-info h3,
.purchase-info h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
}

.inventory-purchase {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.selected-items {
  margin-top: 20px;
}

.selected-items h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .inventory-purchase {
    grid-template-columns: 1fr;
  }
  
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>