#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取所有路由模块
const routerModulesPath = path.join(__dirname, 'src/router/modules');
const routerFiles = fs.readdirSync(routerModulesPath).filter(file => file.endsWith('.js'));

// 获取所有页面文件
const pagesPath = path.join(__dirname, 'src/pages');

function getAllPages(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      getAllPages(filePath, fileList);
    } else if (file.endsWith('.vue') && !filePath.includes('components')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allPages = getAllPages(pagesPath);

// 分析路由文件，提取所有使用的页面
const usedPages = new Set();

for (const file of routerFiles) {
  const routerContent = fs.readFileSync(path.join(routerModulesPath, file), 'utf8');
  
  // 匹配路由配置中的component: () => import('@/pages/...')
  const componentRegex = /component:\s*\(\)\s*=>\s*import\s*\(['"](@\/pages\/[^'"]+)['"]\)/g;
  let match;
  while ((match = componentRegex.exec(routerContent)) !== null) {
    const pagePath = match[1].replace('@/', path.join(__dirname, 'src/'));
    usedPages.add(pagePath);
  }
}

// 分析主路由文件
const mainRouterContent = fs.readFileSync(path.join(__dirname, 'src/router/index.js'), 'utf8');
const mainComponentRegex = /component:\s*\(\)\s*=>\s*import\s*\(['"](@\/pages\/[^'"]+)['"]\)/g;
let mainMatch;
while ((mainMatch = mainComponentRegex.exec(mainRouterContent)) !== null) {
  const pagePath = mainMatch[1].replace('@/', path.join(__dirname, 'src/'));
  usedPages.add(pagePath);
}

// 找出未使用的页面
const unusedPages = allPages.filter(page => !usedPages.has(page));

console.log('=== 页面整合分析报告 ===');
console.log('总页面数:', allPages.length);
console.log('已配置页面数:', usedPages.size);
console.log('未配置页面数:', unusedPages.length);
console.log('\n--- 未配置页面列表 ---');

// 按模块分类未配置页面
const unusedPagesByModule = {};

unusedPages.forEach(page => {
  const relativePath = page.replace(path.join(__dirname, 'src/pages/'), '');
  const moduleName = relativePath.split('/')[0];
  
  if (!unusedPagesByModule[moduleName]) {
    unusedPagesByModule[moduleName] = [];
  }
  unusedPagesByModule[moduleName].push(relativePath);
});

for (const module in unusedPagesByModule) {
  console.log(`\n【${module}】`);
  unusedPagesByModule[module].forEach(page => {
    console.log(`- ${page}`);
  });
}

console.log('\n--- 重复文件检查 ---');
// 检查重复文件（名称相似的文件）
const pageNames = allPages.map(page => path.basename(page));
const nameCount = {};

pageNames.forEach(name => {
  nameCount[name] = (nameCount[name] || 0) + 1;
});

const duplicateNames = Object.keys(nameCount).filter(name => nameCount[name] > 1);

if (duplicateNames.length > 0) {
  console.log('发现重复文件名:');
  duplicateNames.forEach(name => {
    console.log(`- ${name}: ${nameCount[name]}个实例`);
  });
} else {
  console.log('未发现重复文件名');
}