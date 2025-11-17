// ComptageLightingSection.jsx - Special comptage UI for lighting with contacteur/disjoncteur selection
import { Form, Input, InputNumber, Select, Divider, Typography, Checkbox } from 'antd';
import { useState, useEffect } from 'react';

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

/**
 * Parse contacteur structure from equipment_lighting
 * Format: "contactorType:nbDisjoncteurs:disjType ref | disjType ref || nextContactor"
 * Example: "tetra:2:mono ref1|tetra ref2 || mono:1:mono ref3"
 */
const parseContacteurStructure = (refString) => {
  if (!refString || typeof refString !== 'string') return [];

  const contacteurs = refString.split(' || ').map(str => str.trim()).filter(Boolean);

  return contacteurs.map((contacteurStr, idx) => {
    const parts = contacteurStr.split(':');
    const type = parts[0] || 'tetra';
    const nbDisj = parseInt(parts[1], 10) || 0;
    const disjoncteursStr = parts.slice(2).join(':');
    const disjoncteurs = disjoncteursStr ? disjoncteursStr.split('|').map(d => d.trim()) : [];

    return {
      id: `contacteur_${idx + 1}`,
      label: `Contacteur ${idx + 1}`,
      type,
      nbDisjoncteurs: nbDisj,
      disjoncteurs: disjoncteurs.map((disjStr, disjIdx) => {
        const [disjType, ...refParts] = disjStr.split(' ');
        return {
          id: `contacteur_${idx + 1}_disjoncteur_${disjIdx + 1}`,
          label: `Contacteur ${idx + 1} - Disjoncteur ${disjIdx + 1}`,
          type: disjType || 'mono',
          ref: refParts.join(' ') || ''
        };
      })
    };
  });
};

export const ComptageLightingSection = ({ categoryData, handleCategoryDataChange, lightingData }) => {
  const [availableItems, setAvailableItems] = useState([]);

  useEffect(() => {
    console.log('💡 [ComptageLightingSection] lightingData received:', lightingData);
    console.log('💡 [ComptageLightingSection] All keys:', Object.keys(lightingData || {}).filter(k => k.includes('contacteur') || k.includes('disjoncteur')));

    // Find all interior and exterior contacteur fields (they might be zone-suffixed)
    const interiorFields = Object.keys(lightingData || {}).filter(k => k.startsWith('ref_disjoncteur_contacteur') && !k.includes('_ext'));
    const exteriorFields = Object.keys(lightingData || {}).filter(k => k.startsWith('ref_disjoncteur_contacteur_ext'));

    console.log('💡 [ComptageLightingSection] Interior fields found:', interiorFields);
    console.log('💡 [ComptageLightingSection] Exterior fields found:', exteriorFields);

    // Combine all interior contacteur data
    let allInteriorContacteurs = [];
    interiorFields.forEach(field => {
      const parsed = parseContacteurStructure(lightingData[field]);
      if (parsed.length > 0) {
        // Extract zone from field name (e.g., ref_disjoncteur_contacteur_surface_de_vente → surface_de_vente)
        const zoneSuffix = field.replace('ref_disjoncteur_contacteur', '').replace(/^_/, '');
        allInteriorContacteurs.push(...parsed.map(c => ({ ...c, zone: zoneSuffix || null })));
      }
    });

    // Combine all exterior contacteur data
    let allExteriorContacteurs = [];
    exteriorFields.forEach(field => {
      const parsed = parseContacteurStructure(lightingData[field]);
      if (parsed.length > 0) {
        const zoneSuffix = field.replace('ref_disjoncteur_contacteur_ext', '').replace(/^_/, '');
        allExteriorContacteurs.push(...parsed.map(c => ({ ...c, zone: zoneSuffix || null })));
      }
    });

    console.log('💡 [ComptageLightingSection] Parsed interior contacteurs:', allInteriorContacteurs);
    console.log('💡 [ComptageLightingSection] Parsed exterior contacteurs:', allExteriorContacteurs);

    const items = [];

    // Interior section
    if (allInteriorContacteurs.length > 0) {
      items.push({
        type: 'group',
        label: '🔆 Éclairage Intérieur'
      });

      allInteriorContacteurs.forEach((contacteur, cIdx) => {
        const contacteurId = `interior_${contacteur.zone ? contacteur.zone + '_' : ''}contacteur_${cIdx + 1}`;
        const zoneLabel = contacteur.zone ? ` [${contacteur.zone}]` : '';

        // Add contacteur itself
        items.push({
          type: 'contacteur',
          id: contacteurId,
          label: `Contacteur ${cIdx + 1} (${contacteur.type})${zoneLabel}`,
          group: 'interior'
        });

        // Add its disjoncteurs
        contacteur.disjoncteurs.forEach((disj, dIdx) => {
          items.push({
            type: 'disjoncteur',
            id: `${contacteurId}_disjoncteur_${dIdx + 1}`,
            label: `  ↳ Disjoncteur ${dIdx + 1} (${disj.type}) - ${disj.ref || 'Sans réf'}`,
            group: 'interior',
            parentContacteur: contacteurId
          });
        });
      });
    }

    // Exterior section
    if (allExteriorContacteurs.length > 0) {
      items.push({
        type: 'group',
        label: '🌙 Éclairage Extérieur'
      });

      allExteriorContacteurs.forEach((contacteur, cIdx) => {
        const contacteurId = `exterior_${contacteur.zone ? contacteur.zone + '_' : ''}contacteur_${cIdx + 1}`;
        const zoneLabel = contacteur.zone ? ` [${contacteur.zone}]` : '';

        // Add contacteur itself
        items.push({
          type: 'contacteur',
          id: contacteurId,
          label: `Contacteur ${cIdx + 1} (${contacteur.type})${zoneLabel}`,
          group: 'exterior'
        });

        // Add its disjoncteurs
        contacteur.disjoncteurs.forEach((disj, dIdx) => {
          items.push({
            type: 'disjoncteur',
            id: `${contacteurId}_disjoncteur_${dIdx + 1}`,
            label: `  ↳ Disjoncteur ${dIdx + 1} (${disj.type}) - ${disj.ref || 'Sans réf'}`,
            group: 'exterior',
            parentContacteur: contacteurId
          });
        });
      });
    }

    console.log('💡 [ComptageLightingSection] Final items array:', items);
    console.log('💡 [ComptageLightingSection] Items count:', items.length);

    setAvailableItems(items);
  }, [lightingData]);

  const localisationKey = 'localisation_comptage_eclairage';
  const etatVetusteKey = 'etat_vetuste_comptage_eclairage';
  const nbKey = 'nb_comptage_eclairage';
  const commentaireKey = 'commentaire_comptage_eclairage';

  return (
    <>
      <Divider orientation="left" style={{ margin: '32px 0 24px 0', fontSize: '16px', fontWeight: 600 }}>
        📊 Comptage Éclairage
      </Divider>

      {localisationEtatRow(categoryData, handleCategoryDataChange, localisationKey, etatVetusteKey)}

      <Form.Item label="Nombre de comptages Éclairage">
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
          <Form.Item label="Détails des comptages Éclairage">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Sélectionnez le disjoncteur ou contacteur à compter, puis renseignez les détails.
            </Text>
          </Form.Item>

          {safeArray(categoryData[nbKey]).map((_, i) => {
            const selectionKey = `selection_comptage_eclairage_${i}`;
            const typeKey = `type_comptage_eclairage_${i}`;
            const connexionKey = `connexion_comptage_eclairage_${i}`;
            const puissanceKey = `puissance_comptage_eclairage_${i}`;

            return (
              <div key={`comptage_eclairage_${i}`} style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Comptage {i + 1}
                </Text>

                <Form.Item label="Sélection de disjoncteur ou contacteur">
                  <Select
                    value={categoryData[selectionKey] || null}
                    onChange={(val) => handleCategoryDataChange(selectionKey, val)}
                    placeholder="Sélectionner un contacteur ou disjoncteur"
                    style={{ width: '100%' }}
                  >
                    {availableItems.map((item, idx) => {
                      if (item.type === 'group') {
                        return (
                          <Option key={`group_${idx}`} disabled style={{ fontWeight: 'bold', color: '#1890ff' }}>
                            {item.label}
                          </Option>
                        );
                      }
                      return (
                        <Option key={item.id} value={item.id}>
                          {item.label}
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>

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

export default ComptageLightingSection;
