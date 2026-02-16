import { sqlite } from "./index";

const migrations: string[] = [
  // v1
  `
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    synced INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY NOT NULL,
    order_id TEXT NOT NULL,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    synced INTEGER NOT NULL DEFAULT 0
  );
  `,
];

function getUserVersion(): number {
  const res = sqlite.getFirstSync<{ user_version: number }>(
    "PRAGMA user_version;",
  );
  return res?.user_version ?? 0;
}

function setUserVersion(v: number) {
  sqlite.execSync(`PRAGMA user_version = ${v};`);
}

export function runMigrations() {
  // ✅ WAL fuera de transacción
  sqlite.execSync("PRAGMA journal_mode = WAL;");

  const current = getUserVersion();
  const target = migrations.length;

  if (current > target) {
    throw new Error(
      `DB version (${current}) is newer than app migrations (${target}).`,
    );
  }

  for (let i = current; i < target; i++) {
    const sql = migrations[i];

    sqlite.execSync("BEGIN;");
    try {
      sqlite.execSync(sql);
      sqlite.execSync("COMMIT;");
      setUserVersion(i + 1);
    } catch (e) {
      sqlite.execSync("ROLLBACK;");
      throw e;
    }
  }
}
