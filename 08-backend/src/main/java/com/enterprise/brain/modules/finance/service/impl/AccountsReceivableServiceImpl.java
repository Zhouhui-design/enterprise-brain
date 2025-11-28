package com.enterprise.brain.modules.finance.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.enterprise.brain.modules.finance.entity.AccountsReceivable;
import com.enterprise.brain.modules.finance.mapper.AccountsReceivableMapper;
import com.enterprise.brain.modules.finance.repository.AccountsReceivableRepository;
import com.enterprise.brain.modules.finance.service.AccountsReceivableService;
import com.enterprise.brain.modules.finance.vo.AccountsReceivableVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 应收账款服务实现类
 * 
 * @author enterprise
 * @date 2024-01-01
 */
@Service
public class AccountsReceivableServiceImpl extends ServiceImpl<AccountsReceivableRepository, AccountsReceivable> implements AccountsReceivableService {

    @Autowired
    private AccountsReceivableMapper accountsReceivableMapper;

    @Override
    public List<AccountsReceivableVO> getAccountsReceivableList(Map<String, Object> params) {
        List<AccountsReceivable> list = accountsReceivableMapper.selectAccountsReceivableList(params);
        // 转换为VO对象
        return list.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getAgingAnalysis(String asOfDate, Map<String, Object> params) {
        try {
            // 先获取应收账款数据
            List<AccountsReceivable> receivables = accountsReceivableMapper.selectAccountsReceivableList(params);
            
            // 转换为LocalDate对象进行计算
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate analysisDate = LocalDate.parse(asOfDate, formatter);
            
            // 处理账龄分析数据
            List<Map<String, Object>> agingData = new ArrayList<>();
            BigDecimal totalReceivable = BigDecimal.ZERO;
            BigDecimal overdueAmount = BigDecimal.ZERO;
            int overdueCustomerCount = 0;
            int totalCustomerCount = 0;
            
            // 按客户分组处理
            Map<String, List<AccountsReceivable>> receivablesByCustomer = receivables.stream()
                    .collect(Collectors.groupingBy(AccountsReceivable::getCustomerName));
            
            totalCustomerCount = receivablesByCustomer.size();
            
            for (Map.Entry<String, List<AccountsReceivable>> entry : receivablesByCustomer.entrySet()) {
                String customerName = entry.getKey();
                List<AccountsReceivable> customerReceivables = entry.getValue();
                
                Map<String, Object> customerData = new HashMap<>();
                customerData.put("customerName", customerName);
                
                // 获取第一个记录的客户信息（实际项目中应从客户表获取）
                AccountsReceivable firstReceivable = customerReceivables.get(0);
                customerData.put("customerType", "direct"); // 示例数据
                customerData.put("salesPerson", "张三"); // 示例数据
                customerData.put("creditLimit", new BigDecimal(1000000)); // 示例数据
                customerData.put("creditLevel", "AAA"); // 示例数据
                
                // 计算客户的各项账龄数据
                BigDecimal customerTotal = BigDecimal.ZERO;
                BigDecimal days0To30 = BigDecimal.ZERO;
                BigDecimal days31To60 = BigDecimal.ZERO;
                BigDecimal days61To90 = BigDecimal.ZERO;
                BigDecimal days91To180 = BigDecimal.ZERO;
                BigDecimal daysOver180 = BigDecimal.ZERO;
                int maxOverdueDays = 0;
                
                for (AccountsReceivable ar : customerReceivables) {
                    BigDecimal outstanding = ar.getOutstandingAmount();
                    if (outstanding == null || outstanding.compareTo(BigDecimal.ZERO) <= 0) {
                        continue;
                    }
                    
                    customerTotal = customerTotal.add(outstanding);
                    
                    // 计算逾期天数
                    int overdueDays = 0;
                    if (ar.getDueDate() != null) {
                        // 将LocalDateTime转换为LocalDate进行计算
                        LocalDate dueDate = ar.getDueDate().toLocalDate();
                        overdueDays = (int) ChronoUnit.DAYS.between(dueDate, analysisDate);
                    }
                    
                    if (overdueDays > maxOverdueDays) {
                        maxOverdueDays = overdueDays;
                    }
                    
                    // 按逾期天数分类
                    if (overdueDays <= 0) {
                        // 未逾期或在0-30天内
                        days0To30 = days0To30.add(outstanding);
                    } else if (overdueDays <= 30) {
                        days0To30 = days0To30.add(outstanding);
                    } else if (overdueDays <= 60) {
                        days31To60 = days31To60.add(outstanding);
                    } else if (overdueDays <= 90) {
                        days61To90 = days61To90.add(outstanding);
                    } else if (overdueDays <= 180) {
                        days91To180 = days91To180.add(outstanding);
                    } else {
                        daysOver180 = daysOver180.add(outstanding);
                    }
                }
                
                // 填充客户账龄数据
                customerData.put("currentBalance", customerTotal);
                customerData.put("days0To30", days0To30);
                customerData.put("days31To60", days31To60);
                customerData.put("days61To90", days61To90);
                customerData.put("days91To180", days91To180);
                customerData.put("daysOver180", daysOver180);
                customerData.put("overdueDays", maxOverdueDays);
                
                // 判断账龄级别和风险级别
                String agingLevel = "success"; // 默认正常
                String riskLevel = "low"; // 默认低风险
                
                if (maxOverdueDays > 0) {
                    overdueAmount = overdueAmount.add(customerTotal);
                    overdueCustomerCount++;
                    
                    if (maxOverdueDays <= 30) {
                        agingLevel = "warning";
                        riskLevel = "medium";
                    } else if (maxOverdueDays <= 90) {
                        agingLevel = "warning";
                        riskLevel = "high";
                    } else {
                        agingLevel = "danger";
                        riskLevel = "high";
                    }
                }
                
                customerData.put("agingLevel", agingLevel);
                customerData.put("riskLevel", riskLevel);
                customerData.put("lastPaymentDate", "2024-01-15"); // 示例数据
                
                agingData.add(customerData);
                totalReceivable = totalReceivable.add(customerTotal);
            }
            
            // 构建返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("data", agingData); // 保持与前端期望的格式一致
            
            // 计算汇总数据
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalReceivable", totalReceivable);
            summary.put("overdueAmount", overdueAmount);
            summary.put("overdueRate", totalReceivable.compareTo(BigDecimal.ZERO) > 0 
                    ? overdueAmount.divide(totalReceivable, 4, BigDecimal.ROUND_HALF_UP).multiply(new BigDecimal(100)) 
                    : BigDecimal.ZERO);
            summary.put("overdueCustomerCount", overdueCustomerCount);
            summary.put("overdueCustomerRate", totalCustomerCount > 0 
                    ? new BigDecimal(overdueCustomerCount).divide(new BigDecimal(totalCustomerCount), 4, BigDecimal.ROUND_HALF_UP).multiply(new BigDecimal(100)) 
                    : BigDecimal.ZERO);
            summary.put("avgAgingDays", agingData.isEmpty() ? 0 : 
                    agingData.stream().mapToInt(item -> (int) item.getOrDefault("overdueDays", 0)).average().orElse(0));
            
            // 计算账龄分布
            Map<String, BigDecimal> agingDistribution = new HashMap<>();
            agingDistribution.put("days0To30", agingData.stream()
                    .map(item -> (BigDecimal) item.getOrDefault("days0To30", BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            agingDistribution.put("days31To60", agingData.stream()
                    .map(item -> (BigDecimal) item.getOrDefault("days31To60", BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            agingDistribution.put("days61To90", agingData.stream()
                    .map(item -> (BigDecimal) item.getOrDefault("days61To90", BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            agingDistribution.put("days91To180", agingData.stream()
                    .map(item -> (BigDecimal) item.getOrDefault("days91To180", BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            agingDistribution.put("daysOver180", agingData.stream()
                    .map(item -> (BigDecimal) item.getOrDefault("daysOver180", BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            
            summary.put("agingDistribution", agingDistribution);
            
            // 添加其他需要的统计数据
            summary.put("badDebtRiskAmount", agingData.stream()
                    .filter(item -> "high".equals(item.getOrDefault("riskLevel", "")))
                    .map(item -> (BigDecimal) item.getOrDefault("currentBalance", BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            
            // 添加趋势数据（示例）
            List<Map<String, Object>> agingTrend = new ArrayList<>();
            
            for (int i = 5; i >= 0; i--) {
                LocalDate trendDate = analysisDate.minusMonths(i);
                Map<String, Object> trendData = new HashMap<>();
                trendData.put("month", trendDate.format(formatter));
                trendData.put("amount", totalReceivable.multiply(new BigDecimal(0.95 - i * 0.01))); // 模拟趋势
                agingTrend.add(trendData);
            }
            
            summary.put("agingTrend", agingTrend);
            
            result.put("summary", summary);
            result.put("code", 200);
            result.put("message", "success");
            
            return result;
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("code", 500);
            errorResult.put("message", "获取账龄分析数据失败: " + e.getMessage());
            return errorResult;
        }
    }

    @Override
    public Map<String, Object> getPaymentReminderList(Map<String, Object> params) {
        List<Map<String, Object>> reminders = accountsReceivableMapper.selectPaymentReminderList(params);
        
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("list", reminders);
        result.put("total", reminders.size());
        
        // 计算统计数据
        Map<String, Object> stats = new java.util.HashMap<>();
        // 这里可以计算各种统计指标
        
        result.put("stats", stats);
        return result;
    }

    @Override
    @Transactional
    public boolean createPaymentReminder(Map<String, Object> reminderData) {
        // 实现创建回款提醒的逻辑
        return true;
    }

    @Override
    @Transactional
    public boolean updatePaymentReminder(Map<String, Object> reminderData) {
        // 实现更新回款提醒的逻辑
        return true;
    }

    @Override
    @Transactional
    public boolean sendPaymentReminder(Long reminderId) {
        // 实现发送回款提醒的逻辑
        return true;
    }

    @Override
    @Transactional
    public boolean cancelPaymentReminder(Long reminderId) {
        // 实现取消回款提醒的逻辑
        return true;
    }

    @Override
    @Transactional
    public boolean addPaymentFollowUp(Map<String, Object> followUpData) {
        // 实现添加付款跟进记录的逻辑
        return true;
    }

    @Override
    public List<Map<String, Object>> getPaymentFollowUpRecords(Long reminderId) {
        // 实现获取付款跟进记录的逻辑
        return new java.util.ArrayList<>();
    }

    @Override
    public byte[] exportAgingReport(Map<String, Object> params) {
        try {
            // 获取账龄分析数据
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            String asOfDate = params.get("asOfDate") != null ? params.get("asOfDate").toString() : LocalDate.now().format(formatter);
            Map<String, Object> agingAnalysis = getAgingAnalysis(asOfDate, params);
            
            // 创建Excel工作簿
            org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
            
            // 创建汇总信息sheet
            org.apache.poi.ss.usermodel.Sheet summarySheet = workbook.createSheet("汇总信息");
            
            // 设置列宽
            summarySheet.setColumnWidth(0, 5000);
            summarySheet.setColumnWidth(1, 8000);
            summarySheet.setColumnWidth(2, 8000);
            
            // 创建标题行
            org.apache.poi.ss.usermodel.Row titleRow = summarySheet.createRow(0);
            org.apache.poi.ss.usermodel.Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("账龄分析报告");
            
            // 合并单元格
            org.apache.poi.ss.usermodel.CellStyle titleStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setBold(true);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
            titleCell.setCellStyle(titleStyle);
            summarySheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 2));
            
            // 添加生成日期
            org.apache.poi.ss.usermodel.Row dateRow = summarySheet.createRow(1);
            org.apache.poi.ss.usermodel.Cell dateCell = dateRow.createCell(0);
            dateCell.setCellValue("生成日期：");
            org.apache.poi.ss.usermodel.Cell dateValueCell = dateRow.createCell(1);
            dateValueCell.setCellValue(LocalDate.now().format(formatter));
            
            // 添加截至日期
            org.apache.poi.ss.usermodel.Row asOfRow = summarySheet.createRow(2);
            org.apache.poi.ss.usermodel.Cell asOfCell = asOfRow.createCell(0);
            asOfCell.setCellValue("截至日期：");
            org.apache.poi.ss.usermodel.Cell asOfValueCell = asOfRow.createCell(1);
            asOfValueCell.setCellValue(asOfDate);
            
            // 添加汇总数据行标题
            org.apache.poi.ss.usermodel.Row summaryTitleRow = summarySheet.createRow(4);
            org.apache.poi.ss.usermodel.Cell summaryTitleCell = summaryTitleRow.createCell(0);
            summaryTitleCell.setCellValue("汇总指标");
            summaryTitleRow.createCell(1).setCellValue("数值");
            summaryTitleRow.createCell(2).setCellValue("单位");
            
            // 设置汇总标题样式
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
            headerStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
            headerStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
            headerStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
            
            for (int i = 0; i < 3; i++) {
                summaryTitleRow.getCell(i).setCellStyle(headerStyle);
            }
            
            // 添加汇总数据
            if (agingAnalysis != null && agingAnalysis.containsKey("summary")) {
                Map<String, Object> summaryData = (Map<String, Object>) agingAnalysis.get("summary");
                int rowNum = 5;
                
                // 定义汇总指标
                Map<String, String[]> metrics = new LinkedHashMap<>();
                metrics.put("totalReceivable", new String[] {"应收账款总额", "元"});
                metrics.put("overdueAmount", new String[] {"逾期金额", "元"});
                metrics.put("overdueRate", new String[] {"逾期率", "%"});
                metrics.put("overdueCustomerCount", new String[] {"逾期客户数", "个"});
                metrics.put("overdueCustomerRate", new String[] {"逾期客户占比", "%"});
                metrics.put("avgAgingDays", new String[] {"平均账龄天数", "天"});
                metrics.put("badDebtRiskAmount", new String[] {"坏账风险金额", "元"});
                
                // 设置数据单元格样式
                org.apache.poi.ss.usermodel.CellStyle dataStyle = workbook.createCellStyle();
                dataStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                // 设置数字单元格样式
                org.apache.poi.ss.usermodel.CellStyle numberStyle = workbook.createCellStyle();
                numberStyle.cloneStyleFrom(dataStyle);
                numberStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));
                
                // 填充汇总数据
                for (Map.Entry<String, String[]> entry : metrics.entrySet()) {
                    String key = entry.getKey();
                    String[] metricInfo = entry.getValue();
                    
                    org.apache.poi.ss.usermodel.Row row = summarySheet.createRow(rowNum++);
                    
                    org.apache.poi.ss.usermodel.Cell nameCell = row.createCell(0);
                    nameCell.setCellValue(metricInfo[0]);
                    nameCell.setCellStyle(dataStyle);
                    
                    org.apache.poi.ss.usermodel.Cell valueCell = row.createCell(1);
                    Object value = summaryData.get(key);
                    if (value != null) {
                        if (value instanceof BigDecimal) {
                            valueCell.setCellValue(((BigDecimal) value).doubleValue());
                            valueCell.setCellStyle(numberStyle);
                        } else if (value instanceof Number) {
                            valueCell.setCellValue(((Number) value).doubleValue());
                            valueCell.setCellStyle(numberStyle);
                        } else {
                            valueCell.setCellValue(value.toString());
                            valueCell.setCellStyle(dataStyle);
                        }
                    }
                    
                    org.apache.poi.ss.usermodel.Cell unitCell = row.createCell(2);
                    unitCell.setCellValue(metricInfo[1]);
                    unitCell.setCellStyle(dataStyle);
                }
            }
            
            // 创建账龄分布sheet
            org.apache.poi.ss.usermodel.Sheet detailSheet = workbook.createSheet("账龄明细");
            
            // 设置列宽
            detailSheet.setColumnWidth(0, 5000);
            detailSheet.setColumnWidth(1, 8000);
            detailSheet.setColumnWidth(2, 6000);
            for (int i = 3; i <= 8; i++) {
                detailSheet.setColumnWidth(i, 6000);
            }
            detailSheet.setColumnWidth(9, 6000);
            detailSheet.setColumnWidth(10, 6000);
            
            // 创建详情表头
            String[] headers = {"序号", "客户名称", "客户类型", "销售负责人", "当前余额", "0-30天", "31-60天", "61-90天", "91-180天", "180天以上", "逾期天数", "风险等级", "最后付款日期"};
            org.apache.poi.ss.usermodel.Row detailHeaderRow = detailSheet.createRow(0);
            
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = detailHeaderRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // 添加详情数据
            if (agingAnalysis != null && agingAnalysis.containsKey("data")) {
                List<Map<String, Object>> agingData = (List<Map<String, Object>>) agingAnalysis.get("data");
                int rowNum = 1;
                
                for (int i = 0; i < agingData.size(); i++) {
                    Map<String, Object> rowData = agingData.get(i);
                    org.apache.poi.ss.usermodel.Row row = detailSheet.createRow(rowNum++);
                    
                    // 序号
                    row.createCell(0).setCellValue(i + 1);
                    
                    // 客户名称
                    row.createCell(1).setCellValue(rowData.getOrDefault("customerName", "").toString());
                    
                    // 客户类型
                    row.createCell(2).setCellValue(rowData.getOrDefault("customerType", "").toString());
                    
                    // 销售负责人
                    row.createCell(3).setCellValue(rowData.getOrDefault("salesPerson", "").toString());
                    
                    // 当前余额
                    Object balance = rowData.getOrDefault("currentBalance", BigDecimal.ZERO);
                    if (balance instanceof BigDecimal) {
                        row.createCell(4).setCellValue(((BigDecimal) balance).doubleValue());
                    }
                    
                    // 0-30天
                    Object days0To30 = rowData.getOrDefault("days0To30", BigDecimal.ZERO);
                    if (days0To30 instanceof BigDecimal) {
                        row.createCell(5).setCellValue(((BigDecimal) days0To30).doubleValue());
                    }
                    
                    // 31-60天
                    Object days31To60 = rowData.getOrDefault("days31To60", BigDecimal.ZERO);
                    if (days31To60 instanceof BigDecimal) {
                        row.createCell(6).setCellValue(((BigDecimal) days31To60).doubleValue());
                    }
                    
                    // 61-90天
                    Object days61To90 = rowData.getOrDefault("days61To90", BigDecimal.ZERO);
                    if (days61To90 instanceof BigDecimal) {
                        row.createCell(7).setCellValue(((BigDecimal) days61To90).doubleValue());
                    }
                    
                    // 91-180天
                    Object days91To180 = rowData.getOrDefault("days91To180", BigDecimal.ZERO);
                    if (days91To180 instanceof BigDecimal) {
                        row.createCell(8).setCellValue(((BigDecimal) days91To180).doubleValue());
                    }
                    
                    // 180天以上
                    Object daysOver180 = rowData.getOrDefault("daysOver180", BigDecimal.ZERO);
                    if (daysOver180 instanceof BigDecimal) {
                        row.createCell(9).setCellValue(((BigDecimal) daysOver180).doubleValue());
                    }
                    
                    // 逾期天数
                    row.createCell(10).setCellValue(rowData.getOrDefault("overdueDays", 0).toString());
                    
                    // 风险等级
                    String riskLevel = rowData.getOrDefault("riskLevel", "").toString();
                    String riskLevelText = "低风险";
                    if ("medium".equals(riskLevel)) {
                        riskLevelText = "中风险";
                    } else if ("high".equals(riskLevel)) {
                        riskLevelText = "高风险";
                    }
                    row.createCell(11).setCellValue(riskLevelText);
                    
                    // 最后付款日期
                    row.createCell(12).setCellValue(rowData.getOrDefault("lastPaymentDate", "").toString());
                }
            }
            
            // 将工作簿写入字节数组
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            workbook.close();
            
            return outputStream.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            // 如果导出失败，返回一个空的字节数组
            return new byte[0];
        }
    }

    /**
     * 将实体对象转换为VO对象
     */
    private AccountsReceivableVO convertToVO(AccountsReceivable entity) {
        AccountsReceivableVO vo = new AccountsReceivableVO();
        // 复制属性
        vo.setId(entity.getId());
        vo.setCustomerId(entity.getCustomerId());
        vo.setCustomerName(entity.getCustomerName());
        vo.setCustomerCode(entity.getCustomerCode());
        vo.setContractNumber(entity.getContractNumber());
        vo.setOrderNumber(entity.getOrderNumber());
        vo.setInvoiceNumber(entity.getInvoiceNumber());
        vo.setInvoiceDate(entity.getInvoiceDate());
        vo.setDueDate(entity.getDueDate());
        vo.setAmount(entity.getAmount());
        vo.setPaidAmount(entity.getPaidAmount());
        vo.setOutstandingAmount(entity.getOutstandingAmount());
        vo.setStatus(entity.getStatus());
        vo.setRemark(entity.getRemark());
        vo.setCreatedAt(entity.getCreatedAt());
        vo.setUpdatedAt(entity.getUpdatedAt());
        
        return vo;
    }
}