import { EventEmitter } from 'events';
import type { ProgressEvent } from '../../shared/types.js';
import { createServiceLogger } from '../utils/logger.js';

const logger = createServiceLogger('progress');

// Global event emitter for progress updates
const progressEmitter = new EventEmitter();
progressEmitter.setMaxListeners(100); // Support many concurrent connections

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
export function createProgressHelper(jobId: string, totalSteps: number) {
  let currentStep = 0;

  return {
    start(message: string) {
      currentStep = 0;
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

    getCurrentStep() {
      return currentStep;
    },
  };
}
