<template>
  <div class="plan-detail">
    <el-page-header :title="'生产计划详情'" :content="'查看生产计划详细信息'" />
    
    <el-card v-loading="loading">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h3>基本信息</h3>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="计划编号">{{ planDetail.planCode }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ planDetail.productName }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ planDetail.orderQuantity.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="计划开始日期">{{ planDetail.startDate }}</el-descriptions-item>
          <el-descriptions-item label="计划结束日期">{{ planDetail.endDate }}</el-descriptions-item>
          <el-descriptions-item label="计划状态">
            <el-tag :type="statusType[planDetail.status]">{{ statusText[planDetail.status] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ planDetail.responsiblePerson }}</el-descriptions-item>
          <el-descriptions-item label="生产车间">{{ planDetail.workshopName }}</el-descriptions-item>
          <el-descriptions-item label="生产线">{{ planDetail.productionLineName }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="priorityType[planDetail.priority]">{{ priorityText[planDetail.priority] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ planDetail.createTime }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ planDetail.updateTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <!-- 计划进度 -->
      <div class="detail-section">
        <h3>计划进度</h3>
        <div class="progress-info">
          <el-progress :percentage="progressPercentage" :format="progressFormat" />
          <div class="progress-stats">
            <span>已完成数量: {{ completedQuantity.toLocaleString() }}</span>
            <span>待完成数量: {{ remainingQuantity.toLocaleString() }}</span>
          </div>
        </div>
      </div>
      
      <!-- 生产任务列表 -->
      <div class="detail-section">
        <h3>生产任务列表</h3>
        <el-table :data="productionTasks" style="width: 100%">
          <el-table-column prop="taskCode" label="任务编号" width="180" />
          <el-table-column prop="taskName" label="任务名称" />
          <el-table-column prop="workshopName" label="所属车间" width="120" />
          <el-table-column prop="assignedTo" label="负责人" width="100" />
          <el-table-column prop="plannedStartDate" label="计划开始" width="150" />
          <el-table-column prop="plannedEndDate" label="计划结束" width="150" />
          <el-table-column prop="actualStartDate" label="实际开始" width="150" />
          <el-table-column prop="actualEndDate" label="实际结束" width="150" />
          <el-table-column prop="status" label="任务状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="taskStatusType[scope.row.status]">{{ taskStatusText[scope.row.status] }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 物料消耗 -->
      <div class="detail-section">
        <h3>物料消耗</h3>
        <el-table :data="materialConsumption" style="width: 100%">
          <el-table-column prop="materialCode" label="物料编码" width="150" />
          <el-table-column prop="materialName" label="物料名称" />
          <el-table-column prop="specification" label="规格型号" width="180" />
          <el-table-column prop="plannedQuantity" label="计划用量" width="120" align="right" />
          <el-table-column prop="actualQuantity" label="实际用量" width="120" align="right" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="difference" label="差异" width="100" align="right">
            <template slot-scope="scope">
              <span :class="{ 'positive': scope.row.difference > 0, 'negative': scope.row.difference < 0 }">{{ scope.row.difference }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 计划甘特图 -->
      <div class="detail-section">
        <h3>计划甘特图</h3>
        <plan-gantt :plan-id="planId" />
      </div>
      
      <!-- 备注信息 -->
      <div class="detail-section">
        <h3>备注信息</h3>
        <el-input
          v-model="planDetail.remark"
          type="textarea"
          :rows="4"
          placeholder="暂无备注"
          disabled
        />
      </div>
      
      <!-- 操作日志 -->
      <div class="detail-section">
        <h3>操作日志</h3>
        <el-table :data="operationLogs" style="width: 100%">
          <el-table-column prop="operationTime" label="操作时间" width="180" />
          <el-table-column prop="operator" label="操作人" width="120" />
          <el-table-column prop="operationType" label="操作类型" width="120" />
          <el-table-column prop="description" label="操作描述" />
        </el-table>
      </div>
      
      <div class="detail-actions">
        <el-button @click="handleBack">返回列表</el-button>
        <el-button type="primary" @click="handleEdit">编辑</el-button>
        <el-button type="warning" @click="handlePrint">打印</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import PlanGantt from './components/PlanGantt.vue';

export default {
  name: 'PlanDetail',
  components: {
    PlanGantt
  },
  data() {
    return {
      loading: false,
      planId: '',
      planDetail: {
        planCode: '',
        productName: '',
        orderQuantity: 0,
        startDate: '',
        endDate: '',
        status: '1',
        responsiblePerson: '',
        workshopName: '',
        productionLineName: '',
        priority: '1',
        createTime: '',
        updateTime: '',
        remark: ''
      },
      progressPercentage: 0,
      completedQuantity: 0,
      remainingQuantity: 0,
      productionTasks: [],
      materialConsumption: [],
      operationLogs: [],
      statusText: {
        0: '未开始',
        1: '进行中',
        2: '已完成',
        3: '已暂停'
      },
      statusType: {
        0: 'info',
        1: 'primary',
        2: 'success',
        3: 'warning'
      },
      priorityText: {
        0: '低',
        1: '中',
        2: '高'
      },
      priorityType: {
        0: 'info',
        1: 'primary',
        2: 'warning'
      },
      taskStatusText: {
        0: '未开始',
        1: '进行中',
        2: '已完成',
        3: '已暂停'
      },
      taskStatusType: {
        0: 'info',
        1: 'primary',
        2: 'success',
        3: 'warning'
      }
    };
  },
  created() {
    this.planId = this.$route.params.id || 1;
    this.loadPlanDetail();
  },
  methods: {
    loadPlanDetail() {
      this.loading = true;
      // 模拟加载数据
      setTimeout(() => {
        this.planDetail = {
          planCode: `PP${new Date().getFullYear()}0001`,
          productName: '智能手机A',
          orderQuantity: 500,
          startDate: '2024-01-15',
          endDate: '2024-01-25',
          status: '1',
          responsiblePerson: '张三',
          workshopName: '总装车间',
          productionLineName: '生产线A',
          priority: '2',
          createTime: '2024-01-10 09:30:00',
          updateTime: '2024-01-12 15:45:00',
          remark: '这是一个重要的生产计划，需要优先安排资源。'
        };
        
        this.progressPercentage = 60;
        this.completedQuantity = 300;
        this.remainingQuantity = 200;
        
        this.loadProductionTasks();
        this.loadMaterialConsumption();
        this.loadOperationLogs();
        
        this.loading = false;
      }, 800);
    },
    
    loadProductionTasks() {
      this.productionTasks = [
        {
          taskCode: 'PT001',
          taskName: 'PCB焊接',
          workshopName: '总装车间',
          assignedTo: '王五',
          plannedStartDate: '2024-01-15',
          plannedEndDate: '2024-01-17',
          actualStartDate: '2024-01-15',
          actualEndDate: '2024-01-17',
          status: '2'
        },
        {
          taskCode: 'PT002',
          taskName: '部件组装',
          workshopName: '总装车间',
          assignedTo: '赵六',
          plannedStartDate: '2024-01-18',
          plannedEndDate: '2024-01-20',
          actualStartDate: '2024-01-18',
          actualEndDate: '',
          status: '1'
        },
        {
          taskCode: 'PT003',
          taskName: '功能测试',
          workshopName: '测试车间',
          assignedTo: '孙七',
          plannedStartDate: '2024-01-21',
          plannedEndDate: '2024-01-23',
          actualStartDate: '',
          actualEndDate: '',
          status: '0'
        },
        {
          taskCode: 'PT004',
          taskName: '包装入库',
          workshopName: '总装车间',
          assignedTo: '周八',
          plannedStartDate: '2024-01-24',
          plannedEndDate: '2024-01-25',
          actualStartDate: '',
          actualEndDate: '',
          status: '0'
        }
      ];
    },
    
    loadMaterialConsumption() {
      this.materialConsumption = [
        {
          materialCode: 'M001',
          materialName: '屏幕',
          specification: '15.6寸',
          plannedQuantity: 500,
          actualQuantity: 300,
          unit: '个',
          difference: 0
        },
        {
          materialCode: 'M002',
          materialName: '电池',
          specification: '1000mAh',
          plannedQuantity: 500,
          actualQuantity: 295,
          unit: '个',
          difference: -5
        },
        {
          materialCode: 'M003',
          materialName: '外壳',
          specification: '标准款',
          plannedQuantity: 500,
          actualQuantity: 305,
          unit: '个',
          difference: 5
        },
        {
          materialCode: 'M004',
          materialName: '键盘',
          specification: '标准键盘',
          plannedQuantity: 500,
          actualQuantity: 300,
          unit: '个',
          difference: 0
        }
      ];
    },
    
    loadOperationLogs() {
      this.operationLogs = [
        {
          operationTime: '2024-01-10 09:30:00',
          operator: '管理员',
          operationType: '创建',
          description: '创建生产计划PP20240001'
        },
        {
          operationTime: '2024-01-12 10:15:00',
          operator: '张三',
          operationType: '更新',
          description: '更新计划负责人为张三'
        },
        {
          operationTime: '2024-01-12 15:45:00',
          operator: '李四',
          operationType: '更新',
          description: '调整计划优先级为高'
        },
        {
          operationTime: '2024-01-15 08:30:00',
          operator: '张三',
          operationType: '状态变更',
          description: '将计划状态从"未开始"变更为"进行中"'
        }
      ];
    },
    
    progressFormat(percentage) {
      return `${percentage}%`;
    },
    
    handleBack() {
      this.$router.push('/production-planning');
    },
    
    handleEdit() {
      this.$router.push(`/production-planning/create?id=${this.planId}`);
    },
    
    handlePrint() {
      this.$message({
        type: 'info',
        message: '打印功能开发中'
      });
    }
  }
};
</script>

<style scoped>
.plan-detail {
  padding: 20px;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #eaeaea;
}

.progress-info {
  margin-bottom: 20px;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding: 0 10px;
}

.positive {
  color: #f56c6c;
}

.negative {
  color: #67c23a;
}

.detail-actions {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eaeaea;
}
</style>