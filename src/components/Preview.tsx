import React, { useMemo, useCallback } from 'react';
import { parseMarkdown } from '../utils/markdown';

interface PreviewProps {
  content: string;
  lineHeight?: number;
  onSectionClick?: (lineNumber: number) => void;
}

export const Preview: React.FC<PreviewProps> = ({ content, lineHeight = 22, onSectionClick }) => {
  const html = useMemo(() => parseMarkdown(content), [content]);

  // 处理预览区域的点击事件
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // 查找带有 data-line 属性的元素（可能是点击的元素本身或其父元素）
    const clickableElement = target.closest('[data-line]') as HTMLElement;
    if (clickableElement && onSectionClick) {
      const lineNumber = parseInt(clickableElement.getAttribute('data-line') || '0', 10);
      if (lineNumber > 0) {
        onSectionClick(lineNumber);
      }
    }
  }, [onSectionClick]);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ width: '860px', maxWidth: '90vw' }}>
      {/* 预览区域 - A4 纸张效果 (CodeCV 规范: 794px x 1123px) */}
      <div className="flex-1 overflow-auto p-4 rounded-xl bg-[var(--bg-elevated)]">
        <div 
          id="resume-preview"
          className="resume-preview mx-auto shadow-2xl"
          style={{
            width: '794px',
            minHeight: '1123px',
            padding: '30px 40px',
            backgroundColor: '#ffffff',
            color: '#5E5D5F',
            position: 'relative',
            '--resume-line-height': `${lineHeight}px`,
          } as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: html }}
          onClick={handleClick}
        />
      </div>
    </div>
  );
};
