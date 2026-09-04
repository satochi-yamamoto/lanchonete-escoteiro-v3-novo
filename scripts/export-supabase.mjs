import fs from 'node:fs/promises';
import path from 'node:path';

const envPath = path.resolve('.env.local');
const envLines = await fs.readFile(envPath, 'utf8');
const env = Object.fromEntries(envLines.split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  return match ? [[match[1], match[2].replace(/^("|')|("|')$/g, '')]] : [];
}));
const baseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!baseUrl || !serviceKey) throw new Error('VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios em .env.local.');

const tables = ['settings', 'users', 'scouts', 'promotions', 'products', 'ingredients', 'stock_logs', 'store_sessions', 'shifts', 'orders', 'stripe_events'];
const exportData = { version: 1, exportedAt: new Date().toISOString(), tables: {} };
for (const table of tables) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${baseUrl}/rest/v1/${table}?select=*`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Range: `${offset}-${offset + 999}` }
    });
    if (!response.ok) throw new Error(`Falha ao exportar ${table}: HTTP ${response.status}`);
    const page = await response.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  exportData.tables[table] = rows;
  console.log(`${table}: ${rows.length} registros`);
}
const target = process.argv[2] || path.resolve('backups', `supabase-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
await fs.mkdir(path.dirname(target), { recursive: true });
await fs.writeFile(target, JSON.stringify(exportData), { mode: 0o600 });
console.log(`Exportação salva em ${target}`);
