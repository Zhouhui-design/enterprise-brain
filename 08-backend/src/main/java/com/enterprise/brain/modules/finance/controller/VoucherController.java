package com.enterprise.brain.modules.finance.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 凭证控制器
 * 
 * @author Enterprise Brain
 */
@RestController
@RequestMapping("/api/finance/vouchers")
@Tag(name = "凭证管理", description = "凭证管理接口")
public class VoucherController {

    @Operation(summary = "凭证列表")
    public String list() {
        return "凭证列表";
    }
}