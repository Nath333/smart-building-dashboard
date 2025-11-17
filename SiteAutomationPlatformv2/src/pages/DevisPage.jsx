import { useEffect, useState } from 'react';
import { Card, Typography, Space, Tag, InputNumber, message, Empty, Divider, Modal, Button, Input, Checkbox } from 'antd';
import { CheckCircleOutlined, SaveOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import { useSiteContext } from '../hooks/useSiteContext';
import PageLayout from '../components/layout/PageLayout';
import FormCard from '../components/common/FormCard';
import ActionButtons from '../components/common/ActionButtons';
import { LAYOUT_CONSTANTS } from '../components/layout/layoutConstants';
import { AVAILABLE_ZONES } from './equipment/zoneUtils';
import { API_BASE_URL } from '../config/app.config';

const { Title, Text } = Typography;

// Equipment emoji mapping
const EQUIPMENT_EMOJI = {
  Aero: '🌡️',
  Clim: '❄️',
  Rooftop: '🏢',
  Eclairage: '💡',
};

function DevisPage() {
  const { siteName, isValid } = useSiteContext();
  const [equipmentData, setEquipmentData] = useState([]);
  const [devisData, setDevisData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentDevisName, setCurrentDevisName] = useState('Devis Principal');
  const [devisList, setDevisList] = useState([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newDevisName, setNewDevisName] = useState('');
  const [annotatedImages, setAnnotatedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);

  // Fetch devis list for this site
  useEffect(() => {
    if (!isValid) return;

    const fetchDevisList = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/list-devis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: siteName }),
        });
        const { devisList: list } = await response.json();
        setDevisList(list || []);
      } catch (error) {
        console.error('Error fetching devis list:', error);
      }
    };

    fetchDevisList();
  }, [siteName, isValid]);

  // Fetch equipment data from normalized DB and current devis data
  useEffect(() => {
    if (!isValid) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch equipment counts from normalized database API
        const equipmentResponse = await fetch(`${API_BASE_URL}/api/equipment-counts/${encodeURIComponent(siteName)}`);

        if (!equipmentResponse.ok) {
          throw new Error('Failed to fetch equipment data');
        }

        const equipmentCounts = await equipmentResponse.json();
        console.log('📊 Equipment counts from API:', equipmentCounts);

        // Transform API response to equipment array format
        const equipment = [];

        // Process aerothermes
        if (equipmentCounts.aerotherme) {
          equipmentCounts.aerotherme.forEach(item => {
            if (item.count > 0) {
              equipment.push({
                type: 'Aero',
                zone: item.zone,
                existing: item.count,
              });
            }
          });
        }

        // Process clim_ir
        if (equipmentCounts.clim_ir) {
          equipmentCounts.clim_ir.forEach(item => {
            if (item.count > 0) {
              equipment.push({
                type: 'Clim',
                zone: item.zone,
                existing: item.count,
              });
            }
          });
        }

        // Process clim_wire (add to existing Clim if same zone)
        if (equipmentCounts.clim_wire) {
          equipmentCounts.clim_wire.forEach(item => {
            if (item.count > 0) {
              const existingClim = equipment.find(e => e.type === 'Clim' && e.zone === item.zone);
              if (existingClim) {
                existingClim.existing += item.count;
              } else {
                equipment.push({
                  type: 'Clim',
                  zone: item.zone,
                  existing: item.count,
                });
              }
            }
          });
        }

        // Process rooftops
        if (equipmentCounts.rooftop) {
          equipmentCounts.rooftop.forEach(item => {
            if (item.count > 0) {
              equipment.push({
                type: 'Rooftop',
                zone: item.zone,
                existing: item.count,
              });
            }
          });
        }

        // Process regular lighting (equipment_lighting rows)
        if (equipmentCounts.lighting) {
          equipmentCounts.lighting.forEach(item => {
            if (item.count > 0) {
              equipment.push({
                type: 'Eclairage',
                zone: item.zone,
                existing: item.count,
              });
            }
          });
        }

        // Process lighting comptage (comptage_lighting)
        if (equipmentCounts.comptage_lighting) {
          equipmentCounts.comptage_lighting.forEach(item => {
            if (item.count > 0) {
              // Check if already added from regular lighting
              const existing = equipment.find(e => e.type === 'Eclairage' && e.zone === item.zone);
              if (existing) {
                existing.existing += item.count;
              } else {
                equipment.push({
                  type: 'Eclairage',
                  zone: item.zone,
                  existing: item.count,
                });
              }
            }
          });
        }

        console.log('✅ Transformed equipment data:', equipment);
        setEquipmentData(equipment);

        // Fetch existing devis data for current devis
        const devisResponse = await fetch(`${API_BASE_URL}/get-devis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: siteName, devisName: currentDevisName }),
        });

        const { devisData: existingDevis } = await devisResponse.json();
        console.log('📥 Existing devis data from DB:', existingDevis);

        // Merge equipment with existing devis data
        const initialDevis = {};

        // First, add all equipment from equipment tables
        equipment.forEach(item => {
          const key = `${item.type}::${item.zone}`;
          initialDevis[key] = {
            toInstall: existingDevis[key]?.toInstall || 0,
            zone: item.zone,
            existing: item.existing,
          };
        });

        // Then, add any equipment from saved devis that doesn't exist in current equipment
        // (this handles cases where equipment was deleted from Page 2 but still in devis)
        Object.keys(existingDevis).forEach(key => {
          // Skip placeholder entries
          if (key.startsWith('__placeholder::')) {
            return;
          }

          if (!initialDevis[key]) {
            const [type, zone] = key.split('::');
            const devisEntry = existingDevis[key];

            // Add to equipment array so it displays
            equipment.push({
              type,
              zone,
              existing: devisEntry.existing || 0,
            });

            // Add to devis data
            initialDevis[key] = {
              toInstall: devisEntry.toInstall || 0,
              zone: zone,
              existing: devisEntry.existing || 0,
            };
          }
        });

        setEquipmentData(equipment); // Update equipment array with merged data
        setDevisData(initialDevis);
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Échec du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [siteName, isValid, currentDevisName]);

  // Fetch annotated images from Page 3
  useEffect(() => {
    if (!isValid) return;

    const fetchAnnotatedImages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/images/get-sql-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: siteName }),
        });

        if (response.ok) {
          const allImages = await response.json();
          // Filter for annotated VT images
          const annotated = allImages.filter(
            img => img.type === 'annotated' && img.title === 'VT'
          );
          setAnnotatedImages(annotated);
        }
      } catch (error) {
        console.error('Error fetching annotated images:', error);
      }
    };

    fetchAnnotatedImages();
  }, [siteName, isValid]);

  // Load selected images for current devis
  useEffect(() => {
    if (!currentDevisName) return;

    // Load from localStorage for now (can be moved to SQL later)
    const savedSelections = localStorage.getItem(`devis_images_${siteName}_${currentDevisName}`);
    if (savedSelections) {
      setSelectedImages(JSON.parse(savedSelections));
    } else {
      setSelectedImages([]);
    }
  }, [siteName, currentDevisName]);

  // Handle quantity change
  const handleQuantityChange = (type, zone, value) => {
    const key = `${type}::${zone}`;
    setDevisData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        toInstall: value || 0,
      },
    }));
  };

  // Handle create new devis
  const handleCreateNew = async () => {
    if (!newDevisName.trim()) {
      message.warning('Veuillez saisir un nom de devis');
      return;
    }

    if (devisList.some(d => d.devis_name === newDevisName.trim())) {
      message.error('Un devis avec ce nom existe déjà');
      return;
    }

    try {
      // Save initial record to database to create the devis
      const response = await fetch(`${API_BASE_URL}/save-devis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: siteName,
          devisName: newDevisName.trim(),
          devisData: {
            // Create with empty placeholder to ensure it appears in list
            '__placeholder::init': {
              toInstall: 0,
              existing: 0,
              zone: 'init'
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Échec de la création du devis');
      }

      // Refresh devis list to show the new devis
      const listResponse = await fetch(`${API_BASE_URL}/list-devis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: siteName }),
      });
      const { devisList: list } = await listResponse.json();
      setDevisList(list || []);

      // Switch to the new devis
      setCurrentDevisName(newDevisName.trim());
      setIsCreatingNew(false);
      setNewDevisName('');
      message.success(`Nouveau devis "${newDevisName.trim()}" créé`);
    } catch (error) {
      console.error('Error creating new devis:', error);
      message.error('Échec de la création du devis');
    }
  };

  // Handle delete devis
  const handleDeleteDevis = (devisName) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: `Voulez-vous vraiment supprimer le devis "${devisName}" ?`,
      okText: 'Supprimer',
      cancelText: 'Annuler',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/delete-devis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site: siteName, devisName }),
          });

          const result = await response.json();

          if (response.ok) {
            message.success('Devis supprimé avec succès');

            // Update devis list
            const updatedList = devisList.filter(d => d.devis_name !== devisName);
            setDevisList(updatedList);

            // If we deleted the current devis, switch to another one
            if (currentDevisName === devisName) {
              // Find first available devis that's not the deleted one
              if (devisName === 'Devis Principal') {
                // If deleting Devis Principal, switch to first other devis or clear
                const nextDevis = updatedList.find(d => d.devis_name !== 'Devis Principal');
                setCurrentDevisName(nextDevis ? nextDevis.devis_name : '');
              } else {
                // If deleting other devis, switch to Devis Principal if exists, otherwise first available
                const devisPrincipal = updatedList.find(d => d.devis_name === 'Devis Principal');
                if (devisPrincipal) {
                  setCurrentDevisName('Devis Principal');
                } else {
                  setCurrentDevisName(updatedList.length > 0 ? updatedList[0].devis_name : '');
                }
              }
            }
          } else {
            throw new Error(result.error || 'Échec de la suppression');
          }
        } catch (error) {
          console.error('Error deleting devis:', error);
          message.error('Échec de la suppression du devis');
        }
      },
    });
  };

  // Handle image selection toggle
  const handleImageToggle = (imageId) => {
    setSelectedImages(prev => {
      if (prev.includes(imageId)) {
        return prev.filter(id => id !== imageId);
      } else {
        return [...prev, imageId];
      }
    });
  };

  // Save image selections
  const handleSaveImageSelections = () => {
    localStorage.setItem(
      `devis_images_${siteName}_${currentDevisName}`,
      JSON.stringify(selectedImages)
    );
    message.success(`${selectedImages.length} image(s) sélectionnée(s) pour ${currentDevisName}`);
    setShowImageModal(false);
  };

  // Handle save with confirmation
  const handleSave = () => {
    // Filter out placeholder entries before calculating totals
    const filteredDevisData = Object.entries(devisData)
      .filter(([key]) => !key.startsWith('__placeholder::'))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const totalToInstall = Object.values(filteredDevisData).reduce((sum, d) => sum + (d.toInstall || 0), 0);

    if (totalToInstall === 0) {
      message.warning('Aucun équipement à installer sélectionné');
      return;
    }

    Modal.confirm({
      title: 'Confirmer l\'enregistrement',
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Devis : <strong>{currentDevisName}</strong></Text>
          <Text>Vous êtes sur le point d'enregistrer :</Text>
          <Text strong>{totalToInstall} unités à installer</Text>
          <Text type="secondary">Voulez-vous continuer ?</Text>
        </Space>
      ),
      okText: 'Enregistrer',
      cancelText: 'Annuler',
      onOk: async () => {
        setIsSaving(true);
        try {
          // First, delete placeholder entry if it exists
          await fetch(`${API_BASE_URL}/delete-devis-equipment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              site: siteName,
              devisName: currentDevisName,
              equipmentType: '__placeholder',
              zoneName: 'init'
            }),
          });

          // Then save the real equipment data
          const response = await fetch(`${API_BASE_URL}/save-devis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site: siteName, devisName: currentDevisName, devisData: filteredDevisData }),
          });

          const result = await response.json();

          if (response.ok) {
            message.success('Devis enregistré avec succès');
            // Refresh devis list
            const listResponse = await fetch(`${API_BASE_URL}/list-devis`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ site: siteName }),
            });
            const { devisList: list } = await listResponse.json();
            setDevisList(list || []);
          } else {
            throw new Error(result.error || 'Échec de l\'enregistrement');
          }
        } catch (error) {
          console.error('Error saving devis:', error);
          message.error('Échec de l\'enregistrement du devis');
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  // Handle reset
  const handleReset = () => {
    const resetDevis = {};
    equipmentData.forEach(item => {
      const key = `${item.type}::${item.zone}`;
      resetDevis[key] = {
        toInstall: 0,
        zone: item.zone,
      };
    });
    setDevisData(resetDevis);
    message.info('Formulaire réinitialisé');
  };

  // Get zone label
  const getZoneLabel = (zoneValue) => {
    const zone = AVAILABLE_ZONES.find(z => z.value === zoneValue);
    return zone ? zone.label : zoneValue;
  };

  return (
    <PageLayout>
      <FormCard>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div>
            <Title level={3} style={{ marginBottom: 8 }}>
              Devis - Équipements à installer
            </Title>
            <Text type="secondary">
              Définissez les quantités d'équipements à installer par zone
            </Text>
          </div>

          {/* Devis Selection - Improved Card Grid */}
          <Card
            size="small"
            title={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: 16 }}>📋 Sélectionner un Devis</Text>
                {!isCreatingNew ? (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsCreatingNew(true)}
                    size="small"
                  >
                    Nouveau devis
                  </Button>
                ) : null}
              </Space>
            }
            style={{ background: '#f5f5f5' }}
          >
            {isCreatingNew && (
              <Card size="small" style={{ marginBottom: 16, background: '#e6f7ff', borderColor: '#1890ff' }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="Nom du nouveau devis (ex: Devis 2, Option A)"
                    value={newDevisName}
                    onChange={e => setNewDevisName(e.target.value)}
                    onPressEnter={handleCreateNew}
                    style={{ flex: 1 }}
                  />
                  <Button type="primary" onClick={handleCreateNew}>Créer</Button>
                  <Button onClick={() => { setIsCreatingNew(false); setNewDevisName(''); }}>Annuler</Button>
                </Space.Compact>
              </Card>
            )}

            {/* Devis Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16
            }}>
              {/* All Devis Cards (including Devis Principal if it exists) */}
              {devisList.length === 0 ? (
                <Empty
                  description="Aucun devis disponible - Créez-en un nouveau"
                  style={{ gridColumn: '1 / -1', padding: '40px 0' }}
                />
              ) : (
                devisList.map((devis) => (
                  <Card
                    key={devis.devis_name}
                    hoverable
                    onClick={() => setCurrentDevisName(devis.devis_name)}
                    style={{
                      border: currentDevisName === devis.devis_name ? '3px solid #1890ff' : '1px solid #d9d9d9',
                      boxShadow: currentDevisName === devis.devis_name
                        ? '0 4px 12px rgba(24, 144, 255, 0.3)'
                        : '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'all 0.3s ease',
                      background: currentDevisName === devis.devis_name ? '#f0f7ff' : 'white'
                    }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text strong style={{ fontSize: 16 }}>
                          📄 {devis.devis_name}
                        </Text>
                        {currentDevisName === devis.devis_name && (
                          <Tag color="success" icon={<CheckCircleOutlined />}>Actif</Tag>
                        )}
                      </Space>

                      <div style={{
                        padding: '12px',
                        background: 'rgba(24, 144, 255, 0.05)',
                        borderRadius: 8,
                        marginTop: 8
                      }}>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>À installer:</Text>
                            <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                              {devis.total_to_install || 0} unités
                            </Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Dernière modification: {new Date(devis.updated_at).toLocaleDateString('fr-FR')}
                          </Text>
                        </Space>
                      </div>

                      {currentDevisName === devis.devis_name && (
                        <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
                          <Button
                            type="dashed"
                            size="small"
                            icon={<PictureOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowImageModal(true);
                            }}
                            style={{ width: '100%' }}
                          >
                            Sélectionner les images ({selectedImages.length})
                          </Button>
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDevis(devis.devis_name);
                            }}
                            style={{ width: '100%' }}
                          >
                            Supprimer ce devis
                          </Button>
                        </Space>
                      )}
                    </Space>
                  </Card>
                ))
              )}
            </div>
          </Card>

          {/* Equipment List */}
          {isLoading ? (
            <Card loading />
          ) : equipmentData.length === 0 ? (
            <Empty
              description="Aucun équipement trouvé dans Page 2"
              style={{ padding: '40px 0' }}
            />
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* Summary Card */}
              <Card
                size="small"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong style={{ color: 'white', fontSize: 16 }}>
                    📊 Résumé
                  </Text>
                  <Space wrap>
                    <Text style={{ color: 'white' }}>
                      Existant : <strong>{equipmentData.reduce((sum, item) => sum + item.existing, 0)}</strong> unités
                    </Text>
                    <Text style={{ color: 'white' }}>•</Text>
                    <Text style={{ color: 'white' }}>
                      À installer : <strong>{Object.values(devisData).reduce((sum, d) => sum + (d.toInstall || 0), 0)}</strong> unités
                    </Text>
                    <Text style={{ color: 'white' }}>•</Text>
                    <Text style={{ color: 'white' }}>
                      Total final : <strong>{equipmentData.reduce((sum, item) => sum + item.existing, 0) + Object.values(devisData).reduce((sum, d) => sum + (d.toInstall || 0), 0)}</strong> unités
                    </Text>
                  </Space>
                </Space>
              </Card>

              <Title level={4}>Équipements par zone</Title>

              {equipmentData.map((item) => {
                const key = `${item.type}::${item.zone}`;
                const emoji = EQUIPMENT_EMOJI[item.type];
                const devis = devisData[key] || { toInstall: 0 };

                return (
                  <Card
                    key={key}
                    size="small"
                    style={{
                      borderLeft: `4px solid ${LAYOUT_CONSTANTS.COLORS.PRIMARY}`,
                      background: '#fafafa',
                    }}
                  >
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: '100%' }}
                    >
                      {/* Equipment Header */}
                      <Space>
                        <Text strong style={{ fontSize: 16 }}>
                          {emoji} {item.type}
                        </Text>
                        <Tag color="blue">{item.existing} existants</Tag>
                        <Tag>{getZoneLabel(item.zone)}</Tag>
                      </Space>

                      {/* Installation Input */}
                      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <Text>À installer :</Text>
                          <InputNumber
                            min={0}
                            max={1000}
                            value={devis.toInstall}
                            onChange={(value) => handleQuantityChange(item.type, item.zone, value)}
                            style={{ width: 120 }}
                            placeholder="0"
                          />
                          <Text type="secondary">unités</Text>
                        </Space>

                        {/* Quick Action Buttons */}
                        <Space size="small">
                          <a
                            onClick={() => handleQuantityChange(item.type, item.zone, item.existing)}
                            style={{ fontSize: 12 }}
                          >
                            Remplacer tout
                          </a>
                          <a
                            onClick={() => handleQuantityChange(item.type, item.zone, Math.ceil(item.existing / 2))}
                            style={{ fontSize: 12 }}
                          >
                            Moitié
                          </a>
                        </Space>
                      </Space>

                      {/* Summary */}
                      {devis.toInstall > 0 && (
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Text type="success">
                            <CheckCircleOutlined /> Total après installation : <strong>{item.existing + devis.toInstall} unités</strong>
                          </Text>
                          {devis.toInstall >= item.existing && (
                            <Text type="warning" style={{ fontSize: 12 }}>
                              ⚠️ Vous installez {devis.toInstall >= item.existing * 2 ? 'plus du double' : 'autant ou plus'} que l'existant
                            </Text>
                          )}
                        </Space>
                      )}
                    </Space>
                  </Card>
                );
              })}
            </Space>
          )}

          <Divider />

          {/* Action Buttons */}
          <ActionButtons
            buttons={[
              {
                type: 'primary',
                onClick: handleSave,
                loading: isSaving,
                children: 'Enregistrer le devis',
                icon: <SaveOutlined />,
              },
              {
                onClick: handleReset,
                children: 'Réinitialiser',
                icon: <ReloadOutlined />,
              },
            ]}
          />
        </Space>
      </FormCard>

      {/* Image Selection Modal */}
      <Modal
        title={`Sélectionner les images pour ${currentDevisName}`}
        open={showImageModal}
        onCancel={() => setShowImageModal(false)}
        onOk={handleSaveImageSelections}
        width={900}
        okText="Enregistrer la sélection"
        cancelText="Annuler"
      >
        {annotatedImages.length === 0 ? (
          <Empty
            description="Aucune image finalisée disponible"
            style={{ padding: '40px 0' }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Créez des plans dans Page 3 et sauvegardez-les pour les voir ici.
            </Text>
          </Empty>
        ) : (
          <div>
            <Typography.Paragraph style={{ marginBottom: 16, color: '#666' }}>
              Sélectionnez les images qui seront affichées dans Page 6 pour ce devis.
            </Typography.Paragraph>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 16
            }}>
              {annotatedImages.map((image) => (
                <Card
                  key={image.id}
                  size="small"
                  hoverable
                  onClick={() => handleImageToggle(image.id)}
                  style={{
                    cursor: 'pointer',
                    border: selectedImages.includes(image.id) ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    background: selectedImages.includes(image.id) ? '#f0f7ff' : 'white'
                  }}
                  cover={
                    <div style={{
                      height: 150,
                      overflow: 'hidden',
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <img
                        src={image.url_viewer || image.image_url}
                        alt={image.label || 'Plan'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      {selectedImages.includes(image.id) && (
                        <div style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: '#1890ff',
                          color: 'white',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircleOutlined />
                        </div>
                      )}
                    </div>
                  }
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Checkbox
                      checked={selectedImages.includes(image.id)}
                      onChange={() => handleImageToggle(image.id)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Text strong style={{ fontSize: 13 }}>
                        {image.label || `Image ${image.image_id || image.id}`}
                      </Text>
                    </Checkbox>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(image.datetime).toLocaleDateString('fr-FR')}
                    </Text>
                  </Space>
                </Card>
              ))}
            </div>

            <Divider />

            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">
                {selectedImages.length} image(s) sélectionnée(s)
              </Text>
              <Space>
                <Button
                  size="small"
                  onClick={() => setSelectedImages([])}
                >
                  Tout désélectionner
                </Button>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => setSelectedImages(annotatedImages.map(img => img.id))}
                >
                  Tout sélectionner
                </Button>
              </Space>
            </Space>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}

export default DevisPage;
