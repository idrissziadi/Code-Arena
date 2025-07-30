import React, { useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Code2, 
  Trophy, 
  Users, 
  Zap, 
  Target, 
  BookOpen, 
  Award,
  TrendingUp,
  ArrowRight,
  Github,
  Star,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

// Icônes SVG custom pour Python, C, JS, VSCode
const PythonIcon = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none"><rect width="48" height="48" rx="12" fill="#3776AB"/><path d="M24 8c-4.418 0-8 3.582-8 8v4h16v-4c0-4.418-3.582-8-8-8z" fill="#FFD43B"/><path d="M24 40c4.418 0 8-3.582 8-8v-4H16v4c0 4.418 3.582 8 8 8z" fill="#FFE873"/><circle cx="18" cy="14" r="2" fill="#3776AB"/><circle cx="30" cy="34" r="2" fill="#3776AB"/></svg>
);
const CIcon = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none"><rect width="48" height="48" rx="12" fill="#283593"/><path d="M24 12l12 7v10l-12 7-12-7V19l12-7z" fill="#fff"/><path d="M24 16a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" fill="#283593"/></svg>
);
const JSIcon = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none"><rect width="48" height="48" rx="12" fill="#F7DF1E"/><path d="M20 34.5l-2.5-1.5c.5-1 1-2 1-3.5V18h3v11.5c0 2-.5 3.5-1.5 5zM28 34.5c-1.5 0-2.5-1-2.5-2.5h3c0 .5.5 1 1.5 1s1.5-.5 1.5-1c0-.5-.5-.8-1.5-1.2l-1.5-.6c-2-.7-3-1.7-3-3.7 0-2 1.5-3.5 4-3.5 2 0 3.5 1 4 2.5l-2.5 1c-.2-.5-.7-1-1.5-1s-1.5.5-1.5 1c0 .5.5.8 1.5 1.2l1.5.6c2 .7 3 1.7 3 3.7 0 2-1.5 3.5-4 3.5z" fill="#000"/></svg>
);
const VSCodeIcon = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none"><rect width="48" height="48" rx="12" fill="#007ACC"/><path d="M36 14.5v19c0 1.1-1.2 1.7-2.1 1.1l-5.6-4.1-5.7 5.2c-.5.5-1.3.5-1.8 0l-7.2-7.2c-.5-.5-.5-1.3 0-1.8l5.7-5.2-5.6-4.1c-.9-.6-.9-2.1 0-2.7l7.2-7.2c.5-.5 1.3-.5 1.8 0l5.7 5.2 5.6-4.1c.9-.6 2.1 0 2.1 1.1z" fill="#fff"/></svg>
);

const AnimatedIconsBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {/* VSCode */}
    <div className="absolute left-10 top-24 animate-float-slow">
      <VSCodeIcon />
    </div>
    {/* Python */}
    <div className="absolute right-16 top-40 animate-float-medium">
      <PythonIcon />
    </div>
    {/* C */}
    <div className="absolute left-1/3 bottom-24 animate-float-fast">
      <CIcon />
    </div>
    {/* JS */}
    <div className="absolute right-1/4 bottom-16 animate-float-medium">
      <JSIcon />
    </div>
    {/* Code2 Lucide */}
    <div className="absolute left-1/2 top-1/2 animate-float-slow">
      <Code2 className="w-10 h-10 text-primary/40" />
    </div>
  </div>
);

// Composant pour le sélecteur de thème
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', icon: Sun, label: 'Clair' },
    { value: 'dark', icon: Moon, label: 'Sombre' },
    { value: 'system', icon: Monitor, label: 'Système' }
  ] as const;

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      {themes.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant={theme === value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme(value)}
          className="h-8 w-8 p-0"
          title={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
};

const Index = () => {
  const { user, loading } = useAuth();

  // Redirect to dashboard if authenticated
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedIconsBackground />
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Code2 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                CodeArena
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button asChild>
                <Link to="/auth">Commencer</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto text-center space-y-8">
          <div className="space-y-4">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              🚀 Plateforme de Coding Contest Nouvelle Génération
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                CodeArena
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Maîtrisez les algorithmes, participez à des concours épiques et progressez 
              avec la communauté des développeurs les plus passionnés.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-gradient-primary hover:shadow-primary text-lg px-8">
              <Link to="/auth">
                Commencer l'Aventure
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <a href="https://github.com/idrissziadi/Code-Arena" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-5 w-5" />
                Voir le Code
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pourquoi Choisir CodeArena ?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète pour développer vos compétences en programmation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-card/80 backdrop-blur-sm shadow-card border-border hover:shadow-primary/20 transition-all group">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>500+ Problèmes</CardTitle>
                <CardDescription>
                  Des défis algorithmiques de tous niveaux pour progresser à votre rythme
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm shadow-card border-border hover:shadow-accent/20 transition-all group">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Concours Épiques</CardTitle>
                <CardDescription>
                  Participez à des compétitions en temps réel et mesurez-vous aux meilleurs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm shadow-card border-border hover:shadow-warning/20 transition-all group">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-warning/20 transition-colors">
                  <Users className="h-6 w-6 text-warning" />
                </div>
                <CardTitle>Communauté Active</CardTitle>
                <CardDescription>
                  Échangez avec d'autres développeurs, partagez vos solutions et apprenez ensemble
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm shadow-card border-border hover:shadow-destructive/20 transition-all group">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                  <Zap className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle>Feedback Temps Réel</CardTitle>
                <CardDescription>
                  Obtenez un retour instantané sur vos solutions avec notre système de tests avancé
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-muted/20 relative z-10">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">500+</div>
              <div className="text-muted-foreground">Problèmes</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-accent">50+</div>
              <div className="text-muted-foreground">Concours</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-warning">1000+</div>
              <div className="text-muted-foreground">Développeurs</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-destructive">10k+</div>
              <div className="text-muted-foreground">Solutions</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Prêt à Relever le Défi ?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Rejoignez des milliers de développeurs qui améliorent leurs compétences chaque jour sur CodeArena
            </p>
          </div>
          
          <Button size="lg" asChild className="bg-gradient-accent hover:shadow-accent text-lg px-12">
            <Link to="/auth">
              Commencer Maintenant
              <Star className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4 relative z-10">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 CodeArena. Créé avec passion pour la communauté des développeurs.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
