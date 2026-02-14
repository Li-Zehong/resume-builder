import { marked } from 'marked';

// 内置简历图标（Lucide 风格单色 SVG，14x14，stroke 继承文字颜色）
const resumeIcons: Record<string, string> = {
  // 人物 / 身份
  user:     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  person:   '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  // 电话
  phone:    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  // 邮箱
  email:    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  mail:     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  // 定位
  location: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  map:      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  // 链接
  link:     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  // GitHub
  github:   '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>',
  // 日历
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
  // 性别
  male:     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="14" r="5"/><path d="M19 5l-5.4 5.4"/><path d="M15 5h4v4"/></svg>',
  female:   '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M12 13v8"/><path d="M9 18h6"/></svg>',
  // 星星
  star:     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  // 奖杯
  trophy:   '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  // 毕业帽
  graduation:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>',
  // 工作/公文包
  briefcase:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
};

// 公司 Logo 映射
const companyLogos: Record<string, string> = {
  '小红书': 'https://fe-video-qc.xhscdn.com/fe-platform/ed8fe781ce9e16b8eeac5b97bed1cb20b5e43538.ico',
  '美团': 'https://s3plus.meituan.net/v1/mss_e2821d7f0cfe4ac1bf9202f011ce397b/official-website/common/logo.svg',
  '阿里': 'https://img.alicdn.com/tfs/TB1Ly5oS3HqK1RjSZFPXXcwapXa-238-54.png',
  '阿里巴巴': 'https://img.alicdn.com/tfs/TB1Ly5oS3HqK1RjSZFPXXcwapXa-238-54.png',
  '腾讯': 'https://mat1.gtimg.com/pingjs/ext2020/qqindex2018/dist/img/qq_logo_2x.png',
  '字节跳动': 'https://lf1-cdn-tos.bytescm.com/obj/static/ies/bytedance_official/_next/static/images/logo-icon-f74aa357b6ec5697c8ca7e27fbe3e62b.svg',
  '字节': 'https://lf1-cdn-tos.bytescm.com/obj/static/ies/bytedance_official/_next/static/images/logo-icon-f74aa357b6ec5697c8ca7e27fbe3e62b.svg',
  '百度': 'https://www.baidu.com/img/flexible/logo/pc/result.png',
  '京东': 'https://www.jd.com/favicon.ico',
  '华为': 'https://www.huawei.com/-/media/corporate/images/home/logo/huawei-logo.png',
  '快手': 'https://static.yximgs.com/udata/pkg/fe/kuaishou-favicon.ico',
  '拼多多': 'https://mobile.yangkeduo.com/favicon.ico',
  'B站': 'https://www.bilibili.com/favicon.ico',
  '哔哩哔哩': 'https://www.bilibili.com/favicon.ico',
};

marked.setOptions({
  gfm: true,
  breaks: true,
});

// 解析单个单元格内容（处理粗体、标签等）
function parseCell(text: string): string {
  let html = text;

  // 处理图标 @icon{name}
  html = replaceIcons(html);
  
  // 处理公司 Logo: @company{公司名} 或 @company{公司名|自定义URL}
  html = html.replace(/@company\{([^|}]+)(?:\|([^}]+))?\}/g, (_, name, customUrl) => {
    const logo = customUrl || companyLogos[name.trim()] || '';
    if (logo) {
      return `<img class="company-icon" src="${logo}" alt="${name}" onerror="this.style.display='none'" /><strong>${name.trim()}</strong>`;
    }
    return `<strong>${name.trim()}</strong>`;
  });
  
  // 处理粗体 **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // 处理蓝色标签 ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<span class="tag-blue">$1</span>');
  
  // 处理代码标签 `text`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 处理紫色标签 ^^text^^
  html = html.replace(/\^\^([^^]+)\^\^/g, '<span class="tag-purple">$1</span>');
  
  // 处理绿色标签 ++text++
  html = html.replace(/\+\+([^+]+)\+\+/g, '<span class="tag-green">$1</span>');
  
  // 处理高亮 !!text!!
  html = html.replace(/!!([^!]+)!!/g, '<span class="tag-highlight">$1</span>');
  
  return html;
}

// 估算文本内容的视觉渲染宽度（px），用于 Flex 列宽自适应
function estimateVisualWidth(text: string): number {
  if (!text) return 0;

  // 统计各类标签数量（每个标签有额外 padding/border/margin）
  const tagCount =
    (text.match(/`[^`]+`/g) || []).length +
    (text.match(/~~[^~]+~~/g) || []).length +
    (text.match(/\^\^[^^]+\^\^/g) || []).length +
    (text.match(/\+\+[^+]+\+\+/g) || []).length +
    (text.match(/!![^!]+!!/g) || []).length;

  // 检测是否含公司图标（@company 已被转为 HTML）
  const hasIcon = text.includes('company-badge');

  // 去除 HTML 标签和 Markdown 格式标记，提取纯文本
  const stripped = text
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\^\^([^^]+)\^\^/g, '$1')
    .replace(/\+\+([^+]+)\+\+/g, '$1')
    .replace(/!!([^!]+)!!/g, '$1')
    .trim();

  // 计算文本宽度：中文/CJK 字符 ≈14px，ASCII 字符 ≈8px
  let width = 0;
  for (const ch of stripped) {
    width += ch.charCodeAt(0) > 0x7F ? 14 : 8;
  }

  // 标签额外宽度：padding(12) + border(2) + margin(4) ≈ 18px/个
  width += tagCount * 18;
  // 公司图标：icon(22) + gap(4) ≈ 26px
  if (hasIcon) width += 26;

  return width;
}

// 基于内容动态计算 Flex 四列最优宽度百分比
function calculateFlexColumnWidths(html: string): number[] {
  const defaultPcts = [36, 22, 24, 18];
  const flexRegex = /@flex\{([^}]+)\}/g;
  let match;
  const rows: string[][] = [];

  while ((match = flexRegex.exec(html)) !== null) {
    const parts = match[1].split('|').map((s: string) => s.trim());
    // 只统计非折叠行（中间列有内容）用于宽度计算
    if (parts.length === 4 && (parts[1] || parts[2])) {
      rows.push(parts);
    }
  }

  if (rows.length === 0) return defaultPcts;

  // 统计每列的最大视觉宽度
  const maxWidths = [0, 0, 0, 0];
  for (const row of rows) {
    for (let i = 0; i < 4; i++) {
      maxWidths[i] = Math.max(maxWidths[i], estimateVisualWidth(row[i] || ''));
    }
  }

  // 加列内边距
  const padded = maxWidths.map(w => w + 20);

  // 转为百分比（基于 714px 内容区 = 794px - 40px×2 padding）
  const contentWidth = 714;
  let pcts = padded.map(w => Math.round(w / contentWidth * 100));

  // 最小宽度保障
  pcts = pcts.map((p, i) => Math.max(p, i === 3 ? 14 : 10));

  // 归一化到 100%，多余空间均匀分配给所有列，保持间距一致
  const sum = pcts.reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    if (sum > 100) {
      const scale = 100 / sum;
      pcts = pcts.map(p => Math.round(p * scale));
    }
    // 均匀分配剩余空间
    const remaining = 100 - pcts.reduce((a, b) => a + b, 0);
    const perCol = Math.floor(Math.abs(remaining) / 4) * Math.sign(remaining);
    pcts = pcts.map(p => p + perCol);
    // 修正四舍五入误差（分配给中间两列优先，它们居中显示受益最大）
    const finalAdj = 100 - pcts.reduce((a, b) => a + b, 0);
    if (finalAdj > 0) {
      // 优先给中间两列
      for (let r = 0; r < finalAdj; r++) {
        pcts[1 + (r % 2)] += 1;
      }
    } else if (finalAdj < 0) {
      // 缩减第4列
      pcts[3] += finalAdj;
    }
  }

  return pcts;
}

// 将 @icon{name} 替换为内联 SVG
function replaceIcons(text: string): string {
  return text.replace(/@icon\{([^}]+)\}/g, (_, name) => {
    const svg = resumeIcons[name.trim().toLowerCase()];
    if (svg) {
      return `<span class="resume-icon">${svg}</span>`;
    }
    return '';
  });
}

// 原始预处理函数 - 保持格式不变
function preprocessMarkdown(markdown: string): string {
  let html = markdown;

  // 0. 图标 @icon{name}
  html = replaceIcons(html);

  // 1. 头像 @avatar{url}
  html = html.replace(/@avatar\{([^}]+)\}/g, 
    '<img class="resume-avatar" src="$1" alt="头像" />');

  // 2. 先处理所有 @company{} 语法（在 @flex 之前，避免 | 被错误分割）
  html = html.replace(/@company\{([^|}]+)(?:\|([^}]+))?\}/g, (_, name, customUrl) => {
    const logo = customUrl || companyLogos[name.trim()] || '';
    if (logo) {
      return `<span class="company-badge"><img class="company-icon" src="${logo}" alt="${name}" onerror="this.style.display='none'" /><strong>${name.trim()}</strong></span>`;
    }
    return `<strong>${name.trim()}</strong>`;
  });

  // 2.5 动态计算 Flex 列宽（在 @company 处理后、@flex 处理前）
  const colPcts = calculateFlexColumnWidths(html);

  // 3. 四列 Flex 布局: @flex{A | B | C | D}
  html = html.replace(/@flex\{([^}]+)\}/g, (_, content) => {
    const rawParts = content.split('|').map((p: string) => p.trim());
    const parts = rawParts.map((p: string) => parseCell(p));
    // 检测中间两列是否为空，为空时折叠以避免浪费空间
    const isCollapsed = rawParts.length === 4 && !rawParts[1] && !rawParts[2];
    const layoutClass = isCollapsed ? 'flex-layout flex-layout--collapsed' : 'flex-layout';
    const cells = parts.map((p: string, i: number) => {
      if (!isCollapsed && rawParts.length === 4) {
        // 使用动态计算的列宽，通过 inline style 覆盖 CSS 默认值
        return `<div class="flex-item" style="flex: 0 0 ${colPcts[i]}%">${p}</div>`;
      }
      return `<div class="flex-item">${p}</div>`;
    }).join('');
    return `<div class="${layoutClass}">${cells}</div>`;
  });

  // 处理普通文本中的蓝色标签 ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<span class="tag-blue">$1</span>');

  // 处理紫色标签 ^^text^^
  html = html.replace(/\^\^([^^]+)\^\^/g, '<span class="tag-purple">$1</span>');

  // 处理绿色标签 ++text++
  html = html.replace(/\+\+([^+]+)\+\+/g, '<span class="tag-green">$1</span>');

  // 处理高亮 !!text!!
  html = html.replace(/!!([^!]+)!!/g, '<span class="tag-highlight">$1</span>');

  return html;
}


// 解析 Markdown 并添加行号属性（标记注入法：注入 → 预处理 → marked 解析 → 提取标记）
export function parseMarkdown(markdown: string): string {
  const lines = markdown.split('\n');

  // ===== Step 1: 在 Markdown 源码中注入行号标记 =====
  // 标记 <span data-l="N"></span> 作为内联 HTML 能安全穿越 marked 解析
  const markedUp = lines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    const lineNum = index + 1;
    const marker = `<span data-l="${lineNum}"></span>`;

    // @flex / @avatar 单独处理，不注入标记
    if (trimmed.startsWith('@flex') || trimmed.startsWith('@avatar')) {
      return line;
    }

    // 列表项：标记注入到 "- " 之后
    if (trimmed.startsWith('- ')) {
      return line.replace(/^(\s*- )/, `$1${marker}`);
    }

    // 标题：标记注入到 "# " / "## " 等之后
    if (/^\s*#{1,6}\s/.test(line)) {
      return line.replace(/^(\s*#{1,6}\s+)/, `$1${marker}`);
    }

    // 引用：标记注入到 "> " 之后
    if (trimmed.startsWith('>')) {
      return line.replace(/^(\s*>\s?)/, `$1${marker}`);
    }

    // 普通段落或其他内容：标记注入到行首
    return `${marker}${line}`;
  }).join('\n');

  // ===== Step 2: 预处理自定义语法（@avatar, @company, @flex, 标签）=====
  const preprocessed = preprocessMarkdown(markedUp);

  // ===== Step 3: marked 解析 =====
  let html = marked.parse(preprocessed) as string;

  // ===== Step 4: 将注入的标记转换为父元素的 data-line 属性 =====
  // 标记经过 marked 后位于父元素内部，如：
  //   <p><span data-l="20"></span>text</p>
  //   <li><span data-l="28"></span>text</li>
  //   <h2><span data-l="9"></span>text</h2>
  html = html.replace(
    /(<(?:h[1-6]|p|li|td|th|blockquote)(?:\s[^>]*)?>)(\s*)<span data-l="(\d+)"><\/span>/g,
    (_, openTag, space, lineNum) => {
      const withDataLine = openTag.replace(/>$/, ` data-line="${lineNum}" class="clickable-section">`);
      return withDataLine + space;
    }
  );

  // ===== Step 5: 为 @flex 布局添加 data-line（flex div 在预处理阶段生成，不经过 marked）=====
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const lineNum = index + 1;

    if (trimmed.includes('@flex{')) {
      html = html.replace(
        /<div class="(flex-layout[^"]*)"(?![^<]*data-line)>/,
        `<div class="$1 clickable-section" data-line="${lineNum}">`
      );
    }
  });

  // ===== Step 6: 清理残留标记 =====
  html = html.replace(/<span data-l="\d+"><\/span>/g, '');

  return html;
}

// 转义正则表达式特殊字符
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// CodeCV 风格简历模板
export const defaultResume = `@avatar{https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan&backgroundColor=b6e3f4}

# 张三

> 前端工程师 | 3年经验 | 北京

📧 zhangsan@email.com | 📱 138-0000-0000 | 🔗 github.com/zhangsan

## 教育背景

@flex{**华南农业大学** ~~双一流~~ | **本科（学习委员）** | **人工智能专业** | **2022.09-2026.07**}

- **曾获奖项**：英伟达深度学习基础理论认证证书；数学建模国赛二等奖；蓝桥杯省二等奖
- **校园经历**：在校期间担任学习委员；省级大创负责人；丁颖杯二等奖

## 实习经历

@flex{@company{小红书} | **移动端用户增长 - 项目组** | **平台开发实习生** | **2025.07-2025.09**}

**负责模块**：小红书 APP 智能客服 \`AI大模型\` \`Prompt工程\` ~~LangChain~~ ~~RAG优化~~

基于大模型和RAG构建的智能客服助手系统，为小红书 APP 的用户提供准确全面的咨询服务。

- 采用**多查询策略**生成同义问题簇，解决用户口语化提问的语义歧义问题，使Top-3检索精准率**提升至92%**
- 采用Markdown标题**层级分块**策略与上下文重叠窗口机制，解决长文档信息割裂问题，召回**完整度达95%**
- 基于重排序技术的多查询结果融合策略，精准定位核心信息段落，测试集MAP@3指标提升18%

@flex{@company{美团} | **酒店旅行技术部-交通研发组** | **大模型应用开发实习生** | **2025.05-2025.07**}

**负责模块**：全网比价订单图片智能解析系统 \`Kafka\` \`SpringAI\` \`AI大模型\` ~~RPC服务~~

- 采用多模型**并行解析**与线程池技术，图片处理时长缩短60%
- 通过双消息队列**异步解耦**架构，AI任务响应从分钟级降至秒级

## 技能清单

**前端框架**: React, Vue, Next.js
**状态管理**: Redux, Zustand, Pinia
**样式方案**: Tailwind CSS, Styled Components, Sass
**构建工具**: Vite, Webpack, Rollup

## 项目经历

@flex{**基于大模型的智能会议辅助系统** | \`AI大模型\` \`FastAPI\` | ~~大模型微调~~ | **2025.01-2025.05**}

- 通过可视化平台微调 DeepSeek 模型，关键信息准确率**提升至94.2%**
- 通过**FastAPI**封装模型，接口响应速度稳定在**200ms内**

## 技能证书/其他

- **计算机基础**：扎实掌握计算机网络、操作系统及数据结构与算法
- **编程语言**：熟练掌握Java基础知识、Java集合、并发编程、JVM等内容
- **AI应用**：具备运用Agent、RAG架构及大模型技术解决实际工程问题的能力
`;
