/**
 * MarkdownEditor Component
 * Markdown editor with live preview
 */

'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { Eye, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  minHeight?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '마크다운 형식으로 작성하세요...',
  maxLength,
  className,
  minHeight = '300px',
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = React.useState('edit');

  return (
    <div className={cn('w-full', className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="gap-2">
            <Edit className="h-4 w-4" />
            편집
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            미리보기
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            showCount={!!maxLength}
            className={cn('font-mono', minHeight && `min-h-[${minHeight}]`)}
            style={{ minHeight }}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none rounded-md border bg-background p-4',
              minHeight && `min-h-[${minHeight}]`
            )}
            style={{ minHeight }}
          >
            {value ? (
              <ReactMarkdown
                components={{
                  // Custom link rendering for security
                  a: ({ ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    />
                  ),
                }}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">미리보기가 여기에 표시됩니다</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Markdown guide */}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          마크다운 도움말
        </summary>
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <p>
            <code className="rounded bg-muted px-1 py-0.5">**굵게**</code> -{' '}
            <strong>굵게</strong>
          </p>
          <p>
            <code className="rounded bg-muted px-1 py-0.5">*기울임*</code> -{' '}
            <em>기울임</em>
          </p>
          <p>
            <code className="rounded bg-muted px-1 py-0.5">[링크](url)</code> -
            링크
          </p>
          <p>
            <code className="rounded bg-muted px-1 py-0.5">## 제목</code> - 제목
          </p>
          <p>
            <code className="rounded bg-muted px-1 py-0.5">- 목록</code> - 목록
          </p>
        </div>
      </details>
    </div>
  );
}
