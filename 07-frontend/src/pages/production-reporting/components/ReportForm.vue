<template>
  <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px" class="report-form">
    <!-- 基础信息 -->
    <el-form-item label="工单编号" prop="workOrderNumber">
      <el-input v-model="formData.workOrderNumber" placeholder="请输入工单编号" clearable @change="handleWorkOrderChange" />
    </el-form-item>
    
    <el-form-item label="产品名称" prop="productName">
      <el-input v-model="formData.productName" placeholder="产品名称" disabled />
    </el-form-item>
    
    <el-form-item label="生产批次" prop="batchNumber">
      <el-input v-model="formData.batchNumber" placeholder="请输入生产批次" />
    </el-form-item>
    
    <el-form-item label="报工日期" prop="reportDate">
      <el-date-picker 
        v-model="formData.reportDate" 
        type="date" 
        placeholder="选择报工日期" 
        value-format="YYYY-MM-DD" 
      />
    </el-form-item>
    
    <el-form-item label="班次" prop="shift">
      <el-select v-model="formData.shift" placeholder="请选择班次">
        <el-option label="早班" value="morning" />
        <el-option label="中班" value="afternoon" />
        <el-option label="晚班" value="night" />
      </el-select>
    </el-form-item>
    
    <el-form-item label="操作人" prop="operator">
      <el-input v-model="formData.operator" placeholder="请输入操作人姓名" />
    </el-form-item>
    
    <el-form-item label="备注" prop="remark">
      <el-input 
        v-model="formData.remark" 
        type="textarea" 
        placeholder="请输入备注信息" 
        :rows="3"
      />
    </el-form-item>
    
    <!-- 进度报工相关字段 -->
    <template v-if="formType === 'progress'">
      <el-form-item label="完成数量" prop="completedQuantity">
        <el-input-number 
          v-model="formData.completedQuantity" 
          :min="0" 
          :step="1" 
          placeholder="请输入完成数量"
        />
      </el-form-item>
      
      <el-form-item label="累计完成" prop="cumulativeCompleted">
        <el-input v-model="formData.cumulativeCompleted" placeholder="累计完成数量" disabled />
      </el-form-item>
      
      <el-form-item label="计划数量" prop="plannedQuantity">
        <el-input v-model="formData.plannedQuantity" placeholder="计划数量" disabled />
      </el-form-item>
    </template>
    
    <!-- 缺陷报工相关字段 -->
    <template v-if="formType === 'defect'">
      <el-form-item label="缺陷类型" prop="defectType">
        <el-select v-model="formData.defectType" placeholder="请选择缺陷类型">
          <el-option 
            v-for="defect in defectTypes" 
            :key="defect.value" 
            :label="defect.label" 
            :value="defect.value" 
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="缺陷数量" prop="defectQuantity">
        <el-input-number 
          v-model="formData.defectQuantity" 
          :min="0" 
          :step="1" 
          placeholder="请输入缺陷数量"
        />
      </el-form-item>
      
      <el-form-item label="缺陷描述" prop="defectDescription">
        <el-input 
          v-model="formData.defectDescription" 
          type="textarea" 
          placeholder="请输入缺陷详细描述" 
          :rows="3"
        />
      </el-form-item>
      
      <el-form-item label="责任部门" prop="responsibleDepartment">
        <el-select v-model="formData.responsibleDepartment" placeholder="请选择责任部门">
          <el-option 
            v-for="dept in departments" 
            :key="dept.id" 
            :label="dept.name" 
            :value="dept.id" 
          />
        </el-select>
      </el-form-item>
    </template>
    
    <!-- 产量报工相关字段 -->
    <template v-if="formType === 'output'">
      <el-form-item label="合格数量" prop="qualifiedQuantity">
        <el-input-number 
          v-model="formData.qualifiedQuantity" 
          :min="0" 
          :step="1" 
          placeholder="请输入合格数量"
        />
      </el-form-item>
      
      <el-form-item label="不合格数量" prop="unqualifiedQuantity">
        <el-input-number 
          v-model="formData.unqualifiedQuantity" 
          :min="0" 
          :step="1" 
          placeholder="请输入不合格数量"
        />
      </el-form-item>
      
      <el-form-item label="投入工时" prop="inputHours">
        <el-input-number 
          v-model="formData.inputHours" 
          :min="0" 
          :step="0.1" 
          placeholder="请输入投入工时"
        />
      </el-form-item>
      
      <el-form-item label="实际工时" prop="actualHours">
        <el-input-number 
          v-model="formData.actualHours" 
          :min="0" 
          :step="0.1" 
          placeholder="请输入实际工时"
        />
      </el-form-item>
    </template>
  </el-form>
</template>

<script>
export default {
  name: 'ReportForm',
  props: {
    formType: {
      type: String,
      required: true,
      validator: (value) => ['progress', 'defect', 'output'].includes(value)
    },
    modelValue: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'submit'],
  data() {
    return {
      formRef: null,
      formData: {
        workOrderNumber: '',
        productName: '',
        batchNumber: '',
        reportDate: this.getToday(),
        shift: 'morning',
        operator: '',
        remark: '',
        // 进度报工字段
        completedQuantity: 0,
        cumulativeCompleted: 0,
        plannedQuantity: 0,
        // 缺陷报工字段
        defectType: '',
        defectQuantity: 0,
        defectDescription: '',
        responsibleDepartment: '',
        // 产量报工字段
        qualifiedQuantity: 0,
        unqualifiedQuantity: 0,
        inputHours: 0,
        actualHours: 0
      },
      defectTypes: [
        { label: '外观缺陷', value: 'appearance' },
        { label: '尺寸偏差', value: 'dimension' },
        { label: '性能不达标', value: 'performance' },
        { label: '装配问题', value: 'assembly' },
        { label: '其他', value: 'other' }
      ],
      departments: [
        { id: 'production', name: '生产部' },
        { id: 'quality', name: '质量部' },
        { id: 'rd', name: '研发部' },
        { id: 'process', name: '工艺部' },
        { id: 'purchase', name: '采购部' }
      ]
    };
  },
  computed: {
    rules() {
      const baseRules = {
        workOrderNumber: [
          { required: true, message: '请输入工单编号', trigger: 'blur' }
        ],
        reportDate: [
          { required: true, message: '请选择报工日期', trigger: 'change' }
        ],
        shift: [
          { required: true, message: '请选择班次', trigger: 'change' }
        ],
        operator: [
          { required: true, message: '请输入操作人姓名', trigger: 'blur' }
        ]
      };
      
      // 根据表单类型添加不同的验证规则
      if (this.formType === 'progress') {
        baseRules.completedQuantity = [
          { required: true, message: '请输入完成数量', trigger: 'change' },
          { type: 'number', min: 1, message: '完成数量必须大于0', trigger: 'change' }
        ];
      } else if (this.formType === 'defect') {
        baseRules.defectType = [
          { required: true, message: '请选择缺陷类型', trigger: 'change' }
        ];
        baseRules.defectQuantity = [
          { required: true, message: '请输入缺陷数量', trigger: 'change' },
          { type: 'number', min: 1, message: '缺陷数量必须大于0', trigger: 'change' }
        ];
        baseRules.defectDescription = [
          { required: true, message: '请输入缺陷描述', trigger: 'blur' }
        ];
      } else if (this.formType === 'output') {
        baseRules.qualifiedQuantity = [
          { required: true, message: '请输入合格数量', trigger: 'change' },
          { type: 'number', min: 0, message: '合格数量不能小于0', trigger: 'change' }
        ];
        baseRules.unqualifiedQuantity = [
          { type: 'number', min: 0, message: '不合格数量不能小于0', trigger: 'change' }
        ];
        baseRules.inputHours = [
          { type: 'number', min: 0, message: '投入工时不能小于0', trigger: 'change' }
        ];
        baseRules.actualHours = [
          { type: 'number', min: 0, message: '实际工时不能小于0', trigger: 'change' }
        ];
      }
      
      return baseRules;
    }
  },
  watch: {
    modelValue: {
      handler(newVal) {
        if (newVal) {
          this.formData = { ...this.formData, ...newVal };
        }
      },
      immediate: true
    },
    formData: {
      handler(newVal) {
        this.$emit('update:modelValue', { ...newVal });
      },
      deep: true
    }
  },
  methods: {
    getToday() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    },
    handleWorkOrderChange() {
      // 这里可以根据工单编号获取工单信息
      this.mockGetWorkOrderInfo();
    },
    mockGetWorkOrderInfo() {
      // 模拟获取工单信息
      if (this.formData.workOrderNumber) {
        // 模拟数据，实际应从API获取
        this.formData.productName = '测试产品A';
        this.formData.plannedQuantity = 1000;
        this.formData.cumulativeCompleted = 500;
      }
    },
    validate() {
      return new Promise((resolve, reject) => {
        this.formRef.validate((valid) => {
          if (valid) {
            resolve(true);
          } else {
            reject(false);
          }
        });
      });
    },
    reset() {
      this.formRef.resetFields();
      this.formData.reportDate = this.getToday();
    },
    submitForm() {
      this.validate().then(() => {
        this.$emit('submit', { ...this.formData });
      });
    }
  }
};
</script>

<style scoped>
.report-form {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.el-form-item {
  margin-bottom: 20px;
}
</style>