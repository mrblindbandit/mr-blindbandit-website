CREATE TABLE `community_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`author_id` text NOT NULL,
	`display_name` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comments_post` ON `community_comments` (`post_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `community_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`hits` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`display_name` text NOT NULL,
	`board` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`hidden` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `posts_feed` ON `community_posts` (`hidden`,`board`,`created_at`);--> statement-breakpoint
CREATE TABLE `community_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`reporter_id` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `community_votes` (
	`poll_id` text NOT NULL,
	`user_id` text NOT NULL,
	`choice` text NOT NULL,
	PRIMARY KEY(`poll_id`, `user_id`)
);
