#!/usr/bin/env node
/**
 * SQLite到MySQL数据迁移脚本
 * 用于将SQLite备份文件中的数据迁移到MySQL数据库
 */

const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');

// 配置
const config = {
  sqlite: {
    file: '/home/sardensy/enterprise-brain/enterpise-brain/data/backups/enterprise_brain_20251218_113837.db'
  },
  mysql: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain'
  }
};

// 表字段映射配置
const tableFieldMappings = {
  customers: {
    // SQLite字段 -> MySQL字段
    company_address: 'address' // 将SQLite的company_address映射到MySQL的address
  },
  sales_orders: {
    // 特殊处理sales_orders表的日期字段
    date_format_fields: ['promised_delivery', 'order_date']
  }
};

async function main() {
  console.log('🔄 开始SQLite到MySQL数据迁移...');
  console.log('📁 SQLite文件:', config.sqlite.file);
  console.log('🗄️ MySQL数据库:', config.mysql.database);
  console.log('======================================\n');

  let sqliteDb = null;

  try {
    // 连接MySQL数据库
    const mysqlPool = await mysql.createPool(config.mysql);
    console.log('✅ MySQL数据库连接成功');

    // 打开SQLite数据库
    sqliteDb = new sqlite3.Database(config.sqlite.file, sqlite3.OPEN_READONLY);
    console.log('✅ SQLite数据库连接成功');

    // 获取MySQL中所有表的字段信息
    const connection = await mysqlPool.getConnection();
    const mysqlTables = await connection.execute('SHOW TABLES');
    
    const mysqlTableFields = {};
    // 安全处理MySQL表名
    if (mysqlTables[0] && Array.isArray(mysqlTables[0])) {
      for (const row of mysqlTables[0]) {
        // MySQL SHOW TABLES返回的行是一个对象，其中键名是'Tables_in_数据库名'
        const tableName = Object.values(row)[0];
        if (tableName) {
          const fieldsResult = await connection.execute(`DESCRIBE ${tableName}`);
          mysqlTableFields[tableName] = fieldsResult[0].map(field => field.Field);
        }
      }
    }
    connection.release();

    // 迁移每个表
    const tablesToMigrate = [
      'materials',
      'boms', 
      'bom_components',
      'production_boms',
      'bom_tree_structures',
      'design_boms',
      'sales_boms',
      'customers',
      'sales_orders',
      'sales_order_products',
      'sales_order_payment_schedule',
      'shipping_plans',
      'shipping_plan_items',
      'production_bom_drafts',
      'production_plans',
      'production_plan_processes',
      'projected_balances'
    ];

    for (const table of tablesToMigrate) {
      console.log(`\n📋 迁移表: ${table}`);
      console.log('-------------------------------------');

      try {
        // 从SQLite获取表结构
        const columns = await new Promise((resolve, reject) => {
          sqliteDb.all(`PRAGMA table_info(${table})`, (err, rows) => {
            if (err) reject(err);
            resolve(rows.map(row => row.name));
          });
        });

        // 从SQLite获取数据
        const rows = await new Promise((resolve, reject) => {
          sqliteDb.all(`SELECT * FROM ${table}`, (err, rows) => {
            if (err) reject(err);
            resolve(rows);
          });
        });

        console.log(`📊 发现 ${rows.length} 条记录`);

        if (rows.length === 0) {
          console.log('⚠️  没有数据需要迁移');
          continue;
        }

        // 检查MySQL中是否存在该表
        if (!mysqlTableFields[table]) {
          console.error('❌ 迁移失败: MySQL中不存在该表');
          continue;
        }

        // 获取该表的字段映射配置
        const fieldMapping = tableFieldMappings[table] || {};

        // 批量插入数据
        const connection = await mysqlPool.getConnection();
        try {
          // 禁用外键检查以避免依赖问题
          await connection.execute('SET FOREIGN_KEY_CHECKS=0');
          await connection.beginTransaction();
          
          for (const row of rows) {
            // 筛选出MySQL中存在的字段
            const mysqlColumns = [];
            const values = [];
            
            for (const col of columns) {
              // 获取MySQL中的实际字段名
              const mysqlCol = fieldMapping[col] || col;
              
              // 检查字段是否存在于MySQL表中
              if (mysqlTableFields[table].includes(mysqlCol)) {
                mysqlColumns.push(mysqlCol);
                
                let value = row[col];
                
                // 处理空字符串的日期字段
                if (fieldMapping.date_format_fields && fieldMapping.date_format_fields.includes(mysqlCol)) {
                  if (value === '' || value === null) {
                    value = null;
                  } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
                    value = new Date(value).toISOString().slice(0, 19).replace('T', ' ');
                  }
                }
                
                // 处理其他空值和日期格式
                if (value === null || value === undefined || value === '') {
                  values.push(null);
                } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
                  values.push(new Date(value).toISOString().slice(0, 19).replace('T', ' '));
                } else {
                  values.push(value);
                }
              }
            }
            
            // 如果没有可用字段，跳过这条记录
            if (mysqlColumns.length === 0) {
              continue;
            }
            
            // 构建SQL插入语句
            const placeholders = values.map(() => '?').join(', ');
            const sql = `INSERT INTO ${table} (${mysqlColumns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE id=id`;
            
            await connection.execute(sql, values);
          }
          
          await connection.commit();
          console.log('✅ 数据迁移成功');
        } catch (error) {
          await connection.rollback();
          throw error;
        } finally {
          // 恢复外键检查
          await connection.execute('SET FOREIGN_KEY_CHECKS=1');
          connection.release();
        }

      } catch (error) {
        console.error('❌ 迁移失败:', error.message);
        // 继续迁移其他表
      }
    }

    console.log('\n======================================');
    console.log('🎉 数据迁移完成！');
    console.log('======================================');

  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error.message);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    if (sqliteDb) {
      sqliteDb.close();
    }
  }
}

// 执行迁移
main();