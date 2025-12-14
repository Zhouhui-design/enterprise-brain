const { pool } = require('../config/database');
const RealProcessPlanService = require('./realProcessPlanService');  // ✅ 引入真工序计划Service

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
      
      // 分页查询（✅ 格式化日期字段为中国时区）
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);
      const dataSQL = `
        SELECT 
          id, plan_no, source_plan_no, source_process_plan_no,
          parent_code, parent_name, parent_schedule_quantity,
          material_code, material_name, material_source, material_unit,
          demand_quantity, need_mrp, realtime_stock, projected_balance,
          available_stock, replenishment_quantity, source_process,
          workshop_name, parent_process_name, process_interval_hours,
          process_interval_unit,
          DATE_FORMAT(process_schedule_date, '%Y-%m-%d') as process_schedule_date,
          DATE_FORMAT(demand_date, '%Y-%m-%d') as demand_date,
          push_to_purchase, push_to_process, sales_order_no, customer_order_no,
          main_plan_product_code, main_plan_product_name, main_plan_quantity,
          DATE_FORMAT(promise_delivery_date, '%Y-%m-%d') as promise_delivery_date,
          remark, created_by, created_at, updated_by, updated_at
        FROM material_preparation_plans 
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
        parentCode: row.parent_code,
        parentName: row.parent_name,
        parentScheduleQuantity: row.parent_schedule_quantity,
        materialCode: row.material_code,
        materialName: row.material_name,
        materialSource: row.material_source,
        materialUnit: row.material_unit,
        demandQuantity: row.demand_quantity,
        needMrp: row.need_mrp,
        realtimeStock: row.realtime_stock,
        projectedBalance: row.projected_balance,
        availableStock: row.available_stock,
        replenishmentQuantity: row.replenishment_quantity,  // ✅ 新增：需补货数量字段映射
        sourceProcess: row.source_process,
        workshopName: row.workshop_name,
        parentProcessName: row.parent_process_name,
        processIntervalHours: row.process_interval_hours,
        processIntervalUnit: row.process_interval_unit,
        processScheduleDate: row.process_schedule_date,
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
   * 根据ID获取备料计划（✅ 格式化日期字段）
   */
  static async getById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          id, plan_no, source_plan_no, source_process_plan_no,
          parent_code, parent_name, parent_schedule_quantity,
          material_code, material_name, material_source, material_unit,
          demand_quantity, need_mrp, realtime_stock, projected_balance,
          available_stock, replenishment_quantity, source_process,
          workshop_name, parent_process_name, process_interval_hours,
          process_interval_unit,
          DATE_FORMAT(process_schedule_date, '%Y-%m-%d') as process_schedule_date,
          DATE_FORMAT(demand_date, '%Y-%m-%d') as demand_date,
          push_to_purchase, push_to_process, sales_order_no, customer_order_no,
          main_plan_product_code, main_plan_product_name, main_plan_quantity,
          DATE_FORMAT(promise_delivery_date, '%Y-%m-%d') as promise_delivery_date,
          remark, created_by, created_at, updated_by, updated_at
        FROM material_preparation_plans WHERE id = ?
      `, [id]);
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
    let connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const sql = `
        INSERT INTO material_preparation_plans (
          plan_no, source_plan_no, source_process_plan_no, 
          parent_code, parent_name, parent_schedule_quantity,
          material_code, material_name,
          material_source, material_unit, demand_quantity, need_mrp, realtime_stock,
          projected_balance, available_stock, replenishment_quantity, source_process, 
          parent_process_name, process_interval_hours, process_interval_unit,
          process_schedule_date, workshop_name,
          demand_date,
          push_to_purchase, push_to_process, sales_order_no, customer_order_no,
          main_plan_product_code, main_plan_product_name, main_plan_quantity,
          promise_delivery_date, remark, created_by, created_at, updated_by, updated_at,
          product_image, customer_name, submitter, submit_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.execute(sql, [
        data.planNo,
        data.sourcePlanNo || null,
        data.sourceProcessPlanNo || null,
        data.parentCode || null,
        data.parentName || null,
        data.parentScheduleQuantity || null,
        data.materialCode,
        data.materialName,
        data.materialSource || null,
        data.materialUnit || null,
        data.demandQuantity || 0,
        data.needMrp ? 1 : 0,
        data.realtimeStock || 0,
        data.projectedBalance || 0,
        data.availableStock || 0,
        (data.demandQuantity || 0) - (data.availableStock || 0), // replenishment_quantity
        data.sourceProcess || null,
        data.parentProcessName || null,
        data.processIntervalHours || null,
        data.processIntervalUnit || null,
        data.processScheduleDate || null,
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
        data.createdBy || null,
        new Date(),  // created_at
        data.createdBy || null,  // updated_by
        new Date(),  // updated_at
        data.productImage || null,
        data.customerName || null,
        data.submitter || null,
        new Date()   // submit_time
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
          console.log('🔄 同步推送到真工序计划...');
          
          // 移除防重复检查，确保满足条件就触发推送
          console.log(`   ✅ 满足推送条件，继续创建真工序计划: ${data.planNo}`);
          // 确保realProcessPlanNo在正确的作用域内定义
          const realProcessPlanNo = `RPP${year}${timestamp}${random}`;
          
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
          
          // ✅ 计算真计划开始日期 = 计划开始日期 + 1天
          let realPlanStartDate = null;
          console.log(`\n📝 [排程次数=1] 真计划开始日期计算：`);
          console.log(`   计划开始日期 (plan_start_date): ${planStartDate}`);
          
          if (planStartDate) {
            const startDate = new Date(planStartDate);
            console.log(`   计算规则: 真计划开始日期 = 计划开始日期 + 1天`);
            console.log(`   计划开始日期 (Date对象): ${startDate.toISOString().split('T')[0]}`);
            
            startDate.setDate(startDate.getDate() + 1);
            const year = startDate.getFullYear();
            const month = String(startDate.getMonth() + 1).padStart(2, '0');
            const day = String(startDate.getDate()).padStart(2, '0');
            realPlanStartDate = `${year}-${month}-${day}`;
            
            console.log(`   ✅ 真计划开始日期 (real_plan_start_date): ${realPlanStartDate}`);
            console.log(`   计算步骤: ${planStartDate} + 1天 = ${realPlanStartDate}`);
          } else {
            console.log(`   ⚠️ 计划开始日期为空，无法计算真计划开始日期`);
          }
          
          // ✅ 计划排程日期 = 真计划开始日期（排程次数=1时）
          const scheduleDate = realPlanStartDate;
          console.log(`   ✅ 计划排程日期 (schedule_date): ${scheduleDate} (排程次数=1时，等于真计划开始日期)`);
          console.log(`   📊 计算次数: 1 (首次生成，来源：备料计划推送)\n`);
          
          // ✅ 计算6个自动字段
          let dailyTotalHours = 0;
          let dailyScheduledHours = 0;
          let dailyAvailableHours = 0;
          let scheduledWorkHours = 0;
          let scheduleQuantity = 0;
          let nextScheduleDate = null;
          
          if (scheduleDate && data.sourceProcess) {
            // 需求1: 查询当天总工时
            try {
              const [capacityRows] = await connection.execute(`
                SELECT work_shift, available_workstations
                FROM process_capacity_load
                WHERE process_name = ? AND date = ?
                LIMIT 1
              `, [data.sourceProcess, scheduleDate]);
              
              if (capacityRows.length > 0) {
                const workShift = parseFloat(capacityRows[0].work_shift || 0);
                const availableWorkstations = parseFloat(capacityRows[0].available_workstations || 0);
                dailyTotalHours = parseFloat((workShift * availableWorkstations).toFixed(2));
                console.log(`   ✅ 当天总工时: ${dailyTotalHours}`);
              }
            } catch (error) {
              console.error(`   ❌ 查询当天总工时失败:`, error.message);
            }
            
            // 需求2: 计算当天已排程工时 (SUMIFS)
            try {
              const [sumRows] = await connection.execute(`
                SELECT COALESCE(SUM(scheduled_work_hours), 0) as total
                FROM real_process_plans
                WHERE process_name = ? AND schedule_date = ?
              `, [data.sourceProcess, scheduleDate]);
              
              dailyScheduledHours = parseFloat(sumRows[0].total || 0);
              console.log(`   ✅ 当天已排程工时: ${dailyScheduledHours}`);
            } catch (error) {
              console.error(`   ❌ 计算当天已排程工时失败:`, error.message);
            }
            
            // 需求3: 当天可用工时 = 总工时 - 已排程工时
            dailyAvailableHours = parseFloat((dailyTotalHours - dailyScheduledHours).toFixed(2));
            console.log(`   ✅ 当天可用工时: ${dailyAvailableHours}`);
            
            // 需求4: 计划排程工时 = MIN(需求工时, 当天可用工时)
if (requiredWorkHours > 0 && dailyAvailableHours > 0) {
              scheduledWorkHours = parseFloat(Math.min(requiredWorkHours, dailyAvailableHours).toFixed(2));
              console.log(`   ✅ 计划排程工时: MIN(${requiredWorkHours}, ${dailyAvailableHours}) = ${scheduledWorkHours}`);
              
              // 需求5: 计划排程数量 = 排程工时 * 定时工额
              if (standardWorkQuota > 0) {
                scheduleQuantity = parseFloat((scheduledWorkHours * standardWorkQuota).toFixed(2));
                console.log(`   ✅ 计划排程数量: ${scheduledWorkHours} * ${standardWorkQuota} = ${scheduleQuantity}`);
              }
            }
            
            // 需求6: 下一个排程日期 (MINIFS查询)
            // 查询条件: 日期 > 计划排程日期 且 日期 <= 计划结束日期 且 剩余工时 > 门槛值
            if (scheduleDate && planEndDate) {
              try {
                const minRemainingHours = 0.5;
                console.log(`   🔍 查询下一个排程日期: 排程日期=${scheduleDate}, 结束日期=${planEndDate}`);
                
                const [nextRows] = await connection.execute(`
                  SELECT DATE_FORMAT(date, '%Y-%m-%d') as formatted_date, remaining_hours 
                  FROM process_capacity_load 
                  WHERE process_name = ? 
                    AND DATE_FORMAT(date, '%Y-%m-%d') > ?
                    AND DATE_FORMAT(date, '%Y-%m-%d') <= ?
                    AND remaining_hours > ? 
                  ORDER BY date ASC 
                  LIMIT 1
                `, [data.sourceProcess, scheduleDate, planEndDate, minRemainingHours]);
                
                if (nextRows.length > 0) {
                  nextScheduleDate = nextRows[0].formatted_date;
                  console.log(`   ✅ 下一个排程日期: ${nextScheduleDate}, 剩余工时: ${nextRows[0].remaining_hours}`);
                } else {
                  console.log(`   ⚠️ 未找到符合条件的下一个排程日期`);
                }
              } catch (error) {
                console.error(`   ❌ 查询下一个排程日期失败:`, error.message);
              }
            }
          }
          
          // ✅ 计算剩余需求工时 = 需求工时 - 计划排程工时
          let remainingRequiredHours = 0;
          if (requiredWorkHours > 0 && scheduledWorkHours > 0) {
            remainingRequiredHours = parseFloat((requiredWorkHours - scheduledWorkHours).toFixed(2));
            console.log(`   ✅ 剩余需求工时: ${requiredWorkHours} - ${scheduledWorkHours} = ${remainingRequiredHours}`);
          } else if (requiredWorkHours > 0) {
            // 如果没有排程工时,剩余需求工时 = 需求工时
            remainingRequiredHours = requiredWorkHours;
            console.log(`   ✅ 剩余需求工时: ${remainingRequiredHours} (未排程)`);
          }
          
          // ✅ 计算累积排程数量 = SUMIFS(计划排程数量, 来源编号=本行来源编号)
          // 注意: 因为这是新建记录,还没有ID,所以累积排程数量就是当前的计划排程数量
          const cumulativeScheduleQty = scheduleQuantity;
          console.log(`   ✅ 累积排程数量: ${cumulativeScheduleQty} (新建记录)`);
          
          // ✅ 计算未排数量 = 需补货数量 - 累积排程数量
          let unscheduledQty = 0;
          if (replenishmentQty > 0 && cumulativeScheduleQty >= 0) {
            unscheduledQty = parseFloat((replenishmentQty - cumulativeScheduleQty).toFixed(2));
            console.log(`   ✅ 未排数量: ${replenishmentQty} - ${cumulativeScheduleQty} = ${unscheduledQty}`);
          } else if (replenishmentQty > 0) {
            unscheduledQty = replenishmentQty;
            console.log(`   ✅ 未排数量: ${unscheduledQty} (无排程)`);
          }
          
          // ✅ 调试日志：检查备料计划data中的4个字段值（驼峰命名优先，兼容下划线命名）
          console.log('🔍 备料计划data中的新字段值（调试）:');
          console.log('   customerOrderNo (驼峰):', data.customerOrderNo);
          console.log('   customer_order_no (下划线):', data.customer_order_no);
          console.log('   mainPlanProductCode (驼峰):', data.mainPlanProductCode);
          console.log('   main_plan_product_code (下划线):', data.main_plan_product_code);
          console.log('   mainPlanProductName (驼峰):', data.mainPlanProductName);
          console.log('   main_plan_product_name (下划线):', data.main_plan_product_name);
          console.log('   promiseDeliveryDate (驼峰):', data.promiseDeliveryDate);
          console.log('   promise_delivery_date (下划线):', data.promise_delivery_date);
          console.log('   salesOrderNo (驼峰):', data.salesOrderNo);
          console.log('   sales_order_no (下划线):', data.sales_order_no);
          
          // ✅ 使用RealProcessPlanService.create方法生成真工序计划，自动触发6个字段计算
          // ✅ 修复：兼容驼峰和下划线命名（优先使用驼峰，回退到下划线）
          const realProcessPlanData = {
            planNo: realProcessPlanNo,
            salesOrderNo: data.salesOrderNo || data.sales_order_no || null,
            customerOrderNo: data.customerOrderNo || data.customer_order_no || null,      // ✅ 修复: 兼容下划线命名
            masterPlanNo: data.sourcePlanNo || data.source_plan_no || null,
            mainPlanProductCode: data.mainPlanProductCode || data.main_plan_product_code || null,  // ✅ 修复: 兼容下划线命名
            mainPlanProductName: data.mainPlanProductName || data.main_plan_product_name || null,  // ✅ 修复: 兼容下划线命名
            productCode: data.materialCode || data.material_code || null,
            productName: data.materialName || data.material_name || null,
            processName: data.sourceProcess || data.source_process || null,
            productUnit: data.materialUnit || data.material_unit || null,
            level0Demand: data.mainPlanQuantity || data.main_plan_quantity || 0,
            completionDate: completionDate,
            promiseDeliveryDate: data.promiseDeliveryDate || data.promise_delivery_date || null,  // ✅ 修复: 兼容下划线命名
            replenishmentQty: replenishmentQty,
            standardWorkQuota: standardWorkQuota,
            standardWorkHours: standardWorkHours,
            requiredWorkHours: requiredWorkHours,
            planEndDate: planEndDate,
            planStartDate: planStartDate,
            realPlanStartDate: realPlanStartDate,     // ✅ 真计划开始日期
            scheduleDate: scheduleDate,                // ✅ 计划排程日期
            dailyTotalHours: dailyTotalHours,          // ✅ 当天总工时
            dailyScheduledHours: dailyScheduledHours,  // ✅ 当天已排程工时
            dailyAvailableHours: dailyAvailableHours,  // ✅ 当天可用工时
            scheduledWorkHours: scheduledWorkHours,    // ✅ 计划排程工时
            scheduleQuantity: scheduleQuantity,        // ✅ 计划排程数量
            nextScheduleDate: nextScheduleDate,        // ✅ 下一个排程日期
            remainingRequiredHours: remainingRequiredHours, // ✅ 剩余需求工时
            cumulativeScheduleQty: cumulativeScheduleQty,   // ✅ 累积排程数量
            unscheduledQty: unscheduledQty,            // ✅ 未排数量
            customerName: data.customerName || null,
            sourceNo: data.planNo || null,
            scheduleCount: 1,
            submittedBy: data.createdBy || 'admin',
            submittedAt: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })  // ✅ 中国时区时间
          };
          
          // ✅ 提交当前事务
          await connection.commit();
          connection.release();
          
          // ✅ 调用RealProcessPlanService.create（它会开启新事务）
          const createResult = await RealProcessPlanService.create(realProcessPlanData);
          const createdPlanId = createResult.id;
          console.log(`✅ 真工序计划创建成功, ID: ${createdPlanId}`);
          
          // ✅ 检查是否需要自增行（从数据库重新查询最新值）
          console.log(`🔍 检查自增条件...`);
          const { pool: dbPool } = require('../config/database');
          const [checkRows] = await dbPool.execute(
            'SELECT unscheduled_qty, DATE_FORMAT(next_schedule_date, \'%Y-%m-%d\') as next_schedule_date FROM real_process_plans WHERE id = ?',
            [createdPlanId]
          );
          
          if (checkRows.length > 0) {
            const actualUnscheduledQty = parseFloat(checkRows[0].unscheduled_qty || 0);
            const actualNextScheduleDate = checkRows[0].next_schedule_date;
            
            console.log(`   数据库实际值: 未排数量=${actualUnscheduledQty}, 下一个排程日期=${actualNextScheduleDate}`);
            
            if (actualUnscheduledQty > 0 && actualNextScheduleDate) {
              console.log(`🔁 检测到未排数量=${actualUnscheduledQty} > 0，开始自增行递归排程...`);
              
              // 调用自增方法（异步递归）
              await RealProcessPlanService.checkAndCreateIncremental(createdPlanId);
            } else {
              console.log(`✅ 排程完毕，未排数量=${actualUnscheduledQty}，无需自增`);
            }
          }
          
          // ✅ 重新获取connection继续后续逻辑
          connection = await pool.getConnection();
          await connection.beginTransaction();

          console.log(`✅ 自动生成真工序计划: ${realProcessPlanNo}`);
          console.log(`   来源编号: ${data.planNo}`);
          console.log(`   需补货数量: ${replenishmentQty.toFixed(2)} ${data.materialUnit || ''}`);
          console.log(`   定时工额: ${standardWorkQuota}`);
          console.log(`   排程次数: 1`);
          console.log(`   ✅ 已自动计算6个字段：计划排程日期、当天已排程工时、当天可用工时、计划排程工时、计划排程数量、下一个排程日期`);
          
          // ✅ 更新备料计划的是否下推工序计划字段为是
          if (realProcessPlanNo) {
            await connection.execute(
              'UPDATE material_preparation_plans SET push_to_process = ? WHERE plan_no = ?',
              [1, data.planNo]
            );
            console.log(`   ✅ 更新备料计划push_to_process字段为true`);
          }
        } else {
          console.log('⚠️ 不符合自动推送条件，跳过生成/更新工序计划');
        }
      }
      
      await connection.commit();
      
      console.log('🔍 返回结果检查:', {
        insertedId,
        processPlanNo
      });
      
      return { 
        id: insertedId,
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

  /**
   * 自动触发推送检查 - 检查所有满足条件的备料计划并推送到真工序计划
   */
  static async autoTriggerPush() {
    console.log('🔄 开始自动触发推送检查...');
    
    try {
      // 查询所有满足推送条件的备料计划
      const [qualifyingPlans] = await pool.execute(`
        SELECT 
          id, plan_no, source_plan_no, source_process_plan_no,
          parent_code, parent_name, parent_schedule_quantity,
          material_code, material_name, material_source, material_unit,
          demand_quantity, need_mrp, realtime_stock, projected_balance,
          available_stock, replenishment_quantity, source_process,
          workshop_name, parent_process_name, process_interval_hours,
          process_interval_unit,
          DATE_FORMAT(process_schedule_date, '%Y-%m-%d') as process_schedule_date,
          DATE_FORMAT(demand_date, '%Y-%m-%d') as demand_date,
          push_to_purchase, push_to_process, sales_order_no, customer_order_no,
          main_plan_product_code, main_plan_product_name, main_plan_quantity,
          DATE_FORMAT(promise_delivery_date, '%Y-%m-%d') as promise_delivery_date,
          remark, created_by, created_at, updated_by, updated_at
        FROM material_preparation_plans 
        WHERE material_source = '自制' 
          AND CAST(demand_quantity AS DECIMAL(10,4)) - CAST(available_stock AS DECIMAL(10,4)) > 0
          AND plan_no IS NOT NULL
        ORDER BY created_at DESC
      `);

      console.log(`📊 找到 ${qualifyingPlans.length} 条满足条件的备料计划`);

      let pushCount = 0;
      
      for (const plan of qualifyingPlans) {
        console.log(`\n📤 开始推送备料计划: ${plan.plan_no} (${plan.material_code}, ${plan.material_source}, ${plan.replenishment_quantity})`);
        
        // 转换数据格式并推送到真工序计划
        const planData = {
          planNo: plan.plan_no,
          sourcePlanNo: plan.source_plan_no,
          sourceProcessPlanNo: plan.source_process_plan_no,
          parentCode: plan.parent_code,
          parentName: plan.parent_name,
          parentScheduleQuantity: plan.parent_schedule_quantity,
          materialCode: plan.material_code,
          materialName: plan.material_name,
          materialSource: plan.material_source,
          materialUnit: plan.material_unit,
          demandQuantity: plan.demand_quantity,
          needMrp: plan.need_mrp,
          realtimeStock: plan.realtime_stock,
          projectedBalance: plan.projected_balance,
          availableStock: plan.available_stock,
          replenishmentQuantity: plan.replenishment_quantity,
          sourceProcess: plan.source_process,
          workshopName: plan.workshop_name,
          parentProcessName: plan.parent_process_name,
          processIntervalHours: plan.process_interval_hours,
          processIntervalUnit: plan.process_interval_unit,
          processScheduleDate: plan.process_schedule_date,
          demandDate: plan.demand_date,
          pushToPurchase: plan.push_to_purchase,
          pushToProcess: plan.push_to_process,
          salesOrderNo: plan.sales_order_no,
          customerOrderNo: plan.customer_order_no,
          mainPlanProductCode: plan.main_plan_product_code,
          mainPlanProductName: plan.main_plan_product_name,
          mainPlanQuantity: plan.main_plan_quantity,
          promiseDeliveryDate: plan.promise_delivery_date,
          remark: plan.remark,
          createdBy: plan.created_by
        };

        try {
          // 调用推送逻辑
          await this.pushToRealProcessPlan(planData);
          pushCount++;
          console.log(`✅ 成功推送: ${plan.planNo}`);
        } catch (pushError) {
          console.error(`❌ 推送失败: ${plan.planNo}`, pushError.message);
        }
      }

      console.log(`\n📊 自动触发推送完成: 成功推送${pushCount}条, 总计${qualifyingPlans.length}条满足条件的备料计划`);
      
      return {
        total: qualifyingPlans.length,
        success: pushCount
      };
    } catch (error) {
      console.error('❌ 自动触发推送检查失败:', error);
      throw error;
    }
  }

  /**
   * 推送到真工序计划 - 从create方法中提取的推送逻辑
   * ✅ 防重复推送：通过source_no字段关联备料计划编号
   */
  static async pushToRealProcessPlan(data) {
    const connection = await pool.getConnection();
    try {
      // 检查推送条件
      const demandQty = parseFloat(data.demandQuantity || 0);
      const availableQty = parseFloat(data.availableStock || 0);
      const replenishmentQty = demandQty - availableQty;
      
      const shouldPush = (
        data.materialSource === '自制' && 
        replenishmentQty > 0
      );
      
      if (!shouldPush) {
        console.log('⚠️ 不符合推送条件');
        return;
      }

      // ✅ 最后一次防重复推送检查
      const [existingPlans] = await connection.execute(`
        SELECT id, plan_no FROM real_process_plans 
        WHERE source_no = ? AND product_code = ?
        LIMIT 1
      `, [data.planNo, data.materialCode]);

      if (existingPlans.length > 0) {
        console.log(`⏭️ 检测到重复推送，跳过: ${data.planNo} → ${existingPlans[0].plan_no}`);
        return { success: false, reason: 'duplicate', planNo: existingPlans[0].planNo };
      }

      // 从产品物料库查询定时工额和定额工时
      let standardWorkQuota = 0;
      let standardWorkHours = 0;
      
      if (data.materialCode) {
        try {
          const [materialRows] = await connection.execute(
            'SELECT material_code, standard_time, quota_time FROM materials WHERE material_code = ? LIMIT 1',
            [data.materialCode]
          );
          
          if (materialRows.length > 0) {
            const material = materialRows[0];
            standardWorkQuota = parseFloat(material.standard_time || 0);  // 定时工额
            standardWorkHours = parseFloat(material.quota_time || 0);      // 定额工时
            console.log(`✅ 查询到工时数据: 定时工额=${standardWorkQuota}, 定额工时=${standardWorkHours}`);
          }
        } catch (queryError) {
          console.error(`❌ 查询物料数据失败:`, queryError.message);
        }
      }

      // 生成真工序计划编号
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const realProcessPlanNo = `RPP${year}${timestamp}${random}`;

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

      // 计算需求工时 = 需补货数量 / 定时工额
      let requiredWorkHours = 0;
      if (replenishmentQty > 0 && standardWorkQuota > 0) {
        requiredWorkHours = parseFloat((replenishmentQty / standardWorkQuota).toFixed(2));
      }
      console.log(`🧮 计算需求工时: ${replenishmentQty} / ${standardWorkQuota} = ${requiredWorkHours}`);

      // 查询计划结束日期
      let planEndDate = null;
      if (requiredWorkHours > 0 && data.sourceProcess && completionDate) {
        try {
          const minRemainingHours = 0.5;
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
            planEndDate = capacityRows[0].date;
            console.log(`✅ 计划结束日期: ${planEndDate}`);
          }
        } catch (error) {
          console.error(`❌ 查询计划结束日期失败:`, error.message);
        }
      }

      // 查询计划开始日期
      let planStartDate = null;
      if (requiredWorkHours > 0 && data.sourceProcess && planEndDate) {
        try {
          const minRemainingHours = 0.5;
          const [validRows] = await connection.execute(`
            SELECT date, remaining_hours
            FROM process_capacity_load
            WHERE process_name = ?
              AND date <= ?
              AND remaining_hours >= ?
            ORDER BY date DESC
          `, [data.sourceProcess, planEndDate, minRemainingHours]);
          
          let accumulated = 0;
          for (const row of validRows) {
            const dateStr = row.date instanceof Date 
              ? row.date.toISOString().split('T')[0]
              : String(row.date).split('T')[0];
            const hours = parseFloat(row.remaining_hours) || 0;
            
            accumulated += hours;
            if (accumulated >= requiredWorkHours) {
              planStartDate = dateStr;
              console.log(`✅ 计划开始日期: ${planStartDate}, 累计工时: ${accumulated.toFixed(2)}`);
              break;
            }
          }
        } catch (error) {
          console.error(`❌ 查询计划开始日期失败:`, error.message);
        }
      }

      // 计算真计划开始日期 = 计划开始日期 + 1天
      let realPlanStartDate = null;
      if (planStartDate) {
        const startDate = new Date(planStartDate);
        startDate.setDate(startDate.getDate() + 1);
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        realPlanStartDate = `${year}-${month}-${day}`;
      }

      // 计划排程日期 = 真计划开始日期
      const scheduleDate = realPlanStartDate;

      // 创建真工序计划数据
      const realProcessPlanData = {
        planNo: realProcessPlanNo,
        salesOrderNo: data.salesOrderNo,
        customerOrderNo: data.customerOrderNo,
        masterPlanNo: data.sourcePlanNo,
        mainPlanProductCode: data.mainPlanProductCode,
        mainPlanProductName: data.mainPlanProductName,
        productCode: data.materialCode,
        productName: data.materialName,
        processName: data.sourceProcess,
        productUnit: data.materialUnit,
        level0Demand: data.mainPlanQuantity,
        completionDate: completionDate,
        promiseDeliveryDate: data.promiseDeliveryDate,
        replenishmentQty: replenishmentQty,
        standardWorkQuota: standardWorkQuota,
        standardWorkHours: standardWorkHours,
        requiredWorkHours: requiredWorkHours,
        planEndDate: planEndDate,
        planStartDate: planStartDate,
        realPlanStartDate: realPlanStartDate,
        scheduleDate: scheduleDate,
        customerName: data.customerName,
        sourceNo: data.planNo,  // ✅ 关键：使用备料计划编号作为来源编号
        scheduleCount: 1,
        submittedBy: data.createdBy || 'admin',
        submittedAt: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
      };

      // 调用RealProcessPlanService创建真工序计划
      const RealProcessPlanService = require('./realProcessPlanService');
      const createResult = await RealProcessPlanService.create(realProcessPlanData);
      const createdPlanId = createResult.id;
      
      console.log(`✅ 真工序计划创建成功: ${realProcessPlanNo}, ID: ${createdPlanId}`);

      // 检查是否需要自增行
      const [checkRows] = await connection.execute(
        'SELECT unscheduled_qty, DATE_FORMAT(next_schedule_date, \'%Y-%m-%d\') as next_schedule_date FROM real_process_plans WHERE id = ?',
        [createdPlanId]
      );
      
      if (checkRows.length > 0) {
        const actualUnscheduledQty = parseFloat(checkRows[0].unscheduled_qty || 0);
        const actualNextScheduleDate = checkRows[0].next_schedule_date;
        
        if (actualUnscheduledQty > 0 && actualNextScheduleDate) {
          console.log(`🔁 检测到未排数量=${actualUnscheduledQty}，开始自增行递归排程...`);
          await RealProcessPlanService.checkAndCreateIncremental(createdPlanId);
        }
      }

      return { success: true, planNo: realProcessPlanNo, id: createdPlanId };

    } catch (error) {
      console.error('❌ 推送到真工序计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  /**
   * ✅ 新增：备料计划推送到真工序计划 - 为realpProcessPlanService调用
   * 与 pushToRealProcessPlan 方法相同，但为了遻免循环依赖，单独定义
   */
  static async pushMaterialPlanToRealProcessPlan(data) {
    return await this.pushToRealProcessPlan(data);
  }
}

module.exports = MaterialPreparationPlanService;