package com.enterprise.brain.modules.system.audit.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.enterprise.brain.modules.system.audit.entity.DataChangeRecord;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DataChangeRepository extends BaseMapper<DataChangeRecord> {
}
