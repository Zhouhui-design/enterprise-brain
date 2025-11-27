<template>
  <div class="quality-inspection">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>质量检验管理</span>
          <el-button type="primary" @click="handleCreateInspection">
            <el-icon><Plus /></el-icon> 新建检验任务
          </el-button>
        </div>
      </template>
      
      <!-- 搜索条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form" label-width="100px">
        <el-form-item label="检验单号">
          <el-input v-model="searchForm.inspectionNo" placeholder="请输入检验单号" clearable />
        </el-form-item>
        <el-form-item label="产品编号">
          <el-input v-model="searchForm.productCode" placeholder="请输入产品编号" clearable />
        </el-form-item>
        <el-form-item label="检验类型">
          <el-select v-model="searchForm.inspectionType" placeholder="请选择检验类型" clearable>
            <el-option label="入库检验" value="incoming" />
            <el-option label="过程检验" value="process" />
            <el-option label="成品检验" value="finished" />
            <el-option label="出库检验" value="outgoing" />
          </el-select>
        </el-form-item>
        <el-form-item label="检验状态">
          <el-select v-model="searchForm.status" placeholder="请选择检验状态" clearable>
            <el-option label="待检验" value="pending" />
            <el-option label="检验中" value="inspecting" />
            <el-option label="已完成" value="completed" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 检验任务列表 -->
      <el-table :data="inspectionTasks" style="width: 100%" border>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="inspectionNo" label="检验单号" width="150" />
        <el-table-column prop="productCode" label="产品编号" width="120" />
        <el-table-column prop="productName" label="产品名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="batchNo" label="批次号" width="120" />
        <el-table-column prop="quantity" label="检验数量" width="100" />
        <el-table-column prop="inspectionType" label="检验类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getInspectionTypeTag(row.inspectionType)">{{ getInspectionTypeText(row.inspectionType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inspector" label="检验员" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewInspection(row)">查看</el-button>
            <el-button type="success" size="small" @click="handlePerformInspection(row)" v-if="row.status === 'pending'">执行检验</el-button>
            <el-button type="danger" size="small" @click="handleDeleteInspection(row)" v-if="row.status === 'pending'">删除</el-button>
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
    
    <!-- 执行检验对话框 -->
    <el-dialog
      v-model="inspectionDialogVisible"
      title="执行检验"
      width="900px"
      destroy-on-close
    >
      <el-descriptions :column="2" border style="margin-bottom: 20px;">
        <el-descriptions-item label="检验单号">{{ currentInspection.inspectionNo }}</el-descriptions-item>
        <el-descriptions-item label="检验类型">{{ getInspectionTypeText(currentInspection.inspectionType) }}</el-descriptions-item>
        <el-descriptions-item label="产品编号">{{ currentInspection.productCode }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ currentInspection.productName }}</el-descriptions-item>
        <el-descriptions-item label="批次号">{{ currentInspection.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="检验数量">{{ currentInspection.quantity }}</el-descriptions-item>
        <el-descriptions-item label="检验标准">{{ currentInspection.qualityStandard }}</el-descriptions-item>
        <el-descriptions-item label="检验员">{{ currentInspection.inspector }}</el-descriptions-item>
      </el-descriptions>
      
      <h4>检验项目</h4>
      <el-table :data="inspectionResults" border style="width: 100%;">
        <el-table-column prop="itemName" label="检验项目" width="180" />
        <el-table-column prop="standard" label="检验标准" width="150" />
        <el-table-column prop="method" label="检验方法" width="120" />
        <el-table-column prop="actualValue" label="实测值" width="120">
          <template #default="{ $index }">
            <el-input v-model="inspectionResults[$index].actualValue" placeholder="请输入实测值" />
          </template>
        </el-table-column>
        <el-table-column prop="judgement" label="判定" width="100">
          <template #default="{ $index }">
            <el-radio-group v-model="inspectionResults[$index].judgement">
              <el-radio value="pass">合格</el-radio>
              <el-radio value="fail">不合格</el-radio>
            </el-radio-group>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="180">
          <template #default="{ $index }">
            <el-input v-model="inspectionResults[$index].remark" placeholder="请输入备注" />
          </template>
        </el-table-column>
      </el-table>
      
      <el-form :model="inspectionForm" style="margin-top: 20px;">
        <el-form-item label="总体判定">
          <el-radio-group v-model="inspectionForm.overallJudgement">
            <el-radio value="pass">合格</el-radio>
            <el-radio value="fail">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="检验结论" prop="conclusion">
          <el-input v-model="inspectionForm.conclusion" type="textarea" :rows="3" placeholder="请输入检验结论" />
        </el-form-item>
        <el-form-item label="处理建议" prop="suggestion">
          <el-input v-model="inspectionForm.suggestion" type="textarea" :rows="3" placeholder="请输入处理建议" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="inspectionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitInspection">提交检验结果</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

export default {
  name: 'QualityInspection',
  components: {
    Plus
  },
  setup() {
    // 状态管理
    const inspectionTasks = ref([]);
    const inspectionDialogVisible = ref(false);
    const currentInspection = reactive({});
    const inspectionResults = ref([]);
    
    // 搜索表单
    const searchForm = reactive({
      inspectionNo: '',
      productCode: '',
      inspectionType: '',
      status: ''
    });
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });
    
    // 检验表单
    const inspectionForm = reactive({
      overallJudgement: 'pass',
      conclusion: '',
      suggestion: ''
    });
    
    // 初始化加载数据
    onMounted(() => {
      loadInspectionTasks();
    });
    
    // 加载检验任务数据
    const loadInspectionTasks = () => {
      // 模拟数据
      inspectionTasks.value = generateMockInspectionTasks();
      pagination.total = inspectionTasks.value.length;
    };
    
    // 生成模拟检验任务数据
    const generateMockInspectionTasks = () => {
      const inspectionTypes = ['incoming', 'process', 'finished', 'outgoing'];
      const statuses = ['pending', 'inspecting', 'completed', 'closed'];
      const inspectors = ['李四', '王五', '赵六', '钱七'];
      
      return Array.from({ length: 30 }, (_, i) => {
        const inspectionType = inspectionTypes[Math.floor(Math.random() * inspectionTypes.length)];
        const productCode = `PROD${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`;
        
        return {
          id: i + 1,
          inspectionNo: `${getInspectionTypePrefix(inspectionType)}${2024}${String(i + 1).padStart(4, '0')}`,
          inspectionType,
          productCode,
          productName: `产品${productCode}`,
          batchNo: `BATCH${2024}${String(i + 1).padStart(4, '0')}`,
          quantity: Math.floor(Math.random() * 1000) + 100,
          qualityStandard: '符合质量计划要求',
          inspector: inspectors[Math.floor(Math.random() * inspectors.length)],
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          inspectionItems: [
            { itemName: '尺寸精度', standard: '±0.005mm', method: '三坐标测量' },
            { itemName: '表面粗糙度', standard: 'Ra ≤ 0.8μm', method: '粗糙度仪检测' },
            { itemName: '硬度测试', standard: 'HRC 58-62', method: '洛氏硬度计' }
          ]
        };
      });
    };
    
    // 获取检验类型前缀
    const getInspectionTypePrefix = (type) => {
      const prefixMap = {
        incoming: 'IQ',
        process: 'PQ',
        finished: 'FQ',
        outgoing: 'OQ'
      };
      return prefixMap[type] || 'IQ';
    };
    
    // 搜索
    const handleSearch = () => {
      ElMessage.success('搜索成功');
    };
    
    // 重置
    const handleReset = () => {
      Object.assign(searchForm, {
        inspectionNo: '',
        productCode: '',
        inspectionType: '',
        status: ''
      });
    };
    
    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
    };
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
    };
    
    // 创建检验任务
    const handleCreateInspection = () => {
      ElMessage.info('新建检验任务功能待实现');
    };
    
    // 查看检验结果
    const handleViewInspection = (row) => {
      Object.assign(currentInspection, JSON.parse(JSON.stringify(row)));
      // 这里可以显示检验结果
      ElMessage.info('查看检验结果功能待实现');
    };
    
    // 执行检验
    const handlePerformInspection = (row) => {
      Object.assign(currentInspection, JSON.parse(JSON.stringify(row)));
      // 初始化检验结果
      inspectionResults.value = row.inspectionItems.map(item => ({
        itemName: item.itemName,
        standard: item.standard,
        method: item.method,
        actualValue: '',
        judgement: 'pass',
        remark: ''
      }));
      // 重置表单
      Object.assign(inspectionForm, {
        overallJudgement: 'pass',
        conclusion: '',
        suggestion: ''
      });
      inspectionDialogVisible.value = true;
    };
    
    // 提交检验结果
    const handleSubmitInspection = () => {
      // 验证所有实测值是否填写
      const hasEmptyValue = inspectionResults.value.some(item => !item.actualValue);
      if (hasEmptyValue) {
        ElMessage.warning('请填写所有检验项目的实测值');
        return;
      }
      
      ElMessageBox.confirm('确定要提交检验结果吗？', '确认提交', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = inspectionTasks.value.findIndex(item => item.id === currentInspection.id);
        if (index !== -1) {
          inspectionTasks.value[index].status = 'completed';
          inspectionTasks.value[index].inspectionResults = inspectionResults.value;
          inspectionTasks.value[index].overallJudgement = inspectionForm.overallJudgement;
          inspectionTasks.value[index].conclusion = inspectionForm.conclusion;
          inspectionTasks.value[index].suggestion = inspectionForm.suggestion;
          ElMessage.success('检验结果提交成功');
          inspectionDialogVisible.value = false;
        }
      }).catch(() => {});
    };
    
    // 删除检验任务
    const handleDeleteInspection = (row) => {
      ElMessageBox.confirm(`确定要删除检验任务「${row.inspectionNo}」吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        const index = inspectionTasks.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          inspectionTasks.value.splice(index, 1);
          pagination.total--;
          ElMessage.success('检验任务删除成功');
        }
      }).catch(() => {});
    };
    
    // 获取检验类型标签
    const getInspectionTypeTag = (type) => {
      const tagMap = {
        incoming: 'primary',
        process: 'success',
        finished: 'warning',
        outgoing: 'info'
      };
      return tagMap[type] || 'default';
    };
    
    // 获取检验类型文本
    const getInspectionTypeText = (type) => {
      const textMap = {
        incoming: '入库检验',
        process: '过程检验',
        finished: '成品检验',
        outgoing: '出库检验'
      };
      return textMap[type] || '未知类型';
    };
    
    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        pending: 'info',
        inspecting: 'primary',
        completed: 'success',
        closed: 'warning'
      };
      return statusMap[status] || 'default';
    };
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        pending: '待检验',
        inspecting: '检验中',
        completed: '已完成',
        closed: '已关闭'
      };
      return statusMap[status] || '未知状态';
    };
    
    return {
      inspectionTasks,
      inspectionDialogVisible,
      currentInspection,
      inspectionResults,
      searchForm,
      pagination,
      inspectionForm,
      
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleCreateInspection,
      handleViewInspection,
      handlePerformInspection,
      handleSubmitInspection,
      handleDeleteInspection,
      getInspectionTypeTag,
      getInspectionTypeText,
      getStatusType,
      getStatusText
    };
  }
};
</script>

<style scoped>
.quality-inspection {
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