export const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

// Smart Signature Paper Bleach
export const processSignatureInk = async (imageSrc, { threshold = 175, inkColor = 'black', enabled = true } = {}) => {
  if (!enabled || !imageSrc) return imageSrc;

  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;

  let minLum = 255;
  let maxLum = 0;
  for (let i = 0; i < d.length; i += 16) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  if (maxLum - minLum < 18) {
    return imageSrc;
  }

  const effectiveThreshold = Math.max(minLum + 12, Math.min(threshold, maxLum - 8));

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum > effectiveThreshold) {
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
    } else {
      const factor = lum / effectiveThreshold;
      if (inkColor === 'blue') {
        d[i] = Math.max(0, Math.min(255, 12 * factor));
        d[i + 1] = Math.max(0, Math.min(255, 60 * factor));
        d[i + 2] = Math.max(0, Math.min(255, 185 + factor * 50));
      } else {
        const v = Math.max(0, Math.min(255, lum * 0.32));
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
};

// 100% WYSIWYG Mathematical Crop Projector
export const extractCroppedImage = async (imageSrc, cropBox, transform, renderedDisplaySize, outWidth = 600) => {
  const img = await loadImage(imageSrc);
  const outHeight = Math.round(outWidth * (cropBox.height / cropBox.width));

  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outWidth, outHeight);

  const R = outWidth / cropBox.width;

  ctx.save();
  ctx.translate(outWidth / 2 + transform.panX * R, outHeight / 2 + transform.panY * R);
  ctx.rotate((transform.rotate * Math.PI) / 180);
  ctx.scale((transform.flipH ? -1 : 1) * transform.zoom, transform.zoom);

  const drawW = renderedDisplaySize.width * R;
  const drawH = renderedDisplaySize.height * R;
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

  ctx.restore();
  return canvas.toDataURL('image/jpeg', 0.98);
};

// Seamless UP Board Composite Merger (Edge-to-edge photo and signature, ZERO gutters)
export const renderCompositeSlip = async ({
  photoSrc,
  signatureSrc,
  canvasWidth = 350,
  canvasHeight = 450,
  photoRatio = 74,
  includeDivider = true,
  dividerColor = '#000000',
  dividerWidth = 2,
  borderWidth = 2,
  borderColor = '#000000'
}) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const innerX = borderWidth;
  const innerY = borderWidth;
  const innerWidth = canvasWidth - borderWidth * 2;
  const innerHeight = canvasHeight - borderWidth * 2;

  const photoHeight = Math.round((innerHeight * photoRatio) / 100);
  const sigHeight = innerHeight - photoHeight;

  // 1. Candidate Photo (Full-bleed edge-to-edge)
  if (photoSrc) {
    try {
      const pImg = await loadImage(photoSrc);
      ctx.save();
      ctx.beginPath();
      ctx.rect(innerX, innerY, innerWidth, photoHeight);
      ctx.clip();

      const pAspect = pImg.width / pImg.height;
      const targetAspect = innerWidth / photoHeight;
      let drawW, drawH, drawX, drawY;

      if (pAspect > targetAspect) {
        drawH = photoHeight;
        drawW = photoHeight * pAspect;
        drawX = innerX + (innerWidth - drawW) / 2;
        drawY = innerY;
      } else {
        drawW = innerWidth;
        drawH = innerWidth / pAspect;
        drawX = innerX;
        drawY = innerY + (photoHeight - drawH) / 2;
      }

      ctx.drawImage(pImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(innerX, innerY, innerWidth, photoHeight);
    }
  } else {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(innerX, innerY, innerWidth, photoHeight);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Candidate Passport Photo', canvasWidth / 2, photoHeight / 2);
  }

  // 2. Demarcation Divider Line
  const dividerY = innerY + photoHeight;
  if (includeDivider) {
    ctx.strokeStyle = dividerColor;
    ctx.lineWidth = dividerWidth;
    ctx.beginPath();
    ctx.moveTo(innerX, dividerY);
    ctx.lineTo(innerX + innerWidth, dividerY);
    ctx.stroke();
  }

  // 3. Candidate Signature (Full-bleed edge-to-edge, NO white border gutters)
  const sigY = dividerY;
  if (signatureSrc) {
    try {
      const sImg = await loadImage(signatureSrc);
      ctx.save();
      ctx.beginPath();
      ctx.rect(innerX, sigY, innerWidth, sigHeight);
      ctx.clip();

      const sAspect = sImg.width / sImg.height;
      const tAspect = innerWidth / sigHeight;
      let sDrawW, sDrawH, sDrawX, sDrawY;

      if (sAspect > tAspect) {
        sDrawH = sigHeight;
        sDrawW = sigHeight * sAspect;
        sDrawX = innerX + (innerWidth - sDrawW) / 2;
        sDrawY = sigY;
      } else {
        sDrawW = innerWidth;
        sDrawH = innerWidth / sAspect;
        sDrawX = innerX;
        sDrawY = sigY + (sigHeight - sDrawH) / 2;
      }

      ctx.drawImage(sImg, sDrawX, sDrawY, sDrawW, sDrawH);
      ctx.restore();
    } catch {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(innerX, sigY, innerWidth, sigHeight);
    }
  } else {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(innerX, sigY, innerWidth, sigHeight);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Candidate Signature', canvasWidth / 2, sigY + sigHeight / 2);
  }

  // 4. Perimeter Border
  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvasWidth - borderWidth, canvasHeight - borderWidth);
  }

  return canvas;
};

// Adaptive Precision Strict Compressor (Guarantees <= targetKB at highest possible clarity)
export const compressToStrictKB = (canvas, targetKB, format = 'image/jpeg') => {
  const targetBytes = targetKB * 1024;

  if (format === 'image/png') {
    let currentCanvas = canvas;
    let dataUrl = currentCanvas.toDataURL('image/png');
    let bytes = Math.round((dataUrl.length * 3) / 4);
    let scale = 0.92;

    while (bytes > targetBytes && scale >= 0.2) {
      const sCanvas = document.createElement('canvas');
      sCanvas.width = Math.max(100, Math.round(canvas.width * scale));
      sCanvas.height = Math.max(120, Math.round(canvas.height * scale));
      const sCtx = sCanvas.getContext('2d');
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(canvas, 0, 0, sCanvas.width, sCanvas.height);
      dataUrl = sCanvas.toDataURL('image/png');
      bytes = Math.round((dataUrl.length * 3) / 4);
      scale -= 0.08;
    }
    return { dataUrl, kb: +(bytes / 1024).toFixed(1), bytes, compliant: bytes <= targetBytes };
  }

  // 1. Evaluate baseline lowest quality
  const lowestUrl = canvas.toDataURL(format, 0.06);
  const lowestBytes = Math.round((lowestUrl.length * 3) / 4);

  let activeCanvas = canvas;

  // 2. If canvas cannot fit into targetKB at lowest quality (e.g. 10KB or 20KB target),
  // adaptively scale canvas resolution down so it fits while preserving maximum sharpness
  if (lowestBytes > targetBytes) {
    let scale = Math.sqrt(targetBytes / lowestBytes) * 0.96;
    scale = Math.min(0.95, Math.max(0.25, scale));

    while (scale >= 0.18) {
      const sCanvas = document.createElement('canvas');
      sCanvas.width = Math.max(120, Math.round(canvas.width * scale));
      sCanvas.height = Math.max(150, Math.round(canvas.height * scale));
      const sCtx = sCanvas.getContext('2d');
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(canvas, 0, 0, sCanvas.width, sCanvas.height);

      const testUrl = sCanvas.toDataURL(format, 0.15);
      const testBytes = Math.round((testUrl.length * 3) / 4);
      activeCanvas = sCanvas;
      if (testBytes <= targetBytes) {
        break;
      }
      scale -= 0.07;
    }
  }

  // 3. Binary search on activeCanvas for the HIGHEST possible quality under targetBytes
  let minQ = 0.05;
  let maxQ = 0.98;
  let bestUrl = null;
  let bestBytes = 0;

  for (let i = 0; i < 9; i++) {
    const midQ = (minQ + maxQ) / 2;
    const url = activeCanvas.toDataURL(format, midQ);
    const bytes = Math.round((url.length * 3) / 4);

    if (bytes <= targetBytes) {
      bestUrl = url;
      bestBytes = bytes;
      minQ = midQ; // Try higher quality
    } else {
      maxQ = midQ; // Too big, reduce quality
    }
  }

  // 4. Fallback guard: if still null, downscale micro step
  if (!bestUrl) {
    let scale = 0.85;
    while (scale >= 0.15) {
      const sCanvas = document.createElement('canvas');
      sCanvas.width = Math.max(80, Math.round(activeCanvas.width * scale));
      sCanvas.height = Math.max(100, Math.round(activeCanvas.height * scale));
      const sCtx = sCanvas.getContext('2d');
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(activeCanvas, 0, 0, sCanvas.width, sCanvas.height);

      const url = sCanvas.toDataURL(format, 0.35);
      const bytes = Math.round((url.length * 3) / 4);
      if (bytes <= targetBytes) {
        bestUrl = url;
        bestBytes = bytes;
        break;
      }
      scale -= 0.1;
    }
  }

  if (!bestUrl) {
    bestUrl = activeCanvas.toDataURL(format, 0.05);
    bestBytes = Math.round((bestUrl.length * 3) / 4);
  }

  return {
    dataUrl: bestUrl,
    kb: +(bestBytes / 1024).toFixed(1),
    bytes: bestBytes,
    compliant: bestBytes <= targetBytes
  };
};
