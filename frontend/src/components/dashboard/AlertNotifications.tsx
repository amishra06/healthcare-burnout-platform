import React from 'react';

interface Alert {
  id: number;
  message: string;
  risk_score: number;
  created_at: string;
  staff_id: number;
  staff_name: string;
  department: string;
  resolved: boolean;
}

interface AlertNotificationsProps {
  alerts: Alert[];
  onAlertClick?: (alertId: number) => void;
  onResolveAlert?: (alertId: number) => void;
  showResolveButton?: boolean;
}

const AlertNotifications: React.FC<AlertNotificationsProps> = ({
  alerts,
  onAlertClick,
  onResolveAlert,
  showResolveButton = true,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getAlertIcon = () => (
    <svg
      className="w-5 h-5 text-red-400"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );

  if (alerts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Active Alerts
        </h3>
        <div className="text-center py-8">
          <div className="text-green-600 text-sm font-medium">
            ✓ No active alerts
          </div>
          <div className="text-gray-500 text-sm mt-1">
            All staff are within acceptable risk levels
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Active Alerts
        </h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {alerts.length} active
        </span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 border border-red-200 rounded-lg bg-red-50 ${
              onAlertClick ? 'cursor-pointer hover:bg-red-100' : ''
            }`}
            onClick={() => onAlertClick?.(alert.id)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-red-800">
                    High Risk Alert
                  </p>
                  <p className="text-xs text-red-600">
                    {formatDate(alert.created_at)}
                  </p>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  <span className="font-medium">{alert.staff_name}</span> ({alert.department})
                  has reached a high burnout risk score of {alert.risk_score}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  {alert.message}
                </p>
              </div>
            </div>
            
            {showResolveButton && onResolveAlert && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolveAlert(alert.id);
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Mark as Resolved
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {alerts.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-500">
            View all alerts
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertNotifications;