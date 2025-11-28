<template>
  <div class="quality-plan">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>质量计划管理</span>
          <el-button type="primary" @click="handleCreatePlan">
            <el-icon><Plus /></el-icon> 新建质量计划
          </el-button>
        </div>
      </template>
      
      <!-- 搜索条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form" label-width="100px">
        <el-form-item label="计划名称">
          <el-input v-model="searchForm.planName" placeholder="请输入计划名称" clearable />
        </el-form-item>
        <el-form-item label="产品编号">
          <el-input v-model="searchForm.productCode" placeholder="请输入产品编号" clearable />
        </el-form-item>
        <el-form-item label="计划状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已执行" value="executed" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.createTime"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 质量计划列表 -->
      <el-table :data="qualityPlans" style="width: 100%" border>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="计划编号" width="120" />
        <el-table-column prop="planName" label="计划名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="productCode" label="产品编号" width="120" />
        <el-table-column prop="productName" label="产品名称" width="150" show-overflow-tooltip />
        <el-table-column prop="version" label="版本号" width="80" />
        <el-table-column prop="createdBy" label="创建人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180" :formatter="formatDateTime" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewPlan(row)">查看</el-button>
            <el-button size="small" @click="handleEditPlan(row)" v-if="row.status === 'draft'">编辑</el-button>
            <el-button type="success" size="small" @click="handlePublishPlan(row)" v-if="row.status === 'draft'">发布</el-button>
            <el-button type="danger" size="small" @click="handleDeletePlan(row)" v-if="row.status === 'draft'">删除</el-button>
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
    
    <!-- 新建/编辑质量计划对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑质量计划' : '新建质量计划'"
      width="800px"
      destroy-on-close
    >
      <el-form :model="planForm" :rules="planFormRules" ref="planFormRef" label-width="120px">
        <el-form-item label="计划名称" prop="planName">
          <el-input v-model="planForm.planName" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="产品信息" prop="productId">
          <el-select v-model="planForm.productId" placeholder="请选择产品">
            <el-option
              v-for="product in products"
              :key="product.id"
              :label="`${product.code} - ${product.name}`"
              :value="product.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="planForm.version" placeholder="请输入版本号" />
        </el-form-item>
        <el-form-item label="生效日期" prop="effectiveDate">
          <el-date-picker v-model="planForm.effectiveDate" type="date" placeholder="选择生效日期" />
        </el-form-item>
        <el-form-item label="失效日期" prop="expireDate">
          <el-date-picker v-model="planForm.expireDate" type="date" placeholder="选择失效日期" />
        </el-form-item>
        <el-form-item label="质量标准" prop="qualityStandard">
          <el-input v-model="planForm.qualityStandard" type="textarea" :rows="3" placeholder="请输入质量标准" />
        </el-form-item>
        <el-form-item label="检验项目">
          <el-table :data="planForm.inspectionItems" border style="width: 100%;">
            <el-table-column prop="itemName" label="检验项目名称" width="180">
              <template #default="{ $index }">
                <el-input v-model="planForm.inspectionItems[$index].itemName" placeholder="请输入检验项目名称" />
              </template>
            </el-table-column>
            <el-table-column prop="standard" label="检验标准" width="200">
              <template #default="{ $index }">
                <el-input v-model="planForm.inspectionItems[$index].standard" placeholder="请输入检验标准" />
              </template>
            </el-table-column>
            <el-table-column prop="method" label="检验方法" width="150">
              <template #default="{ $index }">
                <el-input v-model="planForm.inspectionItems[$index].method" placeholder="请输入检验方法" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" size="small" @click="removeInspectionItem($index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" size="small" @click="addInspectionItem" style="margin-top: 10px;">
            <el-icon><Plus /></el-icon> 添加检验项目
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePlan">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 查看质量计划对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="质量计划详情"
      width="900px"
      destroy-on-close
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="计划编号">{{ currentPlan.id }}</el-descriptions-item>
        <el-descriptions-item label="计划名称">{{ currentPlan.planName }}</el-descriptions-item>
        <el-descriptions-item label="产品编号">{{ currentPlan.productCode }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ currentPlan.productName }}</el-descriptions-item>
        <el-descriptions-item label="版本号">{{ currentPlan.version }}</el-descriptions-item>
        <el-descriptions-item label="生效日期">{{ formatDate(currentPlan.effectiveDate) }}</el-descriptions-item>
        <el-descriptions-item label="失效日期">{{ formatDate(currentPlan.expireDate) }}</el-descriptions-item>
        <el-descriptions-item label="质量标准">{{ currentPlan.qualityStandard }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentPlan.createdBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentPlan.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusText(currentPlan.status) }}</el-descriptions-item>
      </el-descriptions>
      
      <h4 style="margin-top: 20px; margin-bottom: 10px;">检验项目清单</h4>
      <el-table :data="currentPlan.inspectionItems" border style="width: 100%;">
        <el-table-column prop="itemName" label="检验项目名称" />
        <el-table-column prop="standard" label="检验标准" />
        <el-table-column prop="method" label="检验方法" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';

export default {
  name: 'QualityPlan',
  components: {
    Plus,
    Delete
  },
  setup() {
    // 状态管理
    const qualityPlans = ref([]);
    const dialogVisible = ref(false);
    const viewDialogVisible = ref(false);
    const isEdit = ref(false);
    const planFormRef = ref(null);
    const currentPlan = reactive({});
    
    // 搜索表单
    const searchForm = reactive({
      planName: '',
      productCode: '',
      status: '',
      createTime: null
    });
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });
    
    // 计划表单
    const planForm = reactive({
      id: '',
      planName: '',
      productId: '',
      version: '1.0',
      effectiveDate: new Date(),
      expireDate: '',
      qualityStandard: '',
      inspectionItems: []
    });
    
    // 表单验证规则
    const planFormRules = {
      planName: [
        { required: true, message: '请输入计划名称', trigger: 'blur' },
        { min: 2, max: 100, message: '计划名称长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      productId: [
        { required: true, message: '请选择产品', trigger: 'change' }
      ],
      version: [
        { required: true, message: '请输入版本号', trigger: 'blur' }
      ],
      effectiveDate: [
        { required: true, message: '请选择生效日期', trigger: 'change' }
      ]
    };
    
    // 模拟产品数据
    const products = ref([
      { id: 1, code: 'PROD001', name: '精密机械部件A' },
      { id: 2, code: 'PROD002', name: '电子控制模块B' },
      { id: 3, code: 'PROD003', name: '液压系统组件C' },
      { id: 4, code: 'PROD004', name: '传感器套件D' },
      { id: 5, code: 'PROD005', name: '传动装置E' }
    ]);
    
    // 初始化加载数据
    onMounted(() => {
      loadQualityPlans();
    });
    
    // 加载质量计划数据
    const loadQualityPlans = () => {
      // 模拟数据
      qualityPlans.value = generateMockQualityPlans();
      pagination.total = qualityPlans.value.length;
    };
    
    // 生成模拟质量计划数据
    const generateMockQualityPlans = () => {
      const statuses = ['draft', 'published', 'executed', 'completed'];
      return Array.from({ length: 30 }, (_, i) => {
        const product = products.value[Math.floor(Math.random() * products.value.length)];
        return {
          id: `QP${2024}${String(i + 1).padStart(4, '0')}`,
          planName: `${product.name}质量控制计划`,
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          version: `${Math.floor(Math.random() * 2) + 1}.${Math.floor(Math.random() * 9) + 1}`,
          effectiveDate: new Date(),
          expireDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          qualityStandard: '符合ISO 9001:2015标准要求',
          createdBy: '张三',
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
    
    // 搜索
    const handleSearch = () => {
      // 实际项目中这里应该调用API进行搜索
      ElMessage.success('搜索成功');
    };
    
    // 重置
    const handleReset = () => {
      Object.assign(searchForm, {
        planName: '',
        productCode: '',
        status: '',
        createTime: null
      });
    };
    
    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
    };
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
    };
    
    // 创建质量计划
    const handleCreatePlan = () => {
      isEdit.value = false;
      resetPlanForm();
      planForm.inspectionItems = [{ itemName: '', standard: '', method: '' }];
      dialogVisible.value = true;
    };
    
    // 编辑质量计划
    const handleEditPlan = (row) => {
      isEdit.value = true;
      Object.assign(planForm, JSON.parse(JSON.stringify(row)));
      dialogVisible.value = true;
    };
    
    // 查看质量计划
    const handleViewPlan = (row) => {
      Object.assign(currentPlan, JSON.parse(JSON.stringify(row)));
      viewDialogVisible.value = true;
    };
    
    // 保存质量计划
    const handleSavePlan = () => {
      planFormRef.value?.validate((valid) => {
        if (valid) {
          // 模拟保存操作
          ElMessage.success(isEdit.value ? '质量计划更新成功' : '质量计划创建成功');
          dialogVisible.value = false;
          loadQualityPlans();
        }
      });
    };
    
    // 发布质量计划
    const handlePublishPlan = (row) => {
      ElMessageBox.confirm(`确定要发布质量计划「${row.planName}」吗？`, '确认发布', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = qualityPlans.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          qualityPlans.value[index].status = 'published';
          ElMessage.success('质量计划发布成功');
        }
      }).catch(() => {});
    };
    
    // 删除质量计划
    const handleDeletePlan = (row) => {
      ElMessageBox.confirm(`确定要删除质量计划「${row.planName}」吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        const index = qualityPlans.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          qualityPlans.value.splice(index, 1);
          pagination.total--;
          ElMessage.success('质量计划删除成功');
        }
      }).catch(() => {});
    };
    
    // 添加检验项目
    const addInspectionItem = () => {
      planForm.inspectionItems.push({ itemName: '', standard: '', method: '' });
    };
    
    // 删除检验项目
    const removeInspectionItem = (index) => {
      planForm.inspectionItems.splice(index, 1);
    };
    
    // 重置计划表单
    const resetPlanForm = () => {
      planFormRef.value?.resetFields();
      Object.assign(planForm, {
        id: '',
        planName: '',
        productId: '',
        version: '1.0',
        effectiveDate: new Date(),
        expireDate: '',
        qualityStandard: '',
        inspectionItems: []
      });
    };
    
    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        draft: 'info',
        published: 'primary',
        executed: 'success',
        completed: 'warning'
      };
      return statusMap[status] || 'default';
    };
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        draft: '草稿',
        published: '已发布',
        executed: '已执行',
        completed: '已完成'
      };
      return statusMap[status] || '未知状态';
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
      return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    };
    
    return {
      qualityPlans,
      dialogVisible,
      viewDialogVisible,
      isEdit,
      planFormRef,
      currentPlan,
      searchForm,
      pagination,
      planForm,
      planFormRules,
      products,
      
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleCreatePlan,
      handleEditPlan,
      handleViewPlan,
      handleSavePlan,
      handlePublishPlan,
      handleDeletePlan,
      addInspectionItem,
      removeInspectionItem,
      getStatusType,
      getStatusText,
      formatDate,
      formatDateTime
    };
  }
};
</script>

<style scoped>
.quality-plan {
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