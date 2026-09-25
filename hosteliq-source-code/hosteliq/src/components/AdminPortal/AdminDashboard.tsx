import React, { useState } from 'react';
import { Complaint, Worker, Incident } from '../../types';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  UserCheck,
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface AdminDashboardProps {
  complaints: Complaint[];
  workers: Worker[];
  incidents: Incident[];
  onSelectComplaint: (c: Complaint) => void;
  onOpenAssign: (c: Complaint) => void;
  onOpenDuplicateInspector: (c: Complaint) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  complaints,
  workers,
  incidents,
  onSelectComplaint,
  onOpenAssign,
  onOpenDuplicateInspector
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortByPriority, setSortByPriority] = useState(true);

  // KPIs
  const totalOpen = complaints.filter((c) => c.status !== 'CLOSED' && c.status !== 'RESOLVED').length;
  const criticalTickets = complaints.filter((c) => c.aiEnrichment.priorityScore >= 75 && c.status !== 'CLOSED');
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
  const duplicateAlerts = complaints.filter((c) => c.aiEnrichment.possibleDuplicates.length > 0 && c.status === 'OPEN');

  const filtered = complaints.filter((c) => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (selectedBlock !== 'ALL' && c.block.toUpperCase() !== selectedBlock) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.studentName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.room.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (sortByPriority) {
    filtered.sort((a, b) => b.aiEnrichment.priorityScore - a.aiEnrichment.priorityScore);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'ASSIGNED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'REOPENED':
        return 'bg-rose-50 text-rose-800 border-rose-200 font-semibold';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin KPI Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Pending Triage Queue</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalOpen}</div>
          <span className="text-[11px] text-slate-500">Unresolved tickets</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
          <span className="text-xs text-rose-700 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Critical Backlog (Priority &gt; 75)
          </span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{criticalTickets.length}</div>
          <span className="text-[11px] text-rose-600">Immediate action required</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/20">
          <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            Potential Duplicates
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{duplicateAlerts.length}</div>
          <span className="text-[11px] text-amber-700">Cluster candidate incidents</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Resolution Success</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{resolvedCount}</div>
          <span className="text-[11px] text-slate-500">Total verified fixes</span>
        </div>
      </div>

      {/* Critical Queue Callout if any */}
      {criticalTickets.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h2 className="text-sm font-bold text-rose-950">
                Critical Urgency Queue ({criticalTickets.length} Tickets)
              </h2>
            </div>
            <span className="text-[11px] text-rose-700 font-medium">Safety & High Impact Priority</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {criticalTickets.slice(0, 2).map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectComplaint(c)}
                className="p-3 bg-white rounded-xl border border-rose-200 cursor-pointer hover:border-rose-400 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono font-bold text-rose-900">{c.id}</span>
                  <span className="font-bold text-rose-600">Priority {c.aiEnrichment.priorityScore}/100</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 truncate">{c.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Block {c.block} · Rm {c.room} · Category: {c.category}
                </div>
                {c.aiEnrichment.prioritySignals.length > 0 && (
                  <div className="text-[10px] text-rose-700 mt-1 truncate">
                    Reason: {c.aiEnrichment.prioritySignals[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operational Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls & Filter bar */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Complaints Registry & Triage</h2>
              <p className="text-xs text-slate-500">
                Inspect AI priority ratings, assign technicians, and link duplicate incidents.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortByPriority(!sortByPriority)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                  sortByPriority
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort by AI Priority
              </button>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student, room, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg w-52 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500 font-medium">Filter by:</span>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="AC">AC</option>
              <option value="Plumbing">Plumbing</option>
              <option value="WiFi">WiFi</option>
              <option value="Electricity">Electricity</option>
              <option value="Carpentry">Carpentry</option>
              <option value="Cleaning">Cleaning</option>
            </select>

            {/* Block */}
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Blocks</option>
              <option value="A">Block A</option>
              <option value="B">Block B</option>
              <option value="C">Block C</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>

            <span className="text-slate-400 ml-auto">{filtered.length} matched tickets</span>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Student & Location</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">AI Priority & SLA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Worker</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  onClick={() => onSelectComplaint(c)}
                >
                  {/* Ticket */}
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-900">{c.id}</div>
                    <div className="text-slate-900 font-medium text-xs max-w-xs truncate">{c.title}</div>
                    {c.aiEnrichment.possibleDuplicates.length > 0 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDuplicateInspector(c);
                        }}
                        className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 hover:bg-amber-100"
                      >
                        <Layers className="w-3 h-3" />
                        Duplicate Alert ({c.aiEnrichment.possibleDuplicates.length})
                      </span>
                    )}
                  </td>

                  {/* Student & Location */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{c.studentName}</div>
                    <div className="text-slate-500">
                      Block {c.block} · Room {c.room}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">{c.category}</span>
                    <div className="text-[10px] text-slate-400">
                      Conf: {Math.round(c.aiEnrichment.aiConfidence * 100)}%
                    </div>
                  </td>

                  {/* AI Priority & SLA */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          c.aiEnrichment.priorityScore >= 75
                            ? 'bg-rose-500'
                            : c.aiEnrichment.priorityScore >= 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <span className="font-bold text-slate-900">
                        {c.aiEnrichment.priorityScore}/100
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">({c.aiEnrichment.severity})</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      ~{c.aiEnrichment.predictedResolutionMinutes}m SLA
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>

                  {/* Worker */}
                  <td className="py-3 px-4">
                    {c.assignedWorkerName ? (
                      <div>
                        <div className="font-semibold text-slate-800">{c.assignedWorkerName}</div>
                        <div className="text-[10px] text-slate-500">{c.assignedWorkerDepartment}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenAssign(c)}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                        {c.assignedWorkerName ? 'Reassign' : 'Assign'}
                      </button>
                      <button
                        onClick={() => onSelectComplaint(c)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                        title="View Full Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
