<template>
  <div class="plan-adjustment">
    <el-page-header :title="'计划调整'" :content="'调整和优化生产计划'" />
    
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="计划编号">
          <el-input v-model="searchForm.planCode" placeholder="请输入计划编号" clearable />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="计划状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="未开始" value="0" />
            <el-option label="进行中" value="1" />
            <el-option label="已完成" value="2" />
            <el-option label="已暂停" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <div class="plan-list">
        <el-table
          v-loading="loading"
          :data="adjustablePlans"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="planCode" label="计划编号" width="180" />
          <el-table-column prop="productName" label="产品名称" />
          <el-table-column prop="orderQuantity" label="计划数量" width="120" align="right">
            <template slot-scope="scope">{{ scope.row.orderQuantity.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="startDate" label="开始日期" width="150" />
          <el-table-column prop="endDate" label="结束日期" width="150" />
          <el-table-column prop="status" label="计划状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="statusType[scope.row.status]">{{ statusText[scope.row.status] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="80">
            <template slot-scope="scope">
              <el-tag :type="priorityType[scope.row.priority]">{{ priorityText[scope.row.priority] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="workshopName" label="生产车间" width="120" />
          <el-table-column label="操作" width="200" fixed="right">
            <template slot-scope="scope">
              <el-button size="small" @click="handleAdjustPlan(scope.row)">调整计划</el-button>
              <el-button size="small" type="warning" @click="handleSuspendPlan(scope.row)" v-if="scope.row.status === '1'">暂停</el-button>
              <el-button size="small" type="success" @click="handleResumePlan(scope.row)" v-if="scope.row.status === '3'">恢复</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination">
          <el-pagination
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            v-model="currentPage"
            v-model:page-size="pageSize"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
    
    <!-- 计划调整对话框 -->
    <el-dialog
      title="调整生产计划"
      :visible.sync="adjustDialogVisible"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-form ref="adjustForm" :model="adjustForm" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划编号">
              <el-input v-model="adjustForm.planCode" disabled />
            </el-form-item>
            <el-form-item label="产品名称">
              <el-input v-model="adjustForm.productName" disabled />
            </el-form-item>
            <el-form-item label="调整计划数量" prop="orderQuantity">
              <el-input-number v-model="adjustForm.orderQuantity" :min="1" :step="1" />
            </el-form-item>
            <el-form-item label="调整开始日期" prop="startDate">
              <el-date-picker v-model="adjustForm.startDate" type="date" placeholder="选择开始日期" value-format="yyyy-MM-dd" />
            </el-form-item>
            <el-form-item label="调整结束日期" prop="endDate">
              <el-date-picker v-model="adjustForm.endDate" type="date" placeholder="选择结束日期" value-format="yyyy-MM-dd" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="调整优先级" prop="priority">
              <el-select v-model="adjustForm.priority" placeholder="请选择优先级">
                <el-option label="低" value="0" />
                <el-option label="中" value="1" />
                <el-option label="高" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="调整生产车间" prop="workshopId">
              <el-select v-model="adjustForm.workshopId" placeholder="请选择生产车间">
                <el-option v-for="workshop in workshops" :key="workshop.id" :label="workshop.name" :value="workshop.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="调整生产线" prop="productionLineId">
              <el-select v-model="adjustForm.productionLineId" placeholder="请选择生产线">
                <el-option v-for="line in filteredProductionLines" :key="line.id" :label="line.name" :value="line.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="调整原因" prop="reason">
              <el-input v-model="adjustForm.reason" type="textarea" rows="4" placeholder="请输入调整原因" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 调整影响分析 -->
        <div class="impact-analysis">
          <h4>调整影响分析</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="物料需求变化">需要重新计算物料需求，可能导致物料短缺</el-descriptions-item>
            <el-descriptions-item label="产能影响">可能占用其他计划的产能资源</el-descriptions-item>
            <el-descriptions-item label="交付时间">可能影响产品交付时间</el-descriptions-item>
            <el-descriptions-item label="成本影响">调整可能导致成本增加约5%</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAdjust">确认调整</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'PlanAdjustment',
  data() {
    return {
      loading: false,
      searchForm: {
        planCode: '',
        productName: '',
        status: ''
      },
      adjustablePlans: [],
      selectedPlans: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      statusText: {
        0: '未开始',
        1: '进行中',
        2: '已完成',
        3: '已暂停'
      },
      statusType: {
        0: 'info',
        1: 'primary',
        2: 'success',
        3: 'warning'
      },
      priorityText: {
        0: '低',
        1: '中',
        2: '高'
      },
      priorityType: {
        0: 'info',
        1: 'primary',
        2: 'warning'
      },
      workshops: [
        { id: '1', name: '总装车间' },
        { id: '2', name: '部件车间' },
        { id: '3', name: '测试车间' }
      ],
      productionLines: [
        { id: '1', name: '生产线A', workshopId: '1' },
        { id: '2', name: '生产线B', workshopId: '1' },
        { id: '3', name: '生产线C', workshopId: '2' },
        { id: '4', name: '生产线D', workshopId: '3' }
      ],
      adjustDialogVisible: false,
      adjustForm: {
        id: '',
        planCode: '',
        productName: '',
        orderQuantity: 1,
        startDate: '',
        endDate: '',
        priority: '1',
        workshopId: '',
        productionLineId: '',
        reason: ''
      },
      rules: {
        orderQuantity: [
          { required: true, message: '请输入计划数量', trigger: 'blur' }
        ],
        startDate: [
          { required: true, message: '请选择开始日期', trigger: 'change' }
        ],
        endDate: [
          { required: true, message: '请选择结束日期', trigger: 'change' }
        ],
        priority: [
          { required: true, message: '请选择优先级', trigger: 'change' }
        ],
        workshopId: [
          { required: true, message: '请选择生产车间', trigger: 'change' }
        ],
        productionLineId: [
          { required: true, message: '请选择生产线', trigger: 'change' }
        ],
        reason: [
          { required: true, message: '请输入调整原因', trigger: 'blur' }
        ]
      }
    };
  },
  computed: {
    filteredProductionLines() {
      if (!this.adjustForm.workshopId) {
        return [];
      }
      return this.productionLines.filter(line => line.workshopId === this.adjustForm.workshopId);
    }
  },
  mounted() {
    this.fetchAdjustablePlans();
  },
  methods: {
    fetchAdjustablePlans() {
      this.loading = true;
      // 模拟API调用
      setTimeout(() => {
        const mockData = this.generateMockData();
        this.adjustablePlans = mockData.data;
        this.total = mockData.total;
        this.loading = false;
      }, 500);
    },
    
    generateMockData() {
      const data = [];
      const statuses = ['0', '1', '3'];
      const priorities = ['0', '1', '2'];
      const products = ['智能手机A', '笔记本电脑B', '平板电脑C', '智能手表D'];
      const workshops = ['总装车间', '部件车间', '测试车间'];
      
      for (let i = (this.currentPage - 1) * this.pageSize; i < this.currentPage * this.pageSize && i < 50; i++) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + i);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 10);
        
        data.push({
          id: i + 1,
          planCode: `PP${new Date().getFullYear()}${String(i + 1).padStart(4, '0')}`,
          productName: products[i % products.length],
          orderQuantity: Math.floor(Math.random() * 1000) + 500,
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
          status: statuses[i % statuses.length],
          priority: priorities[i % priorities.length],
          workshopName: workshops[i % workshops.length]
        });
      }
      
      return {
        data,
        total: 50
      };
    },
    
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    handleSearch() {
      this.currentPage = 1;
      this.fetchAdjustablePlans();
    },
    
    handleReset() {
      this.searchForm = {
        planCode: '',
        productName: '',
        status: '',
      };
      this.currentPage = 1;
      this.fetchAdjustablePlans();
    },
    
    handleSelectionChange(val) {
      this.selectedPlans = val;
    },
    
    handleSizeChange(size) {
      this.pageSize = size;
      this.fetchAdjustablePlans();
    },
    
    handleCurrentChange(current) {
      this.currentPage = current;
      this.fetchAdjustablePlans();
    },
    
    handleAdjustPlan(plan) {
      // 填充调整表单数据
      this.adjustForm = {
        id: plan.id,
        planCode: plan.planCode,
        productName: plan.productName,
        orderQuantity: plan.orderQuantity,
        startDate: plan.startDate,
        endDate: plan.endDate,
        priority: plan.priority,
        workshopId: this.workshops.find(w => w.name === plan.workshopName)?.id || '',
        productionLineId: '',
        reason: ''
      };
      this.adjustDialogVisible = true;
    },
    
    handleConfirmAdjust() {
      this.$refs.adjustForm.validate((valid) => {
        if (valid) {
          // 模拟提交数据
          this.$confirm('确定要调整此生产计划吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            setTimeout(() => {
              this.$message({
                type: 'success',
                message: '计划调整成功'
              });
              this.adjustDialogVisible = false;
              this.fetchAdjustablePlans();
            }, 500);
          }).catch(() => {
            // 用户取消操作
          });
        }
      });
    },
    
    handleSuspendPlan(plan) {
      this.$confirm(`确定要暂停生产计划"${plan.planCode}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        setTimeout(() => {
          this.$message({
            type: 'success',
            message: '计划已暂停'
          });
          this.fetchAdjustablePlans();
        }, 500);
      }).catch(() => {
        // 用户取消操作
      });
    },
    
    handleResumePlan(plan) {
      this.$confirm(`确定要恢复生产计划"${plan.planCode}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        setTimeout(() => {
          this.$message({
            type: 'success',
            message: '计划已恢复'
          });
          this.fetchAdjustablePlans();
        }, 500);
      }).catch(() => {
        // 用户取消操作
      });
    }
  }
};
</script>

<style scoped>
.plan-adjustment {
  padding: 20px;
}

.search-form {
  margin-top: 10px;
  margin-bottom: 20px;
}

.plan-list {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.impact-analysis {
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.impact-analysis h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 14px;
  color: #333;
}

.dialog-footer {
  text-align: center;
}
</style>