import React, { useState } from 'react';
import { Pill, Search, Plus, Edit2, Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { Medicine } from '../types';
import { i18n, Language } from '../utils/i18n';

interface InventoryViewProps {
  medicines: Medicine[];
  onSaveMedicine: (medicine: Medicine) => void;
  onDeleteMedicine: (id: string) => void;
  lang: Language;
}

export default function InventoryView({ medicines, onSaveMedicine, onDeleteMedicine, lang }: InventoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isEditing, setIsEditing] = useState(false);
  const [currentMed, setCurrentMed] = useState<Partial<Medicine>>({});

  const t = i18n[lang];

  // List of unique categories
  const categories = ['All', ...new Set(medicines.map(m => m.category))];

  // Filter medicines based on search and category
  const filteredMedicines = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setCurrentMed({
      name: '',
      category: '',
      batchNumber: '',
      stock: 100,
      minStock: 50,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year out
      usageRatePerDay: 5,
      unit: 'Tablets',
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (med: Medicine) => {
    setCurrentMed(med);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMed.name && currentMed.category && currentMed.batchNumber) {
      onSaveMedicine(currentMed as Medicine);
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-3.5 animate-fade-in" id="inventory-view-root text-xs">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="inventory-header">
        <div>
          <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight">{t.inventory}</h1>
          <p className="text-[11px] text-slate-500 font-sans">Track central pharmacy stock levels, manage batch expiry dates, and trigger logistics procurement.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          id="add-med-button"
          className="flex items-center gap-1.5 bg-teal-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm hover:bg-teal-700 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.addMedicine}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col md:flex-row gap-2.5 shadow-none" id="search-filter-panel">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
            id="search-meds-field"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5" id="category-filter-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-100 text-teal-800 border border-teal-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines Table Grid */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-none overflow-hidden" id="inventory-table-panel">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Formulation / Unit</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.batchNum}</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.stockLevel}</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.usageRate}</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.expiryDate}</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-xs">
              {filteredMedicines.map((med) => {
                const isLowStock = med.stock <= med.minStock;
                const isExpiringSoon = new Date(med.expiryDate) < new Date('2026-12-31');

                return (
                  <tr key={med.id} className="hover:bg-slate-50/50 transition-colors" id={`med-row-${med.id}`}>
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-md ${isLowStock ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'}`}>
                          <Pill className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{med.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{med.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                      <span className="inline-block bg-slate-50 border border-slate-200/60 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium">
                        {med.category}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600 font-mono">{med.batchNumber}</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold font-mono text-sm ${isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                          {med.stock}
                        </span>
                        {isLowStock && (
                          <span className="bg-rose-50 border border-rose-100 text-rose-700 text-[9px] px-1 py-0.5 rounded font-bold flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" /> Low Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600 font-mono">
                      {med.usageRatePerDay} <span className="text-[10px] text-slate-400">/ day</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-slate-700 ${isExpiringSoon ? 'text-amber-600 font-bold' : ''}`}>
                          {med.expiryDate}
                        </span>
                        {isExpiringSoon && (
                          <span className="bg-amber-50 border border-amber-100 text-amber-700 text-[9px] px-1 py-0.5 rounded font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Expiring
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(med)}
                          className="p-1 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                          title={t.edit}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteMedicine(med.id)}
                          className="p-1 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
                          title={t.delete}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMedicines.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400 font-sans text-xs">
                    No medications match the specified queries. Add a new formulation to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Medicine Modal Dialog */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in" id="inventory-modal">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold font-display text-slate-800">
                {currentMed.id ? t.edit + ' ' + currentMed.name : t.addMedicine}
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4" id="medicine-form">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label htmlFor="modal-med-name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Medicine Name</label>
                  <input
                    id="modal-med-name"
                    type="text"
                    required
                    value={currentMed.name || ''}
                    onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. Paracetamol 500mg"
                  />
                </div>

                <div>
                  <label htmlFor="modal-med-cat" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.category}</label>
                  <input
                    id="modal-med-cat"
                    type="text"
                    required
                    value={currentMed.category || ''}
                    onChange={(e) => setCurrentMed({ ...currentMed, category: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. Antibiotics"
                  />
                </div>

                <div>
                  <label htmlFor="modal-med-batch" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.batchNum}</label>
                  <input
                    id="modal-med-batch"
                    type="text"
                    required
                    value={currentMed.batchNumber || ''}
                    onChange={(e) => setCurrentMed({ ...currentMed, batchNumber: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                    placeholder="e.g. AM-2026-03"
                  />
                </div>

                <div>
                  <label htmlFor="modal-med-stock" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.stockLevel}</label>
                  <input
                    id="modal-med-stock"
                    type="number"
                    min="0"
                    required
                    value={currentMed.stock || 0}
                    onChange={(e) => setCurrentMed({ ...currentMed, stock: parseInt(e.target.value) || 0 })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="modal-med-min" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.minStock}</label>
                  <input
                    id="modal-med-min"
                    type="number"
                    min="0"
                    required
                    value={currentMed.minStock || 0}
                    onChange={(e) => setCurrentMed({ ...currentMed, minStock: parseInt(e.target.value) || 0 })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="modal-med-usage" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.usageRate}</label>
                  <input
                    id="modal-med-usage"
                    type="number"
                    min="0"
                    required
                    value={currentMed.usageRatePerDay || 0}
                    onChange={(e) => setCurrentMed({ ...currentMed, usageRatePerDay: parseInt(e.target.value) || 0 })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="modal-med-unit" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.unit}</label>
                  <input
                    id="modal-med-unit"
                    type="text"
                    required
                    value={currentMed.unit || ''}
                    onChange={(e) => setCurrentMed({ ...currentMed, unit: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. Tablets"
                  />
                </div>

                <div className="col-span-2">
                  <label htmlFor="modal-med-exp" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{t.expiryDate}</label>
                  <input
                    id="modal-med-exp"
                    type="date"
                    required
                    value={currentMed.expiryDate || ''}
                    onChange={(e) => setCurrentMed({ ...currentMed, expiryDate: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100" id="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 active:scale-95 transition-all cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
