const db = require('../config/database');

/**
 * 生产BOM草稿服务
 */
class BOMDraftService {
  /**
   * 获取所有草稿
   */
  static getAllDrafts() {
    try {
      const stmt = db.prepare('SELECT * FROM production_bom_drafts ORDER BY updated_at DESC');
      return stmt.all();
    } catch (error) {
      console.error('获取草稿列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取草稿详情
   */
  static getDraftById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM production_bom_drafts WHERE id = ?');
      const draft = stmt.get(id);
      
      if (!draft) {
        return null;
      }
      
      // 获取子件
      const componentStmt = db.prepare('SELECT * FROM bom_draft_components WHERE draft_id = ? ORDER BY sequence');
      const components = componentStmt.all(id);
      
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
  static createDraft(draftData) {
    try {
      const { childItems, ...draftInfo } = draftData;
      
      const createTransaction = db.transaction(() => {
        // 插入草稿主表
        const stmt = db.prepare(`
          INSERT INTO production_bom_drafts (
            bom_code, bom_name, product_code, product_name, version, 
            status, designer, material_count, remark, auditor, effective_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const info = stmt.run(
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
        );
        
        const draftId = info.lastInsertRowid;
        
        // 插入子件
        if (childItems && childItems.length > 0) {
          const componentStmt = db.prepare(`
            INSERT INTO bom_draft_components (
              draft_id, sequence, level, component_code, component_name,
              standard_quantity, output_process, component_source,
              process_wage, material_loss, material_price, material_cost
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          for (let i = 0; i < childItems.length; i++) {
            const item = childItems[i];
            componentStmt.run(
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
            );
          }
        }
        
        return draftId;
      });
      
      const draftId = createTransaction();
      console.log(`草稿创建成功, ID: ${draftId}, BOM编号: ${draftInfo.bomCode}`);
      
      return { id: draftId, ...draftInfo };
    } catch (error) {
      console.error('创建草稿失败:', error);
      throw error;
    }
  }

  /**
   * 更新草稿
   */
  static updateDraft(id, draftData) {
    try {
      const { childItems, ...draftInfo } = draftData;
      const draftId = parseInt(id); // 确保ID是整数
      
      const updateTransaction = db.transaction(() => {
        // 更新草稿主表
        const stmt = db.prepare(`
          UPDATE production_bom_drafts SET
            bom_code = ?, bom_name = ?, product_code = ?, product_name = ?,
            version = ?, status = ?, designer = ?, material_count = ?,
            remark = ?, auditor = ?, effective_date = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        
        stmt.run(
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
        );
        
        // 删除旧子件
        const deleteStmt = db.prepare('DELETE FROM bom_draft_components WHERE draft_id = ?');
        deleteStmt.run(draftId);
        
        // 插入新子件
        if (childItems && childItems.length > 0) {
          const componentStmt = db.prepare(`
            INSERT INTO bom_draft_components (
              draft_id, sequence, level, component_code, component_name,
              standard_quantity, output_process, component_source,
              process_wage, material_loss, material_price, material_cost
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          for (let i = 0; i < childItems.length; i++) {
            const item = childItems[i];
            componentStmt.run(
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
            );
          }
        }
      });
      
      updateTransaction();
      console.log(`草稿更新成功, ID: ${draftId}`);
      
      return { id: draftId, ...draftInfo };
    } catch (error) {
      console.error('更新草稿失败:', error);
      throw error;
    }
  }

  /**
   * 删除草稿
   */
  static deleteDraft(id) {
    try {
      const draftId = parseInt(id); // 确保ID是整数
      
      const deleteTransaction = db.transaction(() => {
        // 删除子件
        const deleteComponentsStmt = db.prepare('DELETE FROM bom_draft_components WHERE draft_id = ?');
        deleteComponentsStmt.run(draftId);
        
        // 删除草稿
        const stmt = db.prepare('DELETE FROM production_bom_drafts WHERE id = ?');
        const info = stmt.run(draftId);
        
        return info.changes > 0;
      });
      
      const success = deleteTransaction();
      console.log(`草稿删除${success ? '成功' : '失败'}, ID: ${draftId}`);
      
      return success;
    } catch (error) {
      console.error('删除草稿失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除草稿
   */
  static batchDeleteDrafts(ids) {
    try {
      const deleteTransaction = db.transaction((idList) => {
        let successCount = 0;
        for (const id of idList) {
          const deleteComponentsStmt = db.prepare('DELETE FROM bom_draft_components WHERE draft_id = ?');
          deleteComponentsStmt.run(id);
          
          const deleteDraftStmt = db.prepare('DELETE FROM production_bom_drafts WHERE id = ?');
          const info = deleteDraftStmt.run(id);
          
          if (info.changes > 0) {
            successCount++;
          }
        }
        return successCount;
      });
      
      const successCount = deleteTransaction(ids);
      console.log(`批量删除草稿完成: 成功${successCount}条/总共${ids.length}条`);
      
      return { successCount, totalCount: ids.length };
    } catch (error) {
      console.error('批量删除草稿失败:', error);
      throw error;
    }
  }
}

module.exports = BOMDraftService;
