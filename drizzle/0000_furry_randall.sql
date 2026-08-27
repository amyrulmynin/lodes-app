DO $$ BEGIN
 CREATE TYPE "public"."cash_flow_type" AS ENUM('in', 'out');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."order_status" AS ENUM('pending', 'accepted', 'rejected', 'out_for_delivery', 'delivered');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."purchase_status" AS ENUM('pending', 'received', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."supplier_order_status" AS ENUM('draft', 'sent', 'received', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"notes" text,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cash_flow" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "cash_flow_type" NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reference_id" integer,
	"reference_type" text,
	"flow_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"accuracy" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "desserts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"image_url" text,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"expense_date" timestamp DEFAULT now() NOT NULL,
	"receipt_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "founder_salaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"founder_name" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"salary_month" text NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"current_stock" numeric(10, 2) DEFAULT '0' NOT NULL,
	"min_stock_level" numeric(10, 2) DEFAULT '0' NOT NULL,
	"cost_per_unit" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integration_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"is_enabled" integer DEFAULT 0 NOT NULL,
	"config" text DEFAULT '{}' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integration_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer,
	"dessert_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_address" text,
	"notes" text,
	"receipt_url" text,
	"feedback_token" text,
	"payment_method" text,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"mudahpay_txn_id" text,
	"paid_at" timestamp,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"location_accuracy" numeric(10, 2),
	"tracking_token" text,
	"driver_token" text,
	"delivery_proof_url" text,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"processed_by" integer,
	CONSTRAINT "orders_feedback_token_unique" UNIQUE("feedback_token"),
	CONSTRAINT "orders_tracking_token_unique" UNIQUE("tracking_token"),
	CONSTRAINT "orders_driver_token_unique" UNIQUE("driver_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"qr_code_url" text,
	"bank_name" text,
	"account_number" text,
	"account_holder" text,
	"payment_instructions" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer,
	"item_name" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"purchase_date" timestamp DEFAULT now() NOT NULL,
	"receipt_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"agent_id" integer,
	"dessert_id" integer,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"source" text DEFAULT 'order' NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"is_visible" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"ingredient_id" integer NOT NULL,
	"type" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"note" text,
	"receipt_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_order_id" integer NOT NULL,
	"item_name" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"order_number" text NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"status" "supplier_order_status" DEFAULT 'draft' NOT NULL,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"expected_date" timestamp,
	"received_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"notes" text,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram_invoice_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"step" text DEFAULT 'idle' NOT NULL,
	"customer_name" text,
	"customer_phone" text,
	"customer_address" text,
	"items" text DEFAULT '[]' NOT NULL,
	"current_item" text,
	"notes" text,
	"status" text DEFAULT 'accepted' NOT NULL,
	"invoice_number" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_invoice_states_chat_id_unique" UNIQUE("chat_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" "role" DEFAULT 'admin' NOT NULL,
	"phone" text,
	"bank_name" text,
	"bank_account" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "delivery_locations" ADD CONSTRAINT "delivery_locations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_dessert_id_desserts_id_fk" FOREIGN KEY ("dessert_id") REFERENCES "public"."desserts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_dessert_id_desserts_id_fk" FOREIGN KEY ("dessert_id") REFERENCES "public"."desserts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "supplier_order_items" ADD CONSTRAINT "supplier_order_items_supplier_order_id_supplier_orders_id_fk" FOREIGN KEY ("supplier_order_id") REFERENCES "public"."supplier_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
