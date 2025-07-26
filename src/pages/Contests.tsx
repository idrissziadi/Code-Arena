import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  Users, 
  Trophy, 
  Play, 
  Plus,
  Search,
  Filter,
  Upload,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Contest {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  participants?: number;
}

interface Participation {
  user_id: string;
  concours_id: string;
  score: number;
  rank: number;
  contenu?: string;
  users?: {
    username: string;
    avatar: string;
  };
}

export default function Contests() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [contests, setContests] = useState<Contest[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'active' | 'finished'>('all');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedContestId, setSelectedContestId] = useState<string>('');
  const [newContest, setNewContest] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    fetchContests();
    if (user) {
      fetchMyParticipations();
    }
  }, [user]);

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
      toast({
        title: "Erreur",
        description: "Impossible de charger les concours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyParticipations = async () => {
    try {
      const { data, error } = await supabase
        .from('participations')
        .select('*, users(username, avatar)')
        .eq('user_id', user?.id);

      if (error) throw error;
      setParticipations(data || []);
    } catch (error) {
      console.error('Error fetching participations:', error);
    }
  };

  const getContestStatus = (contest: Contest) => {
    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'finished';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-500">À venir</Badge>;
      case 'active':
        return <Badge className="bg-green-500">En cours</Badge>;
      case 'finished':
        return <Badge variant="secondary">Terminé</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (start: string, end: string) => {
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      readFileContent(file);
    }
  };

  const readFileContent = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  };

  const openUploadDialog = (contestId: string) => {
    setSelectedContestId(contestId);
    setShowUploadDialog(true);
    setSelectedFile(null);
    setFileContent('');
  };

  const joinContest = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour participer",
        variant: "destructive"
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Fichier requis",
        description: "Veuillez sélectionner un fichier pour participer",
        variant: "destructive"
      });
      return;
    }

    try {
      // TODO: Décommenter quand la migration sera appliquée
      const participationData: any = {
        user_id: user.id,
        concours_id: selectedContestId,
        score: 0,
        rank: null,
        contenu: fileContent // Décommenter après application de la migration
      };

      const { error } = await supabase
        .from('participations')
        .insert(participationData);

      if (error) throw error;

      toast({
        title: "Inscription réussie",
        description: "Vous êtes maintenant inscrit au concours avec votre fichier"
      });

      setShowUploadDialog(false);
      setSelectedFile(null);
      setFileContent('');
      fetchMyParticipations();
    } catch (error: any) {
      console.error('Error joining contest:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de rejoindre le concours",
        variant: "destructive"
      });
    }
  };

  const createContest = async () => {
    if (!user || userProfile?.role !== 'admin') {
      toast({
        title: "Accès refusé",
        description: "Seuls les administrateurs peuvent créer des concours",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('concours')
        .insert(newContest);

      if (error) throw error;

      toast({
        title: "Concours créé",
        description: "Le nouveau concours a été créé avec succès"
      });

      setShowCreateForm(false);
      setNewContest({
        title: '',
        description: '',
        start_time: '',
        end_time: ''
      });
      fetchContests();
    } catch (error: any) {
      console.error('Error creating contest:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le concours",
        variant: "destructive"
      });
    }
  };

  const filteredContests = contests.filter(contest => {
    const matchesSearch = contest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contest.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'all') return true;
    return getContestStatus(contest) === statusFilter;
  });

  const isParticipating = (contestId: string) => {
    return participations.some(p => p.concours_id === contestId);
  };

  if (loading) {
    return <div className="container mx-auto p-6">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Concours</h1>
          <p className="text-muted-foreground">
            Participez aux compétitions de programmation
          </p>
        </div>
        
        {userProfile?.role === 'admin' && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un concours
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des concours..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            Tous
          </Button>
          <Button
            variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('upcoming')}
          >
            À venir
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('active')}
          >
            En cours
          </Button>
          <Button
            variant={statusFilter === 'finished' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('finished')}
          >
            Terminés
          </Button>
        </div>
      </div>

      {showCreateForm && userProfile?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouveau concours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={newContest.title}
                onChange={(e) => setNewContest({ ...newContest, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newContest.description}
                onChange={(e) => setNewContest({ ...newContest, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Date de début</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={newContest.start_time}
                  onChange={(e) => setNewContest({ ...newContest, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_time">Date de fin</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={newContest.end_time}
                  onChange={(e) => setNewContest({ ...newContest, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createContest}>Créer</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContests.map((contest) => {
          const status = getContestStatus(contest);
          const participating = isParticipating(contest.id);
          
          return (
            <Card key={contest.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{contest.title}</CardTitle>
                  {getStatusBadge(status)}
                </div>
                <CardDescription>{contest.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Début: {formatDate(contest.start_time)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Durée: {getDuration(contest.start_time, contest.end_time)}</span>
                  </div>
                  {contest.participants && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{contest.participants} participants</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  {!participating && status !== 'finished' && (
                    <Button
                      onClick={() => openUploadDialog(contest.id)}
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg px-6 py-2 flex items-center gap-2 transition-transform duration-200 hover:scale-105 hover:shadow-2xl hover:from-pink-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
                    >
                      <Play className="h-4 w-4 mr-1 animate-pulse" />
                      Participer
                    </Button>
                  )}
                  {participating && (
                    <Badge className="bg-green-500">Inscrit</Badge>
                  )}
                  {status === 'finished' && !participating && (
                    <Badge variant="secondary">Clôturé</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog pour upload de fichier */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Participer au concours</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier contenant votre solution pour participer au concours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Fichier de solution</Label>
              <div className="mt-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt,.py,.js,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.hs,.ml,.clj,.rkt,.dart,.ts,.jsx,.tsx"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
              </div>
              {selectedFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
            
            {fileContent && (
              <div>
                <Label>Aperçu du contenu</Label>
                <div className="mt-2 p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {fileContent.substring(0, 500)}
                    {fileContent.length > 500 && '...'}
                  </pre>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={joinContest} disabled={!selectedFile}>
                <Upload className="h-4 w-4 mr-2" />
                Participer
              </Button>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {filteredContests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun concours trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? "Aucun concours ne correspond à vos critères de recherche."
                : "Il n'y a pas de concours disponibles pour le moment."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}