package com.enterprise.brain.modules.analytics.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;

/**
 * 数据分析DTO
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
public class DataAnalysisDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 分析类型
     */
    private String analysisType;

    /**
     * 数据源
     */
    private String dataSource;

    /**
     * 开始日期
     */
    private LocalDate startDate;

    /**
     * 结束日期
     */
    private LocalDate endDate;

    /**
     * 维度字段
     */
    private String[] dimensions;

    /**
     * 指标字段
     */
    private String[] metrics;

    /**
     * 分组字段
     */
    private String groupBy;

    /**
     * 筛选条件(JSON)
     */
    private String filters;

    /**
     * 聚合方式(sum,avg,count,max,min)
     */
    private String aggregation;
}
