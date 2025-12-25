const { pool } = require('../config/database');

/**
 * 生产BOM草稿服务 - MySQL版本
 */
class BOMDraftService {
  /**
   * 获取所有草稿
   */
  static async getAllDrafts() {
    try {
      const [rows] = await pool.execute('SELECT * FROM production_bom_drafts ORDER BY updated_at DESC');
      return rows;
    } catch (error) {
      console.error('获取草稿列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取草稿详情
   */
  static async getDraftById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM production_bom_drafts WHERE id = ?', [id]);
      const draft = rows[0];
      
      if (!draft) {
        return null;
      }
      
      // 获取子件
      const [components] = await pool.execute(
        'SELECT * FROM bom_draft_components WHERE draft_id = ? ORDER BY sequence',
        [id]
      );
      
      draft.childItems = components;
      return draft;
    } catch (error) {
      console.error('获取草稿详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建草稿
   */
  static async createDraft(draftData) {
    const connection = await pool.getConnection();
    try {
      const { childItems, ...draftInfo } = draftData;
      
      await connection.beginTransaction();
      
      // 插入草稿主表
      const [result] = await connection.execute(`
        INSERT INTO production_bom_drafts (
          bom_code, bom_name, product_code, product_name, version, 
          status, designer, material_count, remark, auditor, effective_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        draftInfo.bomCode,
        draftInfo.bomName || '',
        draftInfo.productCode || '',
        draftInfo.productName || '',
        draftInfo.version || 'V1.0',
        draftInfo.status || 'draft',
        draftInfo.designer || '',
        draftInfo.itemCount || 0,
        draftInfo.remark || '',
        draftInfo.reviewer || '',
        draftInfo.effectiveDate || null
      ]);
      
      const draftId = result.insertId;
      
      // 插入子件
      if (childItems && childItems.length > 0) {
        for (let i = 0; i < childItems.length; i++) {
          const item = childItems[i];
          await connection.execute(`
            INSERT INTO bom_draft_components (
              draft_id, sequence, level, component_code, component_name,
              quantity, output_process, component_source,
              process_wage, material_loss, material_price, material_cost
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            draftId,
            i + 1,
            parseInt(item.level) || 1,
            item.childCode || '',
            item.childName || '',
            parseFloat(item.standardQty) || 0,
            item.outputProcess || '',
            item.source || '',
            parseFloat(item.processWage) || 0,
            parseFloat(item.materialLoss) || 0,
            parseFloat(item.materialPrice) || 0,
            parseFloat(item.materialCost) || 0
          ]);
        }
      }
      
      await connection.commit();
      console.log(`草稿创建成功, ID: ${draftId}, BOM编号: ${draftInfo.bomCode}`);
      
      return { id: draftId, ...draftInfo };
    } catch (error) {
      await connection.rollback();
      console.error('创建草稿失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 更新草稿
   */
  static async updateDraft(id, draftData) {
    const connection = await pool.getConnection();
    try {
      const { childItems, ...draftInfo } = draftData;
      const draftId = parseInt(id); // 确保ID是整数
      
      await connection.beginTransaction();
      
      // 更新草稿主表
      await connection.execute(`
        UPDATE production_bom_drafts SET
          bom_code = ?, bom_name = ?, product_code = ?, product_name = ?,
          version = ?, status = ?, designer = ?, material_count = ?,
          remark = ?, auditor = ?, effective_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        draftInfo.bomCode,
        draftInfo.bomName || '',
        draftInfo.productCode || '',
        draftInfo.productName || '',
        draftInfo.version || 'V1.0',
        draftInfo.status || 'draft',
        draftInfo.designer || '',
        draftInfo.itemCount || 0,
        draftInfo.remark || '',
        draftInfo.reviewer || '',
        draftInfo.effectiveDate || null,
        draftId
      ]);
      
      // 删除旧子件
      await connection.execute('DELETE FROM bom_draft_components WHERE draft_id = ?', [draftId]);
      
      // 插入新子件
      if (childItems && childItems.length > 0) {
        for (let i = 0; i < childItems.length; i++) {
          const item = childItems[i];
          await connection.execute(`
            INSERT INTO bom_draft_components (
              draft_id, sequence, level, component_code, component_name,
              quantity, output_process, component_source,
              process_wage, material_loss, material_price, material_cost
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            draftId,
            i + 1,
            parseInt(item.level) || 1,
            item.childCode || '',
            item.childName || '',
            parseFloat(item.standardQty) || 0,
            item.outputProcess || '',
            item.source || '',
            parseFloat(item.processWage) || 0,
            parseFloat(item.materialLoss) || 0,
            parseFloat(item.materialPrice) || 0,
            parseFloat(item.materialCost) || 0
          ]);
        }
      }
      
      await connection.commit();
      console.log(`草稿更新成功, ID: ${draftId}`);
      
      return { id: draftId, ...draftInfo };
    } catch (error) {
      await connection.rollback();
      console.error('更新草稿失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 删除草稿
   */
  static async deleteDraft(id) {
    const connection = await pool.getConnection();
    try {
      const draftId = parseInt(id); // 确保ID是整数
      
      await connection.beginTransaction();
      
      // 删除子件
      await connection.execute('DELETE FROM bom_draft_components WHERE draft_id = ?', [draftId]);
      
      // 删除草稿
      const [result] = await connection.execute('DELETE FROM production_bom_drafts WHERE id = ?', [draftId]);
      
      const success = result.affectedRows > 0;
      
      await connection.commit();
      console.log(`草稿删除${success ? '成功' : '失败'}, ID: ${draftId}`);
      
      return success;
    } catch (error) {
      await connection.rollback();
      console.error('删除草稿失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 批量删除草稿
   */
  static async batchDeleteDrafts(ids) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      let successCount = 0;
      for (const id of ids) {
        // 删除子件
        await connection.execute('DELETE FROM bom_draft_components WHERE draft_id = ?', [id]);
        
        // 删除草稿
        const [result] = await connection.execute('DELETE FROM production_bom_drafts WHERE id = ?', [id]);
        
        if (result.affectedRows > 0) {
          successCount++;
        }
      }
      
      await connection.commit();
      console.log(`批量删除草稿完成: 成功${successCount}条/总共${ids.length}条`);
      
      return { successCount, totalCount: ids.length };
    } catch (error) {
      await connection.rollback();
      console.error('批量删除草稿失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = BOMDraftService;
