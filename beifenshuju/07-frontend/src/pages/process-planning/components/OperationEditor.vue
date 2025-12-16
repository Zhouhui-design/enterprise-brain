<template>
  <div class="operation-editor">
    <el-form ref="operationForm" :model="operation" :rules="rules" label-width="100px">
      <!-- 基本信息 -->
      <el-card class="mb-4">
        <div slot="header" class="clearfix">
          <span>基本信息</span>
        </div>
        <div class="form-row">
          <el-form-item label="工序编码" prop="operationCode">
            <el-input v-model="operation.operationCode" placeholder="请输入工序编码" />
          </el-form-item>
          <el-form-item label="工序名称" prop="operationName">
            <el-input v-model="operation.operationName" placeholder="请输入工序名称" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="工序类型" prop="operationType">
            <el-select v-model="operation.operationType" placeholder="请选择工序类型">
              <el-option v-for="type in operationTypes" :key="type.value" :label="type.label" :value="type.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属阶段" prop="stage">
            <el-select v-model="operation.stage" placeholder="请选择所属阶段">
              <el-option v-for="stage in stages" :key="stage.value" :label="stage.label" :value="stage.value" />
            </el-select>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="工序等级" prop="level">
            <el-input-number v-model="operation.level" :min="1" :max="10" placeholder="工序等级" />
          </el-form-item>
          <el-form-item label="优先级" prop="priority">
            <el-input-number v-model="operation.priority" :min="1" :max="10" placeholder="优先级" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="是否关键工序" prop="isCritical">
            <el-switch v-model="operation.isCritical" active-color="#13ce66" inactive-color="#ff4949" />
          </el-form-item>
          <el-form-item label="是否瓶颈工序" prop="isBottleneck">
            <el-switch v-model="operation.isBottleneck" active-color="#13ce66" inactive-color="#ff4949" />
          </el-form-item>
        </div>
      </el-card>

      <!-- 工时信息 -->
      <el-card class="mb-4">
        <div slot="header" class="clearfix">
          <span>工时信息</span>
        </div>
        <div class="form-row">
          <el-form-item label="准备时间(分钟)" prop="setupTime">
            <el-input-number v-model="operation.setupTime" :min="0" :step="0.1" placeholder="准备时间" />
          </el-form-item>
          <el-form-item label="加工时间(分钟)" prop="processingTime">
            <el-input-number v-model="operation.processingTime" :min="0" :step="0.1" placeholder="加工时间" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="等待时间(分钟)" prop="waitingTime">
            <el-input-number v-model="operation.waitingTime" :min="0" :step="0.1" placeholder="等待时间" />
          </el-form-item>
          <el-form-item label="搬运时间(分钟)" prop="moveTime">
            <el-input-number v-model="operation.moveTime" :min="0" :step="0.1" placeholder="搬运时间" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="标准工时(分钟)" prop="standardTime">
            <el-input-number v-model="operation.standardTime" :min="0" :step="0.1" placeholder="标准工时" :disabled="true" />
          </el-form-item>
          <el-form-item label="产能(件/小时)" prop="capacity">
            <el-input-number v-model="operation.capacity" :min="0" :step="0.1" placeholder="产能" />
          </el-form-item>
        </div>
      </el-card>

      <!-- 资源需求 -->
      <el-card class="mb-4">
        <div slot="header" class="clearfix">
          <span>资源需求</span>
        </div>
        <div class="form-row">
          <el-form-item label="设备需求" prop="equipmentIds">
            <el-select v-model="operation.equipmentIds" multiple placeholder="请选择设备">
              <el-option v-for="equipment in equipmentList" :key="equipment.id" :label="equipment.name" :value="equipment.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="人员需求" prop="laborRequirement">
            <el-input-number v-model="operation.laborRequirement" :min="1" :max="10" placeholder="人员需求" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="技能要求" prop="skillRequirements">
            <el-select v-model="operation.skillRequirements" multiple placeholder="请选择技能要求">
              <el-option v-for="skill in skillList" :key="skill.id" :label="skill.name" :value="skill.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="工具需求" prop="toolIds">
            <el-select v-model="operation.toolIds" multiple placeholder="请选择工具">
              <el-option v-for="tool in toolList" :key="tool.id" :label="tool.name" :value="tool.id" />
            </el-select>
          </el-form-item>
        </div>
      </el-card>

      <!-- 质量标准 -->
      <el-card class="mb-4">
        <div slot="header" class="clearfix">
          <span>质量标准</span>
        </div>
        <el-form-item label="检验点设置" prop="inspectionPoints">
          <el-checkbox-group v-model="operation.inspectionPoints">
            <el-checkbox v-for="point in inspectionPointOptions" :key="point.value" :label="point.value">
              {{ point.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="质量要求描述" prop="qualityRequirements">
          <el-input type="textarea" v-model="operation.qualityRequirements" placeholder="请输入质量要求描述" :rows="3" />
        </el-form-item>
        <el-form-item label="不良率标准(%)" prop="defectRateStandard">
          <el-input-number v-model="operation.defectRateStandard" :min="0" :max="100" :step="0.01" placeholder="不良率标准" />
        </el-form-item>
      </el-card>

      <!-- 备注信息 -->
      <el-card class="mb-4">
        <div slot="header" class="clearfix">
          <span>备注信息</span>
        </div>
        <el-form-item label="工序描述" prop="description">
          <el-input type="textarea" v-model="operation.description" placeholder="请输入工序描述" :rows="3" />
        </el-form-item>
        <el-form-item label="注意事项" prop="notes">
          <el-input type="textarea" v-model="operation.notes" placeholder="请输入注意事项" :rows="2" />
        </el-form-item>
      </el-card>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="loading">保存</el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'OperationEditor',
  props: {
    operationData: {
      type: Object,
      default: () => ({})
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      operation: {
        id: '',
        operationCode: '',
        operationName: '',
        operationType: '',
        stage: '',
        level: 1,
        priority: 5,
        isCritical: false,
        isBottleneck: false,
        setupTime: 0,
        processingTime: 0,
        waitingTime: 0,
        moveTime: 0,
        standardTime: 0,
        capacity: 0,
        equipmentIds: [],
        laborRequirement: 1,
        skillRequirements: [],
        toolIds: [],
        inspectionPoints: [],
        qualityRequirements: '',
        defectRateStandard: 0,
        description: '',
        notes: ''
      },
      rules: {
        operationCode: [
          { required: true, message: '请输入工序编码', trigger: 'blur' },
          { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        operationName: [
          { required: true, message: '请输入工序名称', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        operationType: [
          { required: true, message: '请选择工序类型', trigger: 'change' }
        ],
        stage: [
          { required: true, message: '请选择所属阶段', trigger: 'change' }
        ],
        processingTime: [
          { required: true, message: '请输入加工时间', trigger: 'change' },
          { type: 'number', min: 0, message: '加工时间必须大于等于0', trigger: 'change' }
        ],
        laborRequirement: [
          { required: true, message: '请输入人员需求', trigger: 'change' },
          { type: 'number', min: 1, message: '人员需求至少为1', trigger: 'change' }
        ]
      },
      // 模拟数据
      operationTypes: [
        { value: 'processing', label: '加工' },
        { value: 'assembly', label: '装配' },
        { value: 'inspection', label: '检验' },
        { value: 'packaging', label: '包装' },
        { value: 'transportation', label: '运输' },
        { value: 'storage', label: '存储' }
      ],
      stages: [
        { value: 'preparation', label: '准备阶段' },
        { value: 'production', label: '生产阶段' },
        { value: 'finishing', label: '精加工阶段' },
        { value: 'qualityControl', label: '质量控制阶段' },
        { value: 'packaging', label: '包装阶段' }
      ],
      equipmentList: [
        { id: 'eq001', name: 'CNC加工中心' },
        { id: 'eq002', name: '数控车床' },
        { id: 'eq003', name: '铣床' },
        { id: 'eq004', name: '钻床' },
        { id: 'eq005', name: '磨床' },
        { id: 'eq006', name: '冲压机' },
        { id: 'eq007', name: '注塑机' },
        { id: 'eq008', name: '激光切割机' }
      ],
      skillList: [
        { id: 'sk001', name: 'CNC操作' },
        { id: 'sk002', name: '焊接' },
        { id: 'sk003', name: '装配' },
        { id: 'sk004', name: '质量检测' },
        { id: 'sk005', name: '电气调试' }
      ],
      toolList: [
        { id: 'tl001', name: '钻头套装' },
        { id: 'tl002', name: '铣刀套装' },
        { id: 'tl003', name: '测量工具' },
        { id: 'tl004', name: '夹具' },
        { id: 'tl005', name: '模具' }
      ],
      inspectionPointOptions: [
        { value: 'incoming', label: '来料检验' },
        { value: 'inprocess', label: '过程检验' },
        { value: 'final', label: '最终检验' },
        { value: 'special', label: '专项检验' }
      ]
    }
  },
  watch: {
    // 监听operationData变化，更新表单数据
    operationData: {
      handler(newVal) {
        if (newVal) {
          this.operation = { ...this.operation, ...newVal }
          this.calculateStandardTime()
        }
      },
      immediate: true
    },
    // 监听工时相关字段变化，自动计算标准工时
    'operation.setupTime': function() {
      this.calculateStandardTime()
    },
    'operation.processingTime': function() {
      this.calculateStandardTime()
    },
    'operation.waitingTime': function() {
      this.calculateStandardTime()
    },
    'operation.moveTime': function() {
      this.calculateStandardTime()
    }
  },
  methods: {
    // 计算标准工时
    calculateStandardTime() {
      const { setupTime, processingTime, waitingTime, moveTime } = this.operation
      this.operation.standardTime = Number(setupTime) + Number(processingTime) + Number(waitingTime) + Number(moveTime)
    },
    
    // 保存工序信息
    async handleSave() {
      try {
        this.loading = true
        await this.$refs.operationForm.validate()
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        this.$emit('save', { ...this.operation })
        this.$message.success('保存成功')
      } catch (error) {
        if (error !== false) { // false 是 validate 失败时返回的
          this.$message.error('保存失败，请重试')
        }
      } finally {
        this.loading = false
      }
    },
    
    // 取消操作
    handleCancel() {
      this.$refs.operationForm.resetFields()
      this.$emit('cancel')
    },
    
    // 重置表单
    resetForm() {
      this.operation = {
        id: '',
        operationCode: '',
        operationName: '',
        operationType: '',
        stage: '',
        level: 1,
        priority: 5,
        isCritical: false,
        isBottleneck: false,
        setupTime: 0,
        processingTime: 0,
        waitingTime: 0,
        moveTime: 0,
        standardTime: 0,
        capacity: 0,
        equipmentIds: [],
        laborRequirement: 1,
        skillRequirements: [],
        toolIds: [],
        inspectionPoints: [],
        qualityRequirements: '',
        defectRateStandard: 0,
        description: '',
        notes: ''
      }
      if (this.$refs.operationForm) {
        this.$refs.operationForm.resetFields()
      }
    },
    
    // 获取工序类型标签
    getOperationTypeLabel(value) {
      const type = this.operationTypes.find(t => t.value === value)
      return type ? type.label : value
    },
    
    // 获取阶段标签
    getStageLabel(value) {
      const stage = this.stages.find(s => s.value === value)
      return stage ? stage.label : value
    }
  }
}
</script>

<style scoped>
.operation-editor {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.form-row > .el-form-item {
  flex: 1;
  min-width: 40%;
  margin-right: 20px;
}

.form-row > .el-form-item:last-child {
  margin-right: 0;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.form-actions .el-button {
  margin: 0 10px;
  padding: 8px 25px;
}

.el-card {
  margin-bottom: 20px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
  
  .form-row > .el-form-item {
    min-width: 100%;
    margin-right: 0;
    margin-bottom: 20px;
  }
  
  .form-row > .el-form-item:last-child {
    margin-bottom: 0;
  }
  
  .operation-editor {
    padding: 10px;
  }
}
</style>