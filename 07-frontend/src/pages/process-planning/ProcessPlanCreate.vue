<template>
  <div class="process-plan-create">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ isEditMode ? '编辑工序计划' : '创建工序计划' }}</h2>
      <div class="header-actions">
        <el-button @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" @click="handleSubmit">提交审核</el-button>
        <el-button @click="handleCancel">取消</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 基本信息 -->
      <el-tab-pane label="基本信息" name="basic">
        <el-card class="basic-info-card">
          <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="计划编号" prop="planCode">
                  <el-input v-model="formData.planCode" :disabled="isEditMode" placeholder="系统自动生成"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="版本号" prop="version">
                  <el-input v-model="formData.version" placeholder="请输入版本号"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="产品选择" prop="productId">
                  <el-select v-model="formData.productId" placeholder="请选择产品">
                    <el-option v-for="product in productList" :key="product.id" :label="product.name" :value="product.id"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="计划名称" prop="planName">
                  <el-input v-model="formData.planName" placeholder="请输入计划名称"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="责任人" prop="responsiblePerson">
                  <el-input v-model="formData.responsiblePerson" placeholder="请输入责任人"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="预计开始日期" prop="startDate">
                  <el-date-picker v-model="formData.startDate" type="date" placeholder="请选择开始日期" value-format="yyyy-MM-dd"></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="预计完成日期" prop="endDate">
                  <el-date-picker v-model="formData.endDate" type="date" placeholder="请选择完成日期" value-format="yyyy-MM-dd"></el-date-picker>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="计划描述" prop="description">
              <el-input v-model="formData.description" type="textarea" rows="4" placeholder="请输入计划描述"></el-input>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 工序列表 -->
      <el-tab-pane label="工序列表" name="operations">
        <el-card class="operations-card">
          <div class="operations-header">
            <span>工序明细管理</span>
            <div class="operations-actions">
              <el-button type="primary" @click="handleAddOperation">添加工序</el-button>
              <el-button @click="handleImportOperations">导入工序</el-button>
              <el-button type="danger" @click="handleBatchDeleteOperations" :disabled="selectedOperations.length === 0">批量删除</el-button>
            </div>
          </div>

          <el-table
            v-loading="operationsLoading"
            :data="operationsList"
            style="width: 100%"
            @selection-change="handleOperationSelectionChange"
          >
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column label="工序序号" width="80">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.sequence" :min="1" :step="1" size="small"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="operationCode" label="工序编码" min-width="120"></el-table-column>
            <el-table-column prop="operationName" label="工序名称" min-width="150"></el-table-column>
            <el-table-column prop="workshopName" label="所属车间" min-width="120"></el-table-column>
            <el-table-column prop="stationName" label="工位" min-width="100"></el-table-column>
            <el-table-column prop="standardTime" label="标准工时(分钟)" width="120">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.standardTime" :min="0.1" :step="0.1" size="small"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="equipmentName" label="使用设备" min-width="120"></el-table-column>
            <el-table-column prop="operationType" label="工序类型" width="100">
              <template slot-scope="scope">
                <el-tag :type="getOperationTypeColor(scope.row.operationType)">
                  {{ getOperationTypeName(scope.row.operationType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template slot-scope="scope">
                <el-button size="small" @click="handleEditOperation(scope.row)">编辑</el-button>
                <el-button size="small" @click="handleViewOperationDetails(scope.row)">详情</el-button>
                <el-button size="small" type="danger" @click="handleDeleteOperation(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 工序详情对话框 -->
          <el-dialog title="工序详情" :visible.sync="operationDetailVisible" width="60%">
            <div v-if="currentOperation" class="operation-detail-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="工序编码">{{ currentOperation.operationCode }}</el-descriptions-item>
                <el-descriptions-item label="工序名称">{{ currentOperation.operationName }}</el-descriptions-item>
                <el-descriptions-item label="所属车间">{{ currentOperation.workshopName }}</el-descriptions-item>
                <el-descriptions-item label="工位">{{ currentOperation.stationName }}</el-descriptions-item>
                <el-descriptions-item label="标准工时" :span="2">{{ currentOperation.standardTime }} 分钟</el-descriptions-item>
                <el-descriptions-item label="使用设备" :span="2">{{ currentOperation.equipmentName }}</el-descriptions-item>
                <el-descriptions-item label="工序类型" :span="2">{{ getOperationTypeName(currentOperation.operationType) }}</el-descriptions-item>
                <el-descriptions-item label="工序描述" :span="2">{{ currentOperation.description || '-' }}</el-descriptions-item>
              </el-descriptions>
              
              <div class="operation-materials-section">
                <h4>所需物料</h4>
                <el-table :data="currentOperation.materials || []" style="width: 100%">
                  <el-table-column prop="materialCode" label="物料编码"></el-table-column>
                  <el-table-column prop="materialName" label="物料名称"></el-table-column>
                  <el-table-column prop="quantity" label="用量"></el-table-column>
                  <el-table-column prop="unit" label="单位"></el-table-column>
                </el-table>
              </div>
            </div>
            <span slot="footer" class="dialog-footer">
              <el-button @click="operationDetailVisible = false">关闭</el-button>
            </span>
          </el-dialog>
        </el-card>
      </el-tab-pane>

      <!-- 工艺流程 -->
      <el-tab-pane label="工艺流程" name="flow">
        <el-card class="process-flow-card">
          <div class="flow-header">
            <span>工艺流程设计</span>
            <div class="flow-actions">
              <el-button @click="handleAutoArrange">自动编排</el-button>
              <el-button @click="handleExportFlow">导出流程图</el-button>
            </div>
          </div>
          
          <div class="flow-preview">
            <div v-if="operationsList.length === 0" class="empty-flow">
              <el-empty description="暂无工序数据，请先在工序列表中添加工序"></el-empty>
            </div>
            <div v-else class="flow-diagram">
              <!-- 简化的流程图展示 -->
              <div class="flow-items">
                <div v-for="(operation, index) in sortedOperations" :key="operation.id" class="flow-item">
                  <el-card :body-style="{ padding: '10px' }" class="operation-card">
                    <div class="operation-card-content">
                      <div class="operation-card-title">{{ operation.sequence }}. {{ operation.operationName }}</div>
                      <div class="operation-card-info">{{ operation.operationCode }}</div>
                      <div class="operation-card-time">{{ operation.standardTime }}分钟</div>
                    </div>
                  </el-card>
                  <div v-if="index < sortedOperations.length - 1" class="flow-arrow">→</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 资源分配 -->
      <el-tab-pane label="资源分配" name="resources">
        <el-card class="resources-card">
          <el-form :model="resourceForm" label-width="120px">
            <el-form-item label="人员配置">
              <el-table :data="resourceForm.staffAllocations" style="width: 100%">
                <el-table-column prop="staffName" label="人员姓名"></el-table-column>
                <el-table-column prop="position" label="职位"></el-table-column>
                <el-table-column prop="operationNames" label="负责工序"></el-table-column>
                <el-table-column prop="allocationRate" label="分配比例(%)">
                  <template slot-scope="scope">
                    <el-input-number v-model="scope.row.allocationRate" :min="0" :max="100" size="small"></el-input-number>
                  </template>
                </el-table-column>
              </el-table>
              <el-button type="primary" size="small" style="margin-top: 10px" @click="handleAddStaff">添加人员</el-button>
            </el-form-item>

            <el-form-item label="设备配置">
              <el-table :data="resourceForm.equipmentAllocations" style="width: 100%">
                <el-table-column prop="equipmentName" label="设备名称"></el-table-column>
                <el-table-column prop="equipmentCode" label="设备编号"></el-table-column>
                <el-table-column prop="operationNames" label="用于工序"></el-table-column>
                <el-table-column prop="usageRate" label="使用率(%)">
                  <template slot-scope="scope">
                    <el-input-number v-model="scope.row.usageRate" :min="0" :max="100" size="small"></el-input-number>
                  </template>
                </el-table-column>
              </el-table>
              <el-button type="primary" size="small" style="margin-top: 10px" @click="handleAddEquipment">添加设备</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 工序编辑对话框 -->
    <el-dialog title="编辑工序" :visible.sync="operationEditVisible" width="60%">
      <el-form :model="operationForm" :rules="operationRules" ref="operationFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工序编码" prop="operationCode">
              <el-input v-model="operationForm.operationCode" placeholder="请输入工序编码"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序名称" prop="operationName">
              <el-input v-model="operationForm.operationName" placeholder="请输入工序名称"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属车间" prop="workshopName">
              <el-input v-model="operationForm.workshopName" placeholder="请输入所属车间"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工位" prop="stationName">
              <el-input v-model="operationForm.stationName" placeholder="请输入工位"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标准工时" prop="standardTime">
              <el-input-number v-model="operationForm.standardTime" :min="0.1" :step="0.1" placeholder="请输入标准工时"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序类型" prop="operationType">
              <el-select v-model="operationForm.operationType" placeholder="请选择工序类型">
                <el-option label="装配" value="assembly"></el-option>
                <el-option label="加工" value="machining"></el-option>
                <el-option label="检测" value="inspection"></el-option>
                <el-option label="包装" value="packaging"></el-option>
                <el-option label="其他" value="other"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="使用设备" prop="equipmentName">
          <el-input v-model="operationForm.equipmentName" placeholder="请输入使用设备"></el-input>
        </el-form-item>
        
        <el-form-item label="工序描述">
          <el-input v-model="operationForm.description" type="textarea" rows="3" placeholder="请输入工序描述"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="operationEditVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveOperation">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ProcessPlanCreate',
  data() {
    return {
      // 表单数据
      formData: {
        planCode: '',
        planName: '',
        version: '1.0',
        productId: '',
        responsiblePerson: '',
        startDate: '',
        endDate: '',
        description: ''
      },
      // 表单验证规则
      rules: {
        planName: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
        productId: [{ required: true, message: '请选择产品', trigger: 'change' }],
        responsiblePerson: [{ required: true, message: '请输入责任人', trigger: 'blur' }],
        startDate: [{ required: true, message: '请选择预计开始日期', trigger: 'change' }],
        endDate: [{ required: true, message: '请选择预计完成日期', trigger: 'change' }]
      },
      // 产品列表
      productList: [],
      // 激活的标签页
      activeTab: 'basic',
      // 是否编辑模式
      isEditMode: false,
      // 工序列表
      operationsList: [],
      // 工序加载状态
      operationsLoading: false,
      // 选中的工序
      selectedOperations: [],
      // 工序编辑对话框可见性
      operationEditVisible: false,
      // 工序详情对话框可见性
      operationDetailVisible: false,
      // 当前操作的工序
      currentOperation: null,
      // 工序表单
      operationForm: {
        id: '',
        sequence: 1,
        operationCode: '',
        operationName: '',
        workshopName: '',
        stationName: '',
        standardTime: 0,
        equipmentName: '',
        operationType: 'assembly',
        description: ''
      },
      // 工序表单验证规则
      operationRules: {
        operationCode: [{ required: true, message: '请输入工序编码', trigger: 'blur' }],
        operationName: [{ required: true, message: '请输入工序名称', trigger: 'blur' }],
        workshopName: [{ required: true, message: '请输入所属车间', trigger: 'blur' }],
        standardTime: [{ required: true, message: '请输入标准工时', trigger: 'blur' }]
      },
      // 资源分配表单
      resourceForm: {
        staffAllocations: [],
        equipmentAllocations: []
      }
    }
  },
  created() {
    this.initData()
  },
  computed: {
    // 按序号排序的工序列表
    sortedOperations() {
      return [...this.operationsList].sort((a, b) => a.sequence - b.sequence)
    }
  },
  methods: {
    // 初始化数据
    initData() {
      // 检查是否是编辑模式
      const id = this.$route.params.id
      this.isEditMode = !!id
      
      // 加载产品列表
      this.loadProductList()
      
      if (this.isEditMode) {
        // 加载工序计划数据
        this.loadProcessPlanData(id)
      } else {
        // 生成计划编号
        this.formData.planCode = this.generatePlanCode()
      }
    },
    
    // 生成计划编号
    generatePlanCode() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      return `PP${year}${month}${day}${random}`
    },
    
    // 加载产品列表
    loadProductList() {
      // 模拟API调用
      this.productList = [
        { id: 'P001', name: '智能手表Pro', code: 'PRD001' },
        { id: 'P002', name: '智能手机X20', code: 'PRD002' },
        { id: 'P003', name: '平板电脑T10', code: 'PRD003' },
        { id: 'P004', name: '蓝牙耳机B30', code: 'PRD004' },
        { id: 'P005', name: '智能音箱S50', code: 'PRD005' }
      ]
    },
    
    // 加载工序计划数据
    loadProcessPlanData(id) {
      // 模拟API调用
      setTimeout(() => {
        // 模拟数据
        this.formData = {
          id: id,
          planCode: 'PP20240001',
          planName: '智能手表Pro组装工序计划',
          version: '1.0',
          productId: 'P001',
          responsiblePerson: '张三',
          startDate: '2024-01-15',
          endDate: '2024-01-30',
          description: '智能手表Pro的完整组装工序计划'
        }
        
        // 加载工序列表
        this.loadOperationsList()
      }, 500)
    },
    
    // 加载工序列表
    loadOperationsList() {
      this.operationsLoading = true
      // 模拟API调用
      setTimeout(() => {
        // 模拟数据
        this.operationsList = [
          {
            id: 'OP001',
            sequence: 1,
            operationCode: 'OPC001',
            operationName: '外壳注塑',
            workshopName: '注塑车间',
            stationName: '注塑工位1',
            standardTime: 10,
            equipmentName: '注塑机A01',
            operationType: 'machining',
            description: '智能手表外壳注塑成型',
            materials: [
              { materialCode: 'MAT001', materialName: 'PC塑料', quantity: 0.05, unit: 'kg' }
            ]
          },
          {
            id: 'OP002',
            sequence: 2,
            operationCode: 'OPC002',
            operationName: '电路板组装',
            workshopName: '电子车间',
            stationName: 'SMT线1',
            standardTime: 20,
            equipmentName: '贴片机B01',
            operationType: 'assembly',
            description: '电路板组件贴装与焊接',
            materials: [
              { materialCode: 'MAT002', materialName: 'PCB板', quantity: 1, unit: 'pcs' },
              { materialCode: 'MAT003', materialName: '芯片', quantity: 1, unit: 'pcs' }
            ]
          },
          {
            id: 'OP003',
            sequence: 3,
            operationCode: 'OPC003',
            operationName: '功能测试',
            workshopName: '测试车间',
            stationName: '测试工位1',
            standardTime: 15,
            equipmentName: '测试仪器C01',
            operationType: 'inspection',
            description: '电路板功能测试',
            materials: []
          },
          {
            id: 'OP004',
            sequence: 4,
            operationCode: 'OPC004',
            operationName: '整机装配',
            workshopName: '装配车间',
            stationName: '装配线1',
            standardTime: 25,
            equipmentName: '装配工作台D01',
            operationType: 'assembly',
            description: '将所有组件装配成整机',
            materials: [
              { materialCode: 'MAT004', materialName: '电池', quantity: 1, unit: 'pcs' },
              { materialCode: 'MAT005', materialName: '显示屏', quantity: 1, unit: 'pcs' }
            ]
          },
          {
            id: 'OP005',
            sequence: 5,
            operationCode: 'OPC005',
            operationName: '最终检验',
            workshopName: '质检车间',
            stationName: '质检工位1',
            standardTime: 12,
            equipmentName: '质检仪器E01',
            operationType: 'inspection',
            description: '整机最终质量检验',
            materials: []
          }
        ]
        
        // 加载资源分配数据
        this.loadResourceAllocations()
        
        this.operationsLoading = false
      }, 500)
    },
    
    // 加载资源分配数据
    loadResourceAllocations() {
      this.resourceForm = {
        staffAllocations: [
          { staffName: '李工', position: '技术员', operationNames: '外壳注塑', allocationRate: 100 },
          { staffName: '王工', position: '工程师', operationNames: '电路板组装,功能测试', allocationRate: 100 },
          { staffName: '张工', position: '质检员', operationNames: '最终检验', allocationRate: 100 }
        ],
        equipmentAllocations: [
          { equipmentName: '注塑机A01', equipmentCode: 'EQ001', operationNames: '外壳注塑', usageRate: 80 },
          { equipmentName: '贴片机B01', equipmentCode: 'EQ002', operationNames: '电路板组装', usageRate: 90 },
          { equipmentName: '测试仪器C01', equipmentCode: 'EQ003', operationNames: '功能测试', usageRate: 70 },
          { equipmentName: '装配工作台D01', equipmentCode: 'EQ004', operationNames: '整机装配', usageRate: 100 },
          { equipmentName: '质检仪器E01', equipmentCode: 'EQ005', operationNames: '最终检验', usageRate: 60 }
        ]
      }
    },
    
    // 获取工序类型颜色
    getOperationTypeColor(type) {
      const colorMap = {
        assembly: 'primary',
        machining: 'warning',
        inspection: 'success',
        packaging: 'info',
        other: 'default'
      }
      return colorMap[type] || 'default'
    },
    
    // 获取工序类型名称
    getOperationTypeName(type) {
      const nameMap = {
        assembly: '装配',
        machining: '加工',
        inspection: '检测',
        packaging: '包装',
        other: '其他'
      }
      return nameMap[type] || type
    },
    
    // 保存草稿
    handleSaveDraft() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          // 模拟保存草稿
          setTimeout(() => {
            this.$message.success('草稿保存成功')
          }, 500)
        }
      })
    },
    
    // 提交审核
    handleSubmit() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          if (this.operationsList.length === 0) {
            this.$message.warning('请至少添加一个工序')
            return
          }
          
          // 模拟提交审核
          this.$confirm('确认要提交审核吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            setTimeout(() => {
              this.$message.success('提交审核成功')
              this.$router.push('/process-planning')
            }, 500)
          }).catch(() => {
            this.$message.info('已取消提交')
          })
        }
      })
    },
    
    // 取消
    handleCancel() {
      this.$confirm('确定要离开当前页面吗？未保存的数据将丢失。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$router.push('/process-planning')
      }).catch(() => {
        // 取消操作
      })
    },
    
    // 添加工序
    handleAddOperation() {
      this.operationForm = {
        id: '',
        sequence: this.operationsList.length + 1,
        operationCode: '',
        operationName: '',
        workshopName: '',
        stationName: '',
        standardTime: 0,
        equipmentName: '',
        operationType: 'assembly',
        description: '',
        materials: []
      }
      this.operationEditVisible = true
    },
    
    // 编辑工序
    handleEditOperation(row) {
      this.operationForm = { ...row }
      this.operationEditVisible = true
    },
    
    // 保存工序
    handleSaveOperation() {
      this.$refs.operationFormRef.validate((valid) => {
        if (valid) {
          if (this.operationForm.id) {
            // 编辑现有工序
            const index = this.operationsList.findIndex(item => item.id === this.operationForm.id)
            if (index !== -1) {
              this.operationsList[index] = { ...this.operationForm }
            }
          } else {
            // 添加新工序
            this.operationsList.push({
              ...this.operationForm,
              id: `OP${String(this.operationsList.length + 1).padStart(3, '0')}`
            })
          }
          this.operationEditVisible = false
          this.$message.success('保存成功')
        }
      })
    },
    
    // 查看工序详情
    handleViewOperationDetails(row) {
      this.currentOperation = row
      this.operationDetailVisible = true
    },
    
    // 删除工序
    handleDeleteOperation(row) {
      this.$confirm(`确定要删除工序【${row.operationName}】吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.operationsList.findIndex(item => item.id === row.id)
        if (index !== -1) {
          this.operationsList.splice(index, 1)
          // 重新计算序号
          this.operationsList.forEach((item, idx) => {
            item.sequence = idx + 1
          })
        }
        this.$message.success('删除成功')
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    // 批量删除工序
    handleBatchDeleteOperations() {
      this.$confirm(`确定要删除选中的 ${this.selectedOperations.length} 个工序吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const ids = this.selectedOperations.map(item => item.id)
        this.operationsList = this.operationsList.filter(item => !ids.includes(item.id))
        // 重新计算序号
        this.operationsList.forEach((item, idx) => {
          item.sequence = idx + 1
        })
        this.selectedOperations = []
        this.$message.success('删除成功')
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    // 导入工序
    handleImportOperations() {
      this.$message.info('导入功能待实现')
    },
    
    // 工序选择变化
    handleOperationSelectionChange(rows) {
      this.selectedOperations = rows
    },
    
    // 自动编排
    handleAutoArrange() {
      // 按序号重新排序
      this.operationsList.sort((a, b) => a.sequence - b.sequence)
      this.$message.success('工艺流程已自动编排')
    },
    
    // 导出流程图
    handleExportFlow() {
      this.$message.info('导出功能待实现')
    },
    
    // 添加人员
    handleAddStaff() {
      this.resourceForm.staffAllocations.push({
        staffName: '',
        position: '',
        operationNames: '',
        allocationRate: 100
      })
    },
    
    // 添加设备
    handleAddEquipment() {
      this.resourceForm.equipmentAllocations.push({
        equipmentName: '',
        equipmentCode: '',
        operationNames: '',
        usageRate: 80
      })
    }
  }
}
</script>

<style scoped>
.process-plan-create {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.basic-info-card,
.operations-card,
.process-flow-card,
.resources-card {
  margin-bottom: 20px;
}

.operations-header,
.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
}

.operations-actions,
.flow-actions {
  display: flex;
  gap: 10px;
}

.empty-flow {
  padding: 40px 0;
}

.flow-diagram {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.flow-items {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.flow-item {
  display: flex;
  align-items: center;
}

.operation-card {
  width: 200px;
}

.operation-card-content {
  text-align: center;
}

.operation-card-title {
  font-weight: 600;
  margin-bottom: 5px;
}

.operation-card-info {
  font-size: 12px;
  color: #606266;
  margin-bottom: 5px;
}

.operation-card-time {
  font-size: 12px;
  color: #1890ff;
}

.flow-arrow {
  font-size: 20px;
  font-weight: bold;
  color: #909399;
  margin: 0 5px;
}

.operation-detail-content {
  padding: 10px 0;
}

.operation-materials-section {
  margin-top: 20px;
}

.operation-materials-section h4 {
  margin-bottom: 10px;
  font-weight: 600;
}
</style>