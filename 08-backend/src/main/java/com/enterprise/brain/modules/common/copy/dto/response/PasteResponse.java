// src/main/java/com/enterprise/brain/modules/common/copy/dto/response/PasteResponse.java
package com.enterprise.brain.modules.common.copy.dto.response;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 粘贴操作响应DTO
 * 返回粘贴操作的结果给前端
 */
@Data
@ApiModel("粘贴操作响应结果")
public class PasteResponse {
    @ApiModelProperty(value = "操作是否成功")
    private Boolean success;
    
    @ApiModelProperty(value = "消息提示")
    private String message;
    
    @ApiModelProperty(value = "粘贴后生成的业务ID（如订单ID）")
    private String businessId;
    
    @ApiModelProperty(value = "历史记录ID")
    private Long historyId;
}
