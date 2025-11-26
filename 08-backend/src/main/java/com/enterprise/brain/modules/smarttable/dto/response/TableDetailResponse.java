package com.enterprise.brain.modules.smarttable.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.extern.jackson.Jacksonized;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 表格详情响应DTO
 * 用于返回智能表格的详细信息，包括基本属性、列配置和元数据
 * 
 * @author Enterprise Brain Team
 * @version 2.0.0
 * @since 2024-01-01
 */
@Data
@Builder
@Jacksonized
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "表格详情响应信息")
public class TableDetailResponse {
    
    /**
     * 表格ID
     * 数据库中的唯一标识符
     */
    @Schema(description = "表格ID", example = "1001", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long id;
    
    /**
     * 表格名称
     * 用户自定义的表格名称
     */
    @Schema(description = "表格名称", example = "销售数据统计表", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;
    
    /**
     * 表格描述
     * 表格的详细说明信息
     */
    @Schema(description = "表格描述", example = "用于记录和分析月度销售数据的智能表格")
    private String description;
    
    /**
     * 列配置列表
     * 表格的所有列定义信息
     */
    @Schema(description = "列配置列表", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<ColumnConfigResponse> columns;
    
    /**
     * 创建者ID
     * 表格创建者的用户标识
     */
    @Schema(description = "创建者ID", example = "10001", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long createUserId;
    
    /**
     * 创建者名称
     * 表格创建者的用户名
     */
    @Schema(description = "创建者名称", example = "张三")
    private String createUserName;
    
    /**
     * 创建时间
     * 表格创建的时间戳
     */
    @Schema(description = "创建时间", example = "2024-01-01T10:00:00", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     * 表格最后更新的时间戳
     */
    @Schema(description = "更新时间", example = "2024-01-01T15:30:00", requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
    
    /**
     * 表格状态
     * 0-正常，1-冻结，2-删除
     */
    @Schema(description = "表格状态", example = "0", allowableValues = {"0", "1", "2"})
    private Integer status;
    
    /**
     * 是否公开
     * true-公开表格，false-私有表格
     */
    @Schema(description = "是否公开", example = "false")
    private Boolean isPublic;
    
    /**
     * 行数统计
     * 表格当前的数据行数
     */
    @Schema(description = "行数统计", example = "150")
    private Integer rowCount;
    
    /**
     * 列数统计
     * 表格的列总数
     */
    @Schema(description = "列数统计", example = "10")
    private Integer columnCount;
    
    /**
     * 最后操作者ID
     * 最后修改表格的用户ID
     */
    @Schema(description = "最后操作者ID", example = "10002")
    private Long lastOperatorId;
    
    /**
     * 最后操作者名称
     * 最后修改表格的用户名
     */
    @Schema(description = "最后操作者名称", example = "李四")
    private String lastOperatorName;
    
    /**
     * 标签列表
     * 表格的标签分类信息
     */
    @Schema(description = "标签列表", example = "[\"销售\", \"月度\", \"统计\"]")
    private List<String> tags;
    
    /**
     * 权限级别
     * 0-只读，1-编辑，2-管理
     */
    @Schema(description = "权限级别", example = "1", allowableValues = {"0", "1", "2"})
    private Integer permissionLevel;
}