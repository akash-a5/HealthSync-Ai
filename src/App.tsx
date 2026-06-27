import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Pill,
  BedDouble,
  Users,
  Brain,
  LogOut,
  Activity,
  Languages,
  ShieldCheck,
  Building2
} from 'lucide-react';

import { User, Medicine, Bed, Doctor, Patient, PHCCenter } from './types';
import { i18n, Language } from './utils/i18n';

// Import our modular subviews
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import BedsView from './components/BedsView';
import DoctorsView from './components/DoctorsView';
import PatientsView from './components/PatientsView';
import AICenterView from './components/AICenterView';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'beds' | 'doctors' | 'patients' | 'aiCenter'>('dashboard');

  // DB Collection States
  const [phcs, setPhcs] = useState<PHCCenter[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const t = i18n[lang];

  // Fetch Connected PHCs on mount
  useEffect(() => {
    async function fetchPHCs() {
      try {
        const res = await fetch('/api/phcs');
        if (res.ok) {
          const data = await res.json();
          setPhcs(data);
        }
      } catch (err) {
        console.error('Failed to fetch health centers.', err);
      }
    }
    fetchPHCs();
  }, []);

  // Sync data whenever user logs in or switches centers
  const syncData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/data?phcId=${user.phcId}`);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
        setBeds(data.beds || []);
        setDoctors(data.doctors || []);
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error('Error synchronizing database.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncData();
  }, [user]);

  // --- API Mutators ---

  const handleSaveMedicine = async (med: Medicine) => {
    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...med, phcId: user?.phcId }),
      });
      if (res.ok) {
        syncData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this medication from inventory?')) return;
    try {
      const res = await fetch(`/api/medicines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        syncData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBedStatus = async (id: string, status: 'Available' | 'Occupied', patientId?: string, patientName?: string) => {
    try {
      const res = await fetch('/api/beds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, patientId, patientName }),
      });
      if (res.ok) {
        syncData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDoctor = async (doc: Doctor) => {
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...doc, phcId: user?.phcId }),
      });
      if (res.ok) {
        syncData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogAttendance = async (doctorId: string, date: string, present: boolean) => {
    try {
      const res = await fetch(`/api/doctors/${doctorId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, present }),
      });
      if (res.ok) {
        syncData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterPatient = async (patient: Patient) => {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patient, phcId: user?.phcId }),
      });
      if (res.ok) {
        syncData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDiagnosis = async (patientId: string, diagnosis: string, treatment: string, doctorName: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosis, treatment, doctorName }),
      });
      if (res.ok) {
        syncData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookAppointment = async (patientId: string, doctorId: string, date: string, time: string) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, doctorId, date, time }),
      });
      if (res.ok) {
        syncData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCenterChange = (centerId: string) => {
    if (user) {
      setUser({ ...user, phcId: centerId });
    }
  };

  // Render view conditionally
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView medicines={medicines} beds={beds} doctors={doctors} patients={patients} lang={lang} />;
      case 'inventory':
        return <InventoryView medicines={medicines} onSaveMedicine={handleSaveMedicine} onDeleteMedicine={handleDeleteMedicine} lang={lang} />;
      case 'beds':
        return <BedsView beds={beds} patients={patients} onUpdateBedStatus={handleUpdateBedStatus} lang={lang} />;
      case 'doctors':
        return <DoctorsView doctors={doctors} onSaveDoctor={handleSaveDoctor} onLogAttendance={handleLogAttendance} lang={lang} />;
      case 'patients':
        return <PatientsView patients={patients} doctors={doctors} onRegisterPatient={handleRegisterPatient} onAddDiagnosis={handleAddDiagnosis} onBookAppointment={handleBookAppointment} lang={lang} />;
      case 'aiCenter':
        return <AICenterView phcId={user?.phcId || 'phc_1'} phcs={phcs} medicines={medicines} onRefreshData={syncData} lang={lang} />;
      default:
        return <DashboardView medicines={medicines} beds={beds} doctors={doctors} patients={patients} lang={lang} />;
    }
  };

  // Render Login gateway first if unauthenticated
  if (!user) {
    return <LoginView phcs={phcs} onLogin={setUser} lang={lang} setLang={setLang} />;
  }

  const activePHCObject = phcs.find(p => p.id === user.phcId);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-xs" id="app-root">
      
      {/* 1. SIDEBAR NAVIGATION CONTROLS */}
      <div className="hidden md:flex md:w-56 md:flex-col bg-slate-900 border-r border-slate-800 text-slate-300" id="app-sidebar">
        {/* Brand Header */}
        <div className="h-11 flex items-center gap-2 px-4 border-b border-slate-800" id="sidebar-header">
          <div className="bg-teal-500 p-1.5 rounded-lg text-white shadow-md shadow-teal-500/10">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <span className="font-display font-bold text-sm text-white tracking-tight">{t.appName}</span>
        </div>

        {/* Tab Items */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1" id="sidebar-tabs-list">
          {[
            { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
            { id: 'inventory', label: t.inventory, icon: Pill },
            { id: 'beds', label: t.beds, icon: BedDouble },
            { id: 'doctors', label: t.doctors, icon: Users },
            { id: 'patients', label: t.patients, icon: Users },
            { id: 'aiCenter', label: t.aiCenter, icon: Brain, highlight: true },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? tab.highlight
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-800 text-white'
                    : tab.highlight
                    ? 'hover:bg-slate-800 text-teal-400'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                id={`sidebar-tab-btn-${tab.id}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'scale-110' : ''}`} />
                <span>{tab.label}</span>
                {tab.highlight && !isSelected && (
                  <span className="ml-auto bg-teal-500/10 text-teal-400 text-[8px] px-1 py-0.5 rounded-full uppercase tracking-wider font-extrabold animate-pulse">AI</span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Workspace Profile Footer */}
        <div className="p-2.5 px-3 border-t border-slate-800 flex items-center justify-between" id="sidebar-footer">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-slate-800 p-1.5 rounded-lg text-teal-500">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-mono truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => setUser(null)}
            className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            title={t.logout}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTAINER PANEL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" id="app-content-panel">
        
        {/* Top Header Controls */}
        <header className="h-11 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-10" id="app-header">
          {/* Active Center Indicator Selector */}
          <div className="flex items-center gap-2" id="header-center-selector">
            <div className="bg-teal-50 text-teal-600 p-1.5 rounded-lg">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">{t.currentCenter}:</span>
              <select
                value={user.phcId}
                onChange={(e) => handleCenterChange(e.target.value)}
                className="text-xs font-bold font-display text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
                id="header-center-select"
              >
                {phcs.map((phc) => (
                  <option key={phc.id} value={phc.id}>
                    {phc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Header Panel Options */}
          <div className="flex items-center gap-3" id="header-options-panel">
            {/* Language Selection */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/50 px-2 py-1 rounded-md" id="header-lang-picker">
              <Languages className="w-3 h-3 text-slate-400" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="text-[11px] font-semibold text-slate-600 bg-transparent outline-none cursor-pointer"
                id="header-lang-select"
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>

            {/* Mobile Sidebar Trigger Indicator */}
            <div className="md:hidden flex items-center gap-1.5 bg-slate-900 text-white rounded-lg px-2 py-1 cursor-pointer" id="mobile-navigation-picker">
              <Activity className="w-3.5 h-3.5" />
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="text-[11px] font-bold bg-transparent border-none outline-none cursor-pointer"
                id="mobile-tab-select"
              >
                <option value="dashboard" className="text-slate-800">{t.dashboard}</option>
                <option value="inventory" className="text-slate-800">{t.inventory}</option>
                <option value="beds" className="text-slate-800">{t.beds}</option>
                <option value="doctors" className="text-slate-800">{t.doctors}</option>
                <option value="patients" className="text-slate-800">{t.patients}</option>
                <option value="aiCenter" className="text-slate-800">{t.aiCenter}</option>
              </select>
            </div>

            {/* Mobile Sign Out */}
            <button
              onClick={() => setUser(null)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              title={t.logout}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Sync loading spinner */}
        {loading ? (
          <div className="flex-1 bg-slate-50 flex flex-col justify-center items-center gap-2" id="loading-spinner-panel">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[11px] text-slate-400 font-medium">Synchronizing medical charts...</p>
          </div>
        ) : (
          /* Scrollable Content wrapper with AnimatePresence transitions */
          <main className="flex-1 overflow-y-auto p-3.5 bg-slate-50" id="main-content-scroll">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + '-' + user.phcId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                id="active-view-animator"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        )}
      </div>

    </div>
  );
}
