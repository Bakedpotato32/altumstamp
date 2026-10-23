import React from 'react';
import { motion } from 'framer-motion';
import { Stamp, Sparkles, FolderArchive, Plus } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export default function TopHeader({ onQuickMerge, onOpenVault }) {
  return (
    <header className="flex items-center justify-between pt-2 pb-2 px-1">
      {/* Brand & 3D Squircle Icon */}
      <div className="flex items-center gap-2.5">
        <motion.div
          whileTap={{ scale: 0.92 }}
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-2.5 shadow-lg shadow-blue-500/25 flex items-center justify-center text-white"
        >
          <Stamp className="w-6 h-6 stroke-[2.2]" />
        </motion.div>
        
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-black tracking-tight text-slate-900">
            ALTUM<span className="text-blue-600">STAMP</span>
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 tracking-wider">
            STUDIO
          </span>
        </div>
      </div>

      {/* Action Cluster */}
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => {
            triggerHaptic('light');
            onQuickMerge();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/30 active:shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New Slip</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            triggerHaptic('selection');
            onOpenVault();
          }}
          className="w-9 h-9 rounded-full bg-white/90 border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-900 active:bg-slate-100"
        >
          <FolderArchive className="w-4 h-4" />
        </motion.button>
      </div>
    </header>
  );
}
