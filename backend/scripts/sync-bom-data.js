/**
 * 生产BOM数据同步脚本
 * 用于将现有生产BOM数据同步到专用数据库，并修复列表式生产BOM数据
 */

const BomSyncService = require('../services/bomSyncService');
const { pool: mainPool } = require('../config/database');

async function syncAllBomData() {
  try {
    console.log('🔄 开始执行生产BOM数据同步脚本...');
    
    // 1. 检查主数据库中的生产BOM数据
    console.log('📊 检查主数据库中的生产BOM数据...');
    const [productionBoms] = await mainPool.execute('SELECT * FROM production_boms');
    console.log(`   主数据库中共有 ${productionBoms.length} 个生产BOM`);
    
    if (productionBoms.length === 0) {
      console.log('⚠️ 主数据库中没有生产BOM数据，跳过同步');
      return;
    }
    
    // 2. 同步所有生产BOM到专用数据库
    console.log('🔄 同步所有生产BOM到专用数据库...');
    const syncResult = await BomSyncService.syncAllProductionBoms();
    console.log(`   同步结果: ${syncResult.success ? '成功' : '失败'}`);
    if (syncResult.success) {
      console.log(`   共同步 ${syncResult.count} 个生产BOM`);
    }
    
    // 3. 检查列表式生产BOM数据
    console.log('📊 检查列表式生产BOM数据...');
    const [listStyleBoms] = await mainPool.execute('SELECT * FROM list_style_production_boms');
    console.log(`   列表式生产BOM表中共有 ${listStyleBoms.length} 条记录`);
    
    if (listStyleBoms.length === 0) {
      console.log('⚠️ 列表式生产BOM表中没有数据，尝试从生产BOM生成...');
      
      // 从生产BOM生成列表式BOM
      for (const bom of productionBoms) {
        console.log(`   从生产BOM ${bom.id} (${bom.product_code}) 生成列表式BOM...`);
        try {
          await BomSyncService.pushToStyleProductionBom(bom.id);
          console.log(`     ✅ 生成成功`);
        } catch (error) {
          console.log(`     ❌ 生成失败: ${error.message}`);
        }
      }
    }
    
    // 4. 检查产品手册数据
    console.log('📊 检查产品手册数据...');
    const [productManuals] = await mainPool.execute('SELECT * FROM product_manual');
    console.log(`   产品手册表中共有 ${productManuals.length} 条记录`);
    
    // 5. 总结
    console.log('\n✅ 生产BOM数据同步脚本执行完成');
    console.log('📋 执行结果:');
    console.log(`   - 主数据库生产BOM数: ${productionBoms.length}`);
    console.log(`   - 同步到专用数据库: ${syncResult.success ? syncResult.count : 0} 个`);
    
    const [updatedListStyleBoms] = await mainPool.execute('SELECT * FROM list_style_production_boms');
    console.log(`   - 列表式生产BOM数: ${updatedListStyleBoms.length}`);
    
    const [updatedProductManuals] = await mainPool.execute('SELECT * FROM product_manual');
    console.log(`   - 产品手册数: ${updatedProductManuals.length}`);
    
  } catch (error) {
    console.error('❌ 执行生产BOM数据同步脚本失败:', error);
    process.exit(1);
  }
}

// 执行脚本
syncAllBomData();
