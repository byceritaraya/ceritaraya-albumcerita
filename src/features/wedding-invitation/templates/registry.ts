import { WeddingInvitationTemplate } from './types';
import { arunikaTemplate } from './arunika';

const templates: Record<string, WeddingInvitationTemplate> = {
  [arunikaTemplate.slug]: arunikaTemplate,
};

export function getWeddingInvitationTemplate(slug: string): WeddingInvitationTemplate | null {
  return templates[slug] || null;
}

export function getAllWeddingInvitationTemplates(): WeddingInvitationTemplate[] {
  return Object.values(templates);
}
