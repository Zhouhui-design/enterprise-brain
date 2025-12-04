const db = require('../config/database');

class MaterialService {
  // 获取所有物料
  static async getAllMaterials() {
    try {
      const stmt = db.prepare('SELECT * FROM materials ORDER BY created_at DESC');
      return stmt.all();
    } catch (error) {
      throw new Error(`获取物料列表失败: ${error.message}`);
    }
  }

  // 根据ID获取物料
  static async getMaterialById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM materials WHERE id = ?');
      return stmt.get(id);
    } catch (error) {
      throw new Error(`获取物料失败: ${error.message}`);
    }
  }

  // 根据物料编码获取物料
  static async getMaterialByCode(materialCode) {
    try {
      const stmt = db.prepare('SELECT * FROM materials WHERE material_code = ?');
      return stmt.get(materialCode);
    } catch (error) {
      throw new Error(`获取物料失败: ${error.message}`);
    }
  }

  // 创建物料
  static async createMaterial(materialData) {
    try {
      // 计算基础单价
      const purchasePrice = materialData.purchase_price || materialData.purchasePrice || 0;
      const purchaseConversionRate = materialData.purchase_conversion_rate || materialData.purchaseConversionRate || 1;
      const basePrice = purchaseConversionRate > 0 ? purchasePrice / purchaseConversionRate : 0;

      const stmt = db.prepare(`
        INSERT INTO materials (
          material_code, bom_number, material_name, size_spec, color, material,
          major_category, middle_category, minor_category, model, series, source,
          description, material_image, base_unit, sale_unit, sale_conversion_rate,
          purchase_unit, purchase_conversion_rate, kg_per_pcs, pcs_per_kg,
          process_name, standard_time, quota_time, process_price,
          purchase_cycle, purchase_price, base_price, status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);

      const result = stmt.run(
        materialData.material_code || materialData.materialCode,
        materialData.bom_number || materialData.bomNumber || '',
        materialData.material_name || materialData.materialName,
        materialData.size_spec || materialData.sizeSpec || '',
        materialData.color || '',
        materialData.material || '',
        materialData.major_category || materialData.majorCategory || '',
        materialData.middle_category || materialData.middleCategory || '',
        materialData.minor_category || materialData.minorCategory || '',
        materialData.model || '',
        materialData.series || '',
        materialData.source ? (typeof materialData.source === 'string' ? materialData.source : JSON.stringify(materialData.source)) : '[]',
        materialData.description || '',
        materialData.material_image || materialData.materialImage || '',
        materialData.base_unit || materialData.baseUnit || '个',
        materialData.sale_unit || materialData.saleUnit || '',
        materialData.sale_conversion_rate || materialData.saleConversionRate || 1,
        materialData.purchase_unit || materialData.purchaseUnit || '',
        purchaseConversionRate,
        materialData.kg_per_pcs || materialData.kgPerPcs || 0,
        materialData.pcs_per_kg || materialData.pcsPerKg || 0,
        materialData.process_name || materialData.processName || '',
        materialData.standard_time || materialData.standardTime || 0,
        materialData.quota_time || materialData.quotaTime || 0,
        materialData.process_price || materialData.processPrice || 0,
        materialData.purchase_cycle || materialData.purchaseCycle || '',
        purchasePrice,
        basePrice,
        materialData.status || 'active'
      );

      return { id: result.lastInsertRowid };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('物料编码已存在');
      }
      throw new Error(`创建物料失败: ${error.message}`);
    }
  }

  // 批量创建物料
  static async createMaterials(materialsData) {
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
      // 开始事务
      db.exec('BEGIN TRANSACTION');

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO materials (
          material_code, bom_number, material_name, size_spec, color, material,
          major_category, middle_category, minor_category, model, series, source,
          description, material_image, base_unit, sale_unit, sale_conversion_rate,
          purchase_unit, purchase_conversion_rate, kg_per_pcs, pcs_per_kg,
          process_name, standard_time, quota_time, process_price,
          purchase_cycle, purchase_price, base_price, status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);

      for (const materialData of materialsData) {
        try {
          // 支持驼峰命名和下划线命名
          const materialCode = materialData.material_code || materialData.materialCode;
          
          // 计算基础单价
          const purchasePrice = materialData.purchase_price || materialData.purchasePrice || 0;
          const purchaseConversionRate = materialData.purchase_conversion_rate || materialData.purchaseConversionRate || 1;
          const basePrice = purchaseConversionRate > 0 ? purchasePrice / purchaseConversionRate : 0;
          
          // 检查物料编码是否已存在
          const existingStmt = db.prepare('SELECT id FROM materials WHERE material_code = ?');
          const existing = existingStmt.get(materialCode);
          
          if (existing) {
            // 如果已存在，使用UPDATE
            const updateStmt = db.prepare(`
              UPDATE materials SET
                bom_number = ?, material_name = ?, size_spec = ?,
                color = ?, material = ?, major_category = ?, middle_category = ?,
                minor_category = ?, model = ?, series = ?, source = ?,
                description = ?, material_image = ?, base_unit = ?, sale_unit = ?,
                sale_conversion_rate = ?, purchase_unit = ?, purchase_conversion_rate = ?,
                kg_per_pcs = ?, pcs_per_kg = ?, process_name = ?, standard_time = ?,
                quota_time = ?, process_price = ?, purchase_cycle = ?, purchase_price = ?,
                base_price = ?, status = ?, updated_at = CURRENT_TIMESTAMP
              WHERE material_code = ?
            `);
            
            updateStmt.run(
              materialData.bom_number || materialData.bomNumber || '',
              materialData.material_name || materialData.materialName,
              materialData.size_spec || materialData.sizeSpec || '',
              materialData.color || '',
              materialData.material || '',
              materialData.major_category || materialData.majorCategory || '',
              materialData.middle_category || materialData.middleCategory || '',
              materialData.minor_category || materialData.minorCategory || '',
              materialData.model || '',
              materialData.series || '',
              materialData.source ? (typeof materialData.source === 'string' ? materialData.source : JSON.stringify(materialData.source)) : '[]',
              materialData.description || '',
              materialData.material_image || materialData.materialImage || '',
              materialData.base_unit || materialData.baseUnit || '个',
              materialData.sale_unit || materialData.saleUnit || '',
              materialData.sale_conversion_rate || materialData.saleConversionRate || 1,
              materialData.purchase_unit || materialData.purchaseUnit || '',
              purchaseConversionRate,
              materialData.kg_per_pcs || materialData.kgPerPcs || 0,
              materialData.pcs_per_kg || materialData.pcsPerKg || 0,
              materialData.process_name || materialData.processName || '',
              materialData.standard_time || materialData.standardTime || 0,
              materialData.quota_time || materialData.quotaTime || 0,
              materialData.process_price || materialData.processPrice || 0,
              materialData.purchase_cycle || materialData.purchaseCycle || '',
              purchasePrice,
              basePrice,
              materialData.status || 'active',
              materialCode
            );
          } else {
            // 如果不存在，使用INSERT
            stmt.run(
              materialCode,
              materialData.bom_number || materialData.bomNumber || '',
              materialData.material_name || materialData.materialName,
              materialData.size_spec || materialData.sizeSpec || '',
              materialData.color || '',
              materialData.material || '',
              materialData.major_category || materialData.majorCategory || '',
              materialData.middle_category || materialData.middleCategory || '',
              materialData.minor_category || materialData.minorCategory || '',
              materialData.model || '',
              materialData.series || '',
              materialData.source ? (typeof materialData.source === 'string' ? materialData.source : JSON.stringify(materialData.source)) : '[]',
              materialData.description || '',
              materialData.material_image || materialData.materialImage || '',
              materialData.base_unit || materialData.baseUnit || '个',
              materialData.sale_unit || materialData.saleUnit || '',
              materialData.sale_conversion_rate || materialData.saleConversionRate || 1,
              materialData.purchase_unit || materialData.purchaseUnit || '',
              purchaseConversionRate,
              materialData.kg_per_pcs || materialData.kgPerPcs || 0,
              materialData.pcs_per_kg || materialData.pcsPerKg || 0,
              materialData.process_name || materialData.processName || '',
              materialData.standard_time || materialData.standardTime || 0,
              materialData.quota_time || materialData.quotaTime || 0,
              materialData.process_price || materialData.processPrice || 0,
              materialData.purchase_cycle || materialData.purchaseCycle || '',
              purchasePrice,
              basePrice,
              materialData.status || 'active'
            );
          }
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            materialCode: materialData.material_code || materialData.materialCode,
            error: error.message
          });
        }
      }

      // 提交事务
      db.exec('COMMIT');

      return {
        successCount,
        errorCount,
        errors
      };
    } catch (error) {
      // 回滚事务
      db.exec('ROLLBACK');
      throw new Error(`批量创建物料失败: ${error.message}`);
    }
  }

  // 更新物料
  static async updateMaterial(id, materialData) {
    try {
      // 计算基础单价
      const purchasePrice = materialData.purchase_price || materialData.purchasePrice || 0;
      const purchaseConversionRate = materialData.purchase_conversion_rate || materialData.purchaseConversionRate || 1;
      const basePrice = purchaseConversionRate > 0 ? purchasePrice / purchaseConversionRate : 0;

      const stmt = db.prepare(`
        UPDATE materials SET
          material_code = ?, bom_number = ?, material_name = ?, size_spec = ?,
          color = ?, material = ?, major_category = ?, middle_category = ?,
          minor_category = ?, model = ?, series = ?, source = ?,
          description = ?, material_image = ?, base_unit = ?, sale_unit = ?,
          sale_conversion_rate = ?, purchase_unit = ?, purchase_conversion_rate = ?,
          kg_per_pcs = ?, pcs_per_kg = ?, process_name = ?, standard_time = ?,
          quota_time = ?, process_price = ?, purchase_cycle = ?, purchase_price = ?,
          base_price = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        materialData.material_code || materialData.materialCode,
        materialData.bom_number || materialData.bomNumber || '',
        materialData.material_name || materialData.materialName,
        materialData.size_spec || materialData.sizeSpec || '',
        materialData.color || '',
        materialData.material || '',
        materialData.major_category || materialData.majorCategory || '',
        materialData.middle_category || materialData.middleCategory || '',
        materialData.minor_category || materialData.minorCategory || '',
        materialData.model || '',
        materialData.series || '',
        materialData.source ? (typeof materialData.source === 'string' ? materialData.source : JSON.stringify(materialData.source)) : '[]',
        materialData.description || '',
        materialData.material_image || materialData.materialImage || '',
        materialData.base_unit || materialData.baseUnit || '个',
        materialData.sale_unit || materialData.saleUnit || '',
        materialData.sale_conversion_rate || materialData.saleConversionRate || 1,
        materialData.purchase_unit || materialData.purchaseUnit || '',
        purchaseConversionRate,
        materialData.kg_per_pcs || materialData.kgPerPcs || 0,
        materialData.pcs_per_kg || materialData.pcsPerKg || 0,
        materialData.process_name || materialData.processName || '',
        materialData.standard_time || materialData.standardTime || 0,
        materialData.quota_time || materialData.quotaTime || 0,
        materialData.process_price || materialData.processPrice || 0,
        materialData.purchase_cycle || materialData.purchaseCycle || '',
        purchasePrice,
        basePrice,
        materialData.status || 'active',
        id
      );

      if (result.changes === 0) {
        throw new Error('物料不存在或未更新');
      }

      return { id };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('物料编码已存在');
      }
      throw new Error(`更新物料失败: ${error.message}`);
    }
  }

  // 删除物料
  static async deleteMaterial(id) {
    try {
      const stmt = db.prepare('DELETE FROM materials WHERE id = ?');
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error('物料不存在');
      }

      return { success: true };
    } catch (error) {
      throw new Error(`删除物料失败: ${error.message}`);
    }
  }

  // 批量删除物料
  static async deleteMaterials(ids) {
    try {
      // 开始事务
      db.exec('BEGIN TRANSACTION');

      const stmt = db.prepare('DELETE FROM materials WHERE id = ?');
      let successCount = 0;

      for (const id of ids) {
        const result = stmt.run(id);
        successCount += result.changes;
      }

      // 提交事务
      db.exec('COMMIT');

      return {
        successCount,
        totalCount: ids.length
      };
    } catch (error) {
      // 回滚事务
      db.exec('ROLLBACK');
      throw new Error(`批量删除物料失败: ${error.message}`);
    }
  }

  // 搜索物料
  static async searchMaterials(keyword) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM materials 
        WHERE material_code LIKE ? OR material_name LIKE ? OR description LIKE ?
        ORDER BY created_at DESC
      `);
      return stmt.all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    } catch (error) {
      throw new Error(`搜索物料失败: ${error.message}`);
    }
  }
}

module.exports = MaterialService;