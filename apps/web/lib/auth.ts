import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../../../packages/supabase/types/database';
import { isSupabaseConfigured } from './env';
import { createServerSupabaseClient } from './supabase/server';

export type AppRole = Database['public']['Enums']['app_role'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

export type AuthenticatedProfile = Pick<
  ProfileRow,
  'email' | 'full_name' | 'id' | 'organization_id' | 'role'
> & {
  organization: Pick<OrganizationRow, 'id' | 'name' | 'primary_region'> | null;
};

export const roleHomePath: Record<AppRole, string> = {
  operator: '/operator',
  planner: '/planner/search',
  driver: '/driver',
};

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function normalizeNextPath(nextPath?: string | null) {
  if (!nextPath || !nextPath.startsWith('/')) {
    return '/operator';
  }

  return nextPath;
}

function getRoleRoutePrefix(role: AppRole) {
  return roleHomePath[role].split('/').slice(0, 2).join('/');
}

export function getDefaultHomePath(role?: AppRole | null) {
  if (!role) {
    return '/login';
  }

  return roleHomePath[role];
}

export function isLocalDemoAuthEnabled() {
  return process.env.NODE_ENV !== 'production';
}

export async function getCurrentAuth() {
  if (!isSupabaseConfigured()) {
    return { profile: null, supabase: null, user: null as User | null };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, supabase, user: null };
  }

  const profileQuery = supabase
    .from('profiles')
    .select('id, email, full_name, organization_id, role')
    .eq('id', user.id);
  const { data: profileResult } = await profileQuery.maybeSingle();
  const profileData = profileResult as Pick<
    ProfileRow,
    'email' | 'full_name' | 'id' | 'organization_id' | 'role'
  > | null;

  if (!profileData) {
    return { profile: null, supabase, user };
  }

  let organization: AuthenticatedProfile['organization'] = null;

  if (profileData.organization_id) {
    const organizationQuery = supabase
      .from('organizations')
      .select('id, name, primary_region')
      .eq('id', profileData.organization_id);
    const { data: organizationResult } = await organizationQuery.maybeSingle();
    const organizationData = organizationResult as Pick<
      OrganizationRow,
      'id' | 'name' | 'primary_region'
    > | null;

    if (organizationData) {
      organization = organizationData;
    }
  }

  const profile: AuthenticatedProfile = {
    ...profileData,
    organization,
  };

  return {
    profile,
    supabase,
    user,
  };
}

export async function requireAuthenticatedProfile(expectedRole?: AppRole) {
  const auth = await getCurrentAuth();

  if (!auth.user) {
    redirect(`/login?next=${encodeMessage(normalizeNextPath(expectedRole ? roleHomePath[expectedRole] : undefined))}`);
  }

  if (!auth.profile) {
    redirect('/auth/error?message=' + encodeMessage('Your user profile is missing. Contact support.'));
  }

  if (expectedRole && auth.profile.role !== expectedRole) {
    redirect(roleHomePath[auth.profile.role]);
  }

  return auth.profile;
}

export function matchesRolePath(role: AppRole, pathname: string) {
  return pathname.startsWith(getRoleRoutePrefix(role));
}
