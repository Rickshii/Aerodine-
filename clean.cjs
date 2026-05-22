const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src', 'pages');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Clean up invalid artifacts from previous replace
  content = content.replace(/\s:[a-zA-Z0-9\[\]\(\)\-\.]+/g, '');
  content = content.replace(/  +/g, ' ');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Cleaned ${filePath}`);
}

const files = fs.readdirSync(directory);
for (const file of files) {
  if (file.endsWith('.jsx')) {
    processFile(path.join(directory, file));
  }
}
