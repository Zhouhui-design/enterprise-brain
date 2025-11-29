package com.enterprise.brain.modules.system.initialization.service.impl;

import com.enterprise.brain.modules.system.initialization.service.DataResetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 数据重置服务实现
 * 
 * @author Enterprise Brain Team
 * @version 1.0.0
 * @since 2024-01-01
 */
@Slf4j
@Service
public class DataResetServiceImpl implements DataResetService {
    
    // 简化版本，仅保留基本结构
    @Override
    public void resetData() {
        log.info("重置系统数据");
    }
    
    @Override
    public void backupData() {
        log.info("备份系统数据");
    }
}