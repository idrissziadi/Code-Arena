import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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

    // Vérifier si l'utilisateur existe dans notre table users
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      throw new Error('Profil utilisateur non trouvé');
    }

    const userId = user.id;

    // Get user statistics
    const [submissionsResult, solvedProblemsResult, badgesResult] = await Promise.all([
      // Total submissions and acceptance rate
      supabaseClient
        .from('submissions')
        .select('verdict')
        .eq('user_id', userId),
      
      // Unique solved problems
      supabaseClient
        .from('submissions')
        .select('problem_id')
        .eq('user_id', userId)
        .eq('verdict', 'Accepted'),
      
      // User badges
      supabaseClient
        .from('user_badges')
        .select('badge_id, earned_at, badges(name, icon, description)')
        .eq('user_id', userId)
    ]);

    const submissions = submissionsResult.data || [];
    const acceptedSubmissions = submissions.filter(s => s.verdict === 'Accepted');
    const uniqueSolvedProblems = new Set(solvedProblemsResult.data?.map(s => s.problem_id) || []).size;

    // Calculate real user rank
    let userRank = 1;
    try {
      const { data: rankData, error: rankError } = await supabaseClient
        .rpc('calculate_user_rank', { user_id: userId });
      
      if (!rankError && rankData) {
        userRank = rankData;
      }
    } catch (error) {
      console.error('Error calculating user rank:', error);
      // Fallback: calculate rank manually if RPC fails
      const { data: allUsers } = await supabaseClient
        .from('users')
        .select('id, created_at');
      
      const { data: allSolvedProblems } = await supabaseClient
        .from('submissions')
        .select('user_id, problem_id')
        .eq('verdict', 'Accepted');
      
      if (allUsers && allSolvedProblems) {
        const userStats = new Map();
        
        // Count solved problems for each user
        allSolvedProblems.forEach(sub => {
          const current = userStats.get(sub.user_id) || new Set();
          current.add(sub.problem_id);
          userStats.set(sub.user_id, current);
        });
        
        // Create ranking array
        const ranking = allUsers.map(user => ({
          id: user.id,
          solvedCount: userStats.get(user.id)?.size || 0,
          createdAt: user.created_at
        })).sort((a, b) => {
          if (b.solvedCount !== a.solvedCount) {
            return b.solvedCount - a.solvedCount;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        // Find user's position
        const userPosition = ranking.findIndex(user => user.id === userId);
        userRank = userPosition >= 0 ? userPosition + 1 : 1;
      }
    }

    // Get recent activity
    const recentSubmissions = await supabaseClient
      .from('submissions')
      .select(`
        id,
        verdict,
        created_at,
        execution_time,
        memory_used,
        problems(title, difficulty),
        languages(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const stats = {
      totalSubmissions: submissions.length,
      acceptedSubmissions: acceptedSubmissions.length,
      successRate: submissions.length > 0 ? Math.round((acceptedSubmissions.length / submissions.length) * 100) : 0,
      solvedProblems: uniqueSolvedProblems,
      badges: badgesResult.data || [],
      rank: userRank,
      recentSubmissions: recentSubmissions.data || [],
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in user-stats function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});