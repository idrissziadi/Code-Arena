import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Send, 
  Download, 
  Upload, 
  Settings, 
  Maximize2, 
  Minimize2,
  Code2,
  Zap
} from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  languages: Array<{ id: string; name: string }>;
  onRun: () => void;
  onSubmit: () => void;
  isRunning?: boolean;
  isSubmitting?: boolean;
  className?: string;
}

const LANGUAGE_MAP: { [key: string]: string } = {
  'python': 'python',
  'javascript': 'javascript',
  'typescript': 'typescript',
  'java': 'java',
  'cpp': 'cpp',
  'c': 'c',
  'csharp': 'csharp',
  'go': 'go',
  'rust': 'rust',
  'php': 'php',
  'ruby': 'ruby',
  'kotlin': 'kotlin',
  'swift': 'swift',
};

const DEFAULT_CODE_TEMPLATES: { [key: string]: string } = {
  python: `# Votre solution ici
def solve():
    # Implémentez votre algorithme
    pass

if __name__ == "__main__":
    solve()`,
  
  javascript: `// Votre solution ici
function solve() {
    // Implémentez votre algorithme
}

solve();`,
  
  java: `public class Solution {
    public static void main(String[] args) {
        // Votre solution ici
        solve();
    }
    
    public static void solve() {
        // Implémentez votre algorithme
    }
}`,
  
  cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // Votre solution ici
    
    return 0;
}`,
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  onLanguageChange,
  languages,
  onRun,
  onSubmit,
  isRunning = false,
  isSubmitting = false,
  className = '',
}) => {
  const editorRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [fontSize, setFontSize] = React.useState(14);
  const [theme, setTheme] = React.useState('vs-dark');

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configuration du thème personnalisé "Neon Focus"
    monaco.editor.defineTheme('neon-focus', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'operator', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': '#0F0F23',
        'editor.foreground': '#E6E6E6',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#4FC3F7',
        'editor.selectionBackground': '#264F78',
        'editor.selectionHighlightBackground': '#ADD6FF26',
        'editorCursor.foreground': '#4FC3F7',
        'editor.findMatchBackground': '#515C6A',
        'editor.findMatchHighlightBackground': '#EA5C0055',
        'editor.linkedEditingBackground': '#FF00FF0A',
        'editorBracketMatch.background': '#0064001A',
        'editorBracketMatch.border': '#888888',
        'editorGutter.background': '#0F0F23',
        'editorGutter.modifiedBackground': '#1B81A8',
        'editorGutter.addedBackground': '#487E02',
        'editorGutter.deletedBackground': '#F85149',
        'scrollbarSlider.background': '#79797966',
        'scrollbarSlider.hoverBackground': '#646464B3',
        'scrollbarSlider.activeBackground': '#BFBFBF66',
      }
    });

    // Appliquer le thème personnalisé
    monaco.editor.setTheme('neon-focus');

    // Configuration de l'éditeur
    editor.updateOptions({
      fontSize: fontSize,
      fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", "SF Mono", Consolas, monospace',
      fontLigatures: true,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      minimap: { enabled: true },
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      glyphMargin: false,
      automaticLayout: true,
      wordWrap: 'on',
      wrappingIndent: 'indent',
      renderWhitespace: 'selection',
      renderControlCharacters: false,
      renderLineHighlight: 'line',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true,
      smoothScrolling: true,
      mouseWheelZoom: true,
      contextmenu: true,
      copyWithSyntaxHighlighting: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      suggest: {
        showKeywords: true,
        showSnippets: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true,
      },
    });

    // Raccourcis clavier personnalisés
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      onSubmit();
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    onLanguageChange(newLanguage);
    
    // Si le code est vide ou contient seulement le template par défaut, insérer le nouveau template
    if (!value.trim() || Object.values(DEFAULT_CODE_TEMPLATES).some(template => 
      value.trim() === template.trim()
    )) {
      const template = DEFAULT_CODE_TEMPLATES[newLanguage] || '';
      onChange(template);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 24);
    setFontSize(newSize);
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize: newSize });
    }
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 10);
    setFontSize(newSize);
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize: newSize });
    }
  };

  const resetCode = () => {
    const template = DEFAULT_CODE_TEMPLATES[language] || '';
    onChange(template);
  };

  const monacoLanguage = LANGUAGE_MAP[language] || language;

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''} shadow-card border-primary/20`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code2 className="h-5 w-5 text-primary" />
            Éditeur de Code
            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/30">
              <Zap className="h-3 w-3 mr-1" />
              Monaco Editor
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Contrôles de police */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={decreaseFontSize}
                className="h-8 w-8 p-0"
              >
                -
              </Button>
              <span className="text-xs text-muted-foreground min-w-[2rem] text-center">
                {fontSize}px
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={increaseFontSize}
                className="h-8 w-8 p-0"
              >
                +
              </Button>
            </div>

            {/* Sélecteur de langage */}
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40 h-8 bg-background/50">
                <SelectValue placeholder="Langage" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.id} value={lang.id}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Boutons d'action */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetCode}
              className="h-8"
            >
              Reset
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Barre d'actions principale */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={onRun}
              disabled={isRunning}
              size="sm"
              variant="outline"
              className="bg-primary/10 border-primary/30 hover:bg-primary/20"
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Exécution...' : 'Exécuter'}
            </Button>
            
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              size="sm"
              className="bg-gradient-primary hover:shadow-primary"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Soumission...' : 'Soumettre'}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Enter</kbd>
            <span>pour exécuter</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+Enter</kbd>
            <span>pour soumettre</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className={`${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[500px]'} border border-border/50 rounded-b-lg overflow-hidden`}>
          <Editor
            height="100%"
            language={monacoLanguage}
            value={value}
            onChange={(val) => onChange(val || '')}
            onMount={handleEditorDidMount}
            theme="neon-focus"
            options={{
              selectOnLineNumbers: true,
              automaticLayout: true,
            }}
            loading={
              <div className="flex items-center justify-center h-full bg-background">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span>Chargement de l'éditeur...</span>
                </div>
              </div>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};