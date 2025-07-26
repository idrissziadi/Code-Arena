import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Star, 
  Search, 
  Filter, 
  Heart,
  Target,
  TrendingUp,
  BookOpen,
  Clock,
  CheckCircle,
  Trash2,
  StarOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FavoriteProblem {
  problem_id: string;
  created_at: string;
  problems: {
    id: string;
    title: string;
    statement: string;
    difficulty: string;
    tags: string[] | null;
    created_at: string;
    data_structures?: { name: string };
  };
  isCompleted?: boolean;
}

export default function Favorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteProblem[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortFavorites();
  }, [favorites, searchTerm, selectedDifficulty, sortBy]);

  const loadFavorites = async () => {
    try {
      const { data: favoritesData, error } = await supabase
        .from('user_favorites')
        .select(`
          problem_id,
          created_at,
          problems!inner(
            id,
            title,
            statement,
            difficulty,
            tags,
            created_at,
            data_structures(name)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check which problems are completed
      const problemIds = favoritesData?.map(f => f.problem_id) || [];
      const { data: completedData } = await supabase
        .from('submissions')
        .select('problem_id')
        .eq('user_id', user?.id)
        .eq('verdict', 'Accepted')
        .in('problem_id', problemIds);

      const completedSet = new Set(completedData?.map(s => s.problem_id) || []);

      const enrichedFavorites = favoritesData?.map(favorite => ({
        ...favorite,
        isCompleted: completedSet.has(favorite.problem_id)
      })) || [];

      setFavorites(enrichedFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les favoris",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortFavorites = () => {
    let filtered = favorites;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(favorite =>
        favorite.problems.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        favorite.problems.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        favorite.problems.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(favorite => favorite.problems.difficulty === selectedDifficulty);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.problems.title.localeCompare(b.problems.title);
        case 'difficulty':
          const difficultyOrder = { 'Facile': 1, 'Moyen': 2, 'Difficile': 3 };
          return (difficultyOrder[a.problems.difficulty as keyof typeof difficultyOrder] || 0) - 
                 (difficultyOrder[b.problems.difficulty as keyof typeof difficultyOrder] || 0);
        default:
          return 0;
      }
    });

    setFilteredFavorites(filtered);
  };

  const removeFavorite = async (problemId: string, problemTitle: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user?.id)
        .eq('problem_id', problemId);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.problem_id !== problemId));
      toast({
        title: "Supprimé des favoris",
        description: `"${problemTitle}" a été retiré de vos favoris`
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le favori",
        variant: "destructive"
      });
    }
  };

  const clearAllFavorites = async () => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setFavorites([]);
      toast({
        title: "Favoris supprimés",
        description: "Tous vos favoris ont été supprimés"
      });
    } catch (error) {
      console.error('Error clearing favorites:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les favoris",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'facile':
        return 'bg-success text-success-foreground';
      case 'moyen':
        return 'bg-warning text-warning-foreground';
      case 'difficile':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'facile':
        return <Target className="h-3 w-3" />;
      case 'moyen':
        return <TrendingUp className="h-3 w-3" />;
      case 'difficile':
        return <BookOpen className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Connexion requise</h3>
            <p className="text-muted-foreground">
              Vous devez être connecté pour voir vos problèmes favoris.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Star className="h-6 w-6 text-warning fill-warning" />
            <h1 className="text-3xl font-bold">Mes Favoris</h1>
          </div>
          <p className="text-muted-foreground">
            Vos problèmes sauvegardés ({favorites.length} au total)
          </p>
        </div>
        
        {favorites.length > 0 && (
          <Button
            variant="outline"
            onClick={clearAllFavorites}
            className="flex items-center gap-2 text-destructive hover:text-destructive"
          >
            <StarOff className="h-4 w-4" />
            Tout supprimer
          </Button>
        )}
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun favori</h3>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore de problèmes dans vos favoris.
            </p>
            <Button asChild>
              <Link to="/problems">
                Explorer les problèmes
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres et Tri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans les favoris..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Difficulty Filter */}
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulté" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les difficultés</SelectItem>
                    <SelectItem value="Facile">Facile</SelectItem>
                    <SelectItem value="Moyen">Moyen</SelectItem>
                    <SelectItem value="Difficile">Difficile</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Plus récent</SelectItem>
                    <SelectItem value="oldest">Plus ancien</SelectItem>
                    <SelectItem value="title">Titre A-Z</SelectItem>
                    <SelectItem value="difficulty">Difficulté</SelectItem>
                  </SelectContent>
                </Select>

                {/* Results count */}
                <div className="flex items-center text-sm text-muted-foreground">
                  {filteredFavorites.length} résultat(s)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((favorite) => (
              <Card key={favorite.problem_id} className="hover:shadow-lg transition-all group relative">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-lg leading-tight">
                        {favorite.problems.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(favorite.problems.difficulty)}>
                          {getDifficultyIcon(favorite.problems.difficulty)}
                          <span className="ml-1">{favorite.problems.difficulty}</span>
                        </Badge>
                        {favorite.problems.data_structures && (
                          <Badge variant="outline" className="text-xs">
                            {favorite.problems.data_structures.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {favorite.isCompleted && (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFavorite(favorite.problem_id, favorite.problems.title)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-3">
                    {favorite.problems.statement.length > 120 
                      ? `${favorite.problems.statement.substring(0, 120)}...` 
                      : favorite.problems.statement
                    }
                  </CardDescription>

                  {favorite.problems.tags && favorite.problems.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {favorite.problems.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {favorite.problems.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{favorite.problems.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span>Ajouté le {new Date(favorite.created_at).toLocaleDateString()}</span>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/problems/${favorite.problem_id}`}>
                        {favorite.isCompleted ? 'Revoir' : 'Résoudre'}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFavorites.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun résultat</h3>
                <p className="text-muted-foreground">
                  Aucun favori ne correspond à vos critères de recherche.
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDifficulty('all');
                    setSortBy('newest');
                  }}
                  className="mt-4"
                >
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}