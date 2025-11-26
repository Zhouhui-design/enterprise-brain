<template>
  <div class="scheduling-optimize">
    <el-card shadow="never">
      <div slot="header" class="header">
        <span>排程优化</span>
        <div class="header-actions">
          <el-button type="primary" @click="handleOptimize">开始优化</el-button>
          <el-button type="info" @click="handleExport">导出报告</el-button>
        </div>
      </div>
      
      <!-- 优化参数设置 -->
      <el-card shadow="never" style="margin-bottom: 20px;">
        <div slot="header">
          <span>优化参数设置</span>
        </div>
        <el-form :inline="true" :model="optimizeParams" class="optimize-form">
          <el-form-item label="优化目标">
            <el-radio-group v-model="optimizeParams.optimizeGoal">
              <el-radio :label="'minMakespan'" border>最小化完工时间</el-radio>
              <el-radio :label="'minCost'" border>最小化成本</el-radio>
              <el-radio :label="'balanceLoad'" border>均衡负载</el-radio>
              <el-radio :label="'maxUtilization'" border>最大化利用率</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="optimizeParams.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            ></el-date-picker>
          </el-form-item>
          
          <el-form-item label="考虑约束">
            <el-checkbox-group v-model="optimizeParams.constraints">
              <el-checkbox label="资源约束">资源约束</el-checkbox>
              <el-checkbox label="产能约束">产能约束</el-checkbox>
              <el-checkbox label="优先级约束">优先级约束</el-checkbox>
              <el-checkbox label="交货期约束">交货期约束</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item label="优化算法">
            <el-select v-model="optimizeParams.algorithm">
              <el-option label="遗传算法" value="genetic"></el-option>
              <el-option label="模拟退火" value="simulatedAnnealing"></el-option>
              <el-option label="粒子群算法" value="particleSwarm"></el-option>
              <el-option label="启发式算法" value="heuristic"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>
      
      <!-- 优化结果 -->
      <el-card shadow="never" v-if="optimizationResult">
        <div slot="header">
          <span>优化结果分析</span>
        </div>
        
        <!-- 优化指标对比 -->
        <div class="optimization-indicators">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="indicator-card">
                <div class="indicator-title">完工时间</div>
                <div class="indicator-comparison">
                  <div class="before">优化前: {{ optimizationResult.before.makespan }}天</div>
                  <div class="after">优化后: {{ optimizationResult.after.makespan }}天</div>
                  <div class="improvement" :class="{ 'positive': optimizationResult.improvement.makespan > 0 }">
                    {{ optimizationResult.improvement.makespan > 0 ? '-' : '+' }}{{ Math.abs(optimizationResult.improvement.makespan) }}%
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="indicator-card">
                <div class="indicator-title">生产成本</div>
                <div class="indicator-comparison">
                  <div class="before">优化前: ¥{{ optimizationResult.before.cost }}</div>
                  <div class="after">优化后: ¥{{ optimizationResult.after.cost }}</div>
                  <div class="improvement" :class="{ 'positive': optimizationResult.improvement.cost > 0 }">
                    {{ optimizationResult.improvement.cost > 0 ? '-' : '+' }}{{ Math.abs(optimizationResult.improvement.cost) }}%
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="indicator-card">
                <div class="indicator-title">资源利用率</div>
                <div class="indicator-comparison">
                  <div class="before">优化前: {{ optimizationResult.before.utilization }}%</div>
                  <div class="after">优化后: {{ optimizationResult.after.utilization }}%</div>
                  <div class="improvement" :class="{ 'positive': optimizationResult.improvement.utilization > 0 }">
                    {{ optimizationResult.improvement.utilization > 0 ? '+' : '-' }}{{ Math.abs(optimizationResult.improvement.utilization) }}%
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="indicator-card">
                <div class="indicator-title">负载均衡度</div>
                <div class="indicator-comparison">
                  <div class="before">优化前: {{ optimizationResult.before.balance }}%</div>
                  <div class="after">优化后: {{ optimizationResult.after.balance }}%</div>
                  <div class="improvement" :class="{ 'positive': optimizationResult.improvement.balance > 0 }">
                    {{ optimizationResult.improvement.balance > 0 ? '+' : '-' }}{{ Math.abs(optimizationResult.improvement.balance) }}%
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <!-- 优化前后对比图表 -->
        <div class="comparison-charts">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card shadow="never">
                <div slot="header"><span>资源利用率对比</span></div>
                <div class="chart-placeholder">
                  <el-empty description="资源利用率对比图表" style="margin: 40px 0;"></el-empty>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never">
                <div slot="header"><span>产能负载对比</span></div>
                <div class="chart-placeholder">
                  <el-empty description="产能负载对比图表" style="margin: 40px 0;"></el-empty>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
        
        <!-- 优化建议 -->
        <div class="optimization-suggestions">
          <el-card shadow="never">
            <div slot="header"><span>优化建议</span></div>
            <el-list :data="optimizationResult.suggestions" border>
              <el-list-item v-for="(item, index) in optimizationResult.suggestions" :key="index">
                <span class="suggestion-text">{{ item }}</span>
              </el-list-item>
            </el-list>
          </el-card>
        </div>
        
        <!-- 优化操作按钮 -->
        <div class="optimization-actions">
          <el-button type="primary" @click="handleApplyOptimization">应用优化方案</el-button>
          <el-button @click="handleSaveOptimization">保存优化方案</el-button>
          <el-button type="danger" @click="handleCancelOptimization">放弃优化</el-button>
        </div>
      </el-card>
      
      <!-- 优化历史 -->
      <el-card shadow="never" style="margin-top: 20px;">
        <div slot="header">
          <span>优化历史记录</span>
        </div>
        <el-table :data="optimizationHistory" style="width: 100%" border>
          <el-table-column prop="optimizeTime" label="优化时间" width="180"></el-table-column>
          <el-table-column prop="optimizeGoal" label="优化目标" width="150">
            <template slot-scope="scope">
              <span>{{ getOptimizeGoalText(scope.row.optimizeGoal) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="algorithm" label="优化算法" width="150"></el-table-column>
          <el-table-column prop="improvementRate" label="整体改进率" width="120">
            <template slot-scope="scope">
              <el-progress :percentage="scope.row.improvementRate" :color="progressColor" :show-text="true" :text-inside="true" height="20"></el-progress>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === 'applied' ? 'success' : 'info'">
                {{ scope.row.status === 'applied' ? '已应用' : '已保存' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template slot-scope="scope">
              <el-button size="small" @click="handleViewDetail(scope.row)">查看详情</el-button>
              <el-button size="small" type="primary" @click="handleReapply(scope.row)" :disabled="scope.row.status === 'applied'">重新应用</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            layout="total, sizes, prev, pager, next, jumper"
            :total="optimizationHistory.length"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </el-card>
    </el-card>
    
    <!-- 优化详情对话框 -->
    <el-dialog title="优化详情" :visible.sync="detailDialogVisible" width="80%">
      <div v-if="selectedHistory" class="history-detail">
        <div class="detail-section">
          <h3>基本信息</h3>
          <el-descriptions border :column="3">
            <el-descriptions-item label="优化时间">{{ selectedHistory.optimizeTime }}</el-descriptions-item>
            <el-descriptions-item label="优化目标">{{ getOptimizeGoalText(selectedHistory.optimizeGoal) }}</el-descriptions-item>
            <el-descriptions-item label="优化算法">{{ selectedHistory.algorithm }}</el-descriptions-item>
            <el-descriptions-item label="整体改进率">{{ selectedHistory.improvementRate }}%</el-descriptions-item>
            <el-descriptions-item label="状态">{{ selectedHistory.status === 'applied' ? '已应用' : '已保存' }}</el-descriptions-item>
            <el-descriptions-item label="持续时间">{{ selectedHistory.duration }}秒</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h3>优化效果对比</h3>
          <el-table :data="selectedHistory.comparisonData" style="width: 100%" border>
            <el-table-column prop="indicator" label="指标" width="180"></el-table-column>
            <el-table-column prop="before" label="优化前"></el-table-column>
            <el-table-column prop="after" label="优化后"></el-table-column>
            <el-table-column prop="improvement" label="改进率">
              <template slot-scope="scope">
                <span :class="{ 'text-success': parseFloat(scope.row.improvement) > 0 }">
                  {{ scope.row.improvement }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ScheduleOptimize',
  data() {
    return {
      // 优化参数
      optimizeParams: {
        optimizeGoal: 'minMakespan',
        dateRange: [new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)], // 默认一周
        constraints: ['资源约束', '产能约束'],
        algorithm: 'genetic'
      },
      
      // 优化结果
      optimizationResult: null,
      
      // 优化历史
      optimizationHistory: [],
      
      // 分页信息
      pageSize: 10,
      currentPage: 1,
      
      // 对话框状态
      detailDialogVisible: false,
      selectedHistory: null,
      
      // 进度条颜色
      progressColor: '#67c23a'
    }
  },
  
  mounted() {
    // 初始化加载优化历史数据
    this.loadOptimizationHistory()
  },
  
  methods: {
    // 开始优化
    handleOptimize() {
      this.$confirm('确定要开始优化排程吗？这可能需要一些时间。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$loading({
          lock: true,
          text: '正在优化中...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        
        // 模拟优化过程
        setTimeout(() => {
          this.$loading().close()
          // 生成模拟优化结果
          this.optimizationResult = this.generateOptimizationResult()
          this.$message.success('优化完成')
        }, 2000)
      }).catch(() => {
        this.$message.info('已取消优化')
      })
    },
    
    // 导出报告
    handleExport() {
      this.$message.success('报告导出成功')
    },
    
    // 应用优化方案
    handleApplyOptimization() {
      this.$confirm('确定要应用此优化方案吗？这将更新当前排程。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟应用优化方案
        setTimeout(() => {
          this.$message.success('优化方案应用成功')
          // 更新历史记录
          this.addToHistory('applied')
        }, 1000)
      }).catch(() => {
        this.$message.info('已取消应用')
      })
    },
    
    // 保存优化方案
    handleSaveOptimization() {
      // 模拟保存优化方案
      this.addToHistory('saved')
      this.$message.success('优化方案保存成功')
    },
    
    // 放弃优化
    handleCancelOptimization() {
      this.$confirm('确定要放弃当前优化结果吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.optimizationResult = null
        this.$message.success('已放弃优化结果')
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    
    // 查看历史详情
    handleViewDetail(row) {
      this.selectedHistory = row
      this.detailDialogVisible = true
    },
    
    // 重新应用历史优化
    handleReapply(row) {
      this.$confirm('确定要重新应用此历史优化方案吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟重新应用
        setTimeout(() => {
          this.$message.success('优化方案重新应用成功')
          // 更新历史记录状态
          const index = this.optimizationHistory.findIndex(item => item.id === row.id)
          if (index !== -1) {
            this.optimizationHistory[index].status = 'applied'
          }
        }, 1000)
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    
    // 分页处理
    handleSizeChange(val) {
      this.pageSize = val
    },
    
    handleCurrentChange(val) {
      this.currentPage = val
    },
    
    // 获取优化目标文本
    getOptimizeGoalText(goal) {
      const goalMap = {
        'minMakespan': '最小化完工时间',
        'minCost': '最小化成本',
        'balanceLoad': '均衡负载',
        'maxUtilization': '最大化利用率'
      }
      return goalMap[goal] || goal
    },
    
    // 生成模拟优化结果
    generateOptimizationResult() {
      const beforeMakespan = 25 + Math.floor(Math.random() * 10)
      const beforeCost = 50000 + Math.floor(Math.random() * 30000)
      const beforeUtilization = 70 + Math.floor(Math.random() * 15)
      const beforeBalance = 65 + Math.floor(Math.random() * 15)
      
      // 根据优化目标计算优化后的数值
      let afterMakespan, afterCost, afterUtilization, afterBalance
      
      if (this.optimizeParams.optimizeGoal === 'minMakespan') {
        // 最小化完工时间，其他指标可能略有改善
        afterMakespan = Math.floor(beforeMakespan * (0.7 + Math.random() * 0.15))
        afterCost = Math.floor(beforeCost * (0.95 + Math.random() * 0.05))
        afterUtilization = Math.floor(beforeUtilization * (1.1 + Math.random() * 0.05))
        afterBalance = Math.floor(beforeBalance * (0.95 + Math.random() * 0.1))
      } else if (this.optimizeParams.optimizeGoal === 'minCost') {
        // 最小化成本，其他指标可能略有改善
        afterMakespan = Math.floor(beforeMakespan * (0.95 + Math.random() * 0.1))
        afterCost = Math.floor(beforeCost * (0.75 + Math.random() * 0.1))
        afterUtilization = Math.floor(beforeUtilization * (0.9 + Math.random() * 0.1))
        afterBalance = Math.floor(beforeBalance * (0.95 + Math.random() * 0.1))
      } else if (this.optimizeParams.optimizeGoal === 'balanceLoad') {
        // 均衡负载
        afterMakespan = Math.floor(beforeMakespan * (0.9 + Math.random() * 0.1))
        afterCost = Math.floor(beforeCost * (0.9 + Math.random() * 0.1))
        afterUtilization = Math.floor(beforeUtilization * (0.95 + Math.random() * 0.1))
        afterBalance = Math.floor(beforeBalance * (1.2 + Math.random() * 0.1))
      } else if (this.optimizeParams.optimizeGoal === 'maxUtilization') {
        // 最大化利用率
        afterMakespan = Math.floor(beforeMakespan * (0.85 + Math.random() * 0.1))
        afterCost = Math.floor(beforeCost * (0.9 + Math.random() * 0.1))
        afterUtilization = Math.floor(beforeUtilization * (1.2 + Math.random() * 0.1))
        afterBalance = Math.floor(beforeBalance * (1.1 + Math.random() * 0.1))
      }
      
      // 计算改进率
      const makespanImprovement = Math.round(((beforeMakespan - afterMakespan) / beforeMakespan) * 100)
      const costImprovement = Math.round(((beforeCost - afterCost) / beforeCost) * 100)
      const utilizationImprovement = Math.round(((afterUtilization - beforeUtilization) / beforeUtilization) * 100)
      const balanceImprovement = Math.round(((afterBalance - beforeBalance) / beforeBalance) * 100)
      
      // 生成优化建议
      const suggestions = [
        '增加设备A的工作时间可以进一步提高产能',
        '考虑调整产品B的生产顺序以减少等待时间',
        '优化工序C的参数设置以提高效率',
        '建议增加员工班次以平衡工作负载',
        '可以考虑在非高峰期安排设备维护'
      ]
      
      return {
        before: {
          makespan: beforeMakespan,
          cost: beforeCost,
          utilization: beforeUtilization,
          balance: beforeBalance
        },
        after: {
          makespan: afterMakespan,
          cost: afterCost,
          utilization: afterUtilization,
          balance: afterBalance
        },
        improvement: {
          makespan: makespanImprovement,
          cost: costImprovement,
          utilization: utilizationImprovement,
          balance: balanceImprovement
        },
        suggestions: suggestions
      }
    },
    
    // 加载优化历史
    loadOptimizationHistory() {
      // 模拟加载历史数据
      const history = [
        {
          id: '1',
          optimizeTime: '2024-01-15 14:30:25',
          optimizeGoal: 'minMakespan',
          algorithm: '遗传算法',
          improvementRate: 25,
          status: 'applied',
          duration: 15,
          comparisonData: [
            { indicator: '完工时间', before: '28天', after: '21天', improvement: '+25.0%' },
            { indicator: '生产成本', before: '¥78,500', after: '¥75,200', improvement: '+4.2%' },
            { indicator: '资源利用率', before: '78%', after: '85%', improvement: '+9.0%' },
            { indicator: '负载均衡度', before: '72%', after: '75%', improvement: '+4.2%' }
          ]
        },
        {
          id: '2',
          optimizeTime: '2024-01-10 09:15:36',
          optimizeGoal: 'minCost',
          algorithm: '模拟退火',
          improvementRate: 18,
          status: 'saved',
          duration: 22,
          comparisonData: [
            { indicator: '完工时间', before: '30天', after: '28天', improvement: '+6.7%' },
            { indicator: '生产成本', before: '¥82,000', after: '¥67,240', improvement: '+18.0%' },
            { indicator: '资源利用率', before: '75%', after: '72%', improvement: '-4.0%' },
            { indicator: '负载均衡度', before: '70%', after: '68%', improvement: '-2.9%' }
          ]
        },
        {
          id: '3',
          optimizeTime: '2024-01-05 16:45:12',
          optimizeGoal: 'balanceLoad',
          algorithm: '粒子群算法',
          improvementRate: 22,
          status: 'applied',
          duration: 18,
          comparisonData: [
            { indicator: '完工时间', before: '26天', after: '24天', improvement: '+7.7%' },
            { indicator: '生产成本', before: '¥75,000', after: '¥71,250', improvement: '+5.0%' },
            { indicator: '资源利用率', before: '72%', after: '81%', improvement: '+12.5%' },
            { indicator: '负载均衡度', before: '65%', after: '82%', improvement: '+26.2%' }
          ]
        }
      ]
      
      this.optimizationHistory = history
    },
    
    // 添加到历史记录
    addToHistory(status) {
      if (!this.optimizationResult) return
      
      const now = new Date()
      const newHistory = {
        id: Date.now().toString(),
        optimizeTime: now.toLocaleString('zh-CN'),
        optimizeGoal: this.optimizeParams.optimizeGoal,
        algorithm: this.getAlgorithmText(this.optimizeParams.algorithm),
        improvementRate: Math.round((
          this.optimizationResult.improvement.makespan +
          this.optimizationResult.improvement.cost +
          this.optimizationResult.improvement.utilization +
          this.optimizationResult.improvement.balance
        ) / 4),
        status: status,
        duration: Math.floor(Math.random() * 20) + 10,
        comparisonData: [
          { 
            indicator: '完工时间', 
            before: `${this.optimizationResult.before.makespan}天`, 
            after: `${this.optimizationResult.after.makespan}天`, 
            improvement: `${this.optimizationResult.improvement.makespan > 0 ? '+' : ''}${this.optimizationResult.improvement.makespan}%`
          },
          { 
            indicator: '生产成本', 
            before: `¥${this.optimizationResult.before.cost.toLocaleString()}`, 
            after: `¥${this.optimizationResult.after.cost.toLocaleString()}`, 
            improvement: `${this.optimizationResult.improvement.cost > 0 ? '+' : ''}${this.optimizationResult.improvement.cost}%`
          },
          { 
            indicator: '资源利用率', 
            before: `${this.optimizationResult.before.utilization}%`, 
            after: `${this.optimizationResult.after.utilization}%`, 
            improvement: `${this.optimizationResult.improvement.utilization > 0 ? '+' : ''}${this.optimizationResult.improvement.utilization}%`
          },
          { 
            indicator: '负载均衡度', 
            before: `${this.optimizationResult.before.balance}%`, 
            after: `${this.optimizationResult.after.balance}%`, 
            improvement: `${this.optimizationResult.improvement.balance > 0 ? '+' : ''}${this.optimizationResult.improvement.balance}%`
          }
        ]
      }
      
      this.optimizationHistory.unshift(newHistory)
    },
    
    // 获取算法文本
    getAlgorithmText(algorithm) {
      const algorithmMap = {
        'genetic': '遗传算法',
        'simulatedAnnealing': '模拟退火',
        'particleSwarm': '粒子群算法',
        'heuristic': '启发式算法'
      }
      return algorithmMap[algorithm] || algorithm
    }
  }
}
</script>

<style scoped>
.scheduling-optimize {
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

.optimize-form {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 10px 0;
}

.indicator-card {
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}

.indicator-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #303133;
}

.indicator-comparison {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.before, .after {
  font-size: 14px;
  color: #606266;
}

.improvement {
  font-size: 18px;
  font-weight: 600;
  margin-top: 5px;
}

.improvement.positive {
  color: #67c23a;
}

.improvement:not(.positive) {
  color: #f56c6c;
}

.comparison-charts {
  margin-top: 20px;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.optimization-suggestions {
  margin-top: 20px;
}

.suggestion-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
}

.optimization-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.history-detail {
  padding: 10px 0;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #303133;
}

.text-success {
  color: #67c23a;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .scheduling-optimize {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .optimize-form {
    flex-direction: column;
  }
  
  .indicator-comparison {
    font-size: 12px;
  }
}
</style>