import { z } from 'zod';

const optionalUrlSchema = z
  .union([z.string().url(), z.literal('')])
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalHostSchema = z
  .string()
  .optional()
  .transform((value) => (value ? value : undefined));

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('GlowHaul'),
  NEXT_PUBLIC_SITE_URL: optionalUrlSchema,
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://127.0.0.1:3100'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('http://127.0.0.1:55421'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default('replace_me'),
  NEXT_PUBLIC_MAP_PROVIDER: z.string().default('maplibre'),
  NEXT_PUBLIC_MAP_STYLE_URL: z.string().url().default('https://demotiles.maplibre.org/style.json'),
});

export const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('replace_me'),
  AUTH_PRIMARY_METHOD: z.enum(['magic-link', 'phone-otp', 'hybrid']).default('magic-link'),
  AUTH_PHONE_OTP_ENABLED: z
    .union([z.boolean(), z.string()])
    .transform((value) => value === true || value === 'true')
    .default(false),
  AUTH_PHONE_OTP_PLACEHOLDER: z.string().default('+15555550123'),
  AUTH_PHONE_OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  AUTH_PHONE_OTP_EXPIRES_IN_SECONDS: z.coerce.number().int().min(30).max(600).default(60),
  AUTH_ENFORCE_ROUTE_GUARDS: z
    .union([z.boolean(), z.string()])
    .transform((value) => value === true || value === 'true')
    .default(false),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  VERCEL_URL: optionalHostSchema,
  VERCEL_BRANCH_URL: optionalHostSchema,
  VERCEL_PROJECT_PRODUCTION_URL: optionalHostSchema,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Check whether the public Supabase URL and anon key are configured with real values.
 */
export function hasSupabaseCredentials(env: Pick<ServerEnv, 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'>) {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'replace_me'
  );
}

const LOCAL_HOST_PATTERN =
  /^(?:localhost|127(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3})(?::\d+)?$/i;
const DNS_HOST_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?::\d+)?$/i;

/**
 * Allow only local or DNS-style hosts that are safe to promote into an app origin.
 */
function isAllowedHost(candidate: string) {
  return LOCAL_HOST_PATTERN.test(candidate) || DNS_HOST_PATTERN.test(candidate);
}

/**
 * Remove a terminal slash so origin-like values normalize to a stable shape.
 */
export function trimTrailingSlash(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Convert trusted env/header candidates into a normalized base URL or reject them.
 */
export function normalizeUrlCandidate(candidate: string) {
  const trimmed = candidate.trim();
  if (!trimmed || /[\s,]/.test(trimmed)) {
    return null;
  }

  const lowered = trimmed.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') {
    return null;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }

      if (!isAllowedHost(parsed.host)) {
        return null;
      }

      return trimTrailingSlash(parsed.toString());
    } catch {
      return null;
    }
  }

  const isLocalHost = LOCAL_HOST_PATTERN.test(trimmed);
  const isDnsHost = DNS_HOST_PATTERN.test(trimmed);
  if (!isLocalHost && !isDnsHost) {
    return null;
  }

  const protocol = isLocalHost ? 'http' : 'https';
  return `${protocol}://${trimmed}`;
}

export type AppUrlResolutionInput = Partial<
  Pick<
    ServerEnv,
    | 'NEXT_PUBLIC_APP_URL'
    | 'NEXT_PUBLIC_SITE_URL'
    | 'VERCEL_BRANCH_URL'
    | 'VERCEL_ENV'
    | 'VERCEL_PROJECT_PRODUCTION_URL'
    | 'VERCEL_URL'
  >
> & {
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  origin?: string | null;
};

/**
 * Resolve the canonical app origin from trusted request headers and deployment environment variables.
 */
export function resolveAppUrl(input: AppUrlResolutionInput) {
  const fromOrigin = normalizeUrlCandidate(input.origin ?? '');
  if (fromOrigin) {
    return fromOrigin;
  }

  if (input.forwardedHost) {
    const proto = input.forwardedProto?.split(',')[0]?.trim().toLowerCase();
    const forwardedCandidate =
      proto === 'http' || proto === 'https' ? `${proto}://${input.forwardedHost}` : input.forwardedHost;
    const fromForwardedHost = normalizeUrlCandidate(forwardedCandidate);
    if (fromForwardedHost) {
      return fromForwardedHost;
    }
  }

  const preferredUrl =
    input.NEXT_PUBLIC_SITE_URL ||
    (input.VERCEL_ENV === 'production' ? input.VERCEL_PROJECT_PRODUCTION_URL : undefined) ||
    (input.VERCEL_ENV === 'preview' ? input.VERCEL_BRANCH_URL || input.VERCEL_URL : undefined) ||
    input.VERCEL_URL ||
    input.VERCEL_PROJECT_PRODUCTION_URL ||
    input.NEXT_PUBLIC_APP_URL ||
    'http://127.0.0.1:3100';

  return trimTrailingSlash(normalizeUrlCandidate(preferredUrl) ?? 'http://127.0.0.1:3100');
}
