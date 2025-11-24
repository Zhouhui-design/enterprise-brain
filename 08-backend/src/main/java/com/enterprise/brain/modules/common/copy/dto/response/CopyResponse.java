// src/main/java/com/enterprise/brain/modules/common/copy/dto/response/CopyResponse.java
package com.enterprise.brain.modules.common.copy.dto.response;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 复制操作响应DTO
 * 返回复制操作的结果给前端
 */
@Data
@ApiModel("复制操作响应结果")
public class CopyResponse {
    @ApiModelProperty(value = "操作是否成功")
    private Boolean success;
    
    @ApiModelProperty(value = "消息提示")
    private String message;
    
    @ApiModelProperty(value = "模板ID（当保存为模板时返回）")
    private Long templateId;
    
    @ApiModelProperty(value = "复制的内容ID（用于追踪）")
    private String copyId;
}
