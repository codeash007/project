export type Role = 'student' | 'admin' | 'worker';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string;
  hostel: string;
  block: string;
  room: string;
  createdAt: string;
}

export type ComplaintStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type Category =
  | 'AC'
  | 'Plumbing'
  | 'WiFi'
  | 'Electricity'
  | 'Carpentry'
  | 'Cleaning'
  | 'General';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface DuplicateMatch {
  complaintId: string;
  title: string;
  similarityScore: number;
  room: string;
  block: string;
  status: ComplaintStatus;
  reason: string;
  createdAt: string;
}

export interface AIEnrichment {
  aiCategory: Category;
  aiConfidence: number; // 0.00 - 1.00
  severity: Severity;
  priorityScore: number; // 0 - 100
  prioritySignals: string[];
  predictedResolutionMinutes: number;
  possibleDuplicates: DuplicateMatch[];
  suggestedAction?: string;
  toolsRequired?: string[];
  reasoningSummary?: string;
}

export interface TimelineEvent {
  id: string;
  status: ComplaintStatus;
  action: string;
  actor: string;
  actorRole: Role;
  timestamp: string;
  note?: string;
}

export interface Complaint {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  studentId: string;
  title: string;
  description: string;
  category: Category;
  hostel: string;
  block: string;
  room: string;
  mediaUrl?: string;
  status: ComplaintStatus;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  assignedWorkerDepartment?: string;
  aiEnrichment: AIEnrichment;
  resolution?: {
    notes: string;
    proofUrl?: string;
    resolvedAt: string;
    workerId: string;
    workerName: string;
  };
  feedback?: {
    rating: number; // 1-5
    comment: string;
    createdAt: string;
  };
  incidentId?: string;
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface Worker {
  id: string;
  name: string;
  department: string;
  phone: string;
  active: boolean;
  activeTasksCount: number;
}

export interface Incident {
  id: string;
  title: string;
  category: Category;
  block: string;
  relatedComplaintIds: string[];
  status: 'INVESTIGATING' | 'IN_PROGRESS' | 'RESOLVED';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  priority: 'normal' | 'urgent';
  audience: string;
  publishedAt: string;
  expiresAt?: string;
}

export interface AnalyticsData {
  openComplaints: number;
  criticalQueue: number;
  avgResolutionHours: number;
  reopenRate: number;
  totalComplaints: number;
  resolvedCount: number;
  categoryDistribution: Record<string, number>;
  blockHotspots: Array<{ block: string; count: number; highPriorityCount: number }>;
  recurringIssues: Array<{
    pattern: string;
    count: number;
    affectedRooms: string[];
    risk: 'HIGH' | 'MEDIUM';
    suggestion: string;
  }>;
}

export interface MLEvaluation {
  modelCard: {
    name: string;
    version: string;
    datasetSize: number;
    baselineClassifier: string;
    improvedClassifier: string;
    baselineAccuracy: number;
    improvedAccuracy: number;
    f1Score: number;
    resolutionMAE: number;
    resolutionRMSE: number;
    resolutionR2: number;
    duplicatePrecisionAt3: number;
  };
  classificationMetrics: Array<{
    category: string;
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }>;
  confusionMatrix: {
    labels: string[];
    matrix: number[][];
  };
  comparisonTable: Array<{
    task: string;
    baselineModel: string;
    improvedModel: string;
    primaryMetric: string;
    baselineScore: number;
    improvedScore: number;
    delta: string;
  }>;
  datasetSamples: Array<{
    id: number;
    text: string;
    category: string;
    severity: string;
    block: string;
    room: string;
    resolution_minutes: number;
  }>;
}
