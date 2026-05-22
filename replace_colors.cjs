const fs = require('fs');
const path = require('path');

const directoryPath = 'r:/rms/src/pages';

const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Backgrounds
    content = content.replace(/bg-\[#111111\]/g, 'bg-[var(--bg-panel)]');
    content = content.replace(/bg-\[#121212\]/g, 'bg-[var(--bg-panel)]');
    content = content.replace(/bg-\[#111111\]\/80/g, 'bg-[var(--bg-main)]\/80');
    content = content.replace(/bg-\[#121212\]\/95/g, 'bg-[var(--bg-panel)]\/95');
    content = content.replace(/bg-\[#1a1a1a\]/g, 'bg-[var(--bg-panel)]');
    content = content.replace(/bg-\[#222\]/g, 'bg-[var(--bg-glass)]');
    content = content.replace(/background:\s*'#121212'/g, "background: 'var(--bg-panel)'");
    content = content.replace(/background:\s*'#111111'/g, "background: 'var(--bg-main)'");
    content = content.replace(/bg-gray-9000/g, 'bg-[var(--color-text-main)]'); // assuming it meant dark gray
    content = content.replace(/bg-gray-800/g, 'bg-[var(--bg-glass)]');
    content = content.replace(/bg-gray-900/g, 'bg-[var(--bg-panel)]');
    content = content.replace(/hover:bg-gray-700/g, 'hover:bg-[var(--bg-glass)]');
    content = content.replace(/hover:bg-gray-800/g, 'hover:bg-[var(--bg-glass)]');
    content = content.replace(/bg-gray-700/g, 'bg-[var(--bg-glass)]');

    // Texts
    content = content.replace(/text-\[#F8F5F0\]/g, 'text-[var(--color-text-main)]');
    content = content.replace(/text-\[#111111\]/g, 'text-[var(--bg-main)]');
    content = content.replace(/color:\s*'#F8F5F0'/g, "color: 'var(--color-text-main)'");
    content = content.replace(/text-slate-450/g, 'text-[var(--color-text-muted)]');
    content = content.replace(/text-gray-300/g, 'text-[var(--color-text-muted)]');
    content = content.replace(/text-gray-400/g, 'text-[var(--color-text-muted)]');
    content = content.replace(/text-gray-200/g, 'text-[var(--color-text-main)]');
    content = content.replace(/text-\[#D4A373\]/g, 'text-[var(--color-primary)]');
    
    // Light text colors that disappear in light mode
    content = content.replace(/text-purple-300\/70/g, 'text-[var(--color-text-muted)]');
    content = content.replace(/text-purple-300/g, 'text-purple-500');
    content = content.replace(/text-rose-300/g, 'text-rose-500');
    content = content.replace(/text-rose-400/g, 'text-rose-500');
    content = content.replace(/text-red-300/g, 'text-red-500');
    content = content.replace(/text-emerald-300/g, 'text-emerald-500');
    content = content.replace(/text-emerald-450/g, 'text-[var(--color-secondary)]');

    // Borders
    content = content.replace(/border-white\/5/g, 'border-[var(--border-color)]');
    content = content.replace(/border-white\/10/g, 'border-[var(--border-color)]');
    content = content.replace(/border-white\/20/g, 'border-[var(--border-color)]');
    content = content.replace(/border:\s*'1px solid #FF7A3D'/g, "border: '1px solid var(--color-primary)'");

    // Other specific
    content = content.replace(/bg-rose-400\/10/g, 'bg-rose-500\/10');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
};

const processDirectory = (dirPath) => {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            processFile(fullPath);
        }
    }
};

processDirectory(directoryPath);
console.log('Finished updating colors.');
