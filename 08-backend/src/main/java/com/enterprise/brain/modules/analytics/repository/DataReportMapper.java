package com.enterprise.brain.modules.analytics.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.enterprise.brain.modules.analytics.entity.DataReport;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 数据报表Mapper接口
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Mapper
public interface DataReportMapper extends BaseMapper<DataReport> {

    /**
     * 执行报表查询
     *
     * @param sql    查询SQL
     * @param params 参数
     * @return 查询结果
     */
    List<Map<String, Object>> executeReportQuery(@Param("sql") String sql, @Param("params") Map<String, Object> params);

    /**
     * 获取公开报表列表
     *
     * @return 公开报表列表
     */
    @Select("SELECT * FROM report_definition WHERE is_public = 1 AND deleted = 0 ORDER BY created_time DESC")
    List<DataReport> selectPublicReports();

    /**
     * 根据报表编码查询
     *
     * @param reportCode 报表编码
     * @return 报表信息
     */
    @Select("SELECT * FROM report_definition WHERE report_code = #{reportCode} AND deleted = 0")
    DataReport selectByCode(@Param("reportCode") String reportCode);

    /**
     * 获取用户有权限的报表
     *
     * @param userId 用户ID
     * @return 报表列表
     */
    List<DataReport> selectReportsByUserId(@Param("userId") Long userId);
}
