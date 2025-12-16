<template>
  <div class="process-route">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>工序路线管理</h2>
      <el-button type="primary" @click="handleCreate">创建工序路线</el-button>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="路线编号">
          <el-input v-model="searchForm.routeCode" placeholder="请输入路线编号"></el-input>
        </el-form-item>
        <el-form-item label="路线名称">
          <el-input v-model="searchForm.routeName" placeholder="请输入路线名称"></el-input>
        </el-form-item>
        <el-form-item label="产品类别">
          <el-select v-model="searchForm.productCategory" placeholder="请选择产品类别">
            <el-option label="全部" value=""></el-option>
            <el-option label="智能手表" value="watch"></el-option>
            <el-option label="智能手机" value="phone"></el-option>
            <el-option label="平板电脑" value="tablet"></el-option>
            <el-option label="智能耳机" value="earphone"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="全部" value=""></el-option>
            <el-option label="启用" value="active"></el-option>
            <el-option label="停用" value="inactive"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据列表 -->
    <el-card class="data-card">
      <div class="card-header">
        <span>工序路线列表</span>
        <div class="batch-actions">
          <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">批量删除</el-button>
          <el-button type="primary" @click="handleBatchActivate" :disabled="selectedRows.length === 0 || !canActivate">批量启用</el-button>
          <el-button type="warning" @click="handleBatchDeactivate" :disabled="selectedRows.length === 0 || !canDeactivate">批量停用</el-button>
          <el-button @click="handleExport">导出数据</el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="routeList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="routeCode" label="路线编号" min-width="120"></el-table-column>
        <el-table-column prop="routeName" label="路线名称" min-width="150"></el-table-column>
        <el-table-column prop="productCategory" label="产品类别" width="120">
          <template slot-scope="scope">
            {{ getCategoryText(scope.row.productCategory) }}
          </template>
        </el-table-column>
        <el-table-column prop="operationCount" label="工序数量" width="100" align="center"></el-table-column>
        <el-table-column prop="totalTime" label="总工时(分钟)" width="120" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180"></el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template slot-scope="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleActivate(scope.row)" v-if="scope.row.status === 'inactive'">
              启用
            </el-button>
            <el-button size="small" type="warning" @click="handleDeactivate(scope.row)" v-if="scope.row.status === 'active'">
              停用
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 路线详情对话框 -->
    <el-dialog title="工序路线详情" :visible.sync="detailVisible" width="80%" :close-on-click-modal="false">
      <div v-if="currentRoute" class="route-detail">
        <el-descriptions :column="1" border class="detail-header">
          <el-descriptions-item label="路线编号">{{ currentRoute.routeCode }}</el-descriptions-item>
          <el-descriptions-item label="路线名称">{{ currentRoute.routeName }}</el-descriptions-item>
          <el-descriptions-item label="产品类别">{{ getCategoryText(currentRoute.productCategory) }}</el-descriptions-item>
          <el-descriptions-item label="适用产品">
            <span v-for="(product, index) in currentRoute.applicableProducts" :key="product.id">
              {{ product.name }}{{ index < currentRoute.applicableProducts.length - 1 ? '、' : '' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="总工时">{{ currentRoute.totalTime }} 分钟</el-descriptions-item>
          <el-descriptions-item label="路线描述">{{ currentRoute.description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="operation-sequence">
          <h3>工序顺序</h3>
          <div class="sequence-container">
            <div v-for="(operation, index) in currentRoute.operations" :key="operation.id" class="sequence-item">
              <el-card :body-style="{ padding: '15px' }" class="operation-card">
                <div class="operation-header">
                  <span class="sequence-number">{{ operation.sequence }}</span>
                  <div class="operation-info">
                    <div class="operation-name">{{ operation.operationName }}</div>
                    <div class="operation-code">{{ operation.operationCode }}</div>
                  </div>
                  <div class="operation-time">{{ operation.standardTime }} 分钟</div>
                </div>
                <div class="operation-details">
                  <div class="detail-item">
                    <span class="label">所属车间：</span>
                    <span>{{ operation.workshopName }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">工位：</span>
                    <span>{{ operation.stationName || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">使用设备：</span>
                    <span>{{ operation.equipmentName || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">工序类型：</span>
                    <span>{{ getOperationTypeName(operation.operationType) }}</span>
                  </div>
                </div>
              </el-card>
              <div v-if="index < currentRoute.operations.length - 1" class="sequence-arrow">
                <i class="el-icon-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ProcessRoute',
  data() {
    return {
      // 搜索表单
      searchForm: {
        routeCode: '',
        routeName: '',
        productCategory: '',
        status: ''
      },
      // 路线列表
      routeList: [],
      // 加载状态
      loading: false,
      // 选中的行
      selectedRows: [],
      // 分页信息
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      // 详情对话框可见性
      detailVisible: false,
      // 当前查看的路线
      currentRoute: null
    }
  },
  created() {
    this.loadData()
  },
  computed: {
    // 是否可以批量启用
    canActivate() {
      return this.selectedRows.length > 0 && this.selectedRows.every(row => row.status === 'inactive')
    },
    // 是否可以批量停用
    canDeactivate() {
      return this.selectedRows.length > 0 && this.selectedRows.every(row => row.status === 'active')
    }
  },
  methods: {
    // 加载数据
    loadData() {
      this.loading = true
      // 模拟API调用
      setTimeout(() => {
        // 模拟数据
        const mockData = this.generateMockData()
        this.routeList = mockData.list
        this.pagination.total = mockData.total
        this.loading = false
      }, 500)
    },
    
    // 生成模拟数据
    generateMockData() {
      const categories = ['watch', 'phone', 'tablet', 'earphone']
      const statuses = ['active', 'inactive']
      
      const list = []
      const start = (this.pagination.currentPage - 1) * this.pagination.pageSize
      const end = start + this.pagination.pageSize
      
      for (let i = start; i < end && i < 50; i++) {
        const operationCount = Math.floor(Math.random() * 10) + 3
        const totalTime = Math.floor(Math.random() * 120) + 30
        
        list.push({
          id: `PR-${i + 1}`,
          routeCode: `PRC${2024}${String(i + 1).padStart(3, '0')}`,
          routeName: `${this.getCategoryText(categories[i % categories.length])}标准生产线${i + 1}`,
          productCategory: categories[i % categories.length],
          operationCount: operationCount,
          totalTime: totalTime,
          status: statuses[i % 2],
          creator: `user${i % 5 + 1}`,
          createTime: `2024-0${(i % 9) + 1}-${(i % 28) + 1} 09:30:00`,
          updateTime: `2024-0${(i % 9) + 1}-${(i % 28) + 5} 16:45:00`
        })
      }
      
      return {
        list,
        total: 50
      }
    },
    
    // 获取产品类别文本
    getCategoryText(category) {
      const categoryMap = {
        watch: '智能手表',
        phone: '智能手机',
        tablet: '平板电脑',
        earphone: '智能耳机'
      }
      return categoryMap[category] || category
    },
    
    // 获取工序类型名称
    getOperationTypeName(type) {
      const nameMap = {
        assembly: '装配',
        machining: '加工',
        inspection: '检测',
        packaging: '包装',
        other: '其他'
      }
      return nameMap[type] || type
    },
    
    // 搜索
    handleSearch() {
      this.pagination.currentPage = 1
      this.loadData()
    },
    
    // 重置
    handleReset() {
      this.searchForm = {
        routeCode: '',
        routeName: '',
        productCategory: '',
        status: ''
      }
      this.loadData()
    },
    
    // 创建
    handleCreate() {
      this.$router.push('/process-planning/route/create')
    },
    
    // 查看
    handleView(row) {
      this.loadRouteDetails(row.id)
    },
    
    // 编辑
    handleEdit(row) {
      this.$router.push(`/process-planning/route/edit/${row.id}`)
    },
    
    // 启用
    handleActivate(row) {
      this.$confirm(`确定要启用工序路线【${row.routeName}】吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟启用操作
        setTimeout(() => {
          row.status = 'active'
          this.$message.success('启用成功')
        }, 500)
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    
    // 停用
    handleDeactivate(row) {
      this.$confirm(`确定要停用工序路线【${row.routeName}】吗？停用后相关工序计划将无法使用该路线。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟停用操作
        setTimeout(() => {
          row.status = 'inactive'
          this.$message.success('停用成功')
        }, 500)
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    
    // 删除
    handleDelete(row) {
      this.$confirm(`确定要删除工序路线【${row.routeName}】吗？删除后不可恢复。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        setTimeout(() => {
          const index = this.routeList.findIndex(item => item.id === row.id)
          if (index !== -1) {
            this.routeList.splice(index, 1)
            this.pagination.total--
          }
          this.$message.success('删除成功')
        }, 500)
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    // 批量启用
    handleBatchActivate() {
      this.$confirm(`确定要启用选中的 ${this.selectedRows.length} 个工序路线吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量启用操作
        setTimeout(() => {
          this.selectedRows.forEach(row => {
            row.status = 'active'
          })
          this.selectedRows = []
          this.$message.success('批量启用成功')
        }, 500)
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    
    // 批量停用
    handleBatchDeactivate() {
      this.$confirm(`确定要停用选中的 ${this.selectedRows.length} 个工序路线吗？停用后相关工序计划将无法使用这些路线。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量停用操作
        setTimeout(() => {
          this.selectedRows.forEach(row => {
            row.status = 'inactive'
          })
          this.selectedRows = []
          this.$message.success('批量停用成功')
        }, 500)
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    
    // 批量删除
    handleBatchDelete() {
      this.$confirm(`确定要删除选中的 ${this.selectedRows.length} 个工序路线吗？删除后不可恢复。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量删除操作
        setTimeout(() => {
          const ids = this.selectedRows.map(row => row.id)
          this.routeList = this.routeList.filter(row => !ids.includes(row.id))
          this.pagination.total -= this.selectedRows.length
          this.selectedRows = []
          this.$message.success('批量删除成功')
        }, 500)
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    // 导出
    handleExport() {
      this.$message.info('导出功能待实现')
    },
    
    // 选择行变化
    handleSelectionChange(rows) {
      this.selectedRows = rows
    },
    
    // 分页大小变化
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.loadData()
    },
    
    // 当前页码变化
    handleCurrentChange(current) {
      this.pagination.currentPage = current
      this.loadData()
    },
    
    // 加载路线详情
    loadRouteDetails(id) {
      this.loading = true
      // 模拟API调用
      setTimeout(() => {
        // 模拟路线详情数据
        this.currentRoute = {
          id: id,
          routeCode: 'PRC2024001',
          routeName: '智能手表标准生产线1',
          productCategory: 'watch',
          applicableProducts: [
            { id: 'P001', name: '智能手表Pro' },
            { id: 'P002', name: '智能手表Lite' }
          ],
          totalTime: 125,
          description: '智能手表的标准生产工序路线，包含从零部件到成品的完整生产流程',
          operations: [
            {
              id: 'OP001',
              sequence: 1,
              operationCode: 'OPC001',
              operationName: '外壳注塑',
              workshopName: '注塑车间',
              stationName: '注塑工位1',
              standardTime: 10,
              equipmentName: '注塑机A01',
              operationType: 'machining'
            },
            {
              id: 'OP002',
              sequence: 2,
              operationCode: 'OPC002',
              operationName: '电路板组装',
              workshopName: '电子车间',
              stationName: 'SMT线1',
              standardTime: 20,
              equipmentName: '贴片机B01',
              operationType: 'assembly'
            },
            {
              id: 'OP003',
              sequence: 3,
              operationCode: 'OPC003',
              operationName: '功能测试',
              workshopName: '测试车间',
              stationName: '测试工位1',
              standardTime: 15,
              equipmentName: '测试仪器C01',
              operationType: 'inspection'
            },
            {
              id: 'OP004',
              sequence: 4,
              operationCode: 'OPC004',
              operationName: '显示屏安装',
              workshopName: '装配车间',
              stationName: '装配线1',
              standardTime: 25,
              equipmentName: '装配工作台D01',
              operationType: 'assembly'
            },
            {
              id: 'OP005',
              sequence: 5,
              operationCode: 'OPC005',
              operationName: '电池安装',
              workshopName: '装配车间',
              stationName: '装配线1',
              standardTime: 10,
              equipmentName: '装配工作台D01',
              operationType: 'assembly'
            },
            {
              id: 'OP006',
              sequence: 6,
              operationCode: 'OPC006',
              operationName: '整机测试',
              workshopName: '测试车间',
              stationName: '综合测试工位',
              standardTime: 20,
              equipmentName: '综合测试仪器E01',
              operationType: 'inspection'
            },
            {
              id: 'OP007',
              sequence: 7,
              operationCode: 'OPC007',
              operationName: '包装',
              workshopName: '包装车间',
              stationName: '包装线1',
              standardTime: 15,
              equipmentName: '包装机F01',
              operationType: 'packaging'
            }
          ]
        }
        this.detailVisible = true
        this.loading = false
      }, 500)
    }
  }
}
</script>

<style scoped>
.process-route {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.filter-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.data-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
}

.batch-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 路线详情样式 */
.route-detail {
  max-height: 600px;
  overflow-y: auto;
}

.detail-header {
  margin-bottom: 20px;
}

.operation-sequence h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.sequence-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.sequence-item {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.operation-card {
  flex: 1;
  margin-bottom: 0;
}

.operation-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.sequence-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  margin-right: 15px;
}

.operation-info {
  flex: 1;
}

.operation-name {
  font-weight: 600;
  font-size: 16px;
}

.operation-code {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

.operation-time {
  font-size: 14px;
  color: #409eff;
  font-weight: 600;
}

.operation-details {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding-left: 45px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-item .label {
  font-size: 12px;
  color: #909399;
  margin-right: 5px;
}

.sequence-arrow {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 20px;
  color: #909399;
  font-size: 20px;
}
</style>