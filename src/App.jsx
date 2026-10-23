import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  Upload, 
  Download, 
  Sparkles,
  CheckCircle2, 
  Share2, 
  Wand2, 
  Crop, 
  ShieldCheck, 
  AlertTriangle, 
  Trash2,
  Sliders,
  PenTool,
  Award,
  Printer,
  Archive,
  Check
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { triggerHaptic } from './utils/haptics';
import { 
  renderCompositeSlip, 
  processSignatureInk, 
  compressToStrictKB 
} from './utils/canvasEngine';
import { saveToVault } from './utils/vaultStorage';
import { exportFile } from './utils/fileSaver';
import AmbientBackground from './components/AmbientBackground';
import TopHeader from './components/TopHeader';
import BottomDock from './components/BottomDock';
import InteractiveCropperModal from './components/InteractiveCropperModal';
import WirelessShareModal from './components/WirelessShareModal';
import InkLabView from './views/InkLabView';
import CompressView from './views/CompressView';
import PresetsView from './views/PresetsView';
import PrintSheetView from './views/PrintSheetView';
import VaultView from './views/VaultView';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');

  const [rawPhotoSrc, setRawPhotoSrc] = useState(null);
  const [croppedPhotoSrc, setCroppedPhotoSrc] = useState(null);

  const [rawSignSrc, setRawSignSrc] = useState(null);
  const [croppedSignSrc, setCroppedSignSrc] = useState(null);
  const [bleachedSignSrc, setBleachedSignSrc] = useState(null);

  const [compositeUrl, setCompositeUrl] = useState(null);

  const [activePresetId, setActivePresetId] = useState('up_board_combo');
  const [activePresetName, setActivePresetName] = useState('UP Board (10th/12th)');

  const [cropperModal, setCropperModal] = useState({ isOpen: false, mode: 'photo', image: null });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Toast states
  const [saveToast, setSaveToast] = useState(null);
  const [exitToast, setExitToast] = useState(false);
  const lastBackPressRef = useRef(0);

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const cropperModalRef = useRef(cropperModal);
  cropperModalRef.current = cropperModal;

  const isShareModalRef = useRef(isShareModalOpen);
  isShareModalRef.current = isShareModalOpen;

  const [enableBleach, setEnableBleach] = useState(false);
  const [inkThreshold, setInkThreshold] = useState(175);
  const [inkColor, setInkColor] = useState('black');
  const [showBleachDial, setShowBleachDial] = useState(false);

  const [targetKB, setTargetKB] = useState(45);
  const [activeKB, setActiveKB] = useState(0);
  const [isCompliant, setIsCompliant] = useState(true);
  const [format, setFormat] = useState('image/jpeg');

  const [photoRatio, setPhotoRatio] = useState(74);
  const [includeDivider, setIncludeDivider] = useState(true);

  const photoInputRef = useRef(null);
  const signInputRef = useRef(null);

  useEffect(() => {
    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#f8fafc' });
      } catch {}
    };
    setupStatusBar();
  }, []);

  useEffect(() => {
    let backHandler = null;

    const setupBackNavigation = async () => {
      try {
        backHandler = await CapApp.addListener('backButton', () => {
          if (cropperModalRef.current.isOpen) {
            triggerHaptic('light');
            setCropperModal({ isOpen: false, mode: 'photo', image: null });
            return;
          }

          if (isShareModalRef.current) {
            triggerHaptic('light');
            setIsShareModalOpen(false);
            return;
          }

          if (activeTabRef.current !== 'studio') {
            triggerHaptic('selection');
            setActiveTab('studio');
            return;
          }

          const now = Date.now();
          if (now - lastBackPressRef.current < 2000) {
            CapApp.exitApp();
          } else {
            lastBackPressRef.current = now;
            triggerHaptic('warning');
            setExitToast(true);
            setTimeout(() => setExitToast(false), 2000);
          }
        });
      } catch {}
    };

    setupBackNavigation();

    return () => {
      if (backHandler && backHandler.remove) {
        backHandler.remove();
      }
    };
  }, []);

  useEffect(() => {
    const source = croppedSignSrc || rawSignSrc;
    if (!source) {
      setBleachedSignSrc(null);
      return;
    }

    if (!enableBleach) {
      setBleachedSignSrc(source);
      return;
    }

    processSignatureInk(source, { threshold: inkThreshold, inkColor, enabled: enableBleach })
      .then((res) => setBleachedSignSrc(res))
      .catch(() => setBleachedSignSrc(source));
  }, [croppedSignSrc, rawSignSrc, inkThreshold, inkColor, enableBleach]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const photo = croppedPhotoSrc || rawPhotoSrc;
        const sign = enableBleach ? bleachedSignSrc : (croppedSignSrc || rawSignSrc);

        const canvas = await renderCompositeSlip({
          photoSrc: photo,
          signatureSrc: sign,
          canvasWidth: 350,
          canvasHeight: 450,
          photoRatio,
          includeDivider
        });

        if (cancelled) return;

        const res = compressToStrictKB(canvas, targetKB, format);
        setCompositeUrl(res.dataUrl);
        setActiveKB(res.kb);
        setIsCompliant(res.compliant);
      } catch (e) {
        console.error(e);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [
    croppedPhotoSrc, 
    rawPhotoSrc, 
    bleachedSignSrc, 
    croppedSignSrc, 
    rawSignSrc, 
    enableBleach,
    photoRatio, 
    includeDivider, 
    targetKB, 
    format
  ]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerHaptic('light');
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRawPhotoSrc(ev.target.result);
        setCropperModal({ isOpen: true, mode: 'photo', image: ev.target.result });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSignUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerHaptic('light');
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRawSignSrc(ev.target.result);
        setCropperModal({ isOpen: true, mode: 'signature', image: ev.target.result });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    triggerHaptic('warning');
    setRawPhotoSrc(null);
    setCroppedPhotoSrc(null);
  };

  const handleRemoveSign = (e) => {
    e.stopPropagation();
    triggerHaptic('warning');
    setRawSignSrc(null);
    setCroppedSignSrc(null);
    setBleachedSignSrc(null);
  };

  const handleApplyPreset = (preset) => {
    setActivePresetId(preset.id);
    setActivePresetName(preset.name);
    setTargetKB(preset.targetKB);
    setPhotoRatio(preset.photoRatio);
    setIncludeDivider(preset.divider);
    setActiveTab('studio');
  };

  // Direct Save to Gallery with Confirmation Toast (ZERO Share Popups)
  const handleDownload = async () => {
    if (!compositeUrl) return;
    triggerHaptic('success');
    confetti({ particleCount: 50, spread: 55, origin: { y: 0.85 } });

    const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
    const filename = `Candidate_UPBoard_${activeKB}KB.${ext}`;

    const res = await exportFile({
      dataUrl: compositeUrl,
      fileName: filename,
      mimeType: format
    });

    if (res.success) {
      const msg = res.destination === 'gallery' ? 'Saved directly to Gallery!' : 'Saved to Documents/AltumStamp!';
      setSaveToast(msg);
      setTimeout(() => setSaveToast(null), 2500);
    }

    await saveToVault({
      name: 'Candidate Slip',
      examTag: activePresetName,
      sizeKB: activeKB,
      compositeUrl: compositeUrl,
      photoUrl: croppedPhotoSrc || rawPhotoSrc,
      signUrl: croppedSignSrc || rawSignSrc
    });
  };

  const handleReopenInStudio = (vaultItem) => {
    if (vaultItem.photoUrl) setCroppedPhotoSrc(vaultItem.photoUrl);
    if (vaultItem.signUrl) setCroppedSignSrc(vaultItem.signUrl);
    if (vaultItem.compositeUrl) setCompositeUrl(vaultItem.compositeUrl);
    setActiveTab('studio');
  };

  const handleTileFromVault = (vaultItem) => {
    if (vaultItem.compositeUrl) setCompositeUrl(vaultItem.compositeUrl);
    setActiveTab('print');
  };

  const activePhoto = croppedPhotoSrc || rawPhotoSrc;
  const activeSign = enableBleach ? (bleachedSignSrc || croppedSignSrc || rawSignSrc) : (croppedSignSrc || rawSignSrc);

  return (
    <div className="relative min-h-screen text-slate-900 flex flex-col pb-28">
      <AmbientBackground />

      {/* Pinned Sticky Header */}
      <header
        className="sticky top-0 z-40 w-full bg-[#f8fafc]/85 backdrop-blur-2xl border-b border-slate-200/60 shadow-[0_4px_20px_rgba(15,23,42,0.03)]"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)'
        }}
      >
        <div className="max-w-md mx-auto px-4 py-2.5">
          <TopHeader
            onQuickMerge={() => photoInputRef.current?.click()}
            onOpenVault={() => setActiveTab('vault')}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3 space-y-4">
        <input 
          type="file" 
          ref={photoInputRef} 
          onChange={handlePhotoUpload} 
          onClick={(e) => { e.target.value = ''; }}
          accept="image/*" 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={signInputRef} 
          onChange={handleSignUpload} 
          onClick={(e) => { e.target.value = ''; }}
          accept="image/*" 
          className="hidden" 
        />

        {activeTab === 'studio' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            {/* Hero Card */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="rounded-[28px] p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-600/25 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  {activePresetName}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className="text-xs font-bold text-indigo-100 hover:text-white underline decoration-white/40"
                >
                  Change Preset
                </button>
              </div>

              <div className="mt-4">
                <h1 className="text-2xl font-black tracking-tight text-white">Photo + Sign Merger</h1>
                <p className="text-xs text-indigo-100/80 font-medium mt-0.5">
                  Direct joint merge with high-clarity anti-pixelation engine
                </p>
              </div>

              <div className="mt-5 rounded-2xl bg-white/15 backdrop-blur-md p-3.5 border border-white/20 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">PORTAL STATUS</p>
                  <p className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                    {activePhoto && activeSign ? (
                      isCompliant ? (
                        <span className="text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Ready for Upload
                        </span>
                      ) : (
                        <span className="text-rose-300 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Drag Slider Lower
                        </span>
                      )
                    ) : (
                      'Awaiting Photo & Sign'
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">EXACT SIZE</p>
                  <p className="text-base font-black text-amber-300">
                    {activeKB > 0 ? `${activeKB} KB` : '0 KB'}
                    <span className="text-xs text-indigo-200 font-semibold ml-1">/ {targetKB} KB</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Dual Stations */}
            <div className="grid grid-cols-2 gap-3.5">
              
              {/* CARD 1: Student Photo Card */}
              <div className="rounded-[28px] p-4 bg-gradient-to-b from-sky-400 via-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 flex flex-col justify-between min-h-[195px] relative overflow-hidden">
                <div className="flex items-start justify-between z-10">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                    PHOTO
                  </span>
                  {activePhoto && (
                    <button
                      onClick={handleRemovePhoto}
                      title="Remove Photo"
                      className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-600 text-white active:scale-90 transition-all shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="my-1.5 flex flex-col items-center justify-center z-10">
                  {activePhoto ? (
                    <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-white/80 shadow-md bg-white">
                      <img src={activePhoto} alt="Student Crop" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-90 transition-all shadow-sm"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  )}
                </div>

                <div className="z-10">
                  {activePhoto ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          setCropperModal({ 
                            isOpen: true, 
                            mode: 'photo', 
                            image: rawPhotoSrc || croppedPhotoSrc 
                          });
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-white text-blue-700 font-extrabold text-[11px] shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                        <Crop className="w-3 h-3" />
                        <span>Recrop</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          photoInputRef.current?.click();
                        }}
                        className="py-1.5 px-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] active:scale-95 transition-all"
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs active:scale-95 transition-all text-center"
                    >
                      Upload Photo
                    </button>
                  )}
                </div>
              </div>

              {/* CARD 2: Student Signature Card */}
              <div className="rounded-[28px] p-4 bg-gradient-to-b from-rose-500 via-red-500 to-orange-500 text-white shadow-lg shadow-rose-500/25 flex flex-col justify-between min-h-[195px] relative overflow-hidden">
                <div className="flex items-start justify-between z-10">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                    SIGNATURE
                  </span>
                  {activeSign && (
                    <button
                      onClick={handleRemoveSign}
                      title="Remove Sign"
                      className="p-1.5 rounded-full bg-red-700/80 hover:bg-red-800 text-white active:scale-90 transition-all shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="my-1.5 flex flex-col items-center justify-center z-10">
                  {activeSign ? (
                    <div className="w-24 h-12 rounded-xl overflow-hidden border-2 border-white/80 shadow-md bg-white p-1 flex items-center justify-center">
                      <img src={activeSign} alt="Sign Crop" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <button
                      onClick={() => signInputRef.current?.click()}
                      className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-90 transition-all shadow-sm"
                    >
                      <Upload className="w-6 h-6 text-white" />
                    </button>
                  )}
                </div>

                <div className="z-10">
                  {activeSign ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          setCropperModal({ 
                            isOpen: true, 
                            mode: 'signature', 
                            image: rawSignSrc || croppedSignSrc 
                          });
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-white text-rose-700 font-extrabold text-[11px] shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                        <Crop className="w-3 h-3" />
                        <span>Recrop</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          setActiveTab('ink');
                        }}
                        className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white active:scale-90"
                        title="Open Ink Lab"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          signInputRef.current?.click();
                        }}
                        className="py-1.5 px-2 rounded-xl bg-white/20 text-white font-bold text-[11px] active:scale-95"
                      >
                        New
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => signInputRef.current?.click()}
                        className="flex-1 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs active:scale-95 transition-all text-center"
                      >
                        Upload
                      </button>
                      <button
                        onClick={() => setActiveTab('ink')}
                        className="p-2 rounded-xl bg-white text-rose-600 font-bold active:scale-95"
                        title="Draw on Screen"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bleach Controls */}
            <AnimatePresence>
              {showBleachDial && activeSign && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="rounded-3xl p-4 bg-amber-50/90 border border-amber-200 shadow-md space-y-2.5 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                      Paper Background Bleach Filter
                    </span>
                    <button
                      onClick={() => setEnableBleach(!enableBleach)}
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        enableBleach ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {enableBleach ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="110"
                    max="220"
                    value={inkThreshold}
                    onChange={(e) => {
                      triggerHaptic('light');
                      setInkThreshold(Number(e.target.value));
                    }}
                    className="w-full accent-amber-600 h-2 bg-amber-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-bold text-amber-800">Ink Tone</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          triggerHaptic('selection');
                          setInkColor('black');
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-black border transition-all ${
                          inkColor === 'black' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
                        }`}
                      >
                        Carbon Black
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic('selection');
                          setInkColor('blue');
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-black border transition-all ${
                          inkColor === 'blue' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
                        }`}
                      >
                        Royal Blue
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Continuous Precision Compression Slider */}
            <div className="rounded-[28px] p-5 bg-white/80 backdrop-blur-xl border border-white/90 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Target File Size Limit
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Strict precision compressor • {activePresetName}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-black text-sm">
                  ≤ {targetKB} KB
                </div>
              </div>

              <div className="pt-1">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={targetKB}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val === 10 || val === 20 || val === 50) triggerHaptic('selection');
                    else triggerHaptic('light');
                    setTargetKB(val);
                  }}
                  className="w-full accent-blue-600 h-2.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-extrabold text-slate-400 mt-1.5 px-0.5">
                  <span onClick={() => setTargetKB(10)} className={`cursor-pointer ${targetKB === 10 ? 'text-blue-600 font-black' : ''}`}>10 KB</span>
                  <span onClick={() => setTargetKB(20)} className={`cursor-pointer ${targetKB === 20 ? 'text-blue-600 font-black' : ''}`}>20 KB (SSC)</span>
                  <span onClick={() => setTargetKB(35)} className={`cursor-pointer ${targetKB === 35 ? 'text-blue-600 font-black' : ''}`}>35 KB</span>
                  <span onClick={() => setTargetKB(50)} className={`cursor-pointer ${targetKB === 50 ? 'text-blue-600 font-black' : ''}`}>50 KB (UPMSP)</span>
                  <span onClick={() => setTargetKB(100)} className="cursor-pointer hover:text-blue-600">100 KB</span>
                </div>
              </div>
            </div>

            {/* Output Canvas Preview */}
            <div className="rounded-[28px] p-5 bg-white/80 backdrop-blur-xl border border-white/90 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-extrabold text-slate-800">Verified Output Canvas</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700">
                    350 × 450 PX
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    isCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {activeKB} KB
                  </span>
                </div>
              </div>

              <div className="w-full flex items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-200/60 min-h-[250px]">
                {compositeUrl ? (
                  <img
                    src={compositeUrl}
                    alt="Preview"
                    className="max-h-[260px] w-auto object-contain block mx-auto rounded shadow-sm border border-slate-300"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <p className="text-xs font-semibold">Upload photo and signature to render exam slip</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3.5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDownload}
                  disabled={!activePhoto && !activeSign}
                  className={`py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                    activePhoto || activeSign
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white shadow-indigo-600/30'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Download & Save</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setIsShareModalOpen(true)}
                  disabled={!compositeUrl}
                  className={`py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border transition-all ${
                    compositeUrl
                      ? 'bg-white border-slate-200 text-slate-800 shadow-sm active:scale-95'
                      : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span>PC & Wireless Hub</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'ink' && (
          <InkLabView
            onApplyToStudio={(cleanedDataUrl) => {
              setCroppedSignSrc(cleanedDataUrl);
              setBleachedSignSrc(cleanedDataUrl);
              setActiveTab('studio');
            }}
          />
        )}

        {activeTab === 'compress' && (
          <CompressView />
        )}

        {activeTab === 'presets' && (
          <PresetsView 
            activePresetId={activePresetId}
            onSelectPreset={handleApplyPreset}
          />
        )}

        {activeTab === 'print' && (
          <PrintSheetView 
            compositeUrl={compositeUrl}
            photoUrl={activePhoto}
            signUrl={activeSign}
          />
        )}

        {activeTab === 'vault' && (
          <VaultView 
            onReopenInStudio={handleReopenInStudio}
            onTileToPrint={handleTileFromVault}
          />
        )}
      </main>

      {/* Floating Save Confirmation Toast */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 inset-x-0 z-[9999] flex justify-center pointer-events-none px-4"
          >
            <div className="px-5 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-2xl backdrop-blur-md flex items-center gap-2 border border-emerald-400/50">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{saveToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit App Confirmation Toast */}
      <AnimatePresence>
        {exitToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 inset-x-0 z-[9999] flex justify-center pointer-events-none px-4"
          >
            <div className="px-4 py-2 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-xl backdrop-blur-md border border-white/20">
              Press back again to exit
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InteractiveCropperModal
        isOpen={cropperModal.isOpen}
        onClose={() => setCropperModal({ isOpen: false, mode: 'photo', image: null })}
        imageSrc={cropperModal.image}
        mode={cropperModal.mode}
        onConfirmCrop={(croppedUrl) => {
          if (cropperModal.mode === 'photo') {
            setCroppedPhotoSrc(croppedUrl);
          } else {
            setCroppedSignSrc(croppedUrl);
          }
        }}
      />

      <WirelessShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageSrc={compositeUrl}
        title="Candidate Exam Slip"
        sizeKB={activeKB}
      />

      <BottomDock activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
