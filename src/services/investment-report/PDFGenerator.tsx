/**
 * PDF Generator - Investment Report PDF Generation
 *
 * Generates professional PDF reports from investment analysis results:
 * - React-PDF-based rendering (works in browser, no Node.js/Chromium needed)
 * - Professional formatting and layout using visual-style tokens
 * - Support for Chinese characters via system fonts
 * - Browser-native download via Blob URL
 *
 * Dependencies:
 * - @react-pdf/renderer: React-based PDF generation for the browser
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
} from '@react-pdf/renderer';
import type { ReportDataContext } from './ReportDataContext';
import { PDFGenerationError } from './errors';
import {
  Color,
  FontSize,
  FontWeight,
  Spacing,
} from './visual-style';
import { REPORT_STRUCTURE } from './templates';

// ---------------------------------------------------------------------------
// Font registration for Chinese content
// ---------------------------------------------------------------------------

// Register system fonts for Chinese character support.
// @react-pdf/renderer uses these families when rendering text.
// The browser will resolve system fonts at render time.
Font.register({
  family: 'PingFang SC',
  fonts: [
    { src: 'PingFang SC' }, // macOS system font
  ],
});

Font.register({
  family: 'Helvetica Neue',
  fonts: [
    { src: 'Helvetica Neue' },
  ],
});

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PDFGenerationOptions {
  outputPath?: string;
  includeCharts?: boolean;
  format?: 'markdown' | 'html' | 'pdf';
  onProgress?: (step: string, progress: number) => void;
}

export interface PDFGenerationResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  format: string;
  pageCount?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // -- Cover page --
  coverPage: {
    flex: 1,
    backgroundColor: Color.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
    justifyContent: 'space-between',
  },
  coverHeader: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
  },
  coverLogo: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  coverLogoText: {
    fontSize: 28,
    color: Color.neutral.white,
  },
  coverReportType: {
    fontSize: FontSize.h3,
    color: Color.neutral.white,
    letterSpacing: 4,
    marginBottom: Spacing.sm,
    opacity: 0.9,
  },
  coverTitle: {
    fontSize: FontSize.h1 * 1.5,
    fontWeight: FontWeight.bold,
    color: Color.neutral.white,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  coverDivider: {
    width: 60,
    height: 4,
    backgroundColor: Color.neutral.white,
    opacity: 0.5,
    alignSelf: 'center',
    borderRadius: 2,
  },

  coverContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  coverInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  coverInfoLabel: {
    fontSize: FontSize.small,
    color: Color.neutral.white,
    opacity: 0.8,
    marginBottom: Spacing.xs,
    letterSpacing: 1,
  },
  coverInfoValue: {
    fontSize: FontSize.h4,
    fontWeight: FontWeight.semibold,
    color: Color.neutral.white,
    marginBottom: Spacing.md,
  },

  coverFooter: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  coverMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  coverMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverMetaLabel: {
    fontSize: FontSize.body,
    color: Color.neutral.white,
    opacity: 0.8,
    marginRight: Spacing.sm,
  },
  coverMetaValue: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Color.neutral.white,
  },
  coverConfidential: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.5)',
    borderRadius: 4,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    color: Color.neutral.white,
    letterSpacing: 1,
  },

  // -- Chapter divider page --
  chapterPage: {
    flex: 1,
    backgroundColor: Color.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  chapterBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Color.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  chapterBadgeText: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Color.neutral.white,
  },
  chapterLabel: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.medium,
    color: Color.neutral[500],
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  chapterTitle: {
    fontSize: FontSize.h1 * 1.2,
    fontWeight: FontWeight.bold,
    color: Color.neutral[900],
    textAlign: 'center',
    marginBottom: Spacing.md,
    maxWidth: 500,
  },
  chapterTitleEn: {
    fontSize: FontSize.h3,
    color: Color.neutral[600],
    textAlign: 'center',
    marginTop: Spacing.md,
    maxWidth: 500,
  },
  chapterDividerLine: {
    width: 80,
    height: 4,
    backgroundColor: Color.primary.main,
    marginTop: Spacing.xl,
    borderRadius: 2,
  },
  chapterPageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: FontSize.small,
    color: Color.neutral[400],
    fontWeight: FontWeight.medium,
  },

  // -- Content page --
  contentPage: {
    flex: 1,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Color.neutral.white,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    marginBottom: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: Color.primary.light,
  },
  contentHeaderTitle: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    color: Color.neutral[500],
    letterSpacing: 1,
  },
  contentHeaderPageNum: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    color: Color.primary.main,
  },
  contentBody: {
    flex: 1,
  },
  contentFooter: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Color.neutral[200],
  },
  contentFooterDisclaimer: {
    fontSize: FontSize.footnote,
    color: Color.neutral[500],
    marginBottom: Spacing.sm,
  },
  contentFooterCopyright: {
    fontSize: FontSize.footnote,
    color: Color.neutral[500],
    textAlign: 'center',
  },

  // -- Text styles inside content --
  heading2: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semibold,
    color: Color.primary.main,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Color.primary.light,
  },
  heading3: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semibold,
    color: Color.neutral[800],
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  bodyText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    color: Color.neutral[700],
    lineHeight: 1.5,
    marginBottom: Spacing.md,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.md,
  },
  bulletDot: {
    fontSize: FontSize.body,
    color: Color.primary.main,
    marginRight: Spacing.sm,
  },
  bulletText: {
    fontSize: FontSize.body,
    color: Color.neutral[700],
    flex: 1,
  },
  boldText: {
    fontWeight: FontWeight.semibold,
    color: Color.neutral[900],
  },
});

// ---------------------------------------------------------------------------
// Helper: parse simple markdown to React-PDF elements
// ---------------------------------------------------------------------------

/**
 * Parse a markdown string into an array of React-PDF elements.
 * This is intentionally lightweight: it handles ##, ###, **bold**, - bullets,
 * and plain paragraphs. It is sufficient for the narrative content produced
 * by the ReportNarrativeAgent.
 */
function parseMarkdownToPDFElements(markdown: string): React.ReactElement[] {
  const elements: React.ReactElement[] = [];
  const lines = markdown.split('\n');
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      elements.push(
        <View key={key++} style={{ height: 1, backgroundColor: Color.neutral[200], marginVertical: Spacing.lg }} />
      );
      i++;
      continue;
    }

    // ### Heading 3
    if (line.startsWith('### ')) {
      elements.push(
        <Text key={key++} style={styles.heading3}>
          {line.slice(4).trim()}
        </Text>
      );
      i++;
      continue;
    }

    // ## Heading 2
    if (line.startsWith('## ')) {
      elements.push(
        <Text key={key++} style={styles.heading2}>
          {line.slice(3).trim()}
        </Text>
      );
      i++;
      continue;
    }

    // Bullet points (- or *)
    if (/^[-*]\s/.test(line)) {
      const bulletLines: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        bulletLines.push(lines[i].replace(/^[-*]\s/, ''));
        i++;
      }
      elements.push(
        <View key={key++}>
          {bulletLines.map((bl, bi) => (
            <View key={bi} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>{'\u2022'}</Text>
              <Text style={styles.bulletText}>{renderInlineFormatting(bl)}</Text>
            </View>
          ))}
        </View>
      );
      continue;
    }

    // Numbered list (1. 2. etc.)
    if (/^\d+\.\s/.test(line)) {
      const numberedLines: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        numberedLines.push(lines[i]);
        i++;
      }
      elements.push(
        <View key={key++}>
          {numberedLines.map((nl, ni) => (
            <View key={ni} style={styles.bulletItem}>
              <Text style={[styles.bulletDot, { color: Color.neutral[700] }]}>
                {nl.match(/^(\d+)\./)?.[1] + '.'}
              </Text>
              <Text style={styles.bulletText}>{renderInlineFormatting(nl.replace(/^\d+\.\s/, ''))}</Text>
            </View>
          ))}
        </View>
      );
      continue;
    }

    // Plain paragraph -- collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('##') &&
      !lines[i].startsWith('---') &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      elements.push(
        <Text key={key++} style={styles.bodyText}>
          {renderInlineFormatting(paraLines.join(' '))}
        </Text>
      );
    }
  }

  return elements;
}

/**
 * Handle inline **bold** formatting within a text string.
 * Returns a React element containing mixed Text nodes.
 */
function renderInlineFormatting(text: string): React.ReactElement {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return React.createElement(
    Text,
    { style: styles.bodyText },
    ...parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return React.createElement(
          Text,
          { key: idx, style: styles.boldText },
          part.slice(2, -2)
        );
      }
      return React.createElement(Text, { key: idx }, part);
    })
  );
}

// ---------------------------------------------------------------------------
// React-PDF Document Components
// ---------------------------------------------------------------------------

interface CoverPageProps {
  projectName: string;
  companyName: string;
  province: string;
  reportDate: string;
}

const CoverPage: React.FC<CoverPageProps> = ({
  projectName,
  companyName,
  province,
  reportDate,
}) => (
  <Page size="A4" style={styles.coverPage}>
    {/* Header */}
    <View style={styles.coverHeader}>
      <View style={styles.coverLogo}>
        <Text style={styles.coverLogoText}>{'\u26A1'}</Text>
      </View>
      <Text style={styles.coverReportType}>INVESTMENT ANALYSIS REPORT</Text>
      <Text style={styles.coverTitle}>{'\u5DE5\u5546\u4E1A\u50A8\u80FD\u6295\u8D44\u53EF\u884C\u6027\u5206\u6790\u62A5\u544A'}</Text>
      <View style={styles.coverDivider} />
    </View>

    {/* Content */}
    <View style={styles.coverContent}>
      <View style={styles.coverInfoCard}>
        <Text style={styles.coverInfoLabel}>{'\u9879\u76EE\u540D\u79F0'}</Text>
        <Text style={styles.coverInfoValue}>{projectName}</Text>
        <Text style={styles.coverInfoLabel}>{'\u6295\u8D44\u4E3B\u4F53'}</Text>
        <Text style={styles.coverInfoValue}>{companyName}</Text>
        <Text style={styles.coverInfoLabel}>{'\u9879\u76EE\u5730\u70B9'}</Text>
        <Text style={styles.coverInfoValue}>{province}</Text>
      </View>
    </View>

    {/* Footer */}
    <View style={styles.coverFooter}>
      <View style={styles.coverMetaRow}>
        <View style={styles.coverMetaItem}>
          <Text style={styles.coverMetaLabel}>{'\u62A5\u544A\u65E5\u671F'}</Text>
          <Text style={styles.coverMetaValue}>{reportDate}</Text>
        </View>
        <View style={styles.coverMetaItem}>
          <Text style={styles.coverMetaLabel}>{'\u7248\u672C'}</Text>
          <Text style={styles.coverMetaValue}>v1.0</Text>
        </View>
      </View>
      <View style={styles.coverConfidential}>
        <Text>{'\u673A\u5BC6\u6587\u4EF6 \u00B7 \u8BF7\u52FF\u5916\u4F20'}</Text>
      </View>
    </View>
  </Page>
);

interface ChapterPageProps {
  chapterNumber: number;
  chapterTitle: string;
  chapterTitleEn?: string;
}

const ChapterPage: React.FC<ChapterPageProps> = ({
  chapterNumber,
  chapterTitle,
  chapterTitleEn,
}) => (
  <Page size="A4" style={styles.chapterPage}>
    <View style={styles.chapterBadge}>
      <Text style={styles.chapterBadgeText}>{chapterNumber}</Text>
    </View>
    <Text style={styles.chapterLabel}>CHAPTER</Text>
    <Text style={styles.chapterTitle}>{chapterTitle}</Text>
    {chapterTitleEn ? (
      <Text style={styles.chapterTitleEn}>{chapterTitleEn}</Text>
    ) : null}
    <View style={styles.chapterDividerLine} />
    <Text style={styles.chapterPageNumber}>- {chapterNumber} -</Text>
  </Page>
);

interface ContentPageProps {
  reportTitle: string;
  currentPage: number;
  totalPages: number;
  showFooter?: boolean;
  children: React.ReactNode;
}

const ContentPage: React.FC<ContentPageProps> = ({
  reportTitle,
  currentPage,
  totalPages,
  showFooter = true,
  children,
}) => (
  <Page size="A4" style={styles.contentPage}>
    {/* Header */}
    <View style={styles.contentHeader}>
      <Text style={styles.contentHeaderTitle}>{reportTitle}</Text>
      <Text style={styles.contentHeaderPageNum}>
        {currentPage} / {totalPages}
      </Text>
    </View>

    {/* Body */}
    <View style={styles.contentBody}>{children}</View>

    {/* Footer */}
    {showFooter ? (
      <View style={styles.contentFooter}>
        <Text style={styles.contentFooterDisclaimer}>
          {'\u672C\u62A5\u544A\u57FA\u4E8E\u5F53\u524D\u53EF\u83B7\u5F97\u7684\u4FE1\u606F\u505A\u51FA\uFF0C\u4EC5\u4F9B\u53C2\u8003\u3002\u5B9E\u9645\u6295\u8D44\u51B3\u7B56\u5E94\u8003\u8651\u66F4\u8BE6\u7EC6\u7684\u5C3D\u804C\u8C03\u67E5\u548C\u5E02\u573A\u8C03\u7814\u3002'}
        </Text>
        <Text style={styles.contentFooterCopyright}>
          {'\u00A9 '}{new Date().getFullYear()} ESS Financial. All rights reserved.
        </Text>
      </View>
    ) : null}
  </Page>
);

// ---------------------------------------------------------------------------
// Main generator class
// ---------------------------------------------------------------------------

export class PDFGenerator {
  /**
   * Generate PDF report from report data.
   *
   * Returns a Blob-based result that works entirely in the browser.
   * No filesystem writes or Node.js APIs are used.
   */
  async generatePDF(
    context: ReportDataContext,
    narratives: Record<string, string>,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    const { format = 'pdf', onProgress } = options;

    try {
      onProgress?.('generating_document_structure', 10);

      // Build the React-PDF document tree
      const { document: documentElement, pageCount } = this.buildPDFDocument(context, narratives);

      onProgress?.('rendering_pdf', 50);

      // Use the low-level pdf() API to generate a Blob
      const instance = pdf(documentElement);
      const blob = await instance.toBlob();

      onProgress?.('creating_download_url', 80);

      // Create an object URL for browser download
      const url = URL.createObjectURL(blob);

      onProgress?.('complete', 100);

      console.log(`[PDFGenerator] PDF generated: ${blob.size} bytes, ${pageCount} pages`);

      return {
        success: true,
        blob,
        url,
        format,
        pageCount,
      };
    } catch (error) {
      // If it's already a PDFGenerationError, rethrow it
      if (error instanceof PDFGenerationError) {
        console.error('[PDFGenerator] Generation failed:', error.toLogObject());
        return {
          success: false,
          format,
          error: error.toUserMessage(),
        };
      }

      // Wrap other errors in PDFGenerationError
      const pdfError = new PDFGenerationError(
        `PDF\u751F\u6210\u5931\u8D25: ${error instanceof Error ? error.message : String(error)}`,
        format,
        error instanceof Error ? error : undefined
      );
      console.error('[PDFGenerator] Generation failed:', pdfError.toLogObject());

      return {
        success: false,
        format,
        error: pdfError.toUserMessage(),
      };
    }
  }

  /**
   * Build the full React-PDF document tree and return it with page count.
   */
  private buildPDFDocument(
    context: ReportDataContext,
    narratives: Record<string, string>
  ): { document: React.ReactElement; pageCount: number } {
    const projectName = context.project.projectName || '\u50A8\u80FD\u9879\u76EE\u6295\u8D44\u5206\u6790\u62A5\u544A';
    const reportDate = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const pages: React.ReactElement[] = [];

    // 1. Cover page
    pages.push(
      <CoverPage
        key="cover"
        projectName={projectName}
        companyName={context.project.ownerInfo?.companyName || '\u5F85\u5B9A'}
        province={context.project.province || '\u5F85\u5B9A'}
        reportDate={reportDate}
      />
    );

    // 2. Chapter divider pages + content pages
    for (const section of REPORT_STRUCTURE) {
      const narrative = narratives[section.id];
      if (!narrative) continue;

      // Chapter divider
      pages.push(
        <ChapterPage
          key={`chapter-${section.id}`}
          chapterNumber={section.order}
          chapterTitle={section.title}
          chapterTitleEn={section.titleEn}
        />
      );

      // Content page
      const contentElements = parseMarkdownToPDFElements(narrative);
      const pageNum = pages.length + 1;
      pages.push(
        <ContentPage
          key={`content-${section.id}`}
          reportTitle={projectName}
          currentPage={pageNum}
          totalPages={0} // placeholder, real total not known until all pages built
          showFooter={true}
        >
          {contentElements}
        </ContentPage>
      );
    }

    const totalPages = pages.length;

    // Wrap all pages in a <Document>
    const document = React.createElement(Document, {}, ...pages);

    return { document, pageCount: totalPages };
  }

  /**
   * Generate complete report content as markdown string.
   * Used for markdown/HTML export (not PDF).
   */
  private generateReportContent(
    context: ReportDataContext,
    narratives: Record<string, string>
  ): string {
    const projectName = context.project.projectName || '\u50A8\u80FD\u9879\u76EE\u6295\u8D44\u5206\u6790\u62A5\u544A';
    const generatedDate = new Date().toLocaleString('zh-CN');

    return `# ${projectName}

**\u751F\u6210\u65E5\u671F**: ${generatedDate}
**\u62A5\u544A\u7F16\u53F7**: ${this.generateReportId()}

---

## \u76EE\u5F55

1. [\u9879\u76EE\u6982\u51B5](#\u9879\u76EE\u6982\u51B5)
2. [\u4E1A\u4E3B\u80CC\u666F\u8C03\u67E5](#\u4E1A\u4E3B\u80CC\u666F\u8C03\u67E5)
3. [\u7535\u4EF7\u653F\u7B56\u5206\u6790](#\u7535\u4EF7\u653F\u7B56\u5206\u6790)
4. [\u6280\u672F\u65B9\u6848\u8BC4\u4F30](#\u6280\u672F\u65B9\u6848\u8BC4\u4F30)
5. [\u8D22\u52A1\u5206\u6790](#\u8D22\u52A1\u5206\u6790)
6. [\u98CE\u9669\u8BC4\u4F30](#\u98CE\u9669\u8BC4\u4F30)
7. [\u6295\u8D44\u5EFA\u8BAE](#\u6295\u8D44\u5EFA\u8BAE)

---

${this.generateSection('\u9879\u76EE\u6982\u51B5', narratives.project_overview, context)}
${this.generateSection('\u4E1A\u4E3B\u80CC\u666F\u8C03\u67E5', narratives.owner_due_diligence, context)}
${this.generateSection('\u7535\u4EF7\u653F\u7B56\u5206\u6790', narratives.policy_analysis, context)}
${this.generateSection('\u6280\u672F\u65B9\u6848\u8BC4\u4F30', narratives.technical_assessment, context)}
${this.generateSection('\u8D22\u52A1\u5206\u6790', narratives.financial_analysis, context)}
${this.generateSection('\u98CE\u9669\u8BC4\u4F30', narratives.risk_assessment, context)}
${this.generateSection('\u6295\u8D44\u5EFA\u8BAE', narratives.investment_recommendation, context)}

---

## \u9644\u5F55

### \u6570\u636E\u5B8C\u6574\u6027\u62A5\u544A
${this.generateDataCompletenessReport(context)}

### \u62A5\u544A\u751F\u6210\u5143\u6570\u636E
- **\u751F\u6210\u65F6\u95F4**: ${new Date().toISOString()}
- **\u6570\u636E\u6E90**: AI\u667A\u80FD\u4F53\u5206\u6790 + \u89C4\u5219\u5F15\u64CE\u8BA1\u7B97
- **AI\u6A21\u578B**: GLM-4 (\u667A\u8C31AI)
- **\u8BA1\u7B97\u5F15\u64CE**: \u5185\u7F6E\u8D22\u52A1\u8BA1\u7B97\u6A21\u578B

---

*\u672C\u62A5\u544A\u7531 ESS Financial \u6295\u8D44\u5206\u6790\u7CFB\u7EDF\u81EA\u52A8\u751F\u6210*
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
    const completeItems = report.complete.map(item => `\u2705 ${item}`).join('\n');
    const incompleteItems = report.incomplete.map(item => `\u274C ${item}`).join('\n');

    return `**\u6570\u636E\u5B8C\u6574\u6027**: ${report.overall}%

**\u5DF2\u5B8C\u6210**:
${completeItems}

**\u5F85\u5B8C\u6210**:
${incompleteItems}
`;
  }

  /**
   * Generate markdown content string (no filesystem -- caller handles saving)
   */
  generateMarkdownContent(
    context: ReportDataContext,
    narratives: Record<string, string>
  ): string {
    return this.generateReportContent(context, narratives);
  }

  /**
   * Generate HTML content from markdown (returns string, no filesystem)
   */
  generateHTMLContent(
    context: ReportDataContext,
    narratives: Record<string, string>
  ): string {
    const markdown = this.generateReportContent(context, narratives);
    return this.markdownToHTML(markdown);
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
  <title>\u50A8\u80FD\u9879\u76EE\u6295\u8D44\u5206\u6790\u62A5\u544A</title>
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
   * Get default output filename (no /tmp/ prefix -- browser-only)
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

  /**
   * Trigger browser download of the generated PDF blob.
   * Call this after generatePDF() returns successfully.
   */
  downloadPDF(result: PDFGenerationResult, filename?: string): void {
    if (!result.success || !result.blob) {
      console.error('[PDFGenerator] Cannot download: no blob available');
      return;
    }

    const name = filename || this.getDefaultOutputPath('pdf');
    const url = result.url || URL.createObjectURL(result.blob);

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL after a short delay
    if (!result.url) {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}
