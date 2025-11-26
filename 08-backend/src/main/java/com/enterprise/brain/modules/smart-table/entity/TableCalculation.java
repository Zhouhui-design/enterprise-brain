package com.enterprise.brain.modules.smart-table.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.Date;
import java.util.Map;
import java.util.HashMap;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 表格计算结果实体类
 * 
 * <p>记录表格中公式计算的历史结果和相关信息。</p>
 * <p>支持计算结果的缓存、审计、性能分析等功能。</p>
 * 
 * <p>主要功能：</p>
 * <ul>
 *   <li>计算结果记录：存储公式计算的详细结果</li>
 *   <li>计算过程日志：记录计算过程的详细信息</li>
 *   <li>性能监控：记录计算耗时和系统资源使用情况</li>
 *   <li>结果缓存：支持计算结果缓存以提高性能</li>
 *   <li>错误处理：记录计算失败的原因和错误信息</li>
 * </ul>
 * 
 * @author enterprise-brain-team
 * @version 2.0
 * @since 2024-01-01
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "table_calculation",
       indexes = {
           @Index(name = "idx_calculation_table_id", columnList = "table_id"),
           @Index(name = "idx_calculation_formula_id", columnList = "formula_id"),
           @Index(name = "idx_calculation_success", columnList = "calculation_success"),
           @Index(name = "idx_calculation_create_time", columnList = "create_time"),
           @Index(name = "idx_calculation_cache_key", columnList = "cache_key")
       })
@EqualsAndHashCode(callSuper = false, exclude = {"table", "formula", "createUser"})
public class TableCalculation {
    
    // ==================== 主键字段 ====================
    
    /**
     * 计算记录主键ID
     * 
     * <p>采用数据库自增策略生成主键。</p>
     * <p>用于唯一标识计算记录。</p>
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;
    
    // ==================== 关联字段 ====================
    
    /**
     * 关联的智能表格
     * 
     * <p>指向执行计算的智能表格实体。</p>
     * <p>用于建立计算结果与表格的关联关系。</p>
     */
    @NotNull(message = "表格ID不能为空")
    @Column(name = "table_id", nullable = false, columnDefinition = "BIGINT NOT NULL COMMENT '表格ID'")
    private Long tableId;
    
    /**
     * 关联的表格公式
     * 
     * <p>指向执行的公式实体。</p>
     * <p>用于记录具体的计算公式。</p>
     */
    @NotNull(message = "公式ID不能为空")
    @Column(name = "formula_id", nullable = false, columnDefinition = "BIGINT NOT NULL COMMENT '公式ID'")
    private Long formulaId;
    
    /**
     * 关联的单元格信息
     * 
     * <p>指向触发计算的具体单元格。</p>
     * <p>用于精确定位计算结果的来源。</p>
     */
    @Column(name = "cell_id", columnDefinition = "VARCHAR(64) COMMENT '单元格ID'")
    private String cellId;
    
    /**
     * 计算触发行信息
     * 
     * <p>记录触发计算的用户ID、行号、列号等信息。</p>
     * <p>用于计算结果的可追溯性。</p>
     */
    @Column(name = "trigger_info", columnDefinition = "JSON COMMENT '计算触发行信息'")
    private String triggerInfo;
    
    // ==================== 计算结果字段 ====================
    
    /**
     * 计算结果值
     * 
     * <p>公式计算的结果值。</p>
     * <p>支持多种数据类型：字符串、数字、布尔值、日期等。</p>
     * <p>支持最大2000个字符的结果值。</p>
     */
    @Size(max = 2000, message = "计算结果不能超过2000个字符")
    @Column(name = "calculation_result", columnDefinition = "TEXT COMMENT '计算结果值'")
    private String calculationResult;
    
    /**
     * 结果数据类型
     * 
     * <p>标识计算结果的数据类型：</p>
     * <ul>
     *   <li>STRING: 字符串类型</li>
     *   <li>NUMBER: 数字类型</li>
     *   <li>BOOLEAN: 布尔类型</li>
     *   <li>DATE: 日期类型</li>
     *   <li>ERROR: 错误类型</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "result_type", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'STRING' COMMENT '结果数据类型'")
    private ResultType resultType = ResultType.STRING;
    
    /**
     * 计算成功标识
     * 
     * <p>标识计算是否成功执行：</p>
     * <ul>
     *   <li>true: 计算成功，结果有效</li>
     *   <li>false: 计算失败，检查错误日志</li>
     * </ul>
     * <p>默认值为false，计算成功后设置为true。</p>
     */
    @Builder.Default
    @Column(name = "calculation_success", nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0 COMMENT '计算成功标识'")
    private Boolean calculationSuccess = false;
    
    /**
     * 数字结果值
     * 
     * <p>当结果为数字类型时的精确值。</p>
     * <p>支持19位精度，10位小数的金融级计算。</p>
     */
    @Column(name = "numeric_result", precision = 19, scale = 10, columnDefinition = "DECIMAL(19,10) COMMENT '数字结果值'")
    private BigDecimal numericResult;
    
    /**
     * 计算耗时（毫秒）
     * 
     * <p>记录公式计算所需的时间（毫秒）。</p>
     * <p>用于性能分析和优化。</p>
     */
    @Column(name = "calculation_duration", nullable = false, columnDefinition = "BIGINT NOT NULL DEFAULT 0 COMMENT '计算耗时（毫秒）'")
    private Long calculationDuration = 0L;
    
    // ==================== 日志和调试字段 ====================
    
    /**
     * 计算过程日志
     * 
     * <p>详细记录公式计算的中间步骤和调试信息。</p>
     * <p>支持最大5000个字符的详细日志。</p>
     */
    @Size(max = 5000, message = "计算日志不能超过5000个字符")
    @Column(name = "calculation_log", columnDefinition = "TEXT COMMENT '计算过程日志'")
    private String calculationLog;
    
    /**
     * 错误信息
     * 
     * <p>当计算失败时记录的错误信息。</p>
     * <p>支持最大1000个字符的错误描述。</p>
     */
    @Size(max = 1000, message = "错误信息不能超过1000个字符")
    @Column(name = "error_message", columnDefinition = "VARCHAR(1000) COMMENT '错误信息'")
    private String errorMessage;
    
    /**
     * 计算参数快照
     * 
     * <p>记录计算时的输入参数快照。</p>
     * <p>用于问题复现和调试分析。</p>
     * <p>支持JSON格式的复杂参数存储。</p>
     */
    @Column(name = "parameter_snapshot", columnDefinition = "JSON COMMENT '计算参数快照'")
    private String parameterSnapshot;
    
    // ==================== 缓存和性能字段 ====================
    
    /**
     * 缓存键
     * 
     * <p>用于缓存计算结果的唯一标识键。</p>
     * <p>基于表格ID、公式ID、单元格ID和参数哈希生成。</p>
     */
    @Column(name = "cache_key", length = 128, columnDefinition = "VARCHAR(128) COMMENT '缓存键'")
    private String cacheKey;
    
    /**
     * 缓存过期时间
     * 
     * <p>缓存结果的过期时间戳。</p>
     * <p>用于自动清理过期的缓存数据。</p>
     */
    @Column(name = "cache_expires_at", columnDefinition = "DATETIME COMMENT '缓存过期时间'")
    private Date cacheExpiresAt;
    
    /**
     * 计算次数
     * 
     * <p>记录该计算被引用的次数。</p>
     * <p>用于识别热门计算和缓存策略优化。</p>
     */
    @Column(name = "reference_count", nullable = false, columnDefinition = "INT DEFAULT 0 COMMENT '引用次数'")
    private Integer referenceCount = 0;
    
    // ==================== 状态管理字段 ====================
    
    /**
     * 是否为缓存结果
     * 
     * <p>标识当前结果是否来自缓存。</p>
     * <p>用于性能统计和缓存效果分析。</p>
     */
    @Builder.Default
    @Column(name = "is_cached_result", nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为缓存结果'")
    private Boolean isCachedResult = false;
    
    /**
     * 计算状态
     * 
     * <p>跟踪计算的执行状态：</p>
     * <ul>
     *   <li>PENDING: 等待执行</li>
     *   <li>RUNNING: 正在计算</li>
     *   <li>COMPLETED: 计算完成</li>
     *   <li>FAILED: 计算失败</li>
     *   <li>CANCELLED: 计算取消</li>
     * </ul>
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "calculation_status", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '计算状态'")
    private CalculationStatus calculationStatus = CalculationStatus.PENDING;
    
    // ==================== 审计和版本字段 ====================
    
    /**
     * 计算发起者ID
     * 
     * <p>触发计算的用户ID。</p>
     * <p>用于操作审计和权限控制。</p>
     */
    @Column(name = "initiator_user_id", columnDefinition = "BIGINT COMMENT '计算发起者ID'")
    private Long initiatorUserId;
    
    /**
     * 计算会话ID
     * 
     * <p>用于批量计算操作的会话标识。</p>
     * <p>支持批量计算的事务管理和追踪。</p>
     */
    @Column(name = "session_id", length = 64, columnDefinition = "VARCHAR(64) COMMENT '计算会话ID'")
    private String sessionId;
    
    /**
     * 乐观锁版本号
     * 
     * <p>用于并发控制，防止并发更新冲突。</p>
     * <p>每次更新时自动递增。</p>
     */
    @Version
    @Builder.Default
    @Column(name = "version", nullable = false, columnDefinition = "BIGINT DEFAULT 0 COMMENT '乐观锁版本号'")
    private Long version = 0L;
    
    /**
     * 创建时间
     * 
     * <p>记录计算记录的创建时间。</p>
     * <p>创建时自动设置为当前时间。</p>
     */
    @Builder.Default
    @Column(name = "create_time", nullable = false, updatable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'")
    private Date createTime = new Date();
    
    /**
     * 更新时间
     * 
     * <p>记录计算记录的最后更新时间。</p>
     * <p>每次更新时自动设置为当前时间。</p>
     */
    @Column(name = "update_time", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'")
    private Date updateTime;
    
    /**
     * 删除标记
     * 
     * <p>逻辑删除标记，实现软删除功能：</p>
     * <ul>
     *   <li>true: 已删除，逻辑上不可用</li>
     *   <li>false: 未删除，正常状态</li>
     * </ul>
     * <p>默认值为false，删除时设置为true。</p>
     */
    @Builder.Default
    @Column(name = "is_deleted", nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0 COMMENT '删除标记'")
    private Boolean isDeleted = false;
    
    /**
     * 删除时间
     * 
     * <p>记录软删除的时间戳。</p>
     * <p>配合isDeleted字段使用，支持数据恢复。</p>
     */
    @Column(name = "delete_time", columnDefinition = "DATETIME COMMENT '删除时间'")
    private Date deleteTime;
    
    // ==================== 关联字段 ====================
    
    /**
     * 关联的智能表格
     * 
     * <p>延迟加载关联的智能表格实体。</p>
     * <p>用于获取表格详细信息。</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", foreignKey = @ForeignKey(name = "fk_calculation_table"), insertable = false, updatable = false)
    private SmartTable table;
    
    /**
     * 关联的表格公式
     * 
     * <p>延迟加载关联的公式实体。</p>
     * <p>用于获取公式详细信息。</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formula_id", foreignKey = @ForeignKey(name = "fk_calculation_formula"), insertable = false, updatable = false)
    private TableFormula formula;
    
    // ==================== 枚举定义 ====================
    
    /**
     * 结果数据类型枚举
     */
    public enum ResultType {
        STRING("字符串"),
        NUMBER("数字"),
        BOOLEAN("布尔值"),
        DATE("日期"),
        ERROR("错误"),
        ARRAY("数组"),
        OBJECT("对象");
        
        private final String description;
        
        ResultType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 计算状态枚举
     */
    public enum CalculationStatus {
        PENDING("等待执行"),
        RUNNING("正在计算"),
        COMPLETED("计算完成"),
        FAILED("计算失败"),
        CANCELLED("计算取消"),
        TIMEOUT("计算超时");
        
        private final String description;
        
        CalculationStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // ==================== 业务方法 ====================
    
    /**
     * 检查计算是否成功
     * 
     * @return true表示计算成功，false表示计算失败
     */
    public boolean isSuccessful() {
        return Boolean.TRUE.equals(calculationSuccess);
    }
    
    /**
     * 检查计算是否完成
     * 
     * @return true表示计算已完成（成功或失败），false表示正在处理
     */
    public boolean isCompleted() {
        return CalculationStatus.COMPLETED.equals(calculationStatus) ||
               CalculationStatus.FAILED.equals(calculationStatus) ||
               CalculationStatus.CANCELLED.equals(calculationStatus) ||
               CalculationStatus.TIMEOUT.equals(calculationStatus);
    }
    
    /**
     * 检查是否为错误结果
     * 
     * @return true表示结果为错误类型
     */
    public boolean isErrorResult() {
        return ResultType.ERROR.equals(resultType);
    }
    
    /**
     * 检查是否为数字结果
     * 
     * @return true表示结果为数字类型
     */
    public boolean isNumericResult() {
        return ResultType.NUMBER.equals(resultType);
    }
    
    /**
     * 检查缓存是否有效
     * 
     * @return true表示缓存有效，false表示缓存已过期
     */
    public boolean isCacheValid() {
        return cacheExpiresAt != null && cacheExpiresAt.after(new Date());
    }
    
    /**
     * 标记计算开始
     * 
     * <p>设置计算状态为运行中，记录开始时间。</p>
     */
    public void markAsStarted() {
        this.calculationStatus = CalculationStatus.RUNNING;
        this.calculationDuration = 0L;
    }
    
    /**
     * 标记计算成功完成
     * 
     * @param result 计算结果
     * @param duration 计算耗时
     */
    public void markAsCompleted(String result, Long duration) {
        this.calculationStatus = CalculationStatus.COMPLETED;
        this.calculationResult = result;
        this.calculationSuccess = true;
        this.calculationDuration = duration;
        this.errorMessage = null;
    }
    
    /**
     * 标记计算失败
     * 
     * @param error 错误信息
     * @param duration 计算耗时
     */
    public void markAsFailed(String error, Long duration) {
        this.calculationStatus = CalculationStatus.FAILED;
        this.calculationResult = null;
        this.calculationSuccess = false;
        this.resultType = ResultType.ERROR;
        this.errorMessage = error;
        this.calculationDuration = duration;
    }
    
    /**
     * 标记为缓存结果
     * 
     * @param cacheKey 缓存键
     *param expireTime 过期时间
     */
    public void markAsCached(String cacheKey, Date expireTime) {
        this.cacheKey = cacheKey;
        this.cacheExpiresAt = expireTime;
        this.isCachedResult = true;
    }
    
    /**
     * 增加引用次数
     * 
     * <p>每次引用该计算结果时调用。</p>
     */
    public void incrementReferenceCount() {
        this.referenceCount = (this.referenceCount != null ? this.referenceCount : 0) + 1;
    }
    
    /**
     * 获取结果类型描述
     * 
     * @return 结果类型的中文描述
     */
    public String getResultTypeDescription() {
        return resultType != null ? resultType.getDescription() : "未知";
    }
    
    /**
     * 获取计算状态描述
     * 
     * @return 计算状态的中文描述
     */
    public String getCalculationStatusDescription() {
        return calculationStatus != null ? calculationStatus.getDescription() : "未知";
    }
    
    /**
     * 生成缓存键
     * 
     * @param tableId 表格ID
     * @param formulaId 公式ID
     * @param cellId 单元格ID
     * @param paramsHash 参数哈希值
     * @return 唯一的缓存键
     */
    public static String generateCacheKey(Long tableId, Long formulaId, String cellId, String paramsHash) {
        return String.format("calc_%d_%d_%s_%s", tableId, formulaId, cellId, paramsHash);
    }
    
    /**
     * 创建参数快照
     * 
     * @param parameters 参数映射
     * @return JSON格式的参数快照
     */
    public static String createParameterSnapshot(Map<String, Object> parameters) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.writeValueAsString(parameters);
        } catch (Exception e) {
            return "{}";
        }
    }
    
    /**
     * 创建触发行信息
     * 
     * @param userId 用户ID
     * @param rowId 行号
     * @param columnId 列号
     * @param additionalInfo 附加信息
     * @return JSON格式的触发行信息
     */
    public static String createTriggerInfo(Long userId, Long rowId, Long columnId, String additionalInfo) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> info = new HashMap<>();
            info.put("userId", userId);
            info.put("rowId", rowId);
            info.put("columnId", columnId);
            info.put("additionalInfo", additionalInfo);
            info.put("timestamp", System.currentTimeMillis());
            return objectMapper.writeValueAsString(info);
        } catch (Exception e) {
            return "{}";
        }
    }
    
    // ==================== JPA生命周期回调 ====================
    
    /**
     * 保存前回调
     * 
     * <p>在实体保存前执行，用于设置默认值和业务校验。</p>
     */
    @PrePersist
    protected void onCreate() {
        if (createTime == null) {
            createTime = new Date();
        }
        if (calculationStatus == null) {
            calculationStatus = CalculationStatus.PENDING;
        }
        if (calculationSuccess == null) {
            calculationSuccess = false;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (referenceCount == null) {
            referenceCount = 0;
        }
        if (version == null) {
            version = 0L;
        }
    }
    
    /**
     * 更新前回调
     * 
     * <p>在实体更新前执行，用于更新时间戳和业务校验。</p>
     */
    @PreUpdate
    protected void onUpdate() {
        updateTime = new Date();
    }
}