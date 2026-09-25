import {
  User,
  Complaint,
  Worker,
  Incident,
  Notice,
  AnalyticsData,
  MLEvaluation,
  ComplaintStatus,
  Category,
  Role,
  DuplicateMatch
} from '../types';

export async function loginUser(email?: string, role?: Role): Promise<User> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role })
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  return data.user;
}

export async function registerUser(payload: {
  name: string;
  email: string;
  role: Role;
  studentId?: string;
  hostel?: string;
  block: string;
  room: string;
}): Promise<User> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Registration failed');
  const data = await res.json();
  return data.user;
}

export async function getComplaints(params?: {
  role?: Role;
  userId?: string;
  status?: string;
  category?: string;
  block?: string;
}): Promise<Complaint[]> {
  const query = new URLSearchParams();
  if (params?.role) query.append('role', params.role);
  if (params?.userId) query.append('userId', params.userId);
  if (params?.status) query.append('status', params.status);
  if (params?.category) query.append('category', params.category);
  if (params?.block) query.append('block', params.block);

  const res = await fetch(`/api/complaints?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch complaints');
  const data = await res.json();
  return data.complaints;
}

export async function getComplaintById(id: string): Promise<Complaint> {
  const res = await fetch(`/api/complaints/${id}`);
  if (!res.ok) throw new Error('Failed to fetch complaint detail');
  const data = await res.json();
  return data.complaint;
}

export async function createComplaint(payload: {
  userId: string;
  studentName: string;
  studentEmail: string;
  studentId: string;
  title: string;
  description: string;
  category?: Category;
  hostel: string;
  block: string;
  room: string;
  mediaUrl?: string;
}): Promise<Complaint> {
  const res = await fetch('/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit complaint');
  }
  const data = await res.json();
  return data.complaint;
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  actorName: string,
  actorRole: Role,
  note?: string
): Promise<Complaint> {
  const res = await fetch(`/api/complaints/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, actorName, actorRole, note })
  });
  if (!res.ok) throw new Error('Failed to update status');
  const data = await res.json();
  return data.complaint;
}

export async function assignWorkerToComplaint(
  id: string,
  workerId: string,
  adminName: string
): Promise<Complaint> {
  const res = await fetch(`/api/complaints/${id}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workerId, adminName })
  });
  if (!res.ok) throw new Error('Failed to assign worker');
  const data = await res.json();
  return data.complaint;
}

export async function resolveComplaint(
  id: string,
  workerId: string,
  workerName: string,
  notes: string,
  proofUrl?: string
): Promise<Complaint> {
  const res = await fetch(`/api/complaints/${id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workerId, workerName, notes, proofUrl })
  });
  if (!res.ok) throw new Error('Failed to resolve complaint');
  const data = await res.json();
  return data.complaint;
}

export async function submitStudentFeedback(
  id: string,
  rating: number,
  comment: string,
  studentName: string
): Promise<Complaint> {
  const res = await fetch(`/api/complaints/${id}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, comment, studentName })
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  const data = await res.json();
  return data.complaint;
}

export async function reopenComplaint(
  id: string,
  reason: string,
  studentName: string
): Promise<Complaint> {
  const res = await fetch(`/api/complaints/${id}/reopen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, studentName })
  });
  if (!res.ok) throw new Error('Failed to reopen complaint');
  const data = await res.json();
  return data.complaint;
}

export async function linkComplaintToIncident(
  id: string,
  incidentId: string
): Promise<{ complaint: Complaint; incident: Incident }> {
  const res = await fetch(`/api/complaints/${id}/link-incident`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incidentId })
  });
  if (!res.ok) throw new Error('Failed to link incident');
  return res.json();
}

export async function getWorkers(): Promise<Worker[]> {
  const res = await fetch('/api/workers');
  if (!res.ok) throw new Error('Failed to fetch workers');
  const data = await res.json();
  return data.workers;
}

export async function getIncidents(): Promise<Incident[]> {
  const res = await fetch('/api/incidents');
  if (!res.ok) throw new Error('Failed to fetch incidents');
  const data = await res.json();
  return data.incidents;
}

export async function createIncident(payload: {
  title: string;
  category: Category;
  block: string;
  description: string;
  relatedComplaintIds?: string[];
}): Promise<Incident> {
  const res = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create incident');
  const data = await res.json();
  return data.incident;
}

export async function getNotices(): Promise<Notice[]> {
  const res = await fetch('/api/notices');
  if (!res.ok) throw new Error('Failed to fetch notices');
  const data = await res.json();
  return data.notices;
}

export async function createNotice(payload: {
  title: string;
  body: string;
  priority: 'normal' | 'urgent';
  audience: string;
}): Promise<Notice> {
  const res = await fetch('/api/notices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to post notice');
  const data = await res.json();
  return data.notice;
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const res = await fetch('/api/analytics');
  if (!res.ok) throw new Error('Failed to fetch analytics');
  const data = await res.json();
  return data.analytics;
}

export async function getMLEvaluationData(): Promise<MLEvaluation> {
  const res = await fetch('/api/ai/ml-evaluation');
  if (!res.ok) throw new Error('Failed to fetch ML evaluation data');
  const data = await res.json();
  return data.evaluation;
}

export async function testClassifyText(text: string): Promise<{
  predictedCategory: Category;
  confidence: number;
  scores: Record<Category, number>;
}> {
  const res = await fetch('/api/ai/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error('Classification failed');
  return res.json();
}

export async function testDuplicateDetection(payload: {
  title: string;
  description: string;
  category: Category;
  block: string;
  room: string;
}): Promise<DuplicateMatch[]> {
  const res = await fetch('/api/ai/duplicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Duplicate check failed');
  const data = await res.json();
  return data.duplicates;
}

export async function parseVoiceComplaint(spokenText: string): Promise<{
  title: string;
  description: string;
  category: Category;
  room: string;
  block: string;
  severity: string;
}> {
  const res = await fetch('/api/ai/voice-parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spokenText })
  });
  if (!res.ok) throw new Error('Failed to parse voice complaint');
  return res.json();
}

