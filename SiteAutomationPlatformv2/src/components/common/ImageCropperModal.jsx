import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal, Button, Typography } from 'antd';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import useImage from "use-image";
const { Text } = Typography;

const ImageCropperModal = ({ imageSrc, open, onCancel, onCropConfirm }) => {
  const stageRef = useRef();
  const cropRectRef = useRef();
  const trRef = useRef();

  const [image] = useImage(imageSrc, 'anonymous');
  const [displayScale, setDisplayScale] = useState(1);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [cropBox, setCropBox] = useState(null);

  const getMaxDisplaySize = useCallback(() => {
    const isPortrait = window.innerHeight > window.innerWidth;
    return {
      maxWidth: window.innerWidth * 0.95,
      maxHeight: window.innerHeight * (isPortrait ? 0.75 : 0.85),
    };
  }, []);

  const computeDisplaySize = useCallback(() => {
    if (!image?.width || !image?.height) return;

    const { maxWidth, maxHeight } = getMaxDisplaySize();
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);

    const width = image.width * scale;
    const height = image.height * scale;

    setDisplayScale(scale);
    setDisplaySize({ width, height });

    if (!cropBox) {
      setCropBox({
        x: width * 0.25,
        y: height * 0.25,
        width: width * 0.5,
        height: height * 0.5,
      });
    }
  }, [image, getMaxDisplaySize, cropBox]);

  useEffect(() => {
    if (open && image) computeDisplaySize();
  }, [open, image, computeDisplaySize]);

  useEffect(() => {
    const handleResize = () => computeDisplaySize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [computeDisplaySize]);

  useEffect(() => {
    if (trRef.current && cropRectRef.current) {
      trRef.current.nodes([cropRectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [cropBox]);

const handleCrop = () => {
  if (!cropBox || !image) return;

  const canvas = document.createElement('canvas');
  const sx = cropBox.x / displayScale;
  const sy = cropBox.y / displayScale;
  const sw = cropBox.width / displayScale;
  const sh = cropBox.height / displayScale;

  // Scale up the output image by 4x so devices appear relatively smaller
  const outputScale = 4;
  canvas.width = sw * outputScale;
  canvas.height = sh * outputScale;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    sx, sy, sw, sh,
    0, 0, sw * outputScale, sh * outputScale
  );

  canvas.toBlob((blob) => {
    if (blob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        const cropData = {
          base64: base64data,
          cropBox: {
            x: cropBox.x / displayScale,
            y: cropBox.y / displayScale,
            width: cropBox.width / displayScale,
            height: cropBox.height / displayScale,
          },
          displayScale,
          imageNaturalWidth: image.width,
          imageRenderedWidth: displaySize.width,
        };
        
        // Backward compatibility: check function signature to determine expected format
        if (!onCropConfirm) {
          console.warn('⚠️ No onCropConfirm callback provided');
          return;
        }

        const funcStr = onCropConfirm.toString();

        // If function uses destructuring ({ base64, ... }) or multiple params, pass object
        // If function uses single simple parameter (croppedDataUrl), pass string
        if (funcStr.includes('({') || (onCropConfirm.length && onCropConfirm.length > 1)) {
          // PlanPageBase pattern: onCropConfirm({ base64, cropBox, ... })
          console.log('🎯 Passing cropData object to onCropConfirm');
          onCropConfirm(cropData);
        } else {
          // SurfacePlan pattern: onCropConfirm(croppedDataUrl)
          console.log('🎯 Passing base64 string to onCropConfirm');
          onCropConfirm(base64data);
        }
      };
      reader.readAsDataURL(blob);
    }
  }, 'image/jpeg');
};

  return (
    <Modal
      title="Recadrer l'image"
      open={open}
      onCancel={onCancel}
      centered
      width="95vw"
      styles={{
        body: {
          padding: 12,
          maxHeight: '90vh',
          overflow: 'auto',
          backgroundColor: '#fafafa',
        },
      }}
      footer={[
        <Button key="cancel" onClick={onCancel}>Annuler</Button>,
        <Button key="confirm" type="primary" onClick={handleCrop}>Recadrer</Button>,
      ]}
    >
      {image && cropBox && (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              width: displaySize.width,
              height: displaySize.height,
              overflow: 'hidden',
              border: '1px solid #d9d9d9',
              borderRadius: 8,
              background: '#fff',
            }}
          >
            <Stage
              ref={stageRef}
              width={displaySize.width}
              height={displaySize.height}
              style={{ background: '#f5f5f5', touchAction: 'none' }}
            >
              <Layer>
                <KonvaImage
                  image={image}
                  scaleX={displayScale}
                  scaleY={displayScale}
                />
                <Rect
                  {...cropBox}
                  fill="rgba(255,255,0,0.25)"
                  stroke="yellow"
                  strokeWidth={2}
                  draggable
                  ref={cropRectRef}
                  onDragEnd={(e) =>
                    setCropBox((prev) => ({
                      ...prev,
                      x: e.target.x(),
                      y: e.target.y(),
                    }))
                  }
                  onTransformEnd={() => {
                    const node = cropRectRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    setCropBox({
                      x: node.x(),
                      y: node.y(),
                      width: Math.max(10, node.width() * scaleX),
                      height: Math.max(10, node.height() * scaleY),
                    });

                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                />
                <Transformer
                  ref={trRef}
                  boundBoxFunc={(oldBox, newBox) =>
                    newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
                  }
                />
              </Layer>
            </Stage>
          </div>
          <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
            Glissez ou redimensionnez le rectangle pour définir la zone de recadrage.
          </Text>
        </div>
      )}
    </Modal>
  );
};

export default ImageCropperModal;
