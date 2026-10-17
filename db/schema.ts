import { pgTable, serial, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const products = pgTable('productlink_products', {
  id: serial().primaryKey(),
  url: text().notNull().unique(),
  data: jsonb().$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
