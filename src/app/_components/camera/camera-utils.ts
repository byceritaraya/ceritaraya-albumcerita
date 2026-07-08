export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export async function cropImageTo3x4(base64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      
      // Calculate 3:4 target dimensions
      let targetWidth = width;
      let targetHeight = height;
      const aspect = 3 / 4;
      
      if (width / height > aspect) {
        // Source is wider than 3:4 (e.g., 16:9 landscape turned sideways into 9:16 portrait? No, usually naturalWidth/Height follow orientation).
        // If image is e.g. 1080x1920 (9:16), width/height = 0.5625. Aspect is 0.75.
        // If width/height > aspect, the image is too wide.
        targetWidth = height * aspect;
      } else {
        // Image is too tall (e.g. 9:16)
        targetHeight = width / aspect;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }
      
      // Center crop
      const startX = (width - targetWidth) / 2;
      const startY = (height - targetHeight) / 2;
      
      ctx.drawImage(img, startX, startY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(base64); // Fallback
    img.src = base64;
  });
}
