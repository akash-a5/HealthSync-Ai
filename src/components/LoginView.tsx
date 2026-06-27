import React, { useState } from 'react';
import { ShieldCheck, Activity, Languages, Building2 } from 'lucide-react';
import { PHCCenter, User } from '../types';
import { i18n, Language } from '../utils/i18n';

interface LoginViewProps {
  phcs: PHCCenter[];
  onLogin: (user: User) => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export default function LoginView({ phcs, onLogin, lang, setLang }: LoginViewProps) {
  const [selectedPhc, setSelectedPhc] = useState(phcs[0]?.id || 'phc_1');
  const [role, setRole] = useState<'Admin' | 'Doctor' | 'InventoryManager'>('Admin');
  const [username, setUsername] = useState('admin_demo');
  const [password, setPassword] = useState('••••••••');

  const t = i18n[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      username,
      role,
      name: role === 'Admin' ? 'Dr. Satish Gowda (Admin)' : role === 'Doctor' ? 'Dr. Aarav Mehta' : 'Kumar Swamy (Inventory)',
      phcId: selectedPhc,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-6 sm:px-6 lg:px-8 relative overflow-hidden text-xs" id="login-view-container">
      {/* Background Decorative Circles */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-none z-10" id="lang-switcher">
        <Languages className="w-3.5 h-3.5 text-slate-500" />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Language)}
          className="text-[11px] font-medium text-slate-700 outline-none cursor-pointer"
          id="lang-select"
        >
          <option value="en">English</option>
          <option value="kn">ಕನ್ನಡ (Kannada)</option>
          <option value="hi">हिन्दी (Hindi)</option>
        </select>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm animate-fade-in z-10">
        <div className="flex justify-center items-center gap-1.5">
          <div className="bg-teal-600 p-1.5 rounded-lg text-white shadow-none">
            <Activity className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-slate-900">{t.appName}</span>
        </div>
        <h2 className="mt-3 text-center text-lg font-display font-bold tracking-tight text-slate-900" id="login-header">
          {t.loginTitle}
        </h2>
        <p className="mt-0.5 text-center text-xs text-slate-500 font-sans">
          {t.loginSubtitle}
        </p>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-sm animate-fade-in [animation-delay:100ms] z-10">
        <div className="bg-white py-5 px-4 border border-slate-200 shadow-none rounded-lg sm:px-8">
          <form className="space-y-3.5" onSubmit={handleSubmit} id="login-form">
            {/* Center Selection */}
            <div>
              <label htmlFor="phc-select-field" className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                {t.currentCenter}
              </label>
              <div className="mt-1">
                <select
                  id="phc-select-field"
                  value={selectedPhc}
                  onChange={(e) => setSelectedPhc(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-slate-900 shadow-none focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white"
                >
                  {phcs.map((phc) => (
                    <option key={phc.id} value={phc.id}>
                      {phc.name} ({phc.type} - {phc.location})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role-select-field" className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                {t.role}
              </label>
              <div className="mt-1">
                <select
                  id="role-select-field"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-slate-900 shadow-none focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white"
                >
                  <option value="Admin">{t.admin}</option>
                  <option value="Doctor">{t.doctor}</option>
                  <option value="InventoryManager">{t.inventoryManager}</option>
                </select>
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username-field" className="block text-xs font-semibold text-slate-700">
                {t.username}
              </label>
              <div className="mt-1">
                <input
                  id="username-field"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-slate-900 shadow-none focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password-field" className="block text-xs font-semibold text-slate-700">
                {t.password}
              </label>
              <div className="mt-1">
                <input
                  id="password-field"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-slate-900 shadow-none focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                id="login-submit-button"
                className="flex w-full justify-center rounded-md border border-transparent bg-teal-600 py-1.5 px-3 text-xs font-semibold text-white shadow-none hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all cursor-pointer active:scale-[0.98]"
              >
                {t.loginButton}
              </button>
            </div>
          </form>

          {/* Quick Info Box */}
          <div className="mt-4 bg-slate-50 rounded-lg p-2.5 border border-slate-200" id="login-info-box">
            <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Demo Access Credentials</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Select any role and medical center to access. No password is required. Ideal for clinical administrators, medical practitioners, and warehouse managers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
