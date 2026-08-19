'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, Box, ShoppingCart, Settings } from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  disabled?: boolean;
}

function NavItem({ href, icon: Icon, children, disabled = false }: NavItemProps) {
  const pathname = usePathname();
  // Active if exact match for dashboard, or starts with href for others
  const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 rounded-lg cursor-not-allowed opacity-60">
        <Icon className="w-5 h-5" />
        {children}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        active 
          ? 'bg-gray-100 text-gray-900' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      {children}
    </Link>
  );
}

export function AdminSidebar({ userEmail }: { userEmail: string | undefined }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-dvh overflow-y-auto sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <span className="text-lg font-bold tracking-tight text-gray-900">Cerita Raya</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Overview
        </div>
        <NavItem href="/admin" icon={LayoutDashboard}>Dashboard</NavItem>
        
        <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
          Management
        </div>
        <NavItem href="/admin/clients" icon={Users}>Clients</NavItem>
        <NavItem href="/admin/events" icon={Calendar}>Events</NavItem>
        
        <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
          Services
        </div>
        <NavItem href="/admin/services" icon={Box}>Services</NavItem>
        <NavItem href="/admin/orders" icon={ShoppingCart} disabled>Orders</NavItem>
        
        <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
          System
        </div>
        <NavItem href="/admin/settings" icon={Settings} disabled>Settings</NavItem>
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-600">{userEmail?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
