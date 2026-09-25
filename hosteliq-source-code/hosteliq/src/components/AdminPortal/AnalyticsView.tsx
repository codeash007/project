import React from 'react';
import { AnalyticsData } from '../../types';
import { Activity, AlertTriangle, CheckCircle, Clock, RotateCcw, TrendingUp, Sparkles } from 'lucide-react';

interface AnalyticsViewProps {
  analytics: AnalyticsData;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  const categoryKeys = Object.keys(analytics.categoryDistribution || {});
  const maxCategoryCount = Math.max(...Object.values(analytics.categoryDistribution || {}), 1);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
          <Activity className="w-4 h-4" />
          <span>Operational Intelligence & Telemetry (PRD Section 13)</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hostel Maintenance Analytics</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xl">
          Continuous monitoring of campus infrastructure reliability, resolution velocity, failure hotspots, and recurring equipment anomalies.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Average SLA Resolution Time</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <Clock className="w-5 h-5 text-indigo-600" />
            {analytics.avgResolutionHours} hrs
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Within target SLA (3.0 hrs)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Reopen Rate</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <RotateCcw className="w-5 h-5 text-amber-600" />
            {analytics.reopenRate}%
          </div>
          <span className="text-[11px] text-slate-500">Benchmark industry threshold &lt; 5%</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Complaints Handled</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {analytics.totalComplaints}
          </div>
          <span className="text-[11px] text-slate-500">{analytics.resolvedCount} successfully resolved</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Critical Triage Ratio</span>
          <div className="text-2xl font-bold text-rose-600 mt-1 flex items-center gap-1.5">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            {analytics.totalComplaints > 0
              ? Math.round((analytics.criticalQueue / analytics.totalComplaints) * 100)
              : 0}
            %
          </div>
          <span className="text-[11px] text-slate-500">{analytics.criticalQueue} high severity tickets</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Complaints by Infrastructure Category</h3>
          <div className="space-y-3">
            {categoryKeys.map((cat) => {
              const count = analytics.categoryDistribution[cat] || 0;
              const pct = Math.round((count / maxCategoryCount) * 100);

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="font-medium">{cat}</span>
                    <span className="font-bold text-slate-900">{count} tickets</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Block Hotspot Analysis */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Block Hotspot Density</h3>
          <p className="text-xs text-slate-500">
            Identifies physical buildings experiencing disproportionate failure rates.
          </p>
          <div className="space-y-3">
            {analytics.blockHotspots.map((spot) => (
              <div
                key={spot.block}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Block {spot.block} Residence</div>
                  <div className="text-[11px] text-slate-500">
                    {spot.count} Total Tickets · {spot.highPriorityCount} High Urgency
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      spot.highPriorityCount > 0
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {spot.highPriorityCount > 0 ? 'Action Required' : 'Stable'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recurring Issue Alerts */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Predictive Recurring Issue Detection</h3>
        </div>
        <p className="text-xs text-slate-500">
          The ML clustering algorithm scans temporal and spatial windows to flag systemic failures before major outages occur.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.recurringIssues.map((issue, idx) => (
            <div key={idx} className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950">{issue.pattern}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded">
                  {issue.risk} RISK
                </span>
              </div>
              <div className="text-[11px] text-amber-900">
                Frequency: <strong>{issue.count} incidents logged</strong> across rooms {issue.affectedRooms.join(', ')}.
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs text-slate-700">
                <span className="font-semibold text-slate-900 block text-[11px]">AI Action Recommendation:</span>
                <span className="text-[11px] text-slate-600">{issue.suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
