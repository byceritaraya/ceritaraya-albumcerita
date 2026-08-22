import type * as React from 'react';

export type SectionKey =
  | 'cover'
  | 'opening'
  | 'couple'
  | 'event_details'
  | 'love_story'
  | 'gallery'
  | 'location'
  | 'wishes'
  | 'gift'
  | 'live_stream'
  | 'closing'
  | 'countdown'
  | 'rsvp'
  | 'video'
  | 'music'
  | 'custom_section';

export interface WeddingInvitationSectionRecord {
  section_key: string;
  data: Record<string, unknown>;
  sort_order: number;
}

export interface WeddingInvitationRendererProps {
  invitation: {
    id: string;
    event_id: string;
    status: string;
    // other fields as needed
  };
  sections: WeddingInvitationSectionRecord[];
  preview?: boolean;
}

export interface WeddingInvitationTemplate {
  slug: string;
  name: string;
  version: number;
  description: string;
  componentKey: string;
  supportedSections: SectionKey[];
  defaultSections: SectionKey[]; // The default order of sections
  Renderer: React.ComponentType<WeddingInvitationRendererProps>;
}

// ── Canonical Section Data Contracts ──────────────────────────────────────────

export interface CoverSectionData {
  title?: string;
  subtitle?: string;
  cover_image_url?: string;
}

export interface CoupleSectionData {
  bride?: {
    name?: string;
    full_name?: string;
    image_url?: string;
  };
  groom?: {
    name?: string;
    full_name?: string;
    image_url?: string;
  };
}

export interface EventDetailsSectionData {
  title?: string;
  date?: string;
  time?: string;
  venue?: string;
  address?: string;
}

export interface GallerySectionData {
  images?: string[];
}

export interface LocationSectionData {
  venue?: string;
  address?: string;
  map_url?: string;
  latitude?: number;
  longitude?: number;
}

// Empty for now, pulls from wedding_wishes table
export type WishesSectionData = Record<string, never>;

export interface ClosingSectionData {
  title?: string;
  message?: string;
  image_url?: string;
}

export type SectionDataMap = {
  cover: CoverSectionData;
  couple: CoupleSectionData;
  event_details: EventDetailsSectionData;
  gallery: GallerySectionData;
  location: LocationSectionData;
  wishes: WishesSectionData;
  closing: ClosingSectionData;
} & Record<string, unknown>;
