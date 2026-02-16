import { db, sqlite } from "../../db";
import { orders, orderItems, syncQueue } from "../../db/schema";
import { eq, desc, inArray } from "drizzle-orm";

const uid = () =>
  Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);

export async function listOrders() {
  return db.select().from(orders).orderBy(desc(orders.updatedAt));
}

export async function getOrderById(id: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));
  return { order, items };
}

/**
 * Offline-first: actualiza la orden localmente y encola acción para sync.
 */
export async function updateOrderStatusOfflineFirst(
  orderId: string,
  nextStatus: string,
) {
  const now = Date.now();

  await db
    .update(orders)
    .set({ status: nextStatus, updatedAt: now, synced: 0 })
    .where(eq(orders.id, orderId));

  await db.insert(syncQueue).values({
    id: uid(),
    type: "UPDATE_ORDER_STATUS",
    payload: JSON.stringify({ orderId, nextStatus, at: now }),
    createdAt: now,
    synced: 0,
  });
}

export async function createOrderOfflineFirst(input: { code: string }) {
  const now = Date.now();
  const id = uid();

  await db.insert(orders).values({
    id,
    code: input.code,
    status: "PENDING",
    updatedAt: now,
    synced: 0,
  });

  await db.insert(syncQueue).values({
    id: uid(),
    type: "CREATE_ORDER",
    payload: JSON.stringify({ orderId: id, code: input.code, at: now }),
    createdAt: now,
    synced: 0,
  });

  return id;
}

export async function deleteOrderOfflineFirst(orderId: string) {
  const now = Date.now();

  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  await db.delete(orders).where(eq(orders.id, orderId));

  await db.insert(syncQueue).values({
    id: uid(),
    type: "DELETE_ORDER",
    payload: JSON.stringify({ orderId, at: now }),
    createdAt: now,
    synced: 0,
  });
}

export async function deleteOrdersOfflineFirst(orderIds: string[]) {
  if (orderIds.length === 0) return;

  const now = Date.now();

  sqlite.execSync("BEGIN;");
  try {
    await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
    await db.delete(orders).where(inArray(orders.id, orderIds));

    await db.insert(syncQueue).values(
      orderIds.map((orderId) => ({
        id: uid(),
        type: "DELETE_ORDER",
        payload: JSON.stringify({ orderId, at: now }),
        createdAt: now,
        synced: 0,
      })),
    );

    sqlite.execSync("COMMIT;");
  } catch (e) {
    sqlite.execSync("ROLLBACK;");
    throw e;
  }
}