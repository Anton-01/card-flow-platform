import { SetMetadata } from '@nestjs/common';

export const THROTTLE_LIMIT_KEY = 'throttle-limit';
export const THROTTLE_TTL_KEY = 'throttle-ttl';

export interface ThrottleOptions {
  limit: number;
  ttl: number; // in seconds
}

export const ThrottleCustom = (options: ThrottleOptions) =>
  SetMetadata(THROTTLE_LIMIT_KEY, options);
