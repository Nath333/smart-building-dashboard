import { Form, Input, Button, Card, message, Select, Radio, Divider } from 'antd';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchSites, fetchSiteData, submitForm } from '../api/formDataApi';
import { useSiteContext } from '../hooks/useSiteContext';
import PageLayout from '../components/layout/PageLayout';
import FormCard from '../components/common/FormCard';
import ActionButtons from '../components/common/ActionButtons';
import { LAYOUT_CONSTANTS } from '../components/layout/layoutConstants';

export default function SiteInfoPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [siteList, setSiteList] = useState([]);
  const [isNewSite, setIsNewSite] = useState(true);
  const { refresh: refreshSiteContext } = useSiteContext();
  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem('simpleFormData');
    if (saved) {
      console.log('📦 Chargement des données depuis localStorage:', JSON.parse(saved));
      const parsedData = JSON.parse(saved);
      form.setFieldsValue(parsedData);
      // Update isNewSite based on whether site exists in list
      if (parsedData.site && siteList.includes(parsedData.site)) {
        setIsNewSite(false);
      }
    } else {
      console.log('📭 Aucun formulaire trouvé dans localStorage');
    }
    fetchSiteList();
  }, [location.pathname]);
  const fetchSiteList = async () => {
  try {
    const sites = await fetchSites();
    setSiteList(sites.map((s) => s.site));
  } catch (err) {
    console.error('❌ Erreur fetchSiteList:', err);
    message.error('Erreur chargement des sites');
  }
};
  const onFinish = async (values) => {
    const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
    setLoading(true);
    try {
      await submitForm(trimmed);
      message.success('Formulaire soumis ✅');
      localStorage.setItem('simpleFormData', JSON.stringify(trimmed));
      refreshSiteContext(); // Notify other components of site change
      if (!siteList.includes(trimmed.site)) setSiteList(prev => [...prev, trimmed.site]);
    } catch (err) {
      message.error(err.message || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };
  const handleReset = () => {
    form.resetFields();
    localStorage.removeItem('simpleFormData');
    message.info('Formulaire réinitialisé');
  };

  const handleSiteSelect = async (value) => {
    try {
      const data = await fetchSiteData(value);
      form.setFieldsValue(data);
      localStorage.setItem('simpleFormData', JSON.stringify(data));
      refreshSiteContext(); // Notify other components of site change
      message.success(`✅ Données chargées pour "${value}"`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      message.error('Erreur serveur');
    }
  };

  return (
    <PageLayout title="Informations du site" showSiteName={false} maxWidth={1000}>
      <FormCard
        title="Informations générales"
        bordered
        style={{
          backgroundColor: LAYOUT_CONSTANTS.COLORS.BACKGROUND,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          borderRadius: 8
        }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>

          {/* 🎯 Site Selection Section - Visually Distinguished */}
          <Card
            size="small"
            style={{
              backgroundColor: '#f0f5ff',
              border: '2px solid #1890ff',
              marginBottom: 24
            }}
          >
            <Form.Item
              label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Est-ce un nouveau site ?</span>}
              style={{ marginBottom: 16 }}
            >
              <Radio.Group
                value={isNewSite}
                onChange={(e) => {
                  setIsNewSite(e.target.value);
                  form.resetFields(['site', 'client', 'address', 'number1', 'number2', 'email']);
                }}
                size="large"
              >
                <Radio value={true}>Oui</Radio>
                <Radio value={false}>Non</Radio>
              </Radio.Group>
            </Form.Item>

            {/* 🔽 Dropdown if site is NOT new */}
            {!isNewSite && (
              <Form.Item
                label="Sélectionner un site existant"
                style={{ marginBottom: 0 }}
              >
                <Select
                  showSearch
                  size="large"
                  placeholder="Rechercher un site existant"
                  onSelect={handleSiteSelect}
                  filterOption={(input, option) =>
                    option.value.toLowerCase().includes(input.toLowerCase())
                  }
                  options={siteList.map((site) => ({ label: site, value: site }))}
                />
              </Form.Item>
            )}
          </Card>

          <Divider orientation="left" style={{ fontSize: '16px', fontWeight: 500 }}>
            Informations du Site
          </Divider>

          {/* ✏️ Always shown: site name input */}
          <Form.Item
            label="Nom du site"
            name="site"
            rules={[{ required: true, message: 'Veuillez entrer le nom du site' }]}
          >
            <Input placeholder="Nom du site" disabled={!isNewSite ? true : false} />
          </Form.Item>

          <Form.Item label="Nom du client" name="client">
            <Input placeholder="Nom du client" />
          </Form.Item>

          <Form.Item label="Adresse" name="address">
            <Input placeholder="Adresse complète" />
          </Form.Item>

          <Form.Item
            label="Téléphone 1"
            name="number1"
            rules={[{ pattern: /^[\d.\s]{10,25}$/, message: 'Numéro invalide (ex: 0479371290 ou 04.79.37.12.90 ou 04 50 56 00 32)' }]}
          >
            <Input type="tel" placeholder="Téléphone principal (ex: 0479371290, 04.79.37.12.90, 04 50 56 00 32)" />
          </Form.Item>

          <Form.Item
            label="Téléphone 2 (optionnel)"
            name="number2"
            rules={[{ pattern: /^[\d.\s]{10,25}$/, message: 'Numéro invalide (ex: 0479371290 ou 04.79.37.12.90 ou 04 50 56 00 32)' }]}
          >
            <Input type="tel" placeholder="Téléphone secondaire (ex: 0479371290, 04.79.37.12.90, 04 50 56 00 32)" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: 'email', message: 'Adresse email invalide' }]}
          >
            <Input placeholder="Adresse email" />
          </Form.Item>

        </Form>
        
        <ActionButtons
          buttons={[
            {
              type: 'primary',
              onClick: () => form.submit(),
              loading: loading,
              children: '💾 Enregistrer les données'
            },
            {
              danger: true,
              onClick: handleReset,
              children: '🗑️ Réinitialiser cette page'
            }
          ]}
        />
      </FormCard>
    </PageLayout>
  );
}
