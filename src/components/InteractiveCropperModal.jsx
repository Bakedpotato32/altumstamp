import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal,
  ZoomIn, 
  ZoomOut,
  Grid, 
  User, 
  Move,
  RefreshCcw
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { extractCroppedImage } from '../utils/canvasEngine';

export default function InteractiveCropperModal({
  isOpen,
  onClose,
  imageSrc,
  mode = 'photo', // 'photo' | 'signature'
  onConfirmCrop
}) {
  const [transform, setTransform] = useState({ 
    zoom: 1, 
    panX: 0, 
    panY: 0, 
    rotate: 0,
    flipH: false 
  });
  const [renderedDisplaySize, setRenderedDisplaySize] = useState({ width: 0, height: 0 });
  const [showFaceGuide, setShowFaceGuide] = useState(mode === 'photo');
  const [showGrid, setShowGrid] = useState(true);
  const [aspectRatioKey, setAspectRatioKey] = useState(mode === 'photo' ? '3:4' : '3:1');

  // Multi-Ratio Dimension Definitions
  const RATIOS = {
    photo: {
      '3:4': { label: '3:4 Passport', width: 260, height: 346 },
      '4:5': { label: '4:5 Govt', width: 260, height: 325 },
      '1:1': { label: '1:1 Square', width: 260, height: 260 },
      'full': { label: 'Free Fit', width: 280, height: 320 },
    },
    signature: {
      '3:1': { label: '3:1 Exam', width: 300, height: 100 },
      '4:1': { label: '4:1 Slim', width: 320, height: 80 },
      '2:1': { label: '2:1 Compact', width: 280, height: 140 },
      '5:2': { label: '5:2 Wide', width: 300, height: 120 },
    }
  };

  const activeCropBox = (RATIOS[mode] && RATIOS[mode][aspectRatioKey]) 
    ? RATIOS[mode][aspectRatioKey] 
    : (mode === 'photo' ? RATIOS.photo['3:4'] : RATIOS.signature['3:1']);

  // Reset and calculate rendered display size on open
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    setTransform({ zoom: 1, panX: 0, panY: 0, rotate: 0, flipH: false });
    setAspectRatioKey(mode === 'photo' ? '3:4' : '3:1');
    setShowFaceGuide(mode === 'photo');

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const nw = img.naturalWidth || 600;
      const nh = img.naturalHeight || 800;
      // Pre-scale image to fill the crop frame without borders
      const scale = Math.max(activeCropBox.width / nw, activeCropBox.height / nh);
      setRenderedDisplaySize({
        width: nw * scale,
        height: nh * scale
      });
    };
  }, [isOpen, imageSrc, mode]);

  // Recalculate cover scale when changing aspect ratio
  const handleRatioChange = (key) => {
    triggerHaptic('selection');
    setAspectRatioKey(key);
    const targetBox = RATIOS[mode][key];

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const nw = img.naturalWidth || 600;
      const nh = img.naturalHeight || 800;
      const scale = Math.max(targetBox.width / nw, targetBox.height / nh);
      setRenderedDisplaySize({
        width: nw * scale,
        height: nh * scale
      });
      setTransform({ zoom: 1, panX: 0, panY: 0, rotate: 0, flipH: false });
    };
  };

  // Touch gesture tracker
  const touchState = useRef({
    isInteracting: false,
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
    initialDist: 0,
    initialZoom: 1,
    initialAngle: 0,
    initialRotate: 0
  });

  const getDist = (t1, t2) => Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  const getAngle = (t1, t2) => (Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180) / Math.PI;

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchState.current.isInteracting = true;
      touchState.current.startX = e.touches[0].clientX;
      touchState.current.startY = e.touches[0].clientY;
      touchState.current.initialPanX = transform.panX;
      touchState.current.initialPanY = transform.panY;
    } else if (e.touches.length === 2) {
      touchState.current.isInteracting = true;
      touchState.current.initialDist = getDist(e.touches[0], e.touches[1]);
      touchState.current.initialZoom = transform.zoom;
      touchState.current.initialAngle = getAngle(e.touches[0], e.touches[1]);
      touchState.current.initialRotate = transform.rotate;
    }
  };

  const handleTouchMove = (e) => {
    if (!touchState.current.isInteracting) return;

    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchState.current.startX;
      const dy = e.touches[0].clientY - touchState.current.startY;
      setTransform((prev) => ({
        ...prev,
        panX: touchState.current.initialPanX + dx,
        panY: touchState.current.initialPanY + dy
      }));
    } else if (e.touches.length === 2) {
      const dist = getDist(e.touches[0], e.touches[1]);
      const factor = dist / (touchState.current.initialDist || 1);
      const newZoom = Math.min(3.8, Math.max(0.5, touchState.current.initialZoom * factor));

      const angle = getAngle(e.touches[0], e.touches[1]);
      const angleDiff = angle - touchState.current.initialAngle;
      const newRotate = Math.round(touchState.current.initialRotate + angleDiff);

      setTransform((prev) => ({
        ...prev,
        zoom: +newZoom.toFixed(2),
        rotate: newRotate
      }));
    }
  };

  const handleTouchEnd = () => {
    touchState.current.isInteracting = false;
  };

  const handleRotateNudge = (delta) => {
    triggerHaptic('selection');
    setTransform((prev) => ({ ...prev, rotate: (prev.rotate + delta) % 360 }));
  };

  const handleZoomStep = (delta) => {
    triggerHaptic('light');
    setTransform((prev) => ({
      ...prev,
      zoom: Math.min(3.8, Math.max(0.5, +(prev.zoom + delta).toFixed(2)))
    }));
  };

  const handleFlip = () => {
    triggerHaptic('medium');
    setTransform((prev) => ({ ...prev, flipH: !prev.flipH }));
  };

  const handleReset = () => {
    triggerHaptic('warning');
    setTransform({ zoom: 1, panX: 0, panY: 0, rotate: 0, flipH: false });
  };

  const handleConfirm = async () => {
    if (!renderedDisplaySize.width) return;
    triggerHaptic('success');

    const outWidth = mode === 'photo' ? 520 : 600;
    const croppedUrl = await extractCroppedImage(
      imageSrc,
      activeCropBox,
      transform,
      renderedDisplaySize,
      outWidth
    );

    onConfirmCrop(croppedUrl);
    onClose();
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
        {/* Soft Glass Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
        />

        {/* Modal in Light Neo-Glass */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative z-10 w-full max-w-md mx-auto h-[92vh] rounded-t-[36px] bg-white/95 backdrop-blur-2xl border-t border-white shadow-[0_-16px_40px_rgba(15,23,42,0.18)] p-4 flex flex-col justify-between select-none"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                <Move className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {mode === 'photo' ? 'Candidate Photo Cropper' : 'Signature Cropper'}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">Pinch to zoom • Twist 2 fingers to rotate</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {mode === 'photo' && (
                <button
                  onClick={() => setShowFaceGuide(!showFaceGuide)}
                  className={`p-1.5 rounded-xl border transition-all ${
                    showFaceGuide 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' 
                      : 'bg-slate-100/80 border-slate-200 text-slate-400'
                  }`}
                  title="Passport Face Oval"
                >
                  <User className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1.5 rounded-xl border transition-all ${
                  showGrid 
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' 
                    : 'bg-slate-100/80 border-slate-200 text-slate-400'
                }`}
                title="Rule of Thirds Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Touch Viewport */}
          <div
            className="relative flex-1 my-2 rounded-3xl bg-slate-100/90 overflow-hidden flex items-center justify-center touch-none border border-slate-200 shadow-inner"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* The Image under transform */}
            {renderedDisplaySize.width > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${renderedDisplaySize.width}px`,
                  height: `${renderedDisplaySize.height}px`,
                  marginLeft: `-${renderedDisplaySize.width / 2}px`,
                  marginTop: `-${renderedDisplaySize.height / 2}px`,
                  transform: `translate3d(${transform.panX}px, ${transform.panY}px, 0) scale(${transform.zoom}) rotate(${transform.rotate}deg) scaleX(${transform.flipH ? -1 : 1})`,
                  transformOrigin: 'center center',
                  transition: touchState.current.isInteracting ? 'none' : 'transform 0.05s ease-out'
                }}
                className="pointer-events-none will-change-transform"
              >
                <img
                  src={imageSrc}
                  alt="Source"
                  className="w-full h-full object-fill select-none block"
                  draggable={false}
                />
              </div>
            )}

            {/* Dark Mask Vignette with Precise Cutting Frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                style={{ width: `${activeCropBox.width}px`, height: `${activeCropBox.height}px` }}
                className="relative rounded-2xl border-2 border-blue-600 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]"
              >
                {/* 3x3 Grid */}
                {showGrid && (
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-white/50" />
                    <div className="border-r border-b border-white/50" />
                    <div className="border-b border-white/50" />
                    <div className="border-r border-b border-white/50" />
                    <div className="border-r border-b border-white/50" />
                    <div className="border-b border-white/50" />
                    <div className="border-r border-b border-white/50" />
                    <div className="border-r border-b border-white/50" />
                    <div />
                  </div>
                )}

                {/* Face & Chin Oval (Only for photo mode) */}
                {showFaceGuide && mode === 'photo' && (
                  <div className="absolute inset-x-8 top-4 bottom-8 border-2 border-dashed border-emerald-400 rounded-[50%] pointer-events-none flex items-center justify-center bg-emerald-500/10">
                    <span className="text-[10px] font-black text-emerald-900 bg-white/90 px-2 py-0.5 rounded-full border border-emerald-300 shadow-sm">
                      Align Face & Chin
                    </span>
                  </div>
                )}

                {/* Corner Markers */}
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-4 border-l-4 border-blue-600 rounded-tl-lg" />
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-4 border-r-4 border-blue-600 rounded-tr-lg" />
                <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-4 border-l-4 border-blue-600 rounded-bl-lg" />
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-4 border-r-4 border-blue-600 rounded-br-lg" />
              </div>
            </div>

            {/* Gesture HUD */}
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-2 text-[10px] font-extrabold text-slate-800 pointer-events-none">
              <span className="bg-white/90 px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                Zoom: {Math.round(transform.zoom * 100)}%
              </span>
              <span className="bg-white/90 px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                Tilt: {transform.rotate}°
              </span>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="space-y-2 pt-1">
            {/* Aspect Ratio Presets Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
              {Object.keys(RATIOS[mode]).map((key) => {
                const opt = RATIOS[mode][key];
                const isActive = aspectRatioKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleRatioChange(key)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Controls: Zoom, Mirror, Rotations */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-1.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 pl-1">Zoom</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleZoomStep(-0.15)}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 active:scale-90"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleZoomStep(0.15)}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 active:scale-90"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-1.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 pl-1">Rotate</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRotateNudge(-90)}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 active:scale-90"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleRotateNudge(90)}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 active:scale-90"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  <button
                    onClick={handleFlip}
                    title="Flip Mirror"
                    className={`p-1.5 rounded-xl border transition-all active:scale-90 ${
                      transform.flipH ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-400 active:scale-90"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Confirm Crop Button */}
            <button
              onClick={handleConfirm}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white font-black text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Live Crop</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
