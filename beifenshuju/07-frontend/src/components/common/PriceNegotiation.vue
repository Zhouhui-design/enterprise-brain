<template>
  <div class="price-negotiation">
    <el-card class="negotiation-card">
      <template #header>
        <div class="card-header">
          <span>价格协商</span>
          <el-tag :type="negotiationStatus.type" effect="dark">{{ negotiationStatus.text }}</el-tag>
        </div>
      </template>
      
      <div class="negotiation-content">
        <!-- 报价信息 -->
        <el-row :gutter="20" class="quote-info">
          <el-col :span="8">
            <div class="info-item">
              <span class="label">初始报价：</span>
              <span class="value primary">{{ initialQuote.toFixed(2) }} 元</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">当前报价：</span>
              <span class="value highlight">{{ currentQuote.toFixed(2) }} 元</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">客户出价：</span>
              <span class="value warning">{{ customerOffer.toFixed(2) }} 元</span>
            </div>
          </el-col>
        </el-row>
        
        <!-- 协商历史 -->
        <div class="negotiation-history">
          <el-divider>协商历史</el-divider>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in negotiationHistory"
              :key="index"
              :timestamp="item.timestamp"
              :type="item.type"
            >
              <div class="timeline-content">
                <div class="content-header">
                  <strong>{{ item.title }}</strong>
                  <span class="price">{{ item.price ? item.price.toFixed(2) + ' 元' : '' }}</span>
                </div>
                <div class="content-body">{{ item.description }}</div>
                <div class="content-footer">
                  <small>{{ item.operator }} | {{ item.status }}</small>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
        
        <!-- 协商表单 -->
        <div class="negotiation-form" v-if="!isNegotiationEnded">
          <el-divider>提交报价</el-divider>
          <el-form ref="negotiationForm" :model="negotiationData" label-width="120px">
            <el-form-item label="新报价金额" prop="newPrice" :rules="[{ required: true, message: '请输入新报价', trigger: 'blur' }]">
              <el-input-number
                v-model="negotiationData.newPrice"
                :min="minAllowedPrice"
                :max="maxAllowedPrice"
                :precision="2"
                placeholder="请输入新报价金额"
                style="width: 200px"
              />
              <span class="range-hint">
                (允许范围: {{ minAllowedPrice.toFixed(2) }} - {{ maxAllowedPrice.toFixed(2) }} 元)
              </span>
            </el-form-item>
            <el-form-item label="折扣率(%)">
              <el-input-number
                v-model="negotiationData.discountRate"
                :min="0"
                :max="maxDiscountRate"
                :precision="2"
                placeholder="请输入折扣率"
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="让步理由" prop="reason">
              <el-input
                v-model="negotiationData.reason"
                type="textarea"
                rows="3"
                placeholder="请输入价格让步的理由"
              />
            </el-form-item>
            <el-form-item label="附加条款">
              <el-input
                v-model="negotiationData.terms"
                type="textarea"
                rows="2"
                placeholder="如付款条件、交付时间等特殊条款"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitQuote">提交报价</el-button>
              <el-button type="success" @click="acceptOffer" v-if="customerOffer < currentQuote">接受客户报价</el-button>
              <el-button type="danger" @click="rejectNegotiation" v-if="canReject">拒绝协商</el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 协商结果 -->
        <div class="negotiation-result" v-if="isNegotiationEnded">
          <el-result
            :icon="negotiationResult.icon"
            :title="negotiationResult.title"
            :sub-title="negotiationResult.subtitle"
          >
            <template #extra>
              <el-button type="primary" @click="restartNegotiation">重新开始协商</el-button>
            </template>
          </el-result>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'PriceNegotiation',
  props: {
    // 初始报价
    initialQuote: {
      type: Number,
      default: 1000
    },
    // 允许的最低价格
    minAllowedPrice: {
      type: Number,
      default: 800
    },
    // 最大折扣率
    maxDiscountRate: {
      type: Number,
      default: 30
    },
    // 协商次数限制
    maxNegotiationRounds: {
      type: Number,
      default: 5
    }
  },
  data() {
    return {
      currentQuote: this.initialQuote,
      customerOffer: 900,
      isNegotiationEnded: false,
      negotiationRounds: 0,
      negotiationData: {
        newPrice: null,
        discountRate: 0,
        reason: '',
        terms: ''
      },
      negotiationHistory: [
        {
          timestamp: '2024-01-20 09:00',
          type: 'primary',
          title: '系统生成初始报价',
          description: '根据产品成本和定价策略生成初始报价',
          price: this.initialQuote,
          operator: '系统',
          status: '已发送'
        },
        {
          timestamp: '2024-01-20 10:30',
          type: 'warning',
          title: '客户提出价格异议',
          description: '客户认为价格偏高，期望降低成本',
          price: 900,
          operator: '客户',
          status: '待回应'
        }
      ],
      negotiationResult: {
        icon: 'success',
        title: '协商成功',
        subtitle: ''
      }
    }
  },
  computed: {
    maxAllowedPrice() {
      return this.initialQuote * 1.2 // 允许上调20%
    },
    
    negotiationStatus() {
      if (this.isNegotiationEnded) {
        return this.negotiationResult.icon === 'success' ? 
          { type: 'success', text: '协商成功' } : 
          { type: 'danger', text: '协商失败' }
      }
      return { type: 'primary', text: '协商中' }
    },
    
    canReject() {
      return !this.isNegotiationEnded && this.negotiationRounds >= 2
    }
  },
  methods: {
    submitQuote() {
      this.$refs.negotiationForm.validate(valid => {
        if (valid) {
          // 计算新价格（如果设置了折扣率）
          let newPrice = this.negotiationData.newPrice
          if (this.negotiationData.discountRate > 0) {
            newPrice = this.currentQuote * (1 - this.negotiationData.discountRate / 100)
          }
          
          // 添加到协商历史
          this.negotiationHistory.push({
            timestamp: this.getFormattedDateTime(),
            type: 'info',
            title: '我方调整报价',
            description: this.negotiationData.reason || '根据协商调整报价',
            price: newPrice,
            operator: '销售代表',
            status: '已发送'
          })
          
          // 更新当前报价
          this.currentQuote = newPrice
          this.negotiationRounds++
          
          // 模拟客户回应
          setTimeout(() => {
            this.simulateCustomerResponse()
          }, 2000)
          
          // 重置表单
          this.resetForm()
          
          this.$message.success('报价已提交')
        }
      })
    },
    
    acceptOffer() {
      this.isNegotiationEnded = true
      this.negotiationResult = {
        icon: 'success',
        title: '协商成功',
        subtitle: `已接受客户报价：${this.customerOffer.toFixed(2)} 元`
      }
      
      // 添加到历史记录
      this.negotiationHistory.push({
        timestamp: this.getFormattedDateTime(),
        type: 'success',
        title: '接受客户报价',
        description: `确认接受客户提出的 ${this.customerOffer.toFixed(2)} 元价格`,
        price: this.customerOffer,
        operator: '销售代表',
        status: '协商成功'
      })
      
      // 触发成功事件
      this.$emit('negotiationSuccess', {
        finalPrice: this.customerOffer,
        rounds: this.negotiationRounds,
        history: this.negotiationHistory
      })
    },
    
    rejectNegotiation() {
      this.$confirm('确定要拒绝此次价格协商吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.isNegotiationEnded = true
        this.negotiationResult = {
          icon: 'warning',
          title: '协商终止',
          subtitle: '已拒绝当前价格协商请求'
        }
        
        // 添加到历史记录
        this.negotiationHistory.push({
          timestamp: this.getFormattedDateTime(),
          type: 'danger',
          title: '拒绝协商',
          description: '当前报价已为最低可接受价格，无法进一步让步',
          price: this.currentQuote,
          operator: '销售代表',
          status: '协商终止'
        })
        
        // 触发失败事件
        this.$emit('negotiationFailed', {
          lastPrice: this.currentQuote,
          rounds: this.negotiationRounds,
          history: this.negotiationHistory
        })
      })
    },
    
    restartNegotiation() {
      this.currentQuote = this.initialQuote
      this.customerOffer = 900
      this.isNegotiationEnded = false
      this.negotiationRounds = 0
      this.negotiationHistory = [
        {
          timestamp: this.getFormattedDateTime(),
          type: 'primary',
          title: '系统生成初始报价',
          description: '根据产品成本和定价策略生成初始报价',
          price: this.initialQuote,
          operator: '系统',
          status: '已发送'
        }
      ]
      this.resetForm()
    },
    
    simulateCustomerResponse() {
      // 模拟客户回应
      const responses = [
        {
          type: 'warning',
          title: '客户还价',
          description: '客户继续要求降低价格',
          price: Math.max(this.minAllowedPrice, this.customerOffer - 50),
          operator: '客户',
          status: '待回应'
        },
        {
          type: 'success',
          title: '客户接受报价',
          description: '客户接受当前报价，准备签署合同',
          price: this.currentQuote,
          operator: '客户',
          status: '接受报价'
        }
      ]
      
      // 根据当前价格决定客户回应
      const responseIndex = this.currentQuote <= this.customerOffer ? 1 : 0
      const response = responses[responseIndex]
      
      this.negotiationHistory.push({
        ...response,
        timestamp: this.getFormattedDateTime()
      })
      
      if (response.type === 'success') {
        // 客户接受报价
        this.isNegotiationEnded = true
        this.negotiationResult = {
          icon: 'success',
          title: '协商成功',
          subtitle: `客户已接受报价：${this.currentQuote.toFixed(2)} 元`
        }
        
        // 触发成功事件
        this.$emit('negotiationSuccess', {
          finalPrice: this.currentQuote,
          rounds: this.negotiationRounds,
          history: this.negotiationHistory
        })
      } else {
        // 更新客户报价
        this.customerOffer = response.price
      }
      
      // 检查是否达到协商次数上限
      if (this.negotiationRounds >= this.maxNegotiationRounds && !this.isNegotiationEnded) {
        this.$message.warning(`已达到最大协商次数 ${this.maxNegotiationRounds} 轮`)
      }
    },
    
    getFormattedDateTime() {
      const now = new Date()
      const date = now.toLocaleDateString('zh-CN')
      const time = now.toLocaleTimeString('zh-CN', { hour12: false })
      return `${date} ${time}`
    },
    
    resetForm() {
      this.negotiationData = {
        newPrice: null,
        discountRate: 0,
        reason: '',
        terms: ''
      }
      if (this.$refs.negotiationForm) {
        this.$refs.negotiationForm.resetFields()
      }
    }
  }
}
</script>

<style scoped>
.price-negotiation {
  width: 100%;
}

.negotiation-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.negotiation-content {
  padding: 20px 0;
}

.quote-info {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}

.info-item .label {
  color: #606266;
}

.info-item .value {
  font-size: 16px;
  font-weight: bold;
}

.value.primary {
  color: #409eff;
}

.value.highlight {
  color: #e6a23c;
  font-size: 18px;
}

.value.warning {
  color: #f56c6c;
}

.negotiation-history {
  margin-bottom: 30px;
}

.timeline-content {
  min-height: 60px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.content-header .price {
  font-weight: bold;
  color: #e6a23c;
}

.content-body {
  color: #606266;
  margin-bottom: 5px;
}

.content-footer {
  color: #909399;
}

.range-hint {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.negotiation-form,
.negotiation-result {
  margin-top: 30px;
}
</style>