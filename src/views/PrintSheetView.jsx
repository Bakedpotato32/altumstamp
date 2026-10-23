import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Printer, 
  Download, 
  Layers, 
  Upload, 
  Scissors, 
  Building2, 
  Image as ImageIcon,
  Grid
} from 'lucide-react';
import jsPDF from 'jspdf';
import { triggerHaptic } from '../utils/haptics';

export default function PrintSheetView({ compositeUrl, photoUrl, signUrl }) {
  const [sourceType, setSourceType] = useState(compositeUrl ? 'composite' : photoUrl ? 'photo' : 'custom');
  const [customImage, setCustomImage] = useState(null);

  const [paperSize, setPaperSize] = useState('4x6'); // '4x6' | 'a4'
  const [gridCount, setGridCount] = useState(8);
  const [showCutLines, setShowCutLines] = useState(true);
  const [showCafeFooter, setShowCafeFooter] = useState(true);
  const [cafeName, setCafeName] = useState('Altum Cyber Point');
  const [cafeContact, setCafeContact] = useState('Mob: 9876543210');

  const fileInputRef = useRef(null);

  const activeImage = 
    sourceType === 'composite' ? compositeUrl :
    sourceType === 'photo' ? photoUrl :
    sourceType === 'sign' ? signUrl :
    customImage;

  const handlePaperChange = (size) => {
    triggerHaptic('selection');
    setPaperSize(size);
    setGridCount(size === '4x6' ? 8 : 16);
  };

  const handleCustomUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerHaptic('light');
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomImage(ev.target.result);
        setSourceType('custom');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Millimeter PDF Generator with Safe Printable Margins
  const generatePdf = () => {
    if (!activeImage) return null;

    const is4x6 = paperSize === '4x6';
    const pdf = new jsPDF({
      orientation: is4x6 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: is4x6 ? [101.6, 152.4] : 'a4'
    });

    const pageWidth = is4x6 ? 152.4 : 210;
    const pageHeight = is4x6 ? 101.6 : 297;

    let cols = 4;
    let rows = 2;
    let photoW = 32;
    let photoH = 41;

    if (is4x6) {
      if (gridCount === 6) {
        cols = 3;
        rows = 2;
        photoW = 36;
        photoH = 43;
      } else {
        cols = 4;
        rows = 2;
        photoW = 31;
        photoH = 41;
      }
    } else {
      if (gridCount === 8) {
        cols = 2;
        rows = 4;
        photoW = 42;
        photoH = 55;
      } else if (gridCount === 16) {
        cols = 4;
        rows = 4;
        photoW = 34;
        photoH = 44;
      } else {
        cols = 4;
        rows = 8;
        photoW = 30;
        photoH = 32;
      }
    }

    const marginX = 8;
    const marginY = 8;
    const availW = pageWidth - marginX * 2;
    const availH = pageHeight - marginY * 2 - (showCafeFooter ? 6 : 0);

    const gapX = cols > 1 ? (availW - cols * photoW) / (cols - 1) : 0;
    const gapY = rows > 1 ? (availH - rows * photoH) / (rows - 1) : 0;

    let placed = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (placed >= gridCount) break;

        const x = marginX + c * (photoW + gapX);
        const y = marginY + r * (photoH + gapY);

        pdf.addImage(activeImage, 'JPEG', x, y, photoW, photoH);

        if (showCutLines) {
          pdf.setDrawColor(190, 190, 190);
          pdf.setLineWidth(0.12);
          pdf.rect(x, y, photoW, photoH);
        }

        placed++;
      }
    }

    if (showCafeFooter && cafeName.trim()) {
      pdf.setFontSize(7.5);
      pdf.setTextColor(130, 130, 130);
      const footerText = `${cafeName.toUpperCase()}  •  ${cafeContact}  •  HIGH-GLOSS PHOTO PRINT`;
      pdf.text(footerText, pageWidth / 2, pageHeight - 3.5, { align: 'center' });
    }

    return pdf;
  };

  const handleDownloadPdf = () => {
    if (!activeImage) return;
    triggerHaptic('success');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.85 } });

    const pdf = generatePdf();
    if (pdf) {
      pdf.save(`${paperSize.toUpperCase()}_${gridCount}x_Passport_Sheet.pdf`);
    }
  };

  const handleDownloadJpg = async () => {
    if (!activeImage) return;
    triggerHaptic('success');

    const is4x6 = paperSize === '4x6';
    const canvas = document.createElement('canvas');
    canvas.width = is4x6 ? 1800 : 2480;
    canvas.height = is4x6 ? 1200 : 3508;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.src = activeImage;
    await new Promise((res) => (img.onload = res));

    let cols = is4x6 ? (gridCount === 6 ? 3 : 4) : (gridCount === 8 ? 2 : 4);
    let rows = is4x6 ? 2 : (gridCount === 8 ? 4 : gridCount === 16 ? 4 : 8);

    const padX = 60;
    const padY = 60;
    const bottomReserve = showCafeFooter ? 80 : 0;
    const availW = canvas.width - padX * 2;
    const availH = canvas.height - padY * 2 - bottomReserve;

    const cellW = availW / cols;
    const cellH = availH / rows;
    const pW = cellW * 0.90;
    const pH = cellH * 0.92;

    let placed = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (placed >= gridCount) break;
        const x = padX + c * cellW + (cellW - pW) / 2;
        const y = padY + r * cellH + (cellH - pH) / 2;

        ctx.drawImage(img, x, y, pW, pH);

        if (showCutLines) {
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, pW, pH);
        }
        placed++;
      }
    }

    if (showCafeFooter && cafeName.trim()) {
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${cafeName.toUpperCase()} • ${cafeContact}`, canvas.width / 2, canvas.height - 25);
    }

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    a.download = `${paperSize.toUpperCase()}_${gridCount}x_300DPI_Print_Sheet.jpg`;
    a.click();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-12">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleCustomUpload} 
        onClick={(e) => { e.target.value = ''; }}
        accept="image/*" 
        className="hidden" 
      />

      {/* Hero Header */}
      <div className="rounded-[28px] p-5 bg-gradient-to-r from-teal-500 via-emerald-600 to-cyan-700 text-white shadow-xl shadow-emerald-600/25">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-wider">
            REVENUE STUDIO
          </span>
          <span className="text-xs font-bold text-emerald-100">Cyber Cafe Printing</span>
        </div>
        <h2 className="text-2xl font-black mt-2">A4 & 4×6" Print Tiler</h2>
        <p className="text-xs text-emerald-100 font-medium mt-0.5">
          Generate 6, 8, 16, or 32 identical copies on glossy photo paper with precision cutting lines[span_7](start_span)[span_7](end_span).
        </p>
      </div>

      {/* Source Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 px-1">Select Print Image Source</label>
        <div className="grid grid-cols-3 gap-2">
          {compositeUrl && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setSourceType('composite');
              }}
              className={`p-2.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
                sourceType === 'composite'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Merged Slip</span>
            </button>
          )}

          {photoUrl && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setSourceType('photo');
              }}
              className={`p-2.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
                sourceType === 'photo'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Photo Only</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
              sourceType === 'custom'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Paper & Grid Configuration Card */}
      <div className="rounded-[28px] p-5 bg-white/80 backdrop-blur-xl border border-white/90 shadow-xl space-y-4">
        
        {/* Paper Size */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">Photo Paper Dimension</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handlePaperChange('4x6')}
              className={`py-3 rounded-2xl border font-black text-xs transition-all flex items-center justify-center gap-2 ${
                paperSize === '4x6'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>4×6" Glossy Paper</span>
            </button>

            <button
              type="button"
              onClick={() => handlePaperChange('a4')}
              className={`py-3 rounded-2xl border font-black text-xs transition-all flex items-center justify-center gap-2 ${
                paperSize === 'a4'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>A4 Document Paper</span>
            </button>
          </div>
        </div>

        {/* Copy Quantity Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">Photo Grid Density</label>
            <span className="text-xs font-black text-emerald-600">{gridCount} Copies per Sheet</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {paperSize === '4x6' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setGridCount(6);
                  }}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    gridCount === 6
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  6 Copies (3.5×4.5 cm)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setGridCount(8);
                  }}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    gridCount === 8
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  8 Copies (Economy)
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setGridCount(8);
                  }}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    gridCount === 8
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  8 Pack (Large)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setGridCount(16);
                  }}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    gridCount === 16
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  16 Pack (Regular)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setGridCount(32);
                  }}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    gridCount === 32
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  32 Pack (Bulk)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Proportional Scaled Paper Preview (Zero Leakage) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-emerald-600" />
              Live Desk Paper Layout
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {paperSize === '4x6' ? '4×6" Landscape' : 'A4 Portrait'}
            </span>
          </div>

          <div className="w-full bg-slate-100/90 py-5 px-3 rounded-2xl flex items-center justify-center border border-slate-200 shadow-inner">
            {activeImage ? (
              <div 
                className={`bg-white shadow-xl rounded-md p-2 flex flex-col justify-between border border-slate-300 relative overflow-hidden transition-all ${
                  paperSize === '4x6' 
                    ? 'w-full max-w-[280px] aspect-[152.4/101.6]' 
                    : 'w-full max-w-[220px] aspect-[210/297]'
                }`}
              >
                {/* Strict Bounded Matrix */}
                <div 
                  className={`grid gap-1.5 w-full h-full min-h-0 flex-1 ${
                    paperSize === '4x6' 
                      ? (gridCount === 6 ? 'grid-cols-3 grid-rows-2' : 'grid-cols-4 grid-rows-2')
                      : (gridCount === 8 ? 'grid-cols-2 grid-rows-4' : gridCount === 16 ? 'grid-cols-4 grid-rows-4' : 'grid-cols-4 grid-rows-8')
                  }`}
                >
                  {[...Array(gridCount)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`relative w-full h-full min-h-0 min-w-0 overflow-hidden bg-slate-50 rounded-xs flex items-center justify-center ${
                        showCutLines ? 'border border-dashed border-slate-300' : ''
                      }`}
                    >
                      <img src={activeImage} alt="tile" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                {showCafeFooter && cafeName && (
                  <p className="text-[6.5px] text-center font-bold text-slate-400 truncate mt-1 shrink-0">
                    {cafeName.toUpperCase()} • {cafeContact}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400">
                <Printer className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-semibold">Select an image or create a slip to view sheet</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer & Cutting Toggles */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700">0.2pt Cutting Guidelines</span>
            </div>
            <input
              type="checkbox"
              checked={showCutLines}
              onChange={(e) => setShowCutLines(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700">Cyber Cafe Margin Stamp</span>
            </div>
            <input
              type="checkbox"
              checked={showCafeFooter}
              onChange={(e) => setShowCafeFooter(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
          </div>

          {showCafeFooter && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1 block">Shop Name</label>
                <input
                  type="text"
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  placeholder="e.g. Altum Cyber Point"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1 block">Contact / Mobile</label>
                <input
                  type="text"
                  value={cafeContact}
                  onChange={(e) => setCafeContact(e.target.value)}
                  placeholder="e.g. Mob: 9876543210"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!activeImage}
            className={`py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              activeImage
                ? 'bg-gradient-to-r from-teal-500 via-emerald-600 to-cyan-700 text-white shadow-emerald-600/30 active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download Print PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJpg}
            disabled={!activeImage}
            className={`py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
              activeImage
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 active:scale-98'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Export 300 DPI JPG</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
