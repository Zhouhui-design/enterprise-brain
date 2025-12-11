const { pool } = require('../config/database');

/**
 * 备料计划服务
 */
class MaterialPreparationPlanService {
  /**
   * 获取所有备料计划（分页）
   */
  static async getAll(params = {}) {
    try {
      const { page = 1, pageSize = 20, planNo, sourcePlanNo, materialCode, demandDateStart, demandDateEnd } = params;
      
      let whereClause = [];
      const queryParams = [];
      
      if (planNo) {
        whereClause.push('plan_no LIKE ?');
        queryParams.push(`%${planNo}%`);
      }
      
      if (sourcePlanNo) {
        whereClause.push('source_plan_no LIKE ?');
        queryParams.push(`%${sourcePlanNo}%`);
      }
      
      if (materialCode) {
        whereClause.push('material_code LIKE ?');
        queryParams.push(`%${materialCode}%`);
      }
      
      if (demandDateStart) {
        whereClause.push('demand_date >= ?');
        queryParams.push(demandDateStart);
      }
      
      if (demandDateEnd) {
        whereClause.push('demand_date <= ?');
        queryParams.push(demandDateEnd);
      }
      
      const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';
      
      // 查询总数
      const countSQL = `SELECT COUNT(*) as total FROM material_preparation_plans ${whereSQL}`;
      const [countResult] = await pool.execute(countSQL, queryParams);
      const total = countResult[0].total;
      
      // 分页查询
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);
      const dataSQL = `
        SELECT * FROM material_preparation_plans 
        ${whereSQL}
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      const [rows] = await pool.execute(dataSQL, queryParams);
      
      // 转换字段名:下划线转驼峰
      const records = rows.map(row => ({
        id: row.id,
        planNo: row.plan_no,
        sourcePlanNo: row.source_plan_no,
        sourceProcessPlanNo: row.source_process_plan_no,
        materialCode: row.material_code,
        materialName: row.material_name,
        materialSource: row.material_source,
        materialUnit: row.material_unit,
        demandQuantity: row.demand_quantity,
        needMrp: row.need_mrp,
        realtimeStock: row.realtime_stock,
        projectedBalance: row.projected_balance,
        availableStock: row.available_stock,
        sourceProcess: row.source_process,
        workshopName: row.workshop_name,
        demandDate: row.demand_date,
        pushToPurchase: row.push_to_purchase,
        pushToProcess: row.push_to_process,
        salesOrderNo: row.sales_order_no,
        customerOrderNo: row.customer_order_no,
        mainPlanProductCode: row.main_plan_product_code,
        mainPlanProductName: row.main_plan_product_name,
        mainPlanQuantity: row.main_plan_quantity,
        promiseDeliveryDate: row.promise_delivery_date,
        remark: row.remark,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at
      }));
      
      return {
        records,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    } catch (error) {
      console.error('获取备料计划列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取备料计划
   */
  static async getById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM material_preparation_plans WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error('获取备料计划详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建备料计划
   */
  static async create(data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const sql = `
        INSERT INTO material_preparation_plans (
          plan_no, source_plan_no, source_process_plan_no, material_code, material_name,
          material_source, material_unit, demand_quantity, need_mrp, realtime_stock,
          projected_balance, available_stock, source_process, workshop_name, demand_date,
          push_to_purchase, push_to_process, sales_order_no, customer_order_no,
          main_plan_product_code, main_plan_product_name, main_plan_quantity,
          promise_delivery_date, remark, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.execute(sql, [
        data.planNo,
        data.sourcePlanNo || null,
        data.sourceProcessPlanNo || null,
        data.materialCode,
        data.materialName,
        data.materialSource || null,
        data.materialUnit || null,
        data.demandQuantity || 0,
        data.needMrp ? 1 : 0,
        data.realtimeStock || 0,
        data.projectedBalance || 0,
        data.availableStock || 0,
        data.sourceProcess || null,
        data.workshopName || null,
        data.demandDate || null,
        data.pushToPurchase ? 1 : 0,
        data.pushToProcess ? 1 : 0,
        data.salesOrderNo || null,
        data.customerOrderNo || null,
        data.mainPlanProductCode || null,
        data.mainPlanProductName || null,
        data.mainPlanQuantity || 0,
        data.promiseDeliveryDate || null,
        data.remark || null,
        data.createdBy || null
      ]);
      
      const insertedId = result.insertId;
      console.log(`备料计划创建成功, ID: ${insertedId}, 编号: ${data.planNo}`);
      
      // ✅ 自动推送到工序计划（当备料计划编号不为空且符合条件时）
      let processPlanNo = null;
      if (data.planNo) {
        // 检查推送条件
        const demandQty = parseFloat(data.demandQuantity || 0);
        const availableQty = parseFloat(data.availableStock || 0);
        const replenishmentQty = demandQty - availableQty;
        
        const shouldPush = (
          data.materialSource === '自制' && 
          replenishmentQty > 0
        );
        
        if (shouldPush) {
          console.log('🔄 备料计划新增，开始自动推送到工序计划...');
          console.log(`   物料来源: ${data.materialSource}`);
          console.log(`   需补货数量: ${replenishmentQty.toFixed(2)}`);
          
          // ✅ 从产品物料库查询定时工额和定额工时
          let standardWorkQuota = 0;
          let standardWorkHours = 0;
          
          if (data.materialCode) {
            console.log(`   🔍 开始查询物料编号: ${data.materialCode}`);
            
            // ✅ 修复查询：使用正确的数据库连接和更详细的日志
            try {
              const [materialRows] = await connection.execute(
                'SELECT material_code, standard_time, quota_time FROM materials WHERE material_code = ? LIMIT 1',
                [data.materialCode]
              );
              
              console.log(`   🔍 查询结果数量: ${materialRows.length}`);
              console.log(`   🔍 查询SQL: SELECT material_code, standard_time, quota_time FROM materials WHERE material_code = '${data.materialCode}' LIMIT 1`);
              
              if (materialRows.length > 0) {
                const material = materialRows[0];
                console.log(`   🔍 查询到的原始数据:`, {
                  material_code: material.material_code,
                  standard_time: material.standard_time,
                  quota_time: material.quota_time,
                  standard_time_type: typeof material.standard_time,
                  quota_time_type: typeof material.quota_time
                });
                
                // ✅ 修复字段映射：standard_time 是定时工额，quota_time 是定额工时
                standardWorkQuota = parseFloat(material.standard_time || 0);  // 定时工额
                standardWorkHours = parseFloat(material.quota_time || 0);      // 定额工时
                
                console.log(`   ✅ 字段映射完成: 定时工额(standard_time)=${standardWorkQuota}, 定额工时(quota_time)=${standardWorkHours}`);
                console.log(`   ✅ 工序计划将使用: standard_work_quota=${standardWorkQuota}, standard_work_hours=${standardWorkHours}`);
              } else {
                console.log(`   ⚠️ 未找到物料编号 ${data.materialCode} 对应的产品物料数据`);
                
                // ✅ 尝试查询所有物料，看是否存在这个编号
                const [allMaterials] = await connection.execute(
                  'SELECT material_code FROM materials WHERE material_code LIKE ? LIMIT 5',
                  [`%${data.materialCode}%`]
                );
                console.log(`   🔍 相似物料编号: ${allMaterials.map(m => m.material_code).join(', ')}`);
              }
            } catch (queryError) {
              console.error(`   ❌ 查询物料数据失败:`, queryError);
            }
          } else {
            console.log(`   ⚠️ materialCode为空，无法查询`);
          }
          
          // 生成工序计划编号
          const year = new Date().getFullYear();
          const timestamp = Date.now().toString().slice(-6);
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          processPlanNo = `PP${year}${timestamp}${random}`;
          
          // 计算计划完工日期 = 需求日期 - 1天
          let completionDate = null;
          if (data.demandDate) {
            const demandDate = new Date(data.demandDate);
            demandDate.setDate(demandDate.getDate() - 1);
            const year = demandDate.getFullYear();
            const month = String(demandDate.getMonth() + 1).padStart(2, '0');
            const day = String(demandDate.getDate()).padStart(2, '0');
            completionDate = `${year}-${month}-${day}`;
          }
          
          // ⚠️ 禁止推送到工序计划，只推送到真工序计划
          /* 
          // 创建工序计划
          await connection.execute(`
            INSERT INTO process_plans (
              plan_no,
              sales_order_no,
              master_plan_no,
              product_code,
              product_name,
              process_name,
              product_unit,
              level0_demand,
              completion_date,
              replenishment_qty,
              standard_work_quota,
              standard_work_hours,
              customer_name,
              source_no,
              schedule_count,
              submitted_by,
              submitted_at,
              created_at,
              updated_at
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW()
            )
          `, [
            processPlanNo,
            data.salesOrderNo || null,
            data.sourcePlanNo || null,
            data.materialCode || null,
            data.materialName || null,
            data.sourceProcess || null,
            data.materialUnit || null,
            data.mainPlanQuantity || 0,
            completionDate,
            replenishmentQty,
            standardWorkQuota,   // ✅ 定时工额
            standardWorkHours,   // ✅ 定额工时
            data.customerName || null,
            data.planNo || null,  // ✅ 需求2：来源编号 = 备料计划编号
            1,  // ✅ 需求2：排程次数 = 1
            data.createdBy || 'admin'
          ]);
          
          console.log(`✅ 自动生成工序计划: ${processPlanNo}`);
          console.log(`   来源编号: ${data.planNo}`);
          console.log(`   需补货数量: ${replenishmentQty.toFixed(2)} ${data.materialUnit || ''}`);
          console.log(`   定时工额: ${standardWorkQuota}`);
          console.log(`   排程次数: 1`);
          */
          
          // ✅ 同步推送到真工序计划
          const realProcessPlanNo = `RPP${year}${timestamp}${random}`;
          console.log('🔄 同步推送到真工序计划...');
          
          // ✅ 计算需求工时 = 需补货数量 / 定时工额
          let requiredWorkHours = 0;
          if (replenishmentQty > 0 && standardWorkQuota > 0) {
            requiredWorkHours = parseFloat((replenishmentQty / standardWorkQuota).toFixed(2));
          }
          console.log(`   🧮 计算需求工时: ${replenishmentQty} / ${standardWorkQuota} = ${requiredWorkHours}`);
          
          // ✅ 计算计划结束日期：MAXIFS(工序能力负荷表.日期，工序名称匹配，剩余工时≥门槛值)
          let planEndDate = null;
          if (requiredWorkHours > 0 && data.sourceProcess && completionDate) {
            try {
              const minRemainingHours = 0.5; // 默认剩余工时门槛值
              console.log(`   🔍 查询计划结束日期: 工序=${data.sourceProcess}, 完工日期=${completionDate}, 门槛=${minRemainingHours}`);
              
              const [capacityRows] = await connection.execute(`
                SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, remaining_hours 
                FROM process_capacity_load 
                WHERE process_name = ? 
                  AND date <= ? 
                  AND remaining_hours >= ? 
                ORDER BY date DESC 
                LIMIT 1
              `, [data.sourceProcess, completionDate, minRemainingHours]);
              
              if (capacityRows.length > 0) {
                const result = capacityRows[0];
                planEndDate = result.date;  // ✅ 直接使用DATE_FORMAT格式化后的日期
                console.log(`   ✅ 计划结束日期: ${planEndDate}, 剩余工时: ${result.remaining_hours}`);
              } else {
                console.log(`   ⚠️ 未找到符合条件的计划结束日期`);
              }
            } catch (error) {
              console.error(`   ❌ 查询计划结束日期失败:`, error.message);
            }
          }
          
          // ✅ 计算计划开始日期：从计划结束日期向前累加剩余工时
          let planStartDate = null;
          if (requiredWorkHours > 0 && data.sourceProcess && planEndDate) {
            try {
              const minRemainingHours = 0.5;
              console.log(`   🔍 查询计划开始日期: 工序=${data.sourceProcess}, 结束日期=${planEndDate}, 需求工时=${requiredWorkHours}`);
              
              const [validRows] = await connection.execute(`
                SELECT date, remaining_hours
                FROM process_capacity_load
                WHERE process_name = ?
                  AND date <= ?
                  AND remaining_hours >= ?
                ORDER BY date DESC
              `, [data.sourceProcess, planEndDate, minRemainingHours]);
              
              console.log(`   📊 符合条件的记录数: ${validRows.length}条`);
              
              let accumulated = 0;
              for (const row of validRows) {
                const dateStr = row.date instanceof Date 
                  ? row.date.toISOString().split('T')[0]
                  : String(row.date).split('T')[0];
                const hours = parseFloat(row.remaining_hours) || 0;
                
                accumulated += hours;
                console.log(`      ${dateStr}: 剩余${hours.toFixed(2)}h, 累计${accumulated.toFixed(2)}h`);
                
                if (accumulated >= requiredWorkHours) {
                  planStartDate = dateStr;
                  console.log(`   ✅ 计划开始日期: ${planStartDate}, 累计工时: ${accumulated.toFixed(2)}`);
                  break;
                }
              }
              
              if (!planStartDate) {
                console.log(`   ⚠️ 累计工时不足: ${accumulated.toFixed(2)} < ${requiredWorkHours}`);
              }
            } catch (error) {
              console.error(`   ❌ 查询计划开始日期失败:`, error.message);
            }
          }
          
          await connection.execute(`
            INSERT INTO real_process_plans (
              plan_no,
              sales_order_no,
              master_plan_no,
              product_code,
              product_name,
              process_name,
              product_unit,
              level0_demand,
              completion_date,
              replenishment_qty,
              standard_work_quota,
              standard_work_hours,
              required_work_hours,
              plan_end_date,
              plan_start_date,
              customer_name,
              source_no,
              schedule_count,
              submitted_by,
              submitted_at
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
            )
          `, [
            realProcessPlanNo,
            data.salesOrderNo || null,
            data.sourcePlanNo || null,
            data.materialCode || null,
            data.materialName || null,
            data.sourceProcess || null,
            data.materialUnit || null,
            data.mainPlanQuantity || 0,
            completionDate,
            replenishmentQty,
            standardWorkQuota,
            standardWorkHours,
            requiredWorkHours,  // ✅ 需求工时
            planEndDate,        // ✅ 计划结束日期
            planStartDate,      // ✅ 计划开始日期
            data.customerName || null,
            data.planNo || null,
            1,
            data.createdBy || 'admin'
          ]);
          
          console.log(`✅ 自动生成真工序计划: ${realProcessPlanNo}`);
          console.log(`   来源编号: ${data.planNo}`);
          console.log(`   需补货数量: ${replenishmentQty.toFixed(2)} ${data.materialUnit || ''}`);
          console.log(`   定时工额: ${standardWorkQuota}`);
          console.log(`   排程次数: 1`);
        } else {
          console.log('⚠️ 不符合自动推送条件，跳过生成工序计划');
          console.log(`   物料来源: ${data.materialSource}`);
          console.log(`   需补货数量: ${replenishmentQty.toFixed(2)}`);
        }
      }
      
      await connection.commit();
      
      return { 
        id: insertedId,
        processPlanNo: processPlanNo  // 返回生成的工序计划编号（如果有）
      };
    } catch (error) {
      await connection.rollback();
      console.error('创建备料计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 更新备料计划
   */
  static async update(id, data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const sql = `
        UPDATE material_preparation_plans SET
          source_plan_no = ?, source_process_plan_no = ?, material_code = ?, material_name = ?,
          material_source = ?, material_unit = ?, demand_quantity = ?, need_mrp = ?,
          realtime_stock = ?, projected_balance = ?, available_stock = ?, source_process = ?,
          workshop_name = ?, demand_date = ?, push_to_purchase = ?, push_to_process = ?,
          sales_order_no = ?, customer_order_no = ?, main_plan_product_code = ?,
          main_plan_product_name = ?, main_plan_quantity = ?, promise_delivery_date = ?,
          remark = ?, updated_by = ?
        WHERE id = ?
      `;
      
      const [result] = await connection.execute(sql, [
        data.sourcePlanNo || null,
        data.sourceProcessPlanNo || null,
        data.materialCode,
        data.materialName,
        data.materialSource || null,
        data.materialUnit || null,
        data.demandQuantity || 0,
        data.needMrp ? 1 : 0,
        data.realtimeStock || 0,
        data.projectedBalance || 0,
        data.availableStock || 0,
        data.sourceProcess || null,
        data.workshopName || null,
        data.demandDate || null,
        data.pushToPurchase ? 1 : 0,
        data.pushToProcess ? 1 : 0,
        data.salesOrderNo || null,
        data.customerOrderNo || null,
        data.mainPlanProductCode || null,
        data.mainPlanProductName || null,
        data.mainPlanQuantity || 0,
        data.promiseDeliveryDate || null,
        data.remark || null,
        data.updatedBy || null,
        id
      ]);
      
      if (result.affectedRows === 0) {
        throw new Error('备料计划不存在或未更新');
      }
      
      console.log(`备料计划更新成功, ID: ${id}`);
      
      // ✅ 自动推送到工序计划（当备料计划编号不为空且符合条件时）
      let processPlanNo = null;
      if (data.planNo) {
        // 检查推送条件
        const demandQty = parseFloat(data.demandQuantity || 0);
        const availableQty = parseFloat(data.availableStock || 0);
        const replenishmentQty = demandQty - availableQty;
        
        const shouldPush = (
          data.materialSource === '自制' && 
          replenishmentQty > 0
        );
        
        if (shouldPush) {
          console.log('🔄 备料计划更新，检查是否需要更新工序计划...');
          
          // 查询是否已存在对应的工序计划（根据备料计划编号关联）
          const [existingPlans] = await connection.execute(`
            SELECT id, plan_no FROM process_plans 
            WHERE master_plan_no = ? AND product_code = ?
            LIMIT 1
          `, [data.sourcePlanNo, data.materialCode]);
          
          if (existingPlans.length > 0) {
            // 更新已存在的工序计划
            const existingPlan = existingPlans[0];
            processPlanNo = existingPlan.plan_no;
            
            // ✅ 从产品物料库查询定时工额和定额工时
            let standardWorkQuota = 0;
            let standardWorkHours = 0;
            
            if (data.materialCode) {
              console.log(`   🔍 [新建] 开始查询物料编号: ${data.materialCode}`);
              
              try {
                const [materialRows] = await connection.execute(
                  'SELECT material_code, standard_time, quota_time FROM materials WHERE material_code = ? LIMIT 1',
                  [data.materialCode]
                );
                
                console.log(`   🔍 [新建] 查询结果数量: ${materialRows.length}`);
                
                if (materialRows.length > 0) {
                  const material = materialRows[0];
                  console.log(`   🔍 [新建] 查询到的数据:`, {
                    material_code: material.material_code,
                    standard_time: material.standard_time,
                    quota_time: material.quota_time
                  });
                  
                  // ✅ 修复字段映射：standard_time 是定时工额，quota_time 是定额工时
                  standardWorkQuota = parseFloat(material.standard_time || 0);  // 定时工额
                  standardWorkHours = parseFloat(material.quota_time || 0);      // 定额工时
                  
                  console.log(`   ✅ [新建] 字段映射完成: 定时工额=${standardWorkQuota}, 定额工时=${standardWorkHours}`);
                } else {
                  console.log(`   ⚠️ [新建] 未找到物料编号 ${data.materialCode} 对应的产品物料数据`);
                }
              } catch (queryError) {
                console.error(`   ❌ [新建] 查询物料数据失败:`, queryError);
              }
            } else {
              console.log(`   ⚠️ [新建] materialCode为空，无法查询`);
            }
            
            // 计算计划完工日期
            let completionDate = null;
            if (data.demandDate) {
              const demandDate = new Date(data.demandDate);
              demandDate.setDate(demandDate.getDate() - 1);
              const year = demandDate.getFullYear();
              const month = String(demandDate.getMonth() + 1).padStart(2, '0');
              const day = String(demandDate.getDate()).padStart(2, '0');
              completionDate = `${year}-${month}-${day}`;
            }
            
            await connection.execute(`
              UPDATE process_plans SET
                product_name = ?,
                process_name = ?,
                product_unit = ?,
                level0_demand = ?,
                completion_date = ?,
                replenishment_qty = ?,
                standard_work_quota = ?,
                standard_work_hours = ?,
                customer_name = ?,
                source_no = ?,
                schedule_count = ?,
                updated_at = NOW()
              WHERE id = ?
            `, [
              data.materialName,
              data.sourceProcess,
              data.materialUnit,
              data.mainPlanQuantity,
              completionDate,
              replenishmentQty,
              standardWorkQuota,   // ✅ 定时工额
              standardWorkHours,   // ✅ 定额工时
              data.customerName,
              data.planNo || null,  // ✅ 需求2：来源编号 = 备料计划编号
              1,  // ✅ 需求2：排程次数 = 1
              existingPlan.id
            ]);
            
            console.log(`✅ 更新工序计划: ${processPlanNo}`);
            console.log(`   来源编号: ${data.planNo}`);
            console.log(`   需补货数量: ${replenishmentQty.toFixed(2)} ${data.materialUnit || ''}`);
            console.log(`   定时工额: ${standardWorkQuota}`);
            console.log(`   排程次数: 1`);
          } else {
            // 创建新的工序计划
            
            // ✅ 从产品物料库查询定时工额和定额工时
            let standardWorkQuota = 0;
            let standardWorkHours = 0;
            
            if (data.materialCode) {
              console.log(`   🔍 [新建] 开始查询物料编号: ${data.materialCode}`);
              
              try {
                const [materialRows] = await connection.execute(
                  'SELECT material_code, standard_time, quota_time FROM materials WHERE material_code = ? LIMIT 1',
                  [data.materialCode]
                );
                
                console.log(`   🔍 [新建] 查询结果数量: ${materialRows.length}`);
                
                if (materialRows.length > 0) {
                  const material = materialRows[0];
                  console.log(`   🔍 [新建] 查询到的数据:`, {
                    material_code: material.material_code,
                    standard_time: material.standard_time,
                    quota_time: material.quota_time
                  });
                  
                  // ✅ 修复字段映射：standard_time 是定时工额，quota_time 是定额工时
                  standardWorkQuota = parseFloat(material.standard_time || 0);  // 定时工额
                  standardWorkHours = parseFloat(material.quota_time || 0);      // 定额工时
                  
                  console.log(`   ✅ [新建] 字段映射完成: 定时工额=${standardWorkQuota}, 定额工时=${standardWorkHours}`);
                } else {
                  console.log(`   ⚠️ [新建] 未找到物料编号 ${data.materialCode} 对应的产品物料数据`);
                }
              } catch (queryError) {
                console.error(`   ❌ [新建] 查询物料数据失败:`, queryError);
              }
            } else {
              console.log(`   ⚠️ [新建] materialCode为空，无法查询`);
            }
            
            const year = new Date().getFullYear();
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            processPlanNo = `PP${year}${timestamp}${random}`;
            
            let completionDate = null;
            if (data.demandDate) {
              const demandDate = new Date(data.demandDate);
              demandDate.setDate(demandDate.getDate() - 1);
              const year = demandDate.getFullYear();
              const month = String(demandDate.getMonth() + 1).padStart(2, '0');
              const day = String(demandDate.getDate()).padStart(2, '0');
              completionDate = `${year}-${month}-${day}`;
            }
            
            await connection.execute(`
              INSERT INTO process_plans (
                plan_no,
                sales_order_no,
                master_plan_no,
                product_code,
                product_name,
                process_name,
                product_unit,
                level0_demand,
                completion_date,
                replenishment_qty,
                standard_work_quota,
                standard_work_hours,
                customer_name,
                source_no,
                schedule_count,
                submitted_by,
                submitted_at,
                created_at,
                updated_at
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW()
              )
            `, [
              processPlanNo,
              data.salesOrderNo,
              data.sourcePlanNo,
              data.materialCode,
              data.materialName,
              data.sourceProcess,
              data.materialUnit,
              data.mainPlanQuantity,
              completionDate,
              replenishmentQty,
              standardWorkQuota,   // ✅ 定时工额
              standardWorkHours,   // ✅ 定额工时
              data.customerName,
              data.planNo || null,  // ✅ 需求2：来源编号 = 备料计划编号
              1,  // ✅ 需求2：排程次数 = 1
              data.updatedBy || 'admin'
            ]);
            
            console.log(`✅ 自动生成工序计划: ${processPlanNo}`);
            console.log(`   来源编号: ${data.planNo}`);
            console.log(`   需补货数量: ${replenishmentQty.toFixed(2)} ${data.materialUnit || ''}`);
            console.log(`   定时工额: ${standardWorkQuota}`);
            console.log(`   排程次数: 1`);
          }
        } else {
          console.log('⚠️ 不符合自动推送条件，跳过生成/更新工序计划');
        }
      }
      
      await connection.commit();
      
      return { 
        id,
        processPlanNo: processPlanNo
      };
    } catch (error) {
      await connection.rollback();
      console.error('更新备料计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 删除备料计划
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM material_preparation_plans WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('备料计划不存在');
      }
      
      console.log(`备料计划删除成功, ID: ${id}`);
      return { success: true };
    } catch (error) {
      console.error('删除备料计划失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除备料计划
   */
  static async batchDelete(ids) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      let successCount = 0;
      for (const id of ids) {
        const [result] = await connection.execute('DELETE FROM material_preparation_plans WHERE id = ?', [id]);
        successCount += result.affectedRows;
      }
      
      await connection.commit();
      console.log(`批量删除备料计划完成: 成功${successCount}条/总共${ids.length}条`);
      return { successCount, totalCount: ids.length };
    } catch (error) {
      await connection.rollback();
      console.error('批量删除备料计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = MaterialPreparationPlanService;
