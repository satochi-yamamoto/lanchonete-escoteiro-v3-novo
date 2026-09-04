import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const { Pool } = pg;
const port = Number(process.env.PORT || 8787);
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

if ((!databaseUrl && !process.env.PGHOST) || !jwtSecret) {
  throw new Error('Database configuration and JWT_SECRET are required.');
}

const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : new Pool({
  host: process.env.PGHOST, port: Number(process.env.PGPORT || 5432), database: process.env.PGDATABASE,
  user: process.env.PGUSER, password: process.env.PGPASSWORD,
});
const app = express();
const sseClients = new Set();

app.use(cors({ origin: corsOrigins, methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json({ limit: '1mb' }));

const tables = {
  products: ['id', 'name', 'price', 'category', 'station', 'image', 'description', 'is_available', 'modifiers', 'recipe'],
  ingredients: ['id', 'name', 'unit', 'cost_per_unit', 'current_stock', 'min_stock', 'supplier'],
  promotions: ['id', 'name', 'type', 'rules', 'value', 'priority', 'valid_from', 'valid_until', 'valid_days', 'valid_hours_start', 'valid_hours_end', 'channels'],
  users: ['id', 'name', 'role'],
  scouts: ['id', 'name', 'branch', 'patrol'],
  orders: ['id', 'order_number', 'created_at', 'paid_at', 'started_at', 'ready_at', 'delivered_at', 'status', 'type', 'items', 'subtotal', 'discount', 'total', 'customer_name', 'payment_method', 'payment_info', 'shift_id', 'session_id', 'terminal_id'],
  shifts: ['id', 'staff_name', 'terminal_id', 'session_id', 'opened_at', 'closed_at', 'start_cash', 'current_cash', 'status', 'transactions', 'opening_product_cost_total', 'planned_normal_burgers', 'planned_vegan_burgers', 'planned_chefe_burgers', 'planned_escoteiro_extra_burgers', 'opening_unit_cost_suggested', 'opening_unit_cost', 'opening_promotion_quantity', 'opening_promotion_value', 'daily_menu_name', 'opening_drinks_liters', 'drinks_liters', 'burger_cost', 'burgers_produced', 'burgers_unsold', 'menu_name', 'closer_name', 'feedback', 'adjustments'],
  store_sessions: ['id', 'opened_at', 'closed_at', 'status', 'opened_by', 'closed_by', 'notes'],
};
const jsonColumns = {
  products: new Set(['modifiers', 'recipe']), promotions: new Set(['rules']), orders: new Set(['items', 'payment_info']),
  shifts: new Set(['transactions', 'adjustments']),
};
const resourceRoles = {
  products: ['ADMIN'],
  ingredients: ['ADMIN', 'MANAGER', 'CASHIER'],
  promotions: ['ADMIN'],
  users: ['ADMIN'],
  scouts: ['ADMIN'],
  orders: ['ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN'],
  shifts: ['ADMIN', 'MANAGER', 'CASHIER'],
  store_sessions: ['ADMIN'],
};
const stockRoles = ['ADMIN', 'MANAGER', 'CASHIER'];

const readAccessToken = (request) => {
  const header = request.get('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined;
};

const requireAuth = (request, response, next) => {
  try {
    const user = jwt.verify(readAccessToken(request), jwtSecret);
    if (user.token_use === 'sse') throw new Error('SSE ticket is not an access token');
    request.user = user;
    next();
  } catch {
    response.status(401).json({ error: 'Não autenticado.' });
  }
};

const requireAdmin = (request, response, next) => {
  if (request.user?.role !== 'ADMIN') return response.status(403).json({ error: 'Acesso administrativo necessário.' });
  next();
};

const requireRoles = (roles) => (request, response, next) => {
  if (!roles.includes(request.user?.role)) return response.status(403).json({ error: 'Sem permissão para esta operação.' });
  next();
};

const requireResourceRole = (request, response, next) => {
  const roles = resourceRoles[request.params.table];
  if (!roles) return response.status(404).json({ error: 'Tabela não permitida.' });
  return requireRoles(roles)(request, response, next);
};

const requireSseTicket = (request, response, next) => {
  try {
    const ticket = jwt.verify(request.query.ticket, jwtSecret, { audience: 'sse' });
    if (ticket.token_use !== 'sse') throw new Error('Invalid SSE ticket');
    request.user = ticket;
    next();
  } catch {
    response.status(401).json({ error: 'Ticket SSE inválido.' });
  }
};

const publicUser = ({ id, name, role }) => ({ id, name, role });
const cleanValue = (value) => value === undefined ? undefined : value;

const getSettings = async (id, fallback) => {
  const { rows } = await pool.query('select value from settings where id = $1', [id]);
  return rows[0]?.value ?? fallback;
};

const ensureSettings = async () => {
  const defaults = {
    tax_settings: { isEnabled: false, taxName: 'ICMS', defaultRate: 18, taxId: '', exemptCategories: [] },
    payment_settings: { pos: ['PIX', 'CASH'], kiosk: ['PIX', 'CASH'] },
    print_settings: { enabled: true },
    business_rules: { maxItemsPerOrder: 3 },
    menu_catalogs: [],
    terminals: [],
  };
  await Promise.all(Object.entries(defaults).map(([id, value]) => pool.query(
    'insert into settings (id, value) values ($1, $2::jsonb) on conflict (id) do nothing', [id, JSON.stringify(value)]
  )));
};

const sendEvent = (event) => {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) client.write(payload);
};

const upsert = async (table, id, payload) => {
  const allowed = tables[table];
  if (!allowed) throw new Error('Tabela não permitida.');
  const values = { ...payload, id };
  const columns = allowed.filter((column) => cleanValue(values[column]) !== undefined);
  if (!columns.includes('id')) columns.unshift('id');
  if (!columns.length) throw new Error('Dados ausentes.');
  const params = columns.map((column) => jsonColumns[table]?.has(column) && values[column] !== null
    ? JSON.stringify(values[column]) : values[column]);
  const quotedColumns = columns.map((column) => `"${column}"`).join(', ');
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const updateColumns = columns.filter((column) => column !== 'id').map((column) => `"${column}" = excluded."${column}"`);
  const updatedAt = ['products', 'ingredients', 'promotions', 'orders', 'shifts', 'store_sessions'].includes(table)
    ? ', updated_at = now()' : '';
  const conflict = updateColumns.length ? `do update set ${updateColumns.join(', ')}${updatedAt}` : 'do nothing';
  const { rows } = await pool.query(
    `insert into "${table}" (${quotedColumns}) values (${placeholders}) on conflict (id) ${conflict} returning *`, params
  );
  return rows[0];
};

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('select 1');
    response.json({ status: 'ok' });
  } catch {
    response.status(503).json({ status: 'unavailable' });
  }
});

app.get('/api/login-users', async (_request, response, next) => {
  try { response.json((await pool.query('select id, name, role from users order by name')).rows); } catch (error) { next(error); }
});

app.get('/api/initial-state', requireAuth, async (_request, response, next) => {
  try {
    await ensureSettings();
    const [products, ingredients, stockLogs, promotions, users, orders, shifts, sessions, scouts, taxSettings, paymentSettings, printSettings, businessRules, menuCatalogs, terminals] = await Promise.all([
      pool.query('select * from products order by name'),
      pool.query('select * from ingredients order by name'),
      pool.query('select * from stock_logs order by date desc limit 50'),
      pool.query('select * from promotions order by priority desc'),
      pool.query('select id, name, role from users order by name'),
      pool.query('select * from orders order by created_at desc'),
      pool.query("select * from shifts where status = 'OPEN' order by opened_at desc limit 1"),
      pool.query("select * from store_sessions where status = 'OPEN' order by opened_at desc limit 1"),
      pool.query('select * from scouts order by name'),
      getSettings('tax_settings', {}), getSettings('payment_settings', {}), getSettings('print_settings', { enabled: true }),
      getSettings('business_rules', { maxItemsPerOrder: 3 }), getSettings('menu_catalogs', []), getSettings('terminals', []),
    ]);
    response.json({ products: products.rows, ingredients: ingredients.rows, stockLogs: stockLogs.rows, promotions: promotions.rows,
      users: users.rows, orders: orders.rows, currentShift: shifts.rows[0] ?? null, currentSession: sessions.rows[0] ?? null,
      scouts: scouts.rows, taxSettings, paymentSettings, printSettings, businessRules, menuCatalogs, terminals });
  } catch (error) { next(error); }
});

app.post('/api/auth/pin', async (request, response, next) => {
  try {
    const { userId, pin } = request.body ?? {};
    if (typeof userId !== 'string' || !/^\d{4}$/.test(pin ?? '')) return response.status(400).json({ error: 'Credenciais inválidas.' });
    const { rows } = await pool.query('select id, name, role, pin_hash, failed_pin_attempts, pin_locked_until from users where id = $1', [userId]);
    const user = rows[0];
    if (!user || (user.pin_locked_until && new Date(user.pin_locked_until) > new Date())) return response.status(401).json({ error: 'PIN inválido.' });
    const verified = await pool.query('select crypt($1, $2) = $2 as valid', [pin, user.pin_hash]);
    if (!verified.rows[0].valid) {
      await pool.query(`update users set failed_pin_attempts = failed_pin_attempts + 1,
        pin_locked_until = case when failed_pin_attempts + 1 >= 5 then now() + interval '15 minutes' else pin_locked_until end where id = $1`, [userId]);
      return response.status(401).json({ error: 'PIN inválido.' });
    }
    await pool.query('update users set failed_pin_attempts = 0, pin_locked_until = null where id = $1', [userId]);
    const safeUser = publicUser(user);
    const token = jwt.sign(safeUser, jwtSecret, { expiresIn: '12h' });
    response.json({ user: safeUser, token });
  } catch (error) { next(error); }
});

app.post('/api/events/token', requireAuth, (request, response) => {
  const ticket = jwt.sign({ ...publicUser(request.user), token_use: 'sse' }, jwtSecret, { expiresIn: '2m', audience: 'sse' });
  response.json({ ticket });
});

app.get('/api/events', requireSseTicket, (request, response) => {
  response.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' });
  response.flushHeaders();
  response.write('event: ready\ndata: {"status":"SUBSCRIBED"}\n\n');
  sseClients.add(response);
  request.on('close', () => sseClients.delete(response));
});

app.get('/api/reports', requireAuth, async (request, response, next) => {
  try {
    const values = [];
    const where = [];
    if (request.query.startDate) { values.push(request.query.startDate); where.push(`opened_at >= $${values.length}`); }
    if (request.query.endDate) { values.push(request.query.endDate); where.push(`opened_at <= $${values.length}`); }
    const shifts = await pool.query(`select * from shifts ${where.length ? `where ${where.join(' and ')}` : ''} order by opened_at desc`, values);
    if (!shifts.rows.length) return response.json({ shifts: [], orders: [] });
    const orders = await pool.query('select * from orders where shift_id = any($1::text[])', [shifts.rows.map((shift) => shift.id)]);
    response.json({ shifts: shifts.rows, orders: orders.rows });
  } catch (error) { next(error); }
});

app.get('/api/scouts', requireAuth, async (_request, response, next) => {
  try { response.json((await pool.query('select * from scouts order by name')).rows); } catch (error) { next(error); }
});

app.get('/api/orders', requireAuth, async (_request, response, next) => {
  try { response.json((await pool.query('select * from orders order by created_at desc')).rows); } catch (error) { next(error); }
});

app.put('/api/resources/:table/:id', requireAuth, requireResourceRole, async (request, response, next) => {
  try {
    response.json(await upsert(request.params.table, request.params.id, request.body ?? {}));
  } catch (error) { next(error); }
});

app.post('/api/stock-logs', requireAuth, requireRoles(stockRoles), async (request, response, next) => {
  try {
    const log = request.body ?? {};
    const columns = ['id', 'date', 'ingredient_id', 'change', 'type', 'notes'].filter((column) => log[column] !== undefined);
    const { rows } = await pool.query(`insert into stock_logs (${columns.map((column) => `"${column}"`).join(', ')}) values (${columns.map((_, index) => `$${index + 1}`).join(', ')}) on conflict (id) do nothing returning *`, columns.map((column) => log[column]));
    const record = rows[0] ?? (await pool.query('select * from stock_logs where id = $1', [log.id])).rows[0];
    response.status(rows[0] ? 201 : 200).json(record);
  } catch (error) { next(error); }
});

app.put('/api/settings/:id', requireAuth, requireAdmin, async (request, response, next) => {
  try {
    const { rows } = await pool.query('insert into settings (id, value) values ($1, $2::jsonb) on conflict (id) do update set value = excluded.value, updated_at = now() returning value', [request.params.id, JSON.stringify(request.body ?? {})]);
    response.json(rows[0].value);
  } catch (error) { next(error); }
});

app.put('/api/users/:id', requireAuth, requireAdmin, async (request, response, next) => {
  try {
    const { name, role, pin } = request.body ?? {};
    if (!['ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN'].includes(role) || !name) return response.status(400).json({ error: 'Dados de usuário inválidos.' });
    const existing = await pool.query('select id from users where id = $1', [request.params.id]);
    if (!existing.rows[0] && !/^\d{4}$/.test(pin ?? '')) return response.status(400).json({ error: 'PIN de 4 dígitos é obrigatório para novo usuário.' });
    if (pin && !/^\d{4}$/.test(pin)) return response.status(400).json({ error: 'PIN inválido.' });
    const { rows } = await pool.query(`insert into users (id, name, role, pin_hash) values ($1, $2, $3, case when $4::text is null then null else crypt($4, gen_salt('bf')) end)
      on conflict (id) do update set name = excluded.name, role = excluded.role, pin_hash = case when $4::text is null then users.pin_hash else excluded.pin_hash end,
      failed_pin_attempts = case when $4::text is null then users.failed_pin_attempts else 0 end, pin_locked_until = case when $4::text is null then users.pin_locked_until else null end returning id, name, role`, [request.params.id, name, role, pin || null]);
    response.json(rows[0]);
  } catch (error) { next(error); }
});

app.delete('/api/resources/:table/:id', requireAuth, requireResourceRole, async (request, response, next) => {
  try {
    const allowed = tables[request.params.table];
    await pool.query(`delete from "${request.params.table}" where id = $1`, [request.params.id]);
    response.status(204).end();
  } catch (error) { next(error); }
});

app.post('/api/admin/reset', requireAuth, requireAdmin, async (request, response, next) => {
  const client = await pool.connect();
  try {
    const keepCatalog = request.body?.keepCatalog !== false;
    await client.query('begin');
    await client.query('delete from orders; delete from shifts; delete from store_sessions; delete from stock_logs;');
    if (!keepCatalog) await client.query('delete from promotions; delete from products; delete from ingredients; delete from scouts;');
    await client.query('commit');
    response.status(204).end();
  } catch (error) { await client.query('rollback').catch(() => {}); next(error); } finally { client.release(); }
});

app.post('/api/admin/force-complete-orders', requireAuth, requireAdmin, async (_request, response, next) => {
  try {
    await pool.query("update orders set status = 'DELIVERED', delivered_at = now(), ready_at = coalesce(ready_at, now()), updated_at = now() where status not in ('DELIVERED', 'CANCELLED')");
    response.status(204).end();
  } catch (error) { next(error); }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Erro interno do servidor.' });
});

const listenForDatabaseEvents = async () => {
  const client = await pool.connect();
  await client.query('listen pos_changes');
  client.on('notification', async (notification) => {
    try {
      const event = JSON.parse(notification.payload);
      if (!['orders', 'shifts', 'store_sessions'].includes(event.entity)) return;
      if (event.eventType === 'DELETE') return sendEvent({ entity: event.entity, eventType: 'DELETE', old: { id: event.id } });
      const { rows } = await pool.query(`select * from "${event.entity}" where id = $1`, [event.id]);
      if (rows[0]) sendEvent({ entity: event.entity, eventType: event.eventType, new: rows[0], old: null });
    } catch (error) { console.error('Could not broadcast database event', error); }
  });
};

await listenForDatabaseEvents();
app.listen(port, () => console.log(`Lanchonete API listening on ${port}`));
