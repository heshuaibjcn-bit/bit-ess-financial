/**
 * React Hooks for AI Investment Advisor
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ProjectInput } from '@/domain/schemas/ProjectSchema';
import { EngineResult } from '@/domain/services/CalculationEngine';
import {
  getAIAdvisor,
  AIInvestmentAdvisor,
  InvestmentRecommendation
} from '@/services/ai/InvestmentAdvisor';

/**
 * Hook for AI investment recommendation
 */
export function useAIInvestmentRecommendation() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const advisor = getAIAdvisor();

  const getRecommendation = useCallback(async (
    projectInput: ProjectInput,
    calculationResult: EngineResult
  ): Promise<InvestmentRecommendation> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const recommendation = await advisor.generateRecommendation(
        projectInput,
        calculationResult
      );
      return recommendation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分析失败，请稍后重试';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const getQuickScore = useCallback(async (
    projectInput: ProjectInput,
    calculationResult: EngineResult
  ) => {
    return await advisor.getQuickScore(projectInput, calculationResult);
  }, []);

  const suggestOptimizations = useCallback(async (
    projectInput: ProjectInput,
    calculationResult: EngineResult
  ) => {
    return await advisor.suggestOptimizations(projectInput, calculationResult);
  }, []);

  return {
    isAnalyzing,
    error,
    getRecommendation,
    getQuickScore,
    suggestOptimizations,
  };
}

/**
 * Hook for AI-powered investment insights
 */
export function useAIInvestmentInsights() {
  const [insights, setInsights] = useState<InvestmentRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const advisor = getAIAdvisor();

  const analyzeInvestment = useCallback(async (
    projectInput: ProjectInput,
    calculationResult: EngineResult
  ) => {
    setIsLoading(true);
    try {
      const recommendation = await advisor.generateRecommendation(
        projectInput,
        calculationResult
      );
      setInsights(recommendation);
      return recommendation;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    insights,
    isLoading,
    analyzeInvestment,
  };
}

/**
 * Component for displaying AI recommendations
 */
export function AIRecommendationPanel({
  recommendation,
  onApplySuggestion
}: {
  recommendation: InvestmentRecommendation;
  onApplySuggestion?: (suggestion: any) => void;
}) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className={`p-4 rounded-lg border ${getRatingColor(recommendation.overall_rating)}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">投资评级</h3>
          <span className="text-sm font-medium">{recommendation.confidence_score}% 信心指数</span>
        </div>
        <div className="text-2xl font-bold capitalize">{recommendation.overall_rating}</div>
      </div>

      {/* Key Strengths */}
      {recommendation.key_strengths.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-green-600">✓</span> 核心优势
          </h4>
          <ul className="space-y-1">
            {recommendation.key_strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 mt-0.5">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Risks */}
      {recommendation.key_risks.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-red-600">⚠</span> 主要风险
          </h4>
          <ul className="space-y-1">
            {recommendation.key_risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-red-600 mt-0.5">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendation.recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">优化建议</h4>
          <div className="space-y-2">
            {recommendation.recommendations.map((rec, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(rec.priority)}`}>
                        {rec.priority === 'high' ? '高优先级' : rec.priority === 'medium' ? '中优先级' : '低优先级'}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{rec.category}</span>
                    </div>
                    <h5 className="font-medium">{rec.title}</h5>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>预期影响: {rec.expected_impact}</span>
                  <span>实施难度: {rec.implementation_effort}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Opportunities */}
      {recommendation.optimization_opportunities.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">优化机会</h4>
          <div className="space-y-2">
            {recommendation.optimization_opportunities.map((opt, i) => (
              <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium">{opt.area}</span>
                  <span className="text-sm text-green-600 font-semibold">
                    +{opt.improvement_percentage}%
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  当前: {opt.current_value} → 优化后: {opt.optimized_value}
                </div>
                <p className="text-xs text-gray-500">{opt.action_required}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Outlook */}
      <div>
        <h4 className="font-semibold mb-3">市场展望</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500 mb-1">电价趋势</div>
            <div className="font-medium capitalize">{recommendation.market_outlook.electricity_price_trend}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500 mb-1">需求前景</div>
            <div className="font-medium capitalize">{recommendation.market_outlook.demand_outlook}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500 mb-1">政策环境</div>
            <div className="font-medium Capitalize">{recommendation.market_outlook.policy_environment}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500 mb-1">竞争程度</div>
            <div className="font-medium capitalize">{recommendation.market_outlook.competition_level}</div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{recommendation.market_outlook.time_horizon}</p>
      </div>

      {/* Risk Mitigation */}
      {recommendation.risk_mitigation.identified_risks.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">风险管理</h4>
          <div className="space-y-3">
            {recommendation.risk_mitigation.identified_risks.map((risk, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium">{risk.description}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    risk.severity === 'high' ? 'bg-red-100 text-red-800' :
                    risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {risk.severity === 'high' ? '高风险' : risk.severity === 'medium' ? '中风险' : '低风险'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <span>可能性: {risk.likelihood}%</span>
                  <span>影响度: {risk.impact}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
