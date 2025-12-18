import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from './ui';
import { RequestStatus } from '../types';

interface RequestStatusBadgeProps {
  status: RequestStatus;
  timestamp?: string;
  updatedBy?: string;
  showIcon?: boolean;
  showTooltip?: boolean;
}

export const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({
  status,
  timestamp,
  updatedBy,
  showIcon = true,
  showTooltip = true,
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          variant: 'warning' as const,
          icon: <Clock className="w-3 h-3" />,
          label: 'Pending',
        };
      case 'APPROVED':
        return {
          variant: 'success' as const,
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Approved',
        };
      case 'REJECTED':
        return {
          variant: 'danger' as const,
          icon: <XCircle className="w-3 h-3" />,
          label: 'Rejected',
        };
      default:
        return {
          variant: 'light' as const,
          icon: <AlertCircle className="w-3 h-3" />,
          label: status,
        };
    }
  };

  const config = getStatusConfig();
  const hasTooltipContent = timestamp || updatedBy;

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => showTooltip && hasTooltipContent && setShowTooltipState(true)}
        onMouseLeave={() => setShowTooltipState(false)}
      >
        <Badge variant={config.variant} className="inline-flex items-center gap-1">
          {showIcon && config.icon}
          {config.label}
        </Badge>
      </div>

      {/* Tooltip */}
      {showTooltip && hasTooltipContent && showTooltipState && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10 animate-fade-in">
          <div className="bg-textDark text-white text-xs rounded py-2 px-3 shadow-lg whitespace-nowrap">
            {timestamp && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(timestamp).toLocaleString()}
              </div>
            )}
            {updatedBy && (
              <div className="mt-1">
                by {updatedBy}
              </div>
            )}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-textDark"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


