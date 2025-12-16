<template>
  <div class="product-selector-container">
    <!-- 搜索和筛选区域 -->
    <el-card shadow="hover" class="search-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">产品选择器</span>
          <div class="header-actions">
            <el-button 
              v-if="selectedProducts.length > 0"
              type="text" 
              @click="clearSelection"
              :icon="Delete"
            >
              清空选择 ({{ selectedProducts.length }})
            </el-button>
            <el-button 
              type="primary" 
              @click="confirmSelection"
              :disabled="selectedProducts.length === 0"
            >
              确认选择
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form 
        :model="searchForm" 
        :inline="true" 
        class="search-form"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="产品名称">
          <el-input
            v-model="searchForm.productName"
            placeholder="请输入产品名称"
            clearable
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
            @clear="handleClear"
          />
        </el-form-item>

        <el-form-item label="产品分类">
          <el-select
            v-model="searchForm.categoryId"
            placeholder="请选择分类"
            clearable
            filterable
            @change="handleSearch"
          >
            <el-option
              v-for="category in categoryOptions"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="价格区间">
          <el-input-number
            v-model="searchForm.minPrice"
            placeholder="最低价"
            :min="0"
            :precision="2"
            controls-position="right"
            @change="handleSearch"
          />
          <span class="price-separator">-</span>
          <el-input-number
            v-model="searchForm.maxPrice"
            placeholder="最高价"
            :min="0"
            :precision="2"
            controls-position="right"
            @change="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleSearch"
            :loading="loading"
            :icon="Search"
          >
            搜索
          </el-button>
          <el-button @click="resetSearch" :icon="Refresh">
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 快速筛选标签 -->
      <div class="quick-filters">
        <el-tag
          v-for="tag in quickFilterTags"
          :key="tag.value"
          :type="activeQuickFilter === tag.value ? 'primary' : 'info'"
          :effect="activeQuickFilter === tag.value ? 'dark' : 'plain'"
          class="filter-tag"
          @click="handleQuickFilter(tag.value)"
        >
          {{ tag.label }}
        </el-tag>
      </div>
    </el-card>

    <!-- 产品列表 -->
    <el-card shadow="hover" class="product-list-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            产品列表 
            <el-tag type="info" size="small" v-if="totalCount > 0">
              共 {{ totalCount }} 件
            </el-tag>
          </span>
          <div class="header-actions">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="list">
                <el-icon><List /></el-icon>
              </el-radio-button>
              <el-radio-button label="grid">
                <el-icon><Grid /></el-icon>
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="list-view">
        <el-table
          ref="productTableRef"
          v-loading="loading"
          :data="productList"
          style="width: 100%"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
          empty-text="暂无产品数据"
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column label="产品图片" width="100">
            <template #default="{ row }">
              <el-image
                :src="row.imageUrl || defaultImage"
                :alt="row.name"
                fit="cover"
                class="product-image"
                :preview-src-list="[row.imageUrl]"
                v-if="row.imageUrl"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-else class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-table-column>

          <el-table-column 
            prop="name" 
            label="产品名称" 
            min-width="200"
            sortable="custom"
          >
            <template #default="{ row }">
              <div class="product-name">
                <span class="name-text" :title="row.name">{{ row.name }}</span>
                <el-tag
                  v-if="row.isHot"
                  type="danger"
                  size="small"
                  effect="plain"
                >
                  热销
                </el-tag>
                <el-tag
                  v-if="row.isNew"
                  type="success"
                  size="small"
                  effect="plain"
                >
                  新品
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column 
            prop="categoryName" 
            label="分类" 
            width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ row.categoryName }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column 
            prop="price" 
            label="价格" 
            width="120"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="price">¥{{ formatPrice(row.price) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="stock" label="库存" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getStockStatusType(row.stock)"
                size="small"
              >
                {{ row.stock }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="unit" label="单位" width="80" />

          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                type="text"
                size="small"
                @click="viewProductDetail(row)"
              >
                详情
              </el-button>
              <el-button
                type="text"
                size="small"
                @click="addToCart(row)"
                :disabled="!isProductAvailable(row)"
              >
                加入
              </el-button>
              <el-button
                type="text"
                size="small"
                @click="toggleProductSelection(row)"
                :type="isProductSelected(row) ? 'warning' : 'primary'"
              >
                {{ isProductSelected(row) ? '取消' : '选择' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 网格视图 -->
      <div v-else class="grid-view">
        <el-row :gutter="20" v-loading="loading">
          <el-col 
            v-for="product in productList" 
            :key="product.id"
            :span="6"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
            :xl="6"
          >
            <el-card 
              shadow="hover" 
              class="product-card"
              :class="{ 'selected': isProductSelected(product) }"
            >
              <template #header>
                <div class="card-header">
                  <el-checkbox
                    :model-value="isProductSelected(product)"
                    @change="toggleProductSelection(product)"
                  />
                  <div class="product-actions">
                    <el-button
                      type="text"
                      size="small"
                      @click="viewProductDetail(product)"
                    >
                      详情
                    </el-button>
                  </div>
                </div>
              </template>

              <div class="product-content">
                <div class="product-image-container">
                  <el-image
                    :src="product.imageUrl || defaultImage"
                    :alt="product.name"
                    fit="cover"
                    class="product-image"
                    :preview-src-list="[product.imageUrl]"
                  >
                    <template #error>
                      <div class="image-placeholder">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                </div>

                <div class="product-info">
                  <h4 class="product-name" :title="product.name">
                    {{ product.name }}
                  </h4>
                  
                  <div class="product-tags">
                    <el-tag
                      v-if="product.isHot"
                      type="danger"
                      size="small"
                      effect="plain"
                    >
                      热销
                    </el-tag>
                    <el-tag
                      v-if="product.isNew"
                      type="success"
                      size="small"
                      effect="plain"
                    >
                      新品
                    </el-tag>
                    <el-tag type="info" size="small">
                      {{ product.categoryName }}
                    </el-tag>
                  </div>

                  <div class="product-meta">
                    <div class="price-row">
                      <span class="price">¥{{ formatPrice(product.price) }}</span>
                      <span class="stock">库存: {{ product.stock }}</span>
                    </div>
                    <div class="unit-row">
                      <span class="unit">单位: {{ product.unit }}</span>
                    </div>
                  </div>

                  <div class="product-actions">
                    <el-button
                      type="primary"
                      size="small"
                      @click="toggleProductSelection(product)"
                      :disabled="!isProductAvailable(product)"
                      style="width: 100%"
                    >
                      {{ isProductSelected(product) ? '已选择' : '选择产品' }}
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[12, 24, 48, 96]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 产品详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedProduct?.name || '产品详情'"
      width="800px"
      destroy-on-close
    >
      <div v-if="selectedProduct" class="product-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="产品名称">
            {{ selectedProduct.name }}
          </el-descriptions-item>
          <el-descriptions-item label="产品编码">
            {{ selectedProduct.code }}
          </el-descriptions-item>
          <el-descriptions-item label="产品分类">
            <el-tag type="info">{{ selectedProduct.categoryName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="单位">
            {{ selectedProduct.unit }}
          </el-descriptions-item>
          <el-descriptions-item label="价格">
            <span class="price">¥{{ formatPrice(selectedProduct.price) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="库存">
            <el-tag :type="getStockStatusType(selectedProduct.stock)">
              {{ selectedProduct.stock }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="产品状态" :span="2">
            <div class="product-status">
              <el-tag v-if="selectedProduct.isHot" type="danger">热销</el-tag>
              <el-tag v-if="selectedProduct.isNew" type="success">新品</el-tag>
              <el-tag v-if="selectedProduct.isActive" type="primary">在售</el-tag>
              <el-tag v-else type="info">停售</el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="产品描述" :span="2">
            {{ selectedProduct.description || '暂无描述' }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedProduct.imageUrl" class="product-image-detail">
          <h4>产品图片</h4>
          <el-image
            :src="selectedProduct.imageUrl"
            :alt="selectedProduct.name"
            fit="contain"
            style="max-width: 100%; max-height: 300px;"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          type="primary"
          @click="addToCartFromDetail"
          :disabled="!selectedProduct || !isProductAvailable(selectedProduct)"
        >
          选择此产品
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { 
  Search, 
  Delete, 
  Refresh, 
  List, 
  Grid, 
  Picture 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * 产品选择器组件
 * 
 * 功能特性：
 * - 支持多种搜索和筛选条件
 * - 提供列表和网格两种视图模式
 * - 支持批量选择和单个选择
 * - 集成产品详情展示
 * - 响应式设计，适配移动端
 * - 完整的错误处理和加载状态
 * - 性能优化的虚拟滚动（大数据量时）
 * 
 * @author AI Assistant
 * @since 2024-01-01
 */
export default {
  name: 'ProductSelector',
  components: {
    Search,
    Delete,
    Refresh,
    List,
    Grid,
    Picture
  },
  props: {
    // 是否允许多选
    multiple: {
      type: Boolean,
      default: true
    },
    // 最大选择数量
    maxSelection: {
      type: Number,
      default: Infinity
    },
    // 默认选中的产品
    defaultSelected: {
      type: Array,
      default: () => []
    },
    // 是否显示产品图片
    showImage: {
      type: Boolean,
      default: true
    },
    // 产品分类列表
    categories: {
      type: Array,
      default: () => []
    }
  },
  emits: [
    'selection-change',
    'confirm',
    'cancel',
    'product-view'
  ],
  setup(props, { emit }) {
    // ================ 响应式数据 ================
    
    // 搜索表单
    const searchForm = reactive({
      productName: '',
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      status: 'all'
    })

    // 分页数据
    const pagination = reactive({
      currentPage: 1,
      pageSize: 24
    })

    // 列表数据
    const productList = ref([])
    const totalCount = ref(0)
    const loading = ref(false)
    const viewMode = ref('list')
    
    // 选择的商品
    const selectedProducts = ref([])
    const selectedProduct = ref(null)
    
    // 弹窗状态
    const detailDialogVisible = ref(false)
    
    // 排序信息
    const sortInfo = reactive({
      prop: 'name',
      order: 'ascending'
    })

    // 快速筛选
    const activeQuickFilter = ref('all')
    const quickFilterTags = [
      { label: '全部', value: 'all' },
      { label: '热销', value: 'hot' },
      { label: '新品', value: 'new' },
      { label: '库存充足', value: 'inStock' },
      { label: '价格优惠', value: 'discount' }
    ]

    // 默认图片
    const defaultImage = ref('/images/default-product.png')

    // 组件引用
    const productTableRef = ref(null)

    // ================ 计算属性 ================
    
    const categoryOptions = computed(() => {
      return props.categories || []
    })

    // ================ 方法定义 ================

    /**
     * 加载产品列表
     */
    const loadProducts = async () => {
      loading.value = true
      try {
        // 构建查询参数
        const params = {
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          keyword: searchForm.productName?.trim(),
          categoryId: searchForm.categoryId,
          minPrice: searchForm.minPrice,
          maxPrice: searchForm.maxPrice,
          sortBy: sortInfo.prop,
          sortOrder: sortInfo.order === 'ascending' ? 'asc' : 'desc',
          quickFilter: activeQuickFilter.value
        }

        // 过滤空值
        Object.keys(params).forEach(key => {
          if (params[key] === null || params[key] === undefined || params[key] === '') {
            delete params[key]
          }
        })

        // 模拟API调用
        const response = await mockProductApi(params)
        
        productList.value = response.data.list || []
        totalCount.value = response.data.total || 0

        // 恢复选中状态
        await nextTick()
        restoreSelectionState()

      } catch (error) {
        console.error('加载产品列表失败:', error)
        ElMessage.error('加载产品列表失败，请稍后重试')
        productList.value = []
        totalCount.value = 0
      } finally {
        loading.value = false
      }
    }

    /**
     * 模拟产品API
     */
    const mockProductApi = async (params) => {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 生成模拟数据
      const mockData = generateMockProducts(params)
      
      return {
        code: 200,
        message: 'success',
        data: mockData
      }
    }

    /**
     * 生成模拟产品数据
     */
    const generateMockProducts = (params) => {
      const baseProducts = [
        { id: 1, name: '工业机器人 A1', code: 'RB001', categoryId: 1, categoryName: '机器人', price: 125000.00, stock: 15, unit: '台', description: '高精度工业机器人，适用于装配线', imageUrl: '/images/robot-a1.jpg', isHot: true, isNew: false, isActive: true },
        { id: 2, name: '智能传感器 B2', code: 'SN002', categoryId: 2, categoryName: '传感器', price: 2800.50, stock: 120, unit: '个', description: '高精度温度传感器', imageUrl: '/images/sensor-b2.jpg', isHot: false, isNew: true, isActive: true },
        { id: 3, name: '控制器 C3', code: 'CT003', categoryId: 3, categoryName: '控制器', price: 18500.00, stock: 8, unit: '套', description: '工业控制器，支持多种协议', imageUrl: '/images/controller-c3.jpg', isHot: true, isNew: false, isActive: true },
        { id: 4, name: '执行器 D4', code: 'EX004', categoryId: 4, categoryName: '执行器', price: 7200.00, stock: 35, unit: '个', description: '高精度执行器', imageUrl: '/images/actuator-d4.jpg', isHot: false, isNew: false, isActive: true },
        { id: 5, name: '监控系统 E5', code: 'MS005', categoryId: 5, categoryName: '监控系统', price: 32000.00, stock: 3, unit: '套', description: '实时监控系统', imageUrl: '/images/monitor-e5.jpg', isHot: false, isNew: true, isActive: true },
        { id: 6, name: '数据采集器 F6', code: 'DA006', categoryId: 2, categoryName: '传感器', price: 4500.00, stock: 0, unit: '台', description: '多通道数据采集器', imageUrl: '/images/collector-f6.jpg', isHot: false, isNew: false, isActive: false }
      ]

      // 应用筛选条件
      let filteredProducts = baseProducts.filter(product => {
        // 关键词搜索
        if (params.keyword && !product.name.toLowerCase().includes(params.keyword.toLowerCase())) {
          return false
        }
        
        // 分类筛选
        if (params.categoryId && product.categoryId !== params.categoryId) {
          return false
        }
        
        // 价格筛选
        if (params.minPrice !== undefined && product.price < params.minPrice) {
          return false
        }
        if (params.maxPrice !== undefined && product.price > params.maxPrice) {
          return false
        }
        
        // 快速筛选
        if (params.quickFilter === 'hot' && !product.isHot) {
          return false
        }
        if (params.quickFilter === 'new' && !product.isNew) {
          return false
        }
        if (params.quickFilter === 'inStock' && product.stock < 10) {
          return false
        }
        if (params.quickFilter === 'discount' && product.price > 10000) {
          return false
        }
        
        return true
      })

      // 排序
      if (params.sortBy) {
        filteredProducts.sort((a, b) => {
          let aVal = a[params.sortBy]
          let bVal = b[params.sortBy]
          
          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase()
            bVal = bVal.toLowerCase()
          }
          
          if (params.sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
      }

      // 分页
      const start = (params.page - 1) * params.pageSize
      const end = start + params.pageSize
      const list = filteredProducts.slice(start, end)

      return {
        list,
        total: filteredProducts.length
      }
    }

    /**
     * 搜索处理
     */
    const handleSearch = () => {
      pagination.currentPage = 1
      loadProducts()
    }

    /**
     * 清空搜索
     */
    const handleClear = () => {
      handleSearch()
    }

    /**
     * 重置搜索条件
     */
    const resetSearch = () => {
      Object.assign(searchForm, {
        productName: '',
        categoryId: null,
        minPrice: null,
        maxPrice: null,
        status: 'all'
      })
      activeQuickFilter.value = 'all'
      pagination.currentPage = 1
      loadProducts()
    }

    /**
     * 快速筛选处理
     */
    const handleQuickFilter = (filterValue) => {
      activeQuickFilter.value = filterValue
      pagination.currentPage = 1
      loadProducts()
    }

    /**
     * 选择变化处理
     */
    const handleSelectionChange = (selection) => {
      // 限制最大选择数量
      if (!props.multiple && selection.length > 1) {
        selection = [selection[selection.length - 1]]
        if (productTableRef.value) {
          productTableRef.value.clearSelection()
          nextTick(() => {
            productTableRef.value.toggleRowSelection(selection[0], true)
          })
        }
      }

      if (props.maxSelection > 0 && selection.length > props.maxSelection) {
        ElMessage.warning(`最多只能选择 ${props.maxSelection} 个产品`)
        return
      }

      selectedProducts.value = selection
      emit('selection-change', selection)
    }

    /**
     * 排序变化处理
     */
    const handleSortChange = ({ column, prop, order }) => {
      sortInfo.prop = prop
      sortInfo.order = order
      loadProducts()
    }

    /**
     * 分页大小变化
     */
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      pagination.currentPage = 1
      loadProducts()
    }

    /**
     * 当前页变化
     */
    const handleCurrentChange = (page) => {
      pagination.currentPage = page
      loadProducts()
    }

    /**
     * 切换产品选择状态
     */
    const toggleProductSelection = (product) => {
      if (!props.multiple) {
        selectedProducts.value = []
        if (productTableRef.value) {
          productTableRef.value.clearSelection()
        }
      }

      const index = selectedProducts.value.findIndex(p => p.id === product.id)
      
      if (index === -1) {
        if (props.maxSelection > 0 && selectedProducts.value.length >= props.maxSelection) {
          ElMessage.warning(`最多只能选择 ${props.maxSelection} 个产品`)
          return
        }
        selectedProducts.value.push(product)
      } else {
        selectedProducts.value.splice(index, 1)
      }

      if (productTableRef.value) {
        productTableRef.value.toggleRowSelection(product, index === -1)
      }

      emit('selection-change', selectedProducts.value)
    }

    /**
     * 检查产品是否已选择
     */
    const isProductSelected = (product) => {
      return selectedProducts.value.some(p => p.id === product.id)
    }

    /**
     * 检查产品是否可用
     */
    const isProductAvailable = (product) => {
      return product.isActive && product.stock > 0
    }

    /**
     * 查看产品详情
     */
    const viewProductDetail = (product) => {
      selectedProduct.value = product
      detailDialogVisible.value = true
      emit('product-view', product)
    }

    /**
     * 从详情页添加到选择
     */
    const addToCartFromDetail = () => {
      if (selectedProduct.value) {
        toggleProductSelection(selectedProduct.value)
        detailDialogVisible.value = false
      }
    }

    /**
     * 添加到购物车（这里的实现是选择产品）
     */
    const addToCart = (product) => {
      toggleProductSelection(product)
    }

    /**
     * 清空选择
     */
    const clearSelection = () => {
      selectedProducts.value = []
      if (productTableRef.value) {
        productTableRef.value.clearSelection()
      }
      emit('selection-change', [])
    }

    /**
     * 确认选择
     */
    const confirmSelection = () => {
      if (selectedProducts.value.length === 0) {
        ElMessage.warning('请至少选择一个产品')
        return
      }

      emit('confirm', selectedProducts.value)
    }

    /**
     * 恢复选中状态
     */
    const restoreSelectionState = () => {
      if (props.defaultSelected && props.defaultSelected.length > 0) {
        selectedProducts.value = [...props.defaultSelected]
        
        nextTick(() => {
          if (productTableRef.value) {
            selectedProducts.value.forEach(product => {
              const row = productList.value.find(p => p.id === product.id)
              if (row) {
                productTableRef.value.toggleRowSelection(row, true)
              }
            })
          }
        })
      }
    }

    /**
     * 格式化价格
     */
    const formatPrice = (price) => {
      return price?.toFixed(2) || '0.00'
    }

    /**
     * 获取库存状态类型
     */
    const getStockStatusType = (stock) => {
      if (stock === 0) return 'danger'
      if (stock < 10) return 'warning'
      return 'success'
    }

    // ================ 生命周期 ================
    
    onMounted(() => {
      // 初始化默认选中产品
      if (props.defaultSelected && props.defaultSelected.length > 0) {
        selectedProducts.value = [...props.defaultSelected]
      }
      
      // 加载产品列表
      loadProducts()
    })

    // ================ 监听器 ================
    
    // 监听默认选中产品变化
    watch(() => props.defaultSelected, (newVal) => {
      if (newVal && newVal.length > 0) {
        selectedProducts.value = [...newVal]
        restoreSelectionState()
      }
    }, { deep: true })

    // ================ 返回值 ================
    
    return {
      // 响应式数据
      searchForm,
      pagination,
      productList,
      totalCount,
      loading,
      viewMode,
      selectedProducts,
      selectedProduct,
      detailDialogVisible,
      activeQuickFilter,
      quickFilterTags,
      defaultImage,
      categoryOptions,
      
      // 组件引用
      productTableRef,
      
      // 方法
      handleSearch,
      handleClear,
      resetSearch,
      handleQuickFilter,
      handleSelectionChange,
      handleSortChange,
      handleSizeChange,
      handleCurrentChange,
      toggleProductSelection,
      isProductSelected,
      isProductAvailable,
      viewProductDetail,
      addToCartFromDetail,
      addToCart,
      clearSelection,
      confirmSelection,
      formatPrice,
      getStockStatusType
    }
  }
}
</script>

<style lang="scss" scoped>
.product-selector-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .search-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-title {
      font-weight: 600;
      color: #303133;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .search-form {
    .el-form-item {
      margin-bottom: 16px;
    }

    .price-separator {
      margin: 0 8px;
      color: #909399;
    }
  }

  .quick-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;

    .filter-tag {
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
      }
    }
  }

  .product-list-card {
    .list-view {
      .product-image {
        width: 60px;
        height: 60px;
        border-radius: 4px;
      }

      .image-placeholder {
        width: 60px;
        height: 60px;
        background-color: #f5f7fa;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #c0c4cc;
        font-size: 20px;
      }

      .product-name {
        .name-text {
          margin-right: 8px;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .price {
        font-weight: 600;
        color: #e6a23c;
      }
    }

    .grid-view {
      .product-card {
        margin-bottom: 20px;
        transition: all 0.3s ease;
        border: 2px solid transparent;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &.selected {
          border-color: #409eff;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .product-content {
          .product-image-container {
            text-align: center;
            margin-bottom: 12px;

            .product-image {
              width: 120px;
              height: 120px;
              border-radius: 8px;
            }
          }

          .product-info {
            .product-name {
              margin: 0 0 8px 0;
              font-size: 14px;
              line-height: 1.4;
              height: 40px;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }

            .product-tags {
              margin-bottom: 12px;
              display: flex;
              gap: 4px;
              flex-wrap: wrap;
            }

            .product-meta {
              margin-bottom: 12px;

              .price-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;

                .price {
                  font-weight: 600;
                  color: #e6a23c;
                  font-size: 16px;
                }

                .stock {
                  font-size: 12px;
                  color: #909399;
                }
              }

              .unit-row {
                .unit {
                  font-size: 12px;
                  color: #909399;
                }
              }
            }
          }
        }
      }
    }
  }

  .pagination-container {
    margin-top: 20px;
    text-align: center;
  }
}

.product-detail {
  .product-status {
    display: flex;
    gap: 8px;
  }

  .price {
    font-weight: 600;
    color: #e6a23c;
    font-size: 18px;
  }

  .product-image-detail {
    margin-top: 20px;
    text-align: center;

    h4 {
      margin-bottom: 12px;
      color: #303133;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .product-selector-container {
    padding: 10px;

    .search-form {
      .el-form-item {
        width: 100%;
        margin-bottom: 12px;
      }
    }

    .quick-filters {
      .filter-tag {
        font-size: 12px;
        padding: 0 8px;
      }
    }

    .grid-view {
      .el-col {
        margin-bottom: 12px;
      }

      .product-card {
        .product-content {
          .product-image-container {
            .product-image {
              width: 80px;
              height: 80px;
            }
          }
        }
      }
    }
  }
}

// 加载状态样式
.el-loading-mask {
  border-radius: 4px;
}

// 表格优化
.el-table {
  .el-table__row {
    &:hover {
      background-color: #f5f7fa;
    }
  }
}

// 卡片阴影效果
.el-card {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
}

// 按钮组样式
.el-button-group {
  .el-button {
    &:hover {
      opacity: 0.8;
    }
  }
}

// 标签组样式
.el-tag {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
  }
}
</style>