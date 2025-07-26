import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Database,
  Search
} from 'lucide-react';

interface DataStructureManagerProps {
  dataStructures: any[];
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  newDataStructure: { name: string; description: string };
  setNewDataStructure: (ds: { name: string; description: string }) => void;
  onCreateDataStructure: () => void;
  onDeleteDataStructure: (id: string) => void;
}

export function DataStructureManager({
  dataStructures,
  showCreateForm,
  setShowCreateForm,
  newDataStructure,
  setNewDataStructure,
  onCreateDataStructure,
  onDeleteDataStructure
}: DataStructureManagerProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredDataStructures = dataStructures.filter(ds =>
    ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ds.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          Gestion des Structures de Données
        </h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer une structure
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher des structures..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Créer une nouvelle structure de données</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ds-name">Nom</Label>
              <Input
                id="ds-name"
                value={newDataStructure.name}
                onChange={(e) => setNewDataStructure({ ...newDataStructure, name: e.target.value })}
                placeholder="ex: Arbre Binaire, Graphe, Pile..."
              />
            </div>
            
            <div>
              <Label htmlFor="ds-description">Description</Label>
              <Textarea
                id="ds-description"
                value={newDataStructure.description}
                onChange={(e) => setNewDataStructure({ ...newDataStructure, description: e.target.value })}
                placeholder="Description de la structure de données..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={onCreateDataStructure}>
                Créer la structure
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Structures List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Structures existantes ({filteredDataStructures.length})</CardTitle>
          <CardDescription>
            Gérez les structures de données utilisées pour catégoriser les problèmes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDataStructures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDataStructures.map((dataStructure) => (
                <Card key={dataStructure.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{dataStructure.name}</CardTitle>
                      <div className="flex items-center space-x-1">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => onDeleteDataStructure(dataStructure.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {dataStructure.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {dataStructure.description}
                      </p>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      Structure de données
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Aucune structure trouvée' : 'Aucune structure de données'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Aucune structure ne correspond à votre recherche.'
                  : 'Commencez par créer votre première structure de données.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une structure
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}