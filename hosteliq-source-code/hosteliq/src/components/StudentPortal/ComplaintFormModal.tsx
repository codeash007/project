import React, { useState, useEffect, useRef } from 'react';
import { User, Category, DuplicateMatch } from '../../types';
import { testClassifyText, testDuplicateDetection, parseVoiceComplaint } from '../../lib/api';
import { startBrowserSpeechRecognition } from '../../lib/audioUtils';
import { Sparkles, AlertTriangle, Clock, X, Image, CheckCircle, Info, Mic, MicOff } from 'lucide-react';

interface ComplaintFormModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  prefillData?: {
    title?: string;
    description?: string;
    category?: Category;
    room?: string;
    block?: string;
  };
}

const CATEGORIES: Category[] = ['AC', 'Plumbing', 'WiFi', 'Electricity', 'Carpentry', 'Cleaning', 'General'];

const SAMPLE_TEMPLATES = [
  {
    title: 'AC blowing warm air and compressor not starting',
    desc: 'The split AC unit in my room is only blowing ambient room temperature air. It has been running for 2 hours with no cooling and makes a humming noise.',
    cat: 'AC'
  },
  {
    title: 'Bathroom basin tap leaking continuously',
    desc: 'The tap washer seems damaged. Water is dripping constantly into the washbasin and the floor drain is clogged.',
    cat: 'Plumbing'
  },
  {
    title: 'Sparks and burnt smell from table socket',
    desc: 'Observed electrical sparks when plugging laptop charger into the 3-pin switchboard on wall B. Urgent inspection needed.',
    cat: 'Electricity'
  },
  {
    title: 'Wi-Fi keeps dropping every 5 minutes',
    desc: 'Connecting to Hostel4-BlockB-5G keeps dropping connection during online class. DNS and gateway timeouts.',
    cat: 'WiFi'
  }
];

export const ComplaintFormModal: React.FC<ComplaintFormModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSubmit,
  prefillData
}) => {
  const [title, setTitle] = useState(prefillData?.title || '');
  const [description, setDescription] = useState(prefillData?.description || '');
  const [category, setCategory] = useState<Category | ''>(prefillData?.category || '');
  const [block, setBlock] = useState(prefillData?.block || currentUser.block || 'B');
  const [room, setRoom] = useState(prefillData?.room || currentUser.room || '304');
  const [hostel, setHostel] = useState(currentUser.hostel || 'Hostel 4 (Aryabhatta)');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Voice dictation state
  const [isDictating, setIsDictating] = useState(false);
  const [activeVoiceTarget, setActiveVoiceTarget] = useState<'all' | 'title' | 'description' | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (prefillData) {
      if (prefillData.title) setTitle(prefillData.title);
      if (prefillData.description) setDescription(prefillData.description);
      if (prefillData.category) setCategory(prefillData.category);
      if (prefillData.room) setRoom(prefillData.room);
      if (prefillData.block) setBlock(prefillData.block);
    }
  }, [prefillData]);

  // Live AI Prediction state
  const [aiPrediction, setAiPrediction] = useState<{
    predictedCategory: Category;
    confidence: number;
  } | null>(null);
  const [detectedDuplicates, setDetectedDuplicates] = useState<DuplicateMatch[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Debounced AI classification and duplicate detection
  useEffect(() => {
    if (title.length < 5 && description.length < 10) {
      setAiPrediction(null);
      setDetectedDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const text = `${title} ${description}`;
        const [classifyRes, dupes] = await Promise.all([
          testClassifyText(text),
          testDuplicateDetection({
            title,
            description,
            category: (category as Category) || 'General',
            block,
            room
          })
        ]);

        setAiPrediction({
          predictedCategory: classifyRes.predictedCategory,
          confidence: classifyRes.confidence
        });
        setDetectedDuplicates(dupes);
        if (!category) {
          setCategory(classifyRes.predictedCategory);
        }
      } catch (e) {
        console.error('AI preview failed', e);
      } finally {
        setIsAnalyzing(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [title, description, block, room]);

  const stopDictation = React.useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsDictating(false);
    setActiveVoiceTarget(null);
  }, []);

  const startDictation = (target: 'all' | 'title' | 'description') => {
    if (isDictating) {
      stopDictation();
      return;
    }

    setIsDictating(true);
    setActiveVoiceTarget(target);

    const rec = startBrowserSpeechRecognition(
      async (spokenText, isFinal) => {
        if (!spokenText.trim()) return;

        if (target === 'title') {
          setTitle(spokenText);
        } else if (target === 'description') {
          setDescription(spokenText);
        } else if (target === 'all') {
          setDescription(spokenText);
          if (isFinal) {
            // Parse full speech into fields
            try {
              const res = await parseVoiceComplaint(spokenText);
              if (res.title) setTitle(res.title);
              if (res.category) setCategory(res.category);
              if (res.room) setRoom(res.room);
              if (res.block) setBlock(res.block);
            } catch (e) {}
          }
        }
      },
      (err) => {
        console.warn('Voice dictation error:', err);
        stopDictation();
      },
      () => {
        setIsDictating(false);
        setActiveVoiceTarget(null);
      }
    );

    recognitionRef.current = rec;
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide a title and detailed description.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit({
        userId: currentUser.id,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        studentId: currentUser.studentId || 'MCA-2024-042',
        title: title.trim(),
        description: description.trim(),
        category: category || (aiPrediction?.predictedCategory ?? 'General'),
        hostel,
        block,
        room,
        mediaUrl: mediaUrl.trim() || undefined
      });
      // reset
      setTitle('');
      setDescription('');
      setCategory('');
      setMediaUrl('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to file complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyTemplate = (t: typeof SAMPLE_TEMPLATES[0]) => {
    setTitle(t.title);
    setDescription(t.desc);
    setCategory(t.cat as Category);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Report a Maintenance Issue</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              HostelIQ AI will automatically categorize, assign priority, and check for existing tickets.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Voice Dictation Bar */}
        <div className="mt-3 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => startDictation('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                isDictating && activeVoiceTarget === 'all'
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isDictating && activeVoiceTarget === 'all' ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Listening... Tap to stop</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Speak Entire Complaint by Voice</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-indigo-900 hidden sm:inline">
              (AI will auto-fill Title, Description & Room)
            </span>
          </div>

          <div className="text-[11px] text-slate-500">PRD Voice Integration</div>
        </div>

        {/* Quick Template Fillers for Evaluation */}
        <div className="mt-2.5 py-2 px-3 bg-slate-50 rounded-xl">
          <span className="text-xs font-semibold text-slate-600 block mb-1.5">Quick Examples:</span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="text-xs px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                {tpl.cat}: {tpl.title.slice(0, 24)}...
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Location details */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hostel</label>
              <input
                type="text"
                value={hostel}
                onChange={(e) => setHostel(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Block</label>
              <input
                type="text"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room No.</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Title with Voice Mic */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Issue Summary / Title</label>
              <button
                type="button"
                onClick={() => startDictation('title')}
                className={`text-[11px] flex items-center gap-1 font-medium transition-colors ${
                  isDictating && activeVoiceTarget === 'title'
                    ? 'text-rose-600 font-bold'
                    : 'text-slate-500 hover:text-indigo-600'
                }`}
              >
                <Mic className="w-3 h-3" />
                {isDictating && activeVoiceTarget === 'title' ? 'Recording...' : 'Dictate Title'}
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. AC cooling fan rattling or Room 304 water leakage"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Description with Voice Mic */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Detailed Description</label>
              <button
                type="button"
                onClick={() => startDictation('description')}
                className={`text-[11px] flex items-center gap-1 font-medium transition-colors ${
                  isDictating && activeVoiceTarget === 'description'
                    ? 'text-rose-600 font-bold'
                    : 'text-slate-500 hover:text-indigo-600'
                }`}
              >
                <Mic className="w-3 h-3" />
                {isDictating && activeVoiceTarget === 'description' ? 'Recording...' : 'Dictate Description'}
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="Describe the exact symptoms, when it started, and whether it poses an immediate hazard..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Category & Photo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Category</label>
                {aiPrediction && (
                  <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI: {aiPrediction.predictedCategory} ({Math.round(aiPrediction.confidence * 100)}%)
                  </span>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Auto-Detect via AI</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Photo / Proof (Optional URL)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setMediaUrl('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80')}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg shrink-0"
                  title="Attach sample photo"
                >
                  Preset Photo
                </button>
              </div>
            </div>
          </div>

          {/* AI Real-time Triage Card */}
          {(aiPrediction || detectedDuplicates.length > 0) && (
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between text-indigo-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  AI Real-Time Triage Assessment
                </span>
                {isAnalyzing ? (
                  <span className="text-slate-400">Computing embeddings...</span>
                ) : (
                  <span className="text-emerald-700 font-medium">Ready</span>
                )}
              </div>

              <div className="flex items-center gap-4 text-slate-700 text-[11px]">
                <div>
                  <span className="text-slate-500">Predicted Category: </span>
                  <strong className="text-indigo-950 font-semibold">{aiPrediction?.predictedCategory}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Confidence: </span>
                  <strong className="text-indigo-950 font-semibold">
                    {aiPrediction ? Math.round(aiPrediction.confidence * 100) : '--'}%
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Target SLA: </span>
                  <strong className="text-indigo-950 font-semibold">Under 90 mins</strong>
                </div>
              </div>

              {/* Duplicate alert if found */}
              {detectedDuplicates.length > 0 && (
                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-900">
                  <div className="font-semibold flex items-center gap-1.5 text-xs text-amber-950 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Possible Existing Incident Detected
                  </div>
                  <p className="text-[11px] text-amber-800">
                    A similar complaint "{detectedDuplicates[0].title}" was logged for{' '}
                    <strong>
                      Block {detectedDuplicates[0].block}, Room {detectedDuplicates[0].room}
                    </strong>{' '}
                    ({Math.round(detectedDuplicates[0].similarityScore * 100)}% match). HostelIQ will notify the admin to link your report.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Complaint to HostelIQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

