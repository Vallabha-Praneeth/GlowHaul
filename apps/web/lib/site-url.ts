import { resolveAppUrl } from '@glowhaul/config';
import { env } from './env';

type HeaderReader = Pick<Headers, 'get'>;

export function getAppOrigin(headers?: HeaderReader) {
  return resolveAppUrl({
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL,
    VERCEL_ENV: env.VERCEL_ENV,
    VERCEL_URL: env.VERCEL_URL,
    VERCEL_BRANCH_URL: env.VERCEL_BRANCH_URL,
    VERCEL_PROJECT_PRODUCTION_URL: env.VERCEL_PROJECT_PRODUCTION_URL,
    origin: headers?.get('origin'),
    forwardedHost: headers?.get('x-forwarded-host'),
    forwardedProto: headers?.get('x-forwarded-proto'),
  });
}
