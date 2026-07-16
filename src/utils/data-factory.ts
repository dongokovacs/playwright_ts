import { faker } from '@faker-js/faker';
import type { CreateArticlePayload } from '../api/articles.client';
import type { FormData } from '../pages/forms.page';

export function buildArticlePayload(
  overrides: Partial<CreateArticlePayload> = {},
): CreateArticlePayload {
  return {
    title: faker.lorem.sentence(4),
    description: faker.lorem.sentence(8),
    body: faker.lorem.paragraphs(2),
    tagList: [faker.word.noun(), faker.word.noun()],
    ...overrides,
  };
}

// Country/gender/interests are constrained to the fixed options the Forms
// page actually offers, not arbitrary faker output. Values must match the
// <option> labels exactly since selectCountry() uses selectOption({ label }).
const FORM_COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Australia',
  'Germany',
  'Canada',
];

export function buildFormData(overrides: Partial<FormData> = {}): FormData {
  const password = faker.internet.password({ length: 10 });
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.string.numeric(10),
    dob: '1990-01-01',
    gender: faker.helpers.arrayElement(['male', 'female', 'other']),
    country: faker.helpers.arrayElement(FORM_COUNTRIES),
    city: faker.location.city(),
    interests: ['playwright'],
    password,
    confirmPassword: password,
    ...overrides,
  };
}
