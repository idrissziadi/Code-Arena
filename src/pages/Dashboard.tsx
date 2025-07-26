import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Code2, 
  Target, 
  Star, 
  TrendingUp, 
  Calendar,
  Award,
  Activity,
  BookOpen,
  Shield,
  Users,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserStats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  totalProblems: number;
  solvedProblems: number;
  badges: number;
  rank: number;
}

export default function Dashboard() {
  const { user, userProfile, isAdmin } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    totalProblems: 0,
    solvedProblems: 0,
    badges: 0,
    rank: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [upcomingContests, setUpcomingContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Use the new user-stats Edge Function
      const { data: statsData, error: statsError } = await supabase.functions.invoke('user-stats');
      
      if (statsError) throw statsError;

      setStats({
        totalSubmissions: statsData.totalSubmissions,
        acceptedSubmissions: statsData.acceptedSubmissions,
        totalProblems: 0, // Will be loaded separately
        solvedProblems: statsData.solvedProblems,
        badges: statsData.badges.length,
        rank: statsData.rank,
      });

      setRecentSubmissions(statsData.recentSubmissions);

      // Load total problems count and upcoming contests
      const [problemsResult, contestsResult] = await Promise.all([
        supabase.from('problems').select('id', { count: 'exact' }),
        supabase
          .from('concours')
          .select('*')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(3)
      ]);

      setStats(prev => ({
        ...prev,
        totalProblems: problemsResult.count || 0,
      }));

      setUpcomingContests(contestsResult.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const successRate = stats.totalSubmissions > 0 
    ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100) 
    : 0;

  const problemsProgress = stats.totalProblems > 0 
    ? Math.round((stats.solvedProblems / stats.totalProblems) * 100) 
    : 0;

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Accepted':
        return 'text-success';
      case 'Wrong Answer':
        return 'text-destructive';
      case 'Time Limit Exceeded':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">
            Bienvenue, {userProfile?.username || user?.user_metadata?.username || 'Codeur'} !
          </h1>
          {isAdmin() && (
            <Badge variant="default" className="bg-primary">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {isAdmin() 
            ? "Tableau de bord administrateur - Gérez CodeArena et surveillez les performances"
            : "Voici un aperçu de vos performances sur CodeArena"
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-primary text-primary-foreground shadow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problèmes Résolus</CardTitle>
            <Target className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.solvedProblems}</div>
            <p className="text-xs opacity-80">
              sur {stats.totalProblems} problèmes
            </p>
            <Progress value={problemsProgress} className="mt-2 bg-primary-foreground/20" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent text-accent-foreground shadow-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs opacity-80">
              {stats.acceptedSubmissions}/{stats.totalSubmissions} soumissions
            </p>
            <Progress value={successRate} className="mt-2 bg-accent-foreground/20" />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Obtenus</CardTitle>
            <Award className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.badges}</div>
            <p className="text-xs text-muted-foreground">
              badges débloqués
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classement</CardTitle>
            <Trophy className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{stats.rank}</div>
            <p className="text-xs text-muted-foreground">
              position globale
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Submissions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Soumissions Récentes
            </CardTitle>
            <CardDescription>
              Vos dernières tentatives de résolution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{submission.problems?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.languages?.name} • {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={getVerdictColor(submission.verdict)}>
                    {submission.verdict}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune soumission récente</p>
                <Button asChild className="mt-4">
                  <Link to="/problems">Commencer à coder</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Contests */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Concours à Venir
            </CardTitle>
            <CardDescription>
              Prochaines compétitions programmées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingContests.length > 0 ? (
              upcomingContests.map((contest) => (
                <div key={contest.id} className="p-3 rounded-lg border">
                  <h4 className="font-medium">{contest.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(contest.start_time).toLocaleDateString()} à{' '}
                    {new Date(contest.start_time).toLocaleTimeString()}
                  </p>
                  <Button size="sm" className="mt-2">
                    S'inscrire
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun concours programmé</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Quick Actions */}
      {isAdmin() && (
        <Card className="shadow-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Shield className="h-5 w-5" />
              Panneau d'Administration
            </CardTitle>
            <CardDescription>
              Gérez la plateforme et surveillez les activités
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button asChild variant="default" className="h-20 flex flex-col gap-2">
                <Link to="/admin">
                  <Settings className="h-6 w-6" />
                  <span>Administration</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col gap-2">
                <Link to="/admin#users">
                  <Users className="h-6 w-6" />
                  <span>Utilisateurs</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col gap-2">
                <Link to="/admin#problems">
                  <BookOpen className="h-6 w-6" />
                  <span>Problèmes</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col gap-2">
                <Link to="/admin#analytics">
                  <Activity className="h-6 w-6" />
                  <span>Statistiques</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>
            Commencez votre session d'entraînement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-20 flex flex-col gap-2">
              <Link to="/problems">
                <BookOpen className="h-6 w-6" />
                <span>Résoudre un Problème</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex flex-col gap-2">
              <Link to="/contests">
                <Trophy className="h-6 w-6" />
                <span>Rejoindre un Concours</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex flex-col gap-2">
              <Link to="/profile">
                <Star className="h-6 w-6" />
                <span>Voir mon Profil</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}