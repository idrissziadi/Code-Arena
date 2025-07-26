import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, User, Code, Calendar, Send, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSolutions } from '@/hooks/useSolutions';

interface Solution {
  id: string;
  explanation: string;
  validated: boolean;
  created_at: string;
  user_id: string;
  users?: {
    username: string;
    avatar: string;
  };
  submissions?: {
    code: string;
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

interface ProblemSolutionsProps {
  problemId: string;
}

export default function ProblemSolutions({ problemId }: ProblemSolutionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getSolutionsPourProbleme } = useSolutions();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSolutions();
  }, [problemId]);

  const fetchSolutions = async () => {
    setLoading(true);
    try {
      const data = await getSolutionsPourProbleme(problemId);
      setSolutions(data);
      
      // Fetch comments for each solution
      for (const solution of data) {
        await fetchComments(solution.id);
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
        .from('solution_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          is_reported,
          users (
            username,
            avatar
          )
        `)
        .eq('solution_id', solutionId)
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
    const content = newComments[solutionId]?.trim();
    if (!content || !user) return;

    try {
      const { error } = await supabase
        .from('solution_comments')
        .insert({
          solution_id: solutionId,
          user_id: user.id,
          content
        });

      if (error) throw error;

      setNewComments(prev => ({ ...prev, [solutionId]: '' }));
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
        .from('solution_comments')
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

  if (loading) {
    return <div className="text-center py-8">Chargement des solutions...</div>;
  }

  if (solutions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune solution disponible</h3>
          <p className="text-muted-foreground">
            Aucune solution validée n'a encore été proposée pour ce problème.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Solutions validées</h2>
      
      {solutions.map((solution) => (
        <Card key={solution.id} className="space-y-4">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={solution.users?.avatar} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{solution.users?.username}</CardTitle>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(solution.created_at).toLocaleDateString('fr-FR')}</span>
                  <Badge variant="secondary">{solution.submissions?.languages?.name}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Explication</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{solution.explanation}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Code</h4>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                <pre><code>{solution.submissions?.code}</code></pre>
              </div>
            </div>

            <Separator />

            {/* Section des commentaires */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Commentaires ({comments[solution.id]?.length || 0})
              </h4>

              {/* Liste des commentaires */}
              <div className="space-y-3">
                {comments[solution.id]?.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.users?.avatar} />
                          <AvatarFallback>
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{comment.users?.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {user && user.id !== comment.user_id && !comment.is_reported && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => reportComment(comment.id, solution.id)}
                        >
                          <Flag className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    {comment.is_reported && (
                      <Badge variant="destructive" className="mt-2">
                        Signalé
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* Formulaire d'ajout de commentaire */}
              {user && (
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Ajouter un commentaire..."
                    value={newComments[solution.id] || ''}
                    onChange={(e) => setNewComments(prev => ({
                      ...prev,
                      [solution.id]: e.target.value
                    }))}
                    className="flex-1"
                    rows={2}
                  />
                  <Button
                    onClick={() => addComment(solution.id)}
                    disabled={!newComments[solution.id]?.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}