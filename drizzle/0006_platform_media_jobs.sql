CREATE TABLE `platform_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`media_id` text NOT NULL,
	`tool` text NOT NULL,
	`options` text NOT NULL,
	`status` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`input_digest` text NOT NULL,
	`output_id` text,
	`error_code` text,
	`lease_hash` text,
	`lease_expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platform_jobs_idempotency` ON `platform_jobs` (`user_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `platform_jobs_queue` ON `platform_jobs` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `platform_jobs_user` ON `platform_jobs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `platform_media` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `platform_media_user` ON `platform_media` (`user_id`,`created_at`);