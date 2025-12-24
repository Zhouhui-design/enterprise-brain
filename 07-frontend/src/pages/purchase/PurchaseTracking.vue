<template>
  <ResponsiveLayout>
    <template #header>
      <HeaderNavigation
        title="采购跟踪管理"
        :show-search="true"
        :show-notifications="true"
        @toggle-sidebar="() => {}"
      >
        <template #actions>
          <button 
            class="header-action-btn primary"
            @click="handleRefresh"
            :disabled="loading"
          >
            <i class="fas fa-sync-alt"></i>
            <span>刷新数据</span>
          </button>
          <button 
            class="header-action-btn secondary"
            @click="handleExport"
          >
            <i class="fas fa-download"></i>
            <span>导出</span>
          </button>
        </template>
      </HeaderNavigation>
    </template>

    <template #breadcrumb>
      <BreadcrumbNav 
        :items="breadcrumbItems"
        :show-home="true"
      />
    </template>

    <!-- 主要内容区域 -->
    <div class="purchase-tracking">
      <!-- 搜索和筛选区域 -->
      <div class="filter-section">
        <div class="filter-container">
          <div class="filter-row">
            <div class="filter-item">
              <label class="filter-label">订单编号</label>
              <input 
                v-model="searchForm.orderNo" 
                placeholder="请输入订单编号"
                class="filter-input"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </ResponsiveLayout>
</template>

<script>
export default {
  name: 'PurchaseTracking',
  data() {
    return {
      // 搜索表单
      searchForm: {
        orderNo: ''
      },
      breadcrumbItems: [
        { label: '首页', path: '/dashboard' },
        { label: '采购管理', path: '/purchase' },
        { label: '采购跟踪', path: '/purchase/tracking' }
      ],
      loading: false
    }
  },
  methods: {
    handleSearch() {
      console.log('搜索:', this.searchForm.orderNo)
    },
    handleRefresh() {
      console.log('刷新数据')
    },
    handleExport() {
      console.log('导出数据')
    }
  }
}
</script>

<style scoped>
.purchase-tracking {
  padding: 20px;
}

.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.filter-item {
  margin-right: 20px;
}

.filter-label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.filter-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}
</style>