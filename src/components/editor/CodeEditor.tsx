import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string | undefined) => void;
}

export const CodeEditor = ({ code, language, onChange }: CodeEditorProps) => {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={code}
        onChange={onChange}
        theme="vs-dark"
        loading={
          <div className="h-full w-full flex items-center justify-center bg-editor">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        }
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          fontLigatures: true,
          minimap: { enabled: true, scale: 0.8 },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
};