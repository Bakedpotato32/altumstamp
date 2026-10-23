import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Upload, 
  Download, 
  Share2, 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Trash2,
  HardDrive,
  Maximize2
} from 'lucide-react';
import jsPDF from 'jspdf';
import { triggerHaptic } from '../utils/haptics';
import { compressToStrictKB } from '../utils/canvasEngine';

export default function CompressView() {
  const [sourceImage, setSourceImage] = useState(null);
  const [originalKB, setOriginalKB] = useState(0);
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [activeKB, setActiveKB] = useState(0);

  // Compression Controls
  const [targetKB, setTargetKB] = useState(100);
  const [format, setFormat] = useState('image/jpeg'); // 'image/jpeg', 'image/webp', 'image/png', 'application/pdf'
  const [maxDimension, setMaxDimension] = useState('original'); // 'original', 1200, 800, 600
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef(null);

  // Live Compression Engine
  const runCompression = async (imgSrc, target, fmt, maxDim) => {
    if (!imgSrc) return;
    setIsProcessing(true);
    try {
      const img = new Image();
      img.src = imgSrc;
      await new Promise((res) => (img.onload = res));

      let targetW = img.naturalWidth || img.width;
      let targetH = img.naturalHeight || img.height;

      // Apply max dimension constraint if selected
      if (maxDim !== 'original') {
        const maxVal = Number(maxDim);
        if (targetW > maxVal || targetH > maxVal) {
          if (targetW > targetH) {
            targetH = Math.round((targetH * maxVal) / targetW);
            targetW = maxVal;
          } else {
            targetW = Math.round((targetW * maxVal) / targetH);
            targetH = maxVal;
          }
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      if (fmt === 'application/pdf') {
        // PDF mode: compress image to JPEG first, then calculate PDF size
        const jpegResult = compressToStrictKB(canvas, Math.max(10, target - 8), 'image/jpeg');
        const pdf = new jsPDF({
          orientation: targetW > targetH ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const aspect = targetW / targetH;
        let pdfW = pageWidth - 20;
        let pdfH = pdfW / aspect;

        if (pdfH > pageHeight - 20) {
          pdfH = pageHeight - 20;
          pdfW = pdfH * aspect;
        }

        const marginX = (pageWidth - pdfW) / 2;
        const marginY = (pageHeight - pdfH) / 2;
        pdf.addImage(jpegResult.dataUrl, 'JPEG', marginX, marginY, pdfW, pdfH);

        const pdfDataUri = pdf.output('datauristring');
        const approxBytes = Math.round((pdfDataUri.length * 3) / 4);
        setCompressedUrl(pdfDataUri);
        setActiveKB(+(approxBytes / 1024).toFixed(1));
      } else {
        const result = compressToStrictKB(canvas, target, fmt);
        setCompressedUrl(result.dataUrl);
        setActiveKB(result.kb);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (sourceImage) {
      runCompression(sourceImage, targetKB, format, maxDimension);
    }
  }, [sourceImage, targetKB, format, maxDimension]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerHaptic('light');
      setOriginalKB(+(file.size / 1024).toFixed(1));
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSourceImage(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDownload = () => {
    if (!compressedUrl) return;
    triggerHaptic('success');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.85 } });

    const a = document.createElement('a');
    a.href = compressedUrl;
    const ext = format === 'application/pdf' ? 'pdf' : format.replace('image/', '');
    a.download = `Document_${activeKB}KB.${ext}`;
    a.click();
  };

  const handleShare = async () => {
    if (!compressedUrl) return;
    triggerHaptic('light');
    if (navigator.share) {
      try {
        const blob = await (await fetch(compressedUrl)).blob();
        const ext = format === 'application/pdf' ? 'pdf' : format.replace('image/', '');
        const file = new File([blob], `Document_${activeKB}KB.${ext}`, { type: format });
        await navigator.share({
          files: [file],
          title: 'Compressed Document',
          text: `Compressed via AltumStamp (${activeKB} KB)`
        });
      } catch {
        // Dismissed
      }
    } else {
      handleDownload();
    }
  };

  const reductionPercent = originalKB > 0 && activeKB > 0 
    ? Math.max(0, Math.round(((originalKB - activeKB) / originalKB) * 100))
    : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-12">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        onClick={(e) => { e.target.value = ''; }}
        accept="image/*" 
        className="hidden" 
      />

      {/* Hero Header */}
      <div className="rounded-[28px] p-5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/25">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-wider">
            SOLO COMPRESSOR
          </span>
          <span className="text-xs font-bold text-amber-100">Certificates & Marks</span>
        </div>
        <h2 className="text-2xl font-black mt-2">Document & Image Compressor</h2>
        <p className="text-xs text-amber-100 font-medium mt-0.5">
          Compress Aadhaar, Marksheets, and solo photos to exact portal limits (JPG, WebP, PNG, PDF).
        </p>
      </div>

      {/* Upload Zone */}
      {!sourceImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="rounded-[28px] p-8 bg-white/80 border-2 border-dashed border-amber-300 hover:border-amber-500 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer active:scale-98 transition-all"
        >
          <div className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 shadow-md shadow-amber-500/20">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-black text-slate-800">Tap to Select Document or Image</h3>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
            Supports heavy camera photos, certificate scans, or passport cuts up to 25 MB.
          </p>
        </div>
      ) : (
        /* Workspace Card */
        <div className="rounded-[28px] p-5 bg-white/80 backdrop-blur-xl border border-white/90 shadow-xl space-y-4">
          
          {/* Metrics Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">REDUCTION</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-slate-500 line-through">{originalKB} KB</span>
                <span className="text-base font-black text-emerald-600">{activeKB} KB</span>
                {reductionPercent > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                    -{reductionPercent}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('warning');
                  setSourceImage(null);
                  setCompressedUrl(null);
                }}
                className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview Canvas Display */}
          <div className="relative w-full h-56 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center p-3 overflow-hidden shadow-inner">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center z-10">
                <RefreshCw className="w-6 h-6 text-amber-600 animate-spin mb-1" />
                <span className="text-xs font-bold text-slate-600">Compressing...</span>
              </div>
            )}
            {format === 'application/pdf' ? (
              <div className="text-center p-4">
                <FileText className="w-16 h-16 text-rose-500 mx-auto mb-2" />
                <span className="text-xs font-black text-slate-800">Standard A4 Printable PDF</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Ready for portal document upload</p>
              </div>
            ) : (
              <img
                src={compressedUrl || sourceImage}
                alt="Compressed Output"
                className="max-h-full max-w-full object-contain rounded shadow-sm"
              />
            )}
          </div>

          {/* Quick Target KB Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Official Portal Target Caps</span>
              <span className="text-xs font-black text-amber-600">≤ {targetKB} KB</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[20, 50, 100, 200, 300].map((kb) => (
                <button
                  key={kb}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setTargetKB(kb);
                  }}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    targetKB === kb
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {kb} KB
                </button>
              ))}
            </div>
          </div>

          {/* Continuous Target Slider */}
          <div>
            <input
              type="range"
              min="10"
              max="400"
              step="5"
              value={targetKB}
              onChange={(e) => {
                triggerHaptic('light');
                setTargetKB(Number(e.target.value));
              }}
              className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
              <span>10 KB</span>
              <span>100 KB</span>
              <span>200 KB</span>
              <span>400 KB</span>
            </div>
          </div>

          {/* Format Selector: JPG, WebP, PNG, PDF */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700">Export Format</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'image/jpeg', label: 'JPG' },
                { id: 'image/webp', label: 'WEBP' },
                { id: 'image/png', label: 'PNG' },
                { id: 'application/pdf', label: 'PDF' }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setFormat(fmt.id);
                  }}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    format === fmt.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension Constraint Presets */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Max Dimension Constraint</label>
              <span className="text-[10px] text-slate-400 font-semibold">Prevents portal rejection</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'original', label: 'Original' },
                { id: '1200', label: '1200px' },
                { id: '800', label: '800px' },
                { id: '600', label: '600px' }
              ].map((dim) => (
                <button
                  key={dim.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setMaxDimension(dim.id);
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    maxDimension === dim.id
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {dim.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Download & Share Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black text-xs shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download File ({activeKB} KB)</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 active:scale-98 transition-all"
            >
              <Share2 className="w-4 h-4 text-amber-600" />
              <span>Send / Share</span>
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
