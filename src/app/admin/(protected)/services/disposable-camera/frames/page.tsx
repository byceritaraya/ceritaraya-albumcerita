import { LayoutTemplate } from 'lucide-react';

export default function FramesPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Frames Library</h1>
        <p className="mt-1 text-sm text-gray-500">
          Global repository of photo frames for the Disposable Camera.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <LayoutTemplate className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Frames Coming Soon</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
          The Frame Library feature is currently under development. It will allow you to define custom borders and overlays that can be applied to guest photos globally.
        </p>
      </div>
    </div>
  );
}
