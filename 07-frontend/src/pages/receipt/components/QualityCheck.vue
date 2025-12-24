<template>
  <div class="quality-check">
    <!-- 检验项目表格 -->
    <el-card class="mb20">
      <div slot="header" class="clearfix">
        <span class="font-bold">检验项目明细</span>
        <div class="el-card-header-btn" style="line-height: initial;">
          <el-button type="primary" size="small" @click="handleAddItem" icon="el-icon-plus">添加检验项</el-button>
          <el-button type="success" size="small" @click="handleBatchCheck" icon="el-icon-s-opportunity">批量检验</el-button>
        </div>
      </div>
      
      <!-- 检验模式切换 -->
      <div class="mb16">
        <el-radio-group v-model="checkMode" size="small">
          <el-radio-button label="normal">逐项检验</el-radio-button>
          <el-radio-button label="sample">抽样检验</el-radio-button>
        </el-radio-group>
        
        <div v-if="checkMode === 'sample'" class="mt8">
          <el-form :inline="true">
            <el-form-item label="样本量">
              <el-input-number v-model="sampleSize" :min="1" :max="totalItems" size="small"></el-input-number>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" @click="generateSamples">生成样本</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <!-- 检验项目表格 -->
      <el-table
        v-loading="loading"
        :data="checkItems"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        
        <el-table-column prop="itemNo" label="检验序号" width="100" type="index" align="center">
          <template slot-scope="scope">
            <div>
              {{ scope.$index + 1 }}
              <el-tag v-if="scope.row.isSample" size="mini" type="primary" effect="plain" class="ml8">样本</el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="inspectionItem" label="检验项目" min-width="150"></el-table-column>
        
        <el-table-column prop="standard" label="检验标准" min-width="200"></el-table-column>
        
        <el-table-column prop="testMethod" label="检验方法" min-width="120"></el-table-column>
        
        <el-table-column prop="specValue" label="规格值" min-width="100"></el-table-column>
        
        <el-table-column prop="actualValue" label="实测值" min-width="120">
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.actualValue"
              size="small"
              @change="handleActualValueChange(scope.row)"
              placeholder="请输入实测值"
            ></el-input>
          </template>
        </el-table-column>
        
        <el-table-column prop="unit" label="单位" width="80"></el-table-column>
        
        <el-table-column prop="result" label="检验结果" width="100">
          <template slot-scope="scope">
            <el-radio-group v-model="scope.row.result" size="small" @change="handleResultChange(scope.row)">
              <el-radio label="合格" border></el-radio>
              <el-radio label="不合格" border></el-radio>
            </el-radio-group>
          </template>
        </el-table-column>
        
        <el-table-column prop="defectDescription" label="不合格描述" min-width="150">
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.defectDescription"
              type="textarea"
              :rows="1"
              size="small"
              placeholder="请输入不合格描述"
              @change="handleDescriptionChange(scope.row)"
            ></el-input>
          </template>
        </el-table-column>
        
        <el-table-column prop="inspector" label="检验人" width="100"></el-table-column>
        
        <el-table-column prop="inspectionTime" label="检验时间" width="160"></el-table-column>
        
        <el-table-column prop="images" label="检验图片" width="120">
          <template slot-scope="scope">
            <el-button
              type="primary"
              size="small"
              icon="el-icon-picture"
              @click="handleUploadImages(scope.row)"
            >
              上传
            </el-button>
            <el-popover
              v-if="scope.row.imageList && scope.row.imageList.length > 0"
              placement="top-start"
              trigger="hover"
            >
              <div class="image-preview">
                <img
                  v-for="(img, index) in scope.row.imageList"
                  :key="index"
                  :src="img.url"
                  @click="previewImage(img.url)"
                  alt="检验图片"
                >
              </div>
              <span slot="reference" class="image-count">{{ scope.row.imageList.length }}张</span>
            </el-popover>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button type="primary" size="small" @click="handleEditItem(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDeleteItem(scope.row)" :disabled="scope.row.isSampled">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 检验统计信息 -->
      <div class="mt16 mb8 stats-info">
        <el-row>
          <el-col :span="6">
            <div class="stat-item">
              <span class="label">检验总数：</span>
              <span class="value">{{ totalCount }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <span class="label">合格数：</span>
              <span class="value success">{{ qualifiedCount }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <span class="label">不合格数：</span>
              <span class="value danger">{{ unqualifiedCount }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <span class="label">合格率：</span>
              <span class="value">{{ passRate }}%</span>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
    
    <!-- 质量判定区域 -->
    <el-card>
      <div slot="header" class="clearfix">
        <span class="font-bold">质量判定</span>
      </div>
      
      <el-form :model="judgmentForm" label-width="120px" class="judgment-form">
        <el-form-item label="质量等级">
          <el-select v-model="judgmentForm.qualityLevel" placeholder="请选择质量等级">
            <el-option label="优等品" value="excellent"></el-option>
            <el-option label="一等品" value="firstClass"></el-option>
            <el-option label="合格品" value="qualified"></el-option>
            <el-option label="不合格品" value="unqualified"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="判定结论">
          <el-radio-group v-model="judgmentForm.conclusion">
            <el-radio label="合格" border></el-radio>
            <el-radio label="不合格" border></el-radio>
            <el-radio label="返工处理" border></el-radio>
            <el-radio label="让步接收" border></el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="处理建议" prop="suggestion">
          <el-input
            v-model="judgmentForm.suggestion"
            type="textarea"
            :rows="3"
            placeholder="请输入处理建议"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="检验员意见" prop="inspectorComment">
          <el-input
            v-model="judgmentForm.inspectorComment"
            type="textarea"
            :rows="2"
            placeholder="请输入检验员意见"
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="saveQualityJudgment" :loading="saving">保存判定</el-button>
          <el-button @click="resetJudgmentForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 添加/编辑检验项对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="itemDialogVisible"
      width="60%"
      :close-on-click-modal="false"
    >
      <el-form :model="itemForm" :rules="itemFormRules" ref="itemForm" label-width="120px">
        <el-form-item label="检验项目" prop="inspectionItem">
          <el-input v-model="itemForm.inspectionItem" placeholder="请输入检验项目"></el-input>
        </el-form-item>
        
        <el-form-item label="检验标准" prop="standard">
          <el-input v-model="itemForm.standard" type="textarea" :rows="2" placeholder="请输入检验标准"></el-input>
        </el-form-item>
        
        <el-form-item label="检验方法" prop="testMethod">
          <el-input v-model="itemForm.testMethod" placeholder="请输入检验方法"></el-input>
        </el-form-item>
        
        <el-form-item label="规格值" prop="specValue">
          <el-input v-model="itemForm.specValue" placeholder="请输入规格值"></el-input>
        </el-form-item>
        
        <el-form-item label="单位" prop="unit">
          <el-input v-model="itemForm.unit" placeholder="请输入单位"></el-input>
        </el-form-item>
        
        <el-form-item label="检验结果">
          <el-radio-group v-model="itemForm.result">
            <el-radio label="合格"></el-radio>
            <el-radio label="不合格"></el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="不合格描述">
          <el-input
            v-model="itemForm.defectDescription"
            type="textarea"
            :rows="2"
            placeholder="请输入不合格描述"
          ></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveItem">保存</el-button>
      </div>
    </el-dialog>
    
    <!-- 批量检验对话框 -->
    <el-dialog
      title="批量检验"
      :visible.sync="batchCheckDialogVisible"
      width="50%"
      :close-on-click-modal="false"
    >
      <el-form :model="batchCheckForm" label-width="100px">
        <el-form-item label="检验结果">
          <el-radio-group v-model="batchCheckForm.result">
            <el-radio label="合格"></el-radio>
            <el-radio label="不合格"></el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="检验人">
          <el-input v-model="batchCheckForm.inspector" placeholder="请输入检验人"></el-input>
        </el-form-item>
        
        <el-form-item label="不合格描述" v-if="batchCheckForm.result === '不合格'">
          <el-input
            v-model="batchCheckForm.defectDescription"
            type="textarea"
            :rows="2"
            placeholder="请输入不合格描述"
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="batchCheckForm.includeImages">同时上传检验图片</el-checkbox>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="batchCheckDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchCheck">确认批量检验</el-button>
      </div>
    </el-dialog>
    
    <!-- 图片上传对话框 -->
    <el-dialog
      title="上传检验图片"
      :visible.sync="uploadDialogVisible"
      width="60%"
      :close-on-click-modal="false"
    >
      <div class="upload-container">
        <el-upload
          :action="uploadUrl"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :file-list="currentImageList"
          :limit="10"
          list-type="picture-card"
          multiple
        >
          <i class="el-icon-plus"></i>
          <div class="el-upload__text">点击或拖拽文件到此处上传</div>
        </el-upload>
        
        <el-dialog
          title="预览图片"
          :visible.sync="previewDialogVisible"
          width="50%"
        >
          <img :src="previewImageUrl" class="preview-img" alt="预览图片">
        </el-dialog>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="uploadDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { format } from 'date-fns'

export default {
  name: 'QualityCheck',
  props: {
    // 接收父组件传递的产品信息
    productInfo: {
      type: Object,
      default: () => ({})
    },
    // 接收父组件传递的检验项数据
    initialCheckItems: {
      type: Array,
      default: () => []
    },
    // 是否可编辑
    editable: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      // 加载状态
      loading: false,
      saving: false,
      
      // 检验模式
      checkMode: 'normal', // normal: 逐项检验, sample: 抽样检验
      sampleSize: 1,
      
      // 检验项目列表
      checkItems: [],
      
      // 选中的检验项
      selectedItems: [],
      
      // 添加/编辑对话框
      itemDialogVisible: false,
      dialogTitle: '添加检验项',
      itemForm: {
        inspectionItem: '',
        standard: '',
        testMethod: '',
        specValue: '',
        unit: '',
        result: '',
        defectDescription: '',
        actualValue: '',
        inspector: '',
        inspectionTime: '',
        imageList: []
      },
      
      // 表单验证规则
      itemFormRules: {
        inspectionItem: [
          { required: true, message: '请输入检验项目', trigger: 'blur' }
        ],
        standard: [
          { required: true, message: '请输入检验标准', trigger: 'blur' }
        ],
        testMethod: [
          { required: true, message: '请输入检验方法', trigger: 'blur' }
        ]
      },
      
      // 批量检验对话框
      batchCheckDialogVisible: false,
      batchCheckForm: {
        result: '合格',
        inspector: '',
        defectDescription: '',
        includeImages: false
      },
      
      // 图片上传相关
      uploadDialogVisible: false,
      currentImageItem: null,
      currentImageList: [],
      previewDialogVisible: false,
      previewImageUrl: '',
      uploadUrl: '/api/upload/image', // 模拟上传接口
      
      // 质量判定表单
      judgmentForm: {
        qualityLevel: '',
        conclusion: '',
        suggestion: '',
        inspectorComment: ''
      }
    }
  },
  computed: {
    // 检验项总数
    totalItems() {
      return this.checkItems.length
    },
    
    // 统计数据
    totalCount() {
      return this.checkItems.filter(item => item.result).length
    },
    
    qualifiedCount() {
      return this.checkItems.filter(item => item.result === '合格').length
    },
    
    unqualifiedCount() {
      return this.checkItems.filter(item => item.result === '不合格').length
    },
    
    passRate() {
      if (this.totalCount === 0) return '0'
      return ((this.qualifiedCount / this.totalCount) * 100).toFixed(2)
    }
  },
  watch: {
    // 监听初始检验项变化
    initialCheckItems: {
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.checkItems = JSON.parse(JSON.stringify(newVal))
        }
      },
      immediate: true
    }
  },
  created() {
    // 初始化检验项数据
    this.initializeCheckItems()
  },
  methods: {
    // 初始化检验项数据
    initializeCheckItems() {
      if (this.initialCheckItems && this.initialCheckItems.length > 0) {
        this.checkItems = JSON.parse(JSON.stringify(this.initialCheckItems))
      } else {
        // 如果没有初始数据，提供一些示例检验项
        this.checkItems = [
          {
            id: '1',
            inspectionItem: '外观检查',
            standard: '无变形、无划痕、无损伤',
            testMethod: '目视检查',
            specValue: '符合要求',
            unit: '',
            actualValue: '',
            result: '',
            defectDescription: '',
            inspector: '张三',
            inspectionTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            imageList: [],
            isSample: false
          },
          {
            id: '2',
            inspectionItem: '尺寸测量',
            standard: '符合图纸要求',
            testMethod: '游标卡尺测量',
            specValue: '100±0.1mm',
            unit: 'mm',
            actualValue: '',
            result: '',
            defectDescription: '',
            inspector: '张三',
            inspectionTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            imageList: [],
            isSample: false
          },
          {
            id: '3',
            inspectionItem: '材质检验',
            standard: '符合材质要求',
            testMethod: '光谱分析',
            specValue: '不锈钢304',
            unit: '',
            actualValue: '',
            result: '',
            defectDescription: '',
            inspector: '张三',
            inspectionTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            imageList: [],
            isSample: false
          }
        ]
      }
    },
    
    // 添加检验项
    handleAddItem() {
      this.dialogTitle = '添加检验项'
      this.itemForm = {
        id: Date.now().toString(),
        inspectionItem: '',
        standard: '',
        testMethod: '',
        specValue: '',
        unit: '',
        actualValue: '',
        result: '',
        defectDescription: '',
        inspector: '',
        inspectionTime: '',
        imageList: [],
        isSample: false
      }
      this.itemDialogVisible = true
    },
    
    // 编辑检验项
    handleEditItem(row) {
      this.dialogTitle = '编辑检验项'
      this.itemForm = JSON.parse(JSON.stringify(row))
      this.itemDialogVisible = true
    },
    
    // 保存检验项
    handleSaveItem() {
      this.$refs.itemForm.validate((valid) => {
        if (valid) {
          const index = this.checkItems.findIndex(item => item.id === this.itemForm.id)
          
          if (index > -1) {
            // 编辑现有检验项
            this.checkItems.splice(index, 1, this.itemForm)
            this.$message.success('检验项更新成功')
          } else {
            // 添加新检验项
            this.checkItems.push(this.itemForm)
            this.$message.success('检验项添加成功')
          }
          
          this.itemDialogVisible = false
          this.notifyParent()
        }
      })
    },
    
    // 删除检验项
    handleDeleteItem(row) {
      this.$confirm(`确定要删除检验项"${row.inspectionItem}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.checkItems.findIndex(item => item.id === row.id)
        if (index > -1) {
          this.checkItems.splice(index, 1)
          this.$message.success('检验项删除成功')
          this.notifyParent()
        }
      }).catch(() => {})
    },
    
    // 选择检验项
    handleSelectionChange(selection) {
      this.selectedItems = selection
    },
    
    // 实测值变化
    handleActualValueChange(row) {
      this.notifyParent()
    },
    
    // 检验结果变化
    handleResultChange(row) {
      // 设置检验时间和检验人
      row.inspectionTime = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      row.inspector = this.$store.state.userInfo?.username || '默认检验员'
      
      // 如果是不合格，清空不合格描述
      if (row.result !== '不合格') {
        row.defectDescription = ''
      }
      
      this.notifyParent()
    },
    
    // 不合格描述变化
    handleDescriptionChange(row) {
      this.notifyParent()
    },
    
    // 批量检验
    handleBatchCheck() {
      if (this.selectedItems.length === 0) {
        this.$message.warning('请选择要批量检验的项目')
        return
      }
      
      this.batchCheckDialogVisible = true
    },
    
    // 确认批量检验
    confirmBatchCheck() {
      const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      
      this.selectedItems.forEach(item => {
        const targetItem = this.checkItems.find(i => i.id === item.id)
        if (targetItem) {
          targetItem.result = this.batchCheckForm.result
          targetItem.inspector = this.batchCheckForm.inspector || this.$store.state.userInfo?.username || '默认检验员'
          targetItem.inspectionTime = now
          
          if (this.batchCheckForm.result === '不合格') {
            targetItem.defectDescription = this.batchCheckForm.defectDescription
          } else {
            targetItem.defectDescription = ''
          }
        }
      })
      
      this.batchCheckDialogVisible = false
      this.$message.success(`成功批量处理${this.selectedItems.length}个检验项`)
      this.selectedItems = []
      this.notifyParent()
    },
    
    // 生成样本（抽样检验）
    generateSamples() {
      if (this.sampleSize > this.totalItems) {
        this.$message.warning('样本量不能大于检验项总数')
        return
      }
      
      // 重置所有样本标记
      this.checkItems.forEach(item => {
        item.isSample = false
      })
      
      // 随机选择样本
      const shuffled = [...this.checkItems].sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, this.sampleSize)
      
      selected.forEach(item => {
        const targetItem = this.checkItems.find(i => i.id === item.id)
        if (targetItem) {
          targetItem.isSample = true
        }
      })
      
      this.$message.success(`成功生成${this.sampleSize}个样本检验项`)
    },
    
    // 上传检验图片
    handleUploadImages(row) {
      this.currentImageItem = row
      this.currentImageList = row.imageList || []
      this.uploadDialogVisible = true
    },
    
    // 图片上传成功
    handleUploadSuccess(response, file, fileList) {
      // 模拟上传成功，实际应该使用response中的URL
      const mockUrl = URL.createObjectURL(file.raw)
      const newImage = {
        name: file.name,
        url: mockUrl,
        size: file.size,
        uploadTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      }
      
      this.currentImageList.push(newImage)
      
      if (this.currentImageItem) {
        this.currentImageItem.imageList = this.currentImageList
        this.notifyParent()
      }
    },
    
    // 图片上传失败
    handleUploadError(error, file, fileList) {
      this.$message.error('图片上传失败')
    },
    
    // 预览图片
    previewImage(url) {
      this.previewImageUrl = url
      this.previewDialogVisible = true
    },
    
    // 保存质量判定
    saveQualityJudgment() {
      this.saving = true
      
      // 模拟保存操作
      setTimeout(() => {
        this.saving = false
        this.$message.success('质量判定保存成功')
        this.notifyParent()
      }, 500)
    },
    
    // 重置判定表单
    resetJudgmentForm() {
      this.judgmentForm = {
        qualityLevel: '',
        conclusion: '',
        suggestion: '',
        inspectorComment: ''
      }
    },
    
    // 通知父组件数据变化
    notifyParent() {
      this.$emit('update:checkItems', this.checkItems)
      this.$emit('update:judgment', this.judgmentForm)
      this.$emit('dataChange', {
        checkItems: this.checkItems,
        judgment: this.judgmentForm,
        statistics: {
          totalCount: this.totalCount,
          qualifiedCount: this.qualifiedCount,
          unqualifiedCount: this.unqualifiedCount,
          passRate: this.passRate
        }
      })
    },
    
    // 获取检验数据（供父组件调用）
    getCheckData() {
      return {
        checkItems: this.checkItems,
        judgment: this.judgmentForm,
        checkMode: this.checkMode,
        sampleSize: this.sampleSize,
        statistics: {
          totalCount: this.totalCount,
          qualifiedCount: this.qualifiedCount,
          unqualifiedCount: this.unqualifiedCount,
          passRate: this.passRate
        }
      }
    },
    
    // 清空所有检验数据
    clearAllData() {
      this.checkItems = []
      this.judgmentForm = {
        qualityLevel: '',
        conclusion: '',
        suggestion: '',
        inspectorComment: ''
      }
      this.notifyParent()
    }
  }
}
</script>

<style scoped>
.quality-check {
  font-size: 14px;
}

.mb20 {
  margin-bottom: 20px;
}

.mb16 {
  margin-bottom: 16px;
}

.mt16 {
  margin-top: 16px;
}

.mt8 {
  margin-top: 8px;
}

.mb8 {
  margin-bottom: 8px;
}

.font-bold {
  font-weight: bold;
  font-size: 16px;
}

.stats-info {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}

.stat-item {
  display: inline-block;
  margin-right: 24px;
}

.stat-item .label {
  color: #606266;
  margin-right: 8px;
}

.stat-item .value {
  font-weight: bold;
  font-size: 16px;
}

.stat-item .value.success {
  color: #67c23a;
}

.stat-item .value.danger {
  color: #f56c6c;
}

.judgment-form {
  margin-top: 16px;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 400px;
}

.image-preview img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.image-count {
  margin-left: 8px;
  color: #67c23a;
  font-weight: bold;
}

.upload-container {
  margin-bottom: 20px;
}

.preview-img {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
}
</style>