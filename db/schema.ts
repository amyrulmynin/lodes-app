import { pgTable, text, serial, timestamp, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum('role', ['admin', 'affiliate']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'accepted', 'rejected']);
export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['pending', 'accepted', 'rejected']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default('affiliate'),
  phone: text("phone"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  commissionBalance: decimal("commission_balance", { precision: 10, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const desserts = pgTable("desserts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default('10.00'),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").notNull().references(() => users.id),
  dessertId: integer("dessert_id").notNull().references(() => desserts.id),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  status: orderStatusEnum("status").notNull().default('pending'),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
});

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  bankName: text("bank_name").notNull(),
  bankAccount: text("bank_account").notNull(),
  accountHolder: text("account_holder").notNull(),
  status: withdrawalStatusEnum("status").notNull().default('pending'),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
  notes: text("notes"),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  withdrawals: many(withdrawals),
}));

export const dessertsRelations = relations(desserts, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  affiliate: one(users, {
    fields: [orders.affiliateId],
    references: [users.id],
  }),
  dessert: one(desserts, {
    fields: [orders.dessertId],
    references: [desserts.id],
  }),
  processor: one(users, {
    fields: [orders.processedBy],
    references: [users.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  affiliate: one(users, {
    fields: [withdrawals.affiliateId],
    references: [users.id],
  }),
  processor: one(users, {
    fields: [withdrawals.processedBy],
    references: [users.id],
  }),
}));

export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  qrCodeUrl: text("qr_code_url"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountHolder: text("account_holder"),
  paymentInstructions: text("payment_instructions"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
