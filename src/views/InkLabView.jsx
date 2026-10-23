import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  PenTool, 
  Download, 
  Sparkles,
  ArrowRight,
  Layers,
  Trash2
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { processSignatureInk, compressToStrictKB } from '../utils/canvasEngine';
import TouchSignaturePad from '../components/TouchSignaturePad';

export default function InkLabView({ onApplyToStudio }) {
  const [sourceImg, setSourceImg] = useState(null);
  const [processedImg, setProcessedImg] = useState(null);
  const [isPadOpen, setIsPadOpen] = useState(false);

  const [threshold, setThreshold] = useState(175);
  const [inkColor, setInkColor] = useState('black');
  const [targetKB, setTargetKB] = useState(15);
  const [activeKB, setActiveKB] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!sourceImg) {
      setProcessedImg(null);
      return;
    }

    processSignatureInk(sourceImg, { threshold, inkColor, enabled: true })
      .then(async (cleaned) => {
        const img = new Image();
        img.src = cleaned;
        await new Promise((res) => (img.onload = res));

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const result = compressToStrictKB(canvas, targetKB, 'image/jpeg');
        setProcessedImg(result.dataUrl);
        setActiveKB(result.kb);
      })
      .catch(console.error);
  }, [sourceImg, threshold, inkColor, targetKB]);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerHaptic('light');
      const reader = new FileReader();
      reader.onload = (ev) => setSourceImg(ev.target.result);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDownload = () => {
    if (!processedImg) return;
    triggerHaptic('success');
    const a = document.createElement('a');
    a.href = processedImg;
    a.download = `Cleaned_Signature_${activeKB}KB.jpg`;
    a.click();
  };

  const handleTransferToStudio = () => {
    if (!processedImg) return;
    triggerHaptic('success');
    onApplyToStudio(processedImg);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-12">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload} 
        onClick={(e) => { e.target.value = ''; }}
        accept="image/*" 
        className="hidden" 
      />

      <div className="rounded-[28px] p-5 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 text-white shadow-xl shadow-rose-500/25">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-wider">
            LAB ENGINE
          </span>
          <span className="text-xs font-bold text-rose-100">SSC & Govt Compliant</span>
        </div>
        <h2 className="text-2xl font-black mt-2">Signature Ink Lab</h2>
        <p className="text-xs text-rose-100 font-medium mt-0.5">
          Bleach notebook rule-lines, eliminate shadows, or sign on-screen.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-4 rounded-3xl bg-white/80 border border-white/90 shadow-sm flex flex-col items-center justify-center text-center active:scale-95 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
            <Upload className="w-6 h-6" />
          </div>
          <span className="text-xs font-black text-slate-800">Upload Photo</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Paper / notebook scan</span>
        </button>

        <button
          type="button"
          onClick={() => setIsPadOpen(true)}
          className="p-4 rounded-3xl bg-white/80 border border-white/90 shadow-sm flex flex-col items-center justify-center text-center active:scale-95 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
            <PenTool className="w-6 h-6" />
          </div>
          <span className="text-xs font-black text-slate-800">Draw On Screen</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Direct stylus / touch sign</span>
        </button>
      </div>

      {processedImg ? (
        <div className="rounded-[28px] p-5 bg-white/80 backdrop-blur-xl border border-white/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-extrabold text-slate-800">Cleaned & Bleached Ink</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                {activeKB} KB (≤ {targetKB} KB)
              </span>
              <button
                type="button"
                onClick={() => setSourceImg(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="w-full h-36 rounded-2xl bg-white border border-slate-200 p-3 flex items-center justify-center shadow-inner">
            <img src={processedImg} alt="Processed Signature" className="max-h-full max-w-full object-contain" />
          </div>

          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Background Paper Bleach Sensitivity</span>
                <span className="text-rose-600">{threshold}</span>
              </div>
              <input
                type="range"
                min="120"
                max="220"
                value={threshold}
                onChange={(e) => {
                  triggerHaptic('light');
                  setThreshold(Number(e.target.value));
                }}
                className="w-full accent-rose-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Target File Limit</span>
                <span className="text-blue-600 font-black">{targetKB} KB</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={targetKB}
                onChange={(e) => {
                  triggerHaptic('light');
                  setTargetKB(Number(e.target.value));
                }}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700">Ink Tone</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setInkColor('black');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                    inkColor === 'black' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Carbon Black
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setInkColor('blue');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                    inkColor === 'blue' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Royal Blue
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleTransferToStudio}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Use this Signature in Merger Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Standalone Sign ({activeKB} KB)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] p-8 bg-white/70 border border-white/90 text-center text-slate-400">
          <PenTool className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No Signature Loaded</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Upload a photo of a written signature or tap 'Draw On Screen' above.
          </p>
        </div>
      )}

      <TouchSignaturePad
        isOpen={isPadOpen}
        onClose={() => setIsPadOpen(false)}
        onSave={(dataUrl) => setSourceImg(dataUrl)}
      />
    </motion.div>
  );
}
