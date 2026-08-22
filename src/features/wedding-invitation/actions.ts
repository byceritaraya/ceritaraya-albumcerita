'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { getWeddingInvitationTemplate } from './templates/registry';
import { revalidatePath } from 'next/cache';

/**
 * Assigns a Wedding Invitation template to an event's invitation record.
 * 
 * 1. Validates the template exists in the registry.
 * 2. Fetches the database template record.
 * 3. Upserts the `wedding_invitations` record.
 * 4. Initializes default sections for the template, avoiding duplicates.
 */
export async function assignWeddingInvitationTemplate(
  eventId: string,
  templateSlug: string
): Promise<{ error?: string }> {
  try {
    const supabase = createServiceClient();
    
    // 1. Validate template exists in our application registry
    const templateDefinition = getWeddingInvitationTemplate(templateSlug);
    if (!templateDefinition) {
      return { error: `Template '${templateSlug}' is not registered in the system.` };
    }

    // 2. Fetch the corresponding template ID from the database
    const { data: dbTemplate, error: templateError } = await supabase
      .from('wedding_invitation_templates')
      .select('id')
      .eq('slug', templateSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (templateError) throw templateError;
    if (!dbTemplate) {
      return { error: `Template '${templateSlug}' does not exist or is inactive in the database.` };
    }

    // 3. Upsert the wedding_invitations record (ensure it exists and assign template)
    // First try to select it
    const { data: existingInvitation, error: invError } = await supabase
      .from('wedding_invitations')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (invError) throw invError;
    
    let invitationId: string;

    if (!existingInvitation) {
      // Create new
      const { data: newInv, error: insertError } = await supabase
        .from('wedding_invitations')
        .insert({
          event_id: eventId,
          template_id: dbTemplate.id,
          status: 'draft',
        })
        .select('id')
        .single();
        
      if (insertError) throw insertError;
      invitationId = newInv.id;
    } else {
      // Update existing
      const { error: updateError } = await supabase
        .from('wedding_invitations')
        .update({ template_id: dbTemplate.id })
        .eq('id', existingInvitation.id);
        
      if (updateError) throw updateError;
      invitationId = existingInvitation.id;
    }

    // 4. Fetch existing sections to avoid duplicates
    const { data: existingSections, error: sectionsError } = await supabase
      .from('wedding_invitation_sections')
      .select('section_key')
      .eq('invitation_id', invitationId);

    if (sectionsError) throw sectionsError;

    const existingSectionKeys = new Set(existingSections?.map(s => s.section_key) || []);

    // 5. Initialize missing default sections
    const sectionsToInsert = templateDefinition.defaultSections
      .filter(sectionKey => !existingSectionKeys.has(sectionKey))
      .map((sectionKey, index) => ({
        invitation_id: invitationId,
        section_key: sectionKey,
        enabled: true,
        // Calculate a safe sort_order (e.g., append after existing, or just use index)
        // Since we are inserting missing ones, we just append them.
        sort_order: (existingSections?.length || 0) + index,
        data: {},
      }));

    if (sectionsToInsert.length > 0) {
      const { error: insertSectionsError } = await supabase
        .from('wedding_invitation_sections')
        .insert(sectionsToInsert);

      if (insertSectionsError) throw insertSectionsError;
    }

    revalidatePath(`/admin/events/${eventId}/services/wedding-invitation`);
    return {};

  } catch (error: unknown) {
    console.error('[assignWeddingInvitationTemplate] error:', error);
    const err = error as Error;
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Toggles the visibility of a specific wedding invitation section.
 * Validates that the section actually belongs to the specified event.
 * Returns an error if no row was matched (wrong sectionId for this event).
 */
export async function toggleSectionVisibility(
  eventId: string,
  sectionId: string,
  enabled: boolean
): Promise<{ error?: string }> {
  try {
    const supabase = createServiceClient();

    // 1. Basic input validation
    if (!sectionId || typeof sectionId !== 'string') {
      return { error: 'Invalid section ID.' };
    }

    // 2. Resolve the invitation belonging to the event
    const { data: invitation, error: invError } = await supabase
      .from('wedding_invitations')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (invError || !invitation) {
      return { error: 'Wedding invitation configuration not found for this event.' };
    }

    // 3. Verify the section exists and belongs to this invitation before updating
    const { data: sectionCheck, error: checkError } = await supabase
      .from('wedding_invitation_sections')
      .select('id')
      .eq('id', sectionId)
      .eq('invitation_id', invitation.id)
      .maybeSingle();

    if (checkError) throw checkError;
    if (!sectionCheck) {
      return { error: 'Section not found or does not belong to this event.' };
    }

    // 4. Perform the update
    const { error: updateError } = await supabase
      .from('wedding_invitation_sections')
      .update({ enabled })
      .eq('id', sectionId)
      .eq('invitation_id', invitation.id);

    if (updateError) throw updateError;

    revalidatePath(`/admin/events/${eventId}/services/wedding-invitation`);
    revalidatePath(`/admin/events/${eventId}/services/wedding-invitation/preview`);
    return {};

  } catch (error: unknown) {
    console.error('[toggleSectionVisibility] error:', error);
    const err = error as Error;
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Reorders wedding invitation sections using a database RPC to ensure atomicity
 * and prevent cross-event updates.
 * Pre-validates input before calling the RPC.
 */
export async function reorderSections(
  eventId: string,
  orderedSectionIds: string[]
): Promise<{ error?: string }> {
  try {
    const supabase = createServiceClient();

    // 1. Server-side input pre-validation (do not rely solely on client or RPC)
    if (!Array.isArray(orderedSectionIds) || orderedSectionIds.length === 0) {
      return { error: 'Section order list must not be empty.' };
    }
    if (orderedSectionIds.some(id => typeof id !== 'string' || id.trim() === '')) {
      return { error: 'All section IDs must be non-empty strings.' };
    }
    const uniqueIds = new Set(orderedSectionIds);
    if (uniqueIds.size !== orderedSectionIds.length) {
      return { error: 'Section IDs must not contain duplicates.' };
    }

    // 2. Resolve the invitation belonging to the event
    const { data: invitation, error: invError } = await supabase
      .from('wedding_invitations')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (invError || !invitation) {
      return { error: 'Wedding invitation configuration not found for this event.' };
    }

    // 3. Call the RPC to reorder atomically (RPC performs full-set + ownership validation)
    const { error: rpcError } = await supabase.rpc('reorder_wedding_invitation_sections', {
      p_invitation_id: invitation.id,
      p_section_ids: orderedSectionIds,
    });

    if (rpcError) throw rpcError;

    revalidatePath(`/admin/events/${eventId}/services/wedding-invitation`);
    revalidatePath(`/admin/events/${eventId}/services/wedding-invitation/preview`);
    return {};

  } catch (error: unknown) {
    console.error('[reorderSections] error:', error);
    const err = error as Error;
    return { error: err.message || 'An unexpected error occurred.' };
  }
}
