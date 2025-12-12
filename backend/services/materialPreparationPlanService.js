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
          
          // ✅ 计算真计划开始日期 = 计划开始日期 + 1天
          let realPlanStartDate = null;
          if (planStartDate) {
            const startDate = new Date(planStartDate);
            startDate.setDate(startDate.getDate() + 1);
            const year = startDate.getFullYear();
            const month = String(startDate.getMonth() + 1).padStart(2, '0');
            const day = String(startDate.getDate()).padStart(2, '0');
            realPlanStartDate = `${year}-${month}-${day}`;
            console.log(`   ✅ 真计划开始日期: ${realPlanStartDate} (计划开始日期 + 1天)`);
          }
          
          // ✅ 计划排程日期 = 真计划开始日期（排程次数=1时）
          const scheduleDate = realPlanStartDate;
          
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
            
            // 需求6: 下一个排程日期 = 计划排程日期 + 1天
            if (scheduleDate) {
              const nextDate = new Date(scheduleDate);
              nextDate.setDate(nextDate.getDate() + 1);
              const year = nextDate.getFullYear();
              const month = String(nextDate.getMonth() + 1).padStart(2, '0');
              const day = String(nextDate.getDate()).padStart(2, '0');
              nextScheduleDate = `${year}-${month}-${day}`;
              console.log(`   ✅ 下一个排程日期: ${nextScheduleDate}`);
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
          
          // ✅ 使用RealProcessPlanService.create方法生成真工序计划，自动触发6个字段计算
          const realProcessPlanData = {
            planNo: realProcessPlanNo,
            salesOrderNo: data.salesOrderNo || null,
            masterPlanNo: data.sourcePlanNo || null,
            productCode: data.materialCode || null,
            productName: data.materialName || null,
            processName: data.sourceProcess || null,
            productUnit: data.materialUnit || null,
            level0Demand: data.mainPlanQuantity || 0,
            completionDate: completionDate,
            replenishmentQty: replenishmentQty,
            standardWorkQuota: standardWorkQuota,
            standardWorkHours: standardWorkHours,
            requiredWorkHours: requiredWorkHours,
            planEndDate: planEndDate,
            planStartDate: planStartDate,
            realPlanStartDate: realPlanStartDate,     // ✅ 新增: 真计划开始日期
            scheduleDate: scheduleDate,                // ✅ 新增: 计划排程日期
            dailyTotalHours: dailyTotalHours,          // ✅ 新增: 当天总工时
            dailyScheduledHours: dailyScheduledHours,  // ✅ 新增: 当天已排程工时
            dailyAvailableHours: dailyAvailableHours,  // ✅ 新增: 当天可用工时
            scheduledWorkHours: scheduledWorkHours,    // ✅ 新增: 计划排程工时
            scheduleQuantity: scheduleQuantity,        // ✅ 新增: 计划排程数量
            nextScheduleDate: nextScheduleDate,        // ✅ 新增: 下一个排程日期
            remainingRequiredHours: remainingRequiredHours, // ✅ 新增: 剩余需求工时
            cumulativeScheduleQty: cumulativeScheduleQty,   // ✅ 新增: 累积排程数量
            unscheduledQty: unscheduledQty,            // ✅ 新增: 未排数量
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
            'SELECT unscheduled_qty, next_schedule_date FROM real_process_plans WHERE id = ?',
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
          const newConnection = await pool.getConnection();
          await newConnection.beginTransaction();
          Object.assign(connection, newConnection);  // 替换connection引用
          
          console.log(`✅ 自动生成真工序计划: ${realProcessPlanNo}`);
          console.log(`   来源编号: ${data.planNo}`);
          console.log(`   需补货数量: ${replenishmentQty.toFixed(2)} ${data.materialUnit || ''}`);
          console.log(`   定时工额: ${standardWorkQuota}`);
          console.log(`   排程次数: 1`);
          console.log(`   ✅ 已自动计算6个字段：计划排程日期、当天已排程工时、当天可用工时、计划排程工时、计划排程数量、下一个排程日期`);
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
