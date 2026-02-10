import { useState, useEffect, useRef } from 'react';
import type { ProgressEvent } from '@shared/types';

interface UseSSEOptions {
  onComplete?: (event: ProgressEvent) => void;
  onError?: (error: Error) => void;
  /** Seed initial step/totalSteps from the job to avoid regression on refresh */
  initialStep?: number;
  initialTotalSteps?: number;
  initialStatus?: string;
}

export function useSSE(jobId: string | null, options: UseSSEOptions = {}) {
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Seed values from the job loaded via REST so we never show 0% on refresh
  const seedStep = options.initialStep ?? 0;
  const seedTotal = options.initialTotalSteps ?? 13;
  const seedStatus = options.initialStatus;

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;

  // Stable refs to avoid dependency issues
  const onCompleteRef = useRef(options.onComplete);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onCompleteRef.current = options.onComplete;
    onErrorRef.current = options.onError;
  }, [options.onComplete, options.onError]);

  // Mark complete immediately if the initial status says so
  useEffect(() => {
    if (seedStatus === 'completed' || seedStatus === 'failed' || seedStatus === 'cancelled') {
      setIsComplete(true);
    }
  }, [seedStatus]);

  useEffect(() => {
    if (!jobId || isComplete) return;

    console.log(`[SSE] Connecting to job ${jobId}`);
    const eventSource = new EventSource(`/api/progress/${jobId}`);
    let hasReceivedFinal = false;

    eventSource.onopen = () => {
      console.log(`[SSE] Connected to job ${jobId}`);
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressEvent & { final?: boolean } = JSON.parse(event.data);

        // Only add unique events to prevent duplicates
        setEvents((prev) => {
          const isDuplicate = prev.some(
            (e) => e.timestamp === data.timestamp && e.message === data.message
          );
          return isDuplicate ? prev : [...prev, data];
        });

        if (data.status === 'completed') {
          setIsComplete(true);
          onCompleteRef.current?.(data);
        }

        if (data.status === 'failed' || data.status === 'cancelled') {
          setError(data.message);
          setIsComplete(true);
        }

        if (data.final) {
          console.log(`[SSE] Received final event for job ${jobId}, closing`);
          hasReceivedFinal = true;
          eventSource.close();
          setIsConnected(false);
        }
      } catch (err) {
        console.error('[SSE] Failed to parse event:', err);
      }
    };

    eventSource.onerror = (e) => {
      if (!hasReceivedFinal) {
        console.error(`[SSE] Connection error for job ${jobId}:`, e);
        setError('Connection lost');
        onErrorRef.current?.(new Error('SSE connection error'));
      }
      eventSource.close();
      setIsConnected(false);
    };

    return () => {
      console.log(`[SSE] Cleaning up connection for job ${jobId}`);
      eventSource.close();
      setIsConnected(false);
    };
  }, [jobId, isComplete]);

  // Compute current step: use the HIGHEST step seen across all events.
  // Log-level events from addJobLog have step=0 / totalSteps=0 — they must
  // never reset the progress bar, so we take the max, not the latest.
  const maxEventStep = events.reduce((max, e) => Math.max(max, e.step), 0);
  const maxEventTotal = events.reduce((max, e) => Math.max(max, e.totalSteps), 0);
  const currentStep = Math.max(maxEventStep, seedStep);
  const totalSteps = Math.max(maxEventTotal, seedTotal);

  return {
    events,
    latestEvent,
    isConnected,
    error,
    isComplete,
    currentStep,
    totalSteps,
    progress: totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0,
  };
}
