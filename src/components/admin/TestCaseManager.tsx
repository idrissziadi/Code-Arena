import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  Eye, 
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestCaseManagerProps {
  problems: any[];
  selectedProblem: string | null;
  onSelectProblem: (problemId: string | null) => void;
}

interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  is_public: boolean;
}

export function TestCaseManager({
  problems,
  selectedProblem,
  onSelectProblem
}: TestCaseManagerProps) {
  const { toast } = useToast();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [newTestCase, setNewTestCase] = useState({
    input: '',
    expected_output: '',
    is_public: true
  });

  useEffect(() => {
    if (selectedProblem) {
      fetchTestCases();
    }
  }, [selectedProblem]);

  const fetchTestCases = async () => {
    if (!selectedProblem) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .eq('problem_id', selectedProblem)
        .order('is_public', { ascending: false });

      if (error) throw error;
      setTestCases(data || []);
    } catch (error) {
      console.error('Error fetching test cases:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les cas de test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestCase = async () => {
    if (!selectedProblem) return;

    try {
      const { error } = await supabase
        .from('test_cases')
        .insert({
          problem_id: selectedProblem,
          ...newTestCase
        });

      if (error) throw error;

      toast({
        title: "Cas de test créé",
        description: "Le nouveau cas de test a été ajouté"
      });

      setShowCreateForm(false);
      setNewTestCase({ input: '', expected_output: '', is_public: true });
      fetchTestCases();
    } catch (error) {
      console.error('Error creating test case:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le cas de test",
        variant: "destructive"
      });
    }
  };

  const updateTestCase = async (testCase: TestCase) => {
    try {
      const { error } = await supabase
        .from('test_cases')
        .update({
          input: testCase.input,
          expected_output: testCase.expected_output,
          is_public: testCase.is_public
        })
        .eq('id', testCase.id);

      if (error) throw error;

      toast({
        title: "Cas de test mis à jour",
        description: "Les modifications ont été sauvegardées"
      });

      setEditingTestCase(null);
      fetchTestCases();
    } catch (error) {
      console.error('Error updating test case:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le cas de test",
        variant: "destructive"
      });
    }
  };

  const deleteTestCase = async (testCaseId: string) => {
    try {
      const { error } = await supabase
        .from('test_cases')
        .delete()
        .eq('id', testCaseId);

      if (error) throw error;

      toast({
        title: "Cas de test supprimé",
        description: "Le cas de test a été supprimé"
      });

      fetchTestCases();
    } catch (error) {
      console.error('Error deleting test case:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le cas de test",
        variant: "destructive"
      });
    }
  };

  const selectedProblemData = problems.find(p => p.id === selectedProblem);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Gestion des Cas de Test
          </h2>
          <p className="text-muted-foreground">
            Ajoutez et gérez les cas de test pour chaque problème
          </p>
        </div>
      </div>

      {/* Problem Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un problème</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProblem || ''} onValueChange={onSelectProblem}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un problème..." />
            </SelectTrigger>
            <SelectContent>
              {problems.map((problem) => (
                <SelectItem key={problem.id} value={problem.id}>
                  <div className="flex items-center gap-2">
                    <span>{problem.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {problem.difficulty}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProblem && (
        <>
          {/* Problem Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Cas de test pour: {selectedProblemData?.title}</span>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un cas de test
                </Button>
              </CardTitle>
              <CardDescription>
                Gérez les cas de test publics (visibles par les utilisateurs) et privés (pour l'évaluation)
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Create Form */}
          {showCreateForm && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle>Nouveau cas de test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-input">Entrée (stdin)</Label>
                    <Textarea
                      id="new-input"
                      value={newTestCase.input}
                      onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                      placeholder="Données d'entrée..."
                      className="min-h-[120px] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-output">Sortie attendue (stdout)</Label>
                    <Textarea
                      id="new-output"
                      value={newTestCase.expected_output}
                      onChange={(e) => setNewTestCase({ ...newTestCase, expected_output: e.target.value })}
                      placeholder="Sortie attendue..."
                      className="min-h-[120px] font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="new-public"
                    checked={newTestCase.is_public}
                    onCheckedChange={(checked) => setNewTestCase({ ...newTestCase, is_public: checked })}
                  />
                  <Label htmlFor="new-public" className="flex items-center gap-2">
                    {newTestCase.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    Cas de test public (visible par les utilisateurs)
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={createTestCase}>
                    <Save className="h-4 w-4 mr-2" />
                    Créer le cas de test
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Cases List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Cas de test existants ({testCases.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Chargement...</p>
                </div>
              ) : testCases.length > 0 ? (
                <div className="space-y-4">
                  {testCases.map((testCase, index) => (
                    <Card key={testCase.id} className={`border-2 ${testCase.is_public ? 'border-green-200' : 'border-blue-200'}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Cas de test #{index + 1}</span>
                            <Badge variant={testCase.is_public ? 'default' : 'secondary'}>
                              {testCase.is_public ? (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Privé
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingTestCase(testCase)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteTestCase(testCase.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {editingTestCase?.id === testCase.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Entrée</Label>
                                <Textarea
                                  value={editingTestCase.input}
                                  onChange={(e) => setEditingTestCase({ ...editingTestCase, input: e.target.value })}
                                  className="min-h-[100px] font-mono text-sm"
                                />
                              </div>
                              <div>
                                <Label>Sortie attendue</Label>
                                <Textarea
                                  value={editingTestCase.expected_output}
                                  onChange={(e) => setEditingTestCase({ ...editingTestCase, expected_output: e.target.value })}
                                  className="min-h-[100px] font-mono text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={editingTestCase.is_public}
                                onCheckedChange={(checked) => setEditingTestCase({ ...editingTestCase, is_public: checked })}
                              />
                              <Label className="flex items-center gap-2">
                                {editingTestCase.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                Public
                              </Label>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => updateTestCase(editingTestCase)}>
                                <Save className="h-4 w-4 mr-2" />
                                Sauvegarder
                              </Button>
                              <Button variant="outline" onClick={() => setEditingTestCase(null)}>
                                <X className="h-4 w-4 mr-2" />
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Entrée</Label>
                              <pre className="mt-1 p-3 bg-muted rounded text-sm font-mono whitespace-pre-wrap">
                                {testCase.input || '(vide)'}
                              </pre>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Sortie attendue</Label>
                              <pre className="mt-1 p-3 bg-muted rounded text-sm font-mono whitespace-pre-wrap">
                                {testCase.expected_output || '(vide)'}
                              </pre>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Aucun cas de test</h3>
                  <p className="text-muted-foreground mb-4">
                    Ce problème n'a pas encore de cas de test.
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter le premier cas de test
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}