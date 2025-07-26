import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  Code, 
  Flag, 
  Trophy, 
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ModerationPanel } from '@/components/admin/ModerationPanel';
import { AnalyticsChart } from '@/components/admin/AnalyticsChart';
import { DataStructureManager } from '@/components/admin/DataStructureManager';
import { SubmissionManager } from '@/components/admin/SubmissionManager';
import { TestCaseManager } from '@/components/admin/TestCaseManager';

interface DashboardStats {
  totalUsers: number;
  totalProblems: number;
  totalSubmissions: number;
  pendingSolutions: number;
  reportedComments: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  created_at: string;
  created_by: string;
}

interface Contest {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { getAdminDashboard, moderateContent } = useApi();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProblems: 0,
    totalSubmissions: 0,
    pendingSolutions: 0,
    reportedComments: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [pendingSolutions, setPendingSolutions] = useState<any[]>([]);
  const [reportedComments, setReportedComments] = useState<any[]>([]);
  const [verdictCounts, setVerdictCounts] = useState<any>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProblem, setShowCreateProblem] = useState(false);
  const [showCreateDataStructure, setShowCreateDataStructure] = useState(false);
  const [selectedProblemForTests, setSelectedProblemForTests] = useState<string | null>(null);
  const [dataStructures, setDataStructures] = useState<any[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [newProblem, setNewProblem] = useState({
    title: '',
    statement: '',
    difficulty: '',
    tags: '',
    testCases: [{ input: '', expected_output: '', is_public: true }]
  });
  const [newDataStructure, setNewDataStructure] = useState({
    name: '',
    description: ''
  });
  const [contests, setContests] = useState<Contest[]>([]);
  const [showCreateContest, setShowCreateContest] = useState(false);
  const [editContest, setEditContest] = useState<Contest | null>(null);
  const [newContest, setNewContest] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    // Pas besoin de vérification ici car AdminRoute s'en charge déjà
    if (user) {
      fetchDashboardStats();
      fetchUsers();
      fetchProblems();
      fetchDataStructures();
      fetchAllSubmissions();
      fetchPendingSolutions();
      fetchReportedComments();
      fetchContests();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const dashboardData = await getAdminDashboard('stats');
      
      setStats(dashboardData.stats);
      setVerdictCounts(dashboardData.verdictCounts);
      setRecentActivity(dashboardData.recentActivity);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProblems = async () => {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProblems(data || []);
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataStructures = async () => {
    try {
      const { data, error } = await supabase
        .from('data_structures')
        .select('*')
        .order('name');

      if (error) throw error;
      setDataStructures(data || []);
    } catch (error) {
      console.error('Error fetching data structures:', error);
    }
  };

  const fetchAllSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          users(username, email),
          problems(title, difficulty),
          languages(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAllSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching all submissions:', error);
    }
  };

  const fetchPendingSolutions = async () => {
    try {
      const { data, error } = await supabase
        .from('solutions')
        .select(`
          *,
          users(username),
          problems(title)
        `)
        .eq('validated', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingSolutions(data || []);
    } catch (error) {
      console.error('Error fetching pending solutions:', error);
    }
  };

  const fetchReportedComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users(username),
          problems(title)
        `)
        .eq('is_reported', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReportedComments(data || []);
    } catch (error) {
      console.error('Error fetching reported comments:', error);
    }
  };

  const fetchContests = async () => {
    try {
      const { data, error } = await supabase
        .from('concours')
        .select('*')
        .order('start_time', { ascending: false });
      if (error) throw error;
      setContests(data || []);
    } catch (error) {
      console.error('Error fetching contests:', error);
    }
  };

  const createContest = async () => {
    try {
      const { error } = await supabase
        .from('concours')
        .insert(newContest);
      if (error) throw error;
      toast({ title: 'Concours créé', description: 'Le concours a été ajouté.' });
      setShowCreateContest(false);
      setNewContest({ title: '', description: '', start_time: '', end_time: '' });
      fetchContests();
    } catch (error) {
      toast({ title: 'Erreur', description: "Impossible de créer le concours", variant: 'destructive' });
    }
  };

  const updateContest = async () => {
    if (!editContest) return;
    try {
      const { error } = await supabase
        .from('concours')
        .update(newContest)
        .eq('id', editContest.id);
      if (error) throw error;
      toast({ title: 'Concours modifié', description: 'Le concours a été mis à jour.' });
      setEditContest(null);
      setShowCreateContest(false);
      setNewContest({ title: '', description: '', start_time: '', end_time: '' });
      fetchContests();
    } catch (error) {
      toast({ title: 'Erreur', description: "Impossible de modifier le concours", variant: 'destructive' });
    }
  };

  const deleteContest = async (id: string) => {
    if (!window.confirm('Supprimer ce concours ?')) return;
    try {
      const { error } = await supabase
        .from('concours')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Concours supprimé', description: 'Le concours a été supprimé.' });
      fetchContests();
    } catch (error) {
      toast({ title: 'Erreur', description: "Impossible de supprimer le concours", variant: 'destructive' });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      toast({
        title: "Rôle mis à jour",
        description: "Le rôle de l'utilisateur a été modifié"
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle",
        variant: "destructive"
      });
    }
  };

  const createProblem = async () => {
    try {
      const { data: problemData, error: problemError } = await supabase
        .from('problems')
        .insert({
          title: newProblem.title,
          statement: newProblem.statement,
          difficulty: newProblem.difficulty,
          tags: newProblem.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          created_by: user?.id
        })
        .select()
        .single();

      if (problemError) throw problemError;

      // Add test cases
      for (const testCase of newProblem.testCases) {
        if (testCase.input && testCase.expected_output) {
          await supabase
            .from('test_cases')
            .insert({
              problem_id: problemData.id,
              input: testCase.input,
              expected_output: testCase.expected_output,
              is_public: testCase.is_public
            });
        }
      }

      toast({
        title: "Problème créé",
        description: "Le nouveau problème a été ajouté avec succès"
      });

      setShowCreateProblem(false);
      setNewProblem({
        title: '',
        statement: '',
        difficulty: '',
        tags: '',
        testCases: [{ input: '', expected_output: '', is_public: true }]
      });
      fetchProblems();
      fetchDashboardStats();
    } catch (error) {
      console.error('Error creating problem:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le problème",
        variant: "destructive"
      });
    }
  };

  const deleteProblem = async (problemId: string) => {
    try {
      const { error } = await supabase
        .from('problems')
        .delete()
        .eq('id', problemId);

      if (error) throw error;

      setProblems(problems.filter(p => p.id !== problemId));
      
      toast({
        title: "Problème supprimé",
        description: "Le problème a été supprimé avec succès"
      });

      fetchDashboardStats();
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le problème",
        variant: "destructive"
      });
    }
  };

  const createDataStructure = async () => {
    try {
      const { error } = await supabase
        .from('data_structures')
        .insert(newDataStructure);

      if (error) throw error;

      toast({
        title: "Structure de données créée",
        description: "La nouvelle structure a été ajoutée avec succès"
      });

      setShowCreateDataStructure(false);
      setNewDataStructure({ name: '', description: '' });
      fetchDataStructures();
    } catch (error) {
      console.error('Error creating data structure:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la structure de données",
        variant: "destructive"
      });
    }
  };

  const deleteDataStructure = async (id: string) => {
    try {
      const { error } = await supabase
        .from('data_structures')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDataStructures(dataStructures.filter(ds => ds.id !== id));
      
      toast({
        title: "Structure supprimée",
        description: "La structure de données a été supprimée"
      });
    } catch (error) {
      console.error('Error deleting data structure:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la structure",
        variant: "destructive"
      });
    }
  };

  const updateSubmissionVerdict = async (submissionId: string, newVerdict: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ verdict: newVerdict })
        .eq('id', submissionId);

      if (error) throw error;

      setAllSubmissions(allSubmissions.map(s => 
        s.id === submissionId ? { ...s, verdict: newVerdict } : s
      ));

      toast({
        title: "Verdict mis à jour",
        description: "Le verdict de la soumission a été modifié"
      });
    } catch (error) {
      console.error('Error updating verdict:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le verdict",
        variant: "destructive"
      });
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;

      setAllSubmissions(allSubmissions.filter(s => s.id !== submissionId));
      
      toast({
        title: "Soumission supprimée",
        description: "La soumission a été supprimée avec succès"
      });

      fetchDashboardStats();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la soumission",
        variant: "destructive"
      });
    }
  };

  const addTestCase = () => {
    setNewProblem({
      ...newProblem,
      testCases: [...newProblem.testCases, { input: '', expected_output: '', is_public: true }]
    });
  };

  const updateTestCase = (index: number, field: string, value: any) => {
    const updatedTestCases = [...newProblem.testCases];
    updatedTestCases[index] = { ...updatedTestCases[index], [field]: value };
    setNewProblem({ ...newProblem, testCases: updatedTestCases });
  };

  const removeTestCase = (index: number) => {
    setNewProblem({
      ...newProblem,
      testCases: newProblem.testCases.filter((_, i) => i !== index)
    });
  };

  const handleModerationUpdate = () => {
    fetchPendingSolutions();
    fetchReportedComments();
    fetchDashboardStats();
  };

  // Cette vérification n'est plus nécessaire car AdminRoute s'en charge
  // mais on la garde comme fallback de sécurité
  if (!isAdmin()) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Accès refusé</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground">
          Gérez les utilisateurs, problèmes et contenus de la plateforme
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Total inscrits
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problèmes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProblems}</div>
            <p className="text-xs text-muted-foreground">
              Dans la base
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soumissions</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Total reçues
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solutions en attente</CardTitle>
            <CheckCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pendingSolutions}</div>
            <p className="text-xs text-muted-foreground">
              À valider
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signalements</CardTitle>
            <Flag className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.reportedComments}</div>
            <p className="text-xs text-muted-foreground">
              À modérer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <AnalyticsChart verdictCounts={verdictCounts} recentActivity={recentActivity} />

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="problems">Problèmes</TabsTrigger>
          <TabsTrigger value="concours">Concours</TabsTrigger>
          <TabsTrigger value="datastructures">Structures</TabsTrigger>
          <TabsTrigger value="submissions">Soumissions</TabsTrigger>
          <TabsTrigger value="testcases">Cas de Test</TabsTrigger>
          <TabsTrigger value="moderation" className="relative">
            Modération
            {(stats.pendingSolutions > 0 || stats.reportedComments > 0) && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></div>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>Gérez les rôles et permissions des utilisateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((userItem) => (
                  <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{userItem.username || 'Utilisateur anonyme'}</h3>
                      <p className="text-sm text-muted-foreground">{userItem.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Inscrit le {new Date(userItem.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={userItem.role}
                        onValueChange={(value) => updateUserRole(userItem.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Utilisateur</SelectItem>
                          <SelectItem value="moderator">Modérateur</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="banned">Banni</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant={
                        userItem.role === 'admin' ? 'default' : 
                        userItem.role === 'moderator' ? 'secondary' :
                        userItem.role === 'banned' ? 'destructive' : 'outline'
                      }>
                        {userItem.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problems" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des problèmes</h2>
            <Button onClick={() => setShowCreateProblem(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un problème
            </Button>
          </div>

          {showCreateProblem && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Créer un nouveau problème</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      value={newProblem.title}
                      onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="difficulty">Difficulté</Label>
                    <Select 
                      value={newProblem.difficulty} 
                      onValueChange={(value) => setNewProblem({ ...newProblem, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Facile">Facile</SelectItem>
                        <SelectItem value="Moyen">Moyen</SelectItem>
                        <SelectItem value="Difficile">Difficile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="statement">Énoncé</Label>
                  <Textarea
                    id="statement"
                    value={newProblem.statement}
                    onChange={(e) => setNewProblem({ ...newProblem, statement: e.target.value })}
                    className="min-h-[150px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                  <Input
                    id="tags"
                    value={newProblem.tags}
                    onChange={(e) => setNewProblem({ ...newProblem, tags: e.target.value })}
                    placeholder="algorithme, mathématiques, graphes"
                  />
                </div>

                <div>
                  <Label>Cas de test</Label>
                  {newProblem.testCases.map((testCase, index) => (
                    <div key={index} className="border p-4 rounded mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Cas de test {index + 1}</h4>
                        <div className="flex items-center space-x-2">
                          <Label className="text-sm">Public</Label>
                          <input
                            type="checkbox"
                            checked={testCase.is_public}
                            onChange={(e) => updateTestCase(index, 'is_public', e.target.checked)}
                          />
                          {newProblem.testCases.length > 1 && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => removeTestCase(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Entrée</Label>
                          <Textarea
                            value={testCase.input}
                            onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                            className="h-20"
                          />
                        </div>
                        <div>
                          <Label>Sortie attendue</Label>
                          <Textarea
                            value={testCase.expected_output}
                            onChange={(e) => updateTestCase(index, 'expected_output', e.target.value)}
                            className="h-20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    onClick={addTestCase}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un cas de test
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button onClick={createProblem}>
                    Créer le problème
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateProblem(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Problèmes existants</CardTitle>
              <CardDescription>Liste de tous les problèmes de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {problems.map((problem) => (
                  <div key={problem.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{problem.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{problem.difficulty}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Créé le {new Date(problem.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteProblem(problem.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concours" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des concours</h2>
            <Button onClick={() => { setShowCreateContest(true); setEditContest(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un concours
            </Button>
          </div>
          {(showCreateContest || editContest) && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{editContest ? 'Modifier le concours' : 'Créer un nouveau concours'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={newContest.title}
                    onChange={e => setNewContest({ ...newContest, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newContest.description}
                    onChange={e => setNewContest({ ...newContest, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Date de début</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={newContest.start_time}
                      onChange={e => setNewContest({ ...newContest, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Date de fin</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={newContest.end_time}
                      onChange={e => setNewContest({ ...newContest, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={editContest ? updateContest : createContest}>
                    {editContest ? 'Modifier' : 'Créer'}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowCreateContest(false); setEditContest(null); setNewContest({ title: '', description: '', start_time: '', end_time: '' }); }}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Concours existants</CardTitle>
              <CardDescription>Liste de tous les concours de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contests.map((contest) => (
                  <div key={contest.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{contest.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{contest.start_time ? new Date(contest.start_time).toLocaleString() : ''} - {contest.end_time ? new Date(contest.end_time).toLocaleString() : ''}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{contest.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditContest(contest); setShowCreateContest(true); setNewContest({ title: contest.title, description: contest.description, start_time: contest.start_time?.slice(0, 16), end_time: contest.end_time?.slice(0, 16) }); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteContest(contest.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datastructures" className="space-y-4">
          <DataStructureManager
            dataStructures={dataStructures}
            showCreateForm={showCreateDataStructure}
            setShowCreateForm={setShowCreateDataStructure}
            newDataStructure={newDataStructure}
            setNewDataStructure={setNewDataStructure}
            onCreateDataStructure={createDataStructure}
            onDeleteDataStructure={deleteDataStructure}
          />
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <SubmissionManager
            submissions={allSubmissions}
            onUpdateVerdict={updateSubmissionVerdict}
            onDeleteSubmission={deleteSubmission}
            onRefresh={fetchAllSubmissions}
          />
        </TabsContent>

        <TabsContent value="testcases" className="space-y-4">
          <TestCaseManager
            problems={problems}
            selectedProblem={selectedProblemForTests}
            onSelectProblem={setSelectedProblemForTests}
          />
        </TabsContent>

        <TabsContent value="moderation">
          <ModerationPanel 
            pendingSolutions={pendingSolutions}
            reportedComments={reportedComments}
            onUpdate={handleModerationUpdate}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistiques Détaillées
              </CardTitle>
              <CardDescription>
                Analyse approfondie de l'activité de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Taux de réussite global</h4>
                  <div className="text-2xl font-bold text-success">
                    {(() => {
                      const totalSubmissions: number = Object.values(verdictCounts || {}).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0) as number;
                      const acceptedCount: number = Number(verdictCounts?.Accepted) || 0;
                      return totalSubmissions > 0 ? Math.round((acceptedCount / totalSubmissions) * 100) : 0;
                    })()}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Soumissions acceptées
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Problèmes les plus populaires</h4>
                  <div className="text-sm text-muted-foreground">
                    Basé sur le nombre de soumissions
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Utilisateurs actifs</h4>
                  <div className="text-2xl font-bold">
                    {users.filter(u => u.role !== 'banned').length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Non bannis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}