// src/main/java/com/enterprise/brain/modules/common/copy/entity/PasteHistory.java
package com.enterprise.brain.modules.common.copy.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 粘贴历史实体类
 * 记录用户的粘贴操作历史
 */
@Data
@TableName("t_paste_history") // 数据库表名，可根据实际调整
public class PasteHistory {
    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 关联的复制模板ID（可为空）
     */
    private Long templateId;
    
    /**
     * 粘贴内容（JSON格式）
     */
    private String content;
    
    /**
     * 粘贴类型（同复制模板类型）
     */
    private String type;
    
    /**
     * 操作人ID
     */
    private Long operatorId;
    
    /**
     * 操作时间
     */
    private LocalDateTime operateTime;
    
    /**
     * 操作结果（success/fail）
     */
    private String result;
    
    /**
     * 失败原因（result为fail时填写）
     */
    private String failReason;
}
