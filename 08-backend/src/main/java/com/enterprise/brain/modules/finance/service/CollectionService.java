package com.enterprise.brain.modules.finance.service;

import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
import java.util.Map;

/**
 * 回款管理服务接口
 * 
 * @author enterprise
 * @date 2024-01-01
 */
public interface CollectionService {

    /**
     * 获取回款计划列表
     * @param params 查询参数
     * @return 回款计划列表
     */
    Map<String, Object> getCollectionPlanList(Map<String, Object> params);

    /**
     * 创建回款计划
     * @param planData 计划数据
     * @return 创建结果
     */
    boolean createCollectionPlan(Map<String, Object> planData);

    /**
     * 更新回款计划
     * @param planData 计划数据
     * @return 更新结果
     */
    boolean updateCollectionPlan(Map<String, Object> planData);

    /**
     * 确认回款计划
     * @param planId 计划ID
     * @return 确认结果
     */
    boolean confirmCollectionPlan(Long planId);

    /**
     * 执行回款计划
     * @param planId 计划ID
     * @return 执行结果
     */
    boolean executeCollectionPlan(Long planId);

    /**
     * 完成回款计划
     * @param planId 计划ID
     * @return 完成结果
     */
    boolean completeCollectionPlan(Long planId);

    /**
     * 终止回款计划
     * @param planId 计划ID
     * @return 终止结果
     */
    boolean terminateCollectionPlan(Long planId);

    /**
     * 记录回款
     * @param paymentData 回款数据
     * @return 记录结果
     */
    boolean recordPayment(Map<String, Object> paymentData);

    /**
     * 获取回款计划详情
     * @param planId 计划ID
     * @return 计划详情
     */
    Map<String, Object> getCollectionPlanDetail(Long planId);

    /**
     * 获取回款计划执行记录
     * @param planId 计划ID
     * @return 执行记录列表
     */
    List<Map<String, Object>> getCollectionPlanExecutionRecords(Long planId);

    /**
     * 导出回款计划
     * @param params 导出参数
     * @return 导出文件流
     */
    byte[] exportCollectionPlans(Map<String, Object> params);
}