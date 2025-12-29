<template>
  <div class="production-bom-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>生产BOM</h2>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增BOM
        </el-button>
        <el-button type="warning" @click="showDraftBox">
          <el-icon><Document /></el-icon>
          草稿箱
        </el-button>
        <el-button type="info" @click="handleRecoverData">
          <el-icon><RefreshRight /></el-icon>
          恢复数据
        </el-button>
        <el-button type="danger" :disabled="!hasSelection" @click="handleBatchDelete">批量删除</el-button>
        <el-button type="success" :disabled="!isSingleSelection" @click="handleShowBomTree">
          <el-icon><Grid /></el-icon>
          生成BOM树结构
        </el-button>
        <el-button type="info" :disabled="!isSingleSelection" @click="handleViewBomTree">
          <el-icon><DataAnalysis /></el-icon>
          查看BOM树信息
        </el-button>
        <el-button type="primary" :disabled="!isSingleSelection" @click="handleGenerateListStyleBom">
          <el-icon><List /></el-icon>
          生成列表式BOM
        </el-button>
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button type="warning" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="handlePrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="BOM编号">
          <el-input v-model="searchForm.bomCode" placeholder="请输入BOM编号" clearable />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已批准" value="approved" />
            <el-option label="已废弃" value="obsolete" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #409EFF;">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">BOM总数</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #67C23A;">
            <el-icon :size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.approved }}</div>
            <div class="stat-label">已批准</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #E6A23C;">
            <el-icon :size="24"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.reviewing }}</div>
            <div class="stat-label">审核中</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主表格 -->
    <el-table 
      ref="tableRef"
      :data="filteredTableData" 
      stripe 
      border
      :height="tableHeight"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" fixed="left" />
      <el-table-column prop="bomCode" label="BOM编号" width="140" fixed="left">
        <template #default="{ row }">
          <span 
            style="cursor: pointer;" 
            @dblclick="copyToClipboard(row.bomCode, 'BOM编号')"
            :title="'双击复制：' + row.bomCode"
          >
            {{ row.bomCode }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="bomName" label="BOM名称" width="200" fixed="left">
        <template #default="{ row }">
          <el-link type="primary" @click="handleView(row)">{{ row.bomName }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="productCode" label="产品编号" width="140">
        <template #default="{ row }">
          <span 
            style="cursor: pointer;" 
            @dblclick="copyToClipboard(row.productCode, '产品编号')"
            :title="'双击复制：' + row.productCode"
          >
            {{ row.productCode }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="productName" label="产品名称" width="180" />
      <el-table-column prop="productImage" label="产品图片" width="100">
        <template #default="{ row }">
          <el-image 
            v-if="row.productImage"
            :src="row.productImage" 
            :preview-src-list="[row.productImage]"
            :preview-teleported="true"
            style="width: 50px; height: 50px; cursor: pointer;"
            fit="cover"
          />
          <span v-else style="color: #909399;">无图片</span>
        </template>
      </el-table-column>
      <el-table-column prop="version" label="版本号" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 'draft'" type="info">草稿</el-tag>
          <el-tag v-else-if="row.status === 'reviewing'" type="warning">审核中</el-tag>
          <el-tag v-else-if="row.status === 'approved'" type="success">已批准</el-tag>
          <el-tag v-else-if="row.status === 'obsolete'" type="danger">已废弃</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="designer" label="设计人员" width="120" />
      <el-table-column prop="reviewer" label="审核人员" width="120" />
      <el-table-column prop="itemCount" label="物料数量" width="100" align="right" />
      <el-table-column prop="totalLabor" label="总人工" width="120" align="right">
        <template #default="{ row }">
          <span v-if="row.totalLabor">￥{{ parseFloat(row.totalLabor).toFixed(2) }}</span>
          <span v-else style="color: #909399;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="totalMaterial" label="总材料" width="120" align="right">
        <template #default="{ row }">
          <span v-if="row.totalMaterial">￥{{ parseFloat(row.totalMaterial).toFixed(2) }}</span>
          <span v-else style="color: #909399;">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="isPushedToManual" label="是否推送" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.isPushedToManual" type="success">已推送</el-tag>
          <el-tag v-else type="info">未推送</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="effectiveDate" label="生效日期" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column prop="remark" label="备注" width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="success" @click="handleView(row)">查看</el-button>
          <el-button link type="warning" @click="handlePushToManual(row)">推送</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      :title="dialogTitle" 
      width="90%" 
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      destroy-on-close
    >
      <!-- 父件属性区 -->
      <div class="parent-section">
        <h3 class="section-title">父件属性</h3>
        <el-form :model="formData" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="BOM编号">
                <div style="display: flex; gap: 8px;">
                  <el-input v-model="formData.bomCode" placeholder="自动生成" readonly style="flex: 1;" />
                  <el-button 
                    type="primary" 
                    :icon="DocumentCopy" 
                    @click="copyToClipboard(formData.bomCode, 'BOM编号')"
                  >
                    复制
                  </el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="BOM名称">
                <el-input v-model="formData.bomName" placeholder="请输入BOM名称" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="版本号">
                <el-input v-model="formData.version" placeholder="如：V1.0" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="产品编号">
                <SmartSelect
                  v-model="formData.productCode"
                  :options="materialList"
                  label-field="materialCode"
                  value-field="materialCode"
                  description-field="materialName"
                  placeholder="请选择或输入产品编码"
                  :filterable="true"
                  :clearable="true"
                  :show-description="true"
                  @change="handleProductCodeChange"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="产品名称">
                <SmartSelect
                  v-model="formData.productName"
                  :options="materialList"
                  label-field="materialName"
                  value-field="materialName"
                  description-field="materialCode"
                  placeholder="请选择或输入产品名称"
                  :filterable="true"
                  :clearable="true"
                  :show-description="true"
                  @change="handleProductNameChange"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="状态">
                <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%;">
                  <el-option label="草稿" value="draft" />
                  <el-option label="审核中" value="reviewing" />
                  <el-option label="已批准" value="approved" />
                  <el-option label="已废弃" value="obsolete" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="设计人员">
                <el-input v-model="formData.designer" placeholder="请输入设计人员" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="审核人员">
                <el-input v-model="formData.reviewer" placeholder="请输入审核人员" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="物料数量">
                <el-input-number v-model="formData.itemCount" :min="1" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="生效日期">
                <el-date-picker v-model="formData.effectiveDate" type="date" placeholder="选择日期" style="width: 100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="产出工序">
                <el-input v-model="formData.outputProcess" readonly placeholder="自动填充" style="width: 100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="总人工">
                <div style="display: flex; gap: 10px; width: 100%;">
                  <el-input v-model="formData.totalLabor" readonly style="flex: 1;" />
                  <el-button type="primary" @click="handleCalculateLabor">计算人工费用</el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="总材料">
                <div style="display: flex; gap: 10px; width: 100%;">
                  <el-input v-model="formData.totalMaterial" readonly style="flex: 1;" />
                  <el-button type="primary" @click="handleCalculateMaterial">计算材料费用</el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input v-model="formData.remark" placeholder="请输入备注" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 子件属性区 -->
      <div class="child-section">
        <div class="section-header">
          <h3 class="section-title">子件属性</h3>
          <div class="child-toolbar">
            <el-button type="primary" size="small" @click="handleAddChild">
              <el-icon><Plus /></el-icon>
              添加子件
            </el-button>
            <el-button type="success" size="small" @click="handleAddChildLevel" :disabled="selectedChildRows.length === 0">
              <el-icon><Plus /></el-icon>
              增加下层
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteCurrentLevel" :disabled="selectedChildRows.length === 0">
              <el-icon><Delete /></el-icon>
              删除本层
            </el-button>
            <el-button type="warning" size="small" @click="handleDeleteChildLevel" :disabled="selectedChildRows.length === 0">
              <el-icon><Delete /></el-icon>
              删除下层
            </el-button>
            <el-button type="info" size="small" @click="handleMoveToStart" :disabled="selectedChildRows.length === 0">
              <el-icon><Rank /></el-icon>
              移动到
            </el-button>
            <el-divider direction="vertical" />
            <el-button type="primary" size="small" @click="handleReloadProcessNames">
              <el-icon><Refresh /></el-icon>
              重新加载工序名称
            </el-button>
            <el-button size="small" @click="settingsVisible = true">
              <el-icon><Setting /></el-icon>
              本页设置
            </el-button>
          </div>
        </div>
        
        <!-- 手动加载按钮区（只在手动模式下显示） -->
        <div v-if="calculationMode === 'manual'" class="manual-load-toolbar" style="margin: 10px 0; padding: 10px; background: #f5f7fa; border-radius: 4px;">
          <el-space wrap>
            <el-button type="primary" size="small" @click="handleCalculateLevel0Qty">
              <el-icon><Operation /></el-icon>
              计算0层阶标准用量
            </el-button>
            <el-button type="success" size="small" @click="handleLoadMaterialPrice">
              <el-icon><PriceTag /></el-icon>
              加载材料单价
            </el-button>
            <el-button type="warning" size="small" @click="handleLoadProcessWage">
              <el-icon><Money /></el-icon>
              加载工序工资
            </el-button>
            <el-button type="info" size="small" @click="handleLoadMaterialCost">
              <el-icon><Coin /></el-icon>
              加载材料费用
            </el-button>
            <el-button type="danger" size="small" @click="handleLoadLevel0Labor">
              <el-icon><User /></el-icon>
              加载0阶人工
            </el-button>
          </el-space>
        </div>
        
        <el-table 
          :data="paginatedChildItems" 
          border 
          stripe
          height="400"
          class="child-table"
          @selection-change="handleChildSelectionChange"
          :row-class-name="getRowClassName"
          @row-click="handleRowClick"
          row-key="id"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column type="index" label="序号" width="60" align="center" :index="getChildRowIndex" />
          <el-table-column prop="level" label="层阶" min-width="80" align="center">
            <template #default="{ row }">
              <el-input 
                v-model="row.level" 
                placeholder="层阶" 
                size="small"
                @focus="handleCellFocus(row, 'level')"
                @change="updateLevelPath(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="levelPath" label="层阶地址" min-width="120" align="center">
            <template #default="{ row }">
              <span style="font-weight: bold; color: #409EFF;">{{ row.levelPath || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="childCode" label="子件编码" min-width="150">
            <template #default="{ row }">
              <el-select
                v-model="row.childCode"
                filterable
                clearable
                placeholder="选择子件编码"
                size="small"
                @change="(val) => handleChildCodeChange(val, row)"
                @focus="handleCellFocus(row, 'childCode')"
                style="width: 100%;"
              >
                <el-option
                  v-for="item in filteredChildMaterialList"
                  :key="item.materialCode"
                  :label="item.materialCode"
                  :value="item.materialCode"
                >
                  <span>{{ item.materialCode }}</span>
                  <span style="color: #8492a6; font-size: 12px; margin-left: 8px;">{{ item.materialName }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="childName" label="子件名称" min-width="180">
            <template #default="{ row }">
              <el-select
                v-model="row.childName"
                filterable
                clearable
                placeholder="选择子件名称"
                size="small"
                @change="(val) => handleChildNameChange(val, row)"
                @focus="handleCellFocus(row, 'childName')"
                style="width: 100%;"
              >
                <el-option
                  v-for="item in filteredChildMaterialList"
                  :key="item.materialName"
                  :label="item.materialName"
                  :value="item.materialName"
                >
                  <span>{{ item.materialName }}</span>
                  <span style="color: #8492a6; font-size: 12px; margin-left: 8px;">{{ item.materialCode }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="standardQty" label="标准用量" min-width="120">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.standardQty" 
                :min="0" 
                :precision="4" 
                size="small"
                controls-position="right"
                @focus="handleCellFocus(row, 'standardQty')"
                style="width: 100%;" 
              />
            </template>
          </el-table-column>
          <el-table-column prop="level0Qty" label="0层阶标准用量" min-width="140" align="right">
            <template #default="{ row }">
              <span>{{ calculateLevel0Qty(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="outputProcess" label="产出工序" min-width="150">
            <template #default="{ row }">
              <span>{{ row.outputProcess || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="source" label="子件来源" min-width="150">
            <template #default="{ row }">
              <el-select 
                v-model="row.source" 
                placeholder="请选择子件来源" 
                size="small"
                style="width: 100%;"
              >
                <el-option label="自制" value="自制" />
                <el-option label="外购" value="外购" />
                <el-option label="外协" value="外协" />
                <el-option label="客供" value="客供" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="processWage" label="工序工资" min-width="120" align="right">
            <template #default="{ row }">
              <span>{{ row.processWage !== undefined ? row.processWage.toFixed(2) : '0.00' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="materialLoss" label="材料损耗" min-width="120" align="right">
            <template #default="{ row }">
              <span>{{ row.materialLoss !== undefined ? row.materialLoss.toFixed(2) + '%' : '0.00%' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="materialPrice" label="材料单价" min-width="120" align="right">
            <template #default="{ row }">
              <span>{{ row.materialPrice !== undefined ? row.materialPrice.toFixed(2) : '0.00' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="materialCost" label="材料费用" min-width="120" align="right">
            <template #default="{ row }">
              <span>{{ calculateMaterialCost(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="level0Labor" label="0阶人工" min-width="120" align="right">
            <template #default="{ row }">
              <span>{{ calculateLevel0Labor(row) }}</span>
            </template>
          </el-table-column>
          <!-- 需求1：新增5个后道字段列 -->
          <el-table-column prop="nextProcessName" label="后道工序名称" min-width="130" align="center">
            <template #default="{ row }">
              <span>{{ row.nextProcessName || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="nextProductCode" label="后道工序产品编号" min-width="150" align="center">
            <template #default="{ row }">
              <span>{{ row.nextProductCode || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="nextProductName" label="后道工序产品名称" min-width="150" align="center">
            <template #default="{ row }">
              <span>{{ row.nextProductName || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="nextStandardQty" label="后道0阶标准用量" min-width="150" align="right">
            <template #default="{ row }">
              <span>{{ row.nextStandardQty || 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="nextLevelAddress" label="后道产品层阶地址" min-width="150" align="center">
            <template #default="{ row }">
              <span>{{ row.nextLevelAddress || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right" align="center">
            <template #default="{ row, $index }">
              <el-button link type="success" size="small" @click="handleAddChildLevelForRow(row, $index)">
                <el-icon><Plus /></el-icon>
                增加下层
              </el-button>
              <el-button link type="danger" size="small" @click="handleDeleteCurrentLevelForRow(row, $index)">
                <el-icon><Delete /></el-icon>
                删除本层
              </el-button>
              <el-button link type="warning" size="small" @click="handleDeleteChildLevelForRow(row, $index)">
                <el-icon><Delete /></el-icon>
                删除下层
              </el-button>
              <el-button link type="danger" @click="handleDeleteChild($index)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 子件分页 -->
        <div style="margin-top: 10px; text-align: center;">
          <el-pagination
            v-model:current-page="childCurrentPage"
            v-model:page-size="childPageSize"
            :page-sizes="[20, 50, 100, 200]"
            :total="childTotalCount"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleChildSizeChange"
            @current-change="handleChildCurrentChange"
            small
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="warning" @click="handleSaveToDraft">保存为草稿</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
        <el-button type="success" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog 
      v-model="viewDialogVisible" 
      title="BOM详情" 
      width="90%" 
      :close-on-click-modal="false"
    >
      <!-- 父件属性 -->
      <div class="parent-section" v-if="currentBom">
        <h3 class="section-title">父件属性</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="BOM编号">{{ currentBom.bomCode }}</el-descriptions-item>
          <el-descriptions-item label="BOM名称">{{ currentBom.bomName }}</el-descriptions-item>
          <el-descriptions-item label="产品编号">{{ currentBom.productCode }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ currentBom.productName }}</el-descriptions-item>
          <el-descriptions-item label="版本号">{{ currentBom.version }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="currentBom.status === 'draft'" type="info">草稿</el-tag>
            <el-tag v-else-if="currentBom.status === 'reviewing'" type="warning">审核中</el-tag>
            <el-tag v-else-if="currentBom.status === 'approved'" type="success">已批准</el-tag>
            <el-tag v-else-if="currentBom.status === 'obsolete'" type="danger">已废弃</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设计人员">{{ currentBom.designer }}</el-descriptions-item>
          <el-descriptions-item label="审核人员">{{ currentBom.reviewer }}</el-descriptions-item>
          <el-descriptions-item label="物料数量">{{ currentBom.itemCount }}</el-descriptions-item>
          <el-descriptions-item label="生效日期">{{ currentBom.effectiveDate }}</el-descriptions-item>
          <el-descriptions-item label="总人工">
            <span v-if="currentBom.totalLabor">￥{{ parseFloat(currentBom.totalLabor).toFixed(2) }}</span>
            <span v-else style="color: #909399;">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="总材料">
            <span v-if="currentBom.totalMaterial">￥{{ parseFloat(currentBom.totalMaterial).toFixed(2) }}</span>
            <span v-else style="color: #909399;">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentBom.createTime }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentBom.updateTime }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentBom.remark }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 子件属性 -->
      <div class="child-section" v-if="currentBom && currentBom.childItems && currentBom.childItems.length > 0" style="margin-top: 20px;">
        <h3 class="section-title">子件属性</h3>
        <el-table 
          :data="currentBom.childItems" 
          border 
          stripe
          max-height="400"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="level" label="层阶" width="80" align="center" />
          <el-table-column prop="levelPath" label="层阶地址" width="120" align="center">
            <template #default="{ row }">
              <span style="font-weight: bold; color: #409EFF;">{{ row.levelPath || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="childCode" label="子件编码" min-width="120" />
          <el-table-column prop="childName" label="子件名称" min-width="150" />
          <el-table-column prop="standardQty" label="标准用量" width="100" align="right" />
          <el-table-column prop="level0Qty" label="0层阶标准用量" width="140" align="right">
            <template #default="{ row }">
              <span>{{ calculateLevel0Qty(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="outputProcess" label="产出工序" min-width="120" />
          <el-table-column prop="source" label="子件来源" width="100" />
          <el-table-column prop="processWage" label="工序工资" width="100" align="right">
            <template #default="{ row }">
              {{ row.processWage ? row.processWage.toFixed(2) : '0.00' }}
            </template>
          </el-table-column>
          <el-table-column prop="materialLoss" label="材料损耗" width="100" align="right">
            <template #default="{ row }">
              {{ row.materialLoss ? row.materialLoss.toFixed(2) : '0.00' }}%
            </template>
          </el-table-column>
          <el-table-column prop="materialPrice" label="材料单价" width="100" align="right">
            <template #default="{ row }">
              {{ row.materialPrice ? row.materialPrice.toFixed(2) : '0.00' }}
            </template>
          </el-table-column>
          <el-table-column prop="materialCost" label="材料费用" width="100" align="right">
            <template #default="{ row }">
              {{ calculateMaterialCost(row) }}
            </template>
          </el-table-column>
          <el-table-column prop="level0Labor" label="0阶人工" width="100" align="right">
            <template #default="{ row }">
              <span>{{ calculateLevel0Labor(row) }}</span>
            </template>
          </el-table-column>
          <!-- 需求1：详情页新增5个后道字段列 -->
          <el-table-column prop="nextProcessName" label="后道工序名称" width="130" align="center" />
          <el-table-column prop="nextProductCode" label="后道工序产品编号" width="150" align="center" />
          <el-table-column prop="nextProductName" label="后道工序产品名称" width="150" align="center" />
          <el-table-column prop="nextStandardQty" label="后道0阶标准用量" width="150" align="right" />
          <el-table-column prop="nextLevelAddress" label="后道产品层阶地址" width="150" align="center" />
        </el-table>
      </div>

      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入生产BOM" width="500px">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持 xlsx/xls 格式文件，大小不超过 10MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportConfirm">确定导入</el-button>
      </template>
    </el-dialog>

    <!-- 本页设置对话框 -->
    <el-dialog 
      v-model="settingsVisible" 
      title="本页设置" 
      width="600px" 
      :close-on-click-modal="false"
    >
      <el-form label-width="120px">
        <el-form-item label="计算方式">
          <el-select v-model="calculationMode" placeholder="请选择计算方式" style="width: 100%;">
            <el-option label="自动生成" value="auto">
              <div>
                <div style="font-weight: bold;">自动生成</div>
                <div style="font-size: 12px; color: #909399;">表格本页面内所有字段实时生成，但页面负载会很高，表现的会很卡</div>
              </div>
            </el-option>
            <el-option label="手动加载" value="manual">
              <div>
                <div style="font-weight: bold;">手动加载（推荐）</div>
                <div style="font-size: 12px; color: #909399;">需要手动触发对应按钮，系统只生成对应的字段，页面负载很小，表现很流畅</div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-alert 
          v-if="calculationMode === 'auto'" 
          type="warning" 
          :closable="false"
          show-icon
        >
          <template #title>
            <div>自动生成模式</div>
          </template>
          表格本页面内所有字段实时生成，但页面负载会很高，表现的会很卡。<br/>
          如果子件数量较多，建议使用手动加载模式。
        </el-alert>
        <el-alert 
          v-if="calculationMode === 'manual'" 
          type="success" 
          :closable="false"
          show-icon
        >
          <template #title>
            <div>手动加载模式（推荐）</div>
          </template>
          需要手动触发对应按钮，系统只生成对应的字段，页面负载很小，表现很流畅。<br/>
          <strong>离散性BOM多层级建议选择手动加载方式。</strong>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="settingsVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 草稿箱对话框 -->
    <el-dialog 
      v-model="draftBoxVisible" 
      title="草稿箱" 
      width="90%" 
      :close-on-click-modal="false"
    >
      <el-table 
        :data="draftList" 
        border 
        stripe
        height="500"
      >
        <el-table-column prop="bomCode" label="BOM编号" width="140">
          <template #default="{ row }">
            <span 
              style="cursor: pointer;" 
              @dblclick="copyToClipboard(row.bomCode, 'BOM编号')"
              :title="'双击复制：' + row.bomCode"
            >
              {{ row.bomCode }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="bomName" label="BOM名称" width="200" />
        <el-table-column prop="productCode" label="产品编号" width="140">
          <template #default="{ row }">
            <span 
              style="cursor: pointer;" 
              @dblclick="copyToClipboard(row.productCode, '产品编号')"
              :title="'双击复制：' + row.productCode"
            >
              {{ row.productCode }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="产品名称" width="180" />
        <el-table-column prop="version" label="版本号" width="100" />
        <el-table-column prop="itemCount" label="物料数量" width="100" align="right" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditDraft(row)">编辑</el-button>
            <el-button link type="success" @click="handleSubmitDraft(row)">提交</el-button>
            <el-button link type="danger" @click="handleDeleteDraft(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="draftBoxVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- BOM树结构展示对话框 -->
    <el-dialog
      v-model="bomTreeDialogVisible"
      :title="`BOM树结构 - ${bomTreeData.bomName || ''}`"
      width="95%"
      :close-on-click-modal="false"
      destroy-on-close
      class="bom-tree-dialog"
      top="5vh"
    >
      <div class="bom-tree-container">
        <!-- 产品信息区 -->
        <div class="product-info-header">
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="BOM编号">
              <el-tag type="primary">{{ bomTreeData.bomCode }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="BOM名称">
              <strong>{{ bomTreeData.bomName }}</strong>
            </el-descriptions-item>
            <el-descriptions-item label="版本号">{{ bomTreeData.version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag v-if="bomTreeData.status === 'draft'" type="info">草稿</el-tag>
              <el-tag v-else-if="bomTreeData.status === 'reviewing'" type="warning">审核中</el-tag>
              <el-tag v-else-if="bomTreeData.status === 'approved'" type="success">已批准</el-tag>
              <el-tag v-else-if="bomTreeData.status === 'obsolete'" type="danger">已废弃</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 横向组织架构式树形结构 -->
        <div class="org-tree-section">
          <div class="org-tree-wrapper">
            <div class="org-tree-container" ref="orgTreeContainer">
              <!-- 递归渲染组织架构树 -->
              <div class="org-tree-node-wrapper" v-if="orgTreeData">
                <OrgTreeNode :node="orgTreeData" :is-root="true" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="bomTreeDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handlePrintTree">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, defineComponent, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { useRouter } from 'vue-router'
import { 
  Search, Plus, Upload, Download, Printer, Refresh, 
  Document, CircleCheck, Warning, UploadFilled, Delete, Rank, RefreshRight, DocumentCopy,
  Setting, Operation, PriceTag, Money, Coin, User, Grid, Files, Folder, DataAnalysis, List
} from '@element-plus/icons-vue'
import SmartSelect from '@/components/SmartSelect.vue'
import { copyToClipboard, getCopyableColumnProps } from '@/utils/clipboard'
// 使用后端API服务
import materialApiService from '@/services/api/materialApiService'
import bomApiService from '@/services/api/bomApiService'
import bomDraftApiService from '@/services/api/bomDraftApiService'
import databaseService from '@/services/DatabaseService.js' // 仅用于数据迁移
import bomTreeStructureApi from '@/api/bomTreeStructure'
import productManualAPI from '@/api/productManual'
import listStyleBomApi from '@/api/listStyleProductionBom'

// 组织架构树节点组件
const OrgTreeNode = defineComponent({
  name: 'OrgTreeNode',
  props: {
    node: Object,
    isRoot: Boolean
  },
  setup(props) {
    return () => {
      if (!props.node) return null
      
      const hasChildren = props.node.children && props.node.children.length > 0
      
      return h('div', { class: 'org-tree-node' }, [
        // 子节点区域（在左侧）
        hasChildren && h('div', { class: 'org-tree-children' }, [
          h('div', { class: 'org-tree-children-list' }, 
            props.node.children.map((child, index) => 
              h('div', { 
                key: child.id,
                class: 'org-tree-child-wrapper'
              }, [
                h(OrgTreeNode, { node: child, isRoot: false })
              ])
            )
          )
        ]),
        
        // 当前节点卡片（在右侧）
        h('div', { class: 'org-tree-node-content' }, [
          h('div', { 
            class: [
              'org-node-card',
              props.isRoot ? 'root-node' : 'child-node',
              `level-${props.node.level}`
            ]
          }, [
            // 层级标识
            h('div', { class: 'node-level-badge' }, `L${props.node.level}`),
            
            // 节点信息
            h('div', { class: 'node-info-content' }, [
              h('div', { class: 'node-row' }, [
                h('span', { class: 'node-label' }, '编号：'),
                h('span', { class: 'node-value code' }, props.node.code)
              ]),
              h('div', { class: 'node-row' }, [
                h('span', { class: 'node-label' }, '名称：'),
                h('span', { class: 'node-value name' }, props.node.name)
              ]),
              h('div', { class: 'node-row' }, [
                h('span', { class: 'node-label' }, '用量：'),
                h('span', { class: 'node-value qty' }, props.node.standardQty)
              ]),
              props.node.outputProcess && h('div', { class: 'node-row' }, [
                h('span', { class: 'node-label' }, '工序：'),
                h('span', { class: 'node-value process' }, props.node.outputProcess)
              ])
            ])
          ])
        ])
      ])
    }
  }
})

// Router
const router = useRouter()

// 数据
const tableRef = ref(null)
const searchForm = ref({
  bomCode: '',
  productName: '',
  status: ''
})

const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const tableHeight = ref(600)
const loading = ref(false)
const editDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const importDialogVisible = ref(false)
const draftBoxVisible = ref(false)
const bomTreeDialogVisible = ref(false)
const currentBom = ref(null)
const isEdit = ref(false)
const isDraftMode = ref(false)

// 表单数据
const formData = ref({
  bomCode: '',
  bomName: '',
  productCode: '',
  productName: '',
  version: '',
  status: 'draft',
  designer: '',
  reviewer: '',
  itemCount: 1, // 默认值改为1
  effectiveDate: '',
  remark: '',
  totalLabor: '0.00', // 总人工
  totalMaterial: '0.00', // 总材料
  childItems: [] // 子件列表
})

// 统计数据
const stats = ref({
  total: 0,
  approved: 0,
  reviewing: 0
})

// 表格数据（从后端加载）
const tableData = ref([])

// 下一个BOM ID（后端自动生成）
const nextBomId = ref(1)

// 草稿列表
const draftList = ref([])
const nextDraftId = ref(1)

// BOM树结构数据
const bomTreeData = ref({})
const treeStructure = ref([])
const orgTreeData = ref(null)
const orgTreeContainer = ref(null)
const treeProps = {
  children: 'children',
  label: 'name'
}

// 子件选择的行
const selectedChildRows = ref([])

// 移动模式标识
const isMoving = ref(false)
const movingRow = ref(null)

// 本页设置：计算方式（默认：手动加载）
const calculationMode = ref('manual') // 'auto' | 'manual'
const settingsVisible = ref(false)

// 性能优化：焦点行记录
const focusedRow = ref(null)
const focusedField = ref(null)

// 子件表格分页
const childCurrentPage = ref(1)
const childPageSize = ref(20)

// 处理单元格焦点（仅记录，不处理）
const handleCellFocus = (row, field) => {
  focusedRow.value = row
  focusedField.value = field
}

// 物料列表（从产品物料库加载）
const materialList = ref([])

// 过滤后的子件物料列表（排除当前产品编码）
const filteredChildMaterialList = computed(() => {
  if (!formData.value.productCode) {
    return materialList.value
  }
  // 过滤掉当前产品编码
  return materialList.value.filter(m => m.materialCode !== formData.value.productCode)
})

// 计算属性：分页后的子件数据
const paginatedChildItems = computed(() => {
  if (!formData.value.childItems || formData.value.childItems.length === 0) {
    return []
  }
  const start = (childCurrentPage.value - 1) * childPageSize.value
  const end = start + childPageSize.value
  return formData.value.childItems.slice(start, end)
})

// 计算属性：子件总数
const childTotalCount = computed(() => {
  return formData.value.childItems ? formData.value.childItems.length : 0
})

// 计算属性
const hasSelection = computed(() => selectedRows.value.length > 0)
const isSingleSelection = computed(() => selectedRows.value.length === 1)

const filteredTableData = computed(() => {
  let data = tableData.value
  
  if (searchForm.value.bomCode) {
    data = data.filter(item => 
      item.bomCode && item.bomCode.toLowerCase().includes(searchForm.value.bomCode.toLowerCase())
    )
  }
  if (searchForm.value.productName) {
    data = data.filter(item => 
      item.productName && item.productName.toLowerCase().includes(searchForm.value.productName.toLowerCase())
    )
  }
  if (searchForm.value.status) {
    data = data.filter(item => item.status === searchForm.value.status)
  }
  
  totalCount.value = data.length
  return data
})

const dialogTitle = computed(() => isEdit.value ? '编辑生产BOM' : '新增生产BOM')

// 更新统计数据
const updateStats = () => {
  stats.value.total = tableData.value.length
  stats.value.approved = tableData.value.filter(p => p.status === 'approved').length
  stats.value.reviewing = tableData.value.filter(p => p.status === 'reviewing').length
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    bomCode: '',
    productName: '',
    status: ''
  }
  handleSearch()
}

// 取消编辑（提示用户确认）
const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('是否放弃当前编辑的内容？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '继续编辑',
      type: 'warning'
    })
    editDialogVisible.value = false
  } catch {
    // 用户取消，继续编辑
  }
}

// 生成列表式BOM
const handleGenerateListStyleBom = async () => {
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条生产BOM数据')
    return
  }
  
  const selectedBom = selectedRows.value[0]
  
  try {
    loading.value = true
    console.log(`🔧 开始从生产BOM ${selectedBom.id} 生成列表式BOM（检查模式）`)
    
    // 先检查是否有冲突
    const checkResult = await listStyleBomApi.generateFromProductionBom(selectedBom.id, 'check')
    
    if (checkResult.hasConflict || checkResult.hasDuplicate) {
      // 存在冲突或重复，显示详细信息
      loading.value = false
      
      let message = '<div style="max-height: 400px; overflow-y: auto;">'
      
      if (checkResult.hasDuplicate && checkResult.duplicates.length > 0) {
        message += '<p style="color: #909399; font-weight: bold;">✅ 以下父件已存在相同的BOM结构，将跳过：</p><ul>'
        checkResult.duplicates.forEach(dup => {
          message += `<li>${dup.parentCode} (${dup.parentName}) - 已存在: ${dup.existingBomCode}</li>`
        })
        message += '</ul>'
      }
      
      if (checkResult.hasConflict && checkResult.conflicts.length > 0) {
        message += '<p style="color: #E6A23C; font-weight: bold; margin-top: 16px;">⚠️ 以下父件存在不同的BOM结构：</p>'
        checkResult.conflicts.forEach(conf => {
          message += `<div style="margin: 12px 0; padding: 12px; background: #FDF6EC; border-radius: 4px;">`
          message += `<p style="font-weight: bold;">${conf.parentCode} (${conf.parentName})</p>`
          message += `<p style="font-size: 12px; color: #606266;">目标表格已有BOM: ${conf.existingBomCodes.join(', ')}</p>`
          message += `<p style="font-size: 12px; color: #606266; margin-top: 8px;">当前要推送的子件: ${conf.currentChildren.map(c => c.code).join(', ')}</p>`
          message += `</div>`
        })
      }
      
      message += '</div>'
      
      // 显示决策弹窗
      ElMessageBox.confirm(
        message,
        '检测到BOM结构差异',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '覆盖',
          cancelButtonText: '取消',
          distinguishCancelAndClose: true,
          showCancelButton: true,
          showClose: true,
          type: 'warning',
          customClass: 'conflict-message-box',
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              // 覆盖模式
              handleGenerateWithMode(selectedBom.id, 'replace')
              done()
            } else if (action === 'cancel') {
              done()
            } else {
              done()
            }
          }
        }
      ).then(() => {
        // 用户点击确定按钮，已在beforeClose中处理
      }).catch(action => {
        if (action === 'cancel') {
          ElMessage.info('已取消操作')
        }
      })
      
    } else {
      // 无冲突，直接生成
      ElNotification({
        title: '生成成功',
        message: checkResult.message || `已成功生成${checkResult.count}条列表式BOM记录`,
        type: 'success',
        duration: 3000
      })
      loading.value = false
    }
    
  } catch (error) {
    console.error('生成列表式BOM失败:', error)
    ElMessage.error('生成列表式BOM失败: ' + (error.message || '未知错误'))
    loading.value = false
  }
}

// 按指定模式生成
const handleGenerateWithMode = async (bomId, mode) => {
  try {
    loading.value = true
    console.log(`🔧 开始从生产BOM ${bomId} 生成列表式BOM（${mode}模式）`)
    
    const result = await listStyleBomApi.generateFromProductionBom(bomId, mode)
    
    ElNotification({
      title: '生成成功',
      message: result.message || `已成功生成${result.count}条列表式BOM记录`,
      type: 'success',
      duration: 3000
    })
    
  } catch (error) {
    console.error('生成列表式BOM失败:', error)
    ElMessage.error('生成列表式BOM失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 产品编码变化时，自动填充产品名称和产出工序
const handleProductCodeChange = (value) => {
  if (!value) {
    return
  }
  
  // 根据产品编码查找对应的物料
  const material = materialList.value.find(m => m.materialCode === value)
  if (material) {
    formData.value.productName = material.materialName
    formData.value.outputProcess = material.processName || '' // 填充产出工序（来自物料库的process_name字段）
    console.log(`产品编码 ${value} lookup产出工序: ${formData.value.outputProcess}`)
    ElMessage.success('已自动填充产品名称和产出工序')
  } else {
    console.warn(`未找到产品编码: ${value}`)
  }
}

// 产品名称变化时，自动填充产品编码
const handleProductNameChange = (value) => {
  if (!value) {
    return
  }
  
  // 根据产品名称查找对应的物料
  const material = materialList.value.find(m => m.materialName === value)
  if (material) {
    formData.value.productCode = material.materialCode
    ElMessage.success('已自动填充产品编码')
  }
}

// 计算层阶地址
// 根据层阶和父子关系计算地址，格式为 1.1.1.1 ...
const calculateLevelPath = (item, allItems) => {
  const level = parseInt(item.level) || 1
  
  if (level === 1) {
    // 层阶1：根据顺序编号
    const level1Items = allItems.filter(i => parseInt(i.level || 1) === 1)
    const index = level1Items.findIndex(i => i.id === item.id)
    return String(index + 1)
  } else {
    // 层阶2及以上：查找父件
    const currentIndex = allItems.findIndex(i => i.id === item.id)
    if (currentIndex === -1) return ''
    
    // 向上查找父件（第一个层阶比当前小1的）
    let parentItem = null
    let parentIndex = -1
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevLevel = parseInt(allItems[i].level || 1)
      if (prevLevel === level - 1) {
        parentItem = allItems[i]
        parentIndex = i
        break
      }
    }
    
    if (!parentItem) return ''
    
    // 计算父件地址（递归）
    const parentPath = parentItem.levelPath || calculateLevelPath(parentItem, allItems)
    
    // 计算当前在同级同父中的序号
    let siblingIndex = 1
    for (let i = parentIndex + 1; i < currentIndex; i++) {
      const itemLevel = parseInt(allItems[i].level || 1)
      if (itemLevel === level) {
        // 检查是否与当前项同父
        let isSameParent = false
        for (let j = i - 1; j >= 0; j--) {
          const prevLevel = parseInt(allItems[j].level || 1)
          if (prevLevel === level - 1) {
            isSameParent = (allItems[j].id === parentItem.id)
            break
          }
        }
        if (isSameParent) {
          siblingIndex++
        }
      }
    }
    
    return `${parentPath}.${siblingIndex}`
  }
}

// 更新单个项的层阶地址
const updateLevelPath = (item) => {
  if (!item || !formData.value.childItems) return
  
  const allItems = formData.value.childItems
  item.levelPath = calculateLevelPath(item, allItems)
  
  // 更新所有下级的层阶地址
  recalculateAllLevelPaths()
}

// 重新计算所有层阶地址
const recalculateAllLevelPaths = () => {
  if (!formData.value.childItems || formData.value.childItems.length === 0) return
  
  const allItems = formData.value.childItems
  
  // 按顺序重新计算每一项的地址
  allItems.forEach(item => {
    item.levelPath = calculateLevelPath(item, allItems)
  })
}

// 计算层阶1的顺序编号
const getLevel1Sequence = (item, allItems) => {
  const level1Items = allItems.filter(i => parseInt(i.level || 1) === 1)
  const index = level1Items.findIndex(i => i.id === item.id)
  return index + 1
}

// 添加子件
const handleAddChild = () => {
  const newItem = {
    id: `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 唯一ID
    level: '1',
    levelPath: '', // 将在下面计算
    childCode: '',
    childName: '',
    standardQty: 1,
    outputProcess: '',
    source: '',
    processWage: 0,
    materialLoss: 0,
    materialPrice: 0,
    indent: 0, // 缩进层级
    // 需求2+5：自动填充后道字段
    nextProcessName: formData.value.outputProcess || '', // 父件.产出工序
    nextProductCode: formData.value.productCode || '', // 父件.产出编号
    nextProductName: formData.value.productName || '', // 父件.产出名称
    nextStandardQty: 1, // 固定值1
    nextLevelAddress: '0' // 需求5：固定值0
  }
  
  formData.value.childItems.push(newItem)
  
  // 计算层阶地址
  nextTick(() => {
    recalculateAllLevelPaths()
  })
}

// 删除子件
const handleDeleteChild = (index) => {
  formData.value.childItems.splice(index, 1)
}

// 子件选择变化
const handleChildSelectionChange = (selection) => {
  selectedChildRows.value = selection
}

// 获取行的class name（用于缩进显示）
const getRowClassName = ({ row }) => {
  return row.indent ? `indent-level-${row.indent}` : ''
}

// 增加下层（表格上方按钮）
const handleAddChildLevel = () => {
  if (selectedChildRows.value.length === 0) {
    ElMessage.warning('请先选择一行')
    return
  }
  
  const selectedRow = selectedChildRows.value[0]
  const index = formData.value.childItems.findIndex(item => item === selectedRow)
  
  if (index !== -1) {
    handleAddChildLevelForRow(selectedRow, index)
  }
}

// 增加下层（行内按钮）
const handleAddChildLevelForRow = (row, index) => {
  const currentIndent = row.indent || 0
  const currentLevel = parseInt(row.level) || 1
  
  // 计算在完整列表中的实际索引（而不是分页后的索引）
  const actualIndex = formData.value.childItems.findIndex(item => item.id === row.id)
  
  if (actualIndex === -1) {
    ElMessage.error('找不到当前行数据')
    return
  }
  
  const newItem = {
    id: `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 唯一ID
    level: String(currentLevel + 1),
    levelPath: '', // 将在下面计算
    childCode: '',
    childName: '',
    standardQty: 1,
    outputProcess: '',
    source: '',
    processWage: 0,
    materialLoss: 0,
    materialPrice: 0,
    indent: currentIndent + 1,
    // 需求3+6：自动填充后道字段
    nextProcessName: row.outputProcess || '', // 当前行.产出工序
    nextProductCode: row.childCode || '', // 当前行.子件编号
    nextProductName: row.childName || '', // 当前行.子件名称
    nextStandardQty: row.standardQty || 1, // 当前行.0阶标准用量
    nextLevelAddress: row.levelPath || '', // 需求6：当前行.层阶地址
    parentIndex: actualIndex // 记录父级在完整列表中的索引
  }
  
  // 在完整列表中插入新行
  formData.value.childItems.splice(actualIndex + 1, 0, newItem)
  
  // 计算层阶地址
  nextTick(() => {
    recalculateAllLevelPaths()
    
    // 计算新行应该在哪一页
    const newRowIndex = actualIndex + 1
    const targetPage = Math.floor(newRowIndex / childPageSize.value) + 1
    
    // 如果新行不在当前页，跳转到目标页
    if (targetPage !== childCurrentPage.value) {
      childCurrentPage.value = targetPage
      ElMessage.success(`已添加下层子件，已跳转到第${targetPage}页`)
    } else {
      ElMessage.success('已添加下层子件')
    }
  })
}

// 删除本层（表格上方按钮）
const handleDeleteCurrentLevel = async () => {
  if (selectedChildRows.value.length === 0) {
    ElMessage.warning('请先选择一行')
    return
  }
  
  try {
    await ElMessageBox.confirm('删除本层将同时删除该层及其所有下层子件，确定继续吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const selectedRow = selectedChildRows.value[0]
    const index = formData.value.childItems.findIndex(item => item === selectedRow)
    
    if (index !== -1) {
      handleDeleteCurrentLevelForRow(selectedRow, index)
    }
  } catch {
    // 用户取消
  }
}

// 删除本层（行内按钮）
const handleDeleteCurrentLevelForRow = async (row, index) => {
  try {
    await ElMessageBox.confirm('删除本层将同时删除该层及其所有下层子件，确定继续吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const currentIndent = row.indent || 0
    const itemsToDelete = []
    
    // 查找当前行及其所有下层
    itemsToDelete.push(index)
    for (let i = index + 1; i < formData.value.childItems.length; i++) {
      const nextIndent = formData.value.childItems[i].indent || 0
      if (nextIndent > currentIndent) {
        itemsToDelete.push(i)
      } else {
        break
      }
    }
    
    // 倒序删除（避免索引问题）
    itemsToDelete.reverse().forEach(idx => {
      formData.value.childItems.splice(idx, 1)
    })
    
    ElMessage.success(`已删除本层及 ${itemsToDelete.length - 1} 个下层子件`)
  } catch {
    // 用户取消
  }
}

// 删除下层（表格上方按钮）
const handleDeleteChildLevel = async () => {
  if (selectedChildRows.value.length === 0) {
    ElMessage.warning('请先选择一行')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定删除该层以下的所有子件吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const selectedRow = selectedChildRows.value[0]
    const index = formData.value.childItems.findIndex(item => item === selectedRow)
    
    if (index !== -1) {
      handleDeleteChildLevelForRow(selectedRow, index)
    }
  } catch {
    // 用户取消
  }
}

// 删除下层（行内按钮）
const handleDeleteChildLevelForRow = async (row, index) => {
  try {
    await ElMessageBox.confirm('确定删除该层以下的所有子件吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const currentIndent = row.indent || 0
    const itemsToDelete = []
    
    // 查找所有下层（不包括当前行）
    for (let i = index + 1; i < formData.value.childItems.length; i++) {
      const nextIndent = formData.value.childItems[i].indent || 0
      if (nextIndent > currentIndent) {
        itemsToDelete.push(i)
      } else {
        break
      }
    }
    
    if (itemsToDelete.length === 0) {
      ElMessage.info('该层没有下层子件')
      return
    }
    
    // 倒序删除（避免索引问题）
    itemsToDelete.reverse().forEach(idx => {
      formData.value.childItems.splice(idx, 1)
    })
    
    ElMessage.success(`已删除 ${itemsToDelete.length} 个下层子件`)
  } catch {
    // 用户取消
  }
}

// 开始移动
const handleMoveToStart = () => {
  if (selectedChildRows.value.length === 0) {
    ElMessage.warning('请先选择一行')
    return
  }
  
  isMoving.value = true
  movingRow.value = selectedChildRows.value[0]
  ElMessage.info('请点击目标位置完成移动（点击表格外取消）')
}

// 执行移动（需要在表格上添加点击事件）
const handleMoveTo = (targetRow, targetIndex) => {
  if (!isMoving.value || !movingRow.value) {
    return
  }
  
  const sourceIndex = formData.value.childItems.findIndex(item => item === movingRow.value)
  
  if (sourceIndex === -1 || sourceIndex === targetIndex) {
    isMoving.value = false
    movingRow.value = null
    return
  }
  
  // 移除源行
  const [movedItem] = formData.value.childItems.splice(sourceIndex, 1)
  
  // 插入到目标位置的下一层
  const targetIndent = (targetRow.indent || 0) + 1
  movedItem.indent = targetIndent
  movedItem.level = String((parseInt(targetRow.level) || 1) + 1)
  
  // 重新计算目标索引（因为删除可能影响索引）
  const newTargetIndex = formData.value.childItems.findIndex(item => item === targetRow)
  formData.value.childItems.splice(newTargetIndex + 1, 0, movedItem)
  
  isMoving.value = false
  movingRow.value = null
  ElMessage.success('移动成功')
}

// 行点击事件（用于移动操作）
const handleRowClick = (row, column, event) => {
  if (isMoving.value && movingRow.value) {
    const targetIndex = formData.value.childItems.findIndex(item => item === row)
    handleMoveTo(row, targetIndex)
  }
}

// 子件编码变化时，自动填充子件名称和其他字段（数据流水线）
const handleChildCodeChange = (value, row) => {
  if (!value) {
    return
  }
  
  const material = materialList.value.find(m => m.materialCode === value)
  if (material) {
    // 自动填充子件名称
    row.childName = material.materialName
    
    // 数据流水线：从物料库自动填充其他字段
    // 产出工序 = 物料库的产出工序名称，如果为空则默认为“采购”
    row.outputProcess = material.processName || '采购'
    
    // 子件来源 = 物料库的来源（取第一个）
    if (material.source && Array.isArray(material.source) && material.source.length > 0) {
      row.source = material.source[0] // 取来源数组的第一个值
    }
    
    // 工序工资 = 物料库的工序单价
    if (material.processPrice) {
      row.processWage = material.processPrice
    }
    
    // 材料损耗 = 物料库的材料损耗（如果有）
    if (material.materialLoss !== undefined && material.materialLoss !== null) {
      row.materialLoss = material.materialLoss
    }
    
    // 材料单价 = 物料库的基础单价
    if (material.basePrice !== undefined && material.basePrice !== null) {
      row.materialPrice = material.basePrice
    }
    
    console.log('数据流水线自动填充:', {
      childCode: value,
      childName: row.childName,
      outputProcess: row.outputProcess,
      source: row.source,
      processWage: row.processWage,
      materialLoss: row.materialLoss,
      materialPrice: row.materialPrice
    })
    
    ElMessage.success('已自动填充子件信息（材料单价使用基础单价）')
  }
}

// 子件名称变化时，自动填充子件编码和其他字段（数据流水线）
const handleChildNameChange = (value, row) => {
  if (!value) {
    return
  }
  
  const material = materialList.value.find(m => m.materialName === value)
  if (material) {
    // 自动填充子件编码
    row.childCode = material.materialCode
    
    // 数据流水线：从物料库自动填充其他字段
    // 产出工序 = 物料库的产出工序名称，如果为空则默认为“采购”
    row.outputProcess = material.processName || '采购'
    
    // 子件来源 = 物料库的来源（取第一个）
    if (material.source && Array.isArray(material.source) && material.source.length > 0) {
      row.source = material.source[0] // 取来源数组的第一个值
    }
    
    // 工序工资 = 物料库的工序单价
    if (material.processPrice) {
      row.processWage = material.processPrice
    }
    
    // 材料损耗 = 物料库的材料损耗（如果有）
    if (material.materialLoss !== undefined && material.materialLoss !== null) {
      row.materialLoss = material.materialLoss
    }
    
    // 材料单价 = 物料库的基础单价
    if (material.basePrice !== undefined && material.basePrice !== null) {
      row.materialPrice = material.basePrice
    }
    
    console.log('数据流水线自动填充:', {
      childCode: row.childCode,
      childName: value,
      outputProcess: row.outputProcess,
      source: row.source,
      processWage: row.processWage,
      materialLoss: row.materialLoss,
      materialPrice: row.materialPrice
    })
    
    ElMessage.success('已自动填充子件信息（材料单价使用基础单价）')
  }
}

// 重新加载工序名称
const handleReloadProcessNames = () => {
  if (!formData.value.childItems || formData.value.childItems.length === 0) {
    ElMessage.warning('暂无子件数据')
    return
  }
  
  let updatedCount = 0
  
  formData.value.childItems.forEach(row => {
    if (!row.childCode) return
    
    // 查找对应的物料信息
    const material = materialList.value.find(m => m.materialCode === row.childCode)
    if (material) {
      // 重新计算产出工序：如果为空或者物料库有值，则更新
      const newProcessName = material.processName || '采购'
      
      // 如果产出工序为空或者不同，则更新
      if (!row.outputProcess || row.outputProcess !== newProcessName) {
        row.outputProcess = newProcessName
        updatedCount++
      }
    } else {
      // 没有找到对应物料，默认为“采购”
      if (!row.outputProcess) {
        row.outputProcess = '采购'
        updatedCount++
      }
    }
  })
  
  if (updatedCount > 0) {
    ElMessage.success(`已重新加载 ${updatedCount} 条工序名称`)
  } else {
    ElMessage.info('所有工序名称已是最新')
  }
}

// 计算材料费用（新公式：0层阶用量 * 材料单价）
// 注：手动模式下不实时计算，只显示已存储的值
const calculateMaterialCost = (row) => {
  // 手动模式下，返回已存储的值
  if (calculationMode.value === 'manual') {
    return row.materialCost !== undefined ? parseFloat(row.materialCost).toFixed(2) : '0.00'
  }
  
  // 自动模式下，实时计算
  const level0Qty = parseFloat(calculateLevel0Qty(row)) || 0
  const materialPrice = row.materialPrice || 0
  
  if (!level0Qty || !materialPrice) {
    return '0.00'
  }
  
  const cost = level0Qty * materialPrice
  return cost.toFixed(2)
}

// 计算0层阶标准用量（优化版：减少计算次数）
// 注：手动模式下不实时计算，只显示已存储的值
const calculateLevel0Qty = (row) => {
  // 手动模式下，返回已存储的值
  if (calculationMode.value === 'manual') {
    return row.level0Qty !== undefined ? parseFloat(row.level0Qty).toFixed(4) : '0.0000'
  }
  
  // 自动模式下，实时计算
  const level = parseInt(row.level) || 1
  const standardQty = row.standardQty || 0
  const materialLoss = row.materialLoss || 0
  
  // 当前行的用量（含损耗）
  const qtyWithLoss = standardQty * (1 + materialLoss / 100)
  
  if (level === 1) {
    // 层阶=1，直接返回
    return qtyWithLoss.toFixed(4)
  }
  
  // 层阶>1，使用缓存的父级索引
  if (row.parentIndex !== undefined && row.parentIndex !== null) {
    const parentRow = formData.value.childItems[row.parentIndex]
    if (parentRow) {
      const parentLevel0Qty = parseFloat(calculateLevel0Qty(parentRow)) || 0
      return (qtyWithLoss * parentLevel0Qty).toFixed(4)
    }
  }
  
  return qtyWithLoss.toFixed(4)
}

// 计算0阶人工
// 注：手动模式下不实时计算，只显示已存储的值
const calculateLevel0Labor = (row) => {
  // 手动模式下，返回已存储的值
  if (calculationMode.value === 'manual') {
    return row.level0Labor !== undefined ? parseFloat(row.level0Labor).toFixed(2) : '0.00'
  }
  
  // 自动模式下，实时计算
  const level0Qty = parseFloat(calculateLevel0Qty(row)) || 0
  const processWage = row.processWage || 0
  
  if (!level0Qty || !processWage) {
    return '0.00'
  }
  
  const labor = level0Qty * processWage
  return labor.toFixed(2)
}

// 计算总人工（按钮触发，不实时计算）
const handleCalculateLabor = () => {
  if (!formData.value.childItems || formData.value.childItems.length === 0) {
    formData.value.totalLabor = '0.00'
    ElMessage.info('暂无子件数据')
    return
  }
  
  let total = 0
  for (const row of formData.value.childItems) {
    const level0Qty = parseFloat(calculateLevel0Qty(row)) || 0
    const processWage = row.processWage || 0
    total += level0Qty * processWage
  }
  
  formData.value.totalLabor = total.toFixed(2)
  ElMessage.success(`计算完成，总人工费用：${formData.value.totalLabor}元`)
}

// 计算总材料（按钮触发，不实时计算）
const handleCalculateMaterial = () => {
  if (!formData.value.childItems || formData.value.childItems.length === 0) {
    formData.value.totalMaterial = '0.00'
    ElMessage.info('暂无子件数据')
    return
  }
  
  let total = 0
  for (const row of formData.value.childItems) {
    const level0Qty = parseFloat(calculateLevel0Qty(row)) || 0
    const materialPrice = row.materialPrice || 0
    total += level0Qty * materialPrice
  }
  
  formData.value.totalMaterial = total.toFixed(2)
  ElMessage.success(`计算完成，总材料费用：${formData.value.totalMaterial}元`)
}

// ====================
// 手动加载功能：以下功能用于手动模式
// ====================

// 计算0层阶标准用量（手动加载）
const handleCalculateLevel0Qty = () => {
  if (!formData.value.childItems || formData.value.childItems.length === 0) {
    ElMessage.warning('暂无子件数据')
    return
  }
  
  let count = 0
  for (const row of formData.value.childItems) {
    const level = parseInt(row.level) || 1
    const standardQty = row.standardQty || 0
    const materialLoss = row.materialLoss || 0
    
    // 当前行的用量（含损耗）
    const qtyWithLoss = standardQty * (1 + materialLoss / 100)
    
    if (level === 1) {
      row.level0Qty = qtyWithLoss
    } else {
      // 层阶>1，使用父级索引
      if (row.parentIndex !== undefined && row.parentIndex !== null) {
        const parentRow = formData.value.childItems[row.parentIndex]
        if (parentRow && parentRow.level0Qty !== undefined) {
          row.level0Qty = qtyWithLoss * parentRow.level0Qty
        } else {
          row.level0Qty = qtyWithLoss
        }
      } else {
        row.level0Qty = qtyWithLoss
      }
    }
    count++
  }
  
  ElMessage.success(`已计算 ${count} 条子件的0层阶标准用量`)
}

// 加载材料费用（手动加载）
const handleLoadMaterialCost = () => {
  if (!formData.value.childItems || formData.value.childItems.length === 0) {
    ElMessage.warning('暂无子件数据')
    return
  }
  
  let count = 0
  for (const row of formData.value.childItems) {
    const level0Qty = row.level0Qty || 0
    const materialPrice = row.materialPrice || 0
    row.materialCost = level0Qty * materialPrice
    if (row.materialCost > 0) count++
  }
  
  ElMessage.success(`已加载 ${count} 条子件的材料费用`)
}

// 加载工序工资（手动加载）
const handleLoadProcessWage = () => {
  if (!formData.value.childItems || formData.value.childItems.length === 0) {
    ElMessage.warning('暂无子件数据')
    return
  }
  
  let count = 0
  for (const row of formData.value.childItems) {
    // 从物料库加载工序工资（工序单价）
    const material = materialList.value.find(m => m.materialCode === row.childCode)
    if (material && material.processPrice) {
      row.processWage = material.processPrice
      count++
    }
  }
  
  ElMessage.success(`已加载 ${count} 条子件的工序工资`)
}

// 加载材料单价（手动加载）- 强制重新计算覆盖当前值
const handleLoadMaterialPrice = () => {
  if (!formData.value.childItems || formData.value.childItems.length === 0) {
    ElMessage.warning('暂无子件数据')
    return
  }
  
  // 检查计算方式
  if (calculationMode.value !== 'manual') {
    ElMessage.warning('请先在【本页设置】中将计算方式设置为【手动加载】')
    return
  }
  
  let successCount = 0
  let noMaterialCount = 0
  let updatedCount = 0
  let noChangeCount = 0
  
  // 遍历所有子件，强制重新计算材料单价
  for (const row of formData.value.childItems) {
    if (!row.childCode) {
      continue
    }
    
    // 从物料库查找对应物料
    const material = materialList.value.find(m => m.materialCode === row.childCode)
    
    if (!material) {
      noMaterialCount++
      continue
    }
    
    // 检查基础单价是否存在
    if (material.basePrice === undefined || material.basePrice === null) {
      noMaterialCount++
      continue
    }
    
    // 记录旧值
    const oldPrice = row.materialPrice || 0
    const newPrice = material.basePrice
    
    // 强制更新为基础单价（无论当前值是什么）
    row.materialPrice = newPrice
    
    if (Math.abs(oldPrice - newPrice) > 0.01) {
      updatedCount++  // 值发生变化
    } else {
      noChangeCount++ // 值未变化
    }
    
    successCount++
  }
  
  // 显示详细的加载结果
  const messages = []
  messages.push(`✅ 成功加载：${successCount} 条`)
  if (updatedCount > 0) {
    messages.push(`🔄 值已更新：${updatedCount} 条`)
  }
  if (noChangeCount > 0) {
    messages.push(`✔️ 值未变化：${noChangeCount} 条`)
  }
  if (noMaterialCount > 0) {
    messages.push(`⚠️ 无物料数据：${noMaterialCount} 条`)
  }
  
  ElMessage.success({
    message: `材料单价加载完成（基础单价）\n${messages.join('\n')}`,
    duration: 5000,
    dangerouslyUseHTMLString: true
  })
}

// 加载0阶人工（手动加载）
const handleLoadLevel0Labor = () => {
  if (!formData.value.childItems || formData.value.childItems.length === 0) {
    ElMessage.warning('暂无子件数据')
    return
  }
  
  let count = 0
  for (const row of formData.value.childItems) {
    const level0Qty = row.level0Qty || 0
    const processWage = row.processWage || 0
    row.level0Labor = level0Qty * processWage
    if (row.level0Labor > 0) count++
  }
  
  ElMessage.success(`已加载 ${count} 条子件的0阶人工`)
}

// 新增BOM
const handleCreate = () => {
  isEdit.value = false
  // 生成唯一的BOM编号（使用时间戳）
  const timestamp = Date.now()
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  formData.value = {
    bomCode: `PBOM-${new Date().getFullYear()}-${timestamp}-${randomNum}`,
    bomName: '',
    productCode: '',
    productName: '',
    outputProcess: '', // 产出工序
    version: 'V1.0',
    status: 'draft',
    designer: '',
    reviewer: '',
    itemCount: 1, // 默认值改为1
    effectiveDate: '',
    remark: '',
    totalLabor: '0.00',
    totalMaterial: '0.00',
    childItems: [] // 初始化子件列表
  }
  editDialogVisible.value = true
}

// 编辑BOM（优化：浅拷贝，不重算层阶地址）
const handleEdit = async (row) => {
  try {
    isEdit.value = true
    currentBom.value = row // 直接引用
    
    // 从后端加载完整数据（包含子件）
    const bomDetail = await bomApiService.getBomDetail(row.id)
    
    console.log('✏️ 编辑BOM - API返回数据:', {
      id: bomDetail.id,
      productCode: bomDetail.productCode,
      productName: bomDetail.productName,
      childItemsCount: bomDetail.childItems?.length || 0,
      childItems: bomDetail.childItems
    })
    
    // 只拷贝顶层属性，childItems保持引用
    formData.value = {
      ...bomDetail,
      childItems: bomDetail.childItems || []
    }
    
    console.log('✏️ 编辑BOM - formData赋值后:', {
      productCode: formData.value.productCode,
      productName: formData.value.productName,
      childItemsCount: formData.value.childItems?.length || 0
    })
    
    // ⚡ 性能优化：不重新计算层阶地址，使用数据库已保存的levelPath
    // 数据库中的levelPath已经是正确的，无需重新计算
    // recalculateAllLevelPaths() // ❌ 移除这个调用，避免递归计算卡顿
    
    editDialogVisible.value = true
  } catch (error) {
    console.error('加载BOM数据失败:', error)
    ElMessage.error('加载BOM数据失败: ' + error.message)
  }
}

// 查看BOM
const handleView = async (row) => {
  try {
    // 从后端加载完整数据（包含子件）
    const bomDetail = await bomApiService.getBomDetail(row.id)
    console.log('🔍 查看BOM - API返回数据:', {
      id: bomDetail.id,
      productCode: bomDetail.productCode,
      productName: bomDetail.productName,
      childItemsCount: bomDetail.childItems?.length || 0,
      childItems: bomDetail.childItems
    })
    
    currentBom.value = bomDetail
    
    console.log('🔍 查看BOM - currentBom赋值后:', {
      id: currentBom.value.id,
      productCode: currentBom.value.productCode,
      productName: currentBom.value.productName,
      childItemsCount: currentBom.value.childItems?.length || 0
    })
    
    // 计算层阶地址
    if (currentBom.value.childItems && currentBom.value.childItems.length > 0) {
      currentBom.value.childItems.forEach(item => {
        item.levelPath = calculateLevelPath(item, currentBom.value.childItems)
      })
    }
    
    // 计算总人工和总材料（如果没有值）
    if (!currentBom.value.totalLabor || currentBom.value.totalLabor === '0.00') {
      let totalLabor = 0
      if (currentBom.value.childItems && currentBom.value.childItems.length > 0) {
        currentBom.value.childItems.forEach(item => {
          const level0Labor = parseFloat(calculateLevel0Labor(item)) || 0
          totalLabor += level0Labor
        })
      }
      currentBom.value.totalLabor = totalLabor.toFixed(2)
    }
    
    if (!currentBom.value.totalMaterial || currentBom.value.totalMaterial === '0.00') {
      let totalMaterial = 0
      if (currentBom.value.childItems && currentBom.value.childItems.length > 0) {
        currentBom.value.childItems.forEach(item => {
          const materialCost = parseFloat(calculateMaterialCost(item)) || 0
          totalMaterial += materialCost
        })
      }
      currentBom.value.totalMaterial = totalMaterial.toFixed(2)
    }
    
    viewDialogVisible.value = true
  } catch (error) {
    console.error('加载BOM详情失败:', error)
    ElMessage.error('加载BOM详情失败: ' + error.message)
  }
}

// 删除BOM
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除BOM"${row.bomName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 先从后端数据库删除
    await bomApiService.deleteBom(row.id)
    
    // 后端删除成功后，再从前端数组删除
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
    }
    
    updateStats()
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除BOM失败:', error)
      ElMessage.error('删除BOM失败: ' + error.message)
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个BOM吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const deleteIds = selectedRows.value.map(row => row.id)
    
    // 先从后端数据库批量删除
    await bomApiService.deleteBoms(deleteIds)
    
    // 后端删除成功后，再从前端数组删除
    tableData.value = tableData.value.filter(row => !deleteIds.includes(row.id))
    selectedRows.value = []
    
    updateStats()
    ElMessage.success('批量删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除BOM失败:', error)
      ElMessage.error('批量删除BOM失败: ' + error.message)
    }
  }
}

// 保存（保存到主表格，不关闭对话框）
const handleSave = async () => {
  try {
    // 确保有bomCode
    if (!formData.value.bomCode) {
      const timestamp = Date.now()
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      formData.value.bomCode = `PBOM-${new Date().getFullYear()}-${timestamp}-${randomNum}`
    }
    
    if (isDraftMode.value) {
      // 从草稿箱提交到主表格
      if (isEdit.value) {
        const index = tableData.value.findIndex(p => p.id === currentBom.value.id)
        if (index !== -1) {
          tableData.value[index] = {
            ...formData.value,
            id: currentBom.value.id,
            updateTime: new Date().toLocaleString('zh-CN')
          }
          await bomApiService.saveBom(tableData.value[index])
        }
        ElMessage.success('BOM更新成功')
      } else {
        const newBom = {
          ...formData.value,
          status: 'draft',
          createTime: new Date().toLocaleString('zh-CN'),
          updateTime: new Date().toLocaleString('zh-CN')
        }
        const savedBom = await bomApiService.saveBom(newBom)
        tableData.value.unshift({ ...newBom, id: savedBom.id })
        nextBomId.value++
        ElMessage.success('BOM创建成功')
      }
      
      // 从草稿箱删除
      if (currentBom.value && currentBom.value.draftId) {
        const draftIndex = draftList.value.findIndex(d => d.draftId === currentBom.value.draftId)
        if (draftIndex !== -1) {
          draftList.value.splice(draftIndex, 1)
          await databaseService.deleteBom(currentBom.value.draftId, 'productionBomDrafts')
        }
      }
      
      isDraftMode.value = false
    } else {
      // 正常保存逻辑
      if (isEdit.value) {
        const index = tableData.value.findIndex(p => p.id === currentBom.value.id)
        if (index !== -1) {
          tableData.value[index] = {
            ...formData.value,
            id: currentBom.value.id,
            updateTime: new Date().toLocaleString('zh-CN')
          }
          await bomApiService.saveBom(tableData.value[index])
        }
        ElMessage.success('BOM更新成功')
      } else {
        const newBom = {
          ...formData.value,
          createTime: new Date().toLocaleString('zh-CN'),
          updateTime: new Date().toLocaleString('zh-CN')
        }
        const savedBom = await bomApiService.saveBom(newBom)
        tableData.value.unshift({ ...newBom, id: savedBom.id })
        // 更新当前BOM和formData的id，以便下次保存时是更新而不是新建
        currentBom.value = { ...newBom, id: savedBom.id }
        formData.value.id = savedBom.id
        isEdit.value = true // 标记为编辑模式
        nextBomId.value++
        ElMessage.success('BOM创建成功')
      }
    }
    
    // 不关闭对话框
    updateStats()
  } catch (error) {
    console.error('保存BOM失败:', error)
    ElMessage.error('保存BOM失败: ' + error.message)
  }
}

// 提交（保存到主表格并关闭对话框）
const handleSubmit = async () => {
  try {
    // 表单验证
    if (!formData.value.productCode) {
      ElMessage.warning('请输入产品编号')
      return
    }
    
    if (!formData.value.productName) {
      ElMessage.warning('请输入产品名称')
      return
    }
    
    if (!formData.value.bomName) {
      ElMessage.warning('请输入BOM名称')
      return
    }
    
    // 子件验证
    if (formData.value.childItems && formData.value.childItems.length > 0) {
      for (const child of formData.value.childItems) {
        if (!child.childCode) {
          ElMessage.warning('子件编码不能为空')
          return
        }
        
        if (!child.childName) {
          ElMessage.warning('子件名称不能为空')
          return
        }
        
        if (!child.standardQty || parseFloat(child.standardQty) <= 0) {
          ElMessage.warning('子件数量必须大于0')
          return
        }
      }
    }
    
    // 确保有bomCode
    if (!formData.value.bomCode) {
      const timestamp = Date.now()
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      formData.value.bomCode = `PBOM-${new Date().getFullYear()}-${timestamp}-${randomNum}`
    }
    
    if (isDraftMode.value) {
      // 从草稿箱提交到主表格
      if (isEdit.value) {
        const index = tableData.value.findIndex(p => p.id === currentBom.value.id)
        if (index !== -1) {
          tableData.value[index] = {
            ...formData.value,
            id: currentBom.value.id,
            updateTime: new Date().toLocaleString('zh-CN')
          }
          await bomApiService.saveBom(tableData.value[index])
        }
        ElMessage.success('BOM更新成功')
      } else {
        const newBom = {
          ...formData.value,
          status: 'draft',
          createTime: new Date().toLocaleString('zh-CN'),
          updateTime: new Date().toLocaleString('zh-CN')
        }
        const savedBom = await bomApiService.saveBom(newBom)
        tableData.value.unshift({ ...newBom, id: savedBom.id })
        nextBomId.value++
        ElMessage.success('BOM创建成功')
      }
      
      // 从草稿箱删除
      if (currentBom.value && currentBom.value.draftId) {
        const draftIndex = draftList.value.findIndex(d => d.draftId === currentBom.value.draftId)
        if (draftIndex !== -1) {
          draftList.value.splice(draftIndex, 1)
          await databaseService.deleteBom(currentBom.value.draftId, 'productionBomDrafts')
        }
      }
      
      isDraftMode.value = false
    } else {
      // 正常保存逻辑
      
      // 保存前，从物料库获取产品图片
      if (formData.value.productCode && !formData.value.productImage) {
        const material = materialList.value.find(m => m.materialCode === formData.value.productCode)
        if (material && material.materialImage) {
          formData.value.productImage = material.materialImage
        }
      }
      
      if (isEdit.value) {
        // 先保存到后端
        const savedBom = await bomApiService.saveBom(formData.value)
        
        // 后端保存成功后，再更新本地数据
        const index = tableData.value.findIndex(p => p.id === currentBom.value.id)
        if (index !== -1) {
          // 只保存必要的字段，过滤掉前端显示字段
          tableData.value[index] = {
            id: savedBom.id,
            bomCode: formData.value.bomCode,
            bomName: formData.value.bomName,
            productCode: formData.value.productCode,
            productName: formData.value.productName,
            version: formData.value.version,
            status: formData.value.status,
            designer: formData.value.designer,
            reviewer: formData.value.reviewer,
            itemCount: formData.value.itemCount,
            effectiveDate: formData.value.effectiveDate,
            remark: formData.value.remark,
            totalLabor: formData.value.totalLabor,
            totalMaterial: formData.value.totalMaterial,
            productImage: formData.value.productImage,
            updateTime: new Date().toLocaleString('zh-CN')
          }
        }
        ElMessage.success('BOM更新成功')
      } else {
        // 先保存到后端
        const savedBom = await bomApiService.saveBom(formData.value)
        
        // 后端保存成功后，再更新本地数据
        const newBom = {
          id: savedBom.id,
          bomCode: formData.value.bomCode,
          bomName: formData.value.bomName,
          productCode: formData.value.productCode,
          productName: formData.value.productName,
          version: formData.value.version,
          status: formData.value.status,
          designer: formData.value.designer,
          reviewer: formData.value.reviewer,
          itemCount: formData.value.itemCount,
          effectiveDate: formData.value.effectiveDate,
          remark: formData.value.remark,
          totalLabor: formData.value.totalLabor,
          totalMaterial: formData.value.totalMaterial,
          productImage: formData.value.productImage,
          createTime: new Date().toLocaleString('zh-CN'),
          updateTime: new Date().toLocaleString('zh-CN')
        }
        tableData.value.unshift(newBom)
        nextBomId.value++
        ElMessage.success('BOM创建成功')
      }
    }
    
    // 关闭对话框
    editDialogVisible.value = false
    updateStats()
  } catch (error) {
    console.error('提交BOM失败:', error)
    ElMessage.error('提交BOM失败: ' + error.message)
  }
}

// 保存为草稿（不关闭对话框）
const handleSaveToDraft = async () => {
  try {
    // 确保有bomCode
    if (!formData.value.bomCode) {
      const timestamp = Date.now()
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      formData.value.bomCode = `PBOM-${new Date().getFullYear()}-${timestamp}-${randomNum}`
    }
    
    const draftBom = {
      ...formData.value
    }
    
    // 先保存到后端
    const savedDraft = await bomDraftApiService.saveDraft(draftBom)
    
    // 更新前端列表
    const existingIndex = draftList.value.findIndex(d => d.id === savedDraft.id)
    if (existingIndex !== -1) {
      draftList.value[existingIndex] = { ...draftBom, id: savedDraft.id, draftId: savedDraft.id }
      ElMessage.success('草稿已更新')
    } else {
      draftList.value.unshift({ ...draftBom, id: savedDraft.id, draftId: savedDraft.id })
      // 更新formData的id，以便下次保存是更新而不是新建
      formData.value.id = savedDraft.id
      ElMessage.success('已保存到草稿箱')
    }
    
    // 不关闭对话框
  } catch (error) {
    console.error('保存草稿失败:', error)
    ElMessage.error('保存草稿失败: ' + error.message)
  }
}

// 显示草稿箱
const showDraftBox = () => {
  draftBoxVisible.value = true
}

// 编辑草稿（优化：浅拷贝）
const handleEditDraft = (row) => {
  isDraftMode.value = true
  isEdit.value = false
  currentBom.value = row // 直接引用
  // 只拷贝顶层属性，childItems保持引用
  formData.value = {
    ...row,
    childItems: row.childItems || []
  }
  
  // 计算层阶地址
  nextTick(() => {
    recalculateAllLevelPaths()
  })
  
  editDialogVisible.value = true
  draftBoxVisible.value = false
}

// 提交草稿到主表格
const handleSubmitDraft = async (row) => {
  try {
    await ElMessageBox.confirm('确定将该草稿提交到主表格吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    // 添加到主表格
    const newBom = {
      ...row,
      status: row.status || 'draft'
    }
    delete newBom.draftId // 删除草稿ID
    
    // 先保存到后端BOM表
    const savedBom = await bomApiService.saveBom(newBom)
    tableData.value.unshift({ ...newBom, id: savedBom.id })
    
    // 从后端草稿箱删除
    await bomDraftApiService.deleteDraft(row.id)
    
    // 从前端列表删除
    const draftIndex = draftList.value.findIndex(d => d.id === row.id)
    if (draftIndex !== -1) {
      draftList.value.splice(draftIndex, 1)
    }
    
    updateStats()
    ElMessage.success('草稿已提交到主表格')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交草稿失败:', error)
      ElMessage.error('提交草稿失败: ' + error.message)
    }
  }
}

// 删除草稿
const handleDeleteDraft = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除草稿"${row.bomName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 先从后端删除
    await bomDraftApiService.deleteDraft(row.id)
    
    // 后端删除成功后，再从前端列表删除
    const index = draftList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      draftList.value.splice(index, 1)
    }
    
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除草稿失败:', error)
      ElMessage.error('删除草稿失败: ' + error.message)
    }
  }
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
}

// 显示BOM树结构（生成并跳转）
const handleShowBomTree = async () => {
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条BOM数据')
    return
  }
  
  const selectedBom = selectedRows.value[0]
  
  try {
    // 加载完整BOM数据（包含子件）
    const loadingMsg = ElMessage({
      message: '正在加载BOM数据...',
      type: 'info',
      duration: 0
    })
    
    const bomDetail = await bomApiService.getBomDetail(selectedBom.id)
    
    // 计算层阶地址（如果没有）
    if (bomDetail.childItems && bomDetail.childItems.length > 0) {
      bomDetail.childItems.forEach(item => {
        if (!item.levelPath) {
          item.levelPath = calculateLevelPath(item, bomDetail.childItems)
        }
      })
    }
    
    loadingMsg.close()
    
    // 构建数据流水线对象
    const bomTreePipelineData = {
      // 父件属性
      parent: {
        productCode: bomDetail.productCode || '',
        productName: bomDetail.productName || '',
        itemCount: bomDetail.itemCount || 1,
        outputProcess: bomDetail.outputProcess || '' // 产出工序
      },
      // 子件属性
      children: (bomDetail.childItems || []).map(child => ({
        levelPath: child.levelPath || '', // 层阶地址
        childCode: child.childCode || '',
        childName: child.childName || '',
        outputProcess: child.outputProcess || '',
        standardQty: child.standardQty || 0
      })),
      // BOM基础信息
      bomInfo: {
        bomCode: bomDetail.bomCode,
        bomName: bomDetail.bomName,
        version: bomDetail.version
      }
    }
    
    console.log('BOM数据流水线:', bomTreePipelineData)
    
    // 将数据保存到 sessionStorage
    sessionStorage.setItem('bomTreePipelineData', JSON.stringify(bomTreePipelineData))
    
    // 跳转到BOM树结构页面
    router.push('/bom-tree-structure')
    
    ElMessage.success('已跳转到BOM树结构页面')
  } catch (error) {
    console.error('加载BOM数据失败:', error)
    ElMessage.error('加载BOM数据失败: ' + error.message)
  }
}

// 查看BOM树信息（从数据库加载）
const handleViewBomTree = async () => {
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条BOM数据')
    return
  }
  
  const selectedBom = selectedRows.value[0]
  
  try {
    // 显示loading
    const loadingMsg = ElMessage({
      message: '正在加载BOM树结构...',
      type: 'info',
      duration: 0
    })
    
    // 从数据库获取BOM树结构
    const response = await bomTreeStructureApi.getTreeStructure(selectedBom.bomCode)
    
    // 关闭 loading
    loadingMsg.close()
    
    if (response.data.success) {
      // 设置BOM数据
      bomTreeData.value = {
        bomCode: response.data.data.bomCode,
        bomName: response.data.data.bomName,
        productCode: response.data.data.productCode,
        productName: response.data.data.productName,
        version: response.data.data.version,
        status: response.data.data.status,
        itemCount: selectedBom.itemCount
      }
      
      // 构建树结构
      buildTreeStructure(selectedBom)
      
      // 打开对话框
      bomTreeDialogVisible.value = true
      
      ElMessage.success('加载BOM树结构成功')
    } else {
      ElMessage.warning('该BOM尚未生成树结构，请先点击\'生成BOM树结构\'按钮')
    }
  } catch (error) {
    console.error('获取BOM树结构失败:', error)
    
    if (error.response?.status === 404) {
      ElMessage.warning('该BOM尚未生成树结构，请先点击\'生成BOM树结构\'按钮')
    } else {
      ElMessage.error('获取BOM树结构失败：' + (error.response?.data?.message || error.message))
    }
  }
}

// 构建BOM树结构（组织架构式）
const buildTreeStructure = (bomData) => {
  // 根节点（父件/产品）
  const rootNode = {
    id: `root-${bomData.bomCode}`,
    code: bomData.productCode,
    name: bomData.productName,
    level: 0,
    standardQty: 1,
    outputProcess: bomData.outputProcess || '-',
    children: []
  }
  
  if (!bomData.childItems || bomData.childItems.length === 0) {
    orgTreeData.value = rootNode
    return
  }
  
  // 按层级分组子件
  const itemsByLevel = {}
  bomData.childItems.forEach(item => {
    const level = parseInt(item.level) || 1
    if (!itemsByLevel[level]) {
      itemsByLevel[level] = []
    }
    itemsByLevel[level].push({
      id: `${item.childCode}-${item.level}-${Math.random()}`,
      code: item.childCode,
      name: item.childName,
      level: level,
      standardQty: item.standardQty || 0,
      outputProcess: item.outputProcess || '-',
      children: [],
      parentLevel: level - 1
    })
  })
  
  // 获取所有层级并排序
  const levels = Object.keys(itemsByLevel).map(Number).sort((a, b) => a - b)
  
  if (levels.length === 0) {
    orgTreeData.value = rootNode
    return
  }
  
  // 构建层级关系
  // 第1层直接挂在根节点下
  if (levels.includes(1)) {
    rootNode.children = itemsByLevel[1]
  }
  
  // 后续层级按照父子关系挂载
  for (let i = 1; i < levels.length; i++) {
    const currentLevel = levels[i]
    const prevLevel = levels[i - 1]
    
    if (itemsByLevel[prevLevel] && itemsByLevel[currentLevel]) {
      const prevLevelNodes = itemsByLevel[prevLevel]
      const currentLevelNodes = itemsByLevel[currentLevel]
      
      // 将当前层节点平均分配给上一层节点
      const itemsPerParent = Math.ceil(currentLevelNodes.length / prevLevelNodes.length)
      prevLevelNodes.forEach((parentNode, index) => {
        const start = index * itemsPerParent
        const end = Math.min(start + itemsPerParent, currentLevelNodes.length)
        parentNode.children = currentLevelNodes.slice(start, end)
      })
    }
  }
  
  orgTreeData.value = rootNode
}

// 打印树结构
const handlePrintTree = () => {
  window.print()
  ElMessage.success('请在打印预览中选择打印机')
}

// 文件选择
const handleFileChange = (file) => {
  console.log('选择文件:', file)
}

// 确认导入
const handleImportConfirm = () => {
  ElMessage.success('导入成功')
  importDialogVisible.value = false
}

// 导出
const handleExport = () => {
  const dataToExport = filteredTableData.value
  let csvContent = 'BOM编号,BOM名称,产品编号,产品名称,版本号,状态,设计人员,审核人员,物料数量,生效日期,备注\n'
  dataToExport.forEach(row => {
    const statusText = row.status === 'draft' ? '草稿' : row.status === 'reviewing' ? '审核中' : row.status === 'approved' ? '已批准' : '已废弃'
    csvContent += `${row.bomCode},${row.bomName},${row.productCode},${row.productName},${row.version},${statusText},${row.designer},${row.reviewer},${row.itemCount},${row.effectiveDate},${row.remark}\n`
  })
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `生产BOM_${new Date().getTime()}.csv`
  link.click()
  
  ElMessage.success(`导出成功，共 ${dataToExport.length} 条记录`)
}

// 打印
const handlePrint = () => {
  window.print()
}

// 恢复数据
const handleRecoverData = async () => {
  try {
    // 1. 检查localStorage中是否有备份
    const backup = localStorage.getItem('enterpriseBrain_backup')
    
    if (!backup) {
      // 2. 如果没有备份，检查是否有其他备份源
      const allKeys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('backup') || key.includes('Backup') || key.includes('draft'))) {
          allKeys.push(key)
        }
      }
      
      if (allKeys.length === 0) {
        await ElMessageBox.alert(
          '未检测到任何备份数据。<br/><br/>' +
          '<strong>可能的原因：</strong><br/>' +
          '1. 系统未进行过数据备份<br/>' +
          '2. 浏览器清理了缓存数据<br/>' +
          '3. 使用了不同的浏览器或隐私模式<br/><br/>' +
          '<strong>建议：</strong><br/>' +
          '1. 如果有手动导出的备份文件，请使用"导入"功能<br/>' +
          '2. 联系系统管理员检查服务器备份<br/>' +
          '3. 今后定期使用"导出"功能备份数据',
          '未找到备份数据',
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '知道了'
          }
        )
        return
      }
      
      // 3. 显示找到的备份，让用户选择
      const backupOptions = allKeys.map(key => {
        const data = localStorage.getItem(key)
        let info = ''
        try {
          const parsed = JSON.parse(data)
          if (parsed.exportTime) {
            info = `（${parsed.exportTime}）`
          } else if (parsed.timestamp) {
            info = `（${parsed.timestamp}）`
          }
        } catch (e) {
          info = ''
        }
        return { label: `${key} ${info}`, value: key }
      })
      
      const { value: selectedKey } = await ElMessageBox.prompt(
        `检测到 ${allKeys.length} 个备份，请选择要恢复的备份：`,
        '选择备份',
        {
          inputType: 'select',
          inputOptions: backupOptions,
          confirmButtonText: '恢复',
          cancelButtonText: '取消'
        }
      )
      
      if (selectedKey) {
        const selectedBackup = localStorage.getItem(selectedKey)
        await restoreFromBackupData(selectedBackup, selectedKey)
      }
      return
    }
    
    // 4. 有备份，确认是否恢复
    const backupData = JSON.parse(backup)
    const backupTime = backupData.exportTime || backupData.timestamp || '未知时间'
    
    const confirmed = await ElMessageBox.confirm(
      `检测到系统备份数据：<br/><br/>` +
      `<strong>备份时间：</strong>${backupTime}<br/>` +
      `<strong>物料数据：</strong>${backupData.materials?.length || 0} 条<br/>` +
      `<strong>生产BOM：</strong>${backupData.productionBoms?.length || 0} 条<br/>` +
      `<strong>生产BOM草稿：</strong>${backupData.productionBomDrafts?.length || 0} 条<br/>` +
      `<strong>设计BOM草稿：</strong>${backupData.designBomDrafts?.length || 0} 条<br/>` +
      `<strong>销售BOM草稿：</strong>${backupData.salesBomDrafts?.length || 0} 条<br/><br/>` +
      `<span style="color: #E6A23C;">⚠️ 注意：恢夏将会覆盖当前空的数据库</span>`,
      '确认恢复数据？',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '恢复数据',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (confirmed) {
      await restoreFromBackupData(backup, 'enterpriseBrain_backup')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('数据恢复失败:', error)
      ElMessage.error('数据恢复失败: ' + error.message)
    }
  }
}

// 执行数据恢复
const restoreFromBackupData = async (backupJson, backupKey) => {
  try {
    const backupData = JSON.parse(backupJson)
    ElMessage.info('正在恢复数据...')
    
    const count = await databaseService.restoreFromBackup(backupData)
    
    // 重新加载数据
    const boms = await databaseService.getAllBoms('productionBoms')
    if (Array.isArray(boms) && boms.length > 0) {
      tableData.value = boms
    }
    
    // 重新加载草稿
    const drafts = await databaseService.getAllBoms('productionBomDrafts')
    if (Array.isArray(drafts) && drafts.length > 0) {
      draftList.value = drafts
    }
    
    // 更新统计
    updateStats()
    
    ElMessage.success(`数据恢复成功，共恢复 ${count} 条记录`)
    
    // 恢复成功后清除备份（可选）
    // localStorage.removeItem(backupKey)
  } catch (error) {
    console.error('执行数据恢复失败:', error)
    throw error
  }
}

// 推送到产品手册
const handlePushToManual = async (row) => {
  try {
    // 检查产品编号
    if (!row.productCode) {
      ElMessage.error('产品编号为空，无法推送')
      return
    }
    
    // 确认推送
    await ElMessageBox.confirm(
      `确定要将该BOM推送到产品手册吗？<br/><br/>` +
      `<strong>BOM名称：</strong>${row.bomName}<br/>` +
      `<strong>产品编号：</strong>${row.productCode}<br/>` +
      `<strong>产品名称：</strong>${row.productName}<br/><br/>` +
      `<span style="color: #909399;">推送后将在产品手册中创建相应的产品记录</span>`,
      '推送确认',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定推送',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 构建产品手册数据
    const productManualData = {
      productCode: row.productCode,
      productName: row.productName,
      productImage: row.productImage || '',
      source: ['自制'], // 默认来源为自制，用户可以后期更改
      category: '', // 用户后期填写
      specification: row.version || '',
      unit: '个',
      status: '在售',
      productStatus: '正常',
      version: row.version || 'V1.0',
      isEnabled: true,
      designer: row.designer || '',
      bomMaintainer: row.designer || '',
      remark: `由生产BOM ${row.bomCode} 推送生成`
    }
    
    // 使用API保存到MySQL数据库
    try {
      // 尝试创建产品手册，响应拦截器会直接返回数据或抛出错误
      const createdProduct = await productManualAPI.create(productManualData)
      
      // 推送成功
      console.log('产品推送成功:', createdProduct)
      
      // 更新BOM的推送状态
      const bomIndex = tableData.value.findIndex(b => b.id === row.id)
      if (bomIndex !== -1) {
        tableData.value[bomIndex].isPushedToManual = 1
      }
      
      // 使用普通消息通知（避免appContext错误）
      setTimeout(() => {
        ElMessage({
          type: 'success',
          message: `推送成功！\n产品编号：${row.productCode}\n请到产品手册页面查看`,
          duration: 3000
        })
      }, 100)
    } catch (apiError) {
      console.error('推送错误:', apiError)
      
      // 检查是否是产品编号已存在错误
      if (apiError.message && apiError.message.includes('已存在')) {
        try {
          await ElMessageBox.confirm(
            `产品手册中已存在相同产品编号（${row.productCode}），是否覆盖？`,
            '提示',
            {
              confirmButtonText: '覆盖',
              cancelButtonText: '取消',
              type: 'warning'
            }
          )
          
          // 用户选择覆盖，查找并更新
          const allProducts = await productManualAPI.getAll()
          
          // 直接从数组中查找
          const existing = allProducts.find(p => p.productCode === row.productCode)
          if (existing) {
            await productManualAPI.update(existing.id, productManualData)
            
            setTimeout(() => {
              ElMessage({
                type: 'success',
                message: `覆盖成功！\n产品编号：${row.productCode}`,
                duration: 3000
              })
            }, 100)
          }
        } catch (confirmError) {
          // 用户取消覆盖
          return
        }
      } else {
        // 其他错误
        throw apiError
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('推送到产品手册失败:', error)
      ElMessage.error('推送失败: ' + error.message)
    }
  }
}

// 刷新
const handleRefresh = async () => {
  try {
    // 重新加载数据
    const boms = await databaseService.getAllBoms('productionBoms')
    if (Array.isArray(boms)) {
      tableData.value = boms
    }
    
    // 重新加载草稿
    const drafts = await databaseService.getAllBoms('productionBomDrafts')
    if (Array.isArray(drafts)) {
      draftList.value = drafts
    }
    
    // 更新统计
    updateStats()
    
    ElMessage.success('刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    ElMessage.error('刷新失败: ' + error.message)
  }
}

// 主表格分页
const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 子件表格分页
const handleChildSizeChange = (val) => {
  childPageSize.value = val
  childCurrentPage.value = 1 // 重置到第一页
}

const handleChildCurrentChange = (val) => {
  childCurrentPage.value = val
}

// 计算子表格序号（跨页连续）
const getChildRowIndex = (index) => {
  return (childCurrentPage.value - 1) * childPageSize.value + index + 1
}

// 生命周期
onMounted(async () => {
  try {
    // 从后端 API 加载物料数据
    const materials = await materialApiService.getAllMaterials()
    if (Array.isArray(materials)) {
      materialList.value = materials
      console.log('加载物料数据成功:', materials.length, '条')
    }
  } catch (error) {
    console.error('加载物料数据失败:', error)
    ElMessage.error('加载物料数据失败: ' + error.message)
  }
  
  try {
    // 检查数据库版本，在升级前备份数据
    const currentVersion = localStorage.getItem('db_version')
    const newVersion = 3
    
    if (currentVersion && parseInt(currentVersion) < newVersion) {
      console.log(`检测到数据库版本升级: v${currentVersion} -> v${newVersion}`)
      ElMessage.info('检测到系统升级，正在备份数据...')
      
      try {
        await databaseService.exportAllData()
        ElMessage.success('数据备份完成')
      } catch (error) {
        console.error('数据备份失败:', error)
        ElMessage.warning('数据备份失败，请手动导出数据')
      }
    }
    
    // 初始化数据库
    await databaseService.init()
    
    // 更新版本标记
    localStorage.setItem('db_version', String(newVersion))
    
    // 检查是否有备份数据需要恢复
    const backup = localStorage.getItem('enterpriseBrain_backup')
    if (backup) {
      try {
        const backupData = JSON.parse(backup)
        console.log('检测到备份数据，准备恢复...')
        
        const confirmed = await ElMessageBox.confirm(
          `检测到系统升级前的数据备份（${backupData.exportTime}），是否恢复？`,
          '数据恢复',
          {
            confirmButtonText: '恢复数据',
            cancelButtonText: '不恢复',
            type: 'info'
          }
        )
        
        if (confirmed) {
          ElMessage.info('正在恢复数据...')
          const count = await databaseService.restoreFromBackup(backupData)
          ElMessage.success(`数据恢复成功，共恢复${count}条记录`)
          // 恢复成功后清除备份
          localStorage.removeItem('enterpriseBrain_backup')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('数据恢复失败:', error)
          ElMessage.error('数据恢复失败: ' + error.message)
        }
      }
    }
    
    // 从后端数据库加载BOM数据
    const boms = await bomApiService.getAllBoms()
    if (Array.isArray(boms) && boms.length > 0) {
      tableData.value = boms
      console.log(`从后端加载了${boms.length}条生产BOM数据`)
    }
    
    // 获取下一个BOM ID
    nextBomId.value = await databaseService.getNextBomId('productionBoms')
    
    // 从后端数据库加载草稿数据
    const drafts = await bomDraftApiService.getAllDrafts()
    if (Array.isArray(drafts) && drafts.length > 0) {
      draftList.value = drafts
      console.log(`从后端加载了${drafts.length}条草稿数据`)
    }
  } catch (error) {
    console.error('数据库初始化或数据加载失败:', error)
    ElMessage.error('数据加载失败: ' + error.message)
    // 不再降级到localStorage，必须使用后端数据
    tableData.value = []
  }
  
  const updateTableHeight = () => {
    const windowHeight = window.innerHeight
    tableHeight.value = windowHeight - 520
  }
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
  updateStats()
})
</script>

<style scoped>
.production-bom-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toolbar-left h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-form {
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 父件属性区 */
.parent-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

/* 子件属性区 */
.child-section {
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  padding-bottom: 10px;
  border-bottom: 2px solid #409EFF;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.child-table {
  margin-top: 10px;
}

.child-toolbar {
  display: flex;
  gap: 10px;
}

/* 层级缩进样式 */
.indent-level-1 .el-table__cell:nth-child(3) {
  padding-left: 40px !important;
}

/* BOM树结构对话框样式 */
.bom-tree-dialog .el-dialog__body {
  padding: 15px;
  background: #f5f7fa;
  max-height: 85vh;
  overflow: hidden;
}

.bom-tree-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
}

.product-info-header {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* 组织架构树样式 */
.org-tree-section {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  overflow: hidden;
}

.org-tree-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
}

.org-tree-container {
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
  min-width: 100%;
  min-height: 100%;
  padding: 40px;
}

.org-tree-node-wrapper {
  display: inline-flex;
}

/* 组织架构树节点 */
.org-tree-node {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
}

/* 子节点区域（在左侧） */
.org-tree-children {
  display: flex;
  flex-direction: column;
  margin-right: 60px;
  position: relative;
}

.org-tree-children-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.org-tree-child-wrapper {
  position: relative;
}

/* 连接线样式 */
.org-tree-child-wrapper::before {
  content: '';
  position: absolute;
  right: -30px;
  top: 50%;
  width: 30px;
  height: 2px;
  background: #d0d7de;
}

.org-tree-child-wrapper::after {
  content: '';
  position: absolute;
  right: -30px;
  top: 50%;
  width: 0;
  height: 0;
  border: 6px solid transparent;
  border-left-color: #d0d7de;
  transform: translateY(-50%);
}

/* 多个子节点时的竖线 */
.org-tree-children-list::before {
  content: '';
  position: absolute;
  right: -31px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #d0d7de;
}

/* 只有一个子节点时隐藏竖线 */
.org-tree-children-list:has(> .org-tree-child-wrapper:only-child)::before {
  display: none;
}

/* 节点卡片区域 */
.org-tree-node-content {
  display: flex;
  align-items: center;
}

/* 节点卡片 */
.org-node-card {
  position: relative;
  min-width: 200px;
  max-width: 280px;
  padding: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.org-node-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  border-color: #409EFF;
}

/* 根节点（产品） */
.org-node-card.root-node {
  background: linear-gradient(135deg, #e8f4ff 0%, #d6ebff 100%);
  border-color: #409EFF;
  border-width: 3px;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.25);
}

.org-node-card.root-node:hover {
  background: linear-gradient(135deg, #d6ebff 0%, #c0e3ff 100%);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.35);
}

/* 子节点 */
.org-node-card.child-node {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #67C23A;
}

.org-node-card.child-node:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: #409EFF;
}

/* 层级标识 */
.node-level-badge {
  position: absolute;
  top: -12px;
  right: -12px;
  background: linear-gradient(135deg, #409EFF 0%, #337ecc 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
  z-index: 1;
}

.org-node-card.root-node .node-level-badge {
  background: linear-gradient(135deg, #F56C6C 0%, #d9534f 100%);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.4);
}

.org-node-card.level-1 .node-level-badge {
  background: linear-gradient(135deg, #67C23A 0%, #5daf34 100%);
}

.org-node-card.level-2 .node-level-badge {
  background: linear-gradient(135deg, #E6A23C 0%, #cf9236 100%);
}

.org-node-card.level-3 .node-level-badge {
  background: linear-gradient(135deg, #909399 0%, #7d8185 100%);
}

/* 节点信息内容 */
.node-info-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  line-height: 1.6;
}

.node-label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  min-width: 45px;
  flex-shrink: 0;
}

.node-value {
  font-size: 13px;
  color: #303133;
  font-weight: 600;
  word-break: break-all;
  flex: 1;
}

.node-value.code {
  color: #409EFF;
  font-family: 'Courier New', monospace;
}

.node-value.name {
  color: #303133;
  font-weight: 600;
}

.node-value.qty {
  color: #E6A23C;
  font-weight: bold;
  font-size: 14px;
}

.node-value.process {
  color: #67C23A;
  font-size: 12px;
}

/* 打印样式 */
@media print {
  .bom-tree-dialog .el-dialog__header,
  .bom-tree-dialog .el-dialog__footer {
    display: none;
  }

  .bom-tree-container {
    background: white;
  }

  .org-node-card {
    page-break-inside: avoid;
  }
  
  .org-tree-section {
    overflow: visible;
  }
  
  .org-tree-wrapper {
    overflow: visible;
  }
}

.indent-level-2 .el-table__cell:nth-child(3) {
  padding-left: 60px !important;
}

.indent-level-3 .el-table__cell:nth-child(3) {
  padding-left: 80px !important;
}

.indent-level-4 .el-table__cell:nth-child(3) {
  padding-left: 100px !important;
}

.indent-level-5 .el-table__cell:nth-child(3) {
  padding-left: 120px !important;
}

/* 打印样式 */
@media print {
  .toolbar,
  .search-section,
  .stats-cards,
  .pagination-container {
    display: none;
  }
}
</style>
