-- 创建触发器：自动计算主生产计划的计划数量
-- 计划数量 = 订单数量 - 可用库存（当订单数量和可用库存都不为空时）

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS `before_insert_master_production_plans_calc_plan_quantity`;
DROP TRIGGER IF EXISTS `before_update_master_production_plans_calc_plan_quantity`;

DELIMITER $$

-- INSERT 触发器
CREATE TRIGGER `before_insert_master_production_plans_calc_plan_quantity`
BEFORE INSERT ON `master_production_plans`
FOR EACH ROW
BEGIN
  -- 如果订单数量和可用库存都不为NULL，自动计算计划数量
  IF NEW.order_quantity IS NOT NULL AND NEW.available_stock IS NOT NULL THEN
    SET NEW.plan_quantity = IF(
      NEW.available_stock >= NEW.order_quantity,
      0,
      NEW.order_quantity - NEW.available_stock
    );
  END IF;
END$$

-- UPDATE 触发器
CREATE TRIGGER `before_update_master_production_plans_calc_plan_quantity`
BEFORE UPDATE ON `master_production_plans`
FOR EACH ROW
BEGIN
  -- 如果订单数量或可用库存发生变化，重新计算计划数量
  IF (NEW.order_quantity != OLD.order_quantity OR NEW.available_stock != OLD.available_stock) 
     AND NEW.order_quantity IS NOT NULL 
     AND NEW.available_stock IS NOT NULL THEN
    SET NEW.plan_quantity = IF(
      NEW.available_stock >= NEW.order_quantity,
      0,
      NEW.order_quantity - NEW.available_stock
    );
  END IF;
END$$

DELIMITER ;

-- 验证触发器是否创建成功
SHOW TRIGGERS FROM enterprise_brain WHERE `Table` = 'master_production_plans';
