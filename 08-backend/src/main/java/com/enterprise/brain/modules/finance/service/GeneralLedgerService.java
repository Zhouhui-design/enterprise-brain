package com.enterprise.brain.modules.finance.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.enterprise.brain.modules.finance.dto.request.GeneralLedgerCreateRequest;
import com.enterprise.brain.modules.finance.dto.request.GeneralLedgerQueryRequest;
import com.enterprise.brain.modules.finance.dto.request.GeneralLedgerUpdateRequest;
import com.enterprise.brain.modules.finance.dto.response.GeneralLedgerListResponse;
import com.enterprise.brain.modules.finance.dto.response.GeneralLedgerResponse;
import com.enterprise.brain.modules.finance.entity.GeneralLedger;

/**
 * 总账服务接口
 * 
 * @author Enterprise Brain
 */
public interface GeneralLedgerService extends IService<GeneralLedger> {

    /**
     * 创建总账记录
     * 
     * @param request 创建请求
     * @return 总账响应
     */
    GeneralLedgerResponse createGeneralLedger(GeneralLedgerCreateRequest request);

    /**
     * 更新总账记录
     * 
     * @param request 更新请求
     * @return 总账响应
     */
    GeneralLedgerResponse updateGeneralLedger(GeneralLedgerUpdateRequest request);

    /**
     * 根据ID获取总账记录
     * 
     * @param id 主键ID
     * @return 总账响应
     */
    GeneralLedgerResponse getGeneralLedgerById(Long id);

    /**
     * 分页查询总账记录
     * 
     * @param request 查询请求
     * @param current 当前页
     * @param size 每页大小
     * @return 总账列表响应
     */
    GeneralLedgerListResponse listGeneralLedgers(GeneralLedgerQueryRequest request, int current, int size);

    /**
     * 删除总账记录
     * 
     * @param id 主键ID
     * @return 是否删除成功
     */
    boolean deleteGeneralLedger(Long id);
}