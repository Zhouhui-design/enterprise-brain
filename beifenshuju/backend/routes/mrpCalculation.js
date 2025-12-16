const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * MRP运算：根据销售订单和生产BOM计算物料需求
 * 
 * 运算逻辑：
 * 1. 获取选中的销售订单及其产品明细
 * 2. 根据产品编号查找对应的生产BOM
 * 3. 展开BOM层级结构，计算每个物料的总需求量
 * 4. 查询物料库存，计算净需求量
 * 5. 根据物料来源（自制/外购）分类汇总
 */
router.post('/calculate', async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || orderIds.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要计算的订单'
      });
    }

    console.log(`开始MRP运算，订单数量: ${orderIds.length}`);
    console.log('订单IDs:', orderIds);

    // 1. 获取销售订单及产品明细
    const placeholders = orderIds.map(() => '?').join(',');
    const ordersQuery = `
      SELECT * FROM sales_orders 
      WHERE id IN (${placeholders})
    `;
    const orders = await pool.query(ordersQuery, orderIds);
    console.log(`获取到${orders.length}个订单`);

    // 2. 解析订单中的产品明细
    let productDemands = {}; // { productCode: totalQuantity }
    
    for (const order of orders) {
      let productList = [];
      try {
        productList = typeof order.productList === 'string' 
          ? JSON.parse(order.productList) 
          : order.productList || [];
      } catch (e) {
        console.warn(`订单${order.internalOrderNo}的产品列表解析失败:`, e.message);
        continue;
      }

      for (const product of productList) {
        const productCode = product.productCode || product.materialCode;
        const quantity = parseFloat(product.quantity || product.productQuantity || 0);
        
        if (productCode && quantity > 0) {
          productDemands[productCode] = (productDemands[productCode] || 0) + quantity;
        }
      }
    }

    console.log('产品需求汇总:', productDemands);

    // 3. 根据产品查找BOM并展开计算
    const materialRequirements = {}; // { materialCode: { quantity, source, ... } }
    
    for (const [productCode, quantity] of Object.entries(productDemands)) {
      console.log(`处理产品: ${productCode}, 数量: ${quantity}`);
      
      // 查找该产品的BOM
      const bomQuery = `
        SELECT * FROM production_boms 
        WHERE productCode = ? 
        ORDER BY createTime DESC 
        LIMIT 1
      `;
      const boms = await pool.query(bomQuery, [productCode]);
      
      if (boms.length === 0) {
        console.warn(`产品${productCode}没有对应的BOM`);
        // 没有BOM，直接作为成品需求
        if (!materialRequirements[productCode]) {
          materialRequirements[productCode] = {
            materialCode: productCode,
            materialName: productCode,
            demandQty: 0,
            source: '未知',
            level: 0,
            sourceOrders: []
          };
        }
        materialRequirements[productCode].demandQty += quantity;
        continue;
      }

      const bom = boms[0];
      
      // 解析BOM的子件列表
      let childItems = [];
      try {
        childItems = typeof bom.childItems === 'string'
          ? JSON.parse(bom.childItems)
          : bom.childItems || [];
      } catch (e) {
        console.warn(`BOM ${bom.bomCode} 的子件列表解析失败:`, e.message);
        continue;
      }

      console.log(`BOM ${bom.bomCode} 包含${childItems.length}个子件`);

      // 遍历子件，计算需求量
      for (const child of childItems) {
        const materialCode = child.childCode;
        const standardQty = parseFloat(child.standardQty || 0);
        const source = child.source || '未知';
        const level = parseInt(child.level || 0);
        
        if (!materialCode || standardQty <= 0) continue;

        // 计算该子件的总需求量 = 产品数量 * 标准用量
        const childDemandQty = quantity * standardQty;

        if (!materialRequirements[materialCode]) {
          materialRequirements[materialCode] = {
            materialCode: materialCode,
            materialName: child.childName || materialCode,
            demandQty: 0,
            source: source,
            level: level,
            sourceOrders: [],
            standardQty: standardQty
          };
        }

        materialRequirements[materialCode].demandQty += childDemandQty;
        
        // 记录来源订单
        if (!materialRequirements[materialCode].sourceOrders.includes(bom.bomCode)) {
          materialRequirements[materialCode].sourceOrders.push(bom.bomCode);
        }
      }
    }

    console.log('物料需求计算完成，共', Object.keys(materialRequirements).length, '种物料');

    // 4. 查询物料库存信息
    const materialCodes = Object.keys(materialRequirements);
    if (materialCodes.length > 0) {
      const materialPlaceholders = materialCodes.map(() => '?').join(',');
      const materialsQuery = `
        SELECT materialCode, materialName, currentStock, source 
        FROM materials 
        WHERE materialCode IN (${materialPlaceholders})
      `;
      const materials = await pool.query(materialsQuery, materialCodes);
      
      // 更新物料信息和计算净需求
      for (const material of materials) {
        const code = material.materialCode;
        if (materialRequirements[code]) {
          materialRequirements[code].materialName = material.materialName || code;
          materialRequirements[code].currentStock = parseFloat(material.currentStock || 0);
          materialRequirements[code].source = material.source || materialRequirements[code].source;
          
          // 净需求 = 需求量 - 当前库存
          const netDemand = materialRequirements[code].demandQty - materialRequirements[code].currentStock;
          materialRequirements[code].netDemandQty = Math.max(0, netDemand);
        }
      }
    }

    // 5. 分类汇总：生产需求和采购需求
    const productionRequirements = []; // 需要生产的（自制）
    const purchaseRequirements = [];   // 需要采购的（外购）
    
    for (const [code, req] of Object.entries(materialRequirements)) {
      const item = {
        ...req,
        netDemandQty: req.netDemandQty || Math.max(0, req.demandQty - (req.currentStock || 0))
      };
      
      // 根据来源分类
      if (req.source && req.source.includes('自制')) {
        productionRequirements.push(item);
      } else if (req.source && req.source.includes('外购')) {
        purchaseRequirements.push(item);
      } else {
        // 未知来源，默认放到采购
        purchaseRequirements.push(item);
      }
    }

    // 6. 统计汇总
    const summary = {
      totalMaterials: Object.keys(materialRequirements).length,
      productionCount: productionRequirements.length,
      purchaseCount: purchaseRequirements.length,
      totalDemandValue: 0, // 可以后续增加金额计算
      ordersProcessed: orders.length
    };

    const result = {
      summary,
      productionRequirements: productionRequirements.sort((a, b) => a.level - b.level),
      purchaseRequirements: purchaseRequirements.sort((a, b) => (b.netDemandQty || 0) - (a.netDemandQty || 0)),
      allRequirements: Object.values(materialRequirements).sort((a, b) => a.level - b.level),
      processedOrders: orders.map(o => ({
        orderNo: o.internalOrderNo,
        customerName: o.customerName,
        orderStatus: o.orderStatus
      }))
    };

    console.log('MRP运算完成');
    console.log('汇总:', summary);

    res.json({
      code: 200,
      data: result,
      message: 'MRP运算完成'
    });

  } catch (error) {
    console.error('MRP运算失败:', error);
    res.status(500).json({
      code: 500,
      message: `MRP运算失败: ${error.message}`
    });
  }
});

/**
 * 保存物料需求明细（产品需求）
 */
router.post('/material-demands/save', async (req, res) => {
  try {
    const { demands } = req.body;
    
    if (!demands || !Array.isArray(demands) || demands.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供需求数据'
      });
    }

    console.log(`保存${demands.length}条物料需求明细`);

    // 创建表（如果不存在）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS material_demand_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mrp_code VARCHAR(50) UNIQUE COMMENT 'MRP编码',
        source_no VARCHAR(100) COMMENT '来源单号',
        material_code VARCHAR(100) COMMENT '物料编号',
        material_name VARCHAR(255) COMMENT '物料名称',
        material_unit VARCHAR(50) DEFAULT '个' COMMENT '单位',
        source_type VARCHAR(100) COMMENT '需求来源',
        demand_qty DECIMAL(15,4) DEFAULT 0 COMMENT '需求数量',
        required_date DATE COMMENT '需求日期',
        current_stock DECIMAL(15,4) DEFAULT 0 COMMENT '当前库库存',
        in_transit_stock DECIMAL(15,4) DEFAULT 0 COMMENT '在途库存',
        in_production_stock DECIMAL(15,4) DEFAULT 0 COMMENT '在制库存',
        production_reserved_stock DECIMAL(15,4) DEFAULT 0 COMMENT '生产预扣库存',
        to_be_shipped_stock DECIMAL(15,4) DEFAULT 0 COMMENT '待发货库存',
        suggested_qty DECIMAL(15,4) DEFAULT 0 COMMENT '建议数量',
        adjusted_qty DECIMAL(15,4) DEFAULT 0 COMMENT '调整数量',
        execute_qty DECIMAL(15,4) DEFAULT 0 COMMENT '执行数量',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_mrp_code (mrp_code),
        INDEX idx_source_no (source_no),
        INDEX idx_material_code (material_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物料需求明细表'
    `);

    // ✅ 检查并添加mrp_code字段（如果不存在）
    try {
      // 检查字段是否存在
      const columns = await pool.query(`
        SHOW COLUMNS FROM material_demand_details LIKE 'mrp_code'
      `);
      
      if (columns.length === 0) {
        // 字段不存在，添加它
        await pool.query(`
          ALTER TABLE material_demand_details 
          ADD COLUMN mrp_code VARCHAR(50) UNIQUE COMMENT 'MRP编码' AFTER id
        `);
        console.log('✅ 已添加 mrp_code 字段');
      }
    } catch (error) {
      console.warn('检查/添加mrp_code字段失败:', error.message);
    }

    // ✅ 检查并添加索引（如果不存在）
    try {
      const indexes = await pool.query(`
        SHOW INDEX FROM material_demand_details WHERE Key_name = 'idx_mrp_code'
      `);
      
      if (indexes.length === 0) {
        await pool.query(`
          ALTER TABLE material_demand_details 
          ADD INDEX idx_mrp_code (mrp_code)
        `);
        console.log('✅ 已添加 idx_mrp_code 索引');
      }
    } catch (error) {
      console.warn('检查/添加mrp_code索引失败:', error.message);
    }

    // 删除同一来源单号的旧数据（避免重复）
    const sourceNos = [...new Set(demands.map(d => d.sourceNo).filter(Boolean))];
    if (sourceNos.length > 0) {
      const placeholders = sourceNos.map(() => '?').join(',');
      await pool.query(`DELETE FROM material_demand_details WHERE source_no IN (${placeholders})`, sourceNos);
    }

    // 插入新数据
    const insertQuery = `
      INSERT INTO material_demand_details (
        mrp_code, source_no, material_code, material_name, material_unit, source_type,
        demand_qty, required_date, current_stock, in_transit_stock, in_production_stock,
        production_reserved_stock, to_be_shipped_stock, suggested_qty, adjusted_qty, execute_qty
      ) VALUES ?
    `;

    const values = demands.map(d => [
      d.mrpCode || '',
      d.sourceNo || '',
      d.materialCode || '',
      d.materialName || '',
      d.materialUnit || '个',
      d.sourceType || '',
      d.demandQty || 0,
      d.requiredDate || null,
      d.currentStock || 0,
      d.inTransitStock || 0,
      d.inProductionStock || 0,
      d.productionReservedStock || 0,
      d.toBeShippedStock || 0,
      d.suggestedQty || 0,
      d.adjustedQty || 0,
      d.executeQty || 0
    ]);

    await pool.query(insertQuery, [values]);

    console.log(`✅ 成功保存${demands.length}条物料需求明细`);

    res.json({
      code: 200,
      data: { savedCount: demands.length },
      message: `成功保存${demands.length}条记录`
    });

  } catch (error) {
    console.error('保存物料需求明细失败:', error);
    res.status(500).json({
      code: 500,
      message: `保存失败: ${error.message}`
    });
  }
});

/**
 * 查询物料需求明细
 */
router.get('/material-demands', async (req, res) => {
  try {
    const { sourceNo, materialCode, page = 1, pageSize = 100 } = req.query;

    let whereClause = [];
    let params = [];

    if (sourceNo) {
      whereClause.push('source_no = ?');
      params.push(sourceNo);
    }

    if (materialCode) {
      whereClause.push('material_code LIKE ?');
      params.push(`%${materialCode}%`);
    }

    const where = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const query = `
      SELECT * FROM material_demand_details
      ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const offset = (page - 1) * pageSize;
    params.push(parseInt(pageSize), parseInt(offset));

    const demands = await pool.query(query, params);

    // 转换字段名为驼峰命名
    const result = demands.map(d => ({
      id: d.id,
      mrpCode: d.mrp_code,
      sourceNo: d.source_no,
      materialCode: d.material_code,
      materialName: d.material_name,
      materialUnit: d.material_unit,
      sourceType: d.source_type,
      demandQty: parseFloat(d.demand_qty || 0),
      requiredDate: d.required_date,
      currentStock: parseFloat(d.current_stock || 0),
      inTransitStock: parseFloat(d.in_transit_stock || 0),
      inProductionStock: parseFloat(d.in_production_stock || 0),
      productionReservedStock: parseFloat(d.production_reserved_stock || 0),
      toBeShippedStock: parseFloat(d.to_be_shipped_stock || 0),
      suggestedQty: parseFloat(d.suggested_qty || 0),
      adjustedQty: parseFloat(d.adjusted_qty || 0),
      executeQty: parseFloat(d.execute_qty || 0),
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));

    res.json({
      code: 200,
      data: {
        list: result,
        total: result.length
      },
      message: '查询成功'
    });

  } catch (error) {
    console.error('查询物料需求明细失败:', error);
    res.status(500).json({
      code: 500,
      message: `查询失败: ${error.message}`
    });
  }
});

module.exports = router;
