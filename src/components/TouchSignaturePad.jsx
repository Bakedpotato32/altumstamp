import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RotateCcw, PenTool, Eraser } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export default function TouchSignaturePad({ isOpen, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState('#0f172a');
  const [penWidth, setPenWidth] = useState(3);
  const [strokeHistory, setStrokeHistory] = useState([]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setStrokeHistory([canvas.toDataURL()]);
      setHasDrawn(false);
    }
  }, [isOpen]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      setStrokeHistory((prev) => [...prev, canvasRef.current.toDataURL()]);
    }
  };

  const handleClear = () => {
    triggerHaptic('warning');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setStrokeHistory([canvas.toDataURL()]);
    setHasDrawn(false);
  };

  const handleUndo = () => {
    if (strokeHistory.length <= 1) return;
    triggerHaptic('light');
    const newHistory = strokeHistory.slice(0, -1);
    const prevImage = new Image();
    prevImage.src = newHistory[newHistory.length - 1];
    prevImage.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(prevImage, 0, 0);
      setStrokeHistory(newHistory);
      if (newHistory.length === 1) setHasDrawn(false);
    };
  };

  const handleSave = () => {
    if (!hasDrawn || !canvasRef.current) return;
    triggerHaptic('success');
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative z-10 w-full max-w-md mx-auto rounded-t-[36px] bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-16px_40px_rgba(15,23,42,0.18)] p-4 flex flex-col space-y-3 select-none"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Direct Screen Signature</h3>
                <p className="text-[10px] text-slate-500 font-semibold">Sign directly inside the box below</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative rounded-2xl border-2 border-slate-300 bg-white overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={600}
              height={220}
              className="w-full h-44 touch-none block cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 font-extrabold text-sm">
                Sign with finger or stylus here
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPenColor('#0f172a')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                  penColor === '#0f172a' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Black Ink
              </button>
              <button
                type="button"
                onClick={() => setPenColor('#1d4ed8')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                  penColor === '#1d4ed8' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Blue Ink
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[2, 3, 5].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPenWidth(w)}
                  className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center ${
                    penWidth === w ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokeHistory.length <= 1}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 active:scale-90"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-xl bg-rose-50 text-rose-600 active:scale-90"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasDrawn}
            className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${
              hasDrawn
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white shadow-indigo-600/30 active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Apply Signature</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
