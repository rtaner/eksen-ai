import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user making the request
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !requestingUser) {
      throw new Error('Unauthorized');
    }

    // Get requesting user's profile to check permissions
    const { data: requestingProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, organization_id')
      .eq('id', requestingUser.id)
      .single();

    if (profileError || !requestingProfile) {
      throw new Error('Profile not found');
    }

    // Only owner and manager can update passwords
    if (!['owner', 'manager'].includes(requestingProfile.role)) {
      throw new Error('Insufficient permissions');
    }

    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      throw new Error('Missing required fields');
    }

    // Validate password length
    if (newPassword.length < 6) {
      throw new Error('Şifre en az 6 karakter olmalıdır');
    }

    // Get target user's profile to verify same organization
    const { data: targetProfile, error: targetProfileError } = await supabaseClient
      .from('profiles')
      .select('organization_id, role')
      .eq('id', userId)
      .single();

    if (targetProfileError || !targetProfile) {
      throw new Error('Target user not found');
    }

    // Verify same organization
    if (targetProfile.organization_id !== requestingProfile.organization_id) {
      throw new Error('Cannot update user from different organization');
    }

    // Manager cannot update owner's password
    if (requestingProfile.role === 'manager' && targetProfile.role === 'owner') {
      throw new Error('Manager cannot update owner password');
    }

    // Update password using admin API
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Şifre başarıyla güncellendi' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
