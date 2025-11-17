import { useState } from 'react';
import { Modal, Form, Select, Button, message, Space, Typography, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  AVAILABLE_ZONES,
  EQUIPMENT_TYPES,
  createCardKey,
  getCardLabel,
  validateZoneCard,
  cardExists,
  parseCardKey
} from './zoneUtils';

const { Option } = Select;
const { Text } = Typography;

/**
 * Modal for adding/managing zone-based equipment cards
 */
const ZoneManagementModal = ({
  visible,
  onClose,
  onAddCard,
  onRemoveCard,
  existingCards = [],
  equipmentTypes = EQUIPMENT_TYPES,  // Allow custom equipment types
  title = "Gestion des Zones"  // Allow custom title
}) => {
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  const handleAdd = () => {
    const validation = validateZoneCard(selectedType, selectedZone);

    if (!validation.valid) {
      return message.error(validation.error);
    }

    // Check if card already exists
    const existingData = existingCards.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});

    if (cardExists(existingData, selectedType, selectedZone)) {
      return message.warning('Cette configuration existe déjà');
    }

    const cardKey = createCardKey(selectedType, selectedZone);
    const cardLabel = getCardLabel(selectedType, selectedZone);

    onAddCard(cardKey, selectedType, selectedZone);
    message.success(`Carte "${cardLabel}" ajoutée`);

    // Reset form
    setSelectedType(null);
    setSelectedZone(null);
    form.resetFields();
  };

  const handleRemove = (cardKey) => {
    const { type, zone } = parseCardKey(cardKey);
    const cardLabel = getCardLabel(type, zone);

    Modal.confirm({
      title: 'Supprimer cette carte ?',
      content: `Voulez-vous supprimer la carte "${cardLabel}" ? Toutes les données associées seront perdues.`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: () => {
        onRemoveCard(cardKey);
        message.success(`Carte "${cardLabel}" supprimée`);
      }
    });
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedType(null);
    setSelectedZone(null);
    onClose();
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose}>
          Fermer
        </Button>
      ]}
      width={700}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Add new zone card section */}
        <div>
          <Text strong style={{ fontSize: 16 }}>
            Ajouter une nouvelle zone
          </Text>
          <Alert
            message="Créez plusieurs cartes pour le même équipement si vous avez plusieurs zones"
            type="info"
            showIcon
            style={{ marginTop: 8, marginBottom: 16 }}
          />

          <Form form={form} layout="vertical">
            <Form.Item
              label="Type d'équipement"
              name="type"
              rules={[{ required: true, message: 'Sélectionnez un type d\'équipement' }]}
            >
              <Select
                placeholder="Sélectionnez un type"
                value={selectedType}
                onChange={setSelectedType}
                style={{ width: '100%' }}
              >
                {equipmentTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Zone"
              name="zone"
              rules={[{ required: true, message: 'Sélectionnez une zone' }]}
            >
              <Select
                placeholder="Sélectionnez une zone"
                value={selectedZone}
                onChange={setSelectedZone}
                style={{ width: '100%' }}
              >
                {AVAILABLE_ZONES.map(zone => (
                  <Option key={zone.value} value={zone.value}>
                    {zone.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              disabled={!selectedType || !selectedZone}
              block
            >
              Ajouter cette carte
            </Button>
          </Form>
        </div>

        {/* Existing cards list */}
        {existingCards.length > 0 && (
          <div>
            <Text strong style={{ fontSize: 16 }}>
              Cartes existantes ({existingCards.length})
            </Text>
            <div style={{ marginTop: 12, maxHeight: 300, overflowY: 'auto' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {existingCards.map(cardKey => {
                  const { type, zone } = parseCardKey(cardKey);

                  return (
                    <div
                      key={cardKey}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <Space>
                        <Text strong>{type}</Text>
                        {zone && (
                          <>
                            <span style={{ color: '#999' }}>→</span>
                            <Text type="secondary">
                              {AVAILABLE_ZONES.find(z => z.value === zone)?.label || zone}
                            </Text>
                          </>
                        )}
                      </Space>

                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(cardKey)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  );
                })}
              </Space>
            </div>
          </div>
        )}

        {existingCards.length === 0 && (
          <Alert
            message="Aucune carte configurée"
            description="Ajoutez votre première carte ci-dessus"
            type="warning"
            showIcon
          />
        )}
      </Space>
    </Modal>
  );
};

export default ZoneManagementModal;
