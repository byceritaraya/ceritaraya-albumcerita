'use server';

import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';

export type ClientState = {
  error?: string;
  success?: boolean;
};

export async function createClientAction(
  _prevState: ClientState,
  formData: FormData
): Promise<ClientState> {
  const name = (formData.get('name') as string)?.trim();
  const contact_name = (formData.get('contact_name') as string)?.trim() || null;
  const whatsapp = (formData.get('whatsapp') as string)?.trim() || null;
  const email = (formData.get('email') as string)?.trim() || null;
  const notes = (formData.get('notes') as string)?.trim() || null;
  const status = (formData.get('status') as string) || 'active';

  if (!name) {
    return { error: 'Client Name is required' };
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('clients')
    .insert({
      name,
      contact_name,
      whatsapp,
      email,
      notes,
      status,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating client:', error);
    return { error: 'Failed to create client. Please try again.' };
  }

  revalidatePath('/admin/clients');
  redirect(`/admin/clients/${data.id}`);
}

export async function updateClientAction(
  clientId: string,
  _prevState: ClientState,
  formData: FormData
): Promise<ClientState> {
  const name = (formData.get('name') as string)?.trim();
  const contact_name = (formData.get('contact_name') as string)?.trim() || null;
  const whatsapp = (formData.get('whatsapp') as string)?.trim() || null;
  const email = (formData.get('email') as string)?.trim() || null;
  const notes = (formData.get('notes') as string)?.trim() || null;
  const status = (formData.get('status') as string) || 'active';

  if (!name) {
    return { error: 'Client Name is required' };
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from('clients')
    .update({
      name,
      contact_name,
      whatsapp,
      email,
      notes,
      status,
    })
    .eq('id', clientId);

  if (error) {
    console.error('Error updating client:', error);
    return { error: 'Failed to update client. Please try again.' };
  }

  revalidatePath('/admin/clients');
  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}
