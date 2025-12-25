const { pool } = require('../config/database');

/**
 * MRP物料需求服务
 */
class MRPDemandService {
  /**
   * 保存产品需求数据（表格1）
   */
  static async saveProductDemands(demands) {
    try {
      const results = [];

      for (const demand of demands) {
        // 检查是否已存在（根据MRP编码）
        const [existing] = await pool.execute('SELECT id FROM mrp_product_demands WHERE mrp_code = ?', [
          demand.mrpCode,
        ]);

        if (existing.length > 0) {
          // 更新已有记录
          await pool.execute(
            `
            UPDATE mrp_product_demands SET
              source_no = ?,
              material_code = ?,
              material_name = ?,
              material_unit = ?,
              source_type = ?,
              demand_qty = ?,
              required_date = ?,
              current_stock = ?,
              in_transit_stock = ?,
              in_production_stock = ?,
              production_reserved_stock = ?,
              to_be_shipped_stock = ?,
              suggested_qty = ?,
              adjusted_qty = ?,
              execute_qty = ?,
              updated_at = NOW()
            WHERE mrp_code = ?
          `,
            [
              demand.sourceNo,
              demand.materialCode,
              demand.materialName,
              demand.materialUnit,
              demand.sourceType,
              demand.demandQty,
              demand.requiredDate,
              demand.currentStock || 0,
              demand.inTransitStock || 0,
              demand.inProductionStock || 0,
              demand.productionReservedStock || 0,
              demand.toBeShippedStock || 0,
              demand.suggestedQty || 0,
              demand.adjustedQty || 0,
              demand.executeQty || 0,
              demand.mrpCode,
            ],
          );

          results.push({ mrpCode: demand.mrpCode, action: 'updated' });
        } else {
          // 插入新记录
          const [result] = await pool.execute(
            `
            INSERT INTO mrp_product_demands (
              mrp_code, source_no, material_code, material_name, material_unit,
              source_type, demand_qty, required_date, current_stock,
              in_transit_stock, in_production_stock, production_reserved_stock,
              to_be_shipped_stock, suggested_qty, adjusted_qty, execute_qty,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `,
            [
              demand.mrpCode,
              demand.sourceNo,
              demand.materialCode,
              demand.materialName,
              demand.materialUnit,
              demand.sourceType,
              demand.demandQty,
              demand.requiredDate,
              demand.currentStock || 0,
              demand.inTransitStock || 0,
              demand.inProductionStock || 0,
              demand.productionReservedStock || 0,
              demand.toBeShippedStock || 0,
              demand.suggestedQty || 0,
              demand.adjustedQty || 0,
              demand.executeQty || 0,
            ],
          );

          results.push({ mrpCode: demand.mrpCode, action: 'created', id: result.insertId });
        }
      }

      return results;
    } catch (error) {
      console.error('保存产品需求失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有产品需求数据
   */
  static async getProductDemands() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          id, mrp_code as mrpCode, source_no as sourceNo,
          material_code as materialCode, material_name as materialName,
          material_unit as materialUnit, source_type as sourceType,
          demand_qty as demandQty, required_date as requiredDate,
          current_stock as currentStock, in_transit_stock as inTransitStock,
          in_production_stock as inProductionStock,
          production_reserved_stock as productionReservedStock,
          to_be_shipped_stock as toBeShippedStock,
          suggested_qty as suggestedQty, adjusted_qty as adjustedQty,
          execute_qty as executeQty,
          created_at as createdAt, updated_at as updatedAt
        FROM mrp_product_demands
        ORDER BY created_at DESC
      `);

      return rows;
    } catch (error) {
      console.error('获取产品需求失败:', error);
      throw error;
    }
  }

  /**
   * 保存物料需求数据（表格2）
   */
  static async saveMaterialDemands(demands) {
    try {
      console.log('\n📦 开始保存物料需求:', demands.length, '条');

      const results = [];

      for (const demand of demands) {
        console.log('🔍 处理物料:', {
          sourceMrpCode: demand.sourceMrpCode,
          materialCode: demand.materialCode,
          level: demand.level,
        });

        // 检查是否已存在（根据来源MRP编号+物料编码+层级）
        const [existing] = await pool.execute(
          'SELECT id FROM mrp_material_demands WHERE source_mrp_code = ? AND material_code = ? AND level = ?',
          [demand.sourceMrpCode, demand.materialCode, demand.level || 1],
        );

        if (existing.length > 0) {
          console.log('✅ 更新已有记录, ID:', existing[0].id);
          // 更新已有记录
          await pool.execute(
            `
            UPDATE mrp_material_demands SET
              material_name = ?,
              material_unit = ?,
              source_type = ?,
              demand_qty = ?,
              required_date = ?,
              current_stock = ?,
              in_transit_stock = ?,
              in_production_stock = ?,
              production_reserved_stock = ?,
              to_be_shipped_stock = ?,
              suggested_qty = ?,
              adjusted_qty = ?,
              execute_qty = ?,
              output_process = ?,
              component_source = ?,
              updated_at = NOW()
            WHERE source_mrp_code = ? AND material_code = ? AND level = ?
          `,
            [
              demand.materialName,
              demand.materialUnit,
              demand.sourceType,
              demand.demandQty,
              demand.requiredDate || null,
              demand.currentStock || 0,
              demand.inTransitStock || 0,
              demand.inProductionStock || 0,
              demand.productionReservedStock || 0,
              demand.toBeShippedStock || 0,
              demand.suggestedQty || 0,
              demand.adjustedQty || 0,
              demand.executeQty || 0,
              demand.outputProcess || '',
              demand.componentSource || '',
              demand.sourceMrpCode,
              demand.materialCode,
              demand.level || 1,
            ],
          );

          results.push({
            sourceMrpCode: demand.sourceMrpCode,
            materialCode: demand.materialCode,
            action: 'updated',
          });
        } else {
          console.log('➕ 插入新记录');
          // 插入新记录
          const [result] = await pool.execute(
            `
            INSERT INTO mrp_material_demands (
              source_mrp_code, material_code, material_name, material_unit,
              source_type, demand_qty, required_date, current_stock,
              in_transit_stock, in_production_stock, production_reserved_stock,
              to_be_shipped_stock, suggested_qty, adjusted_qty, execute_qty,
              level, output_process, component_source,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `,
            [
              demand.sourceMrpCode,
              demand.materialCode,
              demand.materialName,
              demand.materialUnit,
              demand.sourceType,
              demand.demandQty,
              demand.requiredDate || null,
              demand.currentStock || 0,
              demand.inTransitStock || 0,
              demand.inProductionStock || 0,
              demand.productionReservedStock || 0,
              demand.toBeShippedStock || 0,
              demand.suggestedQty || 0,
              demand.adjustedQty || 0,
              demand.executeQty || 0,
              demand.level || 1,
              demand.outputProcess || '',
              demand.componentSource || '',
            ],
          );

          results.push({
            sourceMrpCode: demand.sourceMrpCode,
            materialCode: demand.materialCode,
            action: 'created',
            id: result.insertId,
          });
        }
      }

      console.log('✅ 所有物料需求保存成功\n');
      return results;
    } catch (error) {
      console.error('❌ 保存物料需求失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有物料需求数据
   */
  static async getMaterialDemands() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          id, source_mrp_code as sourceMrpCode,
          material_code as materialCode, material_name as materialName,
          material_unit as materialUnit, source_type as sourceType,
          demand_qty as demandQty, required_date as requiredDate,
          current_stock as currentStock, in_transit_stock as inTransitStock,
          in_production_stock as inProductionStock,
          production_reserved_stock as productionReservedStock,
          to_be_shipped_stock as toBeShippedStock,
          suggested_qty as suggestedQty, adjusted_qty as adjustedQty,
          execute_qty as executeQty, level, output_process as outputProcess,
          component_source as componentSource,
          created_at as createdAt, updated_at as updatedAt
        FROM mrp_material_demands
        ORDER BY created_at DESC
      `);

      return rows;
    } catch (error) {
      console.error('获取物料需求失败:', error);
      throw error;
    }
  }

  /**
   * 删除产品需求
   */
  static async deleteProductDemand(mrpCode) {
    try {
      await pool.execute('DELETE FROM mrp_product_demands WHERE mrp_code = ?', [mrpCode]);
      return { success: true };
    } catch (error) {
      console.error('删除产品需求失败:', error);
      throw error;
    }
  }

  /**
   * 删除物料需求
   */
  static async deleteMaterialDemand(id) {
    try {
      await pool.execute('DELETE FROM mrp_material_demands WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      console.error('删除物料需求失败:', error);
      throw error;
    }
  }
}

module.exports = MRPDemandService;
