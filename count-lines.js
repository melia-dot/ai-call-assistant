#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directories and files to exclude
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  '.next',
  '.vercel',
  'dist',
  'build',
  'out',
  'coverage'
];

const EXCLUDE_FILES = [
  'package-lock.json',
  'yarn.lock',
  '.gitignore',
  '.env',
  '.env.local',
  '.env.example',
  'README.md',
  'LICENSE',
  'next.config.js',
  'tailwind.config.js',
  'postcss.config.js',
  'tsconfig.json'
];

// File extensions to include
const INCLUDE_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx'
];

// Exclude documentation-only directories
const EXCLUDE_DOC_DIRS = [
  'docs',
  'documentation',
  'examples',
  'demo'
];

function shouldExcludeDir(dirName) {
  return EXCLUDE_DIRS.includes(dirName) || EXCLUDE_DOC_DIRS.includes(dirName);
}

function shouldIncludeFile(fileName) {
  if (EXCLUDE_FILES.includes(fileName)) return false;
  
  const ext = path.extname(fileName);
  return INCLUDE_EXTENSIONS.includes(ext);
}

function isRealCode(content) {
  const lines = content.split('\n');
  let codeLines = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (trimmed === '') continue;
    
    // Skip comment-only lines
    if (trimmed.startsWith('//') || 
        trimmed.startsWith('/*') || 
        trimmed.startsWith('*') ||
        trimmed === '*/') continue;
    
    // Skip import/export only lines
    if (trimmed.startsWith('import ') && trimmed.endsWith(';')) continue;
    if (trimmed.startsWith('export ') && trimmed.includes('from')) continue;
    
    codeLines++;
  }
  
  return codeLines;
}

function scanDirectory(dirPath, stats = { files: 0, totalLines: 0, codeLines: 0, details: [] }) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      if (!shouldExcludeDir(item)) {
        scanDirectory(itemPath, stats);
      }
    } else if (stat.isFile() && shouldIncludeFile(item)) {
      try {
        const content = fs.readFileSync(itemPath, 'utf8');
        const totalLines = content.split('\n').length;
        const codeLines = isRealCode(content);
        
        stats.files++;
        stats.totalLines += totalLines;
        stats.codeLines += codeLines;
        
        // Store details for reporting
        const relativePath = path.relative(process.cwd(), itemPath);
        stats.details.push({
          file: relativePath,
          totalLines,
          codeLines,
          ratio: totalLines > 0 ? (codeLines / totalLines * 100).toFixed(1) : 0
        });
        
      } catch (error) {
        console.error(`Error reading ${itemPath}:`, error.message);
      }
    }
  }
  
  return stats;
}

function formatNumber(num) {
  return num.toLocaleString();
}

function main() {
  console.log('🔍 Scanning for real code lines...\n');
  
  const stats = scanDirectory(process.cwd());
  
  // Sort by code lines descending
  stats.details.sort((a, b) => b.codeLines - a.codeLines);
  
  console.log('📊 CODE STATISTICS');
  console.log('==================');
  console.log(`Total Files: ${formatNumber(stats.files)}`);
  console.log(`Total Lines: ${formatNumber(stats.totalLines)}`);
  console.log(`Code Lines:  ${formatNumber(stats.codeLines)}`);
  console.log(`Efficiency:  ${(stats.codeLines / stats.totalLines * 100).toFixed(1)}%\n`);
  
  console.log('📁 TOP FILES BY CODE LINES');
  console.log('===========================');
  
  // Show top 10 files
  stats.details.slice(0, 10).forEach((file, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${file.file.padEnd(40)} ${file.codeLines.toString().padStart(4)} lines (${file.ratio}%)`);
  });
  
  if (stats.details.length > 10) {
    console.log(`    ... and ${stats.details.length - 10} more files\n`);
  } else {
    console.log('');
  }
  
  // Architecture breakdown
  console.log('🏗️  ARCHITECTURE BREAKDOWN');
  console.log('==========================');
  
  const breakdown = {};
  stats.details.forEach(file => {
    const parts = file.file.split('/');
    const category = parts[0] || 'root';
    
    if (!breakdown[category]) {
      breakdown[category] = { files: 0, codeLines: 0 };
    }
    
    breakdown[category].files++;
    breakdown[category].codeLines += file.codeLines;
  });
  
  Object.entries(breakdown)
    .sort(([,a], [,b]) => b.codeLines - a.codeLines)
    .forEach(([category, data]) => {
      console.log(`${category.padEnd(20)} ${data.files.toString().padStart(2)} files  ${data.codeLines.toString().padStart(4)} lines`);
    });
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 TOTAL PROJECT SUMMARY');
  console.log('='.repeat(50));
  console.log(`📁 Total Code Files:     ${formatNumber(stats.files)}`);
  console.log(`📏 Total Lines Written:  ${formatNumber(stats.totalLines)}`);
  console.log(`⚡ Real Code Lines:      ${formatNumber(stats.codeLines)}`);
  console.log(`🎪 Code Efficiency:     ${(stats.codeLines / stats.totalLines * 100).toFixed(1)}%`);
  console.log(`🏗️  Architecture Dirs:   ${Object.keys(breakdown).length}`);
  console.log('='.repeat(50));
  
  console.log('\n✅ Analysis complete!');
}

main();
