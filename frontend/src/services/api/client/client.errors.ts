export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, payload: unknown) {
    super('API request failed');
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}
