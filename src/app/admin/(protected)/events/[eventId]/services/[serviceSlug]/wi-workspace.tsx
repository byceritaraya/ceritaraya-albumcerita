'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Mail, Layers, ArrowLeft, Loader2, ListOrdered, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { assignWeddingInvitationTemplate } from '@/features/wedding-invitation/actions';
import { getWeddingInvitationTemplate } from '@/features/wedding-invitation/templates/registry';

interface WiWorkspaceProps {
  eventId: string;
  eventName: string;
  hasConfiguration: boolean;
  assignedTemplateSlug: string | null;
  sectionRecords: {
    section_key: string;
    enabled: boolean;
    sort_order: number;
    data: Record<string, unknown>;
  }[];
}

/**
 * Wedding Invitation workspace — Phase 2J.2 Foundation State.
 *
 * Demonstrates the actual Template & Section Architecture.
 */
export function WiWorkspace({ eventId, eventName, hasConfiguration, assignedTemplateSlug, sectionRecords }: WiWorkspaceProps) {
  const [isPending, startTransition] = useTransition();

  const handleAssignArunika = () => {
    startTransition(async () => {
      const result = await assignWeddingInvitationTemplate(eventId, 'arunika');
      if (result.error) {
        alert(`Assignment failed: ${result.error}`);
      }
    });
  };

  const assignedTemplate = assignedTemplateSlug ? getWeddingInvitationTemplate(assignedTemplateSlug) : null;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      {/* Breadcrumb nav */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link
          href={`/admin/events/${eventId}`}
          className="inline-flex items-center gap-1.5 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>
      </nav>

      {/* Page header */}
      <div className="mb-10 flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Wedding Invitation
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Workspace for <span className="font-semibold text-gray-700">{eventName}</span>
          </p>
        </div>
      </div>

      <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Assignment & Template Meta */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-500" />
              Template Assignment
            </h2>
            
            {!hasConfiguration || !assignedTemplateSlug ? (
              <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500 mb-4">No template selected.</p>
                <div className="mb-4">
                  <span className="text-xs font-medium text-gray-500 block mb-1">Available Template:</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                    Arunika
                  </span>
                </div>
                <button
                  onClick={handleAssignArunika}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                  Assign Arunika
                </button>
              </div>
            ) : (
              <div className="border border-green-100 bg-green-50 rounded-xl p-5">
                <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Assigned
                </div>
                <p className="text-sm text-green-900 font-medium">
                  {assignedTemplate ? assignedTemplate.name : assignedTemplateSlug}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  v{assignedTemplate?.version ?? '?'} — {assignedTemplateSlug}
                </p>
              </div>
            )}
          </div>

          {assignedTemplate && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Template Metadata</h2>
              <p className="text-sm text-gray-600 mb-4">{assignedTemplate.description}</p>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Component Key</div>
                  <div className="text-sm font-mono text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">
                    {assignedTemplate.componentKey}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Supported Sections</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {assignedTemplate.supportedSections.map((sec) => (
                      <span key={sec} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Section Records */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">Database Section Records</h2>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                {sectionRecords.length} records
              </span>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              {sectionRecords.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl p-8">
                  <ListOrdered className="w-8 h-8 text-gray-300 mb-3" />
                  <p className="text-sm font-medium">No sections initialized.</p>
                  <p className="text-xs mt-1">Assign a template to generate default section records.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sectionRecords.map((record, idx) => (
                    <div key={record.section_key} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-gray-900">{record.section_key}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 font-mono">Order: {record.sort_order}</span>
                          {record.enabled ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                              <Eye className="w-3 h-3" /> Visible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                              <EyeOff className="w-3 h-3" /> Hidden
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 border border-gray-100 overflow-x-auto">
                        {JSON.stringify(record.data) === '{}' ? (
                          <span className="text-gray-400 italic">Empty Configuration ({"{}"})</span>
                        ) : (
                          JSON.stringify(record.data)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
