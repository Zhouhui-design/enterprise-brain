package com.enterprise.brain.modules.analytics.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.io.Serializable;

/**
 * 报表查询DTO
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
public class ReportQueryDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 报表ID
     */
    @NotNull(message = "报表ID不能为空")
    private Long reportId;

    /**
     * 筛选参数(JSON格式)
     */
    private String filterParams;

    /**
     * 排序字段
     */
    private String sortField;

    /**
     * 排序方式(ASC/DESC)
     */
    private String sortOrder;

    /**
     * 页码
     */
    private Integer pageNum;

    /**
     * 每页数量
     */
    private Integer pageSize;

    /**
     * 是否导出
     */
    private Boolean export;

    /**
     * 导出格式(excel/pdf/csv)
     */
    private String exportFormat;
}
