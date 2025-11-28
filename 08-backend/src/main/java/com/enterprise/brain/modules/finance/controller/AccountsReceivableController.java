package com.enterprise.brain.modules.finance.controller;

import com.enterprise.brain.modules.finance.service.AccountsReceivableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 应收账款控制器
 * 
 * @author Enterprise Brain
 */
@RestController
@RequestMapping("/api/finance/accounts-receivable")
@Tag(name = "应收账款管理", description = "应收账款管理接口")
public class AccountsReceivableController {

    @Autowired
    private AccountsReceivableService accountsReceivableService;

    @Operation(summary = "应收账款列表")
    @GetMapping("/list")
    public ResponseEntity<?> getAccountsReceivableList(@RequestParam Map<String, Object> params) {
        try {
            return ResponseEntity.ok(accountsReceivableService.getAccountsReceivableList(params));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "获取账龄分析数据")
    @GetMapping("/aging-analysis")
    public ResponseEntity<?> getAgingAnalysis(@RequestParam String asOfDate, @RequestParam Map<String, Object> params) {
        try {
            return ResponseEntity.ok(accountsReceivableService.getAgingAnalysis(asOfDate, params));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "导出账龄分析报告")
    @GetMapping("/aging-analysis/export")
    public ResponseEntity<byte[]> exportAgingReport(@RequestParam Map<String, Object> params) {
        try {
            byte[] reportData = accountsReceivableService.exportAgingReport(params);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "aging-analysis-report.xlsx");
            return new ResponseEntity<>(reportData, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "获取回款提醒列表")
    @GetMapping("/payment-reminders")
    public ResponseEntity<?> getPaymentReminderList(@RequestParam Map<String, Object> params) {
        try {
            return ResponseEntity.ok(accountsReceivableService.getPaymentReminderList(params));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "创建回款提醒")
    @PostMapping("/payment-reminders")
    public ResponseEntity<?> createPaymentReminder(@RequestBody Map<String, Object> reminderData) {
        try {
            boolean result = accountsReceivableService.createPaymentReminder(reminderData);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "更新回款提醒")
    @PutMapping("/payment-reminders")
    public ResponseEntity<?> updatePaymentReminder(@RequestBody Map<String, Object> reminderData) {
        try {
            boolean result = accountsReceivableService.updatePaymentReminder(reminderData);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "发送回款提醒")
    @PostMapping("/payment-reminders/{id}/send")
    public ResponseEntity<?> sendPaymentReminder(@PathVariable("id") Long reminderId) {
        try {
            boolean result = accountsReceivableService.sendPaymentReminder(reminderId);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "取消回款提醒")
    @PostMapping("/payment-reminders/{id}/cancel")
    public ResponseEntity<?> cancelPaymentReminder(@PathVariable("id") Long reminderId) {
        try {
            boolean result = accountsReceivableService.cancelPaymentReminder(reminderId);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "添加付款跟进记录")
    @PostMapping("/payment-follow-ups")
    public ResponseEntity<?> addPaymentFollowUp(@RequestBody Map<String, Object> followUpData) {
        try {
            boolean result = accountsReceivableService.addPaymentFollowUp(followUpData);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "获取付款跟进记录")
    @GetMapping("/payment-follow-ups")
    public ResponseEntity<?> getPaymentFollowUpRecords(@RequestParam Long reminderId) {
        try {
            return ResponseEntity.ok(accountsReceivableService.getPaymentFollowUpRecords(reminderId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}