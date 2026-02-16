import NetInfo from "@react-native-community/netinfo";
import { db, sqlite } from "../../db";
import { orders, syncQueue } from "../../db/schema";
import { eq, asc } from "drizzle-orm";
import { isOnline } from "./connectivity";
import { setIsSyncing } from "./syncState";

let syncing = false;
let pendingTrigger: ReturnType<typeof setTimeout> | null = null;

/**
 * Simula llamada a API (pero falla si no hay internet real).
 * Nota: en prod cambiarías esto por fetch a tu backend.
 */
async function fakeApiCall(payload: unknown) {
  const online = await isOnline();
  if (!online) throw new Error("No internet");

  await new Promise((res) => setTimeout(res, 600));
  return payload;
}

export async function processSyncQueue(): Promise<number> {
  if (syncing) return 0;

  const online = await isOnline();
  if (!online) return 0;
	

  syncing = true;
  setIsSyncing(true);
  try {
    const pending = await db
      .select()
      .from(syncQueue)
      .where(eq(syncQueue.synced, 0))
      .orderBy(asc(syncQueue.createdAt));

    if (pending.length === 0) return 0;

    let syncedCount = 0;

    for (const item of pending) {
      try {
        if (!(await isOnline())) break;

        const payload = JSON.parse(item.payload);

        await fakeApiCall(payload);

        sqlite.execSync("BEGIN;");
        try {
					if (item.type === "CREATE_ORDER") {
            await db
              .update(orders)
              .set({ synced: 1 })
              .where(eq(orders.id, payload.orderId));
          }

					if (item.type === "DELETE_ORDER") {
            // “en prod” lo mandarías al backend
            // aquí solo marcamos la acción como synced
          }


          if (item.type === "UPDATE_ORDER_STATUS") {
            await db
              .update(orders)
              .set({ synced: 1 })
              .where(eq(orders.id, payload.orderId));
          }

          await db
            .update(syncQueue)
            .set({ synced: 1 })
            .where(eq(syncQueue.id, item.id));

          sqlite.execSync("COMMIT;");
          syncedCount++;
        } catch (e) {
          sqlite.execSync("ROLLBACK;");
          throw e;
        }
      } catch (err) {
        console.warn("Sync failed; will retry later", err);
        break;
      }
    }

    return syncedCount;
  } finally {
    syncing = false;
		setIsSyncing(false);
  }
}

/**
 * Auto-sync con:
 * - validación de internet alcanzable
 * - debounce para evitar ráfagas
 * - lock para evitar paralelo
 */
export function startAutoSync(onSynced?: (syncedCount: number) => void) {
  return NetInfo.addEventListener((state) => {
    const online = !!state.isConnected && state.isInternetReachable !== false;
    if (!online) return;

    if (pendingTrigger) clearTimeout(pendingTrigger);
    pendingTrigger = setTimeout(async () => {
      pendingTrigger = null;
      const count = await processSyncQueue();
      if (count > 0) onSynced?.(count);
    }, 400);
  });
}
