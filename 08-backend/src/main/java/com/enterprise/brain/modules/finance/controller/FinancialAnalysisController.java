package com.enterprise.brain.modules.finance.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 财务分析控制器
 * 
 * @author Enterprise Brain
 */
@RestController
@RequestMapping("/api/finance/analysis")
@Tag(name = "财务分析管理", description = "财务分析管理接口")
public class FinancialAnalysisController {

    @Operation(summary = "财务分析列表")
    public String list() {
        return "财务分析列表";
    }
}