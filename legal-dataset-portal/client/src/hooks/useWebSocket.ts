import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useWebSocket = (enabled: boolean = true, onMessageReceived?: (event: any) => void) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: number;
    let isClosing = false;

    const connect = () => {
      if (isClosing) return;

      const defaultWsUrl = window.location.hostname === 'localhost' && window.location.port === '5173'
        ? 'ws://localhost:8000/ws'
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

      const WS_URL = import.meta.env.VITE_WS_URL || defaultWsUrl;
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        if (!isClosing) {
          console.log('Real-time database sync active.');
        }
      };

      ws.onmessage = (event) => {
        if (isClosing) return;
        try {
          const data = JSON.parse(event.data);
          console.log('Real-time update received:', data);

          if (data.event) {
            if (data.event.startsWith('document_')) {
              queryClient.invalidateQueries({ queryKey: ['documents'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            } else if (data.event.startsWith('source_')) {
              queryClient.invalidateQueries({ queryKey: ['sources'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            } else if (data.event === 'quality_updated') {
              queryClient.invalidateQueries({ queryKey: ['documents'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            } else if (data.event === 'duplicate_updated') {
              queryClient.invalidateQueries({ queryKey: ['duplicates'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            }
          }

          if (onMessageReceived) {
            onMessageReceived(data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket sync payload:', err);
        }
      };

      ws.onclose = () => {
        if (isClosing) return;
        console.log('Sync disconnected. Reconnecting in 5 seconds...');
        reconnectTimeout = window.setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        if (isClosing) return;
        console.error('WebSocket connection error:', err);
        if (ws) {
          ws.close();
        }
      };
    };

    connect();

    return () => {
      isClosing = true;
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [queryClient, onMessageReceived, enabled]);
};

export default useWebSocket;
