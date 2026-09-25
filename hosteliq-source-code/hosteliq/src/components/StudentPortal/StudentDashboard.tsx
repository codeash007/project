import React, { useState } from 'react';
import { Complaint, User } from '../../types';
import { Plus, Clock, CheckCircle2, AlertCircle, Star, Search, ChevronRight, Sparkles } from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
  complaints: Complaint[];
  onOpenNewComplaint: () => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  complaints,
  onOpenNewComplaint,
  onSelectComplaint
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const activeCount = complaints.filter(
    (c) => c.status === 'OPEN' || c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS' || c.status === 'REOPENED'
  ).length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;
  const closedCount = complaints.filter((c) => c.status === 'CLOSED').length;

  const filtered = complaints.filter((c) => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'ASSIGNED':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'IN_PROGRESS':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'RESOLVED':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold';
      case 'CLOSED':
        return 'text-slate-600 bg-slate-100 border-slate-200';
      case 'REOPENED':
        return 'text-rose-700 bg-rose-50 border-rose-200 font-semibold';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & KPI Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>{currentUser.hostel}</span>
            <span>·</span>
            <span>Block {currentUser.block}</span>
            <span>·</span>
            <span>Room {currentUser.room}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Support Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Track reported room & hostel maintenance requests. AI triage predicts priority and matches technician dispatch automatically.
          </p>
        </div>

        <button
          onClick={onOpenNewComplaint}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Report New Issue
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">In Progress / Pending</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{activeCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Resolved (Awaiting Your Review)</span>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">{resolvedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Completed & Closed</span>
            <div className="text-2xl font-bold text-slate-700 mt-0.5">{closedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Star className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Complaints List Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header & Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Your Tickets</h2>
            <span className="text-xs text-slate-500">({complaints.length} Total)</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket title or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg w-48 sm:w-60 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
              {['ALL', 'OPEN', 'RESOLVED', 'CLOSED'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterStatus === tab
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List Content */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No complaints found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Everything in your room is operational! Click "Report New Issue" whenever maintenance is needed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectComplaint(c)}
                className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-medium text-slate-900">{c.id}</span>
                    <span>·</span>
                    <span>Category: {c.category}</span>
                    <span>·</span>
                    <span>Block {c.block}, Rm {c.room}</span>
                    <span>·</span>
                    <span>{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                    {c.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      Priority: {c.aiEnrichment.priorityScore}/100 ({c.aiEnrichment.severity})
                    </span>
                    {c.assignedWorkerName && (
                      <>
                        <span>·</span>
                        <span>Assigned to: {c.assignedWorkerName} ({c.assignedWorkerDepartment})</span>
                      </>
                    )}
                    {c.status === 'RESOLVED' && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold underline">
                          Resolved! Click to confirm & rate
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${getStatusBadgeClass(c.status)}`}>
                    {c.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
