package com.enterprise.brain.modules.system.initialization.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

/**
 * 数据备份实体类
 *
 * @author Enterprise Brain Team
 * @since 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("sys_data_backup")
public class DataBackup {

    private static final long serialVersionUID = 1L;

    /**
     * 备份ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 备份编号
     */
    @TableField("backup_no")
    private String backupNo;

    /**
     * 备份名称
     */
    @TableField("backup_name")
    private String backupName;

    /**
     * 备份类型：FULL-完全备份，INCREMENTAL-增量备份，DIFFERENTIAL-差异备份
     */
    @TableField("backup_type")
    private String backupType;

    /**
     * 备份模式：MANUAL-手动备份，AUTO-自动备份，SCHEDULED-定时备份
     */
    @TableField("backup_mode")
    private String backupMode;

    /**
     * 备份范围：ALL-全部数据，BUSINESS-业务数据，SYSTEM-系统数据，CUSTOM-自定义范围
     */
    @TableField("backup_scope")
    private String backupScope;

    /**
     * 备份文件路径
     */
    @TableField("file_path")
    private String filePath;

    /**
     * 备份文件名
     */
    @TableField("file_name")
    private String fileName;

    /**
     * 文件大小（字节）
     */
    @TableField("file_size")
    private Long fileSize;

    /**
     * 文件MD5校验值
     */
    @TableField("file_md5")
    private String fileMd5;

    /**
     * 备份状态：PENDING-待备份，RUNNING-备份中，SUCCESS-成功，FAILED-失败，CANCELLED-已取消
     */
    @TableField("status")
    private String status;

    /**
     * 开始时间
     */
    @TableField("start_time")
    private LocalDateTime startTime;

    /**
     * 结束时间
     */
    @TableField("end_time")
    private LocalDateTime endTime;

    /**
     * 执行时长（毫秒）
     */
    @TableField("duration")
    private Long duration;

    /**
     * 压缩方式：NONE-无压缩，ZIP-ZIP压缩，GZIP-GZIP压缩
     */
    @TableField("compression_type")
    private String compressionType;

    /**
     * 压缩后大小（字节）
     */
    @TableField("compressed_size")
    private Long compressedSize;

    /**
     * 压缩率
     */
    @TableField("compression_ratio")
    private Double compressionRatio;

    /**
     * 操作者ID
     */
    @TableField("operator_id")
    private Long operatorId;

    /**
     * 操作者姓名
     */
    @TableField("operator_name")
    private String operatorName;

    /**
     * 备份描述
     */
    @TableField("description")
    private String description;

    /**
     * 备份详情（JSON格式）
     */
    @TableField("backup_detail")
    private String backupDetail;

    /**
     * 错误信息
     */
    @TableField("error_message")
    private String errorMessage;

    /**
     * 保留期限（天）
     */
    @TableField("retention_days")
    private Integer retentionDays;

    /**
     * 过期时间
     */
    @TableField("expire_time")
    private LocalDateTime expireTime;

    /**
     * 是否已过期：0-未过期，1-已过期
     */
    @TableField("is_expired")
    private Integer isExpired;

    /**
     * 最后验证时间
     */
    @TableField("last_verify_time")
    private LocalDateTime lastVerifyTime;

    /**
     * 验证状态：UNVERIFIED-未验证，PASSED-验证通过，FAILED-验证失败
     */
    @TableField("verify_status")
    private String verifyStatus;

    /**
     * 下载次数
     */
    @TableField("download_count")
    private Integer downloadCount;

    /**
     * 最后下载时间
     */
    @TableField("last_download_time")
    private LocalDateTime lastDownloadTime;

    /**
     * 创建时间
     */
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /**
     * 备注
     */
    @TableField("remark")
    private String remark;

    /**
     * 逻辑删除：0-未删除，1-已删除
     */
    @TableLogic
    @TableField("deleted")
    private Integer deleted;
}