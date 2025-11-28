package com.enterprise.brain.common.base;

import com.baomidou.mybatisplus.extension.service.IService;

/**
 * Service基础接口
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 * @param <T> 实体类型
 */
public interface BaseService<T> extends IService<T> {

    /**
     * 根据ID逻辑删除
     *
     * @param id 主键ID
     * @return 是否成功
     */
    default boolean logicDeleteById(Long id) {
        return removeById(id);
    }

    /**
     * 根据ID批量逻辑删除
     *
     * @param ids 主键ID列表
     * @return 是否成功
     */
    default boolean logicDeleteByIds(java.util.Collection<Long> ids) {
        return removeByIds(ids);
    }
}
