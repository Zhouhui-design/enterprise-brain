<template>
  <div class="inspection-plan">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ title || '检验计划详情' }}</span>
          <div class="header-actions">
            <el-button size="small" @click="handleEdit" v-if="!readOnly">编辑</el-button>
            <el-button size="small" type="primary" @click="handleSave" v-if="isEditing">保存</el-button>
            <el-button size="small" @click="handleCancel" v-if="isEditing">取消</el-button>
            <el-button size="small" @click="handlePrint">打印</el-button>
            <el-button size="small" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      
      <!-- 基本信息 -->
      <el-form :model="planForm" label-width="120px" class="base-info-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="计划编号">
              <el-input v-model="planForm.planCode" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="计划名称">
              <el-input v-model="planForm.planName" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="计划类型">
              <el-select v-model="planForm.planType" :disabled="!isEditing" placeholder="选择计划类型">
                <el-option
                  v-for="type in planTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="适用产品">
              <el-select v-model="planForm.productId" :disabled="!isEditing" placeholder="选择产品" filterable>
                <el-option
                  v-for="product in products"
                  :key="product.id"
                  :label="product.productName"
                  :value="product.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="检验级别">
              <el-select v-model="planForm.inspectionLevel" :disabled="!isEditing" placeholder="选择检验级别">
                <el-option
                  v-for="level in inspectionLevels"
                  :key="level.value"
                  :label="level.label"
                  :value="level.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="抽样标准">
              <el-select v-model="planForm.samplingStandard" :disabled="!isEditing" placeholder="选择抽样标准">
                <el-option
                  v-for="standard in samplingStandards"
                  :key="standard.value"
                  :label="standard.label"
                  :value="standard.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="AQL值">
              <el-input v-model="planForm.aqlValue" :disabled="!isEditing" placeholder="接收质量限" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="生效日期">
              <el-date-picker
                v-model="planForm.effectiveDate"
                type="date"
                :disabled="!isEditing"
                placeholder="选择生效日期"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="失效日期">
              <el-date-picker
                v-model="planForm.expiryDate"
                type="date"
                :disabled="!isEditing"
                placeholder="选择失效日期"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24">
            <el-form-item label="计划描述">
              <el-input
                v-model="planForm.description"
                type="textarea"
                :rows="3"
                :disabled="!isEditing"
                placeholder="请输入计划描述"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <!-- 检验项目 -->
      <div class="inspection-items" v-if="isEditing || planItems.length > 0">
        <div class="section-header">
          <h3>检验项目</h3>
          <el-button
            type="primary"
            size="small"
            @click="handleAddItem"
            v-if="isEditing"
          >
            添加项目
          </el-button>
        </div>
        
        <el-table
          :data="planItems"
          style="width: 100%"
          border
          v-loading="loading"
        >
          <el-table-column prop="index" label="序号" width="80" align="center" />
          <el-table-column prop="itemName" label="检验项目" min-width="180">
            <template #default="{ row }">
              <template v-if="isEditing">
                <el-input v-model="row.itemName" placeholder="检验项目名称" />
              </template>
              <template v-else>
                {{ row.itemName }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="specification" label="技术要求" min-width="150">
            <template #default="{ row }">
              <template v-if="isEditing">
                <el-input v-model="row.specification" placeholder="技术要求" />
              </template>
              <template v-else>
                {{ row.specification }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="100">
            <template #default="{ row }">
              <template v-if="isEditing">
                <el-input v-model="row.unit" placeholder="单位" />
              </template>
              <template v-else>
                {{ row.unit }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="upperLimit" label="上限" width="100">
            <template #default="{ row }">
              <template v-if="isEditing">
                <el-input v-model.number="row.upperLimit" type="number" placeholder="上限" />
              </template>
              <template v-else>
                {{ row.upperLimit }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="lowerLimit" label="下限" width="100">
            <template #default="{ row }">
              <template v-if="isEditing">
                <el-input v-model.number="row.lowerLimit" type="number" placeholder="下限" />
              </template>
              <template v-else>
                {{ row.lowerLimit }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="targetValue" label="目标值" width="100">
            <template #default="{ row }">
              <template v-if="isEditing">
                <el-input v-model.number="row.targetValue" type="number" placeholder="目标值" />
              </template>
              <template v-else>
                {{ row.targetValue }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="inspectionMethod" label="检验方法" min-width="150">
            <template #default="{ row }">
              <template v-if="isEditing">
                <el-input v-model="row.inspectionMethod" placeholder="检验方法" />
              </template>
              <template v-else>
                {{ row.inspectionMethod }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="testEquipment" label="检验设备" min-width="150">
            <template #default="{ row }">
              <template v-if="isEditing">
                <el-select v-model="row.testEquipment" placeholder="选择检验设备" filterable>
                  <el-option
                    v-for="equipment in testEquipments"
                    :key="equipment.id"
                    :label="equipment.name"
                    :value="equipment.id"
                  />
                </el-select>
              </template>
              <template v-else>
                {{ getEquipmentName(row.testEquipment) }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="samplingNum" label="抽检数量" width="100">
            <template #default="{ row }">
              <template v-if="isEditing">
                <el-input v-model.number="row.samplingNum" type="number" placeholder="抽检数量" />
              </template>
              <template v-else>
                {{ row.samplingNum }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="isCritical" label="是否关键" width="100" align="center">
            <template #default="{ row }">
              <template v-if="isEditing">
                <el-switch v-model="row.isCritical" />
              </template>
              <template v-else>
                <el-tag :type="row.isCritical ? 'danger' : 'success'" size="small">
                  {{ row.isCritical ? '是' : '否' }}
                </el-tag>
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="120">
            <template #default="{ row }">
              <template v-if="isEditing">
                <el-input v-model="row.remark" placeholder="备注" />
              </template>
              <template v-else>
                <span class="remark-text" :title="row.remark">{{ row.remark }}</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" v-if="isEditing">
            <template #default="{ $index }">
              <el-button
                type="danger"
                size="small"
                icon="Delete"
                @click="handleDeleteItem($index)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 附件信息 -->
      <div class="attachments" v-if="isEditing || attachments.length > 0">
        <div class="section-header">
          <h3>相关文件</h3>
          <el-upload
            v-if="isEditing"
            action=""
            :on-change="handleFileChange"
            :auto-upload="false"
            :multiple="true"
            :limit="10"
            :on-exceed="handleExceed"
            :file-list="uploadFiles"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          >
            <el-button type="primary" size="small">
              <el-icon><Upload /></el-icon> 上传文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持格式：pdf、doc、docx、xls、xlsx、jpg、jpeg、png、gif，最多10个文件
              </div>
            </template>
          </el-upload>
        </div>
        
        <el-table
          :data="isEditing ? displayFiles : attachments"
          style="width: 100%"
          v-if="displayFiles.length > 0"
        >
          <el-table-column prop="name" label="文件名称" min-width="300">
            <template #default="{ row }">
              <div class="file-info">
                <el-icon class="file-icon"><Document /></el-icon>
                <span class="file-name">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="文件大小" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="uploadTime" label="上传时间" width="180" v-if="!isEditing">
            <template #default="{ row }">
              {{ formatDateTime(row.uploadTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="uploadBy" label="上传人" width="100" v-if="!isEditing">
            <template #default="{ row }">
              {{ row.uploadBy }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button size="small" @click="handleDownloadFile(row)">下载</el-button>
              <el-button
                type="danger"
                size="small"
                @click="handleRemoveFile(row)"
                v-if="isEditing"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 审批信息 -->
      <div class="approval-info" v-if="!isEditing && approvalHistory.length > 0">
        <div class="section-header">
          <h3>审批记录</h3>
        </div>
        
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in approvalHistory"
            :key="index"
            :timestamp="formatDateTime(record.timestamp)"
            :type="record.status === '已批准' ? 'success' : record.status === '已拒绝' ? 'danger' : 'primary'"
            :icon="record.status === '已批准' ? 'Check' : record.status === '已拒绝' ? 'Close' : 'Clock'"
          >
            <div class="timeline-content">
              <div class="approval-status">{{ record.status }}</div>
              <div class="approval-person">审批人：{{ record.approver }}</div>
              <div class="approval-comment" v-if="record.comment">
                备注：{{ record.comment }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Document, Upload } from '@element-plus/icons-vue';

export default {
  name: 'InspectionPlan',
  components: {
    Document,
    Upload
  },
  props: {
    // 标题
    title: {
      type: String,
      default: '检验计划详情'
    },
    // 是否只读模式
    readOnly: {
      type: Boolean,
      default: false
    },
    // 计划数据
    planData: {
      type: Object,
      default: () => ({})
    },
    // 是否加载中
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['save', 'update', 'edit', 'cancel'],
  setup(props, { emit }) {
    // 编辑状态
    const isEditing = ref(false);
    
    // 计划表单
    const planForm = reactive({
      id: '',
      planCode: '',
      planName: '',
      planType: '',
      productId: '',
      inspectionLevel: '',
      samplingStandard: '',
      aqlValue: '',
      effectiveDate: null,
      expiryDate: null,
      description: '',
      status: '草稿',
      createdBy: '',
      createdAt: null,
      updatedBy: '',
      updatedAt: null
    });
    
    // 检验项目列表
    const planItems = ref([]);
    
    // 附件列表
    const attachments = ref([]);
    
    // 上传文件列表
    const uploadFiles = ref([]);
    
    // 审批历史
    const approvalHistory = ref([]);
    
    // 计划类型选项
    const planTypes = [
      { value: 'incoming', label: '来料检验' },
      { value: 'process', label: '过程检验' },
      { value: 'final', label: '最终检验' },
      { value: 'rohs', label: 'RoHS检验' },
      { value: 'other', label: '其他检验' }
    ];
    
    // 检验级别选项
    const inspectionLevels = [
      { value: 'normal', label: '正常检验' },
      { value: 'tightened', label: '加严检验' },
      { value: 'reduced', label: '放宽检验' }
    ];
    
    // 抽样标准选项
    const samplingStandards = [
      { value: 'mil_std_105e', label: 'MIL-STD-105E' },
      { value: 'ansi_asq_z1_4', label: 'ANSI/ASQ Z1.4' },
      { value: 'gb2828', label: 'GB/T 2828.1' },
      { value: 'iso2859', label: 'ISO 2859-1' },
      { value: 'custom', label: '自定义' }
    ];
    
    // 模拟产品数据
    const products = [
      { id: '1', productCode: 'P001', productName: '产品A' },
      { id: '2', productCode: 'P002', productName: '产品B' },
      { id: '3', productCode: 'P003', productName: '产品C' },
      { id: '4', productCode: 'P004', productName: '产品D' },
      { id: '5', productCode: 'P005', productName: '产品E' }
    ];
    
    // 模拟检验设备数据
    const testEquipments = [
      { id: 'eq001', name: '游标卡尺' },
      { id: 'eq002', name: '千分尺' },
      { id: 'eq003', name: '硬度计' },
      { id: 'eq004', name: '投影仪' },
      { id: 'eq005', name: '光谱仪' },
      { id: 'eq006', name: '拉力试验机' },
      { id: 'eq007', name: '显微镜' },
      { id: 'eq008', name: '三坐标测量机' }
    ];
    
    // 显示的文件列表
    const displayFiles = computed(() => {
      if (isEditing.value) {
        // 合并已有附件和新上传文件
        const existingFileIds = new Set(attachments.value.map(file => file.id));
        const newFiles = uploadFiles.value.filter(file => !existingFileIds.has(file.id));
        return [...attachments.value, ...newFiles];
      }
      return attachments.value;
    });
    
    // 初始化数据
    const initData = () => {
      // 如果有传入数据，使用传入的数据
      if (props.planData && props.planData.id) {
        // 设置基本信息
        Object.assign(planForm, props.planData);
        
        // 设置检验项目
        planItems.value = props.planData.items ? [...props.planData.items] : [];
        
        // 设置附件
        attachments.value = props.planData.attachments ? [...props.planData.attachments] : [];
        
        // 设置审批历史
        approvalHistory.value = props.planData.approvalHistory ? [...props.planData.approvalHistory] : [];
      } else {
        // 生成模拟数据
        generateMockData();
      }
      
      // 更新序号
      updateItemIndexes();
    };
    
    // 生成模拟数据
    const generateMockData = () => {
      // 基本信息
      Object.assign(planForm, {
        id: '1',
        planCode: 'IP2023001',
        planName: '产品A来料检验计划',
        planType: 'incoming',
        productId: '1',
        inspectionLevel: 'normal',
        samplingStandard: 'gb2828',
        aqlValue: '0.65',
        effectiveDate: new Date('2023-01-01'),
        expiryDate: new Date('2023-12-31'),
        description: '本检验计划适用于产品A的来料检验，包括外观、尺寸、性能等方面的检验要求。',
        status: '已生效',
        createdBy: '张三',
        createdAt: new Date('2022-12-15'),
        updatedBy: '李四',
        updatedAt: new Date('2022-12-20')
      });
      
      // 检验项目
      planItems.value = [
        {
          id: '1',
          itemName: '外观检查',
          specification: '无裂纹、无变形、无毛刺',
          unit: '',
          upperLimit: null,
          lowerLimit: null,
          targetValue: null,
          inspectionMethod: '目视检查',
          testEquipment: 'eq007',
          samplingNum: 10,
          isCritical: true,
          remark: '重点检查表面粗糙度'
        },
        {
          id: '2',
          itemName: '长度尺寸',
          specification: '符合图纸要求',
          unit: 'mm',
          upperLimit: 100.2,
          lowerLimit: 99.8,
          targetValue: 100.0,
          inspectionMethod: '使用游标卡尺测量',
          testEquipment: 'eq001',
          samplingNum: 10,
          isCritical: true,
          remark: '测量3个位置取平均值'
        },
        {
          id: '3',
          itemName: '宽度尺寸',
          specification: '符合图纸要求',
          unit: 'mm',
          upperLimit: 50.1,
          lowerLimit: 49.9,
          targetValue: 50.0,
          inspectionMethod: '使用游标卡尺测量',
          testEquipment: 'eq001',
          samplingNum: 10,
          isCritical: false,
          remark: ''
        },
        {
          id: '4',
          itemName: '硬度测试',
          specification: '符合材料要求',
          unit: 'HRB',
          upperLimit: 80,
          lowerLimit: 60,
          targetValue: 70,
          inspectionMethod: '使用硬度计测量',
          testEquipment: 'eq003',
          samplingNum: 5,
          isCritical: true,
          remark: '测量5个点取平均值'
        },
        {
          id: '5',
          itemName: '性能测试',
          specification: '符合技术要求',
          unit: '',
          upperLimit: null,
          lowerLimit: null,
          targetValue: null,
          inspectionMethod: '按检验指导书进行测试',
          testEquipment: 'eq006',
          samplingNum: 3,
          isCritical: true,
          remark: '需在实验室环境下进行测试'
        }
      ];
      
      // 附件
      attachments.value = [
        {
          id: 'att001',
          name: '产品图纸.pdf',
          size: 1024 * 1024 * 2, // 2MB
          url: '#',
          uploadTime: new Date('2022-12-15T10:30:00'),
          uploadBy: '张三'
        },
        {
          id: 'att002',
          name: '检验指导书.docx',
          size: 1024 * 512, // 512KB
          url: '#',
          uploadTime: new Date('2022-12-15T10:35:00'),
          uploadBy: '张三'
        }
      ];
      
      // 审批历史
      approvalHistory.value = [
        {
          id: '1',
          status: '已提交',
          timestamp: new Date('2022-12-15T16:00:00'),
          approver: '张三',
          comment: '请审核'
        },
        {
          id: '2',
          status: '已批准',
          timestamp: new Date('2022-12-20T10:00:00'),
          approver: '李四',
          comment: '审核通过'
        }
      ];
    };
    
    // 更新项目序号
    const updateItemIndexes = () => {
      planItems.value.forEach((item, index) => {
        item.index = index + 1;
      });
    };
    
    // 获取设备名称
    const getEquipmentName = (equipmentId) => {
      const equipment = testEquipments.find(eq => eq.id === equipmentId);
      return equipment ? equipment.name : equipmentId || '-';
    };
    
    // 格式化文件大小
    const formatFileSize = (size) => {
      if (!size || size === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(size) / Math.log(k));
      return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // 格式化日期时间
    const formatDateTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    };
    
    // 处理编辑
    const handleEdit = () => {
      isEditing.value = true;
      emit('edit');
    };
    
    // 处理保存
    const handleSave = () => {
      // 构建保存数据
      const saveData = {
        ...planForm,
        items: planItems.value,
        attachments: displayFiles.value
      };
      
      // 触发保存事件
      if (planForm.id) {
        emit('update', saveData);
      } else {
        emit('save', saveData);
      }
      
      // 保存成功后退出编辑模式
      isEditing.value = false;
      ElMessage.success('保存成功');
    };
    
    // 处理取消
    const handleCancel = () => {
      ElMessageBox.confirm('确定要取消编辑吗？未保存的修改将丢失。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 重置数据
        initData();
        isEditing.value = false;
        uploadFiles.value = [];
        emit('cancel');
      }).catch(() => {
        // 取消操作
      });
    };
    
    // 处理打印
    const handlePrint = () => {
      ElMessage.success('打印功能待实现');
    };
    
    // 处理导出
    const handleExport = () => {
      ElMessage.success('导出功能待实现');
    };
    
    // 处理添加检验项目
    const handleAddItem = () => {
      planItems.value.push({
        id: `temp_${Date.now()}`,
        itemName: '',
        specification: '',
        unit: '',
        upperLimit: null,
        lowerLimit: null,
        targetValue: null,
        inspectionMethod: '',
        testEquipment: '',
        samplingNum: 1,
        isCritical: false,
        remark: ''
      });
      
      // 更新序号
      updateItemIndexes();
    };
    
    // 处理删除检验项目
    const handleDeleteItem = (index) => {
      ElMessageBox.confirm('确定要删除该检验项目吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        planItems.value.splice(index, 1);
        // 更新序号
        updateItemIndexes();
        ElMessage.success('删除成功');
      }).catch(() => {
        // 取消操作
      });
    };
    
    // 处理文件上传变化
    const handleFileChange = (file, fileList) => {
      uploadFiles.value = fileList;
    };
    
    // 处理文件超出限制
    const handleExceed = (files, fileList) => {
      ElMessage.warning(`当前限制上传10个文件，本次选择了${files.length}个文件，已自动忽略多余文件`);
    };
    
    // 处理下载文件
    const handleDownloadFile = (file) => {
      ElMessage.success(`下载文件: ${file.name}`);
      // 实际应实现文件下载逻辑
    };
    
    // 处理删除文件
    const handleRemoveFile = (file) => {
      // 如果是已上传的文件
      if (file.url) {
        // 从附件列表中移除
        const index = attachments.value.findIndex(item => item.id === file.id);
        if (index > -1) {
          attachments.value.splice(index, 1);
        }
      } else {
        // 从未上传的文件列表中移除
        const index = uploadFiles.value.findIndex(item => item.uid === file.uid);
        if (index > -1) {
          uploadFiles.value.splice(index, 1);
        }
      }
      
      ElMessage.success('文件已删除');
    };
    
    // 监听计划数据变化
    watch(() => props.planData, () => {
      initData();
    }, { deep: true, immediate: true });
    
    // 组件挂载时初始化
    onMounted(() => {
      initData();
    });
    
    return {
      isEditing,
      planForm,
      planItems,
      attachments,
      uploadFiles,
      approvalHistory,
      planTypes,
      inspectionLevels,
      samplingStandards,
      products,
      testEquipments,
      displayFiles,
      loading: props.loading,
      
      getEquipmentName,
      formatFileSize,
      formatDateTime,
      
      handleEdit,
      handleSave,
      handleCancel,
      handlePrint,
      handleExport,
      handleAddItem,
      handleDeleteItem,
      handleFileChange,
      handleExceed,
      handleDownloadFile,
      handleRemoveFile
    };
  }
};
</script>

<style scoped>
.inspection-plan {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.base-info-form {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.inspection-items,
.attachments,
.approval-info {
  margin-top: 30px;
}

.remark-text {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: #606266;
}

.file-name {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-content {
  padding: 8px 0;
}

.approval-status {
  font-weight: 500;
  margin-bottom: 4px;
}

.approval-person {
  color: #606266;
  font-size: 14px;
  margin-bottom: 4px;
}

.approval-comment {
  color: #909399;
  font-size: 14px;
}

.el-upload__tip {
  margin-top: 4px;
}
</style>