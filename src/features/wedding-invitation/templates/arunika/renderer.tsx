import React from 'react';
import { WeddingInvitationRendererProps } from '../types';
import { ArunikaLayout } from './components/layout';
import { SectionNavigation } from './components/section-navigation';

// Sections
import { ArunikaCoverSection } from './sections/cover';
import { ArunikaCoupleSection } from './sections/couple';
import { ArunikaEventDetailsSection } from './sections/event-details';
import { ArunikaGallerySection } from './sections/gallery';
import { ArunikaLocationSection } from './sections/location';
import { ArunikaWishesSection } from './sections/wishes';
import { ArunikaClosingSection } from './sections/closing';

const SECTION_COMPONENTS: Record<string, React.ComponentType<{ data: Record<string, unknown> }>> = {
  cover: ArunikaCoverSection,
  couple: ArunikaCoupleSection,
  event_details: ArunikaEventDetailsSection,
  gallery: ArunikaGallerySection,
  location: ArunikaLocationSection,
  wishes: ArunikaWishesSection as React.ComponentType<{ data: Record<string, unknown> }>, // Type override because wishes doesn't use data prop currently
  closing: ArunikaClosingSection,
};

export function ArunikaRenderer({ sections, preview = false }: WeddingInvitationRendererProps) {
  
  // Create an array of renderable React nodes
  const renderableScenes: React.ReactNode[] = [];

  for (const section of sections) {
    const Component = SECTION_COMPONENTS[section.section_key];
    if (Component) {
      renderableScenes.push(
        <Component key={section.section_key} data={section.data} />
      );
    }
  }

  return (
    <ArunikaLayout>
      {preview && (
        <div className="absolute top-4 left-4 z-50 bg-black/80 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg uppercase tracking-widest backdrop-blur-sm pointer-events-none">
          Admin Preview Mode
        </div>
      )}
      
      <SectionNavigation>
        {renderableScenes}
      </SectionNavigation>
    </ArunikaLayout>
  );
}
