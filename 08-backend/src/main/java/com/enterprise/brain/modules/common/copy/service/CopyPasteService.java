// src/main/java/com/enterprise/brain/modules/common/copy/service/CopyPasteService.java
package com.enterprise.brain.modules.common.copy.service;

import com.enterprise.brain.modules.common.copy.dto.request.CopyRequest;
import com.enterprise.brain.modules.common.copy.dto.request.PasteRequest;
import com.enterprise.brain.modules.common.copy.dto.response.CopyResponse;
import com.enterprise.brain.modules.common.copy.dto.response.PasteResponse;

/**
 * 复制粘贴服务接口
 * 定义复制粘贴相关的业务逻辑方法
 */
public interface CopyPasteService {

    /**
     * 处理复制操作
     * @param request 复制请求参数
     * @return 复制操作结果
     */
    CopyResponse handleCopy(CopyRequest request);

    /**
     * 处理粘贴操作
     * @param request 粘贴请求参数
     * @return 粘贴操作结果
     */
    PasteResponse handlePaste(PasteRequest request);
}
