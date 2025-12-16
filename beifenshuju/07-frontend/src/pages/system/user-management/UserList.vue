<template>
  <div class="user-list-container">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="logo">
        <span>企业管理系统</span>
      </div>
      <nav class="main-nav">
        <ul>
          <li><router-link to="/pages/system">首页</router-link></li>
          <li class="active">人事管理</li>
          <li>系统设置</li>
        </ul>
      </nav>
      <div class="user-menu">
        <el-avatar icon="User" class="avatar"></el-avatar>
        <span class="user-name">管理员</span>
      </div>
    </header>

    <!-- 面包屑导航 -->
    <el-breadcrumb class="breadcrumb" separator="/">
      <el-breadcrumb-item><router-link to="/pages/system">首页</router-link></el-breadcrumb-item>
      <el-breadcrumb-item>系统管理</el-breadcrumb-item>
      <el-breadcrumb-item>人事管理</el-breadcrumb-item>
      <el-breadcrumb-item>用户列表</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 操作区域 -->
    <div class="operation-bar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索用户名/手机号" 
        prefix-icon="Search"
        class="search-input"
      ></el-input>
      <div class="button-group">
        <el-button type="primary" @click="handleAddUser">
          <el-icon><Plus /></el-icon>
          <span>新增用户</span>
        </el-button>
        <el-button @click="handleBatchDelete" :disabled="selectedIds.length === 0">
          <el-icon><Delete /></el-icon>
          <span>批量删除</span>
        </el-button>
      </div>
    </div>

    <!-- 用户表格 -->
    <el-table 
      :data="userList" 
      border 
      class="user-table"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="username" label="用户名"></el-table-column>
      <el-table-column prop="name" label="姓名"></el-table-column>
      <el-table-column prop="department" label="部门"></el-table-column>
      <el-table-column prop="position" label="职位"></el-table-column>
      <el-table-column prop="phone" label="手机号"></el-table-column>
      <el-table-column prop="email" label="邮箱"></el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
            {{ scope.row.status === 'active' ? '在职' : '离职' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="joinDate" label="入职日期"></el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
          <el-button size="small" @click="handleViewDetail(scope.row.id)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      ></el-pagination>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Delete, Search, User } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

// 定义用户类型
interface User {
  id: number;
  username: string;
  name: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

// 响应式数据
const searchKeyword = ref('');
const userList = ref<User[]>([]);
const selectedIds = ref<number[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 路由
const router = useRouter();

// 模拟获取用户列表数据
const fetchUserList = () => {
  // 模拟数据
  const mockData: User[] = [
    {
      id: 1,
      username: 'zhangsan',
      name: '张三',
      department: '技术部',
      position: '前端开发',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      status: 'active',
      joinDate: '2022-01-15'
    },
    {
      id: 2,
      username: 'lisi',
      name: '李四',
      department: '人事部',
      position: '人事专员',
      phone: '13900139000',
      email: 'lisi@example.com',
      status: 'active',
      joinDate: '2022-03-20'
    },
    {
      id: 3,
      username: 'wangwu',
      name: '王五',
      department: '财务部',
      position: '会计',
      phone: '13700137000',
      email: 'wangwu@example.com',
      status: 'inactive',
      joinDate: '2021-11-05'
    }
  ];
  
  userList.value = mockData;
  total.value = mockData.length;
};

// 生命周期钩子
onMounted(() => {
  fetchUserList();
});

// 表格选择变化
const handleSelectionChange = (selection: User[]) => {
  selectedIds.value = selection.map(item => item.id);
};

// 分页事件
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchUserList();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchUserList();
};

// 操作方法
const handleAddUser = () => {
  // 新增用户逻辑
  ElMessage.success('新增用户对话框将打开');
};

const handleEdit = (user: User) => {
  ElMessage.success(`编辑用户: ${user.name}`);
};

const handleDelete = (id: number) => {
  userList.value = userList.value.filter(item => item.id !== id);
  total.value = userList.value.length;
  ElMessage.success('用户已删除');
};

const handleBatchDelete = () => {
  userList.value = userList.value.filter(item => !selectedIds.value.includes(item.id));
  total.value = userList.value.length;
  selectedIds.value = [];
  ElMessage.success('已批量删除选中用户');
};

const handleViewDetail = (id: number) => {
  ElMessage.success(`查看用户ID: ${id} 的详情`);
};
</script>

<style scoped>
.user-list-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 导航栏样式与Dashboard保持一致 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #165DFF;
}

.main-nav ul {
  display: flex;
  list-style: none;
  gap: 30px;
  margin: 0;
  padding: 0;
}

.main-nav li {
  cursor: pointer;
  padding: 5px 0;
  position: relative;
}

.main-nav li.active {
  color: #165DFF;
}

.main-nav li.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #165DFF;
}

.main-nav a {
  text-decoration: none;
  color: inherit;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 面包屑 */
.breadcrumb {
  padding: 15px 20px;
  background-color: #fff;
  margin: 10px 20px 0;
  border-radius: 4px;
}

/* 操作区域 */
.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #fff;
  margin: 10px 20px;
  border-radius: 4px;
}

.search-input {
  width: 300px;
}

.button-group {
  display: flex;
  gap: 10px;
}

/* 表格样式 */
.user-table {
  margin: 0 20px;
  background-color: #fff;
  border-radius: 4px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  margin: 10px 20px;
  background-color: #fff;
  border-radius: 4px;
}
</style>
