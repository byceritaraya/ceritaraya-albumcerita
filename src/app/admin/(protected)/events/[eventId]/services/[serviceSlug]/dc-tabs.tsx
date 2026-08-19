'use client';

import Link from 'next/link';
import { Settings, Key, Image as ImageIcon } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';

export function DcTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'configuration';

  const tabs = [
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'access', label: 'Access', icon: Key },
    { id: 'album', label: 'Album', icon: ImageIcon },
  ];

  return (
    <div className="border-b border-gray-200 mb-8">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={`${pathname}?tab=${tab.id}`}
              className={`
                group inline-flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors
                ${isActive
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
