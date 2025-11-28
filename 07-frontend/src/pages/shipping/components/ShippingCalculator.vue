<template>
  <div class="shipping-calculator">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Calculator /></el-icon>
          <span>发货费用计算</span>
        </div>
      </template>
      
      <el-steps :active="activeStep" finish-status="success">
        <el-step title="基础信息" />
        <el-step title="物品明细" />
        <el-step title="费用明细" />
        <el-step title="计算结果" />
      </el-steps>
      
      <!-- 第一步：基础信息 -->
      <div v-if="activeStep === 0" class="step-content">
        <el-form
          ref="basicFormRef"
          :model="basicForm"
          :rules="basicRules"
          label-width="120px"
          class="basic-form"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="发货方式" prop="shippingMethod">
                <el-select
                  v-model="basicForm.shippingMethod"
                  placeholder="请选择发货方式"
                  @change="updateMethod"
                >
                  <el-option label="快递" value="EXPRESS" />
                  <el-option label="物流" value="LOGISTICS" />
                  <el-option label="自提" value="SELF_PICKUP" />
                  <el-option label="空运" value="AIR" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="物流公司" prop="logisticsCompany" v-if="showLogisticsCompany">
                <el-select
                  v-model="basicForm.logisticsCompany"
                  placeholder="请选择物流公司"
                  @change="updateLogistics"
                >
                  <el-option
                    v-for="company in logisticsCompanies"
                    :key="company.value"
                    :label="company.label"
                    :value="company.value"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="运输路线" prop="routeType">
                <el-radio-group v-model="basicForm.routeType">
                  <el-radio label="省内">省内</el-radio>
                  <el-radio label="省外">省外</el-radio>
                  <el-radio label="跨境">跨境</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="发货地" prop="originAddress">
                <el-cascader
                  v-model="basicForm.originAddress"
                  :options="addressOptions"
                  placeholder="请选择发货地"
                  :props="{
                    value: 'code',
                    label: 'name',
                    children: 'children'
                  }"
                />
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="目的地" prop="destinationAddress">
                <el-cascader
                  v-model="basicForm.destinationAddress"
                  :options="addressOptions"
                  placeholder="请选择目的地"
                  :props="{
                    value: 'code',
                    label: 'name',
                    children: 'children'
                  }"
                />
              </el-form-item>
              
              <el-form-item label="预计发货日期" prop="estimatedDate">
                <el-date-picker
                  v-model="basicForm.estimatedDate"
                  type="date"
                  placeholder="请选择发货日期"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
              
              <el-form-item label="是否加急" prop="isUrgent">
                <el-switch
                  v-model="basicForm.isUrgent"
                  active-text="是"
                  inactive-text="否"
                />
              </el-form-item>
              
              <el-form-item label="保价金额" prop="insuredAmount" v-if="showInsurance">
                <el-input
                  v-model.number="basicForm.insuredAmount"
                  placeholder="请输入保价金额"
                  prefix-icon="el-icon-money"
                >
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      
      <!-- 第二步：物品明细 -->
      <div v-if="activeStep === 1" class="step-content">
        <el-button type="primary" @click="addItem" class="add-item-btn">
          <el-icon><Plus /></el-icon>
          添加物品
        </el-button>
        
        <el-table
          v-loading="loading"
          :data="itemList"
          style="width: 100%"
          border
          class="item-table"
        >
          <el-table-column prop="productName" label="物品名称" width="200">
            <template #default="{ row }">
              <el-input v-model="row.productName" placeholder="请输入物品名称" />
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                :step="1"
                style="width: 100%"
                @change="calculateTotal"
              />
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="100">
            <template #default="{ row }">
              <el-select v-model="row.unit" placeholder="单位">
                <el-option label="件" value="件" />
                <el-option label="箱" value="箱" />
                <el-option label="包" value="包" />
                <el-option label="个" value="个" />
                <el-option label="kg" value="kg" />
                <el-option label="吨" value="吨" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="weight" label="单重(kg)" width="120">
            <template #default="{ row }">
              <el-input
                v-model.number="row.weight"
                placeholder="重量"
                @change="calculateTotal"
              />
            </template>
          </el-table-column>
          <el-table-column prop="length" label="长(cm)" width="100">
            <template #default="{ row }">
              <el-input
                v-model.number="row.length"
                placeholder="长"
                @change="calculateTotal"
              />
            </template>
          </el-table-column>
          <el-table-column prop="width" label="宽(cm)" width="100">
            <template #default="{ row }">
              <el-input
                v-model.number="row.width"
                placeholder="宽"
                @change="calculateTotal"
              />
            </template>
          </el-table-column>
          <el-table-column prop="height" label="高(cm)" width="100">
            <template #default="{ row }">
              <el-input
                v-model.number="row.height"
                placeholder="高"
                @change="calculateTotal"
              />
            </template>
          </el-table-column>
          <el-table-column prop="volume" label="体积(m³)" width="120">
            <template #default="{ row }">
              <el-input v-model="row.volume" disabled />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row, $index }">
              <el-button
                type="danger"
                size="small"
                @click="deleteItem($index)"
                :disabled="itemList.length <= 1"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="total-info">
          <el-descriptions :column="4" border>
            <el-descriptions-item label="总数量">{{ totalQuantity }}</el-descriptions-item>
            <el-descriptions-item label="总重量(kg)">{{ totalWeight.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="总体积(m³)">{{ totalVolume.toFixed(4) }}</el-descriptions-item>
            <el-descriptions-item label="计费重量(kg)">{{ chargeWeight.toFixed(2) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      
      <!-- 第三步：费用明细 -->
      <div v-if="activeStep === 2" class="step-content">
        <el-card shadow="never" class="rate-info-card">
          <template #header>
            <div class="sub-header">
              <span>费率信息</span>
            </div>
          </template>
          
          <el-form
            ref="rateFormRef"
            :model="rateForm"
            label-width="120px"
            class="rate-form"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="基础运价" prop="baseRate">
                  <el-input
                    v-model.number="rateForm.baseRate"
                    placeholder="请输入基础运价"
                    prefix-icon="el-icon-money"
                  >
                    <template #append>元/{{ unitLabel }}</template>
                  </el-input>
                </el-form-item>
                
                <el-form-item label="首重" prop="firstWeight" v-if="showFirstWeight">
                  <el-input-number
                    v-model="rateForm.firstWeight"
                    :min="0.1"
                    :step="0.1"
                    style="width: 100%"
                  >
                    <template #append>kg</template>
                  </el-input-number>
                </el-form-item>
                
                <el-form-item label="首重价格" prop="firstWeightPrice" v-if="showFirstWeight">
                  <el-input
                    v-model.number="rateForm.firstWeightPrice"
                    placeholder="请输入首重价格"
                    prefix-icon="el-icon-money"
                  >
                    <template #append>元</template>
                  </el-input>
                </el-form-item>
              </el-col>
              
              <el-col :span="12">
                <el-form-item label="续重" prop="additionalWeight" v-if="showAdditionalWeight">
                  <el-input-number
                    v-model="rateForm.additionalWeight"
                    :min="0.1"
                    :step="0.1"
                    style="width: 100%"
                  >
                    <template #append>kg</template>
                  </el-input-number>
                </el-form-item>
                
                <el-form-item label="续重价格" prop="additionalWeightPrice" v-if="showAdditionalWeight">
                  <el-input
                    v-model.number="rateForm.additionalWeightPrice"
                    placeholder="请输入续重价格"
                    prefix-icon="el-icon-money"
                  >
                    <template #append>元/{{ rateForm.additionalWeight || 1 }}kg</template>
                  </el-input>
                </el-form-item>
                
                <el-form-item label="燃油附加费" prop="fuelSurcharge">
                  <el-input-number
                    v-model="rateForm.fuelSurcharge"
                    :min="0"
                    :step="0.1"
                    style="width: 100%"
                  >
                    <template #append>%</template>
                  </el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
            
            <div class="other-charges">
              <h3>其他费用</h3>
              <el-checkbox-group v-model="selectedCharges">
                <el-checkbox value="insurance" label="保险费">
                  <el-input
                    v-model.number="chargeDetails.insurance"
                    placeholder="保险费率"
                    style="width: 120px; margin-left: 10px"
                  >
                    <template #append>%</template>
                  </el-input>
                </el-checkbox>
                <el-checkbox value="pickup" label="上门取件费">
                  <el-input
                    v-model.number="chargeDetails.pickup"
                    placeholder="取件费用"
                    style="width: 120px; margin-left: 10px"
                  >
                    <template #append>元</template>
                  </el-input>
                </el-checkbox>
                <el-checkbox value="delivery" label="派送费">
                  <el-input
                    v-model.number="chargeDetails.delivery"
                    placeholder="派送费用"
                    style="width: 120px; margin-left: 10px"
                  >
                    <template #append>元</template>
                  </el-input>
                </el-checkbox>
                <el-checkbox value="packaging" label="包装费">
                  <el-input
                    v-model.number="chargeDetails.packaging"
                    placeholder="包装费用"
                    style="width: 120px; margin-left: 10px"
                  >
                    <template #append>元</template>
                  </el-input>
                </el-checkbox>
                <el-checkbox value="urgent" label="加急费">
                  <el-input
                    v-model.number="chargeDetails.urgent"
                    placeholder="加急费率"
                    style="width: 120px; margin-left: 10px"
                  >
                    <template #append>%</template>
                  </el-input>
                </el-checkbox>
                <el-checkbox value="remote" label="偏远费">
                  <el-input
                    v-model.number="chargeDetails.remote"
                    placeholder="偏远费用"
                    style="width: 120px; margin-left: 10px"
                  >
                    <template #append>元</template>
                  </el-input>
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </el-form>
        </el-card>
        
        <div class="save-rate-section">
          <el-checkbox v-model="saveRate">保存当前费率设置为常用</el-checkbox>
          <el-input
            v-if="saveRate"
            v-model="rateName"
            placeholder="请输入费率名称"
            style="width: 300px; margin-left: 20px"
          />
        </div>
      </div>
      
      <!-- 第四步：计算结果 -->
      <div v-if="activeStep === 3" class="step-content">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="never" class="result-card">
              <template #header>
                <div class="sub-header">
                  <span>费用明细</span>
                </div>
              </template>
              
              <el-table
                :data="costBreakdown"
                style="width: 100%"
                border
              >
                <el-table-column prop="name" label="费用类型" width="100" />
                <el-table-column prop="value" label="金额(元)" width="100" align="right" />
              </el-table>
              
              <div class="total-amount">
                <span>总计：</span>
                <span class="amount">{{ totalAmount.toFixed(2) }} 元</span>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="16">
            <el-card shadow="never" class="summary-card">
              <template #header>
                <div class="sub-header">
                  <span>计算摘要</span>
                </div>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item label="发货方式">{{ getShippingMethodLabel() }}</el-descriptions-item>
                <el-descriptions-item label="物流公司">{{ getLogisticsCompanyLabel() }}</el-descriptions-item>
                <el-descriptions-item label="运输路线">{{ basicForm.routeType }}</el-descriptions-item>
                <el-descriptions-item label="发货地">{{ formatAddress(basicForm.originAddress) }}</el-descriptions-item>
                <el-descriptions-item label="目的地">{{ formatAddress(basicForm.destinationAddress) }}</el-descriptions-item>
                <el-descriptions-item label="预计发货日期">{{ basicForm.estimatedDate }}</el-descriptions-item>
                <el-descriptions-item label="计费重量">{{ chargeWeight.toFixed(2) }} kg</el-descriptions-item>
                <el-descriptions-item label="是否加急">{{ basicForm.isUrgent ? '是' : '否' }}</el-descriptions-item>
              </el-descriptions>
              
              <div class="calculation-notes">
                <h3>计算说明：</h3>
                <ul>
                  <li v-for="(note, index) in calculationNotes" :key="index">{{ note }}</li>
                </ul>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <div class="step-actions">
        <el-button
          v-if="activeStep > 0"
          @click="prevStep"
        >
          <el-icon><ArrowLeft /></el-icon>
          上一步
        </el-button>
        <el-button
          v-if="activeStep < 3"
          type="primary"
          @click="nextStep"
        >
          下一步
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button
          v-if="activeStep === 3"
          type="success"
          @click="resetCalculator"
        >
          <el-icon><Refresh /></el-icon>
          重新计算
        </el-button>
        <el-button
          v-if="activeStep === 3"
          type="primary"
          @click="exportResult"
        >
          <el-icon><Download /></el-icon>
          导出结果
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Calculator,
  Plus,
  Delete,
  ArrowLeft,
  ArrowRight,
  Refresh,
  Download
} from '@element-plus/icons-vue';

export default {
  name: 'ShippingCalculator',
  components: {
    Calculator,
    Plus,
    Delete,
    ArrowLeft,
    ArrowRight,
    Refresh,
    Download
  },
  emits: ['calculate-complete'],
  setup(props, { emit }) {
    // 状态管理
    const activeStep = ref(0);
    const loading = ref(false);
    const saveRate = ref(false);
    const rateName = ref('');
    
    // 基础信息表单
    const basicForm = reactive({
      shippingMethod: '',
      logisticsCompany: '',
      routeType: '省内',
      originAddress: [],
      destinationAddress: [],
      estimatedDate: '',
      isUrgent: false,
      insuredAmount: 0
    });
    
    // 基础信息表单验证规则
    const basicRules = {
      shippingMethod: [
        { required: true, message: '请选择发货方式', trigger: 'blur' }
      ],
      logisticsCompany: [
        {
          required: () => basicForm.shippingMethod !== 'SELF_PICKUP',
          message: '请选择物流公司',
          trigger: 'blur'
        }
      ],
      routeType: [
        { required: true, message: '请选择运输路线', trigger: 'blur' }
      ],
      originAddress: [
        {
          required: true,
          message: '请选择发货地',
          trigger: 'change',
          validator: (rule, value, callback) => {
            if (value && value.length >= 2) {
              callback();
            } else {
              callback(new Error('请选择完整的发货地'));
            }
          }
        }
      ],
      destinationAddress: [
        {
          required: true,
          message: '请选择目的地',
          trigger: 'change',
          validator: (rule, value, callback) => {
            if (value && value.length >= 2) {
              callback();
            } else {
              callback(new Error('请选择完整的目的地'));
            }
          }
        }
      ],
      estimatedDate: [
        { required: true, message: '请选择预计发货日期', trigger: 'blur' }
      ]
    };
    
    // 费率表单
    const rateForm = reactive({
      baseRate: 0,
      firstWeight: 1,
      firstWeightPrice: 0,
      additionalWeight: 0.5,
      additionalWeightPrice: 0,
      fuelSurcharge: 0
    });
    
    // 额外费用
    const selectedCharges = ref([]);
    const chargeDetails = reactive({
      insurance: 0.5,
      pickup: 0,
      delivery: 0,
      packaging: 0,
      urgent: 20,
      remote: 0
    });
    
    // 物流公司选项
    const logisticsCompanies = [
      { label: '顺丰速运', value: 'SF' },
      { label: '中通快递', value: 'ZT' },
      { label: '圆通速递', value: 'YT' },
      { label: '韵达快递', value: 'YD' },
      { label: '申通快递', value: 'STO' },
      { label: '百世快递', value: 'HTKY' },
      { label: '德邦物流', value: 'DEPPON' },
      { label: '京东物流', value: 'JD' },
      { label: 'EMS', value: 'EMS' }
    ];
    
    // 地址选项（模拟）
    const addressOptions = [
      {
        name: '北京市',
        code: '110000',
        children: [
          { name: '北京市', code: '110100' }
        ]
      },
      {
        name: '上海市',
        code: '310000',
        children: [
          { name: '上海市', code: '310100' }
        ]
      },
      {
        name: '广东省',
        code: '440000',
        children: [
          { name: '广州市', code: '440100' },
          { name: '深圳市', code: '440300' },
          { name: '东莞市', code: '441900' }
        ]
      },
      {
        name: '江苏省',
        code: '320000',
        children: [
          { name: '南京市', code: '320100' },
          { name: '苏州市', code: '320500' },
          { name: '无锡市', code: '320200' }
        ]
      },
      {
        name: '浙江省',
        code: '330000',
        children: [
          { name: '杭州市', code: '330100' },
          { name: '宁波市', code: '330200' }
        ]
      }
    ];
    
    // 物品列表
    const itemList = ref([
      {
        id: 1,
        productName: '',
        quantity: 1,
        unit: '件',
        weight: 0,
        length: 0,
        width: 0,
        height: 0,
        volume: 0
      }
    ]);
    
    // 计算属性
    const showLogisticsCompany = computed(() => {
      return basicForm.shippingMethod !== 'SELF_PICKUP';
    });
    
    const showInsurance = computed(() => {
      return basicForm.shippingMethod !== 'SELF_PICKUP';
    });
    
    const showFirstWeight = computed(() => {
      return basicForm.shippingMethod === 'EXPRESS' || basicForm.shippingMethod === 'AIR';
    });
    
    const showAdditionalWeight = computed(() => {
      return basicForm.shippingMethod === 'EXPRESS' || basicForm.shippingMethod === 'AIR';
    });
    
    const unitLabel = computed(() => {
      if (basicForm.shippingMethod === 'EXPRESS' || basicForm.shippingMethod === 'AIR') {
        return 'kg';
      }
      return basicForm.shippingMethod === 'LOGISTICS' ? 'm³' : '';
    });
    
    const totalQuantity = computed(() => {
      return itemList.value.reduce((total, item) => total + (item.quantity || 0), 0);
    });
    
    const totalWeight = computed(() => {
      return itemList.value.reduce((total, item) => {
        return total + (item.weight || 0) * (item.quantity || 0);
      }, 0);
    });
    
    const totalVolume = computed(() => {
      return itemList.value.reduce((total, item) => {
        const volume = (item.length || 0) * (item.width || 0) * (item.height || 0) / 1000000;
        return total + volume * (item.quantity || 0);
      }, 0);
    });
    
    // 计费重量（取实际重量和体积重量的最大值）
    const chargeWeight = computed(() => {
      // 体积重量计算公式：体积(m³) * 167 kg/m³
      const volumeWeight = totalVolume.value * 167;
      return Math.max(totalWeight.value, volumeWeight);
    });
    
    // 费用明细
    const costBreakdown = computed(() => {
      const breakdown = [];
      let baseCost = 0;
      
      // 计算基础运费
      if (basicForm.shippingMethod === 'EXPRESS' || basicForm.shippingMethod === 'AIR') {
        // 快递/空运计费逻辑
        if (chargeWeight.value <= rateForm.firstWeight) {
          baseCost = rateForm.firstWeightPrice;
        } else {
          const additionalWeight = chargeWeight.value - rateForm.firstWeight;
          const additionalUnits = Math.ceil(additionalWeight / rateForm.additionalWeight);
          baseCost = rateForm.firstWeightPrice + additionalUnits * rateForm.additionalWeightPrice;
        }
      } else if (basicForm.shippingMethod === 'LOGISTICS') {
        // 物流计费逻辑
        baseCost = rateForm.baseRate * totalVolume.value;
      } else if (basicForm.shippingMethod === 'SELF_PICKUP') {
        // 自提费用
        baseCost = 0;
      }
      
      breakdown.push({ name: '基础运费', value: baseCost.toFixed(2) });
      
      // 燃油附加费
      if (rateForm.fuelSurcharge > 0) {
        const fuelCost = baseCost * (rateForm.fuelSurcharge / 100);
        breakdown.push({ name: '燃油附加费', value: fuelCost.toFixed(2) });
      }
      
      // 保险费
      if (selectedCharges.value.includes('insurance') && basicForm.insuredAmount > 0) {
        const insuranceCost = basicForm.insuredAmount * (chargeDetails.insurance / 100);
        breakdown.push({ name: '保险费', value: insuranceCost.toFixed(2) });
      }
      
      // 上门取件费
      if (selectedCharges.value.includes('pickup') && chargeDetails.pickup > 0) {
        breakdown.push({ name: '上门取件费', value: chargeDetails.pickup.toFixed(2) });
      }
      
      // 派送费
      if (selectedCharges.value.includes('delivery') && chargeDetails.delivery > 0) {
        breakdown.push({ name: '派送费', value: chargeDetails.delivery.toFixed(2) });
      }
      
      // 包装费
      if (selectedCharges.value.includes('packaging') && chargeDetails.packaging > 0) {
        breakdown.push({ name: '包装费', value: chargeDetails.packaging.toFixed(2) });
      }
      
      // 加急费
      if (selectedCharges.value.includes('urgent') && basicForm.isUrgent && chargeDetails.urgent > 0) {
        const urgentCost = baseCost * (chargeDetails.urgent / 100);
        breakdown.push({ name: '加急费', value: urgentCost.toFixed(2) });
      }
      
      // 偏远费
      if (selectedCharges.value.includes('remote') && chargeDetails.remote > 0) {
        breakdown.push({ name: '偏远费', value: chargeDetails.remote.toFixed(2) });
      }
      
      return breakdown;
    });
    
    // 总费用
    const totalAmount = computed(() => {
      return costBreakdown.value.reduce((total, item) => {
        return total + parseFloat(item.value);
      }, 0);
    });
    
    // 计算说明
    const calculationNotes = computed(() => {
      const notes = [];
      notes.push(`计费重量取实际重量(${totalWeight.value.toFixed(2)}kg)和体积重量(${totalVolume.value.toFixed(4)}m³ × 167kg/m³ = ${(totalVolume.value * 167).toFixed(2)}kg)的较大值`);
      
      if (basicForm.shippingMethod === 'EXPRESS' || basicForm.shippingMethod === 'AIR') {
        if (chargeWeight.value <= rateForm.firstWeight) {
          notes.push(`首重(${rateForm.firstWeight}kg)内，按首重价格计算`);
        } else {
          const additionalWeight = chargeWeight.value - rateForm.firstWeight;
          const additionalUnits = Math.ceil(additionalWeight / rateForm.additionalWeight);
          notes.push(`超过首重部分，按照续重(${rateForm.additionalWeight}kg)的整数倍收费，共${additionalUnits}个续重单位`);
        }
      }
      
      if (rateForm.fuelSurcharge > 0) {
        notes.push(`燃油附加费按基础运费的${rateForm.fuelSurcharge}%计算`);
      }
      
      if (basicForm.isUrgent && selectedCharges.value.includes('urgent') && chargeDetails.urgent > 0) {
        notes.push(`加急费按基础运费的${chargeDetails.urgent}%计算`);
      }
      
      return notes;
    });
    
    // 方法
    const addItem = () => {
      const newId = Math.max(...itemList.value.map(item => item.id), 0) + 1;
      itemList.value.push({
        id: newId,
        productName: '',
        quantity: 1,
        unit: '件',
        weight: 0,
        length: 0,
        width: 0,
        height: 0,
        volume: 0
      });
    };
    
    const deleteItem = (index) => {
      if (itemList.value.length > 1) {
        itemList.value.splice(index, 1);
        calculateTotal();
      } else {
        ElMessage.warning('至少保留一个物品');
      }
    };
    
    const calculateTotal = () => {
      // 更新每个物品的体积
      itemList.value.forEach(item => {
        item.volume = ((item.length || 0) * (item.width || 0) * (item.height || 0) / 1000000).toFixed(4);
      });
    };
    
    const updateMethod = () => {
      // 清空物流公司并设置默认费率
      basicForm.logisticsCompany = '';
      
      // 根据发货方式设置默认费率
      if (basicForm.shippingMethod === 'EXPRESS') {
        rateForm.baseRate = 0;
        rateForm.firstWeight = 1;
        rateForm.firstWeightPrice = 12;
        rateForm.additionalWeight = 0.5;
        rateForm.additionalWeightPrice = 2;
        rateForm.fuelSurcharge = 5;
      } else if (basicForm.shippingMethod === 'LOGISTICS') {
        rateForm.baseRate = 100;
        rateForm.firstWeight = 0;
        rateForm.firstWeightPrice = 0;
        rateForm.additionalWeight = 0;
        rateForm.additionalWeightPrice = 0;
        rateForm.fuelSurcharge = 10;
      } else if (basicForm.shippingMethod === 'AIR') {
        rateForm.baseRate = 0;
        rateForm.firstWeight = 1;
        rateForm.firstWeightPrice = 20;
        rateForm.additionalWeight = 0.5;
        rateForm.additionalWeightPrice = 5;
        rateForm.fuelSurcharge = 15;
      } else if (basicForm.shippingMethod === 'SELF_PICKUP') {
        rateForm.baseRate = 0;
        rateForm.firstWeight = 0;
        rateForm.firstWeightPrice = 0;
        rateForm.additionalWeight = 0;
        rateForm.additionalWeightPrice = 0;
        rateForm.fuelSurcharge = 0;
      }
    };
    
    const updateLogistics = () => {
      // 根据选择的物流公司调整费率
      if (basicForm.logisticsCompany === 'SF') {
        // 顺丰费率略高
        if (basicForm.shippingMethod === 'EXPRESS') {
          rateForm.firstWeightPrice = 18;
          rateForm.additionalWeightPrice = 5;
        }
      } else if (basicForm.logisticsCompany === 'JD') {
        // 京东物流费率
        if (basicForm.shippingMethod === 'EXPRESS') {
          rateForm.firstWeightPrice = 15;
          rateForm.additionalWeightPrice = 3;
        }
      }
    };
    
    const getShippingMethodLabel = () => {
      const methodMap = {
        EXPRESS: '快递',
        LOGISTICS: '物流',
        SELF_PICKUP: '自提',
        AIR: '空运'
      };
      return methodMap[basicForm.shippingMethod] || basicForm.shippingMethod;
    };
    
    const getLogisticsCompanyLabel = () => {
      const companyMap = logisticsCompanies.reduce((map, company) => {
        map[company.value] = company.label;
        return map;
      }, {});
      return companyMap[basicForm.logisticsCompany] || (basicForm.shippingMethod === 'SELF_PICKUP' ? '无需' : '未选择');
    };
    
    const formatAddress = (addressCode) => {
      if (!addressCode || addressCode.length === 0) return '-';
      
      // 简化版地址格式化，实际项目中应该有完整的地址库
      const province = addressOptions.find(prov => prov.code === addressCode[0]);
      if (!province) return '-';
      
      if (addressCode.length > 1) {
        const city = province.children.find(c => c.code === addressCode[1]);
        return city ? `${province.name} ${city.name}` : province.name;
      }
      
      return province.name;
    };
    
    const prevStep = () => {
      activeStep.value--;
    };
    
    const nextStep = () => {
      // 验证当前步骤
      if (activeStep.value === 0) {
        // 验证基础信息表单
        const basicFormRef = document.querySelector('.basic-form');
        if (!basicFormRef) {
          ElMessage.warning('请填写完整的基础信息');
          return;
        }
        
        // 手动验证
        if (!basicForm.shippingMethod) {
          ElMessage.warning('请选择发货方式');
          return;
        }
        
        if (basicForm.shippingMethod !== 'SELF_PICKUP' && !basicForm.logisticsCompany) {
          ElMessage.warning('请选择物流公司');
          return;
        }
        
        if (!basicForm.routeType) {
          ElMessage.warning('请选择运输路线');
          return;
        }
        
        if (!basicForm.originAddress || basicForm.originAddress.length < 2) {
          ElMessage.warning('请选择完整的发货地');
          return;
        }
        
        if (!basicForm.destinationAddress || basicForm.destinationAddress.length < 2) {
          ElMessage.warning('请选择完整的目的地');
          return;
        }
        
        if (!basicForm.estimatedDate) {
          ElMessage.warning('请选择预计发货日期');
          return;
        }
      } else if (activeStep.value === 1) {
        // 验证物品明细
        let isValid = true;
        let emptyItems = 0;
        
        itemList.value.forEach(item => {
          if (!item.productName || !item.weight || !item.length || !item.width || !item.height) {
            emptyItems++;
          }
        });
        
        if (emptyItems === itemList.value.length) {
          ElMessage.warning('请填写至少一个物品的详细信息');
          isValid = false;
        }
        
        if (!isValid) {
          return;
        }
        
        // 确保所有物品的体积已计算
        calculateTotal();
      } else if (activeStep.value === 2) {
        // 验证费率信息
        if (basicForm.shippingMethod !== 'SELF_PICKUP') {
          if ((basicForm.shippingMethod === 'EXPRESS' || basicForm.shippingMethod === 'AIR') && !rateForm.firstWeightPrice) {
            ElMessage.warning('请设置首重价格');
            return;
          } else if (basicForm.shippingMethod === 'LOGISTICS' && !rateForm.baseRate) {
            ElMessage.warning('请设置基础运价');
            return;
          }
        }
        
        // 如果选择保存费率
        if (saveRate.value && !rateName.value) {
          ElMessage.warning('请输入费率名称');
          return;
        }
        
        if (saveRate.value) {
          // 保存常用费率（模拟）
          ElMessage.success('费率已保存');
        }
      }
      
      // 前进到下一步
      activeStep.value++;
      
      // 如果是最后一步，发出完成事件
      if (activeStep.value === 3) {
        emit('calculate-complete', {
          basicInfo: { ...basicForm },
          itemList: [...itemList.value],
          totalWeight: totalWeight.value,
          totalVolume: totalVolume.value,
          chargeWeight: chargeWeight.value,
          costBreakdown: [...costBreakdown.value],
          totalAmount: totalAmount.value
        });
      }
    };
    
    const resetCalculator = () => {
      activeStep.value = 0;
      
      // 重置基础表单
      Object.assign(basicForm, {
        shippingMethod: '',
        logisticsCompany: '',
        routeType: '省内',
        originAddress: [],
        destinationAddress: [],
        estimatedDate: '',
        isUrgent: false,
        insuredAmount: 0
      });
      
      // 重置物品列表
      itemList.value = [
        {
          id: 1,
          productName: '',
          quantity: 1,
          unit: '件',
          weight: 0,
          length: 0,
          width: 0,
          height: 0,
          volume: 0
        }
      ];
      
      // 重置费率表单
      Object.assign(rateForm, {
        baseRate: 0,
        firstWeight: 1,
        firstWeightPrice: 0,
        additionalWeight: 0.5,
        additionalWeightPrice: 0,
        fuelSurcharge: 0
      });
      
      // 重置其他费用
      selectedCharges.value = [];
      Object.assign(chargeDetails, {
        insurance: 0.5,
        pickup: 0,
        delivery: 0,
        packaging: 0,
        urgent: 20,
        remote: 0
      });
      
      saveRate.value = false;
      rateName.value = '';
    };
    
    const exportResult = () => {
      ElMessage.info('导出功能开发中');
      
      // 构建导出数据
      const exportData = {
        calculationSummary: {
          shippingMethod: getShippingMethodLabel(),
          logisticsCompany: getLogisticsCompanyLabel(),
          routeType: basicForm.routeType,
          originAddress: formatAddress(basicForm.originAddress),
          destinationAddress: formatAddress(basicForm.destinationAddress),
          estimatedDate: basicForm.estimatedDate,
          chargeWeight: chargeWeight.value.toFixed(2) + ' kg',
          isUrgent: basicForm.isUrgent ? '是' : '否'
        },
        itemDetails: itemList.value,
        costBreakdown: costBreakdown.value,
        totalAmount: totalAmount.value.toFixed(2) + ' 元',
        calculationNotes: calculationNotes.value
      };
      
      console.log('导出数据:', exportData);
    };
    
    // 初始化
    onMounted(() => {
      // 设置默认发货方式和费率
      basicForm.shippingMethod = 'EXPRESS';
      updateMethod();
    });
    
    return {
      activeStep,
      loading,
      saveRate,
      rateName,
      basicForm,
      basicRules,
      rateForm,
      selectedCharges,
      chargeDetails,
      logisticsCompanies,
      addressOptions,
      itemList,
      showLogisticsCompany,
      showInsurance,
      showFirstWeight,
      showAdditionalWeight,
      unitLabel,
      totalQuantity,
      totalWeight,
      totalVolume,
      chargeWeight,
      costBreakdown,
      totalAmount,
      calculationNotes,
      addItem,
      deleteItem,
      calculateTotal,
      updateMethod,
      updateLogistics,
      getShippingMethodLabel,
      getLogisticsCompanyLabel,
      formatAddress,
      prevStep,
      nextStep,
      resetCalculator,
      exportResult
    };
  }
};
</script>

<style scoped>
.shipping-calculator {
  width: 100%;
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 500;
}

.step-content {
  padding: 20px 0;
}

.basic-form {
  margin-top: 20px;
}

.add-item-btn {
  margin-bottom: 15px;
}

.item-table {
  margin-bottom: 20px;
}

.total-info {
  margin-top: 20px;
}

.rate-info-card {
  margin-bottom: 20px;
}

.sub-header {
  font-size: 14px;
  font-weight: 500;
}

.rate-form {
  margin-top: 15px;
}

.other-charges {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.other-charges h3 {
  margin-bottom: 15px;
  font-size: 14px;
  font-weight: 500;
}

.other-charges .el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.other-charges .el-checkbox {
  margin-right: 0;
}

.save-rate-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.result-card,
.summary-card {
  height: 100%;
}

.total-amount {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 16px;
}

.total-amount .amount {
  font-size: 20px;
  font-weight: 600;
  color: #f56c6c;
  margin-left: 10px;
}

.calculation-notes {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.calculation-notes h3 {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
}

.calculation-notes ul {
  padding-left: 20px;
  color: #606266;
}

.calculation-notes li {
  margin-bottom: 5px;
  line-height: 1.5;
}

.step-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
  gap: 20px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .el-steps {
    padding: 0 20px;
  }
  
  .basic-form,
  .rate-form {
    padding: 0 20px;
  }
  
  .other-charges .el-checkbox-group {
    flex-direction: column;
    gap: 15px;
  }
  
  .save-rate-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .save-rate-section .el-input {
    margin-left: 0 !important;
    width: 100% !important;
  }
  
  .step-actions {
    flex-direction: column;
    padding: 0 20px;
  }
}
</style>