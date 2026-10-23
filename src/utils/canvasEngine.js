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

// Anti-Pixelation Strict Compressor
export const compressToStrictKB = (canvas, targetKB, format = 'image/jpeg') => {
  const targetBytes = targetKB * 1024;

  if (format === 'image/png') {
    const dataUrl = canvas.toDataURL('image/png');
    const bytes = Math.round((dataUrl.length * 3) / 4);
    return { dataUrl, kb: +(bytes / 1024).toFixed(1), compliant: bytes <= targetBytes };
  }

  let minQ = 0.15;
  let maxQ = 0.98;
  let bestUrl = canvas.toDataURL(format, 0.90);
  let bestBytes = Math.round((bestUrl.length * 3) / 4);

  for (let i = 0; i < 8; i++) {
    const midQ = (minQ + maxQ) / 2;
    const url = canvas.toDataURL(format, midQ);
    const bytes = Math.round((url.length * 3) / 4);

    if (bytes <= targetBytes) {
      bestUrl = url;
      bestBytes = bytes;
      minQ = midQ;
    } else {
      maxQ = midQ;
    }
  }

  if (bestBytes > targetBytes) {
    let scale = 0.94;
    while (scale >= 0.70 && bestBytes > targetBytes) {
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = Math.round(canvas.width * scale);
      scaledCanvas.height = Math.round(canvas.height * scale);
      const sCtx = scaledCanvas.getContext('2d');
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

      const url = scaledCanvas.toDataURL(format, 0.75);
      const bytes = Math.round((url.length * 3) / 4);
      bestUrl = url;
      bestBytes = bytes;
      scale -= 0.08;
    }
  }

  return {
    dataUrl: bestUrl,
    kb: +(bestBytes / 1024).toFixed(1),
    bytes: bestBytes,
    compliant: bestBytes <= targetBytes
  };
};
