import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, BedDouble, ShieldAlert, Pill, CalendarClock } from 'lucide-react';
import { Medicine, Bed, Doctor, Patient } from '../types';
import { i18n, Language } from '../utils/i18n';

interface DashboardViewProps {
  medicines: Medicine[];
  beds: Bed[];
  doctors: Doctor[];
  patients: Patient[];
  lang: Language;
}

export default function DashboardView({ medicines, beds, doctors, patients, lang }: DashboardViewProps) {
  const t = i18n[lang];

  // Calculations for KPI Cards
  const totalPatientsCount = patients.length;
  const availableBedsCount = beds.filter(b => b.status === 'Available').length;
  const totalBedsCount = beds.length;
  const activeDoctorsCount = doctors.filter(d => d.status === 'Active').length;
  const totalDoctorsCount = doctors.length;
  const lowStockItems = medicines.filter(m => m.stock <= m.minStock);
  const totalMedicineStock = medicines.reduce((sum, m) => sum + m.stock, 0);

  // Expiring items (within next 6 months of current time 2026-06-27)
  const expiringSoonItems = medicines.filter(m => {
    const exp = new Date(m.expiryDate);
    const limit = new Date('2026-12-31');
    return exp <= limit;
  });

  // Chart 1 Data: Patient Registration Trends (Past months)
  const patientTrendData = [
    { month: 'Jan', outpatients: 45, emergencies: 12 },
    { month: 'Feb', outpatients: 52, emergencies: 15 },
    { month: 'Mar', outpatients: 68, emergencies: 22 },
    { month: 'Apr', outpatients: 85, emergencies: 18 },
    { month: 'May', outpatients: 95, emergencies: 30 },
    { month: 'Jun', outpatients: totalPatientsCount * 25, emergencies: 28 }, // Proportional to active patient registry
  ];

  // Chart 2 Data: Bed Allocation (ICU vs General - Occupied vs Available)
  const icuOccupied = beds.filter(b => b.type === 'ICU' && b.status === 'Occupied').length;
  const icuAvailable = beds.filter(b => b.type === 'ICU' && b.status === 'Available').length;
  const generalOccupied = beds.filter(b => b.type === 'General' && b.status === 'Occupied').length;
  const generalAvailable = beds.filter(b => b.type === 'General' && b.status === 'Available').length;

  const bedChartData = [
    { name: 'ICU Occupied', value: icuOccupied, color: '#f59e0b' },
    { name: 'ICU Available', value: icuAvailable, color: '#10b981' },
    { name: 'Gen Occupied', value: generalOccupied, color: '#f43f5e' },
    { name: 'Gen Available', value: generalAvailable, color: '#3b82f6' },
  ].filter(item => item.value > 0);

  // Chart 3 Data: Medicine Stock Levels vs Min Stock Level (Top 5 medicines)
  const medicineChartData = medicines.slice(0, 5).map(m => ({
    name: m.name.split(' ')[0], // short name
    Stock: m.stock,
    AlertThreshold: m.minStock,
  }));

  // Chart 4 Data: Doctor Attendance Rates
  // Calculates average attendance percentage per doctor based on log history
  const doctorAttendanceData = doctors.map(d => {
    const totalDays = d.attendance.length || 1;
    const presentDays = d.attendance.filter(a => a.present).length;
    return {
      name: d.name.split(' ')[1] || d.name, // Last name
      AttendanceRate: Math.round((presentDays / totalDays) * 100),
    };
  });

  return (
    <div className="space-y-3.5 animate-fade-in" id="dashboard-view-root text-xs">
      {/* Title block */}
      <div id="dashboard-title-block" className="flex flex-col gap-0.5">
        <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight">{t.dashboard}</h1>
        <p className="text-[11px] text-slate-500 font-sans">Real-time indicators and predictive hospital management metrics.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" id="kpi-cards-grid">
        {/* Patients Card */}
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-none" id="kpi-patients-card">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t.totalPatients}</span>
            <div className="text-lg font-bold text-slate-900 leading-tight">{totalPatientsCount}</div>
            <span className="text-[10px] text-emerald-600 font-medium font-mono">+12% vs last week</span>
          </div>
          <div className="bg-teal-500/10 p-2 rounded-lg text-teal-600">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Beds Card */}
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-none" id="kpi-beds-card">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t.availableBeds}</span>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {availableBedsCount} <span className="text-xs font-medium text-slate-400">/ {totalBedsCount}</span>
            </div>
            <span className="text-[10px] text-amber-600 font-medium font-mono">
              {beds.filter(b => b.type === 'ICU' && b.status === 'Available').length} ICU Vacant
            </span>
          </div>
          <div className="bg-blue-500/10 p-2 rounded-lg text-blue-600">
            <BedDouble className="w-4 h-4" />
          </div>
        </div>

        {/* Doctors Card */}
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-none" id="kpi-doctors-card">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t.activeDoctors}</span>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {activeDoctorsCount} <span className="text-xs font-medium text-slate-400">/ {totalDoctorsCount}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {doctors.filter(d => d.status === 'Off Duty').length} Off Duty
            </span>
          </div>
          <div className="bg-amber-500/10 p-2 rounded-lg text-amber-600">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Medicines Stock Card */}
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-none" id="kpi-meds-card">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t.medicineStock}</span>
            <div className="text-lg font-bold text-slate-900 leading-tight">{totalMedicineStock.toLocaleString()}</div>
            <span className="text-[10px] text-rose-500 font-semibold font-mono flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> {lowStockItems.length} Low Stock
            </span>
          </div>
          <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600">
            <Pill className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Critical Action Center Alerts (Low Stock / Expiring Medicines) */}
      {(lowStockItems.length > 0 || expiringSoonItems.length > 0) && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" id="alerts-grid">
          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2.5" id="low-stock-alert-panel">
              <div className="bg-rose-100 p-1.5 rounded text-rose-600 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-rose-900">{t.lowStockAlerts}</h3>
                <p className="text-[11px] text-rose-700 mt-0.5">Below safe storage parameters:</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {lowStockItems.map(m => (
                    <span key={m.id} className="inline-flex items-center gap-1 bg-white border border-rose-200 text-rose-800 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                      {m.name}: <strong className="font-mono">{m.stock}</strong> left
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Expiring Soon Alerts */}
          {expiringSoonItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5" id="expiry-alert-panel">
              <div className="bg-amber-100 p-1.5 rounded text-amber-700 mt-0.5">
                <CalendarClock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-amber-900">{t.expiringSoon}</h3>
                <p className="text-[11px] text-amber-700 mt-0.5">Expiring soon batches:</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {expiringSoonItems.map(m => (
                    <span key={m.id} className="inline-flex items-center gap-1 bg-white border border-amber-200 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                      {m.name} - Exp: <strong className="font-mono">{m.expiryDate}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2" id="dashboard-charts-grid">
        {/* Chart 1: Outpatient Arrival Trends */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2" id="chart-outpatient-panel">
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">{t.patientTrends}</h3>
          <div className="h-48" id="outpatient-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patientTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOutpatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEmergencies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 9 }} />
                <Area type="monotone" dataKey="outpatients" stroke="#0d9488" strokeWidth={1.5} fillOpacity={1} fill="url(#colorOutpatients)" name="Regular Outpatients" />
                <Area type="monotone" dataKey="emergencies" stroke="#f43f5e" strokeWidth={1.5} fillOpacity={1} fill="url(#colorEmergencies)" name="Emergency Cases" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bed Capacity Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2" id="chart-bed-panel">
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">{t.bedOccupancy}</h3>
          <div className="h-48 flex flex-row items-center justify-around" id="bed-chart-container">
            {bedChartData.length > 0 ? (
              <>
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bedChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {bedChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Beds`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {bedChartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-[10px]">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-slate-600 font-semibold">{item.name}:</span>
                      <span className="font-bold text-slate-800 font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-[10px]">No bed records found.</div>
            )}
          </div>
        </div>

        {/* Chart 3: Pharmacy Levels Comparison */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2" id="chart-pharmacy-panel">
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">{t.medicineUsage} (Top Formulations)</h3>
          <div className="h-48" id="pharmacy-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={medicineChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="Stock" fill="#0d9488" radius={[2, 2, 0, 0]} name="Current Stock" />
                <Bar dataKey="AlertThreshold" fill="#f43f5e" radius={[2, 2, 0, 0]} name="Min Threshold Alert" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Doctor Attendance Performance */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2" id="chart-attendance-panel">
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">{t.attendanceRate} (%)</h3>
          <div className="h-48" id="attendance-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorAttendanceData} layout="vertical" margin={{ top: 5, right: 5, left: -5, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} width={60} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${value}%`]} contentStyle={{ fontSize: 10, borderRadius: 6 }} />
                <Bar dataKey="AttendanceRate" fill="#3b82f6" radius={[0, 2, 2, 0]} name="Attendance %" barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
