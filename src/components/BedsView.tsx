import React, { useState } from 'react';
import { BedDouble, Plus, CheckCircle, UserCheck, LogOut, Check } from 'lucide-react';
import { Bed, Patient } from '../types';
import { i18n, Language } from '../utils/i18n';

interface BedsViewProps {
  beds: Bed[];
  patients: Patient[];
  onUpdateBedStatus: (id: string, status: 'Available' | 'Occupied', patientId?: string, patientName?: string) => void;
  lang: Language;
}

export default function BedsView({ beds, patients, onUpdateBedStatus, lang }: BedsViewProps) {
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [patientId, setPatientId] = useState('');

  const t = i18n[lang];

  const totalICU = beds.filter(b => b.type === 'ICU').length;
  const occupiedICU = beds.filter(b => b.type === 'ICU' && b.status === 'Occupied').length;

  const totalGen = beds.filter(b => b.type === 'General').length;
  const occupiedGen = beds.filter(b => b.type === 'General' && b.status === 'Occupied').length;

  const handleAdmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBed && patientId) {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        onUpdateBedStatus(selectedBed.id, 'Occupied', patient.id, patient.name);
        setSelectedBed(null);
        setPatientId('');
      }
    }
  };

  const handleRelease = (bedId: string) => {
    if (window.confirm('Are you sure you want to discharge this patient and mark the bed as Available?')) {
      onUpdateBedStatus(bedId, 'Available');
    }
  };

  return (
    <div className="space-y-3.5 animate-fade-in" id="beds-view-root text-xs">
      {/* Title */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight">{t.beds}</h1>
        <p className="text-[11px] text-slate-500 font-sans">Monitor live occupancy of ICU and general admission wards and perform instant admissions/discharge.</p>
      </div>

      {/* Capacity Analytics Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="beds-capacity-summary">
        {/* ICU Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-none space-y-2" id="icu-capacity-panel">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800">{t.icuBeds}</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-200 font-mono">
              {totalICU - occupiedICU} Vacant
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-800 font-mono">{occupiedICU}</span>
            <span className="text-xs text-slate-400">/ {totalICU} Occupied</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(occupiedICU / (totalICU || 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* General Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-none space-y-2" id="general-capacity-panel">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800">{t.generalBeds}</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-200 font-mono">
              {totalGen - occupiedGen} Vacant
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-800 font-mono">{occupiedGen}</span>
            <span className="text-xs text-slate-400">/ {totalGen} Occupied</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(occupiedGen / (totalGen || 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Ward Interactive Map Grid */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-none space-y-2.5" id="bed-grid-panel">
        <h3 className="text-xs font-bold text-slate-800 tracking-tight">Active Ward Interactive Map</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5" id="beds-interactive-grid">
          {beds.map((bed) => {
            const isOccupied = bed.status === 'Occupied';
            return (
              <div
                key={bed.id}
                className={`relative flex flex-col justify-between border rounded-lg p-3 transition-all hover:shadow-none border-slate-200 ${
                  isOccupied
                    ? 'bg-rose-50/40 border-rose-100 text-rose-900'
                    : 'bg-emerald-50/20 border-emerald-100 text-emerald-900'
                }`}
                id={`bed-card-${bed.id}`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider opacity-60 font-mono">{bed.type}</span>
                  <div className={`p-1 rounded-md ${isOccupied ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <BedDouble className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold font-mono text-slate-500">ID: {bed.id.split('_').slice(-2).join('_')}</div>
                  <div className="text-xs font-semibold truncate text-slate-800">
                    {isOccupied ? bed.patientName : 'Vacant'}
                  </div>
                  {isOccupied && bed.admittedDate && (
                    <div className="text-[9px] opacity-70 font-mono">Adm: {bed.admittedDate}</div>
                  )}
                </div>

                {/* Admission / Discharge Buttons */}
                <div className="mt-2.5 pt-2 border-t border-slate-100/60">
                  {isOccupied ? (
                    <button
                      onClick={() => handleRelease(bed.id)}
                      className="w-full flex items-center justify-center gap-1 bg-white hover:bg-rose-100 text-rose-600 border border-rose-200 text-[9px] font-bold py-0.5 px-1 rounded-md shadow-sm transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" /> Discharge
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedBed(bed)}
                      className="w-full flex items-center justify-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-[9px] font-bold py-0.5 px-1 rounded-md shadow-sm transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3 h-3" /> Admit Patient
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admission Assignment Dialog Modal */}
      {selectedBed && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in" id="admission-modal">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold font-display text-slate-800">Admit Patient to Bed: <span className="font-mono">{selectedBed.id.split('_').slice(-2).join('_')}</span></h2>
              <button
                onClick={() => setSelectedBed(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAdmit} className="p-6 space-y-4" id="admission-form">
              <div>
                <label htmlFor="admit-patient-select" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Select Patient for Ward Admission</label>
                <select
                  id="admit-patient-select"
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm bg-white"
                >
                  <option value="">-- Choose Registered Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Age: {p.age}, Gender: {p.gender})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">If the patient is not listed, navigate to the "Patient Registry" to register them first.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100" id="admission-modal-actions">
                <button
                  type="button"
                  onClick={() => setSelectedBed(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!patientId}
                  className="px-4 py-2 bg-teal-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 active:scale-95 transition-all cursor-pointer"
                >
                  Confirm Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
