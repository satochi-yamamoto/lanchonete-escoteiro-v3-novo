type LocalRow = { payload: string };

export type QueuedOperation = {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  resource: string;
  recordId: string;
  payload?: unknown;
};

type SqlDatabase = {
  execute: (sql: string, bindValues?: unknown[]) => Promise<unknown>;
  select: <T>(sql: string, bindValues?: unknown[]) => Promise<T[]>;
};

let database: Promise<SqlDatabase> | null = null;

export const isDesktopRuntime = () => typeof window !== 'undefined'
  && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

const getDatabase = async () => {
  if (!isDesktopRuntime()) throw new Error('SQLite local está disponível somente no aplicativo Windows.');
  if (!database) {
    database = import('@tauri-apps/plugin-sql').then(async ({ default: Database }) => {
      const db = await Database.load('sqlite:lanchonete-offline.db');
      await db.execute(`create table if not exists local_records (
        collection text not null, record_id text not null, payload text not null,
        updated_at text not null default current_timestamp,
        primary key (collection, record_id)
      )`);
      await db.execute(`create table if not exists sync_outbox (
        sequence integer primary key autoincrement, operation_id text not null unique,
        method text not null, resource text not null, record_id text not null,
        payload text, attempts integer not null default 0, created_at text not null default current_timestamp,
        last_error text
      )`);
      return db as SqlDatabase;
    });
  }
  return database;
};

export const localRecords = async <T>(collection: string): Promise<T[]> => {
  const db = await getDatabase();
  const rows = await db.select<LocalRow>('select payload from local_records where collection = $1 order by updated_at desc', [collection]);
  return rows.map((row) => JSON.parse(row.payload) as T);
};

export const saveLocalRecord = async (collection: string, recordId: string, value: unknown) => {
  const db = await getDatabase();
  await db.execute(`insert into local_records (collection, record_id, payload, updated_at) values ($1, $2, $3, current_timestamp)
    on conflict(collection, record_id) do update set payload = excluded.payload, updated_at = current_timestamp`, [collection, recordId, JSON.stringify(value)]);
};

export const removeLocalRecord = async (collection: string, recordId: string) => {
  const db = await getDatabase();
  await db.execute('delete from local_records where collection = $1 and record_id = $2', [collection, recordId]);
};

export const replaceLocalRecords = async (collection: string, values: Array<{ id: string }>) => {
  const db = await getDatabase();
  await db.execute('delete from local_records where collection = $1', [collection]);
  for (const value of values) await saveLocalRecord(collection, value.id, value);
};

export const enqueueLocalOperation = async (operation: QueuedOperation) => {
  const db = await getDatabase();
  await db.execute(`insert into sync_outbox (operation_id, method, resource, record_id, payload)
    values ($1, $2, $3, $4, $5) on conflict(operation_id) do nothing`, [
    operation.id, operation.method, operation.resource, operation.recordId,
    operation.payload === undefined ? null : JSON.stringify(operation.payload),
  ]);
};

export const pendingLocalOperations = async (): Promise<QueuedOperation[]> => {
  const db = await getDatabase();
  const rows = await db.select<Array<QueuedOperation & { payload: string | null }>[number]>('select operation_id as id, method, resource, record_id as recordId, payload from sync_outbox order by sequence');
  return rows.map((row) => ({ ...row, payload: row.payload ? JSON.parse(row.payload) : undefined }));
};

export const acknowledgeLocalOperation = async (id: string) => {
  const db = await getDatabase();
  await db.execute('delete from sync_outbox where operation_id = $1', [id]);
};

export const markLocalOperationFailure = async (id: string, error: unknown) => {
  const db = await getDatabase();
  await db.execute('update sync_outbox set attempts = attempts + 1, last_error = $1 where operation_id = $2', [String(error), id]);
};
