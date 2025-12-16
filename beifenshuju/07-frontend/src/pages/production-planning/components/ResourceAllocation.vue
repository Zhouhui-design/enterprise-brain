<template>
  <div class="resource-allocation">
    <el-card shadow="never">
      <div slot="header" class="header">
        <span>资源分配</span>
        <div class="header-actions">
          <el-select v-model="resourceType" placeholder="资源类型" size="small" @change="filterResources">
            <el-option label="全部" value="all"></el-option>
            <el-option label="设备" value="equipment"></el-option>
            <el-option label="人员" value="personnel"></el-option>
            <el-option label="物料" value="material"></el-option>
          </el-select>
          <el-button type="primary" size="small" @click="optimizeAllocation">
            <i class="el-icon-refresh-left"></i> 优化分配
          </el-button>
        </div>
      </div>
      
      <!-- 资源概览 -->
      <div class="resource-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="overview-card">
              <div class="overview-title">已分配资源</div>
              <div class="overview-value">{{ allocatedCount }}</div>
              <div class="overview-percentage">
                <el-progress :percentage="allocatedPercentage" :format="percentageFormat"></el-progress>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-card">
              <div class="overview-title">可用资源</div>
              <div class="overview-value">{{ availableCount }}</div>
              <div class="overview-percentage">
                <el-progress :percentage="availablePercentage" :format="percentageFormat"></el-progress>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-card">
              <div class="overview-title">资源冲突</div>
              <div class="overview-value conflict">{{ conflictCount }}</div>
              <div class="overview-percentage">
                <el-progress :percentage="conflictPercentage" :format="percentageFormat" status="exception"></el-progress>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-card">
              <div class="overview-title">资源利用率</div>
              <div class="overview-value">{{ utilizationRate }}%</div>
              <div class="overview-percentage">
                <el-progress :percentage="utilizationRate" :format="percentageFormat" :status="getUtilizationStatus()"></el-progress>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 资源分配表格 -->
      <div class="allocation-table">
        <el-table 
          :data="filteredResources" 
          style="width: 100%" 
          border
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="resourceCode" label="资源编号" width="120"></el-table-column>
          <el-table-column prop="resourceName" label="资源名称" width="180"></el-table-column>
          <el-table-column prop="resourceType" label="资源类型" width="100">
            <template slot-scope="scope">
              <el-tag :type="getResourceTypeTag(scope.row.resourceType)">{{ scope.row.resourceType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="allocationStatus" label="分配状态" width="120">
            <template slot-scope="scope">
              <el-tag :type="getAllocationStatusType(scope.row.allocationStatus)">{{ scope.row.allocationStatus }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="allocatedTasks" label="已分配任务" width="150">
            <template slot-scope="scope">
              <div class="task-tags">
                <el-tag 
                  v-for="task in scope.row.allocatedTasks.slice(0, 3)" 
                  :key="task.taskId"
                  size="mini"
                  :type="getTaskPriorityType(task.priority)"
                  class="task-tag"
                >
                  {{ task.taskName }}
                </el-tag>
                <span v-if="scope.row.allocatedTasks.length > 3" class="more-tasks">
                  +{{ scope.row.allocatedTasks.length - 3 }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="allocationRate" label="分配率" width="120">
            <template slot-scope="scope">
              <el-progress :percentage="scope.row.allocationRate" :format="percentageFormat"></el-progress>
            </template>
          </el-table-column>
          <el-table-column prop="efficiency" label="效率" width="100">
            <template slot-scope="scope">
              <span class="efficiency-value">{{ scope.row.efficiency }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template slot-scope="scope">
              <el-button 
                type="primary" 
                size="mini" 
                @click="handleViewDetails(scope.row)"
                :disabled="scope.row.allocatedTasks.length === 0"
              >
                查看详情
              </el-button>
              <el-button 
                type="danger" 
                size="mini" 
                @click="handleReleaseResource(scope.row)"
                :disabled="scope.row.allocationStatus === '空闲'"
              >
                释放资源
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, jumper, ->, total"
          :total="filteredResources.length"
          :page-size="10"
          @current-change="handlePageChange"
        ></el-pagination>
      </div>
    </el-card>
    
    <!-- 资源详情对话框 -->
    <el-dialog
      title="资源分配详情"
      :visible.sync="detailDialogVisible"
      width="600px"
      @close="handleDialogClose"
    >
      <div class="resource-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="资源编号">{{ selectedResource.resourceCode }}</el-descriptions-item>
          <el-descriptions-item label="资源名称">{{ selectedResource.resourceName }}</el-descriptions-item>
          <el-descriptions-item label="资源类型">{{ selectedResource.resourceType }}</el-descriptions-item>
          <el-descriptions-item label="分配状态">{{ selectedResource.allocationStatus }}</el-descriptions-item>
          <el-descriptions-item label="分配率" span="2">
            <el-progress :percentage="selectedResource.allocationRate" :format="percentageFormat"></el-progress>
          </el-descriptions-item>
          <el-descriptions-item label="效率">{{ selectedResource.efficiency }}%</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedResource.manager || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="allocated-tasks-section">
          <h4>已分配任务</h4>
          <el-table :data="selectedResource.allocatedTasks" style="width: 100%" border size="small">
            <el-table-column prop="taskId" label="任务ID" width="100"></el-table-column>
            <el-table-column prop="taskName" label="任务名称" width="180"></el-table-column>
            <el-table-column prop="priority" label="优先级" width="100">
              <template slot-scope="scope">
                <el-tag :type="getTaskPriorityType(scope.row.priority)">{{ scope.row.priority }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startDate" label="开始日期"></el-table-column>
            <el-table-column prop="endDate" label="结束日期"></el-table-column>
          </el-table>
        </div>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleDialogClose">关闭</el-button>
        <el-button type="primary" @click="handleReallocate">重新分配</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ResourceAllocation',
  props: {
    planId: {
      type: String,
      default: ''
    },
    dateRange: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      resourceType: 'all',
      resources: [
        {
          id: 1,
          resourceCode: 'EQ001',
          resourceName: '数控车床A',
          resourceType: '设备',
          allocationStatus: '已分配',
          allocationRate: 85,
          efficiency: 92,
          manager: '张三',
          allocatedTasks: [
            { taskId: 'T001', taskName: '产品A加工', priority: '高', startDate: '2023-07-15', endDate: '2023-07-20' },
            { taskId: 'T002', taskName: '产品B加工', priority: '中', startDate: '2023-07-21', endDate: '2023-07-25' }
          ]
        },
        {
          id: 2,
          resourceCode: 'EQ002',
          resourceName: '数控车床B',
          resourceType: '设备',
          allocationStatus: '已分配',
          allocationRate: 75,
          efficiency: 88,
          manager: '张三',
          allocatedTasks: [
            { taskId: 'T003', taskName: '产品C加工', priority: '中', startDate: '2023-07-18', endDate: '2023-07-24' }
          ]
        },
        {
          id: 3,
          resourceCode: 'EQ003',
          resourceName: '铣床A',
          resourceType: '设备',
          allocationStatus: '空闲',
          allocationRate: 0,
          efficiency: 0,
          manager: '李四',
          allocatedTasks: []
        },
        {
          id: 4,
          resourceCode: 'P001',
          resourceName: '生产班组1',
          resourceType: '人员',
          allocationStatus: '已分配',
          allocationRate: 95,
          efficiency: 90,
          manager: '王五',
          allocatedTasks: [
            { taskId: 'T004', taskName: '产品D装配', priority: '高', startDate: '2023-07-16', endDate: '2023-07-22' },
            { taskId: 'T005', taskName: '产品E装配', priority: '低', startDate: '2023-07-17', endDate: '2023-07-21' },
            { taskId: 'T006', taskName: '产品F装配', priority: '中', startDate: '2023-07-23', endDate: '2023-07-28' },
            { taskId: 'T007', taskName: '产品G装配', priority: '高', startDate: '2023-07-20', endDate: '2023-07-25' }
          ]
        },
        {
          id: 5,
          resourceCode: 'P002',
          resourceName: '生产班组2',
          resourceType: '人员',
          allocationStatus: '冲突',
          allocationRate: 120,
          efficiency: 85,
          manager: '赵六',
          allocatedTasks: [
            { taskId: 'T008', taskName: '产品H调试', priority: '高', startDate: '2023-07-19', endDate: '2023-07-25' },
            { taskId: 'T009', taskName: '产品I调试', priority: '高', startDate: '2023-07-20', endDate: '2023-07-26' }
          ]
        },
        {
          id: 6,
          resourceCode: 'M001',
          resourceName: '钢材A',
          resourceType: '物料',
          allocationStatus: '已分配',
          allocationRate: 60,
          efficiency: 0,
          manager: '',
          allocatedTasks: [
            { taskId: 'T010', taskName: '产品J制造', priority: '中', startDate: '2023-07-15', endDate: '2023-07-30' }
          ]
        },
        {
          id: 7,
          resourceCode: 'M002',
          resourceName: '铝材B',
          resourceType: '物料',
          allocationStatus: '空闲',
          allocationRate: 0,
          efficiency: 0,
          manager: '',
          allocatedTasks: []
        },
        {
          id: 8,
          resourceCode: 'EQ004',
          resourceName: '钻床B',
          resourceType: '设备',
          allocationStatus: '冲突',
          allocationRate: 110,
          efficiency: 80,
          manager: '李四',
          allocatedTasks: [
            { taskId: 'T011', taskName: '产品K钻孔', priority: '中', startDate: '2023-07-18', endDate: '2023-07-24' },
            { taskId: 'T012', taskName: '产品L钻孔', priority: '高', startDate: '2023-07-20', endDate: '2023-07-22' }
          ]
        }
      ],
      selectedResources: [],
      detailDialogVisible: false,
      selectedResource: {}
    }
  },
  computed: {
    // 过滤后的资源列表
    filteredResources() {
      if (this.resourceType === 'all') {
        return this.resources
      }
      
      const typeMap = {
        equipment: '设备',
        personnel: '人员',
        material: '物料'
      }
      
      return this.resources.filter(resource => resource.resourceType === typeMap[this.resourceType])
    },
    
    // 已分配资源数量
    allocatedCount() {
      return this.resources.filter(resource => resource.allocationStatus === '已分配').length
    },
    
    // 可用资源数量
    availableCount() {
      return this.resources.filter(resource => resource.allocationStatus === '空闲').length
    },
    
    // 资源冲突数量
    conflictCount() {
      return this.resources.filter(resource => resource.allocationStatus === '冲突').length
    },
    
    // 已分配资源百分比
    allocatedPercentage() {
      if (this.resources.length === 0) return 0
      return Math.round((this.allocatedCount / this.resources.length) * 100)
    },
    
    // 可用资源百分比
    availablePercentage() {
      if (this.resources.length === 0) return 0
      return Math.round((this.availableCount / this.resources.length) * 100)
    },
    
    // 冲突资源百分比
    conflictPercentage() {
      if (this.resources.length === 0) return 0
      return Math.round((this.conflictCount / this.resources.length) * 100)
    },
    
    // 平均资源利用率
    utilizationRate() {
      if (this.resources.length === 0) return 0
      const totalRate = this.resources.reduce((sum, resource) => sum + resource.allocationRate, 0)
      return Math.round(totalRate / this.resources.length)
    }
  },
  methods: {
    // 过滤资源
    filterResources() {
      this.$emit('resources-filtered', this.filteredResources)
    },
    
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedResources = selection
    },
    
    // 处理页面变化
    handlePageChange(currentPage) {
      this.$emit('page-changed', currentPage)
    },
    
    // 查看资源详情
    handleViewDetails(resource) {
      this.selectedResource = { ...resource }
      this.detailDialogVisible = true
    },
    
    // 关闭对话框
    handleDialogClose() {
      this.selectedResource = {}
      this.detailDialogVisible = false
    },
    
    // 释放资源
    handleReleaseResource(resource) {
      this.$confirm('确定要释放此资源的所有分配吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟释放资源
        const index = this.resources.findIndex(r => r.id === resource.id)
        if (index !== -1) {
          this.resources[index].allocationStatus = '空闲'
          this.resources[index].allocationRate = 0
          this.resources[index].allocatedTasks = []
          this.$message({ type: 'success', message: '资源释放成功' })
          this.$emit('resource-released', resource.id)
        }
      }).catch(() => {
        // 取消操作
      })
    },
    
    // 重新分配资源
    handleReallocate() {
      this.$emit('reallocate-resource', this.selectedResource.id)
      this.$message({ type: 'success', message: '重新分配成功' })
      this.handleDialogClose()
    },
    
    // 优化资源分配
    optimizeAllocation() {
      this.$emit('optimize-allocation')
      this.$message({ type: 'success', message: '资源分配优化完成' })
    },
    
    // 获取资源类型标签
    getResourceTypeTag(type) {
      const tagMap = {
        '设备': 'primary',
        '人员': 'success',
        '物料': 'info'
      }
      return tagMap[type] || 'default'
    },
    
    // 获取分配状态标签类型
    getAllocationStatusType(status) {
      const tagMap = {
        '已分配': 'success',
        '空闲': 'info',
        '冲突': 'danger'
      }
      return tagMap[status] || 'default'
    },
    
    // 获取任务优先级标签类型
    getTaskPriorityType(priority) {
      const tagMap = {
        '高': 'danger',
        '中': 'warning',
        '低': 'info'
      }
      return tagMap[priority] || 'default'
    },
    
    // 获取利用率状态
    getUtilizationStatus() {
      if (this.utilizationRate >= 90) return 'exception'
      if (this.utilizationRate >= 70) return 'warning'
      return ''
    },
    
    // 百分比格式
    percentageFormat(percentage) {
      return `${percentage}%`
    },
    
    // 加载资源数据
    loadResources() {
      // 模拟API调用
      this.$emit('resources-loading', true)
      setTimeout(() => {
        // 这里可以根据planId和dateRange过滤数据
        this.$emit('resources-loading', false)
        this.$emit('resources-loaded', this.resources)
      }, 500)
    }
  },
  watch: {
    planId: {
      handler() {
        this.loadResources()
      },
      immediate: false
    },
    dateRange: {
      handler() {
        this.loadResources()
      },
      deep: true,
      immediate: false
    }
  },
  mounted() {
    this.loadResources()
  }
}
</script>

<style scoped>
.resource-allocation {
  padding: 10px 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 资源概览样式 */
.resource-overview {
  margin: 20px 0;
}

.overview-card {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  transition: all 0.3s;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.overview-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.overview-value.conflict {
  color: #f56c6c;
}

.overview-percentage {
  margin-top: 5px;
}

/* 资源分配表格样式 */
.allocation-table {
  margin-top: 20px;
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.task-tag {
  margin-bottom: 4px;
}

.more-tasks {
  font-size: 12px;
  color: #909399;
}

.efficiency-value {
  font-weight: 500;
  color: #67c23a;
}

/* 分页样式 */
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 资源详情对话框样式 */
.resource-detail {
  padding: 10px 0;
}

.allocated-tasks-section {
  margin-top: 20px;
}

.allocated-tasks-section h4 {
  margin-bottom: 10px;
  color: #303133;
}

.dialog-footer {
  text-align: right;
}
</style>