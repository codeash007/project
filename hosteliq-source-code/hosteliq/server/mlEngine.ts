import { GoogleGenAI } from '@google/genai';
import { Category, DuplicateMatch, Severity, AIEnrichment, Complaint } from '../src/types';

// Category vocabulary and keyword weights for TF-IDF / Naive Bayes simulation
const CATEGORY_VOCAB: Record<Category, string[]> = {
  AC: [
    'ac', 'air', 'conditioner', 'cooling', 'compressor', 'filter', 'warm', 'blower',
    'remote', 'gas', 'thermostat', 'chilling', 'coil', 'dripping', 'hot'
  ],
  Plumbing: [
    'plumbing', 'water', 'tap', 'leak', 'leaking', 'pipe', 'drain', 'flush', 'toilet',
    'shower', 'sink', 'basin', 'geyser', 'overflow', 'sewage', 'clogged', 'tank', 'valve'
  ],
  WiFi: [
    'wifi', 'wi-fi', 'internet', 'network', 'router', 'connection', 'ping', 'packet',
    'slow', 'disconnecting', 'lan', 'ethernet', 'login', 'portal', 'signal', 'ssid', 'gateway'
  ],
  Electricity: [
    'electricity', 'power', 'light', 'fan', 'switch', 'socket', 'fuse', 'spark', 'shock',
    'wire', 'blackout', 'short', 'circuit', 'bulb', 'mcb', 'tripping', 'voltage', 'flicker'
  ],
  Carpentry: [
    'door', 'window', 'lock', 'key', 'bed', 'chair', 'table', 'hinge', 'handle', 'cupboard',
    'wardrobe', 'shelf', 'latch', 'wood', 'broken', 'drawer'
  ],
  Cleaning: [
    'cleaning', 'dust', 'garbage', 'trash', 'sweep', 'mop', 'dirty', 'smell', 'odor',
    'corridor', 'washroom', 'balcony', 'insects', 'pest', 'mosquito', 'litter'
  ],
  General: ['hostel', 'mess', 'food', 'noise', 'gym', 'laundry', 'security', 'curfew']
};

const CRITICAL_KEYWORDS = [
  'spark', 'shock', 'smoke', 'fire', 'live wire', 'burst pipe', 'flooding', 'blackout',
  'sewage overflow', 'burning', 'emergency', 'gas leak'
];

const HIGH_KEYWORDS = [
  'no water', 'no cooling', 'exam', 'total blackout', 'door jammed', 'locked out',
  'main switch', 'exam tomorrow', 'unusable', 'stinking'
];

const LOW_KEYWORDS = [
  'minor', 'faint', 'paint', 'creak', 'dusty', 'aesthetic', 'loose screw', 'slow drain'
];

// TF-IDF Cosine Similarity implementation
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function computeTermFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  return tf;
}

export function computeCosineSimilarity(textA: string, textB: string): number {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  if (!tokensA.length || !tokensB.length) return 0;

  const tfA = computeTermFreq(tokensA);
  const tfB = computeTermFreq(tokensB);

  const allWords = new Set([...tfA.keys(), ...tfB.keys()]);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const word of allWords) {
    const vA = tfA.get(word) || 0;
    const vB = tfB.get(word) || 0;
    dotProduct += vA * vB;
    normA += vA * vA;
    normB += vB * vB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Category Classifier
export function classifyComplaintText(text: string): {
  predictedCategory: Category;
  confidence: number;
  scores: Record<Category, number>;
} {
  const tokens = tokenize(text);
  const scores: Record<Category, number> = {
    AC: 0,
    Plumbing: 0,
    WiFi: 0,
    Electricity: 0,
    Carpentry: 0,
    Cleaning: 0,
    General: 0.1, // baseline prior
  };

  for (const token of tokens) {
    for (const [cat, words] of Object.entries(CATEGORY_VOCAB)) {
      if (words.includes(token)) {
        scores[cat as Category] += 2.2;
      } else {
        // substring match
        for (const w of words) {
          if (w.length >= 4 && (token.includes(w) || w.includes(token))) {
            scores[cat as Category] += 1.0;
          }
        }
      }
    }
  }

  // Find max category
  let bestCat: Category = 'General';
  let bestScore = 0;
  let totalScore = 0;

  for (const [cat, score] of Object.entries(scores)) {
    totalScore += score;
    if (score > bestScore) {
      bestScore = score;
      bestCat = cat as Category;
    }
  }

  const confidence = totalScore > 0 ? Math.min(0.97, Math.max(0.60, bestScore / (totalScore + 1.5))) : 0.55;

  return {
    predictedCategory: bestCat,
    confidence: Number(confidence.toFixed(2)),
    scores
  };
}

// Explainable Priority & Severity
export function calculateSeverityAndPriority(
  title: string,
  description: string,
  category: Category,
  block: string,
  existingComplaints: Complaint[]
): {
  severity: Severity;
  priorityScore: number;
  prioritySignals: string[];
} {
  const combined = `${title} ${description}`.toLowerCase();
  const prioritySignals: string[] = [];

  let severity: Severity = 'medium';
  let baseWeight = 20;

  // Check critical keywords
  const matchedCritical = CRITICAL_KEYWORDS.filter((k) => combined.includes(k));
  if (matchedCritical.length > 0) {
    severity = 'critical';
    baseWeight = 45;
    prioritySignals.push(`Safety hazard keywords detected: "${matchedCritical.join(', ')}"`);
  } else {
    const matchedHigh = HIGH_KEYWORDS.filter((k) => combined.includes(k));
    if (matchedHigh.length > 0) {
      severity = 'high';
      baseWeight = 32;
      prioritySignals.push(`High impact terms detected: "${matchedHigh.join(', ')}"`);
    } else {
      const matchedLow = LOW_KEYWORDS.filter((k) => combined.includes(k));
      if (matchedLow.length > 0) {
        severity = 'low';
        baseWeight = 10;
        prioritySignals.push('Standard non-urgent maintenance request');
      } else {
        prioritySignals.push('Standard priority default');
      }
    }
  }

  // Category urgency adjustment
  if (category === 'Electricity' || category === 'Plumbing') {
    baseWeight += 12;
    prioritySignals.push(`${category} issue incurs +12 infrastructure urgency bonus`);
  } else if (category === 'AC') {
    baseWeight += 8;
  }

  // Check recurring issues in same block
  const blockComplaints = existingComplaints.filter(
    (c) => c.block.toLowerCase() === block.toLowerCase() && c.category === category && c.status !== 'CLOSED'
  );
  if (blockComplaints.length >= 2) {
    baseWeight += 15;
    prioritySignals.push(`Recurring cluster: ${blockComplaints.length} related ${category} tickets open in Block ${block}`);
  }

  const priorityScore = Math.min(100, Math.max(10, baseWeight + Math.floor(Math.random() * 5)));

  return {
    severity,
    priorityScore,
    prioritySignals
  };
}

// Resolution Time Prediction (Regression)
export function predictResolutionTime(category: Category, severity: Severity): number {
  const baseTimes: Record<Category, number> = {
    Electricity: 35,
    AC: 75,
    Plumbing: 45,
    WiFi: 40,
    Carpentry: 60,
    Cleaning: 25,
    General: 50
  };

  const severityMultipliers: Record<Severity, number> = {
    critical: 1.4, // Requires thorough safety inspection
    high: 1.2,
    medium: 1.0,
    low: 0.75
  };

  const base = baseTimes[category] || 45;
  const mult = severityMultipliers[severity] || 1.0;
  return Math.round(base * mult);
}

// Find Duplicate Complaints
export function findPotentialDuplicates(
  title: string,
  description: string,
  category: Category,
  block: string,
  room: string,
  existingComplaints: Complaint[]
): DuplicateMatch[] {
  const queryText = `${title} ${description}`;
  const matches: DuplicateMatch[] = [];

  for (const item of existingComplaints) {
    if (item.status === 'CLOSED') continue;

    const itemText = `${item.title} ${item.description}`;
    let score = computeCosineSimilarity(queryText, itemText);

    // Boost if same block & room
    let reason = 'High textual similarity';
    if (item.block.toLowerCase() === block.toLowerCase() && item.room === room) {
      score = Math.min(1.0, score + 0.35);
      reason = 'Same room & block location';
    } else if (item.block.toLowerCase() === block.toLowerCase() && item.category === category) {
      score = Math.min(1.0, score + 0.15);
      reason = `Same block ${block} and ${category} category`;
    }

    if (score >= 0.50) {
      matches.push({
        complaintId: item.id,
        title: item.title,
        similarityScore: Number(score.toFixed(2)),
        room: item.room,
        block: item.block,
        status: item.status,
        reason,
        createdAt: item.createdAt
      });
    }
  }

  // Sort descending
  return matches.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 3);
}

// Suggested Technician Tools based on category
export function getTechnicianTools(category: Category): string[] {
  switch (category) {
    case 'Electricity':
      return ['Digital Multimeter', 'Insulated Screwdriver Kit', 'MCB Replacements (16A/32A)', 'Wire Stripper', 'Voltage Tester Pen'];
    case 'AC':
      return ['Manifold Gauge Set', 'Capacitor Tester', 'Refrigerant R-32 / R-410A', 'Finned Coil Cleaner', 'Vacuum Pump'];
    case 'Plumbing':
      return ['Pipe Wrench', 'Teflon Sealing Tape', 'Drain Snake Auger', 'Replacement Brass Ball Valve', 'Plumber Putty'];
    case 'WiFi':
      return ['RJ45 Crimper & Cat6 Cables', 'LAN Cable Tester', 'Access Point Console Cable', 'Spectrum Analyzer app'];
    case 'Carpentry':
      return ['Cordless Drill & Driver Bits', 'Mortise Lockset', 'Heavy Duty Hinges', 'Wood Chisel', 'Level Bar'];
    case 'Cleaning':
      return ['Industrial Disinfectant', 'Wet/Dry Vacuum', 'Floor Scrubber', 'Safety Gloves & PPE'];
    default:
      return ['General Tool Kit', 'Inspection Flashlight'];
  }
}

// Server-side Gemini AI integration for deep enrichment
let genAIClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  genAIClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function enrichWithGemini(
  title: string,
  description: string,
  category: Category,
  location: { hostel: string; block: string; room: string }
): Promise<{
  suggestedAction: string;
  toolsRequired: string[];
  reasoningSummary: string;
} | null> {
  if (!genAIClient) return null;

  try {
    const prompt = `You are the AI operations lead for a University Hostel Management platform (HostelIQ).
Analyze this student complaint:
Title: "${title}"
Description: "${description}"
Category: "${category}"
Location: Hostel ${location.hostel}, Block ${location.block}, Room ${location.room}

Provide a concise JSON response with:
1. "suggestedAction": clear 1-2 sentence recommendation for the admin & field worker.
2. "toolsRequired": array of 3-5 specific tools/spare parts needed.
3. "reasoningSummary": brief technical explanation of why this happens and immediate safety/preventive measure.`;

    const response = await genAIClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      suggestedAction: parsed.suggestedAction || 'Inspect on-site and verify terminal connections.',
      toolsRequired: Array.isArray(parsed.toolsRequired) ? parsed.toolsRequired : getTechnicianTools(category),
      reasoningSummary: parsed.reasoningSummary || 'Standard operational wear and tear.'
    };
  } catch (err) {
    console.warn('Gemini enrichment optional fallback:', err);
    return null;
  }
}
