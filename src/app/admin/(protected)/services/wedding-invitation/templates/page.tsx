import { Layout } from 'lucide-react';

export default function TemplatesPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Templates Library</h1>
        <p className="mt-1 text-sm text-gray-500">
          Global repository of Wedding Invitation templates.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <Layout className="w-8 h-8 text-rose-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Templates Coming Soon</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
          The Template Library is currently in the architectural phase. When implemented, this will be the central hub to design, manage, and publish invitation themes.
        </p>
      </div>
    </div>
  );
}
