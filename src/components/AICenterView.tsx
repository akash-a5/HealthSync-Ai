import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Brain, Send, HelpCircle, Truck, TrendingUp, Sparkles, AlertTriangle, ArrowRight, ShieldAlert, Loader2, MessageSquareCode } from 'lucide-react';
import { AIAnalysisResult, PHCCenter, Medicine } from '../types';
import { i18n, Language } from '../utils/i18n';

interface AICenterViewProps {
  phcId: string;
  phcs: PHCCenter[];
  medicines: Medicine[];
  onRefreshData: () => void;
  lang: Language;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function AICenterView({ phcId, phcs, medicines, onRefreshData, lang }: AICenterViewProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'chat'>('analytics');
  
  // Predictions state
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [predictions, setPredictions] = useState<AIAnalysisResult | null>(null);
  const [transferStatus, setTransferStatus] = useState<string | null>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am the HealthSync AI Co-Pilot. I have direct access to your local center\'s medicine inventory, doctor shifts, and bed capacity logs. How can I assist you with clinical guidelines, reordering formulations, or operational planning today?' }
  ]);
  const [sendingChat, setSendingChat] = useState(false);

  const t = i18n[lang];
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleRunAudit = async () => {
    setLoadingPredictions(true);
    setPredictions(null);
    try {
      const res = await fetch('/api/ai/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phcId }),
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data);
      } else {
        alert('Failed to generate AI predictions. Please check server logs.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error while running AI audit.');
    } finally {
      setLoadingPredictions(false);
    }
  };

  const handleExecuteTransfer = async (medName: string, sourceName: string, quantity: number) => {
    setTransferStatus(`Coordinating stock transfer of ${quantity} units of ${medName}...`);
    try {
      const sourcePHC = phcs.find(p => p.name === sourceName);
      const destPHC = phcs.find(p => p.id === phcId);

      if (!sourcePHC || !destPHC) {
        alert('Could not match source or destination health center records.');
        return;
      }

      // 1. Fetch current data to find the matching medicines
      const dataRes = await fetch('/api/data');
      if (!dataRes.ok) throw new Error('Failed to fetch data');
      const fullData = await dataRes.json();

      const sourceMed = (fullData.medicines as Medicine[]).find(
        m => m.name === medName && m.phcId === sourcePHC.id
      );
      const destMed = (fullData.medicines as Medicine[]).find(
        m => m.name === medName && m.phcId === destPHC.id
      );

      if (!sourceMed) {
        alert(`Stock transfer failed: Source center (${sourceName}) does not hold ${medName}.`);
        return;
      }

      // 2. Perform source deduction
      const updatedSourceStock = Math.max(0, sourceMed.stock - quantity);
      await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sourceMed, stock: updatedSourceStock }),
      });

      // 3. Perform destination addition (create if it doesn't exist, else add)
      if (destMed) {
        await fetch('/api/medicines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...destMed, stock: destMed.stock + quantity }),
        });
      } else {
        // Create new medicine record for destination
        const newMedRecord: Medicine = {
          id: '',
          name: sourceMed.name,
          category: sourceMed.category,
          batchNumber: sourceMed.batchNumber + '-T',
          stock: quantity,
          minStock: sourceMed.minStock,
          expiryDate: sourceMed.expiryDate,
          usageRatePerDay: sourceMed.usageRatePerDay,
          unit: sourceMed.unit,
          phcId: destPHC.id,
        };
        await fetch('/api/medicines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMedRecord),
        });
      }

      setTransferStatus(`SUCCESS: Transferred ${quantity} ${sourceMed.unit} of ${medName} from ${sourceName} to ${destPHC.name}!`);
      setTimeout(() => setTransferStatus(null), 5000);
      onRefreshData(); // Trigger client update
      
      // Re-trigger predictions to update the transfer list
      handleRunAudit();
    } catch (err) {
      console.error(err);
      alert('Error executing the inter-PHC resource transfer.');
      setTransferStatus(null);
    }
  };

  const handleSendChat = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msg = customMsg || chatInput;
    if (!msg.trim() || sendingChat) return;

    const newUserMsg: Message = { role: 'user', text: msg };
    setChatHistory(prev => [...prev, newUserMsg]);
    setChatInput('');
    setSendingChat(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          phcId,
          history: chatHistory.slice(-10), // pass recent history context
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { role: 'model', text: data.text }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'model', text: 'Error contacting AI Health Assistant server. Please try again.' }]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'model', text: 'Network failure. Ensure server is online.' }]);
    } finally {
      setSendingChat(false);
    }
  };

  const chatSuggestionChips = [
    'Are there any low stock alerts today?',
    'What preparations are needed for next week\'s footfall?',
    'Recommend doctor roster re-scheduling',
    'How do I handle a sudden surge in General Ward beds?'
  ];

  return (
    <div className="space-y-3.5 animate-fade-in" id="ai-center-view-root text-xs">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="ai-center-header">
        <div>
          <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight flex items-center gap-1.5">
            <Brain className="w-5 h-5 text-teal-600 animate-pulse" />
            {t.aiCenter}
          </h1>
          <p className="text-[11px] text-slate-500 font-sans">Core Gemini AI hub conducting automated resource planning, seasonal forecasting, and clinical decision support.</p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50" id="ai-switcher-tabs">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Predictive Analytics
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            AI Clinical Assistant
          </button>
        </div>
      </div>

      {/* VIEW 1: PREDICTIVE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-3.5" id="ai-analytics-tab-panel">
          {/* Audit CTA bar */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg p-3 text-white shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-3" id="ai-audit-cta-bar">
            <div className="space-y-0.5 max-w-xl">
              <h3 className="text-xs font-bold font-display flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Execute Live AI Operational Audit
              </h3>
              <p className="text-[11px] text-teal-50/95 font-sans leading-relaxed">
                Analyze active health center outpatients, bed capacities, schedules, and pharmaceutical stock depletion rates via **Google Gemini**. Generates supply shortages, outpatients footfall forecasts, and inter-center transport plans.
              </p>
            </div>
            <button
              onClick={handleRunAudit}
              disabled={loadingPredictions}
              id="run-ai-audit-button"
              className="flex items-center gap-1.5 bg-white text-teal-800 hover:bg-teal-55 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer min-w-[130px] justify-center"
            >
              {loadingPredictions ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5 text-teal-600" />
                  Run AI Audit
                </>
              )}
            </button>
          </div>

          {/* LOADING STATE PLACEHOLDER */}
          {loadingPredictions && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500 space-y-2 flex flex-col items-center justify-center shadow-none" id="loading-predictions-box">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <h4 className="font-bold text-slate-700 font-display text-xs">Synthesizing Clinic Log Data</h4>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">Gemini is compiling hospital inventories, doctor shift schedules, and patient arrival statistics across Karnataka centers...</p>
            </div>
          )}

          {/* INITIAL BLANK STATE */}
          {!predictions && !loadingPredictions && (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-500 flex flex-col justify-center items-center shadow-none" id="blank-predictions-box">
              <Brain className="w-10 h-10 text-slate-300 mb-2" />
              <h3 className="font-semibold text-slate-700 font-display text-xs">Predictive Suite Ready</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">Trigger the live audit button to populate shortage charts, inter-center transfers, and strategic healthcare insights via Google Gemini.</p>
            </div>
          )}

          {/* RESULTS DISPLAY PANEL */}
          {predictions && !loadingPredictions && (
            <div className="space-y-3.5 animate-fade-in" id="predictions-results-suite">
              
              {/* 1. Medicine Shortage Prediction Grid */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-none space-y-2.5" id="shortages-panel">
                <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Predicted Medicine Shortages (Next 30 Days)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5" id="shortages-cards">
                  {predictions.shortages.map((item, index) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/20 flex flex-col justify-between" id={`shortage-card-${index}`}>
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-800 text-xs font-display truncate pr-1">{item.medicineName}</h4>
                          <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                            item.severity === 'High'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : item.severity === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {item.severity} Risk
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Estimated supply: <strong className="font-mono text-slate-800">{item.daysRemaining} days</strong> remaining.
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-600 bg-white border border-slate-200/60 p-2 rounded-md leading-relaxed">
                        {item.recommendation}
                      </p>
                    </div>
                  ))}
                  {predictions.shortages.length === 0 && (
                    <p className="text-[11px] text-slate-400 col-span-3">No immediate medicine stockouts predicted. Stock is safe.</p>
                  )}
                </div>
              </div>

              {/* 2. Patient Footfall Predictions LineChart */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-none space-y-2.5" id="footfall-panel">
                <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Projected Outpatient Footfall (Next 7 Days)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5" id="footfall-grid">
                  {/* Chart */}
                  <div className="lg:col-span-2 h-64" id="footfall-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={predictions.footfall} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Line type="monotone" dataKey="predictedCount" stroke="#0d9488" strokeWidth={3} activeDot={{ r: 6 }} name="Predicted Footfall" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Explanations */}
                  <div className="lg:col-span-1 space-y-2 max-h-64 overflow-y-auto pr-1" id="footfall-trends-list">
                    {predictions.footfall.map((day, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-start gap-2" id={`footfall-item-${idx}`}>
                        <div className={`p-1 rounded text-white mt-0.5 ${
                          day.trend === 'Rising' ? 'bg-rose-500' : day.trend === 'Falling' ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}>
                          <TrendingUp className="w-3 h-3" />
                        </div>
                        <div>
                          <div className="flex justify-between items-baseline gap-1.5">
                            <span className="text-[10px] font-bold text-slate-700 font-mono">{day.date}</span>
                            <span className="text-[11px] font-extrabold text-slate-900 font-mono">{day.predictedCount} Patients</span>
                          </div>
                          <p className="text-[9px] text-slate-500 leading-relaxed mt-0.5">{day.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Inter-PHC Recommended Resource Transfer Actions */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-none space-y-2.5" id="transfers-panel">
                <div className="flex justify-between items-center" id="transfers-header">
                  <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-teal-600" /> AI Inter-PHC Stock Transfer Optimizer
                  </h3>
                  {transferStatus && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 px-2 py-0.5 rounded animate-pulse" id="transfer-status-msg">
                      {transferStatus}
                    </span>
                  )}
                </div>

                <div className="space-y-2" id="transfers-list">
                  {predictions.transfers.map((trans, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200 p-3 rounded-lg gap-3" id={`transfer-item-${idx}`}>
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="bg-teal-100/60 text-teal-700 p-2 rounded-lg shadow-none">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 text-[10px]">
                            <span className="font-bold text-slate-800">{trans.sourcePHC}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="font-bold text-teal-700">{trans.destinationPHC}</span>
                          </div>
                          <h4 className="font-bold font-display text-slate-800 text-xs">
                            Transfer: <span className="text-teal-600 font-mono font-extrabold">{trans.quantity} units</span> of {trans.medicineName}
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed truncate md:whitespace-normal">{trans.reason}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleExecuteTransfer(trans.medicineName, trans.sourcePHC, trans.quantity)}
                        className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-none transition-all active:scale-95 cursor-pointer"
                      >
                        Execute Transfer
                      </button>
                    </div>
                  ))}
                  {predictions.transfers.length === 0 && (
                    <p className="text-[11px] text-slate-400">No resource transfers required at present. Stocks are optimized.</p>
                  )}
                </div>
              </div>

              {/* 4. Strategic General Insights */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-white space-y-2.5 shadow-none" id="insights-panel">
                <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" /> Strategic Healthcare Insights
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] text-slate-300 font-sans list-inside leading-relaxed" id="insights-list">
                  {predictions.insights.map((ins, idx) => (
                    <li key={idx} className="bg-slate-950/30 border border-slate-800 p-2.5 rounded-md flex items-start gap-2 relative before:absolute before:left-0 before:top-3 before:w-0.5 before:h-4 before:bg-teal-500" id={`insight-item-${idx}`}>
                      <span className="flex-1 text-slate-300 pl-1">{ins}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}
        </div>
      )}

      {/* VIEW 2: AI CLINICAL HEALTH ASSISTANT CHATBOT */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5 animate-fade-in" id="ai-chat-tab-panel">
          
          {/* Left Suggested Chips Sidebar */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-3 shadow-none flex flex-col space-y-3" id="suggested-queries-panel">
            <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <MessageSquareCode className="w-3.5 h-3.5 text-teal-600" /> Suggested Inquiries
            </h3>
            <div className="flex flex-col gap-1.5" id="suggested-chips-list">
              {chatSuggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleSendChat(undefined, chip)}
                  className="w-full text-left p-2 rounded-md border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-[10px] font-semibold text-slate-600 transition-colors leading-relaxed cursor-pointer"
                  id={`suggestion-chip-${idx}`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="bg-teal-50/50 border border-teal-100/50 p-2.5 rounded-lg text-slate-600 text-[10px] leading-relaxed" id="assistant-description">
              The Health Assistant analyzes active inventories, hospital occupancy logs, registered patient appointments, and Karnataka medical rules to assist you.
            </div>
          </div>

          {/* Right Main Conversational Log Panel */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg shadow-none flex flex-col h-[calc(100vh-160px)]" id="chat-conversation-panel">
            {/* Conversation Log body */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scroll-smooth" id="chat-conversation-log">
              {chatHistory.map((msg, index) => {
                const isModel = msg.role === 'model';
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 max-w-[85%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                    id={`chat-msg-${index}`}
                  >
                    <div className={`p-1.5 rounded-md ${
                      isModel ? 'bg-slate-100 text-slate-800' : 'bg-teal-600 text-white shadow-sm'
                    }`}>
                      {isModel ? <Brain className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
                      isModel
                        ? 'bg-slate-50 border-slate-150 text-slate-800 rounded-tl-none font-sans'
                        : 'bg-white border-teal-100 text-slate-800 rounded-tr-none font-mono whitespace-pre-wrap'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              {sendingChat && (
                <div className="flex items-start gap-2.5 mr-auto" id="chat-typing-loader">
                  <div className="bg-slate-100 p-1.5 rounded-md text-slate-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-400 font-sans rounded-tl-none italic">
                    Co-pilot is compiling clinic state...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form Bar */}
            <form onSubmit={handleSendChat} className="border-t border-slate-200 p-2 flex gap-2 bg-slate-50/50" id="chat-input-form">
              <input
                type="text"
                placeholder={t.askAI}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="block flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white shadow-none"
                id="chat-text-field"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || sendingChat}
                className="bg-teal-600 disabled:opacity-50 text-white hover:bg-teal-700 p-2 rounded-md shadow-none transition-all active:scale-95 cursor-pointer"
                id="chat-send-button"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
