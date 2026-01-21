import { useState, useCallback } from 'react';
import { Play, Copy, Check, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { executeCode, type ExecutionResult } from '../../services/codeExecution';
import type { SandboxLanguage } from '../../types';

interface RunnableCodeBlockProps {
  code: string;
  language: SandboxLanguage;
}

export function RunnableCodeBlock({ code, language }: RunnableCodeBlockProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setShowOutput(true);
    try {
      const executionResult = await executeCode(code, language);
      setResult(executionResult);
    } catch (err) {
      setResult({
        success: false,
        output: '',
        error: err instanceof Error ? err.message : 'Unknown error',
        executionTime: 0,
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, language]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied
    }
  }, [code]);

  const languageLabel = language === 'python' ? 'Python' : 'JavaScript';

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-700">
      {/* Header with language label and action buttons */}
      <div className="flex items-center justify-between bg-gray-800 px-3 py-1.5 border-b border-gray-700">
        <span className="text-xs font-medium text-gray-400">{languageLabel}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded transition-colors"
            title="Run code"
          >
            {isRunning ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            Run
          </button>
        </div>
      </div>

      {/* Code block */}
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.875rem',
        }}
      >
        {code}
      </SyntaxHighlighter>

      {/* Output section */}
      {(showOutput || result) && (
        <div className="border-t border-gray-700">
          <button
            onClick={() => setShowOutput(!showOutput)}
            className="flex items-center gap-1 w-full px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-750 transition-colors"
          >
            {showOutput ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            Output
            {result && (
              <span className="ml-2 text-gray-500">
                ({result.executionTime.toFixed(0)}ms)
              </span>
            )}
          </button>
          {showOutput && (
            <div className="bg-gray-900 p-3 text-sm font-mono">
              {isRunning ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </div>
              ) : result ? (
                result.success ? (
                  <pre className="text-gray-100 whitespace-pre-wrap break-words">
                    {result.output}
                  </pre>
                ) : (
                  <pre className="text-red-400 whitespace-pre-wrap break-words">
                    Error: {result.error}
                  </pre>
                )
              ) : (
                <span className="text-gray-500 italic">
                  Click &quot;Run&quot; to execute the code
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
