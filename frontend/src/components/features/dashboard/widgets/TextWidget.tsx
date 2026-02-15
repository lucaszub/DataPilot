"use client"

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface TextWidgetProps {
  content: string;
  isEditing: boolean;
  onContentChange?: (content: string) => void;
}

export function TextWidget({ content, isEditing, onContentChange }: TextWidgetProps) {
  const [editedContent, setEditedContent] = useState(content);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditedContent(newContent);
    onContentChange?.(newContent);
  };

  // Simple markdown-like rendering
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl font-bold mb-3">
            {line.slice(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-semibold mb-2">
            {line.slice(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg font-medium mb-2">
            {line.slice(4)}
          </h3>
        );
      }

      // Lists
      if (line.startsWith('- ')) {
        return (
          <li key={index} className="ml-4 mb-1">
            {renderInlineMarkdown(line.slice(2))}
          </li>
        );
      }

      // Empty line
      if (line.trim() === '') {
        return <br key={index} />;
      }

      // Regular paragraph
      return (
        <p key={index} className="mb-2">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  // Render inline markdown (bold, italic, links)
  const renderInlineMarkdown = (text: string) => {
    // Bold: **text**
    let result: any = text;
    result = result.split(/\*\*(.+?)\*\*/g).map((part: string, i: number) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );

    // Flatten and process italic: *text*
    result = result.flatMap((item: any, idx: number) => {
      if (typeof item === 'string') {
        return item.split(/\*(.+?)\*/g).map((part: string, i: number) =>
          i % 2 === 1 ? <em key={`${idx}-${i}`}>{part}</em> : part
        );
      }
      return item;
    });

    // Process links: [text](url)
    result = result.flatMap((item: any, idx: number) => {
      if (typeof item === 'string') {
        return item.split(/\[(.+?)\]\((.+?)\)/g).map((part: string, i: number, arr: string[]) => {
          if (i % 3 === 1) {
            const url = arr[i + 1];
            return (
              <a
                key={`${idx}-${i}`}
                href={url}
                className="text-[#FF5789] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {part}
              </a>
            );
          }
          if (i % 3 === 2) return null;
          return part;
        });
      }
      return item;
    });

    return result;
  };

  if (isEditing) {
    return (
      <Textarea
        value={editedContent}
        onChange={handleChange}
        className="w-full h-full font-mono text-sm resize-none"
        placeholder="Entrez votre texte ici... (Markdown supporté: **gras**, *italique*, # titre, - liste, [lien](url))"
      />
    );
  }

  return (
    <div className="w-full h-full overflow-auto p-4 prose prose-sm max-w-none">
      {renderMarkdown(content)}
    </div>
  );
}
