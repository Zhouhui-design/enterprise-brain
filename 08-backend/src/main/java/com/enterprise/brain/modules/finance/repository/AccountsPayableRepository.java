package com.enterprise.brain.modules.finance.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.enterprise.brain.modules.finance.entity.AccountsPayable;
import org.springframework.stereotype.Repository;

/**
 * 应付账款Repository
 * 
 * @author Enterprise Brain
 */
@Repository
public interface AccountsPayableRepository extends BaseMapper<AccountsPayable> {
    
}