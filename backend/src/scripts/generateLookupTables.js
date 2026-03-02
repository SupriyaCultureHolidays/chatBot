import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dataService from '../services/dataService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateLookupTables() {
  console.log('🔄 Generating Rasa lookup tables from database...');
  
  const nationalities = await dataService.getAllNationalities();
  const companies = await dataService.getAllCompanies();
  const agents = dataService.agentData;
  
  const agentNames = [...new Set(agents.map(a => a.Name).filter(Boolean))];
  
  const lookupYaml = `version: "3.1"

nlu:
  - lookup: agent_name
    examples: |
${agentNames.map(name => `      - ${name}`).join('\n')}

  - lookup: company_name
    examples: |
${companies.map(comp => `      - ${comp}`).join('\n')}

  - lookup: nationality
    examples: |
${nationalities.map(nat => `      - ${nat}`).join('\n')}

  - regex: agent_id
    examples: |
      - pattern: "CHAGT\\\\d{13}"
      - pattern: "AG\\\\d{3,6}"

  - regex: email
    examples: |
      - pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}"
`;

  const outputPath = path.join(__dirname, '../../../rasa/data/lookup_tables.yml');
  fs.writeFileSync(outputPath, lookupYaml, 'utf-8');
  
  console.log(`✅ Generated lookup tables with:`);
  console.log(`   - ${agentNames.length} agent names`);
  console.log(`   - ${companies.length} companies`);
  console.log(`   - ${nationalities.length} nationalities`);
  console.log(`📁 Saved to: ${outputPath}`);
}

generateLookupTables().catch(console.error);
