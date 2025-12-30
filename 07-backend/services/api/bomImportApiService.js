const db = require('../../database/mysql');

class BOMImportApiService {
  
  /**
   * 获取导入状态
   */
  async getImportStatus() {
    try {
      const conn = await db.getConnection();
      
      const [rows] = await conn.execute(`
        SELECT 
          COUNT(*) as total_imports,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_imports,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_imports,
          MAX(import_time) as last_import_time
        FROM bom_import_logs
        WHERE import_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);
      
      conn.release();
      
      return rows[0] || {
        total_imports: 0,
        successful_imports: 0,
        failed_imports: 0,
        last_import_time: null
      };

    } catch (error) {
      console.error('获取导入状态失败:', error);
      throw error;
    }
  }

  /**
   * 记录导入日志
   */
  async logImport(importData) {
    try {
      const conn = await db.getConnection();
      
      await conn.execute(`
        INSERT INTO bom_import_logs (
          user_id, file_name, total_records, success_count, 
          error_count, warning_count, status, error_details, import_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        importData.userId || 'system',
        importData.fileName || '',
        importData.totalRecords || 0,
        importData.successCount || 0,
        importData.errorCount || 0,
        importData.warningCount || 0,
        importData.status || 'unknown',
        JSON.stringify(importData.errors || [])
      ]);
      
      conn.release();

    } catch (error) {
      console.error('记录导入日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取导入历史
   */
  async getImportHistory(limit = 50, offset = 0) {
    try {
      const conn = await db.getConnection();
      
      const [rows] = await conn.execute(`
        SELECT 
          id, user_id, file_name, total_records, success_count, 
          error_count, warning_count, status, import_time,
          CASE WHEN status = 'success' THEN 'success'
               WHEN status = 'error' THEN 'danger'
               WHEN status = 'warning' THEN 'warning'
               ELSE 'info' END as status_type
        FROM bom_import_logs
        ORDER BY import_time DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      
      // 获取总数
      const [countRows] = await conn.execute(`
        SELECT COUNT(*) as total FROM bom_import_logs
      `);
      
      conn.release();
      
      return {
        records: rows,
        total: countRows[0].total,
        limit,
        offset
      };

    } catch (error) {
      console.error('获取导入历史失败:', error);
      throw error;
    }
  }

  /**
   * 清理导入日志（保留最近30天）
   */
  async cleanupImportLogs() {
    try {
      const conn = await db.getConnection();
      
      const [result] = await conn.execute(`
        DELETE FROM bom_import_logs 
        WHERE import_time < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);
      
      conn.release();
      
      console.log(`清理导入日志完成，删除${result.affectedRows}条记录`);
      return result.affectedRows;

    } catch (error) {
      console.error('清理导入日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取导入模板
   */
  async getImportTemplate() {
    try {
      const template = {
        version: '1.0',
        description: '生产BOM导入模板',
        createTime: new Date().toISOString(),
        fields: [
          {
            name: 'BOM编号',
            type: 'string',
            required: true,
            description: '唯一的BOM标识符，格式：PBOM-年-时间戳-随机数'
          },
          {
            name: 'BOM名称',
            type: 'string',
            required: true,
            description: 'BOM的显示名称'
          },
          {
            name: '产品编号',
            type: 'string',
            required: true,
            description: '产品的唯一标识码'
          },
          {
            name: '产品名称',
            type: 'string',
            required: true,
            description: '产品的显示名称'
          },
          {
            name: '版本号',
            type: 'string',
            required: false,
            description: '版本号，格式：V1.0'
          },
          {
            name: '状态',
            type: 'select',
            required: false,
            options: ['draft', 'reviewing', 'approved', 'obsolete'],
            description: 'BOM状态：草稿、审核中、已批准、已废弃'
          },
          {
            name: '设计人员',
            type: 'string',
            required: false,
            description: '负责设计的人员'
          },
          {
            name: '审核人员',
            type: 'string',
            required: false,
            description: '负责审核的人员'
          },
          {
            name: '物料数量',
            type: 'number',
            required: false,
            description: 'BOM包含的物料总数'
          },
          {
            name: '生效日期',
            type: 'date',
            required: false,
            description: 'BOM的生效日期'
          },
          {
            name: '备注',
            type: 'string',
            required: false,
            description: 'BOM的备注信息'
          },
          {
            name: '总人工',
            type: 'number',
            required: false,
            description: '总人工费用'
          },
          {
            name: '总材料',
            type: 'number',
            required: false,
            description: '总材料费用'
          },
          {
            name: '子件数据',
            type: 'json',
            required: false,
            description: '子件信息的JSON数组'
          }
        ],
        example: {
          bomCode: 'PBOM-2024-1234567890-123',
          bomName: '示例BOM',
          productCode: 'P001',
          productName: '示例产品',
          version: 'V1.0',
          status: 'draft',
          designer: '张三',
          reviewer: '李四',
          itemCount: 5,
          effectiveDate: '2024-01-01',
          remark: '这是一个示例BOM',
          totalLabor: 100.00,
          totalMaterial: 200.00,
          children: [
            {
              childCode: 'C001',
              childName: '子件1',
              level: 1,
              levelPath: '1',
              standardQty: 2,
              outputProcess: '工序1',
              source: '自制',
              processWage: 50.00,
              materialLoss: 5.00,
              materialPrice: 25.00,
              nextProductSource: '自制',
              nextProcessName: '工序2',
              nextProductCode: 'P002',
              nextProductName: '产品2',
              nextStandardQty: 1,
              nextLevelAddress: '1.1'
            }
          ]
        }
      };

      return template;

    } catch (error) {
      console.error('获取导入模板失败:', error);
      throw error;
    }
  }

  /**
   * 验证导入文件格式
   */
  async validateImportFile(fileBuffer) {
    try {
      const XLSX = require('xlsx');
      const workbook = XLSX.read(fileBuffer);
      
      if (!workbook.Sheets || workbook.Sheets.length === 0) {
        return {
          isValid: false,
          error: 'Excel文件中没有工作表'
        };
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        return {
          isValid: false,
          error: '工作表为空或格式不正确'
        };
      }

      // 检查必需字段
      const requiredFields = ['BOM编号', 'BOM名称', '产品编号', '产品名称'];
      const headers = Object.keys(jsonData[0] || {});
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        return {
          isValid: false,
          error: `缺少必需字段：${missingFields.join(', ')}`
        };
      }

      return {
        isValid: true,
        recordCount: jsonData.length,
        headers
      };

    } catch (error) {
      console.error('验证导入文件失败:', error);
      return {
        isValid: false,
        error: '文件解析失败：' + error.message
      };
    }
  }

  /**
   * 获取导入统计信息
   */
  async getImportStatistics() {
    try {
      const conn = await db.getConnection();
      
      // 获取今日导入统计
      const [todayStats] = await conn.execute(`
        SELECT 
          COUNT(*) as today_imports,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as today_success,
          SUM(total_records) as today_total_records
        FROM bom_import_logs
        WHERE DATE(import_time) = CURDATE()
      `);
      
      // 获取本周导入统计
      const [weekStats] = await conn.execute(`
        SELECT 
          COUNT(*) as week_imports,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as week_success,
          SUM(total_records) as week_total_records
        FROM bom_import_logs
        WHERE YEARWEEK(import_time) = YEARWEEK(NOW())
      `);
      
      // 获取本月导入统计
      const [monthStats] = await conn.execute(`
        SELECT 
          COUNT(*) as month_imports,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as month_success,
          SUM(total_records) as month_total_records
        FROM bom_import_logs
        WHERE YEAR(import_time) = YEAR(NOW()) AND MONTH(import_time) = MONTH(NOW())
      `);
      
      conn.release();
      
      return {
        today: todayStats[0] || { today_imports: 0, today_success: 0, today_total_records: 0 },
        week: weekStats[0] || { week_imports: 0, week_success: 0, week_total_records: 0 },
        month: monthStats[0] || { month_imports: 0, month_success: 0, month_total_records: 0 }
      };

    } catch (error) {
      console.error('获取导入统计失败:', error);
      throw error;
    }
  }
}

module.exports = new BOMImportApiService();
