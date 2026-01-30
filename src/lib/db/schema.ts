import { pgTable, text, timestamp, uuid, integer, boolean, decimal, jsonb, index } from 'drizzle-orm/pg-core';

// Users table - mirrors Clerk user data
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  email: text('email'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  clerkUserIdIdx: index('clerk_user_id_idx').on(table.clerkUserId),
}));

// Points System Tables
export const pointTransactions = pgTable('point_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // References user ID from fango-api
  points: integer('points').notNull(),
  transactionType: text('transaction_type').notNull(), // 'earned', 'spent', 'adjusted'
  source: text('source').notNull(), // 'drop_purchase', 'social_media', 'registration', 'manual_adjustment', etc.
  description: text('description'),
  metadata: jsonb('metadata'), // Additional data like dropId, platform, etc.
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('point_transactions_user_id_idx').on(table.userId),
  createdAtIdx: index('point_transactions_created_at_idx').on(table.createdAt),
}));

export const pointRules = pgTable('point_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  points: integer('points').notNull(),
  source: text('source').notNull(), // 'drop_purchase', 'social_media', 'registration', etc.
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata'), // Additional configuration
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Live Events Tables (from reference codebase)
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  location: text('location'),
  geofenceType: text('geofence_type'), // 'circle' or 'polygon'
  geofenceLatitude: decimal('geofence_latitude', { precision: 10, scale: 8 }),
  geofenceLongitude: decimal('geofence_longitude', { precision: 11, scale: 8 }),
  geofenceRadius: integer('geofence_radius'), // in meters (for circle geofences)
  geofencePolygon: jsonb('geofence_polygon'), // Array of [lat, lng] coordinates (for polygon geofences)
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  startDateIdx: index('events_start_date_idx').on(table.startDate),
}));

export const eventCheckIns = pgTable('event_check_ins', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  userId: text('user_id').notNull(), // References user ID from fango-api
  clerkUserId: text('clerk_user_id'), // Optional Clerk user ID
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  checkedInAt: timestamp('checked_in_at').notNull().defaultNow(),
  pointsAwarded: integer('points_awarded'),
}, (table) => ({
  eventIdIdx: index('event_check_ins_event_id_idx').on(table.eventId),
  userIdIdx: index('event_check_ins_user_id_idx').on(table.userId),
  checkedInAtIdx: index('event_check_ins_checked_in_at_idx').on(table.checkedInAt),
}));

// Cards table - for collectible cards (from reference codebase)
export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  internalName: text('internal_name').notNull(),
  eventId: uuid('event_id').references(() => events.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// User Cards table - tracks which users have claimed which cards
export const userCards = pgTable('user_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  cardId: uuid('card_id').notNull().references(() => cards.id),
  claimedAt: timestamp('claimed_at').notNull().defaultNow(),
  eventId: uuid('event_id').references(() => events.id),
  metadata: text('metadata'),
}, (table) => ({
  clerkUserIdIdx: index('user_cards_clerk_user_id_idx').on(table.clerkUserId),
  cardIdIdx: index('user_cards_card_id_idx').on(table.cardId),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type NewPointTransaction = typeof pointTransactions.$inferInsert;
export type PointRule = typeof pointRules.$inferSelect;
export type NewPointRule = typeof pointRules.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventCheckIn = typeof eventCheckIns.$inferSelect;
export type NewEventCheckIn = typeof eventCheckIns.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type UserCard = typeof userCards.$inferSelect;
export type NewUserCard = typeof userCards.$inferInsert;
