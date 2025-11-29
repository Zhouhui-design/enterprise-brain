-- 08-backend/src/main/resources/db/migration/V1__create_smart_table.sql
CREATE TABLE `smart_table` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `table_name` varchar(100) NOT NULL COMMENT '表格名称',
  `table_code` varchar(50) NOT NULL COMMENT '表格编码',
  `config` text COMMENT '表格配置JSON',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `created_by` bigint NOT NULL COMMENT '创建人',
  `created_time` datetime NOT NULL COMMENT '创建时间',
  `updated_by` bigint DEFAULT NULL COMMENT '更新人',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_table_code` (`table_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能表格配置表';

CREATE TABLE `smart_table_column` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `table_id` bigint NOT NULL COMMENT '表格ID',
  `column_name` varchar(100) NOT NULL COMMENT '列名称',
  `column_code` varchar(50) NOT NULL COMMENT '列编码',
  `column_type` varchar(20) NOT NULL COMMENT '列类型',
  `sort` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_required` tinyint NOT NULL DEFAULT '0' COMMENT '是否必填：0-否，1-是',
  `created_time` datetime NOT NULL COMMENT '创建时间',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_table_id` (`table_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能表格列配置表';
