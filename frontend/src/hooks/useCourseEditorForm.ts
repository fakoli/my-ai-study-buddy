import { useState, useCallback } from 'react';
import type { CourseInstructions, CourseDifficulty, Course, CourseCreate, CourseUpdate } from '../types';

export interface CourseFormState {
  title: string;
  description: string;
  difficulty: CourseDifficulty;
  tags: string[];
  tagInput: string;
  aiEnabled: boolean;
  instructions: CourseInstructions;
}

const DEFAULT_INSTRUCTIONS: CourseInstructions = {
  purpose: '',
  target_audience: '',
  learning_objectives: [''],
  tone: '',
  additional_context: undefined,
};

export function useCourseEditorForm() {
  const [formState, setFormState] = useState<CourseFormState>({
    title: '',
    description: '',
    difficulty: 'beginner',
    tags: [],
    tagInput: '',
    aiEnabled: false,
    instructions: DEFAULT_INSTRUCTIONS,
  });

  // Basic field setters
  const setTitle = useCallback((title: string) => {
    setFormState((prev) => ({ ...prev, title }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setFormState((prev) => ({ ...prev, description }));
  }, []);

  const setDifficulty = useCallback((difficulty: CourseDifficulty) => {
    setFormState((prev) => ({ ...prev, difficulty }));
  }, []);

  const setAiEnabled = useCallback((aiEnabled: boolean) => {
    setFormState((prev) => ({ ...prev, aiEnabled }));
  }, []);

  const setTagInput = useCallback((tagInput: string) => {
    setFormState((prev) => ({ ...prev, tagInput }));
  }, []);

  // Tag management
  const addTag = useCallback(() => {
    const trimmed = formState.tagInput.trim().toLowerCase();
    if (trimmed && !formState.tags.includes(trimmed)) {
      setFormState((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmed],
        tagInput: '',
      }));
    }
  }, [formState.tagInput, formState.tags]);

  const removeTag = useCallback((tag: string) => {
    setFormState((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }, []);

  // Instructions management
  const updateInstructions = useCallback((updates: Partial<CourseInstructions>) => {
    setFormState((prev) => ({
      ...prev,
      instructions: { ...prev.instructions, ...updates },
    }));
  }, []);

  // Learning objectives management
  const addObjective = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      instructions: {
        ...prev.instructions,
        learning_objectives: [...prev.instructions.learning_objectives, ''],
      },
    }));
  }, []);

  const updateObjective = useCallback((index: number, value: string) => {
    setFormState((prev) => {
      const updated = [...prev.instructions.learning_objectives];
      updated[index] = value;
      return {
        ...prev,
        instructions: { ...prev.instructions, learning_objectives: updated },
      };
    });
  }, []);

  const removeObjective = useCallback((index: number) => {
    setFormState((prev) => {
      if (prev.instructions.learning_objectives.length <= 1) return prev;
      return {
        ...prev,
        instructions: {
          ...prev.instructions,
          learning_objectives: prev.instructions.learning_objectives.filter((_, i) => i !== index),
        },
      };
    });
  }, []);

  const moveObjective = useCallback((index: number, direction: 'up' | 'down') => {
    setFormState((prev) => {
      const objectives = prev.instructions.learning_objectives;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= objectives.length) return prev;

      const updated = [...objectives];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return {
        ...prev,
        instructions: { ...prev.instructions, learning_objectives: updated },
      };
    });
  }, []);

  // Populate from existing course
  const populateFromCourse = useCallback((course: Course) => {
    setFormState({
      title: course.title,
      description: course.description || '',
      difficulty: course.difficulty,
      tags: course.tags,
      tagInput: '',
      aiEnabled: course.ai_enabled,
      instructions: course.instructions || DEFAULT_INSTRUCTIONS,
    });
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormState({
      title: '',
      description: '',
      difficulty: 'beginner',
      tags: [],
      tagInput: '',
      aiEnabled: false,
      instructions: DEFAULT_INSTRUCTIONS,
    });
  }, []);

  // Get create data
  const getCreateData = useCallback((): CourseCreate => {
    const { title, description, difficulty, tags, aiEnabled, instructions } = formState;
    return {
      title: title.trim(),
      description: description.trim() || undefined,
      difficulty,
      tags,
      ai_enabled: aiEnabled,
      instructions: aiEnabled
        ? {
            ...instructions,
            learning_objectives: instructions.learning_objectives.filter((o) => o.trim()),
            additional_context: instructions.additional_context || undefined,
          }
        : undefined,
    };
  }, [formState]);

  // Get update data
  const getUpdateData = useCallback((): CourseUpdate => {
    const { title, description, difficulty, tags, aiEnabled, instructions } = formState;
    return {
      title: title.trim(),
      description: description.trim() || undefined,
      difficulty,
      tags,
      ai_enabled: aiEnabled,
      instructions: aiEnabled
        ? {
            ...instructions,
            learning_objectives: instructions.learning_objectives.filter((o) => o.trim()),
            additional_context: instructions.additional_context || undefined,
          }
        : undefined,
    };
  }, [formState]);

  return {
    formState,
    setTitle,
    setDescription,
    setDifficulty,
    setAiEnabled,
    setTagInput,
    addTag,
    removeTag,
    updateInstructions,
    addObjective,
    updateObjective,
    removeObjective,
    moveObjective,
    populateFromCourse,
    resetForm,
    getCreateData,
    getUpdateData,
  };
}
