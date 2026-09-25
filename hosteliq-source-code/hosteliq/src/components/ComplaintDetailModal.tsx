import React, { useState, useRef } from 'react';
import { Complaint, User, Worker, Incident } from '../types';
import { startBrowserSpeechRecognition } from '../lib/audioUtils';
import {
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Shield,
  Wrench,
  Star,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Send,
  AlertTriangle,
  Mic,
  MicOff
} from 'lucide-react';

interface ComplaintDetailModalProps {
  complaint: Complaint;
  currentUser: User;
  workers: Worker[];
  incidents: Incident[];
  onClose: () => void;
  onAssignWorker: (complaintId: string, workerId: string) => Promise<void>;
  onUpdateStatus: (complaintId: string, status: any, note?: string) => Promise<void>;
  onResolve: (complaintId: string, notes: string, proofUrl?: string) => Promise<void>;
  onSubmitFeedback: (complaintId: string, rating: number, comment: string) => Promise<void>;
  onReopen: (complaintId: string, reason: string) => Promise<void>;
  onLinkIncident: (complaintId: string, incidentId: string) => Promise<void>;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  currentUser,
  workers,
  incidents,
  onClose,
  onAssignWorker,
  onUpdateStatus,
  onResolve,
  onSubmitFeedback,
  onReopen,
  onLinkIncident
}) => {
  // Local state for actions
  const [selectedWorkerId, setSelectedWorkerId] = useState(complaint.assignedWorkerId || '');
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveProofUrl, setResolveProofUrl] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenInput, setShowReopenInput] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDictatingNotes, setIsDictatingNotes] = useState(false);
  const notesRecRef = useRef<{ stop: () => void } | null>(null);

  const toggleNotesDictation = () => {
    if (isDictatingNotes) {
      notesRecRef.current?.stop();
      setIsDictatingNotes(false);
      return;
    }

    setIsDictatingNotes(true);
    const rec = startBrowserSpeechRecognition(
      (text) => {
        setResolveNotes(text);
      },
      (err) => {
        console.warn('Notes speech err', err);
        setIsDictatingNotes(false);
      },
      () => {
        setIsDictatingNotes(false);
      }
    );
    notesRecRef.current = rec;
  };

  const isStudent = currentUser.role === 'student';
  const isAdmin = currentUser.role === 'admin';
  const isWorker = currentUser.role === 'worker';

  const handleAssign = async () => {
    if (!selectedWorkerId) return;
    setIsProcessing(true);
    await onAssignWorker(complaint.id, selectedWorkerId);
    setIsProcessing(false);
  };

  const handleStartWork = async () => {
    setIsProcessing(true);
    await onUpdateStatus(complaint.id, 'IN_PROGRESS', 'Technician arrived on-site and initiated repair work.');
    setIsProcessing(false);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveNotes.trim()) return;
    setIsProcessing(true);
    await onResolve(complaint.id, resolveNotes.trim(), resolveProofUrl.trim() || undefined);
    setIsProcessing(false);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await onSubmitFeedback(complaint.id, feedbackRating, feedbackComment.trim());
    setIsProcessing(false);
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    setIsProcessing(true);
    await onReopen(complaint.id, reopenReason.trim());
    setIsProcessing(false);
    setShowReopenInput(false);
  };

  const handleLinkToIncident = async () => {
    if (!selectedIncidentId) return;
    setIsProcessing(true);
    await onLinkIncident(complaint.id, selectedIncidentId);
    setIsProcessing(false);
  };

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
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-mono font-medium text-slate-900">{complaint.id}</span>
              <span>·</span>
              <span>{complaint.hostel}</span>
              <span>·</span>
              <span>Block {complaint.block}, Rm {complaint.room}</span>
              <span>·</span>
              <span>Logged by {complaint.studentName} ({complaint.studentId})</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{complaint.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(complaint.status)}`}>
              {complaint.status}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Column: Details, Description, Actions */}
          <div className="md:col-span-2 space-y-5">
            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</h3>
              <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {complaint.description}
              </p>
            </div>

            {/* Media Attachment if present */}
            {complaint.mediaUrl && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Student Photo</h3>
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-56">
                  <img
                    src={complaint.mediaUrl}
                    alt="Issue proof"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Resolution Section if Resolved or Closed */}
            {complaint.resolution && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Resolution Work Complete
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    {new Date(complaint.resolution.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-emerald-950 font-medium">{complaint.resolution.notes}</p>
                <div className="text-[11px] text-emerald-800">
                  Resolved by: <strong>{complaint.resolution.workerName}</strong>
                </div>
                {complaint.resolution.proofUrl && (
                  <div className="mt-2">
                    <span className="text-[11px] font-semibold text-emerald-900 block mb-1">Technician Repair Photo:</span>
                    <img
                      src={complaint.resolution.proofUrl}
                      alt="Resolution Proof"
                      className="rounded-lg h-32 w-auto object-cover border border-emerald-300"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Student Feedback Section */}
            {complaint.feedback && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-slate-800 block mb-1">Student Satisfaction Rating</span>
                <div className="flex items-center gap-1 text-amber-500 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < complaint.feedback!.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-1.5">{complaint.feedback.rating} / 5</span>
                </div>
                {complaint.feedback.comment && (
                  <p className="text-xs text-slate-600 italic">"{complaint.feedback.comment}"</p>
                )}
              </div>
            )}

            {/* ACTION PANELS BASED ON STATUS & ROLE */}

            {/* 1. Admin Assign Worker Action */}
            {isAdmin && complaint.status !== 'CLOSED' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  Assign Maintenance Technician
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl flex-1 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Technician...</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.department}) · {w.activeTasksCount} active tasks
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedWorkerId || isProcessing}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    {complaint.status === 'ASSIGNED' ? 'Reassign' : 'Assign'}
                  </button>
                </div>
              </div>
            )}

            {/* 2. Worker Actions (Start Work, Resolve) */}
            {isWorker && complaint.status === 'ASSIGNED' && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-900">Task Assigned to You</div>
                  <div className="text-[11px] text-purple-700">Acknowledge task and mark work initiated on-site.</div>
                </div>
                <button
                  onClick={handleStartWork}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Start Work (On-Site)
                </button>
              </div>
            )}

            {isWorker && (complaint.status === 'IN_PROGRESS' || complaint.status === 'ASSIGNED') && (
              <form onSubmit={handleResolveSubmit} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-emerald-700" />
                  Submit Resolution Notes & Complete Task
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-emerald-900">Work Carried Out</label>
                    <button
                      type="button"
                      onClick={toggleNotesDictation}
                      className={`text-[11px] flex items-center gap-1 font-medium transition-colors ${
                        isDictatingNotes ? 'text-rose-600 font-bold' : 'text-emerald-800 hover:text-emerald-950'
                      }`}
                    >
                      <Mic className="w-3 h-3" />
                      {isDictatingNotes ? 'Listening...' : 'Voice Dictate Notes'}
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Describe what was repaired or replaced..."
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-900 mb-1">Proof Photo URL (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={resolveProofUrl}
                      onChange={(e) => setResolveProofUrl(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-white border border-emerald-300 rounded-xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setResolveProofUrl('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80')}
                      className="text-[11px] px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg shrink-0"
                    >
                      Sample Proof
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !resolveNotes.trim()}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Mark Task as RESOLVED
                </button>
              </form>
            )}

            {/* 3. Student Feedback Form (when Resolved) */}
            {isStudent && complaint.status === 'RESOLVED' && (
              <form onSubmit={handleFeedbackSubmit} className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                  Technician Finished! Please Rate Service Quality to Close Ticket
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-900 font-semibold">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= feedbackRating ? 'text-amber-500 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder="Share a quick comment about the service..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-amber-300 rounded-xl focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Confirm & Close Ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReopenInput(!showReopenInput)}
                    className="px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                  >
                    Not Fixed? Reopen
                  </button>
                </div>
              </form>
            )}

            {/* Student Reopen Box */}
            {showReopenInput && (
              <form onSubmit={handleReopenSubmit} className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-rose-900 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Reopen Unresolved Complaint
                </div>
                <textarea
                  rows={2}
                  placeholder="Explain why the problem is still unresolved..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-rose-300 rounded-xl focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl"
                >
                  Submit Reopen Request
                </button>
              </form>
            )}

            {/* Audit Timeline */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Lifecycle & Audit Trail
              </h3>
              <div className="border-l-2 border-slate-200 pl-4 space-y-3">
                {complaint.timeline.map((evt) => (
                  <div key={evt.id} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">{evt.action}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      By: <span className="font-medium text-slate-700">{evt.actor}</span> ({evt.actorRole})
                    </div>
                    {evt.note && <div className="text-xs text-slate-600 mt-0.5 italic">{evt.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Enrichment & Intelligence Card */}
          <div className="space-y-4">
            {/* AI Intelligence Card */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  HostelIQ AI Intelligence
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                  ML Enriched
                </span>
              </div>

              {/* Priority Score */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Explainable Priority</span>
                  <span className="font-bold text-slate-900">
                    {complaint.aiEnrichment.priorityScore} / 100 ({complaint.aiEnrichment.severity.toUpperCase()})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      complaint.aiEnrichment.priorityScore >= 75
                        ? 'bg-rose-500'
                        : complaint.aiEnrichment.priorityScore >= 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${complaint.aiEnrichment.priorityScore}%` }}
                  />
                </div>
              </div>

              {/* Priority Factor Breakdown */}
              {complaint.aiEnrichment.prioritySignals.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1">Scoring Factors:</span>
                  <ul className="space-y-1">
                    {complaint.aiEnrichment.prioritySignals.map((sig, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="text-indigo-600 shrink-0">•</span>
                        <span>{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SLA & Time Prediction */}
              <div className="pt-2 border-t border-indigo-100/60">
                <div className="text-[11px] text-slate-500">Predicted Resolution Time:</div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  ~{complaint.aiEnrichment.predictedResolutionMinutes} Minutes
                </div>
              </div>

              {/* Suggested Action */}
              {complaint.aiEnrichment.suggestedAction && (
                <div className="pt-2 border-t border-indigo-100/60">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Recommended Triage Action:
                  </span>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    {complaint.aiEnrichment.suggestedAction}
                  </p>
                </div>
              )}

              {/* Tools required for technician */}
              {complaint.aiEnrichment.toolsRequired && complaint.aiEnrichment.toolsRequired.length > 0 && (
                <div className="pt-2 border-t border-indigo-100/60">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Technician Dispatch Kit:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {complaint.aiEnrichment.toolsRequired.map((tool, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-white border border-indigo-200 text-indigo-900 rounded-md"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Possible Duplicates Inspection */}
            {complaint.aiEnrichment.possibleDuplicates.length > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Semantic Duplicates Detected
                </span>
                <p className="text-[11px] text-amber-800">
                  {complaint.aiEnrichment.possibleDuplicates.length} related complaint(s) share high cosine similarity.
                </p>
                <div className="space-y-1.5">
                  {complaint.aiEnrichment.possibleDuplicates.map((dup) => (
                    <div
                      key={dup.complaintId}
                      className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] text-slate-700"
                    >
                      <div className="font-semibold text-slate-900">{dup.title}</div>
                      <div className="text-slate-500">
                        Rm {dup.room}, Block {dup.block} · {Math.round(dup.similarityScore * 100)}% match
                      </div>
                    </div>
                  ))}
                </div>

                {isAdmin && incidents.length > 0 && (
                  <div className="pt-2 border-t border-amber-200">
                    <label className="block text-[10px] font-bold text-amber-950 mb-1">
                      Link to Master Incident
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        value={selectedIncidentId}
                        onChange={(e) => setSelectedIncidentId(e.target.value)}
                        className="text-[11px] px-2 py-1 bg-white border border-amber-300 rounded-lg flex-1"
                      >
                        <option value="">Choose Incident...</option>
                        {incidents.map((inc) => (
                          <option key={inc.id} value={inc.id}>
                            {inc.title} (Block {inc.block})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleLinkToIncident}
                        disabled={!selectedIncidentId || isProcessing}
                        className="text-[11px] px-2.5 py-1 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
                      >
                        Link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
