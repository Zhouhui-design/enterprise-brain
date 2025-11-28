package com.enterprise.brain.modules.finance.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.enterprise.brain.modules.finance.entity.AccountsPayable;
import com.enterprise.brain.modules.finance.mapper.AccountsPayableMapper;
import com.enterprise.brain.modules.finance.service.AccountsPayableService;
import org.springframework.stereotype.Service;

/**
 * 应付账款服务实现类
 * 
 * @author Enterprise Brain
 */
@Service
public class AccountsPayableServiceImpl extends ServiceImpl<AccountsPayableMapper, AccountsPayable> implements AccountsPayableService {
    
}