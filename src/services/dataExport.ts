/**
 * Data Export/Import Service
 *
 * 处理项目数据的导出和导入
 */

import type { LocalProject } from '@/stores/cloudProjectStore';

/**
 * 导出格式
 */
export interface ExportData {
  version: string;
  exportedAt: string;
  projects: ExportedProject[];
}

export interface ExportedProject {
  id: string;
  name: string;
  description: string | null;
  formData: any;
  status: 'draft' | 'in_progress' | 'completed';
  collaborationModel: string | null;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 导出单个项目为 JSON
 */
export function exportProject(project: LocalProject): string {
  const exported: ExportedProject = {
    id: project.id,
    name: project.name,
    description: project.description,
    formData: project.formData,
    status: project.status,
    collaborationModel: project.collaborationModel,
    industry: project.industry,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };

  return JSON.stringify(exported, null, 2);
}

/**
 * 批量导出项目为 JSON
 */
export function exportProjects(projects: LocalProject[]): string {
  const data: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    projects: projects.map(p => ({
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

  return JSON.stringify(data, null, 2);
}

/**
 * 下载 JSON 文件
 */
export function downloadJSON(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
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
 * 导出项目并下载
 */
export function exportProjectToFile(project: LocalProject): void {
  const json = exportProject(project);
  const filename = `project-${project.name}-${new Date().toISOString().split('T')[0]}.json`;
  downloadJSON(json, filename);
}

/**
 * 批量导出项目并下载
 */
export function exportProjectsToFile(projects: LocalProject[]): void {
  const json = exportProjects(projects);
  const filename = `projects-backup-${new Date().toISOString().split('T')[0]}.json`;
  downloadJSON(json, filename);
}

/**
 * 从 JSON 导入项目数据
 */
export function importProjectFromJSON(jsonString: string): ExportedProject {
  try {
    const data = JSON.parse(jsonString) as ExportedProject | ExportData;

    // 判断是单个项目还是批量数据
    if ('version' in data && 'projects' in data) {
      // 批量数据 - 返回第一个项目或抛出错误
      if (data.projects.length === 0) {
        throw new Error('没有找到项目数据');
      }
      return data.projects[0];
    } else {
      // 单个项目
      return data;
    }
  } catch (error) {
    throw new Error('导入失败：无效的 JSON 格式');
  }
}

/**
 * 批量导入项目
 */
export function importProjectsFromJSON(jsonString: string): ExportedProject[] {
  try {
    const data = JSON.parse(jsonString) as ExportData | ExportedProject;

    if ('version' in data && 'projects' in data) {
      return data.projects;
    } else {
      // 单个项目 - 包装成数组
      return [data as ExportedProject];
    }
  } catch (error) {
    throw new Error('导入失败：无效的 JSON 格式');
  }
}

/**
 * 验证导入的数据
 */
export function validateImportedProject(project: ExportedProject): string[] {
  const errors: string[] = [];

  if (!project.name || typeof project.name !== 'string') {
    errors.push('项目名称无效');
  }

  if (!project.formData || typeof project.formData !== 'object') {
    errors.push('项目表单数据无效');
  }

  if (!project.status || !['draft', 'in_progress', 'completed'].includes(project.status)) {
    errors.push('项目状态无效');
  }

  if (project.createdAt && isNaN(Date.parse(project.createdAt))) {
    errors.push('创建时间格式无效');
  }

  if (project.updatedAt && isNaN(Date.parse(project.updatedAt))) {
    errors.push('更新时间格式无效');
  }

  return errors;
}

/**
 * 获取导出文件统计信息
 */
export function getExportStats(projects: LocalProject[]): {
  totalProjects: number;
  totalSize: number;
  estimatedSize: string;
  oldestProject: string | null;
  newestProject: string | null;
  statusBreakdown: Record<string, number>;
} {
  const totalProjects = projects.length;
  const jsonString = exportProjects(projects);
  const totalSize = new Blob([jsonString]).size;
  const estimatedSize = totalSize > 1024 * 1024
    ? `${(totalSize / (1024 * 1024)).toFixed(2)} MB`
    : `${(totalSize / 1024).toFixed(2)} KB`;

  const dates = projects.map(p => p.createdAt).filter(Boolean);
  const oldestProject = dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))).toISOString() : null;
  const newestProject = dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))).toISOString() : null;

  const statusBreakdown: Record<string, number> = {};
  projects.forEach(p => {
    statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
  });

  return {
    totalProjects,
    totalSize,
    estimatedSize,
    oldestProject,
    newestProject,
    statusBreakdown,
  };
}
