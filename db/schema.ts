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
  feedbackToken: text("feedback_token").unique(),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  mudahpayTxnId: text("mudahpay_txn_id"),
  paidAt: timestamp("paid_at"),
  status: orderStatusEnum("status").notNull().default('pending'),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
});

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  withdrawalMethod: text("withdrawal_method").notNull().default('bank'),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  accountHolder: text("account_holder"),
  qrCodeUrl: text("qr_code_url"),
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


export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).unique(),
  affiliateId: integer("affiliate_id").references(() => users.id),
  dessertId: integer("dessert_id").references(() => desserts.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  source: text("source").notNull().default("order"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isVisible: integer("is_visible").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  dessert: one(desserts, {
    fields: [reviews.dessertId],
    references: [desserts.id],
  }),
  affiliate: one(users, {
    fields: [reviews.affiliateId],
    references: [users.id],
  }),
}));



export const integrationSettings = pgTable("integration_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  isEnabled: integer("is_enabled").notNull().default(0),
  config: text("config").notNull().default("{}"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("pcs"),
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  minStockLevel: decimal("min_stock_level", { precision: 10, scale: 2 }).notNull().default("0"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id),
  type: text("type").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
