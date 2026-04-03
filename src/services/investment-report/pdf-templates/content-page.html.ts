/**
 * Content Page Template for Investment Report
 *
 * This template generates standard content pages with:
 * - Header (report title, page number)
 * - Main content area (markdown content rendered as HTML)
 * - Footer (disclaimer, copyright)
 */

import { Color, FontFamily, FontSize, FontWeight, LineHeight, Spacing, Page } from '../visual-style';

export interface ContentPageData {
  content: string; // HTML content (markdown rendered)
  reportTitle: string;
  currentPage: number;
  totalPages: number;
  showFooter?: boolean;
}

export function generateContentPageHTML(data: ContentPageData): string {
  const {
    content,
    reportTitle,
    currentPage,
    totalPages,
    showFooter = true,
  } = data;

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: ${Page.marginTop}mm ${Page.marginRight}mm ${Page.marginBottom}mm ${Page.marginLeft}mm;
    }

    body {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.body}px;
      line-height: ${LineHeight.normal};
      color: ${Color.neutral[700]};
      background: ${Color.neutral.white};
    }

    .page-container {
      width: 100%;
      min-height: ${Page.contentHeight}mm;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: ${Spacing.md}px;
      margin-bottom: ${Spacing.lg}px;
      border-bottom: 2px solid ${Color.primary.light};
    }

    .header-title {
      font-size: ${FontSize.small}px;
      font-weight: ${FontWeight.medium};
      color: ${Color.neutral[500]};
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .header-page-number {
      font-size: ${FontSize.small}px;
      font-weight: ${FontWeight.medium};
      color: ${Color.primary.main};
    }

    /* Main content */
    .content {
      flex: 1;
    }

    /* Footer */
    .footer {
      margin-top: ${Spacing.xl}px;
      padding-top: ${Spacing.md}px;
      border-top: 1px solid ${Color.neutral[200]};
      font-size: ${FontSize.footnote}px;
      color: ${Color.neutral[500]};
      line-height: ${LineHeight.relaxed};
    }

    .footer-disclaimer {
      margin-bottom: ${Spacing.sm}px;
    }

    .footer-copyright {
      text-align: center;
    }

    /* Typography styles */
    h1 {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.h1}px;
      font-weight: ${FontWeight.bold};
      line-height: ${LineHeight.tight};
      color: ${Color.neutral[900]};
      margin-bottom: ${Spacing.lg}px;
      margin-top: ${Spacing.xl}px;
    }

    h2 {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.h2}px;
      font-weight: ${FontWeight.semibold};
      line-height: ${LineHeight.tight};
      color: ${Color.primary.main};
      margin-top: ${Spacing.xxl}px;
      margin-bottom: ${Spacing.md}px;
      padding-bottom: ${Spacing.sm}px;
      border-bottom: 2px solid ${Color.primary.light};
    }

    h3 {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.h3}px;
      font-weight: ${FontWeight.semibold};
      line-height: ${LineHeight.normal};
      color: ${Color.neutral[800]};
      margin-top: ${Spacing.lg}px;
      margin-bottom: ${Spacing.sm}px;
    }

    h4 {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.h4}px;
      font-weight: ${FontWeight.medium};
      line-height: ${LineHeight.normal};
      color: ${Color.neutral[700]};
      margin-top: ${Spacing.md}px;
      margin-bottom: ${Spacing.sm}px;
    }

    p {
      margin-bottom: ${Spacing.md}px;
      text-align: justify;
    }

    /* Lists */
    ul, ol {
      margin-bottom: ${Spacing.md}px;
      padding-left: ${Spacing.lg}px;
    }

    li {
      margin-bottom: ${Spacing.xs}px;
    }

    ul li::marker {
      color: ${Color.primary.main};
    }

    /* Tables */
    .table-container {
      margin-bottom: ${Spacing.lg}px;
      margin-top: ${Spacing.md}px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${FontSize.body}px;
    }

    thead {
      background-color: ${Color.neutral[50]};
      font-weight: ${FontWeight.semibold};
      color: ${Color.neutral[900]};
      border-bottom: 2px solid ${Color.neutral[300]};
    }

    th {
      padding: ${Spacing.sm}px ${Spacing.md}px;
      text-align: left;
      font-family: ${FontFamily.primary};
    }

    td {
      padding: ${Spacing.sm}px ${Spacing.md}px;
      font-family: ${FontFamily.primary};
      color: ${Color.neutral[700]};
      border-bottom: 1px solid ${Color.neutral[200]};
    }

    tr:nth-child(even) {
      background-color: ${Color.neutral.white};
    }

    tr:nth-child(odd) {
      background-color: ${Color.neutral[50]};
    }

    .text-right {
      text-align: right;
      font-family: ${FontFamily.financial};
      font-variant-numeric: tabular-nums;
    }

    .text-center {
      text-align: center;
    }

    /* Callout boxes */
    .callout {
      padding: ${Spacing.md}px ${Spacing.lg}px;
      background-color: ${Color.info.light};
      border-left: 4px solid ${Color.info.main};
      border-radius: 4px;
      margin-bottom: ${Spacing.lg}px;
    }

    .callout-title {
      font-weight: ${FontWeight.semibold};
      color: ${Color.info.main};
      margin-bottom: ${Spacing.sm}px;
    }

    .warning {
      padding: ${Spacing.md}px ${Spacing.lg}px;
      background-color: ${Color.warning.light};
      border-left: 4px solid ${Color.warning.main};
      border-radius: 4px;
      margin-bottom: ${Spacing.lg}px;
    }

    .warning-title {
      font-weight: ${FontWeight.semibold};
      color: ${Color.warning.main};
      margin-bottom: ${Spacing.sm}px;
    }

    /* Divider */
    hr {
      border: none;
      height: 1px;
      background-color: ${Color.neutral[200]};
      margin: ${Spacing.xl}px 0;
    }

    /* Strong emphasis */
    strong {
      font-weight: ${FontWeight.semibold};
      color: ${Color.neutral[900]};
    }

    /* Links */
    a {
      color: ${Color.primary.main};
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    /* Code blocks (if any) */
    code {
      font-family: ${FontFamily.mono};
      background-color: ${Color.neutral[100]};
      padding: 2px 6px;
      border-radius: 3px;
      font-size: ${FontSize.small}px;
    }

    pre {
      font-family: ${FontFamily.mono};
      background-color: ${Color.neutral[100]};
      padding: ${Spacing.md}px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: ${FontSize.small}px;
      line-height: ${LineHeight.relaxed};
    }

    /* Blockquotes */
    blockquote {
      margin: ${Spacing.md}px 0;
      padding-left: ${Spacing.lg}px;
      border-left: 4px solid ${Color.primary.main};
      color: ${Color.neutral[600]};
      font-style: italic;
    }

    /* Utility classes */
    .mb-sm { margin-bottom: ${Spacing.sm}px; }
    .mb-md { margin-bottom: ${Spacing.md}px; }
    .mb-lg { margin-bottom: ${Spacing.lg}px; }
    .mt-sm { margin-top: ${Spacing.sm}px; }
    .mt-md { margin-top: ${Spacing.md}px; }
    .mt-lg { margin-top: ${Spacing.lg}px; }

    /* Page break */
    .page-break {
      page-break-before: always;
    }

    /* Print optimization */
    @media print {
      .page-break {
        page-break-before: always;
      }

      h1, h2, h3, h4 {
        page-break-after: avoid;
      }

      table {
        page-break-inside: avoid;
      }

      .callout, .warning {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Header -->
    <div class="header">
      <div class="header-title">${reportTitle}</div>
      <div class="header-page-number">${currentPage} / ${totalPages}</div>
    </div>

    <!-- Main Content -->
    <div class="content">
      ${content}
    </div>

    ${showFooter ? `
    <!-- Footer -->
    <div class="footer">
      <div class="footer-disclaimer">
        本报告基于当前可获得的信息做出，仅供参考。实际投资决策应考虑更详细的尽职调查和市场调研。
      </div>
      <div class="footer-copyright">
        © ${new Date().getFullYear()} ESS Financial. All rights reserved.
      </div>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Render markdown content to HTML
 * This is a simple implementation - consider using a proper markdown library
 */
export function renderMarkdownToHTML(markdown: string): string {
  // Simple markdown to HTML conversion
  // In production, use a proper library like 'marked' or 'remark'
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

  // Tables (basic support)
  html = html.replace(/\|(.+)\|/gim, (match, content) => {
    const cells = content.split('|').map((cell: string) => cell.trim());
    const cellTags = cells.map((cell: string) => `<td>${cell}</td>`).join('');
    return `<tr>${cellTags}</tr>`;
  });

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;

  return html;
}
