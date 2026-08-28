import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 text-amber-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
        <div>
          <span className="font-semibold block sm:inline">Backend unavailable:</span>{' '}
          <span className="text-amber-200/80">{message} (Running seamlessly in Demo Mode)</span>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition-colors font-medium text-xs whitespace-nowrap self-end sm:self-auto"
        >
          <RefreshCw className="w-3 h-3" />
          Retry Connection
        </button>
      )}
    </div>
  );
};
