import React, { useState, useEffect } from 'react';
import { User, Complaint, Worker, Incident, Notice, AnalyticsData, MLEvaluation, Role, Category } from './types';
import {
  loginUser,
  getComplaints,
  getWorkers,
  getIncidents,
  getNotices,
  getAnalytics,
  getMLEvaluationData,
  createComplaint,
  updateComplaintStatus,
  assignWorkerToComplaint,
  resolveComplaint as apiResolveComplaint,
  submitStudentFeedback,
  reopenComplaint as apiReopenComplaint,
  linkComplaintToIncident,
  createIncident as apiCreateIncident,
  createNotice as apiCreateNotice
} from './lib/api';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentPortal/StudentDashboard';
import { ComplaintFormModal } from './components/StudentPortal/ComplaintFormModal';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { AssignWorkerModal } from './components/AdminPortal/AssignWorkerModal';
import { DuplicateInspectorModal } from './components/AdminPortal/DuplicateInspectorModal';
import { IncidentsView } from './components/AdminPortal/IncidentsView';
import { AnalyticsView } from './components/AdminPortal/AnalyticsView';
import { WorkerDashboard } from './components/WorkerPortal/WorkerDashboard';
import { MLEvaluationView } from './components/MLEvaluationPortal/MLEvaluationView';
import { NoticesView } from './components/NoticesView';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { Bell, CheckCircle2, AlertTriangle, Sparkles, Mic } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-student-1',
    name: 'Ashish Dubey',
    email: 'ashish@hostel.edu',
    role: 'student',
    studentId: 'MCA-2024-042',
    hostel: 'Hostel 4 (Aryabhatta)',
    block: 'B',
    room: '304',
    createdAt: new Date().toISOString()
  });

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [mlEvaluation, setMlEvaluation] = useState<MLEvaluation | null>(null);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [voicePrefillData, setVoicePrefillData] = useState<any>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [assignTarget, setAssignTarget] = useState<Complaint | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<Complaint | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial datasets
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cmps, wrks, incs, nots, anls, mlev] = await Promise.all([
        getComplaints(),
        getWorkers(),
        getIncidents(),
        getNotices(),
        getAnalytics(),
        getMLEvaluationData()
      ]);
      setComplaints(cmps);
      setWorkers(wrks);
      setIncidents(incs);
      setNotices(nots);
      setAnalytics(anls);
      setMlEvaluation(mlev);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick switch role
  const handleSwitchUserRole = async (role: Role) => {
    try {
      const user = await loginUser(undefined, role);
      setCurrentUser(user);
      setActiveTab('dashboard');
      showToast(`Switched view to ${user.name} (${role.toUpperCase()})`);
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers
  const handleCreateComplaint = async (data: any) => {
    const newComplaint = await createComplaint(data);
    setComplaints((prev) => [newComplaint, ...prev]);
    showToast(`Complaint #${newComplaint.id} submitted! AI classified as ${newComplaint.category}.`);
    // Refresh analytics
    const anls = await getAnalytics();
    setAnalytics(anls);
  };

  const handleAssignWorker = async (complaintId: string, workerId: string) => {
    const updated = await assignWorkerToComplaint(complaintId, workerId, currentUser.name);
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedComplaint?.id === updated.id) {
      setSelectedComplaint(updated);
    }
    showToast(`Ticket #${updated.id} assigned to ${updated.assignedWorkerName}!`);
  };

  const handleUpdateStatus = async (complaintId: string, status: any, note?: string) => {
    const updated = await updateComplaintStatus(complaintId, status, currentUser.name, currentUser.role, note);
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedComplaint?.id === updated.id) {
      setSelectedComplaint(updated);
    }
    showToast(`Status updated to ${status}`);
  };

  const handleResolve = async (complaintId: string, notes: string, proofUrl?: string) => {
    const updated = await apiResolveComplaint(complaintId, currentUser.id, currentUser.name, notes, proofUrl);
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedComplaint?.id === updated.id) {
      setSelectedComplaint(updated);
    }
    showToast(`Task marked as RESOLVED. Student notified for rating.`);
    const anls = await getAnalytics();
    setAnalytics(anls);
  };

  const handleFeedback = async (complaintId: string, rating: number, comment: string) => {
    const updated = await submitStudentFeedback(complaintId, rating, comment, currentUser.name);
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedComplaint?.id === updated.id) {
      setSelectedComplaint(updated);
    }
    showToast(`Thank you! Ticket #${updated.id} verified and closed.`);
    const anls = await getAnalytics();
    setAnalytics(anls);
  };

  const handleReopen = async (complaintId: string, reason: string) => {
    const updated = await apiReopenComplaint(complaintId, reason, currentUser.name);
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedComplaint?.id === updated.id) {
      setSelectedComplaint(updated);
    }
    showToast(`Complaint reopened with urgent priority escalation.`);
    const anls = await getAnalytics();
    setAnalytics(anls);
  };

  const handleLinkIncident = async (complaintId: string, incidentId: string) => {
    const res = await linkComplaintToIncident(complaintId, incidentId);
    setComplaints((prev) => prev.map((c) => (c.id === res.complaint.id ? res.complaint : c)));
    setIncidents((prev) => prev.map((i) => (i.id === res.incident.id ? res.incident : i)));
    if (selectedComplaint?.id === res.complaint.id) {
      setSelectedComplaint(res.complaint);
    }
    showToast(`Linked ticket to incident #${res.incident.id}`);
  };

  const handleCreateIncident = async (data: {
    title: string;
    category: Category;
    block: string;
    description: string;
  }) => {
    const inc = await apiCreateIncident(data);
    setIncidents((prev) => [inc, ...prev]);
    showToast(`Master incident ${inc.id} declared.`);
  };

  const handleCreateNotice = async (data: {
    title: string;
    body: string;
    priority: 'normal' | 'urgent';
    audience: string;
  }) => {
    const not = await apiCreateNotice(data);
    setNotices((prev) => [not, ...prev]);
    showToast(`Notice broadcasted across campus.`);
  };

  const urgentNotices = notices.filter((n) => n.priority === 'urgent');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Urgent Notice Banner if any */}
      {urgentNotices.length > 0 && activeTab !== 'notices' && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Notice: {urgentNotices[0].title}</span>
          <button
            onClick={() => setActiveTab('notices')}
            className="underline text-white font-bold ml-1 hover:text-amber-100"
          >
            Read Notice
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUserRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        urgentNoticesCount={urgentNotices.length}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="p-20 text-center text-slate-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
            Initializing HostelIQ Predictive Platform...
          </div>
        ) : (
          <>
            {/* View Switching */}
            {activeTab === 'dashboard' && (
              <>
                {currentUser.role === 'student' && (
                  <StudentDashboard
                    currentUser={currentUser}
                    complaints={complaints.filter((c) => c.userId === currentUser.id)}
                    onOpenNewComplaint={() => {
                      setVoicePrefillData(null);
                      setIsNewComplaintOpen(true);
                    }}
                    onSelectComplaint={(c) => setSelectedComplaint(c)}
                  />
                )}

                {currentUser.role === 'admin' && (
                  <AdminDashboard
                    complaints={complaints}
                    workers={workers}
                    incidents={incidents}
                    onSelectComplaint={(c) => setSelectedComplaint(c)}
                    onOpenAssign={(c) => setAssignTarget(c)}
                    onOpenDuplicateInspector={(c) => setDuplicateTarget(c)}
                  />
                )}

                {currentUser.role === 'worker' && (
                  <WorkerDashboard
                    currentUser={currentUser}
                    complaints={complaints}
                    onSelectComplaint={(c) => setSelectedComplaint(c)}
                    onStartWork={(id) => handleUpdateStatus(id, 'IN_PROGRESS', 'Technician arrived on-site')}
                    onOpenResolveModal={(c) => setSelectedComplaint(c)}
                  />
                )}
              </>
            )}

            {activeTab === 'incidents' && (
              <IncidentsView
                incidents={incidents}
                complaints={complaints}
                onCreateIncident={handleCreateIncident}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
              />
            )}

            {activeTab === 'analytics' && analytics && <AnalyticsView analytics={analytics} />}

            {activeTab === 'notices' && (
              <NoticesView
                notices={notices}
                currentUser={currentUser}
                onCreateNotice={handleCreateNotice}
              />
            )}

            {activeTab === 'ml-eval' && <MLEvaluationView evaluation={mlEvaluation} />}
          </>
        )}
      </main>

      {/* Floating Voice Assistant Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsVoiceAssistantOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-105 ring-4 ring-indigo-600/20"
          title="Open HostelIQ Live Voice Assistant"
        >
          <div className="relative">
            <Mic className="w-5 h-5 text-amber-300" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold leading-none">Voice Assistant</div>
            <div className="text-[10px] text-indigo-200 font-mono">gemini-3.8-live</div>
          </div>
        </button>
      </div>

      {/* MODALS */}

      {/* Interactive Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        currentUser={currentUser}
        onAutoFillComplaint={(data) => {
          setVoicePrefillData(data);
          setIsNewComplaintOpen(true);
        }}
      />

      {/* Student New Complaint Modal */}
      <ComplaintFormModal
        currentUser={currentUser}
        isOpen={isNewComplaintOpen}
        onClose={() => {
          setIsNewComplaintOpen(false);
          setVoicePrefillData(null);
        }}
        onSubmit={handleCreateComplaint}
        prefillData={voicePrefillData}
      />

      {/* Detailed Lifecycle Inspection Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          currentUser={currentUser}
          workers={workers}
          incidents={incidents}
          onClose={() => setSelectedComplaint(null)}
          onAssignWorker={handleAssignWorker}
          onUpdateStatus={handleUpdateStatus}
          onResolve={handleResolve}
          onSubmitFeedback={handleFeedback}
          onReopen={handleReopen}
          onLinkIncident={handleLinkIncident}
        />
      )}

      {/* Admin Fast Assign Worker Modal */}
      {assignTarget && (
        <AssignWorkerModal
          complaint={assignTarget}
          workers={workers}
          isOpen={true}
          onClose={() => setAssignTarget(null)}
          onAssign={handleAssignWorker}
        />
      )}

      {/* Duplicate Inspector Modal */}
      {duplicateTarget && (
        <DuplicateInspectorModal
          complaint={duplicateTarget}
          allComplaints={complaints}
          incidents={incidents}
          isOpen={true}
          onClose={() => setDuplicateTarget(null)}
          onLinkToIncident={handleLinkIncident}
          onCreateIncidentAndLink={async (title, cat, blk, desc, ids) => {
            const inc = await apiCreateIncident({
              title,
              category: cat,
              block: blk,
              description: desc,
              relatedComplaintIds: ids
            });
            setIncidents((prev) => [inc, ...prev]);
            showToast(`Master incident ${inc.id} created and linked.`);
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong>HostelIQ</strong> · AI-Powered Predictive Hostel Operations & Student Experience Platform
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/api/download-source"
              download="hosteliq-source-code.zip"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition-colors border border-slate-200 shadow-xs"
            >
              <span>Download Full Source Code (.ZIP)</span>
            </a>
            <span className="text-slate-400">
              MCA Major Project · From complaints to intelligent action.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
