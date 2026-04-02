/**
 * PDF Generator - Investment Report PDF Generation
 *
 * Generates professional PDF reports from investment analysis results:
 * - Markdown-based report generation
 * - Professional formatting and layout
 * - Export to PDF (via markdown-to-pdf conversion)
 * - Support for Chinese characters
 */

import type { ReportDataContext } from './ReportDataContext';

export interface PDFGenerationOptions {
  outputPath?: string;
  includeCharts?: boolean;
  format?: 'markdown' | 'html' | 'pdf';
  onProgress?: (step: string, progress: number) => void;
}

export interface PDFGenerationResult {
  success: boolean;
  outputPath?: string;
  format: string;
  pageCount?: number;
  error?: string;
}

export class PDFGenerator {
  /**
   * Generate PDF report from report data
   */
  async generatePDF(
    context: ReportDataContext,
    narratives: Record<string, string>,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    const { format = 'markdown', onProgress } = options;

    try {
      onProgress?.('generating_content', 20);

      // Generate report content
      const content = this.generateReportContent(context, narratives);

      onProgress?.('formatting_document', 50);

      let outputPath: string;

      if (format === 'markdown') {
        outputPath = await this.generateMarkdown(content, options);
      } else if (format === 'html') {
        outputPath = await this.generateHTML(content, options);
      } else if (format === 'pdf') {
        // For PDF, first generate markdown, then convert
        const mdPath = await this.generateMarkdown(content, options);
        outputPath = await this.convertMarkdownToPDF(mdPath);
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

      onProgress?.('complete', 100);

      return {
        success: true,
        outputPath,
        format,
        pageCount: this.calculatePageCount(content),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[PDFGenerator] Generation failed:', errorMessage);

      return {
        success: false,
        format,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate complete report content
   */
  private generateReportContent(
    context: ReportDataContext,
    narratives: Record<string, string>
  ): string {
    const projectName = context.project.projectName || '储能项目投资分析报告';
    const generatedDate = new Date().toLocaleString('zh-CN');

    return `# ${projectName}

**生成日期**: ${generatedDate}
**报告编号**: ${this.generateReportId()}

---

## 目录

1. [项目概况](#项目概况)
2. [业主背景调查](#业主背景调查)
3. [电价政策分析](#电价政策分析)
4. [技术方案评估](#技术方案评估)
5. [财务分析](#财务分析)
6. [风险评估](#风险评估)
7. [投资建议](#投资建议)

---

${this.generateSection('项目概况', narratives.project_overview, context)}
${this.generateSection('业主背景调查', narratives.owner_due_diligence, context)}
${this.generateSection('电价政策分析', narratives.policy_analysis, context)}
${this.generateSection('技术方案评估', narratives.technical_assessment, context)}
${this.generateSection('财务分析', narratives.financial_analysis, context)}
${this.generateSection('风险评估', narratives.risk_assessment, context)}
${this.generateSection('投资建议', narratives.investment_recommendation, context)}

---

## 附录

### 数据完整性报告
${this.generateDataCompletenessReport(context)}

### 报告生成元数据
- **生成时间**: ${new Date().toISOString()}
- **数据源**: AI智能体分析 + 规则引擎计算
- **AI模型**: GLM-4 (智谱AI)
- **计算引擎**: 内置财务计算模型

---

*本报告由 ESS Financial 投资分析系统自动生成*
`;
  }

  /**
   * Generate a single section
   */
  private generateSection(
    title: string,
    content: string,
    context: ReportDataContext
  ): string {
    return `## ${title}

${content}

`;
  }

  /**
   * Generate data completeness report
   */
  private generateDataCompletenessReport(context: ReportDataContext): string {
    const report = context.getCompletenessReport();
    const completeItems = report.complete.map(item => `✅ ${item}`).join('\n');
    const incompleteItems = report.incomplete.map(item => `❌ ${item}`).join('\n');

    return `**数据完整性**: ${report.overall}%

**已完成**:
${completeItems}

**待完成**:
${incompleteItems}
`;
  }

  /**
   * Generate markdown file
   */
  private async generateMarkdown(
    content: string,
    options: PDFGenerationOptions
  ): Promise<string> {
    const outputPath = options.outputPath || this.getDefaultOutputPath('md');
    const fullPath = `/tmp/${outputPath}`; // Use temp directory for now

    // Ensure directory exists
    const fs = await import('fs/promises');
    const path = await import('path');
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write markdown file
    await fs.writeFile(fullPath, content, 'utf-8');

    console.log(`[PDFGenerator] Markdown generated: ${fullPath}`);
    return fullPath;
  }

  /**
   * Generate HTML file
   */
  private async generateHTML(
    content: string,
    options: PDFGenerationOptions
  ): Promise<string> {
    const outputPath = options.outputPath || this.getDefaultOutputPath('html');
    const fullPath = `/tmp/${outputPath}`;

    // Convert markdown to HTML
    const htmlContent = this.markdownToHTML(content);

    // Ensure directory exists
    const fs = await import('fs/promises');
    const path = await import('path');
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write HTML file
    await fs.writeFile(fullPath, htmlContent, 'utf-8');

    console.log(`[PDFGenerator] HTML generated: ${fullPath}`);
    return fullPath;
  }

  /**
   * Convert markdown to HTML (simple implementation)
   */
  private markdownToHTML(markdown: string): string {
    // Simple markdown to HTML conversion
    let html = markdown
      // Headers
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>储能项目投资分析报告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1, h2, h3, h4 { color: #333; margin-top: 24px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    pre { background-color: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
<p>${html}</p>
</body>
</html>`;
  }

  /**
   * Convert markdown to PDF
   * Note: This requires additional dependencies (markdown-pdf, puppeteer, etc.)
   * For now, returns the markdown path
   */
  private async convertMarkdownToPDF(markdownPath: string): Promise<string> {
    // TODO: Implement actual PDF conversion
    // Options:
    // 1. Use markdown-pdf library
    // 2. Use puppeteer to print HTML to PDF
    // 3. Use wkhtmltopdf command-line tool

    console.warn('[PDFGenerator] PDF conversion not yet implemented, returning markdown path');
    return markdownPath;
  }

  /**
   * Calculate page count (rough estimate)
   */
  private calculatePageCount(content: string): number {
    const wordsPerPage = 500;
    const wordCount = content.length / 5; // Rough estimate
    return Math.ceil(wordCount / wordsPerPage);
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `RPT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Get default output path
   */
  private getDefaultOutputPath(extension: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `investment-report-${date}.${extension}`;
  }

  /**
   * Generate PDF report (convenience method)
   */
  async generate(
    context: ReportDataContext,
    narratives: Record<string, string>,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    return this.generatePDF(context, narratives, options);
  }
}
