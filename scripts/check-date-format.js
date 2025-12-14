#!/usr/bin/env node

/**
 * 日期格式检查工具
 * 
 * 功能:
 * 1. 扫描项目中所有前端文件
 * 2. 检测不规范的日期格式化代码
 * 3. 生成修复建议报告
 * 
 * 使用方法:
 * node scripts/check-date-format.js
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  // 扫描的目录
  scanDirs: [
    path.join(__dirname, '../07-frontend/src/pages'),
    path.join(__dirname, '../07-frontend/src/components'),
    path.join(__dirname, '../07-frontend/src/features')
  ],
  
  // 扫描的文件扩展名
  extensions: ['.vue', '.js', '.ts', '.tsx'],
  
  // 需要检测的问题模式
  patterns: [
    {
      name: '手动拼接日期（缺少前导零）',
      regex: /date\.getMonth\(\)\s*\+\s*1(?!\s*\)\.toString\(\)\.padStart)/g,
      severity: 'error',
      suggestion: '使用 String(date.getMonth() + 1).padStart(2, "0") 或 formatDate()'
    },
    {
      name: '手动拼接日期（getDate）',
      regex: /date\.getDate\(\)(?!\s*\)\.toString\(\)\.padStart)/g,
      severity: 'error',
      suggestion: '使用 String(date.getDate()).padStart(2, "0") 或 formatDate()'
    },
    {
      name: '使用斜杠分隔符',
      regex: /\$\{[^}]*\}\/\$\{[^}]*\}\/\$\{[^}]*\}/g,
      severity: 'warning',
      suggestion: '使用连字符 "-" 作为日期分隔符'
    },
    {
      name: '使用toISOString()',
      regex: /\.toISOString\(\)\.split\(/g,
      severity: 'error',
      suggestion: '不要使用toISOString()，会导致时区问题。使用 formatDate()'
    },
    {
      name: '使用toUTCString()',
      regex: /\.toUTCString\(\)/g,
      severity: 'error',
      suggestion: '不要使用toUTCString()，会导致时区问题。使用 formatDate()'
    }
  ],
  
  // 排除的目录
  excludeDirs: ['node_modules', 'dist', 'build', '.git']
};

// 结果统计
const results = {
  totalFiles: 0,
  scannedFiles: 0,
  issuesFound: 0,
  fileIssues: []
};

/**
 * 检查文件是否应该被扫描
 */
function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return config.extensions.includes(ext);
}

/**
 * 检查目录是否应该被排除
 */
function shouldExcludeDir(dirPath) {
  const dirName = path.basename(dirPath);
  return config.excludeDirs.includes(dirName);
}

/**
 * 扫描单个文件
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const fileIssues = [];
    
    // 检查每个模式
    config.patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        // 找到匹配的行号
        let lineNumber = 1;
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
          charCount += lines[i].length + 1; // +1 for newline
          if (charCount > match.index) {
            lineNumber = i + 1;
            break;
          }
        }
        
        fileIssues.push({
          pattern: pattern.name,
          severity: pattern.severity,
          line: lineNumber,
          code: lines[lineNumber - 1].trim(),
          suggestion: pattern.suggestion
        });
        
        results.issuesFound++;
      }
      
      // 重置regex的lastIndex
      pattern.regex.lastIndex = 0;
    });
    
    if (fileIssues.length > 0) {
      results.fileIssues.push({
        file: filePath,
        issues: fileIssues
      });
    }
    
    results.scannedFiles++;
  } catch (error) {
    console.error(`❌ 读取文件失败: ${filePath}`, error.message);
  }
}

/**
 * 递归扫描目录
 */
function scanDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!shouldExcludeDir(fullPath)) {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        results.totalFiles++;
        if (shouldScanFile(fullPath)) {
          scanFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`❌ 扫描目录失败: ${dirPath}`, error.message);
  }
}

/**
 * 生成报告
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 日期格式检查报告');
  console.log('='.repeat(80));
  console.log(`\n总文件数: ${results.totalFiles}`);
  console.log(`扫描文件数: ${results.scannedFiles}`);
  console.log(`发现问题数: ${results.issuesFound}`);
  console.log(`问题文件数: ${results.fileIssues.length}\n`);
  
  if (results.fileIssues.length === 0) {
    console.log('✅ 太棒了！没有发现日期格式问题。\n');
    return;
  }
  
  console.log('⚠️ 发现以下问题:\n');
  
  results.fileIssues.forEach((fileIssue, index) => {
    console.log(`${index + 1}. 文件: ${fileIssue.file}`);
    console.log(`   问题数量: ${fileIssue.issues.length}\n`);
    
    fileIssue.issues.forEach((issue, issueIndex) => {
      const severityIcon = issue.severity === 'error' ? '🔴' : '🟡';
      console.log(`   ${severityIcon} 问题 ${issueIndex + 1}: ${issue.pattern}`);
      console.log(`      行号: ${issue.line}`);
      console.log(`      代码: ${issue.code}`);
      console.log(`      建议: ${issue.suggestion}\n`);
    });
    
    console.log('   ' + '-'.repeat(76) + '\n');
  });
  
  // 生成修复建议
  console.log('🔧 修复步骤:\n');
  console.log('1. 导入日期工具模块:');
  console.log('   import { formatDate } from \'@/utils/dateFormatter\'\n');
  console.log('2. 替换手动日期格式化代码:');
  console.log('   // ❌ 旧代码');
  console.log('   const date = `${year}/${month}/${day}`');
  console.log('   // ✅ 新代码');
  console.log('   const date = formatDate(dateInput)\n');
  console.log('3. 运行测试确保功能正常\n');
  
  console.log('=' .repeat(80) + '\n');
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始扫描日期格式问题...\n');
  
  config.scanDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`📂 扫描目录: ${dir}`);
      scanDirectory(dir);
    } else {
      console.log(`⚠️ 目录不存在: ${dir}`);
    }
  });
  
  generateReport();
  
  // 如果发现问题，退出码为1
  process.exit(results.issuesFound > 0 ? 1 : 0);
}

// 运行
main();
