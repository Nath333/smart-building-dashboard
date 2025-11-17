import { useState, useEffect, useCallback } from 'react';
import {
  Card, Form, Typography, InputNumber, Select, Radio,
  Input, Divider, message, Tag, Spin, Space, Table, Badge
} from 'antd';
import { FileImageOutlined, EditOutlined, BarChartOutlined } from '@ant-design/icons';

const { Text } = Typography;
import axios from 'axios';
import { API_BASE_URL } from '../api/apiConfig';
import { getSiteName } from '../utils/siteContext';
import PageLayout from '../components/layout/PageLayout';
import FormCard from '../components/common/FormCard';
import ActionButtons from '../components/common/ActionButtons';

const { Option } = Select;

const MODULE_LABELS = {
  aeroeau: 'Aéro eau',
  aerogaz: 'Aéro gaz',
  rooftop: 'Rooftop',
  eclairage: 'Éclairage',
  clim_ir: 'Clim IR',
  clim_filaire_simple: 'Clim filaire simple',
  clim_filaire_groupe: 'Clim filaire groupe',
  Comptage_Froid: 'Compteurs froid',
  Comptage_Eclairage: 'Compteurs éclairage',
};

const DEFAULT_REFS = {
  clim_ir: 'Intesis IR',
  rooftop: 'modbus do12',
  aerogaz: 'cs do12',
  aeroeau: 'cs do12',
  clim_filaire_simple: 'aidoo pro',
  clim_filaire_groupe: 'aidoo pro',
  Comptage_Froid: 'mtr5lmod',
  Comptage_Eclairage: 'mtr5lmod',
  eclairage: 'cs do12',
  sondes: 'pi33',
  sondesPresentes: 'wt101',
  gazCompteur: 'gaz 34325',
  Izit: {
    'coffret gtb(asp/do12/routeur/ug65)': '234543FRR',
    'coffret gtb(asb/routeur/ug65)': '3434',
    'isma': '55',
  },
};

  
const generateRefsArray = (length, defaultVal) =>
  Array.from({ length }, () => defaultVal);

const ensureRefsMatchCounts = (values) => {
  const refs = { ...(values.refs || {}) };

  // modules + special cases
  const allModules = [...(values.modules || []), 'sondes', 'sondesPresentes'];

  allModules.forEach((mod) => {
    const count = values[mod] || 0;
    const def = DEFAULT_REFS[mod] || '';
    refs[mod] = generateRefsArray(count, def).map((_, i) =>
      refs[mod]?.[i] ?? def
    );
  });

  refs.gazCompteur = values.gazCompteur === 'oui' ? [DEFAULT_REFS.gazCompteur] : [];

  // Handle Izit - can be array or number from SQL
  const izitValue = values.Izit || [];
  if (Array.isArray(izitValue)) {
    refs.Izit = izitValue.map(opt => DEFAULT_REFS.Izit[opt] || '');
  } else if (typeof izitValue === 'number') {
    // If Izit is a number (from SQL), create empty array of that length
    refs.Izit = Array(izitValue).fill('');
  } else {
    refs.Izit = [];
  }

  return refs;
};

export default function Page3() {
  const [form] = Form.useForm();
  const [selectedModules, setSelectedModules] = useState([]);
  const siteName = getSiteName();

  // NEW: Devis selection state
  const [availableDevis, setAvailableDevis] = useState([]);
  const [selectedDevis, setSelectedDevis] = useState(null); // No default devis
  const [loadingDevis, setLoadingDevis] = useState(true);
  const [devisInstallations, setDevisInstallations] = useState([]);

  // Load available devis list
  useEffect(() => {
    const loadDevisList = async () => {
      console.log('🔄 Loading devis list for site:', siteName);

      if (!siteName || siteName === 'unknown') {
        console.log('⚠️ No valid site name found');
        setLoadingDevis(false);
        return;
      }

      try {
        setLoadingDevis(true);
        const response = await axios.post(`${API_BASE_URL}/list-devis`, { site: siteName });
        const devisList = response.data?.devisList || [];

        console.log(`📊 Found ${devisList.length} devis:`, devisList);
        const devisNames = devisList.map(d => d.devis_name || d);
        setAvailableDevis(devisNames);

        // Don't auto-select - user must choose
        // If current selection is not in list, clear it
        if (selectedDevis && !devisNames.includes(selectedDevis)) {
          setSelectedDevis(null);
        }

      } catch (error) {
        console.error('❌ Error loading devis list:', error);
        message.error('Erreur lors du chargement des devis');
        setAvailableDevis([]);
      } finally {
        setLoadingDevis(false);
      }
    };

    loadDevisList();
  }, [siteName]);

  // Load devis installations (equipment to install per zone)
  useEffect(() => {
    const loadDevisInstallations = async () => {
      if (!siteName || siteName === 'unknown' || !selectedDevis) {
        setDevisInstallations([]);
        return;
      }

      try {
        console.log('📊 Loading installations for devis:', selectedDevis);
        const response = await axios.post(`${API_BASE_URL}/get-devis`, {
          site: siteName,
          devisName: selectedDevis
        });

        // Transform the response from get-devis to match expected format
        const devisData = response.data?.devisData || {};
        const installations = Object.entries(devisData)
          .filter(([key]) => !key.startsWith('__placeholder::'))  // Skip placeholder entries
          .map(([key, value]) => {
            const [equipment_type, zone_name] = key.split('::');
            return {
              equipment_type,
              zone_name,
              existing_count: value.existing || 0,
              to_install_count: value.toInstall || 0
            };
          });

        setDevisInstallations(installations);
        console.log(`✅ Loaded ${installations.length} installation records`);
      } catch (error) {
        console.error('❌ Error loading devis installations:', error);
        setDevisInstallations([]);
      }
    };

    loadDevisInstallations();
  }, [siteName, selectedDevis]);

  // Load GTB configuration for selected devis
  useEffect(() => {
    console.log('🔄 GtbConfigPage mounting with site:', siteName, 'devis:', selectedDevis);

    if (!siteName || siteName === 'unknown') {
      console.log('⚠️ No valid site name found, starting with empty form');
      form.resetFields();
      setSelectedModules([]);
      return;
    }

    if (!selectedDevis) {
      console.log('⚠️ No devis selected yet');
      return;
    }

    // Fetch GTB data for this specific site + devis
    console.log('📡 Fetching GTB data from SQL for site:', siteName, 'devis:', selectedDevis);

    // First, clear the form before fetching new data
    console.log('🧹 Clearing form before loading new devis data...');
    form.resetFields();
    setSelectedModules([]);

    axios.post(`${API_BASE_URL}/get-page3`, {
      site: siteName,
      devis_name: selectedDevis
    })
      .then((response) => {
        const sqlData = response.data;
        console.log('📥 GTB data fetched from SQL:', sqlData);

        // Check if we have actual module data (not just site/devis_name fields)
        const hasModuleData = sqlData && sqlData.modules && sqlData.modules.length > 0;

        if (hasModuleData) {
          console.log('✅ SQL data found, applying to form...');

          // Transform SQL data to frontend format
          const transformedData = { ...sqlData };

          // Convert gazCompteur from int to "oui"/"non"
          if (typeof transformedData.gazCompteur === 'number') {
            transformedData.gazCompteur = transformedData.gazCompteur > 0 ? 'oui' : 'non';
          } else if (!transformedData.gazCompteur) {
            transformedData.gazCompteur = 'non';
          }

          // Izit should already be an array of coffret names from backend
          // If it's not an array, initialize as empty array
          if (!Array.isArray(transformedData.Izit)) {
            transformedData.Izit = [];
          }

          const refs = ensureRefsMatchCounts(transformedData);
          const dataWithRefs = { ...transformedData, refs };

          form.setFieldsValue(dataWithRefs);
          setSelectedModules(sqlData.modules || []);

          console.log('✅ GTB data loaded from SQL');
          console.log('📋 Modules loaded:', sqlData.modules);
        } else {
          console.log('📭 No module data found for this devis, form remains empty');
          // Form already cleared above
        }
      })
      .catch((error) => {
        console.error('❌ Error loading GTB data from SQL:', error);
        console.error('📛 Error details:', error.response?.data || error.message);

        console.log('⚠️ Form cleared due to error');
        // Form already cleared above
      });
  }, [siteName, selectedDevis, form]);

  // HANDLE FORM CHANGES (no localStorage, only local state)
  const onValuesChange = useCallback((changedValues, all) => {
    console.log('🔄 Form values changed:', changedValues);
    
    const refs = ensureRefsMatchCounts(all);
    console.log('🔧 Updated refs after count change:', refs);
    
    form.setFieldValue('refs', refs);
    setSelectedModules(all.modules || []);
    
    // No localStorage saving - data stays in form state until saved to SQL
    console.log('📝 Form state updated (not persisted until save)');
  }, [form]);

  const renderRefsList = (module) => (
    <Form.List name={['refs', module]}>
      {(fields) => (
        <>
          {fields.map(({ key, name, ...rest }) => (
            <Form.Item
              key={key}
              {...rest}
              name={name}
              label={`Référence ${name + 1}`}
              rules={[{ required: true, message: 'Champ requis' }]}
            >
              <Input placeholder="Référence" />
            </Form.Item>
          ))}
        </>
      )}
    </Form.List>
  );

  const ModuleCard = ({ module }) => {
    const moduleLabel = MODULE_LABELS[module] || module;
    const defaultRef = DEFAULT_REFS[module] || '';

    return (
      <FormCard
        key={module}
        title={moduleLabel}
        style={{ borderRadius: 12 }}
      >
        <Form.Item
          label={`Nombre de ${moduleLabel}`}
          name={module}
          tooltip={defaultRef ? `Référence par défaut: ${defaultRef}` : null}
        >
          <InputNumber min={0} style={{ width: '100%' }} placeholder="ex: 3" />
        </Form.Item>
        <Divider orientation="left">Références associées</Divider>
        {renderRefsList(module)}
      </FormCard>
    );
  };
  const handleSubmit = async () => {
    console.log('📤 Submitting GTB form data...');
    console.log('🏢 Site name for submission:', siteName);
    console.log('📋 Devis name for submission:', selectedDevis);

    // Validate devis is selected
    if (!selectedDevis) {
      message.error('Veuillez sélectionner un devis avant de sauvegarder');
      return;
    }

    try {
      const values = await form.validateFields();
      console.log('✅ Form validated successfully');
      console.log('📝 Form values:', values);
      console.log('📋 Modules to save:', values.modules);
      console.log('🔧 Refs to save:', values.refs);

      // Transform refs object to flat ref_* string fields expected by backend
      const dataToSave = {
        ...values,
        site: siteName,
        devis_name: selectedDevis, // Use currently selected devis
      };

      console.log('🎯 Saving to devis:', selectedDevis);

      // Convert refs object to ref_* string fields
      if (values.refs && typeof values.refs === 'object') {
        Object.keys(values.refs).forEach(key => {
          const refArray = values.refs[key];
          if (Array.isArray(refArray) && refArray.length > 0) {
            // Join array into comma-separated string
            // Special handling for sensor fields: convert camelCase to backend format
            let backendKey = key;
            if (key === 'sondesPresentes') {
              backendKey = 'sondesPresentes'; // Backend expects this camelCase format
            } else if (key === 'gazCompteur') {
              backendKey = 'gazCompteur'; // Backend expects this camelCase format
            }
            dataToSave[`ref_${backendKey}`] = refArray.filter(Boolean).join(',');
          }
        });
        // Remove the nested refs object after transformation
        delete dataToSave.refs;
      }

      console.log('📤 Data being sent to server (after refs transformation):', dataToSave);

      const response = await axios.post(`${API_BASE_URL}/save_page3`, dataToSave);
      console.log('✅ Server response:', response.data);

      message.success(`Configuration GTB sauvegardée pour devis: ${selectedDevis}`);
      console.log('✅ GTB data saved successfully to SQL');

      // Optionally reload from SQL to confirm save
      setTimeout(() => {
        handleReloadFromSQL();
      }, 500);
    } catch (err) {
      console.error('❌ Error during form submission:', err);
      console.error('📛 Error details:', err.response?.data || err.message);
      message.error("Erreur lors de l'envoi");
    }
  };

  const handleReloadFromSQL = () => {
    console.log('🔄 Reloading data from SQL...');

    if (!siteName || siteName === 'unknown' || !selectedDevis) {
      console.log('⚠️ No site name or devis selected, cannot reload');
      return;
    }

    // Clear form first
    console.log('🧹 Clearing form before reload...');
    form.resetFields();
    setSelectedModules([]);

    axios.post(`${API_BASE_URL}/get-page3`, {
      site: siteName,
      devis_name: selectedDevis
    })
      .then((response) => {
        const sqlData = response.data;
        console.log('📥 Fresh data from SQL:', sqlData);

        // Check if we have actual module data
        const hasModuleData = sqlData && sqlData.modules && sqlData.modules.length > 0;

        if (hasModuleData) {
          // Transform SQL data to frontend format
          const transformedData = { ...sqlData };

          // Convert gazCompteur from int to "oui"/"non"
          if (typeof transformedData.gazCompteur === 'number') {
            transformedData.gazCompteur = transformedData.gazCompteur > 0 ? 'oui' : 'non';
          } else if (!transformedData.gazCompteur) {
            transformedData.gazCompteur = 'non';
          }

          // Izit should already be an array of coffret names from backend
          // If it's not an array, initialize as empty array
          if (!Array.isArray(transformedData.Izit)) {
            transformedData.Izit = [];
          }

          const refs = ensureRefsMatchCounts(transformedData);
          const dataWithRefs = { ...transformedData, refs };

          form.setFieldsValue(dataWithRefs);
          setSelectedModules(sqlData.modules || []);

          message.success('Données rechargées depuis SQL');
          console.log('✅ Data reloaded from SQL');
        } else {
          console.log('📭 No module data found on reload');
          message.info('Aucune donnée trouvée pour ce devis');
          // Form already cleared above
        }
      })
      .catch((error) => {
        console.error('❌ Error reloading from SQL:', error);
        message.error('Erreur lors du rechargement');
        // Form already cleared above
      });
  };

  return (
    <PageLayout title="Configuration GTB" maxWidth={1200} centered={true}>

      {/* Devis Selection Card */}
      <Card
        title={
          <Space>
            <FileImageOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <span>Sélectionner un Devis de Page 4</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {loadingDevis ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <Typography.Paragraph style={{ marginTop: 16, color: '#999' }}>
              Chargement des devis depuis Page 4...
            </Typography.Paragraph>
          </div>
        ) : availableDevis.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Typography.Title level={4} style={{ color: '#999', marginBottom: 16 }}>
              📋 Aucun devis disponible
            </Typography.Title>
            <Typography.Paragraph style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
              Vous devez d'abord créer un devis dans Page 4 (Devis).
            </Typography.Paragraph>
            <Typography.Paragraph style={{ fontSize: 14, color: '#999' }}>
              Les devis créés dans Page 4 apparaîtront automatiquement ici.
            </Typography.Paragraph>
          </div>
        ) : (
          <div>
            <Typography.Paragraph style={{ marginBottom: 16, color: '#666', fontWeight: 500 }}>
              ✅ Devis disponibles depuis Page 4
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 16, color: '#999', fontSize: 13 }}>
              Chaque devis représente une configuration GTB distincte. Cliquez sur un devis pour commencer la configuration.
            </Typography.Paragraph>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16
            }}>
              {availableDevis.map((devisName) => (
                <Card
                  key={devisName}
                  hoverable
                  onClick={() => {
                    setSelectedDevis(devisName);
                    message.info(`Devis sélectionné: ${devisName}`);
                  }}
                  style={{
                    border: selectedDevis === devisName ? '3px solid #1890ff' : '1px solid #d9d9d9',
                    boxShadow: selectedDevis === devisName ? '0 4px 12px rgba(24, 144, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease',
                    background: selectedDevis === devisName ? '#f0f7ff' : 'white'
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text strong style={{ fontSize: 16 }}>📄 {devisName}</Text>
                      {selectedDevis === devisName && (
                        <Tag color="success" icon={<EditOutlined />}>
                          Actif
                        </Tag>
                      )}
                    </Space>

                    {devisInstallations.length > 0 && (
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
                              {devisInstallations.reduce((sum, item) => sum + (item.to_install_count || 0), 0)} unités
                            </Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {devisInstallations.length} zone(s) configurée(s)
                          </Text>
                        </Space>
                      </div>
                    )}
                  </Space>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* GTB Configuration Summary - Show equipment by zone */}
      {selectedDevis && devisInstallations.length > 0 && (
        <Card
          title={
            <Space>
              <BarChartOutlined style={{ fontSize: 20, color: '#52c41a' }} />
              <span>Équipements à installer - {selectedDevis}</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Typography.Paragraph style={{ color: '#666', marginBottom: 16 }}>
            Résumé des équipements à installer selon le devis sélectionné de Page 4. Ces informations seront utilisées pour configurer les modules GTB.
          </Typography.Paragraph>

          <Table
            dataSource={devisInstallations.map((item, index) => ({
              key: index,
              equipment: item.equipment_type,
              zone: item.zone_name,
              existing: item.existing_count || 0,
              toInstall: item.to_install_count || 0,
              total: (item.existing_count || 0) + (item.to_install_count || 0)
            }))}
            columns={[
              {
                title: 'Type Équipement',
                dataIndex: 'equipment',
                key: 'equipment',
                render: (text) => {
                  const emoji = {
                    'Aero': '🌡️',
                    'Clim': '❄️',
                    'Rooftop': '🏢',
                    'Eclairage': '💡'
                  }[text] || '📦';
                  return <span>{emoji} <strong>{text}</strong></span>;
                },
              },
              {
                title: 'Zone',
                dataIndex: 'zone',
                key: 'zone',
                render: (text) => (
                  <Tag color="blue">
                    {text.replace(/_/g, ' ')}
                  </Tag>
                ),
              },
              {
                title: 'Existant',
                dataIndex: 'existing',
                key: 'existing',
                render: (val) => (
                  <Badge
                    count={val}
                    showZero
                    style={{ backgroundColor: '#d9d9d9' }}
                  />
                ),
              },
              {
                title: 'À installer',
                dataIndex: 'toInstall',
                key: 'toInstall',
                render: (val) => (
                  <Badge
                    count={val}
                    showZero
                    style={{ backgroundColor: val > 0 ? '#52c41a' : '#d9d9d9' }}
                  />
                ),
              },
              {
                title: 'Total final',
                dataIndex: 'total',
                key: 'total',
                render: (val) => (
                  <Badge
                    count={val}
                    showZero
                    style={{ backgroundColor: '#1890ff' }}
                  />
                ),
              },
            ]}
            pagination={false}
            size="small"
            style={{ marginTop: 16 }}
          />

          <Typography.Paragraph style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
            💡 Ces données proviennent du devis sélectionné dans Page 4. Configurez les modules GTB en fonction de ces équipements.
          </Typography.Paragraph>
        </Card>
      )}

      {/* GTB Configuration Form - Only show if devis is selected */}
      {!selectedDevis && availableDevis.length > 0 && (
        <Card style={{ marginBottom: 24, textAlign: 'center', padding: '40px 20px' }}>
          <Typography.Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>
            👆 Sélectionnez un devis ci-dessus
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#666', fontSize: 15 }}>
            Cliquez sur l'un des devis pour commencer à configurer les modules GTB.
          </Typography.Paragraph>
        </Card>
      )}

      {selectedDevis && (
        <Form
          form={form}
          layout="vertical"
          onValuesChange={onValuesChange}
          initialValues={{ gazCompteur: 'non', modules: [] }}
        >

        <div id="export-content">
          <div className="page-break">
            <FormCard
              title={
                <Space>
                  <span>Informations Générales</span>
                  <Tag color="processing" icon={<EditOutlined />}>
                    Configuration pour: {selectedDevis}
                  </Tag>
                </Space>
              }
            >
              <Form.Item label="Nombre de sondes Temperature à poser" name="sondes">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              {renderRefsList('sondes')}

              <Form.Item label="Nombre de sondes de présence à poser" name="sondesPresentes">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              {renderRefsList('sondesPresentes')}

              <Form.Item label="Compteur Gaz ajouté ?" name="gazCompteur">
                <Radio.Group>
                  <Radio value="oui">Oui</Radio>
                  <Radio value="non">Non</Radio>
                </Radio.Group>
              </Form.Item>

              

              <Form.Item
                label={
                  <Space>
                    <span>Notre Coffret installé</span>
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.Izit !== curr.Izit}>
                      {({ getFieldValue }) => {
                        const izit = getFieldValue('Izit') || [];
                        return izit.length > 0 ? (
                          <Tag color="blue">
                            {izit.length} coffret{izit.length > 1 ? 's' : ''}
                          </Tag>
                        ) : null;
                      }}
                    </Form.Item>
                  </Space>
                }
                name="Izit"
              >
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Sélectionner les coffrets installés"
                  maxTagCount="responsive"
                  tagRender={(props) => {
                    const { label, value } = props;
                    const refs = form.getFieldValue(['refs', 'Izit']) || [];
                    const izitOptions = form.getFieldValue('Izit') || [];
                    const index = izitOptions.indexOf(value);
                    const ref = index !== -1 ? refs[index] : '';
                    return (
                      <Tag
                        color="blue"
                        closable={props.closable}
                        onClose={props.onClose}
                        style={{ marginRight: 3, maxWidth: 400 }}
                      >
                        🔧 {label}
                        {ref && <span style={{ fontStyle: 'italic', fontSize: '0.9em' }}> - {ref}</span>}
                      </Tag>
                    );
                  }}
                >
                  {Object.keys(DEFAULT_REFS.Izit).map(opt => (
                    <Option key={opt} value={opt}>{opt}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label={
                  <Space>
                    <span>Modules installés</span>
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.modules !== curr.modules}>
                      {({ getFieldValue }) => {
                        const modules = getFieldValue('modules') || [];
                        const counts = {};
                        modules.forEach(mod => {
                          const count = getFieldValue(mod) || 0;
                          counts[mod] = count;
                        });
                        const totalModules = Object.values(counts).reduce((sum, count) => sum + count, 0);
                        return modules.length > 0 ? (
                          <Tag color="green">
                            {totalModules} module{totalModules > 1 ? 's' : ''} au total
                          </Tag>
                        ) : null;
                      }}
                    </Form.Item>
                  </Space>
                }
                name="modules"
              >
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Sélectionner les types de modules"
                  maxTagCount="responsive"
                  tagRender={(props) => {
                    const { label, value } = props;
                    const count = form.getFieldValue(value) || 0;
                    const refs = form.getFieldValue(['refs', value]) || [];
                    const refText = Array.isArray(refs) ? refs.filter(Boolean).join(', ') : '';

                    return (
                      <Tag
                        color={count > 0 ? "success" : "default"}
                        closable={props.closable}
                        onClose={props.onClose}
                        style={{ marginRight: 3, maxWidth: 300 }}
                        title={refText ? `Références: ${refText}` : label}
                      >
                        {label} {count > 0 ? `(×${count})` : ''}
                        {refText && <span style={{ fontStyle: 'italic', fontSize: '0.9em' }}> - {refText}</span>}
                      </Tag>
                    );
                  }}
                >
                  {Object.keys(MODULE_LABELS).map(mod => (
                    <Option key={mod} value={mod}>{MODULE_LABELS[mod]}</Option>
                  ))}
                </Select>
              </Form.Item>
            </FormCard>
          </div>

          {selectedModules.map(mod => (
            <div className="page-break" key={mod}>
              <ModuleCard module={mod} />
            </div>
          ))}

          <ActionButtons
            buttons={[
              {
                type: 'primary',
                onClick: handleSubmit,
                children: 'Enregistrer dans SQL'
              },
              {
                onClick: handleReloadFromSQL,
                children: '🔄 Recharger depuis SQL'
              },
              {
                danger: true,
                onClick: () => {
                  form.resetFields();
                  setSelectedModules([]);
                  console.log('🔄 Form reset to empty state');
                },
                children: '🗑️ Réinitialiser le formulaire'
              }
            ]}
          />
        </div>
        </Form>
      )}
    </PageLayout>
  );
}
