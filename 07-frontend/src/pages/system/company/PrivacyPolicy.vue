<template>
  <el-container>
    <el-header>
      <el-page-header content="隐私政策"></el-page-header>
    </el-header>
    <el-main class="policy-main">
      <el-card shadow="hover" class="policy-card">
        <div class="policy-content">
          <h3 class="policy-title">隐私政策</h3>
          <p class="policy-date">更新日期：2024年1月1日</p>
          <p class="policy-paragraph">
            感谢您使用本公司的产品和服务！我们非常重视您的隐私保护，本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息，
            请您在使用我们的产品和服务前仔细阅读本政策。
          </p>
          <h4 class="policy-subtitle">一、信息收集与使用</h4>
          <p class="policy-paragraph">
            1. 我们会收集您在注册、使用产品过程中提供的个人信息，包括但不限于用户名、手机号、电子邮箱等，用于为您提供账号管理、产品服务等功能。
          </p>
          <p class="policy-paragraph">
            2. 我们会收集您使用产品时的操作日志、设备信息等，用于优化产品性能、提升服务质量。
          </p>
          <h4 class="policy-subtitle">二、信息存储与保护</h4>
          <p class="policy-paragraph">
            1. 我们会采用加密技术、访问控制等安全措施，保护您的个人信息不被泄露、篡改或丢失。
          </p>
          <p class="policy-paragraph">
            2. 您的个人信息将存储在符合安全标准的服务器上，存储期限将根据法律法规要求和业务需要确定。
          </p>
          <h4 class="policy-subtitle">三、信息共享与披露</h4>
          <p class="policy-paragraph">
            1. 我们不会向第三方泄露您的个人信息，除非获得您的明确授权或法律法规要求。
          </p>
          <p class="policy-paragraph">
            2. 为提供产品服务，我们可能会向合作方共享必要的信息，但会要求合作方遵守本隐私政策的要求。
          </p>
          <h4 class="policy-subtitle">四、您的权利</h4>
          <p class="policy-paragraph">
            1. 您有权查询、修改、删除您的个人信息，可通过账号设置或联系客服实现。
          </p>
          <p class="policy-paragraph">
            2. 您有权拒绝我们收集非必要的个人信息，但可能会影响部分功能的使用。
          </p>
          <h4 class="policy-subtitle">五、政策更新</h4>
          <p class="policy-paragraph">
            1. 本隐私政策可能会根据法律法规变化或业务发展需要进行更新，更新后将在产品中公示。
          </p>
          <p class="policy-paragraph">
            2. 您继续使用我们的产品和服务，即表示您接受更新后的隐私政策。
          </p>
          <h4 class="policy-subtitle">六、联系我们</h4>
          <p class="policy-paragraph">
            如您对本隐私政策有任何疑问，可通过客服电话400-888-9999或电子邮箱privacy@enterprise-brain.com联系我们。
          </p>
        </div>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
// 隐私政策页面逻辑
</script>

<style scoped>
.policy-main {
  padding: 20px;
}

.policy-card {
  padding: 20px;
}

.policy-title {
  color: #1989fa;
  font-size: 20px;
  text-align: center;
  margin-bottom: 10px;
}

.policy-date {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
}

.policy-subtitle {
  color: #1989fa;
  margin: 15px 0 10px;
  font-size: 16px;
}

.policy-paragraph {
  line-height: 1.8;
  color: #333;
  margin-bottom: 10px;
}
</style>
