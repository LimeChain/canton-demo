import { getAccessToken } from '../../../providers/auth/keycloak';
import { ApiError } from './client.errors';
import { readResponsePayload } from './client.helpers';
import { ApiRequestOptions } from './client.types';

export async function request<TResponse>(path: string, options: ApiRequestOptions = {}): Promise<TResponse> {
  const token = await getAccessToken();
  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return payload as TResponse;
}
