<template>
  <div class="delivery-schedule">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>交付计划</span>
      </div>

      <el-form ref="deliveryForm" :model="deliveryForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="交付方式" prop="deliveryMethod">
              <el-radio-group v-model="deliveryForm.deliveryMethod" @change="handleDeliveryMethodChange">
                <el-radio label="SELF_PICKUP">自提</el-radio>
                <el-radio label="EXPRESS">快递配送</el-radio>
                <el-radio label="LOGISTICS">物流配送</el-radio>
                <el-radio label="OTHER">其他</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="其他交付方式" v-if="deliveryForm.deliveryMethod === 'OTHER'">
              <el-input v-model="deliveryForm.otherDeliveryMethod" placeholder="请输入其他交付方式"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计交付日期" prop="expectedDeliveryDate">
              <el-date-picker
                v-model="deliveryForm.expectedDeliveryDate"
                type="date"
                placeholder="选择预计交付日期"
                style="width: 100%"
                :disabled="disabled"
              ></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交付优先级" prop="priority">
              <el-select v-model="deliveryForm.priority" placeholder="选择优先级" :disabled="disabled">
                <el-option label="普通" value="NORMAL"></el-option>
                <el-option label="优先" value="HIGH"></el-option>
                <el-option label="紧急" value="URGENT"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="deliveryForm.deliveryMethod !== 'SELF_PICKUP'">
          <el-col :span="24">
            <el-form-item label="交付地址" prop="deliveryAddress">
              <el-input 
                v-model="deliveryForm.deliveryAddress" 
                type="textarea" 
                :rows="2" 
                placeholder="请输入详细交付地址"
                :disabled="disabled"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收货人" prop="receiverName">
              <el-input v-model="deliveryForm.receiverName" placeholder="请输入收货人姓名" :disabled="disabled"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="receiverPhone">
              <el-input v-model="deliveryForm.receiverPhone" placeholder="请输入联系电话" :disabled="disabled"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物流公司" prop="carrier" v-if="deliveryForm.deliveryMethod === 'LOGISTICS'">
              <el-input v-model="deliveryForm.carrier" placeholder="请输入物流公司名称" :disabled="disabled"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物流单号" prop="trackingNumber" v-if="deliveryForm.deliveryMethod === 'LOGISTICS'">
              <el-input v-model="deliveryForm.trackingNumber" placeholder="请输入物流单号" :disabled="disabled"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="交付备注" prop="deliveryRemark">
              <el-input 
                v-model="deliveryForm.deliveryRemark" 
                type="textarea" 
                :rows="3" 
                placeholder="请输入交付相关备注信息"
                :disabled="disabled"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 交付计划明细 -->
        <el-row>
          <el-col :span="24">
            <div class="schedule-details-section">
              <h4 class="section-subtitle">交付计划明细</h4>
              <el-button 
                type="primary" 
                size="small" 
                @click="handleAddScheduleItem"
                :disabled="disabled"
              >
                <i class="el-icon-plus"></i> 添加交付计划
              </el-button>
              
              <el-table 
                :data="deliveryForm.scheduleItems" 
                style="width: 100%; margin-top: 15px" 
                stripe
              >
                <el-table-column prop="deliveryDate" label="交付日期" width="150">
                  <template slot-scope="scope">
                    <el-date-picker
                      v-model="scope.row.deliveryDate"
                      type="date"
                      placeholder="选择日期"
                      style="width: 100%"
                      :disabled="disabled"
                      @change="handleScheduleItemChange"
                    ></el-date-picker>
                  </template>
                </el-table-column>
                <el-table-column prop="items" label="交付商品" min-width="300">
                  <template slot-scope="scope">
                    <div v-for="(item, index) in scope.row.items" :key="index" class="schedule-item-product">
                      {{ item.productName }} ({{ item.quantity }}{{ item.unit }})
                      <el-button 
                        type="text" 
                        size="mini" 
                        @click="handleRemoveProduct(scope.row, index)"
                        v-if="!disabled"
                      >
                        <i class="el-icon-delete"></i>
                      </el-button>
                    </div>
                    <el-button 
                      type="text" 
                      size="small" 
                      @click="handleAddProduct(scope.row)"
                      v-if="!disabled"
                    >
                      <i class="el-icon-plus"></i> 添加商品
                    </el-button>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="交付状态" width="120">
                  <template slot-scope="scope">
                    <el-select v-model="scope.row.status" placeholder="选择状态" :disabled="disabled" @change="handleScheduleItemChange">
                      <el-option label="待交付" value="PENDING"></el-option>
                      <el-option label="部分交付" value="PARTIAL"></el-option>
                      <el-option label="已交付" value="COMPLETED"></el-option>
                      <el-option label="延期" value="DELAYED"></el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" min-width="150">
                  <template slot-scope="scope">
                    <el-input 
                      v-model="scope.row.remark" 
                      size="small" 
                      placeholder="备注"
                      :disabled="disabled"
                      @change="handleScheduleItemChange"
                    ></el-input>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" fixed="right">
                  <template slot-scope="scope">
                    <el-button 
                      type="danger" 
                      size="mini" 
                      @click="handleDeleteScheduleItem(scope.$index)"
                      :disabled="disabled"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-col>
        </el-row>
      </el-form>

      <!-- 选择商品弹窗 -->
      <el-dialog
        title="选择商品"
        :visible.sync="selectProductDialogVisible"
        width="50%"
        append-to-body
      >
        <el-table 
          :data="availableProducts" 
          style="width: 100%" 
          @selection-change="handleProductSelectionChange"
          stripe
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="productName" label="商品名称" width="200"></el-table-column>
          <el-table-column prop="specification" label="规格型号" width="150"></el-table-column>
          <el-table-column prop="unit" label="单位" width="80"></el-table-column>
          <el-table-column prop="quantity" label="订单数量" width="100" align="right"></el-table-column>
          <el-table-column label="已交付数量" width="120">
            <template slot-scope="scope">
              {{ getDeliveredQuantity(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column label="待交付数量" width="120" align="right">
            <template slot-scope="scope">
              {{ getRemainingQuantity(scope.row) }}
            </template>
          </el-table-column>
        </el-table>
        <div slot="footer" class="dialog-footer">
          <el-button @click="selectProductDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmProductSelection">确定</el-button>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'DeliverySchedule',
  props: {
    value: {
      type: Object,
      default: () => ({})
    },
    orderItems: {
      type: Array,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      deliveryForm: {
        deliveryMethod: 'EXPRESS',
        otherDeliveryMethod: '',
        expectedDeliveryDate: '',
        priority: 'NORMAL',
        deliveryAddress: '',
        receiverName: '',
        receiverPhone: '',
        carrier: '',
        trackingNumber: '',
        deliveryRemark: '',
        scheduleItems: []
      },
      selectProductDialogVisible: false,
      selectedProducts: [],
      currentScheduleItem: null,
      availableProducts: []
    }
  },
  watch: {
    value: {
      handler(newVal) {
        this.deliveryForm = { ...this.deliveryForm, ...newVal }
        // 确保scheduleItems是数组
        if (!this.deliveryForm.scheduleItems) {
          this.deliveryForm.scheduleItems = []
        }
      },
      immediate: true
    },
    deliveryForm: {
      handler(newVal) {
        this.$emit('input', { ...newVal })
        this.$emit('change', { ...newVal })
      },
      deep: true
    },
    orderItems: {
      handler() {
        this.updateAvailableProducts()
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    // 更新可用商品列表
    updateAvailableProducts() {
      this.availableProducts = [...this.orderItems].filter(item => {
        // 只显示还有未交付数量的商品
        const remaining = this.getRemainingQuantity(item)
        return remaining > 0
      })
    },
    
    // 处理交付方式变更
    handleDeliveryMethodChange() {
      if (this.deliveryForm.deliveryMethod !== 'LOGISTICS') {
        this.deliveryForm.carrier = ''
        this.deliveryForm.trackingNumber = ''
      }
    },
    
    // 添加交付计划
    handleAddScheduleItem() {
      const newItem = {
        deliveryDate: new Date(),
        items: [],
        status: 'PENDING',
        remark: ''
      }
      this.deliveryForm.scheduleItems.push(newItem)
    },
    
    // 删除交付计划
    handleDeleteScheduleItem(index) {
      this.$confirm('确定要删除此交付计划吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deliveryForm.scheduleItems.splice(index, 1)
        this.updateAvailableProducts()
        this.$message.success('交付计划已删除')
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    // 处理交付计划项变更
    handleScheduleItemChange() {
      this.updateAvailableProducts()
    },
    
    // 添加商品到交付计划
    handleAddProduct(scheduleItem) {
      this.currentScheduleItem = scheduleItem
      this.selectedProducts = []
      this.updateAvailableProducts()
      this.selectProductDialogVisible = true
    },
    
    // 处理商品选择
    handleProductSelectionChange(selection) {
      this.selectedProducts = selection
    },
    
    // 确认商品选择
    handleConfirmProductSelection() {
      if (this.selectedProducts.length === 0 || !this.currentScheduleItem) {
        return
      }
      
      this.selectedProducts.forEach(product => {
        const remaining = this.getRemainingQuantity(product)
        if (remaining > 0) {
          // 检查是否已在当前计划中
          const existingIndex = this.currentScheduleItem.items.findIndex(
            item => item.productCode === product.productCode
          )
          
          if (existingIndex === -1) {
            this.currentScheduleItem.items.push({
              productCode: product.productCode,
              productName: product.productName,
              specification: product.specification,
              unit: product.unit,
              quantity: remaining, // 默认交付剩余数量
              unitPrice: product.unitPrice
            })
          }
        }
      })
      
      this.selectProductDialogVisible = false
      this.updateAvailableProducts()
    },
    
    // 从交付计划中移除商品
    handleRemoveProduct(scheduleItem, productIndex) {
      scheduleItem.items.splice(productIndex, 1)
      this.updateAvailableProducts()
    },
    
    // 获取已交付数量
    getDeliveredQuantity(product) {
      let delivered = 0
      this.deliveryForm.scheduleItems.forEach(schedule => {
        schedule.items.forEach(item => {
          if (item.productCode === product.productCode) {
            delivered += Number(item.quantity || 0)
          }
        })
      })
      return delivered
    },
    
    // 获取待交付数量
    getRemainingQuantity(product) {
      const totalOrder = Number(product.quantity || 0)
      const delivered = this.getDeliveredQuantity(product)
      return Math.max(0, totalOrder - delivered)
    },
    
    // 验证表单
    validate() {
      return new Promise((resolve, reject) => {
        if (this.$refs.deliveryForm) {
          this.$refs.deliveryForm.validate((valid) => {
            if (valid) {
              resolve(true)
            } else {
              resolve(false)
            }
          })
        } else {
          resolve(true)
        }
      })
    }
  }
}
</script>

<style scoped>
.delivery-schedule {
  margin-bottom: 20px;
}

.schedule-details-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #ebeef5;
}

.section-subtitle {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
}

.schedule-item-product {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}
</style>