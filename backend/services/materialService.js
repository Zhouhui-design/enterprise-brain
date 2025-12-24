const { pool } = require('../config/database');
const materialSupplierService = require('./materialSupplierService'); // ✅ 引入物料供货商服务
const { logger } = require('../config/logger');

class MaterialService {
  // 获取所有物料
  static async getAllMaterials() {
    try {
      logger.info('开始获取所有物料');
      const [rows] = await pool.execute('SELECT * FROM materials ORDER BY created_at DESC');
      
      logger.info(`成功获取到${rows.length}条物料数据`);
      
      // ✅ 字段名转换：下划线转驼峰
      return rows.map(row => ({
        ...row,
        materialCode: row.material_code,
        bomNumber: row.bom_number,
        materialName: row.material_name,
        sizeSpec: row.size_spec,
        majorCategory: row.major_category,
        middleCategory: row.middle_category,
        minorCategory: row.minor_category,
        materialImage: row.material_image,
        baseUnit: row.base_unit,
        saleUnit: row.sale_unit,
        saleConversionRate: row.sale_conversion_rate,
        purchaseUnit: row.purchase_unit,
        purchaseConversionRate: row.purchase_conversion_rate,
        kgPerPcs: row.kg_per_pcs,
        pcsPerKg: row.pcs_per_kg,
        processName: row.process_name,
        standardTime: row.standard_time,  // ✅ 关键: 定时工额
        quotaTime: row.quota_time,        // ✅ 关键: 定额工时
        minimumPackagingQuantity: parseFloat(row.minimum_packaging_quantity) || 1,  // ✅ 新增：最小包装量
        processPrice: row.process_price,
        purchaseCycle: row.purchase_cycle,
        purchasePrice: row.purchase_price,
        basePrice: row.base_price,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      logger.error('获取物料列表失败', { error: error.message, stack: error.stack });
      throw new Error(`获取物料列表失败: ${error.message}`);
    }
  }

  // 根据ID获取物料
  static async getMaterialById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM materials WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      
      // ✅ 字段名转换：下划线转驼峰
      const row = rows[0];
      const material = {
        ...row,
        materialCode: row.material_code,
        bomNumber: row.bom_number,
        materialName: row.material_name,
        sizeSpec: row.size_spec,
        majorCategory: row.major_category,
        middleCategory: row.middle_category,
        minorCategory: row.minor_category,
        materialImage: row.material_image,
        baseUnit: row.base_unit,
        saleUnit: row.sale_unit,
        saleConversionRate: row.sale_conversion_rate,
        purchaseUnit: row.purchase_unit,
        purchaseConversionRate: row.purchase_conversion_rate,
        kgPerPcs: row.kg_per_pcs,
        pcsPerKg: row.pcs_per_kg,
        processName: row.process_name,
        standardTime: row.standard_time,
        quotaTime: row.quota_time,
        minimumPackagingQuantity: parseFloat(row.minimum_packaging_quantity) || 1,  // ✅ 关键：最小包装量
        processPrice: row.process_price,
        purchaseCycle: row.purchase_cycle,
        purchasePrice: row.purchase_price,
        basePrice: row.base_price,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      // ✅ 获取物料供货商信息
      material.suppliers = await materialSupplierService.getByMaterialCode(material.materialCode);
      
      return material;
    } catch (error) {
      throw new Error(`获取物料失败: ${error.message}`);
    }
  }

  // 根据物料编码获取物料
  static async getMaterialByCode(materialCode) {
    try {
      const [rows] = await pool.execute('SELECT * FROM materials WHERE material_code = ?', [materialCode]);
      if (rows.length === 0) return null;
      
      // ✅ 字段名转换：下划线转驼峰
      const row = rows[0];
      const material = {
        ...row,
        materialCode: row.material_code,
        bomNumber: row.bom_number,
        materialName: row.material_name,
        sizeSpec: row.size_spec,
        majorCategory: row.major_category,
        middleCategory: row.middle_category,
        minorCategory: row.minor_category,
        materialImage: row.material_image,
        baseUnit: row.base_unit,
        saleUnit: row.sale_unit,
        saleConversionRate: row.sale_conversion_rate,
        purchaseUnit: row.purchase_unit,
        purchaseConversionRate: row.purchase_conversion_rate,
        kgPerPcs: row.kg_per_pcs,
        pcsPerKg: row.pcs_per_kg,
        processName: row.process_name,
        standardTime: row.standard_time,
        quotaTime: row.quota_time,
        minimumPackagingQuantity: parseFloat(row.minimum_packaging_quantity) || 1,  // ✅ 关键：最小包装量
        processPrice: row.process_price,
        purchaseCycle: row.purchase_cycle,
        purchasePrice: row.purchase_price,
        basePrice: row.base_price,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      // ✅ 获取物料供货商信息
      material.suppliers = await materialSupplierService.getByMaterialCode(materialCode);
      
      return material;
    } catch (error) {
      throw new Error(`获取物料失败: ${error.message}`);
    }
  }

  // 创建物料
  static async createMaterial(materialData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 计算基础单价
      const purchasePrice = materialData.purchase_price || materialData.purchasePrice || 0;
      const purchaseConversionRate = materialData.purchase_conversion_rate || materialData.purchaseConversionRate || 1;
      const basePrice = purchaseConversionRate > 0 ? purchasePrice / purchaseConversionRate : 0;

      const sql = `
        INSERT INTO materials (
          material_code, bom_number, material_name, size_spec, color, material,
          major_category, middle_category, minor_category, model, series, source,
          description, material_image, base_unit, sale_unit, sale_conversion_rate,
          purchase_unit, purchase_conversion_rate, kg_per_pcs, pcs_per_kg,
          process_name, standard_time, quota_time, process_price,
          purchase_cycle, purchase_price, base_price, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.execute(sql, [
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
      ]);
      
      // ✅ 处理供货商信息
      const materialCode = materialData.material_code || materialData.materialCode;
      if (materialData.suppliers && Array.isArray(materialData.suppliers) && materialData.suppliers.length > 0) {
        // 为每个供货商信息添加物料编码和序号
        const suppliersWithCode = materialData.suppliers.map((supplier, index) => ({
          ...supplier,
          materialCode: materialCode,
          sequence: index
        }));
        
        await materialSupplierService.createBatch(suppliersWithCode);
      }

      await connection.commit();
      return { id: result.insertId };
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('物料编码已存在');
      }
      throw new Error(`创建物料失败: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // 批量创建物料
  static async createMaterials(materialsData) {
    console.log(`========== 开始批量导入物料 ==========`)
    console.log(`接收到 ${materialsData.length} 条数据`)
    
    const connection = await pool.getConnection();
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
      await connection.beginTransaction();
      console.log('事务已开始')

      for (const materialData of materialsData) {
        try {
          const materialCode = materialData.material_code || materialData.materialCode;
          
          // 计算基础单价
          const purchasePrice = materialData.purchase_price || materialData.purchasePrice || 0;
          const purchaseConversionRate = materialData.purchase_conversion_rate || materialData.purchaseConversionRate || 1;
          const basePrice = purchaseConversionRate > 0 ? purchasePrice / purchaseConversionRate : 0;
          
          // 检查物料编码是否已存在
          const [existing] = await connection.execute(
            'SELECT id FROM materials WHERE material_code = ?',
            [materialCode]
          );
          
          if (existing.length > 0) {
            // 更新现有物料
            console.log(`更新物料: ${materialCode}`)
            const updateSql = `
              UPDATE materials SET
                bom_number = ?, material_name = ?, size_spec = ?,
                color = ?, material = ?, major_category = ?, middle_category = ?,
                minor_category = ?, model = ?, series = ?, source = ?,
                description = ?, material_image = ?, base_unit = ?, sale_unit = ?,
                sale_conversion_rate = ?, purchase_unit = ?, purchase_conversion_rate = ?,
                kg_per_pcs = ?, pcs_per_kg = ?, process_name = ?, standard_time = ?,
                quota_time = ?, process_price = ?, purchase_cycle = ?, purchase_price = ?,
                base_price = ?, status = ?
              WHERE material_code = ?
            `;
            
            await connection.execute(updateSql, [
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
            ]);
          } else {
            // 插入新物料
            console.log(`新增物料: ${materialCode}`)
            const insertSql = `
              INSERT INTO materials (
                material_code, bom_number, material_name, size_spec, color, material,
                major_category, middle_category, minor_category, model, series, source,
                description, material_image, base_unit, sale_unit, sale_conversion_rate,
                purchase_unit, purchase_conversion_rate, kg_per_pcs, pcs_per_kg,
                process_name, standard_time, quota_time, minimum_packaging_quantity, process_price,
                purchase_cycle, purchase_price, base_price, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            await connection.execute(insertSql, [
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
              materialData.minimum_packaging_quantity || materialData.minimumPackagingQuantity || 1,  // ✅ 新增
              materialData.process_price || materialData.processPrice || 0,
              materialData.purchase_cycle || materialData.purchaseCycle || '',
              purchasePrice,
              basePrice,
              materialData.status || 'active'
            ]);
          }
          successCount++;
        } catch (error) {
          console.error(`处理物料 ${materialData.material_code} 失败:`, error.message)
          errorCount++;
          errors.push({
            materialCode: materialData.material_code || materialData.materialCode,
            error: error.message
          });
        }
      }

      await connection.commit();
      console.log(`事务已提交: 成功 ${successCount} 条, 失败 ${errorCount} 条`)
      console.log(`========== 批量导入完成 ==========`)
      return { successCount, errorCount, errors };
    } catch (error) {
      await connection.rollback();
      console.error(`批量导入失败，事务已回滚:`, error.message)
      throw new Error(`批量创建物料失败: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // 更新物料
  static async updateMaterial(id, materialData) {
    logger.info(`开始更新物料，ID: ${id}`);
    logger.debug('更新物料数据:', materialData);
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 计算基础单价
      const purchasePrice = materialData.purchase_price || materialData.purchasePrice || 0;
      const purchaseConversionRate = materialData.purchase_conversion_rate || materialData.purchaseConversionRate || 1;
      const basePrice = purchaseConversionRate > 0 ? purchasePrice / purchaseConversionRate : 0;

      const sql = `
        UPDATE materials SET
          material_code = ?, bom_number = ?, material_name = ?, size_spec = ?,
          color = ?, material = ?, major_category = ?, middle_category = ?,
          minor_category = ?, model = ?, series = ?, source = ?,
          description = ?, material_image = ?, base_unit = ?, sale_unit = ?,
          sale_conversion_rate = ?, purchase_unit = ?, purchase_conversion_rate = ?,
          kg_per_pcs = ?, pcs_per_kg = ?, process_name = ?, standard_time = ?,
          quota_time = ?, minimum_packaging_quantity = ?, process_price = ?, purchase_cycle = ?, purchase_price = ?,
          base_price = ?, status = ?
        WHERE id = ?
      `;

      const [result] = await connection.execute(sql, [
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
        materialData.minimum_packaging_quantity || materialData.minimumPackagingQuantity || 1,
        materialData.process_price || materialData.processPrice || 0,
        materialData.purchase_cycle || materialData.purchaseCycle || '',
        purchasePrice,
        basePrice,
        materialData.status || 'active',
        id
      ]);

      if (result.affectedRows === 0) {
        logger.warn(`物料不存在或未更新，ID: ${id}`);
        throw new Error('物料不存在或未更新');
      }
      
      logger.info(`成功更新物料，ID: ${id}，影响行数: ${result.affectedRows}`);
      
      // ✅ 处理供货商信息更新（简化版，仅更新基本物料信息，不处理供货商）
      await connection.commit();
      logger.info(`物料更新事务提交成功，ID: ${id}`);
      return { id };
    } catch (error) {
      await connection.rollback();
      logger.error(`更新物料失败，ID: ${id}`, { error: error.message, stack: error.stack });
      
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('物料编码已存在');
      }
      throw new Error(`更新物料失败: ${error.message}`);
    } finally {
      connection.release();
      logger.info(`数据库连接已释放，ID: ${id}`);
    }
  }

  // 删除物料
  static async deleteMaterial(id) {
    try {
      const [result] = await pool.execute('DELETE FROM materials WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        throw new Error('物料不存在');
      }

      return { success: true };
    } catch (error) {
      throw new Error(`删除物料失败: ${error.message}`);
    }
  }

  // 批量删除物料
  static async deleteMaterials(ids) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let successCount = 0;
      for (const id of ids) {
        const [result] = await connection.execute('DELETE FROM materials WHERE id = ?', [id]);
        successCount += result.affectedRows;
      }

      await connection.commit();
      return { successCount, totalCount: ids.length };
    } catch (error) {
      await connection.rollback();
      throw new Error(`批量删除物料失败: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // 搜索物料
  static async searchMaterials(keyword) {
    try {
      const sql = `
        SELECT * FROM materials 
        WHERE material_code LIKE ? OR material_name LIKE ? OR description LIKE ?
        ORDER BY created_at DESC
      `;
      const [rows] = await pool.execute(sql, [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]);
      return rows;
    } catch (error) {
      throw new Error(`搜索物料失败: ${error.message}`);
    }
  }
}

module.exports = MaterialService;
