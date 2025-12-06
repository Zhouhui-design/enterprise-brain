const express = require('express');
const router = express.Router();
const db = require('../config/database');

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
    const orders = await db.query(ordersQuery, orderIds);
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
      const boms = await db.query(bomQuery, [productCode]);
      
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
      const materials = await db.query(materialsQuery, materialCodes);
      
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

module.exports = router;
