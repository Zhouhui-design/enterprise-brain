const { query } = require('./config/database');

(async () => {
  try {
    console.log('Testing simple query...');
    const result = await query('SELECT COUNT(*) as total FROM procurement_plans');
    console.log('Query result:', result);

    console.log('Testing list query without params...');
    const listResult = await query('SELECT * FROM procurement_plans LIMIT 10');
    console.log('List result length:', listResult.length);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
