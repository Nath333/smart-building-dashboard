// ComptageCard.jsx - UI component for managing comptage (metering) data
// Displays individual comptage cards with fields for type, connection, power, comments, etc.

import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, InputNumber, Space, Divider, message } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../../config/app.config';

const { TextArea } = Input;
const { Option } = Select;

// Comptage type options
const COMPTAGE_TYPES = [
  { value: 'energie', label: 'Énergie' },
  { value: 'eau', label: 'Eau' },
  { value: 'gaz', label: 'Gaz' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'autre', label: 'Autre' }
];

// Connection type options
const CONNECTION_TYPES = [
  { value: 'modbus', label: 'Modbus' },
  { value: 'mbus', label: 'M-Bus' },
  { value: 'impulsion', label: 'Impulsion' },
  { value: 'analogique', label: 'Analogique' },
  { value: 'numerique', label: 'Numérique' },
  { value: 'autre', label: 'Autre' }
];

// État de vétusté options
const ETAT_VETUSTE_OPTIONS = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'bon', label: 'Bon état' },
  { value: 'moyen', label: 'État moyen' },
  { value: 'mauvais', label: 'Mauvais état' },
  { value: 'obsolete', label: 'Obsolète' }
];

// Zone/Localisation options (common zones)
const ZONE_OPTIONS = [
  { value: 'surface_de_vente', label: 'Surface de vente' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'reserve', label: 'Réserve' },
  { value: 'vestiaire', label: 'Vestiaire' },
  { value: 'exterieur', label: 'Extérieur' },
  { value: 'autre', label: 'Autre' }
];

const ComptageCard = ({ category, siteName }) => {
  const [form] = Form.useForm();
  const [comptageList, setComptageList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nbComptages, setNbComptages] = useState(1);

  // Load existing comptage data on mount
  useEffect(() => {
    if (siteName && category) {
      loadComptageData();
    }
  }, [siteName, category]);

  const loadComptageData = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/get-comptage`, {
        site: siteName,
        category
      });

      if (response.data && response.data.length > 0) {
        setComptageList(response.data);
        setNbComptages(response.data.length);

        // Populate form with first record's zone and etat_vetuste
        if (response.data[0]) {
          form.setFieldsValue({
            zone: response.data[0].zone,
            etat_vetuste: response.data[0].etat_vetuste,
            localisation: response.data[0].localisation
          });
        }
      }
    } catch (error) {
      console.error('Error loading comptage data:', error);
      // Don't show error message - empty data is expected for new sites
    } finally {
      setLoading(false);
    }
  };

  const handleNbComptagesChange = (value) => {
    setNbComptages(value || 1);

    // Adjust comptageList length
    const currentList = [...comptageList];
    if (value > currentList.length) {
      // Add new empty records
      for (let i = currentList.length; i < value; i++) {
        currentList.push({
          type: null,
          connection_type: null,
          puissance: 0,
          commentaire: ''
        });
      }
    } else if (value < currentList.length) {
      // Remove excess records
      currentList.splice(value);
    }
    setComptageList(currentList);
  };

  const handleComptageChange = (index, field, value) => {
    const newList = [...comptageList];
    if (!newList[index]) {
      newList[index] = {};
    }
    newList[index][field] = value;
    setComptageList(newList);
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      setLoading(true);

      // Prepare comptage data with zone/etat_vetuste from form
      const comptageData = comptageList.map((item, index) => ({
        zone: formValues.zone,
        etat_vetuste: formValues.etat_vetuste,
        localisation: formValues.localisation,
        nb: index + 1,
        type: item.type,
        connection_type: item.connection_type,
        puissance: item.puissance || 0,
        commentaire: item.commentaire || ''
      }));

      await axios.post(`${API_BASE_URL}/save-comptage`, {
        site: siteName,
        category,
        comptageData
      });

      message.success(`Comptage ${getCategoryLabel(category)} enregistré avec succès`);
      loadComptageData(); // Reload to get IDs
    } catch (error) {
      console.error('Error saving comptage:', error);
      message.error('Erreur lors de l\'enregistrement du comptage');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    const record = comptageList[index];
    if (record.id) {
      try {
        await axios.delete(`${API_BASE_URL}/delete-comptage/${category}/${record.id}`);
        message.success('Comptage supprimé');
      } catch (error) {
        console.error('Error deleting comptage:', error);
        message.error('Erreur lors de la suppression');
      }
    }

    // Remove from local list
    const newList = comptageList.filter((_, i) => i !== index);
    setComptageList(newList);
    setNbComptages(newList.length);
  };

  const getCategoryLabel = (cat) => {
    const labels = {
      aerotherme: 'Aérotherme',
      climate: 'Climatisation',
      lighting: 'Éclairage',
      rooftop: 'Rooftop'
    };
    return labels[cat] || cat;
  };

  return (
    <Card
      title={`📊 Comptage ${getCategoryLabel(category)}`}
      bordered
      style={{ marginBottom: 16 }}
    >
      <Form form={form} layout="vertical">
        {/* Global fields */}
        <Form.Item
          label="Localisation"
          name="localisation"
          rules={[{ required: true, message: 'Veuillez sélectionner une localisation' }]}
        >
          <Select placeholder="Sélectionner la localisation">
            {ZONE_OPTIONS.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="État de vétusté"
          name="etat_vetuste"
          rules={[{ required: true, message: 'Veuillez sélectionner un état' }]}
        >
          <Select placeholder="Sélectionner l'état">
            {ETAT_VETUSTE_OPTIONS.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Nombre de comptages">
          <InputNumber
            min={1}
            max={20}
            value={nbComptages}
            onChange={handleNbComptagesChange}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Divider orientation="left">Détails des comptages</Divider>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: 16 }}>
          Renseignez le type, la connexion et la puissance pour chaque comptage individuellement.
        </div>

        {/* Individual comptage cards */}
        {comptageList.map((comptage, index) => (
          <Card
            key={index}
            type="inner"
            title={`📊 Comptage ${index + 1}`}
            extra={
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(index)}
              >
                Supprimer
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>Type de comptage</label>
                <Select
                  placeholder="Sélectionner le type"
                  value={comptage.type}
                  onChange={(val) => handleComptageChange(index, 'type', val)}
                  style={{ width: '100%', marginTop: 4 }}
                >
                  {COMPTAGE_TYPES.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </div>

              <div>
                <label>Type de connexion</label>
                <Select
                  placeholder="Sélectionner la connexion"
                  value={comptage.connection_type}
                  onChange={(val) => handleComptageChange(index, 'connection_type', val)}
                  style={{ width: '100%', marginTop: 4 }}
                >
                  {CONNECTION_TYPES.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </div>

              <div>
                <label>Puissance totale (W)</label>
                <InputNumber
                  placeholder="0"
                  value={comptage.puissance}
                  onChange={(val) => handleComptageChange(index, 'puissance', val)}
                  style={{ width: '100%', marginTop: 4 }}
                  min={0}
                />
              </div>

              <div>
                <label>Commentaire</label>
                <TextArea
                  rows={2}
                  placeholder="Commentaire optionnel"
                  value={comptage.commentaire}
                  onChange={(e) => handleComptageChange(index, 'commentaire', e.target.value)}
                  style={{ marginTop: 4 }}
                />
              </div>
            </Space>
          </Card>
        ))}

        {/* Add new comptage button */}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => handleNbComptagesChange(nbComptages + 1)}
          block
          style={{ marginBottom: 16 }}
        >
          Ajouter un comptage
        </Button>

        {/* Save button */}
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={loading}
          block
          size="large"
        >
          Enregistrer le comptage {getCategoryLabel(category)}
        </Button>
      </Form>
    </Card>
  );
};

export default ComptageCard;
