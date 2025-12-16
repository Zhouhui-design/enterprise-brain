-- 修复产品手册图片字段类型
-- 问题：productImage字段可能是VARCHAR类型，无法存储大型Base64图片数据
-- 解决：将字段类型改为LONGTEXT，支持存储4GB数据

USE enterprise_brain;

-- 修改productImage字段类型为LONGTEXT
ALTER TABLE product_manual 
MODIFY COLUMN productImage LONGTEXT COMMENT '产品图片Base64数据';

-- 验证修改
DESCRIBE product_manual;
