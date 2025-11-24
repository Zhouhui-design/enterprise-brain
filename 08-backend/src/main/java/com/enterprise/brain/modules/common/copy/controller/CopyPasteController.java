// src/main/java/com/enterprise/brain/modules/common/copy/controller/CopyPasteController.java
package com.enterprise.brain.modules.common.copy.controller;

import com.enterprise.brain.modules.common.copy.dto.request.CopyRequest;
import com.enterprise.brain.modules.common.copy.dto.request.PasteRequest;
import com.enterprise.brain.modules.common.copy.dto.response.CopyResponse;
import com.enterprise.brain.modules.common.copy.dto.response.PasteResponse;
import com.enterprise.brain.modules.common.copy.service.CopyPasteService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 复制粘贴功能控制器
 * 提供复制和粘贴的API接口
 */
@RestController
@RequestMapping("/api/common/copy-paste")
@Api(tags = "复制粘贴功能接口")
public class CopyPasteController {

    @Autowired
    private CopyPasteService copyPasteService;

    /**
     * 处理复制操作请求
     * @param request 复制请求参数
     * @return 复制操作结果
     */
    @PostMapping("/copy")
    @ApiOperation("执行复制操作")
    public CopyResponse copy(@Validated @RequestBody CopyRequest request) {
        return copyPasteService.handleCopy(request);
    }

    /**
     * 处理粘贴操作请求
     * @param request 粘贴请求参数
     * @return 粘贴操作结果
     */
    @PostMapping("/paste")
    @ApiOperation("执行粘贴操作")
    public PasteResponse paste(@Validated @RequestBody PasteRequest request) {
        return copyPasteService.handlePaste(request);
    }
}
