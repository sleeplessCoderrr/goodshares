import { HttpException } from '@nestjs/common';
import type { AxiosError } from 'axios';

export function rethrow(err: unknown): never {
  const axiosErr = err as AxiosError<{ message?: string | string[] }>;
  if (axiosErr.response) {
    const data = axiosErr.response.data;
    const message =
      (data && typeof data === 'object' && 'message' in data && data.message) ||
      axiosErr.response.statusText ||
      'upstream error';
    throw new HttpException(message as string | string[], axiosErr.response.status);
  }
  throw new HttpException('upstream unavailable', 502);
}
