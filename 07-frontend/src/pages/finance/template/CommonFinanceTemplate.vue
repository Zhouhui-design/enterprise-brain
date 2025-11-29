<template>
  <div class="common-finance-template">
    <!-- 面包屑导航 -->
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>财务管理</el-breadcrumb-item>
      <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="content-container">
      <!-- 页面头部 -->
      <div class="header">
        <h1>{{ pageTitle }}</h1>
        <div class="header-actions" v-if="headerActions && headerActions.length > 0">
          <el-button
            v-for="action in headerActions"
            :key="action.key"
            :type="action.type || 'default'"
            :disabled="action.disabled"
            :icon="action.icon"
            @click="action.handler"
          >
            {{ action.text }}
          </el-button>
        </div>
      </div>

      <!-- 搜索筛选区域 -->
      <el-card v-if="showSearch" class="search-card">
        <el-form :model="searchForm" :inline="true" label-width="120px">
          <template v-for="field in searchFields" :key="field.key">
            <!-- 输入框 -->
            <el-form-item v-if="field.type === 'input'" :label="field.label">
              <el-input
                v-model="searchForm[field.key]"
                :placeholder="field.placeholder || `请输入${field.label}`"
                :clearable="field.clearable !== false"
              />
            </el-form-item>
            
            <!-- 下拉选择器 -->
            <el-form-item v-else-if="field.type === 'select'" :label="field.label">
              <el-select
                v-model="searchForm[field.key]"
                :placeholder="field.placeholder || `请选择${field.label}`"
                :clearable="field.clearable !== false"
                :multiple="field.multiple"
                :filterable="field.filterable"
              >
                <el-option
                  v-for="option in field.options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            
            <!-- 日期选择器 -->
            <el-form-item v-else-if="field.type === 'date'" :label="field.label">
              <el-date-picker
                v-model="searchForm[field.key]"
                :type="field.dateType || 'date'"
                :range-separator="field.rangeSeparator || '至'"
                :start-placeholder="field.startPlaceholder || '开始日期'"
                :end-placeholder="field.endPlaceholder || '结束日期'"
                :placeholder="field.placeholder || '请选择日期'"
              />
            </el-form-item>
            
            <!-- 数字输入框 -->
            <el-form-item v-else-if="field.type === 'number'" :label="field.label">
              <el-input-number
                v-model="searchForm[field.key]"
                :min="field.min"
                :max="field.max"
                :step="field.step || 1"
                :placeholder="field.placeholder || `请输入${field.label}`"
              />
            </el-form-item>
            
            <!-- 开关 -->
            <el-form-item v-else-if="field.type === 'switch'" :label="field.label">
              <el-switch v-model="searchForm[field.key]" />
            </el-form-item>
          </template>
          
          <!-- 搜索和重置按钮 -->
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 统计卡片区域 -->
      <div v-if="showStatistics && statisticsCards && statisticsCards.length > 0" class="statistics-container">
        <el-row :gutter="20">
          <el-col
            v-for="(card, index) in statisticsCards"
            :key="index"
            :span="card.span || 6"
          >
            <el-card class="statistic-card">
              <div class="statistic-content">
                <div class="statistic-label">{{ card.label }}</div>
                <div :class="['statistic-value', card.type || 'primary']">{{ card.value }}</div>
                <div class="statistic-desc" v-if="card.description">{{ card.description }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 表格数据展示 -->
      <el-card v-if="showTable" class="table-card">
        <template v-if="tableHeaderActions && tableHeaderActions.length > 0" #header>
          <div class="table-header">
            <span v-if="tableTitle">{{ tableTitle }}</span>
            <div class="table-actions">
              <el-button
                v-for="action in tableHeaderActions"
                :key="action.key"
                :type="action.type || 'default'"
                :size="action.size || 'small'"
                :disabled="action.disabled"
                :icon="action.icon"
                @click="action.handler"
              >
                {{ action.text }}
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table
          v-loading="loading"
          :data="tableData"
          style="width: 100%"
          border
          @selection-change="handleSelectionChange"
          :default-expand-all="defaultExpandAll"
        >
          <!-- 选择列 -->
          <el-table-column v-if="showSelection" type="selection" width="55" />
          
          <!-- 展开列 -->
          <el-table-column v-if="expandable" type="expand">
            <template #default="{ row }">
              <slot name="expand-content" :row="row"></slot>
            </template>
          </el-table-column>
          
          <!-- 自定义列 -->
          <template v-for="column in tableColumns" :key="column.prop">
            <!-- 普通列 -->
            <el-table-column
              v-if="!column.type"
              :prop="column.prop"
              :label="column.label"
              :width="column.width"
              :min-width="column.minWidth"
              :align="column.align"
              :sortable="column.sortable"
              :show-overflow-tooltip="column.showOverflowTooltip !== false"
            >
              <template v-if="column.template" #default="{ row }">
                <slot :name="column.template" :row="row"></slot>
              </template>
            </el-table-column>
            
            <!-- 序号列 -->
            <el-table-column
              v-else-if="column.type === 'index'"
              type="index"
              :label="column.label || '序号'"
              :width="column.width || 80"
              :align="column.align || 'center'"
            />
            
            <!-- 操作列 -->
            <el-table-column
              v-else-if="column.type === 'action'"
              :label="column.label || '操作'"
              :width="column.width || 180"
              :align="column.align || 'center'"
              :fixed="column.fixed"
            >
              <template #default="{ row }">
                <el-button
                  v-for="action in column.actions"
                  :key="action.key"
                  :type="action.type || 'default'"
                  :size="action.size || 'small'"
                  :disabled="action.disabled"
                  :icon="action.icon"
                  @click="action.handler(row)"
                  :style="{ marginRight: '5px' }"
                >
                  {{ action.text }}
                </el-button>
              </template>
            </el-table-column>
          </template>
        </el-table>

        <!-- 分页 -->
        <div v-if="showPagination" class="pagination-container">
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

      <!-- 图表区域 -->
      <div v-if="showChart" class="chart-container">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span v-if="chartTitle">{{ chartTitle }}</span>
              <div class="chart-actions" v-if="chartActions && chartActions.length > 0">
                <el-button
                  v-for="action in chartActions"
                  :key="action.key"
                  :type="action.type || 'default'"
                  :size="action.size || 'small'"
                  @click="action.handler"
                >
                  {{ action.text }}
                </el-button>
              </div>
            </div>
          </template>
          <div ref="chartContainer" style="width: 100%; height: 400px;"></div>
        </el-card>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && showEmptyState && (!tableData || tableData.length === 0)" class="empty-state">
        <el-empty :description="emptyStateText" />
      </div>

      <!-- 通用对话框 -->
      <el-dialog
        v-for="dialog in dialogs"
        :key="dialog.key"
        v-model="dialog.visible"
        :title="dialog.title"
        :width="dialog.width || '500px'"
        :close-on-click-modal="dialog.closeOnClickModal !== false"
        :close-on-press-escape="dialog.closeOnPressEscape !== false"
        @close="dialog.onClose"
      >
        <slot :name="`dialog-${dialog.key}`" :dialog="dialog"></slot>
        <template #footer>
          <span class="dialog-footer">
            <el-button v-if="!dialog.hideCancel" @click="dialog.visible = false">取消</el-button>
            <el-button
              v-for="button in dialog.buttons"
              :key="button.key"
              :type="button.type || 'primary'"
              :disabled="button.disabled"
              @click="button.handler"
            >
              {{ button.text }}
            </el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'CommonFinanceTemplate',
  props: {
    // 页面配置
    pageTitle: {
      type: String,
      default: '财务页面'
    },
    
    // 显示配置
    showSearch: {
      type: Boolean,
      default: true
    },
    showTable: {
      type: Boolean,
      default: true
    },
    showPagination: {
      type: Boolean,
      default: true
    },
    showChart: {
      type: Boolean,
      default: false
    },
    showStatistics: {
      type: Boolean,
      default: false
    },
    showSelection: {
      type: Boolean,
      default: false
    },
    showEmptyState: {
      type: Boolean,
      default: true
    },
    emptyStateText: {
      type: String,
      default: '暂无数据'
    },
    defaultExpandAll: {
      type: Boolean,
      default: false
    },
    expandable: {
      type: Boolean,
      default: false
    },
    
    // 表格配置
    tableTitle: {
      type: String,
      default: ''
    },
    tableData: {
      type: Array,
      default: () => []
    },
    
    // 图表配置
    chartTitle: {
      type: String,
      default: ''
    }
  },
  setup(props, { emit }) {
    // 状态管理
    const loading = ref(false);
    const chartContainer = ref(null);
    
    // 搜索表单
    const searchForm = reactive({
      // 由父组件通过 searchFields 配置
    });
    
    // 搜索字段配置
    const searchFields = ref([]);
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });
    
    // 统计卡片
    const statisticsCards = ref([]);
    
    // 表格列配置
    const tableColumns = ref([]);
    
    // 选中的行
    const selectedRows = ref([]);
    
    // 对话框配置
    const dialogs = ref([]);
    
    // 按钮组配置
    const headerActions = ref([]);
    const tableHeaderActions = ref([]);
    const chartActions = ref([]);

    // 处理选择变化
    const handleSelectionChange = (val) => {
      selectedRows.value = val;
      emit('selection-change', val);
    };

    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      emit('page-change', { ...pagination });
    };

    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
      emit('page-change', { ...pagination });
    };

    // 搜索
    const handleSearch = () => {
      pagination.currentPage = 1;
      emit('search', { ...searchForm, ...pagination });
    };

    // 重置搜索
    const handleReset = () => {
      searchFields.value.forEach(field => {
        if (field.type === 'switch') {
          searchForm[field.key] = field.defaultValue || false;
        } else if (field.multiple) {
          searchForm[field.key] = [];
        } else {
          searchForm[field.key] = field.defaultValue || '';
        }
      });
      pagination.currentPage = 1;
      emit('reset', { ...searchForm, ...pagination });
    };

    // 初始化搜索表单
    const initSearchForm = (fields) => {
      searchFields.value = fields;
      fields.forEach(field => {
        if (field.type === 'switch') {
          searchForm[field.key] = field.defaultValue || false;
        } else if (field.multiple) {
          searchForm[field.key] = field.defaultValue || [];
        } else {
          searchForm[field.key] = field.defaultValue || '';
        }
      });
    };

    // 设置统计卡片
    const setStatisticsCards = (cards) => {
      statisticsCards.value = cards;
    };

    // 设置表格列
    const setTableColumns = (columns) => {
      tableColumns.value = columns;
    };

    // 设置对话框
    const setDialogs = (dialogConfig) => {
      dialogs.value = dialogConfig;
    };

    // 设置头部操作按钮
    const setHeaderActions = (actions) => {
      headerActions.value = actions;
    };

    // 设置表格头部操作按钮
    const setTableHeaderActions = (actions) => {
      tableHeaderActions.value = actions;
    };

    // 设置图表操作按钮
    const setChartActions = (actions) => {
      chartActions.value = actions;
    };

    // 更新分页信息
    const updatePagination = (total, currentPage = 1, pageSize = 20) => {
      pagination.total = total;
      pagination.currentPage = currentPage;
      pagination.pageSize = pageSize;
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
      return `${formatDate(date)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    };

    // 格式化货币
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00 元';
      return `${parseFloat(value).toFixed(2)} 元`;
    };

    // 显示成功消息
    const showSuccessMessage = (message) => {
      ElMessage.success(message || '操作成功');
    };

    // 显示错误消息
    const showErrorMessage = (message) => {
      ElMessage.error(message || '操作失败');
    };

    // 显示警告消息
    const showWarningMessage = (message) => {
      ElMessage.warning(message);
    };

    // 生命周期
    onMounted(() => {
      emit('mounted');
    });

    onUnmounted(() => {
      emit('unmounted');
    });

    return {
      // 状态
      loading,
      chartContainer,
      searchForm,
      searchFields,
      pagination,
      statisticsCards,
      tableColumns,
      selectedRows,
      dialogs,
      headerActions,
      tableHeaderActions,
      chartActions,
      
      // 方法
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      handleSearch,
      handleReset,
      initSearchForm,
      setStatisticsCards,
      setTableColumns,
      setDialogs,
      setHeaderActions,
      setTableHeaderActions,
      setChartActions,
      updatePagination,
      formatDate,
      formatDateTime,
      formatCurrency,
      showSuccessMessage,
      showErrorMessage,
      showWarningMessage
    };
  }
};
</script>

<style scoped>
.common-finance-template {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.breadcrumb {
  margin-bottom: 20px;
}

.content-container {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.header h1 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 4px;
}

.statistics-container {
  margin-bottom: 20px;
}

.statistic-card {
  border-radius: 4px;
  overflow: hidden;
}

.statistic-content {
  text-align: center;
  padding: 20px 0;
}

.statistic-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.statistic-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.statistic-value.primary {
  color: #409eff;
}

.statistic-value.success {
  color: #67c23a;
}

.statistic-value.warning {
  color: #e6a23c;
}

.statistic-value.danger {
  color: #f56c6c;
}

.statistic-value.info {
  color: #909399;
}

.statistic-desc {
  color: #909399;
  font-size: 12px;
}

.table-card {
  margin-bottom: 20px;
  border-radius: 4px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
  padding: 20px 0 0 0;
  border-top: 1px solid #ebeef5;
}

.chart-container {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 4px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-actions {
  display: flex;
  gap: 10px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .common-finance-template {
    padding: 10px;
  }
  
  .content-container {
    padding: 15px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .table-header,
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .table-actions,
  .chart-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>