import { useEffect, useState, useRef } from 'react';
import { Card, Typography, Space, Empty, Spin, message, Tag, Button, Upload, Slider, Tooltip } from 'antd';
import { FileImageOutlined, UploadOutlined, SaveOutlined, DeleteOutlined, CompressOutlined, UndoOutlined, ZoomInOutlined } from '@ant-design/icons';
import { useSiteContext } from '../hooks/useSiteContext';
import PageLayout from '../components/layout/PageLayout';
import { API_BASE_URL } from '../config/app.config';
import html2canvas from 'html2canvas';

// Import device images
import device1Image from '../assets/devices/device1.png';
import device2Image from '../assets/devices/device2.png';
import device3Image from '../assets/devices/device3.png';
import device4Image from '../assets/devices/device4.png';

const { Text, Title } = Typography;

// GTB Module Icons Component
const GTBModuleIcon = ({ label, isDragging, imageUrl, isPlaced, size = 120 }) => {
  const iconStyles = {
    width: size,
    height: size,
    border: 'none',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isPlaced ? 'move' : 'grab',
    userSelect: 'none',
    transition: 'all 0.2s ease',
    position: 'relative',
    transform: isDragging ? 'scale(1.1)' : 'scale(1)'
  };

  return (
    <div style={iconStyles}>
      {/* Device Image - Clean, no borders */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label}
          draggable="false"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            filter: isDragging ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))'
          }}
        />
      ) : (
        <div style={{ fontSize: size * 0.4, color: '#8c8c8c' }}>🔧</div>
      )}

    </div>
  );
};

function GtbPlanPage() {
  const { siteName, isValid } = useSiteContext();
  const [devisList, setDevisList] = useState([]);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [loadingDevis, setLoadingDevis] = useState(true);

  // Visio-like editor state
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [placedModules, setPlacedModules] = useState([]);
  const [draggedModule, setDraggedModule] = useState(null);
  const [moduleSize, setModuleSize] = useState(120); // Default size: 120px
  const [history, setHistory] = useState([]); // Undo history
  const [canUndo, setCanUndo] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const canvasRef = useRef(null);
  const captureRef = useRef(null); // For html2canvas to capture annotated image

  // GTB MODULE DEVICE IMAGES - Using actual PNG images

  // Available GTB modules (4 different device types, 2 of each)
  const [availableModules] = useState([
    { id: 'gtb-1', type: 'device1', label: 'Module GTB Type 1', imageUrl: device1Image },
    { id: 'gtb-2', type: 'device1', label: 'Module GTB Type 1', imageUrl: device1Image },
    { id: 'gtb-3', type: 'device2', label: 'Module GTB Type 2', imageUrl: device2Image },
    { id: 'gtb-4', type: 'device2', label: 'Module GTB Type 2', imageUrl: device2Image },
    { id: 'gtb-5', type: 'device3', label: 'Module GTB Type 3', imageUrl: device3Image },
    { id: 'gtb-6', type: 'device3', label: 'Module GTB Type 3', imageUrl: device3Image },
    { id: 'gtb-7', type: 'device4', label: 'Module GTB Type 4', imageUrl: device4Image },
    { id: 'gtb-8', type: 'device4', label: 'Module GTB Type 4', imageUrl: device4Image },
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && canUndo) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo]);

  // Fetch devis list for this site
  useEffect(() => {
    if (!isValid) return;

    const fetchDevisList = async () => {
      console.log('🔄 Loading devis list for site:', siteName);
      setLoadingDevis(true);

      try {
        const response = await fetch(`${API_BASE_URL}/list-devis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: siteName }),
        });
        const { devisList: list } = await response.json();

        const devisNames = list.map(d => d.devis_name || d);
        setDevisList(devisNames);
        console.log(`📊 Found ${devisNames.length} devis:`, devisNames);

        // Auto-select first devis if available
        if (devisNames.length > 0 && !selectedDevis) {
          setSelectedDevis(devisNames[0]);
        }
      } catch (error) {
        console.error('❌ Error loading devis list:', error);
        message.error('Erreur lors du chargement des devis');
        setDevisList([]);
      } finally {
        setLoadingDevis(false);
      }
    };

    fetchDevisList();
  }, [siteName, isValid]);

  // Load saved plan when devis is selected
  useEffect(() => {
    if (!selectedDevis || !siteName || siteName === 'unknown') return;

    const loadSavedPlan = async () => {
      console.log('🖼️ Loading images for site:', siteName, 'devis:', selectedDevis);

      try {
        const response = await fetch(`${API_BASE_URL}/images/get-sql-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: siteName }),
        });

        if (!response.ok) throw new Error('Failed to fetch images');

        const allImages = await response.json();

        // First, try to find existing GTB plan for this devis
        const gtbPlan = allImages.find(
          img => img.type === 'gtb_plan' && img.title === selectedDevis
        );

        if (gtbPlan) {
          // Load existing GTB plan
          setBackgroundImage(gtbPlan.url_viewer || gtbPlan.image_url);

          // Load module positions from shapes field
          if (gtbPlan.shapes) {
            try {
              const modules = typeof gtbPlan.shapes === 'string'
                ? JSON.parse(gtbPlan.shapes)
                : gtbPlan.shapes;
              setPlacedModules(Array.isArray(modules) ? modules : []);
              console.log('✅ Loaded GTB plan with module positions:', modules);
            } catch (e) {
              console.error('❌ Error parsing module positions:', e);
              setPlacedModules([]);
            }
          } else {
            setPlacedModules([]);
          }
        } else {
          // No GTB plan yet - try to load annotated VT image from Page 3
          const savedSelections = localStorage.getItem(`devis_images_${siteName}_${selectedDevis}`);
          let selectedImageIds = [];

          if (savedSelections) {
            selectedImageIds = JSON.parse(savedSelections);
          }

          // Get annotated VT images
          const annotatedImages = allImages.filter(
            img => img.type === 'annotated' && img.title === 'VT'
          );

          // Filter by selected images if selections exist
          let filteredImages = annotatedImages;
          if (selectedImageIds.length > 0) {
            filteredImages = annotatedImages.filter(img => selectedImageIds.includes(img.id));
          }

          // Use first available image as background
          if (filteredImages.length > 0) {
            setBackgroundImage(filteredImages[0].url_viewer || filteredImages[0].image_url);
            setPlacedModules([]);
            console.log('✅ Loaded VT image from Page 3 as background');
          } else {
            setBackgroundImage(null);
            setPlacedModules([]);
            console.log('ℹ️ No images found for this devis');
          }
        }
      } catch (error) {
        console.error('❌ Error loading plan:', error);
      }
    };

    loadSavedPlan();
  }, [siteName, selectedDevis]);

  // Handle image upload (local file)
  const handleImageUpload = (info) => {
    const file = info.file.originFileObj || info.file;
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Veuillez sélectionner une image valide');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setBackgroundImage(e.target.result);
      message.success('Image chargée avec succès');
    };
    reader.readAsDataURL(file);
  };

  // Upload image to ImgBB
  const uploadToImgBB = async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('title', `GTB_${selectedDevis}`);

      const response = await fetch(`${API_BASE_URL}/images/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ImgBB upload failed:', errorText);
        throw new Error('ImgBB upload failed');
      }

      const result = await response.json();
      console.log('✅ ImgBB upload result:', result);

      return {
        url: result.url,
        deleteUrl: result.delete_url,
        thumb: result.thumb,
        medium: result.medium
      };
    } catch (error) {
      console.error('❌ Error uploading to ImgBB:', error);
      throw error;
    }
  };

  // Handle drag start from palette
  const handleDragStart = (module, e) => {
    setDraggedModule(module);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle drag over canvas
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedModule ? 'copy' : 'move';
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  // Handle drag leave canvas
  const handleDragLeave = (e) => {
    // Only set to false if leaving the canvas entirely
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false);
    }
  };

  // Handle module repositioning
  const handleModuleDragStart = (index, e) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('moduleIndex', index.toString());
  };

  // Save current state to history
  const saveToHistory = () => {
    setHistory(prev => [...prev.slice(-9), [...placedModules]]); // Keep last 10 states
    setCanUndo(true);
  };

  // Undo last action
  const handleUndo = () => {
    if (history.length === 0) return;

    const previousState = history[history.length - 1];
    setPlacedModules(previousState);
    setHistory(prev => prev.slice(0, -1));
    setCanUndo(history.length > 1);
    message.info('Action annulée');
  };

  // Unified drop handler for both new modules and repositioning
  const handleCanvasDrop = (e) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if repositioning existing module
    const moduleIndexStr = e.dataTransfer.getData('moduleIndex');
    if (moduleIndexStr) {
      const index = parseInt(moduleIndexStr);
      if (!isNaN(index) && index >= 0 && index < placedModules.length) {
        saveToHistory(); // Save before change
        const updatedModules = [...placedModules];
        updatedModules[index] = { ...updatedModules[index], x, y };
        setPlacedModules(updatedModules);
        return;
      }
    }

    // Otherwise, placing new module from palette
    if (draggedModule) {
      saveToHistory(); // Save before change
      const newModule = {
        ...draggedModule,
        x,
        y,
        placedId: `${draggedModule.id}-${Date.now()}`
      };
      setPlacedModules([...placedModules, newModule]);
      setDraggedModule(null);
      message.success(`Module ${draggedModule.label} placé`);
    }

    setIsDraggingOver(false);
  };

  // Save plan to SQL and ImgBB
  const handleSave = async () => {
    if (!backgroundImage || !selectedDevis) {
      message.warning('Veuillez charger une image et sélectionner un devis');
      return;
    }

    if (!captureRef.current) {
      message.error('Erreur: zone de capture introuvable');
      return;
    }

    try {
      message.loading({ content: 'Génération de l\'image annotée...', key: 'save' });

      // Step 1: Capture the annotated image with html2canvas at high quality
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: null,
        scale: 3,  // Increased from 2 to 3 for better quality
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 0,
        removeContainer: true
      });

      // Convert canvas to blob
      const annotatedBlob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 0.95);
      });

      if (!annotatedBlob) {
        throw new Error('Failed to generate annotated image');
      }

      console.log('✅ Annotated image captured:', {
        width: canvas.width,
        height: canvas.height,
        size: annotatedBlob.size
      });

      message.loading({ content: 'Upload vers ImgBB...', key: 'save' });

      // Step 2: Upload annotated image to ImgBB
      const annotatedFile = new File(
        [annotatedBlob],
        `GTB_${selectedDevis}_annotated.png`,
        { type: 'image/png' }
      );

      const imgbbResult = await uploadToImgBB(annotatedFile);
      const annotatedUrl = imgbbResult.url;
      const deleteUrl = imgbbResult.deleteUrl;

      console.log('✅ Annotated image uploaded to ImgBB:', annotatedUrl);

      message.loading({ content: 'Enregistrement dans la base de données...', key: 'save' });

      // Step 3: Save to SQL with module positions using correct endpoint
      const response = await fetch(`${API_BASE_URL}/images/upload-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: siteName,
          type: 'gtb_plan',
          title: selectedDevis,
          url_viewer: annotatedUrl, // Annotated image with modules visible
          image_url: annotatedUrl,
          delete_url: deleteUrl,
          shapes: placedModules, // Backend will stringify this
          comments: `Plan GTB avec ${placedModules.length} module(s)`,
          devis_name: selectedDevis,
          width: canvas.width,
          height: canvas.height
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SQL save failed:', errorText);
        throw new Error('Save failed');
      }

      const result = await response.json();
      console.log('✅ SQL save result:', result);

      // Update local state to use the annotated URL
      setBackgroundImage(annotatedUrl);

      message.success({
        content: `✅ Plan GTB sauvegardé avec succès (${placedModules.length} module${placedModules.length !== 1 ? 's' : ''})`,
        key: 'save',
        duration: 3
      });
    } catch (error) {
      console.error('❌ Error saving plan:', error);
      message.error({
        content: `Erreur lors de la sauvegarde: ${error.message}`,
        key: 'save'
      });
    }
  };

  // Clear all modules
  const handleClear = () => {
    if (placedModules.length > 0) {
      saveToHistory(); // Save before clearing
    }
    setPlacedModules([]);
    message.success('Tous les modules ont été retirés');
  };

  // Delete saved GTB plan from SQL and ImgBB (currently unused but available for future use)
  /* const handleDelete = async () => {
    if (!selectedDevis) {
      message.warning('Veuillez sélectionner un devis');
      return;
    }

    try {
      const hideLoading = message.loading('Suppression en cours...', 0);

      // Fetch current plan to get delete_url
      const response = await fetch(`${API_BASE_URL}/images/get-sql-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: siteName }),
      });

      if (!response.ok) throw new Error('Failed to fetch images');

      const allImages = await response.json();
      const gtbPlan = allImages.find(
        img => img.type === 'gtb_plan' && img.title === selectedDevis
      );

      if (gtbPlan) {
        // Delete from ImgBB if delete_url exists
        if (gtbPlan.delete_url) {
          try {
            await fetch(`${API_BASE_URL}/images/delete-from-imgbb`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deleteUrl: gtbPlan.delete_url }),
            });
            console.log('✅ Image deleted from ImgBB');
          } catch (error) {
            console.error('⚠️ Error deleting from ImgBB:', error);
          }
        }

        // Delete from SQL
        await fetch(`${API_BASE_URL}/images/delete-from-sql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: gtbPlan.id }),
        });

        console.log('✅ GTB plan deleted from SQL');
      }

      hideLoading();

      // Reset state
      setBackgroundImage(null);
      setPlacedModules([]);

      message.success('Plan GTB supprimé avec succès');
    } catch (error) {
      console.error('❌ Error deleting plan:', error);
      message.error('Erreur lors de la suppression');
    }
  }; */

  return (
    <PageLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div>
          <Title level={3} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <ZoomInOutlined style={{ color: '#1890ff' }} />
            Plan GTB - Positionnement des Modules
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Glissez-déposez les modules GTB sur le plan pour créer votre schéma d'installation
          </Text>
        </div>

        {/* Devis Selection */}
        <Card
          title={
            <Space>
              <FileImageOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <span>Sélectionner un Devis</span>
            </Space>
          }
          size="small"
        >
          {loadingDevis ? (
            <Spin />
          ) : devisList.length === 0 ? (
            <Empty description="Aucun devis trouvé" />
          ) : (
            <Space wrap>
              {devisList.map((devisName) => (
                <Tag
                  key={devisName}
                  color={selectedDevis === devisName ? 'blue' : 'default'}
                  style={{ cursor: 'pointer', padding: '4px 12px' }}
                  onClick={() => setSelectedDevis(devisName)}
                >
                  {devisName}
                </Tag>
              ))}
            </Space>
          )}
        </Card>

        {selectedDevis && (
          <>
            {/* Toolbar */}
            <Card
              size="small"
              style={{
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                border: '2px solid #e8e8e8',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {/* Action Buttons Row */}
                <Space wrap size={12}>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={() => false}
                    onChange={handleImageUpload}
                  >
                    <Tooltip title="Charger une image de fond">
                      <Button
                        icon={<UploadOutlined />}
                        size="large"
                        style={{
                          borderRadius: 6,
                          fontWeight: 'bold',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        📁 Charger Image
                      </Button>
                    </Tooltip>
                  </Upload>

                  <Tooltip title="Sauvegarder le plan avec les modules placés">
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSave}
                      disabled={!backgroundImage}
                      size="large"
                      style={{
                        borderRadius: 6,
                        fontWeight: 'bold',
                        background: backgroundImage ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
                        border: 'none',
                        boxShadow: backgroundImage ? '0 4px 8px rgba(102, 126, 234, 0.4)' : undefined
                      }}
                    >
                      💾 Sauvegarder
                    </Button>
                  </Tooltip>

                  <Tooltip title="Annuler la dernière action">
                    <Button
                      icon={<UndoOutlined />}
                      onClick={handleUndo}
                      disabled={!canUndo}
                      size="large"
                      style={{
                        borderRadius: 6,
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      Annuler
                    </Button>
                  </Tooltip>

                  <Tooltip title="Retirer tous les modules du plan">
                    <Button
                      icon={<DeleteOutlined />}
                      onClick={handleClear}
                      disabled={placedModules.length === 0}
                      size="large"
                      danger={placedModules.length > 0}
                      style={{
                        borderRadius: 6,
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      🗑️ Retirer Tous
                    </Button>
                  </Tooltip>

                  <Tooltip title={`${placedModules.length} module${placedModules.length !== 1 ? 's' : ''} actuellement placé${placedModules.length !== 1 ? 's' : ''} sur le plan`}>
                    <div style={{
                      padding: '8px 16px',
                      background: placedModules.length > 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: placedModules.length > 0 ? 'none' : '1px solid #d9d9d9',
                      cursor: 'default',
                      minWidth: 140
                    }}>
                      <span style={{
                        fontSize: 20,
                        filter: placedModules.length > 0 ? 'none' : 'grayscale(100%)'
                      }}>
                        🔧
                      </span>
                      <Text style={{
                        fontWeight: 'bold',
                        fontSize: 14,
                        color: placedModules.length > 0 ? 'white' : '#595959'
                      }}>
                        {placedModules.length} module{placedModules.length !== 1 ? 's' : ''}
                      </Text>
                    </div>
                  </Tooltip>
                </Space>

                {/* Module Size Control Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 16px',
                  background: 'white',
                  borderRadius: 6,
                  border: '1px solid #e8e8e8',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <CompressOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                  <Text strong style={{ fontSize: 13, minWidth: 100 }}>
                    Taille des modules:
                  </Text>
                  <Slider
                    min={60}
                    max={200}
                    step={10}
                    value={moduleSize}
                    onChange={setModuleSize}
                    style={{ flex: 1, maxWidth: 300 }}
                    marks={{
                      60: '60px',
                      120: '120px',
                      200: '200px'
                    }}
                    tooltip={{
                      formatter: (value) => `${value}px`
                    }}
                  />
                  <Tag color="blue" style={{ minWidth: 60, textAlign: 'center', fontSize: 13, fontWeight: 'bold' }}>
                    {moduleSize}px
                  </Tag>
                </div>
              </Space>
            </Card>

            {/* Main Editor */}
            <div style={{ display: 'flex', gap: 16 }}>
              {/* Module Palette */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#52c41a',
                      boxShadow: '0 0 8px rgba(82, 196, 26, 0.6)'
                    }} />
                    <span style={{ fontWeight: 'bold' }}>Modules GTB</span>
                  </div>
                }
                size="small"
                style={{
                  width: 260,  // Increased from 220 to accommodate larger icons
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '2px solid #e8e8e8'
                }}
                styles={{
                  header: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderBottom: '2px solid #e8e8e8'
                  }
                }}
              >
                <div style={{
                  padding: '8px 0',
                  background: '#fafafa',
                  borderRadius: 6,
                  marginBottom: 12
                }}>
                  <Text style={{
                    fontSize: 11,
                    color: '#595959',
                    display: 'block',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    🖱️ Glissez-déposez sur le plan
                  </Text>
                </div>

                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {availableModules.map((module) => (
                    <div
                      key={module.id}
                      draggable
                      onDragStart={(e) => handleDragStart(module, e)}
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        transition: 'transform 0.2s ease',
                        cursor: 'grab'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <GTBModuleIcon
                        label={module.label}
                        imageUrl={module.imageUrl}
                        isDragging={draggedModule?.id === module.id}
                        isPlaced={false}
                        size={moduleSize}
                      />
                    </div>
                  ))}
                </Space>

                <div style={{
                  marginTop: 20,
                  padding: 12,
                  background: '#e6f7ff',
                  borderRadius: 6,
                  border: '1px solid #91d5ff'
                }}>
                  <Text style={{ fontSize: 11, color: '#0050b3', display: 'block', textAlign: 'center', marginBottom: 6 }}>
                    💡 Glissez les modules sur le plan
                  </Text>
                  <Text style={{ fontSize: 10, color: '#096dd9', display: 'block', textAlign: 'center' }}>
                    ⌨️ Ctrl+Z pour annuler
                  </Text>
                </div>
              </Card>

              {/* Canvas */}
              <Card
                style={{
                  flex: 1,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '2px solid #e8e8e8'
                }}
                styles={{ body: { padding: 0 } }}
              >
                <div
                  ref={canvasRef}
                  onDrop={handleCanvasDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  style={{
                    width: '100%',
                    minHeight: '800px',  // Changed from fixed 1400px to responsive minHeight
                    height: 'calc(100vh - 350px)',  // Dynamic height based on viewport
                    maxHeight: '1200px',  // Maximum height constraint
                    background: backgroundImage
                      ? 'linear-gradient(to bottom, #fafafa 0%, #f0f0f0 100%)'
                      : 'repeating-linear-gradient(0deg, #fafafa, #fafafa 20px, #f5f5f5 20px, #f5f5f5 40px), repeating-linear-gradient(90deg, #fafafa, #fafafa 20px, #f5f5f5 20px, #f5f5f5 40px)',
                    backgroundBlendMode: 'multiply',
                    position: 'relative',
                    overflow: 'auto',
                    border: isDraggingOver ? '3px dashed #1890ff' : 'none',
                    transition: 'border 0.2s ease',
                    boxShadow: isDraggingOver ? 'inset 0 0 20px rgba(24, 144, 255, 0.1)' : 'none'
                  }}
                >
                  {/* Capture area for html2canvas - wraps everything that should be in the final image */}
                  <div ref={captureRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
                  {/* Drop Zone Indicator */}
                  {!backgroundImage && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: '#999',
                        padding: 40,
                        background: 'white',
                        borderRadius: 12,
                        border: '2px dashed #d9d9d9',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      }}
                    >
                      <FileImageOutlined style={{ fontSize: 64, marginBottom: 16, color: '#bfbfbf' }} />
                      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#595959' }}>
                        Aucune image chargée
                      </div>
                      <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                        Chargez une image de fond pour commencer
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        💡 Vous pouvez aussi charger depuis Page 3 (Plan VT)
                      </Text>
                    </div>
                  )}

                  {/* Background Image Container */}
                  {backgroundImage && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '95%',  // Increased from 90% to 95%
                        height: '95%',  // Increased from 90% to 95%
                        padding: 16,  // Increased from 12px to 16px
                        background: 'white',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                        borderRadius: 12,
                        border: '4px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img
                        src={backgroundImage}
                        alt="Plan background"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          pointerEvents: 'none',
                          display: 'block',
                          imageRendering: 'crisp-edges'  // Better image quality
                        }}
                      />
                    </div>
                  )}

                  {/* Placed modules with enhanced visibility */}
                  {placedModules.map((module, index) => (
                    <div
                      key={module.placedId}
                      draggable
                      onDragStart={(e) => handleModuleDragStart(index, e)}
                      style={{
                        position: 'absolute',
                        left: module.x - (moduleSize / 2),  // Dynamic centering based on current size
                        top: module.y - (moduleSize / 2),  // Dynamic centering based on current size
                        cursor: 'move',
                        zIndex: 100,
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                      }}
                    >
                      <GTBModuleIcon
                        label={module.label}
                        imageUrl={module.imageUrl}
                        isPlaced={true}
                        size={moduleSize}
                      />
                    </div>
                  ))}
                  </div> {/* End captureRef */}
                </div>
              </Card>
            </div>
          </>
        )}
      </Space>
    </PageLayout>
  );
}

export default GtbPlanPage;
