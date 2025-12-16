<template>
  <div class="machine-loading">
    <div class="page-header">
      <h1>设备负载管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleLoadBalance">负载均衡</el-button>
        <el-button type="info" @click="handleExport">导出报表</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="车间">
          <el-select v-model="searchForm.workshopId" placeholder="请选择车间">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="workshop in workshops" :key="workshop.id" :label="workshop.name" :value="workshop.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="searchForm.machineType" placeholder="请选择设备类型">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="type in machineTypes" :key="type.value" :label="type.label" :value="type.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <i class="el-icon-search"></i> 查询
          </el-button>
          <el-button @click="handleReset">
            <i class="el-icon-refresh"></i> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20">
      <!-- 设备负载概览 -->
      <el-col :span="8">
        <el-card shadow="never" class="overview-card">
          <div slot="header" class="card-header">
            <span>负载概览</span>
          </div>
          <div class="overview-stats">
            <div class="stat-item">
              <div class="stat-label">平均负载率</div>
              <div class="stat-value">{{ avgLoadRate }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">高负载设备</div>
              <div class="stat-value high-load">{{ highLoadMachines }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">低负载设备</div>
              <div class="stat-value low-load">{{ lowLoadMachines }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">设备总数</div>
              <div class="stat-value">{{ totalMachines }}</div>
            </div>
          </div>
          
          <!-- 负载分布图 -->
          <div class="load-distribution">
            <h4>负载分布</h4>
            <div class="distribution-bar">
              <div 
                v-for="range in loadRanges" 
                :key="range.key"
                class="distribution-segment"
                :class="range.key"
                :style="{ width: range.percentage + '%' }"
                :title="range.label + ': ' + range.percentage + '%'"
              ></div>
            </div>
            <div class="distribution-legend">
              <div v-for="range in loadRanges" :key="range.key" class="legend-item">
                <span class="legend-color" :class="range.key"></span>
                <span>{{ range.label }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 设备状态 -->
        <el-card shadow="never" class="status-card">
          <div slot="header" class="card-header">
            <span>设备状态</span>
          </div>
          <div class="status-stats">
            <div class="status-item">
              <div class="status-circle running"></div>
              <div class="status-info">
                <div class="status-label">运行中</div>
                <div class="status-count">{{ statusCounts.running }}</div>
              </div>
            </div>
            <div class="status-item">
              <div class="status-circle idle"></div>
              <div class="status-info">
                <div class="status-label">空闲</div>
                <div class="status-count">{{ statusCounts.idle }}</div>
              </div>
            </div>
            <div class="status-item">
              <div class="status-circle maintenance"></div>
              <div class="status-info">
                <div class="status-label">维护中</div>
                <div class="status-count">{{ statusCounts.maintenance }}</div>
              </div>
            </div>
            <div class="status-item">
              <div class="status-circle fault"></div>
              <div class="status-info">
                <div class="status-label">故障</div>
                <div class="status-count">{{ statusCounts.fault }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 设备负载详情 -->
      <el-col :span="16">
        <el-card shadow="never" class="load-detail-card">
          <div slot="header" class="card-header">
            <span>设备负载详情</span>
            <div class="header-actions">
              <el-select v-model="viewMode" placeholder="视图模式" size="small">
                <el-option label="列表视图" value="list"></el-option>
                <el-option label="图表视图" value="chart"></el-option>
              </el-select>
            </div>
          </div>

          <!-- 列表视图 -->
          <div v-if="viewMode === 'list'" class="list-view">
            <el-table 
              :data="machinesData" 
              style="width: 100%"
              border
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55"></el-table-column>
              <el-table-column prop="machineCode" label="设备编号" width="120"></el-table-column>
              <el-table-column prop="machineName" label="设备名称" width="150"></el-table-column>
              <el-table-column prop="machineType" label="设备类型" width="120"></el-table-column>
              <el-table-column prop="workshopName" label="所属车间" width="120"></el-table-column>
              <el-table-column prop="status" label="设备状态" width="100">
                <template slot-scope="scope">
                  <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="loadRate" label="当前负载率" width="150">
                <template slot-scope="scope">
                  <el-progress 
                    :percentage="scope.row.loadRate" 
                    :format="percentageFormat"
                    :status="getLoadStatus(scope.row.loadRate)"
                  ></el-progress>
                </template>
              </el-table-column>
              <el-table-column prop="taskCount" label="任务数" width="100" align="right"></el-table-column>
              <el-table-column prop="availableTime" label="可用时间(小时)" width="120" align="right"></el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template slot-scope="scope">
                  <el-button size="small" @click="handleMachineDetail(scope.row)">详情</el-button>
                  <el-button type="primary" size="small" @click="handleTaskAssign(scope.row)">任务分配</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination">
              <el-pagination
                background
                layout="prev, pager, next, jumper, ->, total"
                :total="total"
                :page-size="pageSize"
                :current-page="currentPage"
                @current-change="handleCurrentChange"
                @size-change="handleSizeChange"
              ></el-pagination>
            </div>
          </div>

          <!-- 图表视图 -->
          <div v-else class="chart-view">
            <div class="chart-placeholder">
              <el-empty description="设备负载分布图表" style="margin: 60px 0;"></el-empty>
            </div>
          </div>
        </el-card>

        <!-- 负载预警 -->
        <el-card shadow="never" class="warning-card">
          <div slot="header" class="card-header">
            <span>负载预警</span>
          </div>
          <el-alert
            v-for="alert in loadAlerts" 
            :key="alert.id"
            :title="alert.title"
            :description="alert.description"
            :type="alert.type"
            show-icon
            :closable="false"
            style="margin-bottom: 10px;"
          ></el-alert>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务分配对话框 -->
    <el-dialog
      title="任务分配"
      :visible.sync="assignDialogVisible"
      width="800px"
      @close="handleAssignDialogClose"
    >
      <div v-if="selectedMachine.id">
        <div class="dialog-section">
          <h4>设备信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="设备编号">{{ selectedMachine.machineCode }}</el-descriptions-item>
            <el-descriptions-item label="设备名称">{{ selectedMachine.machineName }}</el-descriptions-item>
            <el-descriptions-item label="当前负载率">{{ selectedMachine.loadRate }}%</el-descriptions-item>
            <el-descriptions-item label="可用时间">{{ selectedMachine.availableTime }}小时</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="dialog-section">
          <h4>待分配任务</h4>
          <el-table 
            :data="availableTasks" 
            style="width: 100%"
            border
            @selection-change="handleTaskSelectionChange"
          >
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column prop="taskCode" label="任务编号" width="120"></el-table-column>
            <el-table-column prop="productName" label="产品名称" width="120"></el-table-column>
            <el-table-column prop="requiredTime" label="所需时间(小时)" width="120" align="right"></el-table-column>
            <el-table-column prop="priority" label="优先级" width="100">
              <template slot-scope="scope">
                <el-tag :type="getPriorityType(scope.row.priority)">{{ getPriorityText(scope.row.priority) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deadline" label="截止日期" width="120"></el-table-column>
          </el-table>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="handleAssignDialogClose">取消</el-button>
        <el-button type="primary" @click="handleConfirmAssign">确认分配</el-button>
      </div>
    </el-dialog>

    <!-- 设备详情对话框 -->
    <el-dialog
      title="设备详情"
      :visible.sync="detailDialogVisible"
      width="700px"
      @close="handleDetailDialogClose"
    >
      <div v-if="selectedMachine.id" class="machine-detail">
        <el-tabs v-model="detailActiveTab">
          <el-tab-pane label="基本信息">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="设备编号">{{ selectedMachine.machineCode }}</el-descriptions-item>
              <el-descriptions-item label="设备名称">{{ selectedMachine.machineName }}</el-descriptions-item>
              <el-descriptions-item label="设备类型">{{ selectedMachine.machineType }}</el-descriptions-item>
              <el-descriptions-item label="所属车间">{{ selectedMachine.workshopName }}</el-descriptions-item>
              <el-descriptions-item label="设备状态">{{ getStatusText(selectedMachine.status) }}</el-descriptions-item>
              <el-descriptions-item label="当前负载率">{{ selectedMachine.loadRate }}%</el-descriptions-item>
              <el-descriptions-item label="额定产能">{{ selectedMachine.capacity }}/小时</el-descriptions-item>
              <el-descriptions-item label="可用时间">{{ selectedMachine.availableTime }}小时</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ selectedMachine.manager }}</el-descriptions-item>
              <el-descriptions-item label="使用年限">{{ selectedMachine.usageYears }}年</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="当前任务">
            <el-table :data="selectedMachine.currentTasks" style="width: 100%" border>
              <el-table-column prop="taskCode" label="任务编号" width="120"></el-table-column>
              <el-table-column prop="productName" label="产品名称" width="120"></el-table-column>
              <el-table-column prop="startTime" label="开始时间" width="150"></el-table-column>
              <el-table-column prop="endTime" label="结束时间" width="150"></el-table-column>
              <el-table-column prop="progress" label="进度" width="100" align="right">
                <template slot-scope="scope">
                  {{ scope.row.progress }}%
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="负载趋势">
            <div class="chart-placeholder">
              <el-empty description="负载趋势图表" style="margin: 40px 0;"></el-empty>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="handleDetailDialogClose">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'MachineLoading',
  data() {
    return {
      // 搜索表单
      searchForm: {
        workshopId: '',
        machineType: '',
        dateRange: []
      },
      // 车间列表
      workshops: [
        { id: 1, name: '1号车间' },
        { id: 2, name: '2号车间' },
        { id: 3, name: '3号车间' }
      ],
      // 设备类型
      machineTypes: [
        { label: '车床', value: 'lathe' },
        { label: '铣床', value: 'milling' },
        { label: '钻床', value: 'drilling' },
        { label: '磨床', value: 'grinding' },
        { label: '冲压机', value: 'punching' }
      ],
      // 设备数据
      machinesData: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      selectedRows: [],
      // 视图模式
      viewMode: 'list',
      // 负载概览
      avgLoadRate: 65,
      highLoadMachines: 3,
      lowLoadMachines: 2,
      totalMachines: 10,
      // 负载分布
      loadRanges: [
        { key: 'high', label: '高负载(>80%)', percentage: 30 },
        { key: 'medium', label: '中负载(50%-80%)', percentage: 45 },
        { key: 'low', label: '低负载(<50%)', percentage: 25 }
      ],
      // 状态统计
      statusCounts: {
        running: 7,
        idle: 2,
        maintenance: 1,
        fault: 0
      },
      // 负载预警
      loadAlerts: [
        {
          id: 1,
          title: '数控车床A负载过高',
          description: '当前负载率95%，建议转移部分任务',
          type: 'warning'
        },
        {
          id: 2,
          title: '铣床B即将达到饱和',
          description: '当前负载率85%，请注意监控',
          type: 'warning'
        }
      ],
      // 对话框状态
      assignDialogVisible: false,
      detailDialogVisible: false,
      selectedMachine: {},
      detailActiveTab: '0',
      // 任务分配
      availableTasks: [],
      selectedTasks: []
    }
  },
  created() {
    this.loadData()
    this.loadAvailableTasks()
  },
  methods: {
    // 加载数据
    loadData() {
      // 模拟API调用
      setTimeout(() => {
        this.machinesData = this.getMockMachinesData()
        this.total = this.machinesData.length
      }, 300)
    },

    // 获取模拟设备数据
    getMockMachinesData() {
      return [
        {
          id: 1,
          machineCode: 'MC001',
          machineName: '数控车床A',
          machineType: '车床',
          workshopId: 1,
          workshopName: '1号车间',
          status: 'running',
          loadRate: 95,
          taskCount: 8,
          availableTime: 2,
          capacity: 100,
          manager: '张三',
          usageYears: 3,
          currentTasks: [
            { taskCode: 'TSK001', productName: '产品A', startTime: '2023-07-15 08:00', endTime: '2023-07-15 12:00', progress: 100 },
            { taskCode: 'TSK002', productName: '产品B', startTime: '2023-07-15 13:00', endTime: '2023-07-15 17:00', progress: 80 }
          ]
        },
        {
          id: 2,
          machineCode: 'MC002',
          machineName: '数控车床B',
          machineType: '车床',
          workshopId: 1,
          workshopName: '1号车间',
          status: 'running',
          loadRate: 75,
          taskCount: 5,
          availableTime: 8,
          capacity: 100,
          manager: '张三',
          usageYears: 2,
          currentTasks: []
        },
        {
          id: 3,
          machineCode: 'MC003',
          machineName: '铣床A',
          machineType: '铣床',
          workshopId: 2,
          workshopName: '2号车间',
          status: 'running',
          loadRate: 65,
          taskCount: 4,
          availableTime: 12,
          capacity: 80,
          manager: '李四',
          usageYears: 4,
          currentTasks: []
        },
        {
          id: 4,
          machineCode: 'MC004',
          machineName: '铣床B',
          machineType: '铣床',
          workshopId: 2,
          workshopName: '2号车间',
          status: 'running',
          loadRate: 85,
          taskCount: 6,
          availableTime: 4,
          capacity: 80,
          manager: '李四',
          usageYears: 3,
          currentTasks: []
        },
        {
          id: 5,
          machineCode: 'MC005',
          machineName: '钻床A',
          machineType: '钻床',
          workshopId: 3,
          workshopName: '3号车间',
          status: 'idle',
          loadRate: 30,
          taskCount: 2,
          availableTime: 20,
          capacity: 60,
          manager: '王五',
          usageYears: 1,
          currentTasks: []
        },
        {
          id: 6,
          machineCode: 'MC006',
          machineName: '磨床A',
          machineType: '磨床',
          workshopId: 3,
          workshopName: '3号车间',
          status: 'maintenance',
          loadRate: 0,
          taskCount: 0,
          availableTime: 0,
          capacity: 50,
          manager: '王五',
          usageYears: 5,
          currentTasks: []
        }
      ]
    },

    // 加载可用任务
    loadAvailableTasks() {
      this.availableTasks = [
        { id: 1, taskCode: 'TSK010', productName: '产品C', requiredTime: 4, priority: 'high', deadline: '2023-07-20' },
        { id: 2, taskCode: 'TSK011', productName: '产品D', requiredTime: 6, priority: 'medium', deadline: '2023-07-22' },
        { id: 3, taskCode: 'TSK012', productName: '产品E', requiredTime: 3, priority: 'low', deadline: '2023-07-25' },
        { id: 4, taskCode: 'TSK013', productName: '产品F', requiredTime: 8, priority: 'urgent', deadline: '2023-07-18' }
      ]
    },

    // 查询
    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    // 重置
    handleReset() {
      this.searchForm = {
        workshopId: '',
        machineType: '',
        dateRange: []
      }
      this.loadData()
    },

    // 负载均衡
    handleLoadBalance() {
      this.$confirm('确定要进行负载均衡吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟均衡操作
        setTimeout(() => {
          this.$message({ type: 'success', message: '负载均衡完成' })
          this.loadData()
        }, 800)
      }).catch(() => {
        // 取消操作
      })
    },

    // 导出报表
    handleExport() {
      this.$message({ type: 'success', message: '报表导出成功' })
    },

    // 设备详情
    handleMachineDetail(machine) {
      this.selectedMachine = { ...machine }
      this.detailDialogVisible = true
    },

    // 任务分配
    handleTaskAssign(machine) {
      this.selectedMachine = { ...machine }
      this.selectedTasks = []
      this.assignDialogVisible = true
    },

    // 确认分配
    handleConfirmAssign() {
      if (this.selectedTasks.length === 0) {
        this.$message.warning('请选择要分配的任务')
        return
      }
      this.$confirm(`确定要将选中的 ${this.selectedTasks.length} 个任务分配给 ${this.selectedMachine.machineName} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟分配操作
        this.$message({ type: 'success', message: '任务分配成功' })
        this.assignDialogVisible = false
        this.loadData()
      }).catch(() => {
        // 取消操作
      })
    },

    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },

    // 处理任务选择变化
    handleTaskSelectionChange(selection) {
      this.selectedTasks = selection
    },

    // 处理页码变化
    handleCurrentChange(val) {
      this.currentPage = val
      this.loadData()
    },

    // 处理每页条数变化
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.loadData()
    },

    // 关闭分配对话框
    handleAssignDialogClose() {
      this.assignDialogVisible = false
    },

    // 关闭详情对话框
    handleDetailDialogClose() {
      this.detailDialogVisible = false
    },

    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'running': '运行中',
        'idle': '空闲',
        'maintenance': '维护中',
        'fault': '故障'
      }
      return statusMap[status] || status
    },

    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        'running': 'success',
        'idle': 'info',
        'maintenance': 'warning',
        'fault': 'danger'
      }
      return typeMap[status] || 'default'
    },

    // 获取负载状态
    getLoadStatus(loadRate) {
      if (loadRate >= 90) return 'exception'
      if (loadRate >= 70) return 'warning'
      return ''
    },

    // 获取优先级文本
    getPriorityText(priority) {
      const priorityMap = {
        'low': '低',
        'medium': '中',
        'high': '高',
        'urgent': '紧急'
      }
      return priorityMap[priority] || priority
    },

    // 获取优先级类型
    getPriorityType(priority) {
      const typeMap = {
        'low': 'info',
        'medium': 'primary',
        'high': 'warning',
        'urgent': 'danger'
      }
      return typeMap[priority] || 'default'
    },

    // 百分比格式化
    percentageFormat(percentage) {
      return `${percentage}%`
    }
  }
}
</script>

<style scoped>
.machine-loading {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 概览卡片样式 */
.overview-card {
  margin-bottom: 20px;
}

.overview-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-value.high-load {
  color: #f56c6c;
}

.stat-value.low-load {
  color: #67c23a;
}

/* 负载分布样式 */
.load-distribution {
  margin-top: 20px;
}

.load-distribution h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #303133;
}

.distribution-bar {
  height: 20px;
  background-color: #f0f2f5;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.distribution-segment {
  height: 100%;
  float: left;
}

.distribution-segment.high {
  background-color: #f56c6c;
}

.distribution-segment.medium {
  background-color: #e6a23c;
}

.distribution-segment.low {
  background-color: #67c23a;
}

.distribution-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #606266;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 5px;
}

.legend-color.high {
  background-color: #f56c6c;
}

.legend-color.medium {
  background-color: #e6a23c;
}

.legend-color.low {
  background-color: #67c23a;
}

/* 状态卡片样式 */
.status-card {
  margin-bottom: 20px;
}

.status-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-circle.running {
  background-color: #67c23a;
}

.status-circle.idle {
  background-color: #409eff;
}

.status-circle.maintenance {
  background-color: #e6a23c;
}

.status-circle.fault {
  background-color: #f56c6c;
}

.status-info {
  display: flex;
  justify-content: space-between;
  flex: 1;
}

.status-label {
  font-size: 14px;
  color: #303133;
}

.status-count {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

/* 负载详情卡片样式 */
.load-detail-card {
  margin-bottom: 20px;
}

.list-view {
  margin-top: 10px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.chart-view {
  padding: 20px;
}

.chart-placeholder {
  height: 300px;
  background-color: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 预警卡片样式 */
.warning-card {
  margin-bottom: 20px;
}

/* 对话框样式 */
.dialog-section {
  margin-bottom: 20px;
}

.dialog-section h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #303133;
  border-left: 3px solid #409eff;
  padding-left: 10px;
}

.machine-detail {
  padding: 10px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>