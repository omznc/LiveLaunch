import axios from 'axios';
import { logger } from '../utils/logger';

export interface NewsArticle {
  id: number;
  title: string;
  url: string;
  imageUrl: string;
  newsSite: string;
  summary: string;
  publishedAt: Date;
}

export class SpaceflightNewsAPI {
  private readonly apiUrl = 'https://api.spaceflightnewsapi.net/v4/articles/';
  private readonly maxDaysOld = 5;

  async fetchArticles(): Promise<NewsArticle[]> {
    try {
      const response = await axios.get(this.apiUrl);

      if (!response.data?.results) {
        return [];
      }

      const nowMinus5Days = new Date();
      nowMinus5Days.setDate(nowMinus5Days.getDate() - this.maxDaysOld);

      const filteredNews: NewsArticle[] = [];

      for (const article of response.data.results) {
        const publishedAt = new Date(article.published_at);

        if (publishedAt < nowMinus5Days) {
          continue;
        }

        filteredNews.push({
          id: article.id,
          title: article.title,
          url: article.url,
          imageUrl: article.image_url,
          newsSite: article.news_site,
          summary: article.summary,
          publishedAt,
        });
      }

      return filteredNews;
    } catch (error) {
      logger.error('Failed to fetch spaceflight news:', error);
      return [];
    }
  }
}

export const spaceflightNews = new SpaceflightNewsAPI();
