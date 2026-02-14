import React, { useState } from 'react';
import { exportToPDF, printResume } from '../utils/pdf';

export const ExportButton: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 方案1: 使用浏览器打印（推荐，样式最完整）
  const handlePrint = () => {
    setShowMenu(false);
    try {
      printResume('resume-preview');
    } catch (error) {
      console.error('打印失败:', error);
      alert('打印失败，请重试');
    }
  };

  // 方案2: 直接导出PDF（html2canvas，可能有样式问题）
  const handleExportPDF = async () => {
    setShowMenu(false);
    setIsExporting(true);
    try {
      await exportToPDF('resume-preview', '我的简历.pdf');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm
          flex items-center gap-2 transition-all duration-200
          ${isExporting
            ? 'bg-gray-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-[var(--accent)] to-purple-400 hover:shadow-lg hover:shadow-[var(--accent)]/25 hover:-translate-y-0.5'
          }
          text-white
        `}
      >
        {isExporting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>导出中...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>导出 PDF</span>
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* 下拉菜单 */}
      {showMenu && !isExporting && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <button
            onClick={handlePrint}
            className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-3 text-[var(--text-primary)]"
          >
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <div>
              <div className="font-medium">打印 / 保存 PDF</div>
              <div className="text-xs text-[var(--text-secondary)]">推荐 - 样式最完整</div>
            </div>
          </button>
          <button
            onClick={handleExportPDF}
            className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-3 text-[var(--text-primary)] border-t border-[var(--border)]"
          >
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <div className="font-medium">直接导出 PDF</div>
              <div className="text-xs text-[var(--text-secondary)]">备用方案</div>
            </div>
          </button>
        </div>
      )}

      {/* 点击外部关闭菜单 */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};
