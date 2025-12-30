const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // 设置为空字符串表示无密码
  database: process.env.DB_NAME || 'enterprise_brain',
  charset: 'utf8mb4',
  connectionLimit: 10,
  // 移除不兼容的配置项
  // acquireTimeout: 60000,
  // timeout: 60000,
  // reconnect: true
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 获取数据库连接
const getConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
};

// 执行查询
const query = async (sql, params = []) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('查询执行失败:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// 执行事务
const transaction = async (callback) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('事务执行失败:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// 关闭连接池
const close = async () => {
  try {
    await pool.end();
    console.log('数据库连接池已关闭');
  } catch (error) {
    console.error('关闭数据库连接池失败:', error);
  }
};

module.exports = {
  query,
  transaction,
  close,
  getConnection,
  pool
};