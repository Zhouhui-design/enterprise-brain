const mysql = require('mysql2/promise');

async function countPlaceholders() {
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, ?, ?, ?, ?)
    `;
    
  // 提取VALUES部分
  const valuesMatch = sql.match(/VALUES \((.*?)\)/s);
  const valuesStr = valuesMatch ? valuesMatch[1] : '';
  
  console.log('VALUES字符串:');
  console.log(valuesStr);
  
  // 计算占位符
  const items = valuesStr.split(',').map(item => item.trim());
  const placeholders = items.filter(item => item === '?').length;
  const nowCount = items.filter(item => item === 'NOW()').length;
  
  console.log('\n项目列表:');
  items.forEach((item, index) => {
    console.log(`${index + 1}: ${item}`);
  });
  
  console.log(`\n占位符数量: ${placeholders}`);
  console.log(`NOW()数量: ${nowCount}`);
  console.log(`总位置数量: ${placeholders + nowCount}`);
  console.log(`期望位置数量: 40`);
}

countPlaceholders();