/**
 * Visual Style Configuration for Investment Report PDF Generation
 *
 * This file defines all visual styles including fonts, colors, spacing,
 * and layout rules for generating professional investment reports.
 */

// ============================================================================
// FONT SYSTEM
// ============================================================================

export const FontFamily = {
  // Primary font for Chinese content
  primary: '"PingFang SC", "Microsoft YaHei", "SimSun", sans-serif',

  // Secondary font for English content
  secondary: '"Helvetica Neue", Arial, sans-serif',

  // Monospace font for numbers and data
  mono: '"SF Mono", "Monaco", "Courier New", monospace',

  // Font for financial data (tabular figures)
  financial: '"SF Mono", "Roboto Mono", monospace',
} as const;

export const FontSize = {
  // Headings
  h1: 28, // Page title
  h2: 22, // Section title
  h3: 18, // Subsection title
  h4: 16, // Sub-subsection title

  // Body text
  body: 12,
  small: 10,
  tiny: 9,

  // Special
  caption: 10, // Chart captions
  footnote: 9, // Footnotes and disclaimers
} as const;

export const FontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.8,
  loose: 2.0,
} as const;

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const Color = {
  // Primary colors (brand colors)
  primary: {
    main: '#1a56db', // Professional blue
    dark: '#0f3d8f',
    light: '#3b82f6',
  },

  // Neutral colors (text and backgrounds)
  neutral: {
    900: '#111827', // Primary text
    800: '#1f2937', // Secondary text
    700: '#374151', // Tertiary text
    600: '#4b5563', // Muted text
    500: '#6b7280', // Disabled text
    400: '#9ca3af', // Borders
    300: '#d1d5db', // Light borders
    200: '#e5e7eb', // Dividers
    100: '#f3f4f6', // Backgrounds
    50: '#f9fafb', // Light backgrounds
    white: '#ffffff',
  },

  // Semantic colors
  success: {
    main: '#10b981', // Green for positive indicators
    light: '#d1fae5',
  },

  warning: {
    main: '#f59e0b', // Amber for warnings
    light: '#fef3c7',
  },

  error: {
    main: '#ef4444', // Red for negative indicators
    light: '#fee2e2',
  },

  info: {
    main: '#3b82f6', // Blue for information
    light: '#dbeafe',
  },

  // Chart colors (colorblind-friendly palette)
  charts: [
    '#1a56db', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#84cc16', // Lime
  ],
} as const;

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const Spacing = {
  // Base unit (8px grid system)
  unit: 8,

  // Spacing scale
  xs: 4,   // 0.5x
  sm: 8,   // 1x
  md: 16,  // 2x
  lg: 24,  // 3x
  xl: 32,  // 4x
  xxl: 48, // 6x
  xxxl: 64, // 8x
} as const;

// ============================================================================
// PAGE LAYOUT (A4)
// ============================================================================

export const Page = {
  // A4 size in mm
  width: 210,
  height: 297,

  // Margins in mm
  marginTop: 25,
  marginBottom: 20,
  marginLeft: 20,
  marginRight: 20,

  // Content area in mm
  contentWidth: 170, // 210 - 20 - 20
  contentHeight: 252, // 297 - 25 - 20
} as const;

// ============================================================================
// TYPOGRAPHY STYLES
// ============================================================================

export const TextStyle = {
  // Heading styles
  h1: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.h1 + 'px',
    fontWeight: FontWeight.bold,
    lineHeight: LineHeight.tight,
    color: Color.neutral[900],
    marginBottom: Spacing.lg,
  },

  h2: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.h2 + 'px',
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight.tight,
    color: Color.primary.main,
    marginBottom: Spacing.md,
    marginTop: Spacing.xxl,
    borderBottom: '2px solid ' + Color.primary.light,
    paddingBottom: Spacing.sm,
  },

  h3: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.h3 + 'px',
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight.normal,
    color: Color.neutral[800],
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },

  h4: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.h4 + 'px',
    fontWeight: FontWeight.medium,
    lineHeight: LineHeight.normal,
    color: Color.neutral[700],
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  // Body text styles
  body: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.body + "px",
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.normal,
    color: Color.neutral[700],
    marginBottom: Spacing.md,
  },

  small: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.small + "px",
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.normal,
    color: Color.neutral[600],
  },

  // Specialized styles
  caption: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.caption + "px",
    fontWeight: FontWeight.medium,
    lineHeight: LineHeight.normal,
    color: Color.neutral[500],
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  footnote: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.footnote + "px",
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.relaxed,
    color: Color.neutral[500],
    marginTop: Spacing.xl,
    paddingTop: Spacing.sm,
    borderTop: '1px solid ' + Color.neutral[200],
  },
};

// ============================================================================
// TABLE STYLES
// ============================================================================

export const TableStyle = {
  container: {
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: FontSize.body + 'px',
  },

  header: {
    backgroundColor: Color.neutral[50],
    fontWeight: FontWeight.semibold,
    color: Color.neutral[900],
    textAlign: 'left',
    borderBottom: '2px solid ' + Color.neutral[300],
  },

  headerCell: {
    padding: Spacing.sm + 'px ' + Spacing.md + 'px',
    fontFamily: FontFamily.primary,
    fontSize: FontSize.body + "px",
  },

  row: {
    borderBottom: '1px solid ' + Color.neutral[200],
  },

  cell: {
    padding: Spacing.sm + 'px ' + Spacing.md + 'px',
    fontFamily: FontFamily.primary,
    fontSize: FontSize.body + "px",
    color: Color.neutral[700],
  },

  // Numeric cell alignment
  cellNumeric: {
    textAlign: 'right',
    fontFamily: FontFamily.financial,
    fontVariantNumeric: 'tabular-nums',
  },

  // Alternating row colors
  rowEven: {
    backgroundColor: Color.neutral.white,
  },

  rowOdd: {
    backgroundColor: Color.neutral[50],
  },

  // Highlighted cells
  cellHighlight: {
    backgroundColor: Color.info.light,
    fontWeight: FontWeight.semibold,
  },

  cellSuccess: {
    backgroundColor: Color.success.light,
    color: Color.success.main,
  },

  cellWarning: {
    backgroundColor: Color.warning.light,
    color: Color.warning.main,
  },

  cellError: {
    backgroundColor: Color.error.light,
    color: Color.error.main,
  },
};

// ============================================================================
// CHART STYLES
// ============================================================================

export const ChartStyle = {
  // Common chart settings
  default: {
    width: 700, // px
    height: 400, // px
    backgroundColor: Color.neutral.white,
    fontFamily: FontFamily.primary,
    fontSize: FontSize.body,
    color: Color.neutral[700],
  },

  // Axis styles
  axis: {
    lineColor: Color.neutral[300],
    lineWidth: 1,
    tickColor: Color.neutral[400],
    tickLength: 5,
    labelColor: Color.neutral[600],
    labelFontSize: FontSize.small,
    titleColor: Color.neutral[700],
    titleFontSize: FontSize.body,
    titleFontWeight: FontWeight.medium,
  },

  // Grid styles
  grid: {
    color: Color.neutral[200],
    lineWidth: 1,
    dashArray: '4 4', // Dashed lines
  },

  // Legend styles
  legend: {
    fontSize: FontSize.small,
    color: Color.neutral[700],
    fontFamily: FontFamily.primary,
    position: 'bottom',
    align: 'center',
  },

  // Tooltip styles
  tooltip: {
    backgroundColor: Color.neutral[900],
    color: Color.neutral.white,
    fontSize: FontSize.small,
    padding: `${Spacing.sm}px ${Spacing.md}px`,
    borderRadius: 4,
  },

  // Series colors (use chart color palette)
  seriesColors: Color.charts,

  // Specific chart types
  line: {
    lineWidth: 2,
    pointSize: 4,
    pointColor: Color.primary.main,
    fill: false,
  },

  bar: {
    barWidth: 0.8, // 80% of category width
    borderRadius: 2,
  },

  pie: {
    innerSize: 0, // Full pie (set to 0.5 for donut)
    borderWidth: 2,
    borderColor: Color.neutral.white,
  },
};

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const ComponentStyle = {
  // Callout box for important information
  callout: {
    padding: `${Spacing.md}px ${Spacing.lg}px`,
    backgroundColor: Color.info.light,
    borderLeft: `4px solid ${Color.info.main}`,
    borderRadius: 4,
    marginBottom: Spacing.lg,
  },

  calloutTitle: {
    fontFamily: FontFamily.primary,
    fontSize: `${FontSize.h4}px`,
    fontWeight: FontWeight.semibold,
    color: Color.info.main,
    marginBottom: Spacing.sm,
  },

  calloutText: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.body + "px",
    color: Color.neutral[700],
    lineHeight: LineHeight.normal,
  },

  // Warning box
  warning: {
    padding: `${Spacing.md}px ${Spacing.lg}px`,
    backgroundColor: Color.warning.light,
    borderLeft: `4px solid ${Color.warning.main}`,
    borderRadius: 4,
    marginBottom: Spacing.lg,
  },

  // Risk rating badge
  riskBadge: {
    display: 'inline-block',
    padding: `${Spacing.xs}px ${Spacing.sm}px`,
    borderRadius: 4,
    fontSize: FontSize.small + "px",
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },

  riskBadgeLow: {
    backgroundColor: Color.success.light,
    color: Color.success.main,
  },

  riskBadgeMedium: {
    backgroundColor: Color.warning.light,
    color: Color.warning.main,
  },

  riskBadgeHigh: {
    backgroundColor: Color.error.light,
    color: Color.error.main,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Color.neutral[200],
    margin: Spacing.xl + 'px 0',
  },

  // Page break
  pageBreak: {
    pageBreakBefore: 'always',
  },
};

// ============================================================================
// CSS CLASS NAMES (for HTML templates)
// ============================================================================

export const CSSClass = {
  // Typography
  'text-h1': 'h1',
  'text-h2': 'h2',
  'text-h3': 'h3',
  'text-h4': 'h4',
  'text-body': 'body',
  'text-small': 'small',
  'text-caption': 'caption',
  'text-footnote': 'footnote',

  // Tables
  'table-container': 'table-container',
  'table': 'table',
  'table-header': 'table-header',
  'table-header-cell': 'table-header-cell',
  'table-row': 'table-row',
  'table-row-even': 'table-row-even',
  'table-row-odd': 'table-row-odd',
  'table-cell': 'table-cell',
  'table-cell-numeric': 'table-cell-numeric',

  // Components
  'callout': 'callout',
  'callout-title': 'callout-title',
  'warning': 'warning',
  'divider': 'divider',
  'page-break': 'page-break',

  // Utility
  'mb-sm': 'mb-sm',
  'mb-md': 'mb-md',
  'mb-lg': 'mb-lg',
  'mt-sm': 'mt-sm',
  'mt-md': 'mt-md',
  'mt-lg': 'mt-lg',
  'text-center': 'text-center',
  'text-right': 'text-right',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate CSS styles object for HTML templates
 */
export function generateCSSStyles(): string {
  return `
    /* Typography */
    .h1 {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.h1}px;
      font-weight: ${FontWeight.bold};
      line-height: ${LineHeight.tight};
      color: ${Color.neutral[900]};
      margin-bottom: ${Spacing.lg}px;
    }

    .h2 {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.h2}px;
      font-weight: ${FontWeight.semibold};
      line-height: ${LineHeight.tight};
      color: ${Color.primary.main};
      margin-top: ${Spacing.xxl}px;
      margin-bottom: ${Spacing.md}px;
      border-bottom: 2px solid ${Color.primary.light};
      padding-bottom: ${Spacing.sm}px;
    }

    .h3 {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.h3}px;
      font-weight: ${FontWeight.semibold};
      line-height: ${LineHeight.normal};
      color: ${Color.neutral[800]};
      margin-top: ${Spacing.lg}px;
      margin-bottom: ${Spacing.sm}px;
    }

    .h4 {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.h4}px;
      font-weight: ${FontWeight.medium};
      line-height: ${LineHeight.normal};
      color: ${Color.neutral[700]};
      margin-top: ${Spacing.md}px;
      margin-bottom: ${Spacing.sm}px;
    }

    .body {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.body}px;
      font-weight: ${FontWeight.regular};
      line-height: ${LineHeight.normal};
      color: ${Color.neutral[700]};
      margin-bottom: ${Spacing.md}px;
    }

    .small {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.small}px;
      font-weight: ${FontWeight.regular};
      line-height: ${LineHeight.normal};
      color: ${Color.neutral[600]};
    }

    .caption {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.caption}px;
      font-weight: ${FontWeight.medium};
      line-height: ${LineHeight.normal};
      color: ${Color.neutral[500]};
      margin-top: ${Spacing.sm}px;
      text-align: center;
    }

    .footnote {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.footnote}px;
      font-weight: ${FontWeight.regular};
      line-height: ${LineHeight.relaxed};
      color: ${Color.neutral[500]};
      margin-top: ${Spacing.xl}px;
      padding-top: ${Spacing.sm}px;
      border-top: 1px solid ${Color.neutral[200]};
    }

    /* Tables */
    .table-container {
      margin-bottom: ${Spacing.lg}px;
      margin-top: ${Spacing.md}px;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${FontSize.body}px;
    }

    .table-header {
      background-color: ${Color.neutral[50]};
      font-weight: ${FontWeight.semibold};
      color: ${Color.neutral[900]};
      text-align: left;
      border-bottom: 2px solid ${Color.neutral[300]};
    }

    .table-header-cell {
      padding: ${Spacing.sm}px ${Spacing.md}px;
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.body}px;
    }

    .table-row {
      border-bottom: 1px solid ${Color.neutral[200]};
    }

    .table-row-even {
      background-color: ${Color.neutral.white};
    }

    .table-row-odd {
      background-color: ${Color.neutral[50]};
    }

    .table-cell {
      padding: ${Spacing.sm}px ${Spacing.md}px;
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.body}px;
      color: ${Color.neutral[700]};
    }

    .table-cell-numeric {
      padding: ${Spacing.sm}px ${Spacing.md}px;
      font-family: ${FontFamily.financial};
      font-size: ${FontSize.body}px;
      color: ${Color.neutral[700]};
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    /* Components */
    .callout {
      padding: ${Spacing.md}px ${Spacing.lg}px;
      background-color: ${Color.info.light};
      border-left: 4px solid ${Color.info.main};
      border-radius: 4px;
      margin-bottom: ${Spacing.lg}px;
    }

    .callout-title {
      font-family: ${FontFamily.primary};
      font-size: ${FontSize.h4}px;
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

    .divider {
      height: 1px;
      background-color: ${Color.neutral[200]};
      margin: ${Spacing.xl}px 0;
    }

    .page-break {
      page-break-before: always;
    }

    /* Utility */
    .mb-sm { margin-bottom: ${Spacing.sm}px; }
    .mb-md { margin-bottom: ${Spacing.md}px; }
    .mb-lg { margin-bottom: ${Spacing.lg}px; }
    .mt-sm { margin-top: ${Spacing.sm}px; }
    .mt-md { margin-top: ${Spacing.md}px; }
    .mt-lg { margin-top: ${Spacing.lg}px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
  `;
}

/**
 * Generate inline style for a specific element
 */
export function getStyle(styleName: keyof typeof TextStyle): React.CSSProperties {
  return TextStyle[styleName] as React.CSSProperties;
}

/**
 * Get chart color by index
 */
export function getChartColor(index: number): string {
  return Color.charts[index % Color.charts.length];
}
