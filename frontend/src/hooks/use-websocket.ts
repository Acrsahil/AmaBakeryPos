import { useState, useEffect, useCallback, useRef } from 'react';
import { getAccessToken } from '@/api/index.js';

export function useWebSocket(path: string) {
    const [data, setData] = useState<any>(null);
    const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('connecting');
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        const token = getAccessToken();
        if (!token) {
            setStatus('closed');
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.VITE_API_BASE_URL
            ? import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws')
            : 'ws://localhost:8000';

        const url = `${host}${path}${path.includes('?') ? '&' : '?'}token=${token}`;

        console.log(`Connecting to WebSocket: ${url}`);
        const socket = new WebSocket(url);

        socket.onopen = () => {
            console.log('WebSocket Connected');
            setStatus('open');
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                const parsedData = JSON.parse(event.data);
                setData(parsedData);
            } catch (err) {
                console.error('Failed to parse WebSocket message:', err);
            }
        };

        socket.onclose = (event) => {
            console.log('WebSocket Disconnected', event.reason);
            setStatus('closed');
            // Reconnect after 5 seconds
            if (!reconnectTimeoutRef.current) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectTimeoutRef.current = null;
                    connect();
                }, 5000);
            }
        };

        socket.onerror = (err) => {
            console.error('WebSocket Error:', err);
            socket.close();
        };

        socketRef.current = socket;
    }, [path]);

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    const sendMessage = useCallback((msg: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(msg));
        } else {
            console.warn('WebSocket is not open. Message not sent.');
        }
    }, []);

    return { data, status, sendMessage };
}
