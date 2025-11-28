package com.enterprise.brain.modules.analytics.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.enterprise.brain.modules.analytics.dto.DashboardDTO;
import com.enterprise.brain.modules.analytics.entity.Dashboard;

import java.util.List;

/**
 * 仪表板Service接口
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
public interface DashboardService {

    /**
     * 创建仪表板
     *
     * @param dto 仪表板DTO
     * @return 仪表板ID
     */
    Long createDashboard(DashboardDTO dto);

    /**
     * 更新仪表板
     *
     * @param id  仪表板ID
     * @param dto 仪表板DTO
     * @return 是否成功
     */
    Boolean updateDashboard(Long id, DashboardDTO dto);

    /**
     * 删除仪表板
     *
     * @param id 仪表板ID
     * @return 是否成功
     */
    Boolean deleteDashboard(Long id);

    /**
     * 获取仪表板详情
     *
     * @param id 仪表板ID
     * @return 仪表板信息
     */
    Dashboard getDashboardById(Long id);

    /**
     * 获取仪表板列表
     *
     * @param page    分页参数
     * @param keyword 关键词
     * @return 仪表板列表
     */
    Page<Dashboard> getDashboardList(Page<Dashboard> page, String keyword);

    /**
     * 获取公开仪表板列表
     *
     * @return 仪表板列表
     */
    List<Dashboard> getPublicDashboards();

    /**
     * 获取用户可见仪表板
     *
     * @param userId 用户ID
     * @return 仪表板列表
     */
    List<Dashboard> getUserDashboards(Long userId);
}
