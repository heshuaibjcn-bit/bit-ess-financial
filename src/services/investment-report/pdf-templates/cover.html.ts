/**
 * Cover Page Template for Investment Report
 *
 * This template generates the cover page with:
 * - Report title
 * - Project information
 * - Date and confidentiality notice
 */

import { Color, FontFamily, FontSize, FontWeight, LineHeight, Spacing, Page } from '../visual-style';

export interface CoverPageData {
  reportTitle: string;
  projectName: string;
  companyName: string;
  province: string;
  reportDate: string;
  reportVersion?: string;
  confidential?: boolean;
}

export function generateCoverPageHTML(data: CoverPageData): string {
  const {
    reportTitle,
    projectName,
    companyName,
    province,
    reportDate,
    reportVersion = 'v1.0',
    confidential = true,
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
      margin: 0;
    }

    body {
      font-family: ${FontFamily.primary};
      width: ${Page.width}mm;
      height: ${Page.height}mm;
      padding: ${Page.marginTop}mm ${Page.marginRight}mm ${Page.marginBottom}mm ${Page.marginLeft}mm;
      position: relative;
      background: linear-gradient(135deg, ${Color.primary.main} 0%, ${Color.primary.dark} 100%);
      color: ${Color.neutral.white};
    }

    .cover-container {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      position: relative;
      z-index: 1;
    }

    /* Decorative elements */
    .decorative-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      z-index: 0;
    }

    .circle-1 {
      width: 400px;
      height: 400px;
      top: -100px;
      right: -100px;
    }

    .circle-2 {
      width: 300px;
      height: 300px;
      bottom: -50px;
      left: -50px;
    }

    .circle-3 {
      width: 150px;
      height: 150px;
      top: 50%;
      right: 10%;
    }

    /* Header section */
    .header {
      text-align: center;
      padding-top: 60px;
      position: relative;
      z-index: 1;
    }

    .logo-placeholder {
      width: 80px;
      height: 80px;
      margin: 0 auto ${Spacing.lg}px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: ${FontWeight.bold};
    }

    .report-type {
      font-size: ${FontSize.h3}px;
      font-weight: ${FontWeight.medium};
      letter-spacing: 4px;
      text-transform: uppercase;
      opacity: 0.9;
      margin-bottom: ${Spacing.sm}px;
    }

    .report-title {
      font-size: ${FontSize.h1 * 1.5}px;
      font-weight: ${FontWeight.bold};
      line-height: ${LineHeight.tight};
      margin-bottom: ${Spacing.xl}px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    /* Content section */
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: ${Spacing.xl}px 0;
      position: relative;
      z-index: 1;
    }

    .info-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: ${Spacing.xl}px;
      margin: ${Spacing.md}px 0;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .info-label {
      font-size: ${FontSize.small}px;
      font-weight: ${FontWeight.medium};
      opacity: 0.8;
      margin-bottom: ${Spacing.xs}px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .info-value {
      font-size: ${FontSize.h4}px;
      font-weight: ${FontWeight.semibold};
      margin-bottom: ${Spacing.md}px;
    }

    .info-value:last-child {
      margin-bottom: 0;
    }

    /* Footer section */
    .footer {
      text-align: center;
      padding-bottom: 40px;
      position: relative;
      z-index: 1;
    }

    .report-meta {
      display: flex;
      justify-content: center;
      gap: ${Spacing.xl}px;
      margin-bottom: ${Spacing.lg}px;
      font-size: ${FontSize.body}px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: ${Spacing.sm}px;
    }

    .meta-label {
      opacity: 0.8;
    }

    .meta-value {
      font-weight: ${FontWeight.semibold};
    }

    .confidential-notice {
      display: inline-block;
      padding: ${Spacing.sm}px ${Spacing.lg}px;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.5);
      border-radius: 4px;
      font-size: ${FontSize.small}px;
      font-weight: ${FontWeight.medium};
      letter-spacing: 1px;
    }

    /* Divider */
    .divider {
      width: 60px;
      height: 4px;
      background: ${Color.neutral.white};
      margin: ${Spacing.lg}px auto;
      border-radius: 2px;
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div class="cover-container">
    <!-- Decorative elements -->
    <div class="decorative-circle circle-1"></div>
    <div class="decorative-circle circle-2"></div>
    <div class="decorative-circle circle-3"></div>

    <!-- Header -->
    <div class="header">
      <div class="logo-placeholder">⚡</div>
      <div class="report-type">投资分析报告</div>
      <h1 class="report-title">${reportTitle}</h1>
      <div class="divider"></div>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="info-card">
        <div class="info-label">项目名称</div>
        <div class="info-value">${projectName}</div>

        <div class="info-label">投资主体</div>
        <div class="info-value">${companyName}</div>

        <div class="info-label">项目地点</div>
        <div class="info-value">${province}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="report-meta">
        <div class="meta-item">
          <span class="meta-label">报告日期</span>
          <span class="meta-value">${reportDate}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">版本</span>
          <span class="meta-value">${reportVersion}</span>
        </div>
      </div>

      ${confidential ? '<div class="confidential-notice">机密文件 · 请勿外传</div>' : ''}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate cover page with default values
 */
export function generateDefaultCoverPage(projectData: {
  projectName: string;
  companyName: string;
  province: string;
}): string {
  const today = new Date();
  const reportDate = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return generateCoverPageHTML({
    reportTitle: '工商业储能投资可行性分析报告',
    projectName: projectData.projectName,
    companyName: projectData.companyName,
    province: projectData.province,
    reportDate,
    reportVersion: 'v1.0',
    confidential: true,
  });
}
