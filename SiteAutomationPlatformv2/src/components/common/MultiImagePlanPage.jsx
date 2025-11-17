import React, { useState, useRef, useCallback } from 'react';
import { Button, Card, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import html2canvas from 'html2canvas';
import MultiImageManager from './MultiImageManager';
import PageLayout from '../layout/PageLayout';
import { LAYOUT_CONSTANTS } from '../layout/layoutConstants';
import { API_BASE_URL } from '../../config/app.config';
import { getSiteName } from '../../utils/siteContext';
import { uploadToImgBB, saveImageToSQL } from '../../pages/VisualPlan/visualPlanUpload';
import PlanToolbox from '../../pages/VisualPlan/PlanToolbox';

/**
 * MultiImagePlanPage - Enhanced plan page supporting multiple background images
 * Replaces PlanPageBase with multi-image capability
 */
const MultiImagePlanPage = ({
  pageTitle,
  planType, // 'VT' or 'GTB'
  DraggableCardListComponent, // eslint-disable-line no-unused-vars
  availableIcons = [] // Icons generated from equipment data
}) => {
  const [activeImage, setActiveImage] = useState(null);
  const [iconAssignments, setIconAssignments] = useState({}); // { imageId: [iconIds] }
  const [imageNaturalWidth, setImageNaturalWidth] = useState(null);
  const [imageDisplayedWidth, setImageDisplayedWidth] = useState(null);
  const [addCircleHandler, setAddCircleHandler] = useState(null);
  const [addGaineHandler, setAddGaineHandler] = useState(null);
  const [addGaineVerticalHandler, setAddGaineVerticalHandler] = useState(null);

  const imageRef = useRef(null);
  const previewRef = useRef(null);
  const siteName = getSiteName();

  // Handle image load to get dimensions
  const onImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageNaturalWidth(imageRef.current.naturalWidth);
      setImageDisplayedWidth(imageRef.current.offsetWidth);
      console.log('📐 Image dimensions:', {
        natural: imageRef.current.naturalWidth,
        displayed: imageRef.current.offsetWidth
      });
    }
  }, []);

  // Handle active image change
  const handleImageSelect = (image) => {
    setActiveImage(image);
    console.log('🖼️ Active image changed:', image);
  };

  // Handle icon assignment changes
  const handleIconAssignmentChange = (imageId, assignedIconIds) => {
    setIconAssignments(prev => ({
      ...prev,
      [imageId]: assignedIconIds
    }));
    console.log('🎯 Icon assignments updated:', { imageId, assignedIconIds });
  };

  // Get icons assigned to active image
  const getActiveImageIcons = () => {
    if (!activeImage) return [];
    const assignedIds = iconAssignments[activeImage.id] || [];
    return availableIcons.filter(icon => assignedIds.includes(icon.id));
  };

  // Callback to receive the addCircle handler from DraggableCardList
  const handleAddCircleCallback = useCallback((handler) => {
    setAddCircleHandler(() => handler);
  }, []);

  // Callback to receive the addGaine handler from DraggableCardList
  const handleAddGaineCallback = useCallback((handler) => {
    setAddGaineHandler(() => handler);
  }, []);

  // Callback to receive the addGaineVertical handler from DraggableCardList
  const handleAddGaineVerticalCallback = useCallback((handler) => {
    setAddGaineVerticalHandler(() => handler);
  }, []);

  // Save icon positions and generate annotated image (like old PlanPageBase)
  const handleSavePositions = async () => {
    if (!activeImage || !siteName) {
      message.error('Aucune image sélectionnée ou nom du site manquant');
      return;
    }

    // ✅ Validate that grayscale image exists in SQL before creating annotated
    try {
      const validateResponse = await fetch(`${API_BASE_URL}/images/get-sql-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: siteName })
      });

      if (validateResponse.ok) {
        const allImages = await validateResponse.json();
        const grayscaleExists = allImages.some(
          img => img.image_id === activeImage.id &&
                 img.type === 'grayscale' &&
                 img.title === planType
        );

        if (!grayscaleExists) {
          message.error('Image en niveaux de gris introuvable dans la base de données. Veuillez télécharger à nouveau l\'image.');
          return;
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not validate grayscale image existence:', err);
      // Continue anyway - non-critical validation
    }

    console.log('💾 Saving positions for activeImage:', activeImage);

    try {
      message.loading({ content: 'Génération de l\'image annotée...', key: 'save' });

      // Get positions from localStorage (saved by VisualPlanDragArea)
      const savedData = localStorage.getItem('draggableCards');
      const shapes = savedData ? JSON.parse(savedData) : { cards: [], lines: [] };

      // Step 1: Generate annotated image using html2canvas (like old workflow)
      if (!previewRef.current) {
        throw new Error('Preview container not found');
      }

      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      // Convert canvas to base64 data URL (uploadToImgBB expects data URL, not blob)
      const annotatedDataUrl = canvas.toDataURL('image/png', 0.95);

      if (!annotatedDataUrl) {
        throw new Error('Failed to generate annotated image data URL');
      }

      message.loading({ content: 'Nettoyage des anciennes images...', key: 'save' });

      // Step 2: Check if annotated image already exists for this image_id
      // If it does, delete the old one from ImgBB before uploading new one
      try {
        const checkResponse = await fetch(`${API_BASE_URL}/images/get-sql-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: siteName })
        });

        if (checkResponse.ok) {
          const existingImages = await checkResponse.json();
          const oldAnnotated = existingImages.find(
            img => img.image_id === activeImage.id &&
                   img.type === 'annotated' &&
                   img.title === planType
          );

          if (oldAnnotated && oldAnnotated.delete_url) {
            console.log('🗑️ Deleting old annotated image from ImgBB:', oldAnnotated.delete_url);
            try {
              await fetch(`${API_BASE_URL}/images/delete-imgbb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ delete_url: oldAnnotated.delete_url })
              });
            } catch (deleteErr) {
              console.warn('⚠️ Failed to delete old image from ImgBB (non-critical):', deleteErr);
            }
          }
        }
      } catch (checkErr) {
        console.warn('⚠️ Failed to check for existing images (non-critical):', checkErr);
      }

      message.loading({ content: 'Téléchargement de l\'image annotée...', key: 'save' });

      // Step 3: Upload annotated image to ImgBB (use same base name as grayscale)
      const annotatedFileName = `${activeImage.id}_annotated`;

      // Convert data URL to Blob for upload
      const base64Data = annotatedDataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const annotatedBlob = new Blob([byteArray], { type: 'image/png' });
      const annotatedFile = new File([annotatedBlob], `${annotatedFileName}.png`, { type: 'image/png' });

      console.log('📤 Uploading annotated image with params:', {
        fileName: annotatedFile.name,
        fileSize: annotatedFile.size,
        fileType: annotatedFile.type,
        siteName,
        type: 'annotated',
        planType
      });

      const annotatedRes = await uploadToImgBB(annotatedFile, siteName, 'annotated', planType);

      if (!annotatedRes || !annotatedRes.url) {
        throw new Error('Annotated image upload failed');
      }

      console.log('✅ Annotated image uploaded:', annotatedRes.url);

      message.loading({ content: 'Enregistrement dans la base de données...', key: 'save' });

      // Step 4: Save annotated image metadata to SQL (with shapes field)
      // The backend will automatically delete old annotated image for this image_id
      await saveImageToSQL({
        image_id: activeImage.id, // Add image_id to identify which image this is
        site: siteName,
        type: 'annotated',
        title: planType,
        url_viewer: annotatedRes.url,
        delete_url: annotatedRes.delete_url,
        shapes: JSON.stringify(shapes),
        width: imageNaturalWidth || activeImage.width,
        height: Math.round((imageNaturalWidth || activeImage.width) / 1.5),
        crop_transform_x: activeImage.crop_transform_x || 0,
        crop_transform_y: activeImage.crop_transform_y || 0,
        crop_transform_width: activeImage.crop_transform_width || imageNaturalWidth,
        crop_transform_height: activeImage.crop_transform_height || Math.round((imageNaturalWidth || activeImage.width) / 1.5),
      });

      // Step 5: Update shapes field in grayscale image row
      const updateShapesRes = await fetch(`${API_BASE_URL}/images/update-shapes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: siteName,
          title: planType,
          type: 'grayscale',
          shapes: JSON.stringify(shapes),
          image_id: activeImage.id // Add image_id to identify which image to update
        })
      });

      if (!updateShapesRes.ok) {
        console.warn('⚠️ Failed to update shapes in grayscale row (non-critical)');
      }

      message.success({ content: 'Plan enregistré avec succès !', key: 'save' });
      console.log('✅ Complete save workflow finished:', {
        annotatedUrl: annotatedRes.url,
        shapes: shapes,
        imageId: activeImage.id
      });
    } catch (error) {
      console.error('❌ Error saving plan:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      message.error({ content: `Échec de l'enregistrement : ${error.message}`, key: 'save' });
    }
  };

  // Calculate aspect ratio for layout using actual image dimensions
  const imageAspectRatio = activeImage?.width && activeImage?.height
    ? `${activeImage.width} / ${activeImage.height}`
    : imageNaturalWidth
      ? `${imageNaturalWidth} / ${Math.round(imageNaturalWidth / 1.5)}`
      : '16 / 9';

  return (
    <DndProvider backend={HTML5Backend}>
      <PageLayout title={pageTitle} maxWidth={1600}>
        {/* Multi-Image Manager */}
        <div style={{ marginBottom: LAYOUT_CONSTANTS.MARGINS.SECTION }}>
          <MultiImageManager
            planType={planType}
            availableIcons={availableIcons}
            onImageSelect={handleImageSelect}
            onIconAssignmentChange={handleIconAssignmentChange}
          />
        </div>

        {/* External Toolbox - Only show when image is active */}
        {activeImage && (
          <div style={{
            marginBottom: LAYOUT_CONSTANTS.MARGINS.SECTION,
            display: 'flex',
            justifyContent: 'center'
          }}>
            <PlanToolbox
              onAddCircle={addCircleHandler}
              onAddGaine={addGaineHandler}
              onAddGaineVertical={addGaineVerticalHandler}
            />
          </div>
        )}

        {/* Image Preview with Icons */}
        <Card
          style={{
            width: '100%',
            margin: 'auto',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            position: 'relative',
          }}
          styles={{ body: { padding: 0 } }}
        >
          {activeImage ? (
            <div
              ref={previewRef}
              style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                backgroundColor: '#f5f5f5',
                overflow: 'auto',
                borderRadius: '0 0 16px 16px',
              }}
            >
              <img
                ref={imageRef}
                src={activeImage.url}
                alt="Image du Plan"
                onLoad={onImageLoad}
                onError={() => {
                  console.warn(`⚠️ ${planType} image failed to load`);
                  setActiveImage(null);
                  message.warning(`Image ${planType} non trouvée, veuillez recharger.`);
                }}
                style={{
                  maxWidth: '100%',
                  maxHeight: '800px',
                  width: 'auto',
                  height: 'auto',
                  display: 'block',
                  userSelect: 'none',
                  filter: 'grayscale(100%)',
                  imageRendering: 'crisp-edges',
                }}
                decoding="async"
                loading="lazy"
                draggable={false}
              />
              {imageNaturalWidth && imageDisplayedWidth && (
                <DraggableCardListComponent
                  imageNaturalWidth={imageNaturalWidth}
                  imageDisplayedWidth={imageDisplayedWidth}
                  containerRef={imageRef}
                  imageId={activeImage.id}
                  visibleIcons={getActiveImageIcons()}
                  onAddCircle={handleAddCircleCallback}
                  onAddGaine={handleAddGaineCallback}
                  onAddGaineVertical={handleAddGaineVerticalCallback}
                />
              )}
            </div>
          ) : (
            <div
              style={{
                padding: 100,
                textAlign: 'center',
                color: '#999',
                background: '#fafafa',
                borderRadius: '0 0 16px 16px',
                userSelect: 'none',
              }}
            >
              <h4 style={{ color: '#999' }}>Aucune image sélectionnée</h4>
              <p>Cliquez sur "Ajouter une image" pour ajouter une image de plan.</p>
            </div>
          )}
        </Card>

        {/* Save Button */}
        <div style={{
          marginTop: LAYOUT_CONSTANTS.MARGINS.BUTTON,
          maxWidth: 480,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSavePositions}
            style={{ width: '100%' }}
            disabled={!activeImage}
            size="large"
          >
            Enregistrer les positions
          </Button>
        </div>
      </PageLayout>
    </DndProvider>
  );
};

export default MultiImagePlanPage;
