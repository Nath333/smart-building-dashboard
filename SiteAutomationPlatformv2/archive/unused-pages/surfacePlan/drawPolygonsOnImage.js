// drawPolygonsOnImage.js
const drawPolygonsOnImage = (imageSource, shapes) => {
  return new Promise((resolve) => {
    const img = new Image();
    
    // ✅ Set crossOrigin only for external URLs (ImgBB), not for base64 data
    if (!imageSource.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.src = imageSource;

    img.onload = () => {
      const { width, height } = img;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Keep all surface images in COLOR (no grayscale filter)
      ctx.drawImage(img, 0, 0);

      // Scale polygon coordinates
      const scale = (imgDom) => {
        if (!imgDom) return { scaleX: 1, scaleY: 1 };
        const scaleX = width / imgDom.width;
        const scaleY = height / imgDom.height;
        return { scaleX, scaleY };
      };

      // Try to find displayed DOM image for scale
      const imgDom = document.querySelector(`img[src="${img.src}"]`);
      const { scaleX, scaleY } = scale(imgDom);

      // Draw shapes
      shapes.forEach((shape) => {
        // Handle donut shapes - draw only the ring area, not the hole
        if (shape.type === 'donut' && shape.outerPoints && shape.innerPoints) {
          const baseColor = shape.color ? shape.color.replace('-donut', '') : 'blue';
          const fillColor = baseColor === 'red' ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)';
          const strokeColor = baseColor === 'red' ? '#ff4d4f' : '#1890ff';
          
          // Use path filling with evenodd rule to create true donut
          const path2D = new Path2D();
          
          // Outer path (clockwise)
          path2D.moveTo(shape.outerPoints[0].x * scaleX, shape.outerPoints[0].y * scaleY);
          shape.outerPoints.slice(1).forEach((p) => {
            path2D.lineTo(p.x * scaleX, p.y * scaleY);
          });
          path2D.closePath();
          
          // Inner path (counter-clockwise for evenodd hole)
          const innerReversed = [...shape.innerPoints].reverse();
          path2D.moveTo(innerReversed[0].x * scaleX, innerReversed[0].y * scaleY);
          innerReversed.slice(1).forEach((p) => {
            path2D.lineTo(p.x * scaleX, p.y * scaleY);
          });
          path2D.closePath();
          
          // Fill using evenodd - creates automatic hole
          ctx.fillStyle = fillColor;
          ctx.fill(path2D, 'evenodd');
          
          // Draw borders separately
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          
          // Outer border
          ctx.beginPath();
          ctx.moveTo(shape.outerPoints[0].x * scaleX, shape.outerPoints[0].y * scaleY);
          shape.outerPoints.slice(1).forEach((p) => {
            ctx.lineTo(p.x * scaleX, p.y * scaleY);
          });
          ctx.closePath();
          ctx.stroke();
          
          // Inner border
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(shape.innerPoints[0].x * scaleX, shape.innerPoints[0].y * scaleY);
          shape.innerPoints.slice(1).forEach((p) => {
            ctx.lineTo(p.x * scaleX, p.y * scaleY);
          });
          ctx.closePath();
          ctx.stroke();
        }
        // Handle regular polygons
        else if (shape.type === 'polygon' && shape.points && shape.points.length >= 3) {
          const isHollow = shape.color && shape.color.includes('hollow');
          const baseColor = shape.color ? shape.color.replace('-hollow', '') : 'blue';
          
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x * scaleX, shape.points[0].y * scaleY);
          shape.points.slice(1).forEach((p) => {
            ctx.lineTo(p.x * scaleX, p.y * scaleY);
          });
          ctx.closePath();
          
          // Fill for non-hollow polygons
          if (!isHollow) {
            ctx.fillStyle = baseColor === 'red' ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)';
            ctx.fill();
          }
          
          // Stroke for all polygons
          ctx.strokeStyle = baseColor === 'red' ? '#ff4d4f' : '#1890ff';
          ctx.lineWidth = isHollow ? 4 : 2;
          ctx.stroke();
        }
      });

      const finalImage = canvas.toDataURL('image/png');
      resolve(finalImage);
    };
  });
};

export default drawPolygonsOnImage;