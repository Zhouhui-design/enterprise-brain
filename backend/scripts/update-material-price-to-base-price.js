const Database = require('better-sqlite3');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/enterprise_brain.db');
const db = new Database(dbPath);

console.log('开始更新BOM子件的材料单价...\n');

try {
  // 1. 获取所有物料的采购单价、采购转化率和基础单价
  console.log('1. 加载物料库数据...');
  const materials = db
    .prepare(
      `
    SELECT 
      material_code,
      material_name,
      purchase_price,
      purchase_conversion_rate,
      base_price
    FROM materials
  `,
    )
    .all();

  console.log(`   找到 ${materials.length} 条物料记录\n`);

  // 创建物料映射表（物料编码 -> 基础单价）
  const materialMap = {};
  for (const material of materials) {
    materialMap[material.material_code] = {
      materialName: material.material_name,
      purchasePrice: material.purchase_price || 0,
      purchaseConversionRate: material.purchase_conversion_rate || 1,
      basePrice: material.base_price || 0,
    };
  }

  // 2. 获取所有BOM子件
  console.log('2. 加载BOM子件数据...');
  const bomComponents = db
    .prepare(
      `
    SELECT 
      id,
      bom_id,
      component_code,
      component_name,
      material_price
    FROM bom_components
    ORDER BY bom_id, sequence
  `,
    )
    .all();

  console.log(`   找到 ${bomComponents.length} 条BOM子件记录\n`);

  // 3. 统计需要更新的数据
  let needUpdateCount = 0;
  let noMaterialCount = 0;
  let alreadyCorrectCount = 0;
  const updateList = [];

  console.log('3. 分析需要更新的数据...');
  for (const component of bomComponents) {
    const materialInfo = materialMap[component.component_code];

    if (!materialInfo) {
      // 物料库中找不到对应物料
      noMaterialCount++;
      continue;
    }

    const currentPrice = component.material_price || 0;
    const correctPrice = materialInfo.basePrice;

    // 检查当前价格是否等于采购单价（需要更新）
    const isPurchasePrice = Math.abs(currentPrice - materialInfo.purchasePrice) < 0.01;
    const isBasePrice = Math.abs(currentPrice - correctPrice) < 0.01;

    if (isPurchasePrice && !isBasePrice) {
      // 当前是采购单价，需要更新为基础单价
      needUpdateCount++;
      updateList.push({
        id: component.id,
        bomId: component.bom_id,
        componentCode: component.component_code,
        componentName: component.component_name,
        oldPrice: currentPrice,
        newPrice: correctPrice,
        purchasePrice: materialInfo.purchasePrice,
        basePrice: materialInfo.basePrice,
      });
    } else if (isBasePrice) {
      // 已经是基础单价，不需要更新
      alreadyCorrectCount++;
    }
  }

  console.log('\n📊 统计结果：');
  console.log(`   总子件数：${bomComponents.length}`);
  console.log(`   需要更新：${needUpdateCount} 条（采购单价 → 基础单价）`);
  console.log(`   已经正确：${alreadyCorrectCount} 条（已是基础单价）`);
  console.log(`   无物料数据：${noMaterialCount} 条（物料库中找不到）\n`);

  if (needUpdateCount === 0) {
    console.log('✅ 所有数据已经正确，无需更新！\n');
    db.close();
    return;
  }

  // 4. 显示需要更新的数据（前10条）
  console.log('4. 需要更新的数据示例（前10条）：');
  console.table(
    updateList.slice(0, 10).map(item => ({
      'BOM ID': item.bomId,
      子件编码: item.componentCode,
      子件名称: item.componentName,
      '当前价格(采购单价)': item.oldPrice.toFixed(2),
      '新价格(基础单价)': item.newPrice.toFixed(2),
      差异: (item.newPrice - item.oldPrice).toFixed(2),
    })),
  );

  // 5. 执行更新
  console.log('\n5. 开始更新数据...');

  // 开始事务
  db.exec('BEGIN TRANSACTION');

  const updateStmt = db.prepare(`
    UPDATE bom_components 
    SET material_price = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  let successCount = 0;
  let errorCount = 0;

  for (const item of updateList) {
    try {
      updateStmt.run(item.newPrice, item.id);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`   ❌ 更新失败 [ID: ${item.id}]:`, error.message);
    }
  }

  // 提交事务
  db.exec('COMMIT');

  console.log(`\n✅ 更新完成！`);
  console.log(`   成功：${successCount} 条`);
  console.log(`   失败：${errorCount} 条\n`);

  // 6. 验证更新结果
  console.log('6. 验证更新结果（前5条）：');
  const verifyData = [];
  for (const item of updateList.slice(0, 5)) {
    const updated = db.prepare('SELECT material_price FROM bom_components WHERE id = ?').get(item.id);
    verifyData.push({
      子件编码: item.componentCode,
      更新前: item.oldPrice.toFixed(2),
      更新后: updated.material_price.toFixed(2),
      目标值: item.newPrice.toFixed(2),
      状态: Math.abs(updated.material_price - item.newPrice) < 0.01 ? '✅' : '❌',
    });
  }
  console.table(verifyData);

  console.log('\n🎉 材料单价更新完成！');
  console.log('   所有BOM子件的材料单价已从采购单价更新为基础单价。\n');
} catch (error) {
  console.error('❌ 操作失败:', error);
  db.exec('ROLLBACK');
  process.exit(1);
} finally {
  db.close();
}
