import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// A4 页面高度（96dpi 下的像素值）
const A4_HEIGHT = 1123;
// 页面内边距
const PAGE_PAD_TOP = 30;
const PAGE_PAD_BOTTOM = 30;
const PAGE_PAD_LR = 40;

/**
 * 将简历内容分装到「页面包装器」中，每个包装器有独立的上下 padding。
 * 打印时每个包装器恰好占一页，保证每页都有舒适的上下留白。
 *
 * 逻辑：逐个把元素放入当前页，如果放入后超出 A4 高度则移到下一页。
 * 额外规则：如果被移走的元素是 flex-layout / ul / p，而当前页最后
 * 剩下一个孤立的 h2/h3，则把标题也一起带到下一页（不让标题孤立在页底）。
 */
function paginateForPrint(resume: HTMLElement, doc: Document): void {
  // 分离绝对定位元素（如头像）与文档流元素
  const avatar = resume.querySelector('.resume-avatar');
  const flowChildren: HTMLElement[] = [];

  Array.from(resume.children).forEach(child => {
    if (!(child as HTMLElement).classList?.contains('resume-avatar')) {
      flowChildren.push(child as HTMLElement);
    }
  });

  // 清空简历容器，去掉自身 padding（由页面包装器接管）
  resume.innerHTML = '';
  resume.style.padding = '0';

  // 重新添加头像（绝对定位，不受分页影响）
  if (avatar) resume.appendChild(avatar);

  // 创建第一页
  let page = createPageWrapper(doc);
  resume.appendChild(page);

  for (const child of flowChildren) {
    page.appendChild(child);

    // 检测是否溢出当前页
    if (page.scrollHeight > A4_HEIGHT && page.children.length > 1) {
      // 溢出了，把这个元素移出
      page.removeChild(child);

      // 如果当前页最后一个元素是 h2/h3（标题不该孤立在页底），一并移走
      const lastEl = page.lastElementChild as HTMLElement | null;
      let pullAlong: HTMLElement | null = null;
      if (lastEl && /^H[23]$/.test(lastEl.tagName)) {
        page.removeChild(lastEl);
        pullAlong = lastEl;
      }

      // 当前页完成，标记分页
      page.style.breakAfter = 'page';

      // 创建下一页
      page = createPageWrapper(doc);
      resume.appendChild(page);
      if (pullAlong) page.appendChild(pullAlong);
      page.appendChild(child);
    }
  }
}

function createPageWrapper(doc: Document): HTMLElement {
  const div = doc.createElement('div');
  div.style.padding = `${PAGE_PAD_TOP}px ${PAGE_PAD_LR}px ${PAGE_PAD_BOTTOM}px`;
  div.style.boxSizing = 'border-box';
  return div;
}

// 方案1: 使用浏览器原生打印功能（推荐，CSS支持最完整）
export function printResume(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  // 创建打印专用的 iframe
  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'absolute';
  printFrame.style.top = '-9999px';
  printFrame.style.left = '-9999px';
  printFrame.style.width = '900px';
  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (!frameDoc) {
    document.body.removeChild(printFrame);
    throw new Error('Failed to create print frame');
  }

  // 复制所有样式表
  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n');
      } catch (e) {
        if (sheet.href) {
          return `@import url("${sheet.href}");`;
        }
        return '';
      }
    })
    .join('\n');

  // 写入打印内容（title 留空，避免浏览器在页眉显示标题）
  frameDoc.open();
  frameDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title> </title>
      <style>
        ${styles}
        
        /* 打印专用样式 */
        @page {
          size: A4;
          margin: 0;
        }
        
        @media print {
          html, body {
            width: 210mm;
            margin: 0;
            padding: 0;
          }
          
          .resume-preview {
            width: 794px !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            position: relative !important;
          }
          
          /* 确保标签样式正确打印 */
          code, .tag-blue, .tag-purple, .tag-green, .tag-highlight {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* 分页控制：防止元素在页面中间被截断 */
          .resume-preview h2,
          .resume-preview h3 {
            break-inside: avoid;
            break-after: avoid;
          }
          .resume-preview .flex-layout {
            break-inside: avoid;
          }
          .resume-preview li {
            break-inside: avoid;
          }
          .resume-preview p,
          .resume-preview blockquote {
            break-inside: avoid;
          }
          .resume-preview p,
          .resume-preview li {
            orphans: 2;
            widows: 2;
          }
        }
      </style>
    </head>
    <body>
      ${element.outerHTML}
    </body>
    </html>
  `);
  frameDoc.close();

  // 等待内容加载完成后打印
  printFrame.onload = () => {
    setTimeout(() => {
      // 将内容分装到页面包装器中（每页有独立的上下 padding）
      const resumeEl = frameDoc.querySelector('.resume-preview') as HTMLElement;
      if (resumeEl) {
        paginateForPrint(resumeEl, frameDoc);
      }

      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    }, 500);
  };
}

// 方案2: 使用 html2canvas（备用方案）
export async function exportToPDF(elementId: string, filename: string = 'resume.pdf'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  // 保存原始样式
  const originalOverflow = element.style.overflow;
  element.style.overflow = 'visible';

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    const totalPages = Math.ceil((imgHeight * ratio) / pdfHeight);

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        imgData,
        'PNG',
        imgX,
        imgY - i * pdfHeight,
        imgWidth * ratio,
        imgHeight * ratio
      );
    }

    pdf.save(filename);
  } finally {
    element.style.overflow = originalOverflow;
  }
}
