const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src', 'pages');

const replacements = {
  'bg-gray-800': 'glass-card',
  'bg-gray-900': 'bg-[var(--bg-panel)]',
  'bg-gray-950': 'bg-[var(--bg-main)]',
  'border-gray-700': 'border-[var(--border-color)]',
  'border-gray-800': 'border-[var(--border-color)]',
  'text-white': 'text-[var(--color-text-main)]',
  'text-gray-500': 'text-[var(--color-text-muted)]',
  'text-gray-400': 'text-[var(--color-text-muted)]',
  'text-rose-600': 'text-[var(--color-primary)]',
  'bg-rose-600': 'bg-[var(--color-primary)]',
  'from-rose-600': 'from-[var(--color-primary)]',
  'to-pink-400': 'to-[var(--color-secondary)]',
  'text-rose-700': 'text-[var(--color-primary)]',
  'text-gray-600': 'text-[var(--color-text-muted)]',
  'border-rose-600': 'border-[var(--color-primary)]',
  'border-rose-400': 'border-[var(--color-secondary)]',
  'dark:': '' // remove dark mode variants as we use css variables now
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // First remove dark: variants using regex
  content = content.replace(/dark:[A-Za-z0-9/.-]+/g, '');
  
  for (const [key, value] of Object.entries(replacements)) {
    if (key !== 'dark:') {
      // Replace with word boundaries to avoid matching partial classes
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      content = content.replace(regex, value);
    }
  }
  
  // Fix multiple spaces that might have been created
  content = content.replace(/  +/g, ' ');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

const files = fs.readdirSync(directory);
for (const file of files) {
  if (file.endsWith('.jsx')) {
    processFile(path.join(directory, file));
  }
}
