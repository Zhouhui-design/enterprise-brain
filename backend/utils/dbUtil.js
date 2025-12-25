const { pool } = require('../config/database');

/**
 * 数据库操作工具类
 * 封装公共的数据库操作逻辑，减少代码重复
 */
class DBUtil {
  /**
   * 执行单条SQL查询
   * @param {string} sql - SQL语句
   * @param {Array} params - 查询参数
   * @returns {Promise<Array|Object>} - 查询结果
   */
  static async query(sql, params = []) {
    try {
      const [result] = await pool.execute(sql, params);
      return result;
    } catch (error) {
      console.error('数据库查询失败:', error);
      throw error;
    }
  }

  /**
   * 执行单条SQL查询，返回第一条结果
   * @param {string} sql - SQL语句
   * @param {Array} params - 查询参数
   * @returns {Promise<Object|null>} - 查询结果
   */
  static async queryOne(sql, params = []) {
    const result = await this.query(sql, params);
    // 如果是数组（SELECT查询结果），返回第一条
    if (Array.isArray(result)) {
      return result[0] || null;
    }
    // 否则直接返回（INSERT/UPDATE/DELETE结果）
    return result;
  }

  /**
   * 执行事务
   * @param {Function} callback - 事务回调函数
   * @returns {Promise<any>} - 事务执行结果
   */
  static async transaction(callback) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const result = await callback(connection);
      
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      console.error('事务执行失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 执行多条SQL语句（非事务）
   * @param {Array<{sql: string, params: Array}>} queries - SQL查询数组
   * @returns {Promise<Array>} - 查询结果数组
   */
  static async batchQuery(queries) {
    const results = [];
    
    for (const query of queries) {
      const result = await this.query(query.sql, query.params);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 构建分页查询SQL
   * @param {string} baseSql - 基础SQL语句（不包含LIMIT和OFFSET）
   * @param {number} page - 页码
   * @param {number} pageSize - 每页条数
   * @returns {string} - 分页查询SQL
   */
  static buildPaginationSql(baseSql, page = 1, pageSize = 20) {
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    return `${baseSql} LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;
  }

  /**
   * 转换字段名：snake_case -> camelCase
   * @param {Object|Array} data - 数据库查询结果
   * @returns {Object|Array} - 转换后的结果
   */
  static toCamelCase(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.toCamelCase(item));
    } else if (data && typeof data === 'object') {
      const converted = {};
      Object.keys(data).forEach(key => {
        const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        converted[camelKey] = data[key];
      });
      return converted;
    }
    return data;
  }

  /**
   * 转换字段名：camelCase -> snake_case
   * @param {Object|Array} data - 前端数据
   * @returns {Object|Array} - 转换后的结果
   */
  static toSnakeCase(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.toSnakeCase(item));
    } else if (data && typeof data === 'object') {
      const converted = {};
      Object.keys(data).forEach(key => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        converted[snakeKey] = data[key];
      });
      return converted;
    }
    return data;
  }

  /**
   * 构建WHERE子句
   * @param {Object} conditions - 查询条件
   * @returns {Object} - 包含whereClause和params的对象
   */
  static buildWhereClause(conditions) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return { whereClause: '', params: [] };
    }

    const whereClause = [];
    const params = [];

    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // 处理IN查询
          const placeholders = value.map(() => '?').join(',');
          whereClause.push(`${key} IN (${placeholders})`);
          params.push(...value);
        } else if (typeof value === 'string' && value.includes('%')) {
          // 处理LIKE查询
          whereClause.push(`${key} LIKE ?`);
          params.push(value);
        } else {
          // 处理精确查询
          whereClause.push(`${key} = ?`);
          params.push(value);
        }
      }
    });

    return {
      whereClause: `WHERE ${whereClause.join(' AND ')}`,
      params
    };
  }

  /**
   * 获取总记录数
   * @param {string} tableName - 表名
   * @param {string} whereClause - WHERE子句
   * @param {Array} params - 查询参数
   * @returns {Promise<number>} - 总记录数
   */
  static async getTotalCount(tableName, whereClause = '', params = []) {
    const sql = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
    const result = await this.queryOne(sql, params);
    return result.total;
  }
}

module.exports = DBUtil;
