# SSE Infinite Loop Fix

## Problem
The SSE (Server-Sent Events) hook was creating **thousands of requests per second** after a job completed, causing:
- Over 9,500 log lines in seconds
- Server being hammered with duplicate progress requests
- Memory/CPU waste on both client and server

## Root Cause
The `useSSE` hook had a dependency problem:

```typescript
// BAD: options object creates new reference on every render
const connect = useCallback(() => {
  // ...
}, [jobId, options]); // ❌ options changes every render

useEffect(() => {
  const cleanup = connect();
  return cleanup;
}, [connect]); // ❌ connect changes because options changed
```

This caused:
1. Component renders
2. `options` object is recreated (new reference)
3. `useCallback` sees new `options`, recreates `connect`
4. `useEffect` sees new `connect`, reconnects
5. **Repeat infinitely**

## Solution
Used `useRef` for stable callback references and simplified the effect:

```typescript
// GOOD: Stable refs that don't trigger re-renders
const onCompleteRef = useRef(options.onComplete);
const onErrorRef = useRef(options.onError);

useEffect(() => {
  onCompleteRef.current = options.onComplete;
  onErrorRef.current = options.onError;
}, [options.onComplete, options.onError]);

useEffect(() => {
  if (!jobId || isComplete) return; // ✅ Don't reconnect when complete
  
  const eventSource = new EventSource(`/api/progress/${jobId}`);
  // ... setup handlers
  
  return () => {
    eventSource.close(); // ✅ Clean up properly
  };
}, [jobId, isComplete]); // ✅ Only reconnect on jobId or completion change
```

## Additional Improvements
1. **Logging**: Added console logs for debugging SSE lifecycle
2. **Final flag handling**: Track if final event received to prevent error on close
3. **Deduplication**: Prevent duplicate events from being added to state
4. **Completion guard**: Never reconnect once `isComplete` is true

## Result
- SSE connects **once** when job starts
- Receives progress events in real-time
- Closes cleanly when job completes
- Never reconnects after completion
- Zero infinite loops ✅
