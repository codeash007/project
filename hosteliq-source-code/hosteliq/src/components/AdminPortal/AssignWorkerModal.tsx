import React, { useState } from 'react';
import { Complaint, Worker } from '../../types';
import { UserCheck, X, Wrench, Phone, CheckCircle } from 'lucide-react';

interface AssignWorkerModalProps {
  complaint: Complaint | null;
  workers: Worker[];
  isOpen: boolean;
  onClose: () => void;
  onAssign: (complaintId: string, workerId: string) => Promise<void>;
}

export const AssignWorkerModal: React.FC<AssignWorkerModalProps> = ({
  complaint,
  workers,
  isOpen,
  onClose,
  onAssign
}) => {
  if (!isOpen || !complaint) return null;

  const [selectedWorkerId, setSelectedWorkerId] = useState(complaint.assignedWorkerId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group workers by matching category first
  const sortedWorkers = [...workers].sort((a, b) => {
    const aMatch = a.department.toLowerCase() === complaint.category.toLowerCase();
    const bMatch = b.department.toLowerCase() === complaint.category.toLowerCase();
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return (a.activeTasksCount || 0) - (b.activeTasksCount || 0);
  });

  const handleConfirm = async () => {
    if (!selectedWorkerId) return;
    try {
      setIsSubmitting(true);
      await onAssign(complaint.id, selectedWorkerId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Assign Technician</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
          <div className="font-mono text-slate-500 font-medium">Ticket: {complaint.id}</div>
          <div className="font-semibold text-slate-900">{complaint.title}</div>
          <div className="text-slate-500">
            Block {complaint.block}, Rm {complaint.room} · Category: <strong>{complaint.category}</strong>
          </div>
        </div>

        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
          <span className="text-xs font-semibold text-slate-700 block">Available Maintenance Staff:</span>
          {sortedWorkers.map((w) => {
            const isMatch = w.department.toLowerCase() === complaint.category.toLowerCase();
            const isSelected = selectedWorkerId === w.id;

            return (
              <div
                key={w.id}
                onClick={() => setSelectedWorkerId(w.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{w.name}</span>
                    {isMatch && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded">
                        Department Match
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                    <span>{w.department} Dept</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {w.phone}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-700 block">
                    {w.activeTasksCount} active tasks
                  </span>
                  {isSelected && <CheckCircle className="w-4 h-4 text-indigo-600 ml-auto mt-1" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedWorkerId || isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs"
          >
            {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
};
