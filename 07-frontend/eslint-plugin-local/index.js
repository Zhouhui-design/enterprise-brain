// ESLint 自定义插件：强制使用标准日期格式 YYYY-MM-DD

module.exports = {
  rules: {
    'no-manual-date-format': {
      meta: {
        type: 'problem',
        docs: {
          description: '禁止手动拼接日期字符串，必须使用utils/dateFormatter.js',
          category: 'Best Practices',
          recommended: true
        },
        messages: {
          manualDateFormat: '禁止手动拼接日期字符串！请使用 \'@/utils/dateFormatter\' 中的 formatDate() 函数',
          dangerousDateMethod: '禁止使用 {{method}}()！这会导致时区问题，请使用 \'@/utils/dateFormatter\' 中的函数',
          noLeadingZero: '禁止使用 YYYY/M/D 或 YYYY-M-D 格式！必须使用 YYYY-MM-DD（带前导零）'
        },
        schema: []
      },
      create: function(context) {
        return {
          // 检测: date.getMonth() + 1 或 date.getDate()
          'BinaryExpression[operator=\'+\']': function(node) {
            if (node.left.type === 'CallExpression') {
              const methodName = node.left.property?.name;
              if (methodName === 'getMonth' || methodName === 'getDate' || methodName === 'getFullYear') {
                context.report({
                  node,
                  messageId: 'manualDateFormat'
                });
              }
            }
          },
          
          // 检测: toISOString()
          'CallExpression[callee.property.name=\'toISOString\']': function(node) {
            context.report({
              node,
              messageId: 'dangerousDateMethod',
              data: {
                method: 'toISOString'
              }
            });
          },
          
          // 检测: toUTCString()
          'CallExpression[callee.property.name=\'toUTCString\']': function(node) {
            context.report({
              node,
              messageId: 'dangerousDateMethod',
              data: {
                method: 'toUTCString'
              }
            });
          },
          
          // 检测: 模板字符串中的日期拼接 `${year}/${month}/${day}`
          'TemplateLiteral': function(node) {
            const source = context.getSourceCode().getText(node);
            
            // 检测 YYYY/M/D 或 YYYY-M-D 格式（无前导零）
            if (/\$\{.*?\}\/\$\{.*?\}\/\$\{.*?\}/.test(source) || 
                /\$\{.*?\}-\$\{.*?\}-\$\{.*?\}/.test(source)) {
              // 检查是否有 padStart(2, '0')
              if (!source.includes('padStart(2, \'0\')') && !source.includes('padStart(2, "0")')) {
                context.report({
                  node,
                  messageId: 'noLeadingZero'
                });
              }
            }
          }
        };
      }
    }
  }
};
