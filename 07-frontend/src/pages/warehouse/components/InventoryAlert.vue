<template>
  <div class="inventory-alert">
    <el-card class="alert-card" :body-style="{ padding: '16px' }">
      <div slot="header" class="card-header">
        <span>库存预警管理</span>
        <div class="header-actions">
          <el-button 
            type="primary" 
            size="small" 
            @click="refreshAlerts" 
            icon="el-icon-refresh">
            刷新
          </el-button>
        </div>
      </div>

      <!-- 预警概览 -->
      <div class="alert-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="overview-card alert-warning" shadow="hover">
              <div class="overview-content">
                <div class="overview-icon el-icon-warning-outline"></div>
                <div class="overview-info">
                  <div class="overview-value">{{ lowStockAlerts.length }}</div>
                  <div class="overview-label">低库存预警</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="overview-card alert-danger" shadow="hover">
              <div class="overview-content">
                <div class="overview-icon el-icon-circle-close-outline"></div>
                <div class="overview-info">
                  <div class="overview-value">{{ zeroStockAlerts.length }}</div>
                  <div class="overview-label">零库存预警</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="overview-card alert-info" shadow="hover">
              <div class="overview-content">
                <div class="overview-icon el-icon-info-outline"></div>
                <div class="overview-info">
                  <div class="overview-value">{{ expiryAlerts.length }}</div>
                  <div class="overview-label">有效期预警</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="overview-card alert-success" shadow="hover">
              <div class="overview-content">
                <div class="overview-icon el-icon-check-circle-outline"></div>
                <div class="overview-info">
                  <div class="overview-value">{{ totalAlerts }}</div>
                  <div class="overview-label">总预警数</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 预警类型切换 -->
      <div class="alert-tabs">
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <el-tab-pane label="全部预警" name="all">
            <!-- 全部预警内容将通过切换显示 -->
          </el-tab-pane>
          <el-tab-pane label="低库存预警" name="lowStock">
            <!-- 低库存预警内容将通过切换显示 -->
          </el-tab-pane>
          <el-tab-pane label="零库存预警" name="zeroStock">
            <!-- 零库存预警内容将通过切换显示 -->
          </el-tab-pane>
          <el-tab-pane label="有效期预警" name="expiry">
            <!-- 有效期预警内容将通过切换显示 -->
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 预警列表 -->
      <div class="alert-list">
        <el-table 
          v-loading="loading" 
          :data="currentAlertList" 
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
              <span :class="getStockClass(scope.row)">{{ scope.row.currentStock }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="threshold" label="预警阈值" width="100" align="right">
            <template slot-scope="scope">
              {{ scope.row.threshold || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="alertType" label="预警类型" width="120">
            <template slot-scope="scope">
              <el-tag :type="getAlertTypeClass(scope.row.alertType)">
                {{ getAlertTypeText(scope.row.alertType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remainingDays" label="剩余天数" width="100" align="right" v-if="activeTab === 'expiry'">
            <template slot-scope="scope">
              <span :class="getRemainingDaysClass(scope.row.remainingDays)">
                {{ scope.row.remainingDays }}天
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="warehouseName" label="仓库" width="100"></el-table-column>
          <el-table-column prop="locationCode" label="库位" width="100"></el-table-column>
          <el-table-column prop="createdTime" label="预警时间" width="150">
            <template slot-scope="scope">
              {{ formatDate(scope.row.createdTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template slot-scope="scope">
              <el-button 
                type="text" 
                size="small" 
                @click="viewAlertDetail(scope.row)">
                详情
              </el-button>
              <el-button 
                type="text" 
                size="small" 
                @click="handleAlert(scope.row)"
                :disabled="scope.row.handled">
                处理
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            background
            layout="prev, pager, next, jumper, total"
            :total="currentAlertList.length"
            :page-size="pageSize"
            :current-page="currentPage"
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange">
          </el-pagination>
        </div>
      </div>

      <!-- 批量操作栏 -->
      <div class="batch-actions" v-if="selectedAlerts.length > 0">
        <span>已选择 {{ selectedAlerts.length }} 条预警</span>
        <el-button 
          type="primary" 
          size="small" 
          @click="batchHandleAlerts">
          批量处理
        </el-button>
        <el-button 
          size="small" 
          @click="clearSelection">
          取消选择
        </el-button>
      </div>
    </el-card>

    <!-- 预警详情对话框 -->
    <el-dialog 
      title="预警详情" 
      :visible.sync="detailDialogVisible" 
      width="60%">
      <el-form :model="currentAlertDetail" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品编码">
              {{ currentAlertDetail.productCode }}
            </el-form-item>
            <el-form-item label="产品名称">
              {{ currentAlertDetail.productName }}
            </el-form-item>
            <el-form-item label="规格型号">
              {{ currentAlertDetail.specs }}
            </el-form-item>
            <el-form-item label="单位">
              {{ currentAlertDetail.unit }}
            </el-form-item>
            <el-form-item label="当前库存">
              <span :class="getStockClass(currentAlertDetail)">
                {{ currentAlertDetail.currentStock }}
              </span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预警类型">
              <el-tag :type="getAlertTypeClass(currentAlertDetail.alertType)">
                {{ getAlertTypeText(currentAlertDetail.alertType) }}
              </el-tag>
            </el-form-item>
            <el-form-item label="预警阈值">
              {{ currentAlertDetail.threshold || '-' }}
            </el-form-item>
            <el-form-item label="预警时间">
              {{ formatDate(currentAlertDetail.createdTime) }}
            </el-form-item>
            <el-form-item label="预警状态">
              <el-tag :type="currentAlertDetail.handled ? 'success' : 'warning'">
                {{ currentAlertDetail.handled ? '已处理' : '待处理' }}
              </el-tag>
            </el-form-item>
            <el-form-item label="处理时间" v-if="currentAlertDetail.handledTime">
              {{ formatDate(currentAlertDetail.handledTime) }}
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="仓库信息">
          {{ currentAlertDetail.warehouseName }} - {{ currentAlertDetail.locationCode }}
        </el-form-item>
        
        <el-form-item label="预警说明" v-if="currentAlertDetail.description">
          {{ currentAlertDetail.description }}
        </el-form-item>
        
        <el-form-item label="处理记录" v-if="currentAlertDetail.handleRecords && currentAlertDetail.handleRecords.length > 0">
          <el-timeline>
            <el-timeline-item 
              v-for="(record, index) in currentAlertDetail.handleRecords" 
              :key="index"
              :timestamp="formatDate(record.time)">
              {{ record.content }}
              <br>
              <span class="handler-info">处理人: {{ record.handler }}</span>
            </el-timeline-item>
          </el-timeline>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 预警处理对话框 -->
    <el-dialog 
      title="处理预警" 
      :visible.sync="handleDialogVisible" 
      width="50%">
      <el-form :model="handleForm" :rules="handleRules" ref="handleForm" label-width="120px">
        <el-form-item label="预警信息">
          <div class="alert-info-preview">
            <p><strong>{{ currentAlertToHandle.productName }}</strong> ({{ currentAlertToHandle.productCode }})</p>
            <p>{{ getAlertTypeText(currentAlertToHandle.alertType) }} - {{ currentAlertToHandle.specs }}</p>
          </div>
        </el-form-item>
        <el-form-item label="处理方式" prop="handleType">
          <el-radio-group v-model="handleForm.handleType">
            <el-radio label="1">生成采购申请</el-radio>
            <el-radio label="2">调整安全库存</el-radio>
            <el-radio label="3">手动处理</el-radio>
            <el-radio label="4">忽略</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理说明" prop="handleRemark">
          <el-input 
            v-model="handleForm.handleRemark" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入处理说明"></el-input>
        </el-form-item>
        <el-form-item label="处理人">
          {{ currentUser }}
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmHandleAlert" :loading="handleLoading">
          确认处理
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'InventoryAlert',
  props: {
    // 可接收的props
  },
  data() {
    return {
      loading: false,
      handleLoading: false,
      activeTab: 'all',
      currentPage: 1,
      pageSize: 10,
      selectedAlerts: [],
      detailDialogVisible: false,
      handleDialogVisible: false,
      currentAlertDetail: {},
      currentAlertToHandle: {},
      handleForm: {
        handleType: '1',
        handleRemark: ''
      },
      handleRules: {
        handleType: [
          { required: true, message: '请选择处理方式', trigger: 'change' }
        ],
        handleRemark: [
          { required: true, message: '请输入处理说明', trigger: 'blur' }
        ]
      },
      currentUser: '当前用户',
      // 预警数据
      alerts: [],
      lowStockAlerts: [],
      zeroStockAlerts: [],
      expiryAlerts: []
    }
  },
  computed: {
    totalAlerts() {
      return this.lowStockAlerts.length + this.zeroStockAlerts.length + this.expiryAlerts.length
    },
    
    // 当前显示的预警列表
    currentAlertList() {
      switch (this.activeTab) {
        case 'lowStock':
          return this.lowStockAlerts
        case 'zeroStock':
          return this.zeroStockAlerts
        case 'expiry':
          return this.expiryAlerts
        default:
          return this.alerts
      }
    }
  },
  mounted() {
    this.loadAlertData()
  },
  methods: {
    // 加载预警数据
    loadAlertData() {
      this.loading = true
      // 模拟API调用
      setTimeout(() => {
        this.generateMockAlerts()
        this.loading = false
      }, 500)
    },
    
    // 生成模拟预警数据
    generateMockAlerts() {
      // 低库存预警
      this.lowStockAlerts = [
        {
          id: '1',
          productCode: 'P002',
          productName: 'PCB电路板',
          specs: '100×150mm',
          unit: '块',
          currentStock: 120,
          threshold: 200,
          alertType: 'lowStock',
          warehouseName: '原料库',
          locationCode: 'B2-03-02',
          createdTime: new Date().getTime() - 86400000,
          handled: false,
          description: '当前库存低于安全库存'
        },
        {
          id: '2',
          productCode: 'P006',
          productName: '电阻元件',
          specs: '10kΩ',
          unit: '个',
          currentStock: 800,
          threshold: 1000,
          alertType: 'lowStock',
          warehouseName: '原料库',
          locationCode: 'B1-01-03',
          createdTime: new Date().getTime() - 172800000,
          handled: false,
          description: '当前库存低于安全库存'
        }
      ]
      
      // 零库存预警
      this.zeroStockAlerts = [
        {
          id: '3',
          productCode: 'P003',
          productName: '电源适配器',
          specs: '220V/12V',
          unit: '个',
          currentStock: 0,
          threshold: 0,
          alertType: 'zeroStock',
          warehouseName: '辅料库',
          locationCode: 'C1-02-01',
          createdTime: new Date().getTime() - 259200000,
          handled: false,
          description: '库存为零，请及时补货'
        },
        {
          id: '4',
          productCode: 'P007',
          productName: '散热片',
          specs: '标准型',
          unit: '个',
          currentStock: 0,
          threshold: 0,
          alertType: 'zeroStock',
          warehouseName: '原料库',
          locationCode: 'B3-02-01',
          createdTime: new Date().getTime() - 345600000,
          handled: false,
          description: '库存为零，请及时补货'
        }
      ]
      
      // 有效期预警
      this.expiryAlerts = [
        {
          id: '5',
          productCode: 'P008',
          productName: '电子元件A',
          specs: '型号X',
          unit: '个',
          currentStock: 500,
          threshold: 30,
          alertType: 'expiry',
          remainingDays: 15,
          warehouseName: '原料库',
          locationCode: 'B1-03-02',
          createdTime: new Date().getTime() - 43200000,
          handled: false,
          description: '产品即将过期，剩余15天',
          expiryDate: new Date().getTime() + 1296000000
        },
        {
          id: '6',
          productCode: 'P009',
          productName: '化学试剂B',
          specs: '500ml',
          unit: '瓶',
          currentStock: 20,
          threshold: 60,
          alertType: 'expiry',
          remainingDays: 45,
          warehouseName: '原料库',
          locationCode: 'B4-01-01',
          createdTime: new Date().getTime() - 129600000,
          handled: false,
          description: '产品即将过期，剩余45天',
          expiryDate: new Date().getTime() + 3888000000
        }
      ]
      
      // 合并所有预警
      this.alerts = [...this.lowStockAlerts, ...this.zeroStockAlerts, ...this.expiryAlerts]
    },
    
    // 刷新预警数据
    refreshAlerts() {
      this.loadAlertData()
    },
    
    // 切换标签
    handleTabClick(tab) {
      this.activeTab = tab.name
      this.currentPage = 1
    },
    
    // 分页处理
    handleCurrentChange(val) {
      this.currentPage = val
    },
    
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
    },
    
    // 选择行处理
    handleSelectionChange(val) {
      this.selectedAlerts = val
    },
    
    // 清除选择
    clearSelection() {
      this.$refs.alertTable && this.$refs.alertTable.clearSelection()
    },
    
    // 查看预警详情
    viewAlertDetail(row) {
      // 模拟获取详细信息
      this.currentAlertDetail = {
        ...row,
        handleRecords: row.handled ? [
          {
            time: new Date().getTime() - 86400000,
            content: '已生成采购申请单 PR20230601',
            handler: '张三'
          }
        ] : []
      }
      this.detailDialogVisible = true
    },
    
    // 处理预警
    handleAlert(row) {
      this.currentAlertToHandle = { ...row }
      this.handleForm = {
        handleType: '1',
        handleRemark: ''
      }
      this.handleDialogVisible = true
    },
    
    // 确认处理预警
    confirmHandleAlert() {
      this.$refs.handleForm.validate((valid) => {
        if (valid) {
          this.handleLoading = true
          // 模拟处理请求
          setTimeout(() => {
            // 更新预警状态
            const alertIndex = this.alerts.findIndex(alert => alert.id === this.currentAlertToHandle.id)
            if (alertIndex !== -1) {
              this.alerts[alertIndex].handled = true
              this.alerts[alertIndex].handledTime = new Date().getTime()
              
              // 更新对应的预警列表
              const updateAlertList = (list) => {
                const index = list.findIndex(alert => alert.id === this.currentAlertToHandle.id)
                if (index !== -1) {
                  list[index].handled = true
                  list[index].handledTime = new Date().getTime()
                }
              }
              
              updateAlertList(this.lowStockAlerts)
              updateAlertList(this.zeroStockAlerts)
              updateAlertList(this.expiryAlerts)
            }
            
            this.$message.success('预警处理成功')
            this.handleDialogVisible = false
            this.handleLoading = false
          }, 1000)
        }
      })
    },
    
    // 批量处理预警
    batchHandleAlerts() {
      this.$confirm(`确定要批量处理选中的 ${this.selectedAlerts.length} 条预警吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量处理
        this.loading = true
        setTimeout(() => {
          this.selectedAlerts.forEach(alert => {
            const index = this.alerts.findIndex(a => a.id === alert.id)
            if (index !== -1) {
              this.alerts[index].handled = true
              this.alerts[index].handledTime = new Date().getTime()
            }
          })
          
          this.$message.success('批量处理成功')
          this.clearSelection()
          this.loading = false
        }, 1000)
      }).catch(() => {
        // 取消操作
      })
    },
    
    // 获取库存样式类
    getStockClass(item) {
      if (item.currentStock === 0) {
        return 'stock-zero'
      } else if (item.currentStock < item.threshold && item.alertType === 'lowStock') {
        return 'stock-low'
      }
      return ''
    },
    
    // 获取预警类型样式类
    getAlertTypeClass(type) {
      switch (type) {
        case 'lowStock':
          return 'warning'
        case 'zeroStock':
          return 'danger'
        case 'expiry':
          return 'info'
        default:
          return 'default'
      }
    },
    
    // 获取预警类型文本
    getAlertTypeText(type) {
      switch (type) {
        case 'lowStock':
          return '低库存预警'
        case 'zeroStock':
          return '零库存预警'
        case 'expiry':
          return '有效期预警'
        default:
          return '未知预警'
      }
    },
    
    // 获取剩余天数样式类
    getRemainingDaysClass(days) {
      if (days <= 7) {
        return 'days-critical'
      } else if (days <= 30) {
        return 'days-warning'
      }
      return ''
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.inventory-alert {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-overview {
  margin-bottom: 20px;
}

.overview-card {
  height: 100px;
}

.overview-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.overview-icon {
  font-size: 36px;
  margin-right: 16px;
}

.alert-warning .overview-icon {
  color: #faad14;
}

.alert-danger .overview-icon {
  color: #f5222d;
}

.alert-info .overview-icon {
  color: #1890ff;
}

.alert-success .overview-icon {
  color: #52c41a;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.overview-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.alert-tabs {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.batch-actions {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stock-zero {
  color: #f5222d;
  font-weight: bold;
}

.stock-low {
  color: #faad14;
  font-weight: bold;
}

.days-critical {
  color: #f5222d;
  font-weight: bold;
}

.days-warning {
  color: #faad14;
  font-weight: bold;
}

.alert-info-preview {
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.handler-info {
  font-size: 12px;
  color: #999;
}
</style>