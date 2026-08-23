import { pgTable, text, serial, timestamp, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum('role', ['admin']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'accepted', 'rejected', 'out_for_delivery', 'delivered']);
export const cashFlowTypeEnum = pgEnum('cash_flow_type', ['in', 'out']);
export const purchaseStatusEnum = pgEnum('purchase_status', ['pending', 'received', 'cancelled']);
export const supplierOrderStatusEnum = pgEnum('supplier_order_status', ['draft', 'sent', 'received', 'cancelled']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default('admin'),
  phone: text("phone"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const desserts = pgTable("desserts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id),
  dessertId: integer("dessert_id").notNull().references(() => desserts.id),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
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
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  locationAccuracy: decimal("location_accuracy", { precision: 10, scale: 2 }),
  trackingToken: text("tracking_token").unique(),
  driverToken: text("driver_token").unique(),
  deliveryProofUrl: text("delivery_proof_url"),
  status: orderStatusEnum("status").notNull().default('pending'),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
});

export const supplierOrders = pgTable("supplier_orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  orderNumber: text("order_number").notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default('0.00'),
  status: supplierOrderStatusEnum("status").notNull().default('draft'),
  orderDate: timestamp("order_date").notNull().defaultNow(),
  expectedDate: timestamp("expected_date"),
  receivedDate: timestamp("received_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supplierOrderItems = pgTable("supplier_order_items", {
  id: serial("id").primaryKey(),
  supplierOrderId: integer("supplier_order_id").notNull().references(() => supplierOrders.id),
  itemName: text("item_name").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("pcs"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  itemName: text("item_name").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("pcs"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: timestamp("expense_date").notNull().defaultNow(),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const founderSalaries = pgTable("founder_salaries", {
  id: serial("id").primaryKey(),
  founderName: text("founder_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  salaryMonth: text("salary_month").notNull(),
  paidAt: timestamp("paid_at").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cashFlow = pgTable("cash_flow", {
  id: serial("id").primaryKey(),
  type: cashFlowTypeEnum("type").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  referenceId: integer("reference_id"),
  referenceType: text("reference_type"),
  flowDate: timestamp("flow_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const dessertsRelations = relations(desserts, ({ many }) => ({
  orders: many(orders),
}));

export const agentsRelations = relations(agents, ({ many }) => ({
  orders: many(orders),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  supplierOrders: many(supplierOrders),
  purchases: many(purchases),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  agent: one(agents, {
    fields: [orders.agentId],
    references: [agents.id],
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

export const supplierOrdersRelations = relations(supplierOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [supplierOrders.supplierId],
    references: [suppliers.id],
  }),
  items: many(supplierOrderItems),
}));

export const supplierOrderItemsRelations = relations(supplierOrderItems, ({ one }) => ({
  supplierOrder: one(supplierOrders, {
    fields: [supplierOrderItems.supplierOrderId],
    references: [supplierOrders.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
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
  agentId: integer("agent_id").references(() => agents.id),
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
  agent: one(agents, {
    fields: [reviews.agentId],
    references: [agents.id],
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

export const deliveryLocations = pgTable("delivery_locations", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  accuracy: decimal("accuracy", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
