<template>
  <div class="quote-calculator">
    <el-card shadow="hover" class="calculator-card">
      <template #header>
        <div class="card-header">
          <span>报价计算器</span>
          <el-button size="small" type="primary" @click="resetCalculator">重置</el-button>
        </div>
      </template>
      
      <div class="calculator-content">
        <!-- 基础价格设置 -->
        <el-form :model="calculatorData" label-width="120px" class="calculator-form">
          <el-form-item label="产品成本">
            <el-input-number v-model="calculatorData.cost" :min="0" :step="0.01" style="width: 100%;" />
          </el-form-item>
          
          <el-form-item label="期望利润率">
            <el-input-number v-model="calculatorData.profitMargin" :min="0" :max="100" :step="0.1" style="width: 100%;" />
            <span class="unit">%</span>
          </el-form-item>
          
          <el-form-item label="税率">
            <el-select v-model="calculatorData.taxRate" placeholder="选择税率">
              <el-option label="13% 增值税" :value="13" />
              <el-option label="9% 增值税" :value="9" />
              <el-option label="6% 增值税" :value="6" />
              <el-option label="0% 免税" :value="0" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="折扣率">
            <el-input-number v-model="calculatorData.discountRate" :min="0" :max="100" :step="0.1" style="width: 100%;" />
            <span class="unit">%</span>
          </el-form-item>
          
          <el-form-item label="运输费用">
            <el-input-number v-model="calculatorData.shippingCost" :min="0" :step="0.01" style="width: 100%;" />
          </el-form-item>
          
          <el-form-item label="其他费用">
            <el-input-number v-model="calculatorData.otherCosts" :min="0" :step="0.01" style="width: 100%;" />
          </el-form-item>
        </el-form>
        
        <!-- 计算结果 -->
        <div class="calculation-result">
          <el-divider>计算结果</el-divider>
          <div class="result-item">
            <span class="result-label">不含税价格：</span>
            <span class="result-value highlight">{{ calculatedPrice.exTaxPrice.toFixed(2) }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">税额：</span>
            <span class="result-value">{{ calculatedPrice.taxAmount.toFixed(2) }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">含税总价：</span>
            <span class="result-value highlight">{{ calculatedPrice.totalPrice.toFixed(2) }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">预计利润：</span>
            <span class="result-value profit">{{ calculatedPrice.profit.toFixed(2) }}</span>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" @click="applyPrice">应用价格</el-button>
          <el-button @click="saveAsTemplate">保存为模板</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'QuoteCalculator',
  emits: ['priceCalculated'],
  setup(props, { emit }) {
    // 计算器数据
    const calculatorData = ref({
      cost: 0,
      profitMargin: 20,
      taxRate: 13,
      discountRate: 0,
      shippingCost: 0,
      otherCosts: 0
    })
    
    // 计算价格结果
    const calculatedPrice = computed(() => {
      const { cost, profitMargin, taxRate, discountRate, shippingCost, otherCosts } = calculatorData.value
      
      // 计算不含税基础价格（成本+利润）
      const basePrice = cost * (1 + profitMargin / 100)
      
      // 应用折扣
      const discountedPrice = basePrice * (1 - discountRate / 100)
      
      // 加上其他费用
      const exTaxPrice = discountedPrice + shippingCost + otherCosts
      
      // 计算税额
      const taxAmount = exTaxPrice * (taxRate / 100)
      
      // 计算含税总价
      const totalPrice = exTaxPrice + taxAmount
      
      // 计算实际利润
      const profit = exTaxPrice - cost - shippingCost - otherCosts
      
      return {
        exTaxPrice,
        taxAmount,
        totalPrice,
        profit
      }
    })
    
    // 重置计算器
    const resetCalculator = () => {
      calculatorData.value = {
        cost: 0,
        profitMargin: 20,
        taxRate: 13,
        discountRate: 0,
        shippingCost: 0,
        otherCosts: 0
      }
    }
    
    // 应用价格
    const applyPrice = () => {
      emit('priceCalculated', {
        ...calculatedPrice.value,
        ...calculatorData.value
      })
      ElMessage.success('价格计算完成')
    }
    
    // 保存为模板
    const saveAsTemplate = () => {
      // 这里可以实现保存模板的逻辑
      ElMessage.info('模板保存功能待实现')
    }
    
    return {
      calculatorData,
      calculatedPrice,
      resetCalculator,
      applyPrice,
      saveAsTemplate
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
  padding: 0;
}

.calculator-form {
  margin-bottom: 20px;
}

.unit {
  margin-left: 10px;
  color: #606266;
}

.calculation-result {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.result-label {
  color: #606266;
}

.result-value {
  font-weight: 500;
  color: #303133;
}

.result-value.highlight {
  color: #409eff;
  font-size: 16px;
}

.result-value.profit {
  color: #67c23a;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>