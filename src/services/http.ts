import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, TOKEN_STORAGE_KEY } from './config';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  includeAuth?: boolean;
};

export class ApiError extends Error {
  status?: number;
  payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export async function request<T>({
  method = 'GET',
  path,
  body,
  headers = {},
  includeAuth = true,
}: RequestOptions): Promise<T> {
  const token = includeAuth ? await AsyncStorage.getItem(TOKEN_STORAGE_KEY) : null;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    const networkMessage =
      error instanceof Error && error.message
        ? error.message
        : 'Không thể kết nối máy chủ.';
    throw new ApiError(`Lỗi kết nối: ${networkMessage}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      (typeof payload === 'object' &&
        payload !== null &&
        'responseText' in payload &&
        typeof payload.responseText === 'string' &&
        payload.responseText) ||
      (typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof payload.message === 'string' &&
        payload.message) ||
      (typeof payload === 'string' && payload) ||
      `Request failed (${response.status})`;

    throw new ApiError(errorMessage, response.status, payload);
  }

  return payload as T;
}
