import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  XCircle,
  Clock,
} from "lucide-react";

interface WebhookStatusIndicatorProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function WebhookStatusIndicator({
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: WebhookStatusIndicatorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Fetch webhook status
  const { data: status, refetch, isLoading, error } = trpc.whatsapp.checkWebhookStatus.useQuery(
    undefined,
    {
      refetchInterval: autoRefresh ? refreshInterval : false,
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastRefreshTime(new Date());
    } catch (err) {
      console.error("Failed to refresh webhook status:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  // Determine status styling
  const getStatusStyles = () => {
    if (isLoading || isRefreshing) {
      return {
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        iconColor: "text-blue-600",
        textColor: "text-blue-900",
        icon: Loader,
      };
    }

    if (error) {
      return {
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        iconColor: "text-red-600",
        textColor: "text-red-900",
        icon: AlertCircle,
      };
    }

    switch (status?.status) {
      case "connected":
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          textColor: "text-green-900",
          icon: CheckCircle,
        };
      case "invalid_credentials":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          textColor: "text-red-900",
          icon: XCircle,
        };
      case "disconnected":
        return {
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          iconColor: "text-yellow-600",
          textColor: "text-yellow-900",
          icon: AlertCircle,
        };
      default:
        return {
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          iconColor: "text-gray-600",
          textColor: "text-gray-900",
          icon: AlertCircle,
        };
    }
  };

  const styles = getStatusStyles();
  const IconComponent = styles.icon;

  return (
    <Card className={`p-6 border-2 ${styles.borderColor} ${styles.bgColor}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {isLoading || isRefreshing ? (
            <Loader className={`w-6 h-6 ${styles.iconColor} flex-shrink-0 mt-0.5 animate-spin`} />
          ) : (
            <IconComponent className={`w-6 h-6 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
          )}

          <div className="flex-1">
            <h3 className={`font-bold text-lg ${styles.textColor}`}>
              {isLoading || isRefreshing ? "Checking Status..." : error ? "Connection Error" : "Webhook Status"}
            </h3>

            {error && (
              <p className={`text-sm ${styles.textColor} mt-2`}>
                Failed to check status. This might be due to a network issue or invalid configuration.
              </p>
            )}

            {status && !error && (
              <>
                <p className={`text-sm ${styles.textColor} mt-2`}>{status.message}</p>

                {status.responseTime && (
                  <p className={`text-xs ${styles.textColor} opacity-75 mt-2`}>
                    Response time: {status.responseTime}ms
                  </p>
                )}

                {status.phoneNumberId && (
                  <p className={`text-xs ${styles.textColor} opacity-75 mt-1`}>
                    Phone Number ID: {status.phoneNumberId}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <Clock className="w-3 h-3 opacity-50" />
                  <span className={`text-xs ${styles.textColor} opacity-75`}>
                    Last checked: {getTimeAgo(new Date(status.lastChecked))}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          variant="outline"
          size="sm"
          className="border-black flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Checking..." : "Refresh"}
        </Button>
      </div>

      {/* Status Indicator Dot */}
      <div className="mt-4 pt-4 border-t border-current opacity-20 flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            status?.isConnected ? "bg-green-600" : "bg-red-600"
          }`}
        ></div>
        <span className="text-xs font-bold">
          {status?.isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </Card>
  );
}

/**
 * Quick status badge for display in headers or compact spaces
 */
export function WebhookStatusBadge() {
  const { data: status, isLoading } = trpc.whatsapp.checkWebhookStatus.useQuery(undefined, {
    refetchInterval: 60000, // Check every minute
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
        <Loader className="w-3 h-3 animate-spin" />
        Checking...
      </div>
    );
  }

  if (status?.isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
        <CheckCircle className="w-3 h-3" />
        Connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
      <XCircle className="w-3 h-3" />
      Disconnected
    </div>
  );
}
