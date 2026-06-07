import { HttpException, Logger } from '@nestjs/common';
import type { AxiosError } from 'axios';

const logger = new Logger('GatewayProxy');

export function rethrow(err: unknown): never {
  const axiosErr = err as AxiosError<{ message?: string | string[]; statusCode?: number }>;

  if (axiosErr.response) {
    const { status, data, config } = axiosErr.response;
    const upstream = config?.url ?? 'upstream';
    const message =
      (data && typeof data === 'object' && 'message' in data && data.message) ||
      axiosErr.response.statusText ||
      'upstream error';

    logger.error(`${config?.method?.toUpperCase() ?? 'HTTP'} ${upstream} → ${status}: ${JSON.stringify(message)}`);
    throw new HttpException({ statusCode: status, message, upstream }, status);
  }

  const code = axiosErr.code ?? 'UNKNOWN';
  const url = axiosErr.config?.url ?? 'unknown';
  const method = axiosErr.config?.method?.toUpperCase() ?? 'HTTP';

  logger.error(`${method} ${url} failed — ${code}: ${axiosErr.message}`);

  const readable: Record<string, string> = {
    ECONNREFUSED: `Service at ${url} is not running (connection refused)`,
    ENOTFOUND: `Cannot resolve host for ${url}`,
    ETIMEDOUT: `Request to ${url} timed out`,
    ECONNRESET: `Connection to ${url} was reset`,
  };

  throw new HttpException(
    {
      statusCode: 502,
      message: readable[code] ?? `Could not reach ${url} (${code})`,
      upstream: url,
    },
    502,
  );
}
