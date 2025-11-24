package com.enterprise.brain.modules.system.audit.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.enterprise.brain.modules.system.audit.dto.request.DataChangeQueryRequest;
import com.enterprise.brain.modules.system.audit.dto.response.DataChangeResponse;
import com.enterprise.brain.modules.system.audit.entity.DataChangeRecord;
import com.enterprise.brain.modules.system.audit.repository.DataChangeRepository;
import com.enterprise.brain.modules.system.audit.service.DataChangeService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DataChangeServiceImpl implements DataChangeService {

    @Resource
    private DataChangeRepository dataChangeRepository;

    @Override
    public Page<DataChangeResponse> getDataChanges(DataChangeQueryRequest request) {
        Page<DataChangeRecord> page = new Page<>(request.getPageNum(), request.getPageSize());
        LambdaQueryWrapper<DataChangeRecord> queryWrapper = new LambdaQueryWrapper<>();
        
        if (request.getTableName() != null) {
            queryWrapper.eq(DataChangeRecord::getTableName, request.getTableName());
        }
        if (request.getRecordId() != null) {
            queryWrapper.eq(DataChangeRecord::getRecordId, request.getRecordId());
        }
        if (request.getStartTime() != null) {
            queryWrapper.ge(DataChangeRecord::getChangeTime, request.getStartTime());
        }
        if (request.getEndTime() != null) {
            queryWrapper.le(DataChangeRecord::getChangeTime, request.getEndTime());
        }
        
        Page<DataChangeRecord> recordPage = dataChangeRepository.page(page, queryWrapper);
        Page<DataChangeResponse> responsePage = new Page<>();
        BeanUtils.copyProperties(recordPage, responsePage);
        
        List<DataChangeResponse> records = recordPage.getRecords().stream()
                .map(record -> {
                    DataChangeResponse response = new DataChangeResponse();
                    BeanUtils.copyProperties(record, response);
                    return response;
                })
                .collect(Collectors.toList());
        
        responsePage.setRecords(records);
        return responsePage;
    }

    @Override
    public boolean saveDataChange(DataChangeResponse record) {
        DataChangeRecord dataChangeRecord = new DataChangeRecord();
        BeanUtils.copyProperties(record, dataChangeRecord);
        return dataChangeRepository.insert(dataChangeRecord) > 0;
    }
}
