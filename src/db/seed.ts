import { db } from "./index";
import { orders, orderItems } from "./schema";
import { eq } from "drizzle-orm";

const now = () => Date.now();
const uid = () =>
  Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);

export async function seedIfEmpty() {
  const existing = await db.select().from(orders).limit(1);
  if (existing.length > 0) return;

  const o1 = {
    id: uid(),
    code: "ORD-1024",
    status: "PENDING",
    updatedAt: now(),
    synced: 1,
  };
  const o2 = {
    id: uid(),
    code: "ORD-1025",
    status: "PICKING",
    updatedAt: now(),
    synced: 1,
  };

  await db.insert(orders).values([o1, o2]);

  await db.insert(orderItems).values([
    { id: uid(), orderId: o1.id, name: "Coca-Cola 600ml", qty: 12 },
    { id: uid(), orderId: o1.id, name: "Sabritas 45g", qty: 20 },
    { id: uid(), orderId: o2.id, name: "Agua 1L", qty: 10 },
  ]);
}
