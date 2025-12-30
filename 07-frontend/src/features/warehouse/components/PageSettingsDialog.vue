<template>
  <el-dialog
    v-model="visible"
    title="页面设置"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 业务变量设置 - 最重要 -->
      <el-tab-pane label="业务变量" name="businessVars">
        <div class="tab-content">
          <div class="tab-header">
            <el-button type="primary" size="small" @click="handleAddVar">
              <el-icon><Plus /></el-icon>
              新增变量
            </el-button>
          </div>
          
          <el-table :data="businessVariables" border stripe max-height="400">
            <el-table-column label="变量名称" width="180">
              <template #default="{ row }">
                <el-input v-model="row.name" placeholder="例如：最大库存天数" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="变量值" width="150">
              <template #default="{ row }">
                <el-input v-model="row.value" placeholder="例如：30" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="说明/备注">
              <template #default="{ row }">
                <el-input 
                  v-model="row.description" 
                  placeholder="例如：仓库最大库存保留天数" 
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ $index }">
                <el-button 
                  link 
                  type="danger" 
                  size="small" 
                  @click="handleRemoveVar($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="tab-footer">
            <el-button type="primary" @click="handleSaveVars">保存业务变量</el-button>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 流程管理 - 第二重要 -->
      <el-tab-pane label="流程管理" name="workflow">
        <div class="tab-content">
          <div class="tab-header">
            <el-button type="primary" size="small" @click="handleAddWorkflow">
              <el-icon><Plus /></el-icon>
              新增流程
            </el-button>
          </div>
          
          <el-table :data="workflowConfigs" border stripe max-height="400">
            <el-table-column label="触发按钮" width="150">
              <template #default="{ row }">
                <el-input v-model="row.buttonName" placeholder="例如：库存盘点" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="审批人员">
              <template #default="{ row }">
                <el-select 
                  v-model="row.approvers" 
                  multiple 
                  placeholder="选择审批人" 
                  size="small"
                  style="width: 100%"
                >
                  <el-option label="仓库管理员" value="warehouse_manager" />
                  <el-option label="财务主管" value="finance_manager" />
                  <el-option label="运营总监" value="operations_director" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="流程说明">
              <template #default="{ row }">
                <el-input 
                  v-model="row.description" 
                  placeholder="流程描述" 
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ $index }">
                <el-button 
                  link 
                  type="danger" 
                  size="small" 
                  @click="handleRemoveWorkflow($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="tab-footer">
            <el-button type="primary" @click="handleSaveWorkflows">保存流程配置</el-button>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 编码管理 - 第三重要 -->
      <el-tab-pane label="编码管理" name="codeRules">
        <div class="tab-content">
          <div class="tab-header">
            <el-button type="primary" size="small" @click="handleAddCodeRule">
              <el-icon><Plus /></el-icon>
              新增编码规则
            </el-button>
          </div>
          
          <el-table :data="codeRules" border stripe max-height="400">
            <el-table-column label="目标字段" width="150">
              <template #default="{ row }">
                <el-input v-model="row.fieldName" placeholder="例如：仓库编码" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="前缀" width="100">
              <template #default="{ row }">
                <el-input v-model="row.prefix" placeholder="WH" size="small" @input="updateExample(row)" />
              </template>
            </el-table-column>
            <el-table-column label="日期格式" width="130">
              <template #default="{ row }">
                <el-select v-model="row.dateFormat" size="small" @change="updateExample(row)">
                  <el-option label="年月日(YYYYMMDD)" value="YYYYMMDD" />
                  <el-option label="年月(YYYYMM)" value="YYYYMM" />
                  <el-option label="年(YYYY)" value="YYYY" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="流水号长度" width="120">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.serialLength" 
                  :min="2" 
                  :max="6" 
                  size="small"
                  @change="updateExample(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="示例">
              <template #default="{ row }">
                <span class="code-example">{{ row.example }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ $index }">
                <el-button 
                  link 
                  type="danger" 
                  size="small" 
                  @click="handleRemoveCodeRule($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="tab-footer">
            <el-button type="primary" @click="handleSaveCodeRules">保存编码规则</el-button>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 列管理 - 第四重要 -->
      <el-tab-pane label="列管理" name="columns">
        <div class="tab-content">
          <el-alert 
            type="info" 
            :closable="false" 
            style="margin-bottom: 15px"
          >
            拖动行可调整列顺序，勾选/取消勾选可控制显示/隐藏
          </el-alert>
          
          <draggable
            v-model="sortedColumns"
            item-key="prop"
            handle=".drag-handle"
            @end="handleColumnDragEnd"
          >
            <template #item="{ element }">
              <div class="column-item">
                <el-icon class="drag-handle">
                  <Rank />
                </el-icon>
                <el-checkbox 
                  v-model="element.visible"
                  @change="handleColumnVisibleChange"
                >
                  {{ element.label }}
                </el-checkbox>
                <span class="column-width">宽度: {{ element.width }}px</span>
              </div>
            </template>
          </draggable>
          
          <div class="tab-footer">
            <el-button type="primary" @click="handleSaveColumns">保存列配置</el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Plus, Rank } from '@element-plus/icons-vue'
import { draggable } from 'vuedraggable'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  businessVariables: {
    type: Array,
    default: () => []
  },
  workflowConfigs: {
    type: Array,
    default: () => []
  },
  codeRules: {
    type: Array,
    default: () => []
  },
  columnConfigs: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:modelValue',
  'add-var',
  'remove-var',
  'save-vars',
  'add-workflow',
  'remove-workflow',
  'save-workflows',
  'add-code-rule',
  'remove-code-rule',
  'save-code-rules',
  'update-code-example',
  'save-columns',
  'reorder-columns'
])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('businessVars')

// 排序后的列
const sortedColumns = computed({
  get: () => [...props.columnConfigs].sort((a, b) => a.order - b.order),
  set: (val) => {
    emit('reorder-columns', val)
  }
})

// 业务变量操作
const handleAddVar = () => emit('add-var')
const handleRemoveVar = (index) => emit('remove-var', index)
const handleSaveVars = () => emit('save-vars')

// 流程操作
const handleAddWorkflow = () => emit('add-workflow')
const handleRemoveWorkflow = (index) => emit('remove-workflow', index)
const handleSaveWorkflows = () => emit('save-workflows')

// 编码规则操作
const handleAddCodeRule = () => emit('add-code-rule')
const handleRemoveCodeRule = (index) => emit('remove-code-rule', index)
const handleSaveCodeRules = () => emit('save-code-rules')
const updateExample = (rule) => emit('update-code-example', rule)

// 列配置操作
const handleColumnDragEnd = () => {
  emit('save-columns')
}
const handleColumnVisibleChange = () => {
  emit('save-columns')
}
const handleSaveColumns = () => emit('save-columns')
</script>

<style scoped lang="scss">
.settings-tabs {
  :deep(.el-tabs__content) {
    padding: 0;
  }
}

.tab-content {
  padding: 15px 0;
}

.tab-header {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-end;
}

.tab-footer {
  margin-top: 20px;
  text-align: right;
}

.code-example {
  font-family: 'Courier New', monospace;
  color: #409eff;
  font-weight: bold;
}

.column-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: white;
  border: 1px solid #e4e7ed;
  margin-bottom: 8px;
  border-radius: 4px;
  transition: all 0.3s;
  
  &:hover {
    background: #f5f7fa;
    border-color: #409eff;
  }
  
  .drag-handle {
    cursor: move;
    margin-right: 12px;
    color: #909399;
    font-size: 18px;
    
    &:hover {
      color: #409eff;
    }
  }
  
  .el-checkbox {
    flex: 1;
  }
  
  .column-width {
    color: #909399;
    font-size: 12px;
    margin-left: 15px;
  }
}
</style>