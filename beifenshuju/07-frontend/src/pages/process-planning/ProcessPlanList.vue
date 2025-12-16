<template>
  <div class="process-plan-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>工序计划管理</h2>
      <el-button type="primary" @click="handleCreate">创建工序计划</el-button>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="计划编号">
          <el-input v-model="searchForm.planCode" placeholder="请输入计划编号"></el-input>
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称"></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="全部" value=""></el-option>
            <el-option label="草稿" value="draft"></el-option>
            <el-option label="审核中" value="reviewing"></el-option>
            <el-option label="已审核" value="approved"></el-option>
            <el-option label="已发布" value="published"></el-option>
            <el-option label="已停用" value="disabled"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.createTime"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
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
        <span>工序计划列表</span>
        <div class="batch-actions">
          <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">批量删除</el-button>
          <el-button @click="handleExport">导出数据</el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="processPlanList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="planCode" label="计划编号" min-width="120"></el-table-column>
        <el-table-column prop="productName" label="产品名称" min-width="150"></el-table-column>
        <el-table-column prop="productCode" label="产品编码" min-width="120"></el-table-column>
        <el-table-column prop="version" label="版本号" width="80"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" format="yyyy-MM-dd HH:mm:ss"></el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180" format="yyyy-MM-dd HH:mm:ss"></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(scope.row)" :disabled="['published', 'disabled'].includes(scope.row.status)">
              编辑
            </el-button>
            <el-button size="small" type="success" @click="handlePublish(scope.row)" :disabled="scope.row.status !== 'approved'">
              发布
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">
              删除
            </el-button>
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
  </div>
</template>

<script>
export default {
  name: 'ProcessPlanList',
  data() {
    return {
      // 搜索表单
      searchForm: {
        planCode: '',
        productName: '',
        status: '',
        createTime: []
      },
      // 数据列表
      processPlanList: [],
      // 加载状态
      loading: false,
      // 选中的行
      selectedRows: [],
      // 分页信息
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    // 加载数据
    loadData() {
      this.loading = true
      // 模拟API调用
      setTimeout(() => {
        // 模拟数据
        const mockData = this.generateMockData()
        this.processPlanList = mockData.list
        this.pagination.total = mockData.total
        this.loading = false
      }, 500)
    },
    
    // 生成模拟数据
    generateMockData() {
      const statuses = ['draft', 'reviewing', 'approved', 'published', 'disabled']
      const products = [
        { name: '智能手表Pro', code: 'PRD001' },
        { name: '智能手机X20', code: 'PRD002' },
        { name: '平板电脑T10', code: 'PRD003' },
        { name: '蓝牙耳机B30', code: 'PRD004' },
        { name: '智能音箱S50', code: 'PRD005' }
      ]
      
      const list = []
      const start = (this.pagination.currentPage - 1) * this.pagination.pageSize
      const end = start + this.pagination.pageSize
      
      for (let i = start; i < end && i < 100; i++) {
        const product = products[i % products.length]
        list.push({
          id: `PP-${i + 1}`,
          planCode: `PP202400${i + 1}`,
          productName: product.name,
          productCode: product.code,
          version: `${Math.floor(i / 10) + 1}.0`,
          status: statuses[i % statuses.length],
          creator: `user${i % 5 + 1}`,
          createTime: `2024-0${(i % 9) + 1}-${(i % 28) + 1} 10:30:00`,
          updateTime: `2024-0${(i % 9) + 1}-${(i % 28) + 3} 15:45:00`
        })
      }
      
      return {
        list,
        total: 100
      }
    },
    
    // 获取状态对应的标签类型
    getStatusType(status) {
      const typeMap = {
        draft: 'info',
        reviewing: 'warning',
        approved: 'success',
        published: 'primary',
        disabled: 'danger'
      }
      return typeMap[status] || 'default'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        draft: '草稿',
        reviewing: '审核中',
        approved: '已审核',
        published: '已发布',
        disabled: '已停用'
      }
      return textMap[status] || status
    },
    
    // 搜索
    handleSearch() {
      this.pagination.currentPage = 1
      this.loadData()
    },
    
    // 重置
    handleReset() {
      this.searchForm = {
        planCode: '',
        productName: '',
        status: '',
        createTime: []
      }
      this.loadData()
    },
    
    // 创建
    handleCreate() {
      this.$router.push('/process-planning/create')
    },
    
    // 查看
    handleView(row) {
      this.$router.push(`/process-planning/view/${row.id}`)
    },
    
    // 编辑
    handleEdit(row) {
      this.$router.push(`/process-planning/edit/${row.id}`)
    },
    
    // 发布
    handlePublish(row) {
      this.$confirm('确认要发布该工序计划吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟发布操作
        setTimeout(() => {
          this.$message.success('发布成功')
          this.loadData()
        }, 500)
      }).catch(() => {
        this.$message.info('已取消发布')
      })
    },
    
    // 删除
    handleDelete(row) {
      this.$confirm(`确定要删除工序计划【${row.planCode}】吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        setTimeout(() => {
          this.$message.success('删除成功')
          this.loadData()
        }, 500)
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    // 批量删除
    handleBatchDelete() {
      this.$confirm(`确定要删除选中的 ${this.selectedRows.length} 个工序计划吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        setTimeout(() => {
          this.$message.success('删除成功')
          this.selectedRows = []
          this.loadData()
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
    }
  }
}
</script>

<style scoped>
.process-plan-list {
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
</style>