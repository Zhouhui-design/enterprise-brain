cat > /home/sardenesy/workspace/07-frontend/src/pages/system/Profile.vue << 'EOF'
<template>
  <el-container>
    <el-header>
      <el-page-header content="个人中心"></el-page-header>
    </el-header>
    <el-main>
      <el-card shadow="hover">
        <el-avatar :size="100" class="user-avatar">
          <User />
        </el-avatar>
        <el-form :model="userInfo" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="用户名">
            <el-input v-model="userInfo.username" disabled></el-input>
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="userInfo.email"></el-input>
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="userInfo.phone"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveProfile">保存修改</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { User } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const userInfo = ref({
  username: '管理员',
  email: 'admin@example.com',
  phone: '13800138000'
});

const saveProfile = () => {
  ElMessage.success('个人信息保存成功');
};
</script>

<style scoped>
.user-avatar {
  margin: 0 auto;
  display: block;
}
</style>
EOF
