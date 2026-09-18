import {sqliteTable,text,integer,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const platform_settings=sqliteTable("platform_settings",{key:text("key").primaryKey().notNull(),value:text("value").notNull()});
export const platform_limits=sqliteTable("platform_limits",{key:text("key").primaryKey().notNull(),window:integer("window").notNull(),hits:integer("hits").notNull()});
export const platform_sessions=sqliteTable("platform_sessions",{id:text("id").primaryKey().notNull(),user_id:text("user_id").notNull(),token_hash:text("token_hash").notNull().unique(),refresh_hash:text("refresh_hash").notNull().unique(),kind:text("kind").notNull(),provider:text("provider").notNull(),source_session:text("source_session").notNull(),device_name:text("device_name").notNull(),platform:text("platform").notNull(),app_version:text("app_version").notNull(),created_at:integer("created_at").notNull(),last_used_at:integer("last_used_at").notNull(),verified_at:integer("verified_at").notNull(),expires_at:integer("expires_at").notNull(),refresh_expires_at:integer("refresh_expires_at").notNull(),revoked_at:integer("revoked_at")},t=>[index("platform_sessions_user").on(t.user_id,t.expires_at)]);
export const platform_integrations=sqliteTable("platform_integrations",{id:text("id").primaryKey().notNull(),provider:text("provider").notNull(),environment:text("environment").notNull(),public_config:text("public_config").notNull(),secret_config:text("secret_config").notNull(),enabled:integer("enabled").notNull().default(1),status:text("status").notNull().default("unverified"),updated_at:integer("updated_at").notNull(),last_checked_at:integer("last_checked_at"),last_success_at:integer("last_success_at")},t=>[uniqueIndex("platform_integrations_provider_environment_unique").on(t.provider,t.environment)]);
export const platform_audit=sqliteTable("platform_audit",{id:text("id").primaryKey().notNull(),actor_id:text("actor_id").notNull(),action:text("action").notNull(),target_id:text("target_id").notNull(),request_id:text("request_id").notNull(),result:text("result").notNull(),created_at:integer("created_at").notNull()},t=>[index("platform_audit_created").on(t.created_at)]);
export const platform_devices=sqliteTable("platform_devices",{id:text("id").primaryKey().notNull(),user_id:text("user_id").notNull(),installation_id:text("installation_id").notNull(),platform:text("platform").notNull(),token_cipher:text("token_cipher").notNull(),token_hash:text("token_hash").notNull().unique(),app_version:text("app_version").notNull(),language:text("language").notNull(),enabled:integer("enabled").notNull().default(1),created_at:integer("created_at").notNull(),updated_at:integer("updated_at").notNull()},t=>[uniqueIndex("platform_devices_user_id_installation_id_unique").on(t.user_id,t.installation_id)]);
export const platform_notifications=sqliteTable("platform_notifications",{id:text("id").primaryKey().notNull(),user_id:text("user_id").notNull(),title:text("title").notNull(),body:text("body").notNull(),category:text("category").notNull(),deep_link:text("deep_link").notNull(),created_at:integer("created_at").notNull(),read_at:integer("read_at"),deleted_at:integer("deleted_at")},t=>[index("platform_notifications_user").on(t.user_id,t.created_at)]);
export const platform_deliveries=sqliteTable("platform_deliveries",{id:text("id").primaryKey().notNull(),notification_id:text("notification_id").notNull(),device_id:text("device_id").notNull(),status:text("status").notNull(),provider_code:text("provider_code").notNull().default(""),created_at:integer("created_at").notNull(),updated_at:integer("updated_at").notNull()},t=>[uniqueIndex("platform_deliveries_notification_id_device_id_unique").on(t.notification_id,t.device_id)]);
export const platform_preferences=sqliteTable("platform_preferences",{user_id:text("user_id").primaryKey().notNull(),value:text("value").notNull(),updated_at:integer("updated_at").notNull()});
export const platform_favorites=sqliteTable("platform_favorites",{id:text("id").primaryKey().notNull(),user_id:text("user_id").notNull(),url:text("url").notNull(),title:text("title").notNull(),created_at:integer("created_at").notNull()},t=>[uniqueIndex("platform_favorites_user_id_url_unique").on(t.user_id,t.url)]);
export const platform_tickets=sqliteTable("platform_tickets",{id:text("id").primaryKey().notNull(),user_id:text("user_id").notNull(),category:text("category").notNull(),subject:text("subject").notNull(),body:text("body").notNull(),status:text("status").notNull(),created_at:integer("created_at").notNull()});
export const platform_feedback=sqliteTable("platform_feedback",{id:text("id").primaryKey().notNull(),user_id:text("user_id").notNull(),category:text("category").notNull(),description:text("description").notNull(),platform:text("platform").notNull(),app_version:text("app_version").notNull(),accessibility_impact:text("accessibility_impact").notNull(),created_at:integer("created_at").notNull()});
export const platform_media=sqliteTable('platform_media',{id:text('id').primaryKey().notNull(),user_id:text('user_id').notNull(),filename:text('filename').notNull(),content_type:text('content_type').notNull(),size_bytes:integer('size_bytes').notNull(),status:text('status').notNull(),created_at:integer('created_at').notNull(),deleted_at:integer('deleted_at')},t=>[index('platform_media_user').on(t.user_id,t.created_at)]);
export const platform_jobs=sqliteTable('platform_jobs',{id:text('id').primaryKey().notNull(),user_id:text('user_id').notNull(),media_id:text('media_id').notNull(),tool:text('tool').notNull(),options:text('options').notNull(),status:text('status').notNull(),idempotency_key:text('idempotency_key').notNull(),input_digest:text('input_digest').notNull(),output_id:text('output_id'),error_code:text('error_code'),lease_hash:text('lease_hash'),lease_expires_at:integer('lease_expires_at'),created_at:integer('created_at').notNull(),updated_at:integer('updated_at').notNull()},t=>[uniqueIndex('platform_jobs_idempotency').on(t.user_id,t.idempotency_key),index('platform_jobs_queue').on(t.status,t.created_at),index('platform_jobs_user').on(t.user_id,t.created_at)]);

/** Social /mobile product tables (migration 0007) */
export const social_profiles=sqliteTable('social_profiles',{
  id:text('id').primaryKey().notNull(),
  clerk_user_id:text('clerk_user_id').notNull().unique(),
  email:text('email').notNull(),
  handle:text('handle').notNull().unique(),
  display_name:text('display_name').notNull(),
  bio:text('bio').notNull().default(''),
  avatar_url:text('avatar_url').notNull().default(''),
  cover_url:text('cover_url').notNull().default(''),
  location:text('location').notNull().default(''),
  website:text('website').notNull().default(''),
  verified:integer('verified').notNull().default(0),
  verified_at:integer('verified_at'),
  is_artist:integer('is_artist').notNull().default(0),
  monetization_status:text('monetization_status').notNull().default('none'),
  created_at:integer('created_at').notNull(),
  updated_at:integer('updated_at').notNull(),
},t=>[index('social_profiles_email').on(t.email)]);

export const social_posts=sqliteTable('social_posts',{
  id:text('id').primaryKey().notNull(),
  author_id:text('author_id').notNull(),
  body:text('body').notNull(),
  media_json:text('media_json').notNull().default('[]'),
  visibility:text('visibility').notNull().default('public'),
  created_at:integer('created_at').notNull(),
  updated_at:integer('updated_at').notNull(),
  deleted_at:integer('deleted_at'),
},t=>[index('social_posts_author').on(t.author_id,t.created_at),index('social_posts_feed').on(t.visibility,t.created_at)]);

export const social_follows=sqliteTable('social_follows',{
  follower_id:text('follower_id').notNull(),
  following_id:text('following_id').notNull(),
  created_at:integer('created_at').notNull(),
},t=>[uniqueIndex('social_follows_unique').on(t.follower_id,t.following_id),index('social_follows_following').on(t.following_id)]);

export const social_messages=sqliteTable('social_messages',{
  id:text('id').primaryKey().notNull(),
  conversation_id:text('conversation_id').notNull(),
  sender_id:text('sender_id').notNull(),
  body:text('body').notNull(),
  created_at:integer('created_at').notNull(),
  read_at:integer('read_at'),
},t=>[index('social_messages_conversation').on(t.conversation_id,t.created_at)]);

export const social_conversations=sqliteTable('social_conversations',{
  id:text('id').primaryKey().notNull(),
  participant_a:text('participant_a').notNull(),
  participant_b:text('participant_b').notNull(),
  updated_at:integer('updated_at').notNull(),
  created_at:integer('created_at').notNull(),
},t=>[uniqueIndex('social_conversations_pair').on(t.participant_a,t.participant_b)]);

export const social_calls=sqliteTable('social_calls',{
  id:text('id').primaryKey().notNull(),
  room_name:text('room_name').notNull(),
  caller_id:text('caller_id').notNull(),
  callee_id:text('callee_id').notNull(),
  kind:text('kind').notNull(),
  status:text('status').notNull(),
  created_at:integer('created_at').notNull(),
  ended_at:integer('ended_at'),
},t=>[index('social_calls_participants').on(t.caller_id,t.created_at)]);

export const social_verification=sqliteTable('social_verification',{
  id:text('id').primaryKey().notNull(),
  profile_id:text('profile_id').notNull(),
  status:text('status').notNull(),
  evidence:text('evidence').notNull().default(''),
  reviewer_note:text('reviewer_note').notNull().default(''),
  created_at:integer('created_at').notNull(),
  reviewed_at:integer('reviewed_at'),
},t=>[index('social_verification_profile').on(t.profile_id,t.created_at)]);

export const social_ads=sqliteTable('social_ads',{
  id:text('id').primaryKey().notNull(),
  advertiser_id:text('advertiser_id').notNull(),
  title:text('title').notNull(),
  body:text('body').notNull(),
  target_url:text('target_url').notNull(),
  status:text('status').notNull().default('draft'),
  budget_cents:integer('budget_cents').notNull().default(0),
  created_at:integer('created_at').notNull(),
  updated_at:integer('updated_at').notNull(),
},t=>[index('social_ads_status').on(t.status,t.created_at)]);

export const social_monetization=sqliteTable('social_monetization',{
  id:text('id').primaryKey().notNull(),
  profile_id:text('profile_id').notNull().unique(),
  status:text('status').notNull().default('applied'),
  payout_email:text('payout_email').notNull().default(''),
  notes:text('notes').notNull().default(''),
  created_at:integer('created_at').notNull(),
  updated_at:integer('updated_at').notNull(),
});

export const push_topics=sqliteTable('push_topics',{
  id:text('id').primaryKey().notNull(),
  name:text('name').notNull().unique(),
  description:text('description').notNull().default(''),
  created_at:integer('created_at').notNull(),
});

export const push_topic_subscriptions=sqliteTable('push_topic_subscriptions',{
  user_id:text('user_id').notNull(),
  topic_id:text('topic_id').notNull(),
  created_at:integer('created_at').notNull(),
},t=>[uniqueIndex('push_topic_sub_unique').on(t.user_id,t.topic_id)]);

export const web_push_subscriptions=sqliteTable('web_push_subscriptions',{
  id:text('id').primaryKey().notNull(),
  user_id:text('user_id').notNull(),
  endpoint_hash:text('endpoint_hash').notNull().unique(),
  endpoint:text('endpoint').notNull(),
  p256dh:text('p256dh').notNull(),
  auth:text('auth').notNull(),
  user_agent:text('user_agent').notNull().default(''),
  enabled:integer('enabled').notNull().default(1),
  created_at:integer('created_at').notNull(),
  updated_at:integer('updated_at').notNull(),
},t=>[index('web_push_user').on(t.user_id)]);

export const social_moderation=sqliteTable('social_moderation',{
  profile_id:text('profile_id').primaryKey().notNull(),
  status:text('status').notNull().default('active'),
  ban_reason:text('ban_reason').notNull().default(''),
  suspended_until:integer('suspended_until'),
  mute_posts:integer('mute_posts').notNull().default(0),
  mute_messages:integer('mute_messages').notNull().default(0),
  calls_disabled:integer('calls_disabled').notNull().default(0),
  shadow_restricted:integer('shadow_restricted').notNull().default(0),
  rate_limit_multiplier:integer('rate_limit_multiplier').notNull().default(1),
  feature_flags:text('feature_flags').notNull().default('{}'),
  updated_at:integer('updated_at').notNull(),
  updated_by:text('updated_by').notNull().default(''),
});

export const social_reports=sqliteTable('social_reports',{
  id:text('id').primaryKey().notNull(),
  reporter_id:text('reporter_id').notNull(),
  target_type:text('target_type').notNull(),
  target_id:text('target_id').notNull(),
  reason:text('reason').notNull(),
  details:text('details').notNull().default(''),
  status:text('status').notNull().default('open'),
  resolver_id:text('resolver_id').notNull().default(''),
  resolver_note:text('resolver_note').notNull().default(''),
  created_at:integer('created_at').notNull(),
  resolved_at:integer('resolved_at'),
},t=>[index('social_reports_status').on(t.status,t.created_at),index('social_reports_target').on(t.target_type,t.target_id)]);

export const social_admin_audit=sqliteTable('social_admin_audit',{
  id:text('id').primaryKey().notNull(),
  actor_email:text('actor_email').notNull(),
  actor_clerk_id:text('actor_clerk_id').notNull(),
  action:text('action').notNull(),
  target_type:text('target_type').notNull(),
  target_id:text('target_id').notNull(),
  payload:text('payload').notNull().default('{}'),
  request_id:text('request_id').notNull(),
  created_at:integer('created_at').notNull(),
},t=>[index('social_admin_audit_created').on(t.created_at),index('social_admin_audit_target').on(t.target_type,t.target_id)]);

export const social_announcements=sqliteTable('social_announcements',{
  id:text('id').primaryKey().notNull(),
  title:text('title').notNull(),
  body:text('body').notNull(),
  audience:text('audience').notNull().default('all'),
  deep_link:text('deep_link').notNull().default('/mobile/'),
  created_by:text('created_by').notNull(),
  created_at:integer('created_at').notNull(),
  published_at:integer('published_at'),
},t=>[index('social_announcements_created').on(t.created_at)]);
