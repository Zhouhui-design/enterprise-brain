<template>
  <div class="receipt-approve-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button type="primary" @click="backToList" size="mini">返回列表</el-button>
      <h2>回厂单审批</h2>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：基本信息和审批状态 -->
      <el-col :span="6">
        <!-- 基本信息 -->
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
              <span class="label">总金额：</span>
              <span class="value price">{{ formatCurrency(receiptInfo.totalAmount) }}</span>
            </div>
            <div class="info-item">
              <span class="label">总数量：</span>
              <span class="value">{{ receiptInfo.totalQuantity }} {{ receiptInfo.unit }}</span>
            </div>
            <div class="info-item">
              <span class="label">收货人：</span>
              <span class="value">{{ receiptInfo.receiverName }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建人：</span>
              <span class="value">{{ receiptInfo.createBy }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间：</span>
              <span class="value">{{ formatDateTime(receiptInfo.createTime) }}</span>
            </div>
          </div>
        </el-card>

        <!-- 审批状态 -->
        <el-card class="approval-status-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>审批状态</span>
            </div>
          </template>
          
          <div class="status-section">
            <div class="status-item">
              <span class="label">当前状态：</span>
              <el-tag :type="getStatusTagType(receiptInfo.status)">{{ receiptInfo.statusText }}</el-tag>
            </div>
            <div class="status-item">
              <span class="label">当前审批节点：</span>
              <span class="value">{{ currentApprovalNode.name }}</span>
            </div>
            <div class="status-item">
              <span class="label">审批人：</span>
              <span class="value">{{ currentApprovalNode.approverName }}</span>
            </div>
            <div class="status-item">
              <span class="label">审批期限：</span>
              <span class="value">{{ formatDateTime(currentApprovalNode.deadline) }}</span>
            </div>
            <div class="status-item">
              <span class="label">优先级：</span>
              <el-tag :type="getPriorityTagType(receiptInfo.priority)">{{ receiptInfo.priority }}</el-tag>
            </div>
          </div>
        </el-card>

        <!-- 检验结果摘要 -->
        <el-card class="inspection-summary-card" v-if="inspectionSummary" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>检验结果摘要</span>
              <el-button 
                type="text" 
                size="mini" 
                @click="viewInspectionReport"
                class="view-report-btn"
              >
                查看详情
              </el-button>
            </div>
          </template>
          
          <div class="inspection-summary-section">
            <div class="summary-item">
              <span class="label">检验结论：</span>
              <el-tag :type="getInspectionResultTagType(inspectionSummary.overallResult)">
                {{ inspectionSummary.overallResult }}
              </el-tag>
            </div>
            <div class="summary-item">
              <span class="label">检验员：</span>
              <span class="value">{{ inspectionSummary.inspector }}</span>
            </div>
            <div class="summary-item">
              <span class="label">检验时间：</span>
              <span class="value">{{ formatDateTime(inspectionSummary.inspectionTime) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">合格项数：</span>
              <span class="value success">{{ inspectionSummary.passCount }}</span>
            </div>
            <div class="summary-item">
              <span class="label">不合格项数：</span>
              <span class="value danger">{{ inspectionSummary.failCount }}</span>
            </div>
            <div class="summary-item" v-if="inspectionSummary.suggestion">
              <span class="label">处理建议：</span>
              <span class="value">{{ inspectionSummary.suggestion }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：明细列表、审批历史和审批表单 -->
      <el-col :span="18">
        <!-- 标签页 -->
        <el-tabs v-model="activeTab" class="approval-tabs">
          <!-- 回厂单明细 -->
          <el-tab-pane label="回厂单明细" name="details">
            <el-card>
              <el-table 
                :data="receiptItems" 
                border 
                style="width: 100%"
                size="small"
              >
                <el-table-column prop="index" label="序号" width="60"></el-table-column>
                <el-table-column prop="itemNo" label="物料编码" width="120"></el-table-column>
                <el-table-column prop="itemName" label="物料名称" width="180"></el-table-column>
                <el-table-column prop="spec" label="规格型号" width="150"></el-table-column>
                <el-table-column prop="quantity" label="收货数量" width="100" align="right"></el-table-column>
                <el-table-column prop="unit" label="单位" width="80"></el-table-column>
                <el-table-column prop="unitPrice" label="单价" width="100" align="right">
                  <template slot-scope="scope">
                    {{ formatCurrency(scope.row.unitPrice) }}
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="金额" width="120" align="right">
                  <template slot-scope="scope">
                    {{ formatCurrency(scope.row.amount) }}
                  </template>
                </el-table-column>
                <el-table-column prop="inspectionResult" label="检验结果" width="100">
                  <template slot-scope="scope">
                    <el-tag 
                      v-if="scope.row.inspectionResult" 
                      :type="getInspectionResultTagType(scope.row.inspectionResult)"
                    >
                      {{ scope.row.inspectionResult }}
                    </el-tag>
                    <span v-else class="text-gray">待检验</span>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" min-width="150"></el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>

          <!-- 审批历史 -->
          <el-tab-pane label="审批历史" name="history">
            <el-card>
              <div class="approval-history">
                <div 
                  v-for="(history, index) in approvalHistory" 
                  :key="history.id" 
                  class="history-item"
                  :class="{ 'last-item': index === approvalHistory.length - 1 }"
                >
                  <div class="history-timeline">
                    <div class="timeline-node"></div>
                    <div v-if="!history.isLast" class="timeline-line"></div>
                  </div>
                  <div class="history-content">
                    <div class="history-header">
                      <span class="history-node-name">{{ history.nodeName }}</span>
                      <el-tag :type="getApprovalResultTagType(history.result)">
                        {{ history.result }}
                      </el-tag>
                    </div>
                    <div class="history-info">
                      <div class="info-item">
                        <i class="el-icon-user"></i>
                        <span class="label">审批人：</span>
                        <span class="value">{{ history.approverName }}</span>
                      </div>
                      <div class="info-item">
                        <i class="el-icon-time"></i>
                        <span class="label">审批时间：</span>
                        <span class="value">{{ formatDateTime(history.approveTime) }}</span>
                      </div>
                      <div class="info-item" v-if="history.opinion">
                        <i class="el-icon-chat-line-round"></i>
                        <span class="label">审批意见：</span>
                        <span class="value">{{ history.opinion }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 当前审批节点 -->
                <div v-if="!isApproved" class="history-item">
                  <div class="history-timeline">
                    <div class="timeline-node current"></div>
                    <div class="timeline-line"></div>
                  </div>
                  <div class="history-content current">
                    <div class="history-header">
                      <span class="history-node-name">{{ currentApprovalNode.name }}</span>
                      <el-tag type="info">审批中</el-tag>
                    </div>
                    <div class="history-info">
                      <div class="info-item">
                        <i class="el-icon-user"></i>
                        <span class="label">当前审批人：</span>
                        <span class="value">{{ currentApprovalNode.approverName }}</span>
                      </div>
                      <div class="info-item">
                        <i class="el-icon-time"></i>
                        <span class="label">开始时间：</span>
                        <span class="value">{{ formatDateTime(currentApprovalNode.startTime) }}</span>
                      </div>
                      <div class="info-item">
                        <i class="el-icon-timer"></i>
                        <span class="label">剩余时间：</span>
                        <span class="value">{{ getRemainingTime(currentApprovalNode.deadline) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 待审批节点 -->
                <div v-for="(node, index) in remainingApprovalNodes" :key="node.id" class="history-item">
                  <div class="history-timeline">
                    <div class="timeline-node pending"></div>
                    <div v-if="index !== remainingApprovalNodes.length - 1" class="timeline-line pending"></div>
                  </div>
                  <div class="history-content pending">
                    <div class="history-header">
                      <span class="history-node-name">{{ node.name }}</span>
                      <el-tag type="warning">待审批</el-tag>
                    </div>
                    <div class="history-info">
                      <div class="info-item">
                        <i class="el-icon-user"></i>
                        <span class="label">预计审批人：</span>
                        <span class="value">{{ node.approverName }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-tab-pane>

          <!-- 审批操作 -->
          <el-tab-pane label="审批操作" name="approve" v-if="canApprove">
            <el-card>
              <el-form :model="approvalForm" :rules="approvalRules" ref="approvalForm" label-width="100px">
                <el-form-item label="审批结论：" prop="result">
                  <el-radio-group v-model="approvalForm.result">
                    <el-radio label="同意">同意</el-radio>
                    <el-radio label="拒绝">拒绝</el-radio>
                    <el-radio label="退回">退回</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="审批意见：" prop="opinion">
                  <el-input 
                    v-model="approvalForm.opinion" 
                    type="textarea" 
                    :rows="5"
                    placeholder="请输入审批意见"
                  ></el-input>
                </el-form-item>
                
                <el-form-item label="附件上传：" v-if="showAttachmentUpload">
                  <el-upload
                    class="upload-demo"
                    :action="'/api/upload/file'"
                    :on-preview="handleFilePreview"
                    :on-remove="handleFileRemove"
                    :before-upload="beforeFileUpload"
                    multiple
                    :limit="5"
                    :on-exceed="handleFileExceed"
                    :file-list="fileList"
                    accept=".doc,.docx,.pdf,.xls,.xlsx"
                  >
                    <el-button size="small" type="primary">点击上传</el-button>
                    <div slot="tip" class="el-upload__tip">
                      只能上传Word、Excel、PDF文件，最多上传5个文件
                    </div>
                  </el-upload>
                </el-form-item>
                
                <el-form-item label="审批方式：">
                  <el-radio-group v-model="approvalForm.approveMethod">
                    <el-radio label="普通审批">普通审批</el-radio>
                    <el-radio label="紧急审批">紧急审批</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="下一审批人：" v-if="approvalForm.result === '同意' && showNextApproverSelect">
                  <el-select 
                    v-model="approvalForm.nextApproverId" 
                    placeholder="请选择下一审批人" 
                    filterable
                    style="width: 300px;"
                  >
                    <el-option 
                      v-for="user in availableApprovers" 
                      :key="user.id" 
                      :label="user.name" 
                      :value="user.id"
                    ></el-option>
                  </el-select>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="submitApproval">提交审批</el-button>
                  <el-button @click="resetApprovalForm">重置</el-button>
                  <el-button type="text" @click="delegateApproval">转交审批</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>
          
          <!-- 转交审批对话框 -->
          <el-dialog 
            title="转交审批" 
            :visible.sync="delegateDialogVisible" 
            width="500px"
          >
            <el-form :model="delegateForm" :rules="delegateRules" ref="delegateForm" label-width="100px">
              <el-form-item label="转交人员：" prop="delegateTo">
                <el-select 
                  v-model="delegateForm.delegateTo" 
                  placeholder="请选择转交人员" 
                  filterable
                  style="width: 300px;"
                >
                  <el-option 
                    v-for="user in delegateUsers" 
                    :key="user.id" 
                    :label="user.name" 
                    :value="user.id"
                  ></el-option>
                </el-select>
              </el-form-item>
              
              <el-form-item label="转交原因：" prop="reason">
                <el-input 
                  v-model="delegateForm.reason" 
                  type="textarea" 
                  :rows="4"
                  placeholder="请输入转交原因"
                ></el-input>
              </el-form-item>
            </el-form>
            
            <div slot="footer" class="dialog-footer">
              <el-button @click="delegateDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="confirmDelegate">确认转交</el-button>
            </div>
          </el-dialog>
        </el-tabs>
      </el-col>
    </el-row>

    <!-- 检验报告预览 -->
    <el-dialog 
      title="检验报告" 
      :visible.sync="inspectionReportDialogVisible" 
      width="900px"
    >
      <div class="inspection-report">
        <!-- 这里可以嵌入完整的检验报告内容 -->
        <div class="report-placeholder">
          <h3>检验报告详情</h3>
          <p>报告编号：{{ inspectionSummary.reportNo }}</p>
          <p>报告生成时间：{{ formatDateTime(inspectionSummary.reportTime) }}</p>
          <!-- 在实际项目中，这里可以嵌入详细的检验报告内容，可能是一个PDF预览或HTML格式的报告 -->
          <el-button type="primary" @click="downloadInspectionReport">下载报告</el-button>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="inspectionReportDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 附件预览对话框 -->
    <el-dialog 
      title="附件预览" 
      :visible.sync="filePreviewDialogVisible" 
      width="800px"
    >
      <div class="file-preview">
        <h3>{{ currentPreviewFile.name }}</h3>
        <p>文件大小：{{ formatFileSize(currentPreviewFile.size) }}</p>
        <p>上传时间：{{ formatDateTime(currentPreviewFile.uploadTime) }}</p>
        <!-- 在实际项目中，这里可以根据文件类型嵌入不同的预览组件 -->
        <div class="preview-placeholder">
          <p>文件预览功能需要根据文件类型实现</p>
          <el-button type="primary" @click="downloadFile(currentPreviewFile)">下载文件</el-button>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="filePreviewDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 操作按钮区域 -->
    <div class="action-buttons" v-if="canApprove">
      <el-button type="primary" @click="submitApproval">提交审批</el-button>
      <el-button @click="saveDraft">保存草稿</el-button>
      <el-button type="warning" @click="delegateApproval">转交审批</el-button>
      <el-button type="danger" @click="rejectApproval">直接拒绝</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReceiptApprove',
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
        totalAmount: 0,
        totalQuantity: 0,
        unit: '',
        receiverName: '',
        createBy: '',
        createTime: '',
        status: '',
        statusText: '',
        priority: ''
      },
      // 当前审批节点
      currentApprovalNode: {
        id: '',
        name: '',
        approverId: '',
        approverName: '',
        startTime: '',
        deadline: ''
      },
      // 剩余审批节点
      remainingApprovalNodes: [],
      // 审批历史
      approvalHistory: [],
      // 回厂单明细
      receiptItems: [],
      // 检验结果摘要
      inspectionSummary: null,
      // 标签页
      activeTab: 'details',
      // 是否可以审批
      canApprove: true,
      // 是否已审批完成
      isApproved: false,
      // 审批表单
      approvalForm: {
        result: '',
        opinion: '',
        approveMethod: '普通审批',
        nextApproverId: ''
      },
      // 审批表单规则
      approvalRules: {
        result: [
          { required: true, message: '请选择审批结论', trigger: 'change' }
        ],
        opinion: [
          { required: true, message: '请输入审批意见', trigger: 'blur' },
          { min: 10, max: 500, message: '审批意见长度在 10 到 500 个字符', trigger: 'blur' }
        ]
      },
      // 显示附件上传
      showAttachmentUpload: true,
      // 显示下一审批人选择
      showNextApproverSelect: false,
      // 可用的下一审批人
      availableApprovers: [],
      // 文件列表
      fileList: [],
      // 转交对话框
      delegateDialogVisible: false,
      // 转交表单
      delegateForm: {
        delegateTo: '',
        reason: ''
      },
      // 转交表单规则
      delegateRules: {
        delegateTo: [
          { required: true, message: '请选择转交人员', trigger: 'change' }
        ],
        reason: [
          { required: true, message: '请输入转交原因', trigger: 'blur' },
          { min: 5, max: 200, message: '转交原因长度在 5 到 200 个字符', trigger: 'blur' }
        ]
      },
      // 可转交的用户列表
      delegateUsers: [],
      // 检验报告对话框
      inspectionReportDialogVisible: false,
      // 文件预览对话框
      filePreviewDialogVisible: false,
      // 当前预览文件
      currentPreviewFile: {}
    }
  },
  created() {
    this.loadReceiptInfo()
    this.loadApprovalProcess()
    this.loadReceiptItems()
    this.loadInspectionSummary()
    this.loadApprovers()
  },
  computed: {
    // 获取审批期限剩余时间
    remainingTime() {
      if (!this.currentApprovalNode.deadline) return ''
      const now = new Date()
      const deadline = new Date(this.currentApprovalNode.deadline)
      const diff = deadline - now
      
      if (diff <= 0) return '已过期'
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (days > 0) {
        return `${days}天 ${hours}小时 ${minutes}分钟`
      } else if (hours > 0) {
        return `${hours}小时 ${minutes}分钟`
      } else {
        return `${minutes}分钟`
      }
    }
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
        totalAmount: 156800.50,
        totalQuantity: 1800,
        unit: '件',
        receiverName: '李四',
        createBy: '张三',
        createTime: '2024-05-20 10:30:00',
        status: 'pending_approval',
        statusText: '待审批',
        priority: '普通'
      }
    },
    
    // 加载审批流程信息
    loadApprovalProcess() {
      // 模拟加载审批流程数据
      this.approvalHistory = [
        {
          id: '1',
          nodeName: '部门经理审批',
          approverId: 'U002',
          approverName: '王经理',
          approveTime: '2024-05-20 14:30:00',
          result: '同意',
          opinion: '同意采购回厂，请财务部门审核。',
          isLast: false
        }
      ]
      
      this.currentApprovalNode = {
        id: '2',
        name: '财务部门审批',
        approverId: 'U003',
        approverName: '李财务',
        startTime: '2024-05-20 14:35:00',
        deadline: '2024-05-22 14:35:00'
      }
      
      this.remainingApprovalNodes = [
        {
          id: '3',
          name: '总经理审批',
          approverId: 'U004',
          approverName: '张总'
        }
      ]
      
      // 检查当前用户是否为审批人
      const currentUserId = 'U003' // 模拟当前用户ID
      this.canApprove = currentUserId === this.currentApprovalNode.approverId
    },
    
    // 加载回厂单明细
    loadReceiptItems() {
      // 模拟加载明细数据
      this.receiptItems = [
        {
          id: '1',
          index: 1,
          itemNo: 'PRD001',
          itemName: 'PCB电路板',
          spec: '100x120mm',
          quantity: 500,
          unit: '片',
          unitPrice: 280.50,
          amount: 140250.00,
          inspectionResult: '合格',
          remark: ''
        },
        {
          id: '2',
          index: 2,
          itemNo: 'PRD002',
          itemName: '电阻器',
          spec: '10KΩ 1%',
          quantity: 1000,
          unit: '个',
          unitPrice: 0.85,
          amount: 850.00,
          inspectionResult: '合格',
          remark: ''
        },
        {
          id: '3',
          index: 3,
          itemNo: 'PRD003',
          itemName: '连接器',
          spec: 'USB Type-C',
          quantity: 300,
          unit: '个',
          unitPrice: 52.25,
          amount: 15675.50,
          inspectionResult: '让步接收',
          remark: '外观轻微瑕疵，不影响使用'
        }
      ]
    },
    
    // 加载检验结果摘要
    loadInspectionSummary() {
      // 模拟加载检验结果
      this.inspectionSummary = {
        reportNo: 'IR20240520001',
        overallResult: '合格',
        inspector: '赵检验',
        inspectionTime: '2024-05-20 11:30:00',
        reportTime: '2024-05-20 12:00:00',
        passCount: 2,
        failCount: 0,
        concessionCount: 1,
        suggestion: '连接器有轻微外观问题，建议与供应商沟通改进。'
      }
    },
    
    // 加载审批人列表
    loadApprovers() {
      // 模拟加载审批人数据
      this.availableApprovers = [
        { id: 'U004', name: '张总', position: '总经理' },
        { id: 'U005', name: '刘副总', position: '副总经理' }
      ]
      
      this.delegateUsers = [
        { id: 'U004', name: '张总', position: '总经理' },
        { id: 'U005', name: '刘副总', position: '副总经理' },
        { id: 'U006', name: '孙财务', position: '财务主管' }
      ]
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
    
    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return ''
      const d = new Date(dateTime)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const seconds = String(d.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    
    // 格式化货币
    formatCurrency(value) {
      if (value === null || value === undefined || isNaN(value)) return '¥0.00'
      return `¥${Number(value).toFixed(2)}`
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    // 获取状态标签类型
    getStatusTagType(status) {
      const statusMap = {
        'pending_inspection': 'info',
        'inspecting': 'processing',
        'pending_approval': 'warning',
        'approved': 'success',
        'rejected': 'danger',
        'concession': 'warning'
      }
      return statusMap[status] || 'info'
    },
    
    // 获取优先级标签类型
    getPriorityTagType(priority) {
      const priorityMap = {
        '紧急': 'danger',
        '高': 'warning',
        '普通': 'info',
        '低': 'success'
      }
      return priorityMap[priority] || 'info'
    },
    
    // 获取检验结果标签类型
    getInspectionResultTagType(result) {
      const resultMap = {
        '合格': 'success',
        '不合格': 'danger',
        '让步接收': 'warning',
        '待检验': 'info'
      }
      return resultMap[result] || 'info'
    },
    
    // 获取审批结果标签类型
    getApprovalResultTagType(result) {
      const resultMap = {
        '同意': 'success',
        '拒绝': 'danger',
        '退回': 'warning'
      }
      return resultMap[result] || 'info'
    },
    
    // 获取剩余时间
    getRemainingTime(deadline) {
      if (!deadline) return ''
      const now = new Date()
      const deadlineDate = new Date(deadline)
      const diff = deadlineDate - now
      
      if (diff <= 0) return '已过期'
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (days > 0) {
        return `${days}天 ${hours}小时 ${minutes}分钟`
      } else if (hours > 0) {
        return `${hours}小时 ${minutes}分钟`
      } else {
        return `${minutes}分钟`
      }
    },
    
    // 查看检验报告
    viewInspectionReport() {
      this.inspectionReportDialogVisible = true
    },
    
    // 下载检验报告
    downloadInspectionReport() {
      // 模拟下载操作
      this.$message.success('检验报告下载成功')
    },
    
    // 处理文件预览
    handleFilePreview(file) {
      this.currentPreviewFile = file
      this.filePreviewDialogVisible = true
    },
    
    // 处理文件删除
    handleFileRemove(file, fileList) {
      this.fileList = fileList
      console.log('文件已删除:', file)
    },
    
    // 上传前校验
    beforeFileUpload(file) {
      const allowedTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      const isAllowedType = allowedTypes.includes(file.type)
      const isLt10M = file.size / 1024 / 1024 < 10

      if (!isAllowedType) {
        this.$message.error('上传文件只能是 Word、Excel、PDF 格式!')
      }
      if (!isLt10M) {
        this.$message.error('上传文件大小不能超过 10MB!')
      }
      return isAllowedType && isLt10M
    },
    
    // 处理文件超出限制
    handleFileExceed(files, fileList) {
      this.$message.warning(`当前限制上传 5 个文件，本次选择了 ${files.length} 个文件，已自动过滤多余的文件。`)
    },
    
    // 下载文件
    downloadFile(file) {
      // 模拟下载操作
      this.$message.success(`文件 ${file.name} 下载成功`)
    },
    
    // 提交审批
    submitApproval() {
      this.$refs.approvalForm.validate((valid) => {
        if (valid) {
          // 检查是否需要选择下一审批人
          if (this.approvalForm.result === '同意' && this.showNextApproverSelect && !this.approvalForm.nextApproverId) {
            this.$message.warning('请选择下一审批人')
            return
          }
          
          this.$confirm('确定要提交审批吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            this.loading = true
            
            // 模拟提交操作
            setTimeout(() => {
              this.loading = false
              this.$message.success('审批提交成功')
              
              // 更新状态
              if (this.approvalForm.result === '同意') {
                this.receiptInfo.status = 'approved'
                this.receiptInfo.statusText = '已通过'
              } else if (this.approvalForm.result === '拒绝') {
                this.receiptInfo.status = 'rejected'
                this.receiptInfo.statusText = '已拒绝'
              } else if (this.approvalForm.result === '退回') {
                this.receiptInfo.status = 'pending_inspection'
                this.receiptInfo.statusText = '已退回'
              }
              
              this.canApprove = false
              this.isApproved = true
              
              // 刷新审批历史
              this.loadApprovalProcess()
            }, 1000)
          }).catch(() => {
            // 取消操作
          })
        } else {
          console.log('表单验证失败')
          return false
        }
      })
    },
    
    // 重置审批表单
    resetApprovalForm() {
      this.$refs.approvalForm.resetFields()
      this.approvalForm.approveMethod = '普通审批'
      this.fileList = []
    },
    
    // 保存草稿
    saveDraft() {
      this.$message.success('草稿保存成功')
    },
    
    // 转交审批
    delegateApproval() {
      this.delegateDialogVisible = true
    },
    
    // 确认转交
    confirmDelegate() {
      this.$refs.delegateForm.validate((valid) => {
        if (valid) {
          this.$confirm('确定要转交审批吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            this.loading = true
            
            // 模拟转交操作
            setTimeout(() => {
              this.loading = false
              this.delegateDialogVisible = false
              this.$message.success('审批转交成功')
              this.canApprove = false
              
              // 重置转交表单
              this.$refs.delegateForm.resetFields()
            }, 800)
          }).catch(() => {
            // 取消操作
          })
        } else {
          console.log('表单验证失败')
          return false
        }
      })
    },
    
    // 直接拒绝
    rejectApproval() {
      this.$confirm('确定要直接拒绝此回厂单吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }).then(() => {
        this.approvalForm.result = '拒绝'
        this.approvalForm.opinion = this.approvalForm.opinion || '不符合要求，拒绝审批'
        this.submitApproval()
      }).catch(() => {
        // 取消操作
      })
    }
  }
}
</script>

<style scoped>
.receipt-approve-container {
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

.view-report-btn {
  padding: 0;
  font-size: 12px;
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

.info-item .value.price {
  color: #f56c6c;
  font-weight: bold;
}

.status-section,
.inspection-summary-section {
  padding-top: 10px;
}

.status-item,
.summary-item {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.status-item .label,
.summary-item .label {
  width: 100px;
  color: #606266;
  font-size: 14px;
}

.status-item .value,
.summary-item .value {
  flex: 1;
  color: #303133;
  font-size: 14px;
}

.summary-item .value.success {
  color: #67c23a;
  font-weight: bold;
}

.summary-item .value.danger {
  color: #f56c6c;
  font-weight: bold;
}

.approval-tabs {
  margin-bottom: 20px;
}

.text-gray {
  color: #909399;
}

/* 审批历史样式 */
.approval-history {
  padding: 20px 0;
}

.history-item {
  display: flex;
  margin-bottom: 20px;
  position: relative;
}

.history-timeline {
  width: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-node {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #67c23a;
  position: relative;
  z-index: 1;
}

.timeline-node.current {
  background-color: #409eff;
  width: 20px;
  height: 20px;
  border: 2px solid #d9ecff;
}

.timeline-node.pending {
  background-color: #e4e7ed;
}

.timeline-line {
  width: 2px;
  flex: 1;
  background-color: #e4e7ed;
  margin-top: -4px;
  margin-bottom: -4px;
}

.timeline-line.pending {
  background-color: #f5f7fa;
}

.history-content {
  flex: 1;
  margin-left: 15px;
  padding: 15px;
  background-color: #f0f9eb;
  border-radius: 4px;
  position: relative;
  min-height: 100px;
}

.history-content.current {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.history-content.pending {
  background-color: #fafafa;
  opacity: 0.6;
}

.history-content::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 20px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 8px 8px 0;
  border-color: transparent #f0f9eb transparent transparent;
}

.history-content.current::before {
  border-color: transparent #ecf5ff transparent transparent;
}

.history-content.pending::before {
  border-color: transparent #fafafa transparent transparent;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-node-name {
  font-weight: bold;
  color: #303133;
}

.history-info .info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.history-info .info-item i {
  color: #909399;
  margin-right: 5px;
}

.history-info .info-item .label {
  color: #606266;
  margin-right: 5px;
}

.history-info .info-item .value {
  color: #303133;
}

/* 附件上传样式 */
.upload-demo {
  margin-top: 10px;
}

/* 操作按钮 */
.action-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 报告和文件预览 */
.inspection-report,
.file-preview {
  padding: 20px;
}

.report-placeholder,
.preview-placeholder {
  text-align: center;
  padding: 40px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-top: 20px;
}

.report-placeholder h3,
.preview-placeholder h3 {
  margin-bottom: 20px;
  color: #303133;
}

.report-placeholder p,
.preview-placeholder p {
  margin-bottom: 10px;
  color: #606266;
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
  .approval-status-card,
  .inspection-summary-card {
    margin-bottom: 20px;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .receipt-approve-container {
    padding: 10px;
  }
  
  .info-item,
  .status-item,
  .summary-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-item .label,
  .status-item .label,
  .summary-item .label {
    width: auto;
    margin-bottom: 5px;
  }
  
  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>