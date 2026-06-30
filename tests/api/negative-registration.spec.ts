import { faker } from '@faker-js/faker';
import { test, expect } from '../../src/fixtures';

type UsernameBoundaryCase = {
  description: string;
  length: number;
  expectedError: string | null;
};

const usernameBoundaryCases: UsernameBoundaryCase[] = [
  {
    description: 'below minimum (2 chars)',
    length: 2,
    expectedError: 'is too short (minimum is 3 characters)',
  },
  { description: 'at minimum (3 chars)', length: 3, expectedError: null },
  { description: 'at maximum (20 chars)', length: 20, expectedError: null },
  {
    description: 'above maximum (21 chars)',
    length: 21,
    expectedError: 'is too long (maximum is 20 characters)',
  },
];

test.describe('Negative API tests — username length validation', () => {
  usernameBoundaryCases.forEach(({ description, length, expectedError }) => {
    test(`registration with username ${description}`, async ({ usersApi }) => {
      const username = faker.string.alphanumeric({ length, casing: 'lower' });
      // Deliberately invalid email so the request always fails with 422
      // regardless of whether the username itself is valid — this lets us
      // isolate and assert purely on the presence/content of the
      // username-specific error, the same way the negative-test DDT
      // pattern is used for any single-field boundary check.
      const invalidEmail = 'not-an-email-format';

      const response = await usersApi.registerExpectingError<{ errors: Record<string, string[]> }>(
        username,
        invalidEmail,
        'password123',
      );

      if (expectedError === null) {
        expect(response.errors).not.toHaveProperty('username');
      } else {
        expect(response.errors.username[0]).shouldEqual(expectedError);
      }
    });
  });
});
