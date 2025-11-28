package com.enterprise.brain.modules.finance.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 财务报表控制器
 * 
 * @author Enterprise Brain
 */
@RestController
@RequestMapping("/api/finance/reports")
@Tag(name = "财务报表管理", description = "财务报表管理接口")
public class FinanceReportController {

    @Operation(summary = "财务报表列表")
    public String list() {
        return "财务报表列表";
    }
}