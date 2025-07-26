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

    // Check if user is admin
    const { data: userData } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      throw new Error('Accès refusé - Admin requis');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'stats':
        return await getDashboardStats(supabaseClient);
      case 'users':
        return await getUsers(supabaseClient);
      case 'problems':
        return await getProblems(supabaseClient);
      case 'submissions':
        return await getSubmissions(supabaseClient);
      case 'solutions':
        return await getPendingSolutions(supabaseClient);
      case 'reported-comments':
        return await getReportedComments(supabaseClient);
      default:
        throw new Error('Action non spécifiée');
    }

  } catch (error) {
    console.error('Error in admin-dashboard function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function getDashboardStats(supabaseClient: any) {
  const [
    usersCount,
    problemsCount,
    submissionsCount,
    pendingSolutionsCount,
    reportedCommentsCount,
  ] = await Promise.all([
    supabaseClient.from('users').select('id', { count: 'exact' }),
    supabaseClient.from('problems').select('id', { count: 'exact' }),
    supabaseClient.from('submissions').select('id', { count: 'exact' }),
    supabaseClient.from('solutions').select('id', { count: 'exact' }).eq('validated', false),
    supabaseClient.from('comments').select('id', { count: 'exact' }).eq('is_reported', true),
  ]);

  // Get submissions by verdict for chart data
  const { data: submissionsByVerdict } = await supabaseClient
    .from('submissions')
    .select('verdict');

  const verdictCounts = (submissionsByVerdict || []).reduce((acc: any, sub: any) => {
    acc[sub.verdict] = (acc[sub.verdict] || 0) + 1;
    return acc;
  }, {});

  // Get recent activity
  const { data: recentSubmissions } = await supabaseClient
    .from('submissions')
    .select(`
      id,
      verdict,
      created_at,
      users(username),
      problems(title)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  return new Response(JSON.stringify({
    stats: {
      totalUsers: usersCount.count || 0,
      totalProblems: problemsCount.count || 0,
      totalSubmissions: submissionsCount.count || 0,
      pendingSolutions: pendingSolutionsCount.count || 0,
      reportedComments: reportedCommentsCount.count || 0,
    },
    verdictCounts,
    recentActivity: recentSubmissions || [],
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getUsers(supabaseClient: any) {
  const { data: users, error } = await supabaseClient
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify(users), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getProblems(supabaseClient: any) {
  const { data: problems, error } = await supabaseClient
    .from('problems')
    .select(`
      *,
      data_structures(name),
      users(username)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify(problems), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getSubmissions(supabaseClient: any) {
  const { data: submissions, error } = await supabaseClient
    .from('submissions')
    .select(`
      *,
      users(username),
      problems(title),
      languages(name)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return new Response(JSON.stringify(submissions), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getPendingSolutions(supabaseClient: any) {
  const { data: solutions, error } = await supabaseClient
    .from('solutions')
    .select(`
      *,
      users(username),
      problems(title)
    `)
    .eq('validated', false)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify(solutions), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getReportedComments(supabaseClient: any) {
  const { data: comments, error } = await supabaseClient
    .from('comments')
    .select(`
      *,
      users(username),
      problems(title)
    `)
    .eq('is_reported', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify(comments), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}