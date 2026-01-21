import {
  Bold,
  Italic,
  Code,
  List,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
} from 'lucide-react';

export interface MarkdownToolbarProps {
  onInsert: (before: string, after?: string) => void;
}

export function MarkdownToolbar({ onInsert }: MarkdownToolbarProps) {
  const tools = [
    { icon: <Heading1 className="w-4 h-4" />, before: '# ', after: '', title: 'Heading 1' },
    { icon: <Heading2 className="w-4 h-4" />, before: '## ', after: '', title: 'Heading 2' },
    { icon: <Heading3 className="w-4 h-4" />, before: '### ', after: '', title: 'Heading 3' },
    { separator: true },
    { icon: <Bold className="w-4 h-4" />, before: '**', after: '**', title: 'Bold' },
    { icon: <Italic className="w-4 h-4" />, before: '*', after: '*', title: 'Italic' },
    { icon: <Code className="w-4 h-4" />, before: '`', after: '`', title: 'Inline Code' },
    { separator: true },
    { icon: <List className="w-4 h-4" />, before: '- ', after: '', title: 'Bullet List' },
    { icon: <Link className="w-4 h-4" />, before: '[', after: '](url)', title: 'Link' },
    { icon: <Image className="w-4 h-4" />, before: '![alt](', after: ')', title: 'Image' },
    {
      icon: <span className="text-xs font-mono">{'{}'}</span>,
      before: '\n```\n',
      after: '\n```\n',
      title: 'Code Block',
    },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-100 rounded-t-lg border border-b-0 border-gray-300">
      {tools.map((tool, index) =>
        'separator' in tool ? (
          <div key={index} className="w-px bg-gray-300 mx-1" />
        ) : (
          <button
            key={index}
            onClick={() => onInsert(tool.before, tool.after)}
            className="p-2 hover:bg-gray-200 rounded"
            title={tool.title}
            type="button"
          >
            {tool.icon}
          </button>
        )
      )}
    </div>
  );
}
