<template>
  <div class="not-found">
    <h1>404</h1>
    <p>页面未找到</p>
    <el-button type="primary" @click="$router.push('/dashboard')">返回首页</el-button>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 50px;
}
h1 {
  font-size: 80px;
  color: #f56c6c;
}
p {
  font-size: 20px;
  margin: 20px 0;
}
</style>
