import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "affiliate"] }).notNull().default("affiliate"),
  phone: text("phone"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  commissionBalance: text("commission_balance").notNull().default("0.00"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const desserts = sqliteTable("desserts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  commissionRate: text("commission_rate").notNull().default("10.00"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  affiliateId: integer("affiliate_id").notNull().references(() => users.id),
  dessertId: integer("dessert_id").notNull().references(() => desserts.id),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: text("total_price").notNull(),
  commissionAmount: text("commission_amount").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  feedbackToken: text("feedback_token").unique(),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  mudahpayTxnId: text("mudahpay_txn_id"),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  latitude: text("latitude"),
  longitude: text("longitude"),
  locationAccuracy: text("location_accuracy"),
  trackingToken: text("tracking_token").unique(),
  status: text("status", { enum: ["pending", "accepted", "rejected", "out_for_delivery", "delivered"] }).notNull().default("pending"),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  processedAt: integer("processed_at", { mode: "timestamp" }),
  processedBy: integer("processed_by").references(() => users.id),
});

export const withdrawals = sqliteTable("withdrawals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  affiliateId: integer("affiliate_id").notNull().references(() => users.id),
  amount: text("amount").notNull(),
  withdrawalMethod: text("withdrawal_method").notNull().default("bank"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  accountHolder: text("account_holder"),
  qrCodeUrl: text("qr_code_url"),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  requestedAt: integer("requested_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  processedAt: integer("processed_at", { mode: "timestamp" }),
  processedBy: integer("processed_by").references(() => users.id),
  notes: text("notes"),
});

export const paymentSettings = sqliteTable("payment_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  qrCodeUrl: text("qr_code_url"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountHolder: text("account_holder"),
  paymentInstructions: text("payment_instructions"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});


export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => orders.id).unique(),
  affiliateId: integer("affiliate_id").references(() => users.id),
  dessertId: integer("dessert_id").references(() => desserts.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  source: text("source").notNull().default("order"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isVisible: integer("is_visible").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});



export const integrationSettings = sqliteTable("integration_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  isEnabled: integer("is_enabled").notNull().default(0),
  config: text("config").notNull().default("{}"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const ingredients = sqliteTable("ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("pcs"),
  currentStock: text("current_stock").notNull().default("0"),
  minStockLevel: text("min_stock_level").notNull().default("0"),
  costPerUnit: text("cost_per_unit"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const stockMovements = sqliteTable("stock_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id),
  type: text("type").notNull(),
  quantity: text("quantity").notNull(),
  note: text("note"),
  receiptUrl: text("receipt_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
