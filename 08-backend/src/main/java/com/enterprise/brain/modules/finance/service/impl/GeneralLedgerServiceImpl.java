package com.enterprise.brain.modules.finance.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.enterprise.brain.modules.finance.dto.request.GeneralLedgerCreateRequest;
import com.enterprise.brain.modules.finance.dto.request.GeneralLedgerQueryRequest;
import com.enterprise.brain.modules.finance.dto.request.GeneralLedgerUpdateRequest;
import com.enterprise.brain.modules.finance.dto.response.GeneralLedgerListResponse;
import com.enterprise.brain.modules.finance.dto.response.GeneralLedgerResponse;
import com.enterprise.brain.modules.finance.entity.GeneralLedger;
import com.enterprise.brain.modules.finance.mapper.GeneralLedgerMapper;
import com.enterprise.brain.modules.finance.service.GeneralLedgerService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 总账服务实现类
 * 
 * @author Enterprise Brain
 */
@Service
public class GeneralLedgerServiceImpl extends ServiceImpl<GeneralLedgerMapper, GeneralLedger> implements GeneralLedgerService {

    @Override
    public GeneralLedgerResponse createGeneralLedger(GeneralLedgerCreateRequest request) {
        GeneralLedger generalLedger = new GeneralLedger();
        BeanUtils.copyProperties(request, generalLedger);
        generalLedger.setPostingDate(request.getBusinessDate());
        this.save(generalLedger);
        
        GeneralLedgerResponse response = new GeneralLedgerResponse();
        BeanUtils.copyProperties(generalLedger, response);
        return response;
    }

    @Override
    public GeneralLedgerResponse updateGeneralLedger(GeneralLedgerUpdateRequest request) {
        GeneralLedger generalLedger = this.getById(request.getId());
        if (generalLedger == null) {
            return null;
        }
        
        BeanUtils.copyProperties(request, generalLedger);
        this.updateById(generalLedger);
        
        GeneralLedgerResponse response = new GeneralLedgerResponse();
        BeanUtils.copyProperties(generalLedger, response);
        return response;
    }

    @Override
    public GeneralLedgerResponse getGeneralLedgerById(Long id) {
        GeneralLedger generalLedger = this.getById(id);
        if (generalLedger == null) {
            return null;
        }
        
        GeneralLedgerResponse response = new GeneralLedgerResponse();
        BeanUtils.copyProperties(generalLedger, response);
        return response;
    }

    @Override
    public GeneralLedgerListResponse listGeneralLedgers(GeneralLedgerQueryRequest request, int current, int size) {
        LambdaQueryWrapper<GeneralLedger> queryWrapper = new LambdaQueryWrapper<>();
        
        if (StringUtils.hasText(request.getVoucherNumber())) {
            queryWrapper.like(GeneralLedger::getVoucherNumber, request.getVoucherNumber());
        }
        
        if (StringUtils.hasText(request.getAccountCode())) {
            queryWrapper.like(GeneralLedger::getAccountCode, request.getAccountCode());
        }
        
        if (StringUtils.hasText(request.getAccountName())) {
            queryWrapper.like(GeneralLedger::getAccountName, request.getAccountName());
        }
        
        if (StringUtils.hasText(request.getVoucherType())) {
            queryWrapper.eq(GeneralLedger::getVoucherType, request.getVoucherType());
        }
        
        if (StringUtils.hasText(request.getAccountingPeriod())) {
            queryWrapper.eq(GeneralLedger::getAccountingPeriod, request.getAccountingPeriod());
        }
        
        queryWrapper.eq(GeneralLedger::getDeleted, 0);
        queryWrapper.orderByDesc(GeneralLedger::getCreateTime);
        
        IPage<GeneralLedger> page = this.page(new Page<>(current, size), queryWrapper);
        
        GeneralLedgerListResponse response = new GeneralLedgerListResponse();
        response.setTotal(page.getTotal());
        response.setCurrent((int) page.getCurrent());
        response.setSize((int) page.getSize());
        
        // 转换为响应对象
        response.setRecords(page.getRecords().stream().map(record -> {
            GeneralLedgerResponse resp = new GeneralLedgerResponse();
            BeanUtils.copyProperties(record, resp);
            return resp;
        }).toList());
        
        return response;
    }

    @Override
    public boolean deleteGeneralLedger(Long id) {
        return this.removeById(id);
    }
}