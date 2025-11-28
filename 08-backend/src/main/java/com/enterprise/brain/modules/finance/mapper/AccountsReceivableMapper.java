package com.enterprise.brain.modules.finance.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.enterprise.brain.modules.finance.entity.AccountsReceivable;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 应收账款Mapper接口
 * 
 * @author enterprise
 * @date 2024-01-01
 */
@Mapper
public interface AccountsReceivableMapper extends BaseMapper<AccountsReceivable> {

    /**
     * 查询应收账款列表
     * @param params 查询参数
     * @return 应收账款列表
     */
    List<AccountsReceivable> selectAccountsReceivableList(@Param("params") Map<String, Object> params);

    /**
     * 查询账龄分析数据
     * @param asOfDate 截至日期
     * @param params 其他查询参数
     * @return 账龄分析数据
     */
    List<Map<String, Object>> selectAgingAnalysis(@Param("asOfDate") String asOfDate, @Param("params") Map<String, Object> params);

    /**
     * 查询回款提醒列表
     * @param params 查询参数
     * @return 回款提醒列表
     */
    List<Map<String, Object>> selectPaymentReminderList(@Param("params") Map<String, Object> params);

    /**
     * 查询客户应收账款统计
     * @param customerIds 客户ID列表
     * @return 统计数据
     */
    List<Map<String, Object>> selectCustomerReceivableStats(@Param("customerIds") List<Long> customerIds);

    /**
     * 查询即将到期的应收账款
     * @param days 天数
     * @return 即将到期的应收账款列表
     */
    List<AccountsReceivable> selectDueSoonReceivables(@Param("days") int days);

    /**
     * 查询逾期的应收账款
     * @return 逾期的应收账款列表
     */
    List<AccountsReceivable> selectOverdueReceivables();
}