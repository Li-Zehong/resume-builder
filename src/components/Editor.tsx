import React, { useRef, useCallback, useMemo, useImperativeHandle, forwardRef, useEffect } from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export interface EditorRef {
  scrollToLine: (lineNumber: number) => void;
}

// ==================== 语法高亮 ====================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 对单行内容应用行内语法高亮 */
function highlightInline(text: string): string {
  let html = text;

  // @icon{...}
  html = html.replace(/@icon\{([^}]+)\}/g, '<span class="hl-special">@icon{$1}</span>');

  // @avatar{...}
  html = html.replace(/@avatar\{([^}]+)\}/g, '<span class="hl-special">@avatar{$1}</span>');

  // @company{...}
  html = html.replace(/@company\{([^}]*(?:\|[^}]*)?)\}/g, '<span class="hl-special">@company{$1}</span>');

  // @flex{...} — 整体高亮，内部的粗体/标签也会被处理
  html = html.replace(/@flex\{([^}]+)\}/g, (match, inner) => {
    const highlightedInner = highlightInlineTags(inner);
    return `<span class="hl-flex-keyword">@flex</span><span class="hl-flex-brace">{</span>${highlightedInner}<span class="hl-flex-brace">}</span>`;
  });

  // 行内标签高亮
  html = highlightInlineTags(html);

  return html;
}

/** 对行内标签/粗体等进行着色 */
function highlightInlineTags(text: string): string {
  let html = text;

  // !!text!! — 高亮红底白字
  html = html.replace(
    /!!((?:(?!!!).)*)!!/g,
    '<span class="hl-tag-highlight"><span class="hl-tag-marker">!!</span>$1<span class="hl-tag-marker">!!</span></span>'
  );

  // ^^text^^ — 紫色
  html = html.replace(
    /\^\^((?:(?!\^\^).)*)\^\^/g,
    '<span class="hl-tag-purple"><span class="hl-tag-marker">^^</span>$1<span class="hl-tag-marker">^^</span></span>'
  );

  // ++text++ — 绿色
  html = html.replace(
    /\+\+((?:(?!\+\+).)*)\+\+/g,
    '<span class="hl-tag-green"><span class="hl-tag-marker">++</span>$1<span class="hl-tag-marker">++</span></span>'
  );

  // ~~text~~ — 红色标签
  html = html.replace(
    /~~((?:(?!~~).)*)~~/g,
    '<span class="hl-tag-red"><span class="hl-tag-marker">~~</span>$1<span class="hl-tag-marker">~~</span></span>'
  );

  // `text` — 红色代码标签
  html = html.replace(
    /`([^`]+)`/g,
    '<span class="hl-tag-code"><span class="hl-tag-marker">`</span>$1<span class="hl-tag-marker">`</span></span>'
  );

  // **text** — 粗体
  html = html.replace(
    /\*\*((?:(?!\*\*).)*)\*\*/g,
    '<span class="hl-bold"><span class="hl-bold-marker">**</span>$1<span class="hl-bold-marker">**</span></span>'
  );

  return html;
}

/** 对整段文本进行语法高亮，返回带 HTML span 的字符串 */
function highlightMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  const lines = escaped.split('\n');

  const result = lines.map((line) => {
    // H1 标题
    if (/^# /.test(line)) {
      return `<span class="hl-h1"><span class="hl-heading-marker"># </span>${highlightInline(line.substring(2))}</span>`;
    }
    // H2 标题
    if (/^## /.test(line)) {
      return `<span class="hl-h2"><span class="hl-heading-marker">## </span>${highlightInline(line.substring(3))}</span>`;
    }
    // H3 标题
    if (/^### /.test(line)) {
      return `<span class="hl-h3"><span class="hl-heading-marker">### </span>${highlightInline(line.substring(4))}</span>`;
    }
    // 引用 > (escaped as &gt;)
    if (/^&gt; /.test(line)) {
      return `<span class="hl-quote"><span class="hl-quote-marker">&gt; </span>${highlightInline(line.substring(5))}</span>`;
    }
    // 列表项
    if (/^- /.test(line)) {
      return `<span class="hl-list-marker">- </span>${highlightInline(line.substring(2))}`;
    }
    // 空行
    if (line.trim() === '') {
      return line;
    }
    // 普通行
    return highlightInline(line);
  });

  return result.join('\n');
}

// ==================== 工具栏按钮配置 ====================

interface ToolButton {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  isPreviewStyle?: boolean;
  action: (value: string, selStart: number, selEnd: number) => { newValue: string; newCursorPos: number };
  tooltip: string;
}

const toolButtons: ToolButton[] = [
  {
    label: 'H1', icon: 'H1', color: '#f47067', bgColor: '', borderColor: '', hoverColor: '',
    action: (v, s) => {
      const lineStart = v.lastIndexOf('\n', s - 1) + 1;
      const prefix = '# ';
      const newValue = v.substring(0, lineStart) + prefix + v.substring(lineStart);
      return { newValue, newCursorPos: s + prefix.length };
    },
    tooltip: '一级标题',
  },
  {
    label: 'H2', icon: 'H2', color: '#6cb6ff', bgColor: '', borderColor: '', hoverColor: '',
    action: (v, s) => {
      const lineStart = v.lastIndexOf('\n', s - 1) + 1;
      const prefix = '## ';
      const newValue = v.substring(0, lineStart) + prefix + v.substring(lineStart);
      return { newValue, newCursorPos: s + prefix.length };
    },
    tooltip: '二级标题',
  },
  {
    label: 'B', icon: 'B', color: '#f0b754', bgColor: '', borderColor: '', hoverColor: '',
    action: (v, s, e) => {
      const selected = v.substring(s, e);
      const wrapped = `**${selected || '粗体'}**`;
      const newValue = v.substring(0, s) + wrapped + v.substring(e);
      return { newValue, newCursorPos: selected ? s + wrapped.length : s + 2 };
    },
    tooltip: '加粗',
  },
  {
    label: '•', icon: '•', color: '#adbac7', bgColor: '', borderColor: '', hoverColor: '',
    action: (v, s) => {
      const lineStart = v.lastIndexOf('\n', s - 1) + 1;
      const prefix = '- ';
      const newValue = v.substring(0, lineStart) + prefix + v.substring(lineStart);
      return { newValue, newCursorPos: s + prefix.length };
    },
    tooltip: '列表项',
  },
  {
    label: '~~红~~', icon: '红', color: '#f47067', bgColor: '', borderColor: '', hoverColor: '',
    isPreviewStyle: true,
    action: (v, s, e) => {
      const selected = v.substring(s, e);
      const wrapped = `~~${selected || '标签'}~~`;
      const newValue = v.substring(0, s) + wrapped + v.substring(e);
      return { newValue, newCursorPos: selected ? s + wrapped.length : s + 2 };
    },
    tooltip: '红色标签 ~~文本~~',
  },
  {
    label: '^^紫^^', icon: '紫', color: '#dcbdfb', bgColor: '', borderColor: '', hoverColor: '',
    isPreviewStyle: true,
    action: (v, s, e) => {
      const selected = v.substring(s, e);
      const wrapped = `^^${selected || '标签'}^^`;
      const newValue = v.substring(0, s) + wrapped + v.substring(e);
      return { newValue, newCursorPos: selected ? s + wrapped.length : s + 2 };
    },
    tooltip: '紫色标签 ^^文本^^',
  },
  {
    label: '++绿++', icon: '绿', color: '#8ddb8c', bgColor: '', borderColor: '', hoverColor: '',
    isPreviewStyle: true,
    action: (v, s, e) => {
      const selected = v.substring(s, e);
      const wrapped = `++${selected || '标签'}++`;
      const newValue = v.substring(0, s) + wrapped + v.substring(e);
      return { newValue, newCursorPos: selected ? s + wrapped.length : s + 2 };
    },
    tooltip: '绿色标签 ++文本++',
  },
  {
    label: '!!高亮!!', icon: '!', color: '#f0b754', bgColor: '', borderColor: '', hoverColor: '',
    isPreviewStyle: true,
    action: (v, s, e) => {
      const selected = v.substring(s, e);
      const wrapped = `!!${selected || '高亮'}!!`;
      const newValue = v.substring(0, s) + wrapped + v.substring(e);
      return { newValue, newCursorPos: selected ? s + wrapped.length : s + 2 };
    },
    tooltip: '高亮标签 !!文本!!',
  },
  {
    label: 'Flex', icon: 'Flex', color: '#6bc46d', bgColor: '', borderColor: '', hoverColor: '',
    action: (v, s) => {
      const template = '@flex{**公司名** | **职位** | **部门** | **时间**}';
      const newValue = v.substring(0, s) + template + v.substring(s);
      return { newValue, newCursorPos: s + template.length };
    },
    tooltip: '四列布局 @flex{A|B|C|D}',
  },
];

// ==================== 编辑器组件 ====================

export const Editor = forwardRef<EditorRef, EditorProps>(({ value, onChange }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineHighlightRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<number>();
  const isAnimatingRef = useRef(false);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // 生成语法高亮 HTML
  const highlightedHtml = useMemo(() => highlightMarkdown(value), [value]);

  // 滚动同步：textarea → 高亮层
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
    // 用户手动滚动时隐藏行高亮（动画滚动期间不隐藏）
    if (!isAnimatingRef.current && lineHighlightRef.current) {
      lineHighlightRef.current.classList.remove('editor-line-highlight-active');
      lineHighlightRef.current.style.opacity = '0';
    }
  }, []);

  // 通过镜像 div 精确测量某一行在 textarea 中的真实视觉位置（考虑自动换行）
  const measureLinePosition = (lineNumber: number): { top: number; height: number } => {
    const textarea = textareaRef.current;
    if (!textarea) return { top: 0, height: 24 };

    const lines = value.split('\n');
    const style = getComputedStyle(textarea);

    // 创建与 textarea 完全相同样式的镜像 div
    const mirror = document.createElement('div');
    mirror.style.cssText = `
      position: absolute; top: -9999px; left: -9999px;
      visibility: hidden; pointer-events: none;
      white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word;
      font-family: ${style.fontFamily};
      font-size: ${style.fontSize};
      line-height: ${style.lineHeight};
      tab-size: ${style.tabSize};
      letter-spacing: ${style.letterSpacing};
      padding: ${style.padding};
      width: ${textarea.clientWidth}px;
      box-sizing: border-box;
    `;

    // 将目标行之前的内容 + 目标行内容放入镜像
    const beforeContent = lines.slice(0, lineNumber - 1).join('\n');
    const beforeNode = document.createTextNode(beforeContent + (lineNumber > 1 ? '\n' : ''));
    const marker = document.createElement('span');
    marker.textContent = lines[lineNumber - 1] || '\u200b'; // 零宽字符兜底空行

    mirror.appendChild(beforeNode);
    mirror.appendChild(marker);
    document.body.appendChild(mirror);

    const top = marker.offsetTop;
    const height = marker.offsetHeight;

    document.body.removeChild(mirror);
    return { top, height };
  };

  // 平滑滚动到指定行，带行高亮动画
  const scrollToLine = (lineNumber: number) => {
    const textarea = textareaRef.current;
    const lineHighlight = lineHighlightRef.current;
    if (!textarea) return;

    // 计算光标字符位置
    const lines = value.split('\n');
    let charCount = 0;
    for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
      charCount += lines[i].length + 1;
    }

    textarea.focus();
    textarea.setSelectionRange(charCount, charCount);

    // 通过镜像 div 精确测量目标行的视觉位置（考虑自动换行）
    const { top: lineAbsoluteTop, height: lineVisualHeight } = measureLinePosition(lineNumber);
    // 钳制 targetScrollTop 不超过 textarea 的最大可滚动距离
    const maxScrollTop = textarea.scrollHeight - textarea.clientHeight;
    const targetScrollTop = Math.min(Math.max(0, lineAbsoluteTop - textarea.clientHeight / 3), maxScrollTop);

    // 清除之前的高亮
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    if (lineHighlight) {
      lineHighlight.classList.remove('editor-line-highlight-active');
      lineHighlight.style.opacity = '0';
    }

    // 平滑滚动动画
    const startScrollTop = textarea.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    const startTime = performance.now();
    const duration = 500;

    isAnimatingRef.current = true;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      const computedScrollTop = startScrollTop + distance * eased;
      textarea.scrollTop = computedScrollTop;
      // 读回浏览器钳制后的实际 scrollTop（防止超出最大滚动范围）
      const actualScrollTop = textarea.scrollTop;

      // 同步高亮渲染层滚动
      if (highlightRef.current) {
        highlightRef.current.scrollTop = actualScrollTop;
      }

      // 用实际 scrollTop 计算高亮指示器的视觉位置
      if (lineHighlight) {
        const visualTop = lineAbsoluteTop - actualScrollTop;
        lineHighlight.style.top = `${visualTop}px`;
        lineHighlight.style.height = `${lineVisualHeight}px`;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isAnimatingRef.current = false;
        // 滚动完成后，启动行高亮脉冲动画
        if (lineHighlight) {
          void lineHighlight.offsetWidth; // 强制 reflow 重启动画
          lineHighlight.classList.add('editor-line-highlight-active');

          highlightTimerRef.current = window.setTimeout(() => {
            lineHighlight.classList.remove('editor-line-highlight-active');
          }, 2500);
        }
      }
    };

    requestAnimationFrame(animate);
  };

  useImperativeHandle(ref, () => ({ scrollToLine }));

  // 工具栏按钮点击
  const handleToolClick = useCallback((tool: ToolButton) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selStart = textarea.selectionStart;
    const selEnd = textarea.selectionEnd;
    const { newValue, newCursorPos } = tool.action(value, selStart, selEnd);
    onChange(newValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }, [value, onChange]);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border)] shadow-2xl shadow-black/50">
      {/* 编辑器头部 — macOS 风格窗口栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-[6px]">
            <span className="w-[12px] h-[12px] rounded-full bg-[#ff5f57]"></span>
            <span className="w-[12px] h-[12px] rounded-full bg-[#febc2e]"></span>
            <span className="w-[12px] h-[12px] rounded-full bg-[#28c840]"></span>
          </div>
          <span className="ml-3 text-[13px] text-[var(--text-secondary)] font-medium tracking-tight">
            Markdown 编辑器
          </span>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] font-mono">
          {value.length} chars · {value.split('\n').length} lines
        </div>
      </div>

      {/* Markdown 格式工具栏 */}
      <div className="editor-toolbar">
        {toolButtons.map((tool) => (
          <button
            key={tool.label}
            onClick={() => handleToolClick(tool)}
            title={tool.tooltip}
            className="editor-tool-btn"
            style={{ color: tool.color } as React.CSSProperties}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* 编辑区域：高亮层 + 透明 textarea 叠加 */}
      <div className="flex-1 relative overflow-hidden">
        {/* 底层：语法高亮渲染 */}
        <div
          ref={highlightRef}
          className="highlight-layer"
          dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
          aria-hidden="true"
        />
        {/* 行高亮指示器 - 点击预览跳转时显示 */}
        <div
          ref={lineHighlightRef}
          className="editor-line-highlight"
          aria-hidden="true"
        />
        {/* 上层：透明文本的 textarea（接收输入和光标） */}
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder="在这里输入 Markdown 格式的简历内容..."
          spellCheck={false}
        />
      </div>
    </div>
  );
});
