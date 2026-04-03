/**
 * Chapter Page Template for Investment Report
 *
 * This template generates chapter divider pages with:
 * - Chapter number
 * - Chapter title (Chinese and English)
 * - Decorative elements
 */

import { Color, FontFamily, FontSize, FontWeight, LineHeight, Spacing, Page } from '../visual-style';

export interface ChapterPageData {
  chapterNumber: number;
  chapterTitle: string;
  chapterTitleEn?: string;
  icon?: string;
}

export function generateChapterPageHTML(data: ChapterPageData): string {
  const {
    chapterNumber,
    chapterTitle,
    chapterTitleEn = '',
    icon = '▶',
  } = data;

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>第 ${chapterNumber} 章 - ${chapterTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 0;
    }

    body {
      font-family: ${FontFamily.primary};
      width: ${Page.width}mm;
      height: ${Page.height}mm;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: ${Color.neutral.white};
      overflow: hidden;
    }

    .chapter-container {
      text-align: center;
      position: relative;
      z-index: 1;
      padding: ${Spacing.xxxl}px;
    }

    /* Decorative background */
    .bg-decoration {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;
      overflow: hidden;
    }

    .bg-circle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.05;
    }

    .bg-circle-1 {
      width: 500px;
      height: 500px;
      background: ${Color.primary.main};
      top: -150px;
      right: -150px;
    }

    .bg-circle-2 {
      width: 400px;
      height: 400px;
      background: ${Color.primary.main};
      bottom: -100px;
      left: -100px;
    }

    .bg-circle-3 {
      width: 200px;
      height: 200px;
      background: ${Color.primary.light};
      top: 50%;
      left: 10%;
      transform: translateY(-50%);
    }

    /* Chapter number */
    .chapter-number {
      font-size: 180px;
      font-weight: ${FontWeight.bold};
      color: ${Color.neutral[100]};
      line-height: 1;
      position: absolute;
      top: -80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: -1;
      user-select: none;
    }

    /* Icon */
    .chapter-icon {
      font-size: 64px;
      color: ${Color.primary.main};
      margin-bottom: ${Spacing.lg}px;
      display: inline-block;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.9;
      }
    }

    /* Chapter label */
    .chapter-label {
      font-size: ${FontSize.h3}px;
      font-weight: ${FontWeight.medium};
      color: ${Color.neutral[500]};
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: ${Spacing.md}px;
    }

    /* Chapter title */
    .chapter-title {
      font-size: ${FontSize.h1 * 1.2}px;
      font-weight: ${FontWeight.bold};
      color: ${Color.neutral[900]};
      line-height: ${LineHeight.tight};
      margin-bottom: ${Spacing.md}px;
      max-width: 600px;
    }

    /* Chapter title (English) */
    .chapter-title-en {
      font-size: ${FontSize.h3}px;
      font-weight: ${FontWeight.regular};
      color: ${Color.neutral[600]};
      font-family: ${FontFamily.secondary};
      letter-spacing: 1px;
      margin-top: ${Spacing.md}px;
      max-width: 600px;
    }

    /* Decorative line */
    .divider {
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, ${Color.primary.main}, ${Color.primary.light});
      margin: ${Spacing.xl}px auto;
      border-radius: 2px;
    }

    /* Chapter number badge */
    .chapter-badge {
      display: inline-block;
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, ${Color.primary.main}, ${Color.primary.dark});
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${FontSize.h2}px;
      font-weight: ${FontWeight.bold};
      color: ${Color.neutral.white};
      margin: 0 auto ${Spacing.lg}px;
      box-shadow: 0 4px 12px rgba(26, 86, 219, 0.3);
    }

    /* Alternative style: side accent */
    .side-accent {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 8px;
      background: linear-gradient(180deg, ${Color.primary.main}, ${Color.primary.light});
    }

    /* Page number */
    .page-number {
      position: absolute;
      bottom: 30px;
      right: 30px;
      font-size: ${FontSize.small}px;
      color: ${Color.neutral[400]};
      font-weight: ${FontWeight.medium};
    }
  </style>
</head>
<body>
  <div class="bg-decoration">
    <div class="bg-circle bg-circle-1"></div>
    <div class="bg-circle bg-circle-2"></div>
    <div class="bg-circle bg-circle-3"></div>
  </div>

  <div class="side-accent"></div>

  <div class="chapter-container">
    <div class="chapter-number">${chapterNumber}</div>

    <div class="chapter-badge">${chapterNumber}</div>

    <div class="chapter-icon">${icon}</div>

    <div class="chapter-label">CHAPTER</div>

    <h1 class="chapter-title">${chapterTitle}</h1>

    ${chapterTitleEn ? `<div class="chapter-title-en">${chapterTitleEn}</div>` : ''}

    <div class="divider"></div>
  </div>

  <div class="page-number">- ${chapterNumber} -</div>
</body>
</html>
  `.trim();
}

/**
 * Generate chapter page for standard report chapters
 */
export function generateStandardChapterPage(
  chapterNumber: number,
  chapterTitle: string,
  chapterTitleEn?: string
): string {
  const icons = ['📊', '🏢', '💰', '📋', '⚠️', '🎯'];
  const icon = icons[chapterNumber - 1] || '▶';

  return generateChapterPageHTML({
    chapterNumber,
    chapterTitle,
    chapterTitleEn,
    icon,
  });
}
