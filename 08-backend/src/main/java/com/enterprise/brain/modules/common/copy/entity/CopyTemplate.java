// src/main/java/com/enterprise/brain/modules/common/copy/entity/CopyTemplate.java
package com.enterprise.brain.modules.common.copy.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 复制模板实体类
 * 存储可复用的复制模板信息
 */
@Data
@TableName("t_copy_template") // 数据库表名，可根据实际调整
public class CopyTemplate {
    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 模板名称
     */
    private String name;
    
    /**
     * 模板类型（如：销售订单、BOM、物料等）
     * 可根据业务扩展枚举类型
     */
    private String type;
    
    /**
     * 模板内容（JSON格式存储）
     */
    private String content;
    
    /**
     * 创建人ID
     */
    private Long createBy;
    
    /**
     * 创建时间
     */
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
    
    /**
     * 是否删除（0-未删，1-已删）
     */
    private Integer isDeleted;
}
