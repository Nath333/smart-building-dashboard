
import { Input, InputNumber, Checkbox, Typography, Form, Select, Divider } from 'antd';
import ComptageSection from './ComptageSection';
import ComptageLightingSection from './ComptageLightingSection';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;


const safeArray = (val) => {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? [...Array(n)] : [];
};

const renderMarqueInputs = (count, prefix, data, onChange) => {
  // Helper to parse combined "Marque | Référence" from database
  const parseCombinedValue = (combined) => {
    if (!combined) return { marque: '', reference: '' };
    const parts = combined.split('|').map(s => s.trim());
    return {
      marque: parts[0] || '',
      reference: parts[1] || ''
    };
  };

  // Auto-sync: when either marque or reference changes, update the combined field
  const handleMarqueChange = (i, value) => {
    onChange(`${prefix}_marque_${i}`, value);
    // Update the database key with combined value
    const reference = data[`${prefix}_reference_${i}`] || '';
    const combined = value || reference ? `${value} | ${reference}` : '';
    onChange(`${prefix}_${i}`, combined);
  };

  const handleReferenceChange = (i, value) => {
    onChange(`${prefix}_reference_${i}`, value);
    // Update the database key with combined value
    const marque = data[`${prefix}_marque_${i}`] || '';
    const combined = marque || value ? `${marque} | ${value}` : '';
    onChange(`${prefix}_${i}`, combined);
  };

  return safeArray(count).map((_, i) => {
    // On first render, split the combined value if it exists
    const combinedKey = `${prefix}_${i}`;
    const marqueKey = `${prefix}_marque_${i}`;
    const referenceKey = `${prefix}_reference_${i}`;

    // If we have a combined value but no split values, split it
    if (data[combinedKey] && !data[marqueKey] && !data[referenceKey]) {
      const parsed = parseCombinedValue(data[combinedKey]);
      setTimeout(() => {
        onChange(marqueKey, parsed.marque);
        onChange(referenceKey, parsed.reference);
      }, 0);
    }

    return (
      <div key={`${prefix}_${i}`} style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '4px', fontSize: '14px', color: '#262626' }}>
          {prefix} {i + 1}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Form.Item
            label="Marque"
            style={{ flex: 1, marginBottom: 0 }}
          >
            <Input
              value={data[marqueKey] || ''}
              onChange={(e) => handleMarqueChange(i, e.target.value)}
              placeholder="ex: Daikin"
            />
          </Form.Item>
          <Form.Item
            label="Référence"
            style={{ flex: 1, marginBottom: 0 }}
          >
            <Input
              value={data[referenceKey] || ''}
              onChange={(e) => handleReferenceChange(i, e.target.value)}
              placeholder="ex: RXS35L3V1B"
            />
          </Form.Item>
        </div>
      </div>
    );
  });
};


export const getCategoryInputs = ({
  category,
  categoryData,
  handleCategoryDataChange,
  allEquipmentData = {},
}) => {
  const textInput = (label, key) => (
    <Form.Item label={label}>
      <Input
        value={categoryData[key] || ''}
        onChange={(e) => handleCategoryDataChange(key, e.target.value)}
      />
    </Form.Item>
  );

  // Helper function for Localisation and État de vétusté (each in own row)
  const localisationEtatRow = (localisationKey, etatVetusteKey) => (
    <>
      <Form.Item label="Localisation">
        <Input
          value={categoryData[localisationKey] || ''}
          onChange={(e) => handleCategoryDataChange(localisationKey, e.target.value)}
          placeholder="Entrer la localisation"
        />
      </Form.Item>

      <Form.Item label="État de vétusté">
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

  const numberInput = (label, key) => (
    <Form.Item label={label}>
      <InputNumber
        min={0}
        max={999}
        style={{ width: '100%' }}
        value={categoryData[key] !== undefined && categoryData[key] !== null ? 
          parseInt(categoryData[key], 10) || 0 : 0}
        onChange={(value) => handleCategoryDataChange(key, value ?? 0)}
      />
    </Form.Item>
  );

  const selectInput = (label, key, options, multiple = false) => (
    <Form.Item label={label}>
      <Select
        mode={multiple ? 'multiple' : undefined}
        value={categoryData[key] || (multiple ? [] : null)}
        onChange={(val) => handleCategoryDataChange(key, val)}
      >
        {options.map((opt) => (
          <Option key={opt.value} value={opt.value}>
            {opt.label}
          </Option>
        ))}
      </Select>
    </Form.Item>
  );

  switch (category) {
    case 'Aero':
      return (
        <>
          {localisationEtatRow('localisation_aerotherme', 'etat_vetuste_aerotherme')}

          {numberInput("Nombre d'aérothermes", 'nb_aerotherme')}

          {categoryData['nb_aerotherme'] > 0 && (
            <>
              <Form.Item label="Marque et référence des aérothermes">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Renseignez les marques et références pour chaque aérotherme individuellement.
                </Text>
              </Form.Item>

              {renderMarqueInputs(categoryData['nb_aerotherme'], 'marque_aerotherme', categoryData, handleCategoryDataChange)}
            </>
          )}

          {numberInput('Nombre thermostat / telecommande', 'thermostat_aerotherme')}

          {selectInput("Y a-t-il un coffret déporté ?", 'coffret_aerotherme', [
            { value: 'oui_contact_sec_horloge', label: 'Oui en contact sec avec horloge' },
            { value: 'contact_sec', label: 'Contact sec' },
            { value: 'communiquant_modbus', label: 'Communiquant modbus' },
            { value: 'non', label: 'Non' },
          ])}

          {selectInput('Type de fonctionnement', 'type_aerotherme', [
            { value: 'gaz_filpilote', label: 'Gaz - Fil pilote' },
            { value: 'gaz_contactsec', label: 'Gaz - Contact sec' },
            { value: 'gaz_contactsec_mod', label: 'Gaz - Contact sec + Modbus' },
            { value: 'eau', label: 'Eau' },
            { value: 'electrique', label: 'Électrique' },
            { value: 'melange', label: 'Mélange' },
          ], true)}

          <Divider style={{ margin: '24px 0' }} />

          {selectInput('Est-ce que tous fonctionnent ?', 'Fonctionement_aerotherme', [
            { value: 'oui', label: 'Oui' },
            { value: 'une_partie', label: 'Une partie' },
            { value: 'pas_teste', label: 'Pas testé' },
            { value: 'non', label: 'Non' },
          ])}
          {textInput('Maintenance', 'Maintenance_aerotherme')}
          {textInput('Commentaire', 'commentaire_aero')}
        </>
      );

    case 'Rooftop':
      return (
        <>
          {localisationEtatRow('localisation_rooftop', 'etat_vetuste_rooftop')}

          {numberInput('Nombre de rooftop', 'nb_rooftop')}
          {numberInput('Nombre thermostat', 'thermostat_rooftop')}

          {selectInput("Télécommande reliée Modbus ?", 'telecomande_modbus_rooftop', [
            { value: 'oui', label: 'Oui' },
            { value: 'non', label: 'Non' },
            { value: 'jesaispas', label: 'Je ne sais pas' },
          ])}

          {selectInput('Coffret déporté ?', 'coffret_rooftop', [
            { value: 'oui', label: 'Oui' },
            { value: 'non', label: 'Non' },
          ])}

          {selectInput('Type de fonctionnement', 'type_rooftop', [
            { value: 'Inverter', label: 'Inverter' },
            { value: 'gaz_inverter', label: 'Gaz / Elec / Inverter' },
            { value: 'jesaispas', label: 'Je ne sais pas' },
          ], true)}

          <Form.Item label="Marque et référence des rooftops">
            <Text type="secondary">
              Renseignez les marques et références pour chaque rooftop individuellement.
            </Text>
          </Form.Item>

          {renderMarqueInputs(categoryData['nb_rooftop'], 'marque_rooftop', categoryData, handleCategoryDataChange)}

          <Divider style={{ margin: '24px 0' }} />

          {selectInput('Est-ce que tous fonctionnent ?', 'Fonctionement_rooftop', [
            { value: 'oui', label: 'Oui' },
            { value: 'une_partie', label: 'Une partie' },
            { value: 'pas_teste', label: 'Pas testé' },
            { value: 'non', label: 'Non' },
          ])}
          {textInput('Maintenance', 'Maintenance_rooftop')}
          {textInput('Commentaire', 'commentaire_rooftop')}
        </>
      );

    case 'Clim':
      return (
        <>
          {localisationEtatRow('localisation_clim', 'etat_vetuste_clim')}

          {numberInput('Nombre de clims (IR)', 'nb_clim_ir')}
          {selectInput("Nombre d'unités extérieures pour les clims IR", 'nb_unite_ext_clim_ir', [
            { value: '0', label: '0' },
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' },
            { value: '6', label: '6' },
            { value: 'jesaispas', label: 'Je ne sais pas' },
          ])}
          {numberInput('Nombre de clims (filaires)', 'nb_clim_wire')}
          {selectInput("Nombre d'unités extérieures pour les clims filaires", 'nb_unite_ext_clim_wire', [
            { value: '0', label: '0' },
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' },
            { value: '6', label: '6' },
            { value: 'jesaispas', label: 'Je ne sais pas' },
          ])}
          {numberInput('Nombre de télécommandes simples', 'nb_telecommande_clim_wire')}

          {selectInput(
            'Télécommande déportée intelligente',
            'coffret_clim',
            [
              { value: 'ip', label: 'Oui – en IP' },
              { value: 'modbus', label: 'Oui – en Modbus' },
              { value: 'non_communicante', label: 'Oui – non communicante' },
              { value: 'non', label: 'Non' },
            ]
          )}

          {numberInput('Nombre de télécommandes multi-groupe', 'nb_telecommande_clim_smartwire')}

          {selectInput('Type de fonctionnement', 'type_clim', [
            { value: 'inverter', label: 'Inverter' },
            { value: 'non_reversible', label: 'Non réversible' },
            { value: 'jesaispas', label: 'Je ne sais pas' },
          ], true)}

          {selectInput('Dans quel tableau se trouve le comptage clim ?', 'tableau_comptage_clim', [
            { value: 'TGBT', label: 'TGBT' },
            { value: 'TD1', label: 'TD1' },
            { value: 'TD2', label: 'TD2' },
            { value: 'TD3', label: 'TD3' },
            { value: 'local_froid', label: 'Local froid' },
          ])}

          <Form.Item label="Marque et référence des clims">
            <Text type="secondary">
              Renseignez les marques et références pour chaque unité IR et filaire séparément.
            </Text>
          </Form.Item>

          {renderMarqueInputs(categoryData['nb_clim_ir'], 'clim_ir_ref', categoryData, handleCategoryDataChange)}
          {renderMarqueInputs(categoryData['nb_clim_wire'], 'clim_wire_ref', categoryData, handleCategoryDataChange)}

          <Divider style={{ margin: '24px 0' }} />

          {selectInput('Est-ce que tous fonctionnent ?', 'Fonctionement_clim', [
            { value: 'oui', label: 'Oui' },
            { value: 'une_partie', label: 'Une partie' },
            { value: 'pas_teste', label: 'Pas testé' },
            { value: 'non', label: 'Non' },
          ])}
          {textInput('Maintenance', 'Maintenance_clim')}
          {textInput('Commentaire', 'commentaire_clim')}
        </>
      );

    case 'Eclairage':
      return (
        <>
          {localisationEtatRow('localisation_eclairage', 'etat_vetuste_eclairage')}

          <Title level={5} style={{ marginTop: '16px', marginBottom: '16px' }}>
            Panneau d'éclairage
          </Title>

          {selectInput("Y a-t-il un panneau d'éclairage ?", 'panneau_eclairage', [
            { value: 'oui_sdv', label: 'Oui SDV' },
            { value: 'oui_sdv_avec_exterieur', label: 'Oui SDV avec Extérieur' },
            { value: 'non', label: 'Non' },
          ])}

          {/* Show interior light points only if panneau is yes */}
          {(categoryData['panneau_eclairage'] === 'oui_sdv' ||
            categoryData['panneau_eclairage'] === 'oui_sdv_avec_exterieur') && (
            <>
              {numberInput('Nombre de points lumineux intérieurs', 'nb_points_lumineux_interieur')}

              {categoryData['nb_points_lumineux_interieur'] > 0 && (
                <>
                  <Form.Item label="Références des points lumineux">
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Renseignez les références pour chaque point lumineux individuellement.
                    </Text>
                  </Form.Item>

                  {safeArray(categoryData['nb_points_lumineux_interieur']).map((_, i) => {
                    // Parse pipe-separated refs from ref_ecl_panneau
                    const allRefs = (categoryData['ref_ecl_panneau'] || '').split('|').map(r => r.trim());
                    const currentRef = allRefs[i] || '';

                    return (
                      <Form.Item key={`ref_ecl_${i}`} label={`Réf ${i + 1}`}>
                        <Input
                          value={currentRef}
                          onChange={(e) => {
                            const newRefs = [...allRefs];
                            newRefs[i] = e.target.value;
                            // Update the pipe-separated string
                            const newValue = newRefs.filter((_, idx) => idx < categoryData['nb_points_lumineux_interieur']).join(' | ');
                            handleCategoryDataChange('ref_ecl_panneau', newValue);
                          }}
                          placeholder="ex: REF123"
                        />
                      </Form.Item>
                    );
                  })}
                </>
              )}
            </>
          )}

          <Divider style={{ margin: '24px 0' }} />

          <Title level={5} style={{ marginTop: '16px', marginBottom: '16px' }}>
            Éclairage intérieur
          </Title>

          {numberInput('Nombre de contacteurs', 'nb_contacteurs')}

          {categoryData['nb_contacteurs'] > 0 && (
            <>
              {safeArray(categoryData['nb_contacteurs']).map((_, contacteurIdx) => {
                // Parse the complex ref_disjoncteur_contacteur structure
                // Format: "tetra:3:mono ref1|tetra ref2|tetra ref3 || mono:2:mono ref4|mono ref5"
                const allContacteurData = (categoryData['ref_disjoncteur_contacteur'] || '').split(' || ');
                const currentContacteurData = allContacteurData[contacteurIdx] || '';

                // Split by first colon to get type and rest
                const parts = currentContacteurData.split(':');
                const contacteurType = parts[0] || 'tetra';
                const nbDisjoncteurs = parseInt(parts[1], 10) || 0;
                const disjoncteursStr = parts.slice(2).join(':'); // Re-join in case there are colons in refs
                const disjoncteursArr = disjoncteursStr ? disjoncteursStr.split('|').map(d => d.trim()) : [];

                const updateContacteurData = (newType, newNbDisj, newDisjArr) => {
                  const updated = [...allContacteurData];
                  const disjStr = newDisjArr.filter((_, idx) => idx < newNbDisj).join(' | ');
                  updated[contacteurIdx] = `${newType}:${newNbDisj}:${disjStr}`;
                  const finalValue = updated.filter((_, idx) => idx < categoryData['nb_contacteurs']).join(' || ');
                  handleCategoryDataChange('ref_disjoncteur_contacteur', finalValue);
                };

                return (
                  <div key={`contacteur_${contacteurIdx}`} style={{
                    marginBottom: '24px',
                    padding: '16px',
                    border: '1px solid #e8e8e8',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa'
                  }}>
                    <Form.Item label={`Contacteur ${contacteurIdx + 1} - Type`}>
                      <Select
                        value={contacteurType}
                        onChange={(val) => updateContacteurData(val, nbDisjoncteurs, disjoncteursArr)}
                      >
                        <Option value="tetra">Contacteurs tétra</Option>
                        <Option value="mono">Contacteurs mono</Option>
                        <Option value="biphase">Contacteurs biphasés</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Nombre de disjoncteurs">
                      <InputNumber
                        min={0}
                        max={20}
                        style={{ width: '100%' }}
                        value={nbDisjoncteurs}
                        onChange={(val) => updateContacteurData(contacteurType, val || 0, disjoncteursArr)}
                      />
                    </Form.Item>

                    {nbDisjoncteurs > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <Text strong>Disjoncteurs:</Text>
                        {safeArray(nbDisjoncteurs).map((_, disjIdx) => {
                          const currentDisj = disjoncteursArr[disjIdx] || '';
                          // Format: "mono ref1" or "tetra ref2"
                          const disjParts = currentDisj.split(' ');
                          const disjType = disjParts[0] || 'mono';
                          const disjName = disjParts.slice(1).join(' ') || '';

                          return (
                            <div key={`disj_${disjIdx}`} style={{
                              marginTop: '8px',
                              padding: '12px',
                              backgroundColor: '#ffffff',
                              borderRadius: '4px',
                              border: '1px solid #e0e0e0'
                            }}>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                                <Form.Item label={`Disjoncteur ${disjIdx + 1} - Type`} style={{ flex: 1, marginBottom: 0 }}>
                                  <Select
                                    value={disjType}
                                    onChange={(val) => {
                                      const newDisjArr = [...disjoncteursArr];
                                      newDisjArr[disjIdx] = `${val} ${disjName}`;
                                      updateContacteurData(contacteurType, nbDisjoncteurs, newDisjArr);
                                    }}
                                  >
                                    <Option value="mono">Mono</Option>
                                    <Option value="tetra">Tétra</Option>
                                  </Select>
                                </Form.Item>

                                <Form.Item label="Nom" style={{ flex: 2, marginBottom: 0 }}>
                                  <Input
                                    value={disjName}
                                    onChange={(e) => {
                                      const newDisjArr = [...disjoncteursArr];
                                      newDisjArr[disjIdx] = `${disjType} ${e.target.value}`;
                                      updateContacteurData(contacteurType, nbDisjoncteurs, newDisjArr);
                                    }}
                                    placeholder="ex: Disj Principal"
                                  />
                                </Form.Item>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          <Divider style={{ margin: '24px 0' }} />

          <Title level={5} style={{ marginTop: '16px', marginBottom: '16px' }}>
            Éclairage extérieur
          </Title>

          {selectInput("Y a-t-il une horloge ?", 'commande_contacteur_exterieur', [
            { value: 'oui', label: 'Oui' },
            { value: 'oui_avec_crepusculaire', label: 'Oui avec un crépusculaire' },
            { value: 'non', label: 'Non' },
          ])}

          {numberInput('Nombre de contacteurs extérieurs', 'nb_contacteurs_ext')}

          {categoryData['nb_contacteurs_ext'] > 0 && (
            <>
              {safeArray(categoryData['nb_contacteurs_ext']).map((_, contacteurIdx) => {
                // Parse the complex ref_disjoncteur_contacteur_ext structure
                // Format: "tetra:3:mono ref1|tetra ref2|tetra ref3 || mono:2:mono ref4|mono ref5"
                const allContacteurData = (categoryData['ref_disjoncteur_contacteur_ext'] || '').split(' || ');
                const currentContacteurData = allContacteurData[contacteurIdx] || '';

                // Split by first colon to get type and rest
                const parts = currentContacteurData.split(':');
                const contacteurType = parts[0] || 'tetra';
                const nbDisjoncteurs = parseInt(parts[1], 10) || 0;
                const disjoncteursStr = parts.slice(2).join(':'); // Re-join in case there are colons in refs
                const disjoncteursArr = disjoncteursStr ? disjoncteursStr.split('|').map(d => d.trim()) : [];

                const updateContacteurData = (newType, newNbDisj, newDisjArr) => {
                  const updated = [...allContacteurData];
                  const disjStr = newDisjArr.filter((_, idx) => idx < newNbDisj).join(' | ');
                  updated[contacteurIdx] = `${newType}:${newNbDisj}:${disjStr}`;
                  const finalValue = updated.filter((_, idx) => idx < categoryData['nb_contacteurs_ext']).join(' || ');
                  handleCategoryDataChange('ref_disjoncteur_contacteur_ext', finalValue);
                };

                return (
                  <div key={`contacteur_ext_${contacteurIdx}`} style={{
                    marginBottom: '24px',
                    padding: '16px',
                    border: '1px solid #e8e8e8',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa'
                  }}>
                    <Form.Item label={`Contacteur extérieur ${contacteurIdx + 1} - Type`}>
                      <Select
                        value={contacteurType}
                        onChange={(val) => updateContacteurData(val, nbDisjoncteurs, disjoncteursArr)}
                      >
                        <Option value="tetra">Contacteurs tétra</Option>
                        <Option value="mono">Contacteurs mono</Option>
                        <Option value="biphase">Contacteurs biphasés</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Nombre de disjoncteurs">
                      <InputNumber
                        min={0}
                        max={20}
                        style={{ width: '100%' }}
                        value={nbDisjoncteurs}
                        onChange={(val) => updateContacteurData(contacteurType, val || 0, disjoncteursArr)}
                      />
                    </Form.Item>

                    {nbDisjoncteurs > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <Text strong>Disjoncteurs:</Text>
                        {safeArray(nbDisjoncteurs).map((_, disjIdx) => {
                          const currentDisj = disjoncteursArr[disjIdx] || '';
                          // Format: "mono ref1" or "tetra ref2"
                          const disjParts = currentDisj.split(' ');
                          const disjType = disjParts[0] || 'mono';
                          const disjName = disjParts.slice(1).join(' ') || '';

                          return (
                            <div key={`disj_ext_${disjIdx}`} style={{
                              marginTop: '8px',
                              padding: '12px',
                              backgroundColor: '#ffffff',
                              borderRadius: '4px',
                              border: '1px solid #e0e0e0'
                            }}>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                                <Form.Item label={`Disjoncteur ${disjIdx + 1} - Type`} style={{ flex: 1, marginBottom: 0 }}>
                                  <Select
                                    value={disjType}
                                    onChange={(val) => {
                                      const newDisjArr = [...disjoncteursArr];
                                      newDisjArr[disjIdx] = `${val} ${disjName}`;
                                      updateContacteurData(contacteurType, nbDisjoncteurs, newDisjArr);
                                    }}
                                  >
                                    <Option value="mono">Mono</Option>
                                    <Option value="tetra">Tétra</Option>
                                  </Select>
                                </Form.Item>

                                <Form.Item label="Nom" style={{ flex: 2, marginBottom: 0 }}>
                                  <Input
                                    value={disjName}
                                    onChange={(e) => {
                                      const newDisjArr = [...disjoncteursArr];
                                      newDisjArr[disjIdx] = `${disjType} ${e.target.value}`;
                                      updateContacteurData(contacteurType, nbDisjoncteurs, newDisjArr);
                                    }}
                                    placeholder="ex: Disj Ext Principal"
                                  />
                                </Form.Item>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          <Divider style={{ margin: '24px 0' }} />

          {textInput('Commentaire', 'commentaire_eclairage')}
        </>
      );

    case 'Comptage_Aero':
      return (
        <ComptageSection
          equipmentType="aero"
          categoryData={categoryData}
          handleCategoryDataChange={handleCategoryDataChange}
        />
      );

    case 'Comptage_Clim':
      return (
        <ComptageSection
          equipmentType="clim"
          categoryData={categoryData}
          handleCategoryDataChange={handleCategoryDataChange}
        />
      );

    case 'Comptage_Rooftop':
      return (
        <ComptageSection
          equipmentType="rooftop"
          categoryData={categoryData}
          handleCategoryDataChange={handleCategoryDataChange}
        />
      );

    case 'Comptage_Eclairage':
      return (
        <ComptageLightingSection
          categoryData={categoryData}
          handleCategoryDataChange={handleCategoryDataChange}
          lightingData={allEquipmentData}
        />
      );

    default:
      return [
        <Form.Item key="default">
          <Input
            type="number"
            min={0}
            value={categoryData[category] || ''}
            onChange={(e) => handleCategoryDataChange(category, e.target.value)}
          />
        </Form.Item>,
      ];
  }
};
