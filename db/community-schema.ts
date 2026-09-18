import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';

export const posts = sqliteTable('community_posts', {
  id: text('id').primaryKey(), authorId: text('author_id').notNull(), displayName: text('display_name').notNull(),
  board: text('board').notNull(), title: text('title').notNull(), body: text('body').notNull(),
  createdAt: integer('created_at').notNull(), hidden: integer('hidden').notNull().default(0),
}, t => [index('posts_feed').on(t.hidden,t.board,t.createdAt)]);
export const comments = sqliteTable('community_comments', {
  id: text('id').primaryKey(), postId: text('post_id').notNull().references(()=>posts.id,{onDelete:'cascade'}),
  authorId:text('author_id').notNull(),displayName:text('display_name').notNull(),body:text('body').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('comments_post').on(t.postId,t.createdAt)]);
export const reports=sqliteTable('community_reports',{id:text('id').primaryKey(),postId:text('post_id').notNull().references(()=>posts.id,{onDelete:'cascade'}),reporterId:text('reporter_id').notNull(),reason:text('reason').notNull(),createdAt:integer('created_at').notNull()});
export const votes=sqliteTable('community_votes',{pollId:text('poll_id').notNull(),userId:text('user_id').notNull(),choice:text('choice').notNull()},t=>[primaryKey({columns:[t.pollId,t.userId]})]);
export const limits=sqliteTable('community_limits',{key:text('key').primaryKey(),window:integer('window').notNull(),hits:integer('hits').notNull()});
export const profiles=sqliteTable('community_profiles',{userId:text('user_id').primaryKey(),displayName:text('display_name').notNull(),createdAt:integer('created_at').notNull()});
export const requests=sqliteTable('site_requests',{id:text('id').primaryKey(),kind:text('kind').notNull(),name:text('name').notNull(),email:text('email').notNull(),details:text('details').notNull(),storageKey:text('storage_key'),fileName:text('file_name'),createdAt:integer('created_at').notNull()},t=>[index('requests_created').on(t.kind,t.createdAt)]);
