import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Flag, 
  MessageSquare, 
  User,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ModerationPanelProps {
  pendingSolutions: any[];
  reportedComments: any[];
  onUpdate: () => void;
}

export function ModerationPanel({ pendingSolutions, reportedComments, onUpdate }: ModerationPanelProps) {
  const { moderateContent } = useApi();
  const { toast } = useToast();
  const [moderationReason, setModerationReason] = useState('');

  const handleModeration = async (type: string, id: string, action: string) => {
    try {
      await moderateContent(type, id, action, moderationReason);
      
      toast({
        title: "Action effectuée",
        description: `${action} effectué avec succès`
      });

      setModerationReason('');
      onUpdate();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'action",
        variant: "destructive"
      });
    }
  };

  return (
    <Tabs defaultValue="solutions" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="solutions">Solutions en attente</TabsTrigger>
        <TabsTrigger value="comments">Commentaires signalés</TabsTrigger>
      </TabsList>

      <TabsContent value="solutions" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Solutions en attente de validation
            </CardTitle>
            <CardDescription>
              Examinez et validez les solutions proposées par les utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingSolutions.length > 0 ? (
              pendingSolutions.map((solution) => (
                <div key={solution.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{solution.problems?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Par {solution.users?.username} • {new Date(solution.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">{solution.explanation}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleModeration('solution', solution.id, 'approve')}
                      className="bg-success hover:bg-success/90"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleModeration('solution', solution.id, 'reject')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune solution en attente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="comments" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Commentaires signalés
            </CardTitle>
            <CardDescription>
              Modérez les commentaires signalés par la communauté
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportedComments.length > 0 ? (
              reportedComments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{comment.problems?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Par {comment.users?.username} • {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      <Flag className="h-3 w-3 mr-1" />
                      Signalé
                    </Badge>
                  </div>
                  
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">{comment.content}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`reason-${comment.id}`}>Raison de la modération</Label>
                    <Textarea
                      id={`reason-${comment.id}`}
                      value={moderationReason}
                      onChange={(e) => setModerationReason(e.target.value)}
                      placeholder="Expliquer la raison de l'action..."
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleModeration('comment', comment.id, 'approve')}
                      className="bg-success hover:bg-success/90"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleModeration('comment', comment.id, 'delete')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun commentaire signalé</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}