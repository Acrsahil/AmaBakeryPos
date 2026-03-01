import { useEffect, useRef, useCallback } from "react";
import { getAccessToken } from "@/api/index.js";

type DashboardData = {
  success: boolean;
  today_sales?: number;
  sales_percent?: number;
  total_orders?: number;
  order_percent?: number;
  avg_orders?: number;
  peak_hours?: string[];
  top_selling_items?: any[];
  sales_by_category?: any[];
  total_sales?: number;
  total_branch?: number;
  total_user?: number;
  total_count_order?: number;
  average_order_value?: number;
  weekly_sales?: Record<string, number>;
  update_type?: string;
};

type SSEHandler = (data: DashboardData) => void;

export function useDashboardSSE(
  branchId: number | string | null | undefined,
  onUpdate: SSEHandler
) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const rawBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const baseUrl = rawBase.replace(/\/+$/, "");

    // Build URL with params
    const queryParams = new URLSearchParams();
    if (branchId) {
      queryParams.append("branch_id", branchId.toString());
    }

    const token = getAccessToken();
    if (token) {
      queryParams.append("token", token);
    }

    const url = `${baseUrl}/api/dashboard/stream/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    // For better security, withCredentials still ensures cookies are sent if any
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.onopen = () => {
      console.log("[SSE] Dashboard stream connected");
    };

    eventSource.addEventListener("connected", (event) => {
      console.log("[SSE] Connection confirmed:", JSON.parse(event.data));
    });

    eventSource.addEventListener("dashboard_update", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] Dashboard update received:", data);
        onUpdate(data);
      } catch (err) {
        console.error("[SSE] Failed to parse dashboard update:", err);
      }
    });

    eventSource.onerror = (error) => {
      console.error("[SSE] Error:", error);
      eventSource.close();

      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("[SSE] Attempting to reconnect...");
        connect();
      }, 5000);
    };

    eventSourceRef.current = eventSource;
  }, [branchId, onUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return eventSourceRef;
}
