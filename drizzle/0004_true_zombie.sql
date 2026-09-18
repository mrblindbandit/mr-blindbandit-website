CREATE TABLE `article_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`actor_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`excerpt` text NOT NULL,
	`author` text NOT NULL,
	`category` text NOT NULL,
	`tags` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`publish_at` integer,
	`metadata` text DEFAULT '{}' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_articles_slug_unique` ON `site_articles` (`slug`);--> statement-breakpoint
CREATE INDEX `article_public` ON `site_articles` (`status`,`publish_at`);--> statement-breakpoint
CREATE TABLE `feed_items` (
	`id` text PRIMARY KEY NOT NULL,
	`feed_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`excerpt` text NOT NULL,
	`approved` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feed_items_source` ON `feed_items` (`feed_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `feed_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`category` text NOT NULL,
	`paused` integer DEFAULT 0 NOT NULL,
	`auto_approve` integer DEFAULT 0 NOT NULL,
	`refresh_minutes` integer DEFAULT 60 NOT NULL,
	`last_checked` integer,
	`last_success` integer,
	`error` text DEFAULT '' NOT NULL,
	`http_status` integer
);
--> statement-breakpoint
CREATE TABLE `inbox_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`recipient` text DEFAULT '' NOT NULL,
	`delivery` text DEFAULT 'internal' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inbox_messages_thread` ON `inbox_messages` (`thread_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `inbox_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`department` text DEFAULT 'general' NOT NULL,
	`assignee` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '' NOT NULL,
	`starred` integer DEFAULT 0 NOT NULL,
	`unread` integer DEFAULT 1 NOT NULL,
	`follow_up` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inbox_status` ON `inbox_threads` (`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `security_recovery` (
	`digest` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `security_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_key` text NOT NULL,
	`digest` text NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `security_proofs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_key` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seo_overrides` (
	`path` text PRIMARY KEY NOT NULL,
	`settings` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_mail` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`kind` text NOT NULL,
	`recipient` text NOT NULL,
	`status` text NOT NULL,
	`provider_id` text,
	`created_at` integer NOT NULL
);
