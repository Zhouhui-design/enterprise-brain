cat > oa/document/DocumentCenter.vue <<'EOF'
<template>
  <div class="document-center">
    <div class="header">
      <h1>文档中心</h1>
      <el-button type="primary" @click="handleUpload">上传文档</el-button>
    </div>
    
    <div class="toolbar">
      <el-input v-model="searchKeyword" placeholder="搜索文档..." style="width: 300px">
        <template #append>
          <el-button :icon="Search" />
        </template>
      </el-input>
      
      <el-select v-model="filterCategory" placeholder="分类筛选">
        <el-option label="全部" value="" />
        <el-option label="合同文件" value="contract" />
        <el-option label="技术文档" value="technical" />
        <el-option label="会议记录" value="meeting" />
      </el-select>
    </div>

    <el-table :data="documentList" style="width: 100%">
      <el-table-column prop="name" label="文档名称" />
      <el-table-column prop="category" label="分类" />
      <el-table-column prop="size" label="大小" />
      <el-table-column prop="updateTime" label="更新时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button link type="primary" @click="handlePreview(scope.row)">预览</el-button>
          <el-button link type="primary" @click="handleDownload(scope.row)">下载</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'

const searchKeyword = ref('')
const filterCategory = ref('')
const documentList = ref([])

onMounted(() => {
  loadDocuments()
})

const loadDocuments = () => {
  // 模拟数据
  documentList.value = [
    {
      id: 1,
      name: '项目需求文档.pdf',
      category: 'technical',
      size: '2.5MB',
      updateTime: '2024-01-15 10:30'
    },
    {
      id: 2,
      name: '采购合同.docx',
      category: 'contract',
      size: '1.8MB',
      updateTime: '2024-01-14 16:20'
    }
  ]
}

const handleUpload = () => {
  console.log('上传文档')
}

const handlePreview = (document) => {
  console.log('预览文档:', document)
}

const handleDownload = (document) => {
  console.log('下载文档:', document)
}

const handleDelete = (document) => {
  console.log('删除文档:', document)
}
</script>

<style scoped>
.document-center {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
</style>
EOF