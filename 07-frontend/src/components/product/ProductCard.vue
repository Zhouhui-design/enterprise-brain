<template>
  <div class="product-card" :class="{ selected: isSelected }">
    <div class="product-image">
      <el-image
        :src="product.imageUrl || defaultImage"
        :alt="product.name"
        fit="cover"
        class="image"
      >
        <template #error>
          <div class="image-error">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-image>
      
      <!-- 产品状态标签 -->
      <div class="product-badges">
        <el-tag v-if="product.isHot" type="danger" size="small">热销</el-tag>
        <el-tag v-if="product.isNew" type="success" size="small">新品</el-tag>
        <el-tag v-if="!product.isActive" type="info" size="small">停售</el-tag>
      </div>
    </div>

    <div class="product-info">
      <h3 class="product-name" :title="product.name">
        {{ product.name }}
      </h3>
      
      <div class="product-meta">
        <span class="price">¥{{ formatPrice(product.price) }}</span>
        <span class="stock" :class="getStockClass(product.stock)">
          库存: {{ product.stock }}
        </span>
      </div>

      <div class="product-details">
        <span class="category">{{ product.categoryName }}</span>
        <span class="unit">{{ product.unit }}</span>
      </div>

      <div class="product-actions">
        <el-button
          size="small"
          @click="$emit('detail', product)"
        >
          详情
        </el-button>
        <el-button
          type="primary"
          size="small"
          @click="$emit('select', product)"
          :disabled="!isAvailable"
        >
          {{ isSelected ? '已选择' : '选择' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { Picture } from '@element-plus/icons-vue'

export default {
  name: 'ProductCard',
  components: {
    Picture
  },
  props: {
    product: {
      type: Object,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    defaultImage: {
      type: String,
      default: '/images/default-product.png'
    }
  },
  emits: ['select', 'detail'],
  setup(props) {
    const isAvailable = computed(() => {
      return props.product.isActive && props.product.stock > 0
    })

    const formatPrice = (price) => {
      return price?.toFixed(2) || '0.00'
    }

    const getStockClass = (stock) => {
      if (stock === 0) return 'out-of-stock'
      if (stock < 10) return 'low-stock'
      return 'in-stock'
    }

    return {
      isAvailable,
      formatPrice,
      getStockClass
    }
  }
}
</script>

<style lang="scss" scoped>
.product-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.selected {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }

  .product-image {
    position: relative;
    height: 200px;
    background: #f5f7fa;

    .image {
      width: 100%;
      height: 100%;
    }

    .image-error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #c0c4cc;
      font-size: 40px;
    }

    .product-badges {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
  }

  .product-info {
    padding: 12px;

    .product-name {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
      height: 44px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .product-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .price {
        font-size: 18px;
        font-weight: 700;
        color: #e6a23c;
      }

      .stock {
        font-size: 12px;
        
        &.in-stock {
          color: #67c23a;
        }
        
        &.low-stock {
          color: #e6a23c;
        }
        
        &.out-of-stock {
          color: #f56c6c;
        }
      }
    }

    .product-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 12px;
      color: #909399;

      .category {
        background: #f0f2f5;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }

    .product-actions {
      display: flex;
      gap: 8px;
    }
  }
}
</style>