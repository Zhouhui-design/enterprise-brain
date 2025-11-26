<template>
  <div class="quote-calculator">
    <el-card class="calculator-card">
      <template #header>
        <div class="card-header">
          <span>报价计算器</span>
        </div>
      </template>
      
      <div class="calculator-content">
        <!-- 成本信息输入 -->
        <el-collapse v-model="activeCollapse">
          <el-collapse-item title="成本信息" name="1">
            <el-form ref="costForm" :model="costData" label-width="120px">
              <el-form-item label="材料成本">
                <el-input-number v-model="costData.materialCost" :min="0" :precision="2" placeholder="请输入材料成本" />
              </el-form-item>
              <el-form-item label="人工成本">
                <el-input-number v-model="costData.laborCost" :min="0" :precision="2" placeholder="请输入人工成本" />
              </el-form-item>
              <el-form-item label="制造费用">
                <el-input-number v-model="costData.manufacturingCost" :min="0" :precision="2" placeholder="请输入制造费用" />
              </el-form-item>
              <el-form-item label="运输成本">
                <el-input-number v-model="costData.shippingCost" :min="0" :precision="2" placeholder="请输入运输成本" />
              </el-form-item>
              <el-form-item label="其他成本">
                <el-input-number v-model="costData.otherCost" :min="0" :precision="2" placeholder="请输入其他成本" />
              </el-form-item>
            </el-form>
          </el-collapse-item>
          
          <el-collapse-item title="定价策略" name="2">
            <el-form ref="pricingForm" :model="pricingData" label-width="120px">
              <el-form-item label="利润率(%)">
                <el-input-number v-model="pricingData.profitMargin" :min="0" :max="100" :precision="2" placeholder="请输入利润率" />
              </el-form-item>
              <el-form-item label="税率(%)">
                <el-input-number v-model="pricingData.taxRate" :min="0" :max="100" :precision="2" placeholder="请输入税率" />
              </el-form-item>
              <el-form-item label="折扣率(%)">
                <el-input-number v-model="pricingData.discountRate" :min="0" :max="100" :precision="2" placeholder="请输入折扣率" />
              </el-form-item>
              <el-form-item label="竞争对手价格">
                <el-input-number v-model="pricingData.competitorPrice" :min="0" :precision="2" placeholder="请输入竞争对手价格" />
              </el-form-item>
            </el-form>
          </el-collapse-item>
        </el-collapse>
        
        <!-- 计算结果展示 -->
        <div class="calculation-results" v-if="showResults">
          <el-divider>计算结果</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-statistic :value="totalCost" prefix="总成本：" suffix="元" />
            </el-col>
            <el-col :span="12">
              <el-statistic :value="basePrice" prefix="基础价格：" suffix="元" />
            </el-col>
            <el-col :span="12">
              <el-statistic :value="taxAmount" prefix="税额：" suffix="元" />
            </el-col>
            <el-col :span="12">
              <el-statistic :value="discountAmount" prefix="折扣金额：" suffix="元" />
            </el-col>
            <el-col :span="24">
              <el-statistic :value="finalPrice" prefix="最终报价：" suffix="元" :precision="2" />
            </el-col>
          </el-row>
        </div>
        
        <!-- 操作按钮 -->
        <div class="calculator-actions">
          <el-button type="primary" @click="calculate">计算报价</el-button>
          <el-button type="success" @click="applyQuote" :disabled="!showResults">应用报价</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'QuoteCalculator',
  data() {
    return {
      activeCollapse: ['1'],
      showResults: false,
      costData: {
        materialCost: 0,
        laborCost: 0,
        manufacturingCost: 0,
        shippingCost: 0,
        otherCost: 0
      },
      pricingData: {
        profitMargin: 20,
        taxRate: 13,
        discountRate: 0,
        competitorPrice: 0
      },
      totalCost: 0,
      basePrice: 0,
      taxAmount: 0,
      discountAmount: 0,
      finalPrice: 0
    }
  },
  methods: {
    calculate() {
      // 计算总成本
      this.totalCost = Object.values(this.costData).reduce((sum, cost) => sum + cost, 0)
      
      // 计算基础价格（包含利润）
      this.basePrice = this.totalCost * (1 + this.pricingData.profitMargin / 100)
      
      // 计算税额
      this.taxAmount = this.basePrice * (this.pricingData.taxRate / 100)
      
      // 计算折扣金额
      this.discountAmount = this.basePrice * (this.pricingData.discountRate / 100)
      
      // 计算最终报价
      this.finalPrice = this.basePrice + this.taxAmount - this.discountAmount
      
      this.showResults = true
    },
    
    applyQuote() {
      // 触发自定义事件，将计算结果传递给父组件
      this.$emit('quoteCalculated', {
        totalCost: this.totalCost,
        basePrice: this.basePrice,
        taxAmount: this.taxAmount,
        discountAmount: this.discountAmount,
        finalPrice: this.finalPrice,
        profitMargin: this.pricingData.profitMargin,
        taxRate: this.pricingData.taxRate,
        discountRate: this.pricingData.discountRate
      })
      
      this.$message.success('报价已应用')
    },
    
    reset() {
      this.costData = {
        materialCost: 0,
        laborCost: 0,
        manufacturingCost: 0,
        shippingCost: 0,
        otherCost: 0
      }
      this.pricingData = {
        profitMargin: 20,
        taxRate: 13,
        discountRate: 0,
        competitorPrice: 0
      }
      this.showResults = false
      this.totalCost = 0
      this.basePrice = 0
      this.taxAmount = 0
      this.discountAmount = 0
      this.finalPrice = 0
    }
  }
}
</script>

<style scoped>
.quote-calculator {
  width: 100%;
}

.calculator-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calculator-content {
  padding: 20px 0;
}

.calculation-results {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.calculator-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>