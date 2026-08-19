import Link from 'next/link';
import { ReactNode } from 'react';
import { Camera, Settings, Film, LayoutTemplate, ArrowLeft } from 'lucide-react';

export default function DisposableCameraLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full">
      {/* Local Service Navigation */}
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0 flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <Link 
            href="/admin/services" 
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </Link>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
              <Camera className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">Disposable Camera</h2>
              <p className="text-xs text-gray-500">Service Management</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 py-4 px-3 space-y-1">
          <Link href="/admin/services/disposable-camera" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
            <Camera className="w-4 h-4" />
            Overview
          </Link>
          <Link href="/admin/services/disposable-camera/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
            <Settings className="w-4 h-4" />
            General Setup
          </Link>
          <Link href="/admin/services/disposable-camera/film-recipes" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
            <Film className="w-4 h-4" />
            Film Recipes
          </Link>
          <Link href="/admin/services/disposable-camera/frames" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
            <LayoutTemplate className="w-4 h-4" />
            Frames
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
