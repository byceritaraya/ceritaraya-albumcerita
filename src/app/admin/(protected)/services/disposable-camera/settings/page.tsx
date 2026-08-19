import { Settings } from 'lucide-react';

export default function DisposableCameraSettings() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">General Setup</h1>
        <p className="mt-1 text-sm text-gray-500">
          Global defaults and rules for the Disposable Camera service.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Settings Architecture Ready</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
          This area will contain global service defaults (e.g., default retention period, default limits). These defaults will be inherited when configuring the service for a specific event.
        </p>
        <p className="text-xs text-gray-400 mt-6 uppercase tracking-wider font-semibold">
          Implementation scheduled for next phase
        </p>
      </div>
    </div>
  );
}
