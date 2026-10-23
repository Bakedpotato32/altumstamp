import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { Capacitor } from '@capacitor/core';

export const exportFile = async ({ dataUrl, fileName, mimeType = 'image/jpeg' }) => {
  if (!dataUrl) return { success: false, error: 'No data URL provided' };

  const cleanBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const isImage = mimeType.startsWith('image/') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.webp');

  // 1. Native Android Execution (Capacitor)
  if (Capacitor.isNativePlatform()) {
    try {
      if (isImage) {
        // Direct save to Android Gallery / Photos album
        await Media.savePhoto({
          path: dataUrl,
          albumIdentifier: 'AltumStamp'
        });
        return { success: true, destination: 'gallery' };
      } else {
        // Save PDF documents directly to Documents/AltumStamp/
        await Filesystem.writeFile({
          path: `AltumStamp/${fileName}`,
          data: cleanBase64,
          directory: Directory.Documents,
          recursive: true
        });
        return { success: true, destination: 'documents' };
      }
    } catch (nativeErr) {
      console.warn('Primary native storage failed, writing to Documents fallback:', nativeErr);
      try {
        await Filesystem.writeFile({
          path: `AltumStamp/${fileName}`,
          data: cleanBase64,
          directory: Directory.Documents,
          recursive: true
        });
        return { success: true, destination: 'documents' };
      } catch (fallbackErr) {
        console.error('All native file writes failed:', fallbackErr);
      }
    }
  }

  // 2. Web Browser Fallback (Standard Blob Download)
  try {
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);

    return { success: true, destination: 'downloads' };
  } catch (webErr) {
    console.error('Web download failed:', webErr);
    return { success: false, error: webErr };
  }
};
