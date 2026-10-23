import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Archive, 
  Search, 
  Download, 
  Trash2, 
  Printer, 
  Share2, 
  Layers, 
  Calendar, 
  HardDrive, 
  ShieldCheck, 
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { getAllVaultItems, deleteVaultItem } from '../utils/vaultStorage';
import WirelessShareModal from '../components/WirelessShareModal';

export default function VaultView({ onReopenInStudio, onTileToPrint }) {
  const [vaultItems, setVaultItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareTarget, setShareTarget] = useState(null);

  const loadVault = async () => {
    const items = await getAllVaultItems();
    setVaultItems(items);
  };

  useEffect(() => {
    loadVault();
  }, []);

  const handleDelete = async (id) => {
    triggerHaptic('warning');
    await deleteVaultItem(id);
    setVaultItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDownload = (item) => {
    triggerHaptic('success');
    const a = document.createElement('a');
    a.href = item.compositeUrl;
    a.download = `${(item.name || 'Candidate').replace(/\s+/g, '_')}_${item.sizeKB}KB.jpg`;
    a.click();
  };

  const filteredItems = vaultItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (item.name || '').toLowerCase().includes(q);
    const presetMatch = (item.examTag || '').toLowerCase().includes(q);
    const dateMatch = (item.timestamp || '').toLowerCase().includes(q);
    return nameMatch || presetMatch || dateMatch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-12">
      
      {/* Hero Header */}
      <div className="rounded-[28px] p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl shadow-slate-950/20">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/15 uppercase tracking-wider flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-emerald-400" />
            100% OFFLINE VAULT
          </span>
          <span className="text-xs font-bold text-slate-300">
            {vaultItems.length} Records Saved
          </span>
        </div>
        <h2 className="text-2xl font-black mt-2">Candidate History Vault</h2>
        <p className="text-xs text-slate-300 font-medium mt-0.5">
          Previously compiled candidate slips stored locally on device. Zero internet required.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student name, exam tag, or date..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Roster List */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-[24px] p-4 bg-white/90 backdrop-blur-xl border border-white/90 shadow-sm hover:border-slate-200 transition-all flex flex-col space-y-3"
          >
            {/* Top Snapshot Row */}
            <div className="flex items-start gap-3">
              <div className="w-14 h-18 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                <img src={item.compositeUrl} alt={item.name} className="w-full h-full object-contain" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                    {item.examTag || 'Exam Slip'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    {item.sizeKB} KB
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-900 mt-1 truncate">
                  {item.name || 'Unnamed Candidate'}
                </h3>

                <p className="text-[10px] font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.timestamp}
                </p>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                title="Delete Slip"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Action Station */}
            <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onReopenInStudio(item);
                }}
                className="py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-extrabold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <Layers className="w-3 h-3 text-blue-600" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onTileToPrint(item);
                }}
                className="py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-extrabold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <Printer className="w-3 h-3 text-emerald-600" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setShareTarget(item);
                }}
                className="py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-extrabold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <Share2 className="w-3 h-3 text-indigo-600" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload(item)}
                className="py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <Download className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="rounded-[28px] p-8 bg-white/70 border border-white/90 text-center text-slate-400">
            <Archive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Documents Found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Slips generated and exported from the Merger Studio will appear here automatically.
            </p>
          </div>
        )}
      </div>

      {/* Wireless Share Modal */}
      <WirelessShareModal
        isOpen={shareTarget !== null}
        onClose={() => setShareTarget(null)}
        imageSrc={shareTarget?.compositeUrl}
        title={shareTarget?.name || 'Candidate Slip'}
        sizeKB={shareTarget?.sizeKB || 0}
      />
    </motion.div>
  );
}
