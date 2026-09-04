import fs from 'node:fs/promises';
import pg from 'pg';

const source = process.argv[2];
if (!source) throw new Error('Uso: node scripts/import-postgres.mjs /backups/supabase-export.json');
const document = JSON.parse(await fs.readFile(source, 'utf8'));
const { Pool } = pg;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : new Pool({
  host: process.env.PGHOST, port: Number(process.env.PGPORT || 5432), database: process.env.PGDATABASE,
  user: process.env.PGUSER, password: process.env.PGPASSWORD,
});
const client = await pool.connect();
const columnSets = {
  settings: ['id', 'value'], users: ['id', 'name', 'role', 'pin', 'pin_hash', 'failed_pin_attempts', 'pin_locked_until'], scouts: ['id', 'name', 'branch', 'patrol', 'created_at'],
  promotions: ['id', 'name', 'type', 'rules', 'value', 'priority', 'valid_from', 'valid_until', 'valid_days', 'valid_hours_start', 'valid_hours_end', 'channels', 'updated_at'],
  products: ['id', 'name', 'price', 'category', 'station', 'image', 'description', 'is_available', 'modifiers', 'recipe', 'updated_at'],
  ingredients: ['id', 'name', 'unit', 'cost_per_unit', 'current_stock', 'min_stock', 'supplier', 'updated_at'],
  stock_logs: ['id', 'date', 'ingredient_id', 'change', 'type', 'notes'], store_sessions: ['id', 'opened_at', 'closed_at', 'status', 'opened_by', 'closed_by', 'notes', 'updated_at'],
  shifts: ['id', 'staff_name', 'terminal_id', 'session_id', 'opened_at', 'closed_at', 'start_cash', 'current_cash', 'status', 'transactions', 'opening_product_cost_total', 'planned_normal_burgers', 'planned_vegan_burgers', 'planned_chefe_burgers', 'planned_escoteiro_extra_burgers', 'opening_unit_cost_suggested', 'opening_unit_cost', 'opening_promotion_quantity', 'opening_promotion_value', 'daily_menu_name', 'opening_drinks_liters', 'drinks_liters', 'burger_cost', 'burgers_produced', 'burgers_unsold', 'menu_name', 'closer_name', 'feedback', 'adjustments', 'updated_at'],
  orders: ['id', 'order_number', 'created_at', 'paid_at', 'started_at', 'ready_at', 'delivered_at', 'status', 'type', 'items', 'subtotal', 'discount', 'total', 'customer_name', 'payment_method', 'payment_info', 'shift_id', 'session_id', 'terminal_id', 'updated_at'],
  stripe_events: ['id', 'stripe_event_id', 'type', 'payload', 'created_at'],
};
const jsonColumns = {
  settings: new Set(['value']), products: new Set(['modifiers', 'recipe']), promotions: new Set(['rules']),
  orders: new Set(['items', 'payment_info']), shifts: new Set(['transactions', 'adjustments']), stripe_events: new Set(['payload']),
};
try {
  await client.query('begin');
  for (const table of ['orders', 'shifts', 'store_sessions', 'stock_logs', 'products', 'ingredients', 'promotions', 'scouts', 'users', 'settings', 'stripe_events']) {
    const rows = document.tables?.[table] || [];
    await client.query(`truncate table "${table}" restart identity cascade`);
  }
  for (const table of ['settings', 'users', 'scouts', 'promotions', 'products', 'ingredients', 'stock_logs', 'store_sessions', 'shifts', 'orders', 'stripe_events']) {
    const rows = document.tables?.[table] || [];
    for (const row of rows) {
      const columns = columnSets[table].filter((column) => row[column] !== undefined && !(table === 'users' && (column === 'pin' || column === 'pin_hash')));
      const values = columns.map((column) => jsonColumns[table]?.has(column) && row[column] !== null
        ? JSON.stringify(row[column]) : row[column]);
      if (table === 'users') {
        const pin = row.pin;
        columns.push('pin_hash');
        if (pin) {
          values.push(pin);
          const pinPlaceholder = `$${values.length}`;
          await client.query(`insert into users (${columns.map((column) => `"${column}"`).join(', ')}) values (${columns.slice(0, -1).map((_, index) => `$${index + 1}`).join(', ')}, crypt(${pinPlaceholder}, gen_salt('bf')))`, values);
        } else if (row.pin_hash) {
          values.push(row.pin_hash);
          await client.query(`insert into users (${columns.map((column) => `"${column}"`).join(', ')}) values (${columns.map((_, index) => `$${index + 1}`).join(', ')})`, values);
        } else {
          throw new Error(`Usuário ${row.id} não possui PIN migrável.`);
        }
      } else if (columns.length) {
        await client.query(`insert into "${table}" (${columns.map((column) => `"${column}"`).join(', ')}) values (${columns.map((_, index) => `$${index + 1}`).join(', ')})`, values);
      }
    }
    const { rows: countRows } = await client.query(`select count(*)::integer as count from "${table}"`);
    if (countRows[0].count !== rows.length) throw new Error(`Contagem divergente em ${table}: esperado ${rows.length}, encontrado ${countRows[0].count}.`);
    console.log(`${table}: ${rows.length} registros importados`);
  }
  await client.query("select setval(pg_get_serial_sequence('stripe_events', 'id'), coalesce((select max(id) from stripe_events), 1), true)");
  await client.query('commit');
} catch (error) {
  await client.query('rollback');
  throw error;
} finally { client.release(); await pool.end(); }
