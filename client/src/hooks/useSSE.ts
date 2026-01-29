import { useState, useEffect, useRef } from 'react';
import type { ProgressEvent } from '@shared/types';

interface UseSSEOptions {
  onComplete?: (event: ProgressEvent) => void;
  onError?: (error: Error) => void;
}

export function useSSE(jobId: string | null, options: UseSSEOptions = {}) {
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;

  // Stable refs to avoid dependency issues
  const onCompleteRef = useRef(options.onComplete);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onCompleteRef.current = options.onComplete;
    onErrorRef.current = options.onError;
  }, [options.onComplete, options.onError]);

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

  return {
    events,
    latestEvent,
    isConnected,
    error,
    isComplete,
    progress: latestEvent
      ? Math.round((latestEvent.step / latestEvent.totalSteps) * 100)
      : 0,
  };
}
