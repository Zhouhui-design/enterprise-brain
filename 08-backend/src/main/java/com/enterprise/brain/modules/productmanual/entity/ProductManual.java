package com.enterprise.brain.modules.productmanual.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 产品手册实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_manual",
       indexes = {
           @Index(name = "idx_product_code", columnList = "product_code"),
           @Index(name = "idx_product_name", columnList = "product_name"),
           @Index(name = "idx_category", columnList = "category"),
           @Index(name = "idx_status", columnList = "status")
       })
public class ProductManual {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 产品编号
     */
    @NotBlank(message = "产品编号不能为空")
    @Size(max = 50, message = "产品编号长度不能超过50个字符")
    @Column(name = "product_code", nullable = false, length = 50)
    private String productCode;
    
    /**
     * 产品名称
     */
    @NotBlank(message = "产品名称不能为空")
    @Size(max = 200, message = "产品名称长度不能超过200个字符")
    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;
    
    /**
     * 产品图片
     */
    @Size(max = 500, message = "产品图片URL长度不能超过500个字符")
    @Column(name = "product_image", length = 500)
    private String productImage;
    
    /**
     * 产品分类
     */
    @Size(max = 100, message = "产品分类长度不能超过100个字符")
    @Column(name = "category", length = 100)
    private String category;
    
    /**
     * 产品子类
     */
    @Size(max = 100, message = "产品子类长度不能超过100个字符")
    @Column(name = "sub_category", length = 100)
    private String subCategory;
    
    /**
     * 规格型号
     */
    @Size(max = 200, message = "规格型号长度不能超过200个字符")
    @Column(name = "specification", length = 200)
    private String specification;
    
    /**
     * 单位
     */
    @Size(max = 50, message = "单位长度不能超过50个字符")
    @Column(name = "unit", length = 50)
    private String unit;
    
    /**
     * 来源
     */
    @Column(name = "source_data", columnDefinition = "TEXT")
    private String source;
    
    /**
     * 产品状态
     */
    @Size(max = 50, message = "产品状态长度不能超过50个字符")
    @Column(name = "status", length = 50)
    private String status;
    
    /**
     * 制图人员
     */
    @Size(max = 100, message = "制图人员长度不能超过100个字符")
    @Column(name = "draft_person", length = 100)
    private String draftPerson;
    
    /**
     * 打样人员
     */
    @Size(max = 100, message = "打样人员长度不能超过100个字符")
    @Column(name = "sample_person", length = 100)
    private String samplePerson;
    
    /**
     * 质检人员
     */
    @Size(max = 100, message = "质检人员长度不能超过100个字符")
    @Column(name = "qc_person", length = 100)
    private String qcPerson;
    
    /**
     * BOM维护人员
     */
    @Size(max = 100, message = "BOM维护人员长度不能超过100个字符")
    @Column(name = "bom_maintainer", length = 100)
    private String bomMaintainer;
    
    /**
     * 产品物料库维护人员
     */
    @Size(max = 100, message = "产品物料库维护人员长度不能超过100个字符")
    @Column(name = "material_maintainer", length = 100)
    private String materialMaintainer;
    
    /**
     * 产品状态（正常/待审核/已废弃）
     */
    @Size(max = 50, message = "产品状态长度不能超过50个字符")
    @Column(name = "product_status", length = 50)
    private String productStatus;
    
    /**
     * 版本号
     */
    @Size(max = 50, message = "版本号长度不能超过50个字符")
    @Column(name = "version", length = 50)
    private String version;
    
    /**
     * 是否启用
     */
    @Column(name = "is_enabled")
    private Boolean isEnabled;
    
    /**
     * 产品详述
     */
    @Column(name = "product_description", columnDefinition = "TEXT")
    private String productDescription;
    
    /**
     * 资料完善日期
     */
    @Column(name = "data_complete_date")
    private String dataCompleteDate;
    
    /**
     * 附件
     */
    @Column(name = "attachments", columnDefinition = "TEXT")
    private String attachments;
    
    /**
     * 销售单价
     */
    @Column(name = "sale_price", precision = 10, scale = 2)
    private BigDecimal salePrice;
    
    /**
     * 成本单价
     */
    @Column(name = "cost_price", precision = 10, scale = 2)
    private BigDecimal costPrice;
    
    /**
     * 当前库存
     */
    @Column(name = "stock")
    private Integer stock;
    
    /**
     * 最小库存
     */
    @Column(name = "min_stock")
    private Integer minStock;
    
    /**
     * 主要材质
     */
    @Size(max = 100, message = "主要材质长度不能超过100个字符")
    @Column(name = "material", length = 100)
    private String material;
    
    /**
     * 颜色
     */
    @Size(max = 50, message = "颜色长度不能超过50个字符")
    @Column(name = "color", length = 50)
    private String color;
    
    /**
     * 重量(kg)
     */
    @Column(name = "weight", precision = 10, scale = 3)
    private BigDecimal weight;
    
    /**
     * 尺寸
     */
    @Size(max = 100, message = "尺寸长度不能超过100个字符")
    @Column(name = "size", length = 100)
    private String size;
    
    /**
     * 主供应商
     */
    @Size(max = 200, message = "主供应商长度不能超过200个字符")
    @Column(name = "supplier", length = 200)
    private String supplier;
    
    /**
     * 生产周期(天)
     */
    @Column(name = "lead_time")
    private Integer leadTime;
    
    /**
     * 质量标准
     */
    @Size(max = 200, message = "质量标准长度不能超过200个字符")
    @Column(name = "quality_standard", length = 200)
    private String qualityStandard;
    
    /**
     * 认证证书
     */
    @Size(max = 200, message = "认证证书长度不能超过200个字符")
    @Column(name = "certification", length = 200)
    private String certification;
    
    /**
     * 产品经理
     */
    @Size(max = 100, message = "产品经理长度不能超过100个字符")
    @Column(name = "product_manager", length = 100)
    private String productManager;
    
    /**
     * 创建时间
     */
    @Column(name = "create_time")
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    @Column(name = "update_time")
    private LocalDateTime updateTime;
    
    /**
     * 备注
     */
    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;
}