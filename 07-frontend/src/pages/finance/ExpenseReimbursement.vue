<template>
  <CommonFinanceTemplate
    pageTitle="费用报销管理"
    :table-data="reimbursementData"
    :show-search="true"
    :show-table="true"
    :show-pagination="true"
    :show-statistics="true"
    :show-selection="true"
    ref="templateRef"
    @search="handleSearch"
    @reset="handleReset"
    @page-change="handlePageChange"
    @mounted="handleMounted"
  >
    <!-- 表格操作列自定义内容 -->
    <template #operation="{ row }">
      <template v-if="row.status === 'DRAFT'">
        <el-button type="primary" size="small" @click="handleEditReimbursement(row)">编辑</el-button>
        <el-button type="success" size="small" @click="handleSubmitReimbursement(row)">提交</el-button>
        <el-button type="danger" size="small" @click="handleDeleteReimbursement(row)">删除</el-button>
      </template>
      <template v-else-if="row.status === 'PENDING'">
        <el-button type="info" size="small" @click="handleViewReimbursement(row)">查看</el-button>
        <el-button v-if="isApprover(row)" type="primary" size="small" @click="handleApproveReimbursement(row)">审批</el-button>
        <el-button v-if="isCreator(row)" type="warning" size="small" @click="handleWithdrawReimbursement(row)">撤回</el-button>
      </template>
      <template v-else-if="row.status === 'APPROVED'">
        <el-button type="info" size="small" @click="handleViewReimbursement(row)">查看</el-button>
        <el-button v-if="canProcessPayment(row)" type="success" size="small" @click="handleProcessPayment(row)">付款</el-button>
      </template>
      <template v-else>
        <el-button type="info" size="small" @click="handleViewReimbursement(row)">查看</el-button>
      </template>
    </template>
    
    <!-- 报销状态标签 -->
    <template #status="{ row }">
      <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
    </template>
    
    <!-- 部门名称显示 -->
    <template #department="{ row }">
      {{ getDepartmentName(row.departmentId) }}
    </template>
    
    <!-- 报销人显示 -->
    <template #reimburser="{ row }">
      {{ getUserName(row.reimburserId) }}
    </template>
    
    <!-- 审批人显示 -->
    <template #approver="{ row }">
      {{ getUserName(row.approverId) || '-' }}
    </template>
    
    <!-- 编辑报销对话框 -->
    <template #dialog-edit-reimbursement="{ dialog }">
      <el-form :model="reimbursementForm" :rules="reimbursementFormRules" ref="reimbursementFormRef" label-width="120px">
        <el-form-item label="报销单号" prop="code">
          <el-input v-model="reimbursementForm.code" placeholder="系统自动生成" disabled />
        </el-form-item>
        <el-form-item label="报销标题" prop="title">
          <el-input v-model="reimbursementForm.title" placeholder="请输入报销标题" />
        </el-form-item>
        <el-form-item label="报销日期" prop="reimbursementDate">
          <el-date-picker v-model="reimbursementForm.reimbursementDate" type="date" placeholder="请选择报销日期" />
        </el-form-item>
        <el-form-item label="报销部门" prop="departmentId">
          <el-select v-model="reimbursementForm.departmentId" placeholder="请选择报销部门">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="报销人" prop="reimburserId">
          <el-select v-model="reimbursementForm.reimburserId" placeholder="请选择报销人">
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="审批人" prop="approverId">
          <el-select v-model="reimbursementForm.approverId" placeholder="请选择审批人">
            <el-option
              v-for="user in approvers"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="报销事由" prop="reason">
          <el-input v-model="reimbursementForm.reason" type="textarea" :rows="3" placeholder="请输入报销事由" />
        </el-form-item>
      </el-form>
      
      <!-- 报销明细 -->
      <div class="expense-details">
        <h4 style="margin: 20px 0 10px 0;">报销明细</h4>
        <el-table :data="reimbursementForm.details" border style="width: 100%;">
          <el-table-column label="费用类型" width="120">
            <template #default="{ row }">
              <el-select v-model="row.expenseType" placeholder="请选择">
                <el-option
                  v-for="type in expenseTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="费用日期" width="120">
            <template #default="{ row }">
              <el-date-picker v-model="row.expenseDate" type="date" placeholder="请选择" style="width: 100%;" />
            </template>
          </el-table-column>
          <el-table-column label="金额" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.amount" :min="0.01" :step="0.01" style="width: 100%;" />
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row, $index }">
              <el-button type="danger" size="small" @click="removeDetail($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top: 10px; text-align: right;">
          <el-button type="primary" size="small" @click="addDetail">添加明细</el-button>
        </div>
      </div>
      
      <!-- 附件上传 -->
      <div class="attachments" v-if="showAttachmentUpload">
        <h4 style="margin: 20px 0 10px 0;">附件上传</h4>
        <el-upload
          v-model:file-list="reimbursementForm.attachments"
          action="#"
          :auto-upload="false"
          :on-remove="handleRemoveAttachment"
          :on-change="handleAttachmentChange"
          multiple
          list-type="picture-card"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        >
          <el-icon><Plus /></el-icon>
          <template #file="{ file }">
            <div>
              <img :src="file.url || file.thumbUrl" alt="附件">
              <div class="el-upload-list__item-actions">
                <span class="el-upload-list__item-preview" @click="handlePreviewAttachment(file)">
                  <el-icon><ZoomIn /></el-icon>
                </span>
                <span class="el-upload-list__item-delete" @click="handleRemoveAttachment(file)">
                  <el-icon><Delete /></el-icon>
                </span>
              </div>
            </div>
          </template>
        </el-upload>
      </div>
    </template>
    
    <!-- 查看报销对话框 -->
    <template #dialog-view-reimbursement="{ dialog }">
      <div class="reimbursement-detail">
        <h3 style="margin-bottom: 20px;">报销基本信息</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="报销单号">{{ currentReimbursement.code }}</el-descriptions-item>
          <el-descriptions-item label="报销标题">{{ currentReimbursement.title }}</el-descriptions-item>
          <el-descriptions-item label="报销日期">{{ formatDate(currentReimbursement.reimbursementDate) }}</el-descriptions-item>
          <el-descriptions-item label="报销部门">{{ getDepartmentName(currentReimbursement.departmentId) }}</el-descriptions-item>
          <el-descriptions-item label="报销人">{{ getUserName(currentReimbursement.reimburserId) }}</el-descriptions-item>
          <el-descriptions-item label="审批人">{{ getUserName(currentReimbursement.approverId) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="报销总额">{{ formatCurrency(currentReimbursement.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(currentReimbursement.status) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentReimbursement.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentReimbursement.submittedAt ? formatDateTime(currentReimbursement.submittedAt) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="审批时间">{{ currentReimbursement.approvedAt ? formatDateTime(currentReimbursement.approvedAt) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="报销事由">{{ currentReimbursement.reason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审批意见" v-if="currentReimbursement.approvalComment">{{ currentReimbursement.approvalComment }}</el-descriptions-item>
        </el-descriptions>
        
        <h3 style="margin-top: 30px; margin-bottom: 20px;">报销明细</h3>
        <el-table :data="currentReimbursementDetails" border style="width: 100%;">
          <el-table-column prop="expenseType" label="费用类型" width="120" :formatter="getExpenseTypeText" />
          <el-table-column prop="expenseDate" label="费用日期" width="120" :formatter="formatDate" />
          <el-table-column prop="amount" label="金额" width="100" :formatter="formatCurrency" />
          <el-table-column prop="remark" label="备注" min-width="200" />
        </el-table>
        
        <h3 style="margin-top: 30px; margin-bottom: 20px;">审批流程</h3>
        <el-timeline>
          <el-timeline-item :timestamp="formatDateTime(event.time)" :type="getEventStatusType(event.status)" v-for="event in currentReimbursementApprovalEvents" :key="event.id">
            {{ event.description }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </template>
    
    <!-- 审批报销对话框 -->
    <template #dialog-approve-reimbursement="{ dialog }">
      <div class="approval-form">
        <el-form :model="approvalForm" :rules="approvalFormRules" ref="approvalFormRef" label-width="100px">
          <el-form-item label="审批意见" prop="comment">
            <el-input v-model="approvalForm.comment" type="textarea" :rows="4" placeholder="请输入审批意见" />
          </el-form-item>
          <el-form-item label="审批结果">
            <div>
              <el-radio-group v-model="approvalForm.result">
                <el-radio value="APPROVED">同意</el-radio>
                <el-radio value="REJECTED">拒绝</el-radio>
              </el-radio-group>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </template>
    
    <!-- 删除确认对话框 -->
    <template #dialog-delete-confirm="{ dialog }">
      <div class="delete-confirm">
        <p>确定要删除报销单 <strong>{{ deleteTargetName }}</strong> 吗？</p>
        <p class="delete-tips">此操作不可撤销，删除后将无法恢复。</p>
      </div>
    </template>
  </CommonFinanceTemplate>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { Plus, ZoomIn, Delete } from '@element-plus/icons-vue';
import CommonFinanceTemplate from './template/CommonFinanceTemplate.vue';

export default {
  name: 'ExpenseReimbursement',
  components: {
    CommonFinanceTemplate
  },
  setup() {
    // 模板引用
    const templateRef = ref(null);
    const reimbursementFormRef = ref(null);
    const approvalFormRef = ref(null);
    
    // 状态管理
    const reimbursementData = ref([]);
    const currentReimbursement = reactive({});
    const currentReimbursementDetails = ref([]);
    const currentReimbursementApprovalEvents = ref([]);
    const deleteTargetId = ref(null);
    const deleteTargetName = ref('');
    const showAttachmentUpload = ref(true);
    
    // 当前登录用户（模拟）
    const currentUserId = 1; // 假设当前用户ID为1
    
    // 表单数据
    const reimbursementForm = reactive({
      id: '',
      code: '',
      title: '',
      reimbursementDate: new Date(),
      departmentId: '',
      reimburserId: currentUserId,
      approverId: '',
      reason: '',
      totalAmount: 0,
      status: 'DRAFT',
      details: [],
      attachments: []
    });
    
    // 审批表单
    const approvalForm = reactive({
      reimbursementId: '',
      result: 'APPROVED',
      comment: ''
    });
    
    // 表单验证规则
    const reimbursementFormRules = {
      title: [
        { required: true, message: '请输入报销标题', trigger: 'blur' },
        { min: 2, max: 100, message: '报销标题长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      reimbursementDate: [
        { required: true, message: '请选择报销日期', trigger: 'change' }
      ],
      departmentId: [
        { required: true, message: '请选择报销部门', trigger: 'change' }
      ],
      reimburserId: [
        { required: true, message: '请选择报销人', trigger: 'change' }
      ],
      approverId: [
        { required: true, message: '请选择审批人', trigger: 'change' }
      ],
      reason: [
        { required: true, message: '请输入报销事由', trigger: 'blur' },
        { min: 5, message: '报销事由至少5个字符', trigger: 'blur' }
      ]
    };
    
    const approvalFormRules = {
      comment: [
        { required: true, message: '请输入审批意见', trigger: 'blur' },
        { min: 2, message: '审批意见至少2个字符', trigger: 'blur' }
      ]
    };
    
    // 模拟数据
    const departments = [
      { id: 1, name: '财务部' },
      { id: 2, name: '市场部' },
      { id: 3, name: '销售部' },
      { id: 4, name: '人力资源部' },
      { id: 5, name: '技术部' },
      { id: 6, name: '运营部' },
      { id: 7, name: '采购部' },
      { id: 8, name: '生产部' }
    ];
    
    const users = [
      { id: 1, name: '张三', departmentId: 1 },
      { id: 2, name: '李四', departmentId: 2 },
      { id: 3, name: '王五', departmentId: 3 },
      { id: 4, name: '赵六', departmentId: 4 },
      { id: 5, name: '钱七', departmentId: 5 },
      { id: 6, name: '孙八', departmentId: 6 },
      { id: 7, name: '周九', departmentId: 7 },
      { id: 8, name: '吴十', departmentId: 8 }
    ];
    
    const approvers = users.filter(user => user.id <= 5); // 假设前5个用户是审批人
    
    // 费用类型
    const expenseTypes = [
      { value: 'TRAVEL', label: '差旅费' },
      { value: 'MEAL', label: '餐饮费' },
      { value: 'TRANSPORT', label: '交通费' },
      { value: 'ACCOMMODATION', label: '住宿费' },
      { value: 'OFFICE', label: '办公费' },
      { value: 'MARKETING', label: '市场费' },
      { value: 'TRAINING', label: '培训费' },
      { value: 'OTHER', label: '其他' }
    ];
    
    // 初始化搜索字段
    const initSearchFields = () => {
      const searchFields = [
        {
          key: 'code',
          type: 'input',
          label: '报销单号',
          placeholder: '请输入报销单号',
          clearable: true
        },
        {
          key: 'title',
          type: 'input',
          label: '报销标题',
          placeholder: '请输入报销标题',
          clearable: true
        },
        {
          key: 'reimbursementDateRange',
          type: 'date',
          label: '报销日期',
          dateType: 'daterange',
          startPlaceholder: '开始日期',
          endPlaceholder: '结束日期'
        },
        {
          key: 'reimburserId',
          type: 'select',
          label: '报销人',
          options: users.map(user => ({ value: user.id, label: user.name })),
          clearable: true
        },
        {
          key: 'departmentId',
          type: 'select',
          label: '报销部门',
          options: departments.map(dept => ({ value: dept.id, label: dept.name })),
          clearable: true
        },
        {
          key: 'status',
          type: 'select',
          label: '状态',
          options: [
            { value: 'DRAFT', label: '草稿' },
            { value: 'PENDING', label: '待审批' },
            { value: 'APPROVED', label: '已通过' },
            { value: 'REJECTED', label: '已拒绝' },
            { value: 'PAID', label: '已付款' },
            { value: 'CANCELLED', label: '已取消' }
          ],
          clearable: true,
          multiple: true
        },
        {
          key: 'amountRange',
          type: 'date',
          label: '金额范围',
          dateType: 'daterange',
          startPlaceholder: '最小金额',
          endPlaceholder: '最大金额'
        }
      ];
      
      templateRef.value?.initSearchForm(searchFields);
    };
    
    // 初始化统计卡片
    const initStatisticsCards = () => {
      const cards = [
        {
          label: '报销单总数',
          value: '0',
          type: 'primary',
          description: '所有报销单数量'
        },
        {
          label: '待审批报销',
          value: '0',
          type: 'warning',
          description: '等待审批的报销单数量'
        },
        {
          label: '本月报销总额',
          value: '0.00 元',
          type: 'success',
          description: '本月提交的报销总额'
        },
        {
          label: '已报销总额',
          value: '0.00 元',
          type: 'info',
          description: '已通过且已付款的总额'
        }
      ];
      
      templateRef.value?.setStatisticsCards(cards);
    };
    
    // 初始化表格列
    const initTableColumns = () => {
      const columns = [
        {
          type: 'index',
          label: '序号'
        },
        {
          prop: 'code',
          label: '报销单号',
          width: 160,
          showOverflowTooltip: true
        },
        {
          prop: 'title',
          label: '报销标题',
          minWidth: 200,
          showOverflowTooltip: true
        },
        {
          prop: 'reimburserId',
          label: '报销人',
          width: 100,
          template: 'reimburser'
        },
        {
          prop: 'departmentId',
          label: '所属部门',
          width: 120,
          template: 'department'
        },
        {
          prop: 'totalAmount',
          label: '报销总额',
          width: 120,
          formatter: (row) => formatCurrency(row.totalAmount)
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          template: 'status'
        },
        {
          prop: 'approverId',
          label: '审批人',
          width: 100,
          template: 'approver'
        },
        {
          prop: 'createdAt',
          label: '创建时间',
          width: 180,
          formatter: (row) => formatDateTime(row.createdAt)
        },
        {
          type: 'action',
          label: '操作',
          width: 200,
          template: 'operation'
        }
      ];
      
      templateRef.value?.setTableColumns(columns);
    };
    
    // 初始化对话框
    const initDialogs = () => {
      const dialogs = [
        {
          key: 'edit-reimbursement',
          visible: false,
          title: '编辑报销单',
          width: '800px',
          onClose: () => {
            reimbursementFormRef.value?.resetFields();
            reimbursementForm.details = [];
            reimbursementForm.attachments = [];
          },
          buttons: [
            {
              key: 'save',
              text: '保存',
              type: 'primary',
              handler: handleSaveReimbursement
            }
          ]
        },
        {
          key: 'view-reimbursement',
          visible: false,
          title: '报销单详情',
          width: '800px',
          onClose: () => {
            // 清空当前报销数据
            Object.keys(currentReimbursement).forEach(key => delete currentReimbursement[key]);
            currentReimbursementDetails.value = [];
            currentReimbursementApprovalEvents.value = [];
          },
          hideCancel: true,
          buttons: []
        },
        {
          key: 'approve-reimbursement',
          visible: false,
          title: '审批报销单',
          width: '600px',
          onClose: () => {
            approvalFormRef.value?.resetFields();
            Object.assign(approvalForm, {
              reimbursementId: '',
              result: 'APPROVED',
              comment: ''
            });
          },
          buttons: [
            {
              key: 'submit',
              text: '提交审批',
              type: 'primary',
              handler: handleSubmitApproval
            }
          ]
        },
        {
          key: 'delete-confirm',
          visible: false,
          title: '确认删除',
          width: '400px',
          onClose: () => {
            deleteTargetId.value = null;
            deleteTargetName.value = '';
          },
          buttons: [
            {
              key: 'confirm',
              text: '确认删除',
              type: 'danger',
              handler: confirmDeleteReimbursement
            }
          ]
        }
      ];
      
      templateRef.value?.setDialogs(dialogs);
    };
    
    // 初始化头部操作按钮
    const initHeaderActions = () => {
      const actions = [
        {
          key: 'create',
          text: '新建报销单',
          type: 'primary',
          icon: 'el-icon-plus',
          handler: handleCreateReimbursement
        },
        {
          key: 'import',
          text: '导入报销',
          type: 'success',
          icon: 'el-icon-upload2',
          handler: handleImportReimbursement
        },
        {
          key: 'export',
          text: '导出报销',
          type: 'info',
          icon: 'el-icon-download',
          handler: handleExportReimbursement
        },
        {
          key: 'batch-delete',
          text: '批量删除',
          type: 'danger',
          icon: 'el-icon-delete',
          handler: handleBatchDelete,
          disabled: true
        },
        {
          key: 'my-reimbursements',
          text: '我的报销',
          type: 'warning',
          icon: 'el-icon-document',
          handler: handleMyReimbursements
        },
        {
          key: 'my-approvals',
          text: '我的审批',
          type: 'success',
          icon: 'el-icon-check',
          handler: handleMyApprovals
        }
      ];
      
      templateRef.value?.setHeaderActions(actions);
    };
    
    // 加载报销数据
    const loadReimbursementData = () => {
      // 模拟数据加载
      const mockData = generateMockReimbursementData();
      reimbursementData.value = mockData;
      
      // 更新统计信息
      updateStatistics(mockData);
      
      // 更新分页信息
      templateRef.value?.updatePagination(mockData.length, 1, 20);
    };
    
    // 生成模拟报销数据
    const generateMockReimbursementData = () => {
      const statuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED'];
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      return Array.from({ length: 80 }, (_, i) => {
        const id = i + 1;
        const reimburserId = Math.floor(Math.random() * users.length) + 1;
        const departmentId = users.find(u => u.id === reimburserId)?.departmentId || 1;
        const approverId = approvers[Math.floor(Math.random() * approvers.length)]?.id || 1;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // 随机生成日期
        const year = Math.random() > 0.2 ? currentYear : currentYear - 1;
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        const createdAt = new Date(year, month, day, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
        
        // 生成报销总额
        const totalAmount = Math.floor(Math.random() * 10000) + 500;
        
        // 生成报销单号
        const code = `EXP${year}${String(month + 1).padStart(2, '0')}${String(id).padStart(4, '0')}`;
        
        // 根据状态生成相应的时间
        const submittedAt = status !== 'DRAFT' ? new Date(createdAt.getTime() + Math.random() * 86400000 * 2) : null;
        const approvedAt = ['APPROVED', 'PAID'].includes(status) ? new Date(submittedAt?.getTime() + Math.random() * 86400000 * 3) : null;
        
        return {
          id,
          code,
          title: `报销申请_${getUserName(reimburserId)}_${i + 1}`,
          reimbursementDate: new Date(year, month, day),
          departmentId,
          reimburserId,
          approverId: status === 'DRAFT' ? null : approverId,
          totalAmount,
          status,
          reason: status !== 'DRAFT' ? '日常工作费用报销' : '',
          createdAt,
          submittedAt,
          approvedAt,
          approvalComment: ['APPROVED', 'REJECTED'].includes(status) ? '同意报销' : '',
          paymentDate: status === 'PAID' ? new Date(approvedAt?.getTime() + Math.random() * 86400000 * 5) : null
        };
      }).sort((a, b) => b.createdAt - a.createdAt);
    };
    
    // 更新统计信息
    const updateStatistics = (data) => {
      const totalCount = data.length;
      const pendingCount = data.filter(item => item.status === 'PENDING').length;
      
      // 本月报销总额
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthlyAmount = data
        .filter(item => new Date(item.createdAt).getMonth() === currentMonth && 
                       new Date(item.createdAt).getFullYear() === currentYear)
        .reduce((sum, item) => sum + item.totalAmount, 0);
      
      // 已报销总额
      const paidAmount = data
        .filter(item => item.status === 'PAID')
        .reduce((sum, item) => sum + item.totalAmount, 0);
      
      const cards = templateRef.value?.statisticsCards || [];
      if (cards.length >= 4) {
        cards[0].value = totalCount.toString();
        cards[1].value = pendingCount.toString();
        cards[2].value = formatCurrency(monthlyAmount);
        cards[3].value = formatCurrency(paidAmount);
      }
    };
    
    // 处理搜索
    const handleSearch = (searchParams) => {
      console.log('搜索参数:', searchParams);
      // 模拟搜索延迟
      templateRef.value.loading = true;
      setTimeout(() => {
        loadReimbursementData(); // 实际应用中应该根据搜索条件获取数据
        templateRef.value.loading = false;
      }, 500);
    };
    
    // 处理重置
    const handleReset = (resetParams) => {
      console.log('重置参数:', resetParams);
      loadReimbursementData();
    };
    
    // 处理分页变化
    const handlePageChange = (pageParams) => {
      console.log('分页参数:', pageParams);
      // 实际应用中应该根据分页参数获取数据
    };
    
    // 处理页面挂载
    const handleMounted = () => {
      initSearchFields();
      initStatisticsCards();
      initTableColumns();
      initDialogs();
      initHeaderActions();
      loadReimbursementData();
    };
    
    // 新建报销单
    const handleCreateReimbursement = () => {
      // 重置表单
      reimbursementFormRef.value?.resetFields();
      const now = new Date();
      const code = `EXP${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-4)}`;
      
      Object.assign(reimbursementForm, {
        id: '',
        code,
        title: '',
        reimbursementDate: new Date(),
        departmentId: users.find(u => u.id === currentUserId)?.departmentId || '',
        reimburserId: currentUserId,
        approverId: '',
        reason: '',
        totalAmount: 0,
        status: 'DRAFT',
        details: [],
        attachments: []
      });
      
      // 添加一个默认明细
      addDetail();
      
      // 打开对话框
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit-reimbursement');
      if (dialog) {
        dialog.title = '新建报销单';
        dialog.visible = true;
      }
    };
    
    // 编辑报销单
    const handleEditReimbursement = (row) => {
      // 填充表单
      const details = generateMockDetails(row.totalAmount); // 模拟获取明细
      Object.assign(reimbursementForm, {
        id: row.id,
        code: row.code,
        title: row.title,
        reimbursementDate: new Date(row.reimbursementDate),
        departmentId: row.departmentId,
        reimburserId: row.reimburserId,
        approverId: row.approverId || '',
        reason: row.reason || '',
        totalAmount: row.totalAmount,
        status: row.status,
        details,
        attachments: []
      });
      
      // 打开对话框
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit-reimbursement');
      if (dialog) {
        dialog.title = '编辑报销单';
        dialog.visible = true;
      }
    };
    
    // 查看报销单
    const handleViewReimbursement = (row) => {
      // 复制报销数据
      Object.assign(currentReimbursement, JSON.parse(JSON.stringify(row)));
      
      // 生成报销明细数据
      currentReimbursementDetails.value = generateMockDetails(row.totalAmount);
      
      // 生成审批流程事件
      currentReimbursementApprovalEvents.value = generateApprovalEvents(row);
      
      // 打开对话框
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'view-reimbursement');
      if (dialog) {
        dialog.visible = true;
      }
    };
    
    // 删除报销单
    const handleDeleteReimbursement = (row) => {
      deleteTargetId.value = row.id;
      deleteTargetName.value = row.title;
      
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'delete-confirm');
      if (dialog) {
        dialog.visible = true;
      }
    };
    
    // 批量删除
    const handleBatchDelete = () => {
      const selectedRows = templateRef.value?.selectedRows || [];
      // 只允许删除草稿状态的报销单
      const draftRows = selectedRows.filter(row => row.status === 'DRAFT');
      
      if (draftRows.length === 0) {
        ElMessage.warning('只能删除草稿状态的报销单');
        return;
      }
      
      ElMessageBox.confirm(
        `确定要删除选中的 ${draftRows.length} 个报销单吗？此操作不可撤销。`,
        '确认删除',
        {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 模拟删除操作
        templateRef.value.loading = true;
        setTimeout(() => {
          const idsToDelete = draftRows.map(row => row.id);
          reimbursementData.value = reimbursementData.value.filter(item => !idsToDelete.includes(item.id));
          updateStatistics(reimbursementData.value);
          templateRef.value.updatePagination(reimbursementData.value.length, 1, 20);
          templateRef.value.loading = false;
          ElMessage.success(`成功删除 ${draftRows.length} 个报销单`);
        }, 500);
      }).catch(() => {
        // 取消删除
      });
    };
    
    // 确认删除报销单
    const confirmDeleteReimbursement = () => {
      // 模拟删除操作
      templateRef.value.loading = true;
      setTimeout(() => {
        reimbursementData.value = reimbursementData.value.filter(item => item.id !== deleteTargetId.value);
        updateStatistics(reimbursementData.value);
        templateRef.value.updatePagination(reimbursementData.value.length, 1, 20);
        
        // 关闭对话框
        const dialog = templateRef.value?.dialogs.find(d => d.key === 'delete-confirm');
        if (dialog) {
          dialog.visible = false;
        }
        
        templateRef.value.loading = false;
        ElMessage.success('报销单删除成功');
      }, 500);
    };
    
    // 提交报销单
    const handleSubmitReimbursement = (row) => {
      ElMessageBox.confirm(
        `确定要提交报销单「${row.title}」吗？提交后将等待审批。`,
        '确认提交',
        {
          confirmButtonText: '确认提交',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        // 模拟提交操作
        templateRef.value.loading = true;
        setTimeout(() => {
          const reimbursement = reimbursementData.value.find(item => item.id === row.id);
          if (reimbursement) {
            reimbursement.status = 'PENDING';
            reimbursement.submittedAt = new Date();
            reimbursement.approverId = reimbursement.approverId || approvers[0].id; // 默认第一个审批人
          }
          updateStatistics(reimbursementData.value);
          templateRef.value.loading = false;
          ElMessage.success('报销单提交成功，等待审批');
        }, 500);
      }).catch(() => {
        // 取消提交
      });
    };
    
    // 审批报销单
    const handleApproveReimbursement = (row) => {
      // 设置审批表单数据
      Object.assign(approvalForm, {
        reimbursementId: row.id,
        result: 'APPROVED',
        comment: ''
      });
      
      // 打开审批对话框
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'approve-reimbursement');
      if (dialog) {
        dialog.title = `审批报销单 - ${row.title}`;
        dialog.visible = true;
      }
    };
    
    // 提交审批
    const handleSubmitApproval = () => {
      approvalFormRef.value?.validate((valid) => {
        if (valid) {
          // 模拟审批操作
          templateRef.value.loading = true;
          setTimeout(() => {
            const reimbursement = reimbursementData.value.find(item => item.id === approvalForm.reimbursementId);
            if (reimbursement) {
              reimbursement.status = approvalForm.result;
              reimbursement.approvalComment = approvalForm.comment;
              reimbursement.approvedAt = new Date();
            }
            
            updateStatistics(reimbursementData.value);
            
            // 关闭对话框
            const dialog = templateRef.value?.dialogs.find(d => d.key === 'approve-reimbursement');
            if (dialog) {
              dialog.visible = false;
            }
            
            templateRef.value.loading = false;
            ElMessage.success(`报销单已${approvalForm.result === 'APPROVED' ? '通过' : '拒绝'}`);
          }, 800);
        }
      });
    };
    
    // 撤回报销单
    const handleWithdrawReimbursement = (row) => {
      ElMessageBox.confirm(
        `确定要撤回报销单「${row.title}」吗？撤回后可以重新编辑。`,
        '确认撤回',
        {
          confirmButtonText: '确认撤回',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 模拟撤回操作
        templateRef.value.loading = true;
        setTimeout(() => {
          const reimbursement = reimbursementData.value.find(item => item.id === row.id);
          if (reimbursement) {
            reimbursement.status = 'DRAFT';
            reimbursement.submittedAt = null;
          }
          updateStatistics(reimbursementData.value);
          templateRef.value.loading = false;
          ElMessage.success('报销单已撤回');
        }, 500);
      }).catch(() => {
        // 取消撤回
      });
    };
    
    // 处理付款
    const handleProcessPayment = (row) => {
      ElMessageBox.confirm(
        `确定要处理报销单「${row.title}」的付款吗？`,
        '确认付款',
        {
          confirmButtonText: '确认付款',
          cancelButtonText: '取消',
          type: 'success'
        }
      ).then(() => {
        // 模拟付款操作
        templateRef.value.loading = true;
        setTimeout(() => {
          const reimbursement = reimbursementData.value.find(item => item.id === row.id);
          if (reimbursement) {
            reimbursement.status = 'PAID';
            reimbursement.paymentDate = new Date();
          }
          updateStatistics(reimbursementData.value);
          templateRef.value.loading = false;
          ElMessage.success('付款处理成功');
        }, 500);
      }).catch(() => {
        // 取消付款
      });
    };
    
    // 保存报销单
    const handleSaveReimbursement = () => {
      // 计算总金额
      reimbursementForm.totalAmount = reimbursementForm.details.reduce((sum, detail) => sum + (detail.amount || 0), 0);
      
      reimbursementFormRef.value?.validate((valid) => {
        if (valid) {
          // 验证明细
          if (reimbursementForm.details.length === 0) {
            ElMessage.warning('请至少添加一条报销明细');
            return;
          }
          
          const hasInvalidDetail = reimbursementForm.details.some(detail => {
            return !detail.expenseType || !detail.expenseDate || !detail.amount || detail.amount <= 0;
          });
          
          if (hasInvalidDetail) {
            ElMessage.warning('请完善所有报销明细信息');
            return;
          }
          
          // 模拟保存操作
          templateRef.value.loading = true;
          setTimeout(() => {
            const isEdit = !!reimbursementForm.id;
            
            if (isEdit) {
              // 编辑现有报销单
              const index = reimbursementData.value.findIndex(item => item.id === reimbursementForm.id);
              if (index !== -1) {
                Object.assign(reimbursementData.value[index], {
                  title: reimbursementForm.title,
                  reimbursementDate: reimbursementForm.reimbursementDate,
                  departmentId: reimbursementForm.departmentId,
                  reimburserId: reimbursementForm.reimburserId,
                  approverId: reimbursementForm.approverId,
                  reason: reimbursementForm.reason,
                  totalAmount: reimbursementForm.totalAmount
                });
              }
            } else {
              // 新建报销单
              const newReimbursement = {
                id: Date.now(),
                code: reimbursementForm.code,
                title: reimbursementForm.title,
                reimbursementDate: reimbursementForm.reimbursementDate,
                departmentId: reimbursementForm.departmentId,
                reimburserId: reimbursementForm.reimburserId,
                approverId: reimbursementForm.approverId || null,
                totalAmount: reimbursementForm.totalAmount,
                status: 'DRAFT',
                reason: reimbursementForm.reason,
                createdAt: new Date(),
                submittedAt: null,
                approvedAt: null,
                approvalComment: '',
                paymentDate: null
              };
              reimbursementData.value.unshift(newReimbursement);
            }
            
            // 更新统计信息
            updateStatistics(reimbursementData.value);
            templateRef.value.updatePagination(reimbursementData.value.length, 1, 20);
            
            // 关闭对话框
            const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit-reimbursement');
            if (dialog) {
              dialog.visible = false;
            }
            
            templateRef.value.loading = false;
            ElMessage.success(isEdit ? '报销单更新成功' : '报销单保存成功');
          }, 800);
        }
      });
    };
    
    // 添加明细
    const addDetail = () => {
      reimbursementForm.details.push({
        expenseType: '',
        expenseDate: new Date(),
        amount: 0,
        remark: ''
      });
    };
    
    // 删除明细
    const removeDetail = (index) => {
      reimbursementForm.details.splice(index, 1);
    };
    
    // 处理附件删除
    const handleRemoveAttachment = (file) => {
      console.log('移除附件:', file);
    };
    
    // 处理附件变化
    const handleAttachmentChange = (file, fileList) => {
      console.log('附件变化:', file, fileList);
    };
    
    // 处理附件预览
    const handlePreviewAttachment = (file) => {
      console.log('预览附件:', file);
    };
    
    // 导入报销
    const handleImportReimbursement = () => {
      ElMessage.info('导入报销功能待实现');
    };
    
    // 导出报销
    const handleExportReimbursement = () => {
      ElMessage.info('导出报销功能待实现');
    };
    
    // 我的报销
    const handleMyReimbursements = () => {
      // 这里应该过滤出当前用户的报销单
      console.log('查看我的报销');
      templateRef.value.searchForm.reimburserId = currentUserId;
      handleSearch(templateRef.value.searchForm);
    };
    
    // 我的审批
    const handleMyApprovals = () => {
      // 这里应该过滤出当前用户需要审批的报销单
      console.log('查看我的审批');
      templateRef.value.searchForm.approverId = currentUserId;
      templateRef.value.searchForm.status = ['PENDING'];
      handleSearch(templateRef.value.searchForm);
    };
    
    // 辅助函数
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    const formatDateTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${formatDate(date)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00 元';
      return `${parseFloat(value).toFixed(2)} 元`;
    };
    
    const getDepartmentName = (id) => {
      const dept = departments.find(item => item.id === id);
      return dept ? dept.name : '未知部门';
    };
    
    const getUserName = (id) => {
      const user = users.find(item => item.id === id);
      return user ? user.name : '未知用户';
    };
    
    const getStatusText = (status) => {
      const statusMap = {
        DRAFT: '草稿',
        PENDING: '待审批',
        APPROVED: '已通过',
        REJECTED: '已拒绝',
        PAID: '已付款',
        CANCELLED: '已取消'
      };
      return statusMap[status] || '未知状态';
    };
    
    const getStatusType = (status) => {
      const statusMap = {
        DRAFT: 'info',
        PENDING: 'warning',
        APPROVED: 'success',
        REJECTED: 'danger',
        PAID: 'success',
        CANCELLED: 'danger'
      };
      return statusMap[status] || 'default';
    };
    
    const getExpenseTypeText = (type) => {
      const expenseType = expenseTypes.find(item => item.value === type);
      return expenseType ? expenseType.label : '未知类型';
    };
    
    const getEventStatusType = (status) => {
      const statusMap = {
        CREATED: 'primary',
        SUBMITTED: 'warning',
        APPROVED: 'success',
        REJECTED: 'danger',
        PAID: 'success',
        CANCELLED: 'danger'
      };
      return statusMap[status] || 'info';
    };
    
    // 判断是否是审批人
    const isApprover = (row) => {
      return row.approverId === currentUserId && row.status === 'PENDING';
    };
    
    // 判断是否是创建人
    const isCreator = (row) => {
      return row.reimburserId === currentUserId;
    };
    
    // 判断是否可以处理付款
    const canProcessPayment = (row) => {
      // 假设财务人员可以处理付款（这里简化处理）
      return row.status === 'APPROVED' && currentUserId === 1; // 假设ID为1的用户是财务
    };
    
    // 生成模拟报销明细数据
    const generateMockDetails = (totalAmount) => {
      const details = [];
      const itemCount = Math.floor(Math.random() * 3) + 1;
      let remainingAmount = totalAmount;
      
      for (let i = 0; i < itemCount; i++) {
        const isLast = i === itemCount - 1;
        const amount = isLast ? remainingAmount : Math.floor(totalAmount * (0.3 + Math.random() * 0.3));
        const actualAmount = Math.min(amount, remainingAmount);
        remainingAmount -= actualAmount;
        
        const expenseType = expenseTypes[Math.floor(Math.random() * expenseTypes.length)].value;
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        details.push({
          expenseType,
          expenseDate: date,
          amount: actualAmount,
          remark: i % 2 === 0 ? '费用明细备注' : ''
        });
      }
      
      return details;
    };
    
    // 生成审批流程事件
    const generateApprovalEvents = (row) => {
      const events = [
        {
          id: 1,
          status: 'CREATED',
          time: row.createdAt,
          description: `${getUserName(row.reimburserId)} 创建了报销单`
        }
      ];
      
      if (row.submittedAt) {
        events.push({
          id: 2,
          status: 'SUBMITTED',
          time: row.submittedAt,
          description: `${getUserName(row.reimburserId)} 提交了报销单，等待 ${getUserName(row.approverId)} 审批`
        });
      }
      
      if (row.approvedAt) {
        const status = row.status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
        events.push({
          id: 3,
          status,
          time: row.approvedAt,
          description: `${getUserName(row.approverId)} ${row.status === 'APPROVED' ? '批准' : '拒绝'}了报销单${row.approvalComment ? `，意见：${row.approvalComment}` : ''}`
        });
      }
      
      if (row.paymentDate) {
        events.push({
          id: 4,
          status: 'PAID',
          time: row.paymentDate,
          description: '财务已完成付款'
        });
      }
      
      return events.sort((a, b) => a.time - b.time);
    };
    
    return {
      templateRef,
      reimbursementFormRef,
      approvalFormRef,
      reimbursementData,
      currentReimbursement,
      currentReimbursementDetails,
      currentReimbursementApprovalEvents,
      deleteTargetName,
      showAttachmentUpload,
      reimbursementForm,
      reimbursementFormRules,
      approvalForm,
      approvalFormRules,
      departments,
      users,
      approvers,
      expenseTypes,
      
      // 方法
      handleSearch,
      handleReset,
      handlePageChange,
      handleMounted,
      handleCreateReimbursement,
      handleEditReimbursement,
      handleViewReimbursement,
      handleDeleteReimbursement,
      handleBatchDelete,
      handleSubmitReimbursement,
      handleApproveReimbursement,
      handleSubmitApproval,
      handleWithdrawReimbursement,
      handleProcessPayment,
      handleSaveReimbursement,
      handleImportReimbursement,
      handleExportReimbursement,
      handleMyReimbursements,
      handleMyApprovals,
      confirmDeleteReimbursement,
      addDetail,
      removeDetail,
      handleRemoveAttachment,
      handleAttachmentChange,
      handlePreviewAttachment,
      
      // 辅助函数
      formatDate,
      formatDateTime,
      formatCurrency,
      getDepartmentName,
      getUserName,
      getStatusText,
      getStatusType,
      getExpenseTypeText,
      getEventStatusType,
      isApprover,
      isCreator,
      canProcessPayment
    };
  }
};
</script>

<style scoped>
.reimbursement-detail h3 {
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.expense-details {
  margin-top: 20px;
}

.attachments {
  margin-top: 20px;
}

.delete-confirm {
  text-align: center;
  padding: 20px 0;
}

.delete-confirm p {
  margin-bottom: 10px;
}

.delete-tips {
  color: #f56c6c;
  font-size: 14px;
}

.approval-form {
  padding: 10px 0;
}
</style>