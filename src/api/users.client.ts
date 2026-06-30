import type { UserResponse } from './schemas/user.schema';
import { ApiClient } from './request-handler';

export class UsersClient {
  constructor(private readonly api: ApiClient) {}

  async register(username: string, email: string, password: string): Promise<UserResponse> {
    return this.api
      .path('/users')
      .clearAuth()
      .body({ user: { username, email, password } })
      .postRequest<UserResponse>(201);
  }

  async login(email: string, password: string): Promise<UserResponse> {
    return this.api
      .path('/users/login')
      .clearAuth()
      .body({ user: { email, password } })
      .postRequest<UserResponse>(200);
  }

  async registerExpectingError<T = unknown>(
    username: string,
    email: string,
    password: string,
  ): Promise<T> {
    return this.api
      .path('/users')
      .clearAuth()
      .body({ user: { username, email, password } })
      .postRequest<T>(422);
  }
}
