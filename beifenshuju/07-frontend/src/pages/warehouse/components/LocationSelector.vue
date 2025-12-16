<template>
  <div class="location-selector">
    <!-- 库位选择器主体 -->
    <div class="selector-container">
      <!-- 仓库选择 -->
      <el-form-item label="仓库" v-if="showWarehouseSelect">
        <el-select 
          v-model="selectedWarehouseId" 
          placeholder="请选择仓库"
          @change="onWarehouseChange">
          <el-option 
            v-for="warehouse in warehouseList" 
            :key="warehouse.id" 
            :label="warehouse.name" 
            :value="warehouse.id">
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 库位可视化选择 -->
      <div class="location-visualization" v-if="selectedWarehouseId">
        <div class="location-header">
          <h4>{{ getSelectedWarehouseName() }} - 库位布局</h4>
          <div class="location-filter">
            <el-input 
              v-model="locationFilter" 
              placeholder="搜索库位编号" 
              prefix-icon="el-icon-search"
              style="width: 200px;">
            </el-input>
          </div>
        </div>
        
        <!-- 库位可视化网格 -->
        <div class="location-grid">
          <div 
            v-for="location in filteredLocations" 
            :key="location.id"
            class="location-cell"
            :class="{
              'selected': selectedLocationId === location.id,
              'occupied': location.occupied,
              'available': !location.occupied,
              'has-goods': location.hasGoods,
              'disabled': isLocationDisabled(location)
            }"
            :title="getLocationTooltip(location)"
            @click="selectLocation(location)"
            :style="getLocationCellStyle(location)">
            <div class="location-code">{{ location.code }}</div>
            <div class="location-info">
              <div class="location-type">{{ location.type }}</div>
              <div class="location-status">{{ getLocationStatus(location) }}</div>
            </div>
          </div>
        </div>

        <!-- 库位详情 -->
        <div class="location-detail" v-if="selectedLocation">
          <el-card class="detail-card">
            <div slot="header" class="card-header">
              <span>库位详情</span>
            </div>
            <el-form :model="selectedLocation" label-width="100px">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="库位编号">
                    {{ selectedLocation.code }}
                  </el-form-item>
                  <el-form-item label="库位类型">
                    {{ selectedLocation.type }}
                  </el-form-item>
                  <el-form-item label="库位状态">
                    <el-tag :type="getLocationStatusType(selectedLocation)">
                      {{ getLocationStatus(selectedLocation) }}
                    </el-tag>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="容量">
                    {{ selectedLocation.capacity || '-' }}
                  </el-form-item>
                  <el-form-item label="已占用空间">
                    {{ selectedLocation.usedSpace || 0 }} / {{ selectedLocation.capacity || '-' }}
                  </el-form-item>
                  <el-form-item label="存储产品">
                    {{ selectedLocation.productName || '-' }}
                  </el-form-item>
                </el-col>
              </el-row>
              
              <!-- 存储的产品列表 -->
              <el-divider v-if="selectedLocation.products && selectedLocation.products.length > 0">存储的产品</el-divider>
              <el-table 
                v-if="selectedLocation.products && selectedLocation.products.length > 0" 
                :data="selectedLocation.products" 
                style="width: 100%" 
                size="small">
                <el-table-column prop="productCode" label="产品编码" width="120"></el-table-column>
                <el-table-column prop="productName" label="产品名称" width="180"></el-table-column>
                <el-table-column prop="quantity" label="数量" width="100" align="right"></el-table-column>
                <el-table-column prop="batchNo" label="批次号" width="150"></el-table-column>
              </el-table>
            </el-form>
          </el-card>
        </div>
      </div>

      <!-- 未选择仓库时的提示 -->
      <div class="no-selection" v-else-if="showWarehouseSelect">
        <el-empty description="请先选择仓库"></el-empty>
      </div>
    </div>

    <!-- 库位选择对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      :visible.sync="dialogVisible" 
      width="80%"
      @close="handleDialogClose">
      <div class="dialog-content">
        <!-- 仓库选择 -->
        <el-form-item label="仓库">
          <el-select 
            v-model="selectedWarehouseId" 
            placeholder="请选择仓库"
            @change="onWarehouseChange">
            <el-option 
              v-for="warehouse in warehouseList" 
              :key="warehouse.id" 
              :label="warehouse.name" 
              :value="warehouse.id">
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 库位可视化选择 -->
        <div class="location-visualization" v-if="selectedWarehouseId">
          <div class="location-header">
            <h4>{{ getSelectedWarehouseName() }} - 库位布局</h4>
            <div class="location-filter">
              <el-input 
                v-model="locationFilter" 
                placeholder="搜索库位编号" 
                prefix-icon="el-icon-search"
                style="width: 200px;">
              </el-input>
            </div>
          </div>
          
          <!-- 库位可视化网格 -->
          <div class="location-grid">
            <div 
              v-for="location in filteredLocations" 
              :key="location.id"
              class="location-cell"
              :class="{
                'selected': selectedLocationId === location.id,
                'occupied': location.occupied,
                'available': !location.occupied,
                'has-goods': location.hasGoods,
                'disabled': isLocationDisabled(location)
              }"
              :title="getLocationTooltip(location)"
              @click="selectLocation(location)"
              :style="getLocationCellStyle(location)">
              <div class="location-code">{{ location.code }}</div>
              <div class="location-info">
                <div class="location-type">{{ location.type }}</div>
                <div class="location-status">{{ getLocationStatus(location) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSelection" :disabled="!selectedLocationId">
          确认选择
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'LocationSelector',
  props: {
    // 控制是否显示仓库选择器
    showWarehouseSelect: {
      type: Boolean,
      default: true
    },
    // 预设的仓库ID
    presetWarehouseId: {
      type: String,
      default: ''
    },
    // 是否允许多选
    multiple: {
      type: Boolean,
      default: false
    },
    // 对话框标题
    dialogTitle: {
      type: String,
      default: '选择库位'
    },
    // 显示为对话框模式
    showAsDialog: {
      type: Boolean,
      default: false
    },
    // 禁用已占用的库位
    disableOccupied: {
      type: Boolean,
      default: false
    },
    // 禁用空库位
    disableEmpty: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedWarehouseId: this.presetWarehouseId,
      selectedLocationId: '',
      selectedLocation: null,
      locationFilter: '',
      dialogVisible: false,
      warehouseList: [
        { id: '1', name: '主仓库' },
        { id: '2', name: '原料库' },
        { id: '3', name: '成品库' },
        { id: '4', name: '辅料库' }
      ],
      locations: {}
    }
  },
  computed: {
    // 获取过滤后的库位列表
    filteredLocations() {
      if (!this.selectedWarehouseId) return []
      const locations = this.locations[this.selectedWarehouseId] || []
      if (!this.locationFilter) return locations
      
      return locations.filter(location => 
        location.code.toLowerCase().includes(this.locationFilter.toLowerCase())
      )
    }
  },
  watch: {
    // 监听预设仓库ID变化
    presetWarehouseId(val) {
      this.selectedWarehouseId = val
      if (val) {
        this.loadLocations(val)
      }
    }
  },
  mounted() {
    // 如果有预设仓库，加载对应库位
    if (this.selectedWarehouseId) {
      this.loadLocations(this.selectedWarehouseId)
    }
    
    // 如果是对话框模式且需要立即显示
    if (this.showAsDialog) {
      this.dialogVisible = true
    }
  },
  methods: {
    // 打开对话框
    openDialog() {
      this.dialogVisible = true
    },
    
    // 关闭对话框处理
    handleDialogClose() {
      this.locationFilter = ''
    },
    
    // 仓库切换处理
    onWarehouseChange(warehouseId) {
      this.selectedWarehouseId = warehouseId
      this.selectedLocationId = ''
      this.selectedLocation = null
      this.loadLocations(warehouseId)
    },
    
    // 加载库位数据
    loadLocations(warehouseId) {
      if (!this.locations[warehouseId]) {
        // 模拟API调用，获取库位数据
        this.locations[warehouseId] = this.getMockLocations(warehouseId)
      }
    },
    
    // 选择库位
    selectLocation(location) {
      if (this.isLocationDisabled(location)) return
      
      if (this.multiple) {
        // 多选逻辑（这里简化处理，实际可以使用数组）
        this.selectedLocationId = location.id
        this.selectedLocation = { ...location }
      } else {
        this.selectedLocationId = location.id
        this.selectedLocation = { ...location }
        
        // 非对话框模式下，直接触发选择事件
        if (!this.showAsDialog) {
          this.$emit('location-selected', this.selectedLocation)
        }
      }
    },
    
    // 确认选择（对话框模式）
    confirmSelection() {
      if (this.selectedLocation) {
        this.$emit('location-selected', this.selectedLocation)
        this.dialogVisible = false
      }
    },
    
    // 判断库位是否禁用
    isLocationDisabled(location) {
      if (this.disableOccupied && location.occupied) return true
      if (this.disableEmpty && !location.occupied) return true
      return false
    },
    
    // 获取选中仓库名称
    getSelectedWarehouseName() {
      const warehouse = this.warehouseList.find(w => w.id === this.selectedWarehouseId)
      return warehouse ? warehouse.name : ''
    },
    
    // 获取库位提示信息
    getLocationTooltip(location) {
      let tooltip = `${location.code} - ${location.type}\n`
      tooltip += `状态: ${getLocationStatus(location)}\n`
      if (location.productName) {
        tooltip += `存储产品: ${location.productName}\n`
        tooltip += `数量: ${location.quantity || 0}`
      }
      return tooltip
    },
    
    // 获取库位状态
    getLocationStatus(location) {
      if (location.occupied) {
        return '已占用'
      }
      return '空闲'
    },
    
    // 获取库位状态类型（用于标签）
    getLocationStatusType(location) {
      return location.occupied ? 'warning' : 'success'
    },
    
    // 获取库位单元格样式
    getLocationCellStyle(location) {
      // 可以根据库位类型、状态等返回不同样式
      return {}
    },
    
    // 模拟库位数据
    getMockLocations(warehouseId) {
      const baseLocations = []
      const areaCodes = ['A', 'B', 'C', 'D']
      const rowNumbers = [1, 2, 3]
      const colNumbers = [1, 2, 3, 4]
      
      // 生成模拟库位数据
      areaCodes.forEach(area => {
        rowNumbers.forEach(row => {
          colNumbers.forEach(col => {
            const code = `${area}${row}-${col}`
            const occupied = Math.random() > 0.6 // 60%概率空闲
            const hasGoods = occupied && Math.random() > 0.2
            
            baseLocations.push({
              id: `${warehouseId}-${code}`,
              code: code,
              type: area === 'A' ? '重型货架' : 
                    area === 'B' ? '中型货架' : 
                    area === 'C' ? '轻型货架' : '流利式货架',
              occupied: occupied,
              hasGoods: hasGoods,
              capacity: 100,
              usedSpace: occupied ? Math.floor(Math.random() * 100) : 0,
              productName: hasGoods ? `产品${Math.floor(Math.random() * 1000)}` : '',
              quantity: hasGoods ? Math.floor(Math.random() * 50) + 1 : 0,
              products: hasGoods ? [
                {
                  productCode: `P${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                  productName: `产品${Math.floor(Math.random() * 1000)}`,
                  quantity: Math.floor(Math.random() * 50) + 1,
                  batchNo: `B${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
                }
              ] : []
            })
          })
        })
      })
      
      return baseLocations
    }
  }
}
</script>

<style scoped>
.location-selector {
  width: 100%;
}

.selector-container {
  width: 100%;
}

.no-selection {
  margin: 40px 0;
  text-align: center;
}

.location-visualization {
  margin-top: 20px;
}

.location-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.location-header h4 {
  margin: 0;
  color: #333;
}

.location-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.location-cell {
  padding: 12px;
  border: 2px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.location-cell:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.location-cell.selected {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.location-cell.occupied {
  background-color: #fff7e6;
  border-color: #faad14;
}

.location-cell.available {
  background-color: #f6ffed;
  border-color: #52c41a;
}

.location-cell.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.location-cell.disabled:hover {
  border-color: #e8e8e8;
  box-shadow: none;
}

.location-code {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 4px;
}

.location-info {
  font-size: 12px;
  color: #666;
}

.location-status {
  margin-top: 2px;
  font-size: 11px;
}

.location-detail {
  margin-top: 20px;
}

.detail-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-content {
  max-height: 500px;
  overflow-y: auto;
}
</style>