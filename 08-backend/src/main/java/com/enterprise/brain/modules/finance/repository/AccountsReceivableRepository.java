package com.enterprise.brain.modules.finance.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.enterprise.brain.modules.finance.entity.AccountsReceivable;
import org.springframework.stereotype.Repository;

/**
 * 应收账款Repository
 * 
 * @author Enterprise Brain
 */
@Repository
public interface AccountsReceivableRepository extends BaseMapper<AccountsReceivable> {
    
}