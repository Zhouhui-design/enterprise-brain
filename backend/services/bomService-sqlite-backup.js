const db = require('../config/database');

class BOMService {
  /**
   * 获取所有生产BOM
   */
  static getAllProductionBOMs() {
    try {
      const stmt = db.prepare('SELECT * FROM production_boms ORDER BY created_at DESC');
      return stmt.all();
    } catch (error) {
      console.error('获取生产BOM列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取BOM
   */
  static getBOMById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM production_boms WHERE id = ?');
      const bom = stmt.get(id);

      if (bom) {
        // 获取子件列表
        const componentsStmt = db.prepare('SELECT * FROM bom_components WHERE bom_id = ? ORDER BY sequence');
        bom.childItems = componentsStmt.all(id);
      }

      return bom;
    } catch (error) {
      console.error('获取BOM详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建生产BOM
   */
  static createProductionBOM(bomData) {
    try {
      const { childItems, ...bomInfo } = bomData;

      // 使用事务保证数据一致性
      const createTransaction = db.transaction(() => {
        // 插入BOM主表
        const stmt = db.prepare(`
          INSERT INTO production_boms (
            bom_code, bom_name, product_code, product_name, version, 
            status, designer, material_count, remark, auditor, effective_date,
            total_labor, total_material, product_image
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
          bomInfo.bomCode,
          bomInfo.bomName || '',
          bomInfo.productCode || '',
          bomInfo.productName || '',
          bomInfo.version || 'V1.0',
          bomInfo.status || 'draft',
          bomInfo.designer || '',
          bomInfo.itemCount || 0,
          bomInfo.remark || '',
          bomInfo.reviewer || '',
          bomInfo.effectiveDate || null,
          parseFloat(bomInfo.totalLabor) || 0,
          parseFloat(bomInfo.totalMaterial) || 0,
          bomInfo.productImage || null,
        );

        const bomId = info.lastInsertRowid;

        // 插入子件
        if (childItems && childItems.length > 0) {
          const componentStmt = db.prepare(`
            INSERT INTO bom_components (
              bom_id, sequence, level, component_code, component_name,
              standard_quantity, output_process, component_source,
              process_wage, material_loss, material_price, material_cost
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (let i = 0; i < childItems.length; i++) {
            const item = childItems[i];
            componentStmt.run(
              bomId,
              i + 1, // sequence
              parseInt(item.level) || 1,
              item.childCode || '',
              item.childName || '',
              parseFloat(item.standardQty) || 0,
              item.outputProcess || '',
              item.source || '',
              parseFloat(item.processWage) || 0,
              parseFloat(item.materialLoss) || 0,
              parseFloat(item.materialPrice) || 0,
              parseFloat(item.materialCost) || 0,
            );
          }
        }

        return bomId;
      });

      const bomId = createTransaction();
      console.log(`BOM创建成功, ID: ${bomId}, BOM编号: ${bomInfo.bomCode}`);

      return { id: bomId, ...bomInfo };
    } catch (error) {
      console.error('创建生产BOM失败:', error);
      throw error;
    }
  }

  /**
   * 更新生产BOM
   */
  static updateProductionBOM(id, bomData) {
    try {
      const { childItems, ...bomInfo } = bomData;
      const bomId = parseInt(id); // 确保ID是整数

      // 使用事务保证数据一致性
      const updateTransaction = db.transaction(() => {
        // 更新BOM主表
        const stmt = db.prepare(`
          UPDATE production_boms SET
            bom_code = ?, bom_name = ?, product_code = ?, product_name = ?,
            version = ?, status = ?, designer = ?, material_count = ?,
            remark = ?, auditor = ?, effective_date = ?,
            total_labor = ?, total_material = ?, product_image = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        stmt.run(
          bomInfo.bomCode,
          bomInfo.bomName || '',
          bomInfo.productCode || '',
          bomInfo.productName || '',
          bomInfo.version || 'V1.0',
          bomInfo.status || 'draft',
          bomInfo.designer || '',
          bomInfo.itemCount || 0,
          bomInfo.remark || '',
          bomInfo.reviewer || '',
          bomInfo.effectiveDate || null,
          parseFloat(bomInfo.totalLabor) || 0,
          parseFloat(bomInfo.totalMaterial) || 0,
          bomInfo.productImage || null,
          bomId,
        );

        // 删除旧子件
        const deleteStmt = db.prepare('DELETE FROM bom_components WHERE bom_id = ?');
        deleteStmt.run(bomId);

        // 插入新子件
        if (childItems && childItems.length > 0) {
          const componentStmt = db.prepare(`
            INSERT INTO bom_components (
              bom_id, sequence, level, component_code, component_name,
              standard_quantity, output_process, component_source,
              process_wage, material_loss, material_price, material_cost
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (let i = 0; i < childItems.length; i++) {
            const item = childItems[i];
            componentStmt.run(
              bomId,
              i + 1, // sequence
              parseInt(item.level) || 1,
              item.childCode || '',
              item.childName || '',
              parseFloat(item.standardQty) || 0,
              item.outputProcess || '',
              item.source || '',
              parseFloat(item.processWage) || 0,
              parseFloat(item.materialLoss) || 0,
              parseFloat(item.materialPrice) || 0,
              parseFloat(item.materialCost) || 0,
            );
          }
        }
      });

      updateTransaction();
      console.log(`BOM更新成功, ID: ${bomId}, BOM编号: ${bomInfo.bomCode}`);

      return { id: bomId, ...bomInfo };
    } catch (error) {
      console.error('更新生产BOM失败:', error);
      throw error;
    }
  }

  /**
   * 删除生产BOM
   */
  static deleteProductionBOM(id) {
    try {
      const bomId = parseInt(id); // 确保ID是整数

      // 删除子件（级联删除）
      const deleteComponentsStmt = db.prepare('DELETE FROM bom_components WHERE bom_id = ?');
      deleteComponentsStmt.run(bomId);

      // 删除BOM
      const stmt = db.prepare('DELETE FROM production_boms WHERE id = ?');
      const info = stmt.run(bomId);

      return info.changes > 0;
    } catch (error) {
      console.error('删除生产BOM失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除生产BOM
   */
  static batchDeleteProductionBOMs(ids) {
    try {
      const deleteTransaction = db.transaction(idList => {
        let successCount = 0;
        for (const id of idList) {
          // 直接调用SQL，避免this指向问题
          const deleteComponentsStmt = db.prepare('DELETE FROM bom_components WHERE bom_id = ?');
          deleteComponentsStmt.run(id);

          const deleteBomStmt = db.prepare('DELETE FROM production_boms WHERE id = ?');
          const info = deleteBomStmt.run(id);

          if (info.changes > 0) {
            successCount++;
          }
        }
        return successCount;
      });

      const successCount = deleteTransaction(ids);
      console.log(`批量删除完成: 成功${successCount}条/总共${ids.length}条`);
      return { successCount, totalCount: ids.length };
    } catch (error) {
      console.error('批量删除生产BOM失败:', error);
      throw error;
    }
  }
}

module.exports = BOMService;
