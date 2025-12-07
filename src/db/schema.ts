import { pgTable, text, smallint, integer, boolean, timestamp, varchar, primaryKey } from 'drizzle-orm/pg-core';

// Guilds table - stores all Discord guild IDs
export const guilds = pgTable('guilds', {
  guildId: text('guild_id').primaryKey(),
});

// Enabled guilds table - stores guild-specific settings
export const enabledGuilds = pgTable('enabled_guilds', {
  guildId: text('guild_id').primaryKey(),
  channelId: text('channel_id'),
  webhookUrl: text('webhook_url'),
  scheduledEvents: smallint('scheduled_events').default(0),
  seLaunch: smallint('se_launch').default(1),
  seEvent: smallint('se_event').default(1),
  seNoUrl: smallint('se_no_url').default(0),
  agenciesIncludeExclude: smallint('agencies_include_exclude').default(0),
  newsChannelId: text('news_channel_id'),
  newsWebhookUrl: text('news_webhook_url'),
  newsIncludeExclude: smallint('news_include_exclude').default(0),
  notificationChannelId: text('notification_channel_id'),
  notificationWebhookUrl: text('notification_webhook_url'),
  notificationLaunch: smallint('notification_launch').default(0),
  notificationEvent: smallint('notification_event').default(0),
  notificationT0Change: smallint('notification_t0_change').default(0),
  notificationTbd: smallint('notification_tbd').default(0),
  notificationTbc: smallint('notification_tbc').default(0),
  notificationGo: smallint('notification_go').default(0),
  notificationLiftoff: smallint('notification_liftoff').default(0),
  notificationHold: smallint('notification_hold').default(0),
  notificationDeploy: smallint('notification_deploy').default(0),
  notificationEndStatus: smallint('notification_end_status').default(0),
  notificationScheduledEvent: smallint('notification_scheduled_event').default(0),
  notificationButtonFc: smallint('notification_button_fc').default(1),
  notificationButtonG4l: smallint('notification_button_g4l').default(1),
  notificationButtonSln: smallint('notification_button_sln').default(1),
});

// LL2 Agencies table
export const ll2Agencies = pgTable('ll2_agencies', {
  agencyId: smallint('agency_id').primaryKey(),
  name: text('name'),
  logoUrl: text('logo_url'),
});

// LL2 Agencies filter table
export const ll2AgenciesFilter = pgTable(
  'll2_agencies_filter',
  {
    guildId: text('guild_id').references(() => enabledGuilds.guildId, { onDelete: 'cascade' }),
    agencyId: smallint('agency_id').references(() => ll2Agencies.agencyId),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.agencyId] }),
  })
);

// LL2 Events table
export const ll2Events = pgTable('ll2_events', {
  ll2Id: varchar('ll2_id', { length: 36 }).primaryKey(),
  agencyId: smallint('agency_id').references(() => ll2Agencies.agencyId),
  name: text('name'),
  status: smallint('status'),
  description: text('description'),
  url: text('url'),
  imageUrl: text('image_url'),
  start: timestamp('start', { withTimezone: true }),
  end: timestamp('end', { withTimezone: true }),
  webcastLive: boolean('webcast_live').default(false),
  slug: text('slug'),
  flightclub: boolean('flightclub').default(false),
});

// News sites table
export const newsSites = pgTable('news_sites', {
  newsSiteId: smallint('news_site_id').primaryKey(),
  newsSiteName: text('news_site_name'),
  logoUrl: text('logo_url'),
});

// News filter table
export const newsFilter = pgTable(
  'news_filter',
  {
    guildId: text('guild_id').references(() => enabledGuilds.guildId, { onDelete: 'cascade' }),
    newsSiteId: smallint('news_site_id').references(() => newsSites.newsSiteId),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.newsSiteId] }),
  })
);

// Notification countdown table
export const notificationCountdown = pgTable(
  'notification_countdown',
  {
    guildId: text('guild_id').references(() => enabledGuilds.guildId, { onDelete: 'cascade' }),
    minutes: smallint('minutes'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guildId, table.minutes] }),
  })
);

// Scheduled events table
export const scheduledEvents = pgTable('scheduled_events', {
  scheduledEventId: text('scheduled_event_id').primaryKey(),
  guildId: text('guild_id').references(() => enabledGuilds.guildId),
  ll2Id: varchar('ll2_id', { length: 36 }).references(() => ll2Events.ll2Id, { onDelete: 'cascade' }),
});

// Sent news table
export const sentNews = pgTable('sent_news', {
  snapiId: integer('snapi_id').primaryKey(),
  datetime: timestamp('datetime', { withTimezone: true }),
});

// Sent streams table
export const sentStreams = pgTable('sent_streams', {
  ytVidId: text('yt_vid_id').primaryKey(),
  datetime: timestamp('datetime', { withTimezone: true }),
});
