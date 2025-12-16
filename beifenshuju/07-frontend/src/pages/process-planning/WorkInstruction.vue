<template>
  <div class="work-instruction-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>工作指导书管理</h1>
      <div class="header-actions">
        <el-button type="primary" icon="el-icon-plus" @click="createInstruction">创建指导书</el-button>
        <el-button icon="el-icon-upload" @click="importInstruction">导入</el-button>
        <el-button icon="el-icon-download" @click="exportInstructions">导出</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <el-card>
        <el-form :model="searchForm" label-width="100px" inline>
          <el-form-item label="指导书编号">
            <el-input v-model="searchForm.code" placeholder="请输入指导书编号" />
          </el-form-item>
          <el-form-item label="指导书名称">
            <el-input v-model="searchForm.name" placeholder="请输入指导书名称" />
          </el-form-item>
          <el-form-item label="关联工序">
            <el-select v-model="searchForm.operationId" placeholder="请选择工序">
              <el-option v-for="op in operationOptions" :key="op.id" :label="op.name" :value="op.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="版本">
            <el-input v-model="searchForm.version" placeholder="请输入版本号" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态">
              <el-option label="草稿" value="draft" />
              <el-option label="已发布" value="published" />
              <el-option label="已停用" value="disabled" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="searchInstructions">搜索</el-button>
            <el-button icon="el-icon-refresh" @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 数据列表 -->
    <div class="list-section">
      <el-card>
        <div class="list-actions" style="margin-bottom: 15px;">
          <el-button 
            type="danger" 
            icon="el-icon-delete" 
            @click="batchDelete" 
            :disabled="!selectedRows.length"
          >
            批量删除
          </el-button>
          <el-button 
            icon="el-icon-document-copy" 
            @click="batchPublish" 
            :disabled="!selectedRows.length"
          >
            批量发布
          </el-button>
        </div>
        
        <el-table 
          :data="instructionsData" 
          style="width: 100%;" 
          @selection-change="handleSelectionChange"
          stripe
          border
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="code" label="指导书编号" width="150" />
          <el-table-column prop="name" label="指导书名称" width="200" />
          <el-table-column prop="operationName" label="关联工序" width="150" />
          <el-table-column prop="productName" label="关联产品" width="150" />
          <el-table-column prop="version" label="版本" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="creator" label="创建人" width="100" />
          <el-table-column prop="createdTime" label="创建时间" width="180" />
          <el-table-column prop="updatedTime" label="更新时间" width="180" />
          <el-table-column label="操作" width="180" fixed="right">
            <template slot-scope="scope">
              <el-button size="mini" @click="viewInstruction(scope.row)">查看</el-button>
              <el-button size="mini" @click="editInstruction(scope.row)">编辑</el-button>
              <el-button 
                size="mini" 
                type="danger" 
                @click="deleteInstruction(scope.row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            background
            layout="prev, pager, next, jumper, sizes, total"
            :total="total"
            :page-size="pageSize"
            :current-page="currentPage"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 指导书详情对话框 -->
    <el-dialog
      :visible.sync="detailDialogVisible"
      :title="detailDialogTitle"
      width="90%"
      append-to-body
      fullscreen
    >
      <div class="instruction-detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3>基本信息</h3>
          <el-form :model="currentInstruction" label-width="120px">
            <el-row>
              <el-col :span="8">
                <el-form-item label="指导书编号">
                  <el-input v-model="currentInstruction.code" :readonly="viewMode" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="指导书名称">
                  <el-input v-model="currentInstruction.name" :readonly="viewMode" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="版本">
                  <el-input v-model="currentInstruction.version" :readonly="viewMode" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="8">
                <el-form-item label="关联工序">
                  <el-select 
                    v-model="currentInstruction.operationId" 
                    placeholder="请选择工序"
                    :disabled="viewMode"
                  >
                    <el-option 
                      v-for="op in operationOptions" 
                      :key="op.id" 
                      :label="op.name" 
                      :value="op.id" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="关联产品">
                  <el-select 
                    v-model="currentInstruction.productId" 
                    placeholder="请选择产品"
                    :disabled="viewMode"
                  >
                    <el-option 
                      v-for="product in productOptions" 
                      :key="product.id" 
                      :label="product.name" 
                      :value="product.id" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="状态">
                  <el-select 
                    v-model="currentInstruction.status" 
                    placeholder="请选择状态"
                    :disabled="viewMode"
                  >
                    <el-option label="草稿" value="draft" />
                    <el-option label="已发布" value="published" />
                    <el-option label="已停用" value="disabled" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="适用范围">
                  <el-input 
                    type="textarea" 
                    v-model="currentInstruction.scope" 
                    :rows="2" 
                    :readonly="viewMode"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 安全注意事项 -->
        <div class="detail-section">
          <h3>安全注意事项</h3>
          <el-form :model="currentInstruction" label-width="120px">
            <el-form-item label="安全描述">
              <el-input 
                type="textarea" 
                v-model="currentInstruction.safetyNotes" 
                :rows="4" 
                :readonly="viewMode"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 操作步骤 -->
        <div class="detail-section">
          <div class="section-header">
            <h3>操作步骤</h3>
            <el-button 
              v-if="!viewMode" 
              type="primary" 
              icon="el-icon-plus" 
              @click="addStep"
            >
              添加步骤
            </el-button>
          </div>
          
          <div v-if="currentInstruction.steps && currentInstruction.steps.length">
            <div 
              v-for="(step, index) in currentInstruction.steps" 
              :key="step.id" 
              class="step-item"
            >
              <div class="step-header">
                <div class="step-number">步骤 {{ index + 1 }}</div>
                <div class="step-actions" v-if="!viewMode">
                  <el-button 
                    icon="el-icon-top" 
                    size="mini" 
                    @click="moveStepUp(index)"
                    :disabled="index === 0"
                  ></el-button>
                  <el-button 
                    icon="el-icon-bottom" 
                    size="mini" 
                    @click="moveStepDown(index)"
                    :disabled="index === currentInstruction.steps.length - 1"
                  ></el-button>
                  <el-button 
                    icon="el-icon-delete" 
                    size="mini" 
                    type="danger" 
                    @click="deleteStep(index)"
                  ></el-button>
                </div>
              </div>
              
              <el-form :model="step" label-width="100px">
                <el-form-item label="步骤名称">
                  <el-input v-model="step.name" :readonly="viewMode" />
                </el-form-item>
                <el-form-item label="操作说明">
                  <el-input 
                    type="textarea" 
                    v-model="step.description" 
                    :rows="3" 
                    :readonly="viewMode"
                  />
                </el-form-item>
                <el-form-item label="操作要点">
                  <el-input 
                    type="textarea" 
                    v-model="step.keyPoints" 
                    :rows="2" 
                    :readonly="viewMode"
                  />
                </el-form-item>
                
                <!-- 步骤图片 -->
                <el-form-item label="步骤图片">
                  <div v-if="!viewMode">
                    <el-upload
                      :action="uploadUrl"
                      list-type="picture-card"
                      :on-preview="handlePictureCardPreview"
                      :on-remove="(file, fileList) => handleStepImageRemove(file, fileList, index)"
                      :on-success="(response, file, fileList) => handleStepImageSuccess(response, file, fileList, index)"
                    >
                      <i class="el-icon-plus"></i>
                    </el-upload>
                    <el-dialog :visible.sync="dialogVisible">
                      <img width="100%" :src="dialogImageUrl" alt="预览">
                    </el-dialog>
                    <div 
                      v-if="step.images && step.images.length" 
                      class="image-list"
                    >
                      <el-image
                        v-for="(image, imgIndex) in step.images"
                        :key="imgIndex"
                        :src="image.url"
                        :preview-src-list="step.images.map(img => img.url)"
                        style="width: 100px; height: 100px; margin-right: 10px;"
                      >
                        <div slot="error" class="image-slot">
                          <i class="el-icon-picture-outline"></i>
                        </div>
                      </el-image>
                    </div>
                  </div>
                  
                  <div v-else-if="step.images && step.images.length" class="image-list">
                    <el-image
                      v-for="(image, imgIndex) in step.images"
                      :key="imgIndex"
                      :src="image.url"
                      :preview-src-list="step.images.map(img => img.url)"
                      style="width: 100px; height: 100px; margin-right: 10px;"
                    >
                      <div slot="error" class="image-slot">
                        <i class="el-icon-picture-outline"></i>
                      </div>
                    </el-image>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </div>
          
          <div v-else class="empty-steps">
            <p>暂无操作步骤，请点击上方按钮添加</p>
          </div>
        </div>

        <!-- 资源需求 -->
        <div class="detail-section">
          <div class="section-header">
            <h3>资源需求</h3>
            <el-button 
              v-if="!viewMode" 
              type="primary" 
              icon="el-icon-plus" 
              @click="addResource"
            >
              添加资源
            </el-button>
          </div>
          
          <div v-if="currentInstruction.resources && currentInstruction.resources.length">
            <el-table 
              :data="currentInstruction.resources" 
              style="width: 100%;"
              border
            >
              <el-table-column prop="type" label="资源类型" width="120">
                <template slot-scope="scope">
                  <el-select 
                    v-model="scope.row.type" 
                    placeholder="资源类型"
                    :disabled="viewMode"
                  >
                    <el-option label="人员" value="personnel" />
                    <el-option label="设备" value="equipment" />
                    <el-option label="工具" value="tool" />
                    <el-option label="物料" value="material" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="资源名称">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.name" :readonly="viewMode" />
                </template>
              </el-table-column>
              <el-table-column prop="specification" label="规格型号">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.specification" :readonly="viewMode" />
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量">
                <template slot-scope="scope">
                  <el-input-number 
                    v-model="scope.row.quantity" 
                    :min="0.1" 
                    :step="0.1"
                    :disabled="viewMode"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="unit" label="单位">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.unit" :readonly="viewMode" />
                </template>
              </el-table-column>
              <el-table-column prop="usage" label="用途说明">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.usage" :readonly="viewMode" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" v-if="!viewMode">
                <template slot-scope="scope">
                  <el-button 
                    size="mini" 
                    type="danger" 
                    @click="deleteResource(scope.$index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <div v-else class="empty-resources">
            <p>暂无资源需求，请点击上方按钮添加</p>
          </div>
        </div>

        <!-- 质量标准 -->
        <div class="detail-section">
          <h3>质量标准</h3>
          <el-form :model="currentInstruction" label-width="120px">
            <el-form-item label="检验项目">
              <el-table 
                :data="currentInstruction.qualityStandards" 
                style="width: 100%;"
                border
              >
                <el-table-column prop="item" label="检验项名称">
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.item" :readonly="viewMode" />
                  </template>
                </el-table-column>
                <el-table-column prop="standard" label="标准值">
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.standard" :readonly="viewMode" />
                  </template>
                </el-table-column>
                <el-table-column prop="tolerance" label="公差范围">
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.tolerance" :readonly="viewMode" />
                  </template>
                </el-table-column>
                <el-table-column prop="method" label="检验方法">
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.method" :readonly="viewMode" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" v-if="!viewMode">
                  <template slot-scope="scope">
                    <el-button 
                      size="mini" 
                      type="danger" 
                      @click="deleteQualityStandard(scope.$index)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-button 
                v-if="!viewMode" 
                type="text" 
                @click="addQualityStandard"
              >
                <i class="el-icon-plus"></i> 添加检验项目
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 相关文档 -->
        <div class="detail-section">
          <h3>相关文档</h3>
          <div v-if="!viewMode">
            <el-upload
              :action="uploadUrl"
              :on-success="handleDocumentSuccess"
              :on-remove="handleDocumentRemove"
              :file-list="documentList"
              :auto-upload="false"
              ref="documentUpload"
            >
              <el-button slot="trigger" type="primary">选择文件</el-button>
              <el-button 
                style="margin-left: 10px;" 
                @click="submitUpload"
              >
                上传到服务器
              </el-button>
              <div slot="tip" class="el-upload__tip">
                只能上传jpg/png/pdf/docx文件，且不超过20MB
              </div>
            </el-upload>
          </div>
          
          <el-table 
            v-if="currentInstruction.documents && currentInstruction.documents.length" 
            :data="currentInstruction.documents" 
            style="width: 100%;"
            border
          >
            <el-table-column prop="name" label="文件名称" />
            <el-table-column prop="type" label="文件类型" width="100" />
            <el-table-column prop="size" label="文件大小" width="100">
              <template slot-scope="scope">
                {{ formatFileSize(scope.row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="uploadTime" label="上传时间" width="180" />
            <el-table-column label="操作" width="150">
              <template slot-scope="scope">
                <el-button 
                  size="mini" 
                  @click="downloadDocument(scope.row)"
                >
                  下载
                </el-button>
                <el-button 
                  v-if="!viewMode" 
                  size="mini" 
                  type="danger" 
                  @click="removeDocument(scope.row.id)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer" v-if="!viewMode">
        <el-button @click="detailDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveInstruction">保存</el-button>
        <el-button type="success" @click="publishInstruction">发布</el-button>
      </span>
      
      <span slot="footer" class="dialog-footer" v-else>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import { Message, Notification } from 'element-ui'

export default {
  name: 'WorkInstruction',
  data() {
    return {
      // 搜索表单
      searchForm: {
        code: '',
        name: '',
        operationId: '',
        version: '',
        status: ''
      },
      
      // 分页信息
      currentPage: 1,
      pageSize: 10,
      total: 0,
      
      // 指导书列表数据
      instructions: [],
      
      // 选中的行
      selectedRows: [],
      
      // 详情对话框
      detailDialogVisible: false,
      detailDialogTitle: '',
      viewMode: false,
      
      // 当前指导书
      currentInstruction: {
        id: '',
        code: '',
        name: '',
        operationId: '',
        operationName: '',
        productId: '',
        productName: '',
        version: '1.0.0',
        status: 'draft',
        scope: '',
        safetyNotes: '',
        steps: [],
        resources: [],
        qualityStandards: [],
        documents: [],
        creator: '',
        createdTime: '',
        updatedTime: ''
      },
      
      // 上传相关
      uploadUrl: '/api/upload', // 模拟上传地址
      dialogVisible: false,
      dialogImageUrl: '',
      documentList: [],
      
      // 选项数据
      operationOptions: [],
      productOptions: []
    }
  },
  
  computed: {
    // 分页后的数据
    instructionsData() {
      return this.instructions.slice(
        (this.currentPage - 1) * this.pageSize,
        this.currentPage * this.pageSize
      )
    }
  },
  
  mounted() {
    this.initData()
    this.loadInstructions()
  },
  
  methods: {
    // 初始化数据
    async initData() {
      // 模拟获取选项数据
      this.operationOptions = this.getMockOperationOptions()
      this.productOptions = this.getMockProductOptions()
    },
    
    // 加载指导书列表
    async loadInstructions() {
      try {
        // 模拟加载数据
        setTimeout(() => {
          this.instructions = this.getMockInstructions()
          this.total = this.instructions.length
        }, 500)
      } catch (error) {
        Message.error('加载指导书失败: ' + error.message)
      }
    },
    
    // 搜索指导书
    searchInstructions() {
      // 模拟搜索
      this.currentPage = 1
      this.loadInstructions()
      Message.success('搜索完成')
    },
    
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        code: '',
        name: '',
        operationId: '',
        version: '',
        status: ''
      }
      this.loadInstructions()
    },
    
    // 处理选择变更
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    
    // 分页大小变更
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    },
    
    // 当前页变更
    handleCurrentChange(current) {
      this.currentPage = current
    },
    
    // 创建指导书
    createInstruction() {
      this.viewMode = false
      this.detailDialogTitle = '创建工作指导书'
      this.currentInstruction = {
        id: '',
        code: this.generateInstructionCode(),
        name: '',
        operationId: '',
        operationName: '',
        productId: '',
        productName: '',
        version: '1.0.0',
        status: 'draft',
        scope: '',
        safetyNotes: '',
        steps: [],
        resources: [],
        qualityStandards: [],
        documents: [],
        creator: '当前用户',
        createdTime: new Date().toLocaleString(),
        updatedTime: new Date().toLocaleString()
      }
      this.documentList = []
      this.detailDialogVisible = true
    },
    
    // 生成指导书编号
    generateInstructionCode() {
      const timestamp = Date.now().toString().slice(-6)
      return `WI-${timestamp}`
    },
    
    // 查看指导书
    viewInstruction(instruction) {
      this.viewMode = true
      this.detailDialogTitle = '查看工作指导书'
      this.currentInstruction = JSON.parse(JSON.stringify(instruction))
      this.detailDialogVisible = true
    },
    
    // 编辑指导书
    editInstruction(instruction) {
      this.viewMode = false
      this.detailDialogTitle = '编辑工作指导书'
      this.currentInstruction = JSON.parse(JSON.stringify(instruction))
      this.documentList = this.currentInstruction.documents.map(doc => ({
        name: doc.name,
        url: doc.url
      }))
      this.detailDialogVisible = true
    },
    
    // 保存指导书
    async saveInstruction() {
      try {
        // 验证数据
        if (!this.currentInstruction.name) {
          Message.error('请输入指导书名称')
          return
        }
        
        // 更新关联名称
        const operation = this.operationOptions.find(op => op.id === this.currentInstruction.operationId)
        if (operation) {
          this.currentInstruction.operationName = operation.name
        }
        
        const product = this.productOptions.find(p => p.id === this.currentInstruction.productId)
        if (product) {
          this.currentInstruction.productName = product.name
        }
        
        // 更新时间
        this.currentInstruction.updatedTime = new Date().toLocaleString()
        
        // 模拟保存操作
        setTimeout(() => {
          if (this.currentInstruction.id) {
            // 更新现有指导书
            const index = this.instructions.findIndex(ins => ins.id === this.currentInstruction.id)
            if (index !== -1) {
              this.instructions[index] = JSON.parse(JSON.stringify(this.currentInstruction))
            }
          } else {
            // 添加新指导书
            this.currentInstruction.id = `instruction-${Date.now()}`
            this.instructions.unshift(JSON.parse(JSON.stringify(this.currentInstruction)))
            this.total++
          }
          
          this.detailDialogVisible = false
          Message.success('保存成功')
        }, 500)
      } catch (error) {
        Message.error('保存失败: ' + error.message)
      }
    },
    
    // 发布指导书
    async publishInstruction() {
      this.$confirm('确定要发布此工作指导书吗？发布后将不能随意修改。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.currentInstruction.status = 'published'
        this.currentInstruction.updatedTime = new Date().toLocaleString()
        
        // 模拟发布操作
        setTimeout(() => {
          if (this.currentInstruction.id) {
            const index = this.instructions.findIndex(ins => ins.id === this.currentInstruction.id)
            if (index !== -1) {
              this.instructions[index] = JSON.parse(JSON.stringify(this.currentInstruction))
            }
          }
          
          this.detailDialogVisible = false
          Message.success('发布成功')
        }, 500)
      }).catch(() => {
        // 取消发布
      })
    },
    
    // 删除指导书
    deleteInstruction(instructionId) {
      this.$confirm('确定要删除该工作指导书吗？此操作不可撤销。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        setTimeout(() => {
          this.instructions = this.instructions.filter(ins => ins.id !== instructionId)
          this.total--
          Message.success('删除成功')
        }, 500)
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 批量删除
    batchDelete() {
      if (!this.selectedRows.length) {
        Message.warning('请选择要删除的指导书')
        return
      }
      
      this.$confirm(`确定要删除选中的${this.selectedRows.length}个工作指导书吗？此操作不可撤销。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const idsToDelete = this.selectedRows.map(row => row.id)
        
        // 模拟批量删除操作
        setTimeout(() => {
          this.instructions = this.instructions.filter(ins => !idsToDelete.includes(ins.id))
          this.total = this.instructions.length
          this.selectedRows = []
          Message.success('批量删除成功')
        }, 500)
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 批量发布
    batchPublish() {
      if (!this.selectedRows.length) {
        Message.warning('请选择要发布的指导书')
        return
      }
      
      this.$confirm(`确定要发布选中的${this.selectedRows.length}个工作指导书吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const idsToPublish = this.selectedRows.map(row => row.id)
        
        // 模拟批量发布操作
        setTimeout(() => {
          this.instructions.forEach(ins => {
            if (idsToPublish.includes(ins.id)) {
              ins.status = 'published'
              ins.updatedTime = new Date().toLocaleString()
            }
          })
          this.selectedRows = []
          Message.success('批量发布成功')
        }, 500)
      }).catch(() => {
        // 取消发布
      })
    },
    
    // 导入指导书
    importInstruction() {
      Message.info('导入功能待实现')
    },
    
    // 导出指导书
    exportInstructions() {
      if (!this.instructions.length) {
        Message.error('没有数据可导出')
        return
      }
      
      Message.success('导出成功')
    },
    
    // 添加步骤
    addStep() {
      if (!this.currentInstruction.steps) {
        this.currentInstruction.steps = []
      }
      
      this.currentInstruction.steps.push({
        id: `step-${Date.now()}`,
        name: '',
        description: '',
        keyPoints: '',
        images: []
      })
    },
    
    // 删除步骤
    deleteStep(index) {
      this.$confirm('确定要删除该步骤吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.currentInstruction.steps.splice(index, 1)
        Message.success('删除成功')
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 上移步骤
    moveStepUp(index) {
      if (index > 0) {
        const temp = this.currentInstruction.steps[index]
        this.currentInstruction.steps[index] = this.currentInstruction.steps[index - 1]
        this.currentInstruction.steps[index - 1] = temp
      }
    },
    
    // 下移步骤
    moveStepDown(index) {
      if (index < this.currentInstruction.steps.length - 1) {
        const temp = this.currentInstruction.steps[index]
        this.currentInstruction.steps[index] = this.currentInstruction.steps[index + 1]
        this.currentInstruction.steps[index + 1] = temp
      }
    },
    
    // 处理图片预览
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url || file.preview
      this.dialogVisible = true
    },
    
    // 处理步骤图片删除
    handleStepImageRemove(file, fileList, stepIndex) {
      if (this.currentInstruction.steps[stepIndex].images) {
        this.currentInstruction.steps[stepIndex].images = this.currentInstruction.steps[stepIndex].images.filter(
          img => img.url !== file.url && img.url !== file.preview
        )
      }
    },
    
    // 处理步骤图片上传成功
    handleStepImageSuccess(response, file, fileList, stepIndex) {
      // 模拟上传成功
      const imageUrl = URL.createObjectURL(file.raw)
      if (!this.currentInstruction.steps[stepIndex].images) {
        this.currentInstruction.steps[stepIndex].images = []
      }
      this.currentInstruction.steps[stepIndex].images.push({
        id: `image-${Date.now()}`,
        url: imageUrl,
        name: file.name,
        uploadTime: new Date().toLocaleString()
      })
    },
    
    // 添加资源
    addResource() {
      if (!this.currentInstruction.resources) {
        this.currentInstruction.resources = []
      }
      
      this.currentInstruction.resources.push({
        id: `resource-${Date.now()}`,
        type: 'personnel',
        name: '',
        specification: '',
        quantity: 1,
        unit: '',
        usage: ''
      })
    },
    
    // 删除资源
    deleteResource(index) {
      this.$confirm('确定要删除该资源吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.currentInstruction.resources.splice(index, 1)
        Message.success('删除成功')
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 添加质量标准
    addQualityStandard() {
      if (!this.currentInstruction.qualityStandards) {
        this.currentInstruction.qualityStandards = []
      }
      
      this.currentInstruction.qualityStandards.push({
        id: `standard-${Date.now()}`,
        item: '',
        standard: '',
        tolerance: '',
        method: ''
      })
    },
    
    // 删除质量标准
    deleteQualityStandard(index) {
      this.$confirm('确定要删除该检验项目吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.currentInstruction.qualityStandards.splice(index, 1)
        Message.success('删除成功')
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 提交文件上传
    submitUpload() {
      this.$refs.documentUpload.submit()
    },
    
    // 处理文档上传成功
    handleDocumentSuccess(response, file, fileList) {
      // 模拟上传成功
      if (!this.currentInstruction.documents) {
        this.currentInstruction.documents = []
      }
      this.currentInstruction.documents.push({
        id: `doc-${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file.raw),
        uploadTime: new Date().toLocaleString()
      })
      Message.success('文件上传成功')
    },
    
    // 处理文档删除
    handleDocumentRemove(file, fileList) {
      // 从显示列表中移除，但不从currentInstruction.documents中移除
      // 真正的删除在removeDocument方法中
    },
    
    // 删除文档
    removeDocument(documentId) {
      this.$confirm('确定要删除该文档吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.currentInstruction.documents = this.currentInstruction.documents.filter(
          doc => doc.id !== documentId
        )
        Message.success('删除成功')
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 下载文档
    downloadDocument(document) {
      Message.success('开始下载文件: ' + document.name)
      // 实际项目中这里应该调用后端API下载文件
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        draft: '草稿',
        published: '已发布',
        disabled: '已停用'
      }
      return statusMap[status] || status
    },
    
    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        draft: 'info',
        published: 'success',
        disabled: 'danger'
      }
      return typeMap[status] || 'info'
    },
    
    // 模拟数据 - 工序选项
    getMockOperationOptions() {
      return [
        { id: 'op-001', name: '备料' },
        { id: 'op-002', name: '粗加工' },
        { id: 'op-003', name: '热处理' },
        { id: 'op-004', name: '精加工' },
        { id: 'op-005', name: '检验' }
      ]
    },
    
    // 模拟数据 - 产品选项
    getMockProductOptions() {
      return [
        { id: 'product-001', name: '产品A' },
        { id: 'product-002', name: '产品B' },
        { id: 'product-003', name: '产品C' },
        { id: 'product-004', name: '产品D' }
      ]
    },
    
    // 模拟数据 - 指导书列表
    getMockInstructions() {
      return [
        {
          id: 'instruction-001',
          code: 'WI-123456',
          name: '备料工序指导书',
          operationId: 'op-001',
          operationName: '备料',
          productId: 'product-001',
          productName: '产品A',
          version: '1.0.0',
          status: 'published',
          scope: '适用于所有产品的备料工序',
          safetyNotes: '1. 操作前检查设备状态\n2. 佩戴必要的防护装备\n3. 严格按照操作规程进行',
          steps: [
            {
              id: 'step-001',
              name: '准备原材料',
              description: '根据生产计划领取所需原材料',
              keyPoints: '确认材料规格和数量',
              images: []
            },
            {
              id: 'step-002',
              name: '材料切割',
              description: '使用切割机将材料切割成所需尺寸',
              keyPoints: '控制切割精度在±0.5mm',
              images: []
            }
          ],
          resources: [
            {
              id: 'resource-001',
              type: 'equipment',
              name: '切割机',
              specification: 'CG-500',
              quantity: 1,
              unit: '台',
              usage: '材料切割'
            },
            {
              id: 'resource-002',
              type: 'tool',
              name: '卷尺',
              specification: '5m',
              quantity: 2,
              unit: '把',
              usage: '尺寸测量'
            }
          ],
          qualityStandards: [
            {
              id: 'standard-001',
              item: '材料尺寸',
              standard: '根据图纸要求',
              tolerance: '±0.5mm',
              method: '使用卷尺测量'
            }
          ],
          documents: [
            {
              id: 'doc-001',
              name: '材料规格书.pdf',
              type: 'application/pdf',
              size: 1024 * 1024,
              url: '',
              uploadTime: '2024-01-01 10:00:00'
            }
          ],
          creator: '张三',
          createdTime: '2024-01-01 09:00:00',
          updatedTime: '2024-01-01 11:00:00'
        },
        {
          id: 'instruction-002',
          code: 'WI-234567',
          name: '粗加工工序指导书',
          operationId: 'op-002',
          operationName: '粗加工',
          productId: 'product-001',
          productName: '产品A',
          version: '1.0.0',
          status: 'draft',
          scope: '适用于产品A的粗加工工序',
          safetyNotes: '1. 操作机床时注意安全\n2. 定期检查刀具磨损情况',
          steps: [],
          resources: [],
          qualityStandards: [],
          documents: [],
          creator: '李四',
          createdTime: '2024-01-02 14:00:00',
          updatedTime: '2024-01-02 14:30:00'
        },
        {
          id: 'instruction-003',
          code: 'WI-345678',
          name: '热处理工序指导书',
          operationId: 'op-003',
          operationName: '热处理',
          productId: 'product-002',
          productName: '产品B',
          version: '1.1.0',
          status: 'published',
          scope: '适用于产品B的热处理工序',
          safetyNotes: '1. 热处理炉操作必须由专人负责\n2. 严格控制温度和时间\n3. 佩戴高温防护装备',
          steps: [
            {
              id: 'step-003',
              name: '装炉',
              description: '将零件放入热处理炉中',
              keyPoints: '确保零件之间有足够间隙',
              images: []
            },
            {
              id: 'step-004',
              name: '升温',
              description: '按照工艺要求升温至指定温度',
              keyPoints: '控制升温速度不超过200℃/h',
              images: []
            }
          ],
          resources: [
            {
              id: 'resource-003',
              type: 'equipment',
              name: '热处理炉',
              specification: 'RT-1200',
              quantity: 1,
              unit: '台',
              usage: '零件热处理'
            }
          ],
          qualityStandards: [
            {
              id: 'standard-002',
              item: '硬度',
              standard: 'HRC 45-50',
              tolerance: '±1HRC',
              method: '使用硬度计测量'
            }
          ],
          documents: [],
          creator: '王五',
          createdTime: '2024-01-03 08:00:00',
          updatedTime: '2024-01-03 16:00:00'
        }
      ]
    }
  }
}
</script>

<style scoped>
.work-instruction-container {
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

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-section,
.list-section {
  margin-bottom: 20px;
}

.list-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 指导书详情样式 */
.instruction-detail {
  padding: 20px;
}

.detail-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.detail-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

.section-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

/* 步骤样式 */
.step-item {
  margin-bottom: 25px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.step-number {
  font-weight: bold;
  font-size: 16px;
  color: #409eff;
}

.step-actions {
  display: flex;
  gap: 5px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
}

.empty-steps,
.empty-resources {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  background-color: #f5f7fa;
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .header-actions {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .work-instruction-container {
    padding: 10px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .step-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .detail-section {
    padding: 15px;
  }
  
  .instruction-detail {
    padding: 10px;
  }
}
</style>