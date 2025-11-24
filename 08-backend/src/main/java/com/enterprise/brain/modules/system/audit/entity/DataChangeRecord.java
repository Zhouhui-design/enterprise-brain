package com.enterprise.brain.modules.system.audit.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_data_change_record")
public class DataChangeRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String tableName;
    private String recordId;
    private String changeType;
    private String oldValue;
    private String newValue;
    private String operatorId;
    private LocalDateTime changeTime;
}
