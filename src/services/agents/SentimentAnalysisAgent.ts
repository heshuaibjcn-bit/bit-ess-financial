/**
 * Sentiment Analysis Agent - Company Public Opinion Monitoring
 *
 * Monitors and analyzes company sentiment:
 * - Scrapes news articles and social media
 * - Analyzes sentiment trends
 * - Identifies potential risks
 * - Generates risk alerts
 */

import { NanoAgent, AgentCapability } from './NanoAgent';

export interface SentimentInput {
  companyName: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  sources?: string[];
  keywords?: string[];
}

export interface SentimentResult {
  overallScore: number; // -100 to +100
  trend: 'improving' | 'stable' | 'declining';
  sentiment: 'positive' | 'neutral' | 'negative';
  mentions: MentionsSummary;
  keyTopics: Topic[];
  risks: SentimentRisk[];
  alerts: SentimentAlert[];
  reportGenerated: string;
}

export interface MentionsSummary {
  total: number;
  news: number;
  socialMedia: number;
  government: number;
  industry: number;
  positive: number;
  negative: number;
  neutral: number;
}

export interface Topic {
  name: string;
  frequency: number;
  sentiment: number;
  keywords: string[];
}

export interface SentimentRisk {
  type: 'financial' | 'legal' | 'reputational' | 'operational';
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  recommendation: string;
}

export interface SentimentAlert {
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  description: string;
  actionRequired: string;
  timestamp: string;
}

export class SentimentAnalysisAgent extends NanoAgent {
  constructor() {
    super({
      name: 'SentimentAnalysisAgent',
      description: 'Automated company sentiment and public opinion monitoring agent',
      version: '1.0.0',
      model: 'glm-5-turbo',
      maxTokens: 4096,
      temperature: 0.3,
      systemPrompt: `You are a Sentiment Analysis Specialist for Chinese companies. Your role is to:

1. Monitor news, social media, and public mentions
2. Analyze sentiment (positive/negative/neutral)
3. Track sentiment trends over time
4. Identify potential risks and opportunities
5. Generate actionable alerts

Sentiment analysis framework:
- Overall sentiment score (-100 to +100)
- Trend direction (improving/stable/declining)
- Categorization (positive/neutral/negative)
- Key themes and topics
- Risk identification and early warning

Key sources to monitor:
- News media (news portals, industry sites)
- Social media (Weibo, WeChat, Douyin)
- Government announcements
- Industry publications
- Financial news
- Employee reviews (Boss Zhipin, etc.)

For energy storage companies, track:
- Company news and announcements
- Customer feedback and reviews
- Industry reputation
- Financial news
- Regulatory issues
- Competition landscape
- Technology trends
- Management changes

Alert triggers:
- Sudden sentiment drop (>10 points)
- Negative trend over consecutive periods
- Critical incidents or scandals
- Regulatory actions
- Financial distress signals
- Competitor gains

Provide structured analysis with:
- Clear sentiment scores and trends
- Specific risk factors with evidence
- Actionable recommendations
- Timeline and severity assessment`,
    });
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'sentiment_monitor',
        description: 'Monitor company sentiment',
        inputFormat: 'Company name and time range',
        outputFormat: 'SentimentResult',
        estimatedTime: 60,
      },
      {
        name: 'trend_analysis',
        description: 'Analyze sentiment trends',
        inputFormat: 'Historical sentiment data',
        outputFormat: 'Trend analysis report',
        estimatedTime: 30,
      },
      {
        name: 'risk_identification',
        description: 'Identify sentiment risks',
        inputFormat: 'Mentions and news',
        outputFormat: 'SentimentRisk list',
        estimatedTime: 40,
      },
    ];
  }

  async execute(input: SentimentInput): Promise<SentimentResult> {
    this.log('Starting sentiment analysis for:', input.companyName);

    // Step 1: Collect mentions
    const mentions = await this.collectMentions(input);

    // Step 2: Analyze sentiment
    const sentiment = await this.analyzeSentiment(mentions);

    // Step 3: Identify topics
    const keyTopics = await this.identifyTopics(mentions);

    // Step 4: Identify risks
    const risks = await this.identifyRisks(mentions, sentiment);

    // Step 5: Generate alerts
    const alerts = await this.generateAlerts(risks, sentiment);

    // Step 6: Determine trend
    const trend = this.determineTrend(sentiment);

    const result: SentimentResult = {
      overallScore: sentiment.overallScore,
      trend,
      sentiment: sentiment.sentiment,
      mentions,
      keyTopics,
      risks,
      alerts,
      reportGenerated: new Date().toISOString(),
    };

    this.log('Sentiment analysis completed');
    return result;
  }

  /**
   * Collect mentions from sources
   */
  private async collectMentions(input: SentimentInput): Promise<MentionsSummary> {
    this.log('Collecting mentions from sources');

    // In production, would:
    // - Search Baidu News
    // - Scrape Weibo posts
    // - Search WeChat articles
    // - Check government sites
    // - Monitor industry publications

    // Mock implementation
    return {
      total: 45,
      news: 12,
      socialMedia: 28,
      government: 3,
      industry: 2,
      positive: 32,
      negative: 5,
      neutral: 8,
    };
  }

  /**
   * Analyze sentiment
   */
  private async analyzeSentiment(mentions: MentionsSummary): Promise<{
    overallScore: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }> {
    this.log('Analyzing sentiment');

    const positiveRatio = mentions.total > 0 ? mentions.positive / mentions.total : 0;
    const negativeRatio = mentions.total > 0 ? mentions.negative / mentions.total : 0;

    // Calculate overall score (-100 to +100)
    const overallScore = Math.round((positiveRatio - negativeRatio) * 100);

    // Determine sentiment category
    let sentiment: 'positive' | 'neutral' | 'negative';
    if (overallScore >= 20) {
      sentiment = 'positive';
    } else if (overallScore <= -20) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    return { overallScore, sentiment };
  }

  /**
   * Identify key topics
   */
  private async identifyTopics(mentions: MentionsSummary): Promise<Topic[]> {
    this.log('Identifying key topics');

    // In production, would:
    // - Extract keywords from mentions
    // - Cluster related topics
    // - Rank by frequency

    // Mock topics
    return [
      {
        name: '储能项目',
        frequency: 18,
        sentiment: 0.8,
        keywords: ['储能', '电池', '投资'],
      },
      {
        name: '技术创新',
        frequency: 12,
        sentiment: 0.6,
        keywords: ['研发', '专利', '创新'],
      },
      {
        name: '财务表现',
        frequency: 8,
        sentiment: 0.4,
        keywords: ['营收', '利润', '增长'],
      },
      {
        name: '市场拓展',
        frequency: 5,
        sentiment: 0.3,
        keywords: ['市场', '客户', '销售'],
      },
    ];
  }

  /**
   * Identify risks from sentiment
   */
  private async identifyRisks(
    mentions: MentionsSummary,
    sentiment: { overallScore: number }
  ): Promise<SentimentRisk[]> {
    this.log('Identifying sentiment risks');

    const risks: SentimentRisk[] = [];

    // Check for negative sentiment threshold
    if (sentiment.overallScore < -30) {
      risks.push({
        type: 'reputational',
        level: 'critical',
        description: '整体舆情严重负面',
        evidence: [
          `负面提及占比${Math.round(mentions.negative / mentions.total * 100)}%`,
          `舆情评分${sentiment.overallScore}分`,
        ],
        recommendation: '建议立即启动公关应对，查明负面原因，制定改善计划',
      });
    } else if (sentiment.overallScore < -10) {
      risks.push({
        type: 'reputational',
        level: 'medium',
        description: '舆情偏负面',
        evidence: [
          `负面提及占比${Math.round(mentions.negative / mentions.total * 100)}%`,
        ],
        recommendation: '建议关注负面信息源头，加强正面宣传',
      });
    }

    // Check for high negative mention count
    if (mentions.negative > 10) {
      risks.push({
        type: 'reputational',
        level: 'medium',
        description: '负面提及数量较多',
        evidence: [`发现${mentions.negative}条负面信息`],
        recommendation: '建议梳理主要负面问题，针对性改善',
      });
    }

    // Financial risk indicators
    const financialKeywords = ['欠款', '债务', '资金链', '诉讼'];
    for (const keyword of financialKeywords) {
      // Would check if these keywords appear in mentions
      // Mock: assume found
      if (keyword === '诉讼') {
        risks.push({
          type: 'legal',
          level: 'low',
          description: '涉及法律诉讼提及',
          evidence: ['媒体报道中包含诉讼相关内容'],
          recommendation: '建议核实诉讼情况，评估潜在影响',
        });
      }
    }

    return risks;
  }

  /**
   * Generate alerts based on risks and sentiment
   */
  private async generateAlerts(
    risks: SentimentRisk[],
    sentiment: { overallScore: number }
  ): Promise<SentimentAlert[]> {
    this.log('Generating alerts');

    const alerts: SentimentAlert[] = [];

    // Generate alert for critical risks
    const criticalRisks = risks.filter(r => r.level === 'critical');
    if (criticalRisks.length > 0) {
      alerts.push({
        severity: 'urgent',
        title: '严重舆情风险',
        description: `发现${criticalRisks.length}个严重舆情风险`,
        actionRequired: '立即启动应急响应机制',
        timestamp: new Date().toISOString(),
      });
    }

    // Generate alert for very low sentiment
    if (sentiment.overallScore < -40) {
      alerts.push({
        severity: 'urgent',
        title: '舆情评分严重偏低',
        description: `当前舆情评分${sentiment.overallScore}分，远低于警戒线`,
        actionRequired: '立即组织公关团队，制定危机应对方案',
        timestamp: new Date().toISOString(),
      });
    }

    // Generate warning for medium risks
    const mediumRisks = risks.filter(r => r.level === 'medium');
    if (mediumRisks.length > 0 && alerts.length === 0) {
      alerts.push({
        severity: 'warning',
        title: '存在中度舆情风险',
        description: `发现${mediumRisks.length}个中度舆情风险`,
        actionRequired: '建议关注并制定改善计划',
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  }

  /**
   * Determine sentiment trend
   */
  private determineTrend(sentiment: { overallScore: number }): 'improving' | 'stable' | 'declining' {
    // In production, would compare with historical data
    // Mock: assume stable
    return 'stable';
  }

  /**
   * Get sentiment trend over time
   */
  async getTrend(companyName: string, days: number = 30): Promise<{
    dates: string[];
    scores: number[];
    trend: 'improving' | 'stable' | 'declining';
    change: number;
  }> {
    this.log(`Getting ${days} day trend for ${companyName}`);

    // Mock trend data
    const dates: string[] = [];
    const scores: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
      // Mock score with slight random variation
      scores.push(60 + Math.floor(Math.random() * 30));
    }

    // Calculate trend
    const firstAvg = scores.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
    const lastAvg = scores.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const change = lastAvg - firstAvg;

    let trend: 'improving' | 'stable' | 'declining';
    if (change > 5) {
      trend = 'improving';
    } else if (change < -5) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    return { dates, scores, trend, change: Math.round(change) };
  }
}
