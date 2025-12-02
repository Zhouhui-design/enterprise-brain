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
      <el-table-column prop="effectiveDate" label="生效日期" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column prop="remark" label="备注" width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="success" @click="handleView(row)">查看</el-button>
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
              <el-form-item label="总人工">
                <div style="display: flex; gap: 10px; width: 100%;">
                  <el-input v-model="formData.totalLabor" readonly style="flex: 1;" />
                  <el-button type="primary" @click="handleCalculateLabor">计算人工费用</el-button>
                </div>
              </el-form-item>
            </el-col>
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
          :data="formData.childItems" 
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
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="level" label="层阶" min-width="80" align="center">
            <template #default="{ row }">
              <el-input 
                v-model="row.level" 
                placeholder="层阶" 
                size="small"
                @focus="handleCellFocus(row, 'level')"
              />
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
              <span>{{ row.source || '-' }}</span>
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
          <el-table-column prop="childCode" label="子件编码" min-width="120" />
          <el-table-column prop="childName" label="子件名称" min-width="150" />
          <el-table-column prop="standardQty" label="标准用量" width="100" align="right" />
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
              {{ row.materialCost ? row.materialCost.toFixed(2) : '0.00' }}
            </template>
          </el-table-column>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, Plus, Upload, Download, Printer, Refresh, 
  Document, CircleCheck, Warning, UploadFilled, Delete, Rank, RefreshRight, DocumentCopy,
  Setting, Operation, PriceTag, Money, Coin, User
} from '@element-plus/icons-vue'
import SmartSelect from '@/components/SmartSelect.vue'
import { copyToClipboard, getCopyableColumnProps } from '@/utils/clipboard'
// 使用后端API服务
import materialApiService from '@/services/api/materialApiService'
import bomApiService from '@/services/api/bomApiService'
import bomDraftApiService from '@/services/api/bomDraftApiService'
import databaseService from '@/services/DatabaseService.js' // 仅用于数据迁移

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
const editDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const importDialogVisible = ref(false)
const draftBoxVisible = ref(false)
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

// 计算属性
const hasSelection = computed(() => selectedRows.value.length > 0)

const filteredTableData = computed(() => {
  let data = tableData.value
  
  if (searchForm.value.bomCode) {
    data = data.filter(item => 
      item.bomCode.toLowerCase().includes(searchForm.value.bomCode.toLowerCase())
    )
  }
  if (searchForm.value.productName) {
    data = data.filter(item => 
      item.productName.toLowerCase().includes(searchForm.value.productName.toLowerCase())
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

// 产品编码变化时，自动填充产品名称
const handleProductCodeChange = (value) => {
  if (!value) {
    return
  }
  
  // 根据产品编码查找对应的物料
  const material = materialList.value.find(m => m.materialCode === value)
  if (material) {
    formData.value.productName = material.materialName
    ElMessage.success('已自动填充产品名称')
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

// 添加子件
const handleAddChild = () => {
  formData.value.childItems.push({
    id: `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 唯一ID
    level: '1',
    childCode: '',
    childName: '',
    standardQty: 1,
    outputProcess: '',
    source: '',
    processWage: 0,
    materialLoss: 0,
    materialPrice: 0,
    indent: 0 // 缩进层级
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
  
  const newItem = {
    id: `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 唯一ID
    level: String(currentLevel + 1),
    childCode: '',
    childName: '',
    standardQty: 1,
    outputProcess: '',
    source: '',
    processWage: 0,
    materialLoss: 0,
    materialPrice: 0,
    indent: currentIndent + 1,
    parentIndex: index // 记录父级索引
  }
  
  formData.value.childItems.splice(index + 1, 0, newItem)
  ElMessage.success('已添加下层子件')
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
    // 产出工序 = 物料库的产出工序名称
    if (material.processName) {
      row.outputProcess = material.processName
    }
    
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
    // 产出工序 = 物料库的产出工序名称
    if (material.processName) {
      row.outputProcess = material.processName
    }
    
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

// 加载材料单价（手动加载）
const handleLoadMaterialPrice = () => {
  if (!formData.value.childItems || formData.value.childItems.length === 0) {
    ElMessage.warning('暂无子件数据')
    return
  }
  
  let count = 0
  for (const row of formData.value.childItems) {
    // 从物料库加载材料单价（基础单价）
    const material = materialList.value.find(m => m.materialCode === row.childCode)
    if (material && material.basePrice !== undefined && material.basePrice !== null) {
      row.materialPrice = material.basePrice
      count++
    }
  }
  
  ElMessage.success(`已加载 ${count} 条子件的材料单价（基础单价）`)
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

// 编辑BOM（优化：浅拷贝）
const handleEdit = async (row) => {
  try {
    isEdit.value = true
    currentBom.value = row // 直接引用
    
    // 从后端加载完整数据（包含子件）
    const bomDetail = await bomApiService.getBomDetail(row.id)
    
    // 只拷贝顶层属性，childItems保持引用
    formData.value = {
      ...bomDetail,
      childItems: bomDetail.childItems || []
    }
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
    currentBom.value = bomDetail
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

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
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
