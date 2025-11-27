<template>
  <div class="cost-item-container">
    <div class="header">
      <h2>成本项目管理</h2>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="search-filters">
          <el-input
            v-model="searchQuery"
            placeholder="搜索成本项目名称或编码"
            prefix-icon="el-icon-search"
            class="search-input"
          />
          <el-select
            v-model="categoryFilter"
            placeholder="选择成本类别"
            class="filter-select"
          >
            <el-option label="全部类别" value="" />
            <el-option v-for="cat in costCategories" :key="cat.value" :label="cat.label" :value="cat.value" />
          </el-select>
          <el-button type="primary" @click="handleCreate" icon="el-icon-plus">新增成本项目</el-button>
        </div>
      </div>
      
      <div class="card-body">
        <el-table
          :data="paginatedCostItems"
          style="width: 100%"
          border
          stripe
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="code" label="成本项目编码" width="150" />
          <el-table-column prop="name" label="成本项目名称" width="200" />
          <el-table-column prop="category" label="成本类别" width="120">
            <template v-slot="scope">
              {{ getCategoryName(scope.row.category) }}
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="计量单位" width="100" />
          <el-table-column prop="budgetAmount" label="预算金额" width="120">
            <template v-slot="scope">
              ¥{{ scope.row.budgetAmount?.toLocaleString() || '0.00' }}
            </template>
          </el-table-column>
          <el-table-column prop="standardCost" label="标准成本" width="120">
            <template v-slot="scope">
              ¥{{ scope.row.standardCost?.toLocaleString() || '0.00' }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="status" label="状态" width="100">
            <template v-slot="scope">
              <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                {{ scope.row.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
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
          :total="filteredCostItems.length"
        />
      </div>
    </div>
    
    <!-- 新增/编辑成本项目对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
    >
      <el-form
        ref="costItemForm"
        :model="costItemForm"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="成本项目编码" prop="code">
          <el-input v-model="costItemForm.code" placeholder="请输入成本项目编码" />
        </el-form-item>
        <el-form-item label="成本项目名称" prop="name">
          <el-input v-model="costItemForm.name" placeholder="请输入成本项目名称" />
        </el-form-item>
        <el-form-item label="成本类别" prop="category">
          <el-select v-model="costItemForm.category" placeholder="请选择成本类别">
            <el-option v-for="cat in costCategories" :key="cat.value" :label="cat.label" :value="cat.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="计量单位" prop="unit">
          <el-input v-model="costItemForm.unit" placeholder="如：元、件、小时等" />
        </el-form-item>
        <el-form-item label="预算金额" prop="budgetAmount">
          <el-input-number
            v-model="costItemForm.budgetAmount"
            :min="0"
            :step="0.01"
            style="width: 100%"
            placeholder="请输入预算金额"
          />
        </el-form-item>
        <el-form-item label="标准成本" prop="standardCost">
          <el-input-number
            v-model="costItemForm.standardCost"
            :min="0"
            :step="0.01"
            style="width: 100%"
            placeholder="请输入标准成本"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="costItemForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="costItemForm.status" active-value="active" inactive-value="inactive" />
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
  name: 'CostItem',
  data() {
    return {
      costItems: [
        {
          id: 1,
          code: 'CI001',
          name: '原材料A',
          category: 'direct_material',
          unit: 'kg',
          budgetAmount: 100000.00,
          standardCost: 50.00,
          description: '产品X的主要原材料',
          status: 'active'
        },
        {
          id: 2,
          code: 'CI002',
          name: '生产人工',
          category: 'direct_labor',
          unit: '小时',
          budgetAmount: 200000.00,
          standardCost: 80.00,
          description: '生产线工人工资',
          status: 'active'
        },
        {
          id: 3,
          code: 'CI003',
          name: '水电费',
          category: 'overhead',
          unit: '元',
          budgetAmount: 50000.00,
          standardCost: 0,
          description: '生产车间水电费',
          status: 'active'
        },
        {
          id: 4,
          code: 'CI004',
          name: '设备折旧',
          category: 'overhead',
          unit: '元',
          budgetAmount: 30000.00,
          standardCost: 0,
          description: '生产设备折旧费用',
          status: 'active'
        },
        {
          id: 5,
          code: 'CI005',
          name: '销售费用',
          category: 'sales',
          unit: '元',
          budgetAmount: 80000.00,
          standardCost: 0,
          description: '产品销售推广费用',
          status: 'active'
        }
      ],
      costCategories: [
        { label: '直接材料', value: 'direct_material' },
        { label: '直接人工', value: 'direct_labor' },
        { label: '制造费用', value: 'overhead' },
        { label: '销售费用', value: 'sales' },
        { label: '管理费用', value: 'administration' },
        { label: '财务费用', value: 'financial' }
      ],
      searchQuery: '',
      categoryFilter: '',
      dialogVisible: false,
      dialogTitle: '新增成本项目',
      editingId: null,
      currentPage: 1,
      pageSize: 10,
      costItemForm: {
        code: '',
        name: '',
        category: '',
        unit: '',
        budgetAmount: 0,
        standardCost: 0,
        description: '',
        status: 'active'
      },
      rules: {
        code: [
          { required: true, message: '请输入成本项目编码', trigger: 'blur' },
          { min: 2, max: 20, message: '编码长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入成本项目名称', trigger: 'blur' },
          { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        category: [
          { required: true, message: '请选择成本类别', trigger: 'change' }
        ],
        unit: [
          { required: true, message: '请输入计量单位', trigger: 'blur' }
        ],
        budgetAmount: [
          { required: true, message: '请输入预算金额', trigger: 'blur' },
          { type: 'number', min: 0, message: '预算金额必须大于等于0', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    filteredCostItems() {
      return this.costItems.filter(item => {
        const matchesSearch = !this.searchQuery ||
          item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          item.code.toLowerCase().includes(this.searchQuery.toLowerCase())
        const matchesCategory = !this.categoryFilter || item.category === this.categoryFilter
        return matchesSearch && matchesCategory
      })
    },
    paginatedCostItems() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredCostItems.slice(start, end)
    }
  },
  methods: {
    getCategoryName(category) {
      const categoryMap = {}
      this.costCategories.forEach(cat => {
        categoryMap[cat.value] = cat.label
      })
      return categoryMap[category] || category
    },
    handleCreate() {
      this.dialogTitle = '新增成本项目'
      this.editingId = null
      this.resetForm()
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.dialogTitle = '编辑成本项目'
      this.editingId = row.id
      this.costItemForm = { ...row }
      this.dialogVisible = true
    },
    handleDelete(row) {
      this.$confirm(
        `确定要删除成本项目「${row.name}」吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          const index = this.costItems.findIndex(item => item.id === row.id)
          if (index !== -1) {
            this.costItems.splice(index, 1)
          }
          this.$message.success('删除成功')
        })
        .catch(() => {
          // 取消删除
        })
    },
    handleSave() {
      this.$refs.costItemForm.validate(valid => {
        if (valid) {
          if (this.editingId) {
            // 编辑模式
            const index = this.costItems.findIndex(item => item.id === this.editingId)
            if (index !== -1) {
              this.costItems[index] = { ...this.costItemForm }
            }
            this.$message.success('编辑成功')
          } else {
            // 新增模式
            const newItem = {
              ...this.costItemForm,
              id: Date.now()
            }
            this.costItems.push(newItem)
            this.$message.success('新增成功')
          }
          this.dialogVisible = false
          this.resetForm()
        }
      })
    },
    resetForm() {
      this.costItemForm = {
        code: '',
        name: '',
        category: '',
        unit: '',
        budgetAmount: 0,
        standardCost: 0,
        description: '',
        status: 'active'
      }
      if (this.$refs.costItemForm) {
        this.$refs.costItemForm.resetFields()
      }
    }
  }
}
</script>

<style scoped>
.cost-item-container {
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
}

.search-input {
  width: 300px;
}

.filter-select {
  width: 180px;
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