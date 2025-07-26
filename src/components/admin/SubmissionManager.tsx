import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Code, 
  Clock, 
  HardDrive,
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface SubmissionManagerProps {
  submissions: any[];
  onUpdateVerdict: (submissionId: string, newVerdict: string) => void;
  onDeleteSubmission: (submissionId: string) => void;
  onRefresh: () => void;
}

const VERDICTS = [
  'Accepted',
  'Wrong Answer',
  'Time Limit Exceeded',
  'Memory Limit Exceeded',
  'Runtime Error',
  'Compilation Error',
  'Pending',
  'Processing'
];

export function SubmissionManager({
  submissions,
  onUpdateVerdict,
  onDeleteSubmission,
  onRefresh
}: SubmissionManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showCodeDialog, setShowCodeDialog] = useState(false);

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.users?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.problems?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.languages?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVerdict = verdictFilter === 'all' || submission.verdict === verdictFilter;
    
    return matchesSearch && matchesVerdict;
  });

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Accepted':
        return 'bg-green-500 text-white';
      case 'Wrong Answer':
        return 'bg-red-500 text-white';
      case 'Time Limit Exceeded':
        return 'bg-yellow-500 text-white';
      case 'Memory Limit Exceeded':
        return 'bg-orange-500 text-white';
      case 'Runtime Error':
        return 'bg-red-600 text-white';
      case 'Compilation Error':
        return 'bg-purple-500 text-white';
      case 'Pending':
      case 'Processing':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'Accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'Wrong Answer':
      case 'Runtime Error':
      case 'Compilation Error':
        return <XCircle className="h-4 w-4" />;
      case 'Time Limit Exceeded':
      case 'Memory Limit Exceeded':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const viewSubmissionCode = (submission: any) => {
    setSelectedSubmission(submission);
    setShowCodeDialog(true);
  };

  const verdictStats = submissions.reduce((acc, sub) => {
    acc[sub.verdict] = (acc[sub.verdict] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Gestion des Soumissions
          </h2>
          <p className="text-muted-foreground">
            Consultez et gérez toutes les soumissions de la plateforme
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(verdictStats).map(([verdict, count]) => (
          <Card key={verdict} className="text-center">
            <CardContent className="p-4">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${getVerdictColor(verdict)}`}>
                {getVerdictIcon(verdict)}
                <span className="font-medium">{String(count)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{verdict}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par utilisateur, problème ou langage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={verdictFilter} onValueChange={setVerdictFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par verdict" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les verdicts</SelectItem>
                {VERDICTS.map((verdict) => (
                  <SelectItem key={verdict} value={verdict}>
                    {verdict}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Soumissions ({filteredSubmissions.length})</CardTitle>
          <CardDescription>
            Liste de toutes les soumissions avec possibilité de modification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{submission.users?.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{submission.problems?.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {submission.languages?.name}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>{new Date(submission.created_at).toLocaleString()}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {submission.execution_time || 0}ms
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {submission.memory_used || 0}KB
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Verdict */}
                    <div className="flex items-center gap-2">
                      <Select
                        value={submission.verdict}
                        onValueChange={(newVerdict) => onUpdateVerdict(submission.id, newVerdict)}
                      >
                        <SelectTrigger className="w-40">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getVerdictColor(submission.verdict)}`}>
                            {getVerdictIcon(submission.verdict)}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {VERDICTS.map((verdict) => (
                            <SelectItem key={verdict} value={verdict}>
                              <div className="flex items-center gap-2">
                                {getVerdictIcon(verdict)}
                                {verdict}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewSubmissionCode(submission)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteSubmission(submission.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredSubmissions.length === 0 && (
              <div className="text-center py-12">
                <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Aucune soumission trouvée</h3>
                <p className="text-muted-foreground">
                  {searchTerm || verdictFilter !== 'all'
                    ? "Aucune soumission ne correspond à vos critères de recherche."
                    : "Il n'y a pas encore de soumissions."
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Code Viewer Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Code de la soumission
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    {getVerdictIcon(selectedSubmission.verdict)}
                    <span className="font-medium">{selectedSubmission.verdict}</span>
                  </div>
                  <Badge variant="outline">
                    {selectedSubmission.languages?.name}
                  </Badge>
                  <span className="text-sm">
                    Par {selectedSubmission.users?.username}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedSubmission.created_at).toLocaleString()}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Problème:</span>
                  <p className="text-muted-foreground">{selectedSubmission.problems?.title}</p>
                </div>
                <div>
                  <span className="font-medium">Temps:</span>
                  <p className="text-muted-foreground">{selectedSubmission.execution_time || 0}ms</p>
                </div>
                <div>
                  <span className="font-medium">Mémoire:</span>
                  <p className="text-muted-foreground">{selectedSubmission.memory_used || 0}KB</p>
                </div>
              </div>
              
              <ScrollArea className="h-[400px] w-full border rounded-lg">
                <pre className="p-4 text-sm bg-muted/30">
                  <code>
                    {selectedSubmission.code}
                  </code>
                </pre>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}