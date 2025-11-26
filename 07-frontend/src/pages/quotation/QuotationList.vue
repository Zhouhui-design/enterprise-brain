<template>
  <div class="quotation-list-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>报价列表</span>
          <el-button type="primary" @click="handleCreateQuotation">
            <el-icon><Plus /></el-icon>
            新建报价
          </el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选区域 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="报价编号">
          <el-input v-model="searchForm.quotationNo" placeholder="请输入报价编号" />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" />
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
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending_review" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已审核" value="reviewed" />
            <el-option label="待审批" value="pending_approval" />
            <el-option label="已审批" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 报价列表 -->
      <el-table :data="quotationList" style="width: 100%" border>
        <el-table-column prop="quotationNo" label="报价编号" width="180" />
        <el-table-column prop="customerName" label="客户名称" width="180" />
        <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
          <template #default="scope">
            ¥ {{ scope.row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="validUntil" label="有效期至" width="150" />
        <el-table-column prop="creator" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleViewDetail(scope.row.id)">查看</el-button>
            <template v-if="scope.row.status === 'draft'">
              <el-button size="small" type="primary" @click="handleEdit(scope.row.id)">编辑</el-button>
              <el-button size="small" type="success" @click="handleSubmitReview(scope.row.id)">提交审核</el-button>
            </template>
            <template v-else-if="['reviewed', 'approved'].includes(scope.row.status)">
              <el-button size="small" type="warning" @click="handleConvertToOrder(scope.row.id)">转订单</el-button>
            </template>
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

// 定义报价单接口
interface Quotation {
  id: string;
  quotationNo: string;
  customerName: string;
  totalAmount: number;
  validUntil: string;
  creator: string;
  createTime: string;
  status: string;
}

// 定义搜索表单
const searchForm = reactive({
  quotationNo: '',
  customerName: '',
  createTime: null,
  status: ''
});

// 定义分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 定义报价列表
const quotationList = ref<Quotation[]>([]);
const router = useRouter();

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'info',
    pending_review: 'warning',
    reviewing: 'primary',
    reviewed: 'success',
    pending_approval: 'warning',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'info',
    completed: 'success'
  };
  return statusMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    pending_review: '待审核',
    reviewing: '审核中',
    reviewed: '已审核',
    pending_approval: '待审批',
    approved: '已审批',
    rejected: '已拒绝',
    cancelled: '已取消',
    completed: '已完成'
  };
  return statusMap[status] || status;
};

// 模拟获取报价列表数据
const fetchQuotationList = () => {
  // 模拟API调用，实际项目中应该替换为真实API
  // 这里使用模拟数据
  const mockData: Quotation[] = [
    {
      id: '1',
      quotationNo: 'QT2023001',
      customerName: '北京科技有限公司',
      totalAmount: 125000.00,
      validUntil: '2023-12-31',
      creator: '张三',
      createTime: '2023-10-15 09:30:00',
      status: 'approved'
    },
    {
      id: '2',
      quotationNo: 'QT2023002',
      customerName: '上海贸易有限公司',
      totalAmount: 89000.00,
      validUntil: '2023-12-15',
      creator: '李四',
      createTime: '2023-10-16 14:20:00',
      status: 'draft'
    },
    {
      id: '3',
      quotationNo: 'QT2023003',
      customerName: '广州制造有限公司',
      totalAmount: 215000.00,
      validUntil: '2024-01-15',
      creator: '王五',
      createTime: '2023-10-18 10:00:00',
      status: 'pending_review'
    },
    {
      id: '4',
      quotationNo: 'QT2023004',
      customerName: '深圳科技有限公司',
      totalAmount: 156000.00,
      validUntil: '2023-12-20',
      creator: '赵六',
      createTime: '2023-10-20 16:45:00',
      status: 'reviewed'
    },
    {
      id: '5',
      quotationNo: 'QT2023005',
      customerName: '成都服务有限公司',
      totalAmount: 98000.00,
      validUntil: '2024-01-10',
      creator: '孙七',
      createTime: '2023-10-22 11:30:00',
      status: 'rejected'
    }
  ];
  
  // 根据搜索条件筛选数据
  let filteredData = [...mockData];
  
  if (searchForm.quotationNo) {
    filteredData = filteredData.filter(item => item.quotationNo.includes(searchForm.quotationNo));
  }
  
  if (searchForm.customerName) {
    filteredData = filteredData.filter(item => item.customerName.includes(searchForm.customerName));
  }
  
  if (searchForm.status) {
    filteredData = filteredData.filter(item => item.status === searchForm.status);
  }
  
  // 模拟分页
  pagination.total = filteredData.length;
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  quotationList.value = filteredData.slice(start, end);
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchQuotationList();
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    quotationNo: '',
    customerName: '',
    createTime: null,
    status: ''
  });
  pagination.currentPage = 1;
  fetchQuotationList();
};

// 处理创建报价
const handleCreateQuotation = () => {
  router.push('/quotation/create');
};

// 处理查看详情
const handleViewDetail = (id: string) => {
  router.push(`/quotation/detail/${id}`);
};

// 处理编辑
const handleEdit = (id: string) => {
  router.push(`/quotation/edit/${id}`);
};

// 处理提交审核
const handleSubmitReview = (id: string) => {
  ElMessage.success('报价单已提交审核');
  fetchQuotationList(); // 刷新列表
};

// 处理转订单
const handleConvertToOrder = (id: string) => {
  router.push(`/quotation/convert/${id}`);
};

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  fetchQuotationList();
};

// 处理当前页码变化
const handleCurrentChange = (current: number) => {
  pagination.currentPage = current;
  fetchQuotationList();
};

// 组件挂载时获取数据
onMounted(() => {
  fetchQuotationList();
});
</script>

<style scoped>
.quotation-list-container {
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>