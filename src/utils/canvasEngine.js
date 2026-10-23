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

// Precise Adaptive Strict Compressor (Guarantees <= targetKB at highest possible quality)
export const compressToStrictKB = (canvas, targetKB, format = 'image/jpeg') => {
  const targetBytes = Math.max(3072, Math.floor(targetKB * 1024));

  const getBytes = (dataUrl) => {
    const idx = dataUrl.indexOf(',');
    const base64 = idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
    let padding = 0;
    if (base64.endsWith('==')) padding = 2;
    else if (base64.endsWith('=')) padding = 1;
    return Math.floor((base64.length * 3) / 4) - padding;
  };

  // PNG Mode
  if (format === 'image/png') {
    let scale = 1.0;
    let bestUrl = canvas.toDataURL('image/png');
    let bestBytes = getBytes(bestUrl);

    while (bestBytes > targetBytes && scale >= 0.18) {
      scale -= 0.08;
      const sCanvas = document.createElement('canvas');
      sCanvas.width = Math.max(60, Math.round(canvas.width * scale));
      sCanvas.height = Math.max(80, Math.round(canvas.height * scale));
      const ctx = sCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, sCanvas.width, sCanvas.height);
      const url = sCanvas.toDataURL('image/png');
      const b = getBytes(url);
      bestUrl = url;
      bestBytes = b;
    }
    return { dataUrl: bestUrl, kb: +(bestBytes / 1024).toFixed(1), bytes: bestBytes, compliant: bestBytes <= targetBytes };
  }

  // JPEG / WebP Multi-Tier Scale & Binary Quality Engine
  const candidateScales = [1.0, 0.90, 0.82, 0.74, 0.65, 0.56, 0.48, 0.40, 0.32];
  let bestCandidate = null;

  for (const scale of candidateScales) {
    let testCanvas;
    if (scale === 1.0) {
      testCanvas = canvas;
    } else {
      testCanvas = document.createElement('canvas');
      testCanvas.width = Math.max(60, Math.round(canvas.width * scale));
      testCanvas.height = Math.max(80, Math.round(canvas.height * scale));
      const ctx = testCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, testCanvas.width, testCanvas.height);
    }

    // Binary search for highest quality in [0.08, 0.98] that satisfies <= targetBytes
    let lowQ = 0.08;
    let highQ = 0.98;
    let scaleBestUrl = null;
    let scaleBestBytes = 0;
    let scaleBestQuality = 0;

    for (let iter = 0; iter < 8; iter++) {
      const midQ = (lowQ + highQ) / 2;
      const url = testCanvas.toDataURL(format, midQ);
      const bytes = getBytes(url);

      if (bytes <= targetBytes) {
        scaleBestUrl = url;
        scaleBestBytes = bytes;
        scaleBestQuality = midQ;
        lowQ = midQ; // Try higher quality
      } else {
        highQ = midQ; // Too big
      }
    }

    if (scaleBestUrl) {
      if (!bestCandidate) {
        bestCandidate = { url: scaleBestUrl, bytes: scaleBestBytes, quality: scaleBestQuality, scale };
      } else {
        if (scaleBestQuality > bestCandidate.quality + 0.15) {
          bestCandidate = { url: scaleBestUrl, bytes: scaleBestBytes, quality: scaleBestQuality, scale };
        }
      }

      // Early stop if scale >= 0.80 with quality >= 0.70
      if (scale >= 0.80 && scaleBestQuality >= 0.70) {
        break;
      }
    }
  }

  // Fallback if even 0.32 scale didn't fit (ultra-small target KB)
  if (!bestCandidate) {
    let scale = 0.26;
    while (scale >= 0.08) {
      const sCanvas = document.createElement('canvas');
      sCanvas.width = Math.max(40, Math.round(canvas.width * scale));
      sCanvas.height = Math.max(50, Math.round(canvas.height * scale));
      const ctx = sCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, sCanvas.width, sCanvas.height);

      const url = sCanvas.toDataURL(format, 0.20);
      const bytes = getBytes(url);
      bestCandidate = { url, bytes, quality: 0.20, scale };
      if (bytes <= targetBytes) break;
      scale -= 0.04;
    }
  }

  const finalUrl = bestCandidate.url;
  const finalBytes = bestCandidate.bytes;
  const finalKB = +(finalBytes / 1024).toFixed(1);

  return {
    dataUrl: finalUrl,
    kb: finalKB,
    bytes: finalBytes,
    compliant: finalBytes <= targetBytes
  };
};
