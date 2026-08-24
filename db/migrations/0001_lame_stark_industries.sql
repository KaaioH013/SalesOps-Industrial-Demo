CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`actor_id` text,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`metadata` text,
	`occurred_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_events_org_occurred_idx` ON `audit_events` (`organization_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `audit_events_entity_idx` ON `audit_events` (`organization_id`,`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_events_actor_idx` ON `audit_events` (`actor_id`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`unit_cost_cents` integer NOT NULL,
	`total_cents` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "order_items_quantity_check" CHECK("order_items"."quantity" > 0),
	CONSTRAINT "order_items_unit_price_check" CHECK("order_items"."unit_price_cents" >= 0),
	CONSTRAINT "order_items_unit_cost_check" CHECK("order_items"."unit_cost_cents" >= 0),
	CONSTRAINT "order_items_total_check" CHECK("order_items"."total_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `order_items_org_idx` ON `order_items` (`organization_id`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_product_idx` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`number` text NOT NULL,
	`customer_id` text NOT NULL,
	`quote_id` text,
	`owner_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`ordered_at` integer NOT NULL,
	`revenue_cents` integer DEFAULT 0 NOT NULL,
	`cost_cents` integer DEFAULT 0 NOT NULL,
	`gross_margin_bps` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "orders_status_check" CHECK("orders"."status" in ('pending', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled')),
	CONSTRAINT "orders_revenue_check" CHECK("orders"."revenue_cents" >= 0),
	CONSTRAINT "orders_cost_check" CHECK("orders"."cost_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `orders_org_idx` ON `orders` (`organization_id`);--> statement-breakpoint
CREATE INDEX `orders_org_status_date_idx` ON `orders` (`organization_id`,`status`,`ordered_at`);--> statement-breakpoint
CREATE INDEX `orders_customer_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `orders_owner_idx` ON `orders` (`owner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_org_number_unique` ON `orders` (`organization_id`,`number`);--> statement-breakpoint
CREATE TABLE `price_list_items` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`price_list_id` text NOT NULL,
	`product_id` text NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`min_quantity` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`price_list_id`) REFERENCES `price_lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "price_list_items_unit_price_check" CHECK("price_list_items"."unit_price_cents" >= 0),
	CONSTRAINT "price_list_items_min_quantity_check" CHECK("price_list_items"."min_quantity" > 0)
);
--> statement-breakpoint
CREATE INDEX `price_list_items_org_idx` ON `price_list_items` (`organization_id`);--> statement-breakpoint
CREATE INDEX `price_list_items_product_idx` ON `price_list_items` (`product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `price_list_items_list_product_qty_unique` ON `price_list_items` (`price_list_id`,`product_id`,`min_quantity`);--> statement-breakpoint
CREATE TABLE `price_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`scope` text NOT NULL,
	`customer_id` text,
	`segment` text,
	`valid_from` integer NOT NULL,
	`valid_until` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "price_lists_scope_check" CHECK("price_lists"."scope" in ('standard', 'customer', 'segment')),
	CONSTRAINT "price_lists_scope_target_check" CHECK(("price_lists"."scope" = 'standard' and "price_lists"."customer_id" is null and "price_lists"."segment" is null)
        or ("price_lists"."scope" = 'customer' and "price_lists"."customer_id" is not null)
        or ("price_lists"."scope" = 'segment' and "price_lists"."segment" is not null))
);
--> statement-breakpoint
CREATE INDEX `price_lists_org_idx` ON `price_lists` (`organization_id`);--> statement-breakpoint
CREATE INDEX `price_lists_org_scope_idx` ON `price_lists` (`organization_id`,`scope`);--> statement-breakpoint
CREATE INDEX `price_lists_customer_idx` ON `price_lists` (`customer_id`);--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`quote_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`unit_cost_cents` integer NOT NULL,
	`discount_bps` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "quote_items_quantity_check" CHECK("quote_items"."quantity" > 0),
	CONSTRAINT "quote_items_unit_price_check" CHECK("quote_items"."unit_price_cents" >= 0),
	CONSTRAINT "quote_items_unit_cost_check" CHECK("quote_items"."unit_cost_cents" >= 0),
	CONSTRAINT "quote_items_discount_check" CHECK("quote_items"."discount_bps" between 0 and 10000),
	CONSTRAINT "quote_items_total_check" CHECK("quote_items"."total_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `quote_items_org_idx` ON `quote_items` (`organization_id`);--> statement-breakpoint
CREATE INDEX `quote_items_quote_idx` ON `quote_items` (`quote_id`);--> statement-breakpoint
CREATE INDEX `quote_items_product_idx` ON `quote_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`number` text NOT NULL,
	`customer_id` text NOT NULL,
	`owner_id` text,
	`valid_until` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`discount_bps` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`cost_cents` integer DEFAULT 0 NOT NULL,
	`gross_margin_bps` integer DEFAULT 0 NOT NULL,
	`loss_reason` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "quotes_status_check" CHECK("quotes"."status" in ('draft', 'sent', 'approved', 'rejected', 'expired', 'won', 'lost')),
	CONSTRAINT "quotes_discount_check" CHECK("quotes"."discount_bps" between 0 and 10000),
	CONSTRAINT "quotes_total_check" CHECK("quotes"."total_cents" >= 0),
	CONSTRAINT "quotes_cost_check" CHECK("quotes"."cost_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `quotes_org_idx` ON `quotes` (`organization_id`);--> statement-breakpoint
CREATE INDEX `quotes_org_status_idx` ON `quotes` (`organization_id`,`status`);--> statement-breakpoint
CREATE INDEX `quotes_customer_idx` ON `quotes` (`customer_id`);--> statement-breakpoint
CREATE INDEX `quotes_owner_idx` ON `quotes` (`owner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_org_number_unique` ON `quotes` (`organization_id`,`number`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`name` text NOT NULL,
	`title` text,
	`email` text,
	`phone` text,
	`is_decision_maker` integer DEFAULT false NOT NULL,
	`is_influencer` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `contacts_org_idx` ON `contacts` (`organization_id`);--> statement-breakpoint
CREATE INDEX `contacts_customer_idx` ON `contacts` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customer_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`author_id` text,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `customer_notes_org_idx` ON `customer_notes` (`organization_id`);--> statement-breakpoint
CREATE INDEX `customer_notes_customer_created_idx` ON `customer_notes` (`customer_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`subject` text NOT NULL,
	`description` text,
	`scheduled_at` integer NOT NULL,
	`completed_at` integer,
	`owner_id` text NOT NULL,
	`customer_id` text,
	`opportunity_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "activities_type_check" CHECK("activities"."type" in ('ligacao', 'email', 'visita', 'reuniao', 'follow_up')),
	CONSTRAINT "activities_status_check" CHECK("activities"."status" in ('planned', 'completed', 'cancelled'))
);
--> statement-breakpoint
CREATE INDEX `activities_org_idx` ON `activities` (`organization_id`);--> statement-breakpoint
CREATE INDEX `activities_org_owner_date_idx` ON `activities` (`organization_id`,`owner_id`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `activities_customer_idx` ON `activities` (`customer_id`);--> statement-breakpoint
CREATE INDEX `activities_opportunity_idx` ON `activities` (`opportunity_id`);--> statement-breakpoint
CREATE INDEX `activities_org_status_idx` ON `activities` (`organization_id`,`status`);--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`title` text NOT NULL,
	`stage` text DEFAULT 'novo' NOT NULL,
	`source` text,
	`estimated_value_cents` integer DEFAULT 0 NOT NULL,
	`probability` integer DEFAULT 0 NOT NULL,
	`expected_close_at` integer,
	`owner_id` text,
	`product_id` text,
	`product_family_id` text,
	`priority` text DEFAULT 'medium' NOT NULL,
	`next_step` text,
	`loss_reason` text,
	`stage_changed_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_activity_at` integer,
	`closed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`product_family_id`) REFERENCES `product_families`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "opportunities_stage_check" CHECK("opportunities"."stage" in ('novo', 'qualificacao', 'diagnostico', 'proposta', 'negociacao', 'ganho', 'perdido')),
	CONSTRAINT "opportunities_priority_check" CHECK("opportunities"."priority" in ('low', 'medium', 'high')),
	CONSTRAINT "opportunities_estimated_value_check" CHECK("opportunities"."estimated_value_cents" >= 0),
	CONSTRAINT "opportunities_probability_check" CHECK("opportunities"."probability" between 0 and 100)
);
--> statement-breakpoint
CREATE INDEX `opportunities_org_idx` ON `opportunities` (`organization_id`);--> statement-breakpoint
CREATE INDEX `opportunities_org_stage_idx` ON `opportunities` (`organization_id`,`stage`);--> statement-breakpoint
CREATE INDEX `opportunities_org_owner_idx` ON `opportunities` (`organization_id`,`owner_id`);--> statement-breakpoint
CREATE INDEX `opportunities_customer_idx` ON `opportunities` (`customer_id`);--> statement-breakpoint
CREATE INDEX `opportunities_expected_close_idx` ON `opportunities` (`organization_id`,`expected_close_at`);--> statement-breakpoint
CREATE TABLE `targets` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`period` text NOT NULL,
	`seller_id` text,
	`territory_id` text,
	`revenue_target_cents` integer DEFAULT 0 NOT NULL,
	`margin_target_cents` integer DEFAULT 0 NOT NULL,
	`new_customers_target` integer DEFAULT 0 NOT NULL,
	`conversion_target_bps` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`seller_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`territory_id`) REFERENCES `sales_territories`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "targets_assignment_check" CHECK("targets"."seller_id" is not null or "targets"."territory_id" is not null),
	CONSTRAINT "targets_revenue_check" CHECK("targets"."revenue_target_cents" >= 0),
	CONSTRAINT "targets_margin_check" CHECK("targets"."margin_target_cents" >= 0),
	CONSTRAINT "targets_new_customers_check" CHECK("targets"."new_customers_target" >= 0),
	CONSTRAINT "targets_conversion_check" CHECK("targets"."conversion_target_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE INDEX `targets_org_period_idx` ON `targets` (`organization_id`,`period`);--> statement-breakpoint
CREATE INDEX `targets_seller_idx` ON `targets` (`seller_id`);--> statement-breakpoint
CREATE INDEX `targets_territory_idx` ON `targets` (`territory_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `targets_org_period_assignment_unique` ON `targets` (`organization_id`,`period`,`seller_id`,`territory_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`legal_name` text NOT NULL,
	`trade_name` text NOT NULL,
	`tax_id` text NOT NULL,
	`segment` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`territory_id` text,
	`status` text DEFAULT 'prospect' NOT NULL,
	`size` text NOT NULL,
	`registered_at` integer NOT NULL,
	`seller_id` text,
	`credit_limit_cents` integer DEFAULT 0 NOT NULL,
	`last_purchase_at` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`territory_id`) REFERENCES `sales_territories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`seller_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "customers_status_check" CHECK("customers"."status" in ('prospect', 'active', 'inactive')),
	CONSTRAINT "customers_size_check" CHECK("customers"."size" in ('small', 'medium', 'large')),
	CONSTRAINT "customers_credit_limit_check" CHECK("customers"."credit_limit_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `customers_org_idx` ON `customers` (`organization_id`);--> statement-breakpoint
CREATE INDEX `customers_org_status_idx` ON `customers` (`organization_id`,`status`);--> statement-breakpoint
CREATE INDEX `customers_org_seller_idx` ON `customers` (`organization_id`,`seller_id`);--> statement-breakpoint
CREATE INDEX `customers_org_territory_idx` ON `customers` (`organization_id`,`territory_id`);--> statement-breakpoint
CREATE INDEX `customers_org_segment_idx` ON `customers` (`organization_id`,`segment`);--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`type` text NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`customer_id` text,
	`opportunity_id` text,
	`recommendation` text,
	`status` text DEFAULT 'open' NOT NULL,
	`resolved_by_id` text,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resolved_by_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "alerts_severity_check" CHECK("alerts"."severity" in ('info', 'warning', 'critical')),
	CONSTRAINT "alerts_status_check" CHECK("alerts"."status" in ('open', 'resolved', 'dismissed'))
);
--> statement-breakpoint
CREATE INDEX `alerts_org_idx` ON `alerts` (`organization_id`);--> statement-breakpoint
CREATE INDEX `alerts_org_status_severity_idx` ON `alerts` (`organization_id`,`status`,`severity`);--> statement-breakpoint
CREATE INDEX `alerts_customer_idx` ON `alerts` (`customer_id`);--> statement-breakpoint
CREATE INDEX `alerts_opportunity_idx` ON `alerts` (`opportunity_id`);--> statement-breakpoint
CREATE TABLE `customer_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`repurchase_score` integer NOT NULL,
	`inactivity_risk_score` integer NOT NULL,
	`potential_score` integer NOT NULL,
	`priority_score` integer NOT NULL,
	`explanations` text NOT NULL,
	`calculated_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "customer_scores_repurchase_check" CHECK("customer_scores"."repurchase_score" between 0 and 100),
	CONSTRAINT "customer_scores_inactivity_check" CHECK("customer_scores"."inactivity_risk_score" between 0 and 100),
	CONSTRAINT "customer_scores_potential_check" CHECK("customer_scores"."potential_score" between 0 and 100),
	CONSTRAINT "customer_scores_priority_check" CHECK("customer_scores"."priority_score" between 0 and 100)
);
--> statement-breakpoint
CREATE INDEX `customer_scores_org_idx` ON `customer_scores` (`organization_id`);--> statement-breakpoint
CREATE INDEX `customer_scores_org_priority_idx` ON `customer_scores` (`organization_id`,`priority_score`);--> statement-breakpoint
CREATE INDEX `customer_scores_customer_calculated_idx` ON `customer_scores` (`customer_id`,`calculated_at`);--> statement-breakpoint
CREATE TABLE `forecast_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`period` text NOT NULL,
	`forecast_cents` integer NOT NULL,
	`actual_cents` integer,
	`method` text NOT NULL,
	`forecast_error_bps` integer,
	`calculated_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "forecast_snapshots_forecast_check" CHECK("forecast_snapshots"."forecast_cents" >= 0),
	CONSTRAINT "forecast_snapshots_actual_check" CHECK("forecast_snapshots"."actual_cents" is null or "forecast_snapshots"."actual_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `forecast_snapshots_org_period_idx` ON `forecast_snapshots` (`organization_id`,`period`);--> statement-breakpoint
CREATE UNIQUE INDEX `forecast_snapshots_org_period_method_calculated_unique` ON `forecast_snapshots` (`organization_id`,`period`,`method`,`calculated_at`);--> statement-breakpoint
CREATE TABLE `product_families` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`target_margin_bps` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "product_families_target_margin_check" CHECK("product_families"."target_margin_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE INDEX `product_families_org_idx` ON `product_families` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_families_org_name_unique` ON `product_families` (`organization_id`,`name`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`family_id` text NOT NULL,
	`sku` text NOT NULL,
	`description` text NOT NULL,
	`application` text,
	`list_price_cents` integer NOT NULL,
	`standard_cost_cents` integer NOT NULL,
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`lead_time_days` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`target_margin_bps` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`family_id`) REFERENCES `product_families`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "products_list_price_check" CHECK("products"."list_price_cents" >= 0),
	CONSTRAINT "products_standard_cost_check" CHECK("products"."standard_cost_cents" >= 0),
	CONSTRAINT "products_stock_check" CHECK("products"."stock_quantity" >= 0),
	CONSTRAINT "products_lead_time_check" CHECK("products"."lead_time_days" >= 0),
	CONSTRAINT "products_status_check" CHECK("products"."status" in ('active', 'inactive')),
	CONSTRAINT "products_target_margin_check" CHECK("products"."target_margin_bps" between 0 and 10000)
);
--> statement-breakpoint
CREATE INDEX `products_org_idx` ON `products` (`organization_id`);--> statement-breakpoint
CREATE INDEX `products_org_family_idx` ON `products` (`organization_id`,`family_id`);--> statement-breakpoint
CREATE INDEX `products_org_status_idx` ON `products` (`organization_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_org_sku_unique` ON `products` (`organization_id`,`sku`);--> statement-breakpoint
CREATE TABLE `sales_territories` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`region` text NOT NULL,
	`states` text NOT NULL,
	`seller_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`seller_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `sales_territories_org_idx` ON `sales_territories` (`organization_id`);--> statement-breakpoint
CREATE INDEX `sales_territories_seller_idx` ON `sales_territories` (`seller_id`);--> statement-breakpoint
CREATE INDEX `sales_territories_region_idx` ON `sales_territories` (`organization_id`,`region`);