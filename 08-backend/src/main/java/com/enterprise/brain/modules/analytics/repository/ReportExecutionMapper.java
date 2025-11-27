package com.enterprise.brain.modules.analytics.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.enterprise.brain.modules.analytics.entity.ReportExecution;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 报表执行历史Mapper接口
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Mapper
public interface ReportExecutionMapper extends BaseMapper<ReportExecution> {

    /**
     * 获取报表执行统计信息
     *
     * @param reportId  报表ID
     * @param startTime 开始时间
     * @param endTime   结束时间
     * @return 统计信息
     */
    Map<String, Object> getExecutionStatistics(@Param("reportId") Long reportId,
                                                @Param("startTime") LocalDateTime startTime,
                                                @Param("endTime") LocalDateTime endTime);

    /**
     * 获取最近执行记录
     *
     * @param reportId 报表ID
     * @param limit    数量限制
     * @return 执行记录列表
     */
    @Select("SELECT * FROM report_execution WHERE report_id = #{reportId} ORDER BY execution_time DESC LIMIT #{limit}")
    List<ReportExecution> selectRecentExecutions(@Param("reportId") Long reportId, @Param("limit") Integer limit);
}
