import React, { useState, useEffect } from 'react';
import { Tabs, Button, Upload, message, Modal, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import ImageCropperModal from './ImageCropperModal';
import { uploadToImgBB, saveImageToSQL, deleteFromImgBB } from '../../pages/VisualPlan/visualPlanUpload';
import { generateGrayscaleImage } from '../../pages/VisualPlan/imageUtils';
import { getSiteName } from '../../utils/siteContext';
import { API_BASE_URL } from '../../config/app.config';

const MAX_FILE_SIZE_MB = 5;

/**
 * MultiImageManager - Manages multiple background images for visual plans
 * Each image can have its own set of assigned icons
 */
const MultiImageManager = ({
  planType, // 'VT' or 'GTB'
  availableIcons = [], // Array of all available icons with {id, label, moduleType}
  onImageSelect, // Callback when active image changes
  onIconAssignmentChange // Callback when icon assignments change
}) => {
  const [images, setImages] = useState([]);
  const [activeImageId, setActiveImageId] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

  const siteName = getSiteName();

  // Load saved images from SQL on mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/images/get-sql-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: siteName }),
        });

        if (response.ok) {
          const sqlImages = await response.json();
          console.log(`📊 [MultiImageManager] Raw SQL images for ${planType}:`, sqlImages);

          // Filter for grayscale images of this plan type
          const planImages = sqlImages
            .filter(img => img.title === planType && img.type === 'grayscale')
            .map(img => ({
              id: img.image_id || `image-${Date.now()}`,
              title: img.comments || 'Image du Plan',
              url: img.url_viewer,
              deleteUrl: img.delete_url,
              width: img.width,
              height: img.height,
              crop_transform_x: img.crop_transform_x,
              crop_transform_y: img.crop_transform_y,
              crop_transform_width: img.crop_transform_width,
              crop_transform_height: img.crop_transform_height,
              assignedIcons: [] // Will be populated from visual_positions
            }));

          console.log(`📸 [MultiImageManager] Filtered ${planImages.length} grayscale images for planType "${planType}"`);
          if (planImages.length > 0) {
            console.log('🎯 [MultiImageManager] Setting active image:', planImages[0]);
            setImages(planImages);
            setActiveImageId(planImages[0].id);
            onImageSelect?.(planImages[0]);
          } else {
            console.log('⚠️ [MultiImageManager] No images found matching criteria');
          }
        }
      } catch (error) {
        console.error('❌ Error loading images:', error);
      }
    };

    if (siteName && siteName !== 'unknown') {
      loadImages();
    }
  }, [siteName, planType]);

  // Validate image upload
  const beforeUpload = (file) => {
    const isValidType = /^image\/(png|jpeg|jpg|webp|gif)$/.test(file.type);
    if (!isValidType) {
      message.error("Only image files (PNG, JPEG, WebP, GIF) are accepted.");
      return false;
    }
    if (file.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
      message.error(`File must not exceed ${MAX_FILE_SIZE_MB} MB.`);
      return false;
    }

    // Preview and open crop modal
    const reader = new FileReader();
    reader.onload = e => {
      setPendingImageSrc(e.target.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    return false;
  };

  // Handle cropped image upload
  const handleCropComplete = async (cropData) => {
    try {
      message.loading({ content: 'Téléchargement de l\'image...', key: 'upload' });

      // Extract data from cropData object (ImageCropperModal format)
      const { base64, cropBox } = cropData;

      const cropTransform = {
        x: cropBox.x,
        y: cropBox.y,
        width: cropBox.width,
        height: cropBox.height
      };

      // Create an Image element from base64
      const image = new Image();
      image.src = base64;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      // Generate grayscale version
      const grayscaleBlob = await generateGrayscaleImage(image);

      // Upload to ImgBB with readable image counter
      const imageNumber = images.length + 1;
      const imageId = `${siteName}_${planType}_image${imageNumber}`;

      // Convert blob to File for upload
      const grayscaleFile = new File([grayscaleBlob], `${imageId}_grayscale.png`, { type: 'image/png' });

      const grayscaleRes = await uploadToImgBB(
        grayscaleFile,
        siteName,
        'grayscale',
        planType
      );

      if (!grayscaleRes?.url) {
        throw new Error('ImgBB upload failed');
      }

      // Save grayscale to SQL (use snake_case for API compatibility)
      const imageTitle = `Plan ${images.length + 1}`;
      await saveImageToSQL({
        image_id: imageId, // Add image_id to identify which image this is
        site: siteName,
        type: 'grayscale',
        title: planType,
        comments: imageTitle, // ✅ Add image title in comments field
        url_viewer: grayscaleRes.url,
        delete_url: grayscaleRes.delete_url,
        shapes: JSON.stringify([]), // Empty shapes array for now
        width: image.naturalWidth,
        height: image.naturalHeight,
        crop_transform_x: cropTransform.x,
        crop_transform_y: cropTransform.y,
        crop_transform_width: cropTransform.width,
        crop_transform_height: cropTransform.height,
      });

      // ✅ Create initial annotated image (same as grayscale, no icons yet)
      // This ensures we always have both grayscale and annotated images
      message.loading({ content: 'Creating initial annotated image...', key: 'upload' });

      // Convert blob to File for upload
      const annotatedFile = new File([grayscaleBlob], `${imageId}_annotated.png`, { type: 'image/png' });

      const initialAnnotatedRes = await uploadToImgBB(
        annotatedFile,
        siteName,
        'annotated',
        planType
      );

      if (!initialAnnotatedRes?.url) {
        throw new Error('Initial annotated image upload failed');
      }

      await saveImageToSQL({
        image_id: imageId,
        site: siteName,
        type: 'annotated',
        title: planType,
        comments: imageTitle,
        url_viewer: initialAnnotatedRes.url,
        delete_url: initialAnnotatedRes.delete_url,
        shapes: JSON.stringify([]), // Empty shapes - will be updated when user saves positions
        width: image.naturalWidth,
        height: image.naturalHeight,
        crop_transform_x: cropTransform.x,
        crop_transform_y: cropTransform.y,
        crop_transform_width: cropTransform.width,
        crop_transform_height: cropTransform.height,
      });

      // Add to state (include all metadata for proper saving later)
      const newImage = {
        id: imageId,
        title: `Plan ${images.length + 1}`,
        url: grayscaleRes.url,
        deleteUrl: grayscaleRes.delete_url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        crop_transform_x: cropTransform.x,
        crop_transform_y: cropTransform.y,
        crop_transform_width: cropTransform.width,
        crop_transform_height: cropTransform.height,
        assignedIcons: []
      };

      setImages(prev => [...prev, newImage]);
      setActiveImageId(newImage.id);
      onImageSelect?.(newImage);

      message.success({ content: 'Image téléchargée avec succès !', key: 'upload' });
      setCropModalOpen(false);
      setPendingImageSrc(null);
    } catch (error) {
      console.error('❌ Upload error:', error);
      message.error({ content: 'Échec du téléchargement. Veuillez réessayer.', key: 'upload' });
    }
  };

  // Delete an image
  const handleDeleteImage = async (imageId) => {
    Modal.confirm({
      title: 'Supprimer l\'Image',
      content: 'Êtes-vous sûr de vouloir supprimer cette image? Les positions des icônes seront également supprimées.',
      okText: 'Supprimer',
      okType: 'danger',
      onOk: async () => {
        try {
          const image = images.find(img => img.id === imageId);
          if (!image) return;

          message.loading({ content: 'Deleting images...', key: 'delete' });

          // Step 1: Get all images (grayscale + annotated) for this image_id from SQL
          const sqlImagesResponse = await fetch(`${API_BASE_URL}/images/get-sql-images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site: siteName })
          });

          if (sqlImagesResponse.ok) {
            const allImages = await sqlImagesResponse.json();

            // Find both grayscale and annotated images for this image_id
            const imagesToDelete = allImages.filter(
              img => img.image_id === imageId &&
                     img.title === planType &&
                     (img.type === 'grayscale' || img.type === 'annotated')
            );

            console.log(`🗑️ Found ${imagesToDelete.length} images to delete for image_id: ${imageId}`, imagesToDelete);

            // Step 2: Delete each image from ImgBB
            for (const img of imagesToDelete) {
              if (img.delete_url) {
                try {
                  await deleteFromImgBB(img.delete_url);
                  console.log(`✅ Deleted ${img.type} from ImgBB:`, img.delete_url);
                } catch (err) {
                  console.warn(`⚠️ Failed to delete ${img.type} from ImgBB (non-critical):`, err);
                }
              }
            }

            // Step 3: Delete from SQL by image_id (deletes both grayscale and annotated)
            const deleteSqlResponse = await fetch(`${API_BASE_URL}/images/delete-sql-by-image-id`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                site: siteName,
                image_id: imageId,
                title: planType
              })
            });

            if (!deleteSqlResponse.ok) {
              console.warn('⚠️ Failed to delete from SQL (non-critical)');
            } else {
              const result = await deleteSqlResponse.json();
              console.log(`✅ Deleted ${result.deletedCount || 0} entries from SQL`);
            }
          }

          // Step 4: Delete icon positions for this image
          await fetch(`${API_BASE_URL}/api/visual-positions/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              siteName,
              pageType: 'vt_plan',
              imageId,
              positions: [] // Empty array deletes all positions for this image
            })
          });

          // Step 5: Remove from state
          setImages(prev => prev.filter(img => img.id !== imageId));

          // Step 6: Switch to first image or null
          const remaining = images.filter(img => img.id !== imageId);
          if (remaining.length > 0) {
            setActiveImageId(remaining[0].id);
            onImageSelect?.(remaining[0]);
          } else {
            setActiveImageId(null);
            onImageSelect?.(null);
          }

          message.success({ content: 'Image deleted successfully', key: 'delete' });
        } catch (error) {
          console.error('❌ Delete error:', error);
          message.error({ content: 'Failed to delete image', key: 'delete' });
        }
      }
    });
  };

  // Open icon assignment modal
  const handleManageIcons = () => {
    setAssignmentModalOpen(true);
  };

  // Handle icon assignment changes
  const handleIconToggle = (iconId) => {
    const activeImage = images.find(img => img.id === activeImageId);
    if (!activeImage) return;

    const isAssigned = activeImage.assignedIcons.includes(iconId);
    const newAssignedIcons = isAssigned
      ? activeImage.assignedIcons.filter(id => id !== iconId)
      : [...activeImage.assignedIcons, iconId];

    setImages(prev => prev.map(img =>
      img.id === activeImageId
        ? { ...img, assignedIcons: newAssignedIcons }
        : img
    ));

    onIconAssignmentChange?.(activeImageId, newAssignedIcons);
  };

  // Render tabs for each image
  const tabItems = images.map(img => ({
    key: img.id,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{img.title}</span>
        <DeleteOutlined
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteImage(img.id);
          }}
          style={{ color: '#ff4d4f', fontSize: 12 }}
        />
      </div>
    ),
    children: null
  }));

  return (
    <div style={{ width: '100%' }}>
      <Tabs
        activeKey={activeImageId}
        onChange={(key) => {
          setActiveImageId(key);
          const image = images.find(img => img.id === key);
          onImageSelect?.(image);
        }}
        tabBarExtraContent={{
          right: (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type="default"
                icon={<UploadOutlined />}
                onClick={handleManageIcons}
                disabled={!activeImageId}
              >
                Gérer les Icônes
              </Button>
              <Upload
                beforeUpload={beforeUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button type="primary" icon={<PlusOutlined />}>
                  Ajouter une Image
                </Button>
              </Upload>
            </div>
          )
        }}
        items={tabItems}
      />

      {/* Crop Modal */}
      <ImageCropperModal
        open={cropModalOpen}
        imageSrc={pendingImageSrc}
        onCancel={() => {
          setCropModalOpen(false);
          setPendingImageSrc(null);
        }}
        onCropConfirm={handleCropComplete}
      />

      {/* Icon Assignment Modal */}
      <Modal
        title="Assigner des Icônes à l'Image"
        open={assignmentModalOpen}
        onCancel={() => setAssignmentModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setAssignmentModalOpen(false)}>
            Terminé
          </Button>
        ]}
        width={600}
      >
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '16px 0' }}>
          {availableIcons.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
              Aucune icône disponible. Ajoutez d'abord l'équipement sur la Page 2.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {availableIcons.map(icon => {
                const activeImage = images.find(img => img.id === activeImageId);
                const isAssigned = activeImage?.assignedIcons.includes(icon.id);

                return (
                  <Checkbox
                    key={icon.id}
                    checked={isAssigned}
                    onChange={() => handleIconToggle(icon.id)}
                  >
                    {icon.label} ({icon.moduleType})
                  </Checkbox>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MultiImageManager;
