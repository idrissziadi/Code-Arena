// Importe la fonction `serve` de la bibliothèque standard de Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// En-têtes CORS pour autoriser les requêtes cross-origine
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Interfaces pour l'API Judge0 ---
interface Judge0SubmissionResponse {
  token: string;
}

interface Judge0Status {
  id: number;
  description: string;
}

interface Judge0GetSubmissionResponse {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string | null;
  memory: number | null;
  status: Judge0Status;
}

// Map des noms de langages aux ID spécifiques de Judge0
// Source: https://judge0.com/api/swagger-ui/#/languages/get_languages
const languageMap: { [key: string]: number } = {
  'javascript': 63,
  'python': 71,
  'java': 62,
  'c++': 54,
  'c': 50,
  'go': 60,
  'rust': 73,
  'typescript': 74,
};

// --- Point d'entrée principal de l'Edge Function ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extraire les données de la requête du frontend
    const { code, language, input } = await req.json();

    if (!code || !language) {
      throw new Error("Les champs 'code' et 'language' sont obligatoires.");
    }

    const languageId = languageMap[language.toLowerCase()];
    if (!languageId) {
      throw new Error(`Le langage '${language}' n'est pas supporté.`);
    }
    
    // 2. Récupérer les secrets de l'environnement Supabase
    const apiKey = Deno.env.get("JUDGE0_API_KEY");
    const apiHost = Deno.env.get("JUDGE0_API_HOST");

    if (!apiKey || !apiHost) {
      throw new Error("Les secrets JUDGE0_API_KEY ou JUDGE0_API_HOST ne sont pas configurés.");
    }

    const JUDGE0_URL = `https://${apiHost}/submissions?base64_encoded=false&wait=false`;

    // 3. ÉTAPE 1 de Judge0: Créer la soumission pour obtenir un token
    const createResponse = await fetch(JUDGE0_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost,
      },
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin: input || "",
      }),
    });

    if (!createResponse.ok) {
      const errorBody = await createResponse.json();
      throw new Error(`Erreur lors de la création de la soumission Judge0: ${errorBody.message || 'Erreur inconnue'}`);
    }

    const { token }: Judge0SubmissionResponse = await createResponse.json();

    // 4. ÉTAPE 2 de Judge0: Interroger (poll) le résultat en utilisant le token
    let finalResult: Judge0GetSubmissionResponse;
    const getUrl = `https://${apiHost}/submissions/${token}?base64_encoded=false`;

    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde entre les vérifications

      const getResultResponse = await fetch(getUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': apiHost,
        },
      });

      if (!getResultResponse.ok) {
        throw new Error("Erreur lors de la récupération du résultat de la soumission Judge0.");
      }

      finalResult = await getResultResponse.json();
      
      // Si le statut est 1 (In Queue) ou 2 (Processing), on continue d'attendre
      if (finalResult.status.id <= 2) {
        continue;
      }
      
      // Sinon, on a un résultat final, on sort de la boucle
      break;
    }

    // 5. Formater la réponse finale pour notre frontend
    const isAccepted = finalResult.status.id === 3; // 3 = Accepted
    let errorMessage = finalResult.compile_output || finalResult.stderr || finalResult.message || finalResult.status.description;

    return new Response(JSON.stringify({
      success: isAccepted,
      output: finalResult.stdout,
      error: isAccepted ? undefined : errorMessage,
      executionTime: finalResult.time ? parseFloat(finalResult.time) * 1000 : 0,
      memoryUsed: finalResult.memory || 0, // Mémoire en KB
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur dans la fonction execute-code:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erreur interne du serveur' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});