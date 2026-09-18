CREATE TABLE `label_account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`password` text,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `label_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `label_account_user` ON `label_account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `label_account_provider` ON `label_account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE TABLE `label_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `label_audit_created` ON `label_audit` (`created_at`);--> statement-breakpoint
CREATE TABLE `label_contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`title` text NOT NULL,
	`storage_key` text NOT NULL,
	`file_name` text NOT NULL,
	`status` text DEFAULT 'shared' NOT NULL,
	`reviewed_at` integer,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `label_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `label_contracts_client` ON `label_contracts` (`client_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `label_earnings` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`description` text NOT NULL,
	`source` text NOT NULL,
	`period` text NOT NULL,
	`currency` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'reported' NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `label_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `label_earnings_client` ON `label_earnings` (`client_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `label_mail` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`provider_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `label_members` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'client' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`artist_name` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `label_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `label_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `label_members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `label_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `label_messages_thread` ON `label_messages` (`client_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `label_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `label_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `label_session_token_unique` ON `label_session` (`token`);--> statement-breakpoint
CREATE INDEX `label_session_user` ON `label_session` (`user_id`);--> statement-breakpoint
CREATE TABLE `label_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `label_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`title` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `label_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `label_tasks_client` ON `label_tasks` (`client_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `label_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `label_user_email_unique` ON `label_user` (`email`);--> statement-breakpoint
CREATE TABLE `label_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `label_verification_identifier` ON `label_verification` (`identifier`);