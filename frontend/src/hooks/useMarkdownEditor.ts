import { useRef, useCallback } from 'react';

export function useMarkdownEditor(
  content: string,
  setContent: (content: string) => void
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = useCallback(
    (before: string, after: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      const newText =
        content.substring(0, start) +
        before +
        selectedText +
        after +
        content.substring(end);
      setContent(newText);

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        );
      }, 0);
    },
    [content, setContent]
  );

  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const newText = content.substring(0, start) + text + content.substring(start);
        setContent(newText);
      } else {
        // Append to end if no textarea ref
        setContent(content + text);
      }
    },
    [content, setContent]
  );

  return {
    textareaRef,
    insertMarkdown,
    insertAtCursor,
  };
}
