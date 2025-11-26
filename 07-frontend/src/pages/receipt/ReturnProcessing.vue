<template>
  <div class="return-processing-container">
    <el-card>
      <!-- 页面标题与操作按钮 -->
      <div class="page-header">
        <h2>退货处理</h2>
        <div class="header-actions">
          <el-button type="primary" icon="el-icon-plus" @click="showCreateDialog">创建退货单</el-button>
          <el-button type="info" icon="el-icon-download" @click="exportData">导出</el-button>
          <el-button icon="el-icon-refresh" @click="refreshData">刷新</el-button>
        </div>
      </div>

      <!-- 搜索与筛选区域 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="退货单号">
          <el-input v-model="searchForm.returnOrderNo" placeholder="请输入退货单号"></el-input>
        </el-form-item>
        <el-form-item label="回厂单号">
          <el-input v-model="searchForm.receiptNo" placeholder="请输入回厂单号"></el-input>
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="searchForm.supplierName" placeholder="请输入供应商名称"></el-input>
        </el-form-item>
        <el-form-item label="退货状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="全部" value=""></el-option>
            <el-option label="待处理" value="PENDING"></el-option>
            <el-option label="处理中" value="PROCESSING"></el-option>
            <el-option label="已完成" value="COMPLETED"></el-option>
            <el-option label="已取消" value="CANCELLED"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="退货日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="returnOrdersData"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="returnOrderNo" label="退货单号" min-width="150"></el-table-column>
        <el-table-column prop="receiptNo" label="回厂单号" min-width="150"></el-table-column>
        <el-table-column prop="supplierName" label="供应商" min-width="180"></el-table-column>
        <el-table-column prop="returnDate" label="退货日期" min-width="120" formatter="formatDate"></el-table-column>
        <el-table-column prop="totalAmount" label="退货金额" min-width="100" formatter="formatCurrency"></el-table-column>
        <el-table-column prop="totalQuantity" label="退货数量" min-width="100"></el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handlerName" label="处理人" min-width="100"></el-table-column>
        <el-table-column label="操作" min-width="180" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" @click="viewReturnOrder(scope.row)">查看</el-button>
            <el-button size="mini" type="success" @click="processReturnOrder(scope.row)" :disabled="scope.row.status !== 'PENDING'">处理</el-button>
            <el-button size="mini" type="danger" @click="cancelReturnOrder(scope.row)" :disabled="scope.row.status !== 'PENDING' && scope.row.status !== 'PROCESSING'">取消</el-button>
            <el-button size="mini" @click="printReturnOrder(scope.row)">打印</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, jumper, total"
          :total="total"
          :current-page.sync="currentPage"
          :page-size.sync="pageSize"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 查看退货单对话框 -->
    <el-dialog
      title="查看退货单"
      :visible.sync="viewDialogVisible"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="view-dialog-content">
        <!-- 基本信息 -->
        <el-card class="basic-info-card">
          <h3>基本信息</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="info-item"><span class="label">退货单号：</span>{{ viewData.returnOrderNo }}</div>
            </el-col>
            <el-col :span="6">
              <div class="info-item"><span class="label">回厂单号：</span>{{ viewData.receiptNo }}</div>
            </el-col>
            <el-col :span="6">
              <div class="info-item"><span class="label">退货日期：</span>{{ formatDate(viewData.returnDate) }}</div>
            </el-col>
            <el-col :span="6">
              <div class="info-item"><span class="label">状态：</span>
                <el-tag :type="getStatusTagType(viewData.status)">{{ getStatusText(viewData.status) }}</el-tag>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="6">
              <div class="info-item"><span class="label">供应商：</span>{{ viewData.supplierName }}</div>
            </el-col>
            <el-col :span="6">
              <div class="info-item"><span class="label">联系人：</span>{{ viewData.supplierContact }}</div>
            </el-col>
            <el-col :span="6">
              <div class="info-item"><span class="label">联系电话：</span>{{ viewData.supplierPhone }}</div>
            </el-col>
            <el-col :span="6">
              <div class="info-item"><span class="label">处理人：</span>{{ viewData.handlerName }}</div>
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="12">
              <div class="info-item"><span class="label">退货原因：</span>{{ viewData.returnReason }}</div>
            </el-col>
            <el-col :span="12">
              <div class="info-item"><span class="label">退货方式：</span>{{ getReturnMethodText(viewData.returnMethod) }}</div>
            </el-col>
          </el-row>
          <el-row style="margin-top: 10px;">
            <el-col :span="24">
              <div class="info-item"><span class="label">备注：</span>{{ viewData.remark }}</div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 退货明细 -->
        <el-card class="items-card" style="margin-top: 20px;">
          <h3>退货明细</h3>
          <el-table :data="viewData.items" style="width: 100%">
            <el-table-column prop="productCode" label="产品编码" min-width="120"></el-table-column>
            <el-table-column prop="productName" label="产品名称" min-width="150"></el-table-column>
            <el-table-column prop="specification" label="规格型号" min-width="120"></el-table-column>
            <el-table-column prop="unit" label="单位" min-width="80"></el-table-column>
            <el-table-column prop="returnQuantity" label="退货数量" min-width="100" align="right"></el-table-column>
            <el-table-column prop="unitPrice" label="单价" min-width="100" align="right" formatter="formatCurrency"></el-table-column>
            <el-table-column prop="subtotal" label="小计" min-width="100" align="right" formatter="formatCurrency"></el-table-column>
            <el-table-column prop="returnReason" label="退货原因" min-width="150"></el-table-column>
            <el-table-column prop="qualityIssue" label="质量问题描述" min-width="200"></el-table-column>
          </el-table>
          <div class="total-info" style="text-align: right; margin-top: 15px;">
            <div class="total-row">
              <span>退货总数量：</span>
              <span class="total-value">{{ viewData.totalQuantity }}</span>
              <span style="margin-left: 30px;">退货总金额：</span>
              <span class="total-value">{{ formatCurrency(viewData.totalAmount) }}</span>
            </div>
          </div>
        </el-card>

        <!-- 退货附件 -->
        <el-card v-if="viewData.attachments && viewData.attachments.length > 0" class="attachments-card" style="margin-top: 20px;">
          <h3>退货附件</h3>
          <el-upload
            action=""
            :file-list="viewData.attachments"
            list-type="picture-card"
            :disabled="true"
          >
            <i class="el-icon-plus"></i>
          </el-upload>
        </el-card>

        <!-- 处理记录 -->
        <el-card class="history-card" style="margin-top: 20px;">
          <h3>处理记录</h3>
          <div class="timeline">
            <div v-for="(record, index) in viewData.processingHistory" :key="index" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-time">{{ formatDateTime(record.createTime) }}</div>
                <div class="timeline-text">
                  <span class="timeline-operator">{{ record.operator }}</span>
                  <span>{{ record.action }}</span>
                </div>
                <div v-if="record.remark" class="timeline-remark">{{ record.remark }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewDialogVisible = false">关闭</el-button>
        <el-button type="info" @click="printReturnOrder(viewData)">打印</el-button>
      </div>
    </el-dialog>

    <!-- 处理退货单对话框 -->
    <el-dialog
      title="处理退货单"
      :visible.sync="processDialogVisible"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-form ref="processForm" :model="processForm" :rules="processRules" label-width="100px">
        <!-- 基本信息 -->
        <el-card class="basic-info-card">
          <h3>退货单信息</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="info-item"><span class="label">退货单号：</span>{{ processForm.returnOrderNo }}</div>
            </el-col>
            <el-col :span="6">
              <div class="info-item"><span class="label">回厂单号：</span>{{ processForm.receiptNo }}</div>
            </el-col>
            <el-col :span="6">
              <div class="info-item"><span class="label">供应商：</span>{{ processForm.supplierName }}</div>
            </el-col>
            <el-col :span="6">
              <div class="info-item"><span class="label">退货日期：</span>{{ formatDate(processForm.returnDate) }}</div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 退货明细 -->
        <el-card class="items-card" style="margin-top: 20px;">
          <h3>退货明细</h3>
          <el-table :data="processForm.items" style="width: 100%">
            <el-table-column prop="productCode" label="产品编码" min-width="120"></el-table-column>
            <el-table-column prop="productName" label="产品名称" min-width="150"></el-table-column>
            <el-table-column prop="specification" label="规格型号" min-width="120"></el-table-column>
            <el-table-column prop="unit" label="单位" min-width="80"></el-table-column>
            <el-table-column prop="returnQuantity" label="退货数量" min-width="100" align="right"></el-table-column>
            <el-table-column prop="unitPrice" label="单价" min-width="100" align="right" formatter="formatCurrency"></el-table-column>
            <el-table-column prop="returnReason" label="退货原因" min-width="150"></el-table-column>
            <el-table-column label="处理" min-width="200">
              <template slot-scope="scope">
                <el-form-item :prop="`items.${scope.$index}.processingResult`" :rules="processRules.processingResult">
                  <el-select v-model="scope.row.processingResult" placeholder="请选择处理结果">
                    <el-option label="同意退货" value="AGREE"></el-option>
                    <el-option label="部分同意" value="PARTIAL_AGREE"></el-option>
                    <el-option label="拒绝退货" value="REJECT"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item v-if="scope.row.processingResult === 'PARTIAL_AGREE'" :prop="`items.${scope.$index}.actualReturnQuantity`" :rules="processRules.actualReturnQuantity">
                  <el-input-number v-model="scope.row.actualReturnQuantity" :min="1" :max="scope.row.returnQuantity" placeholder="实际退货数量"></el-input-number>
                </el-form-item>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 处理信息 -->
        <el-card class="processing-info-card" style="margin-top: 20px;">
          <h3>处理信息</h3>
          <el-form-item label="退货方式" prop="returnMethod">
            <el-radio-group v-model="processForm.returnMethod">
              <el-radio label="RETURN_GOODS">退货</el-radio>
              <el-radio label="REFUND_ONLY">仅退款</el-radio>
              <el-radio label="REPLACEMENT">换货</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="退款金额" prop="refundAmount">
            <el-input v-model.number="processForm.refundAmount" placeholder="请输入退款金额"></el-input>
          </el-form-item>
          <el-form-item label="退款方式" prop="refundMethod">
            <el-select v-model="processForm.refundMethod" placeholder="请选择退款方式">
              <el-option label="现金" value="CASH"></el-option>
              <el-option label="银行转账" value="BANK_TRANSFER"></el-option>
              <el-option label="微信支付" value="WECHAT_PAY"></el-option>
              <el-option label="支付宝" value="ALIPAY"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="处理意见" prop="processingRemark">
            <el-input type="textarea" v-model="processForm.processingRemark" placeholder="请输入处理意见" :rows="4"></el-input>
          </el-form-item>
          <el-form-item label="附件上传">
            <el-upload
              v-model="processForm.attachments"
              action=""
              list-type="picture-card"
              :auto-upload="false"
              multiple
            >
              <i class="el-icon-plus"></i>
              <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
            </el-upload>
          </el-form-item>
        </el-card>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcessing">提交处理</el-button>
      </div>
    </el-dialog>

    <!-- 创建退货单对话框 -->
    <el-dialog
      title="创建退货单"
      :visible.sync="createDialogVisible"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-form ref="createForm" :model="createForm" :rules="createRules" label-width="100px">
        <!-- 基本信息 -->
        <el-card class="basic-info-card">
          <h3>基本信息</h3>
          <el-form-item label="回厂单号" prop="receiptNo">
            <el-input v-model="createForm.receiptNo" placeholder="请输入回厂单号" readonly></el-input>
            <el-button type="primary" size="small" style="margin-left: 10px;" @click="selectReceipt">选择回厂单</el-button>
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="供应商" prop="supplierName">
                <el-input v-model="createForm.supplierName" placeholder="请输入供应商名称" readonly></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系人" prop="supplierContact">
                <el-input v-model="createForm.supplierContact" placeholder="请输入联系人"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系电话" prop="supplierPhone">
                <el-input v-model="createForm.supplierPhone" placeholder="请输入联系电话"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="退货日期" prop="returnDate">
                <el-date-picker v-model="createForm.returnDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="退货原因" prop="returnReason">
            <el-input type="textarea" v-model="createForm.returnReason" placeholder="请输入退货原因" :rows="3"></el-input>
          </el-form-item>
          <el-form-item label="备注">
            <el-input type="textarea" v-model="createForm.remark" placeholder="请输入备注" :rows="2"></el-input>
          </el-form-item>
        </el-card>

        <!-- 退货明细 -->
        <el-card class="items-card" style="margin-top: 20px;">
          <div class="card-header">
            <h3>退货明细</h3>
            <el-button type="primary" size="small" @click="addReturnItem">添加明细</el-button>
          </div>
          <el-table :data="createForm.items" style="width: 100%" border>
            <el-table-column prop="productCode" label="产品编码" min-width="120">
              <template slot-scope="scope">
                <el-input v-model="scope.row.productCode" placeholder="请输入产品编码"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="productName" label="产品名称" min-width="150">
              <template slot-scope="scope">
                <el-input v-model="scope.row.productName" placeholder="请输入产品名称"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="specification" label="规格型号" min-width="120">
              <template slot-scope="scope">
                <el-input v-model="scope.row.specification" placeholder="请输入规格型号"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" min-width="80">
              <template slot-scope="scope">
                <el-input v-model="scope.row.unit" placeholder="单位"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="returnQuantity" label="退货数量" min-width="100" align="right">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.returnQuantity" :min="1" placeholder="退货数量"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="单价" min-width="100" align="right">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.unitPrice" :min="0" :precision="2" placeholder="单价"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column prop="subtotal" label="小计" min-width="100" align="right" formatter="formatCurrency">
              <template slot-scope="scope">
                {{ formatCurrency(scope.row.returnQuantity * scope.row.unitPrice) }}
              </template>
            </el-table-column>
            <el-table-column prop="returnReason" label="退货原因" min-width="150">
              <template slot-scope="scope">
                <el-select v-model="scope.row.returnReason" placeholder="请选择退货原因">
                  <el-option label="质量问题" value="QUALITY_ISSUE"></el-option>
                  <el-option label="数量不符" value="QUANTITY_MISMATCH"></el-option>
                  <el-option label="规格不符" value="SPECIFICATION_MISMATCH"></el-option>
                  <el-option label="过期产品" value="EXPIRED_PRODUCT"></el-option>
                  <el-option label="其他" value="OTHER"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="qualityIssue" label="问题描述" min-width="150">
              <template slot-scope="scope">
                <el-input type="textarea" v-model="scope.row.qualityIssue" placeholder="请输入问题描述" :rows="2"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="80" align="center">
              <template slot-scope="scope">
                <el-button type="danger" size="mini" @click="removeReturnItem(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="total-info" style="text-align: right; margin-top: 15px;">
            <div class="total-row">
              <span>退货总数量：</span>
              <span class="total-value">{{ calculateTotalQuantity(createForm.items) }}</span>
              <span style="margin-left: 30px;">退货总金额：</span>
              <span class="total-value">{{ formatCurrency(calculateTotalAmount(createForm.items)) }}</span>
            </div>
          </div>
        </el-card>

        <!-- 附件上传 -->
        <el-card class="attachments-card" style="margin-top: 20px;">
          <h3>附件上传</h3>
          <el-upload
            v-model="createForm.attachments"
            action=""
            list-type="picture-card"
            :auto-upload="false"
            multiple
          >
            <i class="el-icon-plus"></i>
            <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
          </el-upload>
        </el-card>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreateForm">创建</el-button>
      </div>
    </el-dialog>

    <!-- 选择回厂单对话框 -->
    <el-dialog
      title="选择回厂单"
      :visible.sync="selectReceiptDialogVisible"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-form :inline="true" :model="receiptSearchForm" class="search-form">
        <el-form-item label="回厂单号">
          <el-input v-model="receiptSearchForm.receiptNo" placeholder="请输入回厂单号"></el-input>
        </el-form-item>
        <el-form-item label="采购订单号">
          <el-input v-model="receiptSearchForm.purchaseOrderNo" placeholder="请输入采购订单号"></el-input>
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="receiptSearchForm.supplierName" placeholder="请输入供应商名称"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchReceipts">查询</el-button>
          <el-button @click="resetReceiptSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="receiptsData"
        style="width: 100%"
        @row-click="selectReceiptItem"
        highlight-current-row
      >
        <el-table-column prop="receiptNo" label="回厂单号" min-width="150"></el-table-column>
        <el-table-column prop="purchaseOrderNo" label="采购订单号" min-width="150"></el-table-column>
        <el-table-column prop="supplierName" label="供应商" min-width="180"></el-table-column>
        <el-table-column prop="receiptDate" label="回厂日期" min-width="120" formatter="formatDate"></el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总金额" min-width="100" align="right" formatter="formatCurrency"></el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, jumper, total"
          :total="receiptTotal"
          :current-page.sync="receiptCurrentPage"
          :page-size.sync="receiptPageSize"
          @current-change="handleReceiptCurrentChange"
          @size-change="handleReceiptSizeChange"
        ></el-pagination>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="selectReceiptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSelectReceipt">确认选择</el-button>
      </div>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog
      title="确认操作"
      :visible.sync="confirmDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <p>{{ confirmMessage }}</p>
      <div slot="footer" class="dialog-footer">
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmAction">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ReturnProcessing',
  data() {
    return {
      // 搜索表单
      searchForm: {
        returnOrderNo: '',
        receiptNo: '',
        supplierName: '',
        status: '',
        dateRange: []
      },
      // 分页信息
      currentPage: 1,
      pageSize: 10,
      total: 0,
      loading: false,
      // 表格数据
      returnOrdersData: [],
      // 选中的行
      selectedRows: [],
      
      // 查看对话框
      viewDialogVisible: false,
      viewData: {},
      
      // 处理对话框
      processDialogVisible: false,
      processForm: {
        returnOrderNo: '',
        receiptNo: '',
        supplierName: '',
        returnDate: '',
        returnMethod: 'RETURN_GOODS',
        refundAmount: 0,
        refundMethod: '',
        processingRemark: '',
        attachments: [],
        items: []
      },
      processRules: {
        returnMethod: [
          { required: true, message: '请选择退货方式', trigger: 'change' }
        ],
        refundAmount: [
          { required: true, message: '请输入退款金额', trigger: 'blur' },
          { type: 'number', min: 0, message: '退款金额必须大于等于0', trigger: 'blur' }
        ],
        refundMethod: [
          { required: true, message: '请选择退款方式', trigger: 'change' }
        ],
        processingRemark: [
          { required: true, message: '请输入处理意见', trigger: 'blur' }
        ],
        processingResult: [
          { required: true, message: '请选择处理结果', trigger: 'change' }
        ],
        actualReturnQuantity: [
          { required: true, message: '请输入实际退货数量', trigger: 'blur' }
        ]
      },
      
      // 创建对话框
      createDialogVisible: false,
      createForm: {
        receiptNo: '',
        supplierName: '',
        supplierContact: '',
        supplierPhone: '',
        returnDate: '',
        returnReason: '',
        remark: '',
        attachments: [],
        items: []
      },
      createRules: {
        receiptNo: [
          { required: true, message: '请选择回厂单', trigger: 'blur' }
        ],
        supplierName: [
          { required: true, message: '请输入供应商名称', trigger: 'blur' }
        ],
        supplierContact: [
          { required: true, message: '请输入联系人', trigger: 'blur' }
        ],
        supplierPhone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        returnDate: [
          { required: true, message: '请选择退货日期', trigger: 'change' }
        ],
        returnReason: [
          { required: true, message: '请输入退货原因', trigger: 'blur' }
        ]
      },
      
      // 选择回厂单对话框
      selectReceiptDialogVisible: false,
      receiptSearchForm: {
        receiptNo: '',
        purchaseOrderNo: '',
        supplierName: ''
      },
      receiptsData: [],
      receiptCurrentPage: 1,
      receiptPageSize: 10,
      receiptTotal: 0,
      selectedReceipt: null,
      
      // 确认对话框
      confirmDialogVisible: false,
      confirmMessage: '',
      confirmActionType: '',
      confirmData: null
    }
  },
  mounted() {
    this.loadReturnOrders()
  },
  methods: {
    // 加载退货单数据
    loadReturnOrders() {
      this.loading = true
      // 模拟数据加载
      setTimeout(() => {
        this.returnOrdersData = [
          {
            id: '1',
            returnOrderNo: 'RT202401001',
            receiptNo: 'RC202401001',
            supplierName: '深圳精密科技有限公司',
            supplierContact: '张三',
            supplierPhone: '13800138001',
            returnDate: '2024-01-15',
            returnReason: '产品质量不符合要求',
            returnMethod: 'RETURN_GOODS',
            status: 'PENDING',
            handlerName: '',
            totalAmount: 15000.00,
            totalQuantity: 100,
            remark: '需要尽快处理',
            items: [
              {
                id: '101',
                productCode: 'PROD001',
                productName: '精密轴承',
                specification: '6205ZZ',
                unit: '个',
                returnQuantity: 50,
                unitPrice: 200.00,
                subtotal: 10000.00,
                returnReason: 'QUALITY_ISSUE',
                qualityIssue: '表面有划痕'
              },
              {
                id: '102',
                productCode: 'PROD002',
                productName: '密封件',
                specification: 'TC50x65x7',
                unit: '个',
                returnQuantity: 50,
                unitPrice: 100.00,
                subtotal: 5000.00,
                returnReason: 'SPECIFICATION_MISMATCH',
                qualityIssue: '尺寸偏差'
              }
            ],
            attachments: [],
            processingHistory: []
          },
          {
            id: '2',
            returnOrderNo: 'RT202401002',
            receiptNo: 'RC202401002',
            supplierName: '广州电子元件厂',
            supplierContact: '李四',
            supplierPhone: '13900139002',
            returnDate: '2024-01-16',
            returnReason: '数量短缺',
            returnMethod: 'REFUND_ONLY',
            status: 'PROCESSING',
            handlerName: '王五',
            totalAmount: 8000.00,
            totalQuantity: 40,
            remark: '',
            items: [
              {
                id: '201',
                productCode: 'ELEC001',
                productName: '电阻器',
                specification: '100Ω 1/4W',
                unit: '个',
                returnQuantity: 40,
                unitPrice: 200.00,
                subtotal: 8000.00,
                returnReason: 'QUANTITY_MISMATCH',
                qualityIssue: '少发40个'
              }
            ],
            attachments: [],
            processingHistory: [
              {
                createTime: '2024-01-16 10:00:00',
                operator: '王五',
                action: '开始处理',
                remark: '正在核实情况'
              }
            ]
          },
          {
            id: '3',
            returnOrderNo: 'RT202401003',
            receiptNo: 'RC202401003',
            supplierName: '上海五金制品有限公司',
            supplierContact: '赵六',
            supplierPhone: '13700137003',
            returnDate: '2024-01-14',
            returnReason: '产品过期',
            returnMethod: 'REPLACEMENT',
            status: 'COMPLETED',
            handlerName: '孙七',
            totalAmount: 12000.00,
            totalQuantity: 30,
            remark: '已安排换货',
            items: [
              {
                id: '301',
                productCode: 'TOOL001',
                productName: '钻头套装',
                specification: '10件套',
                unit: '套',
                returnQuantity: 30,
                unitPrice: 400.00,
                subtotal: 12000.00,
                returnReason: 'EXPIRED_PRODUCT',
                qualityIssue: '产品已过期'
              }
            ],
            attachments: [],
            processingHistory: [
              {
                createTime: '2024-01-14 09:00:00',
                operator: '孙七',
                action: '开始处理',
                remark: '确认产品过期'
              },
              {
                createTime: '2024-01-15 16:00:00',
                operator: '孙七',
                action: '完成处理',
                remark: '已安排换货并退款'
              }
            ]
          }
        ]
        this.total = this.returnOrdersData.length
        this.loading = false
      }, 500)
    },
    
    // 搜索
    search() {
      this.currentPage = 1
      this.loadReturnOrders()
    },
    
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        returnOrderNo: '',
        receiptNo: '',
        supplierName: '',
        status: '',
        dateRange: []
      }
      this.loadReturnOrders()
    },
    
    // 刷新数据
    refreshData() {
      this.loadReturnOrders()
    },
    
    // 导出数据
    exportData() {
      this.$message.success('数据导出成功')
    },
    
    // 分页处理
    handleCurrentChange(val) {
      this.currentPage = val
      this.loadReturnOrders()
    },
    
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.loadReturnOrders()
    },
    
    // 选择行变化
    handleSelectionChange(val) {
      this.selectedRows = val
    },
    
    // 查看退货单
    viewReturnOrder(row) {
      this.viewData = JSON.parse(JSON.stringify(row))
      this.viewDialogVisible = true
    },
    
    // 处理退货单
    processReturnOrder(row) {
      this.processForm = JSON.parse(JSON.stringify(row))
      // 初始化处理结果
      this.processForm.items.forEach(item => {
        item.processingResult = 'AGREE'
        item.actualReturnQuantity = item.returnQuantity
      })
      this.processForm.refundAmount = row.totalAmount
      this.processDialogVisible = true
    },
    
    // 取消退货单
    cancelReturnOrder(row) {
      this.confirmMessage = `确定要取消退货单 ${row.returnOrderNo} 吗？`
      this.confirmActionType = 'cancel'
      this.confirmData = row
      this.confirmDialogVisible = true
    },
    
    // 打印退货单
    printReturnOrder(row) {
      this.$message.info('打印功能开发中')
    },
    
    // 显示创建对话框
    showCreateDialog() {
      this.resetCreateForm()
      this.createDialogVisible = true
    },
    
    // 重置创建表单
    resetCreateForm() {
      this.createForm = {
        receiptNo: '',
        supplierName: '',
        supplierContact: '',
        supplierPhone: '',
        returnDate: new Date().toISOString().split('T')[0],
        returnReason: '',
        remark: '',
        attachments: [],
        items: []
      }
    },
    
    // 选择回厂单
    selectReceipt() {
      this.selectReceiptDialogVisible = true
      this.searchReceipts()
    },
    
    // 搜索回厂单
    searchReceipts() {
      // 模拟回厂单数据
      this.receiptsData = [
        {
          id: 'rc1',
          receiptNo: 'RC202401004',
          purchaseOrderNo: 'PO202401004',
          supplierName: '北京新材料科技公司',
          receiptDate: '2024-01-17',
          status: 'COMPLETED',
          totalAmount: 25000.00,
          items: [
            {
              productCode: 'MATE001',
              productName: '复合材料板',
              specification: '1000x1000x10mm',
              unit: '块',
              quantity: 50,
              unitPrice: 500.00
            }
          ]
        },
        {
          id: 'rc2',
          receiptNo: 'RC202401005',
          purchaseOrderNo: 'PO202401005',
          supplierName: '杭州机械配件厂',
          receiptDate: '2024-01-18',
          status: 'COMPLETED',
          totalAmount: 18000.00,
          items: [
            {
              productCode: 'PART001',
              productName: '齿轮',
              specification: 'M1.5 Z20',
              unit: '个',
              quantity: 100,
              unitPrice: 180.00
            }
          ]
        }
      ]
      this.receiptTotal = this.receiptsData.length
    },
    
    // 重置回厂单搜索
    resetReceiptSearch() {
      this.receiptSearchForm = {
        receiptNo: '',
        purchaseOrderNo: '',
        supplierName: ''
      }
      this.searchReceipts()
    },
    
    // 选择回厂单项目
    selectReceiptItem(row) {
      this.selectedReceipt = row
    },
    
    // 确认选择回厂单
    confirmSelectReceipt() {
      if (this.selectedReceipt) {
        this.createForm.receiptNo = this.selectedReceipt.receiptNo
        this.createForm.supplierName = this.selectedReceipt.supplierName
        // 自动填充退货明细
        this.createForm.items = this.selectedReceipt.items.map(item => ({
          productCode: item.productCode,
          productName: item.productName,
          specification: item.specification,
          unit: item.unit,
          returnQuantity: 0,
          unitPrice: item.unitPrice,
          subtotal: 0,
          returnReason: '',
          qualityIssue: ''
        }))
        this.selectReceiptDialogVisible = false
      } else {
        this.$message.warning('请选择一个回厂单')
      }
    },
    
    // 添加退货明细
    addReturnItem() {
      this.createForm.items.push({
        productCode: '',
        productName: '',
        specification: '',
        unit: '',
        returnQuantity: 0,
        unitPrice: 0,
        subtotal: 0,
        returnReason: '',
        qualityIssue: ''
      })
    },
    
    // 删除退货明细
    removeReturnItem(index) {
      this.createForm.items.splice(index, 1)
    },
    
    // 计算总数量
    calculateTotalQuantity(items) {
      return items.reduce((total, item) => total + (item.returnQuantity || 0), 0)
    },
    
    // 计算总金额
    calculateTotalAmount(items) {
      return items.reduce((total, item) => total + (item.returnQuantity || 0) * (item.unitPrice || 0), 0)
    },
    
    // 提交创建表单
    submitCreateForm() {
      this.$refs.createForm.validate((valid) => {
        if (valid) {
          if (this.createForm.items.length === 0 || this.createForm.items.every(item => !item.returnQuantity || item.returnQuantity === 0)) {
            this.$message.warning('请至少添加一个有效退货明细')
            return
          }
          
          // 模拟创建成功
          setTimeout(() => {
            this.$message.success('退货单创建成功')
            this.createDialogVisible = false
            this.loadReturnOrders()
          }, 500)
        }
      })
    },
    
    // 提交处理
    submitProcessing() {
      this.$refs.processForm.validate((valid) => {
        if (valid) {
          // 模拟处理成功
          setTimeout(() => {
            this.$message.success('退货单处理成功')
            this.processDialogVisible = false
            this.loadReturnOrders()
          }, 500)
        }
      })
    },
    
    // 确认操作
    confirmAction() {
      if (this.confirmActionType === 'cancel') {
        // 模拟取消成功
        setTimeout(() => {
          this.$message.success('退货单取消成功')
          this.confirmDialogVisible = false
          this.loadReturnOrders()
        }, 500)
      }
    },
    
    // 获取状态标签类型
    getStatusTagType(status) {
      const typeMap = {
        'PENDING': 'warning',
        'PROCESSING': 'primary',
        'COMPLETED': 'success',
        'CANCELLED': 'danger'
      }
      return typeMap[status] || 'info'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        'PENDING': '待处理',
        'PROCESSING': '处理中',
        'COMPLETED': '已完成',
        'CANCELLED': '已取消'
      }
      return textMap[status] || status
    },
    
    // 获取退货方式文本
    getReturnMethodText(method) {
      const textMap = {
        'RETURN_GOODS': '退货',
        'REFUND_ONLY': '仅退款',
        'REPLACEMENT': '换货'
      }
      return textMap[method] || method
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      return date
    },
    
    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return ''
      return dateTime
    },
    
    // 格式化货币
    formatCurrency(value) {
      if (value === null || value === undefined || value === '') return '0.00'
      return Number(value).toFixed(2)
    },
    
    // 回厂单分页处理
    handleReceiptCurrentChange(val) {
      this.receiptCurrentPage = val
      this.searchReceipts()
    },
    
    handleReceiptSizeChange(val) {
      this.receiptPageSize = val
      this.receiptCurrentPage = 1
      this.searchReceipts()
    }
  }
}
</script>

<style scoped>
.return-processing-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.search-form {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.view-dialog-content {
  max-height: 600px;
  overflow-y: auto;
}

.basic-info-card h3,
.items-card h3,
.attachments-card h3,
.history-card h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.info-item {
  margin-bottom: 8px;
}

.info-item .label {
  font-weight: bold;
  color: #606266;
  margin-right: 5px;
}

.total-info {
  font-weight: bold;
  color: #333;
}

.total-value {
  color: #f56c6c;
  font-size: 18px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
  flex: 1;
}

.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e6e6e6;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-dot {
  position: absolute;
  left: -18px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #409eff;
}

.timeline-content {
  padding-left: 15px;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.timeline-text {
  font-size: 14px;
  color: #333;
}

.timeline-operator {
  font-weight: bold;
  color: #409eff;
  margin-right: 5px;
}

.timeline-remark {
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  padding: 5px 10px;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>