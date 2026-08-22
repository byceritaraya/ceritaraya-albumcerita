import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { getWeddingInvitationTemplate } from '@/features/wedding-invitation/templates/registry';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function AdminWeddingInvitationPreviewPage({ params }: PageProps) {
  const { eventId } = await params;
  const supabase = createServiceClient();

  // 1. Fetch event
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId);
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name')
    .eq(isUuid ? 'id' : 'event_id', eventId)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // 2. Fetch wedding invitation (allow any status, e.g., 'draft')
  const { data: invitation, error: invError } = await supabase
    .from('wedding_invitations')
    .select('id, event_id, status, template_id, wedding_invitation_templates(slug)')
    .eq('event_id', event.id)
    .maybeSingle();

  if (invError || !invitation) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center text-stone-500">
        Konfigurasi Wedding Invitation tidak ditemukan.
      </div>
    );
  }

  // 3. Resolve template from registry
  const templatesData = invitation.wedding_invitation_templates as unknown as { slug: string };
  const templateSlug = templatesData?.slug;
  
  if (!templateSlug) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center text-stone-500">
        Template undangan belum diatur. Silakan atur template terlebih dahulu di workspace.
      </div>
    );
  }

  const templateDefinition = getWeddingInvitationTemplate(templateSlug);
  if (!templateDefinition || !templateDefinition.Renderer) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center text-stone-500">
        Template &apos;{templateSlug}&apos; tidak memiliki renderer yang valid.
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
      preview={true} // True to show admin indicators
    />
  );
}
