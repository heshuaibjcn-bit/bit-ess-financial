/**
 * 数据审核Dashboard
 * 
 * 用于人工审核电价数据的前端界面
 * 功能：
 * 1. 展示待审核的数据列表
 * 2. 数据对比视图（新旧数据对比）
 * 3. 审核操作（通过/拒绝/修改）
 * 4. 审核历史记录
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  History,
  Download,
  Eye,
  Edit3,
  MoreHorizontal
} from 'lucide-react';
import { Badge } from '../ui/Badge';

/**
 * 待审核数据项
 */
export interface PendingReviewItem {
  id: string;
  provinceCode: string;
  provinceName: string;
  policyNumber: string;
  policyTitle: string;
  effectiveDate: string;
  dataSource: 'crawl' | 'manual' | 'import';
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  createdAt: string;
  submittedBy: string;
  tariffItemCount: number;
  warnings: string[];
  previousVersion?: TariffVersionSummary;
}

/**
 * 电价版本摘要
 */
export interface TariffVersionSummary {
  version: string;
  effectiveDate: string;
  policyNumber: string;
  itemCount: number;
}

/**
 * 审核历史记录
 */
export interface ReviewHistoryItem {
  id: string;
  reviewId: string;
  action: 'approve' | 'reject' | 'modify';
  reviewer: string;
  comment: string;
  createdAt: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

/**
 * 数据对比结果
 */
export interface DataComparison {
  added: TariffItemDiff[];
  removed: TariffItemDiff[];
  modified: TariffItemModification[];
  unchanged: TariffItemDiff[];
}

export interface TariffItemDiff {
  id: string;
  voltageLevel: string;
  category: string;
  price: number;
  timePeriod?: string;
}

export interface TariffItemModification {
  id: string;
  voltageLevel: string;
  category: string;
  oldPrice: number;
  newPrice: number;
  priceChange: number;
  priceChangePercent: number;
  timePeriod?: string;
}

interface DataReviewDashboardProps {
  onReviewComplete?: (reviewId: string, action: string, comment: string) => void;
}

export function DataReviewDashboard({ onReviewComplete }: DataReviewDashboardProps) {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'comparison'>('pending');
  const [selectedItem, setSelectedItem] = useState<PendingReviewItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvince, setFilterProvince] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'modify'>('approve');
  
  // 模拟数据
  const pendingItems: PendingReviewItem[] = useMemo(() => [
    {
      id: 'review-001',
      provinceCode: 'GD',
      provinceName: '广东省',
      policyNumber: '粤发改价格〔2024〕123号',
      policyTitle: '关于调整工商业电价的通知',
      effectiveDate: '2024-01-01',
      dataSource: 'crawl',
      confidence: 0.85,
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z',
      submittedBy: '自动化爬虫',
      tariffItemCount: 24,
      warnings: ['部分时段数据缺失', '电压等级识别可能不准确'],
      previousVersion: {
        version: '2023.12.01',
        effectiveDate: '2023-12-01',
        policyNumber: '粤发改价格〔2023〕456号',
        itemCount: 24,
      },
    },
    {
      id: 'review-002',
      provinceCode: 'ZJ',
      provinceName: '浙江省',
      policyNumber: '浙发改价格〔2024〕89号',
      policyTitle: '浙江省电网销售电价表',
      effectiveDate: '2024-02-01',
      dataSource: 'crawl',
      confidence: 0.92,
      status: 'pending',
      createdAt: '2024-01-16T14:20:00Z',
      submittedBy: '自动化爬虫',
      tariffItemCount: 18,
      warnings: [],
      previousVersion: {
        version: '2023.11.01',
        effectiveDate: '2023-11-01',
        policyNumber: '浙发改价格〔2023〕234号',
        itemCount: 18,
      },
    },
    {
      id: 'review-003',
      provinceCode: 'JS',
      provinceName: '江苏省',
      policyNumber: '苏发改价格〔2024〕56号',
      policyTitle: '关于完善分时电价机制的通知',
      effectiveDate: '2024-03-01',
      dataSource: 'manual',
      confidence: 0.95,
      status: 'pending',
      createdAt: '2024-01-17T09:15:00Z',
      submittedBy: '管理员',
      tariffItemCount: 20,
      warnings: [],
    },
  ], []);
  
  const historyItems: ReviewHistoryItem[] = useMemo(() => [
    {
      id: 'hist-001',
      reviewId: 'review-000',
      action: 'approve',
      reviewer: '张三',
      comment: '数据准确，审核通过',
      createdAt: '2024-01-14T16:30:00Z',
    },
    {
      id: 'hist-002',
      reviewId: 'review-999',
      action: 'reject',
      reviewer: '李四',
      comment: '价格数据异常，需要重新核实',
      createdAt: '2024-01-13T11:20:00Z',
    },
    {
      id: 'hist-003',
      reviewId: 'review-998',
      action: 'modify',
      reviewer: '王五',
      comment: '修正了电压等级描述',
      createdAt: '2024-01-12T15:45:00Z',
      changes: [
        { field: 'voltageLevel', oldValue: '1-10KV', newValue: '1-10千伏' },
      ],
    },
  ], []);
  
  // 过滤数据
  const filteredItems = useMemo(() => {
    return pendingItems.filter(item => {
      // 搜索过滤
      if (searchQuery && !(
        item.provinceName.includes(searchQuery) ||
        item.policyNumber.includes(searchQuery) ||
        item.policyTitle.includes(searchQuery)
      )) {
        return false;
      }
      
      // 省份过滤
      if (filterProvince !== 'all' && item.provinceCode !== filterProvince) {
        return false;
      }
      
      // 可信度过滤
      if (filterConfidence !== 'all') {
        if (filterConfidence === 'high' && item.confidence < 0.8) return false;
        if (filterConfidence === 'medium' && (item.confidence < 0.5 || item.confidence >= 0.8)) return false;
        if (filterConfidence === 'low' && item.confidence >= 0.5) return false;
      }
      
      return true;
    });
  }, [pendingItems, searchQuery, filterProvince, filterConfidence]);
  
  // 处理审核提交
  const handleReviewSubmit = () => {
    if (!selectedItem) return;
    
    onReviewComplete?.(selectedItem.id, reviewAction, reviewComment);
    
    // 关闭弹窗
    setIsReviewModalOpen(false);
    setReviewComment('');
    setSelectedItem(null);
  };
  
  // 打开审核弹窗
  const openReviewModal = (item: PendingReviewItem, action: 'approve' | 'reject' | 'modify') => {
    setSelectedItem(item);
    setReviewAction(action);
    setReviewComment('');
    setIsReviewModalOpen(true);
  };
  
  // 获取可信度颜色
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'modified':
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">数据审核中心</h2>
            <p className="mt-1 text-sm text-gray-500">
              审核和管理电价数据更新
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              待审核: {pendingItems.length}
            </Badge>
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              今日已审: 12
            </Badge>
          </div>
        </div>
        
        {/* 标签页 */}
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'pending'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            待审核
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'comparison'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            数据对比
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            审核历史
          </button>
        </div>
      </div>
      
      {/* 过滤器 */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索省份、政策文号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={filterProvince}
            onChange={(e) => setFilterProvince(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有省份</option>
            <option value="GD">广东省</option>
            <option value="ZJ">浙江省</option>
            <option value="JS">江苏省</option>
            <option value="SH">上海市</option>
          </select>
          <select
            value={filterConfidence}
            onChange={(e) => setFilterConfidence(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有可信度</option>
            <option value="high">高 (&gt;80%)</option>
            <option value="medium">中 (50-80%)</option>
            <option value="low">低 (&lt;50%)</option>
          </select>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="p-6">
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-gray-500">没有待审核的数据</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <ReviewItemCard
                  key={item.id}
                  item={item}
                  onReview={(action) => openReviewModal(item, action)}
                />
              ))
            )}
          </div>
        )}
        
        {activeTab === 'history' && (
          <ReviewHistoryList items={historyItems} />
        )}
        
        {activeTab === 'comparison' && (
          <DataComparisonView />
        )}
      </div>
      
      {/* 审核弹窗 */}
      {isReviewModalOpen && selectedItem && (
        <ReviewModal
          item={selectedItem}
          action={reviewAction}
          comment={reviewComment}
          onCommentChange={setReviewComment}
          onSubmit={handleReviewSubmit}
          onClose={() => setIsReviewModalOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * 审核项卡片
 */
function ReviewItemCard({ 
  item, 
  onReview 
}: { 
  item: PendingReviewItem; 
  onReview: (action: 'approve' | 'reject' | 'modify') => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  return (
    <div className="border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold text-gray-900">{item.provinceName}</span>
              <Badge className={getConfidenceColor(item.confidence)}>
                可信度: {Math.round(item.confidence * 100)}%
              </Badge>
              {item.warnings.length > 0 && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {item.warnings.length} 个警告
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">{item.policyTitle}</p>
            <p className="text-xs text-gray-500">政策文号: {item.policyNumber}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>生效日期: {item.effectiveDate}</span>
              <span>电价项数: {item.tariffItemCount}</span>
              <span>提交人: {item.submittedBy}</span>
              <span>提交时间: {new Date(item.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <button
              onClick={() => onReview('approve')}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              通过
            </button>
            <button
              onClick={() => onReview('reject')}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              拒绝
            </button>
            <button
              onClick={() => onReview('modify')}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              修改
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          {item.warnings.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">警告信息</h4>
              <ul className="space-y-1">
                {item.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {item.previousVersion && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">上一版本对比</h4>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-500">版本:</span>
                    <span className="ml-2">{item.previousVersion.version}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">政策文号:</span>
                    <span className="ml-2">{item.previousVersion.policyNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">电价项数:</span>
                    <span className="ml-2">{item.previousVersion.itemCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 审核历史列表
 */
function ReviewHistoryList({ items }: { items: ReviewHistoryItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          {item.action === 'approve' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {item.action === 'reject' && <XCircle className="w-5 h-5 text-red-500" />}
          {item.action === 'modify' && <Edit3 className="w-5 h-5 text-blue-500" />}
          <div className="flex-1">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{item.reviewer}</span>
              {' '}
              {item.action === 'approve' && '审核通过了'}
              {item.action === 'reject' && '拒绝了'}
              {item.action === 'modify' && '修改并通过了'}
              {' '}
              <span className="text-gray-600">数据更新</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">{item.comment}</p>
            {item.changes && item.changes.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                {item.changes.map((change, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-gray-500">{change.field}:</span>
                    <span className="text-red-600 line-through">{String(change.oldValue)}</span>
                    <span>→</span>
                    <span className="text-green-600">{String(change.newValue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {new Date(item.createdAt).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * 数据对比视图
 */
function DataComparisonView() {
  return (
    <div className="text-center py-12">
      <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p className="text-gray-500">选择一项待审核数据以查看详细对比</p>
    </div>
  );
}

/**
 * 审核弹窗
 */
interface ReviewModalProps {
  item: PendingReviewItem;
  action: 'approve' | 'reject' | 'modify';
  comment: string;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

function ReviewModal({ 
  item, 
  action, 
  comment, 
  onCommentChange, 
  onSubmit, 
  onClose 
}: ReviewModalProps) {
  const actionConfig = {
    approve: { title: '通过审核', color: 'green', buttonText: '确认通过' },
    reject: { title: '拒绝数据', color: 'red', buttonText: '确认拒绝' },
    modify: { title: '修改数据', color: 'blue', buttonText: '保存修改' },
  };
  
  const config = actionConfig[action];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {item.provinceName} - {item.policyNumber}
          </p>
        </div>
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            审核意见
          </label>
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="请输入审核意见（可选）..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            className={`px-4 py-2 text-white rounded-lg transition-colors bg-${config.color}-600 hover:bg-${config.color}-700`}
            style={{ backgroundColor: action === 'approve' ? '#16a34a' : action === 'reject' ? '#dc2626' : '#2563eb' }}
          >
            {config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
