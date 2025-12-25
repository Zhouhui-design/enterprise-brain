const { pool } = require('../config/database');

class BOMService {
  /**
   * 获取所有生产BOM
   */
  static async getAllProductionBOMs() {
    try {
      const [rows] = await pool.execute('SELECT * FROM production_boms ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      console.error('获取生产BOM列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取BOM
   */
  static async getBOMById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM production_boms WHERE id = ?', [id]);
      const bom = rows[0];
      
      if (bom) {
        // 获取子件列表
        const [components] = await pool.execute(
          'SELECT * FROM bom_components WHERE bom_id = ? ORDER BY sequence',
          [id]
        );
        bom.childItems = components.map(component => {
          return {
            ...component,
            standard_quantity: component.quantity // 使用正确的字段名，数据库中实际是quantity字段
          };
        });
      }
      
      return bom;
    } catch (error) {
      console.error('获取BOM详情失败:', error);
      throw error;
    }
  }

  /**
   * ✅ 根据产品编码获取BOM（用于MRP加载）
   */
  static async getBOMByProductCode(productCode) {
    try {
      // 查找最新的生产BOM
      const [rows] = await pool.execute(
        'SELECT * FROM production_boms WHERE product_code = ? ORDER BY created_at DESC LIMIT 1',
        [productCode]
      );
      const bom = rows[0];
      
      if (bom) {
        // 获取子件列表
        const [components] = await pool.execute(
          'SELECT * FROM bom_components WHERE bom_id = ? ORDER BY sequence',
          [bom.id]
        );
        bom.childItems = components.map(component => {
          return {
            ...component,
            standard_quantity: component.quantity // 使用正确的字段名，数据库中实际是quantity字段
          };
        });
        console.log(`✅ 产品 ${productCode} 的BOM包含 ${components.length} 个子件`);
      }
      
      return bom;
    } catch (error) {
      console.error('根据产品编码获取BOM失败:', error);
      throw error;
    }
  }

  /**
   * 创建生产BOM
   */
  static async createProductionBOM(bomData) {
    const connection = await pool.getConnection();
    try {
      // 处理数据结构，确保字段名正确映射
      const processedData = { ...bomData };
      
      // 处理子件数据，确保字段名正确映射
      const processedChildItems = (processedData.childItems || []).map(item => {
        return item;
      });
      
      const { childItems: _, ...bomInfo } = processedData;
      
      await connection.beginTransaction();
      
      // 插入BOM主表 - 确保字段名和值正确映射
      const [result] = await connection.execute(`
        INSERT INTO production_boms (
          bom_code, bom_name, product_code, product_name, version, 
          status, designer, material_count, remark, auditor, effective_date,
          total_labor, total_material, product_image, is_pushed_to_manual
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bomInfo.bomCode || `PBOM-${Date.now()}`,        // bom_code
        bomInfo.bomName || '未命名',                    // bom_name
        bomInfo.productCode || 'UNKNOWN',               // product_code
        bomInfo.productName || '未知产品',              // product_name
        bomInfo.version || 'V1.0',                     // version
        bomInfo.status || 'draft',                     // status
        bomInfo.designer || '',                        // designer
        bomInfo.itemCount || 0,                        // material_count (前端使用itemCount)
        bomInfo.remark || '',                          // remark
        bomInfo.reviewer || '',                        // auditor (前端使用reviewer)
        bomInfo.effectiveDate || null,                 // effective_date
        parseFloat(bomInfo.totalLabor) || 0,           // total_labor
        parseFloat(bomInfo.totalMaterial) || 0,        // total_material
        bomInfo.productImage || null,                  // product_image
        0                                              // is_pushed_to_manual 默认值
      ]);
      
      const bomId = result.insertId;
      
      // 插入子件 - 确保字段名正确映射（数据库字段是quantity，不是standard_quantity）
      if (processedChildItems && processedChildItems.length > 0) {
        for (let i = 0; i < processedChildItems.length; i++) {
          const item = processedChildItems[i];
          await connection.execute(`
            INSERT INTO bom_components (
              bom_id, sequence, level, component_code, component_name,
              quantity, output_process, component_source,
              process_wage, material_loss, material_price, material_cost
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            bomId,                                     // bom_id
            i + 1,                                     // sequence
            parseInt(item.level) || 1,                 // level
            item.childCode || 'UNKNOWN',               // component_code (前端使用childCode)
            item.childName || '未知组件',              // component_name (前端使用childName)
            parseFloat(item.standardQty || 0),         // quantity (前端使用standardQty，数据库字段是quantity)
            item.outputProcess || '',                  // output_process
            item.source || '',                         // component_source (前端使用source)
            parseFloat(item.processWage) || 0,         // process_wage
            parseFloat(item.materialLoss) || 0,        // material_loss
            parseFloat(item.materialPrice) || 0,       // material_price
            parseFloat((parseFloat(item.materialPrice) || 0) * (item.standardQty || 1)) || 0 // material_cost (计算得出)
          ]);
        }
      }
      
      await connection.commit();
      console.log(`BOM创建成功, ID: ${bomId}, BOM编号: ${bomInfo.bomCode}`);
      
      return { id: bomId, ...bomInfo };
    } catch (error) {
      await connection.rollback();
      console.error('创建生产BOM失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 更新生产BOM
   */
  static async updateProductionBOM(id, bomData) {
    const connection = await pool.getConnection();
    try {
      // 处理数据结构，确保没有使用不存在的字段
      const processedData = { ...bomData };
      
      // 处理子件数据，确保使用正确的字段名
      const processedChildItems = (processedData.childItems || []).map(item => {
        // 如果存在standard_quantity字段，将其映射到standardQty
        if (item.standard_quantity) {
          item.standardQty = item.standard_quantity;
          delete item.standard_quantity;
        }
        return item;
      });
      
      const { childItems: _, ...bomInfo } = processedData;
      const bomId = parseInt(id); // 确保ID是整数
      
      await connection.beginTransaction();
      
      // 更新BOM主表
      await connection.execute(`
        UPDATE production_boms SET
          bom_code = ?, bom_name = ?, product_code = ?, product_name = ?,
          version = ?, status = ?, designer = ?, material_count = ?,
          remark = ?, auditor = ?, effective_date = ?,
          total_labor = ?, total_material = ?, product_image = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        bomInfo.bomCode,
        bomInfo.bomName || '未命名',
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
        bomId
      ]);
      
      // 删除旧子件
      await connection.execute('DELETE FROM bom_components WHERE bom_id = ?', [bomId]);
      
      // 插入新子件（数据库字段是quantity，不是standard_quantity）
      if (processedChildItems && processedChildItems.length > 0) {
        for (let i = 0; i < processedChildItems.length; i++) {
          const item = processedChildItems[i];
          
          // 构建SQL语句和参数，确保只使用表中存在的字段
          const sql = `
            INSERT INTO bom_components (
              bom_id, sequence, level, component_code, component_name,
              quantity, output_process, component_source,
              process_wage, material_loss, material_price, material_cost
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          // 只传递表中存在的字段值
          const params = [
            bomId,
            i + 1, // sequence
            parseInt(item.level) || 1,
            item.childCode || 'UNKNOWN',
            item.childName || '未知组件',
            parseFloat(item.standardQty || item.quantity || 0), // 使用standardQty或quantity，映射到quantity字段
            item.outputProcess || '',
            item.source || '',
            parseFloat(item.processWage) || 0,
            parseFloat(item.materialLoss) || 0,
            parseFloat(item.materialPrice) || 0,
            parseFloat(item.materialCost) || 0
          ];
          
          await connection.execute(sql, params);
        }
      }
      
      await connection.commit();
      console.log(`BOM更新成功, ID: ${bomId}, BOM编号: ${bomInfo.bomCode}`);
      
      return { id: bomId, ...bomInfo };
    } catch (error) {
      await connection.rollback();
      console.error('更新生产BOM失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 删除生产BOM
   */
  static async deleteProductionBOM(id) {
    const connection = await pool.getConnection();
    try {
      const bomId = parseInt(id); // 确保ID是整数
      
      await connection.beginTransaction();
      
      // 删除子件（级联删除）
      await connection.execute('DELETE FROM bom_components WHERE bom_id = ?', [bomId]);
      
      // 删除BOM
      const [result] = await connection.execute('DELETE FROM production_boms WHERE id = ?', [bomId]);
      
      await connection.commit();
      
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('删除生产BOM失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 批量删除生产BOM
   */
  static async batchDeleteProductionBOMs(ids) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      let successCount = 0;
      for (const id of ids) {
        // 删除子件
        await connection.execute('DELETE FROM bom_components WHERE bom_id = ?', [id]);
        
        // 删除BOM
        const [result] = await connection.execute('DELETE FROM production_boms WHERE id = ?', [id]);
        
        if (result.affectedRows > 0) {
          successCount++;
        }
      }
      
      await connection.commit();
      console.log(`批量删除完成: 成功${successCount}条/总共${ids.length}条`);
      return { successCount, totalCount: ids.length };
    } catch (error) {
      await connection.rollback();
      console.error('批量删除生产BOM失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = BOMService;
