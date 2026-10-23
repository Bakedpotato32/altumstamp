import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const exportFile = async ({ dataUrl, fileName, mimeType = 'image/jpeg' }) => {
  if (!dataUrl) return { success: false, error: 'No data URL provided' };

  const cleanBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

  // 1. Native Android Execution (Capacitor)
  if (Capacitor.isNativePlatform()) {
    try {
      // Save directly into the device's native cache directory
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: cleanBase64,
        directory: Directory.Cache
      });

      // Trigger the native Android system save / share sheet (Save to Downloads, Drive, etc.)
      await Share.share({
        title: fileName,
        text: `AltumStamp: ${fileName}`,
        url: savedFile.uri,
        dialogTitle: `Save ${fileName}`
      });

      return { success: true, native: true, uri: savedFile.uri };
    } catch (nativeErr) {
      console.warn('Native Filesystem/Share failed, using web fallback:', nativeErr);
    }
  }

  // 2. Web Browser Fallback (Blob Anchor Download)
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

    return { success: true, native: false };
  } catch (webErr) {
    console.error('All download methods failed:', webErr);
    return { success: false, error: webErr };
  }
};
