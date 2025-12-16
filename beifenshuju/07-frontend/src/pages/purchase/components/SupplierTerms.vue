<template>
  <div class="supplier-terms">
    <el-card class="terms-card">
      <div slot="header" class="card-header">
        <span>供应商条款设置</span>
        <el-button type="text" @click="resetTerms" v-if="editable">重置</el-button>
      </div>
      
      <el-form :model="termsData" label-width="120px" class="terms-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="付款条件">
              <el-select
                v-model="termsData.paymentTerm"
                placeholder="选择付款条件"
                :disabled="!editable"
              >
                <el-option label="货到付款" value="COD"></el-option>
                <el-option label="预付30%，到货后付70%" value="PRE30_AFTER70"></el-option>
                <el-option label="预付50%，到货后付50%" value="PRE50_AFTER50"></el-option>
                <el-option label="月结30天" value="MONTHLY30"></el-option>
                <el-option label="月结60天" value="MONTHLY60"></el-option>
                <el-option label="月结90天" value="MONTHLY90"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="付款方式">
              <el-select
                v-model="termsData.paymentMethod"
                placeholder="选择付款方式"
                :disabled="!editable"
              >
                <el-option label="银行转账" value="BANK_TRANSFER"></el-option>
                <el-option label="支票" value="CHECK"></el-option>
                <el-option label="电汇" value="WIRE_TRANSFER"></el-option>
                <el-option label="信用证" value="L/C"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="交货方式">
              <el-select
                v-model="termsData.deliveryMethod"
                placeholder="选择交货方式"
                :disabled="!editable"
              >
                <el-option label="供应商送货" value="SUPPLIER_DELIVERY"></el-option>
                <el-option label="自提" value="SELF_PICKUP"></el-option>
                <el-option label="第三方物流" value="THIRD_PARTY_LOGISTICS"></el-option>
                <el-option label="快递" value="EXPRESS"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="运输方式">
              <el-select
                v-model="termsData.transportMode"
                placeholder="选择运输方式"
                :disabled="!editable"
              >
                <el-option label="公路运输" value="ROAD"></el-option>
                <el-option label="铁路运输" value="RAILWAY"></el-option>
                <el-option label="海运" value="SEA"></el-option>
                <el-option label="空运" value="AIR"></el-option>
                <el-option label="多式联运" value="MULTIMODAL"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="交货期">
              <el-input-number
                v-model="termsData.leadTime"
                :min="0"
                :disabled="!editable"
                placeholder="天"
              ></el-input-number>
              <span class="unit">天</span>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="质量保证期">
              <el-input-number
                v-model="termsData.warrantyPeriod"
                :min="0"
                :disabled="!editable"
                placeholder="月"
              ></el-input-number>
              <span class="unit">月</span>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="最小订单量">
              <el-input-number
                v-model="termsData.minOrderQuantity"
                :min="0"
                :disabled="!editable"
              ></el-input-number>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="包装要求">
              <el-select
                v-model="termsData.packingRequirement"
                placeholder="选择包装要求"
                :disabled="!editable"
              >
                <el-option label="标准包装" value="STANDARD"></el-option>
                <el-option label="定制包装" value="CUSTOMIZED"></el-option>
                <el-option label="环保包装" value="ECO_FRIENDLY"></el-option>
                <el-option label="防湿包装" value="MOISTURE_PROOF"></el-option>
                <el-option label="防震包装" value="SHOCK_PROOF"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="24">
            <el-form-item label="验收标准">
              <el-input
                v-model="termsData.inspectionStandard"
                type="textarea"
                :rows="3"
                :disabled="!editable"
              ></el-input>
            </el-form-item>
          </el-col>
          
          <el-col :span="24">
            <el-form-item label="违约条款">
              <el-input
                v-model="termsData.penaltyClause"
                type="textarea"
                :rows="3"
                :disabled="!editable"
              ></el-input>
            </el-form-item>
          </el-col>
          
          <el-col :span="24">
            <el-form-item label="其他条款">
              <el-input
                v-model="termsData.otherTerms"
                type="textarea"
                :rows="3"
                :disabled="!editable"
              ></el-input>
            </el-form-item>
          </el-col>
          
          <el-col :span="24">
            <el-form-item>
              <el-checkbox v-model="termsData.termsAccepted" :disabled="!editable">我已阅读并接受所有条款</el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'SupplierTerms',
  props: {
    terms: {
      type: Object,
      default: () => ({})
    },
    editable: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      termsData: {
        paymentTerm: '',
        paymentMethod: '',
        deliveryMethod: '',
        transportMode: '',
        leadTime: 0,
        warrantyPeriod: 0,
        minOrderQuantity: 0,
        packingRequirement: '',
        inspectionStandard: '',
        penaltyClause: '',
        otherTerms: '',
        termsAccepted: false
      }
    }
  },
  watch: {
    terms: {
      handler(newVal) {
        this.termsData = { ...this.termsData, ...newVal }
      },
      immediate: true
    }
  },
  methods: {
    // 重置条款
    resetTerms() {
      this.$confirm('确定要重置所有条款吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.termsData = {
          paymentTerm: '',
          paymentMethod: '',
          deliveryMethod: '',
          transportMode: '',
          leadTime: 0,
          warrantyPeriod: 0,
          minOrderQuantity: 0,
          packingRequirement: '',
          inspectionStandard: '',
          penaltyClause: '',
          otherTerms: '',
          termsAccepted: false
        }
        this.$emit('terms-changed', this.termsData)
      }).catch(() => {})
    },
    
    // 获取当前条款数据
    getTermsData() {
      return { ...this.termsData }
    },
    
    // 验证条款
    validateTerms() {
      if (!this.termsData.paymentTerm) {
        this.$message.error('请选择付款条件')
        return false
      }
      
      if (!this.termsData.deliveryMethod) {
        this.$message.error('请选择交货方式')
        return false
      }
      
      if (!this.termsData.termsAccepted) {
        this.$message.error('请阅读并接受所有条款')
        return false
      }
      
      return true
    }
  },
  mounted() {
    // 监听数据变化
    this.$watch(
      () => this.termsData,
      (newVal) => {
        this.$emit('terms-changed', newVal)
      },
      { deep: true }
    )
  }
}
</script>

<style scoped>
.supplier-terms {
  margin-bottom: 20px;
}

.terms-card {
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.terms-form {
  padding: 10px 0;
}

.unit {
  margin-left: 5px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-form .el-col {
    width: 100% !important;
    margin-bottom: 10px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>