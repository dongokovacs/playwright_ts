import type { TagsResponse } from './schemas/tags.schema';
import { ApiClient } from './request-handler';

export class TagsClient {
  constructor(private readonly api: ApiClient) {}

  async list(): Promise<TagsResponse> {
    return this.api.path('/tags').getRequest<TagsResponse>(200);
  }
}
