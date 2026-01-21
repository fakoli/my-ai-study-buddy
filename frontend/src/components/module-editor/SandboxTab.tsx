import { Play, Loader2, Trash2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { executeCode, type ExecutionResult } from '../../services/codeExecution';
import type { SandboxLanguage, SandboxData } from '../../types';

interface SandboxTabProps {
  sandbox: SandboxData | null;
  onChange: (sandbox: SandboxData | null) => void;
}

const DEFAULT_SANDBOX: SandboxData = {
  language: 'python',
  starter_code: '',
  solution_code: '',
  instructions: '',
};

export function SandboxTab({ sandbox, onChange }: SandboxTabProps) {
  const [testResult, setTestResult] = useState<ExecutionResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testingType, setTestingType] = useState<'starter' | 'solution' | null>(null);

  const currentSandbox = sandbox || DEFAULT_SANDBOX;

  const handleEnable = useCallback(() => {
    onChange(DEFAULT_SANDBOX);
  }, [onChange]);

  const handleDisable = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleLanguageChange = useCallback(
    (language: SandboxLanguage) => {
      onChange({ ...currentSandbox, language });
    },
    [currentSandbox, onChange]
  );

  const handleStarterCodeChange = useCallback(
    (starter_code: string) => {
      onChange({ ...currentSandbox, starter_code });
    },
    [currentSandbox, onChange]
  );

  const handleSolutionCodeChange = useCallback(
    (solution_code: string) => {
      onChange({ ...currentSandbox, solution_code: solution_code || undefined });
    },
    [currentSandbox, onChange]
  );

  const handleInstructionsChange = useCallback(
    (instructions: string) => {
      onChange({ ...currentSandbox, instructions: instructions || undefined });
    },
    [currentSandbox, onChange]
  );

  const handleTestCode = useCallback(
    async (type: 'starter' | 'solution') => {
      const code = type === 'starter' ? currentSandbox.starter_code : currentSandbox.solution_code;
      if (!code?.trim()) return;

      setIsTesting(true);
      setTestingType(type);
      try {
        const result = await executeCode(code, currentSandbox.language);
        setTestResult(result);
      } catch (err) {
        setTestResult({
          success: false,
          output: '',
          error: err instanceof Error ? err.message : 'Unknown error',
          executionTime: 0,
        });
      } finally {
        setIsTesting(false);
        setTestingType(null);
      }
    },
    [currentSandbox]
  );

  if (!sandbox) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Play className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Code Sandbox</h3>
        <p className="text-gray-500 mb-4 max-w-md">
          Add a code sandbox to let learners practice coding exercises directly in the module.
        </p>
        <button
          onClick={handleEnable}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Enable Code Sandbox
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with remove button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Code Sandbox Configuration</h3>
        <button
          onClick={handleDisable}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Remove Sandbox
        </button>
      </div>

      {/* Language Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleLanguageChange('python')}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              currentSandbox.language === 'python'
                ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Python
          </button>
          <button
            onClick={() => handleLanguageChange('javascript')}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              currentSandbox.language === 'javascript'
                ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            JavaScript
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={currentSandbox.instructions || ''}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          placeholder="Describe what the learner should accomplish in this exercise..."
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        />
      </div>

      {/* Starter Code */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Starter Code</label>
          <button
            onClick={() => handleTestCode('starter')}
            disabled={isTesting || !currentSandbox.starter_code.trim()}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            {isTesting && testingType === 'starter' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            Test
          </button>
        </div>
        <textarea
          value={currentSandbox.starter_code}
          onChange={(e) => handleStarterCodeChange(e.target.value)}
          placeholder={`# ${currentSandbox.language === 'python' ? 'def solution():' : 'function solution() {'}\n#     Write your code here...\n${currentSandbox.language === 'python' ? '' : '# }'}`}
          className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm bg-gray-900 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          spellCheck={false}
        />
      </div>

      {/* Solution Code */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Solution Code{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <button
            onClick={() => handleTestCode('solution')}
            disabled={isTesting || !currentSandbox.solution_code?.trim()}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            {isTesting && testingType === 'solution' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            Test
          </button>
        </div>
        <textarea
          value={currentSandbox.solution_code || ''}
          onChange={(e) => handleSolutionCodeChange(e.target.value)}
          placeholder="Provide the solution code that learners can reveal..."
          className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm bg-gray-900 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          spellCheck={false}
        />
      </div>

      {/* Test Output */}
      {testResult && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Test Output</span>
            <span className="text-xs text-gray-500">{testResult.executionTime.toFixed(0)}ms</span>
          </div>
          <div className="bg-gray-900 p-4">
            {testResult.success ? (
              <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap break-words">
                {testResult.output}
              </pre>
            ) : (
              <pre className="text-sm text-red-400 font-mono whitespace-pre-wrap break-words">
                Error: {testResult.error}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
