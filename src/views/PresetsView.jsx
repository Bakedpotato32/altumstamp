import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Search, 
  Check, 
  ChevronRight, 
  ShieldCheck, 
  FileCheck, 
  Layers, 
  Sliders, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { EXAM_PRESETS_CATALOG } from '../utils/presetsData';

export default function PresetsView({ activePresetId, onSelectPreset }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const categories = [
    { id: 'all', label: 'All Exams' },
    { id: 'state_board', label: 'UPMSP & Boards' },
    { id: 'central', label: 'SSC & Railway' },
    { id: 'police', label: 'Police Bharti' },
    { id: 'entrance', label: 'NEET / JEE' },
    { id: 'id_docs', label: 'PAN & Tax' }
  ];

  const filteredPresets = EXAM_PRESETS_CATALOG.filter((preset) => {
    const matchesSearch = 
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.authority.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.badge.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleApply = (preset) => {
    triggerHaptic('success');
    onSelectPreset(preset);
  };

  const toggleExpand = (id) => {
    triggerHaptic('light');
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-12">
      
      {/* Hero Card */}
      <div className="rounded-[28px] p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-600/25">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-wider">
            GOVT CATALOG
          </span>
          <span className="text-xs font-bold text-indigo-100">Batch 2026–2027</span>
        </div>
        <h2 className="text-2xl font-black mt-2">Exam Portal Presets</h2>
        <p className="text-xs text-indigo-100 font-medium mt-0.5">
          One-tap verified dimension, split ratio, and KB cap configurations.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search UP Board, SSC, Police, NEET, PAN..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200/90 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setSelectedCategory(cat.id);
              }}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Presets Grid */}
      <div className="space-y-3">
        {filteredPresets.map((preset) => {
          const isSelected = activePresetId === preset.id;
          const isExpanded = expandedId === preset.id;

          return (
            <div
              key={preset.id}
              className={`rounded-[24px] bg-white/90 backdrop-blur-xl border transition-all shadow-sm ${
                isSelected 
                  ? 'border-blue-500 ring-2 ring-blue-500/20' 
                  : 'border-white/90 hover:border-slate-200'
              }`}
            >
              {/* Main Preset Item Header */}
              <div 
                onClick={() => toggleExpand(preset.id)}
                className="p-4 cursor-pointer flex items-center justify-between"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                      {preset.badge}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      • {preset.authority}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 mt-1 truncate">
                    {preset.name}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mt-0.5">
                    <span className="text-emerald-600 font-extrabold">≤ {preset.targetKB} KB</span>
                    <span>•</span>
                    <span>{preset.width} × {preset.height} px</span>
                    <span>•</span>
                    <span>{preset.typeLabel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSelected && (
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                  <ChevronRight 
                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                  />
                </div>
              </div>

              {/* Expandable Specifications & Official Rules */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3 overflow-hidden"
                  >
                    {/* Rules Checklist */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                        <Info className="w-3 h-3 text-blue-600" />
                        PORTAL REQUIREMENTS CHECKLIST
                      </p>
                      <div className="space-y-1">
                        {preset.requirements.map((req, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technical Parameter Pills */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center">
                      <div>
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase">CEILING</p>
                        <p className="text-xs font-black text-slate-800 mt-0.5">≤ {preset.maxKB} KB</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase">PHOTO RATIO</p>
                        <p className="text-xs font-black text-slate-800 mt-0.5">{preset.photoRatio}% Photo</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase">DIVIDER</p>
                        <p className="text-xs font-black text-slate-800 mt-0.5">{preset.divider ? 'Mandatory' : 'None'}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => handleApply(preset)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white font-black text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Apply {preset.name} to Merger Studio</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredPresets.length === 0 && (
          <div className="rounded-[28px] p-8 bg-white/70 border border-white/90 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Portal Presets Found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different term.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
