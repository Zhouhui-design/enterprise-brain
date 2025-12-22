#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 分析路由配置
function analyzeRoutes() {
  const routerPath = path.join(__dirname, 'src/router');
  const pagesPath = path.join(__dirname, 'src/pages');
  
  // 读取所有路由文件
  const routeFiles = fs.readdirSync(path.join(routerPath, 'modules'));
  
  const configuredPages = new Set();
  const allPages = new Set();
  
  // 分析路由文件
  routeFiles.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(routerPath, 'modules', file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 提取所有导入的页面组件
      const importRegex = /import\s+.*?from\s+['"](.*?)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const componentPath = match[1];
        if (componentPath.startsWith('@/pages/')) {
          const actualPath = componentPath.replace('@/', path.join(__dirname, 'src/'));
          configuredPages.add(actualPath);
        }
      }
      
      // 提取路由配置中的组件路径
      const componentRegex = /component:\s*\(\)\s*=>\s*import\s*\(['"](.*?)['"]\)/g;
      while ((match = componentRegex.exec(content)) !== null) {
        const componentPath = match[1];
        if (componentPath.startsWith('@/pages/')) {
          const actualPath = componentPath.replace('@/', path.join(__dirname, 'src/'));
          configuredPages.add(actualPath);
        }
      }
    }
  });
  
  // 读取所有页面文件
  function readPages(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        readPages(filePath);
      } else if (file.endsWith('.vue')) {
        allPages.add(filePath);
      }
    });
  }
  
  readPages(pagesPath);
  
  // 找出未配置的页面
  const unconfiguredPages = new Set([...allPages].filter(page => !configuredPages.has(page)));
  
  console.log('已配置的页面数量:', configuredPages.size);
  console.log('所有页面数量:', allPages.size);
  console.log('未配置的页面数量:', unconfiguredPages.size);
  
  console.log('\n未配置的页面:');
  unconfiguredPages.forEach(page => {
    console.log('-', page.replace(path.join(__dirname, 'src/'), '@/'));
  });
  
  return {
    configuredPages,
    allPages,
    unconfiguredPages
  };
}

analyzeRoutes();