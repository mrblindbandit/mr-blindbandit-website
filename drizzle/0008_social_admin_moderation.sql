CREATE TABLE `social_moderation` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`ban_reason` text DEFAULT '' NOT NULL,
	`suspended_until` integer,
	`mute_posts` integer DEFAULT 0 NOT NULL,
	`mute_messages` integer DEFAULT 0 NOT NULL,
	`calls_disabled` integer DEFAULT 0 NOT NULL,
	`shadow_restricted` integer DEFAULT 0 NOT NULL,
	`rate_limit_multiplier` integer DEFAULT 1 NOT NULL,
	`feature_flags` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolver_id` text DEFAULT '' NOT NULL,
	`resolver_note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer
);
--> statement-breakpoint
CREATE INDEX `social_reports_status` ON `social_reports` (`status`,`created_at`);
--> statement-breakpoint
CREATE INDEX `social_reports_target` ON `social_reports` (`target_type`,`target_id`);
--> statement-breakpoint
CREATE TABLE `social_admin_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_email` text NOT NULL,
	`actor_clerk_id` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`request_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `social_admin_audit_created` ON `social_admin_audit` (`created_at`);
--> statement-breakpoint
CREATE INDEX `social_admin_audit_target` ON `social_admin_audit` (`target_type`,`target_id`);
--> statement-breakpoint
CREATE TABLE `social_announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`audience` text DEFAULT 'all' NOT NULL,
	`deep_link` text DEFAULT '/mobile/' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`published_at` integer
);
--> statement-breakpoint
CREATE INDEX `social_announcements_created` ON `social_announcements` (`created_at`);
--> statement-breakpoint
ALTER TABLE `social_posts` ADD `hidden` integer DEFAULT 0 NOT NULL;
