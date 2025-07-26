import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNotifications } from '@/hooks/useNotifications';
import { useSolutions } from '@/hooks/useSolutions';
import { supabase } from '@/integrations/supabase/client';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SolutionDialog } from '@/components/ui/dialog-solution';
import { 
  Heart, 
  HeartOff, 
  Clock, 
  HardDrive, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  MessageSquare,
  History,
  Code,
  Eye,
  Copy,
  Play,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Problem {
  id: string;
  title: string;
  statement: string;
  difficulty: string;
  tags: string[];
  created_by: string;
  created_at: string;
}

interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  is_public: boolean;
}

interface Language {
  id: string;
  name: string;
}

interface Submission {
  id: string;
  verdict: string;
  execution_time: number;
  memory_used: number;
  created_at: string;
  code: string;
  language_id: string;
}

interface SubmissionResult {
  submissionId: string;
  verdict: string;
  executionTime: number;
  memoryUsed: number;
  success: boolean;
  failedTest?: {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    stderr: string;
    isPublic: boolean;
  };
}

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { notifySubmissionResult } = useNotifications();
  const { peutProposerSolution } = useSolutions();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionSolutionStatus, setSubmissionSolutionStatus] = useState<{ [key: string]: boolean }>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState<any>(null);
  const [isTestingCustom, setIsTestingCustom] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProblemData();
      fetchLanguages();
      if (user) {
        checkIfFavorite();
        fetchSubmissions();
        checkSubmissionSolutionStatus();
      }
    }
  }, [id, user]);

  const fetchProblemData = async () => {
    try {
      const { data: problemData, error: problemError } = await supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .single();

      if (problemError) throw problemError;
      setProblem(problemData);

      const { data: testCasesData, error: testCasesError } = await supabase
        .from('test_cases')
        .select('*')
        .eq('problem_id', id)
        .eq('is_public', true);

      if (testCasesError) throw testCasesError;
      setTestCases(testCasesData || []);
    } catch (error) {
      console.error('Error fetching problem:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le problème",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*');

      if (error) throw error;
      setLanguages(data || []);
      if (data && data.length > 0) {
        setSelectedLanguage(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user?.id)
        .eq('problem_id', id)
        .maybeSingle();

      if (!error && data) {
        setIsFavorite(true);
      }
    } catch (error) {
      // Not a favorite or error
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, languages(name)')
        .eq('user_id', user?.id)
        .eq('problem_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
      checkSubmissionSolutionStatus();
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const checkSubmissionSolutionStatus = async () => {
    console.log('🔍 Checking submission solution status...', { user, submissionsLength: submissions.length });
    if (!user || !submissions.length) return;

    const statusMap: { [key: string]: boolean } = {};
    
    for (const submission of submissions) {
      console.log(`📝 Checking submission ${submission.id} with verdict: ${submission.verdict}`);
      if (submission.verdict === 'Accepted') {
        const canPropose = await peutProposerSolution(submission.id, user.id);
        console.log(`✅ Can propose solution for ${submission.id}:`, canPropose);
        statusMap[submission.id] = canPropose;
      } else {
        statusMap[submission.id] = false;
      }
    }
    
    console.log('📊 Final status map:', statusMap);
    setSubmissionSolutionStatus(statusMap);
  };

  const toggleFavorite = async () => {
    if (!user) return;

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('problem_id', id);

        if (error) throw error;
        setIsFavorite(false);
        toast({
          title: "Supprimé des favoris",
          description: "Le problème a été retiré de vos favoris"
        });
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            problem_id: id
          });

        if (error) throw error;
        setIsFavorite(true);
        toast({
          title: "Ajouté aux favoris",
          description: "Le problème a été ajouté à vos favoris"
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les favoris",
        variant: "destructive"
      });
    }
  };

  const runCode = async () => {
    if (!code.trim() || !selectedLanguage) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez saisir du code et sélectionner un langage", 
        variant: "destructive" 
      });
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    const languageName = languages.find(l => l.id === selectedLanguage)?.name?.toLowerCase();

    if (!languageName) {
      toast({ 
        title: "Erreur", 
        description: "Langage sélectionné invalide", 
        variant: "destructive" 
      });
      setIsRunning(false);
      return;
    }

    try {
      const results = [];
      for (const testCase of testCases) {
        const { data, error } = await supabase.functions.invoke('execute-code', {
          body: {
            code,
            language: languageName,
            input: testCase.input,
          },
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Erreur lors de l\'exécution du code');
        }

        const passed = data.success && data.output?.trim() === testCase.expected_output.trim();
        results.push({
          input: testCase.input,
          expected: testCase.expected_output,
          actual: data.output || '',
          error: data.error,
          passed,
          executionTime: data.executionTime || 0,
          memoryUsed: data.memoryUsed || 0,
        });
      }

      setTestResults(results);
      toast({
        title: "Exécution terminée",
        description: `${results.filter(r => r.passed).length}/${results.length} tests publics réussis`,
      });
    } catch (error: any) {
      console.error('Error running code:', error);
      toast({ 
        title: "Erreur d'exécution", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (!user || !problem || !selectedLanguage || !code.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez vous connecter et saisir du code",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('submit-code', {
        body: {
          problem_id: problem.id,
          language_id: selectedLanguage,
          code: code
        }
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors de la soumission');
      }

      setSubmissionResult(data);
      
      // Notify user of submission result
      if (problem) {
        notifySubmissionResult(data.verdict, problem.title);
      }
      
      toast({
        title: "Solution soumise",
        description: `Verdict: ${data.verdict}`,
        variant: data.success ? "default" : "destructive"
      });
      
      // Refresh submissions
      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la soumission",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const runCustomTest = async () => {
    if (!code.trim() || !selectedLanguage) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez saisir du code et sélectionner un langage", 
        variant: "destructive" 
      });
      return;
    }

    setIsTestingCustom(true);
    setCustomOutput(null);
    const languageName = languages.find(l => l.id === selectedLanguage)?.name?.toLowerCase();

    if (!languageName) {
      toast({ 
        title: "Erreur", 
        description: "Langage sélectionné invalide", 
        variant: "destructive" 
      });
      setIsTestingCustom(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('execute-code', {
        body: {
          code,
          language: languageName,
          input: customInput,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erreur lors de l\'exécution du code');
      }

      setCustomOutput(data);
      
      toast({
        title: "Test personnalisé terminé",
        description: data.success ? "Exécution réussie" : "Erreur d'exécution",
        variant: data.success ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('Error running custom test:', error);
      setCustomOutput({
        success: false,
        error: error.message,
        output: '',
        stderr: error.message
      });
      toast({ 
        title: "Erreur d'exécution", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsTestingCustom(false);
    }
  };

  const getVerdictExplanation = (verdict: string) => {
    const explanations: { [key: string]: { title: string; description: string; color: string; icon: string } } = {
      'Accepted': {
        title: '✅ Accepté',
        description: 'Votre solution est correcte ! Elle passe tous les tests et respecte les contraintes de temps et mémoire.',
        color: 'text-green-600',
        icon: '🎉'
      },
      'Wrong Answer': {
        title: '❌ Mauvaise Réponse',
        description: 'Votre code s\'exécute sans erreur mais produit une sortie incorrecte pour au moins un cas de test.',
        color: 'text-red-600',
        icon: '🔍'
      },
      'Time Limit Exceeded': {
        title: '⏰ Limite de Temps Dépassée',
        description: 'Votre code prend trop de temps à s\'exécuter. Optimisez votre algorithme pour une meilleure complexité temporelle.',
        color: 'text-yellow-600',
        icon: '⚡'
      },
      'Memory Limit Exceeded': {
        title: '💾 Limite de Mémoire Dépassée',
        description: 'Votre code utilise trop de mémoire. Réduisez l\'utilisation de structures de données ou optimisez votre approche.',
        color: 'text-orange-600',
        icon: '📊'
      },
      'Runtime Error': {
        title: '💥 Erreur d\'Exécution',
        description: 'Votre code a planté pendant l\'exécution. Vérifiez les accès aux tableaux, divisions par zéro, ou autres erreurs.',
        color: 'text-red-600',
        icon: '🐛'
      },
      'Compilation Error': {
        title: '🔧 Erreur de Compilation',
        description: 'Votre code contient des erreurs de syntaxe qui empêchent la compilation. Vérifiez la syntaxe.',
        color: 'text-red-600',
        icon: '⚠️'
      },
      'Processing': {
        title: '⏳ En Cours de Traitement',
        description: 'Votre soumission est en cours d\'évaluation. Veuillez patienter...',
        color: 'text-blue-600',
        icon: '🔄'
      }
    };

    return explanations[verdict] || {
      title: `❓ ${verdict}`,
      description: 'Statut de soumission non reconnu.',
      color: 'text-gray-600',
      icon: '❓'
    };
  };

  const viewSubmissionCode = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionDialog(true);
  };

  const loadSubmissionCode = (submission: Submission) => {
    setCode(submission.code);
    setSelectedLanguage(submission.language_id);
    toast({
      title: "Code chargé",
      description: "Le code de la soumission a été chargé dans l'éditeur"
    });
  };

  const copySubmissionCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copié",
        description: "Le code a été copié dans le presse-papiers"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le code",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Facile': return 'bg-green-500';
      case 'Moyen': return 'bg-yellow-500';
      case 'Difficile': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    return verdict === 'Accepted' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  if (loading) {
    return <div className="container mx-auto p-6">Chargement...</div>;
  }

  if (!problem) {
    return <div className="container mx-auto p-6">Problème non trouvé</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/problems')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux problèmes
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/solutions?problem_id=${problem?.id}`)}
            disabled={!problem?.id}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Voir les solutions
          </Button>
        {user && (
          <Button variant="outline" onClick={toggleFavorite}>
            {isFavorite ? (
              <HeartOff className="h-4 w-4 mr-2" />
            ) : (
              <Heart className="h-4 w-4 mr-2" />
            )}
            {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </Button>
        )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{problem.title}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className={`text-white ${getDifficultyColor(problem.difficulty || '')}`}
              >
                {problem.difficulty}
              </Badge>
            </div>
          </div>
          <CardDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              {problem.tags?.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: problem.statement.replace(/\n/g, '<br>') }} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Exemples de test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testCases.map((testCase, index) => (
              <div key={testCase.id} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Exemple {index + 1}</h4>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Entrée:</span>
                    <pre className="bg-muted p-2 rounded mt-1 text-sm">{testCase.input}</pre>
                  </div>
                  <div>
                    <span className="font-medium">Sortie attendue:</span>
                    <pre className="bg-muted p-2 rounded mt-1 text-sm">{testCase.expected_output}</pre>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {user && (
          <CodeEditor
            value={code}
            onChange={setCode}
            language={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            languages={languages}
            onRun={runCode}
            onSubmit={submitCode}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Custom Input Testing */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Test Personnalisé
            </CardTitle>
            <CardDescription>
              Testez votre code avec vos propres entrées pour déboguer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Section */}
              <div className="space-y-2">
                <Label htmlFor="custom-input">Entrée (stdin)</Label>
                <Textarea
                  id="custom-input"
                  placeholder="Saisissez vos données d'entrée ici..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                />
                <Button 
                  onClick={runCustomTest}
                  disabled={isTestingCustom || !code.trim()}
                  className="w-full"
                >
                  {isTestingCustom ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exécution...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Exécuter avec cette entrée
                    </>
                  )}
                </Button>
              </div>

              {/* Output Section */}
              <div className="space-y-4">
                {customOutput && (
                  <>
                    {/* Execution Status */}
                    <div className={`p-3 rounded-lg border ${
                      customOutput.success 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {customOutput.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          customOutput.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                        }`}>
                          {customOutput.success ? 'Exécution réussie' : 'Erreur d\'exécution'}
                        </span>
                      </div>
                      {customOutput.executionTime !== undefined && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {customOutput.executionTime.toFixed(2)}ms
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {(customOutput.memoryUsed / 1024).toFixed(2)}KB
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Standard Output */}
                    <div>
                      <Label className="text-sm font-medium">Sortie (stdout)</Label>
                      <div className="mt-1 p-3 bg-muted rounded-lg border min-h-[60px]">
                        {customOutput.output ? (
                          <pre className="text-sm font-mono whitespace-pre-wrap text-foreground">
                            {customOutput.output}
                          </pre>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">
                            Aucune sortie
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Error Output */}
                    {(customOutput.error || customOutput.stderr) && (
                      <div>
                        <Label className="text-sm font-medium text-red-600">Erreurs (stderr)</Label>
                        <div className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <pre className="text-sm font-mono whitespace-pre-wrap text-red-700 dark:text-red-300">
                            {customOutput.error || customOutput.stderr}
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!customOutput && (
                  <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Les résultats d'exécution apparaîtront ici
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats des tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded border ${
                    result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Test {index + 1}</span>
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {result.executionTime}ms
                      </span>
                      <span className="flex items-center text-sm">
                        <HardDrive className="h-3 w-3 mr-1" />
                        {result.memoryUsed}KB
                      </span>
                      {result.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Result */}
      {submissionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="space-y-3">
              <div className="flex items-center space-x-2">
                {getVerdictIcon(submissionResult.verdict)}
                <span className={submissionResult.success ? 'text-green-600' : 'text-red-600'}>
                  Résultat: {submissionResult.verdict}
                </span>
              </div>
              
              {/* Verdict Explanation */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getVerdictExplanation(submissionResult.verdict).icon}</span>
                  <div>
                    <h4 className={`font-semibold ${getVerdictExplanation(submissionResult.verdict).color}`}>
                      {getVerdictExplanation(submissionResult.verdict).title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getVerdictExplanation(submissionResult.verdict).description}
                    </p>
                  </div>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissionResult.success ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    🎉 Félicitations ! Votre solution est correcte !
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Temps d'exécution:</span>
                      <p className="text-muted-foreground">{submissionResult.executionTime.toFixed(3)}s</p>
                    </div>
                    <div>
                      <span className="font-medium">Mémoire utilisée:</span>
                      <p className="text-muted-foreground">{(submissionResult.memoryUsed / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3">
                    ❌ Votre solution a échoué
                  </h4>
                  
                  {/* Debug Tips */}
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Conseils de débogage :</h5>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Utilisez la section "Test Personnalisé" ci-dessus pour tester avec vos propres entrées</li>
                      <li>• Vérifiez que votre sortie correspond exactement au format attendu</li>
                      <li>• Attention aux espaces en fin de ligne et aux retours à la ligne</li>
                      <li>• Testez les cas limites (valeurs minimales/maximales)</li>
                    </ul>
                  </div>

                  {submissionResult.failedTest && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-red-700 dark:text-red-300">
                        📍 Détails du test qui a échoué :
                      </div>
                      <div>
                        <span className="font-medium text-sm">Entrée qui a causé l'échec:</span>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                          {submissionResult.failedTest.input || '(vide)'}
                        </pre>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Votre sortie:</span>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                          {submissionResult.failedTest.actualOutput || '(aucune sortie - vérifiez vos print/cout)'}
                        </pre>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Sortie attendue:</span>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                          {submissionResult.failedTest.expectedOutput || '(sortie vide attendue)'}
                        </pre>
                      </div>
                      {submissionResult.failedTest.stderr && (
                        <div>
                          <span className="font-medium text-sm text-red-600">Erreur (stderr):</span>
                          <pre className="mt-1 p-2 bg-red-100 dark:bg-red-900/30 rounded text-sm font-mono text-red-700 dark:text-red-300">
                            {submissionResult.failedTest.stderr}
                          </pre>
                        </div>
                      )}
                      
                      {/* Comparison Helper */}
                      {submissionResult.failedTest.actualOutput && submissionResult.failedTest.expectedOutput && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                          <h6 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">🔍 Analyse de la différence :</h6>
                          <div className="text-sm text-yellow-700 dark:text-yellow-300">
                            {(() => {
                              const actual = submissionResult.failedTest.actualOutput.trim();
                              const expected = submissionResult.failedTest.expectedOutput.trim();
                              
                              if (actual.length !== expected.length) {
                                return `Longueur différente : votre sortie (${actual.length} caractères) vs attendue (${expected.length} caractères)`;
                              }
                              
                              for (let i = 0; i < Math.min(actual.length, expected.length); i++) {
                                if (actual[i] !== expected[i]) {
                                  return `Première différence au caractère ${i + 1} : '${actual[i]}' vs '${expected[i]}'`;
                                }
                              }
                              
                              return "Les sorties semblent identiques visuellement, vérifiez les caractères invisibles";
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submissions History */}
      {user && submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Mes soumissions ({submissions.length})
            </CardTitle>
            <CardDescription>
              Historique de vos tentatives pour ce problème
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submissions.slice(0, 5).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    {getVerdictIcon(submission.verdict)}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{submission.verdict}</span>
                        <Badge variant="outline" className="text-xs">
                          {languages.find(l => l.id === submission.language_id)?.name || 'Unknown'}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(submission.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {submission.execution_time}ms
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {submission.memory_used}KB
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewSubmissionCode(submission)}
                        className="h-8"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadSubmissionCode(submission)}
                        className="h-8"
                        title="Charger ce code dans l'éditeur"
                      >
                        <Code className="h-3 w-3" />
                      </Button>
                      {(() => {
                        console.log(`🎯 Rendering submission ${submission.id}:`, {
                          verdict: submission.verdict,
                          canPropose: submissionSolutionStatus[submission.id],
                          statusMap: submissionSolutionStatus
                        });
                        return submissionSolutionStatus[submission.id] && (
                          <SolutionDialog 
                            submissionId={submission.id} 
                            problemId={problem?.id || ''} 
                            isVisible={true}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                              title="Proposer cette soumission comme solution"
                            >
                              <Lightbulb className="h-3 w-3 mr-1" />
                              Solution
                            </Button>
                          </SolutionDialog>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
              {submissions.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    Voir toutes les soumissions ({submissions.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog pour voir le code d'une soumission */}
      <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Code de la soumission
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    {getVerdictIcon(selectedSubmission.verdict)}
                    <span className="font-medium">{selectedSubmission.verdict}</span>
                  </div>
                  <Badge variant="outline">
                    {languages.find(l => l.id === selectedSubmission.language_id)?.name || 'Unknown'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedSubmission.created_at).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedSubmission.execution_time}ms
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {selectedSubmission.memory_used}KB
                    </span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Code source</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copySubmissionCode(selectedSubmission.code)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      loadSubmissionCode(selectedSubmission);
                      setShowSubmissionDialog(false);
                    }}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Charger dans l'éditeur
                  </Button>
                  {selectedSubmission && submissionSolutionStatus[selectedSubmission.id] && (
                    <SolutionDialog 
                      submissionId={selectedSubmission.id} 
                      problemId={problem?.id || ''} 
                      isVisible={true}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                      >
                        <Lightbulb className="h-3 w-3 mr-1" />
                        Proposer comme solution
                      </Button>
                     </SolutionDialog>
                   )}
                 </div>
               </div>
              
              <ScrollArea className="h-[400px] w-full border rounded-lg">
                <pre className="p-4 text-sm bg-muted/30">
                  <code className="language-javascript">
                    {selectedSubmission.code}
                  </code>
                </pre>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}