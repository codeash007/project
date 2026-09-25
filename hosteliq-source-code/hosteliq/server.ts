import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import {
  users,
  workers,
  notices,
  incidents,
  complaints,
  createComplaintRecord,
  computeAnalytics,
  getMLEvaluation
} from './server/dataStore';
import {
  classifyComplaintText,
  calculateSeverityAndPriority,
  predictResolutionTime,
  findPotentialDuplicates
} from './server/mlEngine';
import { ComplaintStatus, Category, Role } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Setup WebSocket server for Gemini Live API
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[HostelIQ Live] Client connected to Voice WebSocket');

  if (!process.env.GEMINI_API_KEY) {
    clientWs.send(JSON.stringify({
      type: 'warning',
      message: 'GEMINI_API_KEY is not configured. Falling back to local smart assistant mode.'
    }));
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `You are the HostelIQ Voice Assistant for university students and hostel maintenance staff.
Hostel context:
- Hostels: Hostel 4 (Aryabhatta), Blocks A, B, and C.
- Key categories: AC, Plumbing, WiFi, Electricity, Carpentry, Cleaning.
- You can help students file complaints (ask for title, room, block, symptom), explain ticket priorities, or answer questions.
- Keep your spoken responses friendly, reassuring, concise (1-3 sentences), and natural.`,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({
                  type: 'audio',
                  audio: part.inlineData.data
                }));
              }
              if (part.text) {
                clientWs.send(JSON.stringify({
                  type: 'text',
                  text: part.text
                }));
              }
            }
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }
        },
        onclose: () => {
          console.log('[HostelIQ Live] Gemini Live session closed');
        },
        onerror: (err) => {
          console.error('[HostelIQ Live] Session error:', err);
          clientWs.send(JSON.stringify({ type: 'error', message: err.message || 'Live session error' }));
        }
      },
    });

    clientWs.on('message', (rawData: any) => {
      try {
        const msg = JSON.parse(rawData.toString());
        if (msg.audio) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (msg.text) {
          session.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: msg.text }]
              }
            ],
            turnComplete: true
          });
        }
      } catch (err) {
        console.error('[HostelIQ Live] Failed to forward client message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('[HostelIQ Live] Client disconnected');
    });
  } catch (err: any) {
    console.error('[HostelIQ Live] Connection failed:', err);
    clientWs.send(JSON.stringify({
      type: 'error',
      message: err.message || 'Could not connect to Gemini Live'
    }));
  }
});

// Request logging
app.use((req, res, next) => {
  if (!req.path.startsWith('/@') && !req.path.includes('.')) {
    console.log(`[HostelIQ API] ${req.method} ${req.path}`);
  }
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'HostelIQ AI Platform',
    version: '1.2.0',
    timestamp: new Date().toISOString()
  });
});

// Download source code archive
app.get('/api/download-source', (req: Request, res: Response) => {
  const zipPath = path.join(__dirname, 'public', 'hosteliq-source-code.zip');
  res.download(zipPath, 'hosteliq-source-code.zip');
});

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, role } = req.body;

  let user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user && role) {
    user = users.find((u) => u.role === role);
  }

  if (!user) {
    // Default to student 1
    user = users[0];
  }

  res.json({ success: true, user });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, role, studentId, hostel, block, room } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.json({ success: true, user: existing });
    return;
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    role: (role as Role) || 'student',
    studentId: studentId || `MCA-${Math.floor(1000 + Math.random() * 9000)}`,
    hostel: hostel || 'Hostel 4 (Aryabhatta)',
    block: block || 'B',
    room: room || '304',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  res.json({ success: true, user: newUser });
});

// --- COMPLAINTS ENDPOINTS ---
app.get('/api/complaints', (req: Request, res: Response) => {
  const { role, userId, status, category, block } = req.query;

  let list = [...complaints];

  if (role === 'student' && userId) {
    list = list.filter((c) => c.userId === userId);
  } else if (role === 'worker' && userId) {
    list = list.filter((c) => c.assignedWorkerId === userId);
  }

  if (status) {
    list = list.filter((c) => c.status === status);
  }

  if (category) {
    list = list.filter((c) => c.category === category);
  }

  if (block) {
    list = list.filter((c) => c.block.toLowerCase() === String(block).toLowerCase());
  }

  res.json({ success: true, complaints: list });
});

app.get('/api/complaints/:id', (req: Request, res: Response) => {
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found' });
    return;
  }
  res.json({ success: true, complaint });
});

app.post('/api/complaints', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      studentName,
      studentEmail,
      studentId,
      title,
      description,
      category,
      hostel,
      block,
      room,
      mediaUrl
    } = req.body;

    if (!title || !description || !block || !room) {
      res.status(400).json({ error: 'Title, description, block, and room are required.' });
      return;
    }

    const complaint = await createComplaintRecord({
      userId: userId || 'usr-student-1',
      studentName: studentName || 'Ashish Dubey',
      studentEmail: studentEmail || 'ashish@hostel.edu',
      studentId: studentId || 'MCA-2024-042',
      title,
      description,
      category,
      hostel: hostel || 'Hostel 4 (Aryabhatta)',
      block,
      room,
      mediaUrl
    });

    res.status(201).json({ success: true, complaint });
  } catch (err: any) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Update complaint status
app.patch('/api/complaints/:id/status', (req: Request, res: Response) => {
  const { status, actorName, actorRole, note } = req.body;
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found' });
    return;
  }

  const validStatuses: ComplaintStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  complaint.status = status;
  complaint.updatedAt = new Date().toISOString();
  complaint.timeline.push({
    id: `t-${Date.now()}`,
    status,
    action: `Status changed to ${status}`,
    actor: actorName || 'System',
    actorRole: actorRole || 'admin',
    timestamp: new Date().toISOString(),
    note
  });

  res.json({ success: true, complaint });
});

// Assign worker
app.post('/api/complaints/:id/assign', (req: Request, res: Response) => {
  const { workerId, adminName } = req.body;
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found' });
    return;
  }

  const worker = workers.find((w) => w.id === workerId);
  if (!worker) {
    res.status(404).json({ error: 'Worker not found' });
    return;
  }

  complaint.assignedWorkerId = worker.id;
  complaint.assignedWorkerName = worker.name;
  complaint.assignedWorkerDepartment = worker.department;
  complaint.status = 'ASSIGNED';
  complaint.updatedAt = new Date().toISOString();

  // Increment worker task count
  worker.activeTasksCount = (worker.activeTasksCount || 0) + 1;

  complaint.timeline.push({
    id: `t-${Date.now()}`,
    status: 'ASSIGNED',
    action: `Assigned to ${worker.name} (${worker.department})`,
    actor: adminName || 'Hostel Admin',
    actorRole: 'admin',
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, complaint });
});

// Worker marks resolved
app.post('/api/complaints/:id/resolve', (req: Request, res: Response) => {
  const { workerId, workerName, notes, proofUrl } = req.body;
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found' });
    return;
  }

  complaint.status = 'RESOLVED';
  complaint.updatedAt = new Date().toISOString();
  complaint.resolution = {
    notes: notes || 'Resolved according to maintenance protocol.',
    proofUrl,
    resolvedAt: new Date().toISOString(),
    workerId: workerId || 'wrk-1',
    workerName: workerName || 'Assigned Technician'
  };

  const worker = workers.find((w) => w.id === workerId);
  if (worker && worker.activeTasksCount > 0) {
    worker.activeTasksCount -= 1;
  }

  complaint.timeline.push({
    id: `t-${Date.now()}`,
    status: 'RESOLVED',
    action: 'Resolution completed by technician',
    actor: workerName || 'Worker',
    actorRole: 'worker',
    timestamp: new Date().toISOString(),
    note: notes
  });

  res.json({ success: true, complaint });
});

// Student provides rating & feedback
app.post('/api/complaints/:id/feedback', (req: Request, res: Response) => {
  const { rating, comment, studentName } = req.body;
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found' });
    return;
  }

  complaint.feedback = {
    rating: Number(rating) || 5,
    comment: comment || '',
    createdAt: new Date().toISOString()
  };
  complaint.status = 'CLOSED';
  complaint.updatedAt = new Date().toISOString();

  complaint.timeline.push({
    id: `t-${Date.now()}`,
    status: 'CLOSED',
    action: `Student rated ${rating} Stars & Closed Ticket`,
    actor: studentName || complaint.studentName,
    actorRole: 'student',
    timestamp: new Date().toISOString(),
    note: comment
  });

  res.json({ success: true, complaint });
});

// Student reopens complaint
app.post('/api/complaints/:id/reopen', (req: Request, res: Response) => {
  const { reason, studentName } = req.body;
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found' });
    return;
  }

  complaint.status = 'REOPENED';
  complaint.updatedAt = new Date().toISOString();
  // Boost priority on reopen
  complaint.aiEnrichment.priorityScore = Math.min(100, complaint.aiEnrichment.priorityScore + 18);
  complaint.aiEnrichment.prioritySignals.push('Ticket reopened by student: immediate re-audit escalated');

  complaint.timeline.push({
    id: `t-${Date.now()}`,
    status: 'REOPENED',
    action: 'Student Reopened Ticket',
    actor: studentName || complaint.studentName,
    actorRole: 'student',
    timestamp: new Date().toISOString(),
    note: reason || 'Issue was not completely resolved.'
  });

  res.json({ success: true, complaint });
});

// Link complaint to Incident
app.post('/api/complaints/:id/link-incident', (req: Request, res: Response) => {
  const { incidentId } = req.body;
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found' });
    return;
  }

  const incident = incidents.find((i) => i.id === incidentId);
  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  complaint.incidentId = incident.id;
  if (!incident.relatedComplaintIds.includes(complaint.id)) {
    incident.relatedComplaintIds.push(complaint.id);
  }

  complaint.timeline.push({
    id: `t-${Date.now()}`,
    status: complaint.status,
    action: `Linked to Master Incident: ${incident.title}`,
    actor: 'Hostel Admin',
    actorRole: 'admin',
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, complaint, incident });
});

// --- WORKERS ---
app.get('/api/workers', (req: Request, res: Response) => {
  res.json({ success: true, workers });
});

// --- INCIDENTS ---
app.get('/api/incidents', (req: Request, res: Response) => {
  res.json({ success: true, incidents });
});

app.post('/api/incidents', (req: Request, res: Response) => {
  const { title, category, block, description, relatedComplaintIds } = req.body;
  const newIncident = {
    id: `inc-${Date.now().toString().slice(-4)}`,
    title,
    category: category || 'Electricity',
    block: block || 'B',
    relatedComplaintIds: relatedComplaintIds || [],
    status: 'IN_PROGRESS' as const,
    description: description || 'Master incident aggregating related tickets.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  incidents.unshift(newIncident);
  res.json({ success: true, incident: newIncident });
});

// --- NOTICES ---
app.get('/api/notices', (req: Request, res: Response) => {
  res.json({ success: true, notices });
});

app.post('/api/notices', (req: Request, res: Response) => {
  const { title, body, priority, audience } = req.body;
  const notice = {
    id: `not-${Date.now()}`,
    title,
    body,
    priority: priority || 'normal',
    audience: audience || 'All Hostels',
    publishedAt: new Date().toISOString()
  };
  notices.unshift(notice);
  res.json({ success: true, notice });
});

// --- ANALYTICS ---
app.get('/api/analytics', (req: Request, res: Response) => {
  const data = computeAnalytics();
  res.json({ success: true, analytics: data });
});

// --- AI & ML ENDPOINTS (FR-08, Section 11 PRD) ---
app.post('/api/ai/classify', (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Text is required for classification' });
    return;
  }
  const result = classifyComplaintText(text);
  res.json({ success: true, ...result });
});

app.post('/api/ai/duplicate', (req: Request, res: Response) => {
  const { title, description, category, block, room } = req.body;
  const duplicates = findPotentialDuplicates(
    title || '',
    description || '',
    category || 'General',
    block || 'B',
    room || '101',
    complaints
  );
  res.json({ success: true, duplicates });
});

app.post('/api/ai/predict-resolution', (req: Request, res: Response) => {
  const { category, severity } = req.body;
  const minutes = predictResolutionTime(category || 'General', severity || 'medium');
  res.json({ success: true, predictedResolutionMinutes: minutes });
});

// Academic ML Evaluation Workbench (Section 17 & 22 PRD)
app.get('/api/ai/ml-evaluation', (req: Request, res: Response) => {
  const data = getMLEvaluation();
  res.json({ success: true, evaluation: data });
});

// Ad-hoc voice complaint extractor (PRD FR-02 Voice & AI-06)
app.post('/api/ai/voice-parse', async (req: Request, res: Response) => {
  const { spokenText } = req.body;
  if (!spokenText) {
    res.status(400).json({ error: 'spokenText is required' });
    return;
  }

  // Use Gemini if available, otherwise fast local regex & classification
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are the HostelIQ Voice Assistant. Extract structured complaint information from this spoken text:
"${spokenText}"

Return a JSON object with:
- "title": a concise complaint title (e.g. "Ceiling fan making spark noise")
- "description": full detailed complaint description based on what the student said
- "category": one of ["AC", "Plumbing", "WiFi", "Electricity", "Carpentry", "Cleaning", "General"]
- "room": room number mentioned or empty string if not mentioned
- "block": block letter mentioned or "B" by default
- "severity": "low" | "medium" | "high" | "critical"`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, ...parsed });
      return;
    } catch (e) {
      console.warn('Gemini voice parse fallback:', e);
    }
  }

  // Fallback local NLP parsing
  const classification = classifyComplaintText(spokenText);
  // Match room number like "room 304", "304", "rm 201"
  const roomMatch = spokenText.match(/room\s*(\d{2,4})|rm\s*(\d{2,4})|(\d{3})/i);
  const room = roomMatch ? (roomMatch[1] || roomMatch[2] || roomMatch[3]) : '304';
  const blockMatch = spokenText.match(/block\s*([a-c])/i);
  const block = blockMatch ? blockMatch[1].toUpperCase() : 'B';

  res.json({
    success: true,
    title: spokenText.slice(0, 50),
    description: spokenText,
    category: classification.predictedCategory,
    room,
    block,
    severity: classification.confidence > 0.8 ? 'high' : 'medium'
  });
});

// --- VITE DEV MIDDLEWARE OR STATIC SERVE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`HostelIQ Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
