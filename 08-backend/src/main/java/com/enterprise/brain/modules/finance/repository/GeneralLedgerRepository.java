package com.enterprise.brain.modules.finance.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.enterprise.brain.modules.finance.entity.GeneralLedger;
import org.springframework.stereotype.Repository;

/**
 * 总账Repository
 * 
 * @author Enterprise Brain
 */
@Repository
public interface GeneralLedgerRepository extends BaseMapper<GeneralLedger> {
    
}