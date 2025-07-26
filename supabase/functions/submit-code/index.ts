import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmissionRequest {
  problem_id: string;
  language_id: string;
  code: string;
}

interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin: string;
}

interface Judge0Result {
  token: string;
  status: {
    id: number;
    description: string;
  };
  stdout: string;
  stderr: string;
  time: string;
  memory: number;
}

// Language mapping from language name to Judge0 ID
const languageMap: Record<string, number> = {
  'javascript': 63,
  'python': 71,
  'java': 62,
  'cpp': 54,
  'c': 50,
  'csharp': 51,
  'go': 60,
  'rust': 73,
  'php': 68,
  'ruby': 72,
  'swift': 83,
  'kotlin': 78,
  'typescript': 74,
  'scala': 81,
  'perl': 85,
  'haskell': 61,
  'lua': 64,
  'r': 80,
  'dart': 90,
  'elixir': 57,
  'erlang': 58,
  'clojure': 86,
  'fsharp': 87,
  'vb': 84,
  'pascal': 67,
  'fortran': 59,
  'cobol': 77,
  'assembly': 45,
  'bash': 46,
  'sql': 82,
  'matlab': 70,
  'octave': 66,
  'prolog': 69,
  'lisp': 55,
  'scheme': 56,
  'tcl': 88,
  'crystal': 89,
  'nim': 92,
  'julia': 79,
  'groovy': 88,
  'racket': 91
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting submit-code function');
    
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

    const { problem_id, language_id, code }: SubmissionRequest = await req.json();
    console.log('Received submission:', { problem_id, language_id });

    // Get Judge0 secrets
    const JUDGE0_API_KEY = Deno.env.get('JUDGE0_API_KEY');
    const JUDGE0_API_HOST = Deno.env.get('JUDGE0_API_HOST');
    
    if (!JUDGE0_API_KEY || !JUDGE0_API_HOST) {
      throw new Error('Configuration Judge0 manquante');
    }

    // Get language name from language_id
    const { data: languageData, error: langError } = await supabaseClient
      .from('languages')
      .select('name')
      .eq('id', language_id)
      .single();

    if (langError) {
      throw new Error('Langage invalide');
    }

    const languageName = languageData.name.toLowerCase();
    const judge0LanguageId = languageMap[languageName];
    
    if (!judge0LanguageId) {
      throw new Error(`Langage non supporté: ${languageName}`);
    }

    // Get all test cases for the problem (both public and hidden)
    const { data: testCases, error: testCasesError } = await supabaseClient
      .from('test_cases')
      .select('id, input, expected_output, is_public')
      .eq('problem_id', problem_id);

    if (testCasesError) {
      throw new Error('Erreur lors de la récupération des cas de test');
    }

    if (!testCases || testCases.length === 0) {
      throw new Error('Aucun cas de test trouvé pour ce problème');
    }

    // Insert submission immediately with 'Processing' status
    const { data: submission, error: submissionError } = await supabaseClient
      .from('submissions')
      .insert({
        user_id: user.id,
        problem_id,
        language_id,
        code,
        verdict: 'Processing',
        execution_time: null,
        memory_used: null,
      })
      .select()
      .single();

    if (submissionError) {
      throw new Error('Erreur lors de la création de la soumission');
    }

    console.log('Created submission:', submission.id);

    // Prepare batch submissions for Judge0
    const judge0Submissions: Judge0Submission[] = testCases.map(testCase => ({
      source_code: code,
      language_id: judge0LanguageId,
      stdin: testCase.input
    }));

    // Send batch to Judge0
    const batchResponse = await fetch(`${JUDGE0_API_HOST}/submissions/batch?base64_encoded=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': JUDGE0_API_HOST.replace('https://', '').replace('http://', '')
      },
      body: JSON.stringify({ submissions: judge0Submissions })
    });

    if (!batchResponse.ok) {
      throw new Error(`Erreur Judge0: ${batchResponse.statusText}`);
    }

    const batchData = await batchResponse.json();
    const tokens = batchData.map((item: any) => item.token);
    
    console.log('Got tokens:', tokens);

    // Poll for results
    let results: Judge0Result[] = [];
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (attempts < maxAttempts) {
      const tokensString = tokens.join(',');
      const resultResponse = await fetch(`${JUDGE0_API_HOST}/submissions/batch?tokens=${tokensString}&base64_encoded=false`, {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': JUDGE0_API_HOST.replace('https://', '').replace('http://', '')
        }
      });

      if (!resultResponse.ok) {
        throw new Error(`Erreur lors de la récupération des résultats: ${resultResponse.statusText}`);
      }

      results = await resultResponse.json();
      
      // Check if all submissions are done processing
      const stillProcessing = results.some(result => 
        result.status.id === 1 || result.status.id === 2 // In Queue or Processing
      );

      if (!stillProcessing) {
        break;
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }

    console.log('Got results:', results);

    // Determine final verdict
    let finalVerdict = 'Accepted';
    let totalTime = 0;
    let totalMemory = 0;
    let failedTestIndex = -1;
    let failedTestResult: Judge0Result | null = null;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const testCase = testCases[i];
      
      // Status codes: 3 = Accepted, 4 = Wrong Answer, 5 = Time Limit Exceeded, 6 = Compilation Error, etc.
      if (result.status.id !== 3) {
        finalVerdict = result.status.description;
        failedTestIndex = i;
        failedTestResult = result;
        break;
      }

      // Check if output matches expected
      const actualOutput = result.stdout?.trim() || '';
      const expectedOutput = testCase.expected_output?.trim() || '';
      
      if (actualOutput !== expectedOutput) {
        finalVerdict = 'Wrong Answer';
        failedTestIndex = i;
        failedTestResult = result;
        break;
      }

      // Accumulate performance metrics
      totalTime += parseFloat(result.time || '0');
      totalMemory += result.memory || 0;
    }

    const avgTime = results.length > 0 ? totalTime / results.length : 0;
    const avgMemory = results.length > 0 ? totalMemory / results.length : 0;

    // Update submission in database
    const { error: updateError } = await supabaseClient
      .from('submissions')
      .update({
        verdict: finalVerdict,
        execution_time: avgTime,
        memory_used: avgMemory,
      })
      .eq('id', submission.id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
    }

    // Prepare detailed response
    const response: any = {
      submissionId: submission.id,
      verdict: finalVerdict,
      executionTime: avgTime,
      memoryUsed: avgMemory,
      success: finalVerdict === 'Accepted'
    };

    // If failed, include details of the failed test case
    if (finalVerdict !== 'Accepted' && failedTestIndex >= 0 && failedTestResult) {
      const failedTest = testCases[failedTestIndex];
      response.failedTest = {
        input: failedTest.input,
        expectedOutput: failedTest.expected_output,
        actualOutput: failedTestResult.stdout || '',
        stderr: failedTestResult.stderr || '',
        isPublic: failedTest.is_public
      };
    }

    console.log('Final response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in submit-code function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});