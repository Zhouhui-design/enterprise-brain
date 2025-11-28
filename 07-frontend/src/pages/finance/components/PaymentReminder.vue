<template>
  <div class="payment-reminder">
    <div class="header">
      <h2>回款提醒</h2>
      <div class="header-actions">
        <el-button type="primary" @click="createReminder">创建提醒</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="客户名称">
        <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" />
      </el-form-item>
      <el-form-item label="订单编号">
        <el-input v-model="searchForm.orderNumber" placeholder="请输入订单编号" />
      </el-form-item>
      <el-form-item label="提醒状态">
        <el-select v-model="searchForm.status" placeholder="请选择状态">
          <el-option label="全部" value="" />
          <el-option label="待提醒" value="pending" />
          <el-option label="已提醒" value="reminded" />
          <el-option label="已完成" value="completed" />
        </el-select>
      </el-form-item>
      <el-form-item label="负责人">
        <el-select v-model="searchForm.responsiblePerson" placeholder="请选择负责人">
          <el-option label="全部" value="" />
          <el-option label="张三" value="张三" />
          <el-option label="李四" value="李四" />
          <el-option label="王五" value="王五" />
          <el-option label="赵六" value="赵六" />
        </el-select>
      </el-form-item>
      <el-form-item label="提醒日期">
        <el-date-picker
          v-model="searchForm.reminderDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 提醒统计 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">待提醒总数</div>
              <div class="stat-value warning">{{ pendingReminderCount }}</div>
              <div class="stat-desc">{{ pendingReminderAmount.toFixed(2) }} 元</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">今日到期提醒</div>
              <div class="stat-value danger">{{ todayDueCount }}</div>
              <div class="stat-desc">{{ todayDueAmount.toFixed(2) }} 元</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">近7天到期提醒</div>
              <div class="stat-value primary">{{ weekDueCount }}</div>
              <div class="stat-desc">{{ weekDueAmount.toFixed(2) }} 元</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">本月提醒完成率</div>
              <div class="stat-value success">{{ completionRate }}%</div>
              <div class="stat-desc">已完成 {{ completedCount }} 个提醒</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 提醒列表 -->
    <el-table
      v-loading="loading"
      :data="reminderList"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="reminderNumber" label="提醒单号" width="180">
        <template #default="{ row }">
          <a href="#" @click.stop="viewReminderDetails(row)">{{ row.reminderNumber }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="customerName" label="客户名称" width="180" />
      <el-table-column prop="orderNumber" label="订单编号" width="150">
        <template #default="{ row }">
          <a href="#" @click.stop="viewOrderDetails(row)">{{ row.orderNumber }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="待回金额" width="120" align="right">
        <template #default="{ row }">
          <span class="text-danger">{{ formatCurrency(row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="dueDate" label="到期日期" width="130">
        <template #default="{ row }">
          <span :class="getDueDateClass(row.dueDate)">{{ formatDate(row.dueDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="reminderDate" label="提醒日期" width="130">
        <template #default="{ row }">
          {{ formatDate(row.reminderDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="reminderMethod" label="提醒方式" width="100">
        <template #default="{ row }">
          <el-tag :type="getMethodType(row.reminderMethod)">{{ getMethodText(row.reminderMethod) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="responsiblePerson" label="负责人" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="nextFollowDate" label="下次跟进" width="130">
        <template #default="{ row }">
          {{ row.nextFollowDate ? formatDate(row.nextFollowDate) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="120" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'pending'"
            type="primary"
            size="small"
            @click="sendReminder(row)"
          >
            发送提醒
          </el-button>
          <el-button
            v-if="row.status !== 'completed'"
            size="small"
            @click="followUpReminder(row)"
          >
            跟进记录
          </el-button>
          <el-button size="small" @click="editReminder(row)">编辑</el-button>
          <el-button
            v-if="row.status === 'pending'"
            type="danger"
            size="small"
            @click="cancelReminder(row)"
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 创建提醒对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      :title="isEdit ? '编辑提醒' : '创建提醒'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="客户名称" prop="customerId">
          <el-select v-model="formData.customerId" placeholder="请选择客户" filterable @change="onCustomerChange">
            <el-option
              v-for="customer in customerList"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="订单编号" prop="orderId">
          <el-select v-model="formData.orderId" placeholder="请选择订单" filterable @change="onOrderChange">
            <el-option
              v-for="order in availableOrders"
              :key="order.id"
              :label="`${order.orderNumber} - ${order.customerName} - 待回款: ${order.remainingAmount.toFixed(2)}元`"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="待回金额">
          <el-input v-model="formData.amount" disabled />
        </el-form-item>
        <el-form-item label="到期日期" prop="dueDate">
          <el-date-picker
            v-model="formData.dueDate"
            type="date"
            placeholder="请选择到期日期"
          />
        </el-form-item>
        <el-form-item label="提醒日期" prop="reminderDate">
          <el-date-picker
            v-model="formData.reminderDate"
            type="date"
            placeholder="请选择提醒日期"
          />
        </el-form-item>
        <el-form-item label="提醒方式" prop="reminderMethod">
          <el-select v-model="formData.reminderMethod" placeholder="请选择提醒方式">
            <el-option label="邮件" value="email" />
            <el-option label="短信" value="sms" />
            <el-option label="电话" value="phone" />
            <el-option label="微信" value="wechat" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="responsiblePerson">
          <el-select v-model="formData.responsiblePerson" placeholder="请选择负责人">
            <el-option label="张三" value="张三" />
            <el-option label="李四" value="李四" />
            <el-option label="王五" value="王五" />
            <el-option label="赵六" value="赵六" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒内容" prop="reminderContent">
          <el-input
            v-model="formData.reminderContent"
            type="textarea"
            placeholder="请输入提醒内容"
            rows="3"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            placeholder="请输入备注信息"
            rows="2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveReminder">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 发送提醒对话框 -->
    <el-dialog
      v-model="sendDialogVisible"
      title="发送提醒"
      width="500px"
      @close="resetSendForm"
    >
      <el-form
        ref="sendFormRef"
        :model="sendForm"
        :rules="sendRules"
        label-width="100px"
      >
        <el-form-item label="客户名称">
          <el-input v-model="sendForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="待回金额">
          <el-input v-model="sendForm.amount" disabled />
        </el-form-item>
        <el-form-item label="提醒方式" prop="reminderMethod">
          <el-select v-model="sendForm.reminderMethod" placeholder="请选择提醒方式">
            <el-option label="邮件" value="email" />
            <el-option label="短信" value="sms" />
            <el-option label="电话" value="phone" />
            <el-option label="微信" value="wechat" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系信息" prop="contactInfo">
          <el-input v-model="sendForm.contactInfo" placeholder="请输入联系信息" />
        </el-form-item>
        <el-form-item label="提醒内容" prop="reminderContent">
          <el-input
            v-model="sendForm.reminderContent"
            type="textarea"
            placeholder="请输入提醒内容"
            rows="3"
          />
        </el-form-item>
        <el-form-item label="下次跟进日期" prop="nextFollowDate">
          <el-date-picker
            v-model="sendForm.nextFollowDate"
            type="date"
            placeholder="请选择下次跟进日期"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="sendDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSendReminder">确认发送</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 跟进记录对话框 -->
    <el-dialog
      v-model="followUpDialogVisible"
      title="跟进记录"
      width="700px"
    >
      <div v-if="currentReminder" class="follow-up-content">
        <div class="reminder-info">
          <h3>{{ currentReminder.customerName }} - {{ currentReminder.reminderNumber }}</h3>
          <el-descriptions border :column="2">
            <el-descriptions-item label="订单编号">{{ currentReminder.orderNumber }}</el-descriptions-item>
            <el-descriptions-item label="待回金额">{{ formatCurrency(currentReminder.amount) }}</el-descriptions-item>
            <el-descriptions-item label="到期日期">{{ formatDate(currentReminder.dueDate) }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ currentReminder.responsiblePerson }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ getStatusText(currentReminder.status) }}</el-descriptions-item>
            <el-descriptions-item label="下次跟进">{{ currentReminder.nextFollowDate ? formatDate(currentReminder.nextFollowDate) : '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="add-follow-up">
          <el-form :model="followUpForm" :rules="followUpRules" label-width="100px" @submit.prevent="addFollowUpRecord">
            <el-form-item label="跟进日期" prop="followDate">
              <el-date-picker
                v-model="followUpForm.followDate"
                type="date"
                placeholder="请选择跟进日期"
                style="width: 200px;"
              />
            </el-form-item>
            <el-form-item label="跟进方式" prop="followMethod">
              <el-select v-model="followUpForm.followMethod" placeholder="请选择跟进方式" style="width: 150px;">
                <el-option label="电话" value="phone" />
                <el-option label="邮件" value="email" />
                <el-option label="微信" value="wechat" />
                <el-option label="面谈" value="meeting" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="跟进内容" prop="content">
              <el-input
                v-model="followUpForm.content"
                type="textarea"
                placeholder="请输入跟进内容"
                rows="3"
              />
            </el-form-item>
            <el-form-item label="客户反馈" prop="feedback">
              <el-input
                v-model="followUpForm.feedback"
                type="textarea"
                placeholder="请输入客户反馈"
                rows="2"
              />
            </el-form-item>
            <el-form-item label="下次跟进" prop="nextFollowDate">
              <el-date-picker
                v-model="followUpForm.nextFollowDate"
                type="date"
                placeholder="请选择下次跟进日期"
                style="width: 200px;"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addFollowUpRecord">添加记录</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="follow-up-records">
          <h3>跟进历史</h3>
          <el-table
            :data="followUpRecords"
            style="width: 100%"
            border
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="followDate" label="跟进日期" width="130">
              <template #default="{ row }">
                {{ formatDate(row.followDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="followMethod" label="跟进方式" width="120">
              <template #default="{ row }">
                {{ getFollowMethodText(row.followMethod) }}
              </template>
            </el-table-column>
            <el-table-column prop="content" label="跟进内容" min-width="200" />
            <el-table-column prop="feedback" label="客户反馈" min-width="200" />
            <el-table-column prop="nextFollowDate" label="下次跟进" width="130">
              <template #default="{ row }">
                {{ row.nextFollowDate ? formatDate(row.nextFollowDate) : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="100" />
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 提醒详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="提醒详情"
      width="700px"
    >
      <div v-if="currentReminder" class="detail-content">
        <el-descriptions border :column="2" :title="currentReminder.reminderNumber + ' - ' + currentReminder.customerName">
          <el-descriptions-item label="客户名称">{{ currentReminder.customerName }}</el-descriptions-item>
          <el-descriptions-item label="订单编号">{{ currentReminder.orderNumber }}</el-descriptions-item>
          <el-descriptions-item label="待回金额">{{ formatCurrency(currentReminder.amount) }}</el-descriptions-item>
          <el-descriptions-item label="到期日期">{{ formatDate(currentReminder.dueDate) }}</el-descriptions-item>
          <el-descriptions-item label="提醒日期">{{ formatDate(currentReminder.reminderDate) }}</el-descriptions-item>
          <el-descriptions-item label="提醒方式">{{ getMethodText(currentReminder.reminderMethod) }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentReminder.responsiblePerson }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(currentReminder.status) }}</el-descriptions-item>
          <el-descriptions-item label="下次跟进" :span="2">{{ currentReminder.nextFollowDate ? formatDate(currentReminder.nextFollowDate) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="提醒内容" :span="2">{{ currentReminder.reminderContent || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentReminder.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { accountReceivableApi, collectionApi } from '@/api/finance/index';

export default {
  name: 'PaymentReminder',
  setup() {
    // 状态管理
    const loading = ref(false);
    const reminderList = ref([]);
    const selectedRows = ref([]);
    const createDialogVisible = ref(false);
    const sendDialogVisible = ref(false);
    const followUpDialogVisible = ref(false);
    const detailDialogVisible = ref(false);
    const currentReminder = ref(null);
    const followUpRecords = ref([]);
    const isEdit = ref(false);

    // 表单引用
    const formRef = ref(null);
    const sendFormRef = ref(null);

    // 搜索表单
    const searchForm = reactive({
      customerName: '',
      orderNumber: '',
      status: '',
      responsiblePerson: '',
      reminderDateRange: null
    });

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });

    // 模拟数据
    const customerList = ref([
      { id: '1', name: '北京科技有限公司' },
      { id: '2', name: '上海贸易公司' },
      { id: '3', name: '广州制造有限公司' },
      { id: '4', name: '深圳科技集团' },
      { id: '5', name: '杭州电子有限公司' }
    ]);

    const orderList = ref([
      { id: '1', orderNumber: 'SO20240001', customerId: '1', customerName: '北京科技有限公司', remainingAmount: 50000.00 },
      { id: '2', orderNumber: 'SO20240002', customerId: '2', customerName: '上海贸易公司', remainingAmount: 180000.00 },
      { id: '3', orderNumber: 'SO20240004', customerId: '4', customerName: '深圳科技集团', remainingAmount: 140000.00 },
      { id: '4', orderNumber: 'SO20240006', customerId: '5', customerName: '杭州电子有限公司', remainingAmount: 150000.00 }
    ]);

    // 表单数据
    const formData = reactive({
      id: '',
      customerId: '',
      customerName: '',
      orderId: '',
      orderNumber: '',
      amount: 0,
      dueDate: new Date(),
      reminderDate: new Date(),
      reminderMethod: 'email',
      responsiblePerson: '张三',
      reminderContent: '',
      remark: ''
    });

    // 发送提醒表单
    const sendForm = reactive({
      customerName: '',
      amount: 0,
      reminderMethod: 'email',
      contactInfo: '',
      reminderContent: '',
      nextFollowDate: null
    });

    // 跟进记录表单
    const followUpForm = reactive({
      followDate: new Date(),
      followMethod: 'phone',
      content: '',
      feedback: '',
      nextFollowDate: null
    });

    // 表单验证规则
    const rules = {
      customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
      orderId: [{ required: true, message: '请选择订单', trigger: 'change' }],
      dueDate: [{ required: true, message: '请选择到期日期', trigger: 'change' }],
      reminderDate: [{ required: true, message: '请选择提醒日期', trigger: 'change' }],
      reminderMethod: [{ required: true, message: '请选择提醒方式', trigger: 'change' }],
      responsiblePerson: [{ required: true, message: '请选择负责人', trigger: 'change' }],
      reminderContent: [{ required: true, message: '请输入提醒内容', trigger: 'blur' }]
    };

    const sendRules = {
      reminderMethod: [{ required: true, message: '请选择提醒方式', trigger: 'change' }],
      contactInfo: [{ required: true, message: '请输入联系信息', trigger: 'blur' }],
      reminderContent: [{ required: true, message: '请输入提醒内容', trigger: 'blur' }],
      nextFollowDate: [{ required: true, message: '请选择下次跟进日期', trigger: 'change' }]
    };

    const followUpRules = {
      followDate: [{ required: true, message: '请选择跟进日期', trigger: 'change' }],
      followMethod: [{ required: true, message: '请选择跟进方式', trigger: 'change' }],
      content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }],
      feedback: [{ required: true, message: '请输入客户反馈', trigger: 'blur' }]
    };

    // 计算属性
    const availableOrders = computed(() => {
      if (!formData.customerId) return [];
      return orderList.value.filter(order => order.customerId === formData.customerId);
    });

    const pendingReminderCount = computed(() => {
      return reminderList.value.filter(item => item.status === 'pending').length;
    });

    const pendingReminderAmount = computed(() => {
      return reminderList.value
        .filter(item => item.status === 'pending')
        .reduce((sum, item) => sum + item.amount, 0);
    });

    const todayDueCount = computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return reminderList.value.filter(item => {
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime() && item.status !== 'completed';
      }).length;
    });

    const todayDueAmount = computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return reminderList.value
        .filter(item => {
          const dueDate = new Date(item.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime() && item.status !== 'completed';
        })
        .reduce((sum, item) => sum + item.amount, 0);
    });

    const weekDueCount = computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekLater = new Date();
      weekLater.setDate(today.getDate() + 7);
      weekLater.setHours(0, 0, 0, 0);
      return reminderList.value.filter(item => {
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= weekLater && item.status !== 'completed';
      }).length;
    });

    const weekDueAmount = computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekLater = new Date();
      weekLater.setDate(today.getDate() + 7);
      weekLater.setHours(0, 0, 0, 0);
      return reminderList.value
        .filter(item => {
          const dueDate = new Date(item.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= today && dueDate <= weekLater && item.status !== 'completed';
        })
        .reduce((sum, item) => sum + item.amount, 0);
    });

    const completedCount = computed(() => {
      return reminderList.value.filter(item => item.status === 'completed').length;
    });

    const completionRate = computed(() => {
      const total = reminderList.value.length;
      return total > 0 ? Math.round((completedCount.value / total) * 100) : 0;
    });

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // 格式化货币
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00 元';
      return `${value.toFixed(2)} 元`;
    };

    // 获取状态类型
    const getStatusType = (status) => {
      switch (status) {
        case 'pending': return 'warning';
        case 'reminded': return 'primary';
        case 'completed': return 'success';
        default: return 'default';
      }
    };

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return '待提醒';
        case 'reminded': return '已提醒';
        case 'completed': return '已完成';
        default: return '未知';
      }
    };

    // 获取提醒方式类型
    const getMethodType = (method) => {
      switch (method) {
        case 'email': return 'primary';
        case 'sms': return 'info';
        case 'phone': return 'success';
        case 'wechat': return 'warning';
        case 'other': return 'default';
        default: return 'default';
      }
    };

    // 获取提醒方式文本
    const getMethodText = (method) => {
      switch (method) {
        case 'email': return '邮件';
        case 'sms': return '短信';
        case 'phone': return '电话';
        case 'wechat': return '微信';
        case 'other': return '其他';
        default: return '未知';
      }
    };

    // 获取跟进方式文本
    const getFollowMethodText = (method) => {
      switch (method) {
        case 'phone': return '电话';
        case 'email': return '邮件';
        case 'wechat': return '微信';
        case 'meeting': return '面谈';
        case 'other': return '其他';
        default: return '未知';
      }
    };

    // 获取到期日期样式
    const getDueDateClass = (dueDate) => {
      if (!dueDate) return '';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);

      if (due < today) return 'text-danger';
      if (due.getTime() === today.getTime()) return 'text-warning';
      return '';
    };

    // 处理选择变化
    const handleSelectionChange = (val) => {
      selectedRows.value = val;
    };

    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      loadData();
    };

    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
      loadData();
    };

    // 搜索
    const search = () => {
      pagination.currentPage = 1;
      loadData();
    };

    // 重置搜索
    const resetSearch = () => {
      Object.keys(searchForm).forEach(key => {
        if (key === 'reminderDateRange') {
          searchForm[key] = null;
        } else {
          searchForm[key] = '';
        }
      });
      pagination.currentPage = 1;
      loadData();
    };

    // 重置表单
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields();
      }
      Object.assign(formData, {
        id: '',
        customerId: '',
        customerName: '',
        orderId: '',
        orderNumber: '',
        amount: 0,
        dueDate: new Date(),
        reminderDate: new Date(),
        reminderMethod: 'email',
        responsiblePerson: '张三',
        reminderContent: '',
        remark: ''
      });
      isEdit.value = false;
    };

    // 重置发送表单
    const resetSendForm = () => {
      Object.assign(sendForm, {
        customerName: '',
        amount: 0,
        reminderMethod: 'email',
        contactInfo: '',
        reminderContent: '',
        nextFollowDate: null
      });
    };

    // 客户选择变化
    const onCustomerChange = () => {
      const customer = customerList.value.find(c => c.id === formData.customerId);
      if (customer) {
        formData.customerName = customer.name;
      }
      // 重置订单选择
      formData.orderId = '';
      formData.orderNumber = '';
      formData.amount = 0;
    };

    // 订单选择变化
    const onOrderChange = () => {
      const order = orderList.value.find(o => o.id === formData.orderId);
      if (order) {
        formData.orderNumber = order.orderNumber;
        formData.amount = order.remainingAmount;
      }
    };

    // 创建提醒
    const createReminder = () => {
      resetForm();
      createDialogVisible.value = true;
    };

    // 编辑提醒
    const editReminder = (row) => {
      currentReminder.value = { ...row };
      formData.id = row.id;
      formData.customerId = customerList.value.find(c => c.name === row.customerName)?.id || '';
      formData.customerName = row.customerName;
      formData.orderId = orderList.value.find(o => o.orderNumber === row.orderNumber)?.id || '';
      formData.orderNumber = row.orderNumber;
      formData.amount = row.amount;
      formData.dueDate = new Date(row.dueDate);
      formData.reminderDate = new Date(row.reminderDate);
      formData.reminderMethod = row.reminderMethod;
      formData.responsiblePerson = row.responsiblePerson;
      formData.reminderContent = row.reminderContent || '';
      formData.remark = row.remark || '';
      isEdit.value = true;
      createDialogVisible.value = true;
    };

    // 保存提醒
    const saveReminder = async () => {
      try {
        await formRef.value.validate();
        
        // 调用API保存数据
        const response = isEdit.value 
          ? await accountReceivableApi.updatePaymentReminder(formData)
          : await accountReceivableApi.createPaymentReminder(formData);
          
        if (response.code === 200) {
          ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
          createDialogVisible.value = false;
          loadData();
        } else {
          ElMessage.error(response.message || '操作失败');
        }
      } catch (error) {
        console.error('保存失败:', error);
        ElMessage.error('网络错误，请稍后重试');
      }
    };

    // 发送提醒
    const sendReminder = (row) => {
      currentReminder.value = { ...row };
      sendForm.customerName = row.customerName;
      sendForm.amount = row.amount;
      sendForm.reminderMethod = row.reminderMethod;
      sendForm.reminderContent = row.reminderContent || '';
      sendForm.nextFollowDate = new Date();
      sendDialogVisible.value = true;
    };

    // 确认发送提醒
    const confirmSendReminder = async () => {
      try {
        await sendFormRef.value.validate();
        
        // 模拟发送
        ElMessageBox.confirm('确定要发送提醒吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }).then(async () => {
          // 调用API发送提醒
          const response = await accountReceivableApi.sendPaymentReminder(sendForm);
          
          if (response.code === 200) {
            ElMessage.success('提醒发送成功');
            sendDialogVisible.value = false;
            loadData();
          } else {
            ElMessage.error(response.message || '发送失败');
          }
        }).catch(() => {});
      } catch (error) {
        console.error('发送失败:', error);
        ElMessage.error('网络错误，请稍后重试');
      }
    };

    // 跟进提醒
    const followUpReminder = async (row) => {
      currentReminder.value = { ...row };
      // 重置跟进表单
      Object.assign(followUpForm, {
        followDate: new Date(),
        followMethod: 'phone',
        content: '',
        feedback: '',
        nextFollowDate: null
      });
      
      // 加载跟进记录
      await loadFollowUpRecords();
      
      followUpDialogVisible.value = true;
    };

    // 添加跟进记录
    const addFollowUpRecord = async () => {
      try {
        // 调用API添加跟进记录
        const response = await accountReceivableApi.addPaymentFollowUp({
          reminderId: currentReminder.value.id,
          ...followUpForm
        });
        
        if (response.code === 200) {
          ElMessage.success('记录添加成功');
          // 重新加载跟进记录
          await loadFollowUpRecords();
          // 重置跟进表单
          Object.assign(followUpForm, {
            followDate: new Date(),
            followMethod: 'phone',
            content: '',
            feedback: '',
            nextFollowDate: null
          });
        } else {
          ElMessage.error(response.message || '添加记录失败');
        }
      } catch (error) {
        console.error('添加记录失败:', error);
        ElMessage.error('网络错误，请稍后重试');
      }
    };
    
    // 加载跟进记录
    const loadFollowUpRecords = async () => {
      if (!currentReminder.value?.id) return;
      
      try {
        const response = await accountReceivableApi.getPaymentFollowUpRecords({
          reminderId: currentReminder.value.id
        });
        
        if (response.code === 200) {
          followUpRecords.value = response.data || [];
        }
      } catch (error) {
        console.error('加载跟进记录失败:', error);
      }
    };

    // 取消提醒
    const cancelReminder = (row) => {
      ElMessageBox.confirm('确定要取消此提醒吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 调用API取消提醒
          const response = await accountReceivableApi.cancelPaymentReminder(row.id);
          
          if (response.code === 200) {
            ElMessage.success('提醒已取消');
            loadData();
          } else {
            ElMessage.error(response.message || '取消失败');
          }
        } catch (error) {
          console.error('取消提醒失败:', error);
          ElMessage.error('网络错误，请稍后重试');
        }
      }).catch(() => {});
    };

    // 查看提醒详情
    const viewReminderDetails = (row) => {
      currentReminder.value = { ...row };
      detailDialogVisible.value = true;
    };

    // 查看订单详情
    const viewOrderDetails = (row) => {
      ElMessage.info('查看订单详情功能待实现');
    };

    // 刷新数据
    const refreshData = () => {
      loadData();
      ElMessage.success('数据已刷新');
    };

    // 加载数据
    const loadData = async () => {
      loading.value = true;
      try {
        // 构建请求参数
        const params = {
          ...searchForm,
          page: pagination.currentPage,
          pageSize: pagination.pageSize
        };
        
        // 调用API获取数据
        const response = await accountReceivableApi.getPaymentReminderList(params);
        
        if (response.code === 200) {
          reminderList.value = response.data.list || [];
          pagination.total = response.data.total || 0;
          
          // 更新统计数据
          pendingReminderCount.value = response.data.stats?.pendingCount || 0;
          pendingReminderAmount.value = response.data.stats?.pendingAmount || 0;
          todayDueCount.value = response.data.stats?.todayDueCount || 0;
          todayDueAmount.value = response.data.stats?.todayDueAmount || 0;
          weekDueCount.value = response.data.stats?.weekDueCount || 0;
          weekDueAmount.value = response.data.stats?.weekDueAmount || 0;
          completedCount.value = response.data.stats?.completedCount || 0;
          completionRate.value = response.data.stats?.completionRate || 0;
        } else {
          ElMessage.error(response.message || '获取数据失败');
        }
      } catch (error) {
        console.error('获取提醒列表失败:', error);
        ElMessage.error('网络错误，请稍后重试');
      } finally {
        loading.value = false;
      }
    };

    // 生命周期
    onMounted(() => {
      loadData();
    });

    return {
      loading,
      reminderList,
      selectedRows,
      searchForm,
      pagination,
      createDialogVisible,
      sendDialogVisible,
      followUpDialogVisible,
      detailDialogVisible,
      currentReminder,
      followUpRecords,
      isEdit,
      formData,
      formRef,
      sendForm,
      sendFormRef,
      followUpForm,
      rules,
      sendRules,
      followUpRules,
      customerList,
      availableOrders,
      pendingReminderCount,
      pendingReminderAmount,
      todayDueCount,
      todayDueAmount,
      weekDueCount,
      weekDueAmount,
      completedCount,
      completionRate,
      formatDate,
      formatCurrency,
      getStatusType,
      getStatusText,
      getMethodType,
      getMethodText,
      getFollowMethodText,
      getDueDateClass,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      resetForm,
      resetSendForm,
      onCustomerChange,
      onOrderChange,
      createReminder,
      editReminder,
      saveReminder,
      sendReminder,
      confirmSendReminder,
      followUpReminder,
      addFollowUpRecord,
      cancelReminder,
      viewReminderDetails,
      viewOrderDetails,
      refreshData
    };
  }
};
</script>

<style scoped>
.payment-reminder {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.search-form {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-value.primary {
  color: #409eff;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-desc {
  font-size: 12px;
  color: #909399;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.follow-up-content,
.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.reminder-info h3 {
  margin-bottom: 15px;
  color: #303133;
}

.add-follow-up {
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.follow-up-records h3 {
  margin-bottom: 20px;
  color: #303133;
}
</style>