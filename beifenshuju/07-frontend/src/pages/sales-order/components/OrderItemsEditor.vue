<template>
  <div class="order-items-editor">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>订单商品明细</span>
        <el-button type="primary" size="small" @click="handleAddItem" class="add-button">
          <i class="el-icon-plus"></i> 添加商品
        </el-button>
      </div>

      <!-- 商品搜索和选择 -->
      <el-dialog
        title="选择商品"
        :visible.sync="showProductDialog"
        width="800px"
        append-to-body
      >
        <div class="product-search">
          <el-input
            v-model="productSearchQuery"
            placeholder="请输入商品名称、编码或规格"
            prefix-icon="el-icon-search"
            style="width: 300px; margin-bottom: 15px;"
            @input="handleProductSearch"
          ></el-input>
          
          <el-table
            :data="filteredProducts"
            style="width: 100%"
            stripe
            @row-click="selectProduct"
            @selection-change="handleProductSelectionChange"
          >
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column prop="productCode" label="商品编码" width="120"></el-table-column>
            <el-table-column prop="productName" label="商品名称" width="200"></el-table-column>
            <el-table-column prop="specification" label="规格型号" width="150"></el-table-column>
            <el-table-column prop="unit" label="单位" width="80"></el-table-column>
            <el-table-column prop="costPrice" label="成本价(元)" width="100" align="right">
              <template slot-scope="scope">
                {{ formatCurrency(scope.row.costPrice) }}
              </template>
            </el-table-column>
            <el-table-column prop="salesPrice" label="销售价(元)" width="100" align="right">
              <template slot-scope="scope">
                {{ formatCurrency(scope.row.salesPrice) }}
              </template>
            </el-table-column>
            <el-table-column prop="stockQuantity" label="库存" width="80" align="right"></el-table-column>
          </el-table>
          
          <div class="dialog-footer">
            <el-button @click="showProductDialog = false">取消</el-button>
            <el-button type="primary" @click="confirmSelectProducts">确定</el-button>
          </div>
        </div>
      </el-dialog>

      <!-- 订单商品表格 -->
      <el-table
        :data="orderItems"
        style="width: 100%"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="productCode" label="商品编码" width="120"></el-table-column>
        <el-table-column prop="productName" label="商品名称" width="200"></el-table-column>
        <el-table-column prop="specification" label="规格型号" width="150"></el-table-column>
        <el-table-column prop="unit" label="单位" width="80"></el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" align="right">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.quantity"
              :min="1"
              :step="1"
              @change="handleQuantityChange(scope.row)"
              size="small"
            ></el-input-number>
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="单价(元)" width="120" align="right">
          <template slot-scope="scope">
            <el-input
              v-model.number="scope.row.unitPrice"
              type="number"
              :min="0"
              :step="0.01"
              @change="handleUnitPriceChange(scope.row)"
              size="small"
              style="width: 100px;"
            ></el-input>
          </template>
        </el-table-column>
        <el-table-column prop="discountRate" label="折扣(%)" width="100" align="right">
          <template slot-scope="scope">
            <el-input
              v-model.number="scope.row.discountRate"
              type="number"
              :min="0"
              :max="100"
              @change="handleDiscountChange(scope.row)"
              size="small"
              style="width: 80px;"
            ></el-input>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额(元)" width="120" align="right" fixed="right">
          <template slot-scope="scope">
            <span style="color: #f56c6c; font-weight: 500;">
              {{ formatCurrency(scope.row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="danger"
              icon="el-icon-delete"
              size="small"
              @click="handleDeleteItem(scope.row)"
            ></el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedItems.length > 0">
        <span>已选择 {{ selectedItems.length }} 项</span>
        <el-button type="danger" size="small" @click="handleBatchDelete">批量删除</el-button>
        <el-button type="primary" size="small" @click="handleBatchUpdateDiscount">批量修改折扣</el-button>
      </div>

      <!-- 金额汇总 -->
      <div class="amount-summary">
        <div class="summary-item">
          <span class="label">商品总数：</span>
          <span class="value">{{ totalQuantity }} 件</span>
        </div>
        <div class="summary-item">
          <span class="label">商品总价：</span>
          <span class="value">{{ formatCurrency(totalAmount) }} 元</span>
        </div>
        <div class="summary-item">
          <span class="label">优惠金额：</span>
          <span class="value">{{ formatCurrency(totalDiscountAmount) }} 元</span>
        </div>
        <div class="summary-item total">
          <span class="label">应付金额：</span>
          <span class="value">{{ formatCurrency(finalAmount) }} 元</span>
        </div>
      </div>
    </el-card>

    <!-- 批量修改折扣对话框 -->
    <el-dialog
      title="批量修改折扣"
      :visible.sync="showDiscountDialog"
      width="400px"
      append-to-body
    >
      <el-form :model="discountForm">
        <el-form-item label="折扣率(%)" label-width="100px">
          <el-input-number
            v-model="discountForm.discountRate"
            :min="0"
            :max="100"
            :step="1"
            style="width: 150px;"
          ></el-input-number>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showDiscountDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchUpdateDiscount">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'OrderItemsEditor',
  props: {
    value: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      orderItems: [],
      selectedItems: [],
      showProductDialog: false,
      showDiscountDialog: false,
      productSearchQuery: '',
      filteredProducts: [],
      selectedProducts: [],
      discountForm: {
        discountRate: 100
      },
      // 模拟商品数据
      products: [
        {
          id: '1',
          productCode: 'P001',
          productName: '高性能服务器',
          specification: 'Intel Xeon 32核 128GB',
          unit: '台',
          costPrice: 8000.00,
          salesPrice: 12000.00,
          stockQuantity: 50
        },
        {
          id: '2',
          productCode: 'P002',
          productName: '企业级交换机',
          specification: '48端口千兆',
          unit: '台',
          costPrice: 4000.00,
          salesPrice: 5600.00,
          stockQuantity: 100
        },
        {
          id: '3',
          productCode: 'P003',
          productName: '企业级存储设备',
          specification: '100TB 高速缓存',
          unit: '台',
          costPrice: 35000.00,
          salesPrice: 45000.00,
          stockQuantity: 20
        },
        {
          id: '4',
          productCode: 'P004',
          productName: '网络安全设备',
          specification: '企业级防火墙',
          unit: '套',
          costPrice: 10000.00,
          salesPrice: 13500.00,
          stockQuantity: 30
        },
        {
          id: '5',
          productCode: 'P005',
          productName: '办公笔记本电脑',
          specification: 'i7 16GB 512GB SSD',
          unit: '台',
          costPrice: 6000.00,
          salesPrice: 8500.00,
          stockQuantity: 80
        }
      ]
    }
  },
  computed: {
    totalQuantity() {
      return this.orderItems.reduce((total, item) => total + item.quantity, 0)
    },
    totalAmount() {
      return this.orderItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0)
    },
    totalDiscountAmount() {
      return this.orderItems.reduce((total, item) => {
        const discountAmount = (item.unitPrice * item.quantity) * (1 - item.discountRate / 100)
        return total + discountAmount
      }, 0)
    },
    finalAmount() {
      return this.totalAmount - this.totalDiscountAmount
    }
  },
  watch: {
    value: {
      handler(newValue) {
        if (newValue && newValue.length > 0) {
          this.orderItems = JSON.parse(JSON.stringify(newValue))
        } else {
          this.orderItems = []
        }
      },
      immediate: true
    },
    orderItems: {
      handler() {
        this.emitUpdate()
      },
      deep: true
    }
  },
  methods: {
    // 触发更新事件
    emitUpdate() {
      this.$emit('input', JSON.parse(JSON.stringify(this.orderItems)))
      this.$emit('change', {
        items: JSON.parse(JSON.stringify(this.orderItems)),
        totalQuantity: this.totalQuantity,
        totalAmount: this.totalAmount,
        totalDiscountAmount: this.totalDiscountAmount,
        finalAmount: this.finalAmount
      })
    },
    
    // 添加商品
    handleAddItem() {
      this.productSearchQuery = ''
      this.filteredProducts = [...this.products]
      this.selectedProducts = []
      this.showProductDialog = true
    },
    
    // 搜索商品
    handleProductSearch() {
      if (!this.productSearchQuery.trim()) {
        this.filteredProducts = [...this.products]
        return
      }
      
      const query = this.productSearchQuery.toLowerCase()
      this.filteredProducts = this.products.filter(product => 
        product.productName.toLowerCase().includes(query) ||
        product.productCode.toLowerCase().includes(query) ||
        product.specification.toLowerCase().includes(query)
      )
    },
    
    // 选择单个商品
    selectProduct(product) {
      const isSelected = this.selectedProducts.some(p => p.id === product.id)
      if (isSelected) {
        this.selectedProducts = this.selectedProducts.filter(p => p.id !== product.id)
      } else {
        this.selectedProducts.push(product)
      }
    },
    
    // 处理商品选择变化
    handleProductSelectionChange(selection) {
      this.selectedProducts = selection
    },
    
    // 确认选择商品
    confirmSelectProducts() {
      if (this.selectedProducts.length === 0) {
        this.$message.warning('请选择要添加的商品')
        return
      }
      
      this.selectedProducts.forEach(product => {
        // 检查是否已存在相同商品
        const existingItem = this.orderItems.find(
          item => item.productCode === product.productCode
        )
        
        if (existingItem) {
          // 如果已存在，增加数量
          existingItem.quantity += 1
          this.calculateItemAmount(existingItem)
        } else {
          // 否则添加新商品
          const newItem = {
            id: this.generateId(),
            productId: product.id,
            productCode: product.productCode,
            productName: product.productName,
            specification: product.specification,
            unit: product.unit,
            quantity: 1,
            unitPrice: product.salesPrice,
            discountRate: 100,
            amount: product.salesPrice,
            costPrice: product.costPrice
          }
          this.orderItems.push(newItem)
        }
      })
      
      this.showProductDialog = false
      this.$message.success(`成功添加 ${this.selectedProducts.length} 个商品`)
    },
    
    // 处理数量变化
    handleQuantityChange(item) {
      this.calculateItemAmount(item)
    },
    
    // 处理单价变化
    handleUnitPriceChange(item) {
      this.calculateItemAmount(item)
    },
    
    // 处理折扣变化
    handleDiscountChange(item) {
      this.calculateItemAmount(item)
    },
    
    // 计算商品金额
    calculateItemAmount(item) {
      const discountRate = item.discountRate || 100
      const unitPrice = item.unitPrice || 0
      const quantity = item.quantity || 0
      item.amount = (unitPrice * quantity) * (discountRate / 100)
    },
    
    // 删除商品
    handleDeleteItem(item) {
      const index = this.orderItems.findIndex(i => i.id === item.id)
      if (index > -1) {
        this.$confirm(`确定要删除商品「${item.productName}」吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.orderItems.splice(index, 1)
          this.$message.success('删除成功')
        }).catch(() => {
          this.$message.info('已取消删除')
        })
      }
    },
    
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedItems = selection
    },
    
    // 批量删除
    handleBatchDelete() {
      this.$confirm(`确定要删除选中的 ${this.selectedItems.length} 个商品吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const idsToDelete = this.selectedItems.map(item => item.id)
        this.orderItems = this.orderItems.filter(item => !idsToDelete.includes(item.id))
        this.selectedItems = []
        this.$message.success('批量删除成功')
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    // 批量修改折扣
    handleBatchUpdateDiscount() {
      this.discountForm.discountRate = 100
      this.showDiscountDialog = true
    },
    
    // 确认批量修改折扣
    confirmBatchUpdateDiscount() {
      this.selectedItems.forEach(item => {
        item.discountRate = this.discountForm.discountRate
        this.calculateItemAmount(item)
      })
      this.showDiscountDialog = false
      this.$message.success('批量修改折扣成功')
    },
    
    // 生成ID
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2)
    },
    
    // 格式化货币
    formatCurrency(value) {
      if (value === null || value === undefined) return '0.00'
      return Number(value).toFixed(2)
    }
  }
}
</script>

<style scoped>
.order-items-editor {
  margin-bottom: 20px;
}

.add-button {
  float: right;
}

.batch-actions {
  margin-top: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.batch-actions span {
  margin-right: 20px;
  color: #606266;
}

.batch-actions .el-button {
  margin-right: 10px;
}

.amount-summary {
  margin-top: 20px;
  padding: 15px;
  background-color: #fafafa;
  border-radius: 4px;
  text-align: right;
}

.summary-item {
  margin-bottom: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.summary-item .label {
  margin-right: 20px;
  color: #606266;
}

.summary-item .value {
  font-weight: 500;
  color: #303133;
}

.summary-item.total {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.summary-item.total .label {
  font-size: 16px;
  font-weight: 500;
}

.summary-item.total .value {
  font-size: 18px;
  color: #f56c6c;
  font-weight: 600;
}

.product-search .el-input {
  margin-bottom: 15px;
}

.dialog-footer {
  margin-top: 20px;
  text-align: right;
}
</style>