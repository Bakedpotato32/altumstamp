import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Share2, 
  Printer, 
  Copy, 
  Download, 
  Check, 
  Laptop, 
  Smartphone,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export default function WirelessShareModal({ isOpen, onClose, imageSrc, title = 'Candidate Slip', sizeKB = 0 }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !imageSrc) return null;

  // 1. Native OS WebShare (Direct to WhatsApp Web, Bluetooth, Nearby Share)
  const handleNativeShare = async () => {
    triggerHaptic('success');
    if (navigator.share) {
      try {
        const blob = await (await fetch(imageSrc)).blob();
        const file = new File([blob], `${title.replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
        await navigator.share({
          files: [file],
          title: title,
          text: `AltumStamp Exam Slip (${sizeKB} KB) ready for print.`
        });
      } catch {
        // Share cancelled
      }
    } else {
      handleDirectDownload();
    }
  };

  // 2. Copy Image directly to Clipboard for desktop paste
  const handleCopyImage = async () => {
    triggerHaptic('light');
    try {
      const blob = await (await fetch(imageSrc)).blob();
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        handleDirectDownload();
      }
    } catch {
      handleDirectDownload();
    }
  };

  // 3. Direct Browser Printing
  const handlePrint = () => {
    triggerHaptic('selection');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print - ${title}</title>
            <style>
              body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
              img { max-width: 90%; max-height: 90%; object-contain: contain; }
            </style>
          </head>
          <body>
            <img src="${imageSrc}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDirectDownload = () => {
    triggerHaptic('success');
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `${title.replace(/\s+/g, '_')}_${sizeKB}KB.jpg`;
    a.click();
  };

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
          className="relative z-10 w-full max-w-md mx-auto rounded-t-[36px] bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-16px_40px_rgba(15,23,42,0.18)] p-5 flex flex-col space-y-4 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                <Laptop className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">PC & Wireless Share Hub</h3>
                <p className="text-[10px] text-slate-500 font-semibold">Send to shop computer or connected printer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Document Preview Snapshot */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-14 h-16 rounded-xl bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <img src={imageSrc} alt="Document" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-slate-800 truncate">{title}</h4>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Verified Document Slip</p>
              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 mt-1">
                {sizeKB} KB (Ready to Print)
              </span>
            </div>
          </div>

          {/* Action List */}
          <div className="space-y-2">
            {/* Primary Action: Send to WhatsApp / Nearby Share / Bluetooth */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 flex items-center justify-between active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-4 h-4" />
                <div className="text-left">
                  <p className="leading-tight">Send via WhatsApp / Nearby Share</p>
                  <p className="text-[9px] text-blue-100 font-medium">Quickest way to shop desktop PC</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-200" />
            </button>

            {/* Print Directly */}
            <button
              type="button"
              onClick={handlePrint}
              className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/90 text-slate-800 font-extrabold text-xs shadow-xs hover:bg-slate-50 flex items-center justify-between active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Printer className="w-4 h-4 text-emerald-600" />
                <div className="text-left">
                  <p className="leading-tight">Print Directly from Browser</p>
                  <p className="text-[9px] text-slate-400 font-medium">For WiFi / Network enabled printers</p>
                </div>
              </div>
              <Check className="w-4 h-4 text-slate-400" />
            </button>

            {/* Copy to Clipboard */}
            <button
              type="button"
              onClick={handleCopyImage}
              className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/90 text-slate-800 font-extrabold text-xs shadow-xs hover:bg-slate-50 flex items-center justify-between active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Copy className="w-4 h-4 text-indigo-600" />
                <div className="text-left">
                  <p className="leading-tight">{copied ? 'Image Copied to Clipboard!' : 'Copy Image to Clipboard'}</p>
                  <p className="text-[9px] text-slate-400 font-medium">Paste directly into Photoshop or MS Word</p>
                </div>
              </div>
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
