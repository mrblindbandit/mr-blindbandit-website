CREATE TABLE `social_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`clerk_user_id` text NOT NULL,
	`email` text NOT NULL,
	`handle` text NOT NULL,
	`display_name` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`avatar_url` text DEFAULT '' NOT NULL,
	`cover_url` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`website` text DEFAULT '' NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`verified_at` integer,
	`is_artist` integer DEFAULT 0 NOT NULL,
	`monetization_status` text DEFAULT 'none' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_profiles_clerk_user_id_unique` ON `social_profiles` (`clerk_user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_profiles_handle_unique` ON `social_profiles` (`handle`);
--> statement-breakpoint
CREATE INDEX `social_profiles_email` ON `social_profiles` (`email`);
--> statement-breakpoint
CREATE TABLE `social_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`body` text NOT NULL,
	`media_json` text DEFAULT '[]' NOT NULL,
	`visibility` text DEFAULT 'public' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `social_posts_author` ON `social_posts` (`author_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `social_posts_feed` ON `social_posts` (`visibility`,`created_at`);
--> statement-breakpoint
CREATE TABLE `social_follows` (
	`follower_id` text NOT NULL,
	`following_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_follows_unique` ON `social_follows` (`follower_id`,`following_id`);
--> statement-breakpoint
CREATE INDEX `social_follows_following` ON `social_follows` (`following_id`);
--> statement-breakpoint
CREATE TABLE `social_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_a` text NOT NULL,
	`participant_b` text NOT NULL,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_conversations_pair` ON `social_conversations` (`participant_a`,`participant_b`);
--> statement-breakpoint
CREATE TABLE `social_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`read_at` integer
);
--> statement-breakpoint
CREATE INDEX `social_messages_conversation` ON `social_messages` (`conversation_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `social_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`room_name` text NOT NULL,
	`caller_id` text NOT NULL,
	`callee_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`ended_at` integer
);
--> statement-breakpoint
CREATE INDEX `social_calls_participants` ON `social_calls` (`caller_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `social_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`status` text NOT NULL,
	`evidence` text DEFAULT '' NOT NULL,
	`reviewer_note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`reviewed_at` integer
);
--> statement-breakpoint
CREATE INDEX `social_verification_profile` ON `social_verification` (`profile_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `social_ads` (
	`id` text PRIMARY KEY NOT NULL,
	`advertiser_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`target_url` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`budget_cents` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `social_ads_status` ON `social_ads` (`status`,`created_at`);
--> statement-breakpoint
CREATE TABLE `social_monetization` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`status` text DEFAULT 'applied' NOT NULL,
	`payout_email` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_monetization_profile_id_unique` ON `social_monetization` (`profile_id`);
--> statement-breakpoint
CREATE TABLE `push_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_topics_name_unique` ON `push_topics` (`name`);
--> statement-breakpoint
CREATE TABLE `push_topic_subscriptions` (
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_topic_sub_unique` ON `push_topic_subscriptions` (`user_id`,`topic_id`);
--> statement-breakpoint
CREATE TABLE `web_push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`endpoint_hash` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`user_agent` text DEFAULT '' NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `web_push_subscriptions_endpoint_hash_unique` ON `web_push_subscriptions` (`endpoint_hash`);
--> statement-breakpoint
CREATE INDEX `web_push_user` ON `web_push_subscriptions` (`user_id`);
--> statement-breakpoint
INSERT INTO `push_topics` (`id`,`name`,`description`,`created_at`) VALUES
 ('topic_system','system','Account and security alerts',0),
 ('topic_messages','messages','Direct messages',0),
 ('topic_calls','calls','Incoming voice and video calls',0),
 ('topic_social','social','Follows, mentions, and post activity',0),
 ('topic_marketing','marketing','Optional product announcements',0);
--> statement-breakpoint
INSERT INTO `social_profiles` (`id`,`clerk_user_id`,`email`,`handle`,`display_name`,`bio`,`avatar_url`,`cover_url`,`location`,`website`,`verified`,`verified_at`,`is_artist`,`monetization_status`,`created_at`,`updated_at`) VALUES
 ('profile_mr_blindbandit','seed:kheckfinancial','kheckfinancial@gmail.com','mrblindbandit','Mr. Blindbandit','Blind artist, producer, and founder of Blindbandit Records. Official verified artist profile on Blindbandit Mobile.','/assets/mobile-artist.jpg','/assets/mobile-cover.jpg','Davao del Norte, Philippines','https://mrblindbandit.net',1,1726617600000,1,'approved',1726617600000,1726617600000);
--> statement-breakpoint
INSERT INTO `social_posts` (`id`,`author_id`,`body`,`media_json`,`visibility`,`created_at`,`updated_at`) VALUES
 ('post_seed_1','profile_mr_blindbandit','Welcome to Blindbandit Mobile — the official social home for Mr. Blindbandit and Blindbandit Records. Create a profile, follow the music, message, and call.','[]','public',1726617600000,1726617600000),
 ('post_seed_2','profile_mr_blindbandit','New listeners: start with Sapphire Castles and explore the ambient worlds catalog. Full Spotify artist page is linked in the Music tab.','[]','public',1726704000000,1726704000000),
 ('post_seed_3','profile_mr_blindbandit','Accessibility first. This platform is built so blind and low-vision creators can post, message, and call without barriers.','[]','public',1726790400000,1726790400000),
 ('post_seed_4','profile_mr_blindbandit','Verification and creator monetization programs are open. Apply from Settings → Verification or Monetization.','[]','public',1726876800000,1726876800000),
 ('post_seed_5','profile_mr_blindbandit','Business and press: business@mrblindbandit.net — Blindbandit Records, independent and blind-owned.','[]','public',1726963200000,1726963200000);
