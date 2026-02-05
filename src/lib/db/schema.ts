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

// Campaign Sites Tables
export const siteTemplates = pgTable('site_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  templatePath: text('template_path').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const campaignSites = pgTable('campaign_sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  slug: text('slug').notNull().unique(),
  status: text('status').notNull().default('draft'), // 'draft', 'published', 'archived'
  templateId: uuid('template_id').references(() => siteTemplates.id),
  vercelProjectId: text('vercel_project_id'),
  vercelDeploymentUrl: text('vercel_deployment_url'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  vercelDeploymentId: text('vercel_deployment_id'), // Track specific deployment
  deploymentStatus: text('deployment_status'), // 'building', 'ready', 'error', 'canceled'
  lastDeployedAt: timestamp('last_deployed_at'),
  // Clerk/Authentication Configuration
  enableUserManagement: boolean('enable_user_management').notNull().default(true), // Whether site includes user authentication
  clerkPublishableKey: text('clerk_publishable_key'), // Site-specific Clerk publishable key (optional, falls back to global)
  clerkSecretKey: text('clerk_secret_key'), // Site-specific Clerk secret key (optional, falls back to global)
  // Theme Configuration
  backgroundColor: text('background_color'), // Site background color (hex code, e.g., #000000)
  textColor: text('text_color'), // Site text color (hex code, e.g., #FFFFFF)
}, (table) => ({
  slugIdx: index('campaign_sites_slug_idx').on(table.slug),
  statusIdx: index('campaign_sites_status_idx').on(table.status),
  createdByIdx: index('campaign_sites_created_by_idx').on(table.createdBy),
}));

export const campaignSiteContent = pgTable('campaign_site_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => campaignSites.id, { onDelete: 'cascade' }),
  section: text('section').notNull(), // 'hero', 'description', 'cards', 'signup'
  contentType: text('content_type').notNull(), // 'text', 'richText', 'image', 'video', 'cardManifest'
  content: jsonb('content').notNull(),
  order: integer('order').notNull().default(0),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteIdIdx: index('campaign_site_content_site_id_idx').on(table.siteId),
  sectionIdx: index('campaign_site_content_section_idx').on(table.section),
}));

export const campaignAssets = pgTable('campaign_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => campaignSites.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'image', 'video', 'audio', 'document'
  url: text('url').notNull(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type'),
  size: integer('size'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
}, (table) => ({
  siteIdIdx: index('campaign_assets_site_id_idx').on(table.siteId),
  typeIdx: index('campaign_assets_type_idx').on(table.type),
}));

export const cardManifests = pgTable('card_manifests', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => campaignSites.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  manifest: jsonb('manifest').notNull(),
  cardImageUrl: text('card_image_url'), // Legacy/preview field
  frontImageUrl: text('front_image_url'), // Front face asset URL
  backImageUrl: text('back_image_url'), // Back face asset URL
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteIdIdx: index('card_manifests_site_id_idx').on(table.siteId),
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
export type SiteTemplate = typeof siteTemplates.$inferSelect;
export type NewSiteTemplate = typeof siteTemplates.$inferInsert;
export type CampaignSite = typeof campaignSites.$inferSelect;
export type NewCampaignSite = typeof campaignSites.$inferInsert;
export type CampaignSiteContent = typeof campaignSiteContent.$inferSelect;
export type NewCampaignSiteContent = typeof campaignSiteContent.$inferInsert;
export type CampaignAsset = typeof campaignAssets.$inferSelect;
export type NewCampaignAsset = typeof campaignAssets.$inferInsert;
export type CardManifest = typeof cardManifests.$inferSelect;
export type NewCardManifest = typeof cardManifests.$inferInsert;