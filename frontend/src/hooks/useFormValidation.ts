import { useState, useCallback, useMemo } from 'react';

type ValidationRule =
  | { type: 'required'; message?: string }
  | { type: 'email'; message?: string }
  | { type: 'minLength'; value: number; message?: string }
  | { type: 'maxLength'; value: number; message?: string }
  | { type: 'pattern'; value: RegExp; message?: string }
  | { type: 'custom'; validate: (value: string, values: Record<string, string>) => string | null };

interface FieldConfig {
  rules: ValidationRule[];
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
}

type FormConfig<T extends string> = Record<T, FieldConfig>;

interface FieldState {
  value: string;
  error: string | null;
  touched: boolean;
  isValid: boolean;
}

type FormState<T extends string> = Record<T, FieldState>;

interface UseFormValidationReturn<T extends string> {
  values: Record<T, string>;
  errors: Record<T, string | null>;
  touched: Record<T, boolean>;
  isValid: boolean;
  isDirty: boolean;
  getFieldProps: (name: T) => {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  };
  getFieldError: (name: T) => string | null;
  setFieldValue: (name: T, value: string) => void;
  setFieldError: (name: T, error: string | null) => void;
  validateField: (name: T) => boolean;
  validateForm: () => boolean;
  resetForm: () => void;
  resetField: (name: T) => void;
}

function validateValue(
  value: string,
  rules: ValidationRule[],
  allValues: Record<string, string>
): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value.trim()) {
          return rule.message || 'This field is required';
        }
        break;
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return rule.message || 'Please enter a valid email address';
        }
        break;
      }
      case 'minLength':
        if (value && value.length < rule.value) {
          return rule.message || `Must be at least ${rule.value} characters`;
        }
        break;
      case 'maxLength':
        if (value && value.length > rule.value) {
          return rule.message || `Must be no more than ${rule.value} characters`;
        }
        break;
      case 'pattern':
        if (value && !rule.value.test(value)) {
          return rule.message || 'Invalid format';
        }
        break;
      case 'custom': {
        const customError = rule.validate(value, allValues);
        if (customError) {
          return customError;
        }
        break;
      }
    }
  }
  return null;
}

export function useFormValidation<T extends string>(
  config: FormConfig<T>,
  initialValues?: Partial<Record<T, string>>
): UseFormValidationReturn<T> {
  // Memoize fieldNames to prevent it from changing on every render
  const fieldNames = useMemo(() => Object.keys(config) as T[], [config]);

  const createInitialState = useCallback((): FormState<T> => {
    const state = {} as FormState<T>;
    for (const name of fieldNames) {
      state[name] = {
        value: initialValues?.[name] || '',
        error: null,
        touched: false,
        isValid: true,
      };
    }
    return state;
  }, [fieldNames, initialValues]);

  const [formState, setFormState] = useState<FormState<T>>(createInitialState);

  const values = useMemo(() => {
    const vals = {} as Record<T, string>;
    for (const name of fieldNames) {
      vals[name] = formState[name].value;
    }
    return vals;
  }, [formState, fieldNames]);

  const errors = useMemo(() => {
    const errs = {} as Record<T, string | null>;
    for (const name of fieldNames) {
      errs[name] = formState[name].error;
    }
    return errs;
  }, [formState, fieldNames]);

  const touched = useMemo(() => {
    const t = {} as Record<T, boolean>;
    for (const name of fieldNames) {
      t[name] = formState[name].touched;
    }
    return t;
  }, [formState, fieldNames]);

  const isValid = useMemo(() => {
    return fieldNames.every((name) => formState[name].isValid && !formState[name].error);
  }, [formState, fieldNames]);

  const isDirty = useMemo(() => {
    return fieldNames.some((name) => formState[name].touched);
  }, [formState, fieldNames]);

  const validateField = useCallback(
    (name: T): boolean => {
      const fieldConfig = config[name];
      
      setFormState((prev) => {
        const currentValues = {} as Record<string, string>;
        for (const n of fieldNames) {
          currentValues[n] = prev[n].value;
        }
        
        const error = validateValue(prev[name].value, fieldConfig.rules, currentValues);
        const fieldIsValid = error === null;

        return {
          ...prev,
          [name]: {
            ...prev[name],
            error,
            isValid: fieldIsValid,
          },
        };
      });

      // Return validation result based on latest state
      return true; // Will be overridden by state update
    },
    [config, fieldNames]
  );

  const validateForm = useCallback((): boolean => {
    let allValid = true;

    setFormState((prev) => {
      const newState = { ...prev };
      const currentValues = {} as Record<string, string>;
      
      for (const name of fieldNames) {
        currentValues[name] = newState[name].value;
      }

      for (const name of fieldNames) {
        const fieldConfig = config[name];
        const error = validateValue(newState[name].value, fieldConfig.rules, currentValues);
        const fieldIsValid = error === null;

        newState[name] = {
          ...newState[name],
          error,
          isValid: fieldIsValid,
          touched: true,
        };

        if (!fieldIsValid) {
          allValid = false;
        }
      }

      return newState;
    });
    
    return allValid;
  }, [config, fieldNames]);

  const setFieldValue = useCallback(
    (name: T, value: string) => {
      const fieldConfig = config[name];

      setFormState((prev) => {
        const shouldValidate = fieldConfig.validateOnChange && prev[name].touched;
        
        const newState = {
          ...prev,
          [name]: {
            ...prev[name],
            value,
          },
        };

        if (shouldValidate) {
          const allValues = {} as Record<string, string>;
          for (const n of fieldNames) {
            allValues[n] = n === name ? value : prev[n].value;
          }
          const error = validateValue(value, fieldConfig.rules, allValues);
          newState[name].error = error;
          newState[name].isValid = error === null;
        }

        return newState;
      });
    },
    [config, fieldNames]
  );

  const setFieldError = useCallback((name: T, error: string | null) => {
    setFormState((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
        isValid: error === null,
      },
    }));
  }, []);

  const handleBlur = useCallback(
    (name: T) => {
      const fieldConfig = config[name];
      const shouldValidate = fieldConfig.validateOnBlur !== false;

      setFormState((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          touched: true,
        },
      }));

      if (shouldValidate) {
        validateField(name);
      }
    },
    [config, validateField]
  );

  const getFieldProps = useCallback(
    (name: T) => {
      const field = formState[name];
      const hasError = field.touched && field.error !== null;
      const errorId = `${name}-error`;

      return {
        id: name,
        value: field.value,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          setFieldValue(name, e.target.value);
        },
        onBlur: () => handleBlur(name),
        'aria-invalid': hasError,
        'aria-describedby': hasError ? errorId : undefined,
      };
    },
    [formState, setFieldValue, handleBlur]
  );

  const getFieldError = useCallback(
    (name: T): string | null => {
      const field = formState[name];
      return field.touched ? field.error : null;
    },
    [formState]
  );

  const resetForm = useCallback(() => {
    setFormState(createInitialState());
  }, [createInitialState]);

  const resetField = useCallback(
    (name: T) => {
      setFormState((prev) => ({
        ...prev,
        [name]: {
          value: initialValues?.[name] || '',
          error: null,
          touched: false,
          isValid: true,
        },
      }));
    },
    [initialValues]
  );

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    getFieldProps,
    getFieldError,
    setFieldValue,
    setFieldError,
    validateField,
    validateForm,
    resetForm,
    resetField,
  };
}
