/**
 * BOM数据同步服务
 * 用于生产BOM数据的推送和同步
 */

const { pool: mainPool } = require('../config/database');
const { pool: bomPool } = require('../config/productionBomDatabase');

class BomSyncService {
  /**
   * 从主数据库同步所有生产BOM到专用数据库
   */
  static async syncAllProductionBoms() {
    try {
      console.log('🔄 开始同步所有生产BOM到专用数据库...');
      
      // 获取主数据库中的所有生产BOM
      const [allBoms] = await mainPool.execute('SELECT * FROM production_boms');
      
      console.log(`📦 找到 ${allBoms.length} 个生产BOM需要同步`);
      
      for (const bom of allBoms) {
        await this.syncSingleBOM(bom.id);
      }
      
      console.log('✅ 所有生产BOM同步完成');
      return { success: true, count: allBoms.length };
    } catch (error) {
      console.error('❌ 同步所有生产BOM失败:', error);
      throw error;
    }
  }

  /**
   * 同步单个生产BOM到专用数据库
   */
  static async syncSingleBOM(bomId) {
    try {
      // 获取主数据库中的BOM数据
      const [bomRows] = await mainPool.execute('SELECT * FROM production_boms WHERE id = ?', [bomId]);
      if (bomRows.length === 0) {
        console.warn(`⚠️ BOM ID ${bomId} 不存在于主数据库`);
        return { success: false, message: 'BOM不存在' };
      }
      
      const bom = bomRows[0];
      
      // 获取BOM子件
      const [components] = await mainPool.execute('SELECT * FROM bom_components WHERE bom_id = ?', [bomId]);
      
      // 使用事务确保数据一致性
      const bomConnection = await bomPool.getConnection();
      await bomConnection.beginTransaction();
      
      try {
        // 检查专用数据库中是否已存在该BOM
        const [existingBom] = await bomConnection.execute(
          'SELECT id FROM production_boms WHERE bom_code = ?',
          [bom.bom_code]
        );
        
        let bomIdInNewDb;
        
        if (existingBom.length > 0) {
          // 更新现有BOM
          await bomConnection.execute(
            `UPDATE production_boms SET 
              bom_name = ?, product_code = ?, product_name = ?, version = ?, 
              status = ?, designer = ?, material_count = ?, remark = ?, 
              auditor = ?, effective_date = ?, total_labor = ?, total_material = ?, 
              product_image = ?, is_pushed_to_manual = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE bom_code = ?`,
            [
              bom.bom_name, bom.product_code, bom.product_name, bom.version,
              bom.status, bom.designer, bom.material_count, bom.remark,
              bom.auditor, bom.effective_date, bom.total_labor, bom.total_material,
              bom.product_image, bom.is_pushed_to_manual, bom.bom_code
            ]
          );
          bomIdInNewDb = existingBom[0].id;
          
          // 删除旧的子件
          await bomConnection.execute('DELETE FROM bom_components WHERE bom_id = ?', [bomIdInNewDb]);
        } else {
          // 插入新BOM
          const [result] = await bomConnection.execute(
            `INSERT INTO production_boms (
              bom_code, bom_name, product_code, product_name, version, 
              status, designer, material_count, remark, auditor, effective_date, 
              total_labor, total_material, product_image, is_pushed_to_manual
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              bom.bom_code, bom.bom_name, bom.product_code, bom.product_name, bom.version,
              bom.status, bom.designer, bom.material_count, bom.remark, bom.auditor, bom.effective_date,
              bom.total_labor, bom.total_material, bom.product_image, bom.is_pushed_to_manual
            ]
          );
          bomIdInNewDb = result.insertId;
        }
        
        // 插入或更新子件
        for (const component of components) {
          await bomConnection.execute(
            `INSERT INTO bom_components (
              bom_id, sequence, level, component_code, component_name, 
              quantity, output_process, component_source, process_wage, 
              material_loss, material_price, material_cost
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              bomIdInNewDb, component.sequence, component.level, component.component_code, 
              component.component_name, component.quantity, component.output_process, 
              component.component_source, component.process_wage, component.material_loss, 
              component.material_price, component.material_cost
            ]
          );
        }
        
        await bomConnection.commit();
        bomConnection.release();
        
        console.log(`✅ BOM ${bom.bom_code} 同步成功`);
        return { success: true, bomId: bomIdInNewDb };
      } catch (error) {
        await bomConnection.rollback();
        bomConnection.release();
        throw error;
      }
    } catch (error) {
      console.error(`❌ 同步BOM ${bomId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 将生产BOM推送到列表式生产BOM
   */
  static async pushToStyleProductionBom(bomId) {
    try {
      console.log(`📤 开始推送BOM ${bomId} 到列表式生产BOM...`);
      
      // 从专用数据库获取BOM数据
      const [bomRows] = await bomPool.execute('SELECT * FROM production_boms WHERE id = ?', [bomId]);
      if (bomRows.length === 0) {
        throw new Error(`BOM ${bomId} 不存在`);
      }
      
      const bom = bomRows[0];
      
      // 获取BOM子件
      const [components] = await bomPool.execute('SELECT * FROM bom_components WHERE bom_id = ?', [bomId]);
      
      // 使用事务确保数据一致性
      const connection = await bomPool.getConnection();
      await connection.beginTransaction();
      
      try {
        // 检查是否已存在相同的列表式BOM
        const [existingStyleBom] = await connection.execute(
          'SELECT id FROM list_style_production_boms WHERE bom_code = ?',
          [bom.bom_code]
        );
        
        let styleBomId;
        
        if (existingStyleBom.length > 0) {
          // 更新现有列表式BOM
          await connection.execute(
            `UPDATE list_style_production_boms SET 
              sequence = ?, parent_code = ?, parent_name = ?, status = ?, 
              is_default = ?, version_count = ?, remark = ?, 
              parent_output_process = ?, total_material = ?, total_labor = ?, 
              updated_at = CURRENT_TIMESTAMP 
            WHERE bom_code = ?`,
            [
              components.length, bom.product_code, bom.product_name, bom.status,
              '是', 1, bom.remark, '', bom.total_material, bom.total_labor,
              bom.bom_code
            ]
          );
          styleBomId = existingStyleBom[0].id;
          
          // 删除旧的子件
          await connection.execute('DELETE FROM list_style_bom_children WHERE parent_id = ?', [styleBomId]);
        } else {
          // 插入新列表式BOM
          const [result] = await connection.execute(
            `INSERT INTO list_style_production_boms (
              sequence, bom_code, parent_code, parent_name, status, 
              is_default, version_count, remark, parent_output_process, 
              total_material, total_labor
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              components.length, bom.bom_code, bom.product_code, bom.product_name, bom.status,
              '是', 1, bom.remark, '', bom.total_material, bom.total_labor
            ]
          );
          styleBomId = result.insertId;
        }
        
        // 插入子件到列表式BOM子件表
        for (let i = 0; i < components.length; i++) {
          const component = components[i];
          await connection.execute(
            `INSERT INTO list_style_bom_children (
              parent_id, child_sequence, child_code, child_name, 
              output_process, component_source, standard_usage
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              styleBomId, i + 1, component.component_code, component.component_name,
              component.output_process, component.component_source, component.quantity
            ]
          );
        }
        
        await connection.commit();
        connection.release();
        
        console.log(`✅ BOM ${bom.bom_code} 成功推送到列表式生产BOM`);
        return { success: true, styleBomId };
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error(`❌ 推送BOM ${bomId} 到列表式生产BOM失败:`, error);
      throw error;
    }
  }

  /**
   * 将生产BOM推送到产品手册
   */
  static async pushToProductManual(bomId) {
    try {
      console.log(`📤 开始推送BOM ${bomId} 到产品手册...`);
      
      // 从专用数据库获取BOM数据
      const [bomRows] = await bomPool.execute('SELECT * FROM production_boms WHERE id = ?', [bomId]);
      if (bomRows.length === 0) {
        throw new Error(`BOM ${bomId} 不存在`);
      }
      
      const bom = bomRows[0];
      
      // 获取BOM子件
      const [components] = await bomPool.execute('SELECT * FROM bom_components WHERE bom_id = ?', [bomId]);
      
      // 构建产品手册数据
      const productManualData = {
        productCode: bom.product_code,
        productName: bom.product_name,
        productImage: bom.product_image,
        source: JSON.stringify([{
          type: 'production_bom',
          bomCode: bom.bom_code,
          bomName: bom.bom_name
        }]),
        outputProcessName: components.length > 0 ? components[0].output_process : '',
        category: '',
        specification: '',
        unit: '个',
        status: '在售',
        productStatus: '正常',
        version: bom.version || 'V1.0',
        isEnabled: 1,
        designer: bom.designer,
        bomMaintainer: bom.designer,
        remark: bom.remark
      };
      
      // 先检查产品手册中是否已存在该产品
      const [existingProduct] = await mainPool.execute(
        'SELECT id FROM product_manual WHERE productCode = ?',
        [productManualData.productCode]
      );
      
      if (existingProduct.length > 0) {
        // 更新现有产品手册
        await mainPool.execute(
          `UPDATE product_manual SET 
            productName = ?, productImage = ?, source = ?, outputProcessName = ?, 
            version = ?, designer = ?, bomMaintainer = ?, remark = ?, 
            updateTime = CURRENT_TIMESTAMP 
          WHERE productCode = ?`,
          [
            productManualData.productName, productManualData.productImage, productManualData.source,
            productManualData.outputProcessName, productManualData.version, productManualData.designer,
            productManualData.bomMaintainer, productManualData.remark, productManualData.productCode
          ]
        );
        console.log(`✅ 更新产品手册中的产品 ${productManualData.productCode}`);
      } else {
        // 插入新产品手册
        await mainPool.execute(
          `INSERT INTO product_manual (
            productCode, productName, productImage, source, outputProcessName, 
            category, specification, unit, status, productStatus, 
            version, isEnabled, designer, bomMaintainer, remark
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            productManualData.productCode, productManualData.productName, productManualData.productImage,
            productManualData.source, productManualData.outputProcessName, productManualData.category,
            productManualData.specification, productManualData.unit, productManualData.status,
            productManualData.productStatus, productManualData.version, productManualData.isEnabled,
            productManualData.designer, productManualData.bomMaintainer, productManualData.remark
          ]
        );
        console.log(`✅ 新增产品手册中的产品 ${productManualData.productCode}`);
      }
      
      // 更新BOM的推送状态
      await bomPool.execute(
        'UPDATE production_boms SET is_pushed_to_manual = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [bomId]
      );
      
      console.log(`✅ BOM ${bom.bom_code} 成功推送到产品手册`);
      return { success: true };
    } catch (error) {
      console.error(`❌ 推送BOM ${bomId} 到产品手册失败:`, error);
      throw error;
    }
  }

  /**
   * 为所有未推送的BOM执行推送
   */
  static async pushAllPendingBoms() {
    try {
      console.log('🔄 开始推送所有未推送的BOM...');
      
      // 获取所有未推送到产品手册的BOM
      const [pendingBoms] = await bomPool.execute(
        'SELECT id FROM production_boms WHERE is_pushed_to_manual = 0'
      );
      
      console.log(`📦 找到 ${pendingBoms.length} 个未推送的BOM`);
      
      for (const bom of pendingBoms) {
        await this.pushToProductManual(bom.id);
      }
      
      console.log('✅ 所有未推送BOM推送完成');
      return { success: true, count: pendingBoms.length };
    } catch (error) {
      console.error('❌ 推送未推送BOM失败:', error);
      throw error;
    }
  }

  /**
   * 为指定BOM执行完整的推送流程
   */
  static async executeBomPushWorkflow(bomId) {
    try {
      console.log(`🔄 开始执行BOM ${bomId} 完整推送流程...`);
      
      // 1. 同步到专用数据库（如果还没同步）
      await this.syncSingleBOM(bomId);
      
      // 2. 推送到列表式生产BOM
      const stylePushResult = await this.pushToStyleProductionBom(bomId);
      if (!stylePushResult.success) {
        throw new Error('推送到列表式生产BOM失败');
      }
      
      // 3. 推送到产品手册
      const manualPushResult = await this.pushToProductManual(bomId);
      if (!manualPushResult.success) {
        throw new Error('推送到产品手册失败');
      }
      
      console.log(`✅ BOM ${bomId} 完整推送流程执行成功`);
      return { success: true };
    } catch (error) {
      console.error(`❌ BOM ${bomId} 完整推送流程执行失败:`, error);
      throw error;
    }
  }
}

module.exports = BomSyncService;