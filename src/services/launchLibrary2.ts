import axios from 'axios';
import { logger } from '../utils/logger';
import { parseDuration, truncateText } from '../utils/helpers';

export interface LL2Launch {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  start: Date;
  end: Date;
  location: string;
  webcastLive: boolean;
  slug: string;
  agencyId: number;
  agencyName: string;
  status: number;
  flightclub: boolean;
}

export interface LL2Event {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  start: Date;
  end: Date;
  location: string;
  webcastLive: boolean;
  slug: string;
  flightclub: boolean;
}

export type LL2Combined = LL2Launch | LL2Event;

export class LaunchLibrary2 {
  private readonly apiToken: string;
  private readonly baseUrl = 'https://ll.thespacedevs.com/2.3.0';
  private readonly maxEvents = 64;
  private readonly maxDescriptionLength = 1000;
  private readonly timeDeltaMaxNet = 1461; // days
  private readonly imageFormats = ['.gif', '.jpeg', '.jpg', '.png', '.webp'];

  public readonly noStream = 'No stream yet';
  public readonly fcName = 'Flight Club';
  public readonly fcEmoji = '<:FlightClub:972885637436964946>';
  public readonly fcUrl = 'https://flightclub.io/result?llId=%s';
  public readonly g4lName = 'Go4Liftoff';
  public readonly g4lEmoji = '<:Go4Liftoff:970384895593562192>';
  public readonly g4lEventUrl = 'https://go4liftoff.com/event/id/%s';
  public readonly g4lLaunchUrl = 'https://go4liftoff.com/launch/id/%s';
  public readonly slnName = 'Space Launch Now';
  public readonly slnEmoji = '<:SpaceLaunchNow:970384894985379960>';
  public readonly slnEventUrl = 'https://spacelaunchnow.me/event/%s/';
  public readonly slnLaunchUrl = 'https://spacelaunchnow.me/launch/%s/';

  public readonly statusColors: Record<number, number> = {
    1: 0x00ff00, // Go
    2: 0xff0000, // TBD
    3: 0x00ff00, // Success
    4: 0xff0000, // Failure
    5: 0xffff00, // Hold
    6: 0x0000ff, // In Flight
    7: 0xff7f00, // Partial Failure
    8: 0xff7f00, // TBC
    9: 0x00ffff, // Payload Deployed
  };

  public readonly statusNames: Record<number, string> = {
    1: 'Go for Launch',
    2: 'To Be Determined',
    3: 'Launch Successful',
    4: 'Launch Failure',
    5: 'On Hold',
    6: 'Launch in Flight',
    7: 'Launch was a Partial Failure',
    8: 'To Be Confirmed',
    9: 'Payload Deployed',
  };

  private readonly netPrecisionFormats: Record<number, string> = {
    2: '[NET %H:00 UTC] ',
    3: '[Morning (local)] ',
    4: '[Afternoon (local)] ',
    5: '[NET %B %d] ',
    6: '[NET Week %W] ',
    7: '[NET %B] ',
    8: '[Q1 %Y] ',
    9: '[Q2 %Y] ',
    10: '[Q3 %Y] ',
    11: '[Q4 %Y] ',
    12: '[H1 %Y] ',
    13: '[H2 %Y] ',
    14: '[TBD %Y] ',
    15: '[FY %Y] ',
  };

  private readonly eventDuration: Record<string, number> = {
    EVA: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
    default: 60 * 60 * 1000, // 1 hour in milliseconds
  };

  public readonly launchStatusEnd = [3, 4, 7];

  constructor() {
    this.apiToken = process.env.LL2_TOKEN || '';
  }

  private async makeRequest<T>(url: string): Promise<T | null> {
    try {
      const response = await axios.get<{ results: T }>(url, {
        headers: this.apiToken ? { Authorization: `Token ${this.apiToken}` } : {},
      });
      return response.data.results;
    } catch (error) {
      logger.error('LL2 API request failed:', error);
      return null;
    }
  }

  private formatNetPrecision(date: Date, precisionId: number): string {
    const format = this.netPrecisionFormats[precisionId];
    if (!format) return '';

    // Simple date formatting (can be expanded with a library if needed)
    const month = date.toLocaleString('en', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    const hour = date.getUTCHours();
    const week = Math.ceil(date.getDate() / 7);

    return format
      .replace('%B', month)
      .replace('%d', day.toString())
      .replace('%Y', year.toString())
      .replace('%H', hour.toString().padStart(2, '0'))
      .replace('%W', week.toString());
  }

  private pickVideo(vidUrls: Array<{ url: string; priority: number }>): string | null {
    if (!vidUrls || vidUrls.length === 0) return null;

    let priority: number | null = null;
    let pickedVideo: string | null = null;

    for (const vid of vidUrls) {
      if (priority === null || vid.priority < priority) {
        priority = vid.priority;
        pickedVideo = vid.url;
      }
    }

    return pickedVideo;
  }

  private isValidImageUrl(url: string | null): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return this.imageFormats.some((format) => lowerUrl.endsWith(format));
  }

  async upcomingLaunches(): Promise<Record<string, LL2Launch>> {
    const maxNet = new Date();
    maxNet.setDate(maxNet.getDate() + this.timeDeltaMaxNet);
    const maxNetStr = maxNet.toISOString();

    const url = `${this.baseUrl}/launches/upcoming/?limit=50&mode=detailed&net__lte=${maxNetStr}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await this.makeRequest<any[]>(url);

    if (!results) return {};

    const launches: Record<string, LL2Launch> = {};

    for (const entry of results) {
      const net = new Date(entry.net);

      let name = entry.name;
      if (entry.net_precision?.id) {
        name = this.formatNetPrecision(net, entry.net_precision.id) + name;
      } else if (entry.status?.id === 2) {
        name = '[TBD] ' + name;
      }

      const pickedVideo = this.pickVideo(entry.vid_urls);

      let description = entry.mission?.description || null;
      if (description && description.length > this.maxDescriptionLength) {
        description = truncateText(description, this.maxDescriptionLength);
      }

      const imageUrl = this.isValidImageUrl(entry.image?.image_url) ? entry.image.image_url : null;

      const end = new Date(net.getTime() + this.eventDuration.default);

      launches[entry.id] = {
        id: entry.id,
        name,
        description,
        url: pickedVideo,
        imageUrl,
        start: net,
        end,
        location: entry.pad?.location?.name || 'Unknown',
        webcastLive: entry.webcast_live || false,
        slug: entry.slug || '',
        agencyId: entry.launch_service_provider?.id || 0,
        agencyName: entry.launch_service_provider?.name || 'Unknown',
        status: entry.status?.id || 0,
        flightclub: !!entry.flightclub_url,
      };
    }

    return launches;
  }

  async upcomingEvents(): Promise<Record<string, LL2Event>> {
    const maxNet = new Date();
    maxNet.setDate(maxNet.getDate() + this.timeDeltaMaxNet);
    const maxNetStr = maxNet.toISOString();

    const url = `${this.baseUrl}/events/upcoming/?date__lte=${maxNetStr}&limit=50`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await this.makeRequest<any[]>(url);

    if (!results) return {};

    const events: Record<string, LL2Event> = {};

    for (const entry of results) {
      const net = new Date(entry.date);

      let name = entry.name;
      if (entry.date_precision?.id) {
        name = this.formatNetPrecision(net, entry.date_precision.id) + name;
      } else {
        name = '[TBD] ' + name;
      }

      const eventType = entry.type?.name || 'default';
      let duration = this.eventDuration[eventType] || this.eventDuration.default;

      if (entry.duration) {
        duration = parseDuration(entry.duration);
      }

      const end = new Date(net.getTime() + duration);

      const pickedVideo = this.pickVideo(entry.vid_urls);

      let description = entry.description || null;
      if (description && description.length > this.maxDescriptionLength) {
        description = truncateText(description, this.maxDescriptionLength);
      }

      const imageUrl = this.isValidImageUrl(entry.image?.image_url) ? entry.image.image_url : null;

      events[entry.id.toString()] = {
        id: entry.id.toString(),
        name,
        description,
        url: pickedVideo,
        imageUrl,
        start: net,
        end,
        location: entry.location || 'Unknown',
        webcastLive: entry.webcast_live || false,
        slug: entry.slug || '',
        flightclub: false,
      };
    }

    return events;
  }

  async upcoming(): Promise<Record<string, LL2Combined>> {
    const [launches, events] = await Promise.all([this.upcomingLaunches(), this.upcomingEvents()]);

    if (Object.keys(launches).length === 0 || Object.keys(events).length === 0) {
      return {};
    }

    const combined: Record<string, LL2Combined> = { ...launches, ...events };

    const sorted = Object.entries(combined)
      .sort(([, a], [, b]) => a.start.getTime() - b.start.getTime())
      .slice(0, this.maxEvents);

    return Object.fromEntries(sorted);
  }
}

export const launchLibrary2 = new LaunchLibrary2();
