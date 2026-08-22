'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toggleSectionVisibility, reorderSections } from '../actions';

interface SectionRecord {
  id: string;
  section_key: string;
  enabled: boolean;
  sort_order: number;
}

interface SectionManagerListProps {
  eventId: string;
  initialSections: SectionRecord[];
}

function SortableItem({ 
  section,
  disabled,
  onToggle 
}: { 
  section: SectionRecord;
  disabled: boolean;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center justify-between p-4 mb-2 bg-white border rounded-xl shadow-sm transition-colors ${
        isDragging 
          ? 'border-gray-900 shadow-md ring-2 ring-gray-900/10' 
          : disabled 
            ? 'border-gray-100 opacity-60' 
            : 'border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <button 
          type="button"
          className={`p-1 text-gray-400 transition-colors ${disabled ? 'cursor-not-allowed' : 'hover:text-gray-600 cursor-grab active:cursor-grabbing'}`}
          {...attributes} 
          {...listeners}
          aria-label="Drag handle"
          disabled={disabled}
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <span className="font-semibold text-gray-900 capitalize">
          {section.section_key.replace(/_/g, ' ')}
        </span>
      </div>
      
      <button
        type="button"
        onClick={() => onToggle(section.id, !section.enabled)}
        disabled={disabled}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed ${
          section.enabled 
            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 disabled:opacity-60' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200 disabled:opacity-60'
        }`}
      >
        {section.enabled ? (
          <>
            <Eye className="w-4 h-4" /> Visible
          </>
        ) : (
          <>
            <EyeOff className="w-4 h-4" /> Hidden
          </>
        )}
      </button>
    </div>
  );
}

export function SectionManagerList({ eventId, initialSections }: SectionManagerListProps) {
  const [sections, setSections] = useState(initialSections);
  const [isMutating, setIsMutating] = useState(false);

  // Always points to the current committed sections for correct rollback.
  // Using a ref avoids stale closure capture in async callbacks.
  const committedSectionsRef = useRef(initialSections);

  // Keep local state and ref in sync when server re-renders the parent
  // (e.g. after a successful revalidatePath)
  React.useEffect(() => {
    setSections(initialSections);
    committedSectionsRef.current = initialSections;
  }, [initialSections]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handles section visibility toggle.
   *
   * Concurrency: guarded by isMutating lock. While any mutation is pending,
   * the toggle button is disabled at the UI level and the handler returns early.
   *
   * Rollback: rolls back to committedSectionsRef.current (not a stale closure),
   * so rollbacks are always based on the last server-confirmed state.
   */
  const handleToggle = useCallback(async (sectionId: string, newEnabled: boolean) => {
    if (isMutating) return;

    setIsMutating(true);

    // Snapshot current committed state for safe rollback
    const snapshot = committedSectionsRef.current;

    // Optimistic UI update
    setSections(current => 
      current.map(s => s.id === sectionId ? { ...s, enabled: newEnabled } : s)
    );

    const result = await toggleSectionVisibility(eventId, sectionId, newEnabled);

    if (result.error) {
      alert(`Gagal menyimpan perubahan: ${result.error}`);
      // Rollback to last confirmed state (not stale closure)
      setSections(snapshot);
    } else {
      // Update the committed ref to reflect the new confirmed state
      committedSectionsRef.current = committedSectionsRef.current.map(
        s => s.id === sectionId ? { ...s, enabled: newEnabled } : s
      );
    }

    setIsMutating(false);
  }, [eventId, isMutating]);

  /**
   * Handles drag-and-drop reordering.
   *
   * Concurrency: guarded by isMutating lock. DndContext receives disabled items
   * and onDragEnd returns early while a mutation is pending, preventing
   * interleaved reorder requests.
   *
   * Rollback: rolls back to committedSectionsRef.current — always the last
   * server-confirmed state regardless of prior optimistic updates.
   */
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;
    if (isMutating) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    const newSections = arrayMove(sections, oldIndex, newIndex);

    setIsMutating(true);
    setSections(newSections);

    const orderedIds = newSections.map(s => s.id);
    const result = await reorderSections(eventId, orderedIds);

    if (result.error) {
      alert(`Gagal menyimpan urutan: ${result.error}`);
      // Rollback to last confirmed state
      setSections(committedSectionsRef.current);
    } else {
      // Update committed ref to reflect new confirmed order
      committedSectionsRef.current = newSections;
    }

    setIsMutating(false);
  }, [eventId, isMutating, sections]);

  return (
    <div className="w-full relative">
      {isMutating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl pointer-events-none">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      )}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section) => (
            <SortableItem 
              key={section.id} 
              section={section}
              disabled={isMutating}
              onToggle={handleToggle}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
