const cron = require('node-cron');
const { performBackup } = require('./backup-database');

/**
 * 自动定时备份任务
 * - 每天早上8点自动备份
 * - 每4小时自动备份一次
 */

console.log('🕐 启动数据库自动备份任务...\n');

// 每天早上8点备份
cron.schedule(
  '0 8 * * *',
  () => {
    console.log('\n⏰ 定时任务触发 - 每日备份');
    try {
      performBackup();
    } catch (error) {
      console.error('定时备份失败:', error);
    }
  },
  {
    timezone: 'Asia/Shanghai',
  },
);

// 每4小时备份一次
cron.schedule(
  '0 */4 * * *',
  () => {
    console.log('\n⏰ 定时任务触发 - 4小时备份');
    try {
      performBackup();
    } catch (error) {
      console.error('定时备份失败:', error);
    }
  },
  {
    timezone: 'Asia/Shanghai',
  },
);

console.log('✅ 自动备份任务已启动');
console.log('   - 每天 08:00 自动备份');
console.log('   - 每隔 4小时 自动备份');
console.log('   - 时区: Asia/Shanghai\n');

// 启动时立即执行一次备份
console.log('🔄 执行启动备份...');
try {
  performBackup();
  console.log('\n✅ 启动备份完成，监控任务已激活\n');
} catch (error) {
  console.error('启动备份失败:', error);
}
