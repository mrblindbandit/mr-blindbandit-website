CREATE TABLE `platform_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`target_id` text NOT NULL,
	`request_id` text NOT NULL,
	`result` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `platform_audit_created` ON `platform_audit` (`created_at`);--> statement-breakpoint
CREATE TABLE `platform_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`notification_id` text NOT NULL,
	`device_id` text NOT NULL,
	`status` text NOT NULL,
	`provider_code` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platform_deliveries_notification_id_device_id_unique` ON `platform_deliveries` (`notification_id`,`device_id`);--> statement-breakpoint
CREATE TABLE `platform_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`installation_id` text NOT NULL,
	`platform` text NOT NULL,
	`token_cipher` text NOT NULL,
	`token_hash` text NOT NULL,
	`app_version` text NOT NULL,
	`language` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platform_devices_token_hash_unique` ON `platform_devices` (`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `platform_devices_user_id_installation_id_unique` ON `platform_devices` (`user_id`,`installation_id`);--> statement-breakpoint
CREATE TABLE `platform_favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platform_favorites_user_id_url_unique` ON `platform_favorites` (`user_id`,`url`);--> statement-breakpoint
CREATE TABLE `platform_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`platform` text NOT NULL,
	`app_version` text NOT NULL,
	`accessibility_impact` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`environment` text NOT NULL,
	`public_config` text NOT NULL,
	`secret_config` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'unverified' NOT NULL,
	`updated_at` integer NOT NULL,
	`last_checked_at` integer,
	`last_success_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platform_integrations_provider_environment_unique` ON `platform_integrations` (`provider`,`environment`);--> statement-breakpoint
CREATE TABLE `platform_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`hits` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`category` text NOT NULL,
	`deep_link` text NOT NULL,
	`created_at` integer NOT NULL,
	`read_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `platform_notifications_user` ON `platform_notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `platform_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`refresh_hash` text NOT NULL,
	`kind` text NOT NULL,
	`provider` text NOT NULL,
	`source_session` text NOT NULL,
	`device_name` text NOT NULL,
	`platform` text NOT NULL,
	`app_version` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_used_at` integer NOT NULL,
	`verified_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`refresh_expires_at` integer NOT NULL,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platform_sessions_token_hash_unique` ON `platform_sessions` (`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `platform_sessions_refresh_hash_unique` ON `platform_sessions` (`refresh_hash`);--> statement-breakpoint
CREATE INDEX `platform_sessions_user` ON `platform_sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `platform_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL
);
