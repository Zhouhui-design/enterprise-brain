package com.enterprise.brain.modules.analytics.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.enterprise.brain.modules.analytics.entity.Dashboard;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 仪表板Mapper接口
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Mapper
public interface DashboardMapper extends BaseMapper<Dashboard> {

    /**
     * 获取公开仪表板列表
     *
     * @return 公开仪表板列表
     */
    @Select("SELECT * FROM dashboard_definition WHERE is_public = 1 AND deleted = 0 ORDER BY created_time DESC")
    List<Dashboard> selectPublicDashboards();

    /**
     * 根据仪表板编码查询
     *
     * @param dashboardCode 仪表板编码
     * @return 仪表板信息
     */
    @Select("SELECT * FROM dashboard_definition WHERE dashboard_code = #{dashboardCode} AND deleted = 0")
    Dashboard selectByCode(@Param("dashboardCode") String dashboardCode);

    /**
     * 获取用户有权限的仪表板
     *
     * @param userId 用户ID
     * @return 仪表板列表
     */
    List<Dashboard> selectDashboardsByUserId(@Param("userId") Long userId);
}
