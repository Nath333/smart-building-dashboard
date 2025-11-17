// Image processing utilities for Visual Plan page

export const generateGrayscaleImage = (imageElement) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    
    ctx.drawImage(imageElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // Return base64 data URL
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      } else {
        reject(new Error('Failed to generate grayscale image blob'));
      }
    }, 'image/png');
  });
};

export const drawOverlayOnCanvas = async (imageElement, containerRef, html2canvas) => {
  if (!containerRef) {
    throw new Error('Container reference is required');
  }
  
  try {
    // Use html2canvas to capture the entire preview container with icons overlay
    const canvas = await html2canvas(containerRef, {
      allowTaint: true,
      backgroundColor: null,
      scale: 1,
      logging: false,
      useCORS: true,
    });
    
    // Convert canvas to base64 data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('❌ Error generating annotated image:', error);
    throw new Error('Failed to generate annotated image');
  }
};

export const parseCropTransform = () => {
  const cropTransform = localStorage.getItem('cropTransform');
  if (!cropTransform) {
    return {
      crop_transform_x: 0,
      crop_transform_y: 0,
      crop_transform_width: 0,
      crop_transform_height: 0,
    };
  }
  
  try {
    const parsed = JSON.parse(cropTransform);
    return {
      crop_transform_x: parsed.cropBox?.x || 0,
      crop_transform_y: parsed.cropBox?.y || 0,
      crop_transform_width: parsed.cropBox?.width || 0,
      crop_transform_height: parsed.cropBox?.height || 0,
    };
  } catch (e) {
    console.error('Failed to parse crop transform:', e);
    return {
      crop_transform_x: 0,
      crop_transform_y: 0,
      crop_transform_width: 0,
      crop_transform_height: 0,
    };
  }
};