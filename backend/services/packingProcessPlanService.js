const PlanEndDateCalculator = require('../utils/planEndDateCalculator');
const PlanStartDateCalculator = require('../utils/planStartDateCalculator');
const { pool } = require('../config/database');
const { formatLocalDate } = require('../utils/dateFormatter');

/**
 * 打包工序计划服务
 * 
 * ⚠️ 重要说明：命名变更历史
 * - 数据库表名：packing_process_plans（历史原因保留，实际存储喷塑工序数据）
 * - 表注释：'喷塑工序计划表'
 * - Service文件名：packingProcessPlanService.js（保留原名，避免大规模重构）
 * - 前端路由：/production-planning/packing-process-plan（打包工序计划）
 * - 实际用途：此Service操作的packing_process_plans表现在用于存储打包工序数据
 * 
 * 命名映射关系：
 * - 打包工序计划 = 原真工序计划（功能继承）
 * - 喷塑工序计划 = 原打包工序计划（已迁移到独立表spray_painting_process_plans）
 * - 真工序计划 = 保留，显示所有工序类型
 * 
 * 注意：虽然表名是packing_process_plans，但数据库注释标注为'喷塑工序计划表'，
 * 这是重构遗留问题。当前实际使用中，此表存储的是打包工序数据。
 */
class PackingProcessPlanService {
  /**
   * 获取所有打包工序计划(分页)
   */
  static async getAll(params = {}) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        planNo, 
        masterPlanNo, 
        processName,
        scheduleDateStart,
        scheduleDateEnd 
      } = params;
      
      let whereClause = [];
      const queryParams = [];
      
      if (planNo) {
        whereClause.push('plan_no LIKE ?');
        queryParams.push(`%${planNo}%`);
      }
      
      if (masterPlanNo) {
        whereClause.push('master_plan_no LIKE ?');
        queryParams.push(`%${masterPlanNo}%`);
      }
      
      if (processName) {
        whereClause.push('process_name LIKE ?');
        queryParams.push(`%${processName}%`);
      }
      
      if (scheduleDateStart) {
        whereClause.push('schedule_date >= ?');
        queryParams.push(scheduleDateStart);
      }
      
      if (scheduleDateEnd) {
        whereClause.push('schedule_date <= ?');
        queryParams.push(scheduleDateEnd);
      }
      
      const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';
      
      // 查询总数
      const countSQL = `SELECT COUNT(*) as total FROM packing_process_plans ${whereSQL}`;
      const [countResult] = await pool.execute(countSQL, queryParams);
      const total = countResult[0].total;
      
      // 分页查询（✅ 格式化日期字段为中国时区）
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);
      const dataSQL = `
        SELECT 
          id, plan_no, schedule_date, DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date_formatted,
          sales_order_no, customer_order_no, master_plan_no, master_plan_product_code,
          master_plan_product_name, shipping_plan_no, product_code, product_name,
          product_image, process_manager, process_name, schedule_quantity,
          product_unit, level0_demand, completion_date, order_promise_delivery_date,
          DATE_FORMAT(plan_start_date, '%Y-%m-%d') as plan_start_date,
          DATE_FORMAT(real_plan_start_date, '%Y-%m-%d') as real_plan_start_date,
          DATE_FORMAT(plan_end_date, '%Y-%m-%d') as plan_end_date,
          workshop_name, daily_available_hours, remaining_required_hours, schedule_count,
          standard_work_hours, standard_work_quota, cumulative_schedule_qty,
          unscheduled_qty, source_page_name, source_no, row_index,
          previous_schedule_no, customer_name, level0_product_name, level0_product_code,
          level0_production_qty, product_source, bom_no, submitted_by,
          submitted_at, replenishment_qty, required_work_hours,
          daily_total_hours, daily_scheduled_hours, scheduled_work_hours,
          DATE_FORMAT(next_schedule_date, '%Y-%m-%d') as next_schedule_date,
          (
            SELECT COUNT(*)
            FROM packing_process_plans AS rpp2
            WHERE rpp2.process_name = packing_process_plans.process_name
              AND DATE_FORMAT(rpp2.schedule_date, '%Y-%m-%d') = DATE_FORMAT(packing_process_plans.schedule_date, '%Y-%m-%d')
              AND rpp2.id <= packing_process_plans.id
          ) as daily_plan_count,
          created_at, updated_at
        FROM packing_process_plans 
        ${whereSQL}
        ORDER BY schedule_date ASC, created_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const [rows] = await pool.execute(dataSQL, queryParams);
      
      // 转换字段名：snake_case -> camelCase
      const convertedRows = rows.map(row => {
        const convertedRow = {};
        Object.keys(row).forEach(key => {
          // 将下划线命名转换为驼峰命名
          const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
          convertedRow[camelKey] = row[key];
        });
        
        // ✅ 使用格式化后的日期字段
        if (row.schedule_date_formatted) {
          convertedRow.scheduleDate = row.schedule_date_formatted;
        }
        
        return convertedRow;
      });
      
      console.log(`✅ 查询成功，共 ${total} 条记录，当前页 ${convertedRows.length} 条`);
      if (convertedRows.length > 0) {
        console.log(`首条记录: ${convertedRows[0].planNo} - ${convertedRows[0].processName}`);
        console.log('🔍 字段转换示例:', {
          plan_no: convertedRows[0].planNo,
          process_name: convertedRows[0].processName,
          master_plan_no: convertedRows[0].masterPlanNo,
          source_no: convertedRows[0].sourceNo,  // ✅ 添加来源编号转换日志
          schedule_count: convertedRows[0].scheduleCount  // ✅ 添加排程次数转换日志
        });
      }
      
      return {
        records: convertedRows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    } catch (error) {
      console.error('获取打包工序计划列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取打包工序计划
   */
  static async getById(id) {
    try {
      // ✅ 格式化日期字段为中国时区
      const [rows] = await pool.execute(`
        SELECT 
          id, plan_no, schedule_date, DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date_formatted,
          sales_order_no, customer_order_no, master_plan_no, master_plan_product_code,
          master_plan_product_name, shipping_plan_no, product_code, product_name,
          product_image, process_manager, process_name, schedule_quantity,
          product_unit, level0_demand, completion_date, order_promise_delivery_date,
          DATE_FORMAT(plan_start_date, '%Y-%m-%d') as plan_start_date,
          DATE_FORMAT(real_plan_start_date, '%Y-%m-%d') as real_plan_start_date,
          DATE_FORMAT(plan_end_date, '%Y-%m-%d') as plan_end_date,
          workshop_name, daily_available_hours, remaining_required_hours, schedule_count,
          standard_work_hours, standard_work_quota, cumulative_schedule_qty,
          unscheduled_qty, source_page_name, source_no, previous_schedule_no,
          customer_name, level0_product_name, level0_product_code,
          level0_production_qty, product_source, bom_no, submitted_by,
          submitted_at, replenishment_qty, required_work_hours,
          daily_total_hours, daily_scheduled_hours, scheduled_work_hours,
          DATE_FORMAT(next_schedule_date, '%Y-%m-%d') as next_schedule_date,
          (
            SELECT COUNT(*)
            FROM packing_process_plans AS rpp2
            WHERE rpp2.process_name = packing_process_plans.process_name
              AND DATE_FORMAT(rpp2.schedule_date, '%Y-%m-%d') = DATE_FORMAT(packing_process_plans.schedule_date, '%Y-%m-%d')
              AND rpp2.id <= packing_process_plans.id
          ) as daily_plan_count,
          created_at, updated_at
        FROM packing_process_plans WHERE id = ?
      `, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      // 转换字段名：snake_case -> camelCase
      const convertedRow = {};
      Object.keys(row).forEach(key => {
        const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        convertedRow[camelKey] = row[key];
      });
      
      // ✅ 使用格式化后的日期
      convertedRow.scheduleDate = row.schedule_date_formatted;
      
      return convertedRow;
    } catch (error) {
      console.error('获取打包工序计划详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建打包工序计划
   */
  static async create(data) {
    try {
      // ✅ Lookup定时工额：从产品物料库查询
      // 规则：lookup(产品物料库的"物料编号"=当前工序计划的"生产产品编号"，产品物料库的"定时工额")
      // 前置条件：当前工序计划"生产产品编号"不为空
      let standardWorkQuota = data.standardWorkQuota || 0;
      
      console.log('========================================');
      console.log('🔍 [定时工额Lookup] 开始处理');
      console.log(`📋 [定时工额Lookup] 传入的productCode: "${data.productCode}"`);
      console.log(`📋 [定时工额Lookup] 传入的standardWorkQuota: ${data.standardWorkQuota}`);
      console.log(`📋 [定时工额Lookup] 初始standardWorkQuota变量: ${standardWorkQuota}`);
      console.log('========================================');
      
      if (data.productCode) {
        try {
          console.log(`🔍 [定时工额Lookup] 开始查询产品物料库: 物料编号=${data.productCode}`);
          const [materialRows] = await pool.execute(
            'SELECT standard_time FROM materials WHERE material_code = ?',
            [data.productCode]
          );
          
          console.log(`📊 [定时工额Lookup] 查询结果行数: ${materialRows.length}`);
          if (materialRows.length > 0) {
            console.log(`📊 [定时工额Lookup] 查询结果:`, materialRows[0]);
            console.log(`📊 [定时工额Lookup] standard_time值: ${materialRows[0].standard_time}`);
            console.log(`📊 [定时工额Lookup] standard_time类型: ${typeof materialRows[0].standard_time}`);
          }
          
          if (materialRows.length > 0 && materialRows[0].standard_time) {
            const lookupValue = parseFloat(materialRows[0].standard_time);
            standardWorkQuota = lookupValue;
            console.log('========================================');
            console.log(`✅ [定时工额Lookup] Lookup成功！`);
            console.log(`✅ [定时工额Lookup] 原始值: ${materialRows[0].standard_time}`);
            console.log(`✅ [定时工额Lookup] 解析后: ${lookupValue}`);
            console.log(`✅ [定时工额Lookup] 赋值后的standardWorkQuota: ${standardWorkQuota}`);
            console.log('========================================');
          } else {
            console.log('========================================');
            console.log(`⚠️ [定时工额Lookup] 未找到定时工额！`);
            console.log(`⚠️ [定时工额Lookup] 物料编号: ${data.productCode}`);
            console.log(`⚠️ [定时工额Lookup] 使用默认值: ${standardWorkQuota}`);
            console.log('========================================');
          }
        } catch (lookupError) {
          console.log('========================================');
          console.error(`❌ [定时工额Lookup] 查询失败！`);
          console.error(`❌ [定时工额Lookup] 错误:`, lookupError);
          console.log('========================================');
          // 查询失败时使用传入的值或0
        }
      } else {
        console.log('========================================');
        console.log(`⚠️ [定时工额Lookup] productCode为空，跳过lookup`);
        console.log('========================================');
      }
      
      // ✅ 预计算 replenishment (后续多处使用)
      const replenishment = parseFloat(data.replenishmentQty || data.scheduleQuantity || 0);
      
      // ✅ 计算需求工时
      // 规则：需补货数量 ÷ 定时工额（四舍五入，保留2位小数）
      let requiredWorkHours = 0;
      if (standardWorkQuota > 0 && replenishment > 0) {
        requiredWorkHours = parseFloat((replenishment / standardWorkQuota).toFixed(2));
        console.log(`✅ [需求工时计算] ${replenishment} ÷ ${standardWorkQuota} = ${requiredWorkHours}`);
      }
      
      // ✅ 查询当天总工时（从工序能力负荷表）
      // 规则：可用工位数量 × 上班时段
      let dailyTotalHours = 0;
      if (data.scheduleDate && data.processName) {
        try {
          const scheduleDate = new Date(data.scheduleDate);
          const formattedDate = scheduleDate.toISOString().split('T')[0];
          
          console.log(`🔍 [当天总工时查询] 工序=${data.processName}, 日期=${formattedDate}`);
          const [capacityRows] = await pool.execute(`
            SELECT available_workstations, work_shift 
            FROM process_capacity_load 
            WHERE process_name = ? AND date = ?
          `, [data.processName, formattedDate]);
          
          if (capacityRows.length > 0) {
            const capacity = capacityRows[0];
            dailyTotalHours = parseFloat((capacity.available_workstations * capacity.work_shift).toFixed(2));
            console.log(`✅ [当天总工时查询] ${capacity.available_workstations} × ${capacity.work_shift} = ${dailyTotalHours}`);
          } else {
            console.log(`⚠️ [当天总工时查询] 未找到工序能力负荷记录`);
          }
        } catch (error) {
          console.error(`❌ [当天总工时查询失败]`, error);
        }
      }
      
      // ✅ 计算计划结束日期
      // 规则：
      // 1. 如果是备料计划推送的数据（sourcePageName='备料计划'），直接使用 completionDate
      // 2. 否则，基于需补货数量、定时工额、计划开始日期、工序能力负荷表计算
      let planEndDate = data.planEndDate || null;
      
      // 📌 关键规则：备料计划推送的数据，计划结束日期 = 计划完工日期
      if (data.sourcePageName === '备料计划' && data.completionDate) {
        planEndDate = data.completionDate;
        console.log(`✅ [计划结束日期] 来源=备料计划，使用计划完工日期: ${planEndDate}`);
      }
      // 其他来源，执行计算逻辑
      else if (replenishment > 0 && standardWorkQuota > 0) {
        try {
          console.log(`🔍 [计划结束日期计算] 开始计算...`);
          const calculatedEndDate = await PlanEndDateCalculator.calculate({
            replenishmentQty: replenishment,
            standardWorkQuota: standardWorkQuota,
            planStartDate: data.planStartDate,
            scheduleDate: data.scheduleDate,
            processName: data.processName
          });
          
          if (calculatedEndDate) {
            planEndDate = calculatedEndDate;
            console.log(`✅ [计划结束日期计算] 计算成功: ${planEndDate.toISOString().split('T')[0]}`);
          } else {
            console.log(`⚠️ [计划结束日期计算] 计算失败，使用传入值或null`);
          }
        } catch (calcError) {
          console.error(`❌ [计划结束日期计算] 计算异常:`, calcError);
          // 计算失败时使用传入的值或null
        }
      } else {
        console.log(`⚠️ [计划结束日期计算] 不满足计算条件 (需补货数量=${replenishment}, 定时工额=${standardWorkQuota})`);
      }
      
      // ✅ 计算计划开始日期（倒拉式排程）
      let planStartDate = data.planStartDate || null;
      if (planEndDate && data.processName) {
        try {
          const minRemainingHours = data.minRemainingHours || 0.5; // 从页面设置读取
          const calculatedStartDate = await PlanStartDateCalculator.calculate({
            planEndDate: planEndDate,
            processName: data.processName,
            minRemainingHours: minRemainingHours
          });
          if (calculatedStartDate) {
            planStartDate = calculatedStartDate;
          }
        } catch (error) {
          console.error(`❌ [计划开始日期计算] 失败:`, error);
        }
      }
      
      // ✅ 重要修复：计划排程日期 = 计划开始日期
      // 确保数据库中存储的 schedule_date 等于 plan_start_date
      let scheduleDate = data.scheduleDate || null;
      if (planStartDate) {
        scheduleDate = planStartDate;
        console.log(`✅ [计划排程日期] 设置为计划开始日期: ${scheduleDate}`);
      }
      
      // 正确的SQL，包含所有字段，数量匹配
      const sql = `
        INSERT INTO packing_process_plans (
          plan_no, schedule_date, sales_order_no, customer_order_no, master_plan_no, 
          master_plan_product_code, master_plan_product_name, shipping_plan_no,
          product_code, product_name, product_image, process_manager, process_name,
          schedule_quantity, product_unit, level0_demand, completion_date, order_promise_delivery_date,
          plan_start_date, real_plan_start_date, plan_end_date,
          workshop_name, daily_available_hours, remaining_required_hours, schedule_count,
          standard_work_hours, standard_work_quota, cumulative_schedule_qty, unscheduled_qty,
          source_page_name, source_no, previous_schedule_no, customer_name,
          level0_product_name, level0_product_code, level0_production_qty,
          product_source, bom_no, hierarchy_address, submitted_by, submitted_at, replenishment_qty,
          required_work_hours,
          daily_total_hours, daily_scheduled_hours, scheduled_work_hours, next_schedule_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await pool.execute(sql, [
        data.planNo,                                 // 1. plan_no
        scheduleDate,                                // 2. schedule_date ✅ 修复：使用计算后的值（= planStartDate）
        data.salesOrderNo || null,                    // 3. sales_order_no
        data.customerOrderNo || null,                 // 4. customer_order_no (✅ 新增)
        data.masterPlanNo || null,                    // 5. master_plan_no
        data.masterPlanProductCode || null,           // 6. master_plan_product_code (✅ 修复：使用masterPlanProductCode)
        data.masterPlanProductName || null,           // 7. master_plan_product_name (✅ 修复：使用masterPlanProductName)
        data.shippingPlanNo || null,                  // 8. shipping_plan_no
        data.productCode || null,                     // 9. product_code
        data.productName || null,                     // 10. product_name
        data.productImage || null,                    // 11. product_image
        data.processManager || null,                  // 12. process_manager
        data.processName || null,                     // 13. process_name
        data.scheduleQuantity || 0,                   // 14. schedule_quantity
        data.productUnit || null,                     // 15. product_unit
        data.level0Demand || 0,                       // 16. level0_demand
        data.completionDate || null,                  // 17. completion_date
        data.promiseDeliveryDate || data.orderPromiseDeliveryDate || null,  // 18. order_promise_delivery_date (✅ 修复：兼容两种命名)
        planStartDate,                                    // 19. plan_start_date (✅ 使用计算的值)
        data.realPlanStartDate || null,                // 20. real_plan_start_date
        planEndDate,                                  // 21. plan_end_date (✅ 使用计算的值)
        data.workshopName || null,                    // 22. workshop_name
        data.dailyAvailableHours || 0,                 // 23. daily_available_hours
        data.remainingRequiredHours || 0,              // 24. remaining_required_hours
        data.scheduleCount || 0,                       // 25. schedule_count
        data.standardWorkHours || 0,                  // 26. standard_work_hours
        standardWorkQuota,                            // 27. standard_work_quota (✅ 使用lookup的值)
        data.cumulativeScheduleQty || 0,              // 28. cumulative_schedule_qty
        data.unscheduledQty || 0,                     // 29. unscheduled_qty
        data.sourcePageName || null,                  // 30. source_page_name
        data.sourceNo || null,                         // 31. source_no
        data.previousScheduleNo || null,              // 32. previous_schedule_no
        data.customerName || null,                     // 33. customer_name
        data.level0ProductName || null,                // 34. level0_product_name
        data.level0ProductCode || null,                // 35. level0_product_code
        data.level0ProductionQty || 0,                // 36. level0_production_qty
        data.productSource || null,                    // 37. product_source
        data.bomNo || null,                            // 38. bom_no
        data.hierarchyAddress || null,                 // 39. hierarchy_address (✅ 新增)
        data.submittedBy || null,                      // 40. submitted_by
        data.submittedAt || null,                      // 41. submitted_at
        data.replenishmentQty || 0,                   // 42. replenishment_qty
        requiredWorkHours,                            // 43. required_work_hours (✅ 使用计算的值)
        dailyTotalHours,                              // 44. daily_total_hours (✅ 使用查询的值)
        data.dailyScheduledHours || 0,                // 45. daily_scheduled_hours
        data.scheduledWorkHours || 0,                 // 46. scheduled_work_hours
        data.nextScheduleDate || null                 // 47. next_schedule_date
      ]);
      
      console.log('========================================');
      console.log(`📝 [SQL执行] 插入完成！插入ID: ${result.insertId}`);
      console.log(`📝 [SQL执行] 插入的standardWorkQuota值: ${standardWorkQuota}`);
      console.log(`📝 [SQL执行] 插入的scheduleDate值: ${scheduleDate} (应等于planStartDate: ${planStartDate})`);
      console.log('========================================');
      
      console.log(`打包工序计划创建成功, ID: ${result.insertId}, 编号: ${data.planNo}`);
      
      // ✅ 修改：自动推送到备料计划
      // 触发时机：不管什么原因新增的喷塑工序计划行，都要检查推送条件
      // 推送条件：计划排程数量 > 0
      console.log(`\n🔍 [自动推送检查] 喷塑工序计划 -> 备料计划`);
      console.log(`   喷塑工序计划ID: ${result.insertId}`);
      console.log(`   喷塑工序计划编号: ${data.planNo}`);
      console.log(`   产品编号: ${data.productCode}`);
      console.log(`   产品名称: ${data.productName}`);
      console.log(`   计划排程数量 (scheduleQuantity): ${data.scheduleQuantity}`);
      console.log(`   推送条件：计划排程数量 > 0`);
      console.log(`   是否满足推送条件: ${data.scheduleQuantity && parseFloat(data.scheduleQuantity) > 0}`);
      
      // ✅ 检查推送条件：计划排程数量 > 0
      if (data.scheduleQuantity && parseFloat(data.scheduleQuantity) > 0) {
        try {
          console.log(`\n📤 触发自动推送到备料计划: 编号=${data.planNo}, 排程数量=${data.scheduleQuantity}`);
          
          // 获取刚创建的喷塑工序计划详情（含下划线字段）
          // ✅ 关键修复：查询时就格式化schedule_date为中国时区YYYY-MM-DD格式
          const [createdPlanRows] = await pool.execute(
            `SELECT 
              id, plan_no, schedule_date, DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date_formatted,
              sales_order_no, customer_order_no, master_plan_no, master_plan_product_code,
              master_plan_product_name, shipping_plan_no, product_code, product_name,
              product_image, process_manager, process_name, schedule_quantity,
              product_unit, level0_demand, completion_date, order_promise_delivery_date,
              plan_start_date, real_plan_start_date, plan_end_date, workshop_name,
              daily_available_hours, remaining_required_hours, schedule_count,
              standard_work_hours, standard_work_quota, cumulative_schedule_qty,
              unscheduled_qty, source_page_name, source_no, previous_schedule_no,
              customer_name, level0_product_name, level0_product_code,
              level0_production_qty, product_source, bom_no, submitted_by,
              submitted_at, replenishment_qty, required_work_hours,
              daily_total_hours, daily_scheduled_hours, scheduled_work_hours,
              next_schedule_date, created_at, updated_at
            FROM packing_process_plans WHERE id = ?`,
            [result.insertId]
          );
          
          console.log(`   查询到 ${createdPlanRows.length} 条喷塑工序计划记录`);
          
          if (createdPlanRows.length > 0) {
            // ✅ 使用格式化后的日期替换原始日期
            const planData = {
              ...createdPlanRows[0],
              schedule_date: createdPlanRows[0].schedule_date_formatted // 使用YYYY-MM-DD格式
            };
            const realProcessPlanToMaterialService = require('./realProcessPlanToMaterialService');
            
            // 加载工序间隔设置（从数据库）
            const processIntervalSettings = await this.loadProcessIntervalSettings();
            console.log(`   加载了 ${processIntervalSettings.length} 条工序间隔设置`);
            
            // 执行推送
            console.log(`   开始执行 pushToMaterialPreparation...`);
            console.log(`   喷塑工序计划数据:`, {
              id: planData.id,
              plan_no: planData.plan_no,
              product_code: planData.product_code,
              product_name: planData.product_name,
              schedule_quantity: planData.schedule_quantity,
              process_name: planData.process_name,
              schedule_date: planData.schedule_date // ✅ 已经是YYYY-MM-DD格式
            });
            
            const pushResult = await realProcessPlanToMaterialService.pushToMaterialPreparation(
              planData, // ✅ 使用格式化后的数据
              processIntervalSettings
            );
            
            console.log(`\n✅ 自动推送到备料计划成功:`, JSON.stringify(pushResult, null, 2));
            // ✅ 注：备料计划推送到喷塑工序计划的触发已移动到 realProcessPlanToMaterialService.pushToMaterialPreparation 的commit后
          } else {
            console.warn(`   ⚠️ 未查询到刚创建的喷塑工序计划记录`);
          }
        } catch (error) {
          console.error(`\n❌ 自动推送到备料计划失败:`);
          console.error(`   错误信息: ${error.message}`);
          console.error(`   错误堆栈:`, error.stack);
          console.error(`   完整错误对象:`, error);
          // 不阻塞主流程,继续返回结果
        }
      } else {
        console.log(`   ⚠️ 不满足推送条件，跳过推送到备料计划`);
      }
      
      // ✅ 自动推送已排程工时到工序能力负荷表
      if (data.scheduledWorkHours && data.scheduledWorkHours > 0 && data.processName && data.scheduleDate) {
        try {
          const processName = data.processName;
          
          // ✅ 修复：使用数值化日期匹配（避免字符串格式不一致问题）
          const scheduleDateObj = data.scheduleDate instanceof Date ? 
            data.scheduleDate : new Date(data.scheduleDate);
          
          // ✅ 转换为数值 (YYYYMMDD)
          const scheduleDateNum = scheduleDateObj.getFullYear() * 10000 + 
                                 (scheduleDateObj.getMonth() + 1) * 100 + 
                                 scheduleDateObj.getDate();
          
          const scheduledHours = parseFloat(data.scheduledWorkHours);
          
          console.log(`🔄 推送已排程工时到工序能力负荷表: 工序=${processName}, 日期数值=${scheduleDateNum}, 排程工时=${scheduledHours}`);
          console.log(`   原始日期值: ${data.scheduleDate}, 类型: ${typeof data.scheduleDate}`);
          console.log(`   日期对象: ${scheduleDateObj.toISOString().split('T')[0]}, 数值: ${scheduleDateNum}`);
          
          // ✅ 查询工序能力负荷表记录（使用数值化日期匹配）
          // 将工序能力负荷表的date也转换为数值进行比较
          const [capacityRows] = await pool.execute(
            `SELECT id, work_shift, available_workstations, occupied_hours, date,
                    (YEAR(date) * 10000 + MONTH(date) * 100 + DAY(date)) as date_num
             FROM process_capacity_load 
             WHERE process_name = ? 
               AND (YEAR(date) * 10000 + MONTH(date) * 100 + DAY(date)) = ?`,
            [processName, scheduleDateNum]
          );
          
          if (capacityRows.length > 0) {
            const record = capacityRows[0];
            const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
            const newOccupiedHours = parseFloat((previousOccupiedHours + scheduledHours).toFixed(2));
            const workShift = parseFloat(record.work_shift || 0);
            const availableWorkstations = parseFloat(record.available_workstations || 0);
            
            // 重新计算剩余工时和剩余时段
            const newRemainingHours = parseFloat(
              (workShift * availableWorkstations - newOccupiedHours).toFixed(2)
            );
            
            let newRemainingShift = 0;
            if (availableWorkstations > 0) {
              newRemainingShift = parseFloat(
                (newRemainingHours / availableWorkstations).toFixed(2)
              );
            }
            
            // 更新数据库
            await pool.execute(
              `UPDATE process_capacity_load 
               SET occupied_hours = ?, 
                   remaining_hours = ?, 
                   remaining_shift = ?,
                   updated_at = NOW()
               WHERE id = ?`,
              [newOccupiedHours, newRemainingHours, newRemainingShift, record.id]
            );
            
            console.log(`✅ 已占用工时更新成功: ${previousOccupiedHours} → ${newOccupiedHours} (增加${scheduledHours}小时)`);
            console.log(`   目标记录: date=${record.date}, date_num=${record.date_num}`);
            console.log(`   剩余工时: ${newRemainingHours}, 剩余时段: ${newRemainingShift}`);
          } else {
            console.warn(`⚠️ 未找到工序能力负荷记录: 工序=${processName}, 日期数值=${scheduleDateNum}`);
          }
        } catch (error) {
          console.error(`⚠️ 推送已占用工时失败:`, error.message);
          // 不阻塞主流程,继续返回结果
        }
      }
      
      return { id: result.insertId };
    } catch (error) {
      console.error('创建喷塑工序计划失败:', error);
      throw error;
    }
  }

  /**
   * 加载工序间隔设置（从数据库）
   * 返回格式: [{ previousProcess: '上道工序', nextProcess: '下道工序', intervalValue: 数值, intervalUnit: '单位' }]
   */
  static async loadProcessIntervalSettings() {
    try {
      const [rows] = await pool.execute(
        'SELECT previous_process, next_process, interval_value, interval_unit FROM process_interval_settings'
      );
      
      // 转换字段名为驼峰格式
      const settings = rows.map(row => ({
        previousProcess: row.previous_process,
        nextProcess: row.next_process,
        intervalValue: parseFloat(row.interval_value || 0),
        intervalUnit: row.interval_unit || '小时'
      }));
      
      console.log(`✅ 从数据库加载了 ${settings.length} 条工序间隔设置`);
      return settings;
    } catch (error) {
      console.error('❌ 加载工序间隔设置失败:', error);
      return [];
    }
  }

  /**
   * 更新喷塑工序计划
   */
  static async update(id, data) {
    try {
      // ✅ 修复：确保 计划排程日期 = 计划开始日期
      let scheduleDate = data.scheduleDate || null;
      if (data.planStartDate) {
        scheduleDate = data.planStartDate;
        console.log(`✅ [更新-计划排程日期] 设置为计划开始日期: ${scheduleDate}`);
      }
      
      const sql = `
        UPDATE packing_process_plans SET
          schedule_date = ?, sales_order_no = ?, customer_order_no = ?, master_plan_no = ?, 
          master_plan_product_code = ?, master_plan_product_name = ?, shipping_plan_no = ?,
          product_code = ?, product_name = ?, product_image = ?, process_manager = ?,
          process_name = ?, schedule_quantity = ?, product_unit = ?,
          level0_demand = ?, completion_date = ?, order_promise_delivery_date = ?, 
          plan_start_date = ?, real_plan_start_date = ?, plan_end_date = ?,
          workshop_name = ?, daily_available_hours = ?,
          remaining_required_hours = ?, schedule_count = ?, standard_work_hours = ?,
          standard_work_quota = ?, cumulative_schedule_qty = ?, unscheduled_qty = ?,
          source_page_name = ?, source_no = ?, previous_schedule_no = ?, customer_name = ?,
          level0_product_name = ?, level0_product_code = ?, level0_production_qty = ?,
          product_source = ?, bom_no = ?, submitted_by = ?, submitted_at = ?, replenishment_qty = ?,
          required_work_hours = ?,
          daily_total_hours = ?, daily_scheduled_hours = ?, scheduled_work_hours = ?, next_schedule_date = ?
        WHERE id = ?
      `;
      
      const [result] = await pool.execute(sql, [
        scheduleDate,                                 // ✅ 修复：使用计算后的值（= planStartDate）
        data.salesOrderNo || null,
        data.customerOrderNo || null,                 // ✅ 新增
        data.masterPlanNo || null,
        data.mainPlanProductCode || null,             // ✅ 新增
        data.mainPlanProductName || null,             // ✅ 新增
        data.shippingPlanNo || null,
        data.productCode || null,
        data.productName || null,
        data.productImage || null,
        data.processManager || null,
        data.processName || null,
        data.scheduleQuantity || 0,
        data.productUnit || null,
        data.level0Demand || 0,
        data.completionDate || null,
        data.promiseDeliveryDate || null,             // ✅ 新增
        data.planStartDate || null,
        data.realPlanStartDate || null,
        data.planEndDate || null,
        data.workshopName || null,
        data.dailyAvailableHours || 0,
        data.remainingRequiredHours || 0,
        data.scheduleCount || 0,
        data.standardWorkHours || 0,
        data.standardWorkQuota || 0,
        data.cumulativeScheduleQty || 0,
        data.unscheduledQty || 0,
        data.sourcePageName || null,
        data.sourceNo || null,
        data.previousScheduleNo || null,
        data.customerName || null,
        data.level0ProductName || null,
        data.level0ProductCode || null,
        data.level0ProductionQty || 0,
        data.productSource || null,
        data.bomNo || null,
        data.submittedBy || null,
        data.submittedAt || null,
        data.replenishmentQty || 0,
        data.requiredWorkHours || 0,
        data.dailyTotalHours || 0,
        data.dailyScheduledHours || 0,
        data.scheduledWorkHours || 0,
        data.nextScheduleDate || null,
        id
      ]);
      
      if (result.affectedRows === 0) {
        throw new Error('打包工序计划不存在或未更新');
      }
      
      console.log(`打包工序计划更新成功, ID: ${id}`);
      return { id };
    } catch (error) {
      console.error('更新打包工序计划失败:', error);
      throw error;
    }
  }

  /**
   * 删除打包工序计划
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // ✅ 步颊1: 先查询打包工序计划详情(用于后续释放已占用工时)
      const [planRows] = await connection.execute(
        'SELECT plan_no, process_name, DATE_FORMAT(schedule_date, \'%Y-%m-%d\') as schedule_date FROM packing_process_plans WHERE id = ?',
        [id]
      );
      
      if (planRows.length === 0) {
        await connection.rollback();
        throw new Error('打包工序计划不存在');
      }
      
      const plan = planRows[0];
      console.log(`🗑️ 删除打包工序计划: ${plan.plan_no}`);
      
      // ✅ 步颊2: 执行删除
      const [result] = await connection.execute('DELETE FROM packing_process_plans WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        throw new Error('打包工序计划不存在');
      }
      
      console.log(`✅ 打包工序计划删除成功, ID: ${id}`);
      
      // ✅ 步颊3: 删除后自动重置已占用工时(调用SUMIF逻辑)
      if (plan.process_name && plan.schedule_date) {
        try {
          const processName = plan.process_name;
          
          // ✅ 使用数值化日期匹配
          const scheduleDateObj = typeof plan.schedule_date === 'string' ? 
            new Date(plan.schedule_date) : plan.schedule_date;
          
          const scheduleDateNum = scheduleDateObj.getFullYear() * 10000 + 
                                 (scheduleDateObj.getMonth() + 1) * 100 + 
                                 scheduleDateObj.getDate();
          
          console.log(`🔄 自动重置已占用工时: 工序=${processName}, 日期数值=${scheduleDateNum}`);
          console.log(`   原始日期值: ${plan.schedule_date}, 类型: ${typeof plan.schedule_date}`);
          
          // ✅ SUMIF - 重新统计该工序+日期下所有打包工序计划的计划排程工时总和
          const [sumRows] = await connection.execute(
            `SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_hours 
             FROM packing_process_plans 
             WHERE process_name = ? 
               AND (YEAR(schedule_date) * 10000 + MONTH(schedule_date) * 100 + DAY(schedule_date)) = ?`,
            [processName, scheduleDateNum]
          );
          
          // ✅ 补充规则: if(sumifs的结果返回null, 0, sumifs的结果)
          const sumResult = sumRows[0].total_hours;
          const validResult = sumResult !== null && sumResult !== undefined ? parseFloat(sumResult) : 0;
          const newOccupiedHours = parseFloat(validResult.toFixed(2));
          
          console.log(`  SUMIF查询结果: ${sumResult}, 新占用工时: ${newOccupiedHours}`);
          
          // ✅ 查询工序能力负荷记录（使用数值化匹配）
          const [capacityRows] = await connection.execute(
            `SELECT id, work_shift, available_workstations, occupied_hours, date,
                    (YEAR(date) * 10000 + MONTH(date) * 100 + DAY(date)) as date_num
             FROM process_capacity_load 
             WHERE process_name = ? 
               AND (YEAR(date) * 10000 + MONTH(date) * 100 + DAY(date)) = ?`,
            [processName, scheduleDateNum]
          );
          
          if (capacityRows.length > 0) {
            const record = capacityRows[0];
            const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
            const workShift = parseFloat(record.work_shift || 0);
            const availableWorkstations = parseFloat(record.available_workstations || 0);
            
            // ✅ 重新计算剩余工时和剩余时段
            const newRemainingHours = parseFloat(
              (workShift * availableWorkstations - newOccupiedHours).toFixed(2)
            );
            
            let newRemainingShift = null;
            if (availableWorkstations > 0) {
              newRemainingShift = parseFloat(
                (newRemainingHours / availableWorkstations).toFixed(2)
              );
            }
            
            // ✅ 更新数据库
            await connection.execute(
              `UPDATE process_capacity_load 
               SET occupied_hours = ?, 
                   remaining_hours = ?, 
                   remaining_shift = ?,
                   updated_at = NOW()
               WHERE id = ?`,
              [newOccupiedHours, newRemainingHours, newRemainingShift, record.id]
            );
            
            console.log(`✅ 已占用工时重置成功: ${previousOccupiedHours} → ${newOccupiedHours} (释放${(previousOccupiedHours - newOccupiedHours).toFixed(2)}小时)`);
            console.log(`   目标记录: date=${record.date}, date_num=${record.date_num}`);
          } else {
            console.warn(`⚠️ 未找到工序能力负荷记录: 工序=${processName}, 日期数值=${scheduleDateNum}`);
          }
        } catch (error) {
          console.error(`⚠️ 自动重置已占用工时失败:`, error.message);
          // 不阻塞删除流程,继续提交
        }
      }
      
      await connection.commit();
      console.log(`✅ 打包工序计划删除成功, ID: ${id}`);
      return { success: true };
    } catch (error) {
      await connection.rollback();
      console.error('删除打包工序计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 批量删除打包工序计划
   */
  static async batchDelete(ids) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      let successCount = 0;
      const affectedProcessDates = new Set(); // 记录受影响的工序+日期
      
      for (const id of ids) {
        // ✅ 步颊1: 先查询打包工序计划详情
        const [planRows] = await connection.execute(
          'SELECT plan_no, process_name, DATE_FORMAT(schedule_date, \'%Y-%m-%d\') as schedule_date FROM packing_process_plans WHERE id = ?',
          [id]
        );
        
        if (planRows.length > 0) {
          const plan = planRows[0];
          
          // ✅ 记录受影响的工序+日期
          if (plan.process_name && plan.schedule_date) {
            // ✅ 转换为数值
            const scheduleDateObj = typeof plan.schedule_date === 'string' ? 
              new Date(plan.schedule_date) : plan.schedule_date;
            
            const scheduleDateNum = scheduleDateObj.getFullYear() * 10000 + 
                                   (scheduleDateObj.getMonth() + 1) * 100 + 
                                   scheduleDateObj.getDate();
            
            affectedProcessDates.add(`${plan.process_name}|${scheduleDateNum}`);
          }
          
          // ✅ 步颊2: 执行删除
          const [result] = await connection.execute('DELETE FROM packing_process_plans WHERE id = ?', [id]);
          successCount += result.affectedRows;
        }
      }
      
      // ✅ 步颊3: 批量重置受影响的工序+日期的已占用工时
      console.log(`🔄 批量重置 ${affectedProcessDates.size} 个工序+日期的已占用工时`);
      
      for (const key of affectedProcessDates) {
        const [processName, scheduleDateNumStr] = key.split('|');
        const scheduleDateNum = parseInt(scheduleDateNumStr);
        
        try {
          // ✅ SUMIF - 重新统计该工序+日期下所有打包工序计划的计划排程工时总和
          const [sumRows] = await connection.execute(
            `SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_hours 
             FROM packing_process_plans 
             WHERE process_name = ? 
               AND (YEAR(schedule_date) * 10000 + MONTH(schedule_date) * 100 + DAY(schedule_date)) = ?`,
            [processName, scheduleDateNum]
          );
          
          const sumResult = sumRows[0].total_hours;
          const validResult = sumResult !== null && sumResult !== undefined ? parseFloat(sumResult) : 0;
          const newOccupiedHours = parseFloat(validResult.toFixed(2));
          
          // ✅ 查询工序能力负荷记录（使用数值化匹配）
          const [capacityRows] = await connection.execute(
            `SELECT id, work_shift, available_workstations, occupied_hours, date,
                    (YEAR(date) * 10000 + MONTH(date) * 100 + DAY(date)) as date_num
             FROM process_capacity_load 
             WHERE process_name = ? 
               AND (YEAR(date) * 10000 + MONTH(date) * 100 + DAY(date)) = ?`,
            [processName, scheduleDateNum]
          );
          
          if (capacityRows.length > 0) {
            const record = capacityRows[0];
            const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
            const workShift = parseFloat(record.work_shift || 0);
            const availableWorkstations = parseFloat(record.available_workstations || 0);
            
            // ✅ 重新计算剩余工时和剩余时段
            const newRemainingHours = parseFloat(
              (workShift * availableWorkstations - newOccupiedHours).toFixed(2)
            );
            
            let newRemainingShift = null;
            if (availableWorkstations > 0) {
              newRemainingShift = parseFloat(
                (newRemainingHours / availableWorkstations).toFixed(2)
              );
            }
            
            // ✅ 更新数据库
            await connection.execute(
              `UPDATE process_capacity_load 
               SET occupied_hours = ?, 
                   remaining_hours = ?, 
                   remaining_shift = ?,
                   updated_at = NOW()
               WHERE id = ?`,
              [newOccupiedHours, newRemainingHours, newRemainingShift, record.id]
            );
            
            console.log(`✅ [工序=${processName}, 日期数值=${scheduleDateNum}, date=${record.date}] ${previousOccupiedHours} → ${newOccupiedHours}`);
          }
        } catch (error) {
          console.error(`⚠️ [工序=${processName}, 日期数值=${scheduleDateNum}] 重置失败:`, error.message);
          // 继续处理其他记录
        }
      }
      
      await connection.commit();
      console.log(`批量删除打包工序计划完成: 成功${successCount}条/总共${ids.length}条`);
      return { successCount, totalCount: ids.length };
    } catch (error) {
      await connection.rollback();
      console.error('批量删除打包工序计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * ✅ 需求2: 计算当天已排程工时 (SUMIFS)
   * @param {string} processName - 工序名称
   * @param {string} scheduleDate - 计划排程日期 (YYYY-MM-DD)
   * @param {number} currentRowIndex - 当前行索引（从0开始）
   * @returns {number} 当天已排程工时
   */
  static async calculateDailyScheduledHours(processName, scheduleDate, currentRowIndex) {
    try {
      if (!processName || !scheduleDate) {
        return 0;
      }
      
      // SUMIFS: 求和条件1 - 工序名称匹配
      // SUMIFS: 求和条件2 - 计划排程日期匹配
      // SUMIFS: 求和条件3 - 序号 < 当前行序号（不包含当前行）
      // 注意：序号是显示顺序，需要按照schedule_date ASC, created_at ASC排序后计算
      
      const sql = `
        SELECT COALESCE(SUM(scheduled_work_hours), 0) as total
        FROM (
          SELECT 
            scheduled_work_hours,
            ROW_NUMBER() OVER (ORDER BY schedule_date ASC, created_at ASC) as row_num
          FROM packing_process_plans
          WHERE process_name = ?
            AND DATE_FORMAT(schedule_date, '%Y-%m-%d') = ?
        ) as ranked
        WHERE row_num < ?
      `;
      
      // currentRowIndex是从0开始，序号 = currentRowIndex + 1
      // 求和条件是序号 < 当前序号，即 row_num < (currentRowIndex + 1)
      const currentRowNumber = currentRowIndex + 1;
      const [rows] = await pool.execute(sql, [processName, scheduleDate, currentRowNumber]);
      const total = parseFloat(rows[0]?.total || 0);
      
      return parseFloat(total.toFixed(2));
    } catch (error) {
      console.error('计算当天已排程工时失败:', error);
      return 0;
    }
  }

  /**
   * ✅ 检查并创建自增行（递归排程）
   * @param {number} sourceRecordId - 来源记录ID
   * @param {number} maxDepth - 最大递归深度（防止无限循环）
   * @param {number} currentDepth - 当前递归深度
   */
  static async checkAndCreateIncremental(sourceRecordId, frontEndData = {}, maxDepth = 100, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
      console.log(`⚠️ 达到最大递归深度${maxDepth}，停止自增`);
      return;
    }

    const connection = await pool.getConnection();
    try {
      // 1. 查询来源记录
      const [records] = await connection.execute(`
        SELECT *, order_promise_delivery_date, next_schedule_date1 FROM packing_process_plans WHERE id = ?
      `, [sourceRecordId]);

      if (records.length === 0) {
        console.log(`⚠️ 来源记录不存在，ID: ${sourceRecordId}`);
        return;
      }

      const sourceRecord = records[0];
      
      // 2. 检查自增触发条件 - 使用前端传递的数据（如果有），否则使用数据库中的数据
      const unscheduledQty = parseFloat(frontEndData.unscheduledQty || sourceRecord.unscheduled_qty || 0);
      const scheduleDate = sourceRecord.schedule_date;
      const nextScheduleDate1 = frontEndData.nextScheduleDate1 || sourceRecord.next_schedule_date1;
      const scheduleCount = parseInt(sourceRecord.schedule_count || 0);
      const remainingRequiredHours = parseFloat(frontEndData.remainingRequiredHours || sourceRecord.remaining_required_hours || 0);
      const replenishmentQty = parseFloat(sourceRecord.replenishment_qty || 0);

      console.log(`\n📋 [自增检查 #${currentDepth + 1}] 来源记录 ID=${sourceRecordId}, 排程次数=${scheduleCount}`);
      console.log(`   未排数量: ${unscheduledQty} (前端传递: ${frontEndData.unscheduledQty}, 数据库: ${sourceRecord.unscheduled_qty})`);
      console.log(`   计划排程日期: ${scheduleDate}`);
      console.log(`   下一个排程日期1: ${nextScheduleDate1} (前端传递: ${frontEndData.nextScheduleDate1}, 数据库: ${sourceRecord.next_schedule_date1})`);
      console.log(`   剩余需求工时: ${remainingRequiredHours} (前端传递: ${frontEndData.remainingRequiredHours}, 数据库: ${sourceRecord.remaining_required_hours})`);
      console.log(`   前端传递的完整数据:`, frontEndData);

      // 自增触发条件：未排数量>0 且 下一个排程日期1不为空 且 剩余需求工时不为空
      if (!(unscheduledQty > 0 && nextScheduleDate1 && remainingRequiredHours !== null)) {
        console.log(`✅ 不满足自增条件，停止递归`);
        return;
      }

      console.log(`🔁 满足自增条件，开始创建自增行...`);

      // 3. 生成新的排程次数和编号
      const newScheduleCount = scheduleCount + 1;
      const planNoPrefix = sourceRecord.plan_no.split('-')[0];
      const newPlanNo = `${planNoPrefix}-${newScheduleCount}`;

      console.log(`   新排程次数: ${newScheduleCount}`);
      console.log(`   新计划编号: ${newPlanNo}`);

      // 4. 计算自增行的计划排程日期 = 来源行的下一个排程日期1
      const newScheduleDate = nextScheduleDate1;
      console.log(`   新计划排程日期: ${newScheduleDate}`);

      // 5. 查询工序能力负荷表 - 获取当天总工时
      let dailyTotalHours = 0;
      const processName = sourceRecord.process_name;
      
      if (processName && newScheduleDate) {
        const [capacityRows] = await connection.execute(`
          SELECT work_shift, available_workstations
          FROM process_capacity_load
          WHERE process_name = ? AND date = ?
          LIMIT 1
        `, [processName, newScheduleDate]);
        
        if (capacityRows.length > 0) {
          const workShift = parseFloat(capacityRows[0].work_shift || 0);
          const availableWorkstations = parseFloat(capacityRows[0].available_workstations || 0);
          dailyTotalHours = parseFloat((workShift * availableWorkstations).toFixed(2));
          console.log(`   当天总工时: ${dailyTotalHours}`);
        }
      }

      // 6. 计算当天已排程工时 (SUMIFS - 不包含即将创建的这一行)
      const [sumRows] = await connection.execute(`
        SELECT COALESCE(SUM(scheduled_work_hours), 0) as total
        FROM packing_process_plans
        WHERE process_name = ? AND schedule_date = ?
      `, [processName, newScheduleDate]);
      
      const dailyScheduledHours = parseFloat(sumRows[0].total || 0);
      console.log(`   当天已排程工时: ${dailyScheduledHours}`);

      // 7. 当天可用工时 = 总工时 - 已排程工时
      const dailyAvailableHours = parseFloat((dailyTotalHours - dailyScheduledHours).toFixed(2));
      console.log(`   当天可用工时: ${dailyAvailableHours}`);

      // 8. 需求工时 = 来源行的剩余需求工时
      const newRequiredWorkHours = remainingRequiredHours;
      console.log(`   新需求工时: ${newRequiredWorkHours}`);

      // 9. 计划排程工时 = MIN(需求工时, 当天可用工时)
      let scheduledWorkHours = 0;
      if (newRequiredWorkHours > 0 && dailyAvailableHours > 0) {
        scheduledWorkHours = parseFloat(Math.min(newRequiredWorkHours, dailyAvailableHours).toFixed(2));
      }
      console.log(`   计划排程工时: ${scheduledWorkHours}`);

      // 10. 计划排程数量 = ceiling(排程工时 × 标准工时定额, 1)
      const standardWorkQuota = parseFloat(sourceRecord.standard_work_quota || 0);
      let scheduleQuantity = 0;
      if (scheduledWorkHours > 0 && standardWorkQuota > 0) {
        scheduleQuantity = Math.ceil(scheduledWorkHours * standardWorkQuota);
      }
      console.log(`   计划排程数量: ${scheduleQuantity}`);

      // 11. 下一个排程日期 = 计划排程日期 + 1天
      let newNextScheduleDate = null;
      if (newScheduleDate) {
        const nextDate = new Date(newScheduleDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const year = nextDate.getFullYear();
        const month = String(nextDate.getMonth() + 1).padStart(2, '0');
        const day = String(nextDate.getDate()).padStart(2, '0');
        newNextScheduleDate = `${year}-${month}-${day}`;
        console.log(`   下一个排程日期: ${newNextScheduleDate}`);
      }

      // 12. 剩余需求工时 = 需求工时 - 计划排程工时
      let newRemainingRequiredHours = 0;
      if (newRequiredWorkHours > 0 && scheduledWorkHours > 0) {
        newRemainingRequiredHours = parseFloat((newRequiredWorkHours - scheduledWorkHours).toFixed(2));
      } else if (newRequiredWorkHours > 0) {
        newRemainingRequiredHours = newRequiredWorkHours;
      }
      console.log(`   剩余需求工时: ${newRemainingRequiredHours}`);

      // 13. 累积排程数量 = SUMIFS(来源编号=本行来源编号) - 需要在INSERT后重新计算
      // 先用当前的计划排程数量作为初始值
      let cumulativeScheduleQty = scheduleQuantity;

      // 14. 未排数量 = 需补货数量 - 累积排程数量
      const newReplenishmentQty = parseFloat(sourceRecord.replenishment_qty || 0);
      let newUnscheduledQty = 0;
      if (newReplenishmentQty > 0 && cumulativeScheduleQty >= 0) {
        newUnscheduledQty = parseFloat((newReplenishmentQty - cumulativeScheduleQty).toFixed(2));
      } else if (newReplenishmentQty > 0) {
        newUnscheduledQty = newReplenishmentQty;
      }

      // 15. 构建自增行数据对象
      const incrementalData = {
        planNo: newPlanNo,
        scheduleDate: newScheduleDate,
        salesOrderNo: sourceRecord.sales_order_no,
        customerOrderNo: sourceRecord.customer_order_no,  // ✅ 新增：客户订单编号
        masterPlanNo: sourceRecord.master_plan_no,
        mainPlanProductCode: sourceRecord.master_plan_product_code,  // ✅ 新增：主计划产品编号
        mainPlanProductName: sourceRecord.master_plan_product_name,  // ✅ 新增：主计划产品名称
        shippingPlanNo: sourceRecord.shipping_plan_no,
        productCode: sourceRecord.product_code,
        productName: sourceRecord.product_name,
        productImage: sourceRecord.product_image,
        processManager: sourceRecord.process_manager,
        processName: sourceRecord.process_name,
        scheduleQuantity: scheduleQuantity,
        productUnit: sourceRecord.product_unit,
        level0Demand: sourceRecord.level0_demand,
        completionDate: sourceRecord.completion_date,
        promiseDeliveryDate: sourceRecord.order_promise_delivery_date,  // ✅ 新增：订单承诺交期
        planStartDate: null,  // ✅ 自增行必须清空计划开始日期
        realPlanStartDate: null,  // ✅ 自增行也清空真计划开始日期
        planEndDate: sourceRecord.plan_end_date,
        workshopName: sourceRecord.workshop_name,
        dailyAvailableHours: dailyAvailableHours,
        remainingRequiredHours: newRemainingRequiredHours,
        scheduleCount: newScheduleCount,
        standardWorkHours: sourceRecord.standard_work_hours,
        standardWorkQuota: standardWorkQuota,
        cumulativeScheduleQty: cumulativeScheduleQty,
        unscheduledQty: newUnscheduledQty,
        sourcePageName: sourceRecord.source_page_name,
        sourceNo: sourceRecord.source_no,  // ✅ 继承来源编号
        previousScheduleNo: sourceRecord.plan_no,  // ✅ 上一个排程编号 = 来源行编号
        customerName: sourceRecord.customer_name,
        level0ProductName: sourceRecord.level0_product_name,
        level0ProductCode: sourceRecord.level0_product_code,
        level0ProductionQty: sourceRecord.level0_production_qty,
        productSource: sourceRecord.product_source,
        bomNo: sourceRecord.bom_no,
        submittedBy: sourceRecord.submitted_by,
        submittedAt: sourceRecord.submitted_at,
        replenishmentQty: newReplenishmentQty,  // ✅ 继承需补货数量
        requiredWorkHours: newRequiredWorkHours,  // ✅ 新需求工时 = 来源行剩余需求工时
        dailyTotalHours: dailyTotalHours,
        dailyScheduledHours: dailyScheduledHours,
        scheduledWorkHours: scheduledWorkHours,
        nextScheduleDate: newNextScheduleDate
      };

      // 16. 创建自增行
      console.log(`   📝 开始插入自增行到数据库...`);
      const createResult = await PackingProcessPlanService.create(incrementalData);
      const newRecordId = createResult.id;
      console.log(`   ✅ 自增行创建成功, ID: ${newRecordId}`);

      // 17. 批量重新计算所有同源记录的累积排程数量和未排数量
      if (sourceRecord.source_no) {
        console.log(`\n🧮 批量重新计算所有同源记录...`);
        
        // 17.1 计算累积排程数量 (SUMIFS - 包含刚创建的这一行)
        const [cumulativeRows] = await connection.execute(`
          SELECT COALESCE(SUM(schedule_quantity), 0) as total
          FROM packing_process_plans
          WHERE source_no = ?
        `, [sourceRecord.source_no]);
        
        cumulativeScheduleQty = parseFloat(cumulativeRows[0].total || 0);
        console.log(`   📊 累积排程数量 = ${cumulativeScheduleQty} (来源编号=${sourceRecord.source_no})`);

        // 17.2 重新计算未排数量
        let newUnscheduledQty = 0;
        if (newReplenishmentQty > 0 && cumulativeScheduleQty >= 0) {
          newUnscheduledQty = parseFloat((newReplenishmentQty - cumulativeScheduleQty).toFixed(2));
        } else if (newReplenishmentQty > 0) {
          newUnscheduledQty = newReplenishmentQty;
        }
        console.log(`   📊 未排数量 = ${newReplenishmentQty} - ${cumulativeScheduleQty} = ${newUnscheduledQty}`);

        // 17.3 批量更新所有同源记录的累积排程数量和未排数量
        console.log(`   📝 批量更新所有来源编号=${sourceRecord.source_no}的记录...`);
        await connection.execute(`
          UPDATE packing_process_plans 
          SET cumulative_schedule_qty = ?, unscheduled_qty = ?
          WHERE source_no = ?
        `, [cumulativeScheduleQty, newUnscheduledQty, sourceRecord.source_no]);
        console.log(`   ✅ 批量更新累积排程数量和未排数量完成`);
        
        // 17.4 逐行更新剩余需求工时（每行的剩余需求工时不同）
        console.log(`   📝 逐行更新剩余需求工时...`);
        const [allRecords] = await connection.execute(
          `SELECT id, required_work_hours, scheduled_work_hours FROM packing_process_plans WHERE source_no = ?`,
          [sourceRecord.source_no]
        );
        
        for (const record of allRecords) {
          const recordRequiredHours = parseFloat(record.required_work_hours || 0);
          const recordScheduledHours = parseFloat(record.scheduled_work_hours || 0);
          const recordRemainingHours = parseFloat((recordRequiredHours - recordScheduledHours).toFixed(2));
          
          await connection.execute(
            `UPDATE packing_process_plans SET remaining_required_hours = ? WHERE id = ?`,
            [recordRemainingHours, record.id]
          );
        }
        console.log(`   ✅ 逐行更新剩余需求工时完成，共更新${allRecords.length}条记录`);
      }

      console.log(`\n✅ 自增行 #${newScheduleCount} 创建完成`);
      console.log(`   未排数量: ${newUnscheduledQty}`);

      // 20. 递归检查：如果未排数量 > 0，继续创建下一个自增行
      if (newUnscheduledQty > 0 && newNextScheduleDate) {
        console.log(`\n🔁 未排数量=${newUnscheduledQty} > 0，继续递归创建下一个自增行...`);
        connection.release();  // 先释放当前连接
        await PackingProcessPlanService.checkAndCreateIncremental(newRecordId, frontEndData, maxDepth, currentDepth + 1);
      } else {
        console.log(`\n🎉 排程完毕！未排数量=${newUnscheduledQty}，停止递归`);
        connection.release();
      }
      
    } catch (error) {
      console.error('❌ 创建自增行失败:', error);
      connection.release();
      throw error;
    }
  }

  /**
   * ✅ 查询当天已排程工时
   * SUMIFS(计划排程工时, 工序名称=当前工序, 计划排程日期=当前日期, ID<>当前ID)
   * 
   * @param {Object} params
   * @param {string} params.processName - 工序名称
   * @param {string} params.scheduleDate - 计划排程日期 (YYYY-MM-DD)
   * @param {number} params.excludeId - 要排除的ID（编辑时排除自己）
   * @returns {Promise<{scheduledHours: number}>}
   */
  static async queryDailyScheduledHours(params) {
    try {
      const { processName, scheduleDate, excludeId } = params;
      
      console.log(`🔍 [查询当天已排程工时] 工序=${processName}, 日期=${scheduleDate}, 排除ID=${excludeId}`);
      
      let sql = `
        SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_scheduled_hours
        FROM packing_process_plans
        WHERE process_name = ?
          AND DATE_FORMAT(schedule_date, '%Y-%m-%d') = ?
      `;
      
      const queryParams = [processName, scheduleDate];
      
      // 如果有excludeId，排除该记录（编辑时排除自己）
      if (excludeId) {
        sql += ` AND id != ?`;
        queryParams.push(excludeId);
      }
      
      const [rows] = await pool.execute(sql, queryParams);
      
      const scheduledHours = parseFloat(rows[0].total_scheduled_hours || 0);
      
      console.log(`✅ [查询当天已排程工时] 结果: ${scheduledHours} 小时`);
      
      return { scheduledHours };
    } catch (error) {
      console.error('❌ [查询当天已排程工时] 失败:', error);
      throw error;
    }
  }

  /**
   * ✅ 修复字段计算
   * 重新计算所有记录的自动字段：
   * 1. 计划排程日期 = 计划开始日期
   * 2. 工序当天可用工时 = 当天总工时 - 当天已排程工时
   * 
   * @returns {Promise<{updatedCount: number}>}
   */
  static async fixFieldCalculations() {
    try {
      console.log('🔧 [修复字段计算] 开始修复所有打包工序计划的字段计算...');
      
      // 1. 修复计划排程日期 = 计划开始日期
      const [updateResult1] = await pool.execute(`
        UPDATE packing_process_plans
        SET schedule_date = plan_start_date
        WHERE plan_start_date IS NOT NULL
      `);
      
      console.log(`✅ [修复字段计算] 计划排程日期已更新: ${updateResult1.affectedRows} 条记录`);
      
      // 2. 查询所有记录
      const [allRecords] = await pool.execute(`
        SELECT id, process_name, schedule_date, daily_total_hours
        FROM packing_process_plans
        WHERE schedule_date IS NOT NULL
      `);
      
      console.log(`✅ [修复字段计算] 需要更新工序当天可用工时的记录: ${allRecords.length} 条`);
      
      let updatedCount = 0;
      
      // 3. 逐条计算并更新工序当天可用工时
      for (const record of allRecords) {
        try {
          // 查询当天已排程工时
          const { scheduledHours } = await this.queryDailyScheduledHours({
            processName: record.process_name,
            scheduleDate: formatLocalDate(record.schedule_date),
            excludeId: record.id
          });
          
          // 计算工序当天可用工时
          const dailyTotal = parseFloat(record.daily_total_hours || 0);
          const dailyAvailable = Math.max(0, dailyTotal - scheduledHours);
          
          // 更新数据库
          await pool.execute(`
            UPDATE packing_process_plans
            SET daily_scheduled_hours = ?,
                daily_available_hours = ?
            WHERE id = ?
          `, [scheduledHours, dailyAvailable, record.id]);
          
          updatedCount++;
        } catch (error) {
          console.error(`⚠️ [修复字段计算] 更新记录ID=${record.id}失败:`, error.message);
        }
      }
      
      console.log(`✅ [修复字段计算] 完成！共更新 ${updatedCount} 条记录`);
      
      return { updatedCount };
    } catch (error) {
      console.error('❌ [修复字段计算] 失败:', error);
      throw error;
    }
  }
}

module.exports = PackingProcessPlanService;