import React, { useState, useEffect, useRef } from 'react';
import { User, Complaint } from '../types';
import {
  pcmFloat32ToInt16Base64,
  LiveAudioPlayer,
  startBrowserSpeechRecognition
} from '../lib/audioUtils';
import { parseVoiceComplaint } from '../lib/api';
import { Mic, MicOff, Volume2, X, Sparkles, Send, CheckCircle, ArrowRight, Bot, User as UserIcon } from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAutoFillComplaint: (data: {
    title: string;
    description: string;
    category?: any;
    room?: string;
    block?: string;
  }) => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAutoFillComplaint
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello ${currentUser.name}! I'm HostelIQ Voice Concierge (powered by Gemini Live). Speak naturally to report a room issue, check ticket status, or ask maintenance questions.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [extractedTicket, setExtractedTicket] = useState<{
    title: string;
    description: string;
    category: any;
    room: string;
    block: string;
  } | null>(null);

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const stopRecording = React.useCallback(() => {
    setIsRecording(false);
    setIsAiSpeaking(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stop();
      }
    } else {
      audioPlayerRef.current = new LiveAudioPlayer();
    }
    return () => {
      stopRecording();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stop();
      }
    };
  }, [isOpen, stopRecording]);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setCurrentTranscript('');

      // 1. Establish WebSocket for Gemini Live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Voice Modal] WebSocket connected to Gemini Live');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'audio' && data.audio) {
            setIsAiSpeaking(true);
            audioPlayerRef.current?.playChunk(data.audio);
          }
          if (data.type === 'text' && data.text) {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: last.text + ' ' + data.text }
                ];
              } else {
                return [
                  ...prev,
                  {
                    role: 'assistant',
                    text: data.text,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                ];
              }
            });
          }
          if (data.type === 'interrupted') {
            setIsAiSpeaking(false);
          }
        } catch (err) {
          console.error('[Voice Modal] Error parsing ws message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[Voice Modal] WS error, fallback to browser speech synthesis:', err);
      };

      // 2. Capture Microphone Audio at 16,000 Hz for Gemini Live
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass({ sampleRate: 16000 });
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          const base64Audio = pcmFloat32ToInt16Base64(input);
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ audio: base64Audio }));
          }
        };
      } catch (micErr) {
        console.warn('Microphone 16kHz capture warning, using browser speech recognition:', micErr);
      }

      // 3. Complement with browser SpeechRecognition for live on-screen text transcripts
      const speechRec = startBrowserSpeechRecognition(
        (text, isFinal) => {
          setCurrentTranscript(text);
          if (isFinal && text.trim()) {
            handleFinalUserSpeech(text.trim());
          }
        },
        (err) => {
          console.warn('SpeechRecognition warning:', err);
        },
        () => {
          // Ended
        }
      );
      recognitionRef.current = speechRec;
    } catch (e: any) {
      console.error('Failed to start voice recording:', e);
      setIsRecording(false);
    }
  };

  const handleFinalUserSpeech = async (spoken: string) => {
    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: spoken,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setCurrentTranscript('');

    // If connected via WebSocket, send text as client content
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: spoken }));
    }

    // Try extracting structured ticket fields from user speech
    try {
      const extracted = await parseVoiceComplaint(spoken);
      if (extracted.title && extracted.title.length > 4) {
        setExtractedTicket({
          title: extracted.title,
          description: extracted.description || spoken,
          category: extracted.category,
          room: extracted.room || currentUser.room || '304',
          block: extracted.block || currentUser.block || 'B'
        });
      }
    } catch (err) {
      console.warn('Voice extract fallback:', err);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleApplyExtractedTicket = () => {
    if (!extractedTicket) return;
    onAutoFillComplaint(extractedTicket);
    stopRecording();
    onClose();
  };

  const handleQuickPrompt = (promptText: string) => {
    handleFinalUserSpeech(promptText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">HostelIQ Voice Concierge</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded-full border border-indigo-100">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-slate-500">Real-time spoken hostel maintenance assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation transcript stream */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-800 border border-slate-100'
                }`}
              >
                <p className="leading-relaxed">{m.text}</p>
                <span
                  className={`text-[10px] mt-1 block text-right ${
                    m.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
              )}
            </div>
          ))}

          {currentTranscript && (
            <div className="flex gap-3 justify-end">
              <div className="max-w-[80%] rounded-2xl p-3.5 text-xs bg-indigo-50 text-indigo-900 border border-indigo-200 animate-pulse">
                <span className="text-[10px] font-semibold text-indigo-600 block mb-0.5">Listening:</span>
                <p className="italic">"{currentTranscript}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Extracted Complaint Card if user reported an issue */}
        {extractedTicket && (
          <div className="my-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="truncate">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                Structured Ticket Detected from Speech
              </span>
              <div className="text-xs font-bold text-slate-900 truncate">{extractedTicket.title}</div>
              <div className="text-[11px] text-slate-500">
                Category: <strong>{extractedTicket.category}</strong> · Block {extractedTicket.block}, Rm {extractedTicket.room}
              </div>
            </div>
            <button
              onClick={handleApplyExtractedTicket}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shrink-0 flex items-center gap-1 shadow-xs transition-colors"
            >
              <span>Auto-Fill Form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Spoken Prompt Suggestions */}
        <div className="py-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-500 font-medium block mb-1.5">Try saying:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleQuickPrompt('The AC in room 304 is blowing warm air and compressor is rattling')}
              className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-left"
            >
              "AC in room 304 blowing warm air..."
            </button>
            <button
              onClick={() => handleQuickPrompt('Bathroom washbasin pipe is leaking heavily on the floor')}
              className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-left"
            >
              "Bathroom pipe leaking heavily..."
            </button>
            <button
              onClick={() => handleQuickPrompt('WiFi in Block B is disconnecting every 5 minutes')}
              className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-left"
            >
              "WiFi disconnecting frequently..."
            </button>
          </div>
        </div>

        {/* Live Audio Visualizer / Controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            {isRecording ? (
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <span className="font-semibold text-rose-600">Microphone Active (Streaming to Gemini)</span>
              </div>
            ) : isAiSpeaking ? (
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-600 animate-bounce" />
                <span className="font-semibold text-indigo-600">Gemini Live Speaking...</span>
              </div>
            ) : (
              <span>Tap the microphone to begin talking.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleRecording}
              className={`p-3.5 rounded-2xl flex items-center justify-center transition-all shadow-md ${
                isRecording
                  ? 'bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
