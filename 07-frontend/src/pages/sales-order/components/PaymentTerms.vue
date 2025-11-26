<template>
  <div class="payment-terms">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>付款条款</span>
      </div>

      <el-form ref="paymentForm" :model="paymentForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="付款方式" prop="paymentMethod">
              <el-select v-model="paymentForm.paymentMethod" placeholder="选择付款方式" :disabled="disabled" @change="handlePaymentMethodChange">
                <el-option label="现金" value="CASH"></el-option>
                <el-option label="银行转账" value="BANK_TRANSFER"></el-option>
                <el-option label="在线支付" value="ONLINE_PAY"></el-option>
                <el-option label="信用支付" value="CREDIT"></el-option>
                <el-option label="其他" value="OTHER"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="其他付款方式" v-if="paymentForm.paymentMethod === 'OTHER'">
              <el-input v-model="paymentForm.otherPaymentMethod" placeholder="请输入其他付款方式" :disabled="disabled"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="付款条件" prop="paymentTerms">
              <el-select v-model="paymentForm.paymentTerms" placeholder="选择付款条件" :disabled="disabled">
                <el-option label="预付款" value="PRE_PAYMENT"></el-option>
                <el-option label="货到付款" value="CASH_ON_DELIVERY"></el-option>
                <el-option label="30天" value="NET_30"></el-option>
                <el-option label="60天" value="NET_60"></el-option>
                <el-option label="90天" value="NET_90"></el-option>
                <el-option label="自定义" value="CUSTOM"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="自定义付款条件" v-if="paymentForm.paymentTerms === 'CUSTOM'">
              <el-input v-model="paymentForm.customPaymentTerms" placeholder="请输入自定义付款条件" :disabled="disabled"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 分期付款设置 -->
        <el-row>
          <el-col :span="24">
            <div class="installment-section" v-if="paymentForm.paymentTerms !== 'PRE_PAYMENT' && paymentForm.paymentTerms !== 'CASH_ON_DELIVERY'">
              <h4 class="section-subtitle">分期付款设置</h4>
              <el-button 
                type="primary" 
                size="small" 
                @click="handleAddInstallment"
                :disabled="disabled"
              >
                <i class="el-icon-plus"></i> 添加付款期数
              </el-button>
              
              <el-table 
                :data="paymentForm.installments" 
                style="width: 100%; margin-top: 15px" 
                stripe
              >
                <el-table-column prop="phase" label="期数" width="80">
                  <template slot-scope="scope">
                    <el-input-number 
                      v-model="scope.row.phase" 
                      :min="1" 
                      :step="1" 
                      size="small"
                      :disabled="disabled"
                      @change="handleInstallmentChange"
                    ></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="percentage" label="付款比例(%)" width="120">
                  <template slot-scope="scope">
                    <el-input-number 
                      v-model="scope.row.percentage" 
                      :min="0.01" 
                      :max="100" 
                      :step="0.01" 
                      size="small"
                      :disabled="disabled"
                      @change="handlePercentageChange(scope.row)"
                    ></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="付款金额（元）" width="120" align="right">
                  <template slot-scope="scope">
                    {{ formatCurrency(scope.row.amount) }}
                  </template>
                </el-table-column>
                <el-table-column prop="dueDays" label="到期天数" width="100">
                  <template slot-scope="scope">
                    <el-input-number 
                      v-model="scope.row.dueDays" 
                      :min="0" 
                      :step="1" 
                      size="small"
                      :disabled="disabled"
                      @change="handleInstallmentChange"
                    ></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column label="到期日期" width="150">
                  <template slot-scope="scope">
                    {{ calculateDueDate(scope.row) }}
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="付款状态" width="120">
                  <template slot-scope="scope">
                    <el-select v-model="scope.row.status" placeholder="选择状态" :disabled="disabled" @change="handleInstallmentChange">
                      <el-option label="未付款" value="UNPAID"></el-option>
                      <el-option label="已付款" value="PAID"></el-option>
                      <el-option label="部分付款" value="PARTIALLY_PAID"></el-option>
                      <el-option label="逾期" value="OVERDUE"></el-option>
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
                      @change="handleInstallmentChange"
                    ></el-input>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" fixed="right">
                  <template slot-scope="scope">
                    <el-button 
                      type="danger" 
                      size="mini" 
                      @click="handleDeleteInstallment(scope.$index)"
                      :disabled="disabled || paymentForm.installments.length <= 1"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="percentage-summary" style="margin-top: 10px; text-align: right; color: #606266;">
                合计比例：{{ calculateTotalPercentage() }}%
                <el-alert
                  v-if="Math.abs(calculateTotalPercentage() - 100) > 0.01"
                  title="分期比例总和必须为100%"
                  type="warning"
                  show-icon
                  :closable="false"
                  style="margin-top: 10px;"
                ></el-alert>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 银行账户信息 -->
        <el-row v-if="paymentForm.paymentMethod === 'BANK_TRANSFER'">
          <el-col :span="24">
            <div class="bank-info-section">
              <h4 class="section-subtitle">收款银行信息</h4>
              <el-form-item label="开户银行" prop="bankName">
                <el-input v-model="paymentForm.bankName" placeholder="请输入开户银行名称" :disabled="disabled"></el-input>
              </el-form-item>
              <el-form-item label="银行账号" prop="bankAccount">
                <el-input v-model="paymentForm.bankAccount" placeholder="请输入银行账号" :disabled="disabled"></el-input>
              </el-form-item>
              <el-form-item label="开户名称" prop="accountName">
                <el-input v-model="paymentForm.accountName" placeholder="请输入开户名称" :disabled="disabled"></el-input>
              </el-form-item>
              <el-form-item label="银行联行号" prop="bankCode">
                <el-input v-model="paymentForm.bankCode" placeholder="请输入银行联行号" :disabled="disabled"></el-input>
              </el-form-item>
            </div>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="付款备注" prop="paymentRemark">
              <el-input 
                v-model="paymentForm.paymentRemark" 
                type="textarea" 
                :rows="3" 
                placeholder="请输入付款相关备注信息"
                :disabled="disabled"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 付款记录 -->
        <el-row>
          <el-col :span="24">
            <div class="payment-records-section">
              <h4 class="section-subtitle">付款记录</h4>
              <el-button 
                type="primary" 
                size="small" 
                @click="handleAddPaymentRecord"
                :disabled="disabled"
              >
                <i class="el-icon-plus"></i> 添加付款记录
              </el-button>
              
              <el-table 
                :data="paymentForm.paymentRecords" 
                style="width: 100%; margin-top: 15px" 
                stripe
              >
                <el-table-column prop="paymentNo" label="付款单号" width="180">
                  <template slot-scope="scope">
                    <el-input 
                      v-model="scope.row.paymentNo" 
                      size="small" 
                      placeholder="输入付款单号"
                      :disabled="disabled"
                      @change="handlePaymentRecordChange"
                    ></el-input>
                  </template>
                </el-table-column>