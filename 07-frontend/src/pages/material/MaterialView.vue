<template>
  <div class="material-view">
    <el-tabs type="border-card">
      <el-tab-pane label="基础属性">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="物料编码">{{ materialData?.materialCode }}</el-descriptions-item>
          <el-descriptions-item label="BOM编号">{{ materialData?.bomNumber }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ materialData?.materialName }}</el-descriptions-item>
          <el-descriptions-item label="尺寸规格">{{ materialData?.sizeSpec }}</el-descriptions-item>
          <el-descriptions-item label="颜色">{{ materialData?.color }}</el-descriptions-item>
          <el-descriptions-item label="材质">{{ materialData?.material }}</el-descriptions-item>
          <el-descriptions-item label="大类">{{ materialData?.majorCategory }}</el-descriptions-item>
          <el-descriptions-item label="中类">{{ materialData?.middleCategory }}</el-descriptions-item>
          <el-descriptions-item label="小类">{{ materialData?.minorCategory }}</el-descriptions-item>
          <el-descriptions-item label="型号">{{ materialData?.model }}</el-descriptions-item>
          <el-descriptions-item label="系列">{{ materialData?.series }}</el-descriptions-item>
          <el-descriptions-item label="来源">
            <span v-if="materialData?.source && materialData.source.length > 0">
              <el-tag 
                v-for="(item, index) in materialData.source" 
                :key="index" 
                size="small" 
                style="margin-right: 5px;"
              >
                {{ item }}
              </el-tag>
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="基础单位">{{ materialData?.baseUnit }}</el-descriptions-item>
          <el-descriptions-item label="物料图片" :span="2">
            <el-image 
              v-if="materialData?.materialImage" 
              :src="materialData.materialImage" 
              :preview-src-list="[materialData.materialImage]"
              :preview-teleported="true"
              style="width: 100px; height: 100px;"
              fit="cover"
            />
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="物料详述" :span="2">{{ materialData?.description || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="销售属性">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="销售单位">{{ materialData?.saleUnit || '-' }}</el-descriptions-item>
          <el-descriptions-item label="销售转化率">{{ materialData?.saleConversionRate || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="生产属性">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="产出工序名称">{{ materialData?.processName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="定时工额">{{ materialData?.standardTime }}</el-descriptions-item>
          <el-descriptions-item label="定额工时">{{ materialData?.quotaTime }}</el-descriptions-item>
          <el-descriptions-item label="工序单价">¥{{ materialData?.processPrice?.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="kg/pcs">{{ materialData?.kgPerPcs }}</el-descriptions-item>
          <el-descriptions-item label="pcs/kg">{{ materialData?.pcsPerKg }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="采购属性">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="采购单位">{{ materialData?.purchaseUnit || '-' }}</el-descriptions-item>
          <el-descriptions-item label="采购转化率">{{ materialData?.purchaseConversionRate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="采购周期">{{ materialData?.purchaseCycle || '-' }}</el-descriptions-item>
          <el-descriptions-item label="采购单价">¥{{ materialData?.purchasePrice?.toFixed(2) }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>

    <div class="footer-buttons">
      <el-button type="primary" @click="handleClose">关闭</el-button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  materialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.material-view {
  padding: 20px;
}

.footer-buttons {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dcdfe6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
