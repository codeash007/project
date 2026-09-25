import React, { useState } from 'react';
import { Complaint, Incident } from '../../types';
import { Layers, X, AlertTriangle, ArrowRight, Check, Sparkles, Link } from 'lucide-react';

interface DuplicateInspectorModalProps {
  complaint: Complaint;
  allComplaints: Complaint[];
  incidents: Incident[];
  isOpen: boolean;
  onClose: () => void;
  onLinkToIncident: (complaintId: string, incidentId: string) => Promise<void>;
  onCreateIncidentAndLink: (title: string, category: any, block: string, description: string, relatedIds: string[]) => Promise<void>;
}

export const DuplicateInspectorModal: React.FC<DuplicateInspectorModalProps> = ({
  complaint,
  allComplaints,
  incidents,
  isOpen,
  onClose,
  onLinkToIncident,
  onCreateIncidentAndLink
}) => {
  if (!isOpen) return null;

  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [newIncidentTitle, setNewIncidentTitle] = useState(
    `Block ${complaint.block} ${complaint.category} Cluster Outage`
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'create'>('link');

  // Match objects
  const duplicates = complaint.aiEnrichment.possibleDuplicates;
  const matchingComplaints = allComplaints.filter((c) =>
    duplicates.some((d) => d.complaintId === c.id)
  );

  const handleLink = async () => {
    if (!selectedIncidentId) return;
    setIsProcessing(true);
    await onLinkToIncident(complaint.id, selectedIncidentId);
    setIsProcessing(false);
    onClose();
  };

  const handleCreateAndLink = async () => {
    if (!newIncidentTitle.trim()) return;
    setIsProcessing(true);
    const relatedIds = [complaint.id, ...duplicates.map((d) => d.complaintId)];
    await onCreateIncidentAndLink(
      newIncidentTitle.trim(),
      complaint.category,
      complaint.block,
      `AI-clustered incident linking ${relatedIds.length} complaints sharing high cosine semantic similarity in Block ${complaint.block}.`,
      relatedIds
    );
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold mb-1">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>AI Duplicate & Incident Clustering Inspector (PRD AI-03)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Review Semantic Duplicates for Ticket {complaint.id}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              HostelIQ calculates vector cosine similarity and spatial proximity. Tickets are surfaced for human confirmation without silent merging.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Ticket */}
          <div className="p-4 bg-slate-50 border-2 border-indigo-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-indigo-700">Target Ticket: {complaint.id}</span>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-semibold rounded">
                Block {complaint.block} · Rm {complaint.room}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">{complaint.title}</h4>
            <p className="text-xs text-slate-600 italic">"{complaint.description}"</p>
            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 flex justify-between">
              <span>Reported by: {complaint.studentName}</span>
              <span>Category: {complaint.category}</span>
            </div>
          </div>

          {/* Top Detected Duplicate */}
          {matchingComplaints.length > 0 ? (
            <div className="p-4 bg-amber-50/70 border-2 border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-amber-800">
                  Matched Ticket: {matchingComplaints[0].id}
                </span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {Math.round(duplicates[0]?.similarityScore * 100)}% Similarity
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{matchingComplaints[0].title}</h4>
              <p className="text-xs text-slate-600 italic">"{matchingComplaints[0].description}"</p>
              <div className="text-[11px] text-amber-900 pt-2 border-t border-amber-200 flex justify-between">
                <span>
                  Location: Block {matchingComplaints[0].block} · Rm {matchingComplaints[0].room}
                </span>
                <span>Status: {matchingComplaints[0].status}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-500">
              No matching records in database.
            </div>
          )}
        </div>

        {/* Explainability factors */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
          <span className="font-semibold text-slate-900 block mb-1">AI Match Evidence:</span>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            {duplicates[0]?.reason || 'High textual vocabulary overlap on symptom descriptors.'}{' '}
            Both reports originate from adjacent rooms on the same floor with overlapping physical symptoms.
          </p>
        </div>

        {/* Action Panel */}
        <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-indigo-950">Resolution Strategy:</span>
            <div className="flex bg-white rounded-lg p-0.5 border border-indigo-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'link' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600'
                }`}
              >
                Link to Existing Incident
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'create' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600'
                }`}
              >
                Create New Master Incident
              </button>
            </div>
          </div>

          {activeTab === 'link' ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl flex-1"
              >
                <option value="">Select Existing Master Incident...</option>
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.title} (Block {inc.block}) · {inc.relatedComplaintIds.length} tickets linked
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleLink}
                disabled={!selectedIncidentId || isProcessing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shrink-0"
              >
                Link Ticket to Incident
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Incident Title..."
                value={newIncidentTitle}
                onChange={(e) => setNewIncidentTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateAndLink}
                  disabled={!newIncidentTitle.trim() || isProcessing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
                >
                  Create Master Incident & Cluster Tickets
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Close & Keep Independent
          </button>
        </div>
      </div>
    </div>
  );
};
