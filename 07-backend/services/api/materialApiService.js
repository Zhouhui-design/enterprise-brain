const db = require('../../database/mysql');

class MaterialApiService {
  // 获取所有物料
  async getAllMaterials() {
    try {
      const sql = `
        SELECT * FROM materials 
        ORDER BY created_at DESC
      `;
      const materials = await db.query(sql);
      return materials;
    } catch (error) {
      console.error('获取物料列表失败:', error);
      throw error;
    }
  }

  // 根据ID获取物料
  async getMaterialById(id) {
    try {
      const sql = 'SELECT * FROM materials WHERE id = ?';
      const materials = await db.query(sql, [id]);
      return materials.length > 0 ? materials[0] : null;
    } catch (error) {
      console.error('获取物料详情失败:', error);
      throw error;
    }
  }

  // 创建物料
  async createMaterial(materialData) {
    try {
      const sql = `
        INSERT INTO materials (
          material_code, bom_number, material_name, size_spec, color, material,
          major_category, middle_category, minor_category, model, series,
          source, description, material_image, base_unit, sale_unit,
          sale_conversion_rate, purchase_unit, purchase_conversion_rate,
          kg_per_pcs, pcs_per_kg, process_name, standard_time,
          quota_time, minimum_packaging_quantity, process_price,
          purchase_cycle, purchase_price, base_price, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const params = [
        materialData.material_code,
        materialData.bom_number,
        materialData.material_name,
        materialData.size_spec,
        materialData.color,
        materialData.material,
        materialData.major_category,
        materialData.middle_category,
        materialData.minor_category,
        materialData.model,
        materialData.series,
        materialData.source,
        materialData.description,
        materialData.material_image,
        materialData.base_unit,
        materialData.sale_unit,
        materialData.sale_conversion_rate,
        materialData.purchase_unit,
        materialData.purchase_conversion_rate,
        materialData.kg_per_pcs,
        materialData.pcs_per_kg,
        materialData.process_name,
        materialData.standard_time,
        materialData.quota_time,
        materialData.minimum_packaging_quantity,
        materialData.process_price,
        materialData.purchase_cycle,
        materialData.purchase_price,
        materialData.base_price
      ];
      
      const result = await db.query(sql, params);
      return result.insertId;
    } catch (error) {
      console.error('创建物料失败:', error);
      throw error;
    }
  }

  // 更新物料
  async updateMaterial(id, materialData) {
    try {
      const sql = `
        UPDATE materials SET
          material_code = ?, bom_number = ?, material_name = ?, size_spec = ?, color = ?,
          material = ?, major_category = ?, middle_category = ?, minor_category = ?,
          model = ?, series = ?, source = ?, description = ?, material_image = ?,
          base_unit = ?, sale_unit = ?, sale_conversion_rate = ?, purchase_unit = ?,
          purchase_conversion_rate = ?, kg_per_pcs = ?, pcs_per_kg = ?,
          process_name = ?, standard_time = ?, quota_time = ?, minimum_packaging_quantity = ?,
          process_price = ?, purchase_cycle = ?, purchase_price = ?, base_price = ?,
          updated_at = NOW()
        WHERE id = ?
      `;
      
      const params = [
        materialData.material_code,
        materialData.bom_number,
        materialData.material_name,
        materialData.size_spec,
        materialData.color,
        materialData.material,
        materialData.major_category,
        materialData.middle_category,
        materialData.minor_category,
        materialData.model,
        materialData.series,
        materialData.source,
        materialData.description,
        materialData.material_image,
        materialData.base_unit,
        materialData.sale_unit,
        materialData.sale_conversion_rate,
        materialData.purchase_unit,
        materialData.purchase_conversion_rate,
        materialData.kg_per_pcs,
        materialData.pcs_per_kg,
        materialData.process_name,
        materialData.standard_time,
        materialData.quota_time,
        materialData.minimum_packaging_quantity,
        materialData.process_price,
        materialData.purchase_cycle,
        materialData.purchase_price,
        materialData.base_price,
        id
      ];
      
      const result = await db.query(sql, params);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新物料失败:', error);
      throw error;
    }
  }

  // 删除物料
  async deleteMaterial(id) {
    try {
      const sql = 'DELETE FROM materials WHERE id = ?';
      const result = await db.query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除物料失败:', error);
      throw error;
    }
  }

  // 批量删除物料
  async deleteMaterials(ids) {
    try {
      if (!ids || ids.length === 0) {
        return 0;
      }
      
      const placeholders = ids.map(() => '?').join(',');
      const sql = `DELETE FROM materials WHERE id IN (${placeholders})`;
      const result = await db.query(sql, ids);
      return result.affectedRows;
    } catch (error) {
      console.error('批量删除物料失败:', error);
      throw error;
    }
  }

  // 批量创建物料
  async batchCreateMaterials(materials) {
    try {
      if (!materials || materials.length === 0) {
        return { successCount: 0, errorCount: 0 };
      }

      let successCount = 0;
      let errorCount = 0;

      for (const materialData of materials) {
        try {
          await this.createMaterial(materialData);
          successCount++;
        } catch (error) {
          console.error('创建物料失败:', error);
          errorCount++;
        }
      }

      return { successCount, errorCount };
    } catch (error) {
      console.error('批量创建物料失败:', error);
      throw error;
    }
  }
}

module.exports = new MaterialApiService();