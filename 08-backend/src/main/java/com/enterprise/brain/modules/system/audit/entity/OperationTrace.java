package com.enterprise.brain.modules.system.audit.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_operation_trace")
public class OperationTrace {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String userId;
    private String sessionId;
    private String operation;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String errorMsg;
}
