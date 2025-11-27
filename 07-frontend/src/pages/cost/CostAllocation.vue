<template>
  <div class="cost-allocation-container">
    <div class="header">
      <h2>成本分配管理</h2>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="search-filters">
          <el-select
            v-model="sourceCenterId"
            placeholder="选择源成本中心"
            class="filter-select"
          >
            <el-option label="全部源中心" value="" />
            <el-option v-for="center in costCenters" :key="center.id" :label="center.name" :value="center.id" />
          </el-select>
          <el-select
            v-model="targetCenterId"
            placeholder="选择目标成本中心"
            class="filter-select"
          >
            <el-option label="全部目标中心" value="" />
            <el-option v-for="center in costCenters" :key="center.id" :label="center.name" :value="center.id" />
          </el-select>
          <el-date-picker
            v-model="allocationDate"
            type="month"
            placeholder="选择分配月份"
            class="date-picker"
          />
          <el-button type="primary" @click="handleCreate" icon="el-icon-plus">新增分配</el-button>
        </div>
      </div>
      
      <div class="card-body">
        <el-table
          :data="paginatedAllocations"
          style="width: 100%"
          border
          stripe
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="源成本中心" width="180">
            <template v-slot="scope">
              {{ getCostCenterName(scope.row.sourceCenterId) }}
            </template>
          </el-table-column>
          <el-table-column label="目标成本中心" width="180">
            <template v-slot="scope">
              {{ getCostCenterName(scope.row.targetCenterId) }}
            </template>
          </el-table-column>
          <el-table-column label="成本项目" width="180">
            <template v-slot="scope">
              {{ getCostItemName(scope.row.costItemId) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="分配金额" width="120">
            <template v-slot="scope">
              ¥{{ scope.row.amount?.toLocaleString() || '0.00' }}
            </template>
          </el-table-column>
          <el-table-column prop="allocationDate" label="分配月份" width="120" />
          <el-table-column prop="allocationMethod" label="分配方法" width="120">
            <template v-slot="scope">
              {{ getAllocationMethodName(scope.row.allocationMethod) }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="分配说明" />
          <el-table-column prop="allocatedBy" label="分配人" width="100" />
          <el-table-column prop="allocatedAt" label="分配时间" width="180" />
          <el-table-column label="操作" width="150" fixed="right">
            <template v-slot="scope">
              <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div class="card-footer">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredAllocations.length"
        />
      </div>
    </div>
    
    <!-- 新增/编辑成本分配对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
    >
      <el-form
        ref="allocationForm"
        :model="allocationForm"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="源成本中心" prop="sourceCenterId">
          <el-select v-model="allocationForm.sourceCenterId" placeholder="请选择源成本中心">
            <el-option v-for="center in costCenters" :key="center.id" :label="center.name" :value="center.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标成本中心" prop="targetCenterId">
          <el-select v-model="allocationForm.targetCenterId" placeholder="请选择目标成本中心">
            <el-option v-for="center in costCenters" :key="center.id" :label="center.name" :value="center.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="成本项目" prop="costItemId">
          <el-select v-model="allocationForm.costItemId" placeholder="请选择成本项目">
            <el-option v-for="item in costItems" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配金额" prop="amount">
          <el-input-number
            v-model="allocationForm.amount"
            :min="0"
            :step="0.01"
            style="width: 100%"
            placeholder="请输入分配金额"
          />
        </el-form-item>
        <el-form-item label="分配月份" prop="allocationDate">
          <el-date-picker
            v-model="allocationForm.allocationDate"
            type="month"
            placeholder="选择分配月份"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分配方法" prop="allocationMethod">
          <el-select v-model="allocationForm.allocationMethod" placeholder="请选择分配方法">
            <el-option v-for="method in allocationMethods" :key="method.value" :label="method.label" :value="method.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配说明" prop="description">
          <el-input
            v-model="allocationForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分配说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CostAllocation',
  data() {
    return {
      // 模拟数据
      costCenters: [
        { id: 1, name: '财务部', code: 'CC001' },
        { id: 2, name: '生产部', code: 'CC002' },
        { id: 3, name: '销售部', code: 'CC003' },
        { id: 4, name: '研发部', code: 'CC004' },
        { id: 5, name: '行政部', code: 'CC005' }
      ],
      costItems: [
        { id: 1, name: '原材料A', code: 'CI001' },
        { id: 2, name: '生产人工', code: 'CI002' },
        { id: 3, name: '水电费', code: 'CI003' },
        { id: 4, name: '设备折旧', code: 'CI004' },
        { id: 5, name: '销售费用', code: 'CI005' }
      ],
      allocations: [
        {
          id: 1,
          sourceCenterId: 5,
          targetCenterId: 2,
          costItemId: 3,
          amount: 20000.00,
          allocationDate: '2023-06',
          allocationMethod: 'activity_based',
          description: '行政部门水电费按生产部门使用面积分配',
          allocatedBy: '张三',
          allocatedAt: '2023-06-10 10:30:00'
        },
        {
          id: 2,
          sourceCenterId: 5,
          targetCenterId: 3,
          costItemId: 3,
          amount: 10000.00,
          allocationDate: '2023-06',
          allocationMethod: 'activity_based',
          description: '行政部门水电费按销售部门使用面积分配',
          allocatedBy: '张三',
          allocatedAt: '2023-06-10 10:30:00'
        },
        {
          id: 3,
          sourceCenterId: 5,
          targetCenterId: 4,
          costItemId: 4,
          amount: 15000.00,
          allocationDate: '2023-06',
          allocationMethod: 'direct_allocation',
          description: '行政部门设备折旧直接分配给研发部门',
          allocatedBy: '张三',
          allocatedAt: '2023-06-10 10:35:00'
        }
      ],
      allocationMethods: [
        { label: '直接分配法', value: 'direct_allocation' },
        { label: '交互分配法', value: 'reciprocal_allocation' },
        { label: '代数分配法', value: 'algebraic_allocation' },
        { label: '作业成本法', value: 'activity_based' },
        { label: '比例分配法', value: 'ratio_allocation' }
      ],
      sourceCenterId: '',
      targetCenterId: '',
      allocationDate: '',
      dialogVisible: false,
      dialogTitle: '新增成本分配',
      editingId: null,
      currentPage: 1,
      pageSize: 10,
      allocationForm: {
        sourceCenterId: '',
        targetCenterId: '',
        costItemId: '',
        amount: 0,
        allocationDate: '',
        allocationMethod: '',
        description: '',
        allocatedBy: '当前用户',
        allocatedAt: ''
      },
      rules: {
        sourceCenterId: [
          { required: true, message: '请选择源成本中心', trigger: 'change' }
        ],
        targetCenterId: [
          { required: true, message: '请选择目标成本中心', trigger: 'change' },
          {
            validator: (rule, value, callback) => {
              if (value === this.allocationForm.sourceCenterId) {
                callback(new Error('源成本中心和目标成本中心不能相同'))
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ],
        costItemId: [
          { required: true, message: '请选择成本项目', trigger: 'change' }
        ],
        amount: [
          { required: true, message: '请输入分配金额', trigger: 'blur' },
          { type: 'number', min: 0.01, message: '分配金额必须大于0', trigger: 'blur' }
        ],
        allocationDate: [
          { required: true, message: '请选择分配月份', trigger: 'change' }
        ],
        allocationMethod: [
          { required: true, message: '请选择分配方法', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    filteredAllocations() {
      return this.allocations.filter(allocation => {
        const matchesSource = !this.sourceCenterId || allocation.sourceCenterId === Number(this.sourceCenterId)
        const matchesTarget = !this.targetCenterId || allocation.targetCenterId === Number(this.targetCenterId)
        const matchesDate = !this.allocationDate || allocation.allocationDate === this.formatDate(this.allocationDate)
        return matchesSource && matchesTarget && matchesDate
      })
    },
    paginatedAllocations() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredAllocations.slice(start, end)
    }
  },
  methods: {
    getCostCenterName(centerId) {
      const center = this.costCenters.find(c => c.id === centerId)
      return center ? center.name : '未知'
    },
    getCostItemName(itemId) {
      const item = this.costItems.find(i => i.id === itemId)
      return item ? item.name : '未知'
    },
    getAllocationMethodName(method) {
      const methodObj = this.allocationMethods.find(m => m.value === method)
      return methodObj ? methodObj.label : method
    },
    formatDate(date) {
      if (!date) return ''
      if (typeof date === 'string') return date
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      return `${year}-${month}`
    },
    handleCreate() {
      this.dialogTitle = '新增成本分配'
      this.editingId = null
      this.resetForm()
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.dialogTitle = '编辑成本分配'
      this.editingId = row.id
      // 深拷贝，避免直接修改原数据
      this.allocationForm = JSON.parse(JSON.stringify(row))
      // 将字符串日期转换为Date对象以便日期选择器使用
      if (this.allocationForm.allocationDate) {
        const [year, month] = this.allocationForm.allocationDate.split('-')
        this.allocationForm.allocationDate = new Date(year, month - 1)
      }
      this.dialogVisible = true
    },
    handleDelete(row) {
      this.$confirm(
        `确定要删除从「${this.getCostCenterName(row.sourceCenterId)}」到「${this.getCostCenterName(row.targetCenterId)}」的成本分配吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          const index = this.allocations.findIndex(allocation => allocation.id === row.id)
          if (index !== -1) {
            this.allocations.splice(index, 1)
          }
          this.$message.success('删除成功')
        })
        .catch(() => {
          // 取消删除
        })
    },
    handleSave() {
      this.$refs.allocationForm.validate(valid => {
        if (valid) {
          // 处理日期格式
          const formData = { ...this.allocationForm }
          if (formData.allocationDate) {
            formData.allocationDate = this.formatDate(formData.allocationDate)
          }
          
          if (this.editingId) {
            // 编辑模式
            const index = this.allocations.findIndex(allocation => allocation.id === this.editingId)
            if (index !== -1) {
              this.allocations[index] = { ...formData }
            }
            this.$message.success('编辑成功')
          } else {
            // 新增模式
            const newAllocation = {
              ...formData,
              id: Date.now(),
              allocatedAt: new Date().toLocaleString('zh-CN')
            }
            this.allocations.push(newAllocation)
            this.$message.success('新增成功')
          }
          this.dialogVisible = false
          this.resetForm()
        }
      })
    },
    resetForm() {
      this.allocationForm = {
        sourceCenterId: '',
        targetCenterId: '',
        costItemId: '',
        amount: 0,
        allocationDate: '',
        allocationMethod: '',
        description: '',
        allocatedBy: '当前用户',
        allocatedAt: ''
      }
      if (this.$refs.allocationForm) {
        this.$refs.allocationForm.resetFields()
      }
    }
  }
}
</script>

<style scoped>
.cost-allocation-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.card {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.search-filters {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-select {
  width: 180px;
}

.date-picker {
  width: 200px;
}

.card-body {
  padding: 20px;
}

.card-footer {
  padding: 15px 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select,
  .date-picker,
  .search-input {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>