<template>
  <div class="product-selector">
    <el-card shadow="hover" class="selector-card">
      <template #header>
        <div class="card-header">
          <span>产品选择器</span>
          <el-button size="small" type="primary" @click="showProductList = true">选择产品</el-button>
        </div>
      </template>
      
      <!-- 已选产品列表 -->
      <div v-if="selectedProducts.length > 0" class="selected-products">
        <el-table :data="selectedProducts" style="width: 100%">
          <el-table-column prop="productCode" label="产品编码" />
          <el-table-column prop="productName" label="产品名称" />
          <el-table-column prop="specification" label="规格型号" />
          <el-table-column prop="unit" label="单位" />
          <el-table-column prop="quantity" label="数量" width="100">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.quantity" 
                :min="1" 
                :step="1"
                @change="updateQuantity(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="单价" width="120" />
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button 
                type="danger" 
                size="small" 
                @click="removeProduct(scope.row.productId)"
                icon="Delete"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 无产品提示 -->
      <div v-else class="no-products">
        <el-empty description="暂无已选产品" />
      </div>
      
      <!-- 产品选择弹窗 -->
      <el-dialog
        v-model="showProductList"
        title="选择产品"
        width="800px"
        @close="handleDialogClose"
      >
        <!-- 搜索筛选 -->
        <div class="search-filters">
          <el-input
            v-model="searchQuery"
            placeholder="搜索产品名称/编码"
            prefix-icon="Search"
            clearable
            class="search-input"
          />
          <el-select v-model="categoryFilter" placeholder="产品类别" clearable class="filter-select">
            <el-option 
              v-for="category in productCategories" 
              :key="category.id" 
              :label="category.name" 
              :value="category.id"
            />
          </el-select>
          <el-button type="primary" @click="searchProducts">搜索</el-button>
        </div>
        
        <!-- 产品列表 -->
        <el-table 
          :data="productListData" 
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="productCode" label="产品编码" />
          <el-table-column prop="productName" label="产品名称" />
          <el-table-column prop="specification" label="规格型号" />
          <el-table-column prop="categoryName" label="产品类别" />
          <el-table-column prop="unit" label="单位" />
          <el-table-column prop="standardPrice" label="标准单价" />
          <el-table-column prop="stockQuantity" label="库存数量" />
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalProducts"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
        
        <!-- 弹窗底部按钮 -->
        <template #footer>
          <el-button @click="showProductList = false">取消</el-button>
          <el-button type="primary" @click="confirmSelection">确认选择</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'ProductSelector',
  emits: ['productsSelected', 'productsChanged'],
  setup(props, { emit }) {
    // 响应式数据
    const selectedProducts = ref([])
    const showProductList = ref(false)
    const searchQuery = ref('')
    const categoryFilter = ref('')
    const selectedRows = ref([])
    const productListData = ref([])
    const productCategories = ref([])
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalProducts = ref(0)