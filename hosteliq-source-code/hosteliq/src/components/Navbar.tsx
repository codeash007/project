import React from 'react';
import { User, Role } from '../types';
import { Shield, Wrench, GraduationCap, Bell, Activity, Sparkles, BookOpen, Mic, Download } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onSwitchUser: (role: Role) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  urgentNoticesCount: number;
  onOpenVoiceAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  activeTab,
  setActiveTab,
  urgentNoticesCount,
  onOpenVoiceAssistant
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg tracking-tight">
                H<span className="text-amber-400">Q</span>
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight block leading-none">
                  Hostel<span className="text-indigo-600">IQ</span>
                </span>
                <span className="text-xs text-slate-500 font-medium">Predictive Operations</span>
              </div>
            </div>

            {/* Navigation Tabs based on Role */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {currentUser.role === 'student'
                  ? 'My Complaints'
                  : currentUser.role === 'admin'
                  ? 'Operations Console'
                  : 'Assigned Work orders'}
              </button>

              {currentUser.role === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('incidents')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'incidents'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Incidents & Duplicates
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'analytics'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Hotspots & Analytics
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveTab('notices')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors relative ${
                  activeTab === 'notices'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Notices
                {urgentNoticesCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                    {urgentNoticesCount}
                  </span>
                )}
              </button>

              {/* MCA / AI Evaluation Tab */}
              <button
                onClick={() => setActiveTab('ml-eval')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'ml-eval'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>AI/ML Evaluation</span>
              </button>

              {/* Voice Concierge Button */}
              <button
                onClick={onOpenVoiceAssistant}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                title="Live Audio Voice Assistant"
              >
                <Mic className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                <span>Voice Concierge</span>
              </button>

              {/* Direct Source Code Download */}
              <a
                href="/api/download-source"
                download="hosteliq-source-code.zip"
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
                title="Download Source Code ZIP"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Source ZIP</span>
              </a>
            </nav>
          </div>

          {/* Right Side: Quick Role Switcher + User Profile */}
          <div className="flex items-center gap-4">
            {/* Quick Persona Switcher */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <span className="px-2 text-slate-500 font-normal">Switch Persona:</span>
              <button
                onClick={() => onSwitchUser('student')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentUser.role === 'student'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                Student
              </button>
              <button
                onClick={() => onSwitchUser('admin')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentUser.role === 'admin'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                Admin
              </button>
              <button
                onClick={() => onSwitchUser('worker')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentUser.role === 'worker'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                Technician
              </button>
            </div>

            {/* Current User Pill */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <div className="font-semibold text-slate-900">{currentUser.name}</div>
                <div className="text-slate-500">
                  {currentUser.role === 'student'
                    ? `Block ${currentUser.block} · Rm ${currentUser.room}`
                    : currentUser.role === 'admin'
                    ? 'Operations Warden'
                    : 'Field Maintenance'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
