package com.enterprise.brain.modules.analytics.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.enterprise.brain.modules.analytics.dto.ReportDefinitionDTO;
import com.enterprise.brain.modules.analytics.dto.ReportQueryDTO;
import com.enterprise.brain.modules.analytics.entity.DataReport;

import java.util.List;
import java.util.Map;

/**
 * 数据报表Service接口
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
public interface DataReportService {

    /**
     * 创建报表
     *
     * @param dto 报表DTO
     * @return 报表ID
     */
    Long createReport(ReportDefinitionDTO dto);

    /**
     * 更新报表
     *
     * @param id  报表ID
     * @param dto 报表DTO
     * @return 是否成功
     */
    Boolean updateReport(Long id, ReportDefinitionDTO dto);

    /**
     * 删除报表
     *
     * @param id 报表ID
     * @return 是否成功
     */
    Boolean deleteReport(Long id);

    /**
     * 获取报表详情
     *
     * @param id 报表ID
     * @return 报表信息
     */
    DataReport getReportById(Long id);

    /**
     * 获取报表列表
     *
     * @param page       分页参数
     * @param reportType 报表类型
     * @param keyword    关键词
     * @return 报表列表
     */
    Page<DataReport> getReportList(Page<DataReport> page, String reportType, String keyword);

    /**
     * 执行报表查询
     *
     * @param queryDTO 查询参数
     * @return 查询结果
     */
    Map<String, Object> executeReport(ReportQueryDTO queryDTO);

    /**
     * 导出报表
     *
     * @param queryDTO 查询参数
     * @return 文件路径
     */
    String exportReport(ReportQueryDTO queryDTO);

    /**
     * 获取公开报表列表
     *
     * @return 报表列表
     */
    List<DataReport> getPublicReports();

    /**
     * 获取用户可见报表
     *
     * @param userId 用户ID
     * @return 报表列表
     */
    List<DataReport> getUserReports(Long userId);
}
