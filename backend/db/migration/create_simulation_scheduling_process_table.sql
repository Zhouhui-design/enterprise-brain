-- 创建模拟排程工序表
CREATE TABLE IF NOT EXISTS simulation_scheduling_process_table (
    -- 基础信息字段 (1-7)
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    sequence_number INT NOT NULL COMMENT '序号',
    order_status VARCHAR(50) COMMENT '订单状态',
    internal_sales_order_no VARCHAR(100) COMMENT '内部销售订单编号',
    customer_delivery_date DATE COMMENT '客户交期',
    product_code VARCHAR(100) COMMENT '产品编号',
    product_name VARCHAR(255) COMMENT '产品名称',
    suggested_replenishment_qty DECIMAL(15,2) COMMENT '建议补货数量',
    
    -- BOM和工序字段 (8-17)
    level_address VARCHAR(200) COMMENT '层阶地址',
    current_process VARCHAR(100) COMMENT '当前工序',
    current_material_code VARCHAR(100) COMMENT '当前物料编号',
    current_material_name VARCHAR(200) COMMENT '当前物料名称',
    current_required_qty DECIMAL(15,2) COMMENT '当前需求数量',
    available_inventory DECIMAL(15,2) COMMENT '可用库存',
    still_needed_qty DECIMAL(15,2) COMMENT '还需数量',
    requirement_days INT COMMENT '需求天数',
    downstream_process_name VARCHAR(200) COMMENT '后道工序名称',
    downstream_product_code VARCHAR(100) COMMENT '后道工序产品编号',
    
    -- 后道产品信息字段 (18-22)
    downstream_product_name VARCHAR(200) COMMENT '后道工序产品名称',
    total_required_by_order DECIMAL(15,2) COMMENT '按顺序总需',
    submit_time DATETIME COMMENT '提交时间',
    continue_scheduling TINYINT(1) DEFAULT 1 COMMENT '是否继续排程',
    current_level_address VARCHAR(200) COMMENT '当前层阶地址',
    
    -- BOM编号和用量字段 (23-29)
    downstream_level_address VARCHAR(200) COMMENT '后道产品层阶地址',
    level0_bom_code VARCHAR(100) COMMENT '0阶BOM编号',
    level0_bom_quantity DECIMAL(15,2) COMMENT '0阶BOM编号数量',
    level_standard_qty DECIMAL(10,4) COMMENT '层阶-0阶标准用量',
    current_level0_standard_qty DECIMAL(10,4) COMMENT '当前0阶标准用量',
    downstream_level0_standard_qty DECIMAL(10,4) COMMENT '后道0阶标准用量',
    downstream_required_qty DECIMAL(15,2) COMMENT '后道需求数量',
    
    -- 工时和排程字段 (30-40)
    downstream_available_inventory DECIMAL(15,2) COMMENT '后道可用库存',
    required_total_hours DECIMAL(10,2) COMMENT '需求总工时',
    hourly_quota DECIMAL(10,2) COMMENT '定时工额',
    planned_schedule_date DATE COMMENT '计划排程日期',
    effective_planned_date DATE COMMENT '有效计划排程日期',
    daily_remaining_hours DECIMAL(10,2) COMMENT '当天剩余工时',
    daily_cumulative_hours DECIMAL(10,2) COMMENT '当天模拟累计工时',
    current_planned_hours DECIMAL(10,2) COMMENT '当前计划排程工时',
    current_available_hours DECIMAL(10,2) COMMENT '当前可用排程工时',
    current_planned_quantity DECIMAL(15,2) COMMENT '当前计划排程数量',
    remaining_unscheduled_qty DECIMAL(15,2) COMMENT '剩余未排数量',
    
    -- 统计和来源字段 (41-50)
    current_cumulative_quantity DECIMAL(15,2) COMMENT '当前累计排程数量',
    downstream_product_source VARCHAR(50) COMMENT '后道产品来源',
    simulation_process_no VARCHAR(50) COMMENT '模拟排程工序编号',
    source_no VARCHAR(100) COMMENT '来源编号',
    source_form VARCHAR(50) COMMENT '来源表单',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模拟排程工序表';

-- 创建索引优化查询性能
CREATE INDEX idx_simulation_scheduling_internal_sales_order ON simulation_scheduling_process_table(internal_sales_order_no);
CREATE INDEX idx_simulation_scheduling_product_code ON simulation_scheduling_process_table(product_code);
CREATE INDEX idx_simulation_scheduling_level_address ON simulation_scheduling_process_table(level_address);
CREATE INDEX idx_simulation_scheduling_current_process ON simulation_scheduling_process_table(current_process);
CREATE INDEX idx_simulation_scheduling_current_material ON simulation_scheduling_process_table(current_material_code);
CREATE INDEX idx_simulation_scheduling_effective_date ON simulation_scheduling_process_table(effective_planned_date);
CREATE INDEX idx_simulation_scheduling_downstream_product ON simulation_scheduling_process_table(downstream_product_code);
CREATE INDEX idx_simulation_scheduling_simulation_no ON simulation_scheduling_process_table(simulation_process_no);
CREATE INDEX idx_simulation_scheduling_source_no ON simulation_scheduling_process_table(source_no);
CREATE INDEX idx_simulation_scheduling_sequence_number ON simulation_scheduling_process_table(sequence_number);

-- 添加唯一约束
ALTER TABLE simulation_scheduling_process_table ADD UNIQUE KEY uk_simulation_process_no (simulation_process_no);
