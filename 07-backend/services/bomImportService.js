const db = require('../database/mysql');
const materialApiService = require('./api/materialApiService');

class BOMImportService {
  
  /**
   * 导入BOM数据
   * @param {Array} jsonData - Excel解析的JSON数据
   * @param {Object} options - 导入选项
   * @returns {Object} 导入结果
   */
  async importBOMData(jsonData, options = {}) {
    const { skipDuplicates = false, userId = 'system' } = options;
    
    const result = {
      success: 0,
      error: 0,
      warnings: [],
      errors: []
    };

    try {
      const conn = await db.getConnection();
      
      for (let i = 0; i < jsonData.length; i++) {
        try {
          const rowData = jsonData[i];
          const rowNum = i + 1;
          
          // 验证必需字段
          const validation = this.validateRowData(rowData, rowNum);
          if (!validation.isValid) {
            result.error++;
            result.errors.push(...validation.errors);
            continue;
          }

          // 检查重复
          if (!skipDuplicates) {
            const exists = await this.checkBOMExists(conn, rowData.bomCode, rowData.productCode);
            if (exists) {
              result.warnings.push(`第${rowNum}行：BOM编号${rowData.bomCode}已存在，已跳过`);
              continue;
            }
          }

          // 开始事务
          await conn.beginTransaction();

          try {
            // 插入或更新BOM主表
            const bomId = await this.insertOrUpdateBOM(conn, rowData, userId);
            
            // 处理子件数据
            if (rowData.children && Array.isArray(rowData.children)) {
              for (let j = 0; j < rowData.children.length; j++) {
                const childData = rowData.children[j];
                const childRowNum = `${rowNum}-${j + 1}`;
                
                // 验证子件数据
                const childValidation = this.validateChildData(childData, childRowNum);
                if (!childValidation.isValid) {
                  result.warnings.push(...childValidation.errors);
                  continue;
                }

                await this.insertChildBOM(conn, bomId, childData, j + 1);
              }
            }

            await conn.commit();
            result.success++;
            
          } catch (childError) {
            await conn.rollback();
            throw childError;
          }

        } catch (rowError) {
          console.error(`处理第${i + 1}行数据失败:`, rowError);
          result.error++;
          result.errors.push(`第${i + 1}行：${rowError.message}`);
        }
      }

      conn.release();
      
    } catch (error) {
      console.error('导入BOM数据失败:', error);
      throw error;
    }

    return result;
  }

  /**
   * 验证行数据
   */
  validateRowData(rowData, rowNum) {
    const errors = [];
    
    if (!rowData.bomCode || rowData.bomCode.toString().trim() === '') {
      errors.push(`第${rowNum}行：BOM编号不能为空`);
    }
    
    if (!rowData.bomName || rowData.bomName.toString().trim() === '') {
      errors.push(`第${rowNum}行：BOM名称不能为空`);
    }
    
    if (!rowData.productCode || rowData.productCode.toString().trim() === '') {
      errors.push(`第${rowNum}行：产品编号不能为空`);
    }
    
    if (!rowData.productName || rowData.productName.toString().trim() === '') {
      errors.push(`第${rowNum}行：产品名称不能为空`);
    }

    // 验证版本号格式
    if (rowData.version && !/^V\d+(\.\d+)?$/.test(rowData.version.toString().trim())) {
      errors.push(`第${rowNum}行：版本号格式不正确，应为V1.0格式`);
    }

    // 验证物料数量
    if (rowData.itemCount && (isNaN(rowData.itemCount) || parseFloat(rowData.itemCount) <= 0)) {
      errors.push(`第${rowNum}行：物料数量必须为正数`);
    }

    // 验证日期格式
    if (rowData.effectiveDate && !this.isValidDate(rowData.effectiveDate)) {
      errors.push(`第${rowNum}行：生效日期格式不正确`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证子件数据
   */
  validateChildData(childData, childRowNum) {
    const errors = [];
    
    if (!childData.childCode || childData.childCode.toString().trim() === '') {
      errors.push(`子件第${childRowNum}行：子件编码不能为空`);
    }
    
    if (!childData.childName || childData.childName.toString().trim() === '') {
      errors.push(`子件第${childRowNum}行：子件名称不能为空`);
    }
    
    if (!childData.standardQty || isNaN(childData.standardQty) || parseFloat(childData.standardQty) <= 0) {
      errors.push(`子件第${childRowNum}行：标准用量必须为正数`);
    }

    // 验证层阶
    if (childData.level && (isNaN(childData.level) || parseInt(childData.level) < 1)) {
      errors.push(`子件第${childRowNum}行：层阶必须为正整数`);
    }

    // 验证百分比字段
    if (childData.materialLoss && (isNaN(childData.materialLoss) || parseFloat(childData.materialLoss) < 0)) {
      errors.push(`子件第${childRowNum}行：材料损耗率不能为负数`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 检查BOM是否已存在
   */
  async checkBOMExists(conn, bomCode, productCode) {
    const [rows] = await conn.execute(`
      SELECT id FROM production_boms 
      WHERE bom_code = ? OR product_code = ?
      LIMIT 1
    `, [bomCode, productCode]);
    
    return rows.length > 0;
  }

  /**
   * 插入或更新BOM
   */
  async insertOrUpdateBOM(conn, rowData, userId) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // 检查是否已存在
    const [existingRows] = await conn.execute(`
      SELECT id FROM production_boms WHERE bom_code = ? LIMIT 1
    `, [rowData.bomCode]);
    
    if (existingRows.length > 0) {
      // 更新现有记录
      await conn.execute(`
        UPDATE production_boms SET
          bom_name = ?, product_code = ?, product_name = ?, version = ?, 
          status = ?, designer = ?, reviewer = ?, item_count = ?,
          effective_date = ?, remark = ?, total_labor = ?, total_material = ?,
          update_time = ?, update_user = ?
        WHERE bom_code = ?
      `, [
        rowData.bomName, rowData.productCode, rowData.productName, rowData.version || 'V1.0',
        rowData.status || 'draft', rowData.designer || '', rowData.reviewer || '', 
        rowData.itemCount || 1, rowData.effectiveDate || null, rowData.remark || '',
        rowData.totalLabor || 0, rowData.totalMaterial || 0,
        now, userId, rowData.bomCode
      ]);
      
      return existingRows[0].id;
    } else {
      // 插入新记录
      const [result] = await conn.execute(`
        INSERT INTO production_boms (
          bom_code, bom_name, product_code, product_name, version, status,
          designer, reviewer, item_count, effective_date, remark,
          total_labor, total_material, create_time, create_user
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        rowData.bomCode, rowData.bomName, rowData.productCode, rowData.productName, 
        rowData.version || 'V1.0', rowData.status || 'draft',
        rowData.designer || '', rowData.reviewer || '', rowData.itemCount || 1,
        rowData.effectiveDate || null, rowData.remark || '',
        rowData.totalLabor || 0, rowData.totalMaterial || 0,
        now, userId
      ]);
      
      return result.insertId;
    }
  }

  /**
   * 插入子件BOM数据
   */
  async insertChildBOM(conn, bomId, childData, sequence) {
    await conn.execute(`
      INSERT INTO production_bom_children (
        bom_id, child_code, child_name, level, level_path, standard_qty,
        output_process, source, process_wage, material_loss, material_price,
        next_product_source, next_process_name, next_product_code, next_product_name,
        next_standard_qty, next_level_address, sequence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      bomId,
      childData.childCode,
      childData.childName,
      childData.level || 1,
      childData.levelPath || '',
      childData.standardQty,
      childData.outputProcess || '',
      childData.source || '',
      childData.processWage || 0,
      childData.materialLoss || 0,
      childData.materialPrice || 0,
      childData.nextProductSource || '',
      childData.nextProcessName || '',
      childData.nextProductCode || '',
      childData.nextProductName || '',
      childData.nextStandardQty || 1,
      childData.nextLevelAddress || '',
      sequence
    ]);
  }

  /**
   * 导出BOM数据
   */
  async exportBOMData(bomIds = null) {
    try {
      const conn = await db.getConnection();
      
      let query = `
        SELECT 
          bom_code, bom_name, product_code, product_name, version, status,
          designer, reviewer, item_count, effective_date, remark,
          total_labor, total_material, create_time, update_time
        FROM production_boms
      `;
      let params = [];
      
      if (bomIds && bomIds.length > 0) {
        query += ` WHERE id IN (${bomIds.map(() => '?').join(',')})`;
        params = bomIds;
      }
      
      query += ` ORDER BY create_time DESC`;
      
      const [bomRows] = await conn.execute(query, params);
      
      const bomData = bomRows.map(row => ({
        bomCode: row.bom_code,
        bomName: row.bom_name,
        productCode: row.product_code,
        productName: row.product_name,
        version: row.version,
        status: row.status,
        designer: row.designer,
        reviewer: row.reviewer,
        itemCount: row.item_count,
        effectiveDate: row.effective_date,
        remark: row.remark,
        totalLabor: row.total_labor,
        totalMaterial: row.total_material,
        createTime: row.create_time,
        updateTime: row.update_time
      }));

      // 获取子件数据
      let childrenQuery = `
        SELECT 
          bom_id, child_code, child_name, level, level_path, standard_qty,
          output_process, source, process_wage, material_loss, material_price,
          next_product_source, next_process_name, next_product_code, next_product_name,
          next_standard_qty, next_level_address, sequence
        FROM production_bom_children
      `;
      let childrenParams = [];
      
      if (bomIds && bomIds.length > 0) {
        // 获取对应的BOM ID
        const [idRows] = await conn.execute(`
          SELECT id FROM production_boms WHERE bom_code IN (${bomIds.map(() => '?').join(',')})
        `, bomIds);
        
        if (idRows.length > 0) {
          childrenQuery += ` WHERE bom_id IN (${idRows.map(() => '?').join(',')})`;
          childrenParams = idRows.map(row => row.id);
        }
      }
      
      childrenQuery += ` ORDER BY bom_id, sequence`;
      
      const [childrenRows] = await conn.execute(childrenQuery, childrenParams);
      
      const childrenData = childrenRows.map(row => ({
        bomId: row.bom_id,
        childCode: row.child_code,
        childName: row.child_name,
        level: row.level,
        levelPath: row.level_path,
        standardQty: row.standard_qty,
        outputProcess: row.output_process,
        source: row.source,
        processWage: row.process_wage,
        materialLoss: row.material_loss,
        materialPrice: row.material_price,
        nextProductSource: row.next_product_source,
        nextProcessName: row.next_process_name,
        nextProductCode: row.next_product_code,
        nextProductName: row.next_product_name,
        nextStandardQty: row.next_standard_qty,
        nextLevelAddress: row.next_level_address,
        sequence: row.sequence
      }));

      conn.release();

      return {
        bomData,
        childrenData
      };

    } catch (error) {
      console.error('导出BOM数据失败:', error);
      throw error;
    }
  }

  /**
   * 生成导入模板
   */
  async generateImportTemplate() {
    try {
      const materials = await materialApiService.getAllMaterials();
      
      const template = [
        {
          'BOM编号': 'PBOM-2024-001',
          'BOM名称': '示例BOM',
          '产品编号': 'P001',
          '产品名称': '示例产品',
          '版本号': 'V1.0',
          '状态': 'draft',
          '设计人员': '张三',
          '审核人员': '李四',
          '物料数量': 10,
          '生效日期': '2024-01-01',
          '备注': '示例备注',
          '总人工': 100.00,
          '总材料': 200.00,
          '子件数据': JSON.stringify([
            {
              '子件编码': 'C001',
              '子件名称': '子件1',
              '层阶': 1,
              '层阶地址': '1',
              '标准用量': 2,
              '产出工序': '工序1',
              '子件来源': '自制',
              '工序工资': 50.00,
              '材料损耗': 5.00,
              '材料单价': 25.00,
              '后道产品来源': '自制',
              '后道工序名称': '工序2',
              '后道工序产品编号': 'P002',
              '后道工序产品名称': '产品2',
              '后道0阶标准用量': 1,
              '后道产品层阶地址': '1.1'
            }
          ])
        }
      ];

      return template;

    } catch (error) {
      console.error('生成导入模板失败:', error);
      throw error;
    }
  }

  /**
   * 预览导入数据
   */
  async previewImportData(jsonData) {
    const result = {
      summary: {
        total: jsonData.length,
        success: 0,
        error: 0,
        warning: 0
      },
      errors: [],
      warnings: [],
      preview: []
    };

    for (let i = 0; i < jsonData.length; i++) {
      const rowData = jsonData[i];
      const rowNum = i + 1;
      
      // 验证数据
      const validation = this.validateRowData(rowData, rowNum);
      
      if (validation.isValid) {
        result.summary.success++;
        result.preview.push({
          rowNum,
          bomCode: rowData.bomCode,
          bomName: rowData.bomName,
          productCode: rowData.productCode,
          productName: rowData.productName,
          status: '验证通过'
        });
      } else {
        result.summary.error++;
        result.errors.push(...validation.errors);
      }
    }

    return result;
  }

  /**
   * 验证导入数据
   */
  async validateImportData(jsonData) {
    const result = {
      isValid: true,
      errors: [],
      duplicates: []
    };

    try {
      const conn = await db.getConnection();
      
      // 检查重复的BOM编号
      const bomCodes = jsonData.map(row => row.bomCode).filter(code => code);
      const duplicates = new Set();
      
      for (const bomCode of bomCodes) {
        if (duplicates.has(bomCode)) {
          result.errors.push(`BOM编号${bomCode}在导入数据中重复`);
          result.isValid = false;
        }
        duplicates.add(bomCode);
      }

      // 检查数据库中已存在的BOM编号
      for (const bomCode of bomCodes) {
        const [rows] = await conn.execute(`
          SELECT bom_code FROM production_boms WHERE bom_code = ? LIMIT 1
        `, [bomCode]);
        
        if (rows.length > 0) {
          result.duplicates.push({
            bomCode,
            message: `BOM编号${bomCode}已存在于数据库中`
          });
        }
      }

      conn.release();

    } catch (error) {
      console.error('验证导入数据失败:', error);
      throw error;
    }

    return result;
  }

  /**
   * 验证日期格式
   */
  isValidDate(dateString) {
    if (!dateString) return true; // 空日期是有效的
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}

module.exports = new BOMImportService();
