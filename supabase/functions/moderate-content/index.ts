import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  type: 'solution' | 'comment' | 'user';
  id: string;
  action: 'approve' | 'reject' | 'ban' | 'unban' | 'delete';
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Non autorisé');
    }

    // Check if user is admin or moderator
    const { data: userData } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'moderator'].includes(userData.role)) {
      throw new Error('Accès refusé - Privilèges de modération requis');
    }

    const { type, id, action, reason }: ModerationRequest = await req.json();

    let result;

    switch (type) {
      case 'solution':
        result = await moderateSolution(supabaseClient, id, action, user.id);
        break;
      case 'comment':
        result = await moderateComment(supabaseClient, id, action, user.id);
        break;
      case 'user':
        result = await moderateUser(supabaseClient, id, action, user.id, reason);
        break;
      default:
        throw new Error('Type de modération non supporté');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in moderate-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function moderateSolution(supabaseClient: any, solutionId: string, action: string, moderatorId: string) {
  switch (action) {
    case 'approve':
      const { error: approveError } = await supabaseClient
        .from('solutions')
        .update({ validated: true })
        .eq('id', solutionId);

      if (approveError) throw approveError;
      return { success: true, message: 'Solution approuvée' };

    case 'reject':
    case 'delete':
      const { error: deleteError } = await supabaseClient
        .from('solutions')
        .delete()
        .eq('id', solutionId);

      if (deleteError) throw deleteError;
      return { success: true, message: 'Solution supprimée' };

    default:
      throw new Error('Action non supportée pour les solutions');
  }
}

async function moderateComment(supabaseClient: any, commentId: string, action: string, moderatorId: string) {
  switch (action) {
    case 'approve':
      const { error: approveError } = await supabaseClient
        .from('comments')
        .update({ is_reported: false })
        .eq('id', commentId);

      if (approveError) throw approveError;
      return { success: true, message: 'Commentaire approuvé' };

    case 'delete':
      const { error: deleteError } = await supabaseClient
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (deleteError) throw deleteError;
      return { success: true, message: 'Commentaire supprimé' };

    default:
      throw new Error('Action non supportée pour les commentaires');
  }
}

async function moderateUser(supabaseClient: any, userId: string, action: string, moderatorId: string, reason?: string) {
  switch (action) {
    case 'ban':
      const { error: banError } = await supabaseClient
        .from('users')
        .update({ role: 'banned' })
        .eq('id', userId);

      if (banError) throw banError;
      
      // Log moderation action
      await logModerationAction(supabaseClient, moderatorId, 'user_banned', userId, reason);
      
      return { success: true, message: 'Utilisateur banni' };

    case 'unban':
      const { error: unbanError } = await supabaseClient
        .from('users')
        .update({ role: 'user' })
        .eq('id', userId);

      if (unbanError) throw unbanError;
      
      await logModerationAction(supabaseClient, moderatorId, 'user_unbanned', userId, reason);
      
      return { success: true, message: 'Utilisateur débanni' };

    default:
      throw new Error('Action non supportée pour les utilisateurs');
  }
}

async function logModerationAction(
  supabaseClient: any,
  moderatorId: string,
  action: string,
  targetId: string,
  reason?: string
) {
  // You would typically have a moderation_logs table for this
  console.log(`Moderation action: ${action} by ${moderatorId} on ${targetId}. Reason: ${reason}`);
}