<template>
  <div class="document-share-container">
    <h2 class="page-title">文档分享</h2>
    
    <div class="share-form-card">
      <el-form :model="shareSettings" label-width="120px" size="large">
        <!-- 分享链接 -->
        <el-form-item label="分享链接">
          <div class="share-link-wrapper">
            <el-input 
              v-model="shareSettings.shareUrl" 
              readonly 
              placeholder="生成分享链接"
              class="share-link-input"
            />
            <el-button type="primary" @click="handleCopy">复制链接</el-button>
          </div>
        </el-form-item>
        
        <!-- 分享设置 -->
        <el-form-item label="分享设置">
          <el-radio-group v-model="shareSettings.shareType">
            <el-radio-button label="public">公开链接</el-radio-button>
            <el-radio-button label="private">私有链接</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <!-- 有效期 -->
        <el-form-item label="有效期">
          <el-radio-group v-model="shareSettings.expireType">
            <el-radio-button label="never">永久有效</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>
          
          <el-date-picker
            v-if="shareSettings.expireType === 'custom'"
            v-model="shareSettings.expireDate"
            type="datetime"
            placeholder="选择过期时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :disabled-date="disabledDate"
            class="expire-date-picker"
          />
        </el-form-item>
        
        <!-- 访问密码 -->
        <el-form-item label="访问密码">
          <el-switch v-model="shareSettings.needPassword" />
          <el-input
            v-if="shareSettings.needPassword"
            v-model="shareSettings.password"
            placeholder="设置访问密码"
            show-password
            class="password-input"
          />
        </el-form-item>
        
        <!-- 操作按钮 -->
        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">保存设置</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { documentAPI } from '@/api'

// 文档ID（实际应用中可能从路由参数获取）
const documentId = ref('doc-123')
const saving = ref(false)

// 分享设置
const shareSettings = reactive({
  shareUrl: '',
  shareType: 'public',
  expireType: 'never',
  expireDate: null,
  needPassword: false,
  password: '',
  canEdit: false
})

// 加载分享设置
const loadShareSettings = async () => {
  try {
    const response = await documentAPI.getShareInfo(documentId.value)
    Object.assign(shareSettings, response.data)
  } catch (error) {
    console.error('加载分享设置失败:', error)
    ElMessage.error('加载分享设置失败，请稍后重试')
    // 使用本地模拟数据作为fallback
    shareSettings.shareUrl = 'https://example.com/share/doc-123?token=abc123'
  }
}

// 复制分享链接
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(shareSettings.shareUrl)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    console.error('复制链接失败:', error)
    ElMessage.error('复制链接失败，请手动复制')
  }
}

// 保存分享设置
const handleSave = async () => {
  saving.value = true
  try {
    await documentAPI.updateShareSettings(documentId.value, shareSettings)
    ElMessage.success('分享设置已保存')
  } catch (error) {
    console.error('保存分享设置失败:', error)
    ElMessage.error('保存分享设置失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

// 重置设置
const handleReset = () => {
  shareSettings.shareType = 'public'
  shareSettings.expireType = 'never'
  shareSettings.expireDate = null
  shareSettings.needPassword = false
  shareSettings.password = ''
  shareSettings.canEdit = false
}

// 禁用过去的日期
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e6
}

// 页面加载时获取分享设置
onMounted(() => {
  loadShareSettings()
})
</script>

<style scoped>
.document-share-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.share-form-card {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.share-link-wrapper {
  display: flex;
  gap: 10px;
}

.share-link-input {
  flex: 1;
}

.expire-date-picker {
  margin-top: 10px;
  width: 100%;
}

.password-input {
  margin-left: 10px;
  width: 200px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>