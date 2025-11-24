package com.enterprise.brain.modules.system.audit.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.enterprise.brain.modules.system.audit.dto.request.AuditQueryRequest;
import com.enterprise.brain.modules.system.audit.dto.response.AuditLogResponse;
import com.enterprise.brain.modules.system.audit.entity.AuditLog;
import com.enterprise.brain.modules.system.audit.repository.AuditLogRepository;
import com.enterprise.brain.modules.system.audit.service.AuditLogService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    @Resource
    private AuditLogRepository auditLogRepository;

    @Override
    public Page<AuditLogResponse> getAuditLogs(AuditQueryRequest request) {
        Page<AuditLog> page = new Page<>(request.getPageNum(), request.getPageSize());
        LambdaQueryWrapper<AuditLog> queryWrapper = new LambdaQueryWrapper<>();
        
        // 条件构造
        if (request.getUserName() != null) {
            queryWrapper.like(AuditLog::getUserName, request.getUserName());
        }
        if (request.getModule() != null) {
            queryWrapper.eq(AuditLog::getModule, request.getModule());
        }
        if (request.getStartTime() != null) {
            queryWrapper.ge(AuditLog::getOperationTime, request.getStartTime());
        }
        if (request.getEndTime() != null) {
            queryWrapper.le(AuditLog::getOperationTime, request.getEndTime());
        }
        
        Page<AuditLog> auditLogPage = auditLogRepository.page(page, queryWrapper);
        Page<AuditLogResponse> responsePage = new Page<>();
        BeanUtils.copyProperties(auditLogPage, responsePage);
        
        List<AuditLogResponse> records = auditLogPage.getRecords().stream()
                .map(log -> {
                    AuditLogResponse response = new AuditLogResponse();
                    BeanUtils.copyProperties(log, response);
                    return response;
                })
                .collect(Collectors.toList());
        
        responsePage.setRecords(records);
        return responsePage;
    }

    @Override
    public boolean saveAuditLog(AuditLogResponse log) {
        AuditLog auditLog = new AuditLog();
        BeanUtils.copyProperties(log, auditLog);
        return auditLogRepository.insert(auditLog) > 0;
    }
}
