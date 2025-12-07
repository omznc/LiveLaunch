import { eq, and } from 'drizzle-orm';
import { db } from './client';
import {
  guilds,
  enabledGuilds,
  ll2Agencies,
  ll2AgenciesFilter,
  ll2Events,
  newsSites,
  newsFilter,
  notificationCountdown,
  scheduledEvents,
  sentNews,
  sentStreams,
} from './schema';
import { logger } from '../utils/logger';

type EnabledGuildInsert = typeof enabledGuilds.$inferInsert;
type LL2EventInsert = typeof ll2Events.$inferInsert;

export async function addGuild(guildId: string): Promise<void> {
  try {
    await db.insert(guilds).values({ guildId }).onConflictDoNothing();
  } catch (error) {
    logger.error('Failed to add guild:', error);
  }
}

export async function removeGuild(guildId: string): Promise<void> {
  try {
    await db.delete(guilds).where(eq(guilds.guildId, guildId));
  } catch (error) {
    logger.error('Failed to remove guild:', error);
  }
}

export async function getEnabledGuild(guildId: string) {
  try {
    const result = await db.select().from(enabledGuilds).where(eq(enabledGuilds.guildId, guildId)).limit(1);
    return result[0] || null;
  } catch (error) {
    logger.error('Failed to get enabled guild:', error);
    return null;
  }
}

export async function getAllEnabledGuilds() {
  try {
    return await db.select().from(enabledGuilds);
  } catch (error) {
    logger.error('Failed to get all enabled guilds:', error);
    return [];
  }
}

export async function enableGuildFeature(
  guildId: string,
  settings: Partial<EnabledGuildInsert>
): Promise<void> {
  try {
    await db
      .insert(enabledGuilds)
      .values({ guildId, ...settings })
      .onConflictDoUpdate({
        target: enabledGuilds.guildId,
        set: settings,
      });
  } catch (error) {
    logger.error('Failed to enable guild feature:', error);
  }
}

export async function disableGuildFeature(guildId: string): Promise<void> {
  try {
    await db.delete(enabledGuilds).where(eq(enabledGuilds.guildId, guildId));
  } catch (error) {
    logger.error('Failed to disable guild feature:', error);
  }
}

export async function addAgency(agencyId: number, name: string, logoUrl: string | null): Promise<void> {
  try {
    await db
      .insert(ll2Agencies)
      .values({ agencyId, name, logoUrl })
      .onConflictDoUpdate({
        target: ll2Agencies.agencyId,
        set: { name, logoUrl },
      });
  } catch (error) {
    logger.error('Failed to add agency:', error);
  }
}

export async function getAgenciesForGuild(guildId: string) {
  try {
    const result = await db
      .select({ agencyId: ll2AgenciesFilter.agencyId })
      .from(ll2AgenciesFilter)
      .where(eq(ll2AgenciesFilter.guildId, guildId));
    return result.map((r) => r.agencyId);
  } catch (error) {
    logger.error('Failed to get agencies for guild:', error);
    return [];
  }
}

export async function addAgencyFilter(guildId: string, agencyId: number): Promise<void> {
  try {
    await db.insert(ll2AgenciesFilter).values({ guildId, agencyId }).onConflictDoNothing();
  } catch (error) {
    logger.error('Failed to add agency filter:', error);
  }
}

export async function removeAgencyFilter(guildId: string, agencyId: number): Promise<void> {
  try {
    await db
      .delete(ll2AgenciesFilter)
      .where(and(eq(ll2AgenciesFilter.guildId, guildId), eq(ll2AgenciesFilter.agencyId, agencyId)));
  } catch (error) {
    logger.error('Failed to remove agency filter:', error);
  }
}

export async function addOrUpdateEvent(event: LL2EventInsert): Promise<void> {
  try {
    await db
      .insert(ll2Events)
      .values(event)
      .onConflictDoUpdate({
        target: ll2Events.ll2Id,
        set: event,
      });
  } catch (error) {
    logger.error('Failed to add or update event:', error);
  }
}

export async function getEvent(ll2Id: string) {
  try {
    const result = await db.select().from(ll2Events).where(eq(ll2Events.ll2Id, ll2Id)).limit(1);
    return result[0] || null;
  } catch (error) {
    logger.error('Failed to get event:', error);
    return null;
  }
}

export async function getAllEvents() {
  try {
    return await db.select().from(ll2Events);
  } catch (error) {
    logger.error('Failed to get all events:', error);
    return [];
  }
}

export async function deleteEvent(ll2Id: string): Promise<void> {
  try {
    await db.delete(ll2Events).where(eq(ll2Events.ll2Id, ll2Id));
  } catch (error) {
    logger.error('Failed to delete event:', error);
  }
}

export async function addNewsSite(newsSiteId: number, newsSiteName: string, logoUrl: string | null): Promise<void> {
  try {
    await db
      .insert(newsSites)
      .values({ newsSiteId, newsSiteName, logoUrl })
      .onConflictDoUpdate({
        target: newsSites.newsSiteId,
        set: { newsSiteName, logoUrl },
      });
  } catch (error) {
    logger.error('Failed to add news site:', error);
  }
}

export async function getNewsFiltersForGuild(guildId: string) {
  try {
    const result = await db
      .select({ newsSiteId: newsFilter.newsSiteId })
      .from(newsFilter)
      .where(eq(newsFilter.guildId, guildId));
    return result.map((r) => r.newsSiteId);
  } catch (error) {
    logger.error('Failed to get news filters for guild:', error);
    return [];
  }
}

export async function addNewsFilter(guildId: string, newsSiteId: number): Promise<void> {
  try {
    await db.insert(newsFilter).values({ guildId, newsSiteId }).onConflictDoNothing();
  } catch (error) {
    logger.error('Failed to add news filter:', error);
  }
}

export async function removeNewsFilter(guildId: string, newsSiteId: number): Promise<void> {
  try {
    await db
      .delete(newsFilter)
      .where(and(eq(newsFilter.guildId, guildId), eq(newsFilter.newsSiteId, newsSiteId)));
  } catch (error) {
    logger.error('Failed to remove news filter:', error);
  }
}

export async function getNotificationCountdowns(guildId: string) {
  try {
    const result = await db
      .select()
      .from(notificationCountdown)
      .where(eq(notificationCountdown.guildId, guildId));
    return result.map((r) => r.minutes);
  } catch (error) {
    logger.error('Failed to get notification countdowns:', error);
    return [];
  }
}

export async function addNotificationCountdown(guildId: string, minutes: number): Promise<void> {
  try {
    await db.insert(notificationCountdown).values({ guildId, minutes }).onConflictDoNothing();
  } catch (error) {
    logger.error('Failed to add notification countdown:', error);
  }
}

export async function removeNotificationCountdown(guildId: string, minutes: number): Promise<void> {
  try {
    await db
      .delete(notificationCountdown)
      .where(and(eq(notificationCountdown.guildId, guildId), eq(notificationCountdown.minutes, minutes)));
  } catch (error) {
    logger.error('Failed to remove notification countdown:', error);
  }
}

export async function addScheduledEvent(
  scheduledEventId: string,
  guildId: string,
  ll2Id: string
): Promise<void> {
  try {
    await db
      .insert(scheduledEvents)
      .values({ scheduledEventId, guildId, ll2Id })
      .onConflictDoNothing();
  } catch (error) {
    logger.error('Failed to add scheduled event:', error);
  }
}

export async function getScheduledEvent(scheduledEventId: string) {
  try {
    const result = await db
      .select()
      .from(scheduledEvents)
      .where(eq(scheduledEvents.scheduledEventId, scheduledEventId))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    logger.error('Failed to get scheduled event:', error);
    return null;
  }
}

export async function getScheduledEventsByLL2Id(ll2Id: string) {
  try {
    return await db.select().from(scheduledEvents).where(eq(scheduledEvents.ll2Id, ll2Id));
  } catch (error) {
    logger.error('Failed to get scheduled events by LL2 ID:', error);
    return [];
  }
}

export async function deleteScheduledEvent(scheduledEventId: string): Promise<void> {
  try {
    await db.delete(scheduledEvents).where(eq(scheduledEvents.scheduledEventId, scheduledEventId));
  } catch (error) {
    logger.error('Failed to delete scheduled event:', error);
  }
}

export async function markNewsAsSent(snapiId: number): Promise<void> {
  try {
    await db
      .insert(sentNews)
      .values({ snapiId, datetime: new Date() })
      .onConflictDoNothing();
  } catch (error) {
    logger.error('Failed to mark news as sent:', error);
  }
}

export async function isNewsSent(snapiId: number): Promise<boolean> {
  try {
    const result = await db.select().from(sentNews).where(eq(sentNews.snapiId, snapiId)).limit(1);
    return result.length > 0;
  } catch (error) {
    logger.error('Failed to check if news is sent:', error);
    return false;
  }
}

export async function markStreamAsSent(ytVidId: string): Promise<void> {
  try {
    await db
      .insert(sentStreams)
      .values({ ytVidId, datetime: new Date() })
      .onConflictDoNothing();
  } catch (error) {
    logger.error('Failed to mark stream as sent:', error);
  }
}

export async function isStreamSent(ytVidId: string): Promise<boolean> {
  try {
    const result = await db.select().from(sentStreams).where(eq(sentStreams.ytVidId, ytVidId)).limit(1);
    return result.length > 0;
  } catch (error) {
    logger.error('Failed to check if stream is sent:', error);
    return false;
  }
}
