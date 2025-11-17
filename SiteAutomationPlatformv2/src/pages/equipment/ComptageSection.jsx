// ComptageSection.jsx - Reusable comptage UI that embeds in equipment cards
import { Form, Input, InputNumber, Select, Divider, Typography } from 'antd';

const { Text } = Typography;
const { Option } = Select;

const safeArray = (val) => {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? [...Array(n)] : [];
};

// Helper function for Localisation and État de vétusté
const localisationEtatRow = (categoryData, handleCategoryDataChange, localisationKey, etatVetusteKey) => (
  <>
    <Form.Item label="Localisation (Comptage)">
      <Input
        value={categoryData[localisationKey] || ''}
        onChange={(e) => handleCategoryDataChange(localisationKey, e.target.value)}
        placeholder="Entrer la localisation du comptage"
      />
    </Form.Item>

    <Form.Item label="État de vétusté (Comptage)">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px',
        width: '100%',
        maxWidth: '500px'
      }}>
        {[
          { value: 'green', label: 'Bon état', color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
          { value: 'yellow', label: 'État moyen', color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffe58f' },
          { value: 'red', label: 'Mauvais état', color: '#ff4d4f', bgColor: '#fff2f0', borderColor: '#ffccc7' }
        ].map(opt => (
          <div
            key={opt.value}
            onClick={() => handleCategoryDataChange(etatVetusteKey, opt.value)}
            style={{
              padding: '6px 10px',
              backgroundColor: categoryData[etatVetusteKey] === opt.value ? opt.bgColor : '#fafafa',
              border: `1.5px solid ${categoryData[etatVetusteKey] === opt.value ? opt.borderColor : '#d9d9d9'}`,
              borderRadius: '4px',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: categoryData[etatVetusteKey] === opt.value ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transform: categoryData[etatVetusteKey] === opt.value ? 'scale(1.02)' : 'scale(1)',
              fontWeight: categoryData[etatVetusteKey] === opt.value ? 600 : 500,
              color: categoryData[etatVetusteKey] === opt.value ? '#262626' : '#8c8c8c',
              fontSize: '12px',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              if (categoryData[etatVetusteKey] !== opt.value) {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.borderColor = '#bfbfbf';
              }
            }}
            onMouseLeave={(e) => {
              if (categoryData[etatVetusteKey] !== opt.value) {
                e.currentTarget.style.backgroundColor = '#fafafa';
                e.currentTarget.style.borderColor = '#d9d9d9';
              }
            }}
          >
            <div style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: opt.color,
              marginRight: '5px',
              verticalAlign: 'middle'
            }} />
            {opt.label}
          </div>
        ))}
      </div>
    </Form.Item>

    <Divider style={{ margin: '16px 0' }} />
  </>
);

export const ComptageSection = ({ equipmentType, categoryData, handleCategoryDataChange }) => {
  // Field key suffixes based on equipment type
  const suffix = equipmentType.toLowerCase(); // 'aero', 'clim', 'rooftop', 'eclairage'

  const localisationKey = `localisation_comptage_${suffix}`;
  const etatVetusteKey = `etat_vetuste_comptage_${suffix}`;
  const nbKey = `nb_comptage_${suffix}`;
  const commentaireKey = `commentaire_comptage_${suffix}`;

  const getEquipmentLabel = () => {
    const labels = {
      aero: 'Aérotherme',
      clim: 'Climatisation',
      rooftop: 'Rooftop',
      eclairage: 'Éclairage'
    };
    return labels[suffix] || equipmentType;
  };

  return (
    <>
      <Divider orientation="left" style={{ margin: '32px 0 24px 0', fontSize: '16px', fontWeight: 600 }}>
        📊 Comptage {getEquipmentLabel()}
      </Divider>

      {localisationEtatRow(categoryData, handleCategoryDataChange, localisationKey, etatVetusteKey)}

      <Form.Item label={`Nombre de comptages ${getEquipmentLabel()}`}>
        <InputNumber
          min={0}
          max={999}
          style={{ width: '100%' }}
          value={categoryData[nbKey] !== undefined && categoryData[nbKey] !== null ?
            parseInt(categoryData[nbKey], 10) || 0 : 0}
          onChange={(value) => handleCategoryDataChange(nbKey, value ?? 0)}
        />
      </Form.Item>

      {categoryData[nbKey] > 0 && (
        <>
          <Form.Item label={`Détails des comptages ${getEquipmentLabel()}`}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Renseignez le type, la connexion et la puissance pour chaque comptage individuellement.
            </Text>
          </Form.Item>

          {safeArray(categoryData[nbKey]).map((_, i) => {
            const typeKey = `type_comptage_${suffix}_${i}`;
            const connexionKey = `connexion_comptage_${suffix}_${i}`;
            const puissanceKey = `puissance_comptage_${suffix}_${i}`;

            return (
              <div key={`comptage_${suffix}_${i}`} style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Comptage {i + 1}
                </Text>

                <Form.Item label="Type de comptage">
                  <Select
                    value={categoryData[typeKey] || null}
                    onChange={(val) => handleCategoryDataChange(typeKey, val)}
                    placeholder="Sélectionner le type"
                  >
                    <Option value="compteur_electrique_3">Compteur électrique tetra</Option>
                    <Option value="compteur_electrique_2">Compteur électrique mono</Option>
                    <Option value="pince_amperemetrique">Compteur gaz</Option>
                    <Option value="autre">Autre</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Type de connexion">
                  <Select
                    value={categoryData[connexionKey] || null}
                    onChange={(val) => handleCategoryDataChange(connexionKey, val)}
                    placeholder="Sélectionner la connexion"
                  >
                    <Option value="modbus">Modbus</Option>
                    <Option value="filaire">Filaire</Option>
                    <Option value="impulsion">Impulsion</Option>
                    <Option value="autre">Autre</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Puissance totale (W)">
                  <InputNumber
                    min={0}
                    max={999999}
                    style={{ width: '100%' }}
                    value={categoryData[puissanceKey] !== undefined && categoryData[puissanceKey] !== null ?
                      parseInt(categoryData[puissanceKey], 10) || 0 : 0}
                    onChange={(value) => handleCategoryDataChange(puissanceKey, value ?? 0)}
                    placeholder="Entrer la puissance"
                  />
                </Form.Item>

                {i < categoryData[nbKey] - 1 && <Divider style={{ margin: '16px 0' }} />}
              </div>
            );
          })}

          <Form.Item label="Commentaire">
            <Input.TextArea
              rows={3}
              value={categoryData[commentaireKey] || ''}
              onChange={(e) => handleCategoryDataChange(commentaireKey, e.target.value)}
              placeholder="Commentaire général pour les comptages"
            />
          </Form.Item>
        </>
      )}
    </>
  );
};

export default ComptageSection;
