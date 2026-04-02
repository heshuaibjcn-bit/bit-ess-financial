/**
 * 电价数据API路由
 */

import { Router } from 'express';
import { getTariffUpdateAgent } from '../agents/TariffUpdateAgent';
import { getSchedulerService } from '../services/SchedulerService';
import { getApprovalWorkflowService } from '../services/ApprovalWorkflow';

const router = Router();
const updateAgent = getTariffUpdateAgent();
const scheduler = getSchedulerService();
const approvalWorkflow = getApprovalWorkflowService();

/**
 * 健康检查
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'tariff-crawler-service',
  });
});

/**
 * 获取所有省份列表
 */
router.get('/provinces', async (req, res) => {
  try {
    const { NATIONWIDE_PROVINCES } = await import('../../../src/config/nationwide-data-sources');
    res.json({
      success: true,
      data: NATIONWIDE_PROVINCES,
      total: NATIONWIDE_PROVINCES.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * 抓取单个省份
 */
router.post('/crawl/:provinceCode', async (req, res) => {
  try {
    const { provinceCode } = req.params;
    console.log(`[API] Crawl request for ${provinceCode}`);

    const result = await updateAgent.updateProvince(provinceCode);
    
    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('[API] Crawl error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * 批量抓取
 */
router.post('/crawl-batch', async (req, res) => {
  try {
    const { provinceCodes } = req.body;
    
    if (!Array.isArray(provinceCodes) || provinceCodes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'provinceCodes must be a non-empty array',
      });
    }

    console.log(`[API] Batch crawl request for ${provinceCodes.length} provinces`);

    const results = await updateAgent.updateBatch(provinceCodes);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          success: successCount,
          failure: failureCount,
        },
      },
    });
  } catch (error) {
    console.error('[API] Batch crawl error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * 抓取所有省份
 */
router.post('/crawl-all', async (req, res) => {
  try {
    console.log('[API] Crawl all request');

    // 立即返回，后台执行
    res.json({
      success: true,
      message: 'Crawl all started in background',
      timestamp: new Date().toISOString(),
    });

    // 后台执行
    updateAgent.updateAll().then(results => {
      console.log(`[API] Crawl all completed: ${results.filter(r => r.success).length}/${results.length} succeeded`);
    }).catch(error => {
      console.error('[API] Crawl all error:', error);
    });
  } catch (error) {
    console.error('[API] Crawl all error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * 检查更新
 */
router.post('/check-updates', async (req, res) => {
  try {
    const { provinceCodes } = req.body;
    
    if (!Array.isArray(provinceCodes)) {
      return res.status(400).json({
        success: false,
        error: 'provinceCodes must be an array',
      });
    }

    const results = await updateAgent.checkUpdates(provinceCodes);
    
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[API] Check updates error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// ========== 调度器API ==========

/**
 * 启动定时任务
 */
router.post('/scheduler/start', (req, res) => {
  try {
    scheduler.start();
    res.json({
      success: true,
      message: 'Scheduler started',
      status: scheduler.getStatus(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * 停止定时任务
 */
router.post('/scheduler/stop', (req, res) => {
  try {
    scheduler.stop();
    res.json({
      success: true,
      message: 'Scheduler stopped',
      status: scheduler.getStatus(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * 获取调度器状态
 */
router.get('/scheduler/status', (req, res) => {
  res.json({
    success: true,
    data: scheduler.getStatus(),
  });
});

/**
 * 手动触发检查
 */
router.post('/scheduler/manual-check', async (req, res) => {
  try {
    const { provinceCodes } = req.body;
    
    if (!Array.isArray(provinceCodes)) {
      return res.status(400).json({
        success: false,
        error: 'provinceCodes must be an array',
      });
    }

    const result = await scheduler.manualCheck(provinceCodes);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * 获取任务日志
 */
router.get('/scheduler/logs', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  res.json({
    success: true,
    data: scheduler.getLogs(limit),
  });
});

// ========== 审核工作流API ==========

/**
 * 获取待审核列表
 */
router.get('/approval/pending', async (req, res) => {
  try {
    const options = {
      provinceCode: req.query.provinceCode as string,
      priority: req.query.priority as 'high' | 'medium' | 'low',
      limit: parseInt(req.query.limit as string) || 50,
    };

    const list = await approvalWorkflow.getPendingList(options);
    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * 提交审核
 */
router.post('/approval/submit', async (req, res) => {
  try {
    const approval = await approvalWorkflow.submitForApproval(req.body);
    res.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * 审核通过
 */
router.post('/approval/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer, comment, changes } = req.body;

    const result = await approvalWorkflow.approve(id, reviewer, comment, changes);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * 审核拒绝
 */
router.post('/approval/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer, reason } = req.body;

    const result = await approvalWorkflow.reject(id, reviewer, reason);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * 获取审核统计
 */
router.get('/approval/stats', async (req, res) => {
  try {
    const stats = await approvalWorkflow.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * 获取审核历史
 */
router.get('/approval/history', async (req, res) => {
  try {
    const options = {
      provinceCode: req.query.provinceCode as string,
      reviewer: req.query.reviewer as string,
      status: req.query.status as 'approved' | 'rejected',
      limit: parseInt(req.query.limit as string) || 50,
    };

    const history = await approvalWorkflow.getHistory(options);
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
