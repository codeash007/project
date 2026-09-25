import React, { useState } from 'react';
import { Complaint, User } from '../../types';
import { Wrench, CheckCircle, Clock, MapPin, Phone, AlertCircle, Sparkles, ChevronRight, Check } from 'lucide-react';

interface WorkerDashboardProps {
  currentUser: User;
  complaints: Complaint[];
  onSelectComplaint: (c: Complaint) => void;
  onStartWork: (complaintId: string) => Promise<void>;
  onOpenResolveModal: (c: Complaint) => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  currentUser,
  complaints,
  onSelectComplaint,
  onStartWork,
  onOpenResolveModal
}) => {
  const [filterTab, setFilterTab] = useState<'PENDING' | 'RESOLVED'>('PENDING');

  // Filter complaints assigned to this worker or department
  const myTasks = complaints.filter(
    (c) => c.assignedWorkerId === currentUser.id || c.assignedWorkerName === currentUser.name
  );

  const pendingTasks = myTasks.filter((c) => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS');
  const completedTasks = myTasks.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED');

  const displayed = filterTab === 'PENDING' ? pendingTasks : completedTasks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span className="font-semibold text-emerald-700">Maintenance Operations Depot</span>
            <span>·</span>
            <span>Technician: {currentUser.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Work Orders</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            View student rooms requiring maintenance, inspect suggested tools, initiate on-site visits, and file resolution proof.
          </p>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium shrink-0">
          <button
            onClick={() => setFilterTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'PENDING'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Tasks ({pendingTasks.length})
          </button>
          <button
            onClick={() => setFilterTab('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'RESOLVED'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({completedTasks.length})
          </button>
        </div>
      </div>

      {/* Task Cards */}
      {displayed.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No work orders in this queue</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filterTab === 'PENDING'
              ? 'You have completed all assigned maintenance tickets. The admin will assign new work orders shortly.'
              : 'No completed tasks recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayed.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-slate-900">{c.id}</span>
                  <span>·</span>
                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {c.category}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Block {c.block}, Room {c.room}
                  </span>
                  <span>·</span>
                  <span className="text-slate-500">
                    Priority: <strong className="text-slate-900">{c.aiEnrichment.priorityScore}/100</strong> ({c.aiEnrichment.severity})
                  </span>
                </div>

                <h3
                  onClick={() => onSelectComplaint(c)}
                  className="text-base font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                >
                  {c.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>

                {/* Technician Tool Guidance */}
                {c.aiEnrichment.toolsRequired && c.aiEnrichment.toolsRequired.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] font-semibold text-slate-500">Recommended Kit:</span>
                    {c.aiEnrichment.toolsRequired.slice(0, 3).map((tool, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                {c.status === 'ASSIGNED' && (
                  <button
                    onClick={() => onStartWork(c.id)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                  >
                    Start Work (On-Site)
                  </button>
                )}

                {c.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => onOpenResolveModal(c)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Complete & Resolve
                  </button>
                )}

                <button
                  onClick={() => onSelectComplaint(c)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
