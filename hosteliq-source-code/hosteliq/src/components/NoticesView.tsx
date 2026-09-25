import React, { useState } from 'react';
import { Notice, User } from '../types';
import { Bell, AlertTriangle, Plus, Calendar, Megaphone } from 'lucide-react';

interface NoticesViewProps {
  notices: Notice[];
  currentUser: User;
  onCreateNotice: (data: {
    title: string;
    body: string;
    priority: 'normal' | 'urgent';
    audience: string;
  }) => Promise<void>;
}

export const NoticesView: React.FC<NoticesViewProps> = ({
  notices,
  currentUser,
  onCreateNotice
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [audience, setAudience] = useState('All Hostels');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setIsSubmitting(true);
    await onCreateNotice({
      title: title.trim(),
      body: body.trim(),
      priority,
      audience
    });
    setTitle('');
    setBody('');
    setIsSubmitting(false);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Megaphone className="w-4 h-4" />
            <span>Hostel Circulars & Maintenance Alerts</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Official Notices</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Important updates regarding scheduled water maintenance, power outages, pest control, and campus network upgrades.
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Broadcast Notice
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notices.map((n) => (
          <div
            key={n.id}
            className={`p-5 rounded-2xl border transition-all ${
              n.priority === 'urgent'
                ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(n.publishedAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md">
                  {n.audience}
                </span>
                {n.priority === 'urgent' && (
                  <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-md flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Urgent
                  </span>
                )}
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed">{n.body}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Publish Official Notice</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  placeholder="e.g. Water Supply Interruption"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'normal' | 'urgent')}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Audience</label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Body</label>
                <textarea
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Detailed instructions for residents..."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  {isSubmitting ? 'Publishing...' : 'Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
