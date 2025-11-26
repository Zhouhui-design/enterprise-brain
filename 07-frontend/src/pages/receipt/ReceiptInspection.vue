<template>
  <div class="receipt-inspection-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button type="primary" @click="backToList" size="mini">返回列表</el-button>
      <h2>回厂单检验</h2>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：基本信息 -->
      <el-col :span="6">
        <el-card class="basic-info-card">
          <template #header>
            <div class="card-header">
              <span>回厂单基本信息</span>
            </div>
          </template>
          
          <div class="info-section">
            <div class="info-item">
              <span class="label">回厂单号：</span>
              <span class="value">{{ receiptInfo.receiptNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">采购订单号：</span>
              <span class="value">{{ receiptInfo.purchaseOrderNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">供应商：</span>
              <span class="value">{{ receiptInfo.supplierName }}</span>
            </div>
            <div class="info-item">
              <span class="label">回厂日期：</span>
              <span class="value">{{ formatDate(receiptInfo.receiptDate) }}</span>
            </div>
            <div class="info-item">
              <span class="label">到货方式：</span>
              <span class="value">{{ receiptInfo.arrivalMethod }}</span>
            </div>
            <div class="info-item">
              <span class="label">状态：</span>
              <el-tag :type="getStatusTagType(receiptInfo.status)">{{ receiptInfo.statusText }}</el-tag>
            </div>
            <div class="info-item">
              <span class="label">收货人：</span>
              <span class="value">{{ receiptInfo.receiverName }}</span>
            </div>
            <div class="info-item">
              <span class="label">检验员：</span>
              <span class="value">{{ currentUser.name }}</span>
            </div>
          </div>
        </el-card>

        <!-- 检验统计信息 -->
        <el-card class="statistics-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>检验统计</span>
            </div>
          </template>
          
          <div class="statistics-section">
            <div class="stat-item">
              <div class="stat-number">{{ statistics.totalItems }}</div>
              <div class="stat-label">检验项数</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" style="color: #67c23a;">{{ statistics.passCount }}</div>
              <div class="stat-label">合格项</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" style="color: #f56c6c;">{{ statistics.failCount }}</div>
              <div class="stat-label">不合格项</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" style="color: #e6a23c;">{{ statistics.suspiciousCount }}</div>
              <div class="stat-label">待确认</div>
            </div>
          </div>
        </el-card>

        <!-- 检验结论 -->
        <el-card class="conclusion-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>检验结论</span>
            </div>
          </template>
          
          <div class="conclusion-section">
            <el-form-item label="总体判定：">
              <el-radio-group v-model="inspectionConclusion.overallResult" @change="updateOverallResult">
                <el-radio label="合格">合格</el-radio>
                <el-radio label="不合格">不合格</el-radio>
                <el-radio label="让步接收">让步接收</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="处理建议：">
              <el-input 
                type="textarea" 
                v-model="inspectionConclusion.suggestion" 
                :rows="4"
                placeholder="请输入处理建议"
              ></el-input>
            </el-form-item>
            
            <el-form-item label="备注：">
              <el-input 
                type="textarea" 
                v-model="inspectionConclusion.remarks" 
                :rows="3"
                placeholder="请输入备注信息"
              ></el-input>
            </el-form-item>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：检验项目列表 -->
      <el-col :span="18">
        <el-card class="inspection-items-card">
          <template #header>
            <div class="card-header">
              <span>检验项目列表</span>
              <div class="header-actions">
                <el-button type="text" size="mini" @click="toggleBatchMode">
                  {{ isBatchMode ? '退出批量模式' : '批量检验' }}
                </el-button>
                <el-button type="primary" size="mini" @click="saveInspectionResults">保存检验结果</el-button>
              </div>
            </div>
          </template>

          <!-- 批量检验模式 -->
          <div v-if="isBatchMode" class="batch-inspection">
            <el-form :model="batchInspectionForm" label-width="100px">
              <el-form-item label="批量判定：">
                <el-radio-group v-model="batchInspectionForm.batchResult">
                  <el-radio label="合格">全部合格</el-radio>
                  <el-radio label="不合格">全部不合格</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="批量备注：">
                <el-input 
                  type="textarea" 
                  v-model="batchInspectionForm.batchRemark" 
                  :rows="2"
                  placeholder="请输入批量备注"
                ></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="applyBatchInspection">应用批量检验</el-button>
                <el-button @click="cancelBatchMode">取消</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 检验项目表格 -->
          <el-table 
            v-loading="loading" 
            :data="inspectionItems" 
            border 
            style="width: 100%"
            @selection-change="handleSelectionChange"
          >
            <el-table-column 
              type="selection" 
              width="55" 
              v-if="isBatchMode"
            ></el-table-column>
            <el-table-column 
              prop="itemNo" 
              label="物料编码" 
              width="120"
            ></el-table-column>
            <el-table-column 
              prop="itemName" 
              label="物料名称" 
              width="180"
            ></el-table-column>
            <el-table-column 
              prop="spec" 
              label="规格型号" 
              width="150"
            ></el-table-column>
            <el-table-column 
              prop="quantity" 
              label="收货数量" 
              width="100"
              align="right"
            ></el-table-column>
            <el-table-column 
              prop="unit" 
              label="单位" 
              width="80"
            ></el-table-column>
            <el-table-column 
              prop="inspectionQuantity" 
              label="检验数量" 
              width="100"
              align="right"
            >
              <template slot-scope="scope">
                <el-input-number 
                  v-model="scope.row.inspectionQuantity" 
                  :min="0" 
                  :max="scope.row.quantity"
                  size="small"
                  :disabled="isBatchMode"
                ></el-input-number>
              </template>
            </el-table-column>
            <el-table-column 
              prop="inspectionItems" 
              label="检验项目" 
              width="150"
            >
              <template slot-scope="scope">
                <el-button 
                  type="text" 
                  size="mini" 
                  @click="openInspectionDetailDialog(scope.row)"
                  :disabled="isBatchMode"
                >
                  检验明细
                </el-button>
              </template>
            </el-table-column>
            <el-table-column 
              prop="result" 
              label="检验结果" 
              width="100"
            >
              <template slot-scope="scope">
                <el-select 
                  v-model="scope.row.result" 
                  placeholder="请选择" 
                  size="small"
                  :disabled="isBatchMode"
                >
                  <el-option label="合格" value="合格"></el-option>
                  <el-option label="不合格" value="不合格"></el-option>
                  <el-option label="待确认" value="待确认"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column 
              prop="defectDescription" 
              label="不合格描述" 
              min-width="150"
            >
              <template slot-scope="scope">
                <el-input 
                  v-model="scope.row.defectDescription" 
                  type="textarea" 
                  :rows="2"
                  size="small"
                  :disabled="isBatchMode"
                ></el-input>
              </template>
            </el-table-column>
            <el-table-column 
              label="操作" 
              width="100"
              fixed="right"
            >
              <template slot-scope="scope">
                <el-button 
                  type="text" 
                  size="mini" 
                  @click="uploadDefectImage(scope.row)"
                  :disabled="isBatchMode"
                >
                  上传图片
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 检验明细对话框 -->
    <el-dialog 
      :title="'检验明细 - ' + selectedItem.itemName" 
      :visible.sync="inspectionDetailDialogVisible" 
      width="800px"
    >
      <div class="inspection-detail">
        <el-form label-width="120px">
          <el-form-item label="物料信息：">
            {{ selectedItem.itemNo }} - {{ selectedItem.itemName }} ({{ selectedItem.spec }})
          </el-form-item>
          <el-form-item label="收货数量：">
            {{ selectedItem.quantity }} {{ selectedItem.unit }}
          </el-form-item>
        </el-form>

        <h4>具体检验项目</h4>
        <el-table 
          :data="selectedItemQualityItems" 
          border 
          style="width: 100%"
          size="small"
        >
          <el-table-column 
            prop="qualityItemName" 
            label="检验项" 
            width="150"
          ></el-table-column>
          <el-table-column 
            prop="standard" 
            label="检验标准" 
            width="200"
          ></el-table-column>
          <el-table-column 
            prop="method" 
            label="检验方法" 
            width="120"
          ></el-table-column>
          <el-table-column 
            prop="actualValue" 
            label="实测值" 
            width="120"
          >
            <template slot-scope="scope">
              <el-input 
                v-model="scope.row.actualValue" 
                size="small"
              ></el-input>
            </template>
          </el-table-column>
          <el-table-column 
            prop="itemResult" 
            label="单项结果" 
            width="100"
          >
            <template slot-scope="scope">
              <el-select 
                v-model="scope.row.itemResult" 
                placeholder="请选择" 
                size="small"
              >
                <el-option label="合格" value="合格"></el-option>
                <el-option label="不合格" value="不合格"></el-option>
              </el-select>
            </template>
          </el-table-column>
        </el-table>

        <div slot="footer" class="dialog-footer">
          <el-button @click="inspectionDetailDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveInspectionDetails">保存</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 图片上传对话框 -->
    <el-dialog 
      title="上传缺陷图片" 
      :visible.sync="imageUploadDialogVisible" 
      width="600px"
    >
      <div class="image-upload-section">
        <el-upload
          class="image-uploader"
          :action="'/api/upload/image'"
          :on-preview="handleImagePreview"
          :on-remove="handleImageRemove"
          :before-upload="beforeImageUpload"
          :limit="5"
          multiple
          list-type="picture-card"
        >
          <i class="el-icon-plus"></i>
          <div slot="tip" class="el-upload__tip">最多上传5张图片</div>
        </el-upload>

        <el-dialog
          :visible.sync="previewDialogVisible"
          width="800px"
          append-to-body
        >
          <img :src="previewImageUrl" alt="预览图片" style="width: 100%;">
        </el-dialog>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="imageUploadDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 检验报告预览 -->
    <el-dialog 
      title="检验报告预览" 
      :visible.sync="reportPreviewDialogVisible" 
      width="900px"
    >
      <div class="report-preview">
        <div class="report-header">
          <h2 style="text-align: center;">回厂检验报告</h2>
        </div>
        
        <div class="report-content">
          <!-- 报告基本信息 -->
          <div class="report-info">
            <div class="report-info-row">
              <div class="report-info-item">
                <span class="label">回厂单号：</span>
                <span class="value">{{ receiptInfo.receiptNo }}</span>
              </div>
              <div class="report-info-item">
                <span class="label">检验日期：</span>
                <span class="value">{{ formatDate(new Date()) }}</span>
              </div>
            </div>
            <div class="report-info-row">
              <div class="report-info-item">
                <span class="label">采购订单号：</span>
                <span class="value">{{ receiptInfo.purchaseOrderNo }}</span>
              </div>
              <div class="report-info-item">
                <span class="label">检验员：</span>
                <span class="value">{{ currentUser.name }}</span>
              </div>
            </div>
            <div class="report-info-row">
              <div class="report-info-item">
                <span class="label">供应商：</span>
                <span class="value">{{ receiptInfo.supplierName }}</span>
              </div>
              <div class="report-info-item">
                <span class="label">总体判定：</span>
                <span class="value" :class="getResultClass(inspectionConclusion.overallResult)">{{ inspectionConclusion.overallResult }}</span>
              </div>
            </div>
          </div>

          <!-- 报告检验项目表格 -->
          <div class="report-table">
            <h4>检验项目明细</h4>
            <el-table 
              :data="inspectionItems" 
              border 
              style="width: 100%"
              size="small"
            >
              <el-table-column prop="index" label="序号" width="60"></el-table-column>
              <el-table-column prop="itemNo" label="物料编码"></el-table-column>
              <el-table-column prop="itemName" label="物料名称"></el-table-column>
              <el-table-column prop="spec" label="规格型号"></el-table-column>
              <el-table-column prop="quantity" label="收货数量"></el-table-column>
              <el-table-column prop="inspectionQuantity" label="检验数量"></el-table-column>
              <el-table-column prop="result" label="检验结果"></el-table-column>
              <el-table-column prop="defectDescription" label="不合格描述"></el-table-column>
            </el-table>
          </div>

          <!-- 报告结论 -->
          <div class="report-conclusion">
            <h4>检验结论</h4>
            <div class="conclusion-item">
              <span class="label">总体判定：</span>
              <span class="value" :class="getResultClass(inspectionConclusion.overallResult)">{{ inspectionConclusion.overallResult }}</span>
            </div>
            <div class="conclusion-item">
              <span class="label">处理建议：</span>
              <span class="value">{{ inspectionConclusion.suggestion }}</span>
            </div>
            <div class="conclusion-item">
              <span class="label">备注：</span>
              <span class="value">{{ inspectionConclusion.remarks }}</span>
            </div>
          </div>

          <!-- 报告签字区域 -->
          <div class="report-signature">
            <div class="signature-item">
              <span>检验员签字：____________________</span>
            </div>
            <div class="signature-item">
              <span>部门主管签字：____________________</span>
            </div>
            <div class="signature-item">
              <span>日期：____________________</span>
            </div>
          </div>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="reportPreviewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="printReport">打印报告</el-button>
        <el-button type="success" @click="exportReport">导出报告</el-button>
      </div>
    </el-dialog>

    <!-- 操作按钮区域 -->
    <div class="action-buttons">
      <el-button type="primary" @click="submitInspection">提交检验结果</el-button>
      <el-button @click="previewReport">预览检验报告</el-button>
      <el-button @click="resetInspection">重置检验</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReceiptInspection',
  data() {
    return {
      // 加载状态
      loading: false,
      // 回厂单基本信息
      receiptInfo: {
        receiptNo: '',
        purchaseOrderNo: '',
        supplierName: '',
        receiptDate: '',
        arrivalMethod: '',
        status: '',
        statusText: '',
        receiverName: ''
      },
      // 当前用户信息
      currentUser: {
        id: 'U001',
        name: '张三',
        role: '检验员'
      },
      // 检验项目列表
      inspectionItems: [],
      // 批量检验模式
      isBatchMode: false,
      // 批量检验表单
      batchInspectionForm: {
        batchResult: '',
        batchRemark: ''
      },
      // 选中的行
      selectedRows: [],
      // 检验明细对话框
      inspectionDetailDialogVisible: false,
      // 选中的检验项目
      selectedItem: {},
      // 选中项目的质量检验项
      selectedItemQualityItems: [],
      // 图片上传对话框
      imageUploadDialogVisible: false,
      // 当前上传图片的项目
      currentImageItem: {},
      // 预览对话框
      previewDialogVisible: false,
      // 预览图片URL
      previewImageUrl: '',
      // 检验结论
      inspectionConclusion: {
        overallResult: '',
        suggestion: '',
        remarks: ''
      },
      // 统计信息
      statistics: {
        totalItems: 0,
        passCount: 0,
        failCount: 0,
        suspiciousCount: 0
      },
      // 检验报告预览对话框
      reportPreviewDialogVisible: false
    }
  },
  created() {
    this.loadReceiptInfo()
    this.loadInspectionItems()
  },
  methods: {
    // 返回列表
    backToList() {
      this.$router.push('/receipt/purchase-receipt-list')
    },
    
    // 加载回厂单信息
    loadReceiptInfo() {
      // 模拟从API加载数据
      this.receiptInfo = {
        receiptNo: 'RC20240520001',
        purchaseOrderNo: 'PO20240510001',
        supplierName: '上海优科科技有限公司',
        receiptDate: '2024-05-20',
        arrivalMethod: '快递',
        status: 'pending_inspection',
        statusText: '待检验',
        receiverName: '李四'
      }
    },
    
    // 加载检验项目
    loadInspectionItems() {
      this.loading = true
      // 模拟从API加载数据
      setTimeout(() => {
        this.inspectionItems = [
          {
            id: '1',
            itemNo: 'PRD001',
            itemName: 'PCB电路板',
            spec: '100x120mm',
            quantity: 500,
            unit: '片',
            inspectionQuantity: 50,
            result: '',
            defectDescription: '',
            qualityItems: [
              { id: '1-1', qualityItemName: '尺寸', standard: '100x120±0.5mm', method: '卡尺测量', actualValue: '', itemResult: '' },
              { id: '1-2', qualityItemName: '外观', standard: '无变形、无划痕', method: '目视检查', actualValue: '', itemResult: '' },
              { id: '1-3', qualityItemName: '焊点质量', standard: '饱满、无虚焊', method: '放大镜检查', actualValue: '', itemResult: '' }
            ]
          },
          {
            id: '2',
            itemNo: 'PRD002',
            itemName: '电阻器',
            spec: '10KΩ 1%',
            quantity: 1000,
            unit: '个',
            inspectionQuantity: 100,
            result: '',
            defectDescription: '',
            qualityItems: [
              { id: '2-1', qualityItemName: '阻值', standard: '10KΩ±1%', method: '万用表测量', actualValue: '', itemResult: '' },
              { id: '2-2', qualityItemName: '外观', standard: '无破损、标识清晰', method: '目视检查', actualValue: '', itemResult: '' },
              { id: '2-3', qualityItemName: '包装', standard: '完好、无受潮', method: '目视检查', actualValue: '', itemResult: '' }
            ]
          },
          {
            id: '3',
            itemNo: 'PRD003',
            itemName: '连接器',
            spec: 'USB Type-C',
            quantity: 300,
            unit: '个',
            inspectionQuantity: 30,
            result: '',
            defectDescription: '',
            qualityItems: [
              { id: '3-1', qualityItemName: '尺寸', standard: '符合Type-C标准', method: '卡尺测量', actualValue: '', itemResult: '' },
              { id: '3-2', qualityItemName: '插拔力', standard: '5-30N', method: '拉力计测试', actualValue: '', itemResult: '' },
              { id: '3-3', qualityItemName: '外观', standard: '无毛刺、无变形', method: '目视检查', actualValue: '', itemResult: '' }
            ]
          }
        ]
        
        // 更新序号
        this.inspectionItems.forEach((item, index) => {
          item.index = index + 1
        })
        
        this.updateStatistics()
        this.loading = false
      }, 500)
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    
    // 获取状态标签类型
    getStatusTagType(status) {
      const statusMap = {
        'pending_inspection': 'info',
        'inspecting': 'processing',
        'inspected': 'success',
        'rejected': 'danger',
        'concession': 'warning'
      }
      return statusMap[status] || 'info'
    },
    
    // 切换批量模式
    toggleBatchMode() {
      this.isBatchMode = !this.isBatchMode
      this.selectedRows = []
    },
    
    // 处理选择变化
    handleSelectionChange(val) {
      this.selectedRows = val
    },
    
    // 应用批量检验
    applyBatchInspection() {
      if (!this.batchInspectionForm.batchResult) {
        this.$message.warning('请选择批量判定结果')
        return
      }
      
      if (this.selectedRows.length === 0) {
        this.$message.warning('请选择要批量检验的项目')
        return
      }
      
      this.selectedRows.forEach(row => {
        row.result = this.batchInspectionForm.batchResult
        if (this.batchInspectionForm.batchRemark) {
          row.defectDescription = this.batchInspectionForm.batchRemark
        }
      })
      
      this.updateStatistics()
      this.toggleBatchMode()
      this.batchInspectionForm = {
        batchResult: '',
        batchRemark: ''
      }
      this.$message.success('批量检验应用成功')
    },
    
    // 取消批量模式
    cancelBatchMode() {
      this.isBatchMode = false
      this.selectedRows = []
      this.batchInspectionForm = {
        batchResult: '',
        batchRemark: ''
      }
    },
    
    // 打开检验明细对话框
    openInspectionDetailDialog(item) {
      this.selectedItem = { ...item }
      this.selectedItemQualityItems = JSON.parse(JSON.stringify(item.qualityItems))
      this.inspectionDetailDialogVisible = true
    },
    
    // 保存检验明细
    saveInspectionDetails() {
      // 更新原数据
      const index = this.inspectionItems.findIndex(item => item.id === this.selectedItem.id)
      if (index !== -1) {
        this.inspectionItems[index].qualityItems = JSON.parse(JSON.stringify(this.selectedItemQualityItems))
        
        // 根据明细结果计算总体结果
        const hasFail = this.selectedItemQualityItems.some(item => item.itemResult === '不合格')
        const hasEmpty = this.selectedItemQualityItems.some(item => !item.itemResult)
        
        if (hasFail) {
          this.inspectionItems[index].result = '不合格'
        } else if (hasEmpty) {
          this.inspectionItems[index].result = '待确认'
        } else {
          this.inspectionItems[index].result = '合格'
        }
        
        this.updateStatistics()
        this.inspectionDetailDialogVisible = false
        this.$message.success('检验明细保存成功')
      }
    },
    
    // 上传缺陷图片
    uploadDefectImage(item) {
      this.currentImageItem = item
      this.imageUploadDialogVisible = true
    },
    
    // 处理图片预览
    handleImagePreview(file) {
      this.previewImageUrl = file.url || file.response.url
      this.previewDialogVisible = true
    },
    
    // 处理图片删除
    handleImageRemove(file, fileList) {
      console.log('图片已删除:', file)
    },
    
    // 上传前校验
    beforeImageUpload(file) {
      const isJPG = file.type === 'image/jpeg'
      const isPNG = file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPG && !isPNG) {
        this.$message.error('上传图片只能是 JPG/PNG 格式!')
      }
      if (!isLt2M) {
        this.$message.error('上传图片大小不能超过 2MB!')
      }
      return (isJPG || isPNG) && isLt2M
    },
    
    // 更新总体结果
    updateOverallResult() {
      // 可以在这里添加一些业务逻辑，比如根据检验结论自动更新某些字段
    },
    
    // 更新统计信息
    updateStatistics() {
      this.statistics.totalItems = this.inspectionItems.length
      this.statistics.passCount = this.inspectionItems.filter(item => item.result === '合格').length
      this.statistics.failCount = this.inspectionItems.filter(item => item.result === '不合格').length
      this.statistics.suspiciousCount = this.inspectionItems.filter(item => item.result === '待确认').length
    },
    
    // 保存检验结果
    saveInspectionResults() {
      this.loading = true
      
      // 模拟保存操作
      setTimeout(() => {
        this.loading = false
        this.$message.success('检验结果保存成功')
      }, 500)
    },
    
    // 提交检验结果
    submitInspection() {
      // 验证是否所有项目都已检验
      const unInspectedItems = this.inspectionItems.filter(item => !item.result)
      if (unInspectedItems.length > 0) {
        this.$message.warning(`还有 ${unInspectedItems.length} 个项目未检验，请完成检验后再提交`)
        return
      }
      
      if (!this.inspectionConclusion.overallResult) {
        this.$message.warning('请填写总体判定结论')
        return
      }
      
      this.$confirm('确定要提交检验结果吗？提交后将无法修改。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.loading = true
        
        // 模拟提交操作
        setTimeout(() => {
          this.loading = false
          this.$message.success('检验结果提交成功')
          this.receiptInfo.status = 'inspected'
          this.receiptInfo.statusText = '已检验'
        }, 1000)
      }).catch(() => {
        // 取消操作
      })
    },
    
    // 预览检验报告
    previewReport() {
      this.reportPreviewDialogVisible = true
    },
    
    // 打印报告
    printReport() {
      // 实际项目中可以调用打印API或生成PDF
      window.print()
      this.$message.success('报告打印成功')
    },
    
    // 导出报告
    exportReport() {
      // 模拟导出操作
      this.$message.success('报告导出成功')
    },
    
    // 重置检验
    resetInspection() {
      this.$confirm('确定要重置检验结果吗？这将清除所有已填写的检验数据。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }).then(() => {
        this.loadInspectionItems()
        this.inspectionConclusion = {
          overallResult: '',
          suggestion: '',
          remarks: ''
        }
        this.$message.success('检验数据已重置')
      }).catch(() => {
        // 取消操作
      })
    },
    
    // 获取结果样式类
    getResultClass(result) {
      const resultMap = {
        '合格': 'result-pass',
        '不合格': 'result-fail',
        '让步接收': 'result-concession'
      }
      return resultMap[result] || ''
    }
  }
}
</script>

<style scoped>
.receipt-inspection-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 0 20px;
  font-size: 20px;
  font-weight: 500;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.info-section {
  padding-top: 10px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
}

.info-item .label {
  width: 80px;
  color: #606266;
  font-size: 14px;
}

.info-item .value {
  flex: 1;
  color: #303133;
  font-size: 14px;
}

.statistics-section {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.conclusion-section {
  padding-top: 10px;
}

.batch-inspection {
  background-color: #f5f7fa;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.inspection-detail {
  padding: 10px 0;
}

.inspection-detail h4 {
  margin: 20px 0 10px 0;
  font-size: 16px;
  font-weight: 500;
}

.image-upload-section {
  padding: 10px 0;
}

.image-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.image-uploader .el-upload:hover {
  border-color: #409eff;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

/* 报告样式 */
.report-preview {
  padding: 20px;
}

.report-header {
  margin-bottom: 30px;
}

.report-info {
  background-color: #f5f7fa;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.report-info-row {
  display: flex;
  margin-bottom: 10px;
}

.report-info-item {
  margin-right: 30px;
}

.report-info-item .label {
  color: #606266;
  margin-right: 5px;
}

.report-info-item .value {
  color: #303133;
  font-weight: 500;
}

.report-table {
  margin-bottom: 30px;
}

.report-table h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 500;
}

.report-conclusion {
  margin-bottom: 30px;
}

.report-conclusion h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 500;
}

.conclusion-item {
  margin-bottom: 10px;
}

.conclusion-item .label {
  color: #606266;
  margin-right: 10px;
  font-weight: 500;
}

.conclusion-item .value {
  color: #303133;
}

.report-signature {
  border-top: 1px solid #dcdfe6;
  padding-top: 20px;
  display: flex;
  justify-content: space-around;
}

.signature-item {
  text-align: center;
}

/* 结果样式 */
.result-pass {
  color: #67c23a;
  font-weight: bold;
}

.result-fail {
  color: #f56c6c;
  font-weight: bold;
}

.result-concession {
  color: #e6a23c;
  font-weight: bold;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .el-row {
    display: block;
  }
  
  .el-col {
    width: 100% !important;
  }
  
  .basic-info-card,
  .statistics-card,
  .conclusion-card {
    margin-bottom: 20px;
  }
}
</style>