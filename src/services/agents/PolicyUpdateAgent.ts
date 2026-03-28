/**
 * Policy Update Agent - Automated Policy Monitoring & Updates
 *
 * A lightweight NanoAgent that:
 * - Monitors government policy sources
 * - Detects new or updated policies
 * - Parses policy content
 * - Updates policy database
 * - Generates change summaries
 */

import { NanoAgent, AgentCapability } from './NanoAgent';
import { getPolicyPool } from '../policy/PolicyPoolService';
import type {
  PolicyDocument,
  PolicyCategory,
  PolicyLevel,
} from '../../domain/schemas/PolicySchema';

interface PolicyUpdateInput {
  sources: string[];
  checkInterval?: number; // in hours
  forceUpdate?: boolean;
}

interface PolicyUpdateResult {
  newPolicies: number;
  updatedPolicies: number;
  totalPolicies: number;
  changes: PolicyChange[];
  summary: string;
}

interface PolicyChange {
  type: 'new' | 'updated' | 'expired';
  policyId: string;
  title: string;
  description: string;
  impact: string;
}

export class PolicyUpdateAgent extends NanoAgent {
  constructor() {
    super({
      name: 'PolicyUpdateAgent',
      description: 'Automated policy monitoring and update agent',
      version: '1.0.0',
      model: 'glm-5-turbo',
      maxTokens: 4096,
      temperature: 0.3,
      systemPrompt: `You are a Policy Update Specialist for energy storage policies. Your role is to:

1. Monitor government policy sources for new or updated policies
2. Extract key policy information (title, category, agency, dates)
3. Analyze policy changes and their impact on energy storage
4. Generate concise summaries of what changed

Focus on these policy categories:
- Tariff policies (time-of-use pricing, basic fees)
- Subsidy policies (investment subsidies, feed-in tariffs)
- Technical standards (battery requirements, safety)
- Market policies (spot market, ancillary services)
- Grid policies (connection requirements, processes)
- Planning policies (development goals, targets)
- Tax policies (tax incentives, exemptions)

For each policy, identify:
- Whether it's new or an update
- Key changes from previous versions
- Impact on energy storage investments
- Recommended actions for stakeholders

Provide responses in JSON format with clear, actionable information.`,
    });
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'policy_check',
        description: 'Check for new or updated policies',
        inputFormat: 'Array of policy source URLs',
        outputFormat: 'PolicyUpdateResult with changes',
        estimatedTime: 30,
      },
      {
        name: 'policy_parse',
        description: 'Parse policy document content',
        inputFormat: 'Policy URL or text content',
        outputFormat: 'Structured policy data',
        estimatedTime: 15,
      },
      {
        name: 'policy_summarize',
        description: 'Generate policy change summary',
        inputFormat: 'Policy document',
        outputFormat: 'Text summary',
        estimatedTime: 20,
      },
    ];
  }

  async execute(input: PolicyUpdateInput): Promise<PolicyUpdateResult> {
    this.log('Starting policy update check');

    const changes: PolicyChange[] = [];
    let newCount = 0;
    let updatedCount = 0;

    // Check each source
    for (const source of input.sources) {
      this.log(`Checking source: ${source}`);

      try {
        // Simulate policy check (in production, would actually crawl)
        const sourceChanges = await this.checkSource(source);
        changes.push(...sourceChanges);
        newCount += sourceChanges.filter(c => c.type === 'new').length;
        updatedCount += sourceChanges.filter(c => c.type === 'updated').length;
      } catch (error) {
        this.log(`Failed to check source ${source}`, error);
      }
    }

    // Get total policy count
    const policyPool = getPolicyPool();
    const allPolicies = policyPool.getAllPolicies();

    // Generate summary
    const summary = await this.generateSummary(changes);

    const result: PolicyUpdateResult = {
      newPolicies: newCount,
      updatedPolicies: updatedCount,
      totalPolicies: allPolicies.length,
      changes,
      summary,
    };

    this.log('Policy update check completed', result);
    return result;
  }

  /**
   * Check a policy source for changes
   */
  private async checkSource(source: string): Promise<PolicyChange[]> {
    // Simulate checking (in production, would crawl the URL)
    // Return mock changes for demonstration

    const mockChanges: PolicyChange[] = [
      {
        type: 'new',
        policyId: 'mock-1',
        title: '示例：某省储能补贴新政策',
        description: '新增储能项目投资补贴，每千瓦补贴100元',
        impact: '将显著提升该地区储能项目经济性',
      },
    ];

    return mockChanges;
  }

  /**
   * Generate summary of policy changes
   */
  private async generateSummary(changes: PolicyChange[]): Promise<string> {
    if (changes.length === 0) {
      return '本次检查未发现新的政策变化。';
    }

    const prompt = `总结以下政策变化：

${changes.map(c => `- ${c.type === 'new' ? '新增' : '更新'}: ${c.title} - ${c.description}`).join('\n')}

请用100-200字总结这些变化的整体影响和重要性。`;

    try {
      const summary = await this.think(prompt);
      return summary;
    } catch (error) {
      return `发现 ${changes.length} 项政策变化：${changes.filter(c => c.type === 'new').length} 项新增，${changes.filter(c => c.type === 'updated').length} 项更新。`;
    }
  }

  /**
   * Schedule automatic updates
   */
  scheduleUpdates(checkInterval: number = 1): NodeJS.Timeout {
    this.log(`Scheduling updates every ${checkInterval} hour(s)`);

    return setInterval(async () => {
      this.log('Running scheduled policy update');
      // Would check all configured sources
    }, checkInterval * 60 * 60 * 1000);
  }
}
