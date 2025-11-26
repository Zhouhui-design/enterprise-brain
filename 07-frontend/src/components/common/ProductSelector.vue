<template>
  <div class="product-selector">
    <el-card class="selector-card">
      <template #header>
        <div class="card-header">
          <span>产品选择</span>
          <el-input
            v-model="searchQuery"
            placeholder="搜索产品名称/编号"
            clearable
            size="small"
            prefix-icon="el-icon-search"
            style="width: 200px"
          />
        </div>
      </template>
      
      <div class="selector-content">
        <!-- 筛选条件 -->
        <el-row :gutter="20" class="filter-row">
          <el-col :span="6">
            <el-select v-model="filters.category" placeholder="产品类别" clearable>
              <el-option v-for="cat in categories" :key="cat.value" :label="cat.label" :value="cat.value" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filters.supplier" placeholder="供应商" clearable>
              <el-option v-for="sup in suppliers" :key="sup.value" :label="sup.label" :value="sup.value" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input-number v-model="filters.minPrice" :min="0" placeholder="最低价格" size="large" />
          </el-col>
          <el-col :span="6">
            <el-input-number v-model="filters.maxPrice" :min="0" placeholder="最高价格" size="large" />
          </el-col>
        </el-row>
        
        <!-- 产品列表 -->
        <el-table
          :data="filteredProducts"
          style="width: 100%"
          height="400"
          @selection-change="handleSelectionChange"
          @row-dblclick="handleRowDblClick"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="productCode" label="产品编号" width="120" />
          <el-table-column prop="productName" label="产品名称" width="200" />
          <el-table-column prop="category" label="类别" width="100" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="price" label="单价(元)" width="100" align="right">
            <template #default="{ row }">
              {{ row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="80" align="right" />
          <el-table-column prop="supplierName" label="供应商" width="150" />
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredProducts.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
        
        <!-- 已选产品 -->
        <div class="selected-products" v-if="selectedProducts.length > 0">
          <el-divider>已选产品 ({{ selectedProducts.length }})</el-divider>
          <el-table :data="selectedProducts" style="width: 100%" height="200">
            <el-table-column prop="productCode" label="产品编号" width="120" />
            <el-table-column prop="productName" label="产品名称" width="200" />
            <el-table-column prop="quantity" label="数量" width="100" align="right">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :max="row.stock"
                  @change="handleQuantityChange($index, $event)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="price" label="单价(元)" width="100" align="right">
              <template #default="{ row }">
                {{ row.price.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="subtotal" label="小计(元)" width="120" align="right">
              <template #default="{ row }">
                {{ (row.price * row.quantity).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button type="danger" icon="el-icon-delete" size="small" @click="removeSelectedProduct($index)" />
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 操作按钮 -->
        <div class="selector-actions">
          <el-button type="primary" @click="confirmSelection" :disabled="selectedProducts.length === 0">确认选择</el-button>
          <el-button @click="clearSelection">清除选择</el-button>
          <el-button @click="resetFilters">重置筛选</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ProductSelector',
  props: {
    // 可以从父组件传入默认已选产品
    defaultSelected: {
      type: Array,
      default: () => []
    },
    // 是否允许多选
    multiple: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      searchQuery: '',
      filters: {
        category: '',
        supplier: '',
        minPrice: null,
        maxPrice: null
      },
      pagination: {
        currentPage: 1,
        pageSize: 10
      },
      selectedProducts: [],
      // 模拟产品数据
      products: [
        {
          id: 1,
          productCode: 'P001',
          productName: '精密轴承',
          category: '机械配件',
          unit: '个',
          price: 120.50,
          stock: 500,
          supplierName: '精工轴承厂',
          description: '高精度不锈钢轴承'
        },
        {
          id: 2,
          productCode: 'P002',
          productName: '电机控制器',
          category: '电气元件',
          unit: '台',
          price: 580.00,
          stock: 150,
          supplierName: '电控科技有限公司',
          description: '三相异步电机专用控制器'
        },
        {
          id: 3,
          productCode: 'P003',
          productName: '工业传感器',
          category: '传感器',
          unit: '个',
          price: 260.75,
          stock: 300,
          supplierName: '传感科技公司',
          description: '高精度温度压力传感器'
        }
        // 更多产品数据可以在这里添加
      ],
      categories: [
        { label: '机械配件', value: '机械配件' },
        { label: '电气元件', value: '电气元件' },
        { label: '传感器', value: '传感器' },
        { label: '自动化设备', value: '自动化设备' }
      ],
      suppliers: [
        { label: '精工轴承厂', value: '精工轴承厂' },
        { label: '电控科技有限公司', value: '电控科技有限公司' },
        { label: '传感科技公司', value: '传感科技公司' }
      ]
    }
  },
  computed: {
    filteredProducts() {
      let result = [...this.products]
      
      // 根据搜索关键词筛选
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        result = result.filter(product => 
          product.productName.toLowerCase().includes(query) ||
          product.productCode.toLowerCase().includes(query)
        )
      }
      
      // 根据类别筛选
      if (this.filters.category) {
        result = result.filter(product => product.category === this.filters.category)
      }
      
      // 根据供应商筛选
      if (this.filters.supplier) {
        result = result.filter(product => product.supplierName === this.filters.supplier)
      }
      
      // 根据价格范围筛选
      if (this.filters.minPrice !== null) {
        result = result.filter(product => product.price >= this.filters.minPrice)
      }
      if (this.filters.maxPrice !== null) {
        result = result.filter(product => product.price <= this.filters.maxPrice)
      }
      
      return result
    }
  },
  watch: {
    defaultSelected: {
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.selectedProducts = [...newVal]
        }
      },
      immediate: true
    }
  },
  methods: {
    handleSelectionChange(selection) {
      if (this.multiple) {
        this.selectedProducts = selection.map(item => ({
          ...item,
          quantity: 1,
          subtotal: item.price
        }))
      } else if (selection.length > 0) {
        // 单选模式只保留最后选中的一项
        this.selectedProducts = [{
          ...selection[selection.length - 1],
          quantity: 1,
          subtotal: selection[selection.length - 1].price
        }]
      }
    },
    
    handleRowDblClick(row) {
      // 双击行直接添加到已选列表
      const existingIndex = this.selectedProducts.findIndex(item => item.id === row.id)
      if (existingIndex === -1) {
        this.selectedProducts.push({
          ...row,
          quantity: 1,
          subtotal: row.price
        })
      }
    },
    
    handleQuantityChange(index, value) {
      const product = this.selectedProducts[index]
      product.quantity = value
      product.subtotal = product.price * value
    },
    
    removeSelectedProduct(index) {
      this.selectedProducts.splice(index, 1)
    },
    
    confirmSelection() {
      // 触发自定义事件，将选择的产品传递给父组件
      this.$emit('productsSelected', this.selectedProducts)
      this.$message.success('产品选择已确认')
    },
    
    clearSelection() {
      this.selectedProducts = []
    },
    
    resetFilters() {
      this.searchQuery = ''
      this.filters = {
        category: '',
        supplier: '',
        minPrice: null,
        maxPrice: null
      }
      this.pagination.currentPage = 1
    },
    
    handleSizeChange(size) {
      this.pagination.pageSize = size
    },
    
    handleCurrentChange(current) {
      this.pagination.currentPage = current
    }
  }
}
</script>

<style scoped>
.product-selector {
  width: 100%;
}

.selector-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selector-content {
  padding: 20px 0;
}

.filter-row {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.selected-products {
  margin-top: 30px;
}

.selector-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>