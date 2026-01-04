/**
 * useSSE Hook
 * Custom hook for Server-Sent Events with automatic reconnection
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SSEMessage<T = unknown> {
  type: string;
  data?: T;
}

export interface UseSSEOptions {
  channel: 'GLOBAL' | 'HOME' | 'CONTEXT';
  contextId?: string;
  /** @deprecated Use contextId instead */
  eventId?: string;
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  enabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export function useSSE(options: UseSSEOptions) {
  const {
    channel,
    contextId,
    eventId,
    onMessage,
    onError,
    onOpen,
    enabled = true,
    maxRetries = 5,
    retryDelay = 1000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Build SSE URL
    const params = new URLSearchParams({ channel });
    if (contextId) {
      params.append('contextId', contextId);
    }
    if (eventId) {
      params.append('eventId', eventId);
    }
    const url = `/api/timeline/stream?${params.toString()}`;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        retriesRef.current = 0;
        if (onOpen) {
          onOpen();
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (parseError) {
          console.error('Failed to parse SSE message:', parseError);
        }
      };

      eventSource.onerror = (event) => {
        console.error('SSE error:', event);
        setIsConnected(false);
        eventSource.close();

        if (onError) {
          onError(event);
        }

        // Attempt to reconnect with exponential backoff
        if (retriesRef.current < maxRetries) {
          const delay = retryDelay * Math.pow(2, retriesRef.current);
          retriesRef.current += 1;

          setError(
            `연결이 끊어졌습니다. 재연결 시도 중... (${retriesRef.current}/${maxRetries})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError('연결에 실패했습니다. 페이지를 새로고침해주세요.');
        }
      };
    } catch (err) {
      console.error('Failed to create EventSource:', err);
      setError('연결 생성에 실패했습니다.');
    }
  }, [enabled, channel, contextId, eventId, onMessage, onError, onOpen, maxRetries, retryDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setError(null);
    retriesRef.current = 0;
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    retriesRef.current = 0;
    connect();
  }, [disconnect, connect]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, channel, contextId, eventId, connect, disconnect]);

  return {
    isConnected,
    error,
    reconnect,
    disconnect,
  };
}
