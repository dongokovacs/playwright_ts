import { test, expect } from '../../src/fixtures';
import { TagsResponseSchema } from '../../src/api/schemas/tags.schema';

test.describe('Tags API', () => {
  test('GET /tags @smoke returns a schema-valid list of tag strings', async ({ tagsApi }) => {
    const response = await tagsApi.list();

    expect(response).shouldMatchSchema(TagsResponseSchema);
  });
});
