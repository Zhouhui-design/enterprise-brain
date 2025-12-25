const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

/**
 * 企业数据库自动备份系统
 * 功能：定时备份、多版本保留、压缩存储
 */

// 配置
const CONFIG = {
  dbPath: path.join(__dirname, '../../data/enterprise_brain.db'),
  backupDir: path.join(__dirname, '../../data/backups'),
  maxBackups: 30, // 保留最近30个备份
  maxDailyBackups: 7, // 每天最多保留7个备份
};

// 确保备份目录存在
function ensureBackupDir() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    console.log(`✅ 创建备份目录: ${CONFIG.backupDir}`);
  }
}

// 获取格式化的时间戳
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hour}${minute}${second}`;
}

// 执行备份
function performBackup() {
  try {
    ensureBackupDir();

    const timestamp = getTimestamp();
    const backupFileName = `enterprise_brain_${timestamp}.db`;
    const backupPath = path.join(CONFIG.backupDir, backupFileName);

    console.log(`\n🔄 开始备份数据库...`);
    console.log(`   源文件: ${CONFIG.dbPath}`);
    console.log(`   备份文件: ${backupPath}`);

    // 打开源数据库
    const sourceDb = new Database(CONFIG.dbPath, { readonly: true });

    // 使用SQLite VACUUM INTO命令进行备份（压缩备份）
    sourceDb.prepare(`VACUUM INTO ?`).run(backupPath);
    sourceDb.close();

    // 获取文件大小
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ 备份完成！`);
    console.log(`   备份大小: ${fileSizeMB} MB`);
    console.log(`   备份位置: ${backupPath}`);

    // 统计数据
    const db = new Database(backupPath, { readonly: true });
    const bomCount = db.prepare('SELECT COUNT(*) as count FROM production_boms').get().count;
    const componentCount = db.prepare('SELECT COUNT(*) as count FROM bom_components').get().count;
    const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials').get().count;
    db.close();

    console.log(`\n📊 备份数据统计:`);
    console.log(`   生产BOM: ${bomCount} 条`);
    console.log(`   BOM子件: ${componentCount} 条`);
    console.log(`   物料数据: ${materialCount} 条`);

    // 清理旧备份
    cleanOldBackups();

    return backupPath;
  } catch (error) {
    console.error('❌ 备份失败:', error);
    throw error;
  }
}

// 清理旧备份
function cleanOldBackups() {
  try {
    const files = fs
      .readdirSync(CONFIG.backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(CONFIG.backupDir, file),
        time: fs.statSync(path.join(CONFIG.backupDir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time); // 按时间倒序

    if (files.length > CONFIG.maxBackups) {
      console.log(`\n🧹 清理旧备份 (保留最近${CONFIG.maxBackups}个)...`);
      const filesToDelete = files.slice(CONFIG.maxBackups);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`   删除: ${file.name}`);
      });
      console.log(`✅ 已清理 ${filesToDelete.length} 个旧备份`);
    }
  } catch (error) {
    console.error('⚠️  清理旧备份失败:', error);
  }
}

// 列出所有备份
function listBackups() {
  ensureBackupDir();
  const files = fs
    .readdirSync(CONFIG.backupDir)
    .filter(file => file.endsWith('.db'))
    .map(file => {
      const filePath = path.join(CONFIG.backupDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        time: stats.mtime.toLocaleString('zh-CN'),
      };
    })
    .sort((a, b) => new Date(b.time) - new Date(a.time));

  console.log('\n📋 备份文件列表:');
  console.log('─'.repeat(80));
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}`);
    console.log(`   大小: ${file.size} | 时间: ${file.time}`);
  });
  console.log('─'.repeat(80));
  console.log(`总计: ${files.length} 个备份文件\n`);
}

// 恢复备份
function restoreBackup(backupFileName) {
  try {
    const backupPath = path.join(CONFIG.backupDir, backupFileName);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`备份文件不存在: ${backupFileName}`);
    }

    console.log(`\n🔄 准备恢复数据库...`);
    console.log(`   备份文件: ${backupPath}`);

    // 先备份当前数据库
    const currentBackup = `enterprise_brain_before_restore_${getTimestamp()}.db`;
    const currentBackupPath = path.join(CONFIG.backupDir, currentBackup);
    fs.copyFileSync(CONFIG.dbPath, currentBackupPath);
    console.log(`   当前数据库已备份到: ${currentBackup}`);

    // 恢复备份
    fs.copyFileSync(backupPath, CONFIG.dbPath);
    console.log(`✅ 数据库恢复完成！`);
    console.log(`   请重启服务以加载恢复的数据`);
  } catch (error) {
    console.error('❌ 恢复失败:', error);
    throw error;
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'backup':
      performBackup();
      break;
    case 'list':
      listBackups();
      break;
    case 'restore':
      if (!args[1]) {
        console.error('❌ 请指定要恢复的备份文件名');
        console.log('用法: node backup-database.js restore <备份文件名>');
        process.exit(1);
      }
      restoreBackup(args[1]);
      break;
    default:
      console.log(`
企业数据库备份工具

用法:
  node backup-database.js backup              执行备份
  node backup-database.js list                列出所有备份
  node backup-database.js restore <文件名>    恢复指定备份

示例:
  node backup-database.js backup
  node backup-database.js list
  node backup-database.js restore enterprise_brain_20231201_120000.db
      `);
  }
}

module.exports = {
  performBackup,
  listBackups,
  restoreBackup,
  cleanOldBackups,
};
