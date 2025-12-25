const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * 主生产计划路由 - 使用MySQL数据库
 */

// 生成主生产计划编号
function generatePlanCode() {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `MPS${year}${timestamp}${random}`;
}

// 格式化日期为MySQL DATE格式 (YYYY-MM-DD)
// ✅ 使用本地时间处理，避免时区转换问题
function formatDateForMySQL(dateStr) {
  if (!dateStr) return null;
  try {
    // 如果已经是YYYY-MM-DD格式，直接使用
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // ✅ 关键修复：对于ISO 8601格式，使用Date对象转换为本地时间
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    // 使用本地时间方法，让JS自动处理时区转换
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error('日期格式化失败:', dateStr, e);
    return null;
  }
}

// 创建主生产计划（从销售订单）
router.post('/from-sales-order', async (req, res) => {
  try {
    const { salesOrders, advanceStorageDays } = req.body; // ✅ 接收提前入库期

    if (!salesOrders || !Array.isArray(salesOrders) || salesOrders.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请至少选择一个销售订单',
      });
    }

    console.log('📝 从销售订单创建主生产计划，数量:', salesOrders.length);
    console.log('📦 销售订单详情:', JSON.stringify(salesOrders, null, 2));
    console.log('📅 提前入库期:', advanceStorageDays, '天'); // ✅ 日志输出

    const results = [];
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const order of salesOrders) {
        // 遍历销售订单中的每个产品
        const products = order.products || [];
        console.log(
          '📦 当前订单产品数量:',
          products.length,
          '产品列表:',
          products.map(p => p.productCode),
        );

        for (const product of products) {
          const planCode = generatePlanCode();

          // 计算计划数量：if(可用库存>=订单数量，0，订单数量-可用库存）
          const availableStock = 0; // 暂为0
          const orderQuantity = parseFloat(product.orderQuantity || 0);
          const planQuantity = availableStock >= orderQuantity ? 0 : orderQuantity - availableStock;

          // ✅ 修复：订单承诺交期 = 客户交期 (customerDeliveryDate)
          console.log('🔍 日期映射调试:', {
            原始customerDeliveryDate: order.customerDeliveryDate,
            类型: typeof order.customerDeliveryDate,
            长度: order.customerDeliveryDate ? order.customerDeliveryDate.length : 'null',
          });

          const promisedDeliveryDate = formatDateForMySQL(order.customerDeliveryDate);

          console.log('🔍 格式化后结果:', {
            promisedDeliveryDate: promisedDeliveryDate,
            类型: typeof promisedDeliveryDate,
          });

          // ✅ 计算计划入库日期 = 订单承诺交期 - 提前入库期
          let plannedStorageDate = null;
          if (promisedDeliveryDate) {
            // 直接处理YYYY-MM-DD格式，避免Date对象时区转换
            const advanceDays = parseInt(advanceStorageDays || 0); // 默认为0天
            if (/^\d{4}-\d{2}-\d{2}$/.test(promisedDeliveryDate)) {
              const [year, month, day] = promisedDeliveryDate.split('-').map(Number);
              const deliveryDate = new Date(year, month - 1, day); // month-1 because JS months are 0-indexed
              deliveryDate.setDate(deliveryDate.getDate() - advanceDays);

              const newYear = deliveryDate.getFullYear();
              const newMonth = String(deliveryDate.getMonth() + 1).padStart(2, '0');
              const newDay = String(deliveryDate.getDate()).padStart(2, '0');
              plannedStorageDate = `${newYear}-${newMonth}-${newDay}`;
            } else {
              // 后备方案：使用Date对象
              const deliveryDate = new Date(promisedDeliveryDate);
              deliveryDate.setDate(deliveryDate.getDate() - advanceDays);
              plannedStorageDate = formatDateForMySQL(deliveryDate);
            }

            console.log('📅 计划入库日期计算:', {
              订单承诺交期: promisedDeliveryDate,
              提前天数: advanceDays,
              计划入库日期: plannedStorageDate,
            });
          } else {
            // 如果承诺交期为空，计划入库日期也为空
            console.log('⚠️ 订单承诺交期为空，无法计算计划入库日期');
          }

          // 从产品物料库lookup产品图片和产品来源
          let productImage = product.productImage || null;
          let productSource = null;

          if (product.productCode) {
            try {
              // 从产品手册表（product_manual）查询产品图片和来源
              const [productRows] = await connection.execute(
                'SELECT productImage, source FROM product_manual WHERE productCode = ? LIMIT 1',
                [product.productCode],
              );

              if (productRows.length > 0) {
                const foundProduct = productRows[0];

                // 产品图片
                if (foundProduct.productImage) {
                  productImage = foundProduct.productImage;
                }

                // 产品来源：source字段是JSON数组，取第一个值（产出工序名称）
                if (foundProduct.source) {
                  try {
                    const sourceArray = JSON.parse(foundProduct.source);
                    if (Array.isArray(sourceArray) && sourceArray.length > 0) {
                      productSource = sourceArray[0]; // 取第一个工序名称
                    }
                  } catch (e) {
                    // 如果不是JSON，直接使用
                    productSource = foundProduct.source;
                  }
                }

                console.log('🔍 Lookup结果:', {
                  productCode: product.productCode,
                  productImage,
                  productSource,
                });
              } else {
                console.log('⚠️ 未找到产品:', product.productCode);
              }
            } catch (lookupError) {
              console.error('⚠️ Lookup产品信息失败:', lookupError.message);
            }
          }

          console.log('📝 创建主生产计划:', {
            planCode,
            productCode: product.productCode,
            productName: product.productName,
            orderQuantity,
            productImage,
            productSource,
            outputProcess: product.outputProcess || '', // ✅ 添加产出工序
            promisedDeliveryDate,
          });

          const [result] = await connection.execute(
            `
            INSERT INTO master_production_plans (
              plan_code, product_code, product_name, order_quantity,
              salesperson, sales_unit, available_stock, current_stock,
              plan_quantity, product_image, output_process, promised_delivery_date,
              status, planned_storage_date, product_source,
              internal_order_no, customer_order_no,
              customer_name, submitter,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `,
            [
              planCode,
              product.productCode || '',
              product.productName || '',
              orderQuantity,
              order.salesperson || '',
              product.productUnit || '',
              availableStock,
              0, // 实时库存暂为0
              planQuantity,
              productImage, // 使用lookup后的图片
              product.outputProcess || '', // ✅ 保存产出工序（从订单获取）
              promisedDeliveryDate,
              '已下单',
              plannedStorageDate, // ✅ 计划入库日期（承诺交期 - 提前天数）
              productSource, // 使用lookup后的产品来源
              order.internalOrderNo || '',
              order.customerOrderNo || '',
              order.customerName || '', // ✅ 客户名称
              order.submitter || 'admin', // ✅ 提交人，默认admin
            ],
          );

          results.push({
            planCode,
            id: result.insertId,
            productCode: product.productCode,
            productName: product.productName,
            promisedDeliveryDate: promisedDeliveryDate,
            plannedStorageDate: plannedStorageDate,
            internalOrderNo: order.internalOrderNo || '',
          });
        }
      }

      await connection.commit();
      console.log('✅ 成功创建主生产计划:', results.length, '条');

      res.json({
        code: 200,
        data: results,
        message: `成功创建${results.length}条主生产计划`,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ 创建主生产计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建主生产计划失败: ' + error.message,
    });
  }
});

// 获取主生产计划列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, planCode, productCode, productName, status } = req.query;

    let sql = `
      SELECT 
        id, plan_code as planCode, product_code as productCode,
        product_name as productName, order_quantity as orderQuantity,
        salesperson, sales_unit as salesUnit,
        available_stock as availableStock, current_stock as currentStock,
        plan_quantity as planQuantity, product_image as productImage,
        output_process as outputProcess,
        promised_delivery_date as promisedDeliveryDate, status,
        planned_storage_date as plannedStorageDate,
        product_source as productSource,
        internal_order_no as internalOrderNo,
        customer_order_no as customerOrderNo,
        customer_name as customerName,
        submitter,
        created_at as createdAt, updated_at as updatedAt,
        created_at as submitTime
      FROM master_production_plans
      WHERE 1=1
    `;

    const params = [];

    if (planCode) {
      sql += ' AND plan_code LIKE ?';
      params.push(`%${planCode}%`);
    }
    if (productCode) {
      sql += ' AND product_code LIKE ?';
      params.push(`%${productCode}%`);
    }
    if (productName) {
      sql += ' AND product_name LIKE ?';
      params.push(`%${productName}%`);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    // 查询总数
    const countSql =
      'SELECT COUNT(*) as total FROM master_production_plans WHERE 1=1' +
      (planCode ? ' AND plan_code LIKE ?' : '') +
      (productCode ? ' AND product_code LIKE ?' : '') +
      (productName ? ' AND product_name LIKE ?' : '') +
      (status ? ' AND status = ?' : '');

    const [countResult] = await pool.execute(countSql, params);
    const total = countResult[0].total;

    // 分页查询
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ' LIMIT ' + parseInt(pageSize) + ' OFFSET ' + offset;

    const [rows] = await pool.execute(sql, params);

    // ✅ 修复：将日期字段格式化为字符串，避免时区转换问题
    const formattedRows = rows.map(row => {
      console.log('🔍 调试格式化前:', {
        promisedDeliveryDate: row.promisedDeliveryDate,
        类型: typeof row.promisedDeliveryDate,
        是Date: row.promisedDeliveryDate instanceof Date,
      });

      const formatted = {
        ...row,
        promisedDeliveryDate: row.promisedDeliveryDate
          ? typeof row.promisedDeliveryDate === 'string'
            ? row.promisedDeliveryDate.split('T')[0]
            : row.promisedDeliveryDate.toISOString().split('T')[0]
          : null,
        plannedStorageDate: row.plannedStorageDate
          ? typeof row.plannedStorageDate === 'string'
            ? row.plannedStorageDate.split('T')[0]
            : row.plannedStorageDate.toISOString().split('T')[0]
          : null,
        createdAt: row.createdAt
          ? typeof row.createdAt === 'string'
            ? row.createdAt.split('T')[0]
            : row.createdAt.toISOString().split('T')[0]
          : null,
        updatedAt: row.updatedAt
          ? typeof row.updatedAt === 'string'
            ? row.updatedAt.split('T')[0]
            : row.updatedAt.toISOString().split('T')[0]
          : null,
        submitTime: row.submitTime
          ? typeof row.submitTime === 'string'
            ? row.submitTime.split('T')[0]
            : row.submitTime.toISOString().split('T')[0]
          : null,
      };

      console.log('🔍 调试格式化后:', {
        promisedDeliveryDate: formatted.promisedDeliveryDate,
        plannedStorageDate: formatted.plannedStorageDate,
      });

      return formatted;
    });

    res.json({
      code: 200,
      data: {
        list: formattedRows, // ✅ 修改为 list 以匹配前端期望
        total: total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
      message: '获取成功',
    });
  } catch (error) {
    console.error('获取主生产计划列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取列表失败: ' + error.message,
    });
  }
});

// 根据ID获取主生产计划详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `
      SELECT 
        id, plan_code as planCode, product_code as productCode,
        product_name as productName, order_quantity as orderQuantity,
        salesperson, sales_unit as salesUnit,
        available_stock as availableStock, current_stock as currentStock,
        plan_quantity as planQuantity, product_image as productImage,
        output_process as outputProcess,
        promised_delivery_date as promisedDeliveryDate, status,
        planned_storage_date as plannedStorageDate,
        product_source as productSource,
        internal_order_no as internalOrderNo,
        customer_order_no as customerOrderNo, customer_name as customerName,
        submitter,
        created_at as createdAt, updated_at as updatedAt
      FROM master_production_plans 
      WHERE id = ?
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '主生产计划不存在',
      });
    }

    const plan = rows[0];

    // ✅ 修复：将日期字段格式化为字符串，避免时区转换问题
    const formattedPlan = {
      ...plan,
      promisedDeliveryDate: plan.promisedDeliveryDate
        ? typeof plan.promisedDeliveryDate === 'string'
          ? plan.promisedDeliveryDate.split('T')[0]
          : plan.promisedDeliveryDate.toISOString().split('T')[0]
        : null,
      plannedStorageDate: plan.plannedStorageDate
        ? typeof plan.plannedStorageDate === 'string'
          ? plan.plannedStorageDate.split('T')[0]
          : plan.plannedStorageDate.toISOString().split('T')[0]
        : null,
      createdAt: plan.createdAt
        ? typeof plan.createdAt === 'string'
          ? plan.createdAt.split('T')[0]
          : plan.createdAt.toISOString().split('T')[0]
        : null,
      updatedAt: plan.updatedAt
        ? typeof plan.updatedAt === 'string'
          ? plan.updatedAt.split('T')[0]
          : plan.updatedAt.toISOString().split('T')[0]
        : null,
    };

    res.json({
      code: 200,
      data: formattedPlan,
    });
  } catch (error) {
    console.error('获取主生产计划详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取详情失败: ' + error.message,
    });
  }
});

// 删除主生产计划
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ 需求1：先查询主生产计划的plan_code，用于级联删除备料计划
    const [planRows] = await pool.execute('SELECT plan_code FROM master_production_plans WHERE id = ?', [id]);

    if (planRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '主生产计划不存在',
      });
    }

    const planCode = planRows[0].plan_code;
    console.log('🗑️ 删除主生产计划:', { id, planCode });

    // ✅ 级联删除备料计划（source_plan_no = 主计划的plan_code）
    const [materialPlanResult] = await pool.execute('DELETE FROM material_preparation_plans WHERE source_plan_no = ?', [
      planCode,
    ]);

    console.log(`✅ 级联删除备料计划: ${materialPlanResult.affectedRows} 条`);

    // 删除主生产计划
    await pool.execute('DELETE FROM master_production_plans WHERE id = ?', [id]);

    console.log('✅ 主生产计划删除成功');

    res.json({
      code: 200,
      message: `删除成功（同时删除 ${materialPlanResult.affectedRows} 条备料计划）`,
    });
  } catch (error) {
    console.error('删除主生产计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除失败: ' + error.message,
    });
  }
});

// ✅ 批量删除主生产计划（级联删除备料计划）
router.post('/batch-delete', async (req, res) => {
  let connection;
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要删除的ID列表',
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    let totalMaterialPlansDeleted = 0;
    let totalRealProcessPlansDeleted = 0;
    const affectedProcessDates = new Set(); // 记录受影响的工序+日期

    // 逐个删除，确保级联删除
    for (const id of ids) {
      // 1. 查询主生产计划的plan_code
      const [planRows] = await connection.execute('SELECT plan_code FROM master_production_plans WHERE id = ?', [id]);

      if (planRows.length > 0) {
        const planCode = planRows[0].plan_code;

        // 2. 级联删除备料计划
        const [materialPlanResult] = await connection.execute(
          'DELETE FROM material_preparation_plans WHERE source_plan_no = ?',
          [planCode],
        );

        totalMaterialPlansDeleted += materialPlanResult.affectedRows;

        // 2.5 级联删除真工序计划 - 先记录受影响的工序+日期
        const [realProcessPlans] = await connection.execute(
          "SELECT process_name, DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date FROM real_process_plans WHERE master_plan_no = ?",
          [planCode],
        );

        // 记录受影响的工序+日期
        realProcessPlans.forEach(plan => {
          if (plan.process_name && plan.schedule_date) {
            // ✅ 使用本地时区格式化，避免时区偏移
            let scheduleDate;
            if (plan.schedule_date instanceof Date) {
              const year = plan.schedule_date.getFullYear();
              const month = String(plan.schedule_date.getMonth() + 1).padStart(2, '0');
              const day = String(plan.schedule_date.getDate()).padStart(2, '0');
              scheduleDate = `${year}-${month}-${day}`;
            } else {
              scheduleDate = String(plan.schedule_date).split('T')[0];
            }
            affectedProcessDates.add(`${plan.process_name}|${scheduleDate}`);
          }
        });

        const [realProcessPlanResult] = await connection.execute(
          'DELETE FROM real_process_plans WHERE master_plan_no = ?',
          [planCode],
        );

        totalRealProcessPlansDeleted += realProcessPlanResult.affectedRows;

        // 3. 删除主生产计划
        await connection.execute('DELETE FROM master_production_plans WHERE id = ?', [id]);

        console.log(
          `✅ 删除主计划 ${planCode}, 同时删除备料计划 ${materialPlanResult.affectedRows} 条, 真工序计划 ${realProcessPlanResult.affectedRows} 条`,
        );
      }
    }

    // ✅ 批量重置受影响的工序+日期的已占用工时
    console.log(`🔄 批量重置 ${affectedProcessDates.size} 个工序+日期的已占用工时`);

    for (const key of affectedProcessDates) {
      const [processName, scheduleDate] = key.split('|');

      try {
        // ✅ SUMIF - 重新统计该工序+日期下所有真工序计划的计划排程工时总和
        const [sumRows] = await connection.execute(
          `SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_hours 
           FROM real_process_plans 
           WHERE process_name = ? 
             AND schedule_date = ?`,
          [processName, scheduleDate],
        );

        const sumResult = sumRows[0].total_hours;
        const validResult = sumResult !== null && sumResult !== undefined ? parseFloat(sumResult) : 0;
        const newOccupiedHours = parseFloat(validResult.toFixed(2));

        // ✅ 查询工序能力负荷记录
        const [capacityRows] = await connection.execute(
          'SELECT id, work_shift, available_workstations, occupied_hours FROM process_capacity_load WHERE process_name = ? AND date = ?',
          [processName, scheduleDate],
        );

        if (capacityRows.length > 0) {
          const record = capacityRows[0];
          const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
          const workShift = parseFloat(record.work_shift || 0);
          const availableWorkstations = parseFloat(record.available_workstations || 0);

          // ✅ 重新计算剩余工时和剩余时段
          const newRemainingHours = parseFloat((workShift * availableWorkstations - newOccupiedHours).toFixed(2));

          let newRemainingShift = null;
          if (availableWorkstations > 0) {
            newRemainingShift = parseFloat((newRemainingHours / availableWorkstations).toFixed(2));
          }

          // ✅ 更新数据库
          await connection.execute(
            `UPDATE process_capacity_load 
             SET occupied_hours = ?, 
                 remaining_hours = ?, 
                 remaining_shift = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [newOccupiedHours, newRemainingHours, newRemainingShift, record.id],
          );

          console.log(`✅ [工序=${processName}, 日期=${scheduleDate}] ${previousOccupiedHours} → ${newOccupiedHours}`);
        }
      } catch (error) {
        console.error(`⚠️ [工序=${processName}, 日期=${scheduleDate}] 重置失败:`, error.message);
        // 继续处理其他记录
      }
    }

    await connection.commit();

    console.log(
      `✅ 批量删除成功: ${ids.length} 个主计划, ${totalMaterialPlansDeleted} 个备料计划, ${totalRealProcessPlansDeleted} 个真工序计划`,
    );

    res.json({
      code: 200,
      message: `批量删除成功（删除 ${ids.length} 个主计划，同时删除 ${totalMaterialPlansDeleted} 条备料计划、${totalRealProcessPlansDeleted} 条真工序计划）`,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('批量删除主生产计划失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量删除失败: ' + error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 执行排程 - 将主生产计划推送到备料计划
router.post('/:id/execute-schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { plannedStorageDate } = req.body;

    console.log('📦 开始执行排程, 主计划ID:', id);
    console.log('📅 前端传入计划入库日期:', plannedStorageDate);

    // 1. 查询主生产计划详情
    const [planRows] = await pool.execute(
      `
      SELECT * FROM master_production_plans WHERE id = ?
    `,
      [id],
    );

    if (planRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '主生产计划不存在',
      });
    }

    const plan = planRows[0];

    // ✅ 如果前端传入了计划入库日期，先更新到数据库
    if (plannedStorageDate) {
      await pool.execute(
        `
        UPDATE master_production_plans 
        SET planned_storage_date = ? 
        WHERE id = ?
      `,
        [plannedStorageDate, id],
      );
      console.log('✅ 已更新主生产计划的计划入库日期:', plannedStorageDate);
      plan.planned_storage_date = plannedStorageDate;
    }

    console.log('📝 主计划信息:', {
      planCode: plan.plan_code,
      productCode: plan.product_code,
      productName: plan.product_name,
      planQuantity: plan.plan_quantity,
      outputProcess: plan.output_process,
      plannedStorageDate: plan.planned_storage_date,
      promisedDeliveryDate: plan.promised_delivery_date,
    });

    // 检查关键字段是否存在
    if (!plan.plan_code) {
      return res.status(400).json({
        code: 400,
        message: '主生产计划编号不能为空',
      });
    }

    if (!plan.product_code) {
      return res.status(400).json({
        code: 400,
        message: '产品编号不能为空',
      });
    }

    if (!plan.plan_quantity || plan.plan_quantity <= 0) {
      return res.status(400).json({
        code: 400,
        message: '计划数量必须大于0',
      });
    }

    // 2. 生成备料计划编号
    function generateMaterialPlanNo() {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      return `MPP${year}${timestamp}${random}`;
    }

    const materialPlanNo = generateMaterialPlanNo();

    // ✅ 推断物料来源：如果主计划没有product_source，根据output_process推断
    let materialSource = plan.product_source;
    if (!materialSource || materialSource === '/') {
      // 如果产出工序是"采购"，则物料来源="外购"；否则="自制"
      materialSource = plan.output_process === '采购' ? '外购' : '自制';
      console.log(`🔍 自动推断物料来源: 产出工序=${plan.output_process} ⇒ 物料来源=${materialSource}`);
    }

    // 3. ✅ 通过Service层创建备料计划（会自动推送到工序计划）
    const MaterialPreparationPlanService = require('../services/materialPreparationPlanService');

    const materialPlanData = {
      planNo: materialPlanNo,
      sourcePlanNo: plan.plan_code,
      sourceProcessPlanNo: '/',
      sourceProcess: plan.output_process,
      materialCode: plan.product_code,
      materialName: plan.product_name,
      materialSource: materialSource,
      materialUnit: plan.sales_unit,
      demandQuantity: plan.plan_quantity,
      demandDate: plan.planned_storage_date,
      salesOrderNo: plan.internal_order_no,
      customerOrderNo: plan.customer_order_no,
      mainPlanProductCode: plan.product_code,
      mainPlanProductName: plan.product_name,
      mainPlanQuantity: plan.plan_quantity,
      promiseDeliveryDate: plan.promised_delivery_date,
      customerName: plan.customer_name,
      submitter: plan.submitter || 'admin',
    };

    console.log('📝 备料计划数据:', {
      planNo: materialPlanNo,
      demandDate: materialPlanData.demandDate,
      sourcePlanNo: plan.plan_code,
      plannedStorageDate: plan.planned_storage_date,
    });

    // ✅ 数据验证
    if (!materialPlanData.materialCode || !materialPlanData.materialName) {
      throw new Error(
        `产品信息不完整: materialCode=${materialPlanData.materialCode}, materialName=${materialPlanData.materialName}`,
      );
    }

    console.log('✅ 准备创建备料计划，数据验证通过');
    const result = await MaterialPreparationPlanService.create(materialPlanData);

    console.log(`✅ 成功生成备料计划: ${materialPlanNo}`);
    console.log(`   物料: ${plan.product_code} - ${plan.product_name}`);
    console.log(`   需求数量: ${plan.plan_quantity} ${plan.sales_unit || ''}`);

    // 4. 返回结果
    const hasProcessPlan = result.processPlanNo && result.processPlanNo.trim() !== '';

    res.json({
      code: 200,
      data: {
        materialPlanCount: 1,
        processPlanCount: hasProcessPlan ? 1 : 0,
        materialPlan: {
          id: result.id,
          planNo: materialPlanNo,
          materialCode: plan.product_code,
          materialName: plan.product_name,
          demandQuantity: plan.plan_quantity,
        },
        processPlanNo: hasProcessPlan ? result.processPlanNo : null,
      },
      message: `排程执行成功，生成1条备料计划${hasProcessPlan ? '、1条工序计划' : ''}`,
    });
  } catch (error) {
    console.error('❌ 执行排程失败:', error);
    console.error('❌ 错误堆栈:', error.stack);
    res.status(500).json({
      code: 500,
      message: '执行排程失败: ' + error.message,
    });
  }
});

module.exports = router;
