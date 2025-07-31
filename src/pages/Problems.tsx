import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle,
  Target,
  TrendingUp,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  statement: string;
  difficulty: string;
  tags: string[] | null;
  created_at: string;
  data_structures?: { name: string };
  isFavorite?: boolean;
  isCompleted?: boolean;
}

interface DataStructure {
  id: string;
  name: string;
}

export default function Problems() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [dataStructures, setDataStructures] = useState<DataStructure[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStructure, setSelectedStructure] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const problemsPerPage = 12;

  useEffect(() => {
    loadProblems();
    loadDataStructures();
  }, [user]);

  useEffect(() => {
    filterProblems();
  }, [problems, searchTerm, selectedDifficulty, selectedStructure, showFavoritesOnly]);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, selectedDifficulty, selectedStructure, showFavoritesOnly]);

  const loadProblems = async () => {
    try {
      const { data: problemsData, error } = await supabase
        .from('problems')
        .select(`
          *,
          data_structures(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (user) {
        // Load user favorites and completed problems
        const [favoritesResult, completedResult] = await Promise.all([
          supabase
            .from('user_favorites')
            .select('problem_id')
            .eq('user_id', user.id),
          supabase
            .from('submissions')
            .select('problem_id')
            .eq('user_id', user.id)
            .eq('verdict', 'Accepted')
        ]);

        const favorites = new Set(favoritesResult.data?.map(f => f.problem_id) || []);
        const completed = new Set(completedResult.data?.map(s => s.problem_id) || []);

        const enrichedProblems = problemsData?.map(problem => ({
          ...problem,
          isFavorite: favorites.has(problem.id),
          isCompleted: completed.has(problem.id),
        })) || [];

        setProblems(enrichedProblems);
      } else {
        setProblems(problemsData || []);
      }
    } catch (error) {
      console.error('Error loading problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDataStructures = async () => {
    try {
      const { data, error } = await supabase
        .from('data_structures')
        .select('*')
        .order('name');

      if (error) throw error;
      setDataStructures(data || []);
    } catch (error) {
      console.error('Error loading data structures:', error);
    }
  };

  const filterProblems = () => {
    let filtered = problems;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(problem =>
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(problem => problem.difficulty === selectedDifficulty);
    }

    // Structure filter
    if (selectedStructure !== 'all') {
      if (selectedStructure === 'none') {
        // Filter problems without data structure
        filtered = filtered.filter(problem => !problem.data_structures);
      } else {
        // Filter problems with specific data structure
        filtered = filtered.filter(problem => problem.data_structures?.name === selectedStructure);
      }
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(problem => problem.isFavorite);
    }

    setFilteredProblems(filtered);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProblems.length / problemsPerPage);
  const startIndex = (currentPage - 1) * problemsPerPage;
  const endIndex = startIndex + problemsPerPage;
  const currentProblems = filteredProblems.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      if (currentPage <= 3) {
        end = Math.min(totalPages, maxVisiblePages);
      } else if (currentPage >= totalPages - 2) {
        start = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const toggleFavorite = async (problemId: string) => {
    if (!user) return;

    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;

    try {
      if (problem.isFavorite) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('problem_id', problemId);
      } else {
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            problem_id: problemId,
          });
      }

      // Update local state
      setProblems(prev => prev.map(p =>
        p.id === problemId ? { ...p, isFavorite: !p.isFavorite } : p
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
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
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Problèmes de Programmation</h1>
        <p className="text-muted-foreground">
          Entraînez-vous avec notre collection de problèmes algorithmiques
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des problèmes..."
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

            {/* Structure Filter */}
            <Select value={selectedStructure} onValueChange={setSelectedStructure}>
              <SelectTrigger>
                <SelectValue placeholder="Structure de données" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les structures</SelectItem>
                <SelectItem value="none">Sans structure de données</SelectItem>
                {dataStructures.map((structure) => (
                  <SelectItem key={structure.id} value={structure.name}>
                    {structure.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Favorites Toggle */}
            {user && (
              <Button
                variant={showFavoritesOnly ? 'default' : 'outline'}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="flex items-center gap-2"
              >
                <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                Favoris uniquement
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredProblems.length} problème(s) trouvé(s)
            {totalPages > 1 && (
              <span className="ml-2">
                - Page {currentPage} sur {totalPages}
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentProblems.map((problem) => (
            <Card key={problem.id} className="shadow-card hover:shadow-primary/20 transition-all group">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-lg leading-tight">
                      {problem.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(problem.difficulty)}>
                        {getDifficultyIcon(problem.difficulty)}
                        <span className="ml-1">{problem.difficulty}</span>
                      </Badge>
                      {problem.data_structures && (
                        <Badge variant="outline" className="text-xs">
                          {problem.data_structures.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {problem.isCompleted && (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                    {user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(problem.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            problem.isFavorite 
                              ? 'fill-warning text-warning' 
                              : 'text-muted-foreground hover:text-warning'
                          }`}
                        />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-3">
                  {problem.statement.length > 120 
                    ? `${problem.statement.substring(0, 120)}...` 
                    : problem.statement
                  }
                </CardDescription>

                {problem.tags && problem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {problem.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {problem.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{problem.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(problem.created_at).toLocaleDateString()}</span>
                  </div>
                  <Button asChild size="sm" className="group-hover:bg-primary">
                    <Link to={`/problems/${problem.id}`}>
                      Résoudre
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 py-8">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className="w-10 h-10"
                >
                  {page}
                </Button>
              ))}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {filteredProblems.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <div>
                  <h3 className="text-lg font-medium">Aucun problème trouvé</h3>
                  <p className="text-muted-foreground">
                    Essayez d'ajuster vos filtres ou votre recherche
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDifficulty('all');
                    setSelectedStructure('all');
                    setShowFavoritesOnly(false);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}