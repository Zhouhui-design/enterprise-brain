-- 业务模块数据库表结构
-- 创建时间：2024-11-27
-- 版本：V1.1.0

-- =================
-- 产品管理模块
-- =================

-- 产品分类表
CREATE TABLE IF NOT EXISTS `product_category` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    `parent_id` BIGINT DEFAULT 0 COMMENT '父分类ID',
    `category_name` VARCHAR(100) NOT NULL COMMENT '分类名称',
    `category_code` VARCHAR(50) UNIQUE COMMENT '分类编码',
    `category_desc` TEXT COMMENT '分类描述',
    `sort_order` INT DEFAULT 0 COMMENT '排序号',
    `is_enabled` TINYINT DEFAULT 1 COMMENT '是否启用(0-禁用 1-启用)',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除(0-未删除 1-已删除)',
    INDEX `idx_parent_id` (`parent_id`),
    INDEX `idx_category_code` (`category_code`),
    INDEX `idx_sort_order` (`sort_order`),
    INDEX `idx_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品分类表';

-- 产品信息表
CREATE TABLE IF NOT EXISTS `product` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '产品ID',
    `product_code` VARCHAR(100) NOT NULL UNIQUE COMMENT '产品编码',
    `product_name` VARCHAR(200) NOT NULL COMMENT '产品名称',
    `product_spec` VARCHAR(500) COMMENT '产品规格',
    `category_id` BIGINT COMMENT '分类ID',
    `unit` VARCHAR(20) COMMENT '单位',
    `standard_price` DECIMAL(15,4) DEFAULT 0 COMMENT '标准价格',
    `cost_price` DECIMAL(15,4) DEFAULT 0 COMMENT '成本价格',
    `min_stock` DECIMAL(15,4) DEFAULT 0 COMMENT '最小库存量',
    `max_stock` DECIMAL(15,4) DEFAULT 0 COMMENT '最大库存量',
    `description` TEXT COMMENT '产品描述',
    `status` TINYINT DEFAULT 1 COMMENT '状态(0-停产 1-正常 2-新品)',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_product_code` (`product_code`),
    INDEX `idx_product_name` (`product_name`),
    INDEX `idx_category_id` (`category_id`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`category_id`) REFERENCES `product_category`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品信息表';

-- =================
-- 销售模块
-- =================

-- 客户信息表
CREATE TABLE IF NOT EXISTS `customer` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '客户ID',
    `customer_code` VARCHAR(100) NOT NULL UNIQUE COMMENT '客户编码',
    `customer_name` VARCHAR(200) NOT NULL COMMENT '客户名称',
    `customer_type` TINYINT DEFAULT 1 COMMENT '客户类型(1-个人 2-企业)',
    `contact_person` VARCHAR(100) COMMENT '联系人',
    `contact_phone` VARCHAR(50) COMMENT '联系电话',
    `contact_email` VARCHAR(100) COMMENT '联系邮箱',
    `address` VARCHAR(500) COMMENT '地址',
    `credit_limit` DECIMAL(15,2) DEFAULT 0 COMMENT '信用额度',
    `payment_terms` VARCHAR(100) COMMENT '付款条件',
    `status` TINYINT DEFAULT 1 COMMENT '状态(0-禁用 1-正常)',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_customer_code` (`customer_code`),
    INDEX `idx_customer_name` (`customer_name`),
    INDEX `idx_customer_type` (`customer_type`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户信息表';

-- 销售订单表
CREATE TABLE IF NOT EXISTS `sales_order` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
    `order_no` VARCHAR(100) NOT NULL UNIQUE COMMENT '订单号',
    `customer_id` BIGINT NOT NULL COMMENT '客户ID',
    `order_date` DATE NOT NULL COMMENT '订单日期',
    `delivery_date` DATE COMMENT '交付日期',
    `total_amount` DECIMAL(15,2) DEFAULT 0 COMMENT '订单总金额',
    `discount_amount` DECIMAL(15,2) DEFAULT 0 COMMENT '折扣金额',
    `tax_amount` DECIMAL(15,2) DEFAULT 0 COMMENT '税额',
    `final_amount` DECIMAL(15,2) DEFAULT 0 COMMENT '最终金额',
    `order_status` TINYINT DEFAULT 1 COMMENT '订单状态(1-待确认 2-已确认 3-生产中 4-已完成 5-已取消)',
    `remarks` TEXT COMMENT '备注',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_order_no` (`order_no`),
    INDEX `idx_customer_id` (`customer_id`),
    INDEX `idx_order_date` (`order_date`),
    INDEX `idx_order_status` (`order_status`),
    FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='销售订单表';

-- 销售订单明细表
CREATE TABLE IF NOT EXISTS `sales_order_item` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '明细ID',
    `order_id` BIGINT NOT NULL COMMENT '订单ID',
    `product_id` BIGINT NOT NULL COMMENT '产品ID',
    `quantity` DECIMAL(15,4) NOT NULL COMMENT '数量',
    `unit_price` DECIMAL(15,4) NOT NULL COMMENT '单价',
    `discount_rate` DECIMAL(5,4) DEFAULT 0 COMMENT '折扣率',
    `line_amount` DECIMAL(15,2) COMMENT '行金额',
    `delivery_date` DATE COMMENT '交付日期',
    `remarks` VARCHAR(500) COMMENT '备注',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_order_id` (`order_id`),
    INDEX `idx_product_id` (`product_id`),
    FOREIGN KEY (`order_id`) REFERENCES `sales_order`(`id`),
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='销售订单明细表';

-- =================
-- 采购模块
-- =================

-- 供应商信息表
CREATE TABLE IF NOT EXISTS `supplier` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '供应商ID',
    `supplier_code` VARCHAR(100) NOT NULL UNIQUE COMMENT '供应商编码',
    `supplier_name` VARCHAR(200) NOT NULL COMMENT '供应商名称',
    `contact_person` VARCHAR(100) COMMENT '联系人',
    `contact_phone` VARCHAR(50) COMMENT '联系电话',
    `contact_email` VARCHAR(100) COMMENT '联系邮箱',
    `address` VARCHAR(500) COMMENT '地址',
    `payment_terms` VARCHAR(100) COMMENT '付款条件',
    `quality_grade` CHAR(1) DEFAULT 'C' COMMENT '质量等级(A-优秀 B-良好 C-一般 D-较差)',
    `status` TINYINT DEFAULT 1 COMMENT '状态(0-禁用 1-正常)',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_supplier_code` (`supplier_code`),
    INDEX `idx_supplier_name` (`supplier_name`),
    INDEX `idx_quality_grade` (`quality_grade`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='供应商信息表';

-- 采购订单表
CREATE TABLE IF NOT EXISTS `purchase_order` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '采购订单ID',
    `order_no` VARCHAR(100) NOT NULL UNIQUE COMMENT '采购订单号',
    `supplier_id` BIGINT NOT NULL COMMENT '供应商ID',
    `order_date` DATE NOT NULL COMMENT '订单日期',
    `expected_date` DATE COMMENT '预期到货日期',
    `total_amount` DECIMAL(15,2) DEFAULT 0 COMMENT '订单总金额',
    `tax_amount` DECIMAL(15,2) DEFAULT 0 COMMENT '税额',
    `final_amount` DECIMAL(15,2) DEFAULT 0 COMMENT '最终金额',
    `order_status` TINYINT DEFAULT 1 COMMENT '订单状态(1-待确认 2-已确认 3-部分到货 4-全部到货 5-已取消)',
    `remarks` TEXT COMMENT '备注',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_order_no` (`order_no`),
    INDEX `idx_supplier_id` (`supplier_id`),
    INDEX `idx_order_date` (`order_date`),
    INDEX `idx_order_status` (`order_status`),
    FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='采购订单表';

-- 采购订单明细表
CREATE TABLE IF NOT EXISTS `purchase_order_item` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '明细ID',
    `order_id` BIGINT NOT NULL COMMENT '采购订单ID',
    `product_id` BIGINT NOT NULL COMMENT '产品ID',
    `quantity` DECIMAL(15,4) NOT NULL COMMENT '采购数量',
    `unit_price` DECIMAL(15,4) NOT NULL COMMENT '采购单价',
    `line_amount` DECIMAL(15,2) COMMENT '行金额',
    `received_quantity` DECIMAL(15,4) DEFAULT 0 COMMENT '已收货数量',
    `expected_date` DATE COMMENT '预期到货日期',
    `remarks` VARCHAR(500) COMMENT '备注',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_order_id` (`order_id`),
    INDEX `idx_product_id` (`product_id`),
    FOREIGN KEY (`order_id`) REFERENCES `purchase_order`(`id`),
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='采购订单明细表';

-- =================
-- 库存管理模块
-- =================

-- 仓库信息表
CREATE TABLE IF NOT EXISTS `warehouse` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '仓库ID',
    `warehouse_code` VARCHAR(100) NOT NULL UNIQUE COMMENT '仓库编码',
    `warehouse_name` VARCHAR(200) NOT NULL COMMENT '仓库名称',
    `warehouse_type` TINYINT DEFAULT 1 COMMENT '仓库类型(1-原料仓 2-成品仓 3-半成品仓)',
    `address` VARCHAR(500) COMMENT '仓库地址',
    `manager` VARCHAR(100) COMMENT '仓库管理员',
    `capacity` DECIMAL(15,2) COMMENT '仓库容量',
    `status` TINYINT DEFAULT 1 COMMENT '状态(0-停用 1-正常)',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_warehouse_code` (`warehouse_code`),
    INDEX `idx_warehouse_name` (`warehouse_name`),
    INDEX `idx_warehouse_type` (`warehouse_type`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='仓库信息表';

-- 库存记录表
CREATE TABLE IF NOT EXISTS `inventory` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '库存ID',
    `warehouse_id` BIGINT NOT NULL COMMENT '仓库ID',
    `product_id` BIGINT NOT NULL COMMENT '产品ID',
    `on_hand_qty` DECIMAL(15,4) DEFAULT 0 COMMENT '现有库存数量',
    `available_qty` DECIMAL(15,4) DEFAULT 0 COMMENT '可用数量',
    `allocated_qty` DECIMAL(15,4) DEFAULT 0 COMMENT '已分配数量',
    `reserved_qty` DECIMAL(15,4) DEFAULT 0 COMMENT '预留数量',
    `last_in_date` DATE COMMENT '最后入库日期',
    `last_out_date` DATE COMMENT '最后出库日期',
    `avg_cost` DECIMAL(15,4) DEFAULT 0 COMMENT '平均成本',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY `uk_warehouse_product` (`warehouse_id`, `product_id`),
    INDEX `idx_product_id` (`product_id`),
    FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`),
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存记录表';

-- 库存事务表
CREATE TABLE IF NOT EXISTS `inventory_transaction` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '事务ID',
    `transaction_no` VARCHAR(100) NOT NULL UNIQUE COMMENT '事务编号',
    `warehouse_id` BIGINT NOT NULL COMMENT '仓库ID',
    `product_id` BIGINT NOT NULL COMMENT '产品ID',
    `transaction_type` TINYINT NOT NULL COMMENT '事务类型(1-入库 2-出库 3-调拨 4-盘点)',
    `quantity` DECIMAL(15,4) NOT NULL COMMENT '数量(正数入库,负数出库)',
    `unit_cost` DECIMAL(15,4) COMMENT '单位成本',
    `reference_type` VARCHAR(50) COMMENT '关联单据类型',
    `reference_id` BIGINT COMMENT '关联单据ID',
    `transaction_date` DATE NOT NULL COMMENT '事务日期',
    `remarks` VARCHAR(500) COMMENT '备注',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `created_by` BIGINT COMMENT '创建人',
    INDEX `idx_transaction_no` (`transaction_no`),
    INDEX `idx_warehouse_id` (`warehouse_id`),
    INDEX `idx_product_id` (`product_id`),
    INDEX `idx_transaction_type` (`transaction_type`),
    INDEX `idx_transaction_date` (`transaction_date`),
    INDEX `idx_reference` (`reference_type`, `reference_id`),
    FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`),
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存事务表';