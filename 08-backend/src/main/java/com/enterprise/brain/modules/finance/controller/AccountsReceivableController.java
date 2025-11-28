package com.enterprise.brain.modules.finance.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 应收账款控制器
 * 
 * @author Enterprise Brain
 */
@RestController
@RequestMapping("/api/finance/accounts-receivable")
@Tag(name = "应收账款管理", description = "应收账款管理接口")
public class AccountsReceivableController {

    @Operation(summary = "应收账款列表")
    public String list() {
        return "应收账款列表";
    }
}