import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Wand2, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight 
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export default function AdjustModal({
  isOpen,
  onClose,
  title,
  type = 'photo', // 'photo' or 'signature'
  transform,
  setTransform,
  threshold,
  setThreshold,
  inkColor,
  setInkColor,
}) {
  if (!isOpen) return null;

  const handleZoom = (delta) => {
    triggerHaptic('light');
    setTransform((prev) => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(3, +(prev.zoom + delta).toFixed(2))),
    }));
  };

  const handleRotate = () => {
    triggerHaptic('selection');
    setTransform((prev) => ({
      ...prev,
      rotate: (prev.rotate + 90) % 360,
    }));
  };

  const handlePan = (dx, dy) => {
    triggerHaptic('light');
    setTransform((prev) => ({
      ...prev,
      panX: prev.panX + dx,
      panY: prev.panY + dy,
    }));
  };

  const handleReset = () => {
    triggerHaptic('warning');
    setTransform({ zoom: 1, panX: 0, panY: 0, rotate: 0 });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Drawer */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          className="relative z-10 w-full max-w-md mx-auto rounded-t-[32px] bg-white/95 backdrop-blur-2xl border-t border-white/90 p-5 shadow-2xl flex flex-col space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 font-medium">Fine-tune positioning & clarity</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom & Rotate Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <label className="block text-[11px] font-bold text-slate-600 mb-2">
                Scale: {Math.round(transform.zoom * 100)}%
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleZoom(-0.1)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 active:scale-90"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={transform.zoom}
                  onChange={(e) =>
                    setTransform((p) => ({ ...p, zoom: Number(e.target.value) }))
                  }
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => handleZoom(0.1)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 active:scale-90"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <label className="block text-[11px] font-bold text-slate-600">Rotation</label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleRotate}
                  className="flex-1 py-2 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>{transform.rotate}°</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-2 rounded-xl bg-slate-200/70 text-slate-600 font-bold text-xs active:scale-95"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Precision 4-Way Pan Nudge */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">Position Nudge</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePan(-10, 0)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 active:scale-90"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handlePan(0, -10)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 active:scale-90"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handlePan(0, 10)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 active:scale-90"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handlePan(10, 0)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 active:scale-90"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Signature Specific: Paper Bleach & Ink Darkness Dial */}
          {type === 'signature' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black text-amber-900">Paper Bleach Threshold</span>
                </div>
                <span className="text-xs font-black text-amber-700">{threshold}</span>
              </div>

              <input
                type="range"
                min="100"
                max="230"
                value={threshold}
                onChange={(e) => {
                  triggerHaptic('light');
                  setThreshold(Number(e.target.value));
                }}
                className="w-full accent-amber-600 h-2 bg-amber-200/60 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-amber-800">Ink Color</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      triggerHaptic('selection');
                      setInkColor('black');
                    }}
                    className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                      inkColor === 'black'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Carbon Black
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic('selection');
                      setInkColor('blue');
                    }}
                    className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                      inkColor === 'blue'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Royal Blue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Done Confirmation */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Apply Adjustments</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
