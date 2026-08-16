'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SetupAdminPage() {
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');

  async function handleSetup() {
    setStatus('Creating user...');
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@ceritaraya.com',
      password: 'password123',
    });

    if (error) {
      if (error.message.includes('already registered')) {
        // Try to sign in to get the ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'admin@ceritaraya.com',
          password: 'password123',
        });
        
        if (signInError) {
          setStatus('Error: ' + signInError.message);
          return;
        }
        setUserId(signInData.user.id);
        setStatus('User already existed. Logged in successfully.');
      } else {
        setStatus('Error: ' + error.message);
      }
      return;
    }

    if (data?.user) {
      setUserId(data.user.id);
      setStatus('User created successfully!');
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin Setup Helper</h1>
      
      <button 
        onClick={handleSetup}
        className="px-4 py-2 bg-black text-white rounded-lg"
      >
        Generate Admin User (admin@ceritaraya.com / password123)
      </button>

      {status && (
        <div className="p-4 bg-gray-100 rounded-lg text-sm">
          {status}
        </div>
      )}

      {userId && (
        <div className="space-y-4">
          <p className="font-medium text-green-600">Success! Now run this exact SQL in your Supabase SQL Editor:</p>
          <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-sm">
            {`INSERT INTO public.admin_users (id, email, name, role)
VALUES ('${userId}', 'admin@ceritaraya.com', 'Admin', 'superadmin');`}
          </pre>
          <p className="text-sm text-gray-500">
            Make sure you are running this in the SQL Editor of the EXACT database your app is connected to!
          </p>
        </div>
      )}
    </div>
  );
}
