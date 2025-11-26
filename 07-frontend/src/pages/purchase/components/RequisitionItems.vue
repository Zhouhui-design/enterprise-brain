<template>
  <div class="requisition-items">
    <!-- 物料选择和添加区域 -->
    <el-card class="add-item-card">
      <div slot="header" class="card-header">
        <span>添加申请物料</span>
      </div>
      
      <el-form :inline="true" :model="addItemForm" class="add-item-form" @submit.native.prevent>
        <el-form-item label="物料编码/名称" required>
          <el-select
            v-model="addItemForm.materialId"
            placeholder="输入物料编码或名称搜索"
            filterable
            remote
            :remote-method="remoteSearchMaterial"
            :loading="loadingMaterial"
            style="width: 300px;"
            @change="onMaterialChange"
          >
            <el-option
              v-for="material in materialOptions"
              :key="material.id"
              :label="`${material.code} - ${material.name}`"
              :value="material.id"
            >
              <div class="option-content">
                <div class="option-main">{{ material.code }} - {{ material.name }}</div>
                <div class="option-sub">
                  <span class="category">{{ material.category }}</span>
                  <span class="spec">{{ material.specification }}</span>
                  <span class="unit">{{ material.unit }}</span>
                  <span class="stock" :class="{ 'stock-low': material.stockQuantity < material.safetyStock }">
                    库存: {{ material.stockQuantity }}
                  </span>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="申请数量" required>
          <el-input-number
            v-model="addItemForm.quantity"
            :min="1"
            :step="1"
            :precision="0"
            style="width: 150px;"
            @change="calculateSubtotal"
          ></el-input-number>
        </el-form-item>
        
        <el-form-item label="单价(元)">
          <el-input
            v-model.number="addItemForm.unitPrice"
            type="number"
            :min="0"
            :step="0.01"
            :precision="2"
            style="width: 120px;"
            @change="calculateSubtotal"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="小计(元)">
          <el-input
            v-model.number="addItemForm.subtotal"
            type="number"
            :precision="2"
            readonly
            style="width: 120px;"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="需求日期" required>
          <el-date-picker
            v-model="addItemForm.needDate"
            type="date"
            placeholder="选择需求日期"
            style="width: 150px;"
            :picker-options="{
              disabledDate(time) {
                return time.getTime() < Date.now() - 8.64e7;
              }
            }"
          ></el-date-picker>
        </el-form-item>
        
        <el-form-item label="申请理由">
          <el-input
            v-model="addItemForm.reason"
            type="textarea"
            :rows="1"
            placeholder="请输入申请理由"
            style="width: 200px;"
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="addItem" :disabled="!canAddItem">添加</el-button>
          <el-button @click="resetAddForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 物料明细列表 -->
    <el-card class="items-list-card">
      <div slot="header" class="card-header">
        <span>申请物料明细</span>
        <div class="header-actions">
          <el-button type="danger" @click="batchDeleteItems" :disabled="selectedItems.length === 0">批量删除</el-button>
          <el-button @click="clearAllItems" :disabled="requisitionItems.length === 0">清空列表</el-button>
        </div>
      </div>
      
      <div class="items-table-container">
        <el-table
          v-loading="loading"
          :data="requisitionItems"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="index" label="序号" width="60" type="index"></el-table-column>
          <el-table-column prop="materialCode" label="物料编码" width="120"></el-table-column>
          <el-table-column prop="materialName" label="物料名称" width="180">
            <template slot-scope="scope">
              <div class="material-info">
                <div class="material-name">{{ scope.row.materialName }}</div>
                <div class="material-spec">{{ scope.row.specification }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="物料类别" width="100"></el-table-column>
          <el-table-column prop="unit" label="单位" width="80"></el-table-column>
          <el-table-column prop="quantity" label="申请数量" width="100" align="right">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.quantity"
                :min="1"
                :step="1"
                :precision="0"
                size="mini"
                @change="updateItemSubtotal(scope.row)"
              ></el-input-number>
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="单价(元)" width="100" align="right">
            <template slot-scope="scope">
              <el-input
                v-model.number="scope.row.unitPrice"
                type="number"
                :min="0"
                :step="0.01"
                :precision="2"
                size="mini"
                @change="updateItemSubtotal(scope.row)"
              ></el-input>
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计(元)" width="120" align="right">
            <template slot-scope="scope">
              <span class="subtotal-amount">{{ scope.row.subtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="currentStock" label="当前库存" width="100" align="right">
            <template slot-scope="scope">
              <span :class="{ 'stock-warning': scope.row.currentStock < scope.row.safetyStock }">
                {{ scope.row.currentStock }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="needDate" label="需求日期" width="120"></el-table-column>
          <el-table-column prop="reason" label="申请理由" min-width="150"></el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template slot-scope="scope">
              <el-button
                type="text"
                size="small"
                class="delete-btn"
                @click="deleteItem(scope.row.id)"
                :disabled="disabled"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 空状态提示 -->
        <div v-if="requisitionItems.length === 0 && !loading" class="empty-state">
          <i class="el-icon-document"></i>
          <p>暂无申请物料，请添加物料明细</p>
        </div>
      </div>
      
      <!-- 合计信息 -->
      <div class="items-summary" v-if="requisitionItems.length > 0">
        <div class="summary-content">
          <div class="summary-item">
            <span class="summary-label">物料种类：</span>
            <span class="summary-value">{{ materialCount }} 种</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">申请总数量：</span>
            <span class="summary-value">{{ totalQuantity }} {{ mainUnit }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">申请总金额：</span>
            <span class="summary-value total-amount">{{ totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} 元</span>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 批量导入对话框 -->
    <el-dialog
      title="批量导入物料明细"
      :visible.sync="importDialogVisible"
      width="600px"
      @close="handleImportDialogClose"
    >
      <div class="import-dialog-content">
        <el-upload
          class="upload-excel"
          :action="uploadUrl"
          :before-upload="beforeUploadExcel"
          :on-success="onUploadSuccess"
          :on-error="onUploadError"
          :show-file-list="false"
          accept=".xlsx,.xls"
          drag
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">
            <span>请上传.xlsx或.xls格式的Excel文件</span>
            <el-button type="text" @click="downloadTemplate">下载导入模板</el-button>
          </div>
        </el-upload>
        
        <div class="import-notes">
          <h4>导入说明：</h4>
          <ul>
            <li>1. 请严格按照模板格式填写物料信息</li>
            <li>2. 物料编码必须与系统中存在的物料编码一致</li>
            <li>3. 导入的物料将添加到当前申请单中</li>
            <li>4. 如有重复物料，系统将提示并忽略重复项</li>
          </ul>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'RequisitionItems',
  props: {
    // 禁用状态，用于查看模式
    disabled: {
      type: Boolean,
      default: false
    },
    // 初始物料明细数据
    initialItems: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      // 添加物料表单
      addItemForm: {
        materialId: '',
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
        needDate: '',
        reason: ''
      },
      // 物料选项
      materialOptions: [],
      // 物料详情缓存
      materialDetails: {},
      // 申请物料列表
      requisitionItems: [],
      // 选中的物料
      selectedItems: [],
      // 加载状态
      loading: false,
      loadingMaterial: false,
      // 批量导入对话框
      importDialogVisible: false,
      // 上传URL（实际应用中替换为真实API）
      uploadUrl: '/api/purchase/requisition/import'
    }
  },
  computed: {
    // 是否可以添加物料
    canAddItem() {
      return this.addItemForm.materialId && 
             this.addItemForm.quantity > 0 && 
             this.addItemForm.unitPrice >= 0 &&
             this.addItemForm.needDate
    },
    // 物料种类数
    materialCount() {
      const materialCodes = new Set()
      this.requisitionItems.forEach(item => {
        materialCodes.add(item.materialCode)
      })
      return materialCodes.size
    },
    // 申请总数量
    totalQuantity() {
      return this.requisitionItems.reduce((total, item) => total + item.quantity, 0)
    },
    // 申请总金额
    totalAmount() {
      return this.requisitionItems.reduce((total, item) => total + item.subtotal, 0)
    },
    // 主要单位（这里简化处理，实际应根据系统设置）
    mainUnit() {
      return '件'
    }
  },
  watch: {
    // 监听初始数据变化
    initialItems: {
      handler(newItems) {
        if (newItems && newItems.length > 0) {
          this.requisitionItems = [...newItems]
        }
      },
      immediate: true,
      deep: true
    },
    // 监听物料明细变化，向父组件发送事件
    requisitionItems: {
      handler(newItems) {
        this.$emit('items-change', newItems)
        this.$emit('total-change', {
          materialCount: this.materialCount,
          totalQuantity: this.totalQuantity,
          totalAmount: this.totalAmount
        })
      },
      deep: true
    }
  },
  mounted() {
    // 组件挂载时的初始化操作
    this.initMaterialData()
  },
  methods: {
    // 初始化物料数据（模拟）
    initMaterialData() {
      // 在实际应用中，这里会从API获取物料数据
      this.materialDetails = {
        '1': {
          id: '1',
          code: 'MAT001',
          name: '钢材A类',
          specification: 'φ10mm×2000mm',
          category: '原材料',
          unit: 'kg',
          stockQuantity: 500,
          safetyStock: 100,
          unitPrice: 5.8
        },
        '2': {
          id: '2',
          code: 'MAT002',
          name: '铝材B类',
          specification: '6061-T6',
          category: '原材料',
          unit: 'kg',
          stockQuantity: 300,
          safetyStock: 80,
          unitPrice: 18.5
        },
        '3': {
          id: '3',
          code: 'PAR001',
          name: '轴承',
          specification: '6205ZZ',
          category: '零部件',
          unit: '个',
          stockQuantity: 120,
          safetyStock: 50,
          unitPrice: 12.3
        },
        '4': {
          id: '4',
          code: 'PAR002',
          name: '电机',
          specification: 'Y2-90L-4',
          category: '零部件',
          unit: '台',
          stockQuantity: 15,
          safetyStock: 5,
          unitPrice: 890.0
        },
        '5': {
          id: '5',
          code: 'EQU001',
          name: '办公电脑',
          specification: 'ThinkPad X1',
          category: '设备',
          unit: '台',
          stockQuantity: 0,
          safetyStock: 2,
          unitPrice: 9800.0
        }
      }
    },
    
    // 远程搜索物料
    remoteSearchMaterial(query) {
      if (query !== '') {
        this.loadingMaterial = true
        // 模拟搜索延迟
        setTimeout(() => {
          this.materialOptions = Object.values(this.materialDetails).filter(material => 
            material.code.includes(query) || material.name.includes(query)
          )
          this.loadingMaterial = false
        }, 300)
      } else {
        this.materialOptions = []
      }
    },
    
    // 物料选择变化
    onMaterialChange(materialId) {
      if (materialId && this.materialDetails[materialId]) {
        const material = this.materialDetails[materialId]
        this.addItemForm.unitPrice = material.unitPrice
        this.calculateSubtotal()
      }
    },
    
    // 计算小计
    calculateSubtotal() {
      this.addItemForm.subtotal = this.addItemForm.quantity * this.addItemForm.unitPrice
    },
    
    // 添加物料
    addItem() {
      if (!this.canAddItem) return
      
      const material = this.materialDetails[this.addItemForm.materialId]
      if (!material) {
        this.$message.error('物料信息不存在')
        return
      }
      
      // 检查是否已存在相同物料
      const existingIndex = this.requisitionItems.findIndex(
        item => item.materialId === this.addItemForm.materialId
      )
      
      if (existingIndex >= 0) {
        this.$confirm('该物料已存在，是否合并数量？', '提示', {
          confirmButtonText: '合并',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 合并数量
          this.requisitionItems[existingIndex].quantity += this.addItemForm.quantity
          this.updateItemSubtotal(this.requisitionItems[existingIndex])
          this.resetAddForm()
          this.$message.success('物料已合并')
        }).catch(() => {
          // 取消合并
        })
      } else {
        // 添加新物料
        const newItem = {
          id: Date.now().toString(), // 临时ID
          materialId: material.id,
          materialCode: material.code,
          materialName: material.name,
          specification: material.specification,
          category: material.category,
          unit: material.unit,
          quantity: this.addItemForm.quantity,
          unitPrice: this.addItemForm.unitPrice,
          subtotal: this.addItemForm.subtotal,
          currentStock: material.stockQuantity,
          safetyStock: material.safetyStock,
          needDate: this.formatDate(this.addItemForm.needDate),
          reason: this.addItemForm.reason
        }
        
        this.requisitionItems.push(newItem)
        this.resetAddForm()
        this.$message.success('物料添加成功')
      }
    },
    
    // 重置添加表单
    resetAddForm() {
      this.addItemForm = {
        materialId: '',
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
        needDate: '',
        reason: ''
      }
    },
    
    // 更新物料小计
    updateItemSubtotal(item) {
      item.subtotal = item.quantity * item.unitPrice
    },
    
    // 删除物料
    deleteItem(id) {
      this.$confirm('确定要删除该物料吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.requisitionItems.findIndex(item => item.id === id)
        if (index !== -1) {
          this.requisitionItems.splice(index, 1)
          this.$message.success('物料已删除')
        }
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedItems = selection
    },
    
    // 批量删除
    batchDeleteItems() {
      if (this.selectedItems.length === 0) {
        this.$message.warning('请选择要删除的物料')
        return
      }
      
      this.$confirm(`确定要删除选中的 ${this.selectedItems.length} 个物料吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const selectedIds = this.selectedItems.map(item => item.id)
        this.requisitionItems = this.requisitionItems.filter(
          item => !selectedIds.includes(item.id)
        )
        this.selectedItems = []
        this.$message.success(`已删除 ${selectedIds.length} 个物料`)
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 清空所有物料
    clearAllItems() {
      this.$confirm('确定要清空所有物料吗？此操作不可撤销。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }).then(() => {
        this.requisitionItems = []
        this.selectedItems = []
        this.$message.success('所有物料已清空')
      }).catch(() => {
        // 取消清空
      })
    },
    
    // 打开导入对话框
    openImportDialog() {
      this.importDialogVisible = true
    },
    
    // 处理导入对话框关闭
    handleImportDialogClose() {
      // 重置上传组件状态等
    },
    
    // 下载导入模板
    downloadTemplate() {
      // 在实际应用中，这里会调用API下载模板
      this.$message.success('模板下载成功')
    },
    
    // 上传前检查
    beforeUploadExcel(file) {
      const isExcel = file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      const isLt2M = file.size / 1024 / 1024 < 2
      
      if (!isExcel) {
        this.$message.error('只支持.xlsx或.xls格式的Excel文件')
      }
      if (!isLt2M) {
        this.$message.error('文件大小不能超过2MB')
      }
      
      return isExcel && isLt2M
    },
    
    // 上传成功
    onUploadSuccess(response) {
      // 在实际应用中，这里会处理上传成功后的逻辑
      this.$message.success('物料导入成功')
      this.importDialogVisible = false
      // 重新加载数据
      this.loadMockImportedData()
    },
    
    // 上传失败
    onUploadError(error) {
      this.$message.error('物料导入失败，请重试')
      console.error('Import error:', error)
    },
    
    // 加载模拟导入的数据
    loadMockImportedData() {
      // 模拟从导入文件中获取的数据
      const importedItems = [
        {
          id: Date.now().toString() + '1',
          materialId: '6',
          materialCode: 'MAT003',
          materialName: '铜材',
          specification: 'T2',
          category: '原材料',
          unit: 'kg',
          quantity: 50,
          unitPrice: 65.0,
          subtotal: 3250.0,
          currentStock: 80,
          safetyStock: 50,
          needDate: this.formatDate(new Date()),
          reason: '生产需求'
        },
        {
          id: Date.now().toString() + '2',
          materialId: '7',
          materialCode: 'PAR003',
          materialName: '齿轮',
          specification: 'M1.5×20T',
          category: '零部件',
          unit: '个',
          quantity: 20,
          unitPrice: 35.5,
          subtotal: 710.0,
          currentStock: 15,
          safetyStock: 10,
          needDate: this.formatDate(new Date()),
          reason: '设备维修'
        }
      ]
      
      // 添加到现有列表
      this.requisitionItems.push(...importedItems)
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    
    // 获取物料明细数据（供父组件调用）
    getRequisitionItems() {
      return this.requisitionItems
    },
    
    // 清空所有物料（供父组件调用）
    clearItems() {
      this.requisitionItems = []
    }
  }
}
</script>

<style scoped>
.requisition-items {
  padding: 10px 0;
}

.add-item-card,
.items-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.add-item-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
}

.add-item-form .el-form-item {
  margin-bottom: 15px;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-main {
  font-weight: 500;
}

.option-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #606266;
}

.option-sub .stock-low {
  color: #f56c6c;
  font-weight: 500;
}

.items-table-container {
  min-height: 300px;
  position: relative;
}

.material-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.material-name {
  font-weight: 500;
}

.material-spec {
  font-size: 12px;
  color: #606266;
}

.stock-warning {
  color: #f56c6c;
  font-weight: 500;
}

.subtotal-amount {
  font-weight: 500;
  color: #303133;
}

.delete-btn {
  color: #f56c6c;
}

.delete-btn:hover {
  color: #f78989;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 20px;
  color: #c0c4cc;
}

.items-summary {
  background-color: #f5f7fa;
  padding: 15px;
  margin-top: 20px;
  border-radius: 4px;
}

.summary-content {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-label {
  color: #606266;
}

.summary-value {
  font-weight: bold;
  color: #303133;
}

.total-amount {
  color: #f56c6c;
  font-size: 18px;
}

.import-dialog-content {
  padding: 20px 0;
}

.upload-excel {
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  padding: 40px;
  text-align: center;
  margin-bottom: 30px;
}

.import-notes {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.import-notes h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
}

.import-notes ul {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  line-height: 1.8;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .add-item-form {
    justify-content: center;
  }
  
  .summary-content {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .add-item-form .el-form-item {
    width: 100%;
  }
  
  .summary-content {
    flex-direction: column;
    gap: 15px;
  }
}
</style>