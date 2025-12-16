<template>
  <div class="stock-level">
    <el-card class="stock-level-card" :body-style="{ padding: '16px' }">
      <div slot="header" class="card-header">
        <span>库存水平监控</span>
      </div>
      
      <div class="stock-level-content">
        <!-- 筛选区域 -->
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="仓库">
            <el-select v-model="filterForm.warehouseId" placeholder="请选择仓库">
              <el-option 
                v-for="warehouse in warehouseList" 
                :key="warehouse.id" 
                :label="warehouse.name" 
                :value="warehouse.id">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="产品">
            <el-input v-model="filterForm.productKeyword" placeholder="产品编码/名称/规格"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchStock" icon="el-icon-search">查询</el-button>
            <el-button @click="resetFilter" icon="el-icon-refresh">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 统计卡片 -->
        <div class="stats-cards">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-value">{{ totalProducts }}</div>
              <div class="stat-label">总产品数</div>
            </div>
          </el-card>
          <el-card class="stat-card low-stock" shadow="hover">
            <div class="stat-content">
              <div class="stat-value">{{ lowStockCount }}</div>
              <div class="stat-label">低库存预警</div>
            </div>
          </el-card>
          <el-card class="stat-card over-stock" shadow="hover">
            <div class="stat-content">
              <div class="stat-value">{{ overStockCount }}</div>
              <div class="stat-label">库存过剩</div>
            </div>
          </el-card>
          <el-card class="stat-card zero-stock" shadow="hover">
            <div class="stat-content">
              <div class="stat-value">{{ zeroStockCount }}</div>
              <div class="stat-label">零库存</div>
            </div>
          </el-card>
        </div>

        <!-- 库存列表 -->
        <el-table 
          v-loading="loading" 
          :data="stockListData" 
          style="width: 100%" 
          border
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" width="120"></el-table-column>
          <el-table-column prop="productName" label="产品名称" width="180"></el-table-column>
          <el-table-column prop="specs" label="规格型号" width="120"></el-table-column>
          <el-table-column prop="unit" label="单位" width="80"></el-table-column>
          <el-table-column prop="currentStock" label="当前库存" width="100" align="right">
            <template slot-scope="scope">
              <span :class="getStockLevelClass(scope.row)">
                {{ scope.row.currentStock }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="safetyStock" label="安全库存" width="100" align="right"></el-table-column>
          <el-table-column prop="maxStock" label="最高库存" width="100" align="right"></el-table-column>
          <el-table-column prop="warehouseName" label="仓库" width="120"></el-table-column>
          <el-table-column prop="locationCode" label="库位" width="100"></el-table-column>
          <el-table-column prop="lastUpdated" label="更新时间" width="150">
            <template slot-scope="scope">
              {{ formatDate(scope.row.lastUpdated) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template slot-scope="scope">
              <el-button 
                type="text" 
                size="small" 
                @click="viewStockDetail(scope.row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            background
            layout="prev, pager, next, jumper, total"
            :total="total"
            :page-size="pageSize"
            :current-page="currentPage"
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange">
          </el-pagination>
        </div>
      </div>
    </el-card>

    <!-- 库存详情对话框 -->
    <el-dialog 
      title="库存详情" 
      :visible.sync="detailDialogVisible" 
      width="70%">
      <el-form :model="currentStockDetail" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品编码">
              {{ currentStockDetail.productCode }}
            </el-form-item>
            <el-form-item label="产品名称">
              {{ currentStockDetail.productName }}
            </el-form-item>
            <el-form-item label="规格型号">
              {{ currentStockDetail.specs }}
            </el-form-item>
            <el-form-item label="单位">
              {{ currentStockDetail.unit }}
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前库存">
              {{ currentStockDetail.currentStock }}
            </el-form-item>
            <el-form-item label="安全库存">
              {{ currentStockDetail.safetyStock }}
            </el-form-item>
            <el-form-item label="最高库存">
              {{ currentStockDetail.maxStock }}
            </el-form-item>
            <el-form-item label="库存状态">
              <el-tag :type="getStockLevelType(currentStockDetail)">
                {{ getStockLevelText(currentStockDetail) }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider>库存分布</el-divider>
        <el-table :data="stockDistribution" style="width: 100%" border>
          <el-table-column prop="warehouseName" label="仓库" width="120"></el-table-column>
          <el-table-column prop="locationCode" label="库位" width="100"></el-table-column>
          <el-table-column prop="quantity" label="数量" width="100" align="right"></el-table-column>
          <el-table-column prop="batchNo" label="批次号" width="150"></el-table-column>
          <el-table-column prop="expiryDate" label="有效期" width="120">
            <template slot-scope="scope">
              {{ scope.row.expiryDate ? formatDate(scope.row.expiryDate) : '-' }}
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'StockLevel',
  props: {
    // 可接收的props，如需要外部传入的配置
  },
  data() {
    return {
      filterForm: {
        warehouseId: '',
        productKeyword: ''
      },
      loading: false,
      stockListData: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      selectedRows: [],
      detailDialogVisible: false,
      currentStockDetail: {},
      stockDistribution: [],
      warehouseList: [
        { id: '1', name: '主仓库' },
        { id: '2', name: '原料库' },
        { id: '3', name: '成品库' },
        { id: '4', name: '辅料库' }
      ]
    }
  },
  computed: {
    totalProducts() {
      return this.stockListData.length
    },
    lowStockCount() {
      return this.stockListData.filter(item => 
        item.currentStock > 0 && item.currentStock < item.safetyStock
      ).length
    },
    overStockCount() {
      return this.stockListData.filter(item => 
        item.currentStock > item.maxStock
      ).length
    },
    zeroStockCount() {
      return this.stockListData.filter(item => 
        item.currentStock === 0
      ).length
    }
  },
  mounted() {
    this.loadStockData()
  },
  methods: {
    // 加载库存数据
    loadStockData() {
      this.loading = true
      // 模拟API调用
      setTimeout(() => {
        this.stockListData = this.getMockStockData()
        this.total = this.stockListData.length
        this.loading = false
      }, 500)
    },
    
    // 搜索库存
    searchStock() {
      this.currentPage = 1
      this.loadStockData()
    },
    
    // 重置筛选
    resetFilter() {
      this.filterForm = {
        warehouseId: '',
        productKeyword: ''
      }
      this.loadStockData()
    },
    
    // 分页处理
    handleCurrentChange(val) {
      this.currentPage = val
      this.loadStockData()
    },
    
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.loadStockData()
    },
    
    // 选择行处理
    handleSelectionChange(val) {
      this.selectedRows = val
    },
    
    // 查看库存详情
    viewStockDetail(row) {
      this.currentStockDetail = { ...row }
      this.stockDistribution = this.getMockStockDistribution(row.productCode)
      this.detailDialogVisible = true
    },
    
    // 获取库存水平样式类
    getStockLevelClass(row) {
      if (row.currentStock === 0) {
        return 'stock-zero'
      } else if (row.currentStock < row.safetyStock) {
        return 'stock-low'
      } else if (row.currentStock > row.maxStock) {
        return 'stock-over'
      }
      return 'stock-normal'
    },
    
    // 获取库存水平类型（用于标签）
    getStockLevelType(stock) {
      if (!stock) return 'info'
      if (stock.currentStock === 0) {
        return 'danger'
      } else if (stock.currentStock < stock.safetyStock) {
        return 'warning'
      } else if (stock.currentStock > stock.maxStock) {
        return 'info'
      }
      return 'success'
    },
    
    // 获取库存水平文本
    getStockLevelText(stock) {
      if (!stock) return '未知'
      if (stock.currentStock === 0) {
        return '零库存'
      } else if (stock.currentStock < stock.safetyStock) {
        return '低库存'
      } else if (stock.currentStock > stock.maxStock) {
        return '库存过剩'
      }
      return '正常'
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    
    // 模拟库存数据
    getMockStockData() {
      return [
        {
          id: '1',
          productCode: 'P001',
          productName: '不锈钢螺丝M6',
          specs: 'M6×20mm',
          unit: '个',
          currentStock: 1500,
          safetyStock: 1000,
          maxStock: 3000,
          warehouseName: '主仓库',
          locationCode: 'A1-01-01',
          lastUpdated: new Date().getTime() - 3600000
        },
        {
          id: '2',
          productCode: 'P002',
          productName: 'PCB电路板',
          specs: '100×150mm',
          unit: '块',
          currentStock: 120,
          safetyStock: 200,
          maxStock: 500,
          warehouseName: '原料库',
          locationCode: 'B2-03-02',
          lastUpdated: new Date().getTime() - 7200000
        },
        {
          id: '3',
          productCode: 'P003',
          productName: '电源适配器',
          specs: '220V/12V',
          unit: '个',
          currentStock: 0,
          safetyStock: 50,
          maxStock: 200,
          warehouseName: '辅料库',
          locationCode: 'C1-02-01',
          lastUpdated: new Date().getTime() - 86400000
        },
        {
          id: '4',
          productCode: 'P004',
          productName: '成品整机',
          specs: '标准版',
          unit: '台',
          currentStock: 500,
          safetyStock: 300,
          maxStock: 400,
          warehouseName: '成品库',
          locationCode: 'D1-01-01',
          lastUpdated: new Date().getTime() - 1800000
        },
        {
          id: '5',
          productCode: 'P005',
          productName: '包装纸箱',
          specs: '30×20×15cm',
          unit: '个',
          currentStock: 2500,
          safetyStock: 1000,
          maxStock: 3000,
          warehouseName: '辅料库',
          locationCode: 'C2-03-01',
          lastUpdated: new Date().getTime() - 43200000
        }
      ]
    },
    
    // 模拟库存分布数据
    getMockStockDistribution(productCode) {
      const distributions = {
        'P001': [
          { warehouseName: '主仓库', locationCode: 'A1-01-01', quantity: 1000, batchNo: 'B20230601', expiryDate: null },
          { warehouseName: '原料库', locationCode: 'B1-02-03', quantity: 500, batchNo: 'B20230701', expiryDate: null }
        ],
        'P002': [
          { warehouseName: '原料库', locationCode: 'B2-03-02', quantity: 120, batchNo: 'B20230615', expiryDate: new Date().getTime() + 7776000000 }
        ]
      }
      return distributions[productCode] || []
    }
  }
}
</script>

<style scoped>
.stock-level {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  margin-bottom: 20px;
}

.stats-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  min-width: 200px;
}

.stat-content {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1890ff;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.stat-card.low-stock .stat-value {
  color: #faad14;
}

.stat-card.over-stock .stat-value {
  color: #13c2c2;
}

.stat-card.zero-stock .stat-value {
  color: #f5222d;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.stock-zero {
  color: #f5222d;
  font-weight: bold;
}

.stock-low {
  color: #faad14;
  font-weight: bold;
}

.stock-over {
  color: #13c2c2;
}

.stock-normal {
  color: #52c41a;
}
</style>