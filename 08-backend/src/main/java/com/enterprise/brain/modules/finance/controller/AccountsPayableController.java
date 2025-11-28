package com.enterprise.brain.modules.finance.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 应付账款控制器
 * 
 * @author Enterprise Brain
 */
@RestController
@RequestMapping("/api/finance/accounts-payable")
@Tag(name = "应付账款管理", description = "应付账款管理接口")
public class AccountsPayableController {

    @Operation(summary = "应付账款列表")
    public String list() {
        return "应付账款列表";
    }
}