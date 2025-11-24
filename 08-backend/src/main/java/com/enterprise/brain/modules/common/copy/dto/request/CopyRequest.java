// src/main/java/com/enterprise/brain/modules/common/copy/dto/request/CopyRequest.java
package com.enterprise.brain.modules.common.copy.dto.request;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * 复制操作请求DTO
 * 接收前端复制操作的参数
 */
@Data
@ApiModel("复制操作请求参数")
public class CopyRequest {
    @ApiModelProperty(value = "复制内容（JSON字符串）", required = true)
    @NotBlank(message = "复制内容不能为空")
    private String content;
    
    @ApiModelProperty(value = "复制类型（如：salesOrder, bom, material, quotation）", required = true)
    @NotBlank(message = "复制类型不能为空")
    private String type;
    
    @ApiModelProperty(value = "是否保存为模板", required = false)
    private Boolean saveAsTemplate = false;
    
    @ApiModelProperty(value = "模板名称（saveAsTemplate为true时必填）", required = false)
    private String templateName;
}
