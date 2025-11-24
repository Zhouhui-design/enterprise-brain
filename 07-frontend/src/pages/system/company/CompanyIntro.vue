<template>
  <el-container>
    <el-header>
      <el-page-header content="企业简介"></el-page-header>
    </el-header>
    <el-main class="intro-main">
      <el-card shadow="hover" class="intro-card">
        <h3 class="intro-subtitle">公司概况</h3>
        <p class="intro-content">
          本企业是一家专注于智能制造、供应链管理的高新技术企业，致力于为制造型企业提供全方位的数字化解决方案。
          公司拥有专业的研发团队和丰富的行业经验，产品涵盖生产管理、库存管理、质量管理、人力资源等多个模块，
          帮助企业实现生产流程优化、成本降低、效率提升。
        </p>
      </el-card>
      <el-card shadow="hover" class="intro-card" style="margin-top: 20px;">
        <h3 class="intro-subtitle">企业文化</h3>
        <p class="intro-content">
          使命：用数字化技术赋能制造企业转型升级<br>
          愿景：成为智能制造领域的领军企业<br>
          价值观：诚信、创新、协作、共赢
        </p>
      </el-card>
      <el-card shadow="hover" class="intro-card" style="margin-top: 20px;">
        <h3 class="intro-subtitle">发展历程</h3>
        <el-timeline>
          <el-timeline-item timestamp="2020年" placement="top">公司成立，专注智能制造解决方案研发</el-timeline-item>
          <el-timeline-item timestamp="2021年" placement="top">首款核心产品上线，获得100+企业客户认可</el-timeline-item>
          <el-timeline-item timestamp="2022年" placement="top">完成A轮融资，扩大研发团队规模</el-timeline-item>
          <el-timeline-item timestamp="2023年" placement="top">产品矩阵完善，覆盖全产业链数字化需求</el-timeline-item>
          <el-timeline-item timestamp="2024年" placement="top">启动全国市场布局，设立多个区域服务中心</el-timeline-item>
        </el-timeline>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
// 企业简介页面逻辑
</script>

<style scoped>
.intro-main {
  padding: 20px;
}

.intro-card {
  padding: 20px;
}

.intro-subtitle {
  color: #1989fa;
  margin-bottom: 15px;
  font-size: 18px;
}

.intro-content {
  line-height: 1.8;
  color: #333;
}
</style>
