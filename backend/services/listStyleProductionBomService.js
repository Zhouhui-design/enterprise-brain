const { pool } = require('../config/database');

class ListStyleProductionBomService {
  /**
   * 获取列表式生产BOM列表
   */
  static async getListStyleBomList(params = {}) {
    try {
      const { page = 1, pageSize = 20, bomCode, parentCode, parentName, status } = params;
      const offset = (page - 1) * pageSize;
      
      let whereClause = 'WHERE 1=1';
      const queryParams = [];
      
      if (bomCode) {
        whereClause += ' AND bom_code LIKE ?';
        queryParams.push(`%${bomCode}%`);
      }
      
      if (parentCode) {
        whereClause += ' AND parent_code LIKE ?';
        queryParams.push(`%${parentCode}%`);
      }
      
      if (parentName) {
        whereClause += ' AND parent_name LIKE ?';
        queryParams.push(`%${parentName}%`);
      }
      
      if (status) {
        whereClause += ' AND status = ?';
        queryParams.push(status);
      }
      
      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM list_style_production_boms ${whereClause}`;
      const [countResult] = await pool.execute(countSql, queryParams);
      const total = countResult[0].total;
      
      // 获取数据
      const limitValue = Math.max(1, parseInt(pageSize) || 20);
      const offsetValue = Math.max(0, parseInt(offset) || 0);
      
      const [rows] = await pool.execute(
        `SELECT * FROM list_style_production_boms ${whereClause} ORDER BY created_at DESC LIMIT ${limitValue} OFFSET ${offsetValue}`,
        queryParams
      );
      
      // 获取子件信息
      for (const row of rows) {
        const [children] = await pool.execute(
          'SELECT * FROM list_style_bom_children WHERE parent_id = ? ORDER BY child_sequence',
          [row.id]
        );
        row.children = children;
      }
      
      return {
        list: rows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    } catch (error) {
      console.error('获取列表式生产BOM列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取列表式生产BOM详情
   */
  static async getListStyleBomById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM list_style_production_boms WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      const bom = rows[0];
      
      // 获取子件信息
      const [children] = await pool.execute(
        'SELECT * FROM list_style_bom_children WHERE parent_id = ? ORDER BY child_sequence',
        [id]
      );
      bom.children = children;
      
      return bom;
    } catch (error) {
      console.error('获取列表式生产BOM详情失败:', error);
      throw error;
    }
  }

  /**
   * 从生产BOM生成列表式BOM
   * 需求：
   * 1. 每个子件独占一行
   * 2. 父件信息合并为一行
   * 3. 推送所有父件：
   *    - 0层阶的产品编码本身（顶层父件）
   *    - 子件属性区域中所有"产出工序"≠"采购"的子件编码
   * 4. 根据层阶(level)判断直接下级：层阶=1, 2, 3...
   * 5. 防重复规则：
   *    - 父件编号+直接子件编号全部相同 => 不推送
   *    - 父件编号相同，子件不同 => 返回冲突信息，由前端处理
   */
  static async generateFromProductionBom(productionBomId, mode = 'check') {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 1. 获取生产BOM信息
      const [productionBomRows] = await connection.execute(
        'SELECT * FROM production_boms WHERE id = ?',
        [productionBomId]
      );
      
      if (productionBomRows.length === 0) {
        throw new Error('生产BOM不存在');
      }
      
      const productionBom = productionBomRows[0];
      console.log(`🔧 开始从生产BOM生成列表式BOM, 产品编号: ${productionBom.product_code}`);
      
      // 2. 获取生产BOM的所有子件信息
      const [allComponents] = await connection.execute(
        `SELECT * FROM bom_components 
         WHERE bom_id = ? 
         ORDER BY sequence`,
        [productionBomId]
      );
      
      console.log(`📊 生产BOM共有 ${allComponents.length} 个子件`);
      
      // 3. 构建父件列表：
      // - 首先添加0层阶的产品本身作为顶层父件
      // - 然后添加子件中产出工序≠"采购"的作为父件
      const parentItems = [];
      
      // 3.1 添加0层阶父件（产品本身）
      parentItems.push({
        isProductItself: true,  // 标记为产品本身
        level: 0,
        component_code: productionBom.product_code,
        component_name: productionBom.product_name,
        output_process: '/',  // 顶层产品没有产出工序概念
      });
      
      // 3.2 添加子件中的父件（产出工序≠"采购"）
      const childParentComponents = allComponents.filter(comp => {
        const outputProcess = (comp.output_process || '').trim();
        return outputProcess !== '采购' && outputProcess !== '';
      });
      
      parentItems.push(...childParentComponents.map(comp => ({
        isProductItself: false,
        ...comp
      })));
      
      console.log(`🎯 共有 ${parentItems.length} 个父件（含0层阶产品本身）`);
      
      // 4. 检查冲突：查找已存在的相同父件编号的记录
      const conflicts = [];
      const duplicates = [];
      
      for (const parentItem of parentItems) {
        // 查找目标表格中相同父件编号的记录
        const [existingBoms] = await connection.execute(
          'SELECT id, bom_code, parent_code FROM list_style_production_boms WHERE parent_code = ?',
          [parentItem.component_code]
        );
        
        if (existingBoms.length === 0) {
          // 新父件，无冲突
          continue;
        }
        
        // 获取当前要推送的直接子件
        let currentDirectChildren = [];
        const parentLevel = parseInt(parentItem.level) || 0;
        
        if (parentItem.isProductItself) {
          currentDirectChildren = allComponents.filter(comp => parseInt(comp.level) === 1);
        } else {
          const parentIndex = allComponents.findIndex(c => c.id === parentItem.id);
          for (let i = parentIndex + 1; i < allComponents.length; i++) {
            const comp = allComponents[i];
            const compLevel = parseInt(comp.level) || 1;
            if (compLevel <= parentLevel) break;
            if (compLevel === parentLevel + 1) {
              currentDirectChildren.push(comp);
            }
          }
        }
        
        // 构建当前子件结构签名（用于比较）
        const currentSignature = currentDirectChildren
          .map(child => `${child.component_code}:${child.standard_quantity || 0}`)
          .sort()
          .join('|');
        
        // 检查每个已存在的BOM
        let foundExactMatch = false;
        
        for (const existingBom of existingBoms) {
          // 获取已存在BOM的子件
          const [existingChildren] = await connection.execute(
            'SELECT child_code, standard_usage FROM list_style_bom_children WHERE parent_id = ? ORDER BY child_code',
            [existingBom.id]
          );
          
          // 构建已存在子件结构签名
          const existingSignature = existingChildren
            .map(child => `${child.child_code}:${child.standard_usage || 0}`)
            .sort()
            .join('|');
          
          if (currentSignature === existingSignature) {
            // 完全相同，记录为重复
            foundExactMatch = true;
            duplicates.push({
              parentCode: parentItem.component_code,
              parentName: parentItem.component_name,
              existingBomCode: existingBom.bom_code
            });
            break;
          }
        }
        
        // 如果没有找到完全相同的，但存在相同父件编号，则为冲突
        if (!foundExactMatch && existingBoms.length > 0) {
          conflicts.push({
            parentCode: parentItem.component_code,
            parentName: parentItem.component_name,
            existingBomCodes: existingBoms.map(b => b.bom_code),
            currentChildren: currentDirectChildren.map(c => ({
              code: c.component_code,
              name: c.component_name,
              quantity: c.standard_quantity || 0
            })),
            existingBomId: existingBoms[0].id // 用于查询已存在的子件
          });
        }
      }
      
      // 如果是检查模式，且存在冲突或重复，返回冲突信息
      if (mode === 'check' && (conflicts.length > 0 || duplicates.length > 0)) {
        await connection.rollback();
        return {
          success: false,
          hasConflict: conflicts.length > 0,
          hasDuplicate: duplicates.length > 0,
          conflicts,
          duplicates,
          message: `检测到${conflicts.length}个冲突和${duplicates.length}个重复`
        };
      }
      
      // 5. 为每个父件创建列表式BOM记录
      let createdCount = 0;
      let skippedCount = 0;
      let replacedCount = 0;
      
      for (const parentItem of parentItems) {
        // 根据模式处理重复和冲突
        const isDuplicate = duplicates.some(d => d.parentCode === parentItem.component_code);
        const conflict = conflicts.find(c => c.parentCode === parentItem.component_code);
        
        if (isDuplicate) {
          // 完全重复，跳过
          console.log(`  ⏭️ 跳过重复父件: ${parentItem.component_code}`);
          skippedCount++;
          continue;
        }
        
        if (conflict && mode === 'replace') {
          // 覆盖模式：删除相同父件编号的所有记录
          console.log(`  🔄 覆盖父件: ${parentItem.component_code}`);
          await connection.execute(
            'DELETE FROM list_style_production_boms WHERE parent_code = ?',
            [parentItem.component_code]
          );
          replacedCount++;
        } else if (conflict && mode === 'new') {
          // 新增模式：允许同一父件有多个BOM结构
          console.log(`  ➕ 新增BOM结构: ${parentItem.component_code}`);
        }
        // 创建列表式BOM主记录（父件信息）
        const [bomResult] = await connection.execute(`
          INSERT INTO list_style_production_boms (
            sequence, bom_code, parent_code, parent_name, status, 
            is_default, version_count, remark, parent_main_category, 
            parent_mid_category, parent_sub_category, parent_model, 
            parent_series, parent_output_process, total_material, total_labor
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          await this.generateSequence(), // 序号自动生成
          await this.generateBomCode(), // 每个父件生成独立的BOM编号
          parentItem.component_code, // 父件编号
          parentItem.component_name, // 父件名称
          productionBom.status, // BOM状态
          '是', // 默认BOM
          1, // 版本次数
          productionBom.remark || '/', // BOM备注
          '/', // 父件大类
          '/', // 父件中类
          '/', // 父件小类
          '/', // 父件型号
          '/', // 父件系列
          parentItem.output_process || '/', // 父件产出工序
          productionBom.total_material || 0, // 总材料
          productionBom.total_labor || 0 // 总人工
        ]);
        
        const listStyleBomId = bomResult.insertId;
        const parentLevel = parseInt(parentItem.level) || 0;  // 0层阶产品本身level=0
        
        console.log(`  └─ 父件: ${parentItem.component_code} (层阶: ${parentLevel}, 产出工序: ${parentItem.output_process})`);
        
        // 5. 查找该父件的直接下级子件
        let directChildren = [];
        
        if (parentItem.isProductItself) {
          // 如果是产品本身（0层阶），直接下级是所有level=1的子件
          directChildren = allComponents.filter(comp => parseInt(comp.level) === 1);
        } else {
          // 如果是子件中的父件，按原逻辑查找
          const parentIndex = allComponents.findIndex(c => c.id === parentItem.id);
          
          for (let i = parentIndex + 1; i < allComponents.length; i++) {
            const comp = allComponents[i];
            const compLevel = parseInt(comp.level) || 1;
            
            // 如果遇到同级或更低层级的，说明已经超出该父件的子树
            if (compLevel <= parentLevel) {
              break;
            }
            
            // 只取直接下级（层阶 = 父件层阶 + 1）
            if (compLevel === parentLevel + 1) {
              directChildren.push(comp);
            }
          }
        }
        
        console.log(`    └─ 直接下级子件: ${directChildren.length} 个`);
        
        // 6. 插入子件信息（每个子件独占一行）
        for (let i = 0; i < directChildren.length; i++) {
          const child = directChildren[i];
          
          await connection.execute(`
            INSERT INTO list_style_bom_children (
              parent_id, child_sequence, output_process, child_code, child_name, 
              component_source, standard_usage
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            listStyleBomId,
            i + 1, // 子件序号
            child.output_process || '', // 产出工序
            child.component_code, // 子件编号
            child.component_name, // 子件名称
            child.component_source || '', // 子件来源（从生产BOM获取）
            child.standard_quantity || 0 // 标准用量
          ]);
        }
        
        createdCount++;
      }
      
      await connection.commit();
      
      console.log(`✅ 成功从生产BOM ${productionBomId} 生成 ${createdCount} 条列表式BOM记录（跳过${skippedCount}条重复，覆盖${replacedCount}条）`);
      
      return {
        success: true,
        count: createdCount,
        skippedCount,
        replacedCount,
        message: `成功生成${createdCount}条记录${skippedCount > 0 ? `（跳过${skippedCount}条重复）` : ''}${replacedCount > 0 ? `（覆盖${replacedCount}条）` : ''}`
      };
    } catch (error) {
      await connection.rollback();
      console.error('生成列表式BOM失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 创建列表式生产BOM
   */
  static async createListStyleBom(bomData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { children, ...bomInfo } = bomData;
      
      // 插入主记录
      const [result] = await connection.execute(`
        INSERT INTO list_style_production_boms (
          sequence, bom_code, parent_code, parent_name, status, 
          is_default, version_count, remark, parent_main_category, 
          parent_mid_category, parent_sub_category, parent_model, 
          parent_series, parent_output_process, total_material, total_labor
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bomInfo.sequence || await this.generateSequence(),
        bomInfo.bomCode || await this.generateBomCode(),
        bomInfo.parentCode,
        bomInfo.parentName,
        bomInfo.status || 'draft',
        bomInfo.isDefault || '否',
        bomInfo.versionCount || 1,
        bomInfo.remark || '',
        bomInfo.parentMainCategory || '',
        bomInfo.parentMidCategory || '',
        bomInfo.parentSubCategory || '',
        bomInfo.parentModel || '',
        bomInfo.parentSeries || '',
        bomInfo.parentOutputProcess || '',
        bomInfo.totalMaterial || 0,
        bomInfo.totalLabor || 0
      ]);
      
      const bomId = result.insertId;
      
      // 插入子件记录
      if (children && children.length > 0) {
        for (const child of children) {
          await connection.execute(`
            INSERT INTO list_style_bom_children (
              parent_id, child_sequence, child_code, child_name, 
              output_process, component_source, standard_usage
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            bomId,
            child.childSequence,
            child.childCode,
            child.childName,
            child.outputProcess || '',
            child.componentSource || '',
            child.standardUsage || 0
          ]);
        }
      }
      
      await connection.commit();
      
      return await this.getListStyleBomById(bomId);
    } catch (error) {
      await connection.rollback();
      console.error('创建列表式生产BOM失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 更新列表式生产BOM
   */
  static async updateListStyleBom(id, bomData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { children, ...bomInfo } = bomData;
      
      // 更新主记录
      await connection.execute(`
        UPDATE list_style_production_boms SET
          bom_code = ?, parent_code = ?, parent_name = ?, status = ?, 
          is_default = ?, version_count = ?, remark = ?, parent_main_category = ?, 
          parent_mid_category = ?, parent_sub_category = ?, parent_model = ?, 
          parent_series = ?, parent_output_process = ?, total_material = ?, total_labor = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        bomInfo.bomCode,
        bomInfo.parentCode,
        bomInfo.parentName,
        bomInfo.status,
        bomInfo.isDefault,
        bomInfo.versionCount,
        bomInfo.remark,
        bomInfo.parentMainCategory,
        bomInfo.parentMidCategory,
        bomInfo.parentSubCategory,
        bomInfo.parentModel,
        bomInfo.parentSeries,
        bomInfo.parentOutputProcess,
        bomInfo.totalMaterial,
        bomInfo.totalLabor,
        id
      ]);
      
      // 删除原有子件
      await connection.execute(
        'DELETE FROM list_style_bom_children WHERE parent_id = ?',
        [id]
      );
      
      // 插入新的子件
      if (children && children.length > 0) {
        for (const child of children) {
          await connection.execute(`
            INSERT INTO list_style_bom_children (
              parent_id, child_sequence, child_code, child_name, 
              output_process, component_source, standard_usage
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            id,
            child.childSequence,
            child.childCode,
            child.childName,
            child.outputProcess || '',
            child.componentSource || '',
            child.standardUsage || 0
          ]);
        }
      }
      
      await connection.commit();
      
      return await this.getListStyleBomById(id);
    } catch (error) {
      await connection.rollback();
      console.error('更新列表式生产BOM失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 删除列表式生产BOM
   */
  static async deleteListStyleBom(id) {
    try {
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        // 删除子件
        await connection.execute(
          'DELETE FROM list_style_bom_children WHERE parent_id = ?',
          [id]
        );
        
        // 删除主记录
        const [result] = await connection.execute(
          'DELETE FROM list_style_production_boms WHERE id = ?',
          [id]
        );
        
        await connection.commit();
        
        return result.affectedRows > 0;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('删除列表式生产BOM失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除列表式生产BOM
   */
  static async batchDeleteListStyleBom(ids) {
    try {
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        const placeholders = ids.map(() => '?').join(',');
        
        // 删除子件
        await connection.execute(
          `DELETE FROM list_style_bom_children WHERE parent_id IN (${placeholders})`,
          ids
        );
        
        // 删除主记录
        const [result] = await connection.execute(
          `DELETE FROM list_style_production_boms WHERE id IN (${placeholders})`,
          ids
        );
        
        await connection.commit();
        
        return result.affectedRows;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('批量删除列表式生产BOM失败:', error);
      throw error;
    }
  }

  /**
   * 生成序号
   */
  static async generateSequence() {
    try {
      const [rows] = await pool.execute(
        'SELECT MAX(sequence) as maxSequence FROM list_style_production_boms'
      );
      return (rows[0].maxSequence || 0) + 1;
    } catch (error) {
      console.error('生成序号失败:', error);
      return 1;
    }
  }

  /**
   * 生成BOM编号（使用时间戳+随机数保证唯一性）
   */
  static async generateBomCode() {
    try {
      // 使用时间戳 + 随机数确保唯一性
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return `LSPB${timestamp}${String(random).padStart(3, '0')}`;
    } catch (error) {
      console.error('生成BOM编号失败:', error);
      return `LSPB${Date.now()}`;
    }
  }

  /**
   * ✅ 根据父件编号查询BOM子件
   * @param {string} parentCode - 父件编号
   * @returns {Promise<Array>} - 子件列表
   */
  static async getChildrenByParentCode(parentCode) {
    try {
      console.log(`🔍 查询父件编号为 ${parentCode} 的BOM子件`);
      
      // 查找父件编号匹配的列表式BOM（取默认BOM或最新的一条）
      const [parentBoms] = await pool.execute(
        `SELECT id, bom_code, parent_code, parent_name 
         FROM list_style_production_boms 
         WHERE parent_code = ? 
         ORDER BY is_default DESC, created_at DESC 
         LIMIT 1`,
        [parentCode]
      );
      
      if (parentBoms.length === 0) {
        console.log(`⚠️ 未找到父件编号为 ${parentCode} 的BOM记录`);
        return [];
      }
      
      const parentBom = parentBoms[0];
      console.log(`✅ 找到BOM：${parentBom.bom_code}, ID: ${parentBom.id}`);
      
      // 查询子件信息
      const [children] = await pool.execute(
        `SELECT 
           child_sequence,
           child_code,
           child_name,
           output_process,
           component_source,
           standard_usage
         FROM list_style_bom_children 
         WHERE parent_id = ? 
         ORDER BY child_sequence`,
        [parentBom.id]
      );
      
      console.log(`📊 找到 ${children.length} 个子件`);
      
      return children;
    } catch (error) {
      console.error('查询BOM子件失败:', error);
      throw error;
    }
  }

  /**
   * 修复子件来源字段 - 从生产BOM更新列表式BOM的component_source字段
   */
  static async fixComponentSource() {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      console.log('🔍 查询所有需要修复的列表式BOM子件...');
      
      // 查询所有component_source为空的子件
      const [childrenToFix] = await connection.execute(`
        SELECT lsb_child.id, lsb_child.child_code, lsb_child.parent_id,
               lsb_child.component_source as current_source,
               bom_child.component_source as bom_source
        FROM list_style_bom_children lsb_child
        LEFT JOIN bom_components bom_child ON lsb_child.child_code = bom_child.component_code
        WHERE (lsb_child.component_source IS NULL OR lsb_child.component_source = '')
        ORDER BY lsb_child.id
        LIMIT 1000
      `);
      
      console.log(`📊 找到 ${childrenToFix.length} 个需要修复的子件`);
      
      let fixedCount = 0;
      let skippedCount = 0;
      
      for (const child of childrenToFix) {
        if (child.bom_source && child.bom_source.trim()) {
          // 更新子件来源
          await connection.execute(`
            UPDATE list_style_bom_children 
            SET component_source = ?, updated_at = NOW()
            WHERE id = ?
          `, [child.bom_source, child.id]);
          
          console.log(`✅ 修复子件 ${child.child_code}: ${child.current_source} → ${child.bom_source}`);
          fixedCount++;
        } else {
          console.log(`⚠️ 跳过子件 ${child.child_code}: 生产BOM中也未找到component_source`);
          skippedCount++;
        }
      }
      
      await connection.commit();
      
      const result = {
        totalChecked: childrenToFix.length,
        fixedCount,
        skippedCount,
        message: `检查了${childrenToFix.length}个子件，修复了${fixedCount}个，跳过${skippedCount}个`
      };
      
      console.log('🎉 子件来源修复完成:', result);
      return result;
      
    } catch (error) {
      await connection.rollback();
      console.error('修复子件来源字段失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = ListStyleProductionBomService;