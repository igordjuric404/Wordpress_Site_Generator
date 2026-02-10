import { EventEmitter } from 'events';
import type { ProgressEvent } from '../../shared/types.js';
import { createServiceLogger } from '../utils/logger.js';
import { setLogBroadcaster } from '../db/jobs.js';

const logger = createServiceLogger('progress');

// Global event emitter for progress updates
const progressEmitter = new EventEmitter();
progressEmitter.setMaxListeners(100); // Support many concurrent connections

// Wire up the log broadcaster so addJobLog() calls emit SSE events in real-time.
// This lets the frontend see sub-step logs while the job is running.
setLogBroadcaster((jobId: string, message: string, _level: string) => {
  const eventName = `progress:${jobId}`;
  // Only emit if there are listeners (i.e. a client is connected)
  if (progressEmitter.listenerCount(eventName) > 0) {
    const event: ProgressEvent = {
      jobId,
      step: 0, // 0 indicates this is a log-level event, not a step advance
      totalSteps: 0,
      status: 'in_progress',
      message,
      timestamp: new Date().toISOString(),
    };
    progressEmitter.emit(eventName, event);
  }
});

/**
 * Subscribe to progress events for a specific job
 */
export function subscribeToProgress(
  jobId: string,
  callback: (event: ProgressEvent) => void
): () => void {
  const eventName = `progress:${jobId}`;
  progressEmitter.on(eventName, callback);

  logger.info({ jobId }, 'Client subscribed to progress');

  // Return unsubscribe function
  return () => {
    progressEmitter.off(eventName, callback);
    logger.info({ jobId }, 'Client unsubscribed from progress');
  };
}

/**
 * Emit a progress event for a job
 */
export function emitProgress(event: ProgressEvent): void {
  const eventName = `progress:${event.jobId}`;
  progressEmitter.emit(eventName, event);
  logger.info({ jobId: event.jobId, step: event.step, message: event.message }, 'Progress emitted');
}

/**
 * Create a progress helper for a specific job
 */
export function createProgressHelper(jobId: string, totalSteps: number, initialStep: number = 0) {
  let currentStep = initialStep;

  return {
    start(message: string) {
      currentStep = initialStep;
      emitProgress({
        jobId,
        step: currentStep,
        totalSteps,
        status: 'in_progress',
        message,
        timestamp: new Date().toISOString(),
      });
    },

    advance(message: string, aiCost?: number) {
      currentStep++;
      emitProgress({
        jobId,
        step: currentStep,
        totalSteps,
        status: 'in_progress',
        message,
        timestamp: new Date().toISOString(),
        aiCost,
      });
    },

    complete(message: string = 'Generation completed') {
      emitProgress({
        jobId,
        step: totalSteps,
        totalSteps,
        status: 'completed',
        message,
        timestamp: new Date().toISOString(),
      });
    },

    fail(message: string) {
      emitProgress({
        jobId,
        step: currentStep,
        totalSteps,
        status: 'failed',
        message,
        timestamp: new Date().toISOString(),
      });
    },

    cancel(message: string = 'Job cancelled') {
      emitProgress({
        jobId,
        step: currentStep,
        totalSteps,
        status: 'cancelled',
        message,
        timestamp: new Date().toISOString(),
      });
    },

    getCurrentStep() {
      return currentStep;
    },
  };
}
