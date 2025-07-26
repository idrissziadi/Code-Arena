import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Flag,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface Solution {
  id: string;
  explanation: string;
  validated: boolean;
  created_at: string;
  user_id: string;
  problem_id: string;
  users?: {
    username: string;
    avatar: string;
  };
  problems?: {
    title: string;
    difficulty: string;
  };
  submissions?: {
    code: string;
    verdict: string;
    languages?: {
      name: string;
    };
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_reported: boolean;
  users?: {
    username: string;
    avatar: string;
  };
}

export default function Solutions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const problemId = searchParams.get('problem_id');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSolutions();
    // eslint-disable-next-line
  }, [problemId]);

  const fetchSolutions = async () => {
    try {
      let query = supabase
        .from('solutions')
        .select(`
          *,
          users(username, avatar),
          problems(title, difficulty),
          submissions(code, verdict, languages(name))
        `)
        .eq('validated', true)
        .order('created_at', { ascending: false });

      if (problemId) {
        query = query.eq('problem_id', problemId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSolutions(data || []);

      // Fetch comments for each solution
      if (data) {
        for (const solution of data) {
          await fetchComments(solution.id);
        }
      }
    } catch (error) {
      console.error('Error fetching solutions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les solutions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (solutionId: string) => {
    try {
      const { data, error } = await supabase
        .from('commentsolution')
        .select('*, users(username, avatar)')
        .eq('solution_id', solutionId)
        .eq('is_reported', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setComments(prev => ({
        ...prev,
        [solutionId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async (solutionId: string) => {
    const content = newComment[solutionId]?.trim();
    if (!content || !user) return;

    try {
      const { error } = await supabase
        .from('commentsolution')
        .insert({
          content,
          user_id: user.id,
          solution_id: solutionId
        });

      if (error) throw error;

      setNewComment(prev => ({ ...prev, [solutionId]: '' }));
      await fetchComments(solutionId);

      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire",
        variant: "destructive"
      });
    }
  };

  const reportComment = async (commentId: string, solutionId: string) => {
    try {
      const { error } = await supabase
        .from('commentsolution')
        .update({ is_reported: true })
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments(solutionId);

      toast({
        title: "Commentaire signalé",
        description: "Le commentaire a été signalé aux modérateurs"
      });
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de signaler le commentaire",
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

  const filteredSolutions = solutions.filter(solution =>
    solution.problems?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solution.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solution.users?.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="container mx-auto p-6">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {problemId && (
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate(`/problems/${problemId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au problème
          </Button>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold">Solutions communautaires</h1>
        <p className="text-muted-foreground">
          Découvrez les explications et solutions partagées par la communauté
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher des solutions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-6">
        {filteredSolutions.map((solution) => (
          <Card key={solution.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={solution.users?.avatar} />
                    <AvatarFallback>
                      {solution.users?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      Solution pour "{solution.problems?.title}"
                    </CardTitle>
                    <CardDescription>
                      Par {solution.users?.username} • {new Date(solution.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-white ${getDifficultyColor(solution.problems?.difficulty || '')}`}
                  >
                    {solution.problems?.difficulty}
                  </Badge>
                  {solution.validated && (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Validée
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ 
                  __html: solution.explanation.replace(/\n/g, '<br>') 
                }} />
              </div>

              {solution.submissions && (
                <div className="space-y-2">
                  <h4 className="font-medium">Code associé ({solution.submissions.languages?.name})</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      <code>{solution.submissions.code}</code>
                    </pre>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={solution.submissions.verdict === 'Accepted' ? 'default' : 'destructive'}
                    >
                      {solution.submissions.verdict === 'Accepted' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {solution.submissions.verdict}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Commentaires ({comments[solution.id]?.length || 0})
                </h4>

                {/* Add comment form */}
                {user && (
                  <div className="flex space-x-2 mb-4">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {user.user_metadata?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Ajouter un commentaire..."
                        value={newComment[solution.id] || ''}
                        onChange={(e) => setNewComment(prev => ({
                          ...prev,
                          [solution.id]: e.target.value
                        }))}
                        className="min-h-[80px]"
                      />
                      <Button 
                        onClick={() => addComment(solution.id)}
                        disabled={!newComment[solution.id]?.trim()}
                        size="sm"
                      >
                        Publier
                      </Button>
                    </div>
                  </div>
                )}

                {/* Comments list */}
                <div className="space-y-3">
                  {comments[solution.id]?.map((comment) => (
                    <div key={comment.id} className="flex space-x-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.users?.avatar} />
                        <AvatarFallback>
                          {comment.users?.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {comment.users?.username}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                            {user && user.id !== comment.user_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => reportComment(comment.id, solution.id)}
                              >
                                <Flag className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSolutions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune solution trouvée</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Aucune solution ne correspond à votre recherche."
                : "Il n'y a pas encore de solutions publiées."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}