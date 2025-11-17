import { useState, useRef } from 'react';
import { Card, Typography, Space, Button, Upload, Slider, Tooltip, Tag, message, Select, InputNumber } from 'antd';
import {
  FileImageOutlined,
  UploadOutlined,
  SaveOutlined,
  DeleteOutlined,
  CompressOutlined,
  UndoOutlined,
  DownloadOutlined,
  LineOutlined,
  StopOutlined
} from '@ant-design/icons';
import html2canvas from 'html2canvas';
import ImageCropperModal from './components/ImageCropperModal';

// Import device images
import device1Image from './assets/devices/device1.png';
import device2Image from './assets/devices/device2.png';
import device3Image from './assets/devices/device3.png';
import device4Image from './assets/devices/device4.png';

const { Text, Title } = Typography;

// GTB Module Icon Component
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
            filter: isDragging
              ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              : 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))'
          }}
        />
      ) : (
        <div style={{ fontSize: size * 0.4, color: '#8c8c8c' }}>🔧</div>
      )}
    </div>
  );
};

function GTBPlanApp() {
  // Image state
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Module placement state
  const [placedModules, setPlacedModules] = useState([]);
  const [draggedModule, setDraggedModule] = useState(null);
  const [moduleSize, setModuleSize] = useState(120);
  const [history, setHistory] = useState([]);
  const [canUndo, setCanUndo] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Line drawing state
  const [isLineMode, setIsLineMode] = useState(false);
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [lineColor, setLineColor] = useState('#1890ff');
  const [lineThickness, setLineThickness] = useState(3);
  const [lineStyle, setLineStyle] = useState('solid');

  const canvasRef = useRef(null);
  const captureRef = useRef(null);

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

  // Handle image upload (trigger file selection)
  const handleImageUpload = (info) => {
    const file = info.file.originFileObj || info.file;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message.error('Veuillez sélectionner une image valide');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImageFile(e.target.result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle crop confirmation
  const handleCropConfirm = (croppedBase64) => {
    setBackgroundImage(croppedBase64);
    setIsCropModalOpen(false);
    setUploadedImageFile(null);
    message.success('Image chargée avec succès');
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
    setHistory(prev => [...prev.slice(-9), [...placedModules]]);
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
        saveToHistory();
        const updatedModules = [...placedModules];
        updatedModules[index] = { ...updatedModules[index], x, y };
        setPlacedModules(updatedModules);
        return;
      }
    }

    // Otherwise, placing new module from palette
    if (draggedModule) {
      saveToHistory();
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

  // Download annotated plan as image
  const handleDownload = async () => {
    if (!backgroundImage) {
      message.warning('Veuillez charger une image de fond');
      return;
    }

    if (!captureRef.current) {
      message.error('Erreur: zone de capture introuvable');
      return;
    }

    try {
      message.loading({ content: 'Génération de l\'image...', key: 'download' });

      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 0,
        removeContainer: true
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          message.error('Erreur lors de la génération de l\'image');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `GTB_Plan_${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        message.success({
          content: `✅ Plan téléchargé avec succès (${placedModules.length} module${placedModules.length !== 1 ? 's' : ''})`,
          key: 'download',
          duration: 3
        });
      }, 'image/png', 0.95);
    } catch (error) {
      console.error('❌ Error downloading plan:', error);
      message.error({
        content: `Erreur lors du téléchargement: ${error.message}`,
        key: 'download'
      });
    }
  };

  // Clear all modules
  const handleClear = () => {
    if (placedModules.length > 0) {
      saveToHistory();
    }
    setPlacedModules([]);
    message.success('Tous les modules ont été retirés');
  };

  // Toggle line drawing mode
  const toggleLineMode = () => {
    setIsLineMode(!isLineMode);
    setCurrentLine(null);
    if (!isLineMode) {
      message.info('Mode ligne activé - Cliquez pour créer des points de connexion');
    } else {
      message.info('Mode ligne désactivé');
    }
  };

  // Handle canvas click for line drawing
  const handleCanvasClick = (e) => {
    if (!isLineMode) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!currentLine) {
      // Start new line
      setCurrentLine({
        start: { x, y },
        end: { x, y },
        color: lineColor,
        thickness: lineThickness,
        style: lineStyle
      });
    } else {
      // Complete the line
      const newLine = {
        ...currentLine,
        end: { x, y },
        id: `line-${Date.now()}`
      };
      setLines([...lines, newLine]);
      setCurrentLine(null);
      message.success('Ligne créée');
    }
  };

  // Handle mouse move for line preview
  const handleCanvasMouseMove = (e) => {
    if (!isLineMode || !currentLine) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentLine({
      ...currentLine,
      end: { x, y }
    });
  };

  // Clear all lines
  const handleClearLines = () => {
    if (lines.length > 0) {
      setLines([]);
      setCurrentLine(null);
      message.success('Toutes les lignes ont été supprimées');
    }
  };

  // Delete specific line
  const handleDeleteLine = (lineId) => {
    setLines(lines.filter(line => line.id !== lineId));
    message.success('Ligne supprimée');
  };

  return (
    <div style={{
      padding: '24px',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '24px 32px',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <Title level={2} style={{
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800
          }}>
            🎨 Visio Page - Plan GTB Interactif
          </Title>
          <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>
            Glissez-déposez les modules GTB sur le plan pour créer votre schéma d'installation
          </Text>
        </div>

        {/* Toolbar */}
        <Card
          size="small"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16
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
                      borderRadius: 12,
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                      border: '2px solid #667eea',
                      color: '#667eea',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                    }}
                  >
                    📁 Charger Image
                  </Button>
                </Tooltip>
              </Upload>

              <Tooltip title="Télécharger le plan avec les modules placés">
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  disabled={!backgroundImage}
                  size="large"
                  style={{
                    borderRadius: 12,
                    fontWeight: 600,
                    background: backgroundImage ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
                    border: 'none',
                    boxShadow: backgroundImage ? '0 4px 12px rgba(102, 126, 234, 0.3)' : undefined,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (backgroundImage) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (backgroundImage) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                    }
                  }}
                >
                  💾 Télécharger
                </Button>
              </Tooltip>

              <Tooltip title="Annuler la dernière action">
                <Button
                  icon={<UndoOutlined />}
                  onClick={handleUndo}
                  disabled={!canUndo}
                  size="large"
                  style={{
                    borderRadius: 12,
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (canUndo) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canUndo) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    }
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
                    borderRadius: 12,
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (placedModules.length > 0) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 77, 79, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (placedModules.length > 0) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    }
                  }}
                >
                  🗑️ Retirer Tous
                </Button>
              </Tooltip>

              <Tooltip title="Activer/désactiver le mode dessin de lignes">
                <Button
                  icon={isLineMode ? <StopOutlined /> : <LineOutlined />}
                  onClick={toggleLineMode}
                  size="large"
                  type={isLineMode ? 'primary' : 'default'}
                  style={{
                    borderRadius: 12,
                    fontWeight: 600,
                    boxShadow: isLineMode ? '0 4px 12px rgba(240, 147, 251, 0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
                    background: isLineMode ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : undefined,
                    border: isLineMode ? 'none' : '2px solid #f093fb',
                    color: isLineMode ? 'white' : '#f093fb',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isLineMode
                      ? '0 6px 20px rgba(240, 147, 251, 0.5)'
                      : '0 4px 12px rgba(240, 147, 251, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isLineMode
                      ? '0 4px 12px rgba(240, 147, 251, 0.3)'
                      : '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  {isLineMode ? '🚫 Arrêter' : '✏️ Dessiner Lignes'}
                </Button>
              </Tooltip>

              {lines.length > 0 && (
                <Tooltip title="Supprimer toutes les lignes">
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={handleClearLines}
                    size="large"
                    danger
                    style={{
                      borderRadius: 12,
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 77, 79, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    }}
                  >
                    Suppr. Lignes
                  </Button>
                </Tooltip>
              )}

              <Tooltip title={`${placedModules.length} module${placedModules.length !== 1 ? 's' : ''} placé${placedModules.length !== 1 ? 's' : ''}`}>
                <div style={{
                  padding: '10px 20px',
                  background: placedModules.length > 0
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(0,0,0,0.04)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: placedModules.length > 0
                    ? '0 4px 12px rgba(102, 126, 234, 0.25)'
                    : '0 2px 8px rgba(0,0,0,0.05)',
                  border: placedModules.length > 0 ? 'none' : '2px dashed #d9d9d9',
                  cursor: 'default',
                  minWidth: 150,
                  transition: 'all 0.3s ease'
                }}>
                  <span style={{
                    fontSize: 22,
                    filter: placedModules.length > 0 ? 'none' : 'grayscale(100%)',
                    transition: 'all 0.3s ease'
                  }}>
                    🔧
                  </span>
                  <Text style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: placedModules.length > 0 ? 'white' : '#8c8c8c'
                  }}>
                    {placedModules.length} module{placedModules.length !== 1 ? 's' : ''}
                  </Text>
                </div>
              </Tooltip>
            </Space>

            {/* Line Drawing Controls */}
            {isLineMode && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '16px 24px',
                background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%)',
                borderRadius: 12,
                border: '2px solid #f093fb',
                boxShadow: '0 4px 16px rgba(240, 147, 251, 0.2)',
                animation: 'fadeIn 0.3s ease-in'
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)'
                }}>
                  <LineOutlined style={{ fontSize: 20, color: 'white' }} />
                </div>
                <Text strong style={{ fontSize: 14, minWidth: 120, color: '#f093fb', fontWeight: 600 }}>
                  Options de ligne:
                </Text>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12 }}>Couleur:</Text>
                  <input
                    type="color"
                    value={lineColor}
                    onChange={(e) => setLineColor(e.target.value)}
                    style={{
                      width: 50,
                      height: 32,
                      border: '2px solid #d9d9d9',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12 }}>Épaisseur:</Text>
                  <Slider
                    min={1}
                    max={10}
                    value={lineThickness}
                    onChange={setLineThickness}
                    style={{ width: 100 }}
                    tooltip={{
                      formatter: (value) => `${value}px`
                    }}
                  />
                  <Tag color="blue" style={{ minWidth: 45, textAlign: 'center' }}>
                    {lineThickness}px
                  </Tag>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12 }}>Style:</Text>
                  <Select
                    value={lineStyle}
                    onChange={setLineStyle}
                    style={{ width: 120 }}
                    options={[
                      { value: 'solid', label: 'Solide' },
                      { value: 'dashed', label: 'Tirets' },
                      { value: 'dotted', label: 'Points' }
                    ]}
                  />
                </div>

                <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
                  💡 Cliquez sur le plan pour créer le début et la fin de la ligne
                </Text>
              </div>
            )}

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#52c41a',
                  boxShadow: '0 0 10px rgba(82, 196, 26, 0.8)',
                  animation: 'pulse 2s infinite'
                }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Modules GTB</span>
              </div>
            }
            size="small"
            style={{
              width: 280,
              flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: 'none',
              borderRadius: 16,
              overflow: 'hidden'
            }}
            styles={{
              header: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderBottom: 'none',
                padding: '16px 20px',
                borderRadius: '16px 16px 0 0'
              },
              body: {
                background: 'rgba(255, 255, 255, 0.98)'
              }
            }}
          >
            <div style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #e0e7ff 0%, #fce7f3 100%)',
              borderRadius: 10,
              marginBottom: 16,
              border: '2px dashed rgba(102, 126, 234, 0.3)'
            }}>
              <Text style={{
                fontSize: 12,
                color: '#667eea',
                display: 'block',
                textAlign: 'center',
                fontWeight: 600
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
              marginTop: 24,
              padding: 16,
              background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
              borderRadius: 10,
              border: '2px solid #91d5ff',
              boxShadow: '0 2px 8px rgba(145, 213, 255, 0.2)'
            }}>
              <Text style={{ fontSize: 12, color: '#0050b3', display: 'block', textAlign: 'center', marginBottom: 8, fontWeight: 600 }}>
                💡 Conseils utiles
              </Text>
              <Text style={{ fontSize: 11, color: '#096dd9', display: 'block', textAlign: 'center', marginBottom: 4 }}>
                🖱️ Glissez les modules
              </Text>
              <Text style={{ fontSize: 11, color: '#096dd9', display: 'block', textAlign: 'center' }}>
                ⌨️ Ctrl+Z pour annuler
              </Text>
            </div>
          </Card>

          {/* Canvas */}
          <Card
            style={{
              flex: 1,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: 'none',
              borderRadius: 16,
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.98)'
            }}
            styles={{ body: { padding: 0 } }}
          >
            <div
              ref={canvasRef}
              onDrop={handleCanvasDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              style={{
                width: '100%',
                minHeight: '800px',
                height: 'calc(100vh - 350px)',
                maxHeight: '1200px',
                background: backgroundImage
                  ? 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'
                  : 'repeating-linear-gradient(45deg, #fafafa, #fafafa 30px, #f0f0f0 30px, #f0f0f0 60px)',
                position: 'relative',
                overflow: 'auto',
                border: isDraggingOver
                  ? '4px dashed #667eea'
                  : isLineMode
                  ? '4px solid #f093fb'
                  : '4px solid transparent',
                transition: 'all 0.3s ease',
                boxShadow: isDraggingOver
                  ? 'inset 0 0 30px rgba(102, 126, 234, 0.15)'
                  : isLineMode
                  ? 'inset 0 0 30px rgba(240, 147, 251, 0.15)'
                  : 'inset 0 0 20px rgba(0, 0, 0, 0.02)',
                cursor: isLineMode ? 'crosshair' : 'default',
                borderRadius: 12
              }}
            >
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
                      padding: '48px 64px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: 20,
                      border: '3px dashed rgba(102, 126, 234, 0.3)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div style={{
                      width: 80,
                      height: 80,
                      margin: '0 auto 24px',
                      borderRadius: 20,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                    }}>
                      <FileImageOutlined style={{ fontSize: 40, color: 'white' }} />
                    </div>
                    <div style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 12,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Aucune image chargée
                    </div>
                    <Text type="secondary" style={{ fontSize: 14, display: 'block', fontWeight: 500 }}>
                      Chargez une image de fond pour commencer
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
                      width: '95%',
                      height: '95%',
                      padding: 16,
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
                        imageRendering: 'crisp-edges'
                      }}
                    />
                  </div>
                )}

                {/* Placed modules */}
                {placedModules.map((module, index) => (
                  <div
                    key={module.placedId}
                    draggable
                    onDragStart={(e) => handleModuleDragStart(index, e)}
                    style={{
                      position: 'absolute',
                      left: module.x - (moduleSize / 2),
                      top: module.y - (moduleSize / 2),
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

                {/* SVG overlay for lines */}
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 50
                  }}
                >
                  {/* Render completed lines */}
                  {lines.map((line) => (
                    <g key={line.id}>
                      <line
                        x1={line.start.x}
                        y1={line.start.y}
                        x2={line.end.x}
                        y2={line.end.y}
                        stroke={line.color}
                        strokeWidth={line.thickness}
                        strokeDasharray={
                          line.style === 'dashed' ? '10,5' :
                          line.style === 'dotted' ? '2,3' :
                          'none'
                        }
                        strokeLinecap="round"
                      />
                      {/* Start point marker */}
                      <circle
                        cx={line.start.x}
                        cy={line.start.y}
                        r={line.thickness + 2}
                        fill={line.color}
                      />
                      {/* End point marker */}
                      <circle
                        cx={line.end.x}
                        cy={line.end.y}
                        r={line.thickness + 2}
                        fill={line.color}
                      />
                      {/* Arrow head at end */}
                      <polygon
                        points={`
                          ${line.end.x},${line.end.y}
                          ${line.end.x - 8},${line.end.y - 4}
                          ${line.end.x - 8},${line.end.y + 4}
                        `}
                        fill={line.color}
                        transform={`rotate(${Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x) * 180 / Math.PI}, ${line.end.x}, ${line.end.y})`}
                      />
                      {/* Delete button for each line */}
                      <g
                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                        onClick={() => handleDeleteLine(line.id)}
                      >
                        <circle
                          cx={(line.start.x + line.end.x) / 2}
                          cy={(line.start.y + line.end.y) / 2}
                          r={12}
                          fill="white"
                          stroke="#ff4d4f"
                          strokeWidth={2}
                        />
                        <text
                          x={(line.start.x + line.end.x) / 2}
                          y={(line.start.y + line.end.y) / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={14}
                          fill="#ff4d4f"
                          fontWeight="bold"
                        >
                          ×
                        </text>
                      </g>
                    </g>
                  ))}

                  {/* Render current line being drawn */}
                  {currentLine && (
                    <g>
                      <line
                        x1={currentLine.start.x}
                        y1={currentLine.start.y}
                        x2={currentLine.end.x}
                        y2={currentLine.end.y}
                        stroke={currentLine.color}
                        strokeWidth={currentLine.thickness}
                        strokeDasharray={
                          currentLine.style === 'dashed' ? '10,5' :
                          currentLine.style === 'dotted' ? '2,3' :
                          'none'
                        }
                        strokeLinecap="round"
                        opacity={0.6}
                      />
                      {/* Start point marker */}
                      <circle
                        cx={currentLine.start.x}
                        cy={currentLine.start.y}
                        r={currentLine.thickness + 2}
                        fill={currentLine.color}
                        opacity={0.8}
                      />
                      {/* End point marker (preview) */}
                      <circle
                        cx={currentLine.end.x}
                        cy={currentLine.end.y}
                        r={currentLine.thickness + 2}
                        fill={currentLine.color}
                        opacity={0.8}
                      />
                    </g>
                  )}
                </svg>
              </div>
            </div>
          </Card>
        </div>
      </Space>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        imageSrc={uploadedImageFile}
        open={isCropModalOpen}
        onCancel={() => {
          setIsCropModalOpen(false);
          setUploadedImageFile(null);
        }}
        onCropConfirm={handleCropConfirm}
      />
    </div>
  );
}

export default GTBPlanApp;
