package com.enterprise.brain.common.base;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;

/**
 * Repository基础接口
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 * @param <T> 实体类型
 */
public interface BaseRepository<T> extends BaseMapper<T> {
    // MyBatis Plus已提供基础CRUD方法
    // 可在此处添加通用的自定义方法
}
