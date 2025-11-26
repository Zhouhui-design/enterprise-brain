<template>
  <div class="package-manager">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Box /></el-icon>
          <span>包装管理</span>
        </div>
      </template>
      
      <div class="package-manager-content">
        <!-- 工具栏 -->
        <div class="toolbar">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索包装规格"
                prefix-icon="el-icon-search"
                clearable
              />
            </el-col>
            <el-col :span="4">
              <el-select
                v-model="selectedPackageType"
                placeholder="选择包装类型"
                clearable
              >
                <el-option
                  v-for="type in packageTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select
                v-model="selectedPackageStatus"
                placeholder="选择状态"
                clearable
              >
                <el-option label="启用" value="ACTIVE" />
                <el-option label="禁用" value="INACTIVE" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-button
                type="primary"
                @click="showAddDialog = true"
              >
                <el-icon><Plus /></el-icon>
                新增包装
              </el-button>
            </el-col>
            <el-col :span="6" class="text-right">
              <el-button
                type="success"
                @click="batchGenerate"
                :disabled="selectedPackages.length === 0"
              >
                <el-icon><Sort /></el-icon>
                批量生成包装方案
              </el-button>
            </el-col>
          </el-row>
        </div>
        
        <!-- 包装规格列表 -->
        <div class="package-list-section">
          <el-table
            v-loading="loading"
            :data="filteredPackageList"
            style="width: 100%"
            border
            @selection-change="handleSelectionChange"
            class="package-table"
          >
            <el-table-column
              type="selection"
              width="55"
              fixed="left"
            />
            <el-table-column
              prop="id"
              label="包装ID"
              width="100"
              fixed="left"
            />
            <el-table-column
              prop="name"
              label="包装名称"
              width="180"
              sortable
            />
            <el-table-column
              prop="type"
              label="包装类型"
              width="120"
            >
              <template #default="{ row }">
                <el-tag :type="getPackageTypeTagType(row.type)">
                  {{ getPackageTypeLabel(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="description"
              label="包装描述"
              min-width="150"
            />
            <el-table-column
              label="尺寸规格"
              min-width="180"
            >
              <template #default="{ row }">
                <div>
                  <span>{{ row.length }} × {{ row.width }} × {{ row.height }} cm</span>
                  <span class="volume-text">({{ row.volume }} m³)</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              prop="maxWeight"
              label="最大承重(kg)"
              width="120"
              sortable
            />
            <el-table-column
              prop="cost"
              label="包装成本(元)"
              width="120"
              sortable
            >
              <template #default="{ row }">
                <span class="cost-text">{{ row.cost.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="status"
              label="状态"
              width="80"
            >
              <template #default="{ row }">
                <el-switch
                  v-model="row.status"
                  active-value="ACTIVE"
                  inactive-value="INACTIVE"
                  active-text="启用"
                  inactive-text="禁用"
                  @change="updatePackageStatus(row)"
                />
              </template>
            </el-table-column>
            <el-table-column
              prop="createdTime"
              label="创建时间"
              width="150"
              sortable
            >
              <template #default="{ row }">
                {{ formatDate(row.createdTime) }}
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              width="150"
              fixed="right"
            >
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="editPackage(row)"
                  class="mr-10"
                >
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="deletePackage(row)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredPackageList.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
        
        <!-- 包装方案预览 -->
        <div v-if="packagePlan.previewVisible" class="package-plan-preview">
          <el-card shadow="never" class="preview-card">
            <template #header>
              <div class="sub-header">
                <el-icon><Show /></el-icon>
                <span>包装方案预览</span>
              </div>
            </template>
            
            <div class="preview-content">
              <el-descriptions :column="4" border>
                <el-descriptions-item label="总物品数量">{{ packagePlan.totalItems }}</el-descriptions-item>
                <el-descriptions-item label="总包装数量">{{ packagePlan.totalPackages }}</el-descriptions-item>
                <el-descriptions-item label="总包装成本">{{ packagePlan.totalCost.toFixed(2) }} 元</el-descriptions-item>
                <el-descriptions-item label="方案优化">{{ packagePlan.optimizationLevel }}</el-descriptions-item>
              </el-descriptions>
              
              <el-table
                :data="packagePlan.packages"
                style="width: 100%; margin-top: 20px"
                border
              >
                <el-table-column prop="packageName" label="包装类型" width="150" />
                <el-table-column prop="quantity" label="数量" width="80" />
                <el-table-column prop="itemsCount" label="物品数量" width="100" />
                <el-table-column prop="totalWeight" label="总重量(kg)" width="120" />
                <el-table-column prop="totalVolume" label="总体积(m³)" width="120" />
                <el-table-column prop="cost" label="成本(元)" width="100" />
                <el-table-column prop="remark" label="备注" min-width="200" />
              </el-table>
              
              <div class="preview-actions">
                <el-button @click="packagePlan.previewVisible = false">关闭预览</el-button>
                <el-button type="primary" @click="savePackagePlan">保存方案</el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>
      
      <!-- 新增/编辑包装对话框 -->
      <el-dialog
        v-model="showAddDialog"
        :title="dialogTitle"
        width="600px"
        :before-close="handleClose"
      >
        <el-form
          ref="packageFormRef"
          :model="packageForm"
          :rules="packageRules"
          label-width="100px"
          class="package-form"
        >
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="包装名称" prop="name">
                <el-input v-model="packageForm.name" placeholder="请输入包装名称" />
              </el-form-item>
              
              <el-form-item label="包装类型" prop="type">
                <el-select v-model="packageForm.type" placeholder="请选择包装类型">
                  <el-option
                    v-for="type in packageTypes"
                    :key="type.value"
                    :label="type.label"
                    :value="type.value"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="包装描述" prop="description">
                <el-input
                  v-model="packageForm.description"
                  type="textarea"
                  placeholder="请输入包装描述"
                  :rows="2"
                />
              </el-form-item>
            </el-col>
            
            <el-col :span="8">
              <el-form-item label="长(cm)" prop="length">
                <el-input-number
                  v-model.number="packageForm.length"
                  :min="0.1"
                  :step="0.1"
                  style="width: 100%"
                  @change="calculateVolume"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="宽(cm)" prop="width">
                <el-input-number
                  v-model.number="packageForm.width"
                  :min="0.1"
                  :step="0.1"
                  style="width: 100%"
                  @change="calculateVolume"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="高(cm)" prop="height">
                <el-input-number
                  v-model.number="packageForm.height"
                  :min="0.1"
                  :step="0.1"
                  style="width: 100%"
                  @change="calculateVolume"
                />
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="体积(m³)" prop="volume">
                <el-input v-model="packageForm.volume" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最大承重(kg)" prop="maxWeight">
                <el-input-number
                  v-model.number="packageForm.maxWeight"
                  :min="0.1"
                  :step="0.1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            
            <el-col :span="24">
              <el-form-item label="包装成本(元)" prop="cost">
                <el-input-number
                  v-model.number="packageForm.cost"
                  :min="0"
                  :step="0.01"
                  style="width: 200px"
                  prefix-icon="el-icon-money"
                />
              </el-form-item>
            </el-col>
            
            <el-col :span="24">
              <el-form-item label="包装材料" prop="materials">
                <el-select
                  v-model="packageForm.materials"
                  placeholder="请选择包装材料"
                  multiple
                >
                  <el-option label="纸箱" value="纸箱" />
                  <el-option label="木箱" value="木箱" />
                  <el-option label="塑料袋" value="塑料袋" />
                  <el-option label="气泡膜" value="气泡膜" />
                  <el-option label="泡沫板" value="泡沫板" />
                  <el-option label="拉伸膜" value="拉伸膜" />
                  <el-option label="胶带" value="胶带" />
                  <el-option label="其他" value="其他" />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :span="24">
              <el-form-item label="注意事项" prop="notes">
                <el-input
                  v-model="packageForm.notes"
                  type="textarea"
                  placeholder="请输入包装注意事项"
                  :rows="3"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        
        <template #footer>
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="savePackage">保存</el-button>
        </template>
      </el-dialog>
      
      <!-- 包装方案配置对话框 -->
      <el-dialog
        v-model="showPlanConfigDialog"
        title="包装方案配置"
        width="800px"
        :before-close="closePlanConfigDialog"
      >
        <div class="plan-config-content">
          <div class="config-section">
            <h3>包装规则配置</h3>
            <el-form
              ref="planConfigFormRef"
              :model="planConfigForm"
              label-width="150px"
            >
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="优化目标">
                    <el-radio-group v-model="planConfigForm.optimizationTarget">
                      <el-radio label="COST">成本优先</el-radio>
                      <el-radio label="SPACE">空间优先</el-radio>
                      <el-radio label="BALANCE">平衡优化</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="包装利用率阈值">
                    <el-slider
                      v-model="planConfigForm.utilizationThreshold"
                      :min="50"
                      :max="100"
                      :marks="{50: '50%', 75: '75%', 90: '90%', 100: '100%'}"
                    >
                      <template #tooltip>
                        <div class="custom-tooltip">{{ planConfigForm.utilizationThreshold }}%</div>
                      </template>
                    </el-slider>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="允许使用的包装类型">
                    <el-checkbox-group v-model="planConfigForm.allowedPackageTypes">
                      <el-checkbox
                        v-for="type in packageTypes"
                        :key="type.value"
                        :label="type.value"
                      >
                        {{ type.label }}
                      </el-checkbox>
                    </el-checkbox-group>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="堆叠规则">
                    <el-checkbox-group v-model="planConfigForm.stackingRules">
                      <el-checkbox label="HEIGHT_LIMIT">高度限制</el-checkbox>
                      <el-checkbox label="WEIGHT_LIMIT">重量限制</el-checkbox>
                      <el-checkbox label="FRAGILE_SEPARATE">易碎品分离</el-checkbox>
                      <el-checkbox label="SIZE_MATCH">尺寸匹配</el-checkbox>
                    </el-checkbox-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="最大堆叠层数" v-if="planConfigForm.stackingRules.includes('HEIGHT_LIMIT')">
                    <el-input-number
                      v-model="planConfigForm.maxStackingLayers"
                      :min="1"
                      :max="10"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="最大允许重量" v-if="planConfigForm.stackingRules.includes('WEIGHT_LIMIT')">
                    <el-input-number
                      v-model="planConfigForm.maxStackingWeight"
                      :min="1"
                      :step="1"
                      style="width: 100%"
                    >
                      <template #append>kg</template>
                    </el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
          
          <div class="items-section">
            <h3>待包装物品</h3>
            <el-button
              type="primary"
              size="small"
              @click="showAddItemDialog = true"
              class="add-item-btn"
            >
              <el-icon><Plus /></el-icon>
              添加物品
            </el-button>
            
            <el-table
              :data="planItems"
              style="width: 100%"
              border
              class="items-table"
            >
              <el-table-column prop="name" label="物品名称" width="180" />
              <el-table-column prop="quantity" label="数量" width="80" />
              <el-table-column prop="weight" label="重量(kg)" width="100" />
              <el-table-column prop="dimensions" label="尺寸(cm)" width="150">
                <template #default="{ row }">
                  {{ row.length }} × {{ row.width }} × {{ row.height }}
                </template>
              </el-table-column>
              <el-table-column prop="category" label="类别" width="120">
                <template #default="{ row }">
                  <el-tag :type="getItemCategoryTagType(row.category)">
                    {{ row.category }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="fragile" label="易碎" width="80">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.fragile"
                    active-color="#f56c6c"
                    active-text="是"
                    inactive-text="否"
                    :active-value="true"
                    :inactive-value="false"
                    disabled
                  />
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" min-width="150" />
              <el-table-column label="操作" width="80" fixed="right">
                <template #default="{ $index }">
                  <el-button
                    type="danger"
                    size="small"
                    @click="deletePlanItem($index)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        
        <template #footer>
          <el-button @click="closePlanConfigDialog">取消</el-button>
          <el-button type="primary" @click="generatePackagePlan">生成包装方案</el-button>
        </template>
      </el-dialog>
      
      <!-- 添加物品对话框 -->
      <el-dialog
        v-model="showAddItemDialog"
        title="添加待包装物品"
        width="500px"
        :before-close="closeAddItemDialog"
      >
        <el-form
          ref="itemFormRef"
          :model="itemForm"
          :rules="itemRules"
          label-width="100px"
        >
          <el-form-item label="物品名称" prop="name">
            <el-input v-model="itemForm.name" placeholder="请输入物品名称" />
          </el-form-item>
          <el-form-item label="数量" prop="quantity">
            <el-input-number
              v-model.number="itemForm.quantity"
              :min="1"
              :step="1"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="重量(kg)" prop="weight">
            <el-input-number
              v-model.number="itemForm.weight"
              :min="0.1"
              :step="0.1"
              style="width: 100%"
            />
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="长(cm)" prop="length">
                <el-input-number
                  v-model.number="itemForm.length"
                  :min="0.1"
                  :step="0.1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="宽(cm)" prop="width">
                <el-input-number
                  v-model.number="itemForm.width"
                  :min="0.1"
                  :step="0.1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="高(cm)" prop="height">
                <el-input-number
                  v-model.number="itemForm.height"
                  :min="0.1"
                  :step="0.1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="物品类别" prop="category">
            <el-select v-model="itemForm.category" placeholder="请选择物品类别">
              <el-option label="普通商品" value="普通商品" />
              <el-option label="电子产品" value="电子产品" />
              <el-option label="服装鞋帽" value="服装鞋帽" />
              <el-option label="食品饮料" value="食品饮料" />
              <el-option label="医疗器械" value="医疗器械" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="是否易碎" prop="fragile">
            <el-switch
              v-model="itemForm.fragile"
              active-color="#f56c6c"
              active-text="是"
              inactive-text="否"
            />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="itemForm.remark"
              type="textarea"
              placeholder="请输入备注信息"
              :rows="2"
            />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <el-button @click="closeAddItemDialog">取消</el-button>
          <el-button type="primary" @click="savePlanItem">添加</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Box,
  Plus,
  Edit,
  Delete,
  Show,
  Sort
} from '@element-plus/icons-vue';

export default {
  name: 'PackageManager',
  components: {
    Box,
    Plus,
    Edit,
    Delete,
    Show,
    Sort
  },
  emits: ['package-updated', 'plan-generated'],
  setup(props, { emit }) {
    // 状态管理
    const loading = ref(false);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const selectedPackages = ref([]);
    const searchKeyword = ref('');
    const selectedPackageType = ref('');
    const selectedPackageStatus = ref('');
    
    // 对话框状态
    const showAddDialog = ref(false);
    const showPlanConfigDialog = ref(false);
    const showAddItemDialog = ref(false);
    const isEditing = ref(false);
    
    // 包装类型选项
    const packageTypes = [
      { label: '纸箱', value: 'CARTON' },
      { label: '木箱', value: 'WOODEN_BOX' },
      { label: '塑料袋', value: 'PLASTIC_BAG' },
      { label: '托盘', value: 'PALLET' },
      { label: '集装箱', value: 'CONTAINER' },
      { label: '其他', value: 'OTHER' }
    ];
    
    // 包装列表（模拟数据）
    const packageList = ref([
      {
        id: 'PK001',
        name: '标准纸箱 A',
        type: 'CARTON',
        description: '通用标准尺寸纸箱',
        length: 50,
        width: 40,
        height: 30,
        volume: 0.06,
        maxWeight: 20,
        cost: 3.5,
        materials: ['纸箱', '胶带'],
        notes: '适合大多数普通商品',
        status: 'ACTIVE',
        createdTime: '2023-01-15 10:30:00'
      },
      {
        id: 'PK002',
        name: '加固木箱',
        type: 'WOODEN_BOX',
        description: '高强度加固木箱，适合贵重物品',
        length: 100,
        width: 80,
        height: 60,
        volume: 0.48,
        maxWeight: 200,
        cost: 50.0,
        materials: ['木箱', '泡沫板', '胶带'],
        notes: '需特殊定制，适合贵重或易碎物品',
        status: 'ACTIVE',
        createdTime: '2023-01-20 14:20:00'
      },
      {
        id: 'PK003',
        name: '快递袋',
        type: 'PLASTIC_BAG',
        description: '标准快递塑料袋',
        length: 38,
        width: 28,
        height: 10,
        volume: 0.01064,
        maxWeight: 5,
        cost: 0.8,
        materials: ['塑料袋'],
        notes: '适合服装、文件等轻质物品',
        status: 'ACTIVE',
        createdTime: '2023-01-25 09:15:00'
      },
      {
        id: 'PK004',
        name: '标准托盘',
        type: 'PALLET',
        description: '标准物流托盘',
        length: 120,
        width: 100,
        height: 15,
        volume: 0.18,
        maxWeight: 1000,
        cost: 150.0,
        materials: ['木材'],
        notes: '适合大批量货物堆叠',
        status: 'ACTIVE',
        createdTime: '2023-02-01 16:40:00'
      },
      {
        id: 'PK005',
        name: '小型纸箱 B',
        type: 'CARTON',
        description: '小号纸箱，适合小件物品',
        length: 30,
        width: 25,
        height: 20,
        volume: 0.015,
        maxWeight: 10,
        cost: 1.5,
        materials: ['纸箱', '胶带'],
        notes: '适合小件电子产品或配件',
        status: 'ACTIVE',
        createdTime: '2023-02-10 11:05:00'
      }
    ]);
    
    // 包装表单
    const packageForm = reactive({
      id: '',
      name: '',
      type: '',
      description: '',
      length: 0,
      width: 0,
      height: 0,
      volume: 0,
      maxWeight: 0,
      cost: 0,
      materials: [],
      notes: '',
      status: 'ACTIVE',
      createdTime: ''
    });
    
    // 包装表单验证规则
    const packageRules = {
      name: [
        { required: true, message: '请输入包装名称', trigger: 'blur' },
        { min: 1, max: 50, message: '包装名称长度在 1 到 50 个字符', trigger: 'blur' }
      ],
      type: [
        { required: true, message: '请选择包装类型', trigger: 'blur' }
      ],
      length: [
        { required: true, message: '请输入长度', trigger: 'blur' },
        { type: 'number', min: 0.1, message: '长度必须大于0.1', trigger: 'blur' }
      ],
      width: [
        { required: true, message: '请输入宽度', trigger: 'blur' },
        { type: 'number', min: 0.1, message: '宽度必须大于0.1', trigger: 'blur' }
      ],
      height: [
        { required: true, message: '请输入高度', trigger: 'blur' },
        { type: 'number', min: 0.1, message: '高度必须大于0.1', trigger: 'blur' }
      ],
      maxWeight: [
        { required: true, message: '请输入最大承重', trigger: 'blur' },
        { type: 'number', min: 0.1, message: '最大承重必须大于0.1', trigger: 'blur' }
      ],
      cost: [
        { required: true, message: '请输入包装成本', trigger: 'blur' },
        { type: 'number', min: 0, message: '包装成本不能为负数', trigger: 'blur' }
      ]
    };
    
    // 包装方案配置表单
    const planConfigForm = reactive({
      optimizationTarget: 'COST',
      utilizationThreshold: 85,
      allowedPackageTypes: ['CARTON', 'PLASTIC_BAG'],
      stackingRules: ['WEIGHT_LIMIT', 'FRAGILE_SEPARATE'],
      maxStackingLayers: 3,
      maxStackingWeight: 50
    });
    
    // 待包装物品列表
    const planItems = ref([
      {
        id: 1,
        name: '智能手机',
        quantity: 10,
        weight: 0.2,
        length: 15,
        width: 7,
        height: 1,
        category: '电子产品',
        fragile: true,
        remark: '使用防摔包装'
      },
      {
        id: 2,
        name: '棉质T恤',
        quantity: 50,
        weight: 0.25,
        length: 40,
        width: 30,
        height: 5,
        category: '服装鞋帽',
        fragile: false,
        remark: '可折叠包装'
      }
    ]);
    
    // 物品表单
    const itemForm = reactive({
      name: '',
      quantity: 1,
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      category: '',
      fragile: false,
      remark: ''
    });
    
    // 物品表单验证规则
    const itemRules = {
      name: [
        { required: true, message: '请输入物品名称', trigger: 'blur' }
      ],
      quantity: [
        { required: true, message: '请输入数量', trigger: 'blur' },
        { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' }
      ],
      weight: [
        { required: true, message: '请输入重量', trigger: 'blur' },
        { type: 'number', min: 0.1, message: '重量必须大于0.1', trigger: 'blur' }
      ],
      length: [
        { required: true, message: '请输入长度', trigger: 'blur' },
        { type: 'number', min: 0.1, message: '长度必须大于0.1', trigger: 'blur' }
      ],
      width: [
        { required: true, message: '请输入宽度', trigger: 'blur' },
        { type: 'number', min: 0.1, message: '宽度必须大于0.1', trigger: 'blur' }
      ],
      height: [
        { required: true, message: '请输入高度', trigger: 'blur' },
        { type: 'number', min: 0.1, message: '高度必须大于0.1', trigger: 'blur' }
      ],
      category: [
        { required: true, message: '请选择物品类别', trigger: 'blur' }
      ]
    };
    
    // 包装方案
    const packagePlan = reactive({
      previewVisible: false,
      totalItems: 0,
      totalPackages: 0,
      totalCost: 0,
      optimizationLevel: '',
      packages: []
    });
    
    // 计算属性
    const filteredPackageList = computed(() => {
      let filtered = packageList.value;
      
      // 关键词搜索
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        filtered = filtered.filter(pkg => 
          pkg.name.toLowerCase().includes(keyword) ||
          pkg.description.toLowerCase().includes(keyword) ||
          pkg.id.toLowerCase().includes(keyword)
        );
      }
      
      // 包装类型筛选
      if (selectedPackageType.value) {
        filtered = filtered.filter(pkg => pkg.type === selectedPackageType.value);
      }
      
      // 状态筛选
      if (selectedPackageStatus.value) {
        filtered = filtered.filter(pkg => pkg.status === selectedPackageStatus.value);
      }
      
      return filtered;
    });
    
    const dialogTitle = computed(() => {
      return isEditing.value ? '编辑包装' : '新增包装';
    });
    
    // 方法
    const getPackageTypeLabel = (type) => {
      const typeMap = packageTypes.reduce((map, item) => {
        map[item.value] = item.label;
        return map;
      }, {});
      return typeMap[type] || type;
    };
    
    const getPackageTypeTagType = (type) => {
      const typeColorMap = {
        'CARTON': 'primary',
        'WOODEN_BOX': 'success',
        'PLASTIC_BAG': 'info',
        'PALLET': 'warning',
        'CONTAINER': 'danger',
        'OTHER': 'default'
      };
      return typeColorMap[type] || 'default';
    };
    
    const getItemCategoryTagType = (category) => {
      const categoryColorMap = {
        '电子产品': 'primary',
        '服装鞋帽': 'success',
        '食品饮料': 'warning',
        '医疗器械': 'danger',
        '普通商品': 'info',
        '其他': 'default'
      };
      return categoryColorMap[category] || 'default';
    };
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    const calculateVolume = () => {
      // 计算体积：长×宽×高 / 1000000 (转换为立方米)
      packageForm.volume = ((packageForm.length || 0) * (packageForm.width || 0) * (packageForm.height || 0) / 1000000).toFixed(6);
    };
    
    const handleSelectionChange = (selection) => {
      selectedPackages.value = selection;
    };
    
    const handleSizeChange = (newSize) => {
      pageSize.value = newSize;
      currentPage.value = 1;
    };
    
    const handleCurrentChange = (newCurrent) => {
      currentPage.value = newCurrent;
    };
    
    const updatePackageStatus = async (row) => {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 300));
        ElMessage.success(row.status === 'ACTIVE' ? '已启用' : '已禁用');
        emit('package-updated', { ...row });
      } catch (error) {
        // 回滚状态
        row.status = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        ElMessage.error('操作失败');
      }
    };
    
    const editPackage = (row) => {
      isEditing.value = true;
      Object.assign(packageForm, { ...row });
      showAddDialog.value = true;
    };
    
    const deletePackage = async (row) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除包装「${row.name}」吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 模拟删除操作
        const index = packageList.value.findIndex(pkg => pkg.id === row.id);
        if (index > -1) {
          packageList.value.splice(index, 1);
        }
        
        ElMessage.success('删除成功');
        emit('package-updated', { id: row.id, deleted: true });
      } catch (error) {
        // 用户取消删除
      }
    };
    
    const handleClose = () => {
      resetPackageForm();
      showAddDialog.value = false;
    };
    
    const resetPackageForm = () => {
      Object.assign(packageForm, {
        id: '',
        name: '',
        type: '',
        description: '',
        length: 0,
        width: 0,
        height: 0,
        volume: 0,
        maxWeight: 0,
        cost: 0,
        materials: [],
        notes: '',
        status: 'ACTIVE',
        createdTime: ''
      });
      isEditing.value = false;
    };
    
    const savePackage = async () => {
      // 手动验证
      if (!packageForm.name) {
        ElMessage.warning('请输入包装名称');
        return;
      }
      if (!packageForm.type) {
        ElMessage.warning('请选择包装类型');
        return;
      }
      if (!packageForm.length || packageForm.length <= 0) {
        ElMessage.warning('请输入有效的长度');
        return;
      }
      if (!packageForm.width || packageForm.width <= 0) {
        ElMessage.warning('请输入有效的宽度');
        return;
      }
      if (!packageForm.height || packageForm.height <= 0) {
        ElMessage.warning('请输入有效的高度');
        return;
      }
      if (!packageForm.maxWeight || packageForm.maxWeight <= 0) {
        ElMessage.warning('请输入有效的最大承重');
        return;
      }
      if (packageForm.cost < 0) {
        ElMessage.warning('包装成本不能为负数');
        return;
      }
      
      try {
        loading.value = true;
        
        // 重新计算体积
        calculateVolume();
        
        if (isEditing.value) {
          // 编辑现有包装
          const index = packageList.value.findIndex(pkg => pkg.id === packageForm.id);
          if (index > -1) {
            packageList.value[index] = { ...packageForm };
          }
          ElMessage.success('更新成功');
        } else {
          // 添加新包装
          const newPackage = {
            ...packageForm,
            id: `PK${String(packageList.value.length + 1).padStart(3, '0')}`,
            createdTime: new Date().toLocaleString('zh-CN')
          };
          packageList.value.unshift(newPackage);
          ElMessage.success('添加成功');
        }
        
        emit('package-updated', { ...packageForm });
        showAddDialog.value = false;
        resetPackageForm();
      } catch (error) {
        ElMessage.error('操作失败');
      } finally {
        loading.value = false;
      }
    };
    
    const batchGenerate = () => {
      showPlanConfigDialog.value = true;
    };
    
    const closePlanConfigDialog = () => {
      showPlanConfigDialog.value = false;
    };
    
    const closeAddItemDialog = () => {
      resetItemForm();
      showAddItemDialog.value = false;
    };
    
    const resetItemForm = () => {
      Object.assign(itemForm, {
        name: '',
        quantity: 1,
        weight: 0,
        length: 0,
        width: 0,
        height: 0,
        category: '',
        fragile: false,
        remark: ''
      });
    };
    
    const savePlanItem = () => {
      // 手动验证
      if (!itemForm.name) {
        ElMessage.warning('请输入物品名称');
        return;
      }
      if (!itemForm.quantity || itemForm.quantity <= 0) {
        ElMessage.warning('请输入有效的数量');
        return;
      }
      if (!itemForm.weight || itemForm.weight <= 0) {
        ElMessage.warning('请输入有效的重量');
        return;
      }
      if (!itemForm.length || itemForm.length <= 0) {
        ElMessage.warning('请输入有效的长度');
        return;
      }
      if (!itemForm.width || itemForm.width <= 0) {
        ElMessage.warning('请输入有效的宽度');
        return;
      }
      if (!itemForm.height || itemForm.height <= 0) {
        ElMessage.warning('请输入有效的高度');
        return;
      }
      if (!itemForm.category) {
        ElMessage.warning('请选择物品类别');
        return;
      }
      
      const newItem = {
        id: Math.max(...planItems.value.map(item => item.id), 0) + 1,
        ...itemForm
      };
      
      planItems.value.push(newItem);
      showAddItemDialog.value = false;
      resetItemForm();
      ElMessage.success('物品添加成功');
    };
    
    const deletePlanItem = (index) => {
      planItems.value.splice(index, 1);
      ElMessage.success('物品已删除');
    };
    
    const generatePackagePlan = async () => {
      try {
        loading.value = true;
        
        // 模拟包装方案生成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 计算总物品数量
        const totalItems = planItems.value.reduce((total, item) => total + item.quantity, 0);
        
        // 生成模拟的包装方案
        const selectedPackages = packageList.value.filter(pkg => 
          pkg.status === 'ACTIVE' && 
          planConfigForm.allowedPackageTypes.includes(pkg.type)
        );
        
        // 根据优化目标选择包装
        let packages = [];
        let totalCost = 0;
        let optimizationLevel = '良好';
        
        if (planConfigForm.optimizationTarget === 'COST') {
          // 成本优先：选择成本最低的包装
          const cheapestPackage = selectedPackages.sort((a, b) => a.cost - b.cost)[0];
          const packageCount = Math.ceil(totalItems / 10); // 假设每个包装最多放10个物品
          
          packages = [{
            packageId: cheapestPackage.id,
            packageName: cheapestPackage.name,
            quantity: packageCount,
            itemsCount: totalItems,
            totalWeight: planItems.value.reduce((w, item) => w + item.weight * item.quantity, 0),
            totalVolume: cheapestPackage.volume * packageCount,
            cost: cheapestPackage.cost * packageCount,
            remark: '成本优先方案'
          }];
          
          totalCost = cheapestPackage.cost * packageCount;
        } else if (planConfigForm.optimizationTarget === 'SPACE') {
          // 空间优先：选择空间利用率最高的包装
          const largestPackage = selectedPackages.sort((a, b) => b.volume - a.volume)[0];
          const packageCount = Math.ceil(totalItems / 15); // 假设大包装最多放15个物品
          
          packages = [{
            packageId: largestPackage.id,
            packageName: largestPackage.name,
            quantity: packageCount,
            itemsCount: totalItems,
            totalWeight: planItems.value.reduce((w, item) => w + item.weight * item.quantity, 0),
            totalVolume: largestPackage.volume * packageCount,
            cost: largestPackage.cost * packageCount,
            remark: '空间优先方案'
          }];
          
          totalCost = largestPackage.cost * packageCount;
        } else {
          // 平衡优化：混合使用不同包装
          const cartons = selectedPackages.filter(pkg => pkg.type === 'CARTON');
          const plasticBags = selectedPackages.filter(pkg => pkg.type === 'PLASTIC_BAG');
          
          const fragileItems = planItems.value.filter(item => item.fragile);
          const fragileCount = fragileItems.reduce((total, item) => total + item.quantity, 0);
          const nonFragileCount = totalItems - fragileCount;
          
          if (cartons.length > 0) {
            const carton = cartons[0];
            const cartonCount = Math.ceil(fragileCount / 5); // 易碎品每个包装放5个
            
            packages.push({
              packageId: carton.id,
              packageName: carton.name,
              quantity: cartonCount,
              itemsCount: fragileCount,
              totalWeight: fragileItems.reduce((w, item) => w + item.weight * item.quantity, 0),
              totalVolume: carton.volume * cartonCount,
              cost: carton.cost * cartonCount,
              remark: '易碎物品专用包装'
            });
            
            totalCost += carton.cost * cartonCount;
          }
          
          if (plasticBags.length > 0 && nonFragileCount > 0) {
            const plasticBag = plasticBags[0];
            const bagCount = Math.ceil(nonFragileCount / 20); // 普通物品每个包装放20个
            
            packages.push({
              packageId: plasticBag.id,
              packageName: plasticBag.name,
              quantity: bagCount,
              itemsCount: nonFragileCount,
              totalWeight: planItems.value.filter(item => !item.fragile).reduce((w, item) => w + item.weight * item.quantity, 0),
              totalVolume: plasticBag.volume * bagCount,
              cost: plasticBag.cost * bagCount,
              remark: '普通物品包装'
            });
            
            totalCost += plasticBag.cost * bagCount;
          }
          
          optimizationLevel = '优秀';
        }
        
        // 更新包装方案
        Object.assign(packagePlan, {
          previewVisible: true,
          totalItems,
          totalPackages: packages.reduce((total, p) => total + p.quantity, 0),
          totalCost,
          optimizationLevel,
          packages
        });
        
        showPlanConfigDialog.value = false;
        emit('plan-generated', { ...packagePlan });
      } catch (error) {
        ElMessage.error('生成包装方案失败');
      } finally {
        loading.value = false;
      }
    };
    
    const savePackagePlan = () => {
      ElMessage.success('包装方案已保存');
      packagePlan.previewVisible = false;
      
      // 这里可以添加保存到服务器的逻辑
      console.log('保存包装方案:', packagePlan);
    };
    
    // 初始化
    onMounted(() => {
      // 初始化数据，可以从API获取
    });
    
    return {
      loading,
      currentPage,
      pageSize,
      selectedPackages,
      searchKeyword,
      selectedPackageType,
      selectedPackageStatus,
      showAddDialog,
      showPlanConfigDialog,
      showAddItemDialog,
      isEditing,
      packageTypes,
      packageList,
      filteredPackageList,
      packageForm,
      packageRules,
      dialogTitle,
      planConfigForm,
      planItems,
      itemForm,
      itemRules,
      packagePlan,
      getPackageTypeLabel,
      getPackageTypeTagType,
      getItemCategoryTagType,
      formatDate,
      calculateVolume,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      updatePackageStatus,
      editPackage,
      deletePackage,
      handleClose,
      resetPackageForm,
      savePackage,
      batchGenerate,
      closePlanConfigDialog,
      closeAddItemDialog,
      resetItemForm,
      savePlanItem,
      deletePlanItem,
      generatePackagePlan,
      savePackagePlan
    };
  }
};
</script>

<style scoped>
.package-manager {
  width: 100%;
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 500;
}

.toolbar {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.package-table {
  margin-bottom: 20px;
}

.volume-text {
  color: #606266;
  font-size: 12px;
  margin-left: 5px;
}

.cost-text {
  color: #f56c6c;
  font-weight: 500;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.package-plan-preview {
  margin-top: 30px;
}

.preview-card {
  border-top: 2px solid #409eff;
}

.sub-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.preview-content {
  padding: 10px 0;
}

.preview-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.package-form {
  margin-bottom: 20px;
}

.plan-config-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.config-section h3,
.items-section h3 {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  font-size: 16px;
  font-weight: 500;
}

.custom-tooltip {
  color: #606266;
  font-size: 12px;
}

.add-item-btn {
  margin-bottom: 15px;
}

.items-table {
  max-height: 400px;
  overflow-y: auto;
}

.mr-10 {
  margin-right: 10px;
}

/* 响应式样式 */
@media (max-width: 1200px) {
  .toolbar {
    overflow-x: auto;
  }
  
  .toolbar .el-row {
    min-width: 900px;
  }
}

@media (max-width: 768px) {
  .preview-card {
    margin: 0 -20px;
  }
  
  .plan-config-content {
    gap: 20px;
  }
  
  .config-section h3,
  .items-section h3 {
    font-size: 14px;
  }
}
</style>