const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * 测试数据流：创建销售订单 → 主生产计划 → 备料计划 → 工序计划
 * 分步骤断点验证
 */
router.post('/create-test-order', async (req, res) => {
  let connection;
  try {
    const { productCode = '6001A0306', quantity = 100, customerDeliveryDate = '2026-01-10' } = req.body;

    console.log('\n========== 开始测试数据流 ==========');
    console.log(`产品编号: ${productCode}`);
    console.log(`订单数量: ${quantity}`);
    console.log(`客户交期: ${customerDeliveryDate}`);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 第1步：创建销售订单
    console.log('\n【第1步】创建销售订单...');

    // 生成内部订单编号
    const [maxOrder] = await connection.execute(
      "SELECT internal_order_no FROM sales_orders WHERE internal_order_no LIKE 'SO-%' ORDER BY internal_order_no DESC LIMIT 1",
    );
    let orderNumber = 1;
    if (maxOrder.length > 0 && maxOrder[0].internal_order_no) {
      const lastNumber = parseInt(maxOrder[0].internal_order_no.split('-')[1]);
      orderNumber = lastNumber + 1;
    }
    const internalOrderNo = `SO-${String(orderNumber).padStart(6, '0')}`;
    const orderId = uuidv4(); // 生成UUID作为ID

    // 插入销售订单
    const orderSql = `
      INSERT INTO sales_orders (
        id, internal_order_no, customer_order_no, customer_name, salesperson,
        customer_delivery, promised_delivery, order_type, status,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [orderResult] = await connection.execute(orderSql, [
      orderId,
      internalOrderNo,
      `TEST-${Date.now()}`,
      '测试客户',
      'admin',
      customerDeliveryDate,
      customerDeliveryDate,
      '标准订单',
      '待下单',
      'admin',
    ]);

    // orderId已经是UUID，不需要insertId

    // 插入产品明细
    const productSql = `
      INSERT INTO sales_order_products (
        order_id, product_code, product_name, product_unit, order_quantity,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await connection.execute(productSql, [orderId, productCode, '测试产品', 'PCS', quantity]);

    console.log(`✅ 销售订单创建成功`);
    console.log(`   ID: ${orderId}`);
    console.log(`   内部订单编号: ${internalOrderNo}`);

    // 第2步：查询主生产计划（应该由销售订单自动触发）
    console.log('\n【第2步】查询主生产计划...');
    const [masterPlans] = await connection.execute(
      'SELECT * FROM master_production_plans WHERE internal_order_no = ? ORDER BY created_at DESC LIMIT 1',
      [internalOrderNo],
    );

    await connection.commit();

    if (masterPlans.length === 0) {
      return res.json({
        success: true,
        step: 'order_created_no_plan',
        message: '⚠️ 销售订单创建成功，但主生产计划未自动生成（可能需要手动触发）',
        data: {
          orderId,
          internalOrderNo,
          productCode,
          quantity,
        },
        checkpoint: {
          question: '❓ 销售订单创建后，主生产计划是否应该自动生成？',
        },
      });
    }

    const masterPlan = masterPlans[0];
    console.log(`✅ 主生产计划已生成`);
    console.log(`   ID: ${masterPlan.id}`);
    console.log(`   编号: ${masterPlan.plan_code}`);
    console.log(`   产品编号: ${masterPlan.product_code}`);

    // 返回第一个断点的数据
    res.json({
      success: true,
      step: 'order_created',
      message: '✅ 销售订单和主生产计划创建成功，请执行第2步：执行排程',
      data: {
        orderId,
        internalOrderNo,
        masterPlanId: masterPlan.id,
        planCode: masterPlan.plan_code,
        productCode: masterPlan.product_code,
      },
      nextStep: {
        url: '/api/test-data-flow/execute-scheduling',
        method: 'POST',
        body: {
          planCode: masterPlan.plan_code,
        },
      },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ 测试失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * 第2步：执行排程 → 备料计划
 */
router.post('/execute-scheduling', async (req, res) => {
  try {
    const { planCode } = req.body;

    console.log('\n========== 执行排程 ==========');
    console.log(`主生产计划编号: ${planCode}`);

    // 查询主生产计划
    const [masterPlans] = await pool.execute('SELECT * FROM master_production_plans WHERE plan_code = ?', [planCode]);

    if (masterPlans.length === 0) {
      throw new Error('主生产计划不存在');
    }

    const masterPlan = masterPlans[0];

    // ⚠️ 关键问题：执行排程的逻辑在哪里？
    // 需要找到真正的executeScheduling方法
    console.log('\n⚠️ 注意：执行排程功能尚未实现，需要手动在浏览器中点击“执行排程”按钮');

    // 查询生成的备料计划
    console.log('\n【查询备料计划】...');
    const [materialPlans] = await pool.execute(
      `
      SELECT 
        id, plan_no, material_code, material_name, material_source, 
        source_process, demand_quantity, available_stock, replenishment_quantity,
        main_plan_product_code, push_to_process
      FROM material_preparation_plans 
      WHERE source_plan_no = ?
      ORDER BY created_at ASC
    `,
      [planCode],
    );

    console.log(`📊 生成了 ${materialPlans.length} 条备料计划`);
    materialPlans.forEach((plan, index) => {
      console.log(`\n备料计划 #${index + 1}:`);
      console.log(`   编号: ${plan.plan_no}`);
      console.log(`   物料: ${plan.material_code} - ${plan.material_name}`);
      console.log(`   物料来源: ${plan.material_source}`);
      console.log(`   来源工序: ${plan.source_process}`);
      console.log(`   需求数量: ${plan.demand_quantity}`);
      console.log(`   可用库存: ${plan.available_stock}`);
      console.log(`   需补货数量: ${plan.replenishment_quantity}`);
      console.log(`   是否已推送: ${plan.push_to_process ? '是' : '否'}`);
    });

    // ⚠️ 断点1：检查备料计划到打包工序计划的推送
    console.log('\n========== 断点1：检查打包工序计划 ==========');
    const [realProcessPlans] = await pool.execute(
      `
      SELECT 
        id, plan_no, product_code, product_name, process_name,
        source_no, replenishment_qty
      FROM real_process_plans
      WHERE main_plan_product_code = ?
      ORDER BY created_at ASC
    `,
      [masterPlan.product_code],
    );

    console.log(`📊 打包工序计划数量: ${realProcessPlans.length}`);
    realProcessPlans.forEach((plan, index) => {
      console.log(`\n打包工序计划 #${index + 1}:`);
      console.log(`   编号: ${plan.plan_no}`);
      console.log(`   产品: ${plan.product_code} - ${plan.product_name}`);
      console.log(`   工序: ${plan.process_name}`);
      console.log(`   来源编号: ${plan.source_no}`);
      console.log(`   需补货数量: ${plan.replenishment_qty}`);
    });

    res.json({
      success: true,
      step: 'scheduling_executed',
      message: '⚠️ 请在浏览器中手动点击“执行排程”按钮，然后刷新备料计划页面',
      data: {
        materialPlans: materialPlans.map(p => ({
          planNo: p.plan_no,
          materialCode: p.material_code,
          materialSource: p.material_source,
          sourceProcess: p.source_process,
          replenishmentQuantity: p.replenishment_quantity,
          pushToProcess: p.push_to_process,
        })),
        realProcessPlans: realProcessPlans.map(p => ({
          planNo: p.plan_no,
          productCode: p.product_code,
          processName: p.process_name,
          sourceNo: p.source_no,
        })),
      },
      checkpoint: {
        question: '❓ 请确认：打包工序计划是否正确生成？',
        expectedCount: materialPlans.filter(
          p => p.source_process === '打包' && p.material_source === '自制' && p.replenishment_quantity > 0,
        ).length,
        actualCount: realProcessPlans.length,
      },
      nextStep: {
        url: '/api/test-data-flow/check-bom-push',
        method: 'POST',
        body: {
          productCode: masterPlan.product_code,
        },
      },
    });
  } catch (error) {
    console.error('❌ 执行排程失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

/**
 * 第3步：检查打包工序计划 → 备料计划的BOM推送
 */
router.post('/check-bom-push', async (req, res) => {
  try {
    const { productCode } = req.body;

    console.log('\n========== 断点2：检查BOM推送 ==========');
    console.log(`主产品: ${productCode}`);

    // 查询第二轮备料计划（父件=主产品的子件）
    const [childMaterialPlans] = await pool.execute(
      `
      SELECT 
        id, plan_no, material_code, material_name, material_source,
        source_process, parent_code, parent_name, replenishment_quantity,
        push_to_process
      FROM material_preparation_plans
      WHERE parent_code = ?
      ORDER BY created_at ASC
    `,
      [productCode],
    );

    console.log(`📊 子件备料计划数量: ${childMaterialPlans.length}`);
    childMaterialPlans.forEach((plan, index) => {
      console.log(`\n子件备料计划 #${index + 1}:`);
      console.log(`   编号: ${plan.plan_no}`);
      console.log(`   物料: ${plan.material_code} - ${plan.material_name}`);
      console.log(`   物料来源: ${plan.material_source}`);
      console.log(`   来源工序: ${plan.source_process}`);
      console.log(`   父件: ${plan.parent_code} - ${plan.parent_name}`);
      console.log(`   需补货数量: ${plan.replenishment_quantity}`);
      console.log(`   是否已推送: ${plan.push_to_process ? '是' : '否'}`);
    });

    // 检查组装工序计划
    const [assemblyPlans] = await pool.execute(
      `
      SELECT 
        id, plan_no, product_code, product_name, process_name,
        source_no, replenishment_qty
      FROM assembly_process_plans
      WHERE master_plan_product_code = ?
      ORDER BY created_at ASC
    `,
      [productCode],
    );

    console.log(`\n📊 组装工序计划数量: ${assemblyPlans.length}`);
    assemblyPlans.forEach((plan, index) => {
      console.log(`\n组装工序计划 #${index + 1}:`);
      console.log(`   编号: ${plan.plan_no}`);
      console.log(`   产品: ${plan.product_code} - ${plan.product_name}`);
      console.log(`   工序: ${plan.process_name}`);
      console.log(`   来源编号: ${plan.source_no}`);
      console.log(`   需补货数量: ${plan.replenishment_qty}`);
    });

    res.json({
      success: true,
      step: 'bom_push_checked',
      message: '✅ BOM推送检查完成',
      data: {
        childMaterialPlans: childMaterialPlans.map(p => ({
          planNo: p.plan_no,
          materialCode: p.material_code,
          materialSource: p.material_source,
          sourceProcess: p.source_process,
          parentCode: p.parent_code,
          pushToProcess: p.push_to_process,
        })),
        assemblyPlans: assemblyPlans.map(p => ({
          planNo: p.plan_no,
          productCode: p.product_code,
          processName: p.process_name,
          sourceNo: p.source_no,
        })),
      },
      checkpoint: {
        question: '❓ 请确认：1) 子件备料计划是否正确生成？ 2) 组装工序计划是否正确生成？',
        expectedChildPlans: '应该有3个子件（470001A, 470002A, 511442B）',
        expectedAssemblyPlans: '应该有2个组装工序计划（470001A, 470002A）',
        actualChildPlans: childMaterialPlans.length,
        actualAssemblyPlans: assemblyPlans.length,
      },
    });
  } catch (error) {
    console.error('❌ 检查BOM推送失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

/**
 * 清理测试数据
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { productCode = '6001A0306' } = req.body;

    console.log('\n========== 清理测试数据 ==========');

    // 删除工序计划
    await pool.execute('DELETE FROM real_process_plans WHERE main_plan_product_code = ?', [productCode]);
    await pool.execute('DELETE FROM assembly_process_plans WHERE master_plan_product_code = ?', [productCode]);

    // 删除备料计划
    await pool.execute('DELETE FROM material_preparation_plans WHERE main_plan_product_code = ?', [productCode]);

    // 删除主生产计划
    const [masterPlans] = await pool.execute(
      'SELECT id, plan_code FROM master_production_plans WHERE product_code = ?',
      [productCode],
    );
    for (const plan of masterPlans) {
      await pool.execute('DELETE FROM master_production_plans WHERE id = ?', [plan.id]);
    }

    // 删除销售订单（通过产品编号查找）
    const [orders] = await pool.execute(
      `
      SELECT id, internal_order_no 
      FROM sales_orders 
      WHERE JSON_CONTAINS(product_list, JSON_OBJECT('productCode', ?))
    `,
      [productCode],
    );

    for (const order of orders) {
      await pool.execute('DELETE FROM sales_orders WHERE id = ?', [order.id]);
    }

    console.log(`✅ 清理完成`);
    console.log(`   删除工序计划: ${productCode}`);
    console.log(`   删除备料计划: ${productCode}`);
    console.log(`   删除主生产计划: ${masterPlans.length} 条`);
    console.log(`   删除销售订单: ${orders.length} 条`);

    res.json({
      success: true,
      message: '清理测试数据成功',
      data: {
        deletedMasterPlans: masterPlans.length,
        deletedOrders: orders.length,
      },
    });
  } catch (error) {
    console.error('❌ 清理失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
