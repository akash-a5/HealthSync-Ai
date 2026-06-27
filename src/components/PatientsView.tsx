import React, { useState } from 'react';
import { UserPlus, Search, CalendarPlus, FileSpreadsheet, Plus, Stethoscope, ChevronRight, X, Clock, Calendar } from 'lucide-react';
import { Patient, Doctor } from '../types';
import { i18n, Language } from '../utils/i18n';

interface PatientsViewProps {
  patients: Patient[];
  doctors: Doctor[];
  onRegisterPatient: (patient: Patient) => void;
  onAddDiagnosis: (patientId: string, diagnosis: string, treatment: string, doctorName: string) => void;
  onBookAppointment: (patientId: string, doctorId: string, date: string, time: string) => void;
  lang: Language;
}

export default function PatientsView({ patients, doctors, onRegisterPatient, onAddDiagnosis, onBookAppointment, lang }: PatientsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isBooking, setIsBooking] = useState<string | null>(null); // patientId

  // Forms states
  const [regForm, setRegForm] = useState({ name: '', age: 30, gender: 'Male' as const, contact: '', bloodGroup: 'O+' });
  const [diagForm, setDiagForm] = useState({ diagnosis: '', treatment: '', doctorName: '' });
  const [aptForm, setAptForm] = useState({ doctorId: '', date: new Date().toISOString().split('T')[0], time: '10:00 AM' });

  const t = i18n[lang];

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.contact.includes(searchQuery)
  );

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.name && regForm.contact) {
      onRegisterPatient({
        id: '', // server generated
        name: regForm.name,
        age: Number(regForm.age),
        gender: regForm.gender,
        contact: regForm.contact,
        bloodGroup: regForm.bloodGroup,
        history: [],
        appointments: [],
        registrationDate: '',
        phcId: '',
      });
      setIsRegistering(false);
      setRegForm({ name: '', age: 30, gender: 'Male', contact: '', bloodGroup: 'O+' });
    }
  };

  const handleDiagnosisSubmit = (e: React.FormEvent, patientId: string) => {
    e.preventDefault();
    if (diagForm.diagnosis && diagForm.treatment && diagForm.doctorName) {
      onAddDiagnosis(patientId, diagForm.diagnosis, diagForm.treatment, diagForm.doctorName);
      setDiagForm({ diagnosis: '', treatment: '', doctorName: '' });
      // Update the selected patient to display the newly added diagnosis
      const updated = patients.find(p => p.id === patientId);
      if (updated) setSelectedPatient(updated);
    }
  };

  const handleAppointmentSubmit = (e: React.FormEvent, patientId: string) => {
    e.preventDefault();
    if (aptForm.doctorId && aptForm.date && aptForm.time) {
      onBookAppointment(patientId, aptForm.doctorId, aptForm.date, aptForm.time);
      setIsBooking(null);
      setAptForm({ doctorId: '', date: new Date().toISOString().split('T')[0], time: '10:00 AM' });
    }
  };

  return (
    <div className="space-y-3.5 animate-fade-in" id="patients-view-root text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="patients-header">
        <div>
          <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight">{t.patients}</h1>
          <p className="text-[11px] text-slate-500 font-sans">Manage patient health records, examine treatment logs, and book medical appointments.</p>
        </div>
        <button
          onClick={() => setIsRegistering(true)}
          id="register-patient-button"
          className="flex items-center gap-1.5 bg-teal-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm hover:bg-teal-700 active:scale-[0.98] transition-all cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          {t.registerPatient}
        </button>
      </div>

      {/* Main Grid: Patients List (Left) + Detail View Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5" id="patients-layout-grid">
        {/* Patients Index */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-2.5 shadow-none flex flex-col space-y-2.5 h-[calc(100vh-160px)]" id="patients-index-panel">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
              id="search-patients-field"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" id="patients-scroll-list">
            {filteredPatients.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedPatient?.id === p.id
                    ? 'bg-teal-50/50 border-teal-200 shadow-sm shadow-teal-500/5'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                }`}
                id={`patient-item-${p.id}`}
              >
                <div>
                  <h4 className="font-semibold text-slate-800 font-display text-xs">{p.name}</h4>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">{p.age} Yrs • {p.gender} • Blood: {p.bloodGroup || 'N/A'}</p>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${selectedPatient?.id === p.id ? 'translate-x-0.5 text-teal-600' : ''}`} />
              </button>
            ))}
            {filteredPatients.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-[11px]">
                No patients found matching inquiry. Register a new profile.
              </div>
            )}
          </div>
        </div>

        {/* Patient Detail Panel */}
        <div className="lg:col-span-2 space-y-3.5" id="patients-detail-panel">
          {selectedPatient ? (
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-none space-y-3.5 animate-fade-in" id="patient-record-panel">
              {/* Detailed Card Title */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-3" id="patient-details-header">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold font-display text-slate-900">{selectedPatient.name}</h2>
                  <p className="text-[10px] text-slate-500">Registered since: <strong className="font-mono">{selectedPatient.registrationDate}</strong></p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setIsBooking(selectedPatient.id)}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2 py-1 rounded-md transition-all cursor-pointer"
                  >
                    <CalendarPlus className="w-3 h-3" /> Book Apt
                  </button>
                </div>
              </div>

              {/* Demographics Card Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100" id="demographics-grid">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Age</span>
                  <div className="text-xs font-semibold text-slate-800">{selectedPatient.age} years</div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Gender</span>
                  <div className="text-xs font-semibold text-slate-800">{selectedPatient.gender}</div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Contact</span>
                  <div className="text-xs font-mono font-semibold text-slate-800">{selectedPatient.contact}</div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Blood Group</span>
                  <div className="text-xs font-semibold text-slate-800">{selectedPatient.bloodGroup || 'N/A'}</div>
                </div>
              </div>

              {/* Active Scheduled Appointments */}
              <div className="space-y-2" id="patient-appointments-list">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> Booked Appointments
                </h3>
                <div className="space-y-1.5">
                  {selectedPatient.appointments.map((apt) => (
                    <div key={apt.id} className="flex justify-between items-center bg-slate-50 border border-slate-100/80 p-2 rounded-md" id={`apt-item-${apt.id}`}>
                      <div className="flex items-center gap-2">
                        <div className="bg-white p-1 rounded border border-slate-100 text-slate-500 font-mono text-[9px] text-center w-11">
                          <span className="block font-bold">{apt.time}</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">Consultation with {apt.doctorName}</p>
                          <p className="text-[9px] text-slate-400 font-mono">Scheduled: {apt.date}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        apt.status === 'Scheduled'
                          ? 'bg-teal-50 text-teal-700 border border-teal-100'
                          : apt.status === 'Completed'
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {apt.status === 'Scheduled' ? t.scheduled : apt.status === 'Completed' ? t.completed : t.cancelled}
                      </span>
                    </div>
                  ))}
                  {selectedPatient.appointments.length === 0 && (
                    <p className="text-[10px] text-slate-400 font-sans italic">No future clinical appointments scheduled.</p>
                  )}
                </div>
              </div>

              {/* Medical Diagnosis Log */}
              <div className="space-y-4 border-t border-slate-50 pt-5" id="patient-medical-history">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-600" /> {t.history}
                </h3>

                {/* List of diagnoses */}
                <div className="space-y-3.5">
                  {selectedPatient.history.map((hist) => (
                    <div key={hist.id} className="bg-white border border-slate-100 shadow-sm p-4 rounded-xl space-y-2 relative pl-5 before:absolute before:left-0 before:top-4 before:w-1 before:h-12 before:bg-teal-600 before:rounded-r" id={`history-item-${hist.id}`}>
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span className="font-mono">{hist.date}</span>
                        <span className="font-medium">Diagnosed by: {hist.doctorName}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">{hist.diagnosis}</h4>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                        Treatment: {hist.treatment}
                      </p>
                    </div>
                  ))}
                  {selectedPatient.history.length === 0 && (
                    <p className="text-xs text-slate-400 font-sans italic">No existing diagnostic history files in database.</p>
                  )}
                </div>

                {/* Inline form to ADD diagnosis */}
                <form onSubmit={(e) => handleDiagnosisSubmit(e, selectedPatient.id)} className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl space-y-3 mt-4" id="diagnosis-form">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.diagnose}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="diag-field" className="block text-[10px] font-semibold text-slate-500 mb-1">Diagnosis</label>
                      <input
                        id="diag-field"
                        type="text"
                        required
                        value={diagForm.diagnosis}
                        onChange={(e) => setDiagForm({ ...diagForm, diagnosis: e.target.value })}
                        placeholder="e.g. Hypertension Level 2"
                        className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="treatment-field" className="block text-[10px] font-semibold text-slate-500 mb-1">Treatment Plan</label>
                      <input
                        id="treatment-field"
                        type="text"
                        required
                        value={diagForm.treatment}
                        onChange={(e) => setDiagForm({ ...diagForm, treatment: e.target.value })}
                        placeholder="e.g. Amlodipine 5mg once daily"
                        className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="docname-field" className="block text-[10px] font-semibold text-slate-500 mb-1">Attending Physician</label>
                    <div className="flex gap-2">
                      <select
                        id="docname-field"
                        required
                        value={diagForm.doctorName}
                        onChange={(e) => setDiagForm({ ...diagForm, doctorName: e.target.value })}
                        className="block flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none bg-white"
                      >
                        <option value="">-- Choose Doctor --</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.name}>{d.name} ({d.department})</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={!diagForm.diagnosis || !diagForm.treatment || !diagForm.doctorName}
                        className="px-4 py-1.5 bg-teal-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 active:scale-95 transition-all cursor-pointer"
                      >
                        Save Record
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500 h-[calc(100vh-220px)] flex flex-col justify-center items-center" id="empty-details-panel">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mb-2.5" />
              <h3 className="font-semibold text-slate-700 font-display text-sm">No Patient Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">Select any patient record from the sidebar to view detailed history, admit to wards, and coordinate appointments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Patient Registration Dialog Modal */}
      {isRegistering && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in" id="register-patient-modal">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold font-display text-slate-800">{t.registerPatient}</h2>
              <button
                onClick={() => setIsRegistering(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4" id="patient-registration-form">
              <div>
                <label htmlFor="modal-p-name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Patient Full Name</label>
                <input
                  id="modal-p-name"
                  type="text"
                  required
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-p-age" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.age}</label>
                  <input
                    id="modal-p-age"
                    type="number"
                    required
                    min="1"
                    value={regForm.age}
                    onChange={(e) => setRegForm({ ...regForm, age: parseInt(e.target.value) || 1 })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="modal-p-gender" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.gender}</label>
                  <select
                    id="modal-p-gender"
                    value={regForm.gender}
                    onChange={(e) => setRegForm({ ...regForm, gender: e.target.value as any })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-p-contact" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Contact Number</label>
                  <input
                    id="modal-p-contact"
                    type="text"
                    required
                    value={regForm.contact}
                    onChange={(e) => setRegForm({ ...regForm, contact: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none font-mono"
                    placeholder="e.g. +91 99001 23456"
                  />
                </div>

                <div>
                  <label htmlFor="modal-p-blood" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.bloodGroup}</label>
                  <select
                    id="modal-p-blood"
                    value={regForm.bloodGroup}
                    onChange={(e) => setRegForm({ ...regForm, bloodGroup: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none bg-white"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100" id="register-patient-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 active:scale-95 transition-all cursor-pointer"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Appointment Dialog Modal */}
      {isBooking && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in" id="book-appointment-modal">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold font-display text-slate-800">{t.bookAppointment}</h2>
              <button
                onClick={() => setIsBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleAppointmentSubmit(e, isBooking)} className="p-6 space-y-4" id="appointment-form">
              <div>
                <label htmlFor="modal-apt-doc" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.selectDoctor}</label>
                <select
                  id="modal-apt-doc"
                  required
                  value={aptForm.doctorId}
                  onChange={(e) => setAptForm({ ...aptForm, doctorId: e.target.value })}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none bg-white text-sm"
                >
                  <option value="">-- Choose Specialist --</option>
                  {doctors.filter(d => d.status === 'Active').map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-apt-date" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.date}</label>
                  <input
                    id="modal-apt-date"
                    type="date"
                    required
                    value={aptForm.date}
                    onChange={(e) => setAptForm({ ...aptForm, date: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="modal-apt-time" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.appointmentTime}</label>
                  <select
                    id="modal-apt-time"
                    required
                    value={aptForm.time}
                    onChange={(e) => setAptForm({ ...aptForm, time: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none bg-white font-mono"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100" id="appointment-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsBooking(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 active:scale-95 transition-all cursor-pointer"
                >
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
