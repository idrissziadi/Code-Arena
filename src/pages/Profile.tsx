import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Code, Trophy, Target, Users, Star, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBadges } from '@/hooks/useBadges';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  role: string;
  created_at: string;
}

interface UserStats {
  totalSubmissions: number;
  solvedProblems: number;
  acceptedSubmissions: number;
  badges: any[];
  favoriteProblems: number;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { verifierBadges } = useBadges();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserStats();
      verifierBadges(user.id);
      fetchUserSubmissions();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        username: data.username || '',
        avatar: data.avatar || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const [submissionsRes, favoritesRes, badgesRes] = await Promise.all([
        supabase.from('submissions').select('verdict').eq('user_id', user?.id),
        supabase.from('user_favorites').select('problem_id').eq('user_id', user?.id),
        supabase.from('user_badges').select('badge_id, badges(name, icon, description)').eq('user_id', user?.id)
      ]);

      const submissions = submissionsRes.data || [];
      const acceptedSubmissions = submissions.filter(s => s.verdict === 'Accepted').length;
      const uniqueProblems = new Set();

      setStats({
        totalSubmissions: submissions.length,
        solvedProblems: uniqueProblems.size,
        acceptedSubmissions,
        badges: badgesRes.data || [],
        favoriteProblems: favoritesRes.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchUserSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, created_at, verdict, code, language_id, languages(name), problem_id, problems(title)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des soumissions:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: formData.username,
          avatar: formData.avatar
        })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setEditing(false);
      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Chargement...</div>;
  }

  if (!profile) {
    return <div className="container mx-auto p-6">Profil non trouvé</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile.username}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
              <Badge variant="secondary" className="mt-2">
                {profile.role}
              </Badge>
            </div>
            <div className="ml-auto">
              {editing ? (
                <div className="space-x-2">
                  <Button onClick={handleSave}>Sauvegarder</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Annuler
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setEditing(true)}>
                  Modifier le profil
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {editing && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="avatar">URL de l'avatar</Label>
              <Input
                id="avatar"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              />
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="submissions">Soumissions</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Soumissions totales</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalSubmissions || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Problèmes résolus</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.solvedProblems || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Soumissions acceptées</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.acceptedSubmissions || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Problèmes favoris</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.favoriteProblems || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle>Mes badges</CardTitle>
              <CardDescription>
                Les récompenses que vous avez gagnées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.badges && stats.badges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.badges.map((userBadge) => (
                    <Card key={userBadge.badge_id}>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{userBadge.badges.icon}</div>
                        <h3 className="font-semibold">{userBadge.badges.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {userBadge.badges.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucun badge gagné pour le moment.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Historique des soumissions</CardTitle>
              <CardDescription>
                Toutes vos tentatives, du plus récent au plus ancien
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-muted-foreground">Aucune soumission trouvée.</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <Card key={sub.id} className="border border-border/40 shadow-sm">
                      <CardContent className="py-4 px-2">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={sub.verdict === 'Accepted' ? 'default' : 'destructive'}>
                              {sub.verdict}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(sub.created_at).toLocaleString()}
                            </span>
                            <span className="text-xs bg-muted px-2 py-1 rounded ml-2">
                              {sub.languages?.name || sub.language_id}
                            </span>
                            <span className="text-xs text-primary ml-2">
                              {sub.problems?.title ? `Problème : ${sub.problems.title}` : `Problème #${sub.problem_id}`}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedSubmission(sub); setShowSubmissionDialog(true); }}
                            className="h-8"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Voir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Code de la soumission
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={selectedSubmission.verdict === 'Accepted' ? 'default' : 'destructive'}>
                    {selectedSubmission.verdict}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedSubmission.created_at).toLocaleString()}
                  </span>
                  <span className="text-xs bg-muted px-2 py-1 rounded ml-2">
                    {selectedSubmission.languages?.name || selectedSubmission.language_id}
                  </span>
                  <span className="text-xs text-primary ml-2">
                    {selectedSubmission.problems?.title ? `Problème : ${selectedSubmission.problems.title}` : `Problème #${selectedSubmission.problem_id}`}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <pre className="bg-muted/50 rounded p-4 mt-2 text-xs overflow-x-auto max-h-96">
              <code>{selectedSubmission.code}</code>
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}