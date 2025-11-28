package com.enterprise.brain.modules.finance.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.enterprise.brain.modules.finance.entity.AccountsReceivable;
import com.enterprise.brain.modules.finance.vo.AccountsReceivableVO;

import java.util.List;
import java.util.Map;

/**
 * 应收账款服务接口
 * 
 * @author enterprise
 * @date 2024-01-01
 */
public interface AccountsReceivableService extends IService<AccountsReceivable> {

    /**
     * 查询应收账款列表
     * @param params 查询参数
     * @return 应收账款列表
     */
    List<AccountsReceivableVO> getAccountsReceivableList(Map<String, Object> params);

    /**
     * 获取账龄分析数据
     * @param asOfDate 截至日期
     * @param params 其他查询参数
     * @return 账龄分析数据
     */
    Map<String, Object> getAgingAnalysis(String asOfDate, Map<String, Object> params);

    /**
     * 获取回款提醒列表
     * @param params 查询参数
     * @return 回款提醒列表
     */
    Map<String, Object> getPaymentReminderList(Map<String, Object> params);

    /**
     * 创建回款提醒
     * @param reminderData 提醒数据
     * @return 创建结果
     */
    boolean createPaymentReminder(Map<String, Object> reminderData);

    /**
     * 更新回款提醒
     * @param reminderData 提醒数据
     * @return 更新结果
     */
    boolean updatePaymentReminder(Map<String, Object> reminderData);

    /**
     * 发送回款提醒
     * @param reminderId 提醒ID
     * @return 发送结果
     */
    boolean sendPaymentReminder(Long reminderId);

    /**
     * 取消回款提醒
     * @param reminderId 提醒ID
     * @return 取消结果
     */
    boolean cancelPaymentReminder(Long reminderId);

    /**
     * 添加付款跟进记录
     * @param followUpData 跟进数据
     * @return 添加结果
     */
    boolean addPaymentFollowUp(Map<String, Object> followUpData);

    /**
     * 获取付款跟进记录
     * @param reminderId 提醒ID
     * @return 跟进记录列表
     */
    List<Map<String, Object>> getPaymentFollowUpRecords(Long reminderId);

    /**
     * 导出账龄分析报告
     * @param params 导出参数
     * @return 报告文件流
     */
    byte[] exportAgingReport(Map<String, Object> params);
}