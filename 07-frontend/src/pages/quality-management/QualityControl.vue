<template>
  <div class="quality-control">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>质量控制管理</span>
          <el-button type="primary" @click="handleCreateControlPoint">
            <el-icon><Plus /></el-icon> 新建控制点
          </el-button>
        </div>
      </template>
      
      <!-- 搜索条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form" label-width="100px">
        <el-form-item label="控制点名称">
          <el-input v-model="searchForm.pointName" placeholder="请输入控制点名称" clearable />
        </el-form-item>
        <el-form-item label="所属工序">
          <el-input v-model="searchForm.processName" placeholder="请输入所属工序" clearable />
        </el-form-item>
        <el-form-item label="控制点类型">
          <el-select v-model="searchForm.pointType" placeholder="请选择控制点类型" clearable>
            <el-option label="关键点" value="key" />
            <el-option label="重要点" value="important" />
            <el-option label="一般点" value="normal" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 控制点列表 -->
      <el-table :data="controlPoints" style="width: 100%" border>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="pointCode" label="控制点编号" width="150" />
        <el-table-column prop="pointName" label="控制点名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="processName" label="所属工序" width="150" />
        <el-table-column prop="pointType" label="控制点类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getPointTypeTag(row.pointType)">{{ getPointTypeText(row.pointType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="controlStandard" label="控制标准" min-width="200" show-overflow-tooltip />
        <el-table-column prop="responsiblePerson" label="责任人" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewControlPoint(row)">查看</el-button>
            <el-button size="small" @click="handleEditControlPoint(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDeleteControlPoint(row)">删除</el-button>
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
    
    <!-- 新建/编辑控制点对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑控制点' : '新建控制点'"
      width="800px"
      destroy-on-close
    >
      <el-form :model="controlPointForm" :rules="controlPointFormRules" ref="controlPointFormRef" label-width="120px">
        <el-form-item label="控制点名称" prop="pointName">
          <el-input v-model="controlPointForm.pointName" placeholder="请输入控制点名称" />
        </el-form-item>
        <el-form-item label="控制点类型" prop="pointType">
          <el-select v-model="controlPointForm.pointType" placeholder="请选择控制点类型">
            <el-option label="关键点" value="key" />
            <el-option label="重要点" value="important" />
            <el-option label="一般点" value="normal" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属工序" prop="processName">
          <el-input v-model="controlPointForm.processName" placeholder="请输入所属工序" />
        </el-form-item>
        <el-form-item label="控制标准" prop="controlStandard">
          <el-input v-model="controlPointForm.controlStandard" type="textarea" :rows="3" placeholder="请输入控制标准" />
        </el-form-item>
        <el-form-item label="控制方法" prop="controlMethod">
          <el-input v-model="controlPointForm.controlMethod" type="textarea" :rows="3" placeholder="请输入控制方法" />
        </el-form-item>
        <el-form-item label="责任人" prop="responsiblePerson">
          <el-input v-model="controlPointForm.responsiblePerson" placeholder="请输入责任人" />
        </el-form-item>
        <el-form-item label="检验频率" prop="inspectionFrequency">
          <el-input v-model="controlPointForm.inspectionFrequency" placeholder="请输入检验频率" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="controlPointForm.status" active-value="active" inactive-value="inactive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveControlPoint">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 查看控制点对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="控制点详情"
      width="900px"
      destroy-on-close
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="控制点编号">{{ currentControlPoint.pointCode }}</el-descriptions-item>
        <el-descriptions-item label="控制点名称">{{ currentControlPoint.pointName }}</el-descriptions-item>
        <el-descriptions-item label="控制点类型">{{ getPointTypeText(currentControlPoint.pointType) }}</el-descriptions-item>
        <el-descriptions-item label="所属工序">{{ currentControlPoint.processName }}</el-descriptions-item>
        <el-descriptions-item label="控制标准">{{ currentControlPoint.controlStandard }}</el-descriptions-item>
        <el-descriptions-item label="控制方法">{{ currentControlPoint.controlMethod }}</el-descriptions-item>
        <el-descriptions-item label="责任人">{{ currentControlPoint.responsiblePerson }}</el-descriptions-item>
        <el-descriptions-item label="检验频率">{{ currentControlPoint.inspectionFrequency }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentControlPoint.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusText(currentControlPoint.status) }}</el-descriptions-item>
      </el-descriptions>
      
      <h4 style="margin-top: 20px; margin-bottom: 10px;">最近控制记录</h4>
      <el-table :data="currentControlPoint.recentRecords" border style="width: 100%;">
        <el-table-column prop="inspectionDate" label="检查日期" width="150" :formatter="formatDate" />
        <el-table-column prop="inspector" label="检查人" width="100" />
        <el-table-column prop="actualValue" label="实测值" width="120" />
        <el-table-column prop="judgement" label="判定" width="80">
          <template #default="{ row }">
            <el-tag :type="row.judgement === 'pass' ? 'success' : 'danger'">{{ row.judgement === 'pass' ? '合格' : '不合格' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

export default {
  name: 'QualityControl',
  components: {
    Plus
  },
  setup() {
    // 状态管理
    const controlPoints = ref([]);
    const dialogVisible = ref(false);
    const viewDialogVisible = ref(false);
    const isEdit = ref(false);
    const controlPointFormRef = ref(null);
    const currentControlPoint = reactive({});
    
    // 搜索表单
    const searchForm = reactive({
      pointName: '',
      processName: '',
      pointType: '',
      status: ''
    });
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });
    
    // 控制点表单
    const controlPointForm = reactive({
      id: '',
      pointCode: '',
      pointName: '',
      pointType: 'normal',
      processName: '',
      controlStandard: '',
      controlMethod: '',
      responsiblePerson: '',
      inspectionFrequency: '',
      status: 'active'
    });
    
    // 表单验证规则
    const controlPointFormRules = {
      pointName: [
        { required: true, message: '请输入控制点名称', trigger: 'blur' },
        { min: 2, max: 100, message: '控制点名称长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      pointType: [
        { required: true, message: '请选择控制点类型', trigger: 'change' }
      ],
      processName: [
        { required: true, message: '请输入所属工序', trigger: 'blur' }
      ],
      controlStandard: [
        { required: true, message: '请输入控制标准', trigger: 'blur' }
      ],
      controlMethod: [
        { required: true, message: '请输入控制方法', trigger: 'blur' }
      ],
      responsiblePerson: [
        { required: true, message: '请输入责任人', trigger: 'blur' }
      ],
      inspectionFrequency: [
        { required: true, message: '请输入检验频率', trigger: 'blur' }
      ]
    };
    
    // 初始化加载数据
    onMounted(() => {
      loadControlPoints();
    });
    
    // 加载控制点数据
    const loadControlPoints = () => {
      // 模拟数据
      controlPoints.value = generateMockControlPoints();
      pagination.total = controlPoints.value.length;
    };
    
    // 生成模拟控制点数据
    const generateMockControlPoints = () => {
      const pointTypes = ['key', 'important', 'normal'];
      const statuses = ['active', 'inactive'];
      const processes = ['车削工序', '铣削工序', '钻孔工序', '磨削工序', '装配工序'];
      const responsiblePersons = ['张三', '李四', '王五', '赵六', '钱七'];
      
      return Array.from({ length: 30 }, (_, i) => {
        const pointType = pointTypes[Math.floor(Math.random() * pointTypes.length)];
        const process = processes[Math.floor(Math.random() * processes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
          id: i + 1,
          pointCode: `${getPointTypePrefix(pointType)}${2024}${String(i + 1).padStart(4, '0')}`,
          pointName: `${process}质量控制点${i + 1}`,
          pointType,
          processName: process,
          controlStandard: getControlStandard(pointType),
          controlMethod: '定期检查+数据记录+异常处理',
          responsiblePerson: responsiblePersons[Math.floor(Math.random() * responsiblePersons.length)],
          inspectionFrequency: getInspectionFrequency(pointType),
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)),
          status,
          recentRecords: generateMockControlRecords(3)
        };
      });
    };
    
    // 获取控制点类型前缀
    const getPointTypePrefix = (type) => {
      const prefixMap = {
        key: 'KP',
        important: 'IP',
        normal: 'NP'
      };
      return prefixMap[type] || 'NP';
    };
    
    // 获取控制标准
    const getControlStandard = (type) => {
      const standards = {
        key: '严格按照工艺要求，尺寸公差±0.001mm，表面粗糙度Ra≤0.4μm',
        important: '按工艺要求执行，尺寸公差±0.005mm，表面粗糙度Ra≤0.8μm',
        normal: '符合基本工艺要求，尺寸公差±0.01mm，表面粗糙度Ra≤1.6μm'
      };
      return standards[type] || '符合工艺要求';
    };
    
    // 获取检验频率
    const getInspectionFrequency = (type) => {
      const frequencies = {
        key: '每小时一次',
        important: '每班三次',
        normal: '每班一次'
      };
      return frequencies[type] || '每班一次';
    };
    
    // 生成模拟控制记录
    const generateMockControlRecords = (count) => {
      const inspectors = ['张三', '李四', '王五'];
      const records = [];
      
      for (let i = 0; i < count; i++) {
        const isPass = Math.random() > 0.1; // 90%概率合格
        records.push({
          inspectionDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          inspector: inspectors[Math.floor(Math.random() * inspectors.length)],
          actualValue: isPass ? '符合要求' : '略微超差',
          judgement: isPass ? 'pass' : 'fail',
          remark: isPass ? '正常' : '已调整设备参数'
        });
      }
      
      return records;
    };
    
    // 搜索
    const handleSearch = () => {
      // 实际项目中这里应该调用API进行搜索
      ElMessage.success('搜索成功');
    };
    
    // 重置
    const handleReset = () => {
      Object.assign(searchForm, {
        pointName: '',
        processName: '',
        pointType: '',
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
    
    // 创建控制点
    const handleCreateControlPoint = () => {
      isEdit.value = false;
      resetControlPointForm();
      dialogVisible.value = true;
    };
    
    // 编辑控制点
    const handleEditControlPoint = (row) => {
      isEdit.value = true;
      Object.assign(controlPointForm, JSON.parse(JSON.stringify(row)));
      dialogVisible.value = true;
    };
    
    // 查看控制点
    const handleViewControlPoint = (row) => {
      Object.assign(currentControlPoint, JSON.parse(JSON.stringify(row)));
      viewDialogVisible.value = true;
    };
    
    // 保存控制点
    const handleSaveControlPoint = () => {
      controlPointFormRef.value?.validate((valid) => {
        if (valid) {
          if (!isEdit.value) {
            // 新建控制点，生成编号
            const pointCode = `${getPointTypePrefix(controlPointForm.pointType)}${new Date().getFullYear()}${String(controlPoints.value.length + 1).padStart(4, '0')}`;
            controlPointForm.pointCode = pointCode;
            controlPointForm.createdAt = new Date();
            controlPointForm.recentRecords = [];
            controlPoints.value.unshift(JSON.parse(JSON.stringify(controlPointForm)));
            pagination.total++;
          } else {
            // 编辑现有控制点
            const index = controlPoints.value.findIndex(item => item.id === controlPointForm.id);
            if (index !== -1) {
              controlPoints.value[index] = JSON.parse(JSON.stringify(controlPointForm));
            }
          }
          ElMessage.success(isEdit.value ? '控制点更新成功' : '控制点创建成功');
          dialogVisible.value = false;
        }
      });
    };
    
    // 删除控制点
    const handleDeleteControlPoint = (row) => {
      ElMessageBox.confirm(`确定要删除控制点「${row.pointName}」吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        const index = controlPoints.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          controlPoints.value.splice(index, 1);
          pagination.total--;
          ElMessage.success('控制点删除成功');
        }
      }).catch(() => {});
    };
    
    // 重置控制点表单
    const resetControlPointForm = () => {
      controlPointFormRef.value?.resetFields();
      Object.assign(controlPointForm, {
        id: '',
        pointCode: '',
        pointName: '',
        pointType: 'normal',
        processName: '',
        controlStandard: '',
        controlMethod: '',
        responsiblePerson: '',
        inspectionFrequency: '',
        status: 'active'
      });
    };
    
    // 获取控制点类型标签
    const getPointTypeTag = (type) => {
      const tagMap = {
        key: 'danger',
        important: 'warning',
        normal: 'success'
      };
      return tagMap[type] || 'default';
    };
    
    // 获取控制点类型文本
    const getPointTypeText = (type) => {
      const textMap = {
        key: '关键点',
        important: '重要点',
        normal: '一般点'
      };
      return textMap[type] || '未知类型';
    };
    
    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        active: 'success',
        inactive: 'info'
      };
      return statusMap[status] || 'default';
    };
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        active: '启用',
        inactive: '禁用'
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
      return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    
    return {
      controlPoints,
      dialogVisible,
      viewDialogVisible,
      isEdit,
      controlPointFormRef,
      currentControlPoint,
      searchForm,
      pagination,
      controlPointForm,
      controlPointFormRules,
      
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleCreateControlPoint,
      handleEditControlPoint,
      handleViewControlPoint,
      handleSaveControlPoint,
      handleDeleteControlPoint,
      getPointTypeTag,
      getPointTypeText,
      getStatusType,
      getStatusText,
      formatDate,
      formatDateTime
    };
  }
};
</script>

<style scoped>
.quality-control {
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