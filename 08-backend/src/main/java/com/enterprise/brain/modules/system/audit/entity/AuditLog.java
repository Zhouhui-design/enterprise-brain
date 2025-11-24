package com.enterprise.brain.modules.system.audit.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_audit_log")
public class AuditLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String userId;
    private String userName;
    private String operation;
    private String module;
    private String ipAddress;
    private LocalDateTime operationTime;
    private String details;
}
