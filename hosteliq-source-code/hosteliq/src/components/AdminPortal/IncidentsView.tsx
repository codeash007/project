import React, { useState } from 'react';
import { Incident, Complaint, Category } from '../../types';
import { Layers, Plus, CheckCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';

interface IncidentsViewProps {
  incidents: Incident[];
  complaints: Complaint[];
  onCreateIncident: (data: {
    title: string;
    category: Category;
    block: string;
    description: string;
  }) => Promise<void>;
  onSelectComplaint: (c: Complaint) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  complaints,
  onCreateIncident,
  onSelectComplaint
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Electricity');
  const [block, setBlock] = useState('B');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    await onCreateIncident({
      title: title.trim(),
      category,
      block,
      description: description.trim()
    });
    setTitle('');
    setDescription('');
    setIsSubmitting(false);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Master Incidents & Outages</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Aggregate related duplicate complaints into a single operational incident. Resolve multiple tickets simultaneously when main infrastructure is restored.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Declare Master Incident
        </button>
      </div>

      {/* Incidents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incidents.map((inc) => {
          const linkedComplaints = complaints.filter(
            (c) => inc.relatedComplaintIds?.includes(c.id) || c.incidentId === inc.id
          );

          return (
            <div key={inc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-700">{inc.id}</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    inc.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {inc.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">{inc.title}</h3>
              <p className="text-xs text-slate-600">{inc.description}</p>

              <div className="text-xs text-slate-500 flex items-center gap-3 pt-2 border-t border-slate-100">
                <span>Category: <strong>{inc.category}</strong></span>
                <span>·</span>
                <span>Block: <strong>{inc.block}</strong></span>
                <span>·</span>
                <span>{linkedComplaints.length} tickets clustered</span>
              </div>

              {/* Linked complaints */}
              {linkedComplaints.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Clustered Complaints ({linkedComplaints.length}):
                  </span>
                  <div className="space-y-1.5">
                    {linkedComplaints.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onSelectComplaint(c)}
                        className="p-2 bg-slate-50 hover:bg-indigo-50/50 rounded-lg border border-slate-200 text-xs flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="truncate">
                          <span className="font-mono font-semibold text-slate-800 mr-1.5">{c.id}</span>
                          <span className="text-slate-700">{c.title}</span>
                          <span className="text-slate-400 ml-1.5">(Rm {c.room})</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Declare Master Incident</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Incident Title</label>
                <input
                  type="text"
                  placeholder="e.g. Block B Main Feeder Trip"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="Electricity">Electricity</option>
                    <option value="AC">AC</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="WiFi">WiFi</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Cleaning">Cleaning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Impacted Block</label>
                  <input
                    type="text"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Root Cause</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe scope, affected floors, and maintenance strategy..."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  {isSubmitting ? 'Creating...' : 'Create Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
