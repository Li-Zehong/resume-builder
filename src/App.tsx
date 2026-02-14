import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor, EditorRef } from './components/Editor';
import { Preview } from './components/Preview';
import { ExportButton } from './components/ExportButton';
import { defaultResume } from './utils/markdown';
import './themes/themes.css';

// localStorage 键名
const STORAGE_KEY_CONTENT = 'resume-builder-content';
const STORAGE_KEY_LINE_HEIGHT = 'resume-builder-line-height';
const STORAGE_KEY_AVATAR = 'resume-builder-avatar';

function App() {
  // 从 localStorage 读取初始值
  const [content, setContent] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONTENT);
    return saved || defaultResume;
  });

  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const [lineHeight, setLineHeight] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LINE_HEIGHT);
    return saved ? Number(saved) : 22;
  });

  // 上传的头像（base64 Data URL）
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_AVATAR);
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<EditorRef>(null);

  // 处理预览区域点击，跳转到编辑器对应行
  const handleSectionClick = useCallback((lineNumber: number) => {
    // 点击预览区域时自动打开编辑器抽屉
    if (!isEditorOpen) {
      setIsEditorOpen(true);
    }
    // 延迟一下等抽屉打开后再滚动
    setTimeout(() => {
      editorRef.current?.scrollToLine(lineNumber);
    }, 300);
  }, [isEditorOpen]);

  // 切换编辑器抽屉
  const toggleEditor = useCallback(() => {
    setIsEditorOpen(prev => !prev);
  }, []);

  // 自动保存到 localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY_CONTENT, content);
    }, 500); // 防抖 500ms

    return () => clearTimeout(timer);
  }, [content]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LINE_HEIGHT, String(lineHeight));
  }, [lineHeight]);

  // 重置为默认模板
  const handleReset = useCallback(() => {
    if (confirm('确定要重置为默认模板吗？当前内容将会丢失。')) {
      setContent(defaultResume);
    }
  }, []);

  // 导出 Markdown 文件
  const handleExportMD = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `简历_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [content]);

  // 导入 Markdown 文件
  const handleImportMD = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setContent(text);
        }
      };
      reader.readAsText(file);
    }
    // 清空 input，允许重复选择同一文件
    e.target.value = '';
  }, []);

  // 上传头像
  const handleAvatarUpload = useCallback(() => {
    avatarInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件（jpg/png/webp 等）');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          localStorage.setItem(STORAGE_KEY_AVATAR, dataUrl);
          setAvatarUrl(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* 顶部导航栏 — 毛玻璃效果 */}
      <header className="sticky top-0 z-[70] bg-[var(--bg-secondary)]/70 backdrop-blur-2xl border-b border-[var(--border-subtle)]">
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-[var(--accent)]/25">
                R
              </div>
              <div>
                <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
                  简历生成器
                </h1>
                <p className="text-[11px] text-[var(--text-secondary)] opacity-70">
                  Markdown 实时预览 · 导出 PDF
                </p>
              </div>
            </div>

            {/* 工具栏 */}
            <div className="flex items-center gap-4">
              {/* 行间距滑块 */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)]/60 border border-[var(--border-subtle)]">
                <span className="text-[11px] text-[var(--text-secondary)] whitespace-nowrap">行距</span>
                <input
                  type="range"
                  min="18"
                  max="32"
                  step="1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="line-height-slider w-20 h-1 accent-[var(--accent)] cursor-pointer"
                />
                <span className="text-[11px] text-[var(--text-secondary)] w-6 text-center font-mono">{lineHeight}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 编辑器抽屉切换按钮 */}
                <button
                  onClick={toggleEditor}
                  className={`drawer-toggle-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isEditorOpen
                      ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25'
                      : 'drawer-toggle-btn-pulse'
                  }`}
                >
                  {isEditorOpen ? '✕ 关闭编辑' : '✏️ 编辑简历'}
                </button>
                <button
                  onClick={handleAvatarUpload}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)]/60 text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] hover:border-[var(--border)] transition-all duration-200"
                  title={avatarUrl ? '已上传头像，点击更换' : '上传头像'}
                >
                  📷 头像
                </button>
                <button
                  onClick={handleImportMD}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)]/60 text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] hover:border-[var(--border)] transition-all duration-200"
                >
                  📂 导入
                </button>
                <button
                  onClick={handleExportMD}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)]/60 text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] hover:border-[var(--border)] transition-all duration-200"
                >
                  💾 导出
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)]/60 text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] hover:border-[var(--border)] transition-all duration-200"
                >
                  🔄 重置
                </button>
                <ExportButton />
              </div>
              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 - 简历居中，抽屉打开时左移 */}
      <main className={`flex-1 w-full p-6 content-area ${isEditorOpen ? 'content-shifted' : ''}`}>
        <div className="flex justify-center h-[calc(100vh-120px)]">
          <Preview content={content} lineHeight={lineHeight} avatarUrl={avatarUrl} onSectionClick={handleSectionClick} />
        </div>
      </main>

      {/* 编辑器抽屉 */}
      <div className={`drawer-container ${isEditorOpen ? 'drawer-open' : ''}`}>
        {/* 抽屉拉手 */}
        <div className="drawer-handle" onClick={toggleEditor}>
          <span className="drawer-handle-icon">
            {isEditorOpen ? '›' : '‹'}
          </span>
          <div className="drawer-handle-bar" />
          {!isEditorOpen && <span className="drawer-handle-label">编辑</span>}
        </div>
        <Editor ref={editorRef} value={content} onChange={setContent} />
      </div>

      {/* 底部状态栏 */}
      <footer className="bg-[var(--bg-secondary)]/60 backdrop-blur-lg border-t border-[var(--border-subtle)] py-1.5 px-6">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>💾 内容已自动保存到本地</span>
          <span>
            Made with ❤️ using React + Tailwind CSS + Vite
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
