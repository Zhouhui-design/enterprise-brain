<template>
  <div class="quality-audit">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>质量审核管理</span>
          <el-button type="primary" @click="handleCreateAudit">
            <el-icon><Plus /></el-icon> 新建审核计划
          </el-button>
        </div>
      </template>
      
      <!-- 搜索条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form" label-width="100px">
        <el-form-item label="审核计划名称">
          <el-input v-model="searchForm.auditName" placeholder="请输入审核计划名称" clearable />
        </el-form-item>
        <el-form-item label="审核类型">
          <el-select v-model="searchForm.auditType" placeholder="请选择审核类型" clearable>
            <el-option label="内部审核" value="internal" />
            <el-option label="外部审核" value="external" />
            <el-option label="供应商审核" value="supplier" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.status" placeholder="请选择审核状态" clearable>
            <el-option label="计划中" value="planned" />
            <el-option label="进行中" value="inProgress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核日期">
          <el-date-picker
            v-model="searchForm.auditDate"
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
      
      <!-- 审核计划列表 -->
      <el-table :data="auditPlans" style="width: 100%" border>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="auditCode" label="审核编号" width="150" />
        <el-table-column prop="auditName" label="审核计划名称" min-width="250" show-overflow-tooltip />
        <el-table-column prop="auditType" label="审核类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getAuditTypeTag(row.auditType)">{{ getAuditTypeText(row.auditType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditDate" label="审核日期" width="180" :formatter="formatDate" />
        <el-table-column prop="auditor" label="审核员" width="100" />
        <el-table-column prop="status" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="result" label="审核结果" width="100" v-if="false">
          <template #default="{ row }">
            <el-tag :type="row.result === 'pass' ? 'success' : 'danger'">{{ row.result === 'pass' ? '合格' : '不合格' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewAudit(row)">查看</el-button>
            <template v-if="row.status === 'planned'">
              <el-button size="small" @click="handleEditAudit(row)">编辑</el-button>
              <el-button type="success" size="small" @click="handleStartAudit(row)">开始审核</el-button>
              <el-button type="danger" size="small" @click="handleCancelAudit(row)">取消</el-button>
            </template>
            <template v-else-if="row.status === 'inProgress'">
              <el-button type="success" size="small" @click="handleCompleteAudit(row)">完成审核</el-button>
            </template>
            <template v-else>
              <el-button type="danger" size="small" @click="handleDeleteAudit(row)">删除</el-button>
            </template>
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
    
    <!-- 新建/编辑审核计划对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑审核计划' : '新建审核计划'"
      width="800px"
      destroy-on-close
    >
      <el-form :model="auditForm" :rules="auditFormRules" ref="auditFormRef" label-width="120px">
        <el-form-item label="审核计划名称" prop="auditName">
          <el-input v-model="auditForm.auditName" placeholder="请输入审核计划名称" />
        </el-form-item>
        <el-form-item label="审核类型" prop="auditType">
          <el-select v-model="auditForm.auditType" placeholder="请选择审核类型">
            <el-option label="内部审核" value="internal" />
            <el-option label="外部审核" value="external" />
            <el-option label="供应商审核" value="supplier" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核日期" prop="auditDate">
          <el-date-picker
            v-model="auditForm.auditDate"
            type="date"
            placeholder="选择审核日期"
          />
        </el-form-item>
        <el-form-item label="审核员" prop="auditor">
          <el-input v-model="auditForm.auditor" placeholder="请输入审核员" />
        </el-form-item>
        <el-form-item label="审核范围" prop="auditScope">
          <el-input v-model="auditForm.auditScope" type="textarea" :rows="3" placeholder="请输入审核范围" />
        </el-form-item>
        <el-form-item label="审核目的" prop="auditObjective">
          <el-input v-model="auditForm.auditObjective" type="textarea" :rows="3" placeholder="请输入审核目的" />
        </el-form-item>
        <el-form-item label="被审核部门" prop="auditeeDepartment">
          <el-input v-model="auditForm.auditeeDepartment" placeholder="请输入被审核部门" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAudit">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 查看审核计划对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="审核计划详情"
      width="900px"
      destroy-on-close
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="审核编号">{{ currentAudit.auditCode }}</el-descriptions-item>
        <el-descriptions-item label="审核计划名称">{{ currentAudit.auditName }}</el-descriptions-item>
        <el-descriptions-item label="审核类型">{{ getAuditTypeText(currentAudit.auditType) }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">{{ getStatusText(currentAudit.status) }}</el-descriptions-item>
        <el-descriptions-item label="审核日期">{{ formatDateTime(currentAudit.auditDate) }}</el-descriptions-item>
        <el-descriptions-item label="审核员">{{ currentAudit.auditor }}</el-descriptions-item>
        <el-descriptions-item label="被审核部门">{{ currentAudit.auditeeDepartment }}</el-descriptions-item>
        <el-descriptions-item label="审核结果" v-if="currentAudit.status === 'completed'">
          <el-tag :type="currentAudit.result === 'pass' ? 'success' : 'danger'">
            {{ currentAudit.result === 'pass' ? '合格' : '不合格' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核范围" :span="2">{{ currentAudit.auditScope }}</el-descriptions-item>
        <el-descriptions-item label="审核目的" :span="2">{{ currentAudit.auditObjective }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentAudit.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间" v-if="currentAudit.completedAt">{{ formatDateTime(currentAudit.completedAt) }}</el-descriptions-item>
      </el-descriptions>
      
      <!-- 审核发现问题列表 -->
      <template v-if="currentAudit.status === 'completed'">
        <h4 style="margin-top: 20px; margin-bottom: 10px;">审核发现问题</h4>
        <el-table :data="currentAudit.findings" border style="width: 100%;">
          <el-table-column prop="findingCode" label="问题编号" width="120" />
          <el-table-column prop="description" label="问题描述" min-width="250" show-overflow-tooltip />
          <el-table-column prop="severity" label="严重程度" width="120">
            <template #default="{ row }">
              <el-tag :type="getSeverityType(row.severity)">{{ getSeverityText(row.severity) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="responsiblePerson" label="责任人" width="100" />
          <el-table-column prop="correctiveAction" label="纠正措施" min-width="200" show-overflow-tooltip />
          <el-table-column prop="targetCompletionDate" label="目标完成日期" width="150" :formatter="formatDate" />
        </el-table>
        
        <!-- 审核报告 -->
        <div style="margin-top: 20px;">
          <h4 style="margin-bottom: 10px;">审核报告</h4>
          <el-input
            v-model="currentAudit.reportContent"
            type="textarea"
            :rows="5"
            placeholder="审核报告内容"
            disabled
          />
        </div>
      </template>
    </el-dialog>
    
    <!-- 完成审核对话框 -->
    <el-dialog
      v-model="completeDialogVisible"
      title="完成审核"
      width="700px"
      destroy-on-close
    >
      <el-form :model="completeAuditForm" :rules="completeAuditFormRules" ref="completeAuditFormRef" label-width="100px">
        <el-form-item label="审核结果" prop="result">
          <el-radio-group v-model="completeAuditForm.result">
            <el-radio :label="'pass'">合格</el-radio>
            <el-radio :label="'fail'">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核结论" prop="conclusion">
          <el-input v-model="completeAuditForm.conclusion" type="textarea" :rows="3" placeholder="请输入审核结论" />
        </el-form-item>
        <el-form-item label="改进建议" prop="recommendations">
          <el-input v-model="completeAuditForm.recommendations" type="textarea" :rows="3" placeholder="请输入改进建议" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCompleteAudit">确认完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

export default {
  name: 'QualityAudit',
  components: {
    Plus
  },
  setup() {
    // 状态管理
    const auditPlans = ref([]);
    const dialogVisible = ref(false);
    const viewDialogVisible = ref(false);
    const completeDialogVisible = ref(false);
    const isEdit = ref(false);
    const auditFormRef = ref(null);
    const completeAuditFormRef = ref(null);
    const currentAudit = reactive({});
    const auditToComplete = reactive({});
    
    // 搜索表单
    const searchForm = reactive({
      auditName: '',
      auditType: '',
      status: '',
      auditDate: null
    });
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });
    
    // 审核计划表单
    const auditForm = reactive({
      id: '',
      auditCode: '',
      auditName: '',
      auditType: 'internal',
      auditDate: '',
      auditor: '',
      auditScope: '',
      auditObjective: '',
      auditeeDepartment: '',
      status: 'planned'
    });
    
    // 完成审核表单
    const completeAuditForm = reactive({
      result: 'pass',
      conclusion: '',
      recommendations: ''
    });
    
    // 表单验证规则
    const auditFormRules = {
      auditName: [
        { required: true, message: '请输入审核计划名称', trigger: 'blur' },
        { min: 2, max: 100, message: '审核计划名称长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      auditType: [
        { required: true, message: '请选择审核类型', trigger: 'change' }
      ],
      auditDate: [
        { required: true, message: '请选择审核日期', trigger: 'change' }
      ],
      auditor: [
        { required: true, message: '请输入审核员', trigger: 'blur' }
      ],
      auditScope: [
        { required: true, message: '请输入审核范围', trigger: 'blur' }
      ],
      auditObjective: [
        { required: true, message: '请输入审核目的', trigger: 'blur' }
      ],
      auditeeDepartment: [
        { required: true, message: '请输入被审核部门', trigger: 'blur' }
      ]
    };
    
    // 完成审核表单验证规则
    const completeAuditFormRules = {
      result: [
        { required: true, message: '请选择审核结果', trigger: 'change' }
      ],
      conclusion: [
        { required: true, message: '请输入审核结论', trigger: 'blur' }
      ]
    };
    
    // 初始化加载数据
    onMounted(() => {
      loadAuditPlans();
    });
    
    // 加载审核计划数据
    const loadAuditPlans = () => {
      // 模拟数据
      auditPlans.value = generateMockAuditPlans();
      pagination.total = auditPlans.value.length;
    };
    
    // 生成模拟审核计划数据
    const generateMockAuditPlans = () => {
      const auditTypes = ['internal', 'external', 'supplier'];
      const statuses = ['planned', 'inProgress', 'completed', 'cancelled'];
      const auditors = ['张三', '李四', '王五', '赵六', '钱七'];
      const departments = ['生产部', '质量部', '研发部', '采购部', '销售部'];
      
      return Array.from({ length: 30 }, (_, i) => {
        const auditType = auditTypes[Math.floor(Math.random() * auditTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isCompleted = status === 'completed';
        const result = isCompleted ? (Math.random() > 0.2 ? 'pass' : 'fail') : null;
        
        return {
          id: i + 1,
          auditCode: `${getAuditTypePrefix(auditType)}${2024}${String(i + 1).padStart(4, '0')}`,
          auditName: `${getAuditTypeText(auditType)}计划${i + 1}`,
          auditType,
          auditDate: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)),
          auditor: auditors[Math.floor(Math.random() * auditors.length)],
          auditScope: '全流程质量控制体系',
          auditObjective: '评估质量管理体系的有效性和符合性',
          auditeeDepartment: departments[Math.floor(Math.random() * departments.length)],
          status,
          result,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)),
          completedAt: isCompleted ? new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) : null,
          findings: isCompleted ? generateMockFindings(Math.floor(Math.random() * 5) + 1) : [],
          reportContent: isCompleted ? generateMockReport(auditType, result) : ''
        };
      });
    };
    
    // 获取审核类型前缀
    const getAuditTypePrefix = (type) => {
      const prefixMap = {
        internal: 'IA',
        external: 'EA',
        supplier: 'SA'
      };
      return prefixMap[type] || 'IA';
    };
    
    // 生成模拟问题发现
    const generateMockFindings = (count) => {
      const severities = ['critical', 'major', 'minor', 'observation'];
      const responsiblePersons = ['张三', '李四', '王五', '赵六', '钱七'];
      const findings = [];
      
      for (let i = 0; i < count; i++) {
        findings.push({
          findingCode: `F${String(i + 1).padStart(3, '0')}`,
          description: `审核发现问题${i + 1}：${getRandomDescription()}`,
          severity: severities[Math.floor(Math.random() * severities.length)],
          responsiblePerson: responsiblePersons[Math.floor(Math.random() * responsiblePersons.length)],
          correctiveAction: '制定纠正措施并按期实施',
          targetCompletionDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000)
        });
      }
      
      return findings;
    };
    
    // 获取随机问题描述
    const getRandomDescription = () => {
      const descriptions = [
        '部分设备维护记录不完整',
        '操作人员未按规程操作',
        '检验记录存在缺失',
        '不合格品处理流程不规范',
        '培训记录不完善',
        '文件控制不严格',
        '计量器具校准不及时',
        '作业指导书版本错误'
      ];
      return descriptions[Math.floor(Math.random() * descriptions.length)];
    };
    
    // 生成模拟审核报告
    const generateMockReport = (auditType, result) => {
      const reportMap = {
        pass: '通过对各环节的审核，确认质量管理体系运行有效，符合相关标准要求。建议持续改进，保持体系的有效性。',
        fail: '审核发现多项不符合项，主要集中在过程控制和记录管理方面。建议针对发现问题制定纠正措施计划，限时整改并验证有效性。'
      };
      return `本次${getAuditTypeText(auditType)}于${formatDate(new Date())}进行，共审核了5个主要方面。${reportMap[result]}`;
    };
    
    // 搜索
    const handleSearch = () => {
      // 实际项目中这里应该调用API进行搜索
      ElMessage.success('搜索成功');
    };
    
    // 重置
    const handleReset = () => {
      Object.assign(searchForm, {
        auditName: '',
        auditType: '',
        status: '',
        auditDate: null
      });
    };
    
    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
    };
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
    };
    
    // 创建审核计划
    const handleCreateAudit = () => {
      isEdit.value = false;
      resetAuditForm();
      dialogVisible.value = true;
    };
    
    // 编辑审核计划
    const handleEditAudit = (row) => {
      isEdit.value = true;
      Object.assign(auditForm, JSON.parse(JSON.stringify(row)));
      dialogVisible.value = true;
    };
    
    // 查看审核计划
    const handleViewAudit = (row) => {
      Object.assign(currentAudit, JSON.parse(JSON.stringify(row)));
      viewDialogVisible.value = true;
    };
    
    // 保存审核计划
    const handleSaveAudit = () => {
      auditFormRef.value?.validate((valid) => {
        if (valid) {
          if (!isEdit.value) {
            // 新建审核计划，生成编号
            const auditCode = `${getAuditTypePrefix(auditForm.auditType)}${new Date().getFullYear()}${String(auditPlans.value.length + 1).padStart(4, '0')}`;
            auditForm.auditCode = auditCode;
            auditForm.createdAt = new Date();
            auditForm.findings = [];
            auditForm.reportContent = '';
            auditPlans.value.unshift(JSON.parse(JSON.stringify(auditForm)));
            pagination.total++;
          } else {
            // 编辑现有审核计划
            const index = auditPlans.value.findIndex(item => item.id === auditForm.id);
            if (index !== -1) {
              auditPlans.value[index] = JSON.parse(JSON.stringify(auditForm));
            }
          }
          ElMessage.success(isEdit.value ? '审核计划更新成功' : '审核计划创建成功');
          dialogVisible.value = false;
        }
      });
    };
    
    // 开始审核
    const handleStartAudit = (row) => {
      ElMessageBox.confirm(`确定要开始审核「${row.auditName}」吗？`, '确认开始', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(() => {
        const index = auditPlans.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          auditPlans.value[index].status = 'inProgress';
          ElMessage.success('审核已开始');
        }
      }).catch(() => {});
    };
    
    // 完成审核
    const handleCompleteAudit = (row) => {
      Object.assign(auditToComplete, JSON.parse(JSON.stringify(row)));
      resetCompleteAuditForm();
      completeDialogVisible.value = true;
    };
    
    // 确认完成审核
    const confirmCompleteAudit = () => {
      completeAuditFormRef.value?.validate((valid) => {
        if (valid) {
          const index = auditPlans.value.findIndex(item => item.id === auditToComplete.id);
          if (index !== -1) {
            auditPlans.value[index].status = 'completed';
            auditPlans.value[index].result = completeAuditForm.result;
            auditPlans.value[index].completedAt = new Date();
            auditPlans.value[index].reportContent = `${completeAuditForm.conclusion}\n\n改进建议：${completeAuditForm.recommendations}`;
            auditPlans.value[index].findings = generateMockFindings(Math.floor(Math.random() * 3) + 1);
          }
          ElMessage.success('审核已完成');
          completeDialogVisible.value = false;
        }
      });
    };
    
    // 取消审核
    const handleCancelAudit = (row) => {
      ElMessageBox.confirm(`确定要取消审核计划「${row.auditName}」吗？`, '确认取消', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = auditPlans.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          auditPlans.value[index].status = 'cancelled';
          ElMessage.success('审核计划已取消');
        }
      }).catch(() => {});
    };
    
    // 删除审核计划
    const handleDeleteAudit = (row) => {
      ElMessageBox.confirm(`确定要删除审核计划「${row.auditName}」吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        const index = auditPlans.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          auditPlans.value.splice(index, 1);
          pagination.total--;
          ElMessage.success('审核计划删除成功');
        }
      }).catch(() => {});
    };
    
    // 重置审核计划表单
    const resetAuditForm = () => {
      auditFormRef.value?.resetFields();
      Object.assign(auditForm, {
        id: '',
        auditCode: '',
        auditName: '',
        auditType: 'internal',
        auditDate: '',
        auditor: '',
        auditScope: '',
        auditObjective: '',
        auditeeDepartment: '',
        status: 'planned'
      });
    };
    
    // 重置完成审核表单
    const resetCompleteAuditForm = () => {
      completeAuditFormRef.value?.resetFields();
      Object.assign(completeAuditForm, {
        result: 'pass',
        conclusion: '',
        recommendations: ''
      });
    };
    
    // 获取审核类型标签
    const getAuditTypeTag = (type) => {
      const tagMap = {
        internal: 'primary',
        external: 'success',
        supplier: 'warning'
      };
      return tagMap[type] || 'default';
    };
    
    // 获取审核类型文本
    const getAuditTypeText = (type) => {
      const textMap = {
        internal: '内部审核',
        external: '外部审核',
        supplier: '供应商审核'
      };
      return textMap[type] || '未知类型';
    };
    
    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        planned: 'info',
        inProgress: 'primary',
        completed: 'success',
        cancelled: 'danger'
      };
      return statusMap[status] || 'default';
    };
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        planned: '计划中',
        inProgress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      };
      return statusMap[status] || '未知状态';
    };
    
    // 获取严重程度类型
    const getSeverityType = (severity) => {
      const severityMap = {
        critical: 'danger',
        major: 'warning',
        minor: 'info',
        observation: 'success'
      };
      return severityMap[severity] || 'default';
    };
    
    // 获取严重程度文本
    const getSeverityText = (severity) => {
      const severityMap = {
        critical: '严重',
        major: '主要',
        minor: '次要',
        observation: '观察项'
      };
      return severityMap[severity] || '未知';
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
      auditPlans,
      dialogVisible,
      viewDialogVisible,
      completeDialogVisible,
      isEdit,
      auditFormRef,
      completeAuditFormRef,
      currentAudit,
      searchForm,
      pagination,
      auditForm,
      completeAuditForm,
      auditFormRules,
      completeAuditFormRules,
      
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleCreateAudit,
      handleEditAudit,
      handleViewAudit,
      handleSaveAudit,
      handleStartAudit,
      handleCompleteAudit,
      confirmCompleteAudit,
      handleCancelAudit,
      handleDeleteAudit,
      getAuditTypeTag,
      getAuditTypeText,
      getStatusType,
      getStatusText,
      getSeverityType,
      getSeverityText,
      formatDate,
      formatDateTime
    };
  }
};
</script>

<style scoped>
.quality-audit {
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
</style>