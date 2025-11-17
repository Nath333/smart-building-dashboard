import { Card, Space, Image, Button, Upload, message, Typography } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { getCategoryInputs } from './categoryInputConfig';
import {uploadImageToImgBB,saveImageToSQL,deleteImageFromImgBB,deleteImageFromSQL} from '../../api/imageApi';
import { getSiteName } from '../../utils/siteContext';
import { parseCardKey } from './zoneUtils';

const { Text } = Typography;

const EditableCard = ({
  title,
  cardKey, // 👈 Zone-based card key (e.g., "Aero::surface_de_vente")
  images = [],
  status = {},
  data = {},
  onChange,
  allEquipmentData = {}, // 👈 Full equipment data for cross-referencing (e.g., comptage)
}) => {
  const siteName = getSiteName();

  // Extract category and zone from cardKey
  const { type: category, zone: zoneName } = parseCardKey(cardKey || title);

  // Detect if this is a Comptage card and modify the type accordingly
  const isComptage = category.startsWith('Comptage_');
  const baseCategory = isComptage ? category.replace('Comptage_', '') : category;
  const sqlType = isComptage ? `${baseCategory}_comptage` : category;

  console.log('🎴 EditableCard rendered:', {
    cardKey,
    category,
    baseCategory,
    isComptage,
    sqlType,
    zoneName,
    title
  });

  const handleChange = (field, value, target = 'data') => {
    onChange((prev = {}) => ({
      ...prev,
      [target]: {
        ...(prev?.[target] || {}),
        [field]: value,
      },
    }));
  };

const handleRemoveImage = async (index) => {
  const imageToDelete = images[index];
  if (!imageToDelete?.delete_url) {
    return message.error('URL de suppression manquante');
  }

  console.log('🗑️ Deleting image:', imageToDelete);
  
  // Remove from local state immediately for better UX
  const updatedImages = images.filter((_, i) => i !== index);
  onChange((prev = {}) => ({ ...prev, images: updatedImages }));

  try {
    // Try to delete from both ImgBB and SQL
    const imgbbResult = await deleteImageFromImgBB(imageToDelete.delete_url);
    console.log('📡 ImgBB deletion response:', imgbbResult?.data || imgbbResult);
    
    // Check if ImgBB deletion was successful
    if (!imgbbResult?.data?.message) {
      console.warn('⚠️ ImgBB deletion may have failed - no success message received');
    }
    
    const sqlResult = await deleteImageFromSQL(imageToDelete.delete_url);
    console.log('🗂️ SQL deletion response:', sqlResult?.data || sqlResult);
    
    // Check if SQL deletion was successful
    if (!sqlResult?.data?.deletedFromSQL || sqlResult?.data?.deletedFromSQL === 0) {
      console.warn('⚠️ SQL deletion may have failed - no rows affected');
    }
    
    message.success('Image supprimée avec succès');
  } catch (error) {
    console.error('❌ Deletion error:', error);
    console.error('Error details:', error.response?.data || error.message);
    message.error(`Erreur lors de la suppression: ${error.response?.data?.error || error.message || 'Erreur inconnue'}`);
    
    // Restore the image to the state since deletion failed
    onChange((prev = {}) => ({
      ...prev,
      images: [...(prev.images || []), imageToDelete],
    }));
  }
};

const handleUpload = async ({ file, onSuccess, onError }) => {
  // Validate file before upload
  if (!file) {
    const error = new Error('Aucun fichier sélectionné');
    onError(error);
    return message.error('Aucun fichier sélectionné');
  }

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    const error = new Error('Fichier trop volumineux (5MB max)');
    onError(error);
    return message.error('Fichier trop volumineux (5MB max)');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    const error = new Error('Type de fichier non supporté');
    onError(error);
    return message.error('Seules les images (JPG, PNG, GIF, WebP) sont acceptées');
  }

  try {
    // Build title with zone info if available (use baseCategory for title)
    const titleString = zoneName
      ? `${siteName}_${baseCategory}_${zoneName}_Vt`
      : `${siteName}_${baseCategory}_Vt`;

    console.log('📤 Uploading image with zone:', {
      siteName,
      category,
      baseCategory,
      sqlType,
      zoneName,
      titleString,
      isComptage
    });

    // Upload to ImgBB first - use baseCategory for ImgBB, not sqlType
    const { url, delete_url } = await uploadImageToImgBB(file, siteName, baseCategory, titleString);

    if (!url || !delete_url) {
      throw new Error('Réponse ImgBB invalide');
    }

    // Then save to SQL - use sqlType (e.g., "Aero_comptage") for SQL type field
    await saveImageToSQL({
      url,
      delete_url,
      site: siteName,
      type: sqlType,  // 👈 Use "Aero_comptage" for Comptage cards, "Aero" for regular
      zone_name: zoneName || null,
      title: titleString
    });

    // Update local state only after both operations succeed
    onChange((prev = {}) => {
      const updatedImages = [...(prev?.images || []), { url, delete_url, title: titleString }];
      return { ...prev, images: updatedImages };
    });

    onSuccess();
    message.success(`${file.name} ajouté avec succès`);
  } catch (err) {
    console.error('❌ Upload error:', err);
    onError(err);
    message.error(`Échec de l'upload: ${err.message || 'Erreur inconnue'}`);
  }
};
  return (
    <Card
      title={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 12,
          borderLeft: '4px solid #1890ff',
          marginLeft: -12,
          marginRight: -12,
          minHeight: 24
        }}>
          <Text strong style={{
            fontSize: 16,
            color: '#262626',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: '1.5'
          }}>
            {title}
          </Text>
        </div>
      }
      style={{
        marginBottom: 40,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        borderRadius: 8,
        backgroundColor: '#ffffff'
      }}
      headStyle={{
        borderBottom: '1px solid #f0f0f0',
        padding: '16px 24px',
        overflow: 'visible'
      }}
    >
<Space
  direction="vertical"
  size="small" // 👈 reduces vertical space between items
  style={{ width: '100%' }}
>        
        {getCategoryInputs({
          category: category, // Use extracted category for input config
          categoryData: data,
          categoryStatus: status,
          handleCategoryDataChange: (k, v) => handleChange(k, v, 'data'),
          handleStatusChange: (k, v) => handleChange(k, v, 'status'),
          allEquipmentData: allEquipmentData,
        })}
      </Space>

      <Card type="inner" title="Images" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {images.map((img, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                border: '1px solid #eee',
                borderRadius: 8,
                overflow: 'hidden',
                width: 300,
                height: 225,
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.querySelector('.hover-overlay').style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.querySelector('.hover-overlay').style.opacity = '0';
              }}
            >
              <Image
                src={img.url}
                width={300}
                height={225}
                style={{ objectFit: 'cover' }}
                preview={{
                  mask: <EyeOutlined style={{ fontSize: 24 }} />
                }}
              />
              <div
                className="hover-overlay"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                  padding: '40px 12px 12px 12px',
                  opacity: 0,
                  transition: 'opacity 0.3s',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Button
                  danger
                  type="primary"
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(i);
                  }}
                  size="small"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Upload multiple showUploadList={false} customRequest={handleUpload}>
          <Button icon={<UploadOutlined />} style={{ marginTop: 16 }} size="large">
            Ajouter des images
          </Button>
        </Upload>
      </Card>
    </Card>
  );
};

export default EditableCard;
