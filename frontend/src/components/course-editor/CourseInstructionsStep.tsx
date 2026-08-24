import { Sparkles, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import type { CourseInstructions } from '../../types';

export interface CourseInstructionsStepProps {
  instructions: CourseInstructions;
  onUpdateInstructions: (updates: Partial<CourseInstructions>) => void;
  onAddObjective: () => void;
  onUpdateObjective: (index: number, value: string) => void;
  onRemoveObjective: (index: number) => void;
  onMoveObjective: (index: number, direction: 'up' | 'down') => void;
}

export function CourseInstructionsStep({
  instructions,
  onUpdateInstructions,
  onAddObjective,
  onUpdateObjective,
  onRemoveObjective,
  onMoveObjective,
}: CourseInstructionsStepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">AI Instructions</p>
            <p className="text-sm text-amber-700 mt-1">
              These instructions guide AI generation for all modules. Think of this like a
              system prompt for the model.
            </p>
          </div>
        </div>
      </div>

      <Textarea
        id="purpose"
        label="Purpose"
        value={instructions.purpose}
        onChange={(e) => onUpdateInstructions({ purpose: e.target.value })}
        placeholder="e.g., Prepare for FAANG coding interviews focusing on data structures and algorithms"
        rows={3}
        required
      />

      <Textarea
        id="target_audience"
        label="Target Audience"
        value={instructions.target_audience}
        onChange={(e) => onUpdateInstructions({ target_audience: e.target.value })}
        placeholder="e.g., Senior engineers with 5+ years experience looking to transition to big tech"
        rows={2}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Learning Objectives
        </label>
        <div className="space-y-2">
          {instructions.learning_objectives.map((objective, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => onMoveObjective(index, 'up')}
                  disabled={index === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveObjective(index, 'down')}
                  disabled={index === instructions.learning_objectives.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <span className="text-gray-400 text-sm w-6 text-center">{index + 1}</span>
              <input
                type="text"
                value={objective}
                onChange={(e) => onUpdateObjective(index, e.target.value)}
                placeholder={`Objective ${index + 1}`}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {instructions.learning_objectives.length > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onRemoveObjective(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={onAddObjective}>
            <Plus className="w-4 h-4 mr-1" />
            Add Objective
          </Button>
        </div>
      </div>

      <Textarea
        id="tone"
        label="Tone & Style"
        value={instructions.tone}
        onChange={(e) => onUpdateInstructions({ tone: e.target.value })}
        placeholder="e.g., Technical but approachable, visual-first approach with diagrams and examples"
        rows={2}
        required
      />

      <Textarea
        id="additional_context"
        label="Additional Context (optional)"
        value={instructions.additional_context || ''}
        onChange={(e) =>
          onUpdateInstructions({
            additional_context: e.target.value || undefined,
          })
        }
        placeholder="Any other guidance for the AI when generating content..."
        rows={3}
      />
    </div>
  );
}
