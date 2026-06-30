import type { ArticleResponse, ArticlesListResponse } from './schemas/article.schema';
import { ApiClient } from './request-handler';

export type CreateArticlePayload = {
  title: string;
  description: string;
  body: string;
  tagList: string[];
};

export class ArticlesClient {
  constructor(private readonly api: ApiClient) {}

  async list(limit = 10, offset = 0): Promise<ArticlesListResponse> {
    return this.api
      .path('/articles')
      .params({ limit, offset })
      .getRequest<ArticlesListResponse>(200);
  }

  async getBySlug(slug: string): Promise<ArticleResponse> {
    return this.api.path(`/articles/${slug}`).getRequest<ArticleResponse>(200);
  }

  async create(payload: CreateArticlePayload): Promise<ArticleResponse> {
    return this.api.path('/articles').body({ article: payload }).postRequest<ArticleResponse>(201);
  }

  async update(slug: string, payload: Partial<CreateArticlePayload>): Promise<ArticleResponse> {
    return this.api
      .path(`/articles/${slug}`)
      .body({ article: payload })
      .putRequest<ArticleResponse>(200);
  }

  async delete(slug: string): Promise<void> {
    return this.api.path(`/articles/${slug}`).deleteRequest(204);
  }
}
