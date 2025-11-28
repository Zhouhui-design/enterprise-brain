package com.enterprise.brain.modules.analytics.service;

import com.enterprise.brain.modules.analytics.dto.DataAnalysisDTO;

import java.util.Map;

/**
 * 数据分析Service接口
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
public interface DataAnalysisService {

    /**
     * 执行数据分析
     *
     * @param dto 分析参数
     * @return 分析结果
     */
    Map<String, Object> analyzeData(DataAnalysisDTO dto);

    /**
     * 获取销售趋势分析
     *
     * @param dto 分析参数
     * @return 分析结果
     */
    Map<String, Object> analyzeSalesTrend(DataAnalysisDTO dto);

    /**
     * 获取库存分析
     *
     * @param dto 分析参数
     * @return 分析结果
     */
    Map<String, Object> analyzeInventory(DataAnalysisDTO dto);

    /**
     * 获取生产效率分析
     *
     * @param dto 分析参数
     * @return 分析结果
     */
    Map<String, Object> analyzeProductionEfficiency(DataAnalysisDTO dto);

    /**
     * 获取客户分析
     *
     * @param dto 分析参数
     * @return 分析结果
     */
    Map<String, Object> analyzeCustomer(DataAnalysisDTO dto);
}
