// Script de Backup do Banco de Dados Supabase
// Gera um arquivo SQL com schema + todos os dados (INSERT statements)
// Uso: node backup-db.cjs
// Requer: VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY no .env.local

const https = require('https');
const fs = require('fs');
const path = require('path');

// Lê variáveis do .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) throw new Error('.env.local não encontrado');
  const env = {};
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim();
  });
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Defina VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

// Tables in dependency order (referenced tables first)
const TABLES = [
  'settings',
  'users',
  'scouts',
  'promotions',
  'products',
  'ingredients',
  'stock_logs',
  'shifts',
  'orders',
  'stripe_events',
];

function fetchTable(tableName) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=none',
      },
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const rows = JSON.parse(data);
          if (!Array.isArray(rows)) {
            console.error(`  ⚠️  Resposta inesperada para ${tableName}:`, data.substring(0, 200));
            resolve([]);
          } else {
            resolve(rows);
          }
        } catch (e) {
          reject(new Error(`Erro ao parsear ${tableName}: ${e.message} — ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
  });
}

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    // JSONB / arrays
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  // String: escape single quotes
  return `'${String(val).replace(/'/g, "''")}'`;
}

function rowToInsert(tableName, row) {
  const cols = Object.keys(row).map(c => `"${c}"`).join(', ');
  const vals = Object.values(row).map(escapeValue).join(', ');
  return `INSERT INTO public."${tableName}" (${cols}) VALUES (${vals});`;
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(__dirname, 'supabase', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const outFile = path.join(backupDir, `backup_${timestamp}.sql`);
  const lines = [];

  lines.push('-- ============================================================');
  lines.push(`-- OmniBurger POS Suite v2 - Database Backup`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Project: ptwmrijktoazwqfnuaur`);
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('-- Disable triggers during restore');
  lines.push('SET session_replication_role = replica;');
  lines.push('');

  // Include schema
  lines.push('-- ============================================================');
  lines.push('-- SCHEMA');
  lines.push('-- ============================================================');
  lines.push('');
  const schemaPath = path.join(__dirname, 'supabase', 'schema.clean.sql');
  if (fs.existsSync(schemaPath)) {
    lines.push(fs.readFileSync(schemaPath, 'utf-8'));
  }
  lines.push('');

  // Export data per table
  lines.push('-- ============================================================');
  lines.push('-- DATA');
  lines.push('-- ============================================================');
  lines.push('');

  let totalRows = 0;

  for (const table of TABLES) {
    process.stdout.write(`  Exportando ${table}... `);
    try {
      const rows = await fetchTable(table);
      lines.push(`-- Table: ${table} (${rows.length} rows)`);
      if (rows.length > 0) {
        lines.push(`TRUNCATE TABLE public."${table}" RESTART IDENTITY CASCADE;`);
        for (const row of rows) {
          lines.push(rowToInsert(table, row));
        }
      }
      lines.push('');
      totalRows += rows.length;
      console.log(`✅ ${rows.length} registros`);
    } catch (err) {
      lines.push(`-- ERRO ao exportar ${table}: ${err.message}`);
      lines.push('');
      console.log(`❌ ERRO: ${err.message}`);
    }
  }

  lines.push('-- Re-enable triggers');
  lines.push('SET session_replication_role = DEFAULT;');
  lines.push('');
  lines.push(`-- Backup concluído: ${totalRows} registros exportados`);

  fs.writeFileSync(outFile, lines.join('\n'), 'utf-8');

  console.log('');
  console.log(`✅ Backup salvo em: ${outFile}`);
  console.log(`   Total de registros: ${totalRows}`);
  console.log(`   Tamanho do arquivo: ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
