import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmissionRequest {
  problemId: string;
  code: string;
  languageId: string;
}

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

    const { problemId, code, languageId }: SubmissionRequest = await req.json();

    // Get test cases for the problem
    const { data: testCases, error: testCasesError } = await supabaseClient
      .from('test_cases')
      .select('input, expected_output')
      .eq('problem_id', problemId);

    if (testCasesError) {
      throw new Error('Erreur lors de la récupération des cas de test');
    }

    // Execute code against test cases
    let verdict = 'Accepted';
    let executionTime = 0;
    let memoryUsed = 0;

    // Get language name from languageId
    const { data: languageData, error: langError } = await supabaseClient
      .from('languages')
      .select('name')
      .eq('id', languageId)
      .single();

    if (langError) {
      throw new Error('Langage invalide');
    }

    for (const testCase of testCases || []) {
      try {
        const executeResponse = await supabaseClient.functions.invoke('execute-code', {
          body: {
            code,
            language: languageData.name.toLowerCase(),
            input: testCase.input,
          },
        });

        if (executeResponse.error) {
          verdict = 'Runtime Error';
          break;
        }

        const result = executeResponse.data;
        
        if (!result.success) {
          verdict = result.error?.includes('Time') ? 'Time Limit Exceeded' : 'Runtime Error';
          break;
        }

        if (result.output?.trim() !== testCase.expected_output?.trim()) {
          verdict = 'Wrong Answer';
          break;
        }

        executionTime = Math.max(executionTime, result.executionTime || 0);
        memoryUsed = Math.max(memoryUsed, result.memoryUsed || 0);

        // Check time limit (2 seconds)
        if (result.executionTime > 2000) {
          verdict = 'Time Limit Exceeded';
          break;
        }

        // Check memory limit (256MB)
        if (result.memoryUsed > 256000) {
          verdict = 'Memory Limit Exceeded';
          break;
        }

      } catch (error) {
        verdict = 'Runtime Error';
        break;
      }
    }

    // Save submission
    const { data: submission, error: submissionError } = await supabaseClient
      .from('submissions')
      .insert({
        user_id: user.id,
        problem_id: problemId,
        language_id: languageId,
        code,
        verdict,
        execution_time: executionTime,
        memory_used: memoryUsed,
      })
      .select()
      .single();

    if (submissionError) {
      throw new Error('Erreur lors de la sauvegarde de la soumission');
    }

    // Update user badges if accepted
    if (verdict === 'Accepted') {
      await updateUserBadges(supabaseClient, user.id);
    }

    return new Response(JSON.stringify({
      submissionId: submission.id,
      verdict,
      executionTime,
      memoryUsed,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in submit-solution function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function updateUserBadges(supabaseClient: any, userId: string) {
  try {
    // Get user's solved problems count
    const { data: solvedProblems } = await supabaseClient
      .from('submissions')
      .select('problem_id')
      .eq('user_id', userId)
      .eq('verdict', 'Accepted');

    const uniqueSolved = new Set(solvedProblems?.map(s => s.problem_id) || []).size;

    // Check for badges to award
    const badgesToCheck = [
      { threshold: 1, name: 'First Blood' },
      { threshold: 10, name: 'Problem Solver' },
      { threshold: 50, name: 'Code Master' },
      { threshold: 100, name: 'Algorithm Expert' },
    ];

    for (const badge of badgesToCheck) {
      if (uniqueSolved >= badge.threshold) {
        // Check if user already has this badge
        const { data: existingBadge } = await supabaseClient
          .from('user_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('badges.name', badge.name)
          .limit(1);

        if (!existingBadge || existingBadge.length === 0) {
          // Get badge ID
          const { data: badgeData } = await supabaseClient
            .from('badges')
            .select('id')
            .eq('name', badge.name)
            .single();

          if (badgeData) {
            await supabaseClient
              .from('user_badges')
              .insert({
                user_id: userId,
                badge_id: badgeData.id,
              });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating badges:', error);
  }
}