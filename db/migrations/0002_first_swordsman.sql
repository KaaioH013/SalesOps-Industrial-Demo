CREATE TABLE `organization_settings` (
	`organization_id` text PRIMARY KEY NOT NULL,
	`attention_days` integer DEFAULT 14 NOT NULL,
	`critical_days` integer DEFAULT 30 NOT NULL,
	`loss_reasons_json` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "organization_settings_attention_check" CHECK("organization_settings"."attention_days" > 0),
	CONSTRAINT "organization_settings_critical_check" CHECK("organization_settings"."critical_days" > 0),
	CONSTRAINT "organization_settings_critical_gt_attention_check" CHECK("organization_settings"."critical_days" > "organization_settings"."attention_days")
);
