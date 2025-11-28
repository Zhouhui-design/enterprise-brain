<template>
  <div class="cost-center-container">
    <div class="header">
      <h2>成本中心管理</h2>
    </div>
    
    <div class="card">
      <div class="card-header">
        <el-input
          v-model="searchQuery"
          placeholder="搜索成本中心名称或编码"
          prefix-icon="el-icon-search"
          class="search-input"
        />
        <el-button type="primary" @click="handleCreate" icon="el-icon-plus">新增成本中心</el-button>
      </div>
      
      <div class="card-body">
        <el-table
          :data="filteredCostCenters"
          style="width: 100%"
          border
          stripe
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="code" label="成本中心编码" width="150" />
          <el-table-column prop="name" label="成本中心名称" width="200" />
          <el-table-column prop="type" label="中心类型" width="120">
            <template v-slot="scope">
              {{ getCenterTypeName(scope.row.type) }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="responsiblePerson" label="负责人" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template v-slot="scope">
              <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                {{ scope.row.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180" />
          <el-table-column label="操作" width="200" fixed="right">
            <template v-slot="scope">
              <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
              <el-button size="small" @click="toggleStatus(scope.row)">
                {{ scope.row.status === 'active' ? '禁用' : '启用' }}
              </el-button>
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
          :total="filteredCostCenters.length"
        />
      </div>
    </div>
    
    <!-- 新增/编辑成本中心对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
    >
      <el-form
        ref="costCenterForm"
        :model="costCenterForm"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="成本中心编码" prop="code">
          <el-input v-model="costCenterForm.code" placeholder="请输入成本中心编码" />
        </el-form-item>
        <el-form-item label="成本中心名称" prop="name">
          <el-input v-model="costCenterForm.name" placeholder="请输入成本中心名称" />
        </el-form-item>
        <el-form-item label="中心类型" prop="type">
          <el-select v-model="costCenterForm.type" placeholder="请选择中心类型">
            <el-option label="管理部门" value="management" />
            <el-option label="生产部门" value="production" />
            <el-option label="销售部门" value="sales" />
            <el-option label="研发部门" value="r&d" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="costCenterForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
        <el-form-item label="负责人" prop="responsiblePerson">
          <el-input v-model="costCenterForm.responsiblePerson" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="costCenterForm.status" active-value="active" inactive-value="inactive" />
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
  name: 'CostCenter',
  data() {
    return {
      costCenters: [
        {
          id: 1,
          code: 'CC001',
          name: '财务部',
          type: 'management',
          description: '企业财务管理部门',
          responsiblePerson: '张三',
          status: 'active',
          createdAt: '2023-01-15'
        },
        {
          id: 2,
          code: 'CC002',
          name: '生产部',
          type: 'production',
          description: '负责产品生产制造',
          responsiblePerson: '李四',
          status: 'active',
          createdAt: '2023-01-18'
        },
        {
          id: 3,
          code: 'CC003',
          name: '销售部',
          type: 'sales',
          description: '负责产品销售和市场拓展',
          responsiblePerson: '王五',
          status: 'active',
          createdAt: '2023-02-01'
        },
        {
          id: 4,
          code: 'CC004',
          name: '研发部',
          type: 'r&d',
          description: '负责产品研发和技术创新',
          responsiblePerson: '赵六',
          status: 'active',
          createdAt: '2023-02-10'
        },
        {
          id: 5,
          code: 'CC005',
          name: '行政部',
          type: 'management',
          description: '负责企业行政管理',
          responsiblePerson: '孙七',
          status: 'active',
          createdAt: '2023-03-05'
        }
      ],
      searchQuery: '',
      dialogVisible: false,
      dialogTitle: '新增成本中心',
      editingId: null,
      currentPage: 1,
      pageSize: 10,
      costCenterForm: {
        code: '',
        name: '',
        type: '',
        description: '',
        responsiblePerson: '',
        status: 'active'
      },
      rules: {
        code: [
          { required: true, message: '请输入成本中心编码', trigger: 'blur' },
          { min: 2, max: 20, message: '编码长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入成本中心名称', trigger: 'blur' },
          { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '请选择中心类型', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    filteredCostCenters() {
      if (!this.searchQuery) {
        return this.costCenters
      }
      const query = this.searchQuery.toLowerCase()
      return this.costCenters.filter(
        center => 
          center.name.toLowerCase().includes(query) || 
          center.code.toLowerCase().includes(query)
      )
    },
    paginatedCostCenters() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredCostCenters.slice(start, end)
    }
  },
  methods: {
    getCenterTypeName(type) {
      const typeMap = {
        'management': '管理部门',
        'production': '生产部门',
        'sales': '销售部门',
        'r&d': '研发部门',
        'other': '其他'
      }
      return typeMap[type] || type
    },
    handleCreate() {
      this.dialogTitle = '新增成本中心'
      this.editingId = null
      this.resetForm()
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.dialogTitle = '编辑成本中心'
      this.editingId = row.id
      this.costCenterForm = { ...row }
      this.dialogVisible = true
    },
    handleDelete(row) {
      this.$confirm(
        `确定要删除成本中心「${row.name}」吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          const index = this.costCenters.findIndex(center => center.id === row.id)
          if (index !== -1) {
            this.costCenters.splice(index, 1)
          }
          this.$message.success('删除成功')
        })
        .catch(() => {
          // 取消删除
        })
    },
    toggleStatus(row) {
      const newStatus = row.status === 'active' ? 'inactive' : 'active'
      const actionText = newStatus === 'active' ? '启用' : '禁用'
      
      this.$confirm(
        `确定要${actionText}成本中心「${row.name}」吗？`,
        `${actionText}确认`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      )
        .then(() => {
          const index = this.costCenters.findIndex(center => center.id === row.id)
          if (index !== -1) {
            this.costCenters[index].status = newStatus
          }
          this.$message.success(`${actionText}成功`)
        })
        .catch(() => {
          // 取消操作
        })
    },
    handleSave() {
      this.$refs.costCenterForm.validate(valid => {
        if (valid) {
          if (this.editingId) {
            // 编辑模式
            const index = this.costCenters.findIndex(center => center.id === this.editingId)
            if (index !== -1) {
              this.costCenters[index] = { ...this.costCenterForm }
            }
            this.$message.success('编辑成功')
          } else {
            // 新增模式
            const newCenter = {
              ...this.costCenterForm,
              id: Date.now(),
              createdAt: new Date().toISOString().split('T')[0]
            }
            this.costCenters.push(newCenter)
            this.$message.success('新增成功')
          }
          this.dialogVisible = false
          this.resetForm()
        }
      })
    },
    resetForm() {
      this.costCenterForm = {
        code: '',
        name: '',
        type: '',
        description: '',
        responsiblePerson: '',
        status: 'active'
      }
      if (this.$refs.costCenterForm) {
        this.$refs.costCenterForm.resetFields()
      }
    }
  }
}
</script>

<style scoped>
.cost-center-container {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-input {
  width: 300px;
  margin-right: 20px;
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
</style>