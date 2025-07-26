import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSolutions } from '@/hooks/useSolutions';
import { useAuth } from '@/components/auth/AuthProvider';
import { Lightbulb, Loader2 } from 'lucide-react';

interface SolutionDialogProps {
  submissionId: string;
  problemId: string;
  isVisible: boolean;
  children: React.ReactNode;
}

export function SolutionDialog({ submissionId, problemId, isVisible, children }: SolutionDialogProps) {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const { proposerSolution, loading } = useSolutions();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user || !explanation.trim()) return;

    const success = await proposerSolution(problemId, submissionId, explanation, user.id);
    if (success) {
      setOpen(false);
      setExplanation('');
    }
  };

  if (!isVisible) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Proposer comme solution
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 Votre soumission a été acceptée ! Vous pouvez maintenant la proposer comme solution 
              en ajoutant une explication détaillée qui aidera d'autres utilisateurs à comprendre 
              votre approche.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="explanation">Explication de votre solution *</Label>
            <Textarea
              id="explanation"
              placeholder="Expliquez votre approche, l'algorithme utilisé, la complexité temporelle et spatiale, et les points clés de votre solution..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Une bonne explication inclut : l'algorithme utilisé, la complexité, les cas particuliers traités, etc.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading || !explanation.trim()}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Proposer la solution
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}