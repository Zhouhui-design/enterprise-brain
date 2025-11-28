cat > fixture/FixtureDesign.vue <<'EOF'
<template>
  <div class="fixture-design-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>夹具设计管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateDesign">
          <el-icon><Plus /></el-icon>
          创建设计
        </el-button>
        <el-button @click="handleImportDesign">
          <el-icon><Upload /></el-icon>
          导入设计
        </el-button>
        <el-button @click="handleExportDesign">
          <el-icon><Download /></el-icon>
          导出设计
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="设计编号">
          <el-input v-model="searchForm.designCode" placeholder="请输入设计编号" clearable />
        </el-form-item>
        <el-form-item label="设计名称">
          <el-input v-model="searchForm.designName" placeholder="请输入设计名称" clearable />
        </el-form-item>
        <el-form-item label="设计类型">
          <el-select v-model="searchForm.designType" placeholder="请选择设计类型" clearable>
            <el-option label="CNC夹具" value="cnc" />
            <el-option label="检测夹具" value="test" />
            <el-option label="焊接夹具" value="weld" />
            <el-option label="装配夹具" value="assembly" />
          </el-select>
        </el-form-item>
        <el-form-item label="设计状态">
          <el-select v-model="searchForm.status" placeholder="请选择设计状态" clearable>
            <el-option label="设计中" value="designing" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已批准" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="设计人员">
          <el-input v-model="searchForm.designer" placeholder="请输入设计人员" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="data-table-card">
      <el-table
        v-loading="loading"
        :data="designList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="designCode" label="设计编号" min-width="120" />
        <el-table-column prop="designName" label="设计名称" min-width="180" />
        <el-table-column prop="designType" label="设计类型" min-width="120">
          <template #default="scope">
            {{ getDesignTypeText(scope.row.designType) }}
          </template>
        </el-table-column>
        <el-table-column prop="designer" label="设计人员" min-width="100" />
        <el-table-column prop="applicableProduct" label="适用产品" min-width="150" />
        <el-table-column prop="status" label="设计状态" min-width="100">
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
              effect="light"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="140" />
        <el-table-column prop="updateTime" label="更新时间" min-width="140" />
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleViewDesign(scope.row)"
            >
              查看
            </el-button>
            <el-button
              v-if="scope.row.status === 'designing' || scope.row.status === 'rejected'"
              type="success"
              size="small"
              @click="handleEditDesign(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="scope.row.status === 'designing'"
              type="warning"
              size="small"
              @click="handleSubmitReview(scope.row)"
            >
              提交审核
            </el-button>
            <el-button
              v-if="scope.row.status === 'reviewing'"
              type="primary"
              size="small"
              @click="handleApproveDesign(scope.row)"
            >
              批准
            </el-button>
            <el-button
              v-if="scope.row.status === 'reviewing'"
              type="danger"
              size="small"
              @click="handleRejectDesign(scope.row)"
            >
              拒绝
            </el-button>
            <el-button
              v-if="scope.row.status === 'approved'"
              type="info"
              size="small"
              @click="handleCompleteDesign(scope.row)"
            >
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 设计详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="夹具设计详情"
      size="60%"
      direction="rtl"
    >
      <div v-if="selectedDesign" class="design-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="设计编号">{{ selectedDesign.designCode }}</el-descriptions-item>
          <el-descriptions-item label="设计名称">{{ selectedDesign.designName }}</el-descriptions-item>
          <el-descriptions-item label="设计类型">{{ getDesignTypeText(selectedDesign.designType) }}</el-descriptions-item>
          <el-descriptions-item label="设计人员">{{ selectedDesign.designer }}</el-descriptions-item>
          <el-descriptions-item label="适用产品">{{ selectedDesign.applicableProduct }}</el-descriptions-item>
          <el-descriptions-item label="设计状态">{{ getStatusText(selectedDesign.status) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedDesign.createTime }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ selectedDesign.updateTime }}</el-descriptions-item>
          <el-descriptions-item label="设计要求" :span="2">{{ selectedDesign.designRequirements || '-' }}</el-descriptions-item>
          <el-descriptions-item label="技术参数" :span="2">{{ selectedDesign.technicalParameters || '-' }}</el-descriptions-item>
          <el-descriptions-item label="材料清单" :span="2">{{ selectedDesign.materialList || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核意见" :span="2">{{ selectedDesign.reviewComments || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedDesign.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 设计文档和图纸 -->
        <div class="design-documents" style="margin-top: 30px;">
          <h3 style="margin-bottom: 15px;">设计文档和图纸</h3>
          <el-upload
            action=""
            :file-list="designFiles"
            :disabled="true"
            class="design-uploader"
          >
            <template #file="{ file }">
              <div class="el-upload-list__item">
                <el-icon class="el-upload-list__item-icon"><Document /></el-icon>
                <div class="el-upload-list__item-info">
                  <span class="el-upload-list__item-name">{{ file.name }}</span>
                </div>
                <div class="el-upload-list__item-actions">
                  <span
                    class="el-upload-list__item-action"
                    @click="handleDownloadFile(file)"
                  >
                    <el-icon><Download /></el-icon>
                  </span>
                  <span
                    class="el-upload-list__item-action"
                    @click="handlePreviewFile(file)"
                  >
                    <el-icon><View /></el-icon>
                  </span>
                </div>
              </div>
            </template>
          </el-upload>
        </div>

        <!-- 设计流程记录 -->
        <div class="design-history" style="margin-top: 30px;">
          <h3 style="margin-bottom: 15px;">设计流程记录</h3>
          <el-timeline>
            <el-timeline-item
              v-for="record in designHistory"
              :key="record.id"
              :timestamp="record.recordTime"
              :type="getHistoryType(record.action)"
            >
              <div>
                <div class="history-title">{{ getHistoryActionText(record.action) }}</div>
                <div class="history-content">{{ record.content }}</div>
                <div class="history-operator">操作人：{{ record.operator }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-drawer>

    <!-- 创建设计对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="'创建设计'"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form
        ref="designFormRef"
        :model="designForm"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="设计编号" prop="designCode">
          <el-input v-model="designForm.designCode" placeholder="请输入设计编号" />
        </el-form-item>
        <el-form-item label="设计名称" prop="designName">
          <el-input v-model="designForm.designName" placeholder="请输入设计名称" />
        </el-form-item>
        <el-form-item label="设计类型" prop="designType">
          <el-select v-model="designForm.designType" placeholder="请选择设计类型">
            <el-option label="CNC夹具" value="cnc" />
            <el-option label="检测夹具" value="test" />
            <el-option label="焊接夹具" value="weld" />
            <el-option label="装配夹具" value="assembly" />
          </el-select>
        </el-form-item>
        <el-form-item label="设计人员" prop="designer">
          <el-input v-model="designForm.designer" placeholder="请输入设计人员" />
        </el-form-item>
        <el-form-item label="适用产品" prop="applicableProduct">
          <el-input v-model="designForm.applicableProduct" placeholder="请输入适用产品" />
        </el-form-item>
        <el-form-item label="设计要求">
          <el-input v-model="designForm.designRequirements" type="textarea" placeholder="请输入设计要求" rows="3" />
        </el-form-item>
        <el-form-item label="技术参数">
          <el-input v-model="designForm.technicalParameters" type="textarea" placeholder="请输入技术参数" rows="3" />
        </el-form-item>
        <el-form-item label="材料清单">
          <el-input v-model="designForm.materialList" type="textarea" placeholder="请输入材料清单" rows="2" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="designForm.remark" type="textarea" placeholder="请输入备注" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSaveDesign">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 提交审核对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      title="提交审核"
      width="500px"
      @close="handleReviewDialogClose"
    >
      <el-form
        ref="reviewFormRef"
        :model="reviewForm"
        :rules="reviewFormRules"
        label-width="100px"
      >
        <el-form-item label="审核人" prop="reviewer">
          <el-input v-model="reviewForm.reviewer" placeholder="请输入审核人" />
        </el-form-item>
        <el-form-item label="提交说明" prop="submitDescription">
          <el-input v-model="reviewForm.submitDescription" type="textarea" placeholder="请输入提交说明" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleReviewDialogClose">取消</el-button>
          <el-button type="primary" @click="handleConfirmSubmitReview">确认提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, Refresh, Document, View } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const designList = ref([])
const searchForm = reactive({
  designCode: '',
  designName: '',
  designType: '',
  status: '',
  designer: ''
})
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
const drawerVisible = ref(false)
const selectedDesign = ref(null)
const dialogVisible = ref(false)
const reviewDialogVisible = ref(false)
const designFormRef = ref(null)
const reviewFormRef = ref(null)
const designForm = reactive({
  designCode: '',
  designName: '',
  designType: 'cnc',
  designer: '',
  applicableProduct: '',
  designRequirements: '',
  technicalParameters: '',
  materialList: '',
  remark: ''
})
const reviewForm = reactive({
  reviewer: '',
  submitDescription: ''
})
const designFiles = ref([])
const designHistory = ref([])

// 表单验证规则
const formRules = {
  designCode: [
    { required: true, message: '请输入设计编号', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  designName: [
    { required: true, message: '请输入设计名称', trigger: 'blur' }
  ],
  designType: [
    { required: true, message: '请选择设计类型', trigger: 'change' }
  ],
  designer: [
    { required: true, message: '请输入设计人员', trigger: 'blur' }
  ],
  applicableProduct: [
    { required: true, message: '请输入适用产品', trigger: 'blur' }
  ]
}

const reviewFormRules = {
  reviewer: [
    { required: true, message: '请输入审核人', trigger: 'blur' }
  ],
  submitDescription: [
    { required: true, message: '请输入提交说明', trigger: 'blur' }
  ]
}

// 获取设计类型文本
const getDesignTypeText = (type) => {
  const typeMap = {
    'cnc': 'CNC夹具',
    'test': '检测夹具',
    'weld': '焊接夹具',
    'assembly': '装配夹具'
  }
  return typeMap[type] || type
}

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    'designing': 'primary',
    'reviewing': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'completed': 'info'
  }
  return statusMap[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'designing': '设计中',
    'reviewing': '审核中',
    'approved': '已批准',
    'rejected': '已拒绝',
    'completed': '已完成'
  }
  return statusMap[status] || status
}

// 获取历史记录类型
const getHistoryType = (action) => {
  const typeMap = {
    'create': 'primary',
    'update': 'info',
    'submit_review': 'warning',
    'approve': 'success',
    'reject': 'danger',
    'complete': 'success'
  }
  return typeMap[action] || 'primary'
}

// 获取历史操作文本
const getHistoryActionText = (action) => {
  const actionMap = {
    'create': '创建设计',
    'update': '更新设计',
    'submit_review': '提交审核',
    'approve': '审核通过',
    'reject': '审核拒绝',
    'complete': '完成设计'
  }
  return actionMap[action] || action
}

// 加载设计列表
const loadDesignList = async () => {
  loading.value = true
  try {
    // 模拟API请求
    // const response = await fixtureDesignService.getDesignList({
    //   ...searchForm,
    //   page: pagination.currentPage,
    //   pageSize: pagination.pageSize
    // })
    // 模拟数据
    designList.value = generateMockData()
    pagination.total = 50
  } catch (error) {
    ElMessage.error('获取设计列表失败')
    console.error('获取设计列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 生成模拟数据
const generateMockData = () => {
  const data = []
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize
  for (let i = 0; i < pagination.pageSize; i++) {
    const index = startIndex + i
    const statuses = ['designing', 'reviewing', 'approved', 'rejected', 'completed']
    const designTypes = ['cnc', 'test', 'weld', 'assembly']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    data.push({
      id: index + 1,
      designCode: `DESIGN-${String(index + 1).padStart(4, '0')}`,
      designName: `夹具设计方案${index + 1}`,
      designType: designTypes[Math.floor(Math.random() * designTypes.length)],
      designer: `设计师${index % 5 + 1}`,
      applicableProduct: `产品${String.fromCharCode(65 + (index % 5))}`,
      status: status,
      createTime: new Date(Date.now() - Math.random() * 10000000000).toLocaleString(),
      updateTime: new Date(Date.now() - Math.random() * 5000000000).toLocaleString(),
      designRequirements: `设计要求说明${index + 1}`,
      technicalParameters: `技术参数详情${index + 1}`,
      materialList: `材料清单${index + 1}`,
      reviewComments: status === 'rejected' ? `审核未通过原因：设计不符合要求${index + 1}` : '',
      remark: `备注信息${index + 1}`
    })
  }
  return data
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadDesignList()
}

// 重置搜索条件
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.currentPage = 1
  loadDesignList()
}

// 刷新
const handleRefresh = () => {
  loadDesignList()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadDesignList()
}

// 当前页改变
const handleCurrentChange = (current) => {
  pagination.currentPage = current
  loadDesignList()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  // 处理选中的行
}

// 查看设计
const handleViewDesign = (row) => {
  selectedDesign.value = { ...row }
  loadDesignFiles(row.id)
  loadDesignHistory(row.id)
  drawerVisible.value = true
}

// 创建设计
const handleCreateDesign = () => {
  resetDesignForm()
  // 生成默认设计编号
  designForm.designCode = `DESIGN-${new Date().getTime().toString().slice(-6)}`
  dialogVisible.value = true
}

// 编辑设计
const handleEditDesign = (row) => {
  Object.assign(designForm, row)
  dialogVisible.value = true
}

// 导入设计
const handleImportDesign = async () => {
  try {
    // 这里可以实现文件上传逻辑
    ElMessage.success('导入设计成功')
    loadDesignList()
  } catch (error) {
    ElMessage.error('导入设计失败')
    console.error('导入设计失败:', error)
  }
}

// 导出设计
const handleExportDesign = async () => {
  try {
    // 这里可以实现文件导出逻辑
    ElMessage.success('导出设计成功')
  } catch (error) {
    ElMessage.error('导出设计失败')
    console.error('导出设计失败:', error)
  }
}

// 提交审核
const handleSubmitReview = (row) => {
  selectedDesign.value = { ...row }
  resetReviewForm()
  reviewDialogVisible.value = true
}

// 批准设计
const handleApproveDesign = (row) => {
  ElMessageBox.confirm(
    `确定要批准设计「${row.designName}」吗？`,
    '批准设计',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(async () => {
    try {
      // 模拟API请求
      // await fixtureDesignService.approveDesign(row.id)
      ElMessage.success('设计已批准')
      loadDesignList()
    } catch (error) {
      ElMessage.error('批准设计失败')
      console.error('批准设计失败:', error)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 拒绝设计
const handleRejectDesign = (row) => {
  ElMessageBox.prompt(
    `请输入拒绝原因：`,
    `拒绝设计「${row.designName}」`,
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      inputType: 'textarea'
    }
  ).then(async ({ value }) => {
    try {
      // 模拟API请求
      // await fixtureDesignService.rejectDesign(row.id, { reason: value })
      ElMessage.success('设计已拒绝')
      loadDesignList()
    } catch (error) {
      ElMessage.error('拒绝设计失败')
      console.error('拒绝设计失败:', error)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 完成设计
const handleCompleteDesign = (row) => {
  ElMessageBox.confirm(
    `确定要标记设计「${row.designName}」为完成状态吗？`,
    '完成设计',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    try {
      // 模拟API请求
      // await fixtureDesignService.completeDesign(row.id)
      ElMessage.success('设计已完成')
      loadDesignList()
    } catch (error) {
      ElMessage.error('完成设计失败')
      console.error('完成设计失败:', error)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 保存设计
const handleSaveDesign = async () => {
  const valid = await designFormRef.value.validate()
  if (!valid) return

  try {
    // 模拟API请求
    // await fixtureDesignService.createDesign(designForm)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadDesignList()
  } catch (error) {
    ElMessage.error('保存失败')
    console.error('保存设计失败:', error)
  }
}

// 确认提交审核
const handleConfirmSubmitReview = async () => {
  const valid = await reviewFormRef.value.validate()
  if (!valid) return

  try {
    // 模拟API请求
    // await fixtureDesignService.submitReview(selectedDesign.value.id, reviewForm)
    ElMessage.success('提交审核成功')
    reviewDialogVisible.value = false
    loadDesignList()
  } catch (error) {
    ElMessage.error('提交审核失败')
    console.error('提交审核失败:', error)
  }
}

// 加载设计文件
const loadDesignFiles = async (designId) => {
  try {
    // 模拟API请求
    // const response = await fixtureDesignService.getDesignFiles(designId)
    // designFiles.value = response.data
    
    // 模拟数据
    designFiles.value = [
      {
        name: `设计图纸${designId}.dwg`,
        url: '#',
        size: 1024 * 1024,
        type: 'dwg',
        uploadTime: new Date().toLocaleString()
      },
      {
        name: `技术文档${designId}.docx`,
        url: '#',
        size: 512 * 1024,
        type: 'docx',
        uploadTime: new Date().toLocaleString()
      },
      {
        name: `材料清单${designId}.xlsx`,
        url: '#',
        size: 256 * 1024,
        type: 'xlsx',
        uploadTime: new Date().toLocaleString()
      }
    ]
  } catch (error) {
    console.error('获取设计文件失败:', error)
  }
}

// 加载设计历史
const loadDesignHistory = async (designId) => {
  try {
    // 模拟API请求
    // const response = await fixtureDesignService.getDesignHistory(designId)
    // designHistory.value = response.data
    
    // 模拟数据
    designHistory.value = [
      {
        id: 1,
        action: 'create',
        content: '创建了设计方案',
        operator: '设计师1',
        recordTime: new Date(Date.now() - 10000000000).toLocaleString()
      },
      {
        id: 2,
        action: 'update',
        content: '更新了设计参数',
        operator: '设计师1',
        recordTime: new Date(Date.now() - 8000000000).toLocaleString()
      },
      {
        id: 3,
        action: 'submit_review',
        content: '提交设计方案审核',
        operator: '设计师1',
        recordTime: new Date(Date.now() - 5000000000).toLocaleString()
      }
    ]
  } catch (error) {
    console.error('获取设计历史失败:', error)
  }
}

// 下载文件
const handleDownloadFile = (file) => {
  ElMessage.success(`下载文件：${file.name}`)
  // 实际项目中这里可以实现文件下载逻辑
}

// 预览文件
const handlePreviewFile = (file) => {
  ElMessage.info(`预览文件：${file.name}`)
  // 实际项目中这里可以实现文件预览逻辑
}

// 关闭设计对话框
const handleDialogClose = () => {
  dialogVisible.value = false
  resetDesignForm()
}

// 关闭审核对话框
const handleReviewDialogClose = () => {
  reviewDialogVisible.value = false
  resetReviewForm()
}

// 重置设计表单
const resetDesignForm = () => {
  Object.keys(designForm).forEach(key => {
    designForm[key] = ''
  })
  designForm.designType = 'cnc'
}

// 重置审核表单
const resetReviewForm = () => {
  reviewForm.reviewer = ''
  reviewForm.submitDescription = ''
}

// 组件挂载时加载数据
onMounted(() => {
  loadDesignList()
})
</script>

<style scoped>
.fixture-design-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 4px;
}

.data-table-card {
  border-radius: 4px;
  overflow: hidden;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.design-details {
  padding: 20px 0;
}

.design-uploader {
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  background-color: #f8f9fa;
}

.history-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.history-content {
  color: #606266;
  margin-bottom: 5px;
}

.history-operator {
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .fixture-design-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
}
</style>