import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin"] }).notNull().default("admin"),
  phone: text("phone"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const desserts = sqliteTable("desserts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const agents = sqliteTable("agents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agentId: integer("agent_id").references(() => agents.id),
  dessertId: integer("dessert_id").notNull().references(() => desserts.id),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: text("total_price").notNull(),
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
  driverToken: text("driver_token").unique(),
  deliveryProofUrl: text("delivery_proof_url"),
  status: text("status", { enum: ["pending", "accepted", "rejected", "out_for_delivery", "delivered"] }).notNull().default("pending"),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  processedAt: integer("processed_at", { mode: "timestamp" }),
  processedBy: integer("processed_by").references(() => users.id),
});

export const supplierOrders = sqliteTable("supplier_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  orderNumber: text("order_number").notNull().unique(),
  totalAmount: text("total_amount").notNull().default("0.00"),
  status: text("status", { enum: ["draft", "sent", "received", "cancelled"] }).notNull().default("draft"),
  orderDate: integer("order_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  expectedDate: integer("expected_date", { mode: "timestamp" }),
  receivedDate: integer("received_date", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const supplierOrderItems = sqliteTable("supplier_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierOrderId: integer("supplier_order_id").notNull().references(() => supplierOrders.id),
  itemName: text("item_name").notNull(),
  quantity: text("quantity").notNull(),
  unit: text("unit").notNull().default("pcs"),
  unitPrice: text("unit_price").notNull(),
  totalPrice: text("total_price").notNull(),
});

export const purchases = sqliteTable("purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  itemName: text("item_name").notNull(),
  quantity: text("quantity").notNull(),
  unit: text("unit").notNull().default("pcs"),
  unitPrice: text("unit_price").notNull(),
  totalPrice: text("total_price").notNull(),
  purchaseDate: integer("purchase_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: text("amount").notNull(),
  expenseDate: integer("expense_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const founderSalaries = sqliteTable("founder_salaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  founderName: text("founder_name").notNull(),
  amount: text("amount").notNull(),
  salaryMonth: text("salary_month").notNull(),
  paidAt: integer("paid_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const cashFlow = sqliteTable("cash_flow", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["in", "out"] }).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: text("amount").notNull(),
  referenceId: integer("reference_id"),
  referenceType: text("reference_type"),
  flowDate: integer("flow_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
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
  agentId: integer("agent_id").references(() => agents.id),
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

export const deliveryLocations = sqliteTable("delivery_locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  accuracy: text("accuracy"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const telegramInvoiceStates = sqliteTable("telegram_invoice_states", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: text("chat_id").notNull().unique(),
  step: text("step").notNull().default("idle"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  items: text("items").notNull().default("[]"),
  currentItem: text("current_item"),
  notes: text("notes"),
  status: text("status").notNull().default("accepted"),
  invoiceNumber: text("invoice_number").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
