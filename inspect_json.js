import fs from 'fs';
const data = JSON.parse(fs.readFileSync('schema_openapi.json', 'utf8'));
console.log('Keys:', Object.keys(data));
if (data.paths) {
  console.log('Paths:', Object.keys(data.paths).slice(0, 10));
}
if (data.components) {
  console.log('Components keys:', Object.keys(data.components));
  if (data.components.schemas) {
    console.log('Schemas:', Object.keys(data.components.schemas));
    for (const [name, schema] of Object.entries(data.components.schemas)) {
      console.log(`\nSchema: ${name}`);
      if (schema.properties) {
        for (const [col, info] of Object.entries(schema.properties)) {
          console.log(`  - ${col}: ${info.type}`);
        }
      }
    }
  }
}
