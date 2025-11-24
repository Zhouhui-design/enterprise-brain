<template>
  <el-container>
    <el-header>
      <el-page-header content="联系方式"></el-page-header>
    </el-header>
    <el-main class="contact-main">
      <el-card shadow="hover" class="contact-card">
        <el-row :gutter="30">
          <el-col :span="12">
            <h3 class="contact-subtitle">联系我们</h3>
            <el-descriptions title="公司信息" border :column="1">
              <el-descriptions-item label="公司地址">北京市海淀区中关村科技园区88号</el-descriptions-item>
              <el-descriptions-item label="联系电话">400-888-9999</el-descriptions-item>
              <el-descriptions-item label="电子邮箱">contact@enterprise-brain.com</el-descriptions-item>
              <el-descriptions-item label="工作时间">周一至周五 9:00-18:00（节假日除外）</el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="12">
            <h3 class="contact-subtitle">在线留言</h3>
            <el-form :model="messageForm" label-width="80px">
              <el-form-item label="姓名" required>
                <el-input v-model="messageForm.name" placeholder="请输入您的姓名"></el-input>
              </el-form-item>
              <el-form-item label="电话" required>
                <el-input v-model="messageForm.phone" placeholder="请输入您的电话"></el-input>
              </el-form-item>
              <el-form-item label="留言内容" required>
                <el-input v-model="messageForm.content" type="textarea" :rows="5" placeholder="请输入留言内容"></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitMessage">提交留言</el-button>
              </el-form-item>
            </el-form>
          </el-col>
        </el-row>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

const messageForm = ref({
  name: '',
  phone: '',
  content: ''
});

const submitMessage = () => {
  // 留言提交逻辑待实现
  console.log('留言参数：', messageForm.value);
  ElMessage.success('留言提交成功，我们将尽快与您联系！');
  messageForm.value = { name: '', phone: '', content: '' }; // 重置表单
};
</script>

<style scoped>
.contact-main {
  padding: 20px;
}

.contact-card {
  padding: 20px;
}

.contact-subtitle {
  color: #1989fa;
  margin-bottom: 15px;
  font-size: 18px;
}
</style>
