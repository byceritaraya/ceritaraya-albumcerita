import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ReactNode } from 'react';
import { AdminSidebar } from './_components/admin-sidebar';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  // Next.js middleware has already checked that there is a user session.
  // Now we do the authoritative role check.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Authoritative check against admin_users table (using RLS)
  // If the user isn't an admin, RLS will block this read.
  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (error || !adminUser) {
    // Authenticated, but not an admin -> 403 Forbidden state
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10M4.929 4.929l14.142 14.142M4.93 19.071L19.07 4.93" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500 mb-6">
            You do not have permission to access the Cerita Raya Admin Dashboard.
          </p>
          <Link href="/" className="inline-flex items-center justify-center rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-gray-50 flex overflow-hidden">
      <AdminSidebar userEmail={user.email} />

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
