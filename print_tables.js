import fs from 'fs';

try {
  const schema = JSON.parse(fs.readFileSync('schema_openapi.json', 'utf8'));
  console.log('Tables and Columns:');
  if (schema.definitions) {
    for (const [tableName, definition] of Object.entries(schema.definitions)) {
      console.log(`\nTable: ${tableName}`);
      if (definition.properties) {
        for (const [colName, colDef] of Object.entries(definition.properties)) {
          const type = colDef.format || colDef.type || 'unknown';
          const description = colDef.description || '';
          console.log(`  - ${colName}: ${type} ${description ? '(' + description + ')' : ''}`);
        }
      }
    }
  } else {
    console.log('No definitions object found in OpenAPI schema');
  }
} catch (e) {
  console.error(e);
}
