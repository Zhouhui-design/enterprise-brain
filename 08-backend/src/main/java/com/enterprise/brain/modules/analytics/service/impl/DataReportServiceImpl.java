package com.enterprise.brain.modules.analytics.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.enterprise.brain.modules.analytics.dto.ReportDefinitionDTO;
import com.enterprise.brain.modules.analytics.dto.ReportQueryDTO;
import com.enterprise.brain.modules.analytics.entity.DataReport;
import com.enterprise.brain.modules.analytics.entity.ReportExecution;
import com.enterprise.brain.modules.analytics.repository.DataReportMapper;
import com.enterprise.brain.modules.analytics.repository.ReportExecutionMapper;
import com.enterprise.brain.modules.analytics.service.DataReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据报表Service实现类
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataReportServiceImpl extends ServiceImpl<DataReportMapper, DataReport> implements DataReportService {

    private final DataReportMapper dataReportMapper;
    private final ReportExecutionMapper reportExecutionMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createReport(ReportDefinitionDTO dto) {
        DataReport report = new DataReport();
        BeanUtils.copyProperties(dto, report);
        report.setCreatedTime(LocalDateTime.now());
        this.save(report);
        return report.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Boolean updateReport(Long id, ReportDefinitionDTO dto) {
        DataReport report = this.getById(id);
        if (report == null) {
            return false;
        }
        BeanUtils.copyProperties(dto, report);
        report.setUpdatedTime(LocalDateTime.now());
        return this.updateById(report);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Boolean deleteReport(Long id) {
        return this.removeById(id);
    }

    @Override
    public DataReport getReportById(Long id) {
        return this.getById(id);
    }

    @Override
    public Page<DataReport> getReportList(Page<DataReport> page, String reportType, String keyword) {
        LambdaQueryWrapper<DataReport> queryWrapper = new LambdaQueryWrapper<>();
        
        if (StringUtils.hasText(reportType)) {
            queryWrapper.eq(DataReport::getReportType, reportType);
        }
        
        if (StringUtils.hasText(keyword)) {
            queryWrapper.and(wrapper -> wrapper
                .like(DataReport::getReportName, keyword)
                .or()
                .like(DataReport::getReportCode, keyword)
            );
        }
        
        queryWrapper.orderByDesc(DataReport::getCreatedTime);
        
        return this.page(page, queryWrapper);
    }

    @Override
    public Map<String, Object> executeReport(ReportQueryDTO queryDTO) {
        Long startTime = System.currentTimeMillis();
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 获取报表定义
            DataReport report = this.getById(queryDTO.getReportId());
            if (report == null) {
                throw new RuntimeException("报表不存在");
            }
            
            // 构建查询参数
            Map<String, Object> params = new HashMap<>();
            if (StringUtils.hasText(queryDTO.getFilterParams())) {
                // 解析筛选参数
                // params = parseFilterParams(queryDTO.getFilterParams());
            }
            
            // 执行查询
            List<Map<String, Object>> data = dataReportMapper.executeReportQuery(
                report.getQuerySql(), 
                params
            );
            
            result.put("success", true);
            result.put("data", data);
            result.put("total", data.size());
            
            // 记录执行历史
            ReportExecution execution = new ReportExecution();
            execution.setReportId(queryDTO.getReportId());
            execution.setExecutionTime(LocalDateTime.now());
            execution.setExecutionDuration((int)(System.currentTimeMillis() - startTime));
            execution.setResultRows(data.size());
            execution.setExecutionStatus(1); // 成功
            reportExecutionMapper.insert(execution);
            
        } catch (Exception e) {
            log.error("执行报表失败", e);
            result.put("success", false);
            result.put("message", e.getMessage());
            
            // 记录失败历史
            ReportExecution execution = new ReportExecution();
            execution.setReportId(queryDTO.getReportId());
            execution.setExecutionTime(LocalDateTime.now());
            execution.setExecutionDuration((int)(System.currentTimeMillis() - startTime));
            execution.setExecutionStatus(2); // 失败
            execution.setErrorMessage(e.getMessage());
            reportExecutionMapper.insert(execution);
        }
        
        return result;
    }

    @Override
    public String exportReport(ReportQueryDTO queryDTO) {
        // TODO: 实现报表导出逻辑
        return null;
    }

    @Override
    public List<DataReport> getPublicReports() {
        return dataReportMapper.selectPublicReports();
    }

    @Override
    public List<DataReport> getUserReports(Long userId) {
        return dataReportMapper.selectReportsByUserId(userId);
    }
}
