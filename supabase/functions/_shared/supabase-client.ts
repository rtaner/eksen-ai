// Supabase client helper for Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export function createSupabaseClient(authHeader: string | null) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

export async function validateUser(authHeader: string | null) {
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const supabase = createSupabaseClient(authHeader);
  const token = authHeader.replace('Bearer ', '');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return { user, supabase };
}

export async function checkOwnerPermission(
  supabase: any,
  userId: string
): Promise<{ isOwner: boolean; organizationId: string }> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('Profile not found');
  }

  return {
    isOwner: profile.role === 'owner',
    organizationId: profile.organization_id,
  };
}
