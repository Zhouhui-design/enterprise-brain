<template>
  <div class="location-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h3>库位管理</h3>
    </div>
    
    <!-- 工具栏区域 -->
    <div class="toolbar">
      <div class="search-area">
        <el-select v-model="searchForm.warehouseId" placeholder="选择仓库" filterable clearable class="search-item">
          <el-option 
            v-for="warehouse in warehouseList" 
            :key="warehouse.id" 
            :label="warehouse.name" 
            :value="warehouse.id">
          </el-option>
        </el-select>
        <el-input 
          v-model="searchForm.locationCode" 
          placeholder="库位编码" 
          class="search-item" 
          clearable
          @keyup.enter.native="handleSearch">
        </el-input>
        <el-input 
          v-model="searchForm.locationName" 
          placeholder="库位名称" 
          class="search-item" 
          clearable
          @keyup.enter.native="handleSearch">
        </el-input>
        <el-select v-model="searchForm.zoneId" placeholder="选择区域" filterable clearable class="search-item">
          <el-option 
            v-for="zone in zoneList" 
            :key="zone.id" 
            :label="zone.name" 
            :value="zone.id">
          </el-option>
        </el-select>
        <el-select v-model="searchForm.status" placeholder="状态" clearable class="search-item">
          <el-option label="启用" value="active"></el-option>
          <el-option label="禁用" value="inactive"></el-option>
        </el-select>
        <el-button type="primary" @click="handleSearch" class="search-item">查询</el-button>
        <el-button @click="resetSearch" class="search-item">重置</el-button>
      </div>
      
      <div class="action-area">
        <el-button type="primary" @click="showAddLocationForm" icon="el-icon-plus">新增库位</el-button>
        <el-button type="success" @click="handleImportLocation" icon="el-icon-upload">导入库位</el-button>
        <el-button @click="handleExportLocation" icon="el-icon-download">导出库位</el-button>
        <el-button type="danger" @click="batchDeleteLocation" icon="el-icon-delete" :disabled="selectedLocations.length === 0">批量删除</el-button>
        <el-button @click="showLocationLayout" icon="el-icon-s-grid">库位布局图</el-button>
      </div>
    </div>
    
    <!-- 数据表格 -->
    <div class="table-container">
      <el-table 
        :data="locationList" 
        @selection-change="handleSelectionChange"
        style="width: 100%"
        border
        height="calc(100vh - 320px)">
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column prop="code" label="库位编码" min-width="120" sortable></el-table-column>
        <el-table-column prop="name" label="库位名称" min-width="150"></el-table-column>
        <el-table-column prop="warehouseName" label="所属仓库" min-width="120"></el-table-column>
        <el-table-column prop="zoneName" label="所属区域" min-width="120"></el-table-column>
        <el-table-column prop="aisle" label="巷道" min-width="80"></el-table-column>
        <el-table-column prop="rack" label="货架" min-width="80"></el-table-column>
        <el-table-column prop="shelf" label="层" min-width="80"></el-table-column>
        <el-table-column prop="position" label="位" min-width="80"></el-table-column>
        <el-table-column prop="type" label="库位类型" min-width="100">
          <template slot-scope="scope">
            <el-tag 
              :type="getLocationTypeTagType(scope.row.type)" 
              size="small">
              {{ getLocationTypeName(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="capacity" label="容量" min-width="100"></el-table-column>
        <el-table-column prop="unit" label="计量单位" min-width="100"></el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
              @change="handleStatusChange(scope.row)"
              :disabled="!canModifyLocation(scope.row)">
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180"></el-table-column>
        <el-table-column prop="createdBy" label="创建人" min-width="100"></el-table-column>
        <el-table-column prop="createdTime" label="创建时间" min-width="150" sortable></el-table-column>
        <el-table-column label="操作" min-width="180" fixed="right">
          <template slot-scope="scope">
            <el-button type="primary" size="small" @click="showEditLocationForm(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteLocation(scope.row.id)">删除</el-button>
            <el-button size="small" @click="viewLocationDetails(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        :current-page="pagination.currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange">
      </el-pagination>
    </div>
    
    <!-- 库位统计信息 -->
    <div class="statistical-info">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-item">
            <div class="stat-value">{{ totalLocations }}</div>
            <div class="stat-label">总库位数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ activeLocations }}</div>
            <div class="stat-label">启用库位</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ inactiveLocations }}</div>
            <div class="stat-label">禁用库位</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ occupiedLocations }}</div>
            <div class="stat-label">已占用库位</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ emptyLocations }}</div>
            <div class="stat-label">空库位</div>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 新增/编辑库位对话框 -->
    <el-dialog
      :title="locationFormDialog.title"
      :visible.sync="locationFormDialog.visible"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false">
      <el-form 
        :model="locationForm" 
        :rules="locationFormRules" 
        ref="locationFormRef"
        label-width="120px">
        <el-form-item label="仓库" prop="warehouseId">
          <el-select 
            v-model="locationForm.warehouseId" 
            placeholder="请选择仓库" 
            filterable 
            required
            @change="handleWarehouseChange">
            <el-option 
              v-for="warehouse in warehouseList" 
              :key="warehouse.id" 
              :label="warehouse.name" 
              :value="warehouse.id">
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="区域" prop="zoneId">
          <el-select 
            v-model="locationForm.zoneId" 
            placeholder="请选择区域" 
            filterable 
            required
            @change="handleZoneChange">
            <el-option 
              v-for="zone in filteredZoneList" 
              :key="zone.id" 
              :label="zone.name" 
              :value="zone.id">
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="库位编码" prop="code">
          <el-input v-model="locationForm.code" placeholder="请输入库位编码" readonly v-if="isEditMode"></el-input>
          <el-input v-model="locationForm.code" placeholder="请输入库位编码" v-else></el-input>
          <el-button v-if="!isEditMode" type="text" @click="generateLocationCode">自动生成</el-button>
        </el-form-item>
        
        <el-form-item label="库位名称" prop="name">
          <el-input v-model="locationForm.name" placeholder="请输入库位名称"></el-input>
        </el-form-item>
        
        <el-row>
          <el-col :span="12">
            <el-form-item label="巷道" prop="aisle">
              <el-input v-model="locationForm.aisle" placeholder="请输入巷道号"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="货架" prop="rack">
              <el-input v-model="locationForm.rack" placeholder="请输入货架号"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row>
          <el-col :span="12">
            <el-form-item label="层" prop="shelf">
              <el-input v-model="locationForm.shelf" placeholder="请输入层号"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="位" prop="position">
              <el-input v-model="locationForm.position" placeholder="请输入位号"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="库位类型" prop="type">
          <el-radio-group v-model="locationForm.type">
            <el-radio label="regular">普通库位</el-radio>
            <el-radio label="cold">冷藏库位</el-radio>
            <el-radio label="frozen">冷冻库位</el-radio>
            <el-radio label="dangerous">危险品库位</el-radio>
            <el-radio label="highValue">高值库位</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="容量" prop="capacity">
          <el-input-number 
            v-model="locationForm.capacity" 
            :min="0" 
            style="width: 100%" 
            placeholder="请输入容量">
          </el-input-number>
        </el-form-item>
        
        <el-form-item label="计量单位" prop="unit">
          <el-select v-model="locationForm.unit" placeholder="请选择计量单位">
            <el-option label="个" value="个"></el-option>
            <el-option label="箱" value="箱"></el-option>
            <el-option label="托盘" value="托盘"></el-option>
            <el-option label="千克" value="千克"></el-option>
            <el-option label="吨" value="吨"></el-option>
            <el-option label="立方米" value="立方米"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="是否启用">
          <el-switch
            v-model="locationForm.status"
            :active-value="'active'"
            :inactive-value="'inactive'">
          </el-switch>
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="locationForm.remark" 
            type="textarea" 
            placeholder="请输入备注信息"></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeLocationForm">取消</el-button>
        <el-button type="primary" @click="submitLocationForm">确定</el-button>
      </div>
    </el-dialog>
    
    <!-- 库位详情对话框 -->
    <el-dialog
      title="库位详情"
      :visible.sync="locationDetailDialog.visible"
      width="800px"
      :close-on-click-modal="false"
      :close-on-press-escape="false">
      <div class="location-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="库位编码">{{ selectedLocationDetail.code }}</el-descriptions-item>
            <el-descriptions-item label="库位名称">{{ selectedLocationDetail.name }}</el-descriptions-item>
            <el-descriptions-item label="所属仓库">{{ selectedLocationDetail.warehouseName }}</el-descriptions-item>
            <el-descriptions-item label="所属区域">{{ selectedLocationDetail.zoneName }}</el-descriptions-item>
            <el-descriptions-item label="巷道/货架/层/位">{{ `${selectedLocationDetail.aisle || '-'}/${selectedLocationDetail.rack || '-'}/${selectedLocationDetail.shelf || '-'}/${selectedLocationDetail.position || '-'}` }}</el-descriptions-item>
            <el-descriptions-item label="库位类型">{{ getLocationTypeName(selectedLocationDetail.type) }}</el-descriptions-item>
            <el-descriptions-item label="容量">{{ `${selectedLocationDetail.capacity || 0} ${selectedLocationDetail.unit || ''}` }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ selectedLocationDetail.status === 'active' ? '启用' : '禁用' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ selectedLocationDetail.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h4>存储信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="当前占用容量">{{ `${selectedLocationDetail.occupiedCapacity || 0} ${selectedLocationDetail.unit || ''}` }}</el-descriptions-item>
            <el-descriptions-item label="可用容量">{{ `${selectedLocationDetail.availableCapacity || 0} ${selectedLocationDetail.unit || ''}` }}</el-descriptions-item>
            <el-descriptions-item label="当前存储物品数量">{{ selectedLocationDetail.itemCount || 0 }}</el-descriptions-item>
            <el-descriptions-item label="是否满仓">{{ selectedLocationDetail.isFull ? '是' : '否' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h4>操作日志</h4>
          <el-table 
            :data="selectedLocationDetail.operationLogs || []" 
            style="width: 100%" 
            border
            max-height="300">
            <el-table-column prop="operationType" label="操作类型" min-width="120"></el-table-column>
            <el-table-column prop="operator" label="操作人" min-width="100"></el-table-column>
            <el-table-column prop="operationTime" label="操作时间" min-width="180"></el-table-column>
            <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
          </el-table>
        </div>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="locationDetailDialog.visible = false">关闭</el-button>
      </div>
    </el-dialog>
    
    <!-- 导入库位对话框 -->
    <el-dialog
      title="导入库位"
      :visible.sync="importDialog.visible"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false">
      <div class="import-dialog">
        <el-upload
          class="upload-demo"
          action=""
          :before-upload="beforeImportUpload"
          :on-success="handleImportSuccess"
          :on-error="handleImportError"
          :show-file-list="false"
          accept=".xlsx,.xls">
          <el-button size="small" type="primary">点击上传Excel文件</el-button>
          <div class="el-upload__tip">
            <p>请上传.xlsx或.xls格式的文件</p>
            <el-button type="text" @click="downloadImportTemplate">下载导入模板</el-button>
          </div>
        </el-upload>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="importDialog.visible = false">关闭</el-button>
      </div>
    </el-dialog>
    
    <!-- 库位布局图对话框 -->
    <el-dialog
      title="库位布局图"
      :visible.sync="layoutDialog.visible"
      width="90%"
      height="90vh"
      :close-on-click-modal="false"
      :close-on-press-escape="false">
      <div class="layout-dialog">
        <div class="layout-toolbar">
          <el-select v-model="layoutDialog.selectedWarehouseId" placeholder="选择仓库" @change="loadLayoutData">
            <el-option 
              v-for="warehouse in warehouseList" 
              :key="warehouse.id" 
              :label="warehouse.name" 
              :value="warehouse.id">
            </el-option>
          </el-select>
          <el-select v-model="layoutDialog.selectedZoneId" placeholder="选择区域" @change="loadLayoutData">
            <el-option 
              v-for="zone in zoneList" 
              :key="zone.id" 
              :label="zone.name" 
              :value="zone.id">
            </el-option>
          </el-select>
          <el-switch
            v-model="layoutDialog.showEmptyLocation"
            active-text="显示空库位"
            inactive-text="隐藏空库位"
            @change="loadLayoutData">
          </el-switch>
          <el-switch
            v-model="layoutDialog.showStatusColor"
            active-text="显示状态颜色"
            inactive-text="隐藏状态颜色"
            @change="loadLayoutData">
          </el-switch>
        </div>
        
        <div class="layout-content">
          <div class="layout-grid" v-if="layoutData.length > 0">
            <div 
              v-for="location in layoutData" 
              :key="location.id"
              :class="[
                'location-cell',
                getLocationStatusClass(location.status),
                { 'occupied': location.isOccupied },
                { 'empty': !location.isOccupied }
              ]"
              :title="getLocationTooltip(location)"
              @click="viewLocationDetails(location)">
              <div class="location-code">{{ location.code }}</div>
              <div class="location-name">{{ truncateText(location.name, 6) }}</div>
              <div class="location-capacity" v-if="location.isOccupied">
                已占: {{ location.occupiedCapacity }}/{{ location.capacity }}
              </div>
            </div>
          </div>
          <div v-else class="no-data">暂无布局数据</div>
        </div>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="layoutDialog.visible = false">关闭</el-button>
      </div>
    </el-dialog>
    
    <!-- 批量创建库位对话框 -->
    <el-dialog
      title="批量创建库位"
      :visible.sync="batchCreateDialog.visible"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false">
      <el-form 
        :model="batchCreateForm" 
        :rules="batchCreateFormRules" 
        ref="batchCreateFormRef"
        label-width="120px">
        <el-form-item label="仓库" prop="warehouseId">
          <el-select 
            v-model="batchCreateForm.warehouseId" 
            placeholder="请选择仓库" 
            filterable 
            required>
            <el-option 
              v-for="warehouse in warehouseList" 
              :key="warehouse.id" 
              :label="warehouse.name" 
              :value="warehouse.id">
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="区域" prop="zoneId">
          <el-select 
            v-model="batchCreateForm.zoneId" 
            placeholder="请选择区域" 
            filterable 
            required>
            <el-option 
              v-for="zone in zoneList" 
              :key="zone.id" 
              :label="zone.name" 
              :value="zone.id">
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="库位前缀" prop="prefix">
          <el-input v-model="batchCreateForm.prefix" placeholder="请输入库位前缀，例如：A"></el-input>
        </el-form-item>
        
        <el-row>
          <el-col :span="12">
            <el-form-item label="起始序号" prop="startNumber">
              <el-input-number 
                v-model="batchCreateForm.startNumber" 
                :min="1" 
                style="width: 100%" 
                placeholder="起始序号">
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束序号" prop="endNumber">
              <el-input-number 
                v-model="batchCreateForm.endNumber" 
                :min="1" 
                style="width: 100%" 
                placeholder="结束序号">
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="库位类型" prop="type">
          <el-radio-group v-model="batchCreateForm.type">
            <el-radio label="regular">普通库位</el-radio>
            <el-radio label="cold">冷藏库位</el-radio>
            <el-radio label="frozen">冷冻库位</el-radio>
            <el-radio label="dangerous">危险品库位</el-radio>
            <el-radio label="highValue">高值库位</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="容量" prop="capacity">
          <el-input-number 
            v-model="batchCreateForm.capacity" 
            :min="0" 
            style="width: 100%" 
            placeholder="容量">
          </el-input-number>
        </el-form-item>
        
        <el-form-item label="计量单位" prop="unit">
          <el-select v-model="batchCreateForm.unit" placeholder="请选择计量单位">
            <el-option label="个" value="个"></el-option>
            <el-option label="箱" value="箱"></el-option>
            <el-option label="托盘" value="托盘"></el-option>
            <el-option label="千克" value="千克"></el-option>
            <el-option label="吨" value="吨"></el-option>
            <el-option label="立方米" value="立方米"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="batchCreateDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchCreateForm">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'LocationManagement',
  data() {
    return {
      // 搜索表单
      searchForm: {
        warehouseId: '',
        locationCode: '',
        locationName: '',
        zoneId: '',
        status: ''
      },
      
      // 分页信息
      pagination: {
        currentPage: 1,
        pageSize: 20,
        total: 0
      },
      
      // 表格数据
      locationList: [],
      selectedLocations: [],
      
      // 仓库列表
      warehouseList: [
        { id: 1, name: '主仓库' },
        { id: 2, name: '冷链仓库' },
        { id: 3, name: '危险品仓库' }
      ],
      
      // 区域列表
      zoneList: [
        { id: 1, name: 'A区', warehouseId: 1 },
        { id: 2, name: 'B区', warehouseId: 1 },
        { id: 3, name: 'C区', warehouseId: 2 },
        { id: 4, name: 'D区', warehouseId: 3 }
      ],
      
      // 库位表单对话框
      locationFormDialog: {
        visible: false,
        title: '新增库位'
      },
      
      // 库位表单数据
      locationForm: {
        id: null,
        warehouseId: '',
        zoneId: '',
        code: '',
        name: '',
        aisle: '',
        rack: '',
        shelf: '',
        position: '',
        type: 'regular',
        capacity: 0,
        unit: '个',
        status: 'active',
        remark: ''
      },
      
      // 库位表单验证规则
      locationFormRules: {
        warehouseId: [
          { required: true, message: '请选择仓库', trigger: 'blur' }
        ],
        zoneId: [
          { required: true, message: '请选择区域', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入库位编码', trigger: 'blur' },
          { validator: this.validateLocationCode, trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入库位名称', trigger: 'blur' }
        ],
        capacity: [
          { required: true, message: '请输入容量', trigger: 'blur' },
          { type: 'number', min: 0, message: '容量必须大于等于0', trigger: 'blur' }
        ]
      },
      
      // 库位详情对话框
      locationDetailDialog: {
        visible: false
      },
      
      // 选中的库位详情
      selectedLocationDetail: {},
      
      // 导入对话框
      importDialog: {
        visible: false
      },
      
      // 库位布局图对话框
      layoutDialog: {
        visible: false,
        selectedWarehouseId: '',
        selectedZoneId: '',
        showEmptyLocation: true,
        showStatusColor: true
      },
      
      // 布局图数据
      layoutData: [],
      
      // 批量创建对话框
      batchCreateDialog: {
        visible: false
      },
      
      // 批量创建表单
      batchCreateForm: {
        warehouseId: '',
        zoneId: '',
        prefix: '',
        startNumber: 1,
        endNumber: 10,
        type: 'regular',
        capacity: 0,
        unit: '个'
      },
      
      // 批量创建表单验证规则
      batchCreateFormRules: {
        warehouseId: [
          { required: true, message: '请选择仓库', trigger: 'blur' }
        ],
        zoneId: [
          { required: true, message: '请选择区域', trigger: 'blur' }
        ],
        prefix: [
          { required: true, message: '请输入库位前缀', trigger: 'blur' }
        ],
        startNumber: [
          { required: true, message: '请输入起始序号', trigger: 'blur' },
          { type: 'number', min: 1, message: '起始序号必须大于0', trigger: 'blur' }
        ],
        endNumber: [
          { required: true, message: '请输入结束序号', trigger: 'blur' },
          { type: 'number', min: 1, message: '结束序号必须大于0', trigger: 'blur' },
          { validator: this.validateEndNumber, trigger: 'blur' }
        ],
        capacity: [
          { required: true, message: '请输入容量', trigger: 'blur' },
          { type: 'number', min: 0, message: '容量必须大于等于0', trigger: 'blur' }
        ]
      }
    }
  },
  
  computed: {
    // 是否为编辑模式
    isEditMode() {
      return !!this.locationForm.id
    },
    
    // 过滤后的区域列表
    filteredZoneList() {
      if (!this.locationForm.warehouseId) return []
      return this.zoneList.filter(zone => zone.warehouseId === this.locationForm.warehouseId)
    },
    
    // 统计信息
    totalLocations() {
      return this.locationList.length
    },
    
    activeLocations() {
      return this.locationList.filter(location => location.status === 'active').length
    },
    
    inactiveLocations() {
      return this.locationList.filter(location => location.status === 'inactive').length
    },
    
    occupiedLocations() {
      return this.locationList.filter(location => location.isOccupied).length
    },
    
    emptyLocations() {
      return this.locationList.filter(location => !location.isOccupied).length
    }
  },
  
  mounted() {
    // 初始化加载数据
    this.loadLocationList()
  },
  
  methods: {
    // 加载库位列表
    loadLocationList() {
      // 模拟API请求
      const mockData = []
      for (let i = 1; i <= 50; i++) {
        const isActive = Math.random() > 0.2
        const isOccupied = Math.random() > 0.4
        const capacity = Math.floor(Math.random() * 1000) + 100
        const occupiedCapacity = isOccupied ? Math.floor(Math.random() * capacity) : 0
        
        mockData.push({
          id: i,
          code: `LOC${String(i).padStart(4, '0')}`,
          name: `库位${i}`,
          warehouseId: Math.floor(Math.random() * 3) + 1,
          warehouseName: `仓库${Math.floor(Math.random() * 3) + 1}`,
          zoneId: Math.floor(Math.random() * 4) + 1,
          zoneName: `区域${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`,
          aisle: `A${Math.floor(Math.random() * 5) + 1}`,
          rack: `R${Math.floor(Math.random() * 10) + 1}`,
          shelf: `${Math.floor(Math.random() * 5) + 1}`,
          position: `${Math.floor(Math.random() * 10) + 1}`,
          type: ['regular', 'cold', 'frozen', 'dangerous', 'highValue'][Math.floor(Math.random() * 5)],
          capacity: capacity,
          unit: ['个', '箱', '托盘', '千克'][Math.floor(Math.random() * 4)],
          occupiedCapacity: occupiedCapacity,
          availableCapacity: capacity - occupiedCapacity,
          isOccupied: isOccupied,
          status: isActive ? 'active' : 'inactive',
          remark: Math.random() > 0.5 ? `这是库位${i}的备注信息` : '',
          createdBy: 'admin',
          createdTime: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toLocaleString(),
          itemCount: isOccupied ? Math.floor(Math.random() * 10) + 1 : 0
        })
      }
      
      // 应用筛选条件
      let filteredData = [...mockData]
      if (this.searchForm.warehouseId) {
        filteredData = filteredData.filter(item => item.warehouseId === Number(this.searchForm.warehouseId))
      }
      if (this.searchForm.locationCode) {
        filteredData = filteredData.filter(item => item.code.includes(this.searchForm.locationCode))
      }
      if (this.searchForm.locationName) {
        filteredData = filteredData.filter(item => item.name.includes(this.searchForm.locationName))
      }
      if (this.searchForm.zoneId) {
        filteredData = filteredData.filter(item => item.zoneId === Number(this.searchForm.zoneId))
      }
      if (this.searchForm.status) {
        filteredData = filteredData.filter(item => item.status === this.searchForm.status)
      }
      
      // 更新分页数据
      this.pagination.total = filteredData.length
      const startIndex = (this.pagination.currentPage - 1) * this.pagination.pageSize
      const endIndex = startIndex + this.pagination.pageSize
      this.locationList = filteredData.slice(startIndex, endIndex)
    },
    
    // 处理搜索
    handleSearch() {
      this.pagination.currentPage = 1
      this.loadLocationList()
    },
    
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        warehouseId: '',
        locationCode: '',
        locationName: '',
        zoneId: '',
        status: ''
      }
      this.pagination.currentPage = 1
      this.loadLocationList()
    },
    
    // 分页大小变化
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.loadLocationList()
    },
    
    // 当前页变化
    handleCurrentChange(current) {
      this.pagination.currentPage = current
      this.loadLocationList()
    },
    
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedLocations = selection
    },
    
    // 显示新增库位表单
    showAddLocationForm() {
      this.locationFormDialog.title = '新增库位'
      this.locationForm = {
        id: null,
        warehouseId: '',
        zoneId: '',
        code: '',
        name: '',
        aisle: '',
        rack: '',
        shelf: '',
        position: '',
        type: 'regular',
        capacity: 0,
        unit: '个',
        status: 'active',
        remark: ''
      }
      this.locationFormDialog.visible = true
    },
    
    // 显示编辑库位表单
    showEditLocationForm(location) {
      this.locationFormDialog.title = '编辑库位'
      this.locationForm = { ...location }
      this.locationFormDialog.visible = true
    },
    
    // 关闭库位表单
    closeLocationForm() {
      this.locationFormDialog.visible = false
      this.$refs.locationFormRef && this.$refs.locationFormRef.resetFields()
    },
    
    // 提交库位表单
    submitLocationForm() {
      this.$refs.locationFormRef.validate((valid) => {
        if (valid) {
          // 模拟保存操作
          this.$message.success(this.isEditMode ? '编辑成功' : '新增成功')
          this.closeLocationForm()
          this.loadLocationList()
        }
      })
    },
    
    // 验证库位编码
    validateLocationCode(rule, value, callback) {
      if (!value) {
        callback(new Error('请输入库位编码'))
      } else {
        // 检查是否重复
        const exists = this.locationList.some(item => 
          item.code === value && (!this.isEditMode || item.id !== this.locationForm.id)
        )
        if (exists) {
          callback(new Error('库位编码已存在'))
        } else {
          callback()
        }
      }
    },
    
    // 删除库位
    deleteLocation(id) {
      this.$confirm('确定要删除此库位吗？删除后将无法恢复。', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        this.$message.success('删除成功')
        this.loadLocationList()
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 批量删除库位
    batchDeleteLocation() {
      if (this.selectedLocations.length === 0) {
        this.$message.warning('请先选择要删除的库位')
        return
      }
      
      this.$confirm(`确定要删除选中的${this.selectedLocations.length}个库位吗？删除后将无法恢复。`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量删除操作
        this.$message.success('删除成功')
        this.loadLocationList()
        this.selectedLocations = []
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 查看库位详情
    viewLocationDetails(location) {
      // 模拟获取详情数据
      this.selectedLocationDetail = {
        ...location,
        operationLogs: [
          {
            operationType: '创建',
            operator: 'admin',
            operationTime: new Date(Date.now() - 5 * 86400000).toLocaleString(),
            description: '创建库位'
          },
          {
            operationType: '修改',
            operator: 'user1',
            operationTime: new Date(Date.now() - 2 * 86400000).toLocaleString(),
            description: '更新库位信息'
          }
        ]
      }
      this.locationDetailDialog.visible = true
    },
    
    // 处理导入库位
    handleImportLocation() {
      this.importDialog.visible = true
    },
    
    // 导入前处理
    beforeImportUpload(file) {
      // 模拟导入前检查
      const isValid = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      if (!isValid) {
        this.$message.error('只允许上传.xlsx或.xls格式的文件')
        return false
      }
      return true
    },
    
    // 导入成功处理
    handleImportSuccess(response, file, fileList) {
      this.$message.success('导入成功')
      this.importDialog.visible = false
      this.loadLocationList()
    },
    
    // 导入失败处理
    handleImportError(err, file, fileList) {
      this.$message.error('导入失败')
    },
    
    // 下载导入模板
    downloadImportTemplate() {
      // 模拟下载模板
      this.$message.success('模板下载中...')
    },
    
    // 处理导出库位
    handleExportLocation() {
      // 模拟导出操作
      this.$message.success('导出成功')
    },
    
    // 显示库位布局图
    showLocationLayout() {
      this.layoutDialog.selectedWarehouseId = ''
      this.layoutDialog.selectedZoneId = ''
      this.layoutDialog.visible = true
      this.loadLayoutData()
    },
    
    // 加载布局数据
    loadLayoutData() {
      // 模拟布局数据
      this.layoutData = []
      
      // 生成布局数据
      const rows = 10
      const cols = 8
      
      for (let i = 1; i <= rows; i++) {
        for (let j = 1; j <= cols; j++) {
          const isActive = Math.random() > 0.2
          const isOccupied = Math.random() > 0.4
          
          if (this.layoutDialog.showEmptyLocation || isOccupied) {
            this.layoutData.push({
              id: i * 100 + j,
              code: `A${String(i).padStart(2, '0')}${String(j).padStart(2, '0')}`,
              name: `库位${i}-${j}`,
              status: isActive ? 'active' : 'inactive',
              isOccupied: isOccupied,
              capacity: 100,
              occupiedCapacity: isOccupied ? Math.floor(Math.random() * 100) : 0
            })
          }
        }
      }
    },
    
    // 获取库位类型名称
    getLocationTypeName(type) {
      const typeMap = {
        regular: '普通库位',
        cold: '冷藏库位',
        frozen: '冷冻库位',
        dangerous: '危险品库位',
        highValue: '高值库位'
      }
      return typeMap[type] || type
    },
    
    // 获取库位类型标签类型
    getLocationTypeTagType(type) {
      const typeMap = {
        regular: 'info',
        cold: 'primary',
        frozen: 'success',
        dangerous: 'danger',
        highValue: 'warning'
      }
      return typeMap[type] || 'info'
    },
    
    // 获取库位状态类
    getLocationStatusClass(status) {
      if (!this.layoutDialog.showStatusColor) return ''
      return status === 'active' ? 'status-active' : 'status-inactive'
    },
    
    // 获取库位提示信息
    getLocationTooltip(location) {
      return `${location.code}: ${location.name}\n状态: ${location.status === 'active' ? '启用' : '禁用'}\n占用: ${location.occupiedCapacity}/${location.capacity}`
    },
    
    // 截断文本
    truncateText(text, length) {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
    },
    
    // 处理仓库变化
    handleWarehouseChange() {
      this.locationForm.zoneId = ''
    },
    
    // 处理区域变化
    handleZoneChange() {
      // 可以在这里添加一些逻辑
    },
    
    // 处理状态变化
    handleStatusChange(row) {
      // 模拟状态更新
      this.$message.success('状态更新成功')
    },
    
    // 判断是否可以修改库位
    canModifyLocation(row) {
      // 可以根据业务逻辑判断是否可以修改
      return true
    },
    
    // 生成库位编码
    generateLocationCode() {
      // 模拟生成库位编码
      const timestamp = Date.now().toString().slice(-6)
      this.locationForm.code = `LOC${timestamp}`
    },
    
    // 验证结束序号
    validateEndNumber(rule, value, callback) {
      if (!value) {
        callback(new Error('请输入结束序号'))
      } else if (value < this.batchCreateForm.startNumber) {
        callback(new Error('结束序号必须大于起始序号'))
      } else {
        callback()
      }
    },
    
    // 提交批量创建表单
    submitBatchCreateForm() {
      this.$refs.batchCreateFormRef.validate((valid) => {
        if (valid) {
          // 模拟批量创建操作
          const count = this.batchCreateForm.endNumber - this.batchCreateForm.startNumber + 1
          this.$message.success(`成功创建${count}个库位`)
          this.batchCreateDialog.visible = false
          this.loadLocationList()
        }
      })
    }
  }
}
</script>

<style scoped>
.location-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.toolbar {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.search-item {
  margin-right: 10px;
}

.action-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-container {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
}

.statistical-info {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 0;
}

.stat-content {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  padding: 10px 20px;
  flex: 1;
  min-width: 120px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.location-detail {
  margin-top: 10px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #303133;
  font-size: 16px;
}

.import-dialog .el-upload {
  margin-bottom: 10px;
}

.import-dialog .el-upload__tip {
  color: #606266;
}

.layout-dialog {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.layout-toolbar {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.layout-content {
  flex: 1;
  overflow: auto;
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 4px;
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.location-cell {
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.location-cell:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.location-cell.status-active {
  background-color: #f0f9ff;
  border-color: #409eff;
}

.location-cell.status-inactive {
  background-color: #f5f5f5;
  border-color: #dcdfe6;
  color: #909399;
}

.location-cell.occupied {
  border-color: #67c23a;
}

.location-cell.empty {
  border-color: #e6a23c;
}

.location-code {
  font-weight: bold;
  margin-bottom: 5px;
}

.location-name {
  font-size: 12px;
  color: #606266;
}

.location-capacity {
  font-size: 11px;
  color: #909399;
  margin-top: 5px;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-area,
  .action-area {
    flex-direction: column;
  }
  
  .search-item {
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .stat-content {
    flex-direction: column;
  }
  
  .stat-item {
    padding: 10px 0;
    border-bottom: 1px solid #ebeef5;
  }
  
  .stat-item:last-child {
    border-bottom: none;
  }
  
  .layout-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .layout-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}
</style>