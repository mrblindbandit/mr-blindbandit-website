CREATE TABLE `community_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`details` text NOT NULL,
	`storage_key` text,
	`file_name` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `requests_created` ON `site_requests` (`kind`,`created_at`);