package com.enterprise.brain.modules.finance.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 账户余额控制器
 * 
 * @author Enterprise Brain
 */
@RestController
@RequestMapping("/api/finance/account-balances")
@Tag(name = "账户余额管理", description = "账户余额管理接口")
public class AccountBalanceController {

    @Operation(summary = "账户余额列表")
    public String list() {
        return "账户余额列表";
    }
}