import React, { useState } from 'react';
import { UserCheck, Clock, Phone, Heart, Plus, Calendar, X, AlertCircle } from 'lucide-react';
import { Doctor } from '../types';
import { i18n, Language } from '../utils/i18n';

interface DoctorsViewProps {
  doctors: Doctor[];
  onSaveDoctor: (doctor: Doctor) => void;
  onLogAttendance: (doctorId: string, date: string, present: boolean) => void;
  lang: Language;
}

export default function DoctorsView({ doctors, onSaveDoctor, onLogAttendance, lang }: DoctorsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<Doctor>>({
    name: '',
    department: 'General Medicine',
    status: 'Active',
    shift: 'Morning',
    contact: '',
  });

  const t = i18n[lang];
  const todayDateStr = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDoc.name && newDoc.contact) {
      onSaveDoctor(newDoc as Doctor);
      setIsAdding(false);
      setNewDoc({ name: '', department: 'General Medicine', status: 'Active', shift: 'Morning', contact: '' });
    }
  };

  return (
    <div className="space-y-3.5 animate-fade-in" id="doctors-view-root text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="doctors-header">
        <div>
          <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight">{t.doctors}</h1>
          <p className="text-[11px] text-slate-500 font-sans">Organize medical staff duties, adjust shifts, and review attendance metrics.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          id="add-doc-button"
          className="flex items-center gap-1.5 bg-teal-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm hover:bg-teal-700 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.addDoctor}
        </button>
      </div>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" id="doctors-roster-grid">
        {doctors.map((doc) => {
          // Check if logged attendance for today
          const todayLog = doc.attendance.find(a => a.date === todayDateStr);
          const isPresentToday = todayLog ? todayLog.present : false;

          // Calculate overall attendance rate
          const totalDays = doc.attendance.length || 1;
          const presentDays = doc.attendance.filter(a => a.present).length;
          const attPercentage = Math.round((presentDays / totalDays) * 100);

          return (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-lg p-3 shadow-none space-y-3 hover:shadow-none relative"
              id={`doctor-card-${doc.id}`}
            >
              {/* Doctor Details */}
              <div className="flex items-start gap-2.5">
                <div className="bg-blue-50 text-blue-600 p-1.5 rounded-md">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold font-display text-slate-900 truncate">{doc.name}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">{doc.department}</p>
                </div>
                <span className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                  doc.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : doc.status === 'On Leave'
                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {doc.status === 'Active' ? t.active : doc.status === 'On Leave' ? t.onLeave : t.offDuty}
                </span>
              </div>

              {/* Roster & Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[10px] border-y border-slate-100 py-2 font-sans text-slate-600" id="doctor-roster-metrics">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Shift: <strong>{doc.shift}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500" />
                  <span>Attendance: <strong>{attPercentage}%</strong></span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span className="font-mono">{doc.contact}</span>
                </div>
              </div>

              {/* Attendance Logger for TODAY */}
              <div className="bg-slate-50 rounded-md p-2 flex justify-between items-center" id="today-attendance-panel">
                <span className="text-[10px] font-semibold text-slate-700">{t.todayAttendance}</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onLogAttendance(doc.id, todayDateStr, true)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                      todayLog && isPresentToday
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => onLogAttendance(doc.id, todayDateStr, false)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                      todayLog && !isPresentToday
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Doctor Dialog Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in" id="add-doctor-modal">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold font-display text-slate-800">{t.addDoctor}</h2>
              <button
                onClick={() => setIsAdding(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4" id="doctor-form">
              <div>
                <label htmlFor="modal-doc-name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Doctor Full Name</label>
                <input
                  id="modal-doc-name"
                  type="text"
                  required
                  value={newDoc.name || ''}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Dr. Harish Gowda"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-doc-dept" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.department}</label>
                  <select
                    id="modal-doc-dept"
                    value={newDoc.department}
                    onChange={(e) => setNewDoc({ ...newDoc, department: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="General Surgery">General Surgery</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-doc-shift" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.shift}</label>
                  <select
                    id="modal-doc-shift"
                    value={newDoc.shift}
                    onChange={(e) => setNewDoc({ ...newDoc, shift: e.target.value as any })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="modal-doc-contact" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Contact Number</label>
                <input
                  id="modal-doc-contact"
                  type="text"
                  required
                  value={newDoc.contact || ''}
                  onChange={(e) => setNewDoc({ ...newDoc, contact: e.target.value })}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  placeholder="e.g. +91 99001 23456"
                />
              </div>

              <div>
                <label htmlFor="modal-doc-status" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Current Duty Status</label>
                <select
                  id="modal-doc-status"
                  value={newDoc.status}
                  onChange={(e) => setNewDoc({ ...newDoc, status: e.target.value as any })}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                >
                  <option value="Active">Active / On Duty</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Off Duty">Off Duty</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100" id="add-doctor-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 active:scale-95 transition-all cursor-pointer"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
