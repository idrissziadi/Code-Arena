import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Target, Code, TrendingUp, Crown, Zap, Star } from 'lucide-react';
import { Card3D, GlowCard } from '@/components/ui/3d-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar: string;
  solved_problems: number;
  total_submissions: number;
  accepted_submissions: number;
  success_rate: number;
  badges_count: number;
  rank: number;
}

interface ContestLeaderboard {
  user_id: string;
  username: string;
  avatar: string;
  score: number;
  rank: number;
  contest_title: string;
}

export default function Leaderboard() {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [contestLeaderboard, setContestLeaderboard] = useState<ContestLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalLeaderboard();
    fetchContestLeaderboard();
  }, []);

  const fetchGlobalLeaderboard = async () => {
    try {
      // Fetch user statistics from submissions
      const { data: userStats, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          avatar,
          submissions!inner(verdict, problem_id),
          user_badges(badge_id)
        `);

      if (error) throw error;

      // Calculate real statistics for each user
      const leaderboardData: LeaderboardEntry[] = userStats?.map((user: any) => {
        const submissions = user.submissions || [];
        const acceptedSubmissions = submissions.filter((s: any) => s.verdict === 'Accepted');
        const uniqueProblems = new Set(acceptedSubmissions.map((s: any) => s.problem_id));
        
        return {
          user_id: user.id,
          username: user.username || 'Anonyme',
          avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
          solved_problems: uniqueProblems.size,
          total_submissions: submissions.length,
          accepted_submissions: acceptedSubmissions.length,
          success_rate: submissions.length > 0 ? Math.round((acceptedSubmissions.length / submissions.length) * 100) : 0,
          badges_count: user.user_badges?.length || 0,
          rank: 0 // Will be set after sorting
        };
      }) || [];

      // Sort by solved problems (descending), then by success rate
      leaderboardData.sort((a, b) => {
        if (a.solved_problems !== b.solved_problems) {
          return b.solved_problems - a.solved_problems;
        }
        return b.success_rate - a.success_rate;
      });

      // Assign ranks
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setGlobalLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
    }
  };

  const fetchContestLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('participations')
        .select(`
          user_id,
          score,
          rank,
          users(username, avatar),
          concours(title)
        `)
        .order('score', { ascending: false })
        .limit(20);

      if (error) throw error;

      const contestData: ContestLeaderboard[] = data?.map((participation: any) => ({
        user_id: participation.user_id,
        username: participation.users?.username || 'Anonyme',
        avatar: participation.users?.avatar || '',
        score: participation.score || 0,
        rank: participation.rank || 0,
        contest_title: participation.concours?.title || 'Concours'
      })) || [];

      setContestLeaderboard(contestData);
    } catch (error) {
      console.error('Error fetching contest leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="font-bold text-lg">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = ['bg-yellow-500', 'bg-gray-400', 'bg-amber-600'];
      return <Badge className={`${colors[rank - 1]} text-white`}>#{rank}</Badge>;
    }
    return <Badge variant="outline">#{rank}</Badge>;
  };

  if (loading) {
    return <div className="container mx-auto p-6">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Classements</h1>
        <p className="text-muted-foreground">
          Découvrez les meilleurs développeurs de la communauté
        </p>
      </div>

      <Tabs defaultValue="global" className="space-y-6">
        <TabsList>
          <TabsTrigger value="global">Classement global</TabsTrigger>
          <TabsTrigger value="contests">Concours récents</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-6">
          {/* Top 3 Podium */}
          <GlowCard glowColor="rgba(255, 215, 0, 0.3)">
            <Card>
            <CardHeader>
              <CardTitle>Podium</CardTitle>
              <CardDescription>Les 3 meilleurs développeurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-end space-x-8">
                {globalLeaderboard.slice(0, 3).map((entry, index) => {
                  const heights = ['h-32', 'h-40', 'h-28'];
                  const orders = [1, 0, 2]; // 2nd, 1st, 3rd
                  const actualIndex = orders[index];
                  const actualEntry = globalLeaderboard[actualIndex];
                  
                  // Return null if entry doesn't exist (less than 3 users)
                  if (!actualEntry) {
                    return null;
                  }
                  
                  return (
                    <Card3D key={actualEntry.user_id} className="text-center">
                      <div className="relative">
                        <Avatar className="w-16 h-16 mx-auto mb-2 ring-2 ring-primary/20">
                          <AvatarImage src={actualEntry?.avatar || undefined} />
                          <AvatarFallback>
                            {actualEntry?.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {actualEntry?.rank === 1 && (
                          <Crown className="absolute -top-2 left-1/2 transform -translate-x-1/2 h-6 w-6 text-yellow-500" />
                        )}
                      </div>
                      <div className={`${heights[index]} bg-gradient-to-t from-primary/30 to-primary/10 rounded-t-lg flex flex-col justify-end p-4 min-w-[120px] relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent animate-pulse"></div>
                        <div className="mb-2 relative z-10">
                          {getRankIcon(actualEntry?.rank || 0)}
                        </div>
                        <h3 className="font-semibold relative z-10">{actualEntry?.username || 'Utilisateur'}</h3>
                        <p className="text-sm text-muted-foreground relative z-10">
                          <AnimatedCounter to={actualEntry?.solved_problems || 0} suffix=" problèmes" />
                        </p>
                        {actualEntry?.rank === 1 && (
                          <div className="absolute top-2 right-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </Card3D>
                  );
                }).filter(Boolean)}
              </div>
            </CardContent>
          </Card>
          </GlowCard>

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Classement complet</CardTitle>
              <CardDescription>Tous les participants classés par nombre de problèmes résolus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {globalLeaderboard.map((entry) => (
                  <div 
                    key={entry.user_id} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      entry.rank <= 3 ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <Avatar>
                        <AvatarImage src={entry?.avatar || undefined} />
                        <AvatarFallback>
                          {entry?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{entry?.username || 'Utilisateur'}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Target className="h-3 w-3 mr-1" />
                            {entry?.solved_problems || 0} résolus
                          </span>
                          <span className="flex items-center">
                            <Code className="h-3 w-3 mr-1" />
                            {entry?.total_submissions || 0} soumissions
                          </span>
                          <span className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {entry?.success_rate || 0}% réussite
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        <AnimatedCounter to={entry?.solved_problems || 0} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <AnimatedCounter to={entry?.badges_count || 0} suffix=" badges" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Classement des concours</CardTitle>
              <CardDescription>Résultats des derniers concours</CardDescription>
            </CardHeader>
            <CardContent>
              {contestLeaderboard.length > 0 ? (
                <div className="space-y-4">
                  {contestLeaderboard.map((entry) => (
                    <div 
                      key={entry.user_id} 
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 flex justify-center">
                          {getRankBadge(entry.rank)}
                        </div>
                        <Avatar>
                          <AvatarImage src={entry.avatar} />
                          <AvatarFallback>
                            {entry.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{entry.username}</h3>
                          <p className="text-sm text-muted-foreground">
                            {entry.contest_title}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{entry.score}</div>
                        <div className="text-sm text-muted-foreground">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun concours récent</h3>
                  <p className="text-muted-foreground">
                    Les résultats des concours apparaîtront ici une fois qu'ils seront terminés.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}