<template>
  <div class="product-manual-view">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="产品编号">{{ productData?.productCode }}</el-descriptions-item>
      <el-descriptions-item label="产品名称">{{ productData?.productName }}</el-descriptions-item>
      <el-descriptions-item label="产品分类">{{ productData?.category }}</el-descriptions-item>
      <el-descriptions-item label="产品子类">{{ productData?.subCategory }}</el-descriptions-item>
      <el-descriptions-item label="规格型号">{{ productData?.specification }}</el-descriptions-item>
      <el-descriptions-item label="单位">{{ productData?.unit }}</el-descriptions-item>
      <el-descriptions-item label="产品状态">
        <el-tag v-if="productData?.status === '在售'" type="success">在售</el-tag>
        <el-tag v-else-if="productData?.status === '停产'" type="danger">停产</el-tag>
        <el-tag v-else-if="productData?.status === '研发中'" type="warning">研发中</el-tag>
        <el-tag v-else>{{ productData?.status }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="主要材质">{{ productData?.material }}</el-descriptions-item>
      <el-descriptions-item label="颜色">{{ productData?.color }}</el-descriptions-item>
      <el-descriptions-item label="重量">{{ productData?.weight }} kg</el-descriptions-item>
      <el-descriptions-item label="尺寸">{{ productData?.size }}</el-descriptions-item>
      <el-descriptions-item label="销售单价">¥{{ productData?.salePrice?.toFixed(2) }}</el-descriptions-item>
      <el-descriptions-item label="成本单价">¥{{ productData?.costPrice?.toFixed(2) }}</el-descriptions-item>
      <el-descriptions-item label="当前库存">{{ productData?.stock }}</el-descriptions-item>
      <el-descriptions-item label="最小库存">{{ productData?.minStock }}</el-descriptions-item>
      <el-descriptions-item label="生产周期">{{ productData?.leadTime }} 天</el-descriptions-item>
      <el-descriptions-item label="主供应商">{{ productData?.supplier }}</el-descriptions-item>
      <el-descriptions-item label="质量标准">{{ productData?.qualityStandard }}</el-descriptions-item>
      <el-descriptions-item label="认证证书">{{ productData?.certification }}</el-descriptions-item>
      <el-descriptions-item label="产品经理">{{ productData?.productManager }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ productData?.createTime }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ productData?.updateTime }}</el-descriptions-item>
      <el-descriptions-item label="产品图片" :span="2">
        <el-image 
          v-if="productData?.productImage"
          :src="productData?.productImage" 
          :preview-src-list="[productData?.productImage]"
          style="width: 200px; height: 200px;"
          fit="cover"
        />
        <span v-else style="color: #909399;">无图片</span>
      </el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">
        {{ productData?.remark || '无' }}
      </el-descriptions-item>
    </el-descriptions>

    <div class="footer-buttons">
      <el-button type="primary" @click="handleClose">关闭</el-button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  productData: {
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
.product-manual-view {
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
