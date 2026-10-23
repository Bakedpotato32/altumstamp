import React from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, 
  PenTool, 
  Sliders, 
  Award, 
  Printer, 
  Archive 
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export default function BottomDock({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'studio', label: 'Studio', icon: Layers },
    { id: 'ink', label: 'Ink Lab', icon: PenTool },
    { id: 'compress', label: 'Compress', icon: Sliders },
    { id: 'presets', label: 'Presets', icon: Award },
    { id: 'print', label: 'Print A4', icon: Printer },
    { id: 'vault', label: 'Vault', icon: Archive },
  ];

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-sm rounded-full bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_12px_36px_rgba(15,23,42,0.14)] p-1.5 flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab(tab.id);
              }}
              className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all group"
            >
              {/* Active Soft Blue Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeDockPillLight"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-blue-50/90 border border-blue-200/90 rounded-full shadow-sm"
                />
              )}

              <Icon
                className={`w-[18px] h-[18px] transition-all relative z-10 ${
                  isActive ? 'text-blue-600 stroke-[2.5] scale-105' : 'text-slate-400 stroke-[1.8] group-hover:text-slate-600'
                }`}
              />
              
              <span
                className={`text-[9px] mt-0.5 tracking-tight relative z-10 transition-colors ${
                  isActive ? 'text-blue-600 font-extrabold' : 'text-slate-400 font-semibold'
                }`}
              >
                {tab.label}
              </span>

              {/* Active Center Blue Dot */}
              {isActive && (
                <motion.div 
                  layoutId="activeDockDot"
                  className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5 relative z-10" 
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
