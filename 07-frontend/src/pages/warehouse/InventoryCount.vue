<template>
  <div class="inventory-count-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>库存盘点管理</h2>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" icon="el-icon-plus" @click="showCreateForm = true">
        新建盘点单
      </el-button>
      <el-button type="info" icon="el-icon-printer" @click="handlePrint">
        打印
      </el-button>
      <el-button type="info" icon="el-icon-download" @click="handleExport">
        导出
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-area">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="盘点单号">
          <el-input v-model="searchForm.countCode" placeholder="请输入盘点单号" clearable></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待盘点" value="pending"></el-option>
            <el-option label="盘点中" value="counting"></el-option>
            <el-option label="待审核" value="reviewing"></el-option>
            <el-option label="已完成" value="completed"></el-option>
            <el-option label="已取消" value="cancelled"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="searchForm.warehouseId" placeholder="请选择仓库" clearable>
            <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="盘点日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 盘点单列表 -->
    <div class="table-area">
      <el-table :data="countListData" style="width: 100%" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="countCode" label="盘点单号" width="180"></el-table-column>
        <el-table-column prop="warehouseName" label="盘点仓库" width="150"></el-table-column>
        <el-table-column prop="countDate" label="盘点日期" width="120"></el-table-column>
        <el-table-column prop="countType" label="盘点类型" width="100">
          <template slot-scope="scope">
            <el-tag :type="getCountTypeTag(scope.row.countType)">{{ getCountTypeText(scope.row.countType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalItems" label="总项数" width="80"></el-table-column>
        <el-table-column prop="diffItems" label="差异项数" width="80">
          <template slot-scope="scope">
            <span v-if="scope.row.diffItems > 0" style="color: #f56c6c">{{ scope.row.diffItems }}</span>
            <span v-else>{{ scope.row.diffItems }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="制单人" width="100"></el-table-column>
        <el-table-column prop="createdTime" label="制单时间" width="180"></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button v-if="['pending'].includes(scope.row.status)" type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button v-if="['pending'].includes(scope.row.status)" type="text" size="small" @click="handleCancel(scope.row)" style="color: #f56c6c">取消</el-button>
            <el-button v-if="['pending'].includes(scope.row.status)" type="text" size="small" @click="handleStartCount(scope.row)" style="color: #409eff">开始盘点</el-button>
            <el-button v-if="['counting'].includes(scope.row.status)" type="text" size="small" @click="handleInputCount(scope.row)" style="color: #67c23a">录入盘点</el-button>
            <el-button v-if="['counting'].includes(scope.row.status)" type="text" size="small" @click="handleSubmitReview(scope.row)" style="color: #409eff">提交审核</el-button>
            <el-button v-if="['reviewing'].includes(scope.row.status)" type="text" size="small" @click="handleApprove(scope.row)" style="color: #67c23a">审核</el-button>
            <el-button type="text" size="small" @click="handleView(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        ></el-pagination>
      </div>
    </div>

    <!-- 创建/编辑盘点单对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="showCreateForm"
      width="60%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="countForm" ref="countFormRef" :rules="formRules" label-width="120px">
        <el-form-item label="盘点单号" prop="countCode">
          <el-input v-model="countForm.countCode" :disabled="true" placeholder="系统自动生成"></el-input>
        </el-form-item>
        <el-form-item label="盘点日期" prop="countDate">
          <el-date-picker v-model="countForm.countDate" type="date" placeholder="选择日期" style="width: 100%" value-format="yyyy-MM-dd"></el-date-picker>
        </el-form-item>
        <el-form-item label="盘点仓库" prop="warehouseId">
          <el-select v-model="countForm.warehouseId" placeholder="请选择盘点仓库" @change="onWarehouseChange">
            <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="盘点类型" prop="countType">
          <el-radio-group v-model="countForm.countType">
            <el-radio value="full">全盘</el-radio>
            <el-radio value="partial">抽盘</el-radio>
            <el-radio value="cycle">循环盘</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="countForm.countType !== 'full'" label="盘点范围" prop="countScope">
          <el-checkbox-group v-model="countForm.countScope">
            <el-checkbox v-for="location in availableLocations" :key="location.code" :label="location.code">{{ location.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="盘点人" prop="counters">
          <el-select v-model="countForm.counters" multiple placeholder="请选择盘点人员">
            <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="countForm.remark" type="textarea" rows="3" placeholder="请输入备注信息"></el-input>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveCountForm">保存</el-button>
      </div>
    </el-dialog>

    <!-- 录入盘点对话框 -->
    <el-dialog
      :title="`录入盘点 - ${currentCount.countCode}`"
      :visible.sync="showInputCountDialog"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :fullscreen="true"
    >
      <div class="input-count-content">
        <!-- 工具栏 -->
        <div class="input-toolbar">
          <el-form :inline="true" :model="itemSearchForm" class="search-form">
            <el-form-item label="产品编码/名称">
              <el-input v-model="itemSearchForm.keyword" placeholder="请输入产品编码或名称" clearable></el-input>
            </el-form-item>
            <el-form-item label="批次号">
              <el-input v-model="itemSearchForm.batchNo" placeholder="请输入批次号" clearable></el-input>
            </el-form-item>
            <el-form-item label="盘点状态">
              <el-select v-model="itemSearchForm.countStatus" placeholder="请选择盘点状态" clearable>
                <el-option label="未盘点" value="unchecked"></el-option>
                <el-option label="已盘点" value="checked"></el-option>
                <el-option label="有差异" value="diff"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="searchCountItems">查询</el-button>
              <el-button @click="resetItemSearch">重置</el-button>
              <el-button type="info" @click="autoFillCount">自动填充</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 盘点明细表格 -->
        <el-table :data="filteredCountItems" style="width: 100%" stripe @selection-change="handleItemSelectionChange">
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" width="120"></el-table-column>
          <el-table-column prop="productName" label="产品名称" width="180"></el-table-column>
          <el-table-column prop="specification" label="规格" width="150"></el-table-column>
          <el-table-column prop="unit" label="单位" width="80"></el-table-column>
          <el-table-column prop="batchNo" label="批次号" width="150"></el-table-column>
          <el-table-column prop="expiryDate" label="有效期" width="120"></el-table-column>
          <el-table-column prop="location" label="存放位置" width="100"></el-table-column>
          <el-table-column prop="systemQuantity" label="系统数量" width="100"></el-table-column>
          <el-table-column prop="countQuantity" label="盘点数量" width="120">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.countQuantity"
                :min="0"
                @change="onCountQuantityChange(scope.row)"
              ></el-input-number>
            </template>
          </el-table-column>
          <el-table-column prop="difference" label="差异数量" width="100">
            <template slot-scope="scope">
              <span :style="getDiffStyle(scope.row.difference)">{{ scope.row.difference || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="countStatus" label="盘点状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="getCountStatusType(scope.row.countStatus)">{{ getCountStatusText(scope.row.countStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="countBy" label="盘点人" width="100"></el-table-column>
          <el-table-column prop="countTime" label="盘点时间" width="180"></el-table-column>
          <el-table-column label="操作" width="100">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="showCountDetail(scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 批量操作 -->
        <div v-if="selectedCountItems.length > 0" class="batch-operations">
          <el-button type="primary" size="small" @click="batchFillCount">批量填充</el-button>
          <el-button type="info" size="small" @click="batchClearCount">批量清空</el-button>
        </div>

        <!-- 统计信息 -->
        <div class="count-summary">
          <span>总项数: {{ currentCountItems.length }}</span>
          <span>已盘点: {{ checkedCount }}</span>
          <span>未盘点: {{ uncheckedCount }}</span>
          <span>差异项: <span style="color: #f56c6c">{{ diffCount }}</span></span>
          <span>差异率: <span :style="getDiffRateStyle()">{{ diffRate }}%</span></span>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="showInputCountDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCountItems">保存</el-button>
      </div>
    </el-dialog>

    <!-- 盘点详情对话框 -->
    <el-dialog
      title="盘点详情"
      :visible.sync="showCountDetailDialog"
      width="50%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="count-detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="产品编码">{{ currentCountItem.productCode }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ currentCountItem.productName }}</el-descriptions-item>
          <el-descriptions-item label="规格">{{ currentCountItem.specification }}</el-descriptions-item>
          <el-descriptions-item label="单位">{{ currentCountItem.unit }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ currentCountItem.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="有效期">{{ currentCountItem.expiryDate }}</el-descriptions-item>
          <el-descriptions-item label="存放位置">{{ currentCountItem.location }}</el-descriptions-item>
          <el-descriptions-item label="系统数量">{{ currentCountItem.systemQuantity }}</el-descriptions-item>
          <el-descriptions-item label="盘点数量">
            <el-input-number
              v-model="currentCountItem.countQuantity"
              :min="0"
              @change="onCountQuantityChange(currentCountItem)"
              style="width: 150px"
            ></el-input-number>
          </el-descriptions-item>
          <el-descriptions-item label="差异数量"><span :style="getDiffStyle(currentCountItem.difference)">{{ currentCountItem.difference || 0 }}</span></el-descriptions-item>
          <el-descriptions-item label="盘点说明">
            <el-input v-model="currentCountItem.countRemark" type="textarea" rows="3" placeholder="请输入盘点说明"></el-input>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="showCountDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="saveCountItemDetail">保存</el-button>
      </div>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog
      :title="confirmDialog.title"
      :visible.sync="confirmDialog.visible"
      width="40%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="confirm-content">
        <p>{{ confirmDialog.content }}</p>
        <el-form v-if="confirmDialog.showReason" :model="confirmDialog" label-width="80px">
          <el-form-item label="原因">
            <el-input v-model="confirmDialog.reason" type="textarea" rows="3" placeholder="请输入原因"></el-input>
          </el-form-item>
        </el-form>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="confirmDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmAction">{{ confirmDialog.confirmText }}</el-button>
      </div>
    </el-dialog>

    <!-- 查看盘点单对话框 -->
    <el-dialog
      title="盘点单详情"
      :visible.sync="showDetailDialog"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="盘点单号">{{ currentCount.countCode }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="getStatusType(currentCount.status)">{{ getStatusText(currentCount.status) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="盘点日期">{{ currentCount.countDate }}</el-descriptions-item>
          <el-descriptions-item label="盘点仓库">{{ currentCount.warehouseName }}</el-descriptions-item>
          <el-descriptions-item label="盘点类型">{{ getCountTypeText(currentCount.countType) }}</el-descriptions-item>
          <el-descriptions-item label="盘点范围">{{ currentCount.countScope?.join(', ') || '全部' }}</el-descriptions-item>
          <el-descriptions-item label="盘点人员">{{ currentCount.counters?.join(', ') || '-' }}</el-descriptions-item>
          <el-descriptions-item label="制单人">{{ currentCount.createdBy }}</el-descriptions-item>
          <el-descriptions-item label="制单时间">{{ currentCount.createdTime }}</el-descriptions-item>
          <el-descriptions-item label="审核人" :span="1">{{ currentCount.approvedBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ currentCount.approvedTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentCount.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 统计信息 -->
        <div class="detail-stats">
          <el-card shadow="never">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">总项数</div>
                <div class="stat-value">{{ currentCount.totalItems || 0 }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">已盘点</div>
                <div class="stat-value">{{ currentCount.checkedItems || 0 }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">差异项数</div>
                <div class="stat-value diff">{{ currentCount.diffItems || 0 }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">盘盈数量</div>
                <div class="stat-value profit">{{ currentCount.profitQuantity || 0 }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">盘亏数量</div>
                <div class="stat-value loss">{{ currentCount.lossQuantity || 0 }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">差异率</div>
                <div class="stat-value">{{ currentCount.diffRate || 0 }}%</div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 盘点明细 -->
        <div class="detail-section">
          <h3>盘点明细</h3>
          <el-table :data="currentCount.items || []" style="width: 100%" stripe>
            <el-table-column prop="productCode" label="产品编码" width="120"></el-table-column>
            <el-table-column prop="productName" label="产品名称" width="180"></el-table-column>
            <el-table-column prop="specification" label="规格" width="150"></el-table-column>
            <el-table-column prop="unit" label="单位" width="80"></el-table-column>
            <el-table-column prop="batchNo" label="批次号" width="150"></el-table-column>
            <el-table-column prop="expiryDate" label="有效期" width="120"></el-table-column>
            <el-table-column prop="location" label="存放位置" width="100"></el-table-column>
            <el-table-column prop="systemQuantity" label="系统数量" width="100"></el-table-column>
            <el-table-column prop="countQuantity" label="盘点数量" width="100"></el-table-column>
            <el-table-column prop="difference" label="差异数量" width="100">
              <template slot-scope="scope">
                <span :style="getDiffStyle(scope.row.difference)">{{ scope.row.difference || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="countStatus" label="盘点状态" width="100">
              <template slot-scope="scope">
                <el-tag :type="getCountStatusType(scope.row.countStatus)">{{ getCountStatusText(scope.row.countStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="countBy" label="盘点人" width="100"></el-table-column>
            <el-table-column prop="countTime" label="盘点时间" width="180"></el-table-column>
          </el-table>
        </div>

        <!-- 差异汇总 -->
        <div v-if="currentCount.diffItems > 0" class="detail-section">
          <h3>差异汇总</h3>
          <el-table :data="diffSummary" style="width: 100%" stripe>
            <el-table-column prop="productCode" label="产品编码" width="120"></el-table-column>
            <el-table-column prop="productName" label="产品名称" width="180"></el-table-column>
            <el-table-column prop="specification" label="规格" width="150"></el-table-column>
            <el-table-column prop="unit" label="单位" width="80"></el-table-column>
            <el-table-column prop="totalSystemQuantity" label="系统总数量" width="120"></el-table-column>
            <el-table-column prop="totalCountQuantity" label="盘点总数量" width="120"></el-table-column>
            <el-table-column prop="totalDifference" label="差异总数量" width="120">
              <template slot-scope="scope">
                <span :style="getDiffStyle(scope.row.totalDifference)">{{ scope.row.totalDifference }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 批量填充对话框 -->
    <el-dialog
      title="批量填充盘点数量"
      :visible.sync="showBatchFillDialog"
      width="50%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="batch-fill-content">
        <el-form :model="batchFillForm" ref="batchFillFormRef" :rules="batchFillRules" label-width="120px">
          <el-form-item label="填充方式" prop="fillType">
            <el-radio-group v-model="batchFillForm.fillType">
              <el-radio value="system">使用系统数量</el-radio>
              <el-radio value="custom">指定数量</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="batchFillForm.fillType === 'custom'" label="指定数量" prop="customQuantity">
            <el-input-number v-model="batchFillForm.customQuantity" :min="0" placeholder="请输入数量"></el-input-number>
          </el-form-item>
          <el-form-item label="盘点人" prop="countBy">
            <el-select v-model="batchFillForm.countBy" placeholder="请选择盘点人">
              <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.name"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="showBatchFillDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchFill">确认填充</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'InventoryCount',
  data() {
    return {
      // 搜索表单
      searchForm: {
        countCode: '',
        status: '',
        warehouseId: '',
        dateRange: []
      },
      // 分页信息
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      // 盘点单列表
      countList: [],
      // 仓库列表
      warehouses: [
        { id: 1, name: '主仓库' },
        { id: 2, name: '原料仓库' },
        { id: 3, name: '成品仓库' },
        { id: 4, name: '备件仓库' }
      ],
      // 用户列表
      users: [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
        { id: 3, name: '王五' },
        { id: 4, name: '赵六' }
      ],
      // 可用库位列表
      availableLocations: [],
      // 选中的盘点单
      selectedRows: [],
      // 对话框显示状态
      showCreateForm: false,
      showInputCountDialog: false,
      showCountDetailDialog: false,
      confirmDialog: {
        visible: false,
        title: '',
        content: '',
        confirmText: '',
        showReason: false,
        reason: '',
        callback: null
      },
      showDetailDialog: false,
      showBatchFillDialog: false,
      // 当前编辑的盘点单
      currentCount: {},
      // 盘点单表单
      countForm: {
        id: '',
        countCode: '',
        countDate: '',
        warehouseId: '',
        countType: 'full',
        countScope: [],
        counters: [],
        remark: ''
      },
      // 当前盘点项
      currentCountItem: {},
      // 当前盘点项列表
      currentCountItems: [],
      // 选中的盘点项
      selectedCountItems: [],
      // 盘点项搜索表单
      itemSearchForm: {
        keyword: '',
        batchNo: '',
        countStatus: ''
      },
      // 批量填充表单
      batchFillForm: {
        fillType: 'system',
        customQuantity: 0,
        countBy: ''
      },
      // 表单验证规则
      formRules: {
        countDate: [{ required: true, message: '请选择盘点日期', trigger: 'change' }],
        warehouseId: [{ required: true, message: '请选择盘点仓库', trigger: 'change' }],
        countType: [{ required: true, message: '请选择盘点类型', trigger: 'change' }],
        counters: [{ required: true, message: '请选择盘点人员', trigger: 'change' }]
      },
      batchFillRules: {
        fillType: [{ required: true, message: '请选择填充方式', trigger: 'change' }],
        customQuantity: [{ required: true, message: '请输入指定数量', trigger: 'change' }],
        countBy: [{ required: true, message: '请选择盘点人', trigger: 'change' }]
      }
    }
  },
  computed: {
    // 盘点单列表数据
    countListData() {
      return this.countList
    },
    // 对话框标题
    dialogTitle() {
      return this.countForm.id ? '编辑盘点单' : '新建盘点单'
    },
    // 过滤后的盘点项
    filteredCountItems() {
      let items = [...this.currentCountItems]
      
      // 按关键词过滤
      if (this.itemSearchForm.keyword) {
        const keyword = this.itemSearchForm.keyword.toLowerCase()
        items = items.filter(item => 
          item.productCode.toLowerCase().includes(keyword) || 
          item.productName.toLowerCase().includes(keyword)
        )
      }
      
      // 按批次号过滤
      if (this.itemSearchForm.batchNo) {
        items = items.filter(item => item.batchNo === this.itemSearchForm.batchNo)
      }
      
      // 按盘点状态过滤
      if (this.itemSearchForm.countStatus) {
        items = items.filter(item => item.countStatus === this.itemSearchForm.countStatus)
      }
      
      return items
    },
    // 已盘点数量
    checkedCount() {
      return this.currentCountItems.filter(item => item.countStatus !== 'unchecked').length
    },
    // 未盘点数量
    uncheckedCount() {
      return this.currentCountItems.filter(item => item.countStatus === 'unchecked').length
    },
    // 差异数量
    diffCount() {
      return this.currentCountItems.filter(item => item.countStatus === 'diff').length
    },
    // 差异率
    diffRate() {
      if (this.currentCountItems.length === 0) return 0
      return ((this.diffCount / this.currentCountItems.length) * 100).toFixed(2)
    },
    // 差异汇总
    diffSummary() {
      const summary = {}
      (this.currentCount.items || []).forEach(item => {
        if (item.difference !== 0) {
          const key = `${item.productCode}-${item.specification}`
          if (!summary[key]) {
            summary[key] = {
              productCode: item.productCode,
              productName: item.productName,
              specification: item.specification,
              unit: item.unit,
              totalSystemQuantity: 0,
              totalCountQuantity: 0,
              totalDifference: 0
            }
          }
          summary[key].totalSystemQuantity += item.systemQuantity
          summary[key].totalCountQuantity += item.countQuantity || 0
          summary[key].totalDifference += item.difference || 0
        }
      })
      return Object.values(summary)
    }
  },
  watch: {
    // 监听盘点单状态变化
    showCreateForm(val) {
      if (val) {
        this.resetCountForm()
      }
    },
    'currentCountItems': {
      deep: true,
      handler() {
        this.updateCountStatus()
      }
    }
  },
  created() {
    this.initData()
  },
  methods: {
    // 初始化数据
    initData() {
      this.loadCountList()
      this.loadLocations()
    },
    // 加载盘点单列表
    loadCountList() {
      // 模拟数据
      this.countList = [
        {
          id: 1,
          countCode: 'PD20240101001',
          countDate: '2024-01-01',
          warehouseId: 1,
          warehouseName: '主仓库',
          countType: 'full',
          countScope: [],
          counters: ['张三', '李四'],
          remark: '月度大盘点',
          totalItems: 50,
          checkedItems: 30,
          diffItems: 5,
          profitQuantity: 10,
          lossQuantity: 15,
          diffRate: 10,
          status: 'counting',
          createdBy: '张三',
          createdTime: '2024-01-01 08:00:00',
          items: [
            {
              productCode: 'P001',
              productName: 'A材料',
              specification: '规格A',
              unit: 'kg',
              batchNo: 'B20240101',
              expiryDate: '2025-01-01',
              location: 'A1-1',
              systemQuantity: 100,
              countQuantity: 95,
              difference: -5,
              countStatus: 'diff',
              countBy: '张三',
              countTime: '2024-01-01 09:00:00'
            },
            {
              productCode: 'P002',
              productName: 'B材料',
              specification: '规格B',
              unit: 'kg',
              batchNo: 'B20240102',
              expiryDate: '2025-02-01',
              location: 'A1-2',
              systemQuantity: 200,
              countQuantity: 200,
              difference: 0,
              countStatus: 'checked',
              countBy: '李四',
              countTime: '2024-01-01 09:30:00'
            }
          ]
        },
        {
          id: 2,
          countCode: 'PD20240102001',
          countDate: '2024-01-02',
          warehouseId: 2,
          warehouseName: '原料仓库',
          countType: 'partial',
          countScope: ['B1-1', 'B1-2'],
          counters: ['王五'],
          remark: '原料抽盘',
          totalItems: 30,
          checkedItems: 30,
          diffItems: 2,
          profitQuantity: 5,
          lossQuantity: 3,
          diffRate: 6.67,
          status: 'reviewing',
          createdBy: '李四',
          createdTime: '2024-01-02 09:00:00',
          items: []
        }
      ]
      this.pagination.total = this.countList.length
    },
    // 加载库位信息
    loadLocations() {
      this.availableLocations = [
        { code: 'A1-1', name: 'A区1排1号' },
        { code: 'A1-2', name: 'A区1排2号' },
        { code: 'A1-3', name: 'A区1排3号' },
        { code: 'A2-1', name: 'A区2排1号' },
        { code: 'A2-2', name: 'A区2排2号' }
      ]
    },
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        pending: '待盘点',
        counting: '盘点中',
        reviewing: '待审核',
        completed: '已完成',
        cancelled: '已取消'
      }
      return statusMap[status] || status
    },
    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        pending: 'warning',
        counting: 'info',
        reviewing: 'primary',
        completed: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || 'default'
    },
    // 获取盘点类型文本
    getCountTypeText(type) {
      const typeMap = {
        full: '全盘',
        partial: '抽盘',
        cycle: '循环盘'
      }
      return typeMap[type] || type
    },
    // 获取盘点类型标签
    getCountTypeTag(type) {
      const tagMap = {
        full: 'warning',
        partial: 'info',
        cycle: 'primary'
      }
      return tagMap[type] || 'default'
    },
    // 获取盘点状态文本
    getCountStatusText(status) {
      const statusMap = {
        unchecked: '未盘点',
        checked: '已盘点',
        diff: '有差异'
      }
      return statusMap[status] || status
    },
    // 获取盘点状态类型
    getCountStatusType(status) {
      const typeMap = {
        unchecked: 'default',
        checked: 'success',
        diff: 'danger'
      }
      return typeMap[status] || 'default'
    },
    // 获取差异样式
    getDiffStyle(diff) {
      if (diff > 0) return { color: '#67c23a' }
      if (diff < 0) return { color: '#f56c6c' }
      return {}
    },
    // 获取差异率样式
    getDiffRateStyle() {
      const rate = parseFloat(this.diffRate)
      if (rate > 10) return { color: '#f56c6c' }
      if (rate > 5) return { color: '#e6a23c' }
      return { color: '#67c23a' }
    },
    // 重置盘点单表单
    resetCountForm() {
      this.countForm = {
        id: '',
        countCode: this.generateCountCode(),
        countDate: this.formatDate(new Date()),
        warehouseId: '',
        countType: 'full',
        countScope: [],
        counters: [],
        remark: ''
      }
    },
    // 生成盘点单号
    generateCountCode() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
      return `PD${year}${month}${day}${random}`
    },
    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    // 查询
    handleSearch() {
      // 模拟搜索
      this.pagination.currentPage = 1
      this.loadCountList()
    },
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        countCode: '',
        status: '',
        warehouseId: '',
        dateRange: []
      }
      this.handleSearch()
    },
    // 分页大小变化
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.loadCountList()
    },
    // 当前页码变化
    handleCurrentChange(current) {
      this.pagination.currentPage = current
      this.loadCountList()
    },
    // 选择行变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    // 选择盘点项变化
    handleItemSelectionChange(selection) {
      this.selectedCountItems = selection
    },
    // 关闭对话框
    closeDialog() {
      this.showCreateForm = false
      this.showInputCountDialog = false
      this.showCountDetailDialog = false
      this.showBatchFillDialog = false
    },
    // 编辑盘点单
    handleEdit(row) {
      this.currentCount = { ...row }
      this.countForm = {
        id: row.id,
        countCode: row.countCode,
        countDate: row.countDate,
        warehouseId: row.warehouseId,
        countType: row.countType,
        countScope: [...(row.countScope || [])],
        counters: [...(row.counters || [])],
        remark: row.remark
      }
      this.onWarehouseChange(row.warehouseId)
      this.showCreateForm = true
    },
    // 查看盘点单
    handleView(row) {
      this.currentCount = { ...row }
      this.showDetailDialog = true
    },
    // 取消盘点单
    handleCancel(row) {
      this.confirmDialog = {
        visible: true,
        title: '取消盘点单',
        content: `确定要取消盘点单「${row.countCode}」吗？`,
        confirmText: '确定取消',
        showReason: true,
        reason: '',
        callback: () => {
          this.doCancel(row)
        }
      }
    },
    // 开始盘点
    handleStartCount(row) {
      this.confirmDialog = {
        visible: true,
        title: '开始盘点',
        content: `确定要开始盘点单「${row.countCode}」吗？`,
        confirmText: '确定开始',
        showReason: false,
        reason: '',
        callback: () => {
          this.doStartCount(row)
        }
      }
    },
    // 录入盘点
    handleInputCount(row) {
      this.currentCount = { ...row }
      this.loadCountItems(row.id)
      this.showInputCountDialog = true
    },
    // 提交审核
    handleSubmitReview(row) {
      if (this.uncheckedCount > 0) {
        this.$message.warning(`还有 ${this.uncheckedCount} 项未盘点，确定要提交审核吗？`)
        return
      }
      
      this.confirmDialog = {
        visible: true,
        title: '提交审核',
        content: `确定要提交盘点单「${row.countCode}」进行审核吗？`,
        confirmText: '确定提交',
        showReason: false,
        reason: '',
        callback: () => {
          this.doSubmitReview(row)
        }
      }
    },
    // 审核盘点单
    handleApprove(row) {
      this.confirmDialog = {
        visible: true,
        title: '审核盘点单',
        content: `确定要审核通过盘点单「${row.countCode}」吗？`,
        confirmText: '审核通过',
        showReason: true,
        reason: '',
        callback: () => {
          this.doApprove(row)
        }
      }
    },
    // 确认操作
    confirmAction() {
      if (this.confirmDialog.callback) {
        this.confirmDialog.callback()
      }
      this.confirmDialog.visible = false
    },
    // 执行取消
    doCancel(row) {
      // 模拟取消操作
      const index = this.countList.findIndex(item => item.id === row.id)
      if (index !== -1) {
        this.countList[index].status = 'cancelled'
        this.$message.success('盘点单已取消')
      }
    },
    // 执行开始盘点
    doStartCount(row) {
      // 模拟开始盘点操作
      const index = this.countList.findIndex(item => item.id === row.id)
      if (index !== -1) {
        this.countList[index].status = 'counting'
        this.$message.success('盘点单已开始盘点')
      }
    },
    // 执行提交审核
    doSubmitReview(row) {
      // 模拟提交审核操作
      const index = this.countList.findIndex(item => item.id === row.id)
      if (index !== -1) {
        this.countList[index].status = 'reviewing'
        this.countList[index].checkedItems = this.currentCountItems.length
        this.countList[index].diffItems = this.diffCount
        this.$message.success('盘点单已提交审核')
        this.showInputCountDialog = false
      }
    },
    // 执行审核
    doApprove(row) {
      // 模拟审核操作
      const index = this.countList.findIndex(item => item.id === row.id)
      if (index !== -1) {
        this.countList[index].status = 'completed'
        this.countList[index].approvedBy = '当前用户'
        this.countList[index].approvedTime = new Date().toLocaleString()
        this.$message.success('盘点单已审核通过')
      }
    },
    // 保存盘点单
    saveCountForm() {
      // 验证表单
      if (!this.countForm.warehouseId) {
        this.$message.error('请选择盘点仓库')
        return
      }
      if (!this.countForm.counters || this.countForm.counters.length === 0) {
        this.$message.error('请选择盘点人员')
        return
      }

      // 模拟保存操作
      if (this.countForm.id) {
        // 编辑
        const index = this.countList.findIndex(item => item.id === this.countForm.id)
        if (index !== -1) {
          this.countList[index] = {
            ...this.countList[index],
            ...this.countForm,
            warehouseName: this.warehouses.find(w => w.id === this.countForm.warehouseId)?.name || ''
          }
          this.$message.success('盘点单已更新')
        }
      } else {
        // 新增
        const newCount = {
          ...this.countForm,
          id: Date.now(),
          warehouseName: this.warehouses.find(w => w.id === this.countForm.warehouseId)?.name || '',
          totalItems: 0,
          checkedItems: 0,
          diffItems: 0,
          profitQuantity: 0,
          lossQuantity: 0,
          diffRate: 0,
          status: 'pending',
          createdBy: '当前用户',
          createdTime: new Date().toLocaleString(),
          items: []
        }
        this.countList.unshift(newCount)
        this.pagination.total = this.countList.length
        this.$message.success('盘点单已创建')
      }

      this.closeDialog()
    },
    // 加载盘点项
    loadCountItems(countId) {
      // 模拟加载盘点项数据
      this.currentCountItems = [
        {
          id: 1,
          productCode: 'P001',
          productName: 'A材料',
          specification: '规格A',
          unit: 'kg',
          batchNo: 'B20240101',
          expiryDate: '2025-01-01',
          location: 'A1-1',
          systemQuantity: 100,
          countQuantity: 95,
          difference: -5,
          countStatus: 'diff',
          countBy: '张三',
          countTime: '2024-01-01 09:00:00',
          countRemark: ''
        },
        {
          id: 2,
          productCode: 'P002',
          productName: 'B材料',
          specification: '规格B',
          unit: 'kg',
          batchNo: 'B20240102',
          expiryDate: '2025-02-01',
          location: 'A1-2',
          systemQuantity: 200,
          countQuantity: 200,
          difference: 0,
          countStatus: 'checked',
          countBy: '李四',
          countTime: '2024-01-01 09:30:00',
          countRemark: ''
        },
        {
          id: 3,
          productCode: 'P003',
          productName: 'C材料',
          specification: '规格C',
          unit: 'kg',
          batchNo: 'B20240103',
          expiryDate: '2025-03-01',
          location: 'A1-3',
          systemQuantity: 150,
          countQuantity: null,
          difference: 0,
          countStatus: 'unchecked',
          countBy: '',
          countTime: '',
          countRemark: ''
        },
        {
          id: 4,
          productCode: 'P004',
          productName: 'D材料',
          specification: '规格D',
          unit: 'kg',
          batchNo: 'B20240104',
          expiryDate: '2025-04-01',
          location: 'A2-1',
          systemQuantity: 120,
          countQuantity: null,
          difference: 0,
          countStatus: 'unchecked',
          countBy: '',
          countTime: '',
          countRemark: ''
        },
        {
          id: 5,
          productCode: 'P005',
          productName: 'E材料',
          specification: '规格E',
          unit: 'kg',
          batchNo: 'B20240105',
          expiryDate: '2025-05-01',
          location: 'A2-2',
          systemQuantity: 80,
          countQuantity: 85,
          difference: 5,
          countStatus: 'diff',
          countBy: '张三',
          countTime: '2024-01-01 10:00:00',
          countRemark: '盘盈5件'
        }
      ]
    },
    // 显示盘点详情
    showCountDetail(row) {
      this.currentCountItem = { ...row }
      this.showCountDetailDialog = true
    },
    // 保存盘点项详情
    saveCountItemDetail() {
      const index = this.currentCountItems.findIndex(item => item.id === this.currentCountItem.id)
      if (index !== -1) {
        this.currentCountItems[index] = { ...this.currentCountItem }
        this.onCountQuantityChange(this.currentCountItems[index])
        this.$message.success('盘点信息已更新')
        this.showCountDetailDialog = false
      }
    },
    // 盘点数量变化
    onCountQuantityChange(item) {
      item.difference = item.countQuantity - item.systemQuantity
      item.countStatus = item.countQuantity === null ? 'unchecked' : 
                        (item.difference !== 0 ? 'diff' : 'checked')
      if (item.countQuantity !== null) {
        item.countBy = item.countBy || '当前用户'
        item.countTime = new Date().toLocaleString()
      } else {
        item.countBy = ''
        item.countTime = ''
      }
    },
    // 更新盘点状态
    updateCountStatus() {
      this.currentCountItems.forEach(item => {
        if (item.countQuantity !== null) {
          item.difference = item.countQuantity - item.systemQuantity
          item.countStatus = item.difference !== 0 ? 'diff' : 'checked'
        }
      })
    },
    // 搜索盘点项
    searchCountItems() {
      // 已经在computed中处理了过滤
    },
    // 重置盘点项搜索
    resetItemSearch() {
      this.itemSearchForm = {
        keyword: '',
        batchNo: '',
        countStatus: ''
      }
    },
    // 自动填充
    autoFillCount() {
      this.currentCountItems.forEach(item => {
        if (item.countStatus === 'unchecked') {
          item.countQuantity = item.systemQuantity
          this.onCountQuantityChange(item)
        }
      })
      this.$message.success('已自动填充未盘点项')
    },
    // 批量填充
    batchFillCount() {
      if (this.selectedCountItems.length === 0) {
        this.$message.error('请先选择要填充的盘点项')
        return
      }
      this.showBatchFillDialog = true
    },
    // 确认批量填充
    confirmBatchFill() {
      this.selectedCountItems.forEach(item => {
        const index = this.currentCountItems.findIndex(i => i.id === item.id)
        if (index !== -1) {
          this.currentCountItems[index].countQuantity = 
            this.batchFillForm.fillType === 'system' ? 
            this.currentCountItems[index].systemQuantity : 
            this.batchFillForm.customQuantity
          this.currentCountItems[index].countBy = this.batchFillForm.countBy
          this.onCountQuantityChange(this.currentCountItems[index])
        }
      })
      this.$message.success(`已批量填充 ${this.selectedCountItems.length} 条记录`)
      this.showBatchFillDialog = false
      this.selectedCountItems = []
    },
    // 批量清空
    batchClearCount() {
      if (this.selectedCountItems.length === 0) {
        this.$message.error('请先选择要清空的盘点项')
        return
      }
      this.confirmDialog = {
        visible: true,
        title: '批量清空',
        content: `确定要清空选中的 ${this.selectedCountItems.length} 条盘点记录吗？`,
        confirmText: '确定清空',
        showReason: false,
        reason: '',
        callback: () => {
          this.selectedCountItems.forEach(item => {
            const index = this.currentCountItems.findIndex(i => i.id === item.id)
            if (index !== -1) {
              this.currentCountItems[index].countQuantity = null
              this.currentCountItems[index].difference = 0
              this.currentCountItems[index].countStatus = 'unchecked'
              this.currentCountItems[index].countBy = ''
              this.currentCountItems[index].countTime = ''
            }
          })
          this.$message.success(`已清空 ${this.selectedCountItems.length} 条记录`)
          this.selectedCountItems = []
        }
      }
    },
    // 保存盘点项
    saveCountItems() {
      // 更新当前盘点单的统计信息
      const index = this.countList.findIndex(item => item.id === this.currentCount.id)
      if (index !== -1) {
        this.countList[index].items = JSON.parse(JSON.stringify(this.currentCountItems))
        this.countList[index].totalItems = this.currentCountItems.length
        this.countList[index].checkedItems = this.checkedCount
        this.countList[index].diffItems = this.diffCount
        
        // 计算盘盈盘亏数量
        let profitQuantity = 0
        let lossQuantity = 0
        this.currentCountItems.forEach(item => {
          if (item.difference > 0) profitQuantity += item.difference
          if (item.difference < 0) lossQuantity += Math.abs(item.difference)
        })
        
        this.countList[index].profitQuantity = profitQuantity
        this.countList[index].lossQuantity = lossQuantity
        this.countList[index].diffRate = this.diffRate
      }
      
      this.$message.success('盘点数据已保存')
      this.showInputCountDialog = false
    },
    // 仓库变化
    onWarehouseChange(warehouseId) {
      // 模拟根据仓库加载库位
      if (warehouseId === 1) {
        this.availableLocations = [
          { code: 'A1-1', name: 'A区1排1号' },
          { code: 'A1-2', name: 'A区1排2号' },
          { code: 'A1-3', name: 'A区1排3号' }
        ]
      } else if (warehouseId === 2) {
        this.availableLocations = [
          { code: 'B1-1', name: 'B区1排1号' },
          { code: 'B1-2', name: 'B区1排2号' },
          { code: 'B1-3', name: 'B区1排3号' }
        ]
      }
    },
    // 打印
    handlePrint() {
      if (this.selectedRows.length === 0) {
        this.$message.error('请先选择要打印的盘点单')
        return
      }
      this.$message.success('打印功能待实现')
    },
    // 导出
    handleExport() {
      this.$message.success('导出功能待实现')
    }
  }
}
</script>

<style scoped>
.inventory-count-container {
  padding: 20px;
  background-color: #f5f7fa;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.toolbar {
  margin-bottom: 20px;
}

.toolbar .el-button + .el-button {
  margin-left: 10px;
}

.search-area {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.search-form .el-form-item {
  margin-right: 15px;
  margin-bottom: 15px;
}

.table-area {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.input-count-content {
  height: calc(100vh - 300px);
  display: flex;
  flex-direction: column;
}

.input-toolbar {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.batch-operations {
  margin-top: 10px;
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-start;
}

.batch-operations .el-button + .el-button {
  margin-left: 10px;
}

.count-summary {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  color: #303133;
}

.count-detail-content {
  max-height: 500px;
  overflow-y: auto;
}

.confirm-content {
  padding: 10px 0;
}

.confirm-content p {
  margin: 0 0 15px 0;
  color: #606266;
  line-height: 1.8;
}

.batch-fill-content {
  padding: 10px 0;
}

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.detail-stats {
  margin-top: 20px;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-value.diff {
  color: #f56c6c;
}

.stat-value.profit {
  color: #67c23a;
}

.stat-value.loss {
  color: #f56c6c;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}
</style>