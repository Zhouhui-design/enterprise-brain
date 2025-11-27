<template>
  <div class="quality-check">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>质量检查管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreateCheck">
              <el-icon><Plus /></el-icon> 新建检查任务
            </el-button>
            <el-button @click="handleExportChecks">
              <el-icon><Download /></el-icon> 导出数据
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索条件 -->
      <el-form :model="searchForm" label-width="100px" class="search-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="检查单号">
              <el-input v-model="searchForm.checkCode" placeholder="请输入检查单号" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="检查类型">
              <el-select v-model="searchForm.checkType" placeholder="选择检查类型" clearable>
                <el-option
                  v-for="type in checkTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="产品编号">
              <el-input v-model="searchForm.productCode" placeholder="请输入产品编号" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="检查状态">
              <el-select v-model="searchForm.status" placeholder="选择检查状态" clearable>
                <el-option
                  v-for="status in checkStatuses"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="检查人">
              <el-input v-model="searchForm.checkBy" placeholder="请输入检查人" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="检查日期">
              <el-date-picker
                v-model="searchForm.checkDate"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :value-format="'YYYY-MM-DD'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24">
            <el-form-item>
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon> 查询
              </el-button>
              <el-button @click="handleReset">
                <el-icon><Refresh /></el-icon> 重置
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <!-- 检查任务列表 -->
      <el-table
        :data="checkList"
        style="width: 100%"
        border
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="checkCode" label="检查单号" width="160" />
        <el-table-column prop="checkType" label="检查类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getCheckTypeTagType(row.checkType)">
              {{ getCheckTypeText(row.checkType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="productCode" label="产品编号" width="120" />
        <el-table-column prop="productName" label="产品名称" min-width="150" />
        <el-table-column prop="batchNo" label="批次号" width="140" />
        <el-table-column prop="checkDate" label="检查日期" width="140" />
        <el-table-column prop="checkBy" label="检查人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="result" label="检查结果" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.result" :type="row.result === '合格' ? 'success' : 'danger'">
              {{ row.result }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewCheck(row)">查看</el-button>
            <el-button
              size="small"
              type="primary"
              @click="handleExecuteCheck(row)"
              v-if="row.status === '待执行'"
            >
              执行检查
            </el-button>
            <el-button
              size="small"
              type="success"
              @click="handleSubmitCheck(row)"
              v-if="row.status === '执行中'"
            >
              提交结果
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDeleteCheck(row)"
              v-if="['待执行', '草稿'].includes(row.status)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页控件 -->
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
    </el-card>
    
    <!-- 新建/编辑检查任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="70%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        :model="checkForm"
        label-width="120px"
        :rules="checkFormRules"
        ref="checkFormRef"
      >
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="检查单号" prop="checkCode">
              <el-input v-model="checkForm.checkCode" :disabled="!isCreating" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="检查类型" prop="checkType">
              <el-select v-model="checkForm.checkType" placeholder="选择检查类型">
                <el-option
                  v-for="type in checkTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="检查日期" prop="checkDate">
              <el-date-picker
                v-model="checkForm.checkDate"
                type="date"
                placeholder="选择检查日期"
                :value-format="'YYYY-MM-DD'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="产品编号" prop="productCode">
              <el-input v-model="checkForm.productCode" placeholder="请输入产品编号" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="checkForm.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="批次号" prop="batchNo">
              <el-input v-model="checkForm.batchNo" placeholder="请输入批次号" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="检查数量" prop="checkQuantity">
              <el-input v-model.number="checkForm.checkQuantity" type="number" placeholder="请输入检查数量" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="检查人" prop="checkBy">
              <el-input v-model="checkForm.checkBy" placeholder="请输入检查人" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="检查部门" prop="department">
              <el-input v-model="checkForm.department" placeholder="请输入检查部门" />
            </el-form-item>
          </el-col>
          <el-col :xs="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="checkForm.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <!-- 检查项目 -->
      <div class="check-items">
        <div class="section-header">
          <h3>检查项目</h3>
          <el-button
            type="primary"
            size="small"
            @click="handleAddCheckItem"
            v-if="!isExecuting"
          >
            添加项目
          </el-button>
        </div>
        
        <el-table
          :data="checkItems"
          style="width: 100%"
          border
          v-if="checkItems.length > 0"
        >
          <el-table-column prop="index" label="序号" width="80" align="center" />
          <el-table-column prop="itemName" label="检查项目" min-width="180">
            <template #default="{ row }">
              <template v-if="!isExecuting">
                <el-input v-model="row.itemName" placeholder="检查项目名称" />
              </template>
              <template v-else>
                {{ row.itemName }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="specification" label="技术要求" min-width="150">
            <template #default="{ row }">
              <template v-if="!isExecuting">
                <el-input v-model="row.specification" placeholder="技术要求" />
              </template>
              <template v-else>
                {{ row.specification }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="100">
            <template #default="{ row }">
              <template v-if="!isExecuting">
                <el-input v-model="row.unit" placeholder="单位" />
              </template>
              <template v-else>
                {{ row.unit }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="actualValue" label="实测值" min-width="120">
            <template #default="{ row }">
              <template v-if="isExecuting">
                <el-input v-model="row.actualValue" placeholder="请输入实测值" />
              </template>
              <template v-else-if="row.actualValue">
                {{ row.actualValue }}
              </template>
              <template v-else>
                <span>-</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="judgment" label="判定" width="100" align="center">
            <template #default="{ row }">
              <template v-if="isExecuting">
                <el-radio-group v-model="row.judgment">
                  <el-radio-button label="合格" />
                  <el-radio-button label="不合格" />
                </el-radio-group>
              </template>
              <template v-else-if="row.judgment">
                <el-tag :type="row.judgment === '合格' ? 'success' : 'danger'" size="small">
                  {{ row.judgment }}
                </el-tag>
              </template>
              <template v-else>
                <span>-</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="defectDescription" label="缺陷描述" min-width="180">
            <template #default="{ row }">
              <template v-if="isExecuting">
                <el-input v-model="row.defectDescription" placeholder="缺陷描述" />
              </template>
              <template v-else-if="row.defectDescription">
                <span class="defect-text" :title="row.defectDescription">{{ row.defectDescription }}</span>
              </template>
              <template v-else>
                <span>-</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" v-if="!isExecuting">
            <template #default="{ $index }">
              <el-button
                type="danger"
                size="small"
                icon="Delete"
                @click="handleDeleteCheckItem($index)"
              />
            </template>
          </el-table-column>
        </el-table>
        
        <div v-else class="empty-tip">暂无检查项目，请添加</div>
      </div>
      
      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" @click="handleDialogSave">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 查看检查详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="检查详情"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="check-detail">
        <!-- 基本信息 -->
        <el-descriptions :column="3" border class="detail-section">
          <el-descriptions-item label="检查单号">{{ currentCheck.checkCode }}</el-descriptions-item>
          <el-descriptions-item label="检查类型">{{ getCheckTypeText(currentCheck.checkType) }}</el-descriptions-item>
          <el-descriptions-item label="检查日期">{{ currentCheck.checkDate }}</el-descriptions-item>
          <el-descriptions-item label="产品编号">{{ currentCheck.productCode }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ currentCheck.productName }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ currentCheck.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="检查数量">{{ currentCheck.checkQuantity }}</el-descriptions-item>
          <el-descriptions-item label="检查人">{{ currentCheck.checkBy }}</el-descriptions-item>
          <el-descriptions-item label="检查部门">{{ currentCheck.department }}</el-descriptions-item>
          <el-descriptions-item label="检查状态" :column="3">
            <el-tag :type="getStatusTagType(currentCheck.status)">
              {{ getStatusText(currentCheck.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="检查结果" :column="3">
            <el-tag v-if="currentCheck.result" :type="currentCheck.result === '合格' ? 'success' : 'danger'">
              {{ currentCheck.result }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :column="3">{{ currentCheck.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 检查项目结果 -->
        <div class="detail-section">
          <h3>检查项目结果</h3>
          <el-table
            :data="currentCheckItems"
            style="width: 100%"
            border
          >
            <el-table-column prop="index" label="序号" width="80" align="center" />
            <el-table-column prop="itemName" label="检查项目" min-width="180" />
            <el-table-column prop="specification" label="技术要求" min-width="150" />
            <el-table-column prop="unit" label="单位" width="100" />
            <el-table-column prop="actualValue" label="实测值" min-width="120">
              <template #default="{ row }">
                {{ row.actualValue || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="judgment" label="判定" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.judgment" :type="row.judgment === '合格' ? 'success' : 'danger'" size="small">
                  {{ row.judgment }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="defectDescription" label="缺陷描述" min-width="200">
              <template #default="{ row }">
                <span class="defect-text" :title="row.defectDescription">{{ row.defectDescription || '-' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 统计信息 -->
        <div class="detail-section" v-if="currentCheck.result">
          <h3>检查统计</h3>
          <div class="statistics">
            <el-statistic
              title="总检查项数"
              :value="currentCheckItems.length"
              class="stat-item"
            />
            <el-statistic
              title="合格项数"
              :value="qualifiedItemsCount"
              class="stat-item"
              :suffix="` (${qualifiedRate}%)`"
              suffix-color="#67c23a"
            />
            <el-statistic
              title="不合格项数"
              :value="unqualifiedItemsCount"
              class="stat-item"
              :suffix="` (${unqualifiedRate}%)`"
              suffix-color="#f56c6c"
            />
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Download, Search, Refresh } from '@element-plus/icons-vue';

export default {
  name: 'QualityCheck',
  components: {
    Plus,
    Download,
    Search,
    Refresh
  },
  setup() {
    // 加载状态
    const loading = ref(false);
    
    // 搜索表单
    const searchForm = reactive({
      checkCode: '',
      checkType: '',
      productCode: '',
      status: '',
      checkBy: '',
      checkDate: []
    });
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    });
    
    // 检查任务列表
    const checkList = ref([]);
    
    // 选中的行
    const selectedRows = ref([]);
    
    // 对话框相关
    const dialogVisible = ref(false);
    const viewDialogVisible = ref(false);
    const dialogTitle = ref('新建检查任务');
    const isCreating = ref(true);
    const isExecuting = ref(false);
    
    // 检查表单
    const checkForm = reactive({
      id: '',
      checkCode: '',
      checkType: '',
      checkDate: '',
      productCode: '',
      productName: '',
      batchNo: '',
      checkQuantity: 1,
      checkBy: '',
      department: '',
      remark: '',
      status: '草稿',
      result: null,
      createdAt: '',
      updatedAt: ''
    });
    
    // 检查表单验证规则
    const checkFormRules = reactive({
      checkCode: [
        { required: true, message: '请输入检查单号', trigger: 'blur' }
      ],
      checkType: [
        { required: true, message: '请选择检查类型', trigger: 'change' }
      ],
      checkDate: [
        { required: true, message: '请选择检查日期', trigger: 'change' }
      ],
      productCode: [
        { required: true, message: '请输入产品编号', trigger: 'blur' }
      ],
      productName: [
        { required: true, message: '请输入产品名称', trigger: 'blur' }
      ],
      batchNo: [
        { required: true, message: '请输入批次号', trigger: 'blur' }
      ],
      checkQuantity: [
        { required: true, message: '请输入检查数量', trigger: 'blur' },
        { type: 'number', min: 1, message: '检查数量必须大于0', trigger: 'blur' }
      ],
      checkBy: [
        { required: true, message: '请输入检查人', trigger: 'blur' }
      ],
      department: [
        { required: true, message: '请输入检查部门', trigger: 'blur' }
      ]
    });
    
    // 检查表单引用
    const checkFormRef = ref(null);
    
    // 检查项目列表
    const checkItems = ref([]);
    
    // 当前查看的检查
    const currentCheck = reactive({
      id: '',
      checkCode: '',
      checkType: '',
      checkDate: '',
      productCode: '',
      productName: '',
      batchNo: '',
      checkQuantity: 1,
      checkBy: '',
      department: '',
      remark: '',
      status: '',
      result: null,
      createdAt: '',
      updatedAt: ''
    });
    
    // 当前查看的检查项目
    const currentCheckItems = ref([]);
    
    // 检查类型选项
    const checkTypes = [
      { value: 'incoming', label: '来料检查' },
      { value: 'process', label: '过程检查' },
      { value: 'final', label: '成品检查' },
      { value: 'line', label: '生产线检查' },
      { value: 'warehouse', label: '仓库检查' },
      { value: 'patrol', label: '巡检' },
      { value: 'other', label: '其他检查' }
    ];
    
    // 检查状态选项
    const checkStatuses = [
      { value: 'draft', label: '草稿' },
      { value: 'pending', label: '待执行' },
      { value: 'executing', label: '执行中' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    ];
    
    // 合格项数统计
    const qualifiedItemsCount = computed(() => {
      return currentCheckItems.value.filter(item => item.judgment === '合格').length;
    });
    
    // 不合格项数统计
    const unqualifiedItemsCount = computed(() => {
      return currentCheckItems.value.filter(item => item.judgment === '不合格').length;
    });
    
    // 合格率统计
    const qualifiedRate = computed(() => {
      const total = currentCheckItems.value.length;
      if (total === 0) return 0;
      return Math.round((qualifiedItemsCount.value / total) * 100);
    });
    
    // 不合格率统计
    const unqualifiedRate = computed(() => {
      const total = currentCheckItems.value.length;
      if (total === 0) return 0;
      return Math.round((unqualifiedItemsCount.value / total) * 100);
    });
    
    // 初始化数据
    const initData = () => {
      loading.value = true;
      
      // 模拟API请求延迟
      setTimeout(() => {
        // 生成模拟数据
        generateMockData();
        loading.value = false;
      }, 500);
    };
    
    // 生成模拟数据
    const generateMockData = () => {
      const mockChecks = [
        {
          id: '1',
          checkCode: 'QC2023001',
          checkType: 'incoming',
          checkDate: '2023-06-10',
          productCode: 'P001',
          productName: '产品A',
          batchNo: 'B20230610',
          checkQuantity: 50,
          checkBy: '张三',
          department: '质量部',
          remark: '常规来料检查',
          status: 'completed',
          result: '合格',
          createdAt: '2023-06-10 09:00:00',
          updatedAt: '2023-06-10 11:30:00'
        },
        {
          id: '2',
          checkCode: 'QC2023002',
          checkType: 'process',
          checkDate: '2023-06-11',
          productCode: 'P002',
          productName: '产品B',
          batchNo: 'B20230611',
          checkQuantity: 30,
          checkBy: '李四',
          department: '生产部',
          remark: '生产过程检查',
          status: 'pending',
          result: null,
          createdAt: '2023-06-11 08:00:00',
          updatedAt: '2023-06-11 08:00:00'
        },
        {
          id: '3',
          checkCode: 'QC2023003',
          checkType: 'final',
          checkDate: '2023-06-12',
          productCode: 'P003',
          productName: '产品C',
          batchNo: 'B20230612',
          checkQuantity: 100,
          checkBy: '王五',
          department: '质量部',
          remark: '成品出厂检查',
          status: 'executing',
          result: null,
          createdAt: '2023-06-12 13:00:00',
          updatedAt: '2023-06-12 14:00:00'
        },
        {
          id: '4',
          checkCode: 'QC2023004',
          checkType: 'line',
          checkDate: '2023-06-13',
          productCode: 'P004',
          productName: '产品D',
          batchNo: 'B20230613',
          checkQuantity: 200,
          checkBy: '赵六',
          department: '生产部',
          remark: '生产线日常检查',
          status: 'completed',
          result: '不合格',
          createdAt: '2023-06-13 09:00:00',
          updatedAt: '2023-06-13 10:30:00'
        },
        {
          id: '5',
          checkCode: 'QC2023005',
          checkType: 'patrol',
          checkDate: '2023-06-14',
          productCode: 'P005',
          productName: '产品E',
          batchNo: 'B20230614',
          checkQuantity: 10,
          checkBy: '钱七',
          department: '质量部',
          remark: '生产线巡检',
          status: 'draft',
          result: null,
          createdAt: '2023-06-14 08:00:00',
          updatedAt: '2023-06-14 08:00:00'
        }
      ];
      
      checkList.value = mockChecks;
      pagination.total = mockChecks.length;
    };
    
    // 获取检查类型文本
    const getCheckTypeText = (value) => {
      const type = checkTypes.find(t => t.value === value);
      return type ? type.label : value || '-';
    };
    
    // 获取检查类型标签类型
    const getCheckTypeTagType = (value) => {
      const typeMap = {
        'incoming': 'primary',
        'process': 'success',
        'final': 'warning',
        'line': 'info',
        'warehouse': 'danger',
        'patrol': 'purple',
        'other': 'gray'
      };
      return typeMap[value] || 'info';
    };
    
    // 获取状态文本
    const getStatusText = (value) => {
      const status = checkStatuses.find(s => s.value === value);
      return status ? status.label : value || '-';
    };
    
    // 获取状态标签类型
    const getStatusTagType = (value) => {
      const statusMap = {
        'draft': 'gray',
        'pending': 'warning',
        'executing': 'primary',
        'completed': 'success',
        'cancelled': 'danger'
      };
      return statusMap[value] || 'info';
    };
    
    // 更新项目序号
    const updateItemIndexes = () => {
      checkItems.value.forEach((item, index) => {
        item.index = index + 1;
      });
    };
    
    // 生成检查单号
    const generateCheckCode = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `QC${year}${month}${day}${random}`;
    };
    
    // 重置检查表单
    const resetCheckForm = () => {
      Object.assign(checkForm, {
        id: '',
        checkCode: '',
        checkType: '',
        checkDate: '',
        productCode: '',
        productName: '',
        batchNo: '',
        checkQuantity: 1,
        checkBy: '',
        department: '',
        remark: '',
        status: '草稿',
        result: null,
        createdAt: '',
        updatedAt: ''
      });
      checkItems.value = [];
      
      // 如果是新建，生成检查单号
      if (isCreating.value) {
        checkForm.checkCode = generateCheckCode();
      }
    };
    
    // 打开对话框
    const openDialog = (title, creating = true, executing = false) => {
      dialogTitle.value = title;
      isCreating.value = creating;
      isExecuting.value = executing;
      dialogVisible.value = true;
      
      // 重置表单
      resetCheckForm();
    };
    
    // 关闭对话框
    const handleDialogClose = () => {
      if (isExecuting.value) {
        ElMessageBox.confirm('确定要取消检查吗？未提交的检查数据将丢失。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          dialogVisible.value = false;
        }).catch(() => {
          // 取消操作
        });
      } else {
        dialogVisible.value = false;
      }
    };
    
    // 保存对话框数据
    const handleDialogSave = () => {
      if (!isExecuting.value) {
        // 验证表单
        checkFormRef.value.validate((valid) => {
          if (valid) {
            // 保存检查任务
            if (isCreating.value) {
              createCheck();
            } else {
              updateCheck();
            }
          }
        });
      } else {
        // 提交检查结果
        submitCheckResult();
      }
    };
    
    // 创建检查任务
    const createCheck = () => {
      // 构建保存数据
      const newCheck = {
        id: `temp_${Date.now()}`,
        ...checkForm,
        items: checkItems.value,
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      };
      
      // 添加到列表
      checkList.value.unshift(newCheck);
      pagination.total = checkList.value.length;
      
      // 关闭对话框
      dialogVisible.value = false;
      ElMessage.success('创建检查任务成功');
    };
    
    // 更新检查任务
    const updateCheck = () => {
      // 构建更新数据
      const updateData = {
        ...checkForm,
        items: checkItems.value,
        updatedAt: new Date().toLocaleString()
      };
      
      // 更新列表
      const index = checkList.value.findIndex(item => item.id === checkForm.id);
      if (index > -1) {
        checkList.value.splice(index, 1, updateData);
      }
      
      // 关闭对话框
      dialogVisible.value = false;
      ElMessage.success('更新检查任务成功');
    };
    
    // 提交检查结果
    const submitCheckResult = () => {
      // 验证所有检查项目是否都有判定结果
      const unjudgedItems = checkItems.value.filter(item => !item.judgment);
      if (unjudgedItems.length > 0) {
        ElMessage.warning(`还有 ${unjudgedItems.length} 个检查项目未判定，请完成后再提交`);
        return;
      }
      
      // 计算检查结果
      const allQualified = checkItems.value.every(item => item.judgment === '合格');
      
      // 构建提交数据
      const submitData = {
        ...checkForm,
        items: checkItems.value,
        status: 'completed',
        result: allQualified ? '合格' : '不合格',
        updatedAt: new Date().toLocaleString()
      };
      
      // 更新列表
      const index = checkList.value.findIndex(item => item.id === checkForm.id);
      if (index > -1) {
        checkList.value.splice(index, 1, submitData);
      }
      
      // 关闭对话框
      dialogVisible.value = false;
      ElMessage.success('提交检查结果成功');
    };
    
    // 创建检查任务
    const handleCreateCheck = () => {
      openDialog('新建检查任务', true, false);
    };
    
    // 查看检查任务
    const handleViewCheck = (row) => {
      // 设置当前检查数据
      Object.assign(currentCheck, row);
      
      // 加载检查项目数据（模拟）
      loadCheckItems(row.id);
      
      // 打开查看对话框
      viewDialogVisible.value = true;
    };
    
    // 执行检查
    const handleExecuteCheck = (row) => {
      // 设置表单数据
      Object.assign(checkForm, row);
      
      // 加载检查项目数据（模拟）
      loadCheckItems(row.id);
      
      // 更新状态为执行中
      checkForm.status = 'executing';
      
      // 打开执行对话框
      openDialog(`执行检查 - ${row.checkCode}`, false, true);
    };
    
    // 提交检查
    const handleSubmitCheck = (row) => {
      handleExecuteCheck(row);
    };
    
    // 删除检查任务
    const handleDeleteCheck = (row) => {
      ElMessageBox.confirm('确定要删除该检查任务吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 从列表中删除
        const index = checkList.value.findIndex(item => item.id === row.id);
        if (index > -1) {
          checkList.value.splice(index, 1);
          pagination.total = checkList.value.length;
        }
        
        ElMessage.success('删除检查任务成功');
      }).catch(() => {
        // 取消操作
      });
    };
    
    // 导出检查数据
    const handleExportChecks = () => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请选择要导出的检查任务');
        return;
      }
      
      ElMessage.success(`已导出 ${selectedRows.value.length} 条检查任务数据`);
    };
    
    // 搜索
    const handleSearch = () => {
      loading.value = true;
      
      // 模拟搜索延迟
      setTimeout(() => {
        // 这里可以根据搜索条件过滤数据
        loading.value = false;
      }, 500);
    };
    
    // 重置搜索
    const handleReset = () => {
      Object.assign(searchForm, {
        checkCode: '',
        checkType: '',
        productCode: '',
        status: '',
        checkBy: '',
        checkDate: []
      });
    };
    
    // 分页大小变化
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      initData();
    };
    
    // 页码变化
    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
      initData();
    };
    
    // 选择变化
    const handleSelectionChange = (selection) => {
      selectedRows.value = selection;
    };
    
    // 添加检查项目
    const handleAddCheckItem = () => {
      checkItems.value.push({
        id: `temp_${Date.now()}`,
        itemName: '',
        specification: '',
        unit: '',
        actualValue: '',
        judgment: '',
        defectDescription: ''
      });
      
      // 更新序号
      updateItemIndexes();
    };
    
    // 删除检查项目
    const handleDeleteCheckItem = (index) => {
      checkItems.value.splice(index, 1);
      
      // 更新序号
      updateItemIndexes();
    };
    
    // 加载检查项目数据（模拟）
    const loadCheckItems = (checkId) => {
      // 模拟不同检查任务的检查项目
      const itemsMap = {
        '1': [
          {
            id: '1',
            index: 1,
            itemName: '外观检查',
            specification: '无裂纹、无变形、无毛刺',
            unit: '',
            actualValue: '',
            judgment: '合格',
            defectDescription: ''
          },
          {
            id: '2',
            index: 2,
            itemName: '尺寸检查',
            specification: '长度：100±0.1mm',
            unit: 'mm',
            actualValue: '99.95',
            judgment: '合格',
            defectDescription: ''
          },
          {
            id: '3',
            index: 3,
            itemName: '硬度测试',
            specification: 'HRB 60-80',
            unit: 'HRB',
            actualValue: '72',
            judgment: '合格',
            defectDescription: ''
          }
        ],
        '2': [
          {
            id: '4',
            index: 1,
            itemName: '装配间隙',
            specification: '≤0.1mm',
            unit: 'mm',
            actualValue: '',
            judgment: '',
            defectDescription: ''
          },
          {
            id: '5',
            index: 2,
            itemName: '扭矩测试',
            specification: '20-25N·m',
            unit: 'N·m',
            actualValue: '',
            judgment: '',
            defectDescription: ''
          }
        ],
        '3': [
          {
            id: '6',
            index: 1,
            itemName: '功能测试',
            specification: '所有功能正常',
            unit: '',
            actualValue: '',
            judgment: '合格',
            defectDescription: ''
          },
          {
            id: '7',
            index: 2,
            itemName: '外观检查',
            specification: '无划伤、无褪色',
            unit: '',
            actualValue: '',
            judgment: '',
            defectDescription: ''
          }
        ],
        '4': [
          {
            id: '8',
            index: 1,
            itemName: '重量检查',
            specification: '100±2g',
            unit: 'g',
            actualValue: '97.5',
            judgment: '不合格',
            defectDescription: '重量偏轻'
          },
          {
            id: '9',
            index: 2,
            itemName: '标识检查',
            specification: '标识清晰完整',
            unit: '',
            actualValue: '',
            judgment: '合格',
            defectDescription: ''
          }
        ]
      };
      
      // 获取对应检查任务的项目
      const items = itemsMap[checkId] || [
        {
          id: `default_1`,
          index: 1,
          itemName: '外观检查',
          specification: '无异常',
          unit: '',
          actualValue: '',
          judgment: '',
          defectDescription: ''
        },
        {
          id: `default_2`,
          index: 2,
          itemName: '尺寸检查',
          specification: '符合图纸要求',
          unit: 'mm',
          actualValue: '',
          judgment: '',
          defectDescription: ''
        }
      ];
      
      // 设置检查项目
      checkItems.value = items;
      currentCheckItems.value = items;
    };
    
    // 组件挂载时初始化
    onMounted(() => {
      initData();
    });
    
    return {
      loading,
      searchForm,
      pagination,
      checkList,
      selectedRows,
      dialogVisible,
      viewDialogVisible,
      dialogTitle,
      isCreating,
      isExecuting,
      checkForm,
      checkFormRules,
      checkFormRef,
      checkItems,
      currentCheck,
      currentCheckItems,
      checkTypes,
      checkStatuses,
      qualifiedItemsCount,
      unqualifiedItemsCount,
      qualifiedRate,
      unqualifiedRate,
      
      getCheckTypeText,
      getCheckTypeTagType,
      getStatusText,
      getStatusTagType,
      
      handleCreateCheck,
      handleViewCheck,
      handleExecuteCheck,
      handleSubmitCheck,
      handleDeleteCheck,
      handleExportChecks,
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleSelectionChange,
      handleAddCheckItem,
      handleDeleteCheckItem,
      handleDialogClose,
      handleDialogSave
    };
  }
};
</script>

<style scoped>
.quality-check {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.check-items {
  margin-top: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.empty-tip {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.check-detail {
  width: 100%;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.statistics {
  display: flex;
  gap: 30px;
}

.stat-item {
  flex: 1;
}

.defect-text {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}
</style>