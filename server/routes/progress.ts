import { Router, type Request, type Response } from 'express';
import { subscribeToProgress } from '../services/progress.service.js';
import { getJob, getJobLogs } from '../db/jobs.js';
import { createServiceLogger } from '../utils/logger.js';

const logger = createServiceLogger('routes/progress');

export const progressRouter = Router();

// GET /api/progress/:jobId - SSE endpoint for real-time progress
progressRouter.get('/:jobId', (req: Request<{ jobId: string }>, res: Response) => {
  const { jobId } = req.params;

  // Verify job exists
  const job = getJob(jobId);
  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial job state
  // If job is completed, use totalSteps as the step count
  const step = job.status === 'completed' ? job.totalSteps : job.currentStep;
  const initialData = {
    jobId: job.id,
    step,
    totalSteps: job.totalSteps,
    status: job.status === 'completed' ? 'completed' : job.status === 'failed' ? 'failed' : 'in_progress',
    message: job.status === 'completed' 
      ? 'Site generation completed successfully' 
      : job.status === 'failed' 
      ? `Generation failed: ${job.error || 'Unknown error'}`
      : `Current status: ${job.status}`,
    timestamp: new Date().toISOString(),
  };
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);

  // If job is already completed or failed, send final event and close immediately
  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
    const finalData = {
      ...initialData,
      final: true,
    };
    res.write(`data: ${JSON.stringify(finalData)}\n\n`);
    res.end();
    return;
  }

  // Subscribe to progress updates
  const unsubscribe = subscribeToProgress(jobId, (event) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);

      // Close connection if job is done
      if (event.status === 'completed' || event.status === 'failed') {
        res.write(`data: ${JSON.stringify({ ...event, final: true })}\n\n`);
        setTimeout(() => {
          unsubscribe();
          res.end();
        }, 100);
      }
    } catch (err) {
      logger.warn({ jobId, error: err }, 'Error writing SSE event');
    }
  });

  // Clean up on client disconnect
  req.on('close', () => {
    logger.info({ jobId }, 'SSE client disconnected');
    unsubscribe();
  });

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// GET /api/progress/:jobId/logs - Get job logs
progressRouter.get('/:jobId/logs', (req: Request<{ jobId: string }>, res: Response) => {
  const { jobId } = req.params;

  const job = getJob(jobId);
  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }

  const logs = getJobLogs(jobId);
  res.json({ success: true, data: logs });
});
