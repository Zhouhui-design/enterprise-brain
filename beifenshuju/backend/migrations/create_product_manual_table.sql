-- 产品手册表
CREATE TABLE IF NOT EXISTS product_manual (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
  productCode VARCHAR(100) NOT NULL UNIQUE COMMENT '产品编号',
  productName VARCHAR(255) NOT NULL COMMENT '产品名称',
  productImage TEXT COMMENT '产品图片URL',
  source TEXT COMMENT '来源（JSON数组）',
  category VARCHAR(100) COMMENT '产品分类',
  specification VARCHAR(255) COMMENT '规格型号',
  unit VARCHAR(50) DEFAULT '个' COMMENT '单位',
  status VARCHAR(50) DEFAULT '在售' COMMENT '销售状态',
  productStatus VARCHAR(50) DEFAULT '正常' COMMENT '产品状态',
  version VARCHAR(50) DEFAULT 'V1.0' COMMENT '版本号',
  isEnabled TINYINT DEFAULT 1 COMMENT '是否启用 0-禁用 1-启用',
  designer VARCHAR(100) COMMENT '设计者',
  bomMaintainer VARCHAR(100) COMMENT 'BOM维护人',
  remark TEXT COMMENT '备注',
  createTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_productCode (productCode),
  INDEX idx_category (category),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品手册表';
