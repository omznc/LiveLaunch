import axios from 'axios';
import { parse } from 'node-html-parser';
import { logger } from '../utils/logger';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  isLive: boolean;
}

export interface NASATVStream {
  title: string;
  url: string;
  isLive: boolean;
}

export class YouTubeService {
  async getChannelLiveStreams(channelId: string): Promise<YouTubeVideo[]> {
    try {
      const url = `https://www.youtube.com/channel/${channelId}/live`;
      const response = await axios.get(url);
      const html = parse(response.data);

      const videos: YouTubeVideo[] = [];

      const scripts = html.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent;
        if (content.includes('ytInitialData')) {
          const match = content.match(/var ytInitialData = ({.*?});/);
          if (match) {
            try {
              const data = JSON.parse(match[1]);
              const videoRenderer =
                data?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]
                  ?.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer;

              if (videoRenderer) {
                const videoId = data?.currentVideoEndpoint?.watchEndpoint?.videoId;
                const title = data?.engagementPanels?.[0]?.engagementPanelSectionListRenderer?.header?.engagementPanelTitleHeaderRenderer?.title?.simpleText;

                if (videoId) {
                  videos.push({
                    videoId,
                    title: title || 'Live Stream',
                    channelName: videoRenderer.title.runs[0].text,
                    channelId,
                    isLive: true,
                  });
                }
              }
            } catch (parseError) {
              logger.debug('Failed to parse YouTube data:', parseError);
            }
          }
        }
      }

      return videos;
    } catch (error) {
      logger.error('Failed to fetch YouTube live streams:', error);
      return [];
    }
  }

  async getNASATV(): Promise<NASATVStream | null> {
    try {
      const channelId = 'UCLA_DiR1FfKNvjuUpBHmylQ';
      const streams = await this.getChannelLiveStreams(channelId);

      if (streams.length > 0) {
        const stream = streams[0];
        return {
          title: stream.title,
          url: `https://www.youtube.com/watch?v=${stream.videoId}`,
          isLive: stream.isLive,
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch NASA TV:', error);
      return null;
    }
  }

  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
      /youtube\.com\/v\/([^&\s]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  getVideoUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  getThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
}

export const youtubeService = new YouTubeService();
