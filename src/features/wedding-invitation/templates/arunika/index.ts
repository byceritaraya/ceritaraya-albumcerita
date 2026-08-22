import { WeddingInvitationTemplate } from '../types';
import { ArunikaRenderer } from './renderer';

export const arunikaTemplate: WeddingInvitationTemplate = {
  slug: 'arunika',
  name: 'Arunika',
  version: 1,
  description: 'A classic and elegant wedding invitation template with modern typography and smooth animations.',
  componentKey: 'wedding-template-arunika',
  supportedSections: [
    'cover',
    'couple',
    'event_details',
    'gallery',
    'location',
    'wishes',
    'closing',
  ],
  defaultSections: [
    'cover',
    'couple',
    'event_details',
    'gallery',
    'location',
    'wishes',
    'closing',
  ],
  Renderer: ArunikaRenderer,
};
