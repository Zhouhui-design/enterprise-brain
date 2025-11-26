<template>
  <div class="quality-report-container">
    <div class="page-header">
      <h2>质量报工管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateReport">
          <el-icon><Plus /></el-icon>
          新增质量报工
        </el-button>
        <el-button @click="handleExportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card quality-pass">
        <div class="stat-content">
          <div class="stat-value">{{ qualifiedCount }}</div>
          <div class="stat-label">合格数量</div>
        </div>
        <div class="stat-icon">
          <el-icon class="icon-large"><SuccessFilled /></el-icon>
        </div>
      </el-card>
      <el-card class="stat-card quality-fail">
        <div class="stat-content">
          <div class="stat-value">{{ unqualifiedCount }}</div>
          <div class="stat-label">不合格数量</div>
        </div>
        <div class="stat-icon">
          <el-icon class="icon-large"><CloseBold /></el-icon>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ passRate }}%</div>
          <div class="stat-label">合格率</div>
        </div>
        <div class="stat-icon">
          <el-icon class="icon-large"><TrendCharts /></el-icon>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ inspectionCount }}</div>
          <div class="stat-label">今日检验批次</div>
        </div>
        <div class="stat-icon">
          <el-icon class="icon-large"><Check /></el-icon>
        </div>
      </el-card>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="报工单号">
          <el-input v-model="searchForm.reportNo" placeholder="请输入报工单号" clearable />
        </el-form-item>
        <el-form-item label="生产订单">
          <el-input v-model="searchForm.productionOrder" placeholder="请输入生产订单号" clearable />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="检验类型">
          <el-select v-model="searchForm.inspectionType" placeholder="请选择检验类型" clearable>
            <el-option label="首检" value="first" />
            <el-option label="巡检" value="process" />
            <el-option label="末检" value="final" />
            <el-option label="全检" value="full" />
            <el-option label="抽检" value="sample" />
          </el-select>
        </el-form-item>
        <el-form-item label="质检结果">
          <el-select v-model="searchForm.qualityResult" placeholder="请选择质检结果" clearable>
            <el-option label="合格" value="qualified" />
            <el-option label="不合格" value="unqualified" />
            <el-option label="返工" value="rework" />
          </el-select>
        </el-form-item>
        <el-form-item label="检验日期">
          <el-date-picker
            v-model="searchForm.inspectionDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 质量报工列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>质量报工记录列表</span>
          <div class="table-actions">
            <el-select v-model="tableSize" size="small" @change="handleSizeChange">
              <el-option label="10条/页" value="10" />
              <el-option label="20条/页" value="20" />
              <el-option label="50条/页" value="50" />
              <el-option label="100条/页" value="100" />
            </el-select>
          </div>
        </div>
      </template>
      <el-table
        v-loading="loading"
        :data="qualityReportsData"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="reportNo" label="报工单号" width="180" />
        <el-table-column prop="productionOrder" label="生产订单号" width="180" />
        <el-table-column prop="productName" label="产品名称" width="150" />
        <el-table-column prop="inspectionType" label="检验类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getInspectionType(row.inspectionType)">{{ getInspectionTypeText(row.inspectionType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inspectionDate" label="检验日期" width="150" />
<template>
  <div class="quality-report-container">
    <el-page-header
      :title="'质量报工'"
      :subtitle="'生产质量检验数据记录'"
      @back="goBack"
    />
    
    <el-card class="mt-4">
      <!-- 搜索筛选区 -->
      <el-form
        :model="searchForm"
        :inline="true"
        label-position="right"
        class="mb-4"
      >
        <el-form-item label="报工单号">
          <el-input
            v-model="searchForm.reportNo"
            placeholder="请输入报工单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="产品名称">
          <el-input
            v-model="searchForm.productName"
            placeholder="请输入产品名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="检验类型">
          <el-select
            v-model="searchForm.inspectionType"
            placeholder="请选择检验类型"
            clearable
            style="width: 200px"
          >
            <el-option label="进货检验" value="1" />
            <el-option label="过程检验" value="2" />
            <el-option label="成品检验" value="3" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="检验结果">
          <el-select
            v-model="searchForm.inspectionResult"
            placeholder="请选择检验结果"
            clearable
            style="width: 200px"
          >
            <el-option label="合格" value="1" />
            <el-option label="不合格" value="0" />
            <el-option label="让步接收" value="2" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="检验日期">
          <el-date-picker
            v-model="searchForm.inspectionDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 320px"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 数据统计卡片 -->
      <div class="stats-cards mb-4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ totalReports }}</div>
            <div class="stat-label">总检验数</div>
          </div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ passedReports }}</div>
            <div class="stat-label">合格数</div>
          </div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ failedReports }}</div>
            <div class="stat-label">不合格数</div>
          </div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ qualityRate }}%</div>
            <div class="stat-label">合格率</div>
          </div>
        </el-card>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons mb-4">
        <el-button type="primary" @click="handleCreateReport">
          <el-icon><Plus /></el-icon>
          新增质量报工
        </el-button>
        <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
      
      <!-- 质量报工列表 -->
      <el-table
        v-loading="loading"
        :data="qualityReportsData"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblclick"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="reportNo" label="报工单号" min-width="150" />
        <el-table-column prop="productCode" label="产品编码" min-width="120" />
        <el-table-column prop="productName" label="产品名称" min-width="180" />
        <el-table-column prop="specification" label="规格型号" min-width="120" />
        <el-table-column prop="batchNo" label="批次号" min-width="150" />
        <el-table-column prop="inspectionType" label="检验类型" min-width="120">
          <template #default="scope">
            {{ getInspectionTypeText(scope.row.inspectionType) }}
          </template>
        </el-table-column>
        <el-table-column prop="inspectionQuantity" label="检验数量" min-width="100" />
        <el-table-column prop="qualifiedQuantity" label="合格数量" min-width="100" />
        <el-table-column prop="defectiveQuantity" label="不良数量" min-width="100" />
        <el-table-column prop="inspectionResult" label="检验结果" min-width="100">
          <template #default="scope">
            <el-tag
              :type="getResultType(scope.row.inspectionResult)"
              effect="light"
            >
              {{ getResultText(scope.row.inspectionResult) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inspectionDate" label="检验日期" min-width="120" />
        <el-table-column prop="inspector" label="检验员" min-width="100" />
        <el-table-column label="操作" min-width="120" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleViewReport(scope.row)"
            >
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
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
    
    <!-- 质量报工详情对话框 -->
    <el-dialog
      v-model="reportDetailVisible"
      :title="'质量报工详情 - ' + (currentReport?.reportNo || '')"
      width="80%"
      destroy-on-close
    >
      <div class="report-detail">
        <el-descriptions border :column="1" class="mb-4">
          <el-descriptions-item label="报工单号">{{ currentReport?.reportNo }}</el-descriptions-item>
          <el-descriptions-item label="产品编码">{{ currentReport?.productCode }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ currentReport?.productName }}</el-descriptions-item>
          <el-descriptions-item label="规格型号">{{ currentReport?.specification }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ currentReport?.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="检验类型">{{ getInspectionTypeText(currentReport?.inspectionType) }}</el-descriptions-item>
          <el-descriptions-item label="抽样方案">{{ currentReport?.samplingPlan || '-' }}</el-descriptions-item>
          <el-descriptions-item label="检验数量">{{ currentReport?.inspectionQuantity }}</el-descriptions-item>
          <el-descriptions-item label="合格数量">{{ currentReport?.qualifiedQuantity }}</el-descriptions-item>
          <el-descriptions-item label="不良数量">{{ currentReport?.defectiveQuantity }}</el-descriptions-item>
          <el-descriptions-item label="检验结果">
            <el-tag :type="getResultType(currentReport?.inspectionResult)">
              {{ getResultText(currentReport?.inspectionResult) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="检验日期">{{ currentReport?.inspectionDate }}</el-descriptions-item>
          <el-descriptions-item label="检验员">{{ currentReport?.inspector }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentReport?.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 检验项目明细 -->
        <div class="mb-4">
          <h3 class="section-title">检验项目明细</h3>
          <el-table :data="currentReport?.inspectionItems || []" style="width: 100%">
            <el-table-column prop="itemName" label="检验项目" min-width="150" />
            <el-table-column prop="standard" label="检验标准" min-width="200" />
            <el-table-column prop="actualValue" label="实际值" min-width="150" />
            <el-table-column prop="unit" label="单位" min-width="80" />
            <el-table-column prop="result" label="单项结果" min-width="100">
              <template #default="scope">
                <el-tag :type="scope.row.result === '合格' ? 'success' : 'danger'">
                  {{ scope.row.result }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="200" />
          </el-table>
        </div>
        
        <!-- 不良明细 -->
        <div v-if="currentReport?.defectItems && currentReport.defectItems.length > 0" class="mb-4">
          <h3 class="section-title">不良明细</h3>
          <el-table :data="currentReport.defectItems" style="width: 100%">
            <el-table-column prop="defectType" label="不良类型" min-width="150" />
            <el-table-column prop="defectLevel" label="不良级别" min-width="100">
              <template #default="scope">
                <el-tag :type="getDefectLevelType(scope.row.defectLevel)">
                  {{ scope.row.defectLevel }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" min-width="80" />
            <el-table-column prop="description" label="不良描述" min-width="200" />
            <el-table-column prop="handlingMethod" label="处理方式" min-width="150" />
          </el-table>
        </div>
        
        <!-- 操作日志 -->
        <div class="mb-4">
          <h3 class="section-title">操作日志</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in currentReport?.operationLogs"
              :key="index"
              :timestamp="log.time"
              placement="top"
            >
              <div class="log-content">
                <div class="log-actor">{{ log.actor }}：</div>
                <div class="log-action">{{ log.action }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportDetailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 新增/编辑质量报工对话框 -->
    <el-dialog
      v-model="createReportVisible"
      :title="isEdit ? '编辑质量报工' : '新增质量报工'"
      width="70%"
      destroy-on-close
    >
      <el-form
        ref="reportFormRef"
        :model="reportForm"
        :rules="reportFormRules"
        label-position="right"
        label-width="120px"
        class="report-form"
      >
        <el-form-item label="产品信息" prop="productId">
          <el-select
            v-model="reportForm.productId"
            placeholder="请选择产品"
            filterable
            clearable
            @change="handleProductChange"
          >
            <el-option
              v-for="product in products"
              :key="product.id"
              :label="product.name + ' (' + product.specification + ')'"
              :value="product.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="批次号" prop="batchNo">
          <el-input v-model="reportForm.batchNo" placeholder="请输入批次号" />
        </el-form-item>
        
        <el-form-item label="检验类型" prop="inspectionType">
          <el-select v-model="reportForm.inspectionType" placeholder="请选择检验类型">
            <el-option label="进货检验" value="1" />
            <el-option label="过程检验" value="2" />
            <el-option label="成品检验" value="3" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="抽样方案" prop="samplingPlan">
          <el-input v-model="reportForm.samplingPlan" placeholder="请输入抽样方案" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="检验数量" prop="inspectionQuantity">
              <el-input
                v-model.number="reportForm.inspectionQuantity"
                type="number"
                :min="1"
                placeholder="请输入检验数量"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合格数量" prop="qualifiedQuantity">
              <el-input
                v-model.number="reportForm.qualifiedQuantity"
                type="number"
                :min="0"
                placeholder="请输入合格数量"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="不良数量" prop="defectiveQuantity">
              <el-input
                v-model.number="reportForm.defectiveQuantity"
                type="number"
                :min="0"
                placeholder="请输入不良数量"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检验结果" prop="inspectionResult">
              <el-select v-model="reportForm.inspectionResult" placeholder="请选择检验结果">
                <el-option label="合格" value="1" />
                <el-option label="不合格" value="0" />
                <el-option label="让步接收" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="检验日期" prop="inspectionDate">
          <el-date-picker
            v-model="reportForm.inspectionDate"
            type="date"
            placeholder="请选择检验日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="检验员" prop="inspector">
          <el-input v-model="reportForm.inspector" placeholder="请输入检验员" />
        </el-form-item>
        
        <!-- 检验项目明细 -->
        <el-form-item label="检验项目明细">
          <el-button type="primary" size="small" @click="addInspectionItem">
            <el-icon><Plus /></el-icon>
            添加检验项目
          </el-button>
          <el-table
            v-if="reportForm.inspectionItems && reportForm.inspectionItems.length > 0"
            :data="reportForm.inspectionItems"
            style="width: 100%"
            border
            class="mt-2"
          >
            <el-table-column prop="itemName" label="检验项目" min-width="150">
              <template #default="scope">
                <el-input v-model="scope.row.itemName" placeholder="请输入检验项目" />
              </template>
            </el-table-column>
            <el-table-column prop="standard" label="检验标准" min-width="150">
              <template #default="scope">
                <el-input v-model="scope.row.standard" placeholder="请输入检验标准" />
              </template>
            </el-table-column>
            <el-table-column prop="actualValue" label="实际值" min-width="100">
              <template #default="scope">
                <el-input v-model="scope.row.actualValue" placeholder="请输入实际值" />
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" min-width="80">
              <template #default="scope">
                <el-input v-model="scope.row.unit" placeholder="单位" />
              </template>
            </el-table-column>
            <el-table-column prop="result" label="单项结果" min-width="100">
              <template #default="scope">
                <el-select v-model="scope.row.result" placeholder="请选择">
                  <el-option label="合格" value="合格" />
                  <el-option label="不合格" value="不合格" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150">
              <template #default="scope">
                <el-input v-model="scope.row.remark" placeholder="备注" />
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="80">
              <template #default="scope">
                <el-button
                  type="danger"
                  size="small"
                  @click="removeInspectionItem(scope.$index)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        
        <!-- 不良明细 -->
        <el-form-item label="不良明细" v-if="reportForm.defectiveQuantity > 0">
          <el-button type="primary" size="small" @click="addDefectItem">
            <el-icon><Plus /></el-icon>
            添加不良项
          </el-button>
          <el-table
            v-if="reportForm.defectItems && reportForm.defectItems.length > 0"
            :data="reportForm.defectItems"
            style="width: 100%"
            border
            class="mt-2"
          >
            <el-table-column prop="defectType" label="不良类型" min-width="120">
              <template #default="scope">
                <el-input v-model="scope.row.defectType" placeholder="请输入不良类型" />
              </template>
            </el-table-column>
            <el-table-column prop="defectLevel" label="不良级别" min-width="100">
              <template #default="scope">
                <el-select v-model="scope.row.defectLevel" placeholder="请选择">
                  <el-option label="严重" value="严重" />
                  <el-option label="主要" value="主要" />
                  <el-option label="次要" value="次要" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" min-width="80">
              <template #default="scope">
                <el-input
                  v-model.number="scope.row.quantity"
                  type="number"
                  :min="1"
                  placeholder="数量"
                />
              </template>
            </el-table-column>
            <el-table-column prop="description" label="不良描述" min-width="150">
              <template #default="scope">
                <el-input v-model="scope.row.description" placeholder="请输入不良描述" />
              </template>
            </el-table-column>
            <el-table-column prop="handlingMethod" label="处理方式" min-width="120">
              <template #default="scope">
                <el-input v-model="scope.row.handlingMethod" placeholder="请输入处理方式" />
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="80">
              <template #default="scope">
                <el-button
                  type="danger"
                  size="small"
                  @click="removeDefectItem(scope.$index)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="reportForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createReportVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitReport">提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, Plus, Delete, View } from '@element-plus/icons'