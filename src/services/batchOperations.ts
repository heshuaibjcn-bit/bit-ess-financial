/**
 * Batch Operations Service
 *
 * 处理项目的批量操作
 */

import type { LocalProject, ProjectStatus } from '@/stores/cloudProjectStore';

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  success: number;
  failed: number;
  errors: Array<{ projectId: string; error: string }>;
}

/**
 * 批量删除项目
 */
export async function batchDeleteProjects(
  projects: LocalProject[],
  projectIds: string[],
  deleteFn: (id: string) => Promise<void>
): Promise<BatchOperationResult> {
  const result: BatchOperationResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const id of projectIds) {
    try {
      await deleteFn(id);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        projectId: id,
        error: error instanceof Error ? error.message : '删除失败',
      });
    }
  }

  return result;
}

/**
 * 批量更新项目状态
 */
export async function batchUpdateStatus(
  projects: LocalProject[],
  projectIds: string[],
  newStatus: ProjectStatus,
  updateFn: (id: string, data: any) => Promise<void>
): Promise<BatchOperationResult> {
  const result: BatchOperationResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const id of projectIds) {
    try {
      await updateFn(id, { status: newStatus });
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        projectId: id,
        error: error instanceof Error ? error.message : '更新失败',
      });
    }
  }

  return result;
}

/**
 * 批量导出项目
 */
export function batchExportProjects(projects: LocalProject[], projectIds: string[]): void {
  const selectedProjects = projects.filter(p => projectIds.includes(p.id));

  if (selectedProjects.length === 0) {
    return;
  }

  // 导出为 JSON
  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    projects: selectedProjects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      formData: p.formData,
      status: p.status,
      collaborationModel: p.collaborationModel,
      industry: p.industry,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  };

  const json = JSON.stringify(data, null, 2);
  const filename = `batch-export-${new Date().toISOString().split('T')[0]}.json`;

  // 下载文件
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 获取批量操作的统计信息
 */
export function getBatchOperationStats(projects: LocalProject[], projectIds: string[]): {
  total: number;
  byStatus: Record<string, number>;
  byCollaborationModel: Record<string, number>;
  sizeEstimate: string;
} {
  const selectedProjects = projects.filter(p => projectIds.includes(p.id));

  const byStatus: Record<string, number> = {};
  const byCollaborationModel: Record<string, number> = {};

  selectedProjects.forEach(p => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    if (p.collaborationModel) {
      byCollaborationModel[p.collaborationModel] = (byCollaborationModel[p.collaborationModel] || 0) + 1;
    }
  });

  // 估算大小
  const jsonSize = JSON.stringify(selectedProjects).length;
  const sizeEstimate = jsonSize > 1024 * 1024
    ? `${(jsonSize / (1024 * 1024)).toFixed(2)} MB`
    : `${(jsonSize / 1024).toFixed(2)} KB`;

  return {
    total: selectedProjects.length,
    byStatus,
    byCollaborationModel,
    sizeEstimate,
  };
}

/**
 * 全选/取消全选
 */
export function toggleAllSelection(
  projectIds: string[],
  currentSelection: string[]
): string[] {
  const allSelected = projectIds.every(id => currentSelection.includes(id));

  if (allSelected) {
    // 取消全选
    return [];
  } else {
    // 全选
    return [...projectIds];
  }
}

/**
 * 检查是否全选
 */
export function isAllSelected(projectIds: string[], currentSelection: string[]): boolean {
  if (projectIds.length === 0) return false;
  return projectIds.every(id => currentSelection.includes(id));
}

/**
 * 检查是否部分选中
 */
export function isPartiallySelected(projectIds: string[], currentSelection: string[]): boolean {
  const selectedInSet = projectIds.filter(id => currentSelection.includes(id));
  return selectedInSet.length > 0 && selectedInSet.length < projectIds.length;
}
