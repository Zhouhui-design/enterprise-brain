<template>
  <div class="schedule-list">
    <div class="page-header">
      <h1>生产排程列表</h1>
      <el-button type="primary" @click="handleCreate">
        <i class="el-icon-plus"></i> 新建排程
      </el-button>
    </div>
    
    <!-- 搜索筛选区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="排程编号">
          <el-input v-model="searchForm.scheduleCode" placeholder="请输入排程编号"></el-input>
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称"></el-input>
        </el-form-item>
        <el-form-item label="计划周期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="排程状态">
          <el-select v-model="searchForm.status" placeholder="请选择排程状态">
            <el-option label="全部" value=""></el-option>
            <el-option label="未开始" value="not_started"></el-option>
            <el-option label="进行中" value="in_progress"></el-option>
            <el-option label="已完成" value="completed"></el-option>
            <el-option label="已暂停" value="paused"></el-option>
          </el-select>
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
    
    <!-- 数据表格 -->
    <el-card shadow="never" class="data-card">
      <div class="table-actions">
        <el-button type="danger" size="small" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
          <i class="el-icon-delete"></i> 批量删除
        </el-button>
        <el-button type="info" size="small" @click="handleExport">
          <i class="el-icon-download"></i> 导出数据
        </el-button>
      </div>
      
      <el-table 
        :data="schedulesData" 
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="scheduleCode" label="排程编号" width="180"></el-table-column>
        <el-table-column prop="productName" label="产品名称" width="150"></el-table-column>
        <el-table-column prop="quantity" label="计划数量" width="100" align="right"></el-table-column>
        <el-table-column prop="startDate" label="开始日期" width="120"></el-table-column>
        <el-table-column prop="endDate" label="结束日期" width="120"></el-table-column>
        <el-table-column prop="status" label="排程状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="完成进度" width="150">
          <template slot-scope="scope">
            <el-progress :percentage="scope.row.progress" :format="percentageFormat"></el-progress>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" width="100"></el-table-column>
        <el-table-column prop="createdTime" label="创建时间" width="150"></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button type="primary" size="small" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">
              删除
            </el-button>
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
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ScheduleList',
  data() {
    return {
      searchForm: {
        scheduleCode: '',
        productName: '',
        dateRange: [],
        status: ''
      },
      schedulesData: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      selectedRows: []
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    // 加载数据
    loadData() {
      // 模拟API调用
      setTimeout(() => {
        this.schedulesData = this.getMockData()
        this.total = this.schedulesData.length
      }, 300)
    },
    
    // 获取模拟数据
    getMockData() {
      return [
        {
          id: 1,
          scheduleCode: 'SC2023001',
          productName: '产品A',
          quantity: 500,
          startDate: '2023-07-15',
          endDate: '2023-07-25',
          status: 'in_progress',
          progress: 60,
          createdBy: '张三',
          createdTime: '2023-07-10 10:30:00'
        },
        {
          id: 2,
          scheduleCode: 'SC2023002',
          productName: '产品B',
          quantity: 300,
          startDate: '2023-07-18',
          endDate: '2023-07-28',
          status: 'in_progress',
          progress: 40,
          createdBy: '李四',
          createdTime: '2023-07-12 14:20:00'
        },
        {
          id: 3,
          scheduleCode: 'SC2023003',
          productName: '产品C',
          quantity: 200,
          startDate: '2023-07-01',
          endDate: '2023-07-10',
          status: 'completed',
          progress: 100,
          createdBy: '王五',
          createdTime: '2023-06-28 09:15:00'
        },
        {
          id: 4,
          scheduleCode: 'SC2023004',
          productName: '产品D',
          quantity: 400,
          startDate: '2023-07-20',
          endDate: '2023-07-30',
          status: 'not_started',
          progress: 0,
          createdBy: '赵六',
          createdTime: '2023-07-14 16:45:00'
        },
        {
          id: 5,
          scheduleCode: 'SC2023005',
          productName: '产品E',
          quantity: 150,
          startDate: '2023-07-12',
          endDate: '2023-07-22',
          status: 'paused',
          progress: 30,
          createdBy: '钱七',
          createdTime: '2023-07-08 11:20:00'
        }
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
        scheduleCode: '',
        productName: '',
        dateRange: [],
        status: ''
      }
      this.loadData()
    },
    
    // 创建排程
    handleCreate() {
      this.$router.push('/scheduling/create')
    },
    
    // 查看排程
    handleView(row) {
      this.$router.push(`/scheduling/board?id=${row.id}`)
    },
    
    // 编辑排程
    handleEdit(row) {
      this.$router.push(`/scheduling/create?id=${row.id}`)
    },
    
    // 删除排程
    handleDelete(row) {
      this.$confirm(`确定要删除排程「${row.scheduleCode}」吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        this.$message({ type: 'success', message: '删除成功' })
        this.loadData()
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 批量删除
    handleBatchDelete() {
      this.$confirm(`确定要删除选中的 ${this.selectedRows.length} 条排程吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量删除操作
        this.$message({ type: 'success', message: '删除成功' })
        this.loadData()
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 导出数据
    handleExport() {
      this.$message({ type: 'success', message: '数据导出成功' })
    },
    
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
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
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'not_started': '未开始',
        'in_progress': '进行中',
        'completed': '已完成',
        'paused': '已暂停'
      }
      return statusMap[status] || status
    },
    
    // 获取状态标签类型
    getStatusType(status) {
      const typeMap = {
        'not_started': 'info',
        'in_progress': 'success',
        'completed': 'primary',
        'paused': 'warning'
      }
      return typeMap[status] || 'default'
    },
    
    // 百分比格式化
    percentageFormat(percentage) {
      return `${percentage}%`
    }
  }
}
</script>

<style scoped>
.schedule-list {
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

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.data-card {
  overflow: hidden;
}

.table-actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
  gap: 10px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.el-progress {
  margin-top: 5px;
}
</style>