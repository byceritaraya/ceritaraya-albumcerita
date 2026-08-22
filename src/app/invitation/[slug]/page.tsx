import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { getWeddingInvitationTemplate } from '@/features/wedding-invitation/templates/registry';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicWeddingInvitationPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createServiceClient();

  // 1. Fetch event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // 2. Fetch wedding invitation (MUST be published)
  const { data: invitation, error: invError } = await supabase
    .from('wedding_invitations')
    .select('id, event_id, status, template_id, wedding_invitation_templates(slug)')
    .eq('event_id', event.id)
    .maybeSingle();

  if (invError || !invitation || invitation.status !== 'published') {
    // Return a safe "Not Ready" state
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-serif text-stone-800 mb-2">Pernikahan {event.name}</h1>
        <p className="text-stone-500">Undangan ini belum siap untuk ditampilkan.</p>
      </div>
    );
  }

  // 3. Resolve template from registry
  const templatesData = invitation.wedding_invitation_templates as unknown as { slug: string };
  const templateSlug = templatesData?.slug;
  
  if (!templateSlug) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center text-stone-500">
        Template undangan belum diatur.
      </div>
    );
  }

  const templateDefinition = getWeddingInvitationTemplate(templateSlug);
  if (!templateDefinition || !templateDefinition.Renderer) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center text-stone-500">
        Template &apos;{templateSlug}&apos; tidak didukung atau sedang dalam pemeliharaan.
      </div>
    );
  }

  // 4. Fetch enabled sections
  const { data: rawSections } = await supabase
    .from('wedding_invitation_sections')
    .select('section_key, data, sort_order')
    .eq('invitation_id', invitation.id)
    .eq('enabled', true)
    .order('sort_order', { ascending: true });

  const sections = (rawSections || []) as { section_key: string; data: Record<string, unknown>; sort_order: number }[];

  const Renderer = templateDefinition.Renderer;

  return (
    <Renderer 
      invitation={invitation as { id: string; event_id: string; status: string; }} 
      sections={sections} 
      preview={false} 
    />
  );
}
