package com.enterprise.brain.modules.finance.controller;

import com.enterprise.brain.modules.finance.dto.request.GeneralLedgerCreateRequest;
import com.enterprise.brain.modules.finance.dto.request.GeneralLedgerQueryRequest;
import com.enterprise.brain.modules.finance.dto.request.GeneralLedgerUpdateRequest;
import com.enterprise.brain.modules.finance.dto.response.GeneralLedgerListResponse;
import com.enterprise.brain.modules.finance.dto.response.GeneralLedgerResponse;
import com.enterprise.brain.modules.finance.service.GeneralLedgerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 总账控制器
 * 
 * @author Enterprise Brain
 */
@RestController
@RequestMapping("/api/finance/general-ledger")
@Tag(name = "总账管理", description = "总账管理接口")
public class GeneralLedgerController {

    @Autowired
    private GeneralLedgerService generalLedgerService;

    @PostMapping
    @Operation(summary = "创建总账记录")
    public GeneralLedgerResponse createGeneralLedger(@RequestBody GeneralLedgerCreateRequest request) {
        return generalLedgerService.createGeneralLedger(request);
    }

    @PutMapping
    @Operation(summary = "更新总账记录")
    public GeneralLedgerResponse updateGeneralLedger(@RequestBody GeneralLedgerUpdateRequest request) {
        return generalLedgerService.updateGeneralLedger(request);
    }

    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取总账记录")
    public GeneralLedgerResponse getGeneralLedgerById(@PathVariable Long id) {
        return generalLedgerService.getGeneralLedgerById(id);
    }

    @GetMapping
    @Operation(summary = "分页查询总账记录")
    public GeneralLedgerListResponse listGeneralLedgers(GeneralLedgerQueryRequest request,
                                                        @RequestParam(defaultValue = "1") int current,
                                                        @RequestParam(defaultValue = "20") int size) {
        return generalLedgerService.listGeneralLedgers(request, current, size);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除总账记录")
    public boolean deleteGeneralLedger(@PathVariable Long id) {
        return generalLedgerService.deleteGeneralLedger(id);
    }
}