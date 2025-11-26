<template>
  <div class="mrp-calculation">
    <el-card shadow="never">
      <div slot="header" class="header">
        <span>MRP计算</span>
        <div class="header-actions">
          <el-button type="primary" @click="handleStartCalculation">开始计算</el-button>
          <el-button @click="handleReset">重置参数</el-button>
        </div>
      </div>
      
      <!-- 计算参数设置 -->
      <el-card shadow="never" style="margin-bottom: 20px;">
        <div slot="header">
          <span>计算参数设置</span>
        </div>
        <el-form :model="calculationParams" class="calculation-form">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="计划周期">
                <el-date-picker
                  v-model="calculationParams.planPeriod"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 100%;"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="时区设置">
                <el-select v-model="calculationParams.timeZone" placeholder="请选择时区设置" style="width: 100%;">
                  <el-option label="周" value="week"></el-option>
                  <el-option label="旬" value="tenDay"></el-option>
                  <el-option label="月" value="month"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="需求来源">
                <el-checkbox-group v-model="calculationParams.demandSources">
                  <el-checkbox label="销售订单">销售订单</el-checkbox>
                  <el-checkbox label="预测计划">预测计划</el-checkbox>
                  <el-checkbox label="其他需求">其他需求</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="考虑安全库存">
                <el-switch v-model="calculationParams.considerSafetyStock"></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="考虑现有库存">
                <el-switch v-model="calculationParams.considerInventory" :disabled="true" :active-value="true"></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="考虑在途量">
                <el-switch v-model="calculationParams.considerInTransit"></el-switch>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="考虑在制量">
                <el-switch v-model="calculationParams.considerInProcess"></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="计算方式">
                <el-select v-model="calculationParams.calculateMethod" placeholder="请选择计算方式" style="width: 100%;">
                  <el-option label="净需求计算" value="netRequirement"></el-option>
                  <el-option label="毛需求计算" value="grossRequirement"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="批量规则">
                <el-select v-model="calculationParams.lotSizeRule" placeholder="请选择批量规则" style="width: 100%;">
                  <el-option label="按需批量" value="lotForLot"></el-option>
                  <el-option label="固定批量" value="fixedLot"></el-option>
                  <el-option label="经济批量" value="economicLot"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
      
      <!-- 产品选择 -->
      <el-card shadow="never" style="margin-bottom: 20px;">
        <div slot="header">
          <span>产品选择</span>
          <el-button type="text" size="small" @click="handleSelectAllProducts">全选</el-button>
          <el-button type="text" size="small" @click="handleClearProductSelection">清空</el-button>
        </div>
        <el-scrollbar style="height: 300px;">
          <el-checkbox-group v-model="selectedProducts" class="product-selection">
            <el-checkbox v-for="product in productList" :key="product.id" :label="product.id" style="display: block; margin-bottom: 10px;">
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-details">
                  <span class="product-code">编码: {{ product.code }}</span>
                  <span class="product-category">类别: {{ product.category }}</span>
                  <span class="product-inventory">库存: {{ product.inventory }}</span>
                </div>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </el-scrollbar>
      </el-card>
      
      <!-- 计算日志 -->
      <el-card shadow="never">
        <div slot="header">
          <span>计算日志</span>
          <el-button type="text" size="small" @click="handleClearLog" v-if="logEntries.length > 0">清空日志</el-button>
        </div>
        <el-scrollbar style="height: 200px;">
          <div class="log-container">
            <div v-for="(entry, index) in logEntries" :key="index" :class="['log-entry', entry.level]">
              <span class="log-time">{{ entry.time }}</span>
              <span class="log-content">{{ entry.content }}</span>
            </div>
          </div>
        </el-scrollbar>
      </el-card>
      
      <!-- 计算结果操作 -->
      <div class="result-actions" v-if="calculationCompleted">
        <el-button type="success" @click="handleViewResults">查看计算结果</el-button>
        <el-button type="info" @click="handleExportResults">导出计算报告</el-button>
      </div>
    </el-card>
    
    <!-- 计算进度对话框 -->
    <el-dialog title="计算进度" :visible.sync="progressDialogVisible" width="50%" :close-on-click-modal="false" :show-close="false">
      <div class="progress-content">
        <el-progress :percentage="calculationProgress" :status="progressStatus"></el-progress>
        <div class="progress-text">{{ progressText }}</div>
        <div class="progress-details">
          <div v-for="(step, index) in progressSteps" :key="index" :class="['progress-step', { 'completed': step.completed, 'current': step.current }]">
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-text">{{ step.text }}</div>
            <div class="step-status">{{ step.status }}</div>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleCancelCalculation" v-if="!calculationCompleted">取消计算</el-button>
        <el-button type="primary" @click="progressDialogVisible = false" v-else>完成</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'MrpCalculation',
  data() {
    return {
      // 计算参数
      calculationParams: {
        planPeriod: [new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)], // 默认90天
        timeZone: 'month',
        demandSources: ['销售订单', '预测计划'],
        considerSafetyStock: true,
        considerInventory: true,
        considerInTransit: true,
        considerInProcess: true,
        calculateMethod: 'netRequirement',
        lotSizeRule: 'lotForLot'
      },
      
      // 产品列表
      productList: [],
      
      // 选中的产品
      selectedProducts: [],
      
      // 计算日志
      logEntries: [],
      
      // 计算进度
      progressDialogVisible: false,
      calculationProgress: 0,
      calculationCompleted: false,
      progressStatus: 'active',
      progressText: '准备计算...',
      progressSteps: [
        { text: '收集需求数据', status: '等待中', completed: false, current: false },
        { text: '计算毛需求', status: '等待中', completed: false, current: false },
        { text: '计算净需求', status: '等待中', completed: false, current: false },
        { text: '计算计划订单', status: '等待中', completed: false, current: false },
        { text: '展开物料需求', status: '等待中', completed: false, current: false },
        { text: '生成计算结果', status: '等待中', completed: false, current: false }
      ],
      
      // 计算定时器
      calculationTimer: null
    }
  },
  
  mounted() {
    // 初始化产品数据
    this.loadProductList()
    // 添加初始日志
    this.addLog('info', '系统已准备就绪，请设置计算参数并选择产品进行MRP计算。')
  },
  
  methods: {
    // 加载产品列表
    loadProductList() {
      // 模拟产品数据
      const mockProducts = []
      for (let i = 1; i <= 20; i++) {
        mockProducts.push({
          id: `PROD${String(i).padStart(4, '0')}`,
          code: `P${String(i).padStart(4, '0')}`,
          name: `产品${i}`,
          category: i % 3 === 0 ? '成品' : i % 3 === 1 ? '半成品' : '原材料',
          inventory: Math.floor(Math.random() * 1000),
          safetyStock: Math.floor(Math.random() * 200),
          leadTime: Math.floor(Math.random() * 15) + 1
        })
      }
      this.productList = mockProducts
    },
    
    // 添加日志
    addLog(level, content) {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('zh-CN')
      this.logEntries.push({
        level,
        content,
        time: timeStr
      })
      
      // 滚动到底部
      this.$nextTick(() => {
        const scrollContainer = this.$el.querySelector('.log-container')
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      })
    },
    
    // 开始计算
    handleStartCalculation() {
      // 验证参数
      if (this.selectedProducts.length === 0) {
        this.$message.warning('请至少选择一个产品进行计算')
        return
      }
      
      // 重置状态
      this.calculationProgress = 0
      this.calculationCompleted = false
      this.progressStatus = 'active'
      this.progressText = '准备计算...'
      
      // 重置进度步骤
      this.progressSteps.forEach(step => {
        step.status = '等待中'
        step.completed = false
        step.current = false
      })
      
      // 清空日志
      this.logEntries = []
      
      // 显示进度对话框
      this.progressDialogVisible = true
      
      // 添加开始计算日志
      this.addLog('info', 'MRP计算开始执行...')
      
      // 开始模拟计算过程
      this.startSimulationCalculation()
    },
    
    // 模拟计算过程
    startSimulationCalculation() {
      let currentStep = 0
      const totalSteps = this.progressSteps.length
      
      this.calculationTimer = setInterval(() => {
        if (currentStep < totalSteps) {
          // 更新当前步骤状态
          this.progressSteps[currentStep].current = true
          this.progressSteps[currentStep].status = '执行中'
          this.progressText = this.progressSteps[currentStep].text
          
          this.addLog('info', `${this.progressSteps[currentStep].text}中...`)
          
          // 模拟步骤完成
          setTimeout(() => {
            this.progressSteps[currentStep].completed = true
            this.progressSteps[currentStep].current = false
            this.progressSteps[currentStep].status = '已完成'
            
            this.addLog('success', `${this.progressSteps[currentStep].text}完成`)
            
            currentStep++
            this.calculationProgress = Math.floor((currentStep / totalSteps) * 100)
            
            // 如果是最后一步，标记计算完成
            if (currentStep >= totalSteps) {
              this.calculationCompleted = true
              this.progressStatus = 'success'
              this.progressText = 'MRP计算完成！'
              this.addLog('success', 'MRP计算已成功完成！')
              clearInterval(this.calculationTimer)
            }
          }, 1000 + Math.random() * 1000) // 随机1-2秒的步骤执行时间
        }
      }, 2000)
    },
    
    // 取消计算
    handleCancelCalculation() {
      if (this.calculationTimer) {
        clearInterval(this.calculationTimer)
      }
      
      this.progressDialogVisible = false
      this.addLog('warning', 'MRP计算已取消')
      this.$message.info('计算已取消')
    },
    
    // 重置参数
    handleReset() {
      this.$confirm('确定要重置所有计算参数吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.calculationParams = {
          planPeriod: [new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)],
          timeZone: 'month',
          demandSources: ['销售订单', '预测计划'],
          considerSafetyStock: true,
          considerInventory: true,
          considerInTransit: true,
          considerInProcess: true,
          calculateMethod: 'netRequirement',
          lotSizeRule: 'lotForLot'
        }
        
        this.selectedProducts = []
        this.addLog('info', '计算参数已重置')
      }).catch(() => {
        // 取消重置
      })
    },
    
    // 全选产品
    handleSelectAllProducts() {
      this.selectedProducts = this.productList.map(product => product.id)
    },
    
    // 清空产品选择
    handleClearProductSelection() {
      this.selectedProducts = []
    },
    
    // 清空日志
    handleClearLog() {
      this.$confirm('确定要清空计算日志吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.logEntries = []
      }).catch(() => {
        // 取消清空
      })
    },
    
    // 查看计算结果
    handleViewResults() {
      this.$router.push('/quotation/mrp-result')
    },
    
    // 导出计算报告
    handleExportResults() {
      this.addLog('info', '正在导出MRP计算报告...')
      
      // 模拟导出过程
      setTimeout(() => {
        this.addLog('success', 'MRP计算报告导出成功')
        this.$message.success('计算报告导出成功')
      }, 1000)
    }
  },
  
  beforeDestroy() {
    // 清理定时器
    if (this.calculationTimer) {
      clearInterval(this.calculationTimer)
    }
  }
}
</script>

<style scoped>
.mrp-calculation {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.calculation-form {
  padding: 10px 0;
}

.product-selection {
  padding: 10px 0;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: #303133;
}

.product-details {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #606266;
}

.log-container {
  padding: 10px 0;
}

.log-entry {
  display: flex;
  padding: 5px 0;
  font-size: 14px;
  border-bottom: 1px solid #ebeef5;
}

.log-time {
  width: 80px;
  color: #909399;
  font-size: 12px;
}

.log-content {
  flex: 1;
}

.log-entry.info .log-content {
  color: #606266;
}

.log-entry.success .log-content {
  color: #67c23a;
}

.log-entry.warning .log-content {
  color: #e6a23c;
}

.log-entry.error .log-content {
  color: #f56c6c;
}

.result-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.progress-content {
  padding: 10px 0;
}

.progress-text {
  margin: 20px 0;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
}

.progress-details {
  margin-top: 30px;
}

.progress-step {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #dcdfe6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-right: 15px;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
  font-size: 14px;
}

.step-status {
  width: 80px;
  font-size: 12px;
  color: #909399;
  text-align: right;
}

.progress-step.completed .step-number {
  background-color: #67c23a;
}

.progress-step.completed .step-text {
  color: #67c23a;
  font-weight: 600;
}

.progress-step.completed .step-status {
  color: #67c23a;
}

.progress-step.current .step-number {
  background-color: #409eff;
}

.progress-step.current .step-text {
  color: #409eff;
  font-weight: 600;
}

.progress-step.current .step-status {
  color: #409eff;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .mrp-calculation {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .product-details {
    flex-direction: column;
    gap: 5px;
  }
  
  .progress-step {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .step-status {
    text-align: left;
    width: auto;
  }
}
</style>