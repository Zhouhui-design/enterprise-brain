<template>
  <div class="inspection-form">
    <!-- 基本信息区域 -->
    <el-card class="mb20">
      <div slot="header" class="clearfix">
        <span class="font-bold">检验基本信息</span>
      </div>
      
      <el-form :model="formData" label-width="120px" class="base-info-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="回厂单号">
              <el-input v-model="formData.receiptNo" disabled></el-input>
            </el-form-item>
            
            <el-form-item label="采购订单号">
              <el-input v-model="formData.purchaseOrderNo" disabled></el-input>
            </el-form-item>
            
            <el-form-item label="供应商">
              <el-input v-model="formData.supplier" disabled></el-input>
            </el-form-item>
            
            <el-form-item label="检验日期">
              <el-date-picker
                v-model="formData.inspectionDate"
                type="datetime"
                placeholder="选择检验日期时间"
                :disabled="!editable"
                style="width: 100%;"
              ></el-date-picker>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="检验类型">
              <el-select v-model="formData.inspectionType" placeholder="请选择检验类型" :disabled="!editable">
                <el-option label="全检" value="full"></el-option>
                <el-option label="抽检" value="sample"></el-option>
                <el-option label="免检" value="exempted"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="检验员">
              <el-input v-model="formData.inspector" :disabled="!editable"></el-input>
            </el-form-item>
            
            <el-form-item label="检验部门">
              <el-input v-model="formData.department" :disabled="!editable"></el-input>
            </el-form-item>
            
            <el-form-item label="检验状态">
              <el-tag :type="getStatusType(formData.status)">
                {{ getStatusText(formData.status) }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
    
    <!-- 产品信息区域 -->
    <el-card class="mb20">
      <div slot="header" class="clearfix">
        <span class="font-bold">产品信息</span>
      </div>
      
      <el-table
        :data="productList"
        border
        style="width: 100%"
        @row-click="handleProductClick"
        row-key="id"
      >
        <el-table-column prop="productCode" label="产品编码" min-width="120"></el-table-column>
        <el-table-column prop="productName" label="产品名称" min-width="150"></el-table-column>
        <el-table-column prop="spec" label="规格型号" min-width="120"></el-table-column>
        <el-table-column prop="unit" label="单位" width="80"></el-table-column>
        <el-table-column prop="quantity" label="到货数量" width="100" align="right"></el-table-column>
        <el-table-column prop="sampleQuantity" label="抽检数量" width="100" align="right">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.sampleQuantity"
              :min="0"
              :max="scope.row.quantity"
              :disabled="!editable"
              @change="handleSampleQuantityChange(scope.row)"
            ></el-input-number>
          </template>
        </el-table-column>
        <el-table-column prop="inspectionStatus" label="检验状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.inspectionStatus)">
              {{ getStatusText(scope.row.inspectionStatus) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 质量检验组件集成 -->
    <div v-if="selectedProduct" class="mb20">
      <el-card>
        <div slot="header" class="clearfix">
          <span class="font-bold">
            {{ selectedProduct.productName }} - 质量检验项目
          </span>
          <div class="el-card-header-btn" style="line-height: initial;">
            <el-button type="primary" size="small" @click="handleAddInspectionItem">添加检验项</el-button>
            <el-button size="small" @click="handleImportInspectionItem">导入检验项</el-button>
          </div>
        </div>
        
        <!-- 集成QualityCheck组件 -->
        <quality-check
          ref="qualityCheckRef"
          :product-info="selectedProduct"
          :initial-check-items="selectedProductInspectionItems"
          :editable="editable"
          @data-change="handleQualityCheckDataChange"
        ></quality-check>
      </el-card>
    </div>
    
    <!-- 检验结论区域 -->
    <el-card class="mb20">
      <div slot="header" class="clearfix">
        <span class="font-bold">检验结论</span>
      </div>
      
      <el-form :model="conclusionForm" label-width="120px" class="conclusion-form">
        <el-form-item label="总体判定" prop="overallConclusion">
          <el-radio-group v-model="conclusionForm.overallConclusion" :disabled="!editable">
            <el-radio label="合格" border></el-radio>
            <el-radio label="不合格" border></el-radio>
            <el-radio label="返工处理" border></el-radio>
            <el-radio label="让步接收" border></el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="质量等级" prop="qualityLevel">
          <el-select v-model="conclusionForm.qualityLevel" placeholder="请选择质量等级" :disabled="!editable">
            <el-option label="优等品" value="excellent"></el-option>
            <el-option label="一等品" value="firstClass"></el-option>
            <el-option label="合格品" value="qualified"></el-option>
            <el-option label="不合格品" value="unqualified"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="处理建议" prop="processingAdvice">
          <el-input
            v-model="conclusionForm.processingAdvice"
            type="textarea"
            :rows="3"
            placeholder="请输入处理建议"
            :disabled="!editable"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="conclusionForm.remarks"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
            :disabled="!editable"
          ></el-input>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 附件上传区域 -->
    <el-card class="mb20">
      <div slot="header" class="clearfix">
        <span class="font-bold">检验附件</span>
      </div>
      
      <div class="upload-section">
        <el-upload
          :action="uploadUrl"
          :on-success="handleFileUploadSuccess"
          :on-error="handleFileUploadError"
          :file-list="fileList"
          :disabled="!editable"
          list-type="text"
          multiple
        >
          <el-button size="small" type="primary" :disabled="!editable">
            <i class="el-icon-upload"></i> 上传附件
          </el-button>
          <div slot="tip" class="el-upload__tip">
            支持单个或批量上传，文件大小不超过50MB
          </div>
        </el-upload>
      </div>
    </el-card>
    
    <!-- 检验报告预览区域 -->
    <el-card>
      <div slot="header" class="clearfix">
        <span class="font-bold">检验报告</span>
        <div class="el-card-header-btn" style="line-height: initial;">
          <el-button type="primary" size="small" @click="handlePreviewReport">预览报告</el-button>
          <el-button size="small" @click="handlePrintReport">打印报告</el-button>
          <el-button size="small" @click="handleExportReport">导出报告</el-button>
        </div>
      </div>
      
      <div class="report-preview">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="报告编号">
            {{ formData.reportNo || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="生成日期">
            {{ formatDate(new Date()) }}
          </el-descriptions-item>
          <el-descriptions-item label="检验员签名">
            <div v-if="editable" class="signature-area">
              <el-input v-model="conclusionForm.inspectorSignature" placeholder="请输入姓名"></el-input>
            </div>
            <span v-else>{{ conclusionForm.inspectorSignature || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="审核人">
            <div v-if="editable" class="signature-area">
              <el-input v-model="conclusionForm.approver" placeholder="请输入审核人姓名"></el-input>
            </div>
            <span v-else>{{ conclusionForm.approver || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="检验结论" :span="2">
            <el-tag :type="getConclusionType(conclusionForm.overallConclusion)" size="large">
              {{ conclusionForm.overallConclusion || '-' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
    
    <!-- 操作按钮区域 -->
    <div class="action-buttons" v-if="editable">
      <el-button type="primary" @click="handleSave">保存</el-button>
      <el-button type="success" @click="handleSubmit">提交审核</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </div>
    
    <!-- 导入检验项对话框 -->
    <el-dialog
      title="导入检验项"
      :visible.sync="importDialogVisible"
      width="60%"
      :close-on-click-modal="false"
    >
      <div class="import-dialog-content">
        <el-form :model="importForm">
          <el-form-item label="模板选择">
            <el-select v-model="importForm.templateId" placeholder="请选择检验模板">
              <el-option v-for="template in inspectionTemplates" :key="template.id" :label="template.name" :value="template.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleImportTemplate">导入模板</el-button>
            <el-button @click="handleDownloadTemplate">下载模板</el-button>
          </el-form-item>
        </el-form>
        
        <div class="template-preview" v-if="selectedTemplate">
          <h4>模板预览：{{ selectedTemplate.name }}</h4>
          <el-table :data="selectedTemplate.items" border style="width: 100%;">
            <el-table-column prop="name" label="检验项名称" min-width="150"></el-table-column>
            <el-table-column prop="standard" label="检验标准" min-width="200"></el-table-column>
            <el-table-column prop="method" label="检验方法" min-width="120"></el-table-column>
            <el-table-column prop="spec" label="规格要求" min-width="100"></el-table-column>
          </el-table>
        </div>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="importDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
    
    <!-- 检验报告预览对话框 -->
    <el-dialog
      title="检验报告预览"
      :visible.sync="reportPreviewVisible"
      width="90%"
      fullscreen
      :close-on-click-modal="false"
    >
      <div class="report-content">
        <div class="report-header">
          <h1>回厂单检验报告</h1>
          <div class="report-meta">
            <p>报告编号：{{ formData.reportNo || '自动生成' }}</p>
            <p>生成日期：{{ formatDate(new Date()) }}</p>
          </div>
        </div>
        
        <div class="report-section">
          <h2>基本信息</h2>
          <table class="report-table">
            <tbody>
              <tr>
                <td class="report-label">回厂单号：</td>
                <td>{{ formData.receiptNo || '-' }}</td>
                <td class="report-label">采购订单号：</td>
                <td>{{ formData.purchaseOrderNo || '-' }}</td>
              </tr>
              <tr>
                <td class="report-label">供应商：</td>
                <td>{{ formData.supplier || '-' }}</td>
                <td class="report-label">检验日期：</td>
                <td>{{ formData.inspectionDate ? formatDate(formData.inspectionDate) : '-' }}</td>
              </tr>
              <tr>
                <td class="report-label">检验类型：</td>
                <td>{{ getInspectionTypeText(formData.inspectionType) }}</td>
                <td class="report-label">检验员：</td>
                <td>{{ formData.inspector || '-' }}</td>
              </tr>
              <tr>
                <td class="report-label">检验部门：</td>
                <td>{{ formData.department || '-' }}</td>
                <td class="report-label">检验状态：</td>
                <td>{{ getStatusText(formData.status) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="report-section" v-for="(product, index) in productList" :key="product.id">
          <h2>{{ index + 1 }}. 产品检验明细 - {{ product.productName }}</h2>
          <table class="report-table">
            <thead>
              <tr>
                <th>检验序号</th>
                <th>检验项目</th>
                <th>检验标准</th>
                <th>规格值</th>
                <th>实测值</th>
                <th>单位</th>
                <th>检验结果</th>
                <th>不合格描述</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, itemIndex) in getProductInspectionItems(product.id)" :key="item.id">
                <td>{{ itemIndex + 1 }}</td>
                <td>{{ item.inspectionItem }}</td>
                <td>{{ item.standard }}</td>
                <td>{{ item.specValue }}</td>
                <td>{{ item.actualValue || '-' }}</td>
                <td>{{ item.unit || '-' }}</td>
                <td>{{ item.result || '-' }}</td>
                <td>{{ item.defectDescription || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="report-section">
          <h2>检验结论</h2>
          <table class="report-table">
            <tbody>
              <tr>
                <td class="report-label">总体判定：</td>
                <td colspan="3">{{ conclusionForm.overallConclusion || '-' }}</td>
              </tr>
              <tr>
                <td class="report-label">质量等级：</td>
                <td>{{ getQualityLevelText(conclusionForm.qualityLevel) }}</td>
                <td class="report-label">处理建议：</td>
                <td>{{ conclusionForm.processingAdvice || '-' }}</td>
              </tr>
              <tr>
                <td class="report-label" colspan="4">备注：{{ conclusionForm.remarks || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="report-footer">
          <div class="signature-block">
            <p>检验员签名：________________</p>
            <p>日期：{{ formatDate(new Date()) }}</p>
          </div>
          <div class="signature-block">
            <p>审核人签名：________________</p>
            <p>日期：________________</p>
          </div>
        </div>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="handlePrintReport">打印报告</el-button>
        <el-button @click="handleExportReport">导出PDF</el-button>
        <el-button @click="reportPreviewVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import QualityCheck from './QualityCheck.vue'
import { format } from 'date-fns'

export default {
  name: 'InspectionForm',
  components: {
    QualityCheck
  },
  props: {
    // 接收父组件传递的回厂单数据
    receiptData: {
      type: Object,
      default: () => ({})
    },
    // 是否可编辑
    editable: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      // 基本信息表单数据
      formData: {
        receiptNo: '',
        purchaseOrderNo: '',
        supplier: '',
        inspectionDate: new Date(),
        inspectionType: 'full',
        inspector: '',
        department: '',
        status: 'pending',
        reportNo: ''
      },
      
      // 产品列表
      productList: [],
      
      // 选中的产品
      selectedProduct: null,
      
      // 检验结论表单
      conclusionForm: {
        overallConclusion: '',
        qualityLevel: '',
        processingAdvice: '',
        remarks: '',
        inspectorSignature: '',
        approver: ''
      },
      
      // 附件列表
      fileList: [],
      uploadUrl: '/api/upload/file', // 模拟上传接口
      
      // 导入对话框
      importDialogVisible: false,
      importForm: {
        templateId: ''
      },
      
      // 检验模板
      inspectionTemplates: [],
      selectedTemplate: null,
      
      // 报告预览对话框
      reportPreviewVisible: false
    }
  },
  computed: {
    // 选中产品的检验项
    selectedProductInspectionItems() {
      if (!this.selectedProduct) return []
      return this.getProductInspectionItems(this.selectedProduct.id)
    }
  },
  watch: {
    // 监听回厂单数据变化
    receiptData: {
      handler(newVal) {
        if (newVal) {
          this.initializeFormData(newVal)
        }
      },
      immediate: true,
      deep: true
    }
  },
  created() {
    // 初始化表单数据
    this.initializeFormData(this.receiptData)
    // 加载检验模板
    this.loadInspectionTemplates()
  },
  methods: {
    // 初始化表单数据
    initializeFormData(receiptData) {
      if (!receiptData) return
      
      // 设置基本信息
      this.formData = {
        receiptNo: receiptData.receiptNo || '',
        purchaseOrderNo: receiptData.purchaseOrderNo || '',
        supplier: receiptData.supplier || '',
        inspectionDate: receiptData.inspectionDate || new Date(),
        inspectionType: receiptData.inspectionType || 'full',
        inspector: receiptData.inspector || '',
        department: receiptData.department || '',
        status: receiptData.status || 'pending',
        reportNo: receiptData.reportNo || this.generateReportNo()
      }
      
      // 设置产品列表
      this.productList = receiptData.items || []
      
      // 初始化每个产品的检验项
      this.productList.forEach(product => {
        if (!product.inspectionItems) {
          product.inspectionItems = []
        }
        // 设置默认抽检数量
        if (!product.sampleQuantity) {
          product.sampleQuantity = Math.ceil(product.quantity * 0.1) // 默认抽检10%
        }
      })
      
      // 默认选中第一个产品
      if (this.productList.length > 0) {
        this.selectedProduct = this.productList[0]
      }
      
      // 设置检验结论
      this.conclusionForm = {
        overallConclusion: receiptData.conclusion?.overallConclusion || '',
        qualityLevel: receiptData.conclusion?.qualityLevel || '',
        processingAdvice: receiptData.conclusion?.processingAdvice || '',
        remarks: receiptData.conclusion?.remarks || '',
        inspectorSignature: receiptData.conclusion?.inspectorSignature || '',
        approver: receiptData.conclusion?.approver || ''
      }
      
      // 设置附件列表
      this.fileList = receiptData.attachments || []
    },
    
    // 生成报告编号
    generateReportNo() {
      const date = format(new Date(), 'yyyyMMdd')
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      return `RPT${date}${random}`
    },
    
    // 加载检验模板
    loadInspectionTemplates() {
      // 模拟加载检验模板
      this.inspectionTemplates = [
        {
          id: '1',
          name: '电子元件通用检验模板',
          items: [
            { name: '外观检查', standard: '无变形、无损伤', method: '目视检查', spec: '符合要求' },
            { name: '尺寸测量', standard: '符合图纸要求', method: '卡尺测量', spec: '±0.1mm' },
            { name: '功能测试', standard: '功能正常', method: '通电测试', spec: '正常工作' }
          ]
        },
        {
          id: '2',
          name: '机械零件检验模板',
          items: [
            { name: '材质硬度', standard: '符合要求', method: '硬度计测试', spec: 'HRC 45-50' },
            { name: '表面粗糙度', standard: 'Ra < 0.8μm', method: '粗糙度仪测量', spec: '< 0.8μm' },
            { name: '尺寸公差', standard: '符合国标', method: '三坐标测量', spec: 'IT7级' }
          ]
        }
      ]
    },
    
    // 处理产品点击
    handleProductClick(row) {
      this.selectedProduct = row
    },
    
    // 处理抽检数量变化
    handleSampleQuantityChange(product) {
      // 触发数据更新事件
      this.$emit('dataChange', this.getFormData())
    },
    
    // 添加检验项
    handleAddInspectionItem() {
      if (!this.selectedProduct) {
        this.$message.warning('请先选择一个产品')
        return
      }
      
      // 触发子组件的添加检验项方法
      if (this.$refs.qualityCheckRef) {
        this.$refs.qualityCheckRef.handleAddItem()
      }
    },
    
    // 导入检验项
    handleImportInspectionItem() {
      if (!this.selectedProduct) {
        this.$message.warning('请先选择一个产品')
        return
      }
      
      this.importDialogVisible = true
    },
    
    // 导入模板
    handleImportTemplate() {
      if (!this.importForm.templateId) {
        this.$message.warning('请选择检验模板')
        return
      }
      
      this.selectedTemplate = this.inspectionTemplates.find(t => t.id === this.importForm.templateId)
      
      if (this.selectedTemplate && this.selectedProduct) {
        // 将模板项目转换为检验项格式并添加到选中产品
        const newInspectionItems = this.selectedTemplate.items.map((item, index) => ({
          id: Date.now().toString() + index,
          inspectionItem: item.name,
          standard: item.standard,
          testMethod: item.method,
          specValue: item.spec,
          unit: '',
          actualValue: '',
          result: '',
          defectDescription: '',
          inspector: '',
          inspectionTime: '',
          imageList: [],
          isSample: false
        }))
        
        // 合并到现有检验项
        if (!this.selectedProduct.inspectionItems) {
          this.selectedProduct.inspectionItems = []
        }
        this.selectedProduct.inspectionItems = [...this.selectedProduct.inspectionItems, ...newInspectionItems]
        
        this.$message.success('成功导入检验模板')
        this.$emit('dataChange', this.getFormData())
      }
    },
    
    // 下载模板
    handleDownloadTemplate() {
      this.$message.info('模板下载功能开发中')
    },
    
    // 处理质量检验数据变化
    handleQualityCheckDataChange(data) {
      if (this.selectedProduct) {
        this.selectedProduct.inspectionItems = data.checkItems
        
        // 更新产品检验状态
        this.updateProductInspectionStatus(this.selectedProduct)
        
        // 通知父组件数据变化
        this.$emit('dataChange', this.getFormData())
      }
    },
    
    // 更新产品检验状态
    updateProductInspectionStatus(product) {
      const items = product.inspectionItems || []
      if (items.length === 0) {
        product.inspectionStatus = 'pending'
      } else {
        const completedItems = items.filter(item => item.result)
        if (completedItems.length === 0) {
          product.inspectionStatus = 'pending'
        } else if (completedItems.length === items.length) {
          // 检查是否有不合格项
          const hasUnqualified = completedItems.some(item => item.result === '不合格')
          product.inspectionStatus = hasUnqualified ? 'unqualified' : 'qualified'
        } else {
          product.inspectionStatus = 'processing'
        }
      }
    },
    
    // 获取产品的检验项
    getProductInspectionItems(productId) {
      const product = this.productList.find(p => p.id === productId)
      return product ? (product.inspectionItems || []) : []
    },
    
    // 文件上传成功
    handleFileUploadSuccess(response, file, fileList) {
      // 模拟上传成功，实际应该使用response中的URL
      const mockUrl = URL.createObjectURL(file.raw)
      const newFile = {
        name: file.name,
        url: mockUrl,
        size: file.size,
        uploadTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        type: file.type
      }
      
      this.fileList.push(newFile)
      this.$message.success('文件上传成功')
    },
    
    // 文件上传失败
    handleFileUploadError(error, file, fileList) {
      this.$message.error('文件上传失败')
    },
    
    // 预览报告
    handlePreviewReport() {
      this.reportPreviewVisible = true
    },
    
    // 打印报告
    handlePrintReport() {
      this.$message.info('打印功能开发中')
    },
    
    // 导出报告
    handleExportReport() {
      this.$message.info('导出功能开发中')
    },
    
    // 保存表单
    handleSave() {
      // 验证表单
      if (!this.validateForm()) {
        return
      }
      
      const formData = this.getFormData()
      
      // 模拟保存操作
      this.$message.success('检验表单保存成功')
      this.$emit('save', formData)
    },
    
    // 提交审核
    handleSubmit() {
      // 验证表单
      if (!this.validateForm()) {
        return
      }
      
      // 检查是否所有产品都已检验
      const unInspectedProducts = this.productList.filter(p => p.inspectionStatus === 'pending' || p.inspectionStatus === 'processing')
      if (unInspectedProducts.length > 0) {
        this.$confirm('存在未完成检验的产品，确定要提交审核吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.submitForm()
        }).catch(() => {})
      } else {
        this.submitForm()
      }
    },
    
    // 提交表单实现
    submitForm() {
      const formData = this.getFormData()
      formData.status = 'submitted'
      
      // 模拟提交操作
      this.$message.success('检验表单提交成功，等待审核')
      this.$emit('submit', formData)
    },
    
    // 重置表单
    handleReset() {
      this.$confirm('确定要重置表单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.initializeFormData(this.receiptData)
        this.$message.success('表单已重置')
      }).catch(() => {})
    },
    
    // 验证表单
    validateForm() {
      if (!this.formData.inspectionDate) {
        this.$message.error('请选择检验日期')
        return false
      }
      
      if (!this.formData.inspector) {
        this.$message.error('请填写检验员')
        return false
      }
      
      if (!this.formData.department) {
        this.$message.error('请填写检验部门')
        return false
      }
      
      if (!this.conclusionForm.overallConclusion) {
        this.$message.error('请选择总体判定')
        return false
      }
      
      return true
    },
    
    // 获取完整的表单数据
    getFormData() {
      return {
        ...this.formData,
        items: this.productList,
        conclusion: {
          ...this.conclusionForm
        },
        attachments: this.fileList
      }
    },
    
    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        'pending': 'warning',
        'processing': 'primary',
        'qualified': 'success',
        'unqualified': 'danger',
        'submitted': 'info',
        'approved': 'success',
        'rejected': 'danger'
      }
      return typeMap[status] || 'info'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        'pending': '待检验',
        'processing': '检验中',
        'qualified': '合格',
        'unqualified': '不合格',
        'submitted': '已提交',
        'approved': '已审核',
        'rejected': '已驳回'
      }
      return textMap[status] || '未知'
    },
    
    // 获取检验类型文本
    getInspectionTypeText(type) {
      const textMap = {
        'full': '全检',
        'sample': '抽检',
        'exempted': '免检'
      }
      return textMap[type] || '未知'
    },
    
    // 获取质量等级文本
    getQualityLevelText(level) {
      const textMap = {
        'excellent': '优等品',
        'firstClass': '一等品',
        'qualified': '合格品',
        'unqualified': '不合格品'
      }
      return textMap[level] || '-'  
    },
    
    // 获取结论类型
    getConclusionType(conclusion) {
      const typeMap = {
        '合格': 'success',
        '不合格': 'danger',
        '返工处理': 'warning',
        '让步接收': 'info'
      }
      return typeMap[conclusion] || 'info'
    },
    
    // 格式化日期
    formatDate(date) {
      return format(date, 'yyyy-MM-dd HH:mm:ss')
    }
  }
}
</script>

<style scoped>
.inspection-form {
  font-size: 14px;
}

.mb20 {
  margin-bottom: 20px;
}

.font-bold {
  font-weight: bold;
  font-size: 16px;
}

.base-info-form,
.conclusion-form {
  margin-top: 16px;
}

.upload-section {
  margin-top: 16px;
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
}

.action-buttons .el-button {
  margin: 0 8px;
}

.import-dialog-content {
  max-height: 400px;
  overflow-y: auto;
}

.template-preview {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.signature-area {
  width: 200px;
}

/* 报告样式 */
.report-content {
  padding: 20px;
  background: white;
}

.report-header {
  text-align: center;
  margin-bottom: 30px;
}

.report-header h1 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.report-meta {
  display: flex;
  justify-content: center;
  gap: 30px;
  font-size: 14px;
  color: #606266;
}

.report-section {
  margin-bottom: 30px;
}

.report-section h2 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409EFF;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.report-table th,
.report-table td {
  border: 1px solid #dcdfe6;
  padding: 8px 12px;
  text-align: left;
}

.report-table th {
  background-color: #f5f7fa;
  font-weight: bold;
}

.report-table .report-label {
  background-color: #f5f7fa;
  font-weight: bold;
  width: 120px;
}

.report-footer {
  display: flex;
  justify-content: space-around;
  margin-top: 50px;
  padding-top: 30px;
  border-top: 1px solid #dcdfe6;
}

.signature-block {
  text-align: center;
}

.signature-block p {
  margin-bottom: 10px;
}

/* 报告预览样式 */
.report-preview {
  margin-top: 20px;
}
</style>