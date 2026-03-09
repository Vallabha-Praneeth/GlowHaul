import { z } from 'zod';

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('GlowHaul'),
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
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function hasSupabaseCredentials(env: Pick<ServerEnv, 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'>) {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'replace_me'
  );
}
