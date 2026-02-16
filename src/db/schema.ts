import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  status: text("status").notNull(),
  updatedAt: integer("updated_at").notNull(),
  synced: integer("synced").notNull().default(1),
});

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  name: text("name").notNull(),
  qty: integer("qty").notNull(),
});

export const syncQueue = sqliteTable("sync_queue", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  payload: text("payload").notNull(),
  createdAt: integer("created_at").notNull(),
  synced: integer("synced").notNull().default(0),
});
