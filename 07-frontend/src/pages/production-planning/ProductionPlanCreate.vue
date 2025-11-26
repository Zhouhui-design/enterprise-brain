<template>
  <div class="production-plan-create">
    <el-page-header :title="'生产计划'" :content="isEditMode ? '编辑生产计划' : '创建生产计划'" />
    
    <el-card>
      <el-form ref="planForm" :model="planForm" :rules="rules" label-width="120px" class="plan-form">
        <!-- 基本信息 -->
        <div class="form-section">
          <h3>基本信息</h3>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="计划编号" prop="planCode">
                <el-input v-model="planForm.planCode" :disabled="isEditMode" placeholder="系统自动生成" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="产品" prop="productId">
                <el-select v-model="planForm.productId" placeholder="请选择产品" filterable>
                  <el-option v-for="product in products" :key="product.id" :label="product.name" :value="product.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="计划数量" prop="orderQuantity">
                <el-input-number v-model="planForm.orderQuantity" :min="1" :step="1" placeholder="请输入计划数量" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="计划开始日期" prop="startDate">
                <el-date-picker v-model="planForm.startDate" type="date" placeholder="选择开始日期" value-format="yyyy-MM-dd" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="计划结束日期" prop="endDate">
                <el-date-picker v-model="planForm.endDate" type="date" placeholder="选择结束日期" value-format="yyyy-MM-dd" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="负责人" prop="responsiblePerson">
                <el-select v-model="planForm.responsiblePerson" placeholder="请选择负责人" filterable>
                  <el-option v-for="person in responsiblePersons" :key="person.id" :label="person.name" :value="person.name" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        
        <!-- 生产详情 -->
        <div class="form-section">
          <h3>生产详情</h3>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="生产车间" prop="workshopId">
                <el-select v-model="planForm.workshopId" placeholder="请选择生产车间" filterable>
                  <el-option v-for="workshop in workshops" :key="workshop.id" :label="workshop.name" :value="workshop.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="生产线" prop="productionLineId">
                <el-select v-model="planForm.productionLineId" placeholder="请选择生产线" filterable>
                  <el-option v-for="line in productionLines" :key="line.id" :label="line.name" :value="line.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="优先级" prop="priority">
                <el-select v-model="planForm.priority" placeholder="请选择优先级">
                  <el-option label="低" value="0" />
                  <el-option label="中" value="1" />
                  <el-option label="高" value="2" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="planForm.remark" placeholder="请输入备注信息" rows="4" />
          </el-form-item>
        </div>
        
        <!-- 物料需求 -->
        <div class="form-section">
          <h3>物料需求</h3>
          <el-table
            :data="materialRequirements"
            style="width: 100%"
            @row-click="handleMaterialRowClick"
          >
            <el-table-column prop="materialCode" label="物料编码" width="150" />
            <el-table-column prop="materialName" label="物料名称" />
            <el-table-column prop="specification" label="规格型号" width="180" />
            <el-table-column prop="requiredQuantity" label="需求数量" width="120" align="right" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="inventoryQuantity" label="库存数量" width="120" align="right" />
            <el-table-column prop="shortageQuantity" label="短缺数量" width="120" align="right">
              <template slot-scope="scope">
                <span v-if="scope.row.shortageQuantity > 0" class="shortage-text">{{ scope.row.shortageQuantity }}</span>
                <span v-else>0</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 产能分析 -->
        <div class="form-section">
          <h3>产能分析</h3>
          <capacity-view :plan-form="planForm" />
        </div>
        
        <div class="form-actions">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import CapacityView from './components/CapacityView.vue';

export default {
  name: 'ProductionPlanCreate',
  components: {
    CapacityView
  },
  data() {
    return {
      isEditMode: false,
      planForm: {
        planCode: '',
        productId: '',
        orderQuantity: 1,
        startDate: '',
        endDate: '',
        responsiblePerson: '',
        workshopId: '',
        productionLineId: '',
        priority: '1',
        remark: ''
      },
      rules: {
        planCode: [
          { required: true, message: '请输入计划编号', trigger: 'blur' }
        ],
        productId: [
          { required: true, message: '请选择产品', trigger: 'change' }
        ],
        orderQuantity: [
          { required: true, message: '请输入计划数量', trigger: 'blur' }
        ],
        startDate: [
          { required: true, message: '请选择计划开始日期', trigger: 'change' }
        ],
        endDate: [
          { required: true, message: '请选择计划结束日期', trigger: 'change' }
        ],
        responsiblePerson: [
          { required: true, message: '请选择负责人', trigger: 'change' }
        ],
        workshopId: [
          { required: true, message: '请选择生产车间', trigger: 'change' }
        ],
        productionLineId: [
          { required: true, message: '请选择生产线', trigger: 'change' }
        ]
      },
      products: [
        { id: '1', name: '智能手机A', code: 'P001' },
        { id: '2', name: '笔记本电脑B', code: 'P002' },
        { id: '3', name: '平板电脑C', code: 'P003' },
        { id: '4', name: '智能手表D', code: 'P004' }
      ],
      responsiblePersons: [
        { id: '1', name: '张三' },
        { id: '2', name: '李四' },
        { id: '3', name: '王五' },
        { id: '4', name: '赵六' }
      ],
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
      materialRequirements: [
        { materialCode: 'M001', materialName: '屏幕', specification: '15.6寸', requiredQuantity: 500, unit: '个', inventoryQuantity: 450, shortageQuantity: 50 },
        { materialCode: 'M002', materialName: '电池', specification: '1000mAh', requiredQuantity: 500, unit: '个', inventoryQuantity: 600, shortageQuantity: 0 },
        { materialCode: 'M003', materialName: '外壳', specification: '标准款', requiredQuantity: 500, unit: '个', inventoryQuantity: 300, shortageQuantity: 200 },
        { materialCode: 'M004', materialName: '键盘', specification: '标准键盘', requiredQuantity: 500, unit: '个', inventoryQuantity: 550, shortageQuantity: 0 }
      ]
    };
  },
  created() {
    const id = this.$route.query.id;
    if (id) {
      this.isEditMode = true;
      this.loadPlanData(id);
    } else {
      // 生成新的计划编号
      this.planForm.planCode = `PP${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    }
  },
  methods: {
    loadPlanData(id) {
      // 模拟加载数据
      setTimeout(() => {
        this.planForm = {
          planCode: `PP${new Date().getFullYear()}0001`,
          productId: '1',
          orderQuantity: 500,
          startDate: '2024-01-15',
          endDate: '2024-01-25',
          responsiblePerson: '张三',
          workshopId: '1',
          productionLineId: '1',
          priority: '2',
          remark: '这是一个测试计划'
        };
      }, 500);
    },
    
    handleSubmit() {
      this.$refs.planForm.validate((valid) => {
        if (valid) {
          // 模拟提交数据
          this.$confirm(`确定要${this.isEditMode ? '更新' : '创建'}生产计划吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }).then(() => {
            // 模拟API调用
            setTimeout(() => {
              this.$message({
                type: 'success',
                message: `${this.isEditMode ? '更新' : '创建'}成功`
              });
              this.$router.push('/production-planning');
            }, 500);
          }).catch(() => {
            // 用户取消操作
          });
        }
      });
    },
    
    handleCancel() {
      this.$router.push('/production-planning');
    },
    
    handleMaterialRowClick(row) {
      // 点击物料行可以查看物料详情
      this.$message({
        type: 'info',
        message: `查看物料${row.materialName}的详情`
      });
    }
  }
};
</script>

<style scoped>
.production-plan-create {
  padding: 20px;
}

.plan-form {
  margin-top: 20px;
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 4px;
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
  color: #333;
}

.form-actions {
  text-align: center;
  margin-top: 30px;
}

.shortage-text {
  color: #f56c6c;
  font-weight: bold;
}
</style>