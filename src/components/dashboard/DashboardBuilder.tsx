/**
 * Custom Dashboard Builder
 *
 * Create and customize interactive dashboards
 */

import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: any;
}

interface DashboardBuilderProps {
  widgets: DashboardWidget[];
  onWidgetsChange: (widgets: DashboardWidget[]) => void;
  editable?: boolean;
}

export function DashboardBuilder({
  widgets,
  onWidgetsChange,
  editable = true
}: DashboardBuilderProps) {
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onWidgetsChange(items);
  }, [widgets, onWidgetsChange]);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    onWidgetsChange(widgets.filter(w => w.id !== widgetId));
  }, [widgets, onWidgetsChange]);

  const handleUpdateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    onWidgetsChange(
      widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w)
    );
  }, [widgets, onWidgetsChange]);

  const getWidgetSize = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1';
      case 'medium':
        return 'col-span-2 row-span-2';
      case 'large':
        return 'col-span-3 row-span-3';
      default:
        return 'col-span-1 row-span-1';
    }
  };

  return (
    <div className="h-full flex">
      {/* Widget Library (when editable) */}
      {editable && (
        <div className="w-64 bg-white border-r p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">添加组件</h3>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">指标卡片</div>
            <button
              onClick={() => {
                const newWidget: DashboardWidget = {
                  id: `widget-${Date.now()}`,
                  type: 'metric',
                  title: '新指标',
                  size: 'small',
                  position: { x: 0, y: 0 },
                  config: {
                    metric: 'irr',
                    format: 'percentage'
                  }
                };
                onWidgetsChange([...widgets, newWidget]);
              }}
              className="w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              IRR 指标
            </button>
            <button
              onClick={() => {
                const newWidget: DashboardWidget = {
                  id: `widget-${Date.now()}`,
                  type: 'metric',
                  title: '新指标',
                  size: 'small',
                  position: { x: 0, y: 0 },
                  config: {
                    metric: 'npv',
                    format: 'currency'
                  }
                };
                onWidgetsChange([...widgets, newWidget]);
              }}
              className="w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              NPV 指标
            </button>
          </div>

          <div className="space-y-2 mt-4">
            <div className="text-sm font-medium text-gray-700">图表</div>
            <button
              onClick={() => {
                const newWidget: DashboardWidget = {
                  id: `widget-${Date.now()}`,
                  type: 'chart',
                  title: '投资指标对比',
                  size: 'medium',
                  position: { x: 0, y: 0 },
                  config: {
                    chartType: 'bar',
                    metrics: ['irr', 'npv', 'payback']
                  }
                };
                onWidgetsChange([...widgets, newWidget]);
              }}
              className="w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              柱状图
            </button>
            <button
              onClick={() => {
                const newWidget: DashboardWidget = {
                  id: `widget-${Date.now()}`,
                  type: 'chart',
                  title: '现金流趋势',
                  size: 'medium',
                  position: { x: 0, y: 0 },
                  config: {
                    chartType: 'line',
                    metrics: ['cashFlow']
                  }
                };
                onWidgetsChange([...widgets, newWidget]);
              }}
              className="w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              折线图
            </button>
            <button
              onClick={() => {
                const newWidget: DashboardWidget = {
                  id: `widget-${Date.now()}`,
                  type: 'chart',
                  title: '基准对比',
                  size: 'medium',
                  position: { x: 0, y: 0 },
                  config: {
                    chartType: 'radar',
                    metrics: ['irr', 'npv', 'payback']
                  }
                };
                onWidgetsChange([...widgets, newWidget]);
              }}
              className="w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              雷达图
            </button>
          </div>

          <div className="space-y-2 mt-4">
            <div className="text-sm font-medium text-gray-700">其他</div>
            <button
              onClick={() => {
                const newWidget: DashboardWidget = {
                  id: `widget-${Date.now()}`,
                  type: 'table',
                  title: '项目列表',
                  size: 'large',
                  position: { x: 0, y: 0 },
                  config: {
                    columns: ['name', 'irr', 'npv', 'payback']
                  }
                };
                onWidgetsChange([...widgets, newWidget]);
              }}
              className="w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              数据表格
            </button>
            <button
              onClick={() => {
                const newWidget: DashboardWidget = {
                  id: `widget-${Date.now()}`,
                  type: 'text',
                  title: '文本说明',
                  size: 'small',
                  position: { x: 0, y: 0 },
                  config: {
                    content: '在此输入说明文字...'
                  }
                };
                onWidgetsChange([...widgets, newWidget]);
              }}
              className="w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              文本框
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Canvas */}
      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        {widgets.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <p className="text-lg font-medium">空仪表板</p>
              <p className="text-sm">从左侧添加组件开始构建</p>
            </div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="dashboard" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-3 gap-4"
                >
                  {widgets.map((widget, index) => (
                    <Draggable
                      key={widget.id}
                      draggableId={widget.id}
                      index={index}
                      isDragDisabled={!editable}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            bg-white rounded-lg shadow-sm border-2
                            ${selectedWidget === widget.id ? 'border-blue-500' : 'border-transparent'}
                            ${snapshot.isDragging ? 'opacity-50' : ''}
                            ${getWidgetSize(widget.size)}
                          `}
                          onClick={() => editable && setSelectedWidget(widget.id)}
                        >
                          {/* Widget Header */}
                          <div className="flex items-center justify-between px-4 py-2 border-b">
                            <h4 className="font-medium text-gray-900">{widget.title}</h4>
                            {editable && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveWidget(widget.id);
                                }}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>

                          {/* Widget Content */}
                          <div className="p-4">
                            {widget.type === 'metric' && (
                              <MetricWidget widget={widget} />
                            )}
                            {widget.type === 'chart' && (
                              <ChartWidget widget={widget} />
                            )}
                            {widget.type === 'table' && (
                              <TableWidget widget={widget} />
                            )}
                            {widget.type === 'text' && (
                              <TextWidget widget={widget} />
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}

/**
 * Metric Widget Component
 */

interface MetricWidgetProps {
  widget: DashboardWidget;
}

function MetricWidget({ widget }: MetricWidgetProps) {
  const { config } = widget;

  // Mock data - in production, fetch from actual data
  const value = config.metric === 'irr' ? 15.5 : config.metric === 'npv' ? 1250000 : 6.5;

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-gray-900">
        {config.format === 'percentage' ? `${value.toFixed(2)}%` : `¥${(value / 10000).toFixed(0)}万`}
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {config.metric === 'irr' ? '内部收益率' : config.metric === 'npv' ? '净现值' : '回收期'}
      </div>
    </div>
  );
}

/**
 * Chart Widget Component
 */

function ChartWidget({ widget }: MetricWidgetProps) {
  return (
    <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
      <div className="text-center text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">{widget.config.chartType === 'bar' ? '柱状图' : widget.config.chartType === 'line' ? '折线图' : '雷达图'}</p>
      </div>
    </div>
  );
}

/**
 * Table Widget Component
 */

function TableWidget({ widget }: MetricWidgetProps) {
  return (
    <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
      <div className="text-center text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">数据表格</p>
      </div>
    </div>
  );
}

/**
 * Text Widget Component
 */

function TextWidget({ widget }: MetricWidgetProps) {
  return (
    <div className="min-h-[100px]">
      <p className="text-gray-700">{widget.config.content}</p>
    </div>
  );
}