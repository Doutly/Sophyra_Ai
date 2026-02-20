import { useState, useRef } from 'react';
import { X, Play, Trash2, ChevronDown, Code2, Terminal } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'java', label: 'Java' },
  { id: 'go', label: 'Go' },
  { id: 'cpp', label: 'C++' },
];

const STARTERS: Record<string, string> = {
  javascript: `// Write your solution here\nfunction solution(input) {\n  \n}\n`,
  python: `# Write your solution here\ndef solution(input):\n    pass\n`,
  typescript: `// Write your solution here\nfunction solution(input: any): any {\n  \n}\n`,
  java: `// Write your solution here\nclass Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n`,
  go: `// Write your solution here\npackage main\n\nfunc solution(input interface{}) interface{} {\n    return nil\n}\n`,
  cpp: `// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n`,
};

export default function CodeEditorPanel({ onClose }: Props) {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(STARTERS['javascript']);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleLanguageChange = (langId: string) => {
    setLanguage(langId);
    setCode(STARTERS[langId] || '');
    setOutput(null);
    setShowLangMenu(false);
  };

  const handleRun = () => {
    if (language !== 'javascript') {
      setOutput(`[${LANGUAGES.find((l) => l.id === language)?.label}] Code submitted. Results will appear after review.`);
      return;
    }
    setRunning(true);
    setOutput(null);
    setTimeout(() => {
      try {
        const logs: string[] = [];
        const mockConsole = { log: (...args: any[]) => logs.push(args.map(String).join(' ')) };
        const fn = new Function('console', code);
        fn(mockConsole);
        setOutput(logs.length > 0 ? logs.join('\n') : '(No output)');
      } catch (err: any) {
        setOutput(`Error: ${err.message}`);
      }
      setRunning(false);
    }, 300);
  };

  const handleClear = () => {
    setCode(STARTERS[language] || '');
    setOutput(null);
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      requestAnimationFrame(() => {
        el.selectionStart = start + 2;
        el.selectionEnd = start + 2;
      });
    }
  };

  const currentLang = LANGUAGES.find((l) => l.id === language);
  const lineCount = code.split('\n').length;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-swiss-lg overflow-hidden flex flex-col" style={{ height: '280px' }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 bg-slate-800 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <Code2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-300">Code Challenge</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowLangMenu((v) => !v)}
              className="flex items-center space-x-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border border-slate-600"
            >
              <span>{currentLang?.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showLangMenu && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      lang.id === language
                        ? 'bg-brand-electric/20 text-brand-electric-light font-semibold'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleClear}
            className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 transition-colors text-xs px-2 py-1 rounded hover:bg-slate-700"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center space-x-1 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white rounded-md px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3" />
            <span>{running ? 'Running...' : 'Run'}</span>
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className={`flex flex-col ${output !== null ? 'w-2/3' : 'w-full'} transition-all min-h-0`}>
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-col items-end pr-2 pt-2 pb-2 bg-slate-900 select-none min-w-[36px]">
              {Array.from({ length: lineCount }).map((_, i) => (
                <span key={i} className="text-slate-600 font-mono text-xs leading-5 block">
                  {i + 1}
                </span>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleTab}
              spellCheck={false}
              className="flex-1 bg-slate-900 text-slate-100 font-mono text-xs leading-5 resize-none outline-none p-2 pr-4 overflow-auto placeholder:text-slate-600 caret-white selection:bg-brand-electric/30"
              style={{ tabSize: 2 }}
            />
          </div>
        </div>

        {output !== null && (
          <div className="w-1/3 border-l border-slate-700 flex flex-col min-h-0">
            <div className="flex items-center space-x-1.5 px-3 py-2 border-b border-slate-700 bg-slate-800 flex-shrink-0">
              <Terminal className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Output</span>
            </div>
            <div className="flex-1 overflow-auto p-3 bg-slate-950">
              <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap leading-relaxed">{output}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
