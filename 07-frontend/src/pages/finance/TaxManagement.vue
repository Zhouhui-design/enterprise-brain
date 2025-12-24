<template>
  <CommonFinanceTemplate
    pageTitle="税务管理"
    :show-search="true"
    :show-table="true"
    :show-pagination="true"
    :show-statistics="true"
    :show-chart="true"
    ref="templateRef"
    @search="handleSearch"
    @reset="handleReset"
    @page-change="handlePageChange"
    @mounted="handleMounted"
  >
    <!-- 图表切换标签 -->
    <template #chart-tabs>
      <el-radio-group v-model="activeChartTab" @change="handleChartTabChange" style="margin-bottom: 20px;">
        <el-radio-button label="taxPaymentChart">税费缴纳趋势</el-radio-button>
        <el-radio-button label="taxCategoryChart">税种分布</el-radio-button>
        <el-radio-button label="taxRateChart">税率结构</el-radio-button>
        <el-radio-button label="complianceChart">合规状态</el-radio-button>
      </el-radio-group>
    </template>
    
    <!-- 税费缴纳趋势图表 -->
    <template #taxPaymentChart>
      <div class="chart-container">
        <canvas ref="taxPaymentChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 税种分布图表 -->
    <template #taxCategoryChart>
      <div class="chart-container">
        <canvas ref="taxCategoryChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 税率结构图表 -->
    <template #taxRateChart>
      <div class="chart-container">
        <canvas ref="taxRateChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 合规状态图表 -->
    <template #complianceChart>
      <div class="chart-container">
        <canvas ref="complianceChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 自定义操作列 -->
    <template #operation="{ row }">
      <el-button type="primary" size="small" @click="handleViewDetail(row)">查看</el-button>
      <el-button type="success" size="small" @click="handleEditTax(row)">编辑</el-button>
      <el-button type="warning" size="small" @click="handleDeclaration(row)">申报</el-button>
      <el-button type="danger" size="small" @click="handleDeleteTax(row)">删除</el-button>
    </template>
    
    <!-- 税务信息编辑对话框 -->
    <template #dialog-edit="{ dialog }">
      <div class="tax-form-container">
        <el-form :model="taxForm" :rules="taxFormRules" ref="taxFormRef" label-width="120px">
          <el-form-item label="税种名称" prop="taxName">
            <el-input v-model="taxForm.taxName" placeholder="请输入税种名称" />
          </el-form-item>
          <el-form-item label="税率类型" prop="taxRateType">
            <el-radio-group v-model="taxForm.taxRateType">
              <el-radio-button label="percent">百分比</el-radio-button>
              <el-radio-button label="fixed">固定金额</el-radio-button>
              <el-radio-button label="progressive">累进税率</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="税率/金额" prop="taxRate" v-if="taxForm.taxRateType !== 'progressive'">
            <el-input v-model="taxForm.taxRate" placeholder="请输入税率（%）或固定金额" :suffix-icon="taxForm.taxRateType === 'percent' ? 'el-icon-percentage' : 'el-icon-money'" />
          </el-form-item>
          <el-form-item label="累进税率设置" v-if="taxForm.taxRateType === 'progressive'">
            <el-table :data="taxForm.progressiveRates" border style="width: 100%;">
              <el-table-column prop="minValue" label="起征点" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.minValue" type="number" style="width: 100%;" />
                </template>
              </el-table-column>
              <el-table-column prop="maxValue" label="最大值" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.maxValue" type="number" style="width: 100%;" />
                </template>
              </el-table-column>
              <el-table-column prop="rate" label="税率(%)" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.rate" type="number" style="width: 100%;" />
                </template>
              </el-table-column>
              <el-table-column prop="fixedAmount" label="固定金额" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.fixedAmount" type="number" style="width: 100%;" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ $index }">
                  <el-button type="danger" size="small" @click="removeProgressiveRate($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" size="small" @click="addProgressiveRate" style="margin-top: 10px;">添加税率级距</el-button>
          </el-form-item>
          <el-form-item label="申报周期" prop="declarationCycle">
            <el-select v-model="taxForm.declarationCycle" placeholder="请选择申报周期">
              <el-option label="月度" value="monthly" />
              <el-option label="季度" value="quarterly" />
              <el-option label="半年度" value="semiannual" />
              <el-option label="年度" value="annual" />
              <el-option label="单次" value="single" />
            </el-select>
          </el-form-item>
          <el-form-item label="申报截止日" prop="deadlineDay">
            <el-input v-model="taxForm.deadlineDay" type="number" placeholder="请输入截止日（如15表示每月15日）" />
          </el-form-item>
          <el-form-item label="税费科目" prop="account">
            <el-select v-model="taxForm.account" placeholder="请选择税费科目">
              <el-option v-for="account in accountOptions" :key="account.value" :label="account.label" :value="account.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注说明" prop="description">
            <el-input v-model="taxForm.description" type="textarea" :rows="3" placeholder="请输入备注说明" />
          </el-form-item>
          <el-form-item>
            <el-switch v-model="taxForm.isActive" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </el-form>
      </div>
    </template>
    
    <!-- 税务申报对话框 -->
    <template #dialog-declaration="{ dialog }">
      <div class="declaration-container">
        <el-form :model="declarationForm" :rules="declarationFormRules" ref="declarationFormRef" label-width="120px">
          <el-form-item label="税种名称" prop="taxName">
            <el-input v-model="declarationForm.taxName" disabled />
          </el-form-item>
          <el-form-item label="申报期间" prop="declarationPeriod">
            <el-date-picker v-model="declarationForm.declarationPeriod" type="month" placeholder="选择申报月份" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="计税依据" prop="taxBase">
            <el-input v-model="declarationForm.taxBase" type="number" placeholder="请输入计税依据" />
          </el-form-item>
          <el-form-item label="应纳税额" prop="taxAmount">
            <el-input v-model="declarationForm.taxAmount" type="number" placeholder="请输入应纳税额" />
          </el-form-item>
          <el-form-item label="已缴税额" prop="paidAmount">
            <el-input v-model="declarationForm.paidAmount" type="number" placeholder="请输入已缴税额" />
          </el-form-item>
          <el-form-item label="申报状态" prop="status">
            <el-select v-model="declarationForm.status" placeholder="请选择申报状态">
              <el-option label="已申报" value="declared" />
              <el-option label="已缴款" value="paid" />
              <el-option label="已退税" value="refunded" />
              <el-option label="逾期未申报" value="overdue" />
              <el-option label="部分缴款" value="partially_paid" />
            </el-select>
          </el-form-item>
          <el-form-item label="申报日期" prop="declarationDate">
            <el-date-picker v-model="declarationForm.declarationDate" type="date" placeholder="选择申报日期" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="缴款日期" prop="paymentDate">
            <el-date-picker v-model="declarationForm.paymentDate" type="date" placeholder="选择缴款日期" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="申报编号" prop="declarationNumber">
            <el-input v-model="declarationForm.declarationNumber" placeholder="请输入申报编号" />
          </el-form-item>
          <el-form-item label="申报人" prop="declarationPerson">
            <el-input v-model="declarationForm.declarationPerson" placeholder="请输入申报人" />
          </el-form-item>
          <el-form-item label="备注说明" prop="description">
            <el-input v-model="declarationForm.description" type="textarea" :rows="3" placeholder="请输入备注说明" />
          </el-form-item>
          <el-form-item label="附件上传">
            <el-upload
              class="upload-demo"
              drag
              action=""
              :auto-upload="false"
              :file-list="declarationForm.attachments"
              @change="handleAttachmentChange"
              multiple
            >
              <i class="el-icon-upload"></i>
              <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">
                  请上传申报表、完税证明等文件，支持 PDF、JPG、PNG 格式，单个文件不超过 10MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>
      </div>
    </template>
    
    <!-- 税务详情查看对话框 -->
    <template #dialog-view-detail="{ dialog }">
      <div class="tax-detail-container">
        <h3>{{ currentTaxDetail.taxName }} - 详细信息</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="税种名称">{{ currentTaxDetail.taxName }}</el-descriptions-item>
          <el-descriptions-item label="税率类型">{{ getTaxRateTypeText(currentTaxDetail.taxRateType) }}</el-descriptions-item>
          <el-descriptions-item label="税率/金额">
            <template v-if="currentTaxDetail.taxRateType === 'percent'">
              {{ formatPercentage(currentTaxDetail.taxRate / 100) }}
            </template>
            <template v-else-if="currentTaxDetail.taxRateType === 'fixed'">
              {{ formatCurrency(currentTaxDetail.taxRate) }}
            </template>
            <template v-else-if="currentTaxDetail.taxRateType === 'progressive'">
              <el-table :data="currentTaxDetail.progressiveRates" border style="width: 100%; margin-top: 10px;">
                <el-table-column prop="minValue" label="起征点" />
                <el-table-column prop="maxValue" label="最大值" />
                <el-table-column prop="rate" label="税率(%)" :formatter="formatRateValue" />
                <el-table-column prop="fixedAmount" label="固定金额" :formatter="formatCurrency" />
              </el-table>
            </template>
          </el-descriptions-item>
          <el-descriptions-item label="申报周期">{{ getCycleText(currentTaxDetail.declarationCycle) }}</el-descriptions-item>
          <el-descriptions-item label="申报截止日">{{ currentTaxDetail.deadlineDay }}日</el-descriptions-item>
          <el-descriptions-item label="税费科目">{{ getAccountText(currentTaxDetail.account) }}</el-descriptions-item>
          <el-descriptions-item label="启用状态">{{ currentTaxDetail.isActive ? '启用' : '禁用' }}</el-descriptions-item>
          <el-descriptions-item label="创建日期">{{ formatDateTime(currentTaxDetail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新日期">{{ formatDateTime(currentTaxDetail.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="备注说明">{{ currentTaxDetail.description }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 申报记录 -->
        <h4 style="margin-top: 30px;">申报记录</h4>
        <el-table :data="currentTaxDetail.declarationRecords" border style="width: 100%;">
          <el-table-column prop="declarationPeriod" label="申报期间" width="120" />
          <el-table-column prop="taxAmount" label="应纳税额" width="120" :formatter="formatCurrency" />
          <el-table-column prop="paidAmount" label="已缴税额" width="120" :formatter="formatCurrency" />
          <el-table-column prop="status" label="申报状态" width="100" :formatter="getStatusTag" />
          <el-table-column prop="declarationDate" label="申报日期" width="120" :formatter="formatDate" />
          <el-table-column prop="paymentDate" label="缴款日期" width="120" :formatter="formatDate" />
          <el-table-column prop="declarationPerson" label="申报人" width="100" />
          <el-table-column prop="declarationNumber" label="申报编号" min-width="150" />
        </el-table>
      </div>
    </template>
  </CommonFinanceTemplate>
</template>

<script lang="jsx">
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import CommonFinanceTemplate from './template/CommonFinanceTemplate.vue';

// 模拟图表库，实际应用中应引入真实的图表库如 Chart.js
class MockChart {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.destroyed = false;
    console.log('Mock Chart initialized:', config);
    // 在实际应用中，这里会初始化真实的图表
  }
  
  update() {
    if (!this.destroyed) {
      console.log('Mock Chart updated');
    }
  }
  
  destroy() {
    this.destroyed = true;
    console.log('Mock Chart destroyed');
  }
}

export default {
  name: 'TaxManagement',
  components: {
    CommonFinanceTemplate
  },
  setup() {
    // 模板引用
    const templateRef = ref(null);
    const taxFormRef = ref(null);
    const declarationFormRef = ref(null);
    
    // 图表引用
    const taxPaymentChartRef = ref(null);
    const taxCategoryChartRef = ref(null);
    const taxRateChartRef = ref(null);
    const complianceChartRef = ref(null);
    
    // 图表实例
    const chartInstances = reactive({
      taxPaymentChart: null,
      taxCategoryChart: null,
      taxRateChart: null,
      complianceChart: null
    });
    
    // 状态管理
    const activeChartTab = ref('taxPaymentChart');
    const chartWidth = ref(800);
    const chartHeight = ref(400);
    const currentTaxDetail = reactive({});
    const isEditMode = ref(false);
    
    // 税务数据
    const taxData = ref([]);
    
    // 科目选项
    const accountOptions = ref([
      { label: '增值税', value: 'VAT' },
      { label: '企业所得税', value: 'CIT' },
      { label: '个人所得税', value: 'PIT' },
      { label: '城市维护建设税', value: 'UMCT' },
      { label: '教育费附加', value: 'EAF' },
      { label: '地方教育附加', value: 'LEAF' },
      { label: '印花税', value: 'STAMP' },
      { label: '房产税', value: 'PBT' },
      { label: '土地使用税', value: 'LUT' },
      { label: '车船税', value: 'VLT' },
      { label: '其他税费', value: 'OTHER' }
    ]);
    
    // 税务表单
    const taxForm = reactive({
      id: '',
      taxName: '',
      taxRateType: 'percent',
      taxRate: '',
      progressiveRates: [],
      declarationCycle: 'monthly',
      deadlineDay: 15,
      account: '',
      description: '',
      isActive: true
    });
    
    // 税务表单验证规则
    const taxFormRules = {
      taxName: [
        { required: true, message: '请输入税种名称', trigger: 'blur' },
        { min: 2, max: 50, message: '税种名称长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      taxRate: [
        {
          validator: (rule, value, callback) => {
            if (taxForm.taxRateType !== 'progressive' && !value) {
              callback(new Error('请输入税率或固定金额'));
            } else if (value && isNaN(value)) {
              callback(new Error('请输入有效的数字'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ],
      declarationCycle: [
        { required: true, message: '请选择申报周期', trigger: 'change' }
      ],
      deadlineDay: [
        { required: true, message: '请输入申报截止日', trigger: 'blur' },
        { type: 'number', min: 1, max: 31, message: '截止日必须在1到31之间', trigger: 'blur' }
      ],
      account: [
        { required: true, message: '请选择税费科目', trigger: 'change' }
      ]
    };
    
    // 申报表单
    const declarationForm = reactive({
      id: '',
      taxId: '',
      taxName: '',
      declarationPeriod: '',
      taxBase: '',
      taxAmount: '',
      paidAmount: '',
      status: 'declared',
      declarationDate: '',
      paymentDate: '',
      declarationNumber: '',
      declarationPerson: '',
      description: '',
      attachments: []
    });
    
    // 申报表单验证规则
    const declarationFormRules = {
      declarationPeriod: [
        { required: true, message: '请选择申报期间', trigger: 'change' }
      ],
      taxBase: [
        { required: true, message: '请输入计税依据', trigger: 'blur' },
        { type: 'number', min: 0, message: '计税依据必须大于等于0', trigger: 'blur' }
      ],
      taxAmount: [
        { required: true, message: '请输入应纳税额', trigger: 'blur' },
        { type: 'number', min: 0, message: '应纳税额必须大于等于0', trigger: 'blur' }
      ],
      paidAmount: [
        { required: true, message: '请输入已缴税额', trigger: 'blur' },
        { type: 'number', min: 0, message: '已缴税额必须大于等于0', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择申报状态', trigger: 'change' }
      ],
      declarationDate: [
        { required: true, message: '请选择申报日期', trigger: 'change' }
      ],
      declarationNumber: [
        { required: true, message: '请输入申报编号', trigger: 'blur' }
      ],
      declarationPerson: [
        { required: true, message: '请输入申报人', trigger: 'blur' }
      ]
    };
    
    // 初始化搜索字段
    const initSearchFields = () => {
      const searchFields = [
        {
          key: 'taxName',
          type: 'input',
          label: '税种名称',
          placeholder: '请输入税种名称'
        },
        {
          key: 'account',
          type: 'select',
          label: '税费科目',
          options: accountOptions.value,
          clearable: true
        },
        {
          key: 'taxRateType',
          type: 'select',
          label: '税率类型',
          options: [
            { label: '百分比', value: 'percent' },
            { label: '固定金额', value: 'fixed' },
            { label: '累进税率', value: 'progressive' }
          ],
          clearable: true
        },
        {
          key: 'declarationCycle',
          type: 'select',
          label: '申报周期',
          options: [
            { label: '月度', value: 'monthly' },
            { label: '季度', value: 'quarterly' },
            { label: '半年度', value: 'semiannual' },
            { label: '年度', value: 'annual' },
            { label: '单次', value: 'single' }
          ],
          clearable: true
        },
        {
          key: 'isActive',
          type: 'select',
          label: '启用状态',
          options: [
            { label: '启用', value: true },
            { label: '禁用', value: false }
          ],
          clearable: true
        },
        {
          key: 'createdRange',
          type: 'date',
          label: '创建日期范围',
          dateType: 'daterange',
          startPlaceholder: '开始日期',
          endPlaceholder: '结束日期'
        }
      ];
      
      templateRef.value?.initSearchForm(searchFields);
    };
    
    // 初始化统计卡片
    const initStatisticsCards = () => {
      const cards = [
        {
          label: '税种总数',
          value: '0',
          type: 'primary',
          description: '当前系统中所有税种数量'
        },
        {
          label: '本月应缴税额',
          value: '0.00 元',
          type: 'success',
          description: '当月所有税种应缴税额合计'
        },
        {
          label: '本月已缴税额',
          value: '0.00 元',
          type: 'info',
          description: '当月所有税种已缴税额合计'
        },
        {
          label: '待缴税额',
          value: '0.00 元',
          type: 'warning',
          description: '所有未缴和部分缴款的税额合计'
        },
        {
          label: '逾期未申报',
          value: '0',
          type: 'danger',
          description: '逾期未申报的税种数量'
        },
        {
          label: '年度总税额',
          value: '0.00 元',
          type: 'primary',
          description: '本年度所有税种应缴税额合计'
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
          prop: 'taxName',
          label: '税种名称',
          minWidth: 150
        },
        {
          prop: 'taxRateType',
          label: '税率类型',
          width: 100,
          formatter: (row) => getTaxRateTypeText(row.taxRateType)
        },
        {
          prop: 'taxRate',
          label: '税率/金额',
          width: 120,
          formatter: (row) => {
            if (row.taxRateType === 'percent') {
              return formatPercentage(row.taxRate / 100);
            } else if (row.taxRateType === 'fixed') {
              return formatCurrency(row.taxRate);
            }
            return '累进税率';
          }
        },
        {
          prop: 'declarationCycle',
          label: '申报周期',
          width: 100,
          formatter: (row) => getCycleText(row.declarationCycle)
        },
        {
          prop: 'deadlineDay',
          label: '截止日',
          width: 80,
          formatter: (row) => `${row.deadlineDay}日`
        },
        {
          prop: 'account',
          label: '税费科目',
          width: 120,
          formatter: (row) => getAccountText(row.account)
        },
        {
          prop: 'isActive',
          label: '状态',
          width: 80,
          formatter: (row) => {
            return row.isActive ? (
              <el-tag type="success" size="small">启用</el-tag>
            ) : (
              <el-tag type="danger" size="small">禁用</el-tag>
            );
          }
        },
        {
          prop: 'createdAt',
          label: '创建日期',
          width: 120,
          formatter: (row) => formatDate(row.createdAt)
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
          key: 'edit',
          visible: false,
          title: '编辑税务信息',
          width: '700px',
          onClose: () => {
            resetTaxForm();
          },
          buttons: [
            {
              key: 'save',
              text: '保存',
              type: 'primary',
              handler: handleSaveTax
            }
          ]
        },
        {
          key: 'declaration',
          visible: false,
          title: '税务申报',
          width: '700px',
          onClose: () => {
            resetDeclarationForm();
          },
          buttons: [
            {
              key: 'submit',
              text: '提交申报',
              type: 'primary',
              handler: handleSubmitDeclaration
            }
          ]
        },
        {
          key: 'view-detail',
          visible: false,
          title: '税务详情',
          width: '900px',
          onClose: () => {
            Object.keys(currentTaxDetail).forEach(key => delete currentTaxDetail[key]);
          },
          hideCancel: true,
          buttons: []
        }
      ];
      
      templateRef.value?.setDialogs(dialogs);
    };
    
    // 初始化头部操作按钮
    const initHeaderActions = () => {
      const actions = [
        {
          key: 'add',
          text: '新增税种',
          type: 'primary',
          icon: 'el-icon-plus',
          handler: handleAddTax
        },
        {
          key: 'batchImport',
          text: '批量导入',
          type: 'success',
          icon: 'el-icon-upload',
          handler: handleBatchImport
        },
        {
          key: 'batchExport',
          text: '批量导出',
          type: 'info',
          icon: 'el-icon-download',
          handler: handleBatchExport
        },
        {
          key: 'taxReport',
          text: '税务报表',
          type: 'warning',
          icon: 'el-icon-document',
          handler: handleGenerateTaxReport
        },
        {
          key: 'refresh',
          text: '刷新数据',
          type: 'info',
          icon: 'el-icon-refresh',
          handler: handleRefreshData
        },
        {
          key: 'settings',
          text: '税务设置',
          type: 'info',
          icon: 'el-icon-setting',
          handler: handleOpenSettings
        }
      ];
      
      templateRef.value?.setHeaderActions(actions);
    };
    
    // 加载税务数据
    const loadTaxData = () => {
      // 模拟数据加载
      const mockData = generateMockTaxData();
      taxData.value = mockData;
      
      // 更新统计信息
      updateStatistics(mockData);
      
      // 更新分页信息
      templateRef.value?.updatePagination(mockData.length, 1, 10);
    };
    
    // 生成模拟税务数据
    const generateMockTaxData = () => {
      const baseTaxes = [
        {
          id: '1',
          taxName: '增值税（一般纳税人）',
          taxRateType: 'percent',
          taxRate: 13,
          progressiveRates: [],
          declarationCycle: 'monthly',
          deadlineDay: 15,
          account: 'VAT',
          description: '销售货物或提供加工、修理修配劳务的增值税',
          isActive: true,
          createdAt: '2023-01-15T10:00:00Z',
          updatedAt: '2023-06-20T14:30:00Z'
        },
        {
          id: '2',
          taxName: '增值税（小规模纳税人）',
          taxRateType: 'percent',
          taxRate: 3,
          progressiveRates: [],
          declarationCycle: 'quarterly',
          deadlineDay: 15,
          account: 'VAT',
          description: '小规模纳税人适用的增值税率',
          isActive: true,
          createdAt: '2023-01-15T10:10:00Z',
          updatedAt: '2023-05-10T09:15:00Z'
        },
        {
          id: '3',
          taxName: '企业所得税',
          taxRateType: 'percent',
          taxRate: 25,
          progressiveRates: [],
          declarationCycle: 'quarterly',
          deadlineDay: 15,
          account: 'CIT',
          description: '企业所得税基本税率',
          isActive: true,
          createdAt: '2023-01-15T10:20:00Z',
          updatedAt: '2023-07-05T16:40:00Z'
        },
        {
          id: '4',
          taxName: '个人所得税（工资薪金）',
          taxRateType: 'progressive',
          taxRate: 0,
          progressiveRates: [
            { minValue: 0, maxValue: 3000, rate: 3, fixedAmount: 0 },
            { minValue: 3000, maxValue: 12000, rate: 10, fixedAmount: 210 },
            { minValue: 12000, maxValue: 25000, rate: 20, fixedAmount: 1410 },
            { minValue: 25000, maxValue: 35000, rate: 25, fixedAmount: 2660 },
            { minValue: 35000, maxValue: 55000, rate: 30, fixedAmount: 4410 },
            { minValue: 55000, maxValue: 80000, rate: 35, fixedAmount: 7160 },
            { minValue: 80000, maxValue: null, rate: 45, fixedAmount: 15160 }
          ],
          declarationCycle: 'monthly',
          deadlineDay: 15,
          account: 'PIT',
          description: '工资薪金所得个人所得税累进税率',
          isActive: true,
          createdAt: '2023-01-15T10:30:00Z',
          updatedAt: '2023-08-12T11:25:00Z'
        },
        {
          id: '5',
          taxName: '城市维护建设税',
          taxRateType: 'percent',
          taxRate: 7,
          progressiveRates: [],
          declarationCycle: 'monthly',
          deadlineDay: 15,
          account: 'UMCT',
          description: '市区城市维护建设税税率',
          isActive: true,
          createdAt: '2023-01-15T10:40:00Z',
          updatedAt: '2023-04-08T15:50:00Z'
        },
        {
          id: '6',
          taxName: '教育费附加',
          taxRateType: 'percent',
          taxRate: 3,
          progressiveRates: [],
          declarationCycle: 'monthly',
          deadlineDay: 15,
          account: 'EAF',
          description: '教育费附加税率',
          isActive: true,
          createdAt: '2023-01-15T10:50:00Z',
          updatedAt: '2023-03-17T13:10:00Z'
        },
        {
          id: '7',
          taxName: '地方教育附加',
          taxRateType: 'percent',
          taxRate: 2,
          progressiveRates: [],
          declarationCycle: 'monthly',
          deadlineDay: 15,
          account: 'LEAF',
          description: '地方教育附加税率',
          isActive: true,
          createdAt: '2023-01-15T11:00:00Z',
          updatedAt: '2023-02-22T10:35:00Z'
        },
        {
          id: '8',
          taxName: '印花税（购销合同）',
          taxRateType: 'percent',
          taxRate: 0.03,
          progressiveRates: [],
          declarationCycle: 'monthly',
          deadlineDay: 15,
          account: 'STAMP',
          description: '购销合同印花税税率',
          isActive: true,
          createdAt: '2023-01-15T11:10:00Z',
          updatedAt: '2023-06-30T09:40:00Z'
        },
        {
          id: '9',
          taxName: '房产税',
          taxRateType: 'percent',
          taxRate: 1.2,
          progressiveRates: [],
          declarationCycle: 'quarterly',
          deadlineDay: 15,
          account: 'PBT',
          description: '从价计征房产税税率',
          isActive: true,
          createdAt: '2023-01-15T11:20:00Z',
          updatedAt: '2023-01-15T11:20:00Z'
        },
        {
          id: '10',
          taxName: '土地使用税',
          taxRateType: 'fixed',
          taxRate: 15,
          progressiveRates: [],
          declarationCycle: 'quarterly',
          deadlineDay: 15,
          account: 'LUT',
          description: '每平方米土地使用税税额（元/平方米/年）',
          isActive: true,
          createdAt: '2023-01-15T11:30:00Z',
          updatedAt: '2023-05-25T14:15:00Z'
        }
      ];
      
      // 为每个税种生成申报记录
      return baseTaxes.map(tax => ({
        ...tax,
        declarationRecords: generateDeclarationRecords(tax.id, tax.taxName)
      }));
    };
    
    // 生成模拟申报记录
    const generateDeclarationRecords = (taxId, taxName) => {
      const records = [];
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      // 生成最近12个月的记录
      for (let i = 11; i >= 0; i--) {
        let month = currentMonth - i;
        let year = currentYear;
        
        if (month <= 0) {
          month += 12;
          year -= 1;
        }
        
        const monthStr = String(month).padStart(2, '0');
        const declarationPeriod = `${year}-${monthStr}`;
        
        // 生成基础税额（根据税种不同）
        let baseAmount = 10000;
        if (taxName.includes('增值税') && taxName.includes('13')) baseAmount = 50000;
        else if (taxName.includes('增值税') && taxName.includes('3')) baseAmount = 15000;
        else if (taxName.includes('企业所得税')) baseAmount = 100000;
        else if (taxName.includes('个人所得税')) baseAmount = 20000;
        
        // 添加随机波动
        const randomFactor = 0.8 + 0.4 * Math.random();
        const taxAmount = Math.round(baseAmount * randomFactor);
        
        // 随机生成已缴金额（可能全额缴纳或部分缴纳）
        const paymentRatio = Math.random() > 0.1 ? 1 : (0.3 + 0.6 * Math.random()); // 90%概率全额缴纳
        const paidAmount = Math.round(taxAmount * paymentRatio);
        
        // 确定状态
        let status = 'paid';
        if (paidAmount < taxAmount) status = 'partially_paid';
        
        // 随机生成逾期状态
        if (Math.random() > 0.9) status = 'overdue';
        
        // 生成申报日期（截止日前或后）
        const deadlineDay = Math.min(28, Math.floor(Math.random() * 5) + 10); // 10-14日之间
        const declarationDate = new Date(year, month - 1, deadlineDay);
        
        // 生成缴款日期（申报后1-5天内）
        const paymentDate = new Date(declarationDate);
        paymentDate.setDate(declarationDate.getDate() + Math.floor(Math.random() * 5) + 1);
        
        records.push({
          id: `${taxId}-${year}-${monthStr}`,
          taxId,
          taxName,
          declarationPeriod,
          taxBase: Math.round(taxAmount * (2 + 3 * Math.random())),
          taxAmount,
          paidAmount,
          status,
          declarationDate: declarationDate.toISOString().split('T')[0],
          paymentDate: paidAmount > 0 ? paymentDate.toISOString().split('T')[0] : null,
          declarationNumber: `${taxId.toUpperCase()}-${year}${monthStr}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          declarationPerson: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
          description: `${taxName} ${year}年${month}月申报记录`,
          createdAt: new Date().toISOString()
        });
      }
      
      return records;
    };
    
    // 更新统计信息
    const updateStatistics = (data) => {
      if (data.length === 0) return;
      
      // 计算统计数据
      const totalTaxCount = data.length;
      const activeTaxCount = data.filter(tax => tax.isActive).length;
      
      // 获取当前月份和年份
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
      const currentMonthStr = `${currentYear}-${currentMonth}`;
      
      // 计算本月应缴和已缴税额
      let currentMonthTaxAmount = 0;
      let currentMonthPaidAmount = 0;
      let overdueCount = 0;
      let annualTotalAmount = 0;
      
      data.forEach(tax => {
        // 查找本月申报记录
        const monthRecord = tax.declarationRecords.find(record => 
          record.declarationPeriod === currentMonthStr
        );
        
        if (monthRecord) {
          currentMonthTaxAmount += monthRecord.taxAmount;
          currentMonthPaidAmount += monthRecord.paidAmount;
          if (monthRecord.status === 'overdue') {
            overdueCount++;
          }
        }
        
        // 计算年度总额
        tax.declarationRecords.forEach(record => {
          if (record.declarationPeriod.startsWith(currentYear.toString())) {
            annualTotalAmount += record.taxAmount;
          }
        });
      });
      
      // 计算待缴税额（所有未缴和部分缴款）
      let pendingAmount = 0;
      data.forEach(tax => {
        tax.declarationRecords.forEach(record => {
          if (record.status === 'declared' || record.status === 'partially_paid' || record.status === 'overdue') {
            pendingAmount += (record.taxAmount - record.paidAmount);
          }
        });
      });
      
      const cards = templateRef.value?.statisticsCards || [];
      if (cards.length >= 6) {
        cards[0].value = totalTaxCount.toString();
        cards[1].value = formatCurrency(currentMonthTaxAmount);
        cards[2].value = formatCurrency(currentMonthPaidAmount);
        cards[3].value = formatCurrency(pendingAmount);
        cards[4].value = overdueCount.toString();
        cards[5].value = formatCurrency(annualTotalAmount);
      }
    };
    
    // 处理搜索
    const handleSearch = (searchParams) => {
      console.log('搜索参数:', searchParams);
      // 模拟搜索延迟
      templateRef.value.loading = true;
      setTimeout(() => {
        // 实际应用中应该根据搜索条件过滤数据
        templateRef.value.loading = false;
      }, 500);
    };
    
    // 处理重置
    const handleReset = (resetParams) => {
      console.log('重置参数:', resetParams);
      loadTaxData();
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
      loadTaxData();
      
      // 等待DOM更新后初始化图表
      nextTick(() => {
        updateCharts();
      });
    };
    
    // 新增税种
    const handleAddTax = () => {
      isEditMode.value = false;
      resetTaxForm();
      
      // 设置默认值
      taxForm.declarationCycle = 'monthly';
      taxForm.deadlineDay = 15;
      taxForm.taxRateType = 'percent';
      taxForm.isActive = true;
      
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit');
      if (dialog) {
        dialog.title = '新增税种';
        dialog.visible = true;
      }
    };
    
    // 编辑税种
    const handleEditTax = (row) => {
      isEditMode.value = true;
      resetTaxForm();
      
      // 复制数据到表单
      Object.assign(taxForm, JSON.parse(JSON.stringify(row)));
      
      // 对于累进税率，确保有默认数据
      if (taxForm.taxRateType === 'progressive' && taxForm.progressiveRates.length === 0) {
        taxForm.progressiveRates.push({
          minValue: 0,
          maxValue: null,
          rate: 0,
          fixedAmount: 0
        });
      }
      
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit');
      if (dialog) {
        dialog.title = '编辑税种';
        dialog.visible = true;
      }
    };
    
    // 保存税种
    const handleSaveTax = () => {
      taxFormRef.value?.validate((valid) => {
        if (valid) {
          // 准备保存数据
          const saveData = { ...taxForm };
          
          // 转换税率为数字类型
          if (saveData.taxRateType !== 'progressive') {
            saveData.taxRate = parseFloat(saveData.taxRate);
          }
          
          // 格式化累进税率数据
          if (saveData.taxRateType === 'progressive') {
            saveData.taxRate = 0;
            saveData.progressiveRates = saveData.progressiveRates.map(rate => ({
              ...rate,
              minValue: parseFloat(rate.minValue) || 0,
              maxValue: rate.maxValue ? parseFloat(rate.maxValue) : null,
              rate: parseFloat(rate.rate) || 0,
              fixedAmount: parseFloat(rate.fixedAmount) || 0
            }));
          }
          
          // 模拟保存操作
          setTimeout(() => {
            if (isEditMode.value) {
              // 更新现有记录
              const index = taxData.value.findIndex(item => item.id === saveData.id);
              if (index !== -1) {
                taxData.value[index] = {
                  ...saveData,
                  updatedAt: new Date().toISOString(),
                  declarationRecords: taxData.value[index].declarationRecords || []
                };
              }
            } else {
              // 添加新记录
              const newId = String(Date.now());
              taxData.value.unshift({
                ...saveData,
                id: newId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                declarationRecords: []
              });
            }
            
            // 更新统计和图表
            updateStatistics(taxData.value);
            updateCharts();
            
            // 关闭对话框
            const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit');
            if (dialog) {
              dialog.visible = false;
            }
            
            ElMessage.success(isEditMode.value ? '税种更新成功' : '税种添加成功');
          }, 500);
        }
      });
    };
    
    // 删除税种
    const handleDeleteTax = (row) => {
      ElMessageBox.confirm(
        `确定要删除税种「${row.taxName}」吗？此操作不可撤销。`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 模拟删除操作
        setTimeout(() => {
          const index = taxData.value.findIndex(item => item.id === row.id);
          if (index !== -1) {
            taxData.value.splice(index, 1);
            updateStatistics(taxData.value);
            updateCharts();
            ElMessage.success('税种删除成功');
          }
        }, 300);
      }).catch(() => {
        // 用户取消删除
      });
    };
    
    // 查看税务详情
    const handleViewDetail = (row) => {
      // 复制数据到详情对象
      Object.assign(currentTaxDetail, JSON.parse(JSON.stringify(row)));
      
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'view-detail');
      if (dialog) {
        dialog.title = `${row.taxName} - 详细信息`;
        dialog.visible = true;
      }
    };
    
    // 税务申报
    const handleDeclaration = (row) => {
      resetDeclarationForm();
      
      // 设置基本信息
      declarationForm.taxId = row.id;
      declarationForm.taxName = row.taxName;
      declarationForm.declarationPeriod = new Date(); // 默认当前月份
      declarationForm.status = 'declared';
      declarationForm.declarationDate = new Date(); // 默认当前日期
      
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'declaration');
      if (dialog) {
        dialog.visible = true;
      }
    };
    
    // 提交申报
    const handleSubmitDeclaration = () => {
      declarationFormRef.value?.validate((valid) => {
        if (valid) {
          // 准备提交数据
          const submitData = { ...declarationForm };
          
          // 转换金额为数字类型
          submitData.taxBase = parseFloat(submitData.taxBase);
          submitData.taxAmount = parseFloat(submitData.taxAmount);
          submitData.paidAmount = parseFloat(submitData.paidAmount);
          
          // 格式化日期
          if (submitData.declarationDate instanceof Date) {
            submitData.declarationDate = submitData.declarationDate.toISOString().split('T')[0];
          }
          if (submitData.paymentDate instanceof Date) {
            submitData.paymentDate = submitData.paymentDate.toISOString().split('T')[0];
          }
          if (submitData.declarationPeriod instanceof Date) {
            const year = submitData.declarationPeriod.getFullYear();
            const month = String(submitData.declarationPeriod.getMonth() + 1).padStart(2, '0');
            submitData.declarationPeriod = `${year}-${month}`;
          }
          
          // 模拟提交操作
          setTimeout(() => {
            // 查找对应的税种并添加申报记录
            const taxIndex = taxData.value.findIndex(item => item.id === submitData.taxId);
            if (taxIndex !== -1) {
              const newRecordId = `${submitData.taxId}-${submitData.declarationPeriod}-${Date.now()}`;
              submitData.id = newRecordId;
              
              // 查找是否已有同一期间的记录
              const existingRecordIndex = taxData.value[taxIndex].declarationRecords.findIndex(
                record => record.declarationPeriod === submitData.declarationPeriod
              );
              
              if (existingRecordIndex !== -1) {
                // 更新现有记录
                taxData.value[taxIndex].declarationRecords[existingRecordIndex] = {
                  ...submitData,
                  createdAt: new Date().toISOString()
                };
              } else {
                // 添加新记录
                taxData.value[taxIndex].declarationRecords.unshift({
                  ...submitData,
                  createdAt: new Date().toISOString()
                });
                
                // 排序记录（按期间倒序）
                taxData.value[taxIndex].declarationRecords.sort((a, b) => 
                  b.declarationPeriod.localeCompare(a.declarationPeriod)
                );
              }
            }
            
            // 更新统计和图表
            updateStatistics(taxData.value);
            updateCharts();
            
            // 关闭对话框
            const dialog = templateRef.value?.dialogs.find(d => d.key === 'declaration');
            if (dialog) {
              dialog.visible = false;
            }
            
            ElMessage.success('税务申报提交成功');
          }, 500);
        }
      });
    };
    
    // 批量导入
    const handleBatchImport = () => {
      ElMessage.info('批量导入功能待实现');
    };
    
    // 批量导出
    const handleBatchExport = () => {
      ElMessage.info('批量导出功能待实现');
    };
    
    // 生成税务报表
    const handleGenerateTaxReport = () => {
      ElMessage.info('税务报表功能待实现');
    };
    
    // 刷新数据
    const handleRefreshData = () => {
      templateRef.value.loading = true;
      setTimeout(() => {
        loadTaxData();
        updateCharts();
        templateRef.value.loading = false;
        ElMessage.success('数据刷新成功');
      }, 800);
    };
    
    // 打开设置
    const handleOpenSettings = () => {
      ElMessage.info('税务设置功能待实现');
    };
    
    // 处理附件上传变化
    const handleAttachmentChange = (file, fileList) => {
      declarationForm.attachments = fileList;
    };
    
    // 重置税务表单
    const resetTaxForm = () => {
      taxFormRef.value?.resetFields();
      Object.assign(taxForm, {
        id: '',
        taxName: '',
        taxRateType: 'percent',
        taxRate: '',
        progressiveRates: [],
        declarationCycle: '',
        deadlineDay: 15,
        account: '',
        description: '',
        isActive: true
      });
    };
    
    // 重置申报表单
    const resetDeclarationForm = () => {
      declarationFormRef.value?.resetFields();
      Object.assign(declarationForm, {
        id: '',
        taxId: '',
        taxName: '',
        declarationPeriod: '',
        taxBase: '',
        taxAmount: '',
        paidAmount: '',
        status: 'declared',
        declarationDate: '',
        paymentDate: '',
        declarationNumber: '',
        declarationPerson: '',
        description: '',
        attachments: []
      });
    };
    
    // 添加累进税率级距
    const addProgressiveRate = () => {
      if (!taxForm.progressiveRates) {
        taxForm.progressiveRates = [];
      }
      
      // 计算新的起征点（基于最后一个级距）
      const lastRate = taxForm.progressiveRates[taxForm.progressiveRates.length - 1];
      const newMinValue = lastRate && lastRate.maxValue ? lastRate.maxValue : 0;
      const newMaxValue = newMinValue + 10000; // 假设每个级距间隔10000
      
      taxForm.progressiveRates.push({
        minValue: newMinValue,
        maxValue: newMaxValue,
        rate: 0,
        fixedAmount: 0
      });
    };
    
    // 删除累进税率级距
    const removeProgressiveRate = (index) => {
      if (taxForm.progressiveRates.length > 1) {
        taxForm.progressiveRates.splice(index, 1);
      } else {
        ElMessage.warning('至少需要保留一个税率级距');
      }
    };
    
    // 处理图表标签切换
    const handleChartTabChange = () => {
      nextTick(() => {
        updateCurrentChart();
      });
    };
    
    // 更新所有图表
    const updateCharts = () => {
      // 销毁现有图表
      Object.values(chartInstances).forEach(instance => {
        if (instance) {
          instance.destroy();
        }
      });
      
      // 初始化当前活动的图表
      updateCurrentChart();
    };
    
    // 更新当前活动的图表
    const updateCurrentChart = () => {
      switch (activeChartTab.value) {
        case 'taxPaymentChart':
          initTaxPaymentChart();
          break;
        case 'taxCategoryChart':
          initTaxCategoryChart();
          break;
        case 'taxRateChart':
          initTaxRateChart();
          break;
        case 'complianceChart':
          initComplianceChart();
          break;
      }
    };
    
    // 初始化税费缴纳趋势图表
    const initTaxPaymentChart = () => {
      if (!taxPaymentChartRef.value || taxData.value.length === 0) return;
      
      // 获取最近6个月的数据
      const months = [];
      const monthLabels = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = monthDate.getFullYear();
        const month = String(monthDate.getMonth() + 1).padStart(2, '0');
        const monthKey = `${year}-${month}`;
        const monthLabel = `${year}年${monthDate.getMonth() + 1}月`;
        
        months.push(monthKey);
        monthLabels.push(monthLabel);
      }
      
      // 计算每月总税额
      const monthlyTaxAmounts = months.map(month => {
        let total = 0;
        taxData.value.forEach(tax => {
          const monthRecord = tax.declarationRecords.find(record => record.declarationPeriod === month);
          if (monthRecord) {
            total += monthRecord.taxAmount;
          }
        });
        return total;
      });
      
      // 计算每月已缴税额
      const monthlyPaidAmounts = months.map(month => {
        let total = 0;
        taxData.value.forEach(tax => {
          const monthRecord = tax.declarationRecords.find(record => record.declarationPeriod === month);
          if (monthRecord) {
            total += monthRecord.paidAmount;
          }
        });
        return total;
      });
      
      const config = {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [
            {
              label: '应缴税额',
              data: monthlyTaxAmounts,
              backgroundColor: '#f56c6c'
            },
            {
              label: '已缴税额',
              data: monthlyPaidAmounts,
              backgroundColor: '#67c23a'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '最近6个月税费缴纳趋势'
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
              }
            }
          }
        }
      };
      
      chartInstances.taxPaymentChart = new MockChart(taxPaymentChartRef.value, config);
    };
    
    // 初始化税种分布图表
    const initTaxCategoryChart = () => {
      if (!taxCategoryChartRef.value || taxData.value.length === 0) return;
      
      // 统计各税种的年度总额
      const categoryTotals = {};
      const currentYear = new Date().getFullYear();
      
      taxData.value.forEach(tax => {
        // 查找会计科目名称
        const accountInfo = accountOptions.value.find(opt => opt.value === tax.account);
        const accountName = accountInfo ? accountInfo.label : tax.account;
        
        // 计算该科目的年度总额
        if (!categoryTotals[accountName]) {
          categoryTotals[accountName] = 0;
        }
        
        tax.declarationRecords.forEach(record => {
          if (record.declarationPeriod.startsWith(currentYear.toString())) {
            categoryTotals[accountName] += record.taxAmount;
          }
        });
      });
      
      // 准备图表数据
      const labels = Object.keys(categoryTotals);
      const data = Object.values(categoryTotals);
      
      // 生成随机颜色
      const backgroundColors = labels.map(() => {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return `rgba(${r}, ${g}, ${b}, 0.6)`;
      });
      
      const config = {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: backgroundColors,
              borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `${currentYear}年各税种金额分布`
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = formatCurrency(context.parsed);
                  const total = data.reduce((sum, item) => sum + item, 0);
                  const percentage = ((context.parsed / total) * 100).toFixed(2);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      };
      
      chartInstances.taxCategoryChart = new MockChart(taxCategoryChartRef.value, config);
    };
    
    // 初始化税率结构图表
    const initTaxRateChart = () => {
      if (!taxRateChartRef.value || taxData.value.length === 0) return;
      
      // 筛选百分比税率的税种
      const percentTaxes = taxData.value.filter(tax => tax.taxRateType === 'percent' && tax.isActive);
      
      if (percentTaxes.length === 0) return;
      
      // 排序（按税率降序）
      percentTaxes.sort((a, b) => b.taxRate - a.taxRate);
      
      const labels = percentTaxes.map(tax => tax.taxName);
      const data = percentTaxes.map(tax => tax.taxRate);
      
      const config = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: '税率 (%)',
              data,
              backgroundColor: '#409eff'
            }
          ]
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          plugins: {
            title: {
              display: true,
              text: '各税种税率对比'
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.parsed.x}%`
              }
            }
          }
        }
      };
      
      chartInstances.taxRateChart = new MockChart(taxRateChartRef.value, config);
    };
    
    // 初始化合规状态图表
    const initComplianceChart = () => {
      if (!complianceChartRef.value || taxData.value.length === 0) return;
      
      // 统计各状态的数量
      const statusCounts = {
        'declared': 0,    // 已申报
        'paid': 0,        // 已缴款
        'refunded': 0,    // 已退税
        'overdue': 0,     // 逾期未申报
        'partially_paid': 0 // 部分缴款
      };
      
      // 获取最近3个月的数据
      const months = [];
      const currentDate = new Date();
      
      for (let i = 2; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = monthDate.getFullYear();
        const month = String(monthDate.getMonth() + 1).padStart(2, '0');
        months.push(`${year}-${month}`);
      }
      
      // 统计状态数量
      taxData.value.forEach(tax => {
        tax.declarationRecords.forEach(record => {
          if (months.includes(record.declarationPeriod)) {
            statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
          }
        });
      });
      
      const labels = [
        '已申报',
        '已缴款',
        '已退税',
        '逾期未申报',
        '部分缴款'
      ];
      
      const data = [
        statusCounts.declared,
        statusCounts.paid,
        statusCounts.refunded,
        statusCounts.overdue,
        statusCounts.partially_paid
      ];
      
      const backgroundColors = [
        '#67c23a',  // 绿色 - 已申报
        '#409eff',  // 蓝色 - 已缴款
        '#909399',  // 灰色 - 已退税
        '#f56c6c',  // 红色 - 逾期未申报
        '#e6a23c'   // 橙色 - 部分缴款
      ];
      
      const config = {
        type: 'radar',
        data: {
          labels,
          datasets: [
            {
              label: '申报记录数量',
              data,
              backgroundColor: 'rgba(64, 158, 255, 0.2)',
              borderColor: '#409eff',
              pointBackgroundColor: backgroundColors,
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: backgroundColors
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '最近3个月税务合规状态'
            }
          },
          scales: {
            r: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      };
      
      chartInstances.complianceChart = new MockChart(complianceChartRef.value, config);
    };
    
    // 格式化日期时间
    const formatDateTime = (dateTime) => {
      if (!dateTime) return '-';
      const date = new Date(dateTime);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 格式化日期
    const formatDate = (dateTime) => {
      if (!dateTime) return '-';
      const date = new Date(dateTime);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    // 格式化货币
    const formatCurrency = (value) => {
      if (value === null || value === undefined || isNaN(value)) return '0.00 元';
      return `${parseFloat(value).toFixed(2)} 元`;
    };
    
    // 格式化百分比
    const formatPercentage = (value) => {
      if (value === null || value === undefined || isNaN(value)) return '0%';
      return `${(parseFloat(value) * 100).toFixed(2)}%`;
    };
    
    // 格式化税率值
    const formatRateValue = (row, column) => {
      return `${row.rate}%`;
    };
    
    // 获取税率类型文本
    const getTaxRateTypeText = (type) => {
      const typeMap = {
        'percent': '百分比',
        'fixed': '固定金额',
        'progressive': '累进税率'
      };
      return typeMap[type] || type;
    };
    
    // 获取申报周期文本
    const getCycleText = (cycle) => {
      const cycleMap = {
        'monthly': '月度',
        'quarterly': '季度',
        'semiannual': '半年度',
        'annual': '年度',
        'single': '单次'
      };
      return cycleMap[cycle] || cycle;
    };
    
    // 获取科目文本
    const getAccountText = (account) => {
      const accountInfo = accountOptions.value.find(opt => opt.value === account);
      return accountInfo ? accountInfo.label : account;
    };
    
    // 获取状态标签
    const getStatusTag = (row, column) => {
      const statusMap = {
        'declared': { text: '已申报', type: 'success' },
        'paid': { text: '已缴款', type: 'primary' },
        'refunded': { text: '已退税', type: 'info' },
        'overdue': { text: '逾期', type: 'danger' },
        'partially_paid': { text: '部分缴款', type: 'warning' }
      };
      
      const status = statusMap[row.status];
      if (status) {
        return <el-tag type={status.type} size="small">{status.text}</el-tag>;
      }
      return row.status;
    };
    
    // 窗口大小变化时更新图表尺寸
    const handleResize = () => {
      nextTick(() => {
        updateCharts();
      });
    };
    
    // 生命周期钩子
    onMounted(() => {
      window.addEventListener('resize', handleResize);
    });
    
    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      // 销毁图表
      Object.values(chartInstances).forEach(instance => {
        if (instance) {
          instance.destroy();
        }
      });
    });
    
    // 监听图表切换
    watch(activeChartTab, () => {
      nextTick(() => {
        updateCurrentChart();
      });
    });
    
    // 监听数据变化，更新图表
    watch(() => taxData.value, () => {
      nextTick(() => {
        updateCharts();
      });
    }, { deep: true });
    
    return {
      // 模板引用
      templateRef,
      taxFormRef,
      declarationFormRef,
      
      // 图表引用
      taxPaymentChartRef,
      taxCategoryChartRef,
      taxRateChartRef,
      complianceChartRef,
      
      // 状态
      activeChartTab,
      chartWidth,
      chartHeight,
      currentTaxDetail,
      isEditMode,
      taxData,
      
      // 表单数据
      taxForm,
      taxFormRules,
      declarationForm,
      declarationFormRules,
      
      // 选项数据
      accountOptions,
      
      // 方法
      handleSearch,
      handleReset,
      handlePageChange,
      handleMounted,
      handleAddTax,
      handleEditTax,
      handleSaveTax,
      handleDeleteTax,
      handleViewDetail,
      handleDeclaration,
      handleSubmitDeclaration,
      handleBatchImport,
      handleBatchExport,
      handleGenerateTaxReport,
      handleRefreshData,
      handleOpenSettings,
      handleAttachmentChange,
      addProgressiveRate,
      removeProgressiveRate,
      handleChartTabChange,
      
      // 格式化函数
      formatDateTime,
      formatDate,
      formatCurrency,
      formatPercentage,
      formatRateValue,
      getTaxRateTypeText,
      getCycleText,
      getAccountText,
      getStatusTag
    };
  }
};
</script>

<style scoped>
.tax-form-container,
.declaration-container,
.tax-detail-container {
  padding: 20px;
}

.chart-container {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tax-detail-container h3 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 18px;
}

.tax-detail-container h4 {
  margin-bottom: 15px;
  color: #606266;
  font-size: 16px;
}

.upload-demo {
  margin-top: 10px;
}
</style>