<template>
  <div class="defect-analysis">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>缺陷分析管理</span>
          <el-button type="primary" @click="handleCreateDefect">
            <el-icon><Plus /></el-icon> 录入缺陷
          </el-button>
        </div>
      </template>
      
      <!-- 搜索条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form" label-width="100px">
        <el-form-item label="缺陷编号">
          <el-input v-model="searchForm.defectCode" placeholder="请输入缺陷编号" clearable />
        </el-form-item>
        <el-form-item label="产品编号">
          <el-input v-model="searchForm.productCode" placeholder="请输入产品编号" clearable />
        </el-form-item>
        <el-form-item label="缺陷类型">
          <el-select v-model="searchForm.defectType" placeholder="请选择缺陷类型" clearable>
            <el-option label="外观缺陷" value="appearance" />
            <el-option label="尺寸超差" value="dimension" />
            <el-option label="性能不良" value="performance" />
            <el-option label="功能失效" value="function" />
            <el-option label="其他缺陷" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="缺陷等级">
          <el-select v-model="searchForm.severityLevel" placeholder="请选择缺陷等级" clearable>
            <el-option label="致命缺陷" value="critical" />
            <el-option label="严重缺陷" value="major" />
            <el-option label="轻微缺陷" value="minor" />
          </el-select>
        </el-form-item>
        <el-form-item label="发现日期">
          <el-date-picker
            v-model="searchForm.discoveredDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 缺陷列表 -->
      <el-table :data="defects" style="width: 100%" border>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="defectCode" label="缺陷编号" width="150" />
        <el-table-column prop="productCode" label="产品编号" width="120" />
        <el-table-column prop="productName" label="产品名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="defectType" label="缺陷类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getDefectTypeTag(row.defectType)">{{ getDefectTypeText(row.defectType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="severityLevel" label="缺陷等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severityLevel)">{{ getSeverityText(row.severityLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="discoveredStage" label="发现阶段" width="120">
          <template #default="{ row }">
            <el-tag>{{ getStageText(row.discoveredStage) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="discoveredDate" label="发现日期" width="120" :formatter="formatDate" />
        <el-table-column prop="status" label="处理状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewDefect(row)">查看</el-button>
            <el-button size="small" @click="handleEditDefect(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDeleteDefect(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination" style="margin-top: 20px;">
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
    
    <!-- 数据分析统计卡片 -->
    <div class="stats-container" style="margin-top: 20px;">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-value">{{ totalDefects }}</div>
              <div class="stats-label">总缺陷数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-value">{{ criticalDefects }}</div>
              <div class="stats-label">致命缺陷</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-value">{{ majorDefects }}</div>
              <div class="stats-label">严重缺陷</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-value">{{ unresolvedDefects }}</div>
              <div class="stats-label">未解决缺陷</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 缺陷趋势图表 -->
    <div class="chart-container" style="margin-top: 20px;">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>缺陷趋势分析</span>
            <el-select v-model="chartTimeRange" placeholder="选择时间范围">
              <el-option label="最近7天" value="7days" />
              <el-option label="最近30天" value="30days" />
              <el-option label="最近90天" value="90days" />
              <el-option label="全年" value="year" />
            </el-select>
          </div>
        </template>
        <div id="defectTrendChart" style="height: 400px;"></div>
      </el-card>
    </div>
    
    <!-- 新建/编辑缺陷对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑缺陷' : '录入缺陷'"
      width="800px"
      destroy-on-close
    >
      <el-form :model="defectForm" :rules="defectFormRules" ref="defectFormRef" label-width="120px">
        <el-form-item label="产品编号" prop="productCode">
          <el-input v-model="defectForm.productCode" placeholder="请输入产品编号" />
        </el-form-item>
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="defectForm.productName" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="缺陷类型" prop="defectType">
          <el-select v-model="defectForm.defectType" placeholder="请选择缺陷类型">
            <el-option label="外观缺陷" value="appearance" />
            <el-option label="尺寸超差" value="dimension" />
            <el-option label="性能不良" value="performance" />
            <el-option label="功能失效" value="function" />
            <el-option label="其他缺陷" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="缺陷等级" prop="severityLevel">
          <el-select v-model="defectForm.severityLevel" placeholder="请选择缺陷等级">
            <el-option label="致命缺陷" value="critical" />
            <el-option label="严重缺陷" value="major" />
            <el-option label="轻微缺陷" value="minor" />
          </el-select>
        </el-form-item>
        <el-form-item label="发现阶段" prop="discoveredStage">
          <el-select v-model="defectForm.discoveredStage" placeholder="请选择发现阶段">
            <el-option label="来料检验" value="incoming" />
            <el-option label="生产过程" value="inProcess" />
            <el-option label="成品检验" value="final" />
            <el-option label="客户投诉" value="customer" />
          </el-select>
        </el-form-item>
        <el-form-item label="发现日期" prop="discoveredDate">
          <el-date-picker
            v-model="defectForm.discoveredDate"
            type="date"
            placeholder="选择发现日期"
          />
        </el-form-item>
        <el-form-item label="缺陷描述" prop="description">
          <el-input v-model="defectForm.description" type="textarea" :rows="3" placeholder="请详细描述缺陷情况" />
        </el-form-item>
        <el-form-item label="发现人" prop="discoveredBy">
          <el-input v-model="defectForm.discoveredBy" placeholder="请输入发现人" />
        </el-form-item>
        <el-form-item label="责任人" prop="responsiblePerson">
          <el-input v-model="defectForm.responsiblePerson" placeholder="请输入责任人" />
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="defectForm.status">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveDefect">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 查看缺陷对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="缺陷详情"
      width="900px"
      destroy-on-close
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="缺陷编号">{{ currentDefect.defectCode }}</el-descriptions-item>
        <el-descriptions-item label="产品编号">{{ currentDefect.productCode }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ currentDefect.productName }}</el-descriptions-item>
        <el-descriptions-item label="缺陷类型">{{ getDefectTypeText(currentDefect.defectType) }}</el-descriptions-item>
        <el-descriptions-item label="缺陷等级">{{ getSeverityText(currentDefect.severityLevel) }}</el-descriptions-item>
        <el-descriptions-item label="发现阶段">{{ getStageText(currentDefect.discoveredStage) }}</el-descriptions-item>
        <el-descriptions-item label="发现日期">{{ formatDateTime(currentDefect.discoveredDate) }}</el-descriptions-item>
        <el-descriptions-item label="发现人">{{ currentDefect.discoveredBy }}</el-descriptions-item>
        <el-descriptions-item label="责任人">{{ currentDefect.responsiblePerson }}</el-descriptions-item>
        <el-descriptions-item label="处理状态">{{ getStatusText(currentDefect.status) }}</el-descriptions-item>
        <el-descriptions-item label="缺陷描述" :span="2">{{ currentDefect.description }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentDefect.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="最后更新" v-if="currentDefect.updatedAt">{{ formatDateTime(currentDefect.updatedAt) }}</el-descriptions-item>
      </el-descriptions>
      
      <!-- 处理记录 -->
      <template v-if="currentDefect.status !== 'pending'">
        <h4 style="margin-top: 20px; margin-bottom: 10px;">处理记录</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in currentDefect.processingRecords"
            :key="index"
            :timestamp="formatDateTime(record.timestamp)"
            :type="getRecordType(record.action)"
            :icon="getRecordIcon(record.action)"
          >
            <div>
              <div><strong>{{ getRecordActionText(record.action) }}</strong></div>
              <div v-if="record.description">{{ record.description }}</div>
              <div v-if="record.handler">处理人：{{ record.handler }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </template>
      
      <!-- 处理缺陷按钮 -->
      <template v-if="['pending', 'processing'].includes(currentDefect.status)">
        <div style="margin-top: 20px; text-align: right;">
          <el-button type="primary" @click="handleProcessDefect">处理缺陷</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 处理缺陷对话框 -->
    <el-dialog
      v-model="processDialogVisible"
      title="处理缺陷"
      width="700px"
      destroy-on-close
    >
      <el-form :model="processDefectForm" :rules="processDefectFormRules" ref="processDefectFormRef" label-width="100px">
        <el-form-item label="处理状态" prop="action">
          <el-radio-group v-model="processDefectForm.action">
            <el-radio :label="'startProcessing'">开始处理</el-radio>
            <el-radio :label="'resolve'">标记解决</el-radio>
            <el-radio :label="'close'">关闭缺陷</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理说明" prop="description">
          <el-input v-model="processDefectForm.description" type="textarea" :rows="4" placeholder="请输入处理说明" />
        </el-form-item>
        <el-form-item label="处理人" prop="handler">
          <el-input v-model="processDefectForm.handler" placeholder="请输入处理人" />
        </el-form-item>
        <el-form-item label="完成日期">
          <el-date-picker
            v-model="processDefectForm.completionDate"
            type="date"
            placeholder="选择完成日期"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmProcessDefect">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Clock, CheckCircle, CloseCircle, Edit } from '@element-plus/icons-vue';

export default {
  name: 'DefectAnalysis',
  components: {
    Plus,
    Clock,
    CheckCircle,
    CloseCircle,
    Edit
  },
  setup() {
    // 状态管理
    const defects = ref([]);
    const dialogVisible = ref(false);
    const viewDialogVisible = ref(false);
    const processDialogVisible = ref(false);
    const isEdit = ref(false);
    const defectFormRef = ref(null);
    const processDefectFormRef = ref(null);
    const currentDefect = reactive({});
    const defectToProcess = reactive({});
    const chartTimeRange = ref('30days');
    
    // 搜索表单
    const searchForm = reactive({
      defectCode: '',
      productCode: '',
      defectType: '',
      severityLevel: '',
      discoveredDate: null
    });
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });
    
    // 缺陷表单
    const defectForm = reactive({
      id: '',
      defectCode: '',
      productCode: '',
      productName: '',
      defectType: 'appearance',
      severityLevel: 'minor',
      discoveredStage: 'inProcess',
      discoveredDate: '',
      description: '',
      discoveredBy: '',
      responsiblePerson: '',
      status: 'pending'
    });
    
    // 处理缺陷表单
    const processDefectForm = reactive({
      action: 'startProcessing',
      description: '',
      handler: '',
      completionDate: ''
    });
    
    // 表单验证规则
    const defectFormRules = {
      productCode: [
        { required: true, message: '请输入产品编号', trigger: 'blur' }
      ],
      productName: [
        { required: true, message: '请输入产品名称', trigger: 'blur' }
      ],
      defectType: [
        { required: true, message: '请选择缺陷类型', trigger: 'change' }
      ],
      severityLevel: [
        { required: true, message: '请选择缺陷等级', trigger: 'change' }
      ],
      discoveredStage: [
        { required: true, message: '请选择发现阶段', trigger: 'change' }
      ],
      discoveredDate: [
        { required: true, message: '请选择发现日期', trigger: 'change' }
      ],
      description: [
        { required: true, message: '请详细描述缺陷情况', trigger: 'blur' }
      ],
      discoveredBy: [
        { required: true, message: '请输入发现人', trigger: 'blur' }
      ],
      responsiblePerson: [
        { required: true, message: '请输入责任人', trigger: 'blur' }
      ]
    };
    
    // 处理缺陷表单验证规则
    const processDefectFormRules = {
      action: [
        { required: true, message: '请选择处理操作', trigger: 'change' }
      ],
      description: [
        { required: true, message: '请输入处理说明', trigger: 'blur' }
      ],
      handler: [
        { required: true, message: '请输入处理人', trigger: 'blur' }
      ],
      completionDate: [
        { required: true, message: '请选择完成日期', trigger: 'change' }
      ]
    };
    
    // 统计数据计算
    const totalDefects = computed(() => defects.value.length);
    const criticalDefects = computed(() => defects.value.filter(item => item.severityLevel === 'critical').length);
    const majorDefects = computed(() => defects.value.filter(item => item.severityLevel === 'major').length);
    const unresolvedDefects = computed(() => defects.value.filter(item => ['pending', 'processing'].includes(item.status)).length);
    
    // 初始化加载数据
    onMounted(() => {
      loadDefects();
      nextTick(() => {
        initChart();
      });
    });
    
    // 加载缺陷数据
    const loadDefects = () => {
      // 模拟数据
      defects.value = generateMockDefects();
      pagination.total = defects.value.length;
    };
    
    // 生成模拟缺陷数据
    const generateMockDefects = () => {
      const defectTypes = ['appearance', 'dimension', 'performance', 'function', 'other'];
      const severityLevels = ['critical', 'major', 'minor'];
      const stages = ['incoming', 'inProcess', 'final', 'customer'];
      const statuses = ['pending', 'processing', 'resolved', 'closed'];
      const products = [
        { code: 'P001', name: '精密轴承' },
        { code: 'P002', name: '液压泵' },
        { code: 'P003', name: '气缸' },
        { code: 'P004', name: '控制阀' },
        { code: 'P005', name: '传感器' }
      ];
      const people = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九'];
      
      return Array.from({ length: 50 }, (_, i) => {
        const defectType = defectTypes[Math.floor(Math.random() * defectTypes.length)];
        const severityLevel = severityLevels[Math.floor(Math.random() * severityLevels.length)];
        const stage = stages[Math.floor(Math.random() * stages.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const isResolved = ['resolved', 'closed'].includes(status);
        
        return {
          id: i + 1,
          defectCode: `DEF${2024}${String(i + 1).padStart(5, '0')}`,
          productCode: product.code,
          productName: product.name,
          defectType,
          severityLevel,
          discoveredStage: stage,
          discoveredDate: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)),
          description: getDefectDescription(defectType),
          discoveredBy: people[Math.floor(Math.random() * people.length)],
          responsiblePerson: people[Math.floor(Math.random() * people.length)],
          status,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)),
          updatedAt: isResolved ? new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) : null,
          processingRecords: isResolved ? generateProcessingRecords() : []
        };
      });
    };
    
    // 获取缺陷描述
    const getDefectDescription = (defectType) => {
      const descriptions = {
        appearance: '产品表面存在划痕，不符合外观要求标准',
        dimension: '关键尺寸超差，实测值为XX，标准值为YY±ZZ',
        performance: '测试性能不达标，无法满足设计要求',
        function: '功能测试失败，无法正常运行',
        other: '其他类型缺陷，需要进一步分析确认'
      };
      return descriptions[defectType] || '未知缺陷类型';
    };
    
    // 生成处理记录
    const generateProcessingRecords = () => {
      const people = ['张三', '李四', '王五'];
      const records = [
        {
          action: 'startProcessing',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          description: '开始处理缺陷，分析原因',
          handler: people[Math.floor(Math.random() * people.length)]
        },
        {
          action: 'resolve',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          description: '已修复缺陷，进行验证测试',
          handler: people[Math.floor(Math.random() * people.length)]
        },
        {
          action: 'close',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          description: '缺陷已确认解决，关闭缺陷',
          handler: people[Math.floor(Math.random() * people.length)]
        }
      ];
      
      return records.slice(0, Math.floor(Math.random() * 3) + 1);
    };
    
    // 初始化图表
    const initChart = () => {
      // 实际项目中这里应该使用ECharts等图表库
      // 这里只做占位，实际使用时需要引入相应的图表库
      console.log('初始化缺陷趋势图表');
    };
    
    // 搜索
    const handleSearch = () => {
      // 实际项目中这里应该调用API进行搜索
      ElMessage.success('搜索成功');
    };
    
    // 重置
    const handleReset = () => {
      Object.assign(searchForm, {
        defectCode: '',
        productCode: '',
        defectType: '',
        severityLevel: '',
        discoveredDate: null
      });
    };
    
    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
    };
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
    };
    
    // 创建缺陷
    const handleCreateDefect = () => {
      isEdit.value = false;
      resetDefectForm();
      dialogVisible.value = true;
    };
    
    // 编辑缺陷
    const handleEditDefect = (row) => {
      isEdit.value = true;
      Object.assign(defectForm, JSON.parse(JSON.stringify(row)));
      dialogVisible.value = true;
    };
    
    // 查看缺陷
    const handleViewDefect = (row) => {
      Object.assign(currentDefect, JSON.parse(JSON.stringify(row)));
      viewDialogVisible.value = true;
    };
    
    // 处理缺陷
    const handleProcessDefect = () => {
      Object.assign(defectToProcess, JSON.parse(JSON.stringify(currentDefect)));
      resetProcessDefectForm();
      processDialogVisible.value = true;
    };
    
    // 确认处理缺陷
    const confirmProcessDefect = () => {
      processDefectFormRef.value?.validate((valid) => {
        if (valid) {
          const index = defects.value.findIndex(item => item.id === defectToProcess.id);
          if (index !== -1) {
            // 更新状态
            if (processDefectForm.action === 'startProcessing') {
              defects.value[index].status = 'processing';
            } else if (processDefectForm.action === 'resolve') {
              defects.value[index].status = 'resolved';
            } else if (processDefectForm.action === 'close') {
              defects.value[index].status = 'closed';
            }
            
            // 添加处理记录
            if (!defects.value[index].processingRecords) {
              defects.value[index].processingRecords = [];
            }
            
            defects.value[index].processingRecords.push({
              action: processDefectForm.action,
              timestamp: new Date(),
              description: processDefectForm.description,
              handler: processDefectForm.handler
            });
            
            defects.value[index].updatedAt = new Date();
            
            // 更新当前查看的缺陷
            Object.assign(currentDefect, JSON.parse(JSON.stringify(defects.value[index])));
            
            ElMessage.success('缺陷处理成功');
            processDialogVisible.value = false;
          }
        }
      });
    };
    
    // 保存缺陷
    const handleSaveDefect = () => {
      defectFormRef.value?.validate((valid) => {
        if (valid) {
          if (!isEdit.value) {
            // 新建缺陷，生成编号
            const defectCode = `DEF${new Date().getFullYear()}${String(defects.value.length + 1).padStart(5, '0')}`;
            defectForm.defectCode = defectCode;
            defectForm.createdAt = new Date();
            defectForm.processingRecords = [];
            defects.value.unshift(JSON.parse(JSON.stringify(defectForm)));
            pagination.total++;
          } else {
            // 编辑现有缺陷
            const index = defects.value.findIndex(item => item.id === defectForm.id);
            if (index !== -1) {
              defectForm.updatedAt = new Date();
              defects.value[index] = JSON.parse(JSON.stringify(defectForm));
            }
          }
          ElMessage.success(isEdit.value ? '缺陷更新成功' : '缺陷录入成功');
          dialogVisible.value = false;
        }
      });
    };
    
    // 删除缺陷
    const handleDeleteDefect = (row) => {
      ElMessageBox.confirm(`确定要删除缺陷「${row.defectCode}」吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        const index = defects.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          defects.value.splice(index, 1);
          pagination.total--;
          ElMessage.success('缺陷删除成功');
        }
      }).catch(() => {});
    };
    
    // 重置缺陷表单
    const resetDefectForm = () => {
      defectFormRef.value?.resetFields();
      Object.assign(defectForm, {
        id: '',
        defectCode: '',
        productCode: '',
        productName: '',
        defectType: 'appearance',
        severityLevel: 'minor',
        discoveredStage: 'inProcess',
        discoveredDate: '',
        description: '',
        discoveredBy: '',
        responsiblePerson: '',
        status: 'pending'
      });
    };
    
    // 重置处理缺陷表单
    const resetProcessDefectForm = () => {
      processDefectFormRef.value?.resetFields();
      Object.assign(processDefectForm, {
        action: 'startProcessing',
        description: '',
        handler: '',
        completionDate: new Date()
      });
    };
    
    // 获取缺陷类型标签
    const getDefectTypeTag = (type) => {
      const tagMap = {
        appearance: 'warning',
        dimension: 'danger',
        performance: 'primary',
        function: 'info',
        other: 'success'
      };
      return tagMap[type] || 'default';
    };
    
    // 获取缺陷类型文本
    const getDefectTypeText = (type) => {
      const textMap = {
        appearance: '外观缺陷',
        dimension: '尺寸超差',
        performance: '性能不良',
        function: '功能失效',
        other: '其他缺陷'
      };
      return textMap[type] || '未知类型';
    };
    
    // 获取严重程度类型
    const getSeverityType = (severity) => {
      const severityMap = {
        critical: 'danger',
        major: 'warning',
        minor: 'info'
      };
      return severityMap[severity] || 'default';
    };
    
    // 获取严重程度文本
    const getSeverityText = (severity) => {
      const severityMap = {
        critical: '致命缺陷',
        major: '严重缺陷',
        minor: '轻微缺陷'
      };
      return severityMap[severity] || '未知等级';
    };
    
    // 获取阶段文本
    const getStageText = (stage) => {
      const stageMap = {
        incoming: '来料检验',
        inProcess: '生产过程',
        final: '成品检验',
        customer: '客户投诉'
      };
      return stageMap[stage] || '未知阶段';
    };
    
    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        pending: 'info',
        processing: 'primary',
        resolved: 'success',
        closed: 'success'
      };
      return statusMap[status] || 'default';
    };
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        pending: '待处理',
        processing: '处理中',
        resolved: '已解决',
        closed: '已关闭'
      };
      return statusMap[status] || '未知状态';
    };
    
    // 获取记录类型
    const getRecordType = (action) => {
      const typeMap = {
        startProcessing: 'primary',
        resolve: 'success',
        close: 'success'
      };
      return typeMap[action] || 'primary';
    };
    
    // 获取记录图标
    const getRecordIcon = (action) => {
      const iconMap = {
        startProcessing: Edit,
        resolve: CheckCircle,
        close: CloseCircle
      };
      return iconMap[action] || Edit;
    };
    
    // 获取记录操作文本
    const getRecordActionText = (action) => {
      const textMap = {
        startProcessing: '开始处理',
        resolve: '标记解决',
        close: '关闭缺陷'
      };
      return textMap[action] || '未知操作';
    };
    
    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    // 格式化日期时间
    const formatDateTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    
    return {
      defects,
      dialogVisible,
      viewDialogVisible,
      processDialogVisible,
      isEdit,
      defectFormRef,
      processDefectFormRef,
      currentDefect,
      searchForm,
      pagination,
      defectForm,
      processDefectForm,
      defectFormRules,
      processDefectFormRules,
      chartTimeRange,
      totalDefects,
      criticalDefects,
      majorDefects,
      unresolvedDefects,
      
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleCreateDefect,
      handleEditDefect,
      handleViewDefect,
      handleProcessDefect,
      confirmProcessDefect,
      handleSaveDefect,
      handleDeleteDefect,
      getDefectTypeTag,
      getDefectTypeText,
      getSeverityType,
      getSeverityText,
      getStageText,
      getStatusType,
      getStatusText,
      getRecordType,
      getRecordIcon,
      getRecordActionText,
      formatDate,
      formatDateTime
    };
  }
};
</script>

<style scoped>
.defect-analysis {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  text-align: right;
}

.stats-card {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-content {
  text-align: center;
}

.stats-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stats-label {
  font-size: 14px;
  color: #606266;
}

.chart-container {
  margin-top: 20px;
}
</style>