import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Space, Typography, Divider, Select, InputNumber, Radio, Row, Col, Badge, Tag, Tooltip, Modal } from 'antd';
import { FileTextOutlined, ClearOutlined, PrinterOutlined, FilePdfOutlined, ThunderboltOutlined, ApiOutlined } from '@ant-design/icons';
import './WiringDiagramPage.print.css';

const { Title, Text } = Typography;
const { Option } = Select;

const WiringDiagramPage = () => {
  const [siteName, setSiteName] = useState('unknown');
  const [visioImageUrl, setVisioImageUrl] = useState(null);

  // State for DO12 (12 digital outputs)
  const [do12Data, setDo12Data] = useState(
    Array(12).fill(null).map((_, i) => ({ point: i + 1, equipment: '' }))
  );

  // State for AS-P (Slot 2) - Port selection
  const [aspPort, setAspPort] = useState('comA'); // 'comA', 'comB', or 'both'
  const [aspIpAddress, setAspIpAddress] = useState('192.168.1.100');

  // State for COM A (communication port A)
  const [comAProtocol, setComAProtocol] = useState('modbus'); // 'modbus' or 'bacnet'
  const [comACount, setComACount] = useState(3);
  const [comAData, setComAData] = useState(
    Array(3).fill(null).map((_, i) => ({ point: i + 1, equipment: '', address: '' }))
  );
  const [comASerial, setComASerial] = useState({
    parity: 'none',    // 'none', 'pair', 'impair'
    speed: '9600',     // '9600', '19200', '38400', '57600', '115200'
    stopBits: '1'      // '1', '1.5', '2'
  });

  // State for COM B (communication port B)
  const [comBProtocol, setComBProtocol] = useState('modbus');
  const [comBCount, setComBCount] = useState(3);
  const [comBData, setComBData] = useState(
    Array(3).fill(null).map((_, i) => ({ point: i + 1, equipment: '', address: '' }))
  );
  const [comBSerial, setComBSerial] = useState({
    parity: 'none',
    speed: '9600',
    stopBits: '1'
  });

  // Additional state for improvements
  const [cableSpecs, setCableSpecs] = useState({
    do12: '2x1.5mm² - 230V',
    comA: 'Blindé 2x0.75mm² - RS485',
    comB: 'Blindé 2x0.75mm² - RS485'
  });
  const [showVisualDiagram, setShowVisualDiagram] = useState(true);

  // Module configuration state
  const [moduleConfig, setModuleConfig] = useState('ps-asp-do12'); // 'ps-asp' or 'ps-asp-do12'

  useEffect(() => {
    // Get site name from localStorage
    const storedData = localStorage.getItem('simpleFormData');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      setSiteName(parsed.site || 'unknown');
    }

    // Add print styles for A4 format
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page {
          size: A4;
          margin: 0;
        }

        /* Remove browser default headers/footers */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          height: 100% !important;
        }

        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        /* Force hide all browser headers and footers */
        @page {
          margin-top: 0;
          margin-bottom: 0;
        }

        /* Hide page title, URL, date from print */
        title {
          display: none;
        }

        /* Additional header/footer removal */
        header, footer {
          display: none !important;
        }

        /* Hide action buttons and configuration selector when printing */
        .no-print {
          display: none !important;
        }

        /* Main container adjustments */
        .print-container {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Page break controls - strategic A4 layout */

        /* Page 1: Configuration GTB + COM A + COM B together */
        .module-overview-section {
          page-break-after: avoid;
          page-break-inside: avoid;
          margin-bottom: 4px !important;
        }

        /* Keep COM A and COM B sections together and compact */
        .com-section {
          page-break-inside: avoid;
          page-break-after: avoid;
          margin-bottom: 0 !important;
        }

        /* Last COM section gets extra spacing before page break - 5cm spacing (when DO12 exists) */
        .com-section:last-of-type {
          page-break-after: always;
          margin-bottom: 0 !important;
        }

        /* When NO DO12 (2 modules only), Cable specs starts Page 2 with 5cm spacing */
        .cable-specs-section.start-page2 {
          page-break-before: always;
          margin-top: 50mm !important;
        }

        /* Force page break before DO12 section - Page 2 starts here with 5cm spacing */
        .do12-section {
          page-break-before: always;
          margin-top: 50mm !important;
          padding-top: 0 !important;
        }

        /* Keep DO12 table compact and together */
        .do12-section .ant-table {
          page-break-inside: avoid;
          margin-bottom: 4px !important;
        }

        /* Keep individual table rows together */
        .ant-table-tbody > tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* Cable specs and project summary stay with DO12 on Page 2 */
        .cable-specs-section {
          page-break-inside: avoid;
          page-break-before: auto;
          margin-top: 8mm !important;
          margin-bottom: 4px !important;
        }

        /* Résumé du Projet - default 20cm spacing for 3 modules */
        .project-summary-section {
          page-break-inside: avoid;
          page-break-after: always;
          margin-bottom: 100mm !important;
          padding: 6mm !important;
          border: 3px solid #1890ff !important;
          background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%) !important;
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2) !important;
        }

        /* Résumé du Projet - 0.5cm spacing for 2 modules only */
        .project-summary-section.short-spacing {
          margin-bottom: 5mm !important;
        }

        /* Higher specificity override for Résumé with short spacing */
        .ant-card.project-summary-section.short-spacing {
          margin-bottom: 5mm !important;
        }

        .project-summary-section .ant-card-head {
          background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%) !important;
          color: white !important;
          padding: 10px 12px !important;
          border-bottom: 2px solid #0050b3 !important;
        }

        .project-summary-section .ant-card-head-title {
          color: white !important;
          font-size: 14px !important;
          font-weight: bold !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
        }

        .project-summary-section .ant-card-body {
          padding: 10px !important;
        }

        /* Connexions & Câblage - default 35cm spacing for 3 modules */
        .connexions-section {
          page-break-before: always;
          page-break-inside: avoid;
          margin-top: 175mm !important;
          margin-bottom: 8mm !important;
          padding: 6mm !important;
          border: 3px solid #fa8c16 !important;
          background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%) !important;
          box-shadow: 0 4px 12px rgba(250, 140, 22, 0.2) !important;
        }

        /* Connexions & Câblage - 0.5cm spacing for 2 modules only */
        .connexions-section.short-spacing {
          margin-top: 5mm !important;
        }

        .connexions-section .ant-card-head {
          background: linear-gradient(135deg, #fa8c16 0%, #d46b08 100%) !important;
          color: white !important;
          padding: 10px 12px !important;
          border-bottom: 2px solid #ad4e00 !important;
        }

        .connexions-section .ant-card-head-title {
          color: white !important;
          font-size: 14px !important;
          font-weight: bold !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
        }

        .connexions-section .ant-card-body {
          padding: 10px !important;
        }

        /* Connexions diagram container - ensure visibility in print */
        .connexions-section .ant-card-body {
          padding: 8px !important;
          display: block !important;
        }

        .connexions-section .ant-card-body > div {
          padding: 8px !important;
          text-align: center !important;
          display: block !important;
        }

        .connexions-section .ant-card-body > div > div {
          width: 250mm !important;
          height: 180mm !important;
          max-width: 250mm !important;
          margin: 0 auto !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: #f5f5f5 !important;
          border: 2px solid #1890ff !important;
          box-shadow: none !important;
          overflow: visible !important;
          border-radius: 4px !important;
        }

        /* Connexions image - ensure full visibility */
        .connexions-section img {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
          transform: none !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Dividers between sections - hidden by default */
        .ant-divider:not(.do12-divider):not(.connexions-divider) {
          margin: 0 !important;
          display: none !important;
          height: 0 !important;
          border: none !important;
        }

        /* Explicitly hide all regular dividers in print */
        .module-com-divider,
        .do12-cable-divider,
        .cable-resume-divider,
        .connexions-export-divider {
          margin: 0 !important;
          display: none !important;
          height: 0 !important;
          border: none !important;
          visibility: hidden !important;
        }

        /* Hide divider before DO12 - spacing only, no visible line */
        .ant-divider.do12-divider {
          display: none !important;
          margin: 0 !important;
          height: 0 !important;
          border: none !important;
          visibility: hidden !important;
        }

        /* Hide divider before Connexions - spacing only, no visible line */
        .connexions-divider {
          display: none !important;
          margin: 0 !important;
          height: 0 !important;
          border: none !important;
          visibility: hidden !important;
        }

        /* Module configuration cards - reduce size for print */
        .module-card {
          transform: scale(0.85);
          transform-origin: top center;
          margin-bottom: 10px !important;
        }

        /* Tables - compact view */
        .ant-table {
          font-size: 10px !important;
        }

        .ant-table-thead > tr > th {
          padding: 4px 8px !important;
          font-size: 10px !important;
        }

        .ant-table-tbody > tr > td {
          padding: 4px 8px !important;
          font-size: 9px !important;
        }

        /* Reduce margins and paddings - more compact */
        .ant-card {
          margin-bottom: 2px !important;
        }

        /* Reduce spacing between COM sections specifically */
        .ant-card.com-section {
          margin-bottom: 0 !important;
        }

        /* Override last COM section for 10cm spacing before DO12 */
        .ant-card.com-section:last-of-type {
          page-break-after: always !important;
          margin-bottom: 0 !important;
        }

        /* Override for DO12 section - 5cm spacing */
        .ant-card.do12-section {
          page-break-before: always !important;
          margin-top: 50mm !important;
        }

        /* Override for connexions section - 35cm spacing (default for 3 modules) */
        .ant-card.connexions-section {
          page-break-before: always !important;
          margin-top: 175mm !important;
          margin-bottom: 8mm !important;
          padding: 6mm !important;
          border: 3px solid #fa8c16 !important;
        }

        /* Override for connexions section - 0.5cm spacing (for 2 modules) */
        .ant-card.connexions-section.short-spacing {
          margin-top: 5mm !important;
        }

        .ant-card-body {
          padding: 4px 6px !important;
        }

        .ant-card-head {
          padding: 0 6px !important;
          min-height: 24px !important;
        }

        .ant-card-head-title {
          padding: 4px 0 !important;
          font-size: 10px !important;
        }

        .ant-divider {
          margin: 2px 0 !important;
        }

        /* Module images - smaller for print */
        .module-image-container {
          width: 60px !important;
          height: 60px !important;
        }

        .module-image-container img {
          width: 45px !important;
          height: 45px !important;
        }

        /* Serial configuration - minimal height */
        .ant-row {
          row-gap: 2px !important;
        }

        .ant-col {
          padding: 0 2px !important;
        }

        .ant-select {
          font-size: 8px !important;
        }

        .ant-select-selector {
          padding: 0 2px !important;
          height: 18px !important;
          line-height: 18px !important;
        }

        .ant-tag {
          margin: 0 !important;
          padding: 0 2px !important;
          font-size: 8px !important;
          line-height: 16px !important;
          height: 18px !important;
        }

        /* Text labels in serial config */
        span {
          font-size: 8px !important;
          line-height: 1 !important;
        }

        /* Space component */
        .ant-space {
          gap: 1px !important;
        }

        .ant-space-item {
          margin-bottom: 1px !important;
        }

        /* Input and InputNumber */
        .ant-input,
        .ant-input-number {
          font-size: 8px !important;
          padding: 2px 4px !important;
          height: 18px !important;
        }

        .ant-input-number-input {
          height: 16px !important;
          padding: 0 2px !important;
        }

        /* Project summary - compact */
        .project-summary h3 {
          font-size: 18px !important;
          margin: 4px 0 !important;
        }

        /* Force page breaks at specific sections */
        .page-break-before {
          page-break-before: always;
          break-before: always;
        }

        /* Inputs should show their values as text */
        input, textarea, select {
          border: none !important;
          background: transparent !important;
          font-weight: 500;
        }

        /* Hide empty inputs */
        input:placeholder-shown {
          visibility: hidden;
        }

        /* Radio buttons and checkboxes - show selection */
        .ant-radio-button-wrapper-checked {
          background: #1890ff !important;
          color: white !important;
        }

        /* Reduce header size */
        h1, h2 {
          font-size: 20px !important;
          margin: 8px 0 !important;
        }

        h3 {
          font-size: 16px !important;
          margin: 4px 0 !important;
        }

        h4 {
          font-size: 14px !important;
          margin: 4px 0 !important;
        }

        /* Ensure gradients print correctly */
        .ant-card-head {
          background: white !important;
          border-bottom: 1px solid #d9d9d9 !important;
        }

        /* Badge ribbons - visible but smaller */
        .ant-badge-ribbon {
          font-size: 10px !important;
          padding: 2px 8px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch GTB plan image from database
  useEffect(() => {
    const fetchVisioImage = async () => {
      if (siteName === 'unknown') return;

      try {
        console.log('[WiringDiagram] Fetching images for site:', siteName);
        const response = await fetch('http://localhost:4001/images/get-sql-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: siteName })
        });

        if (response.ok) {
          const images = await response.json();
          console.log('[WiringDiagram] All images:', images);

          // Find GTB plan image (type = 'gtb_plan') - get the most recent one
          const gtbPlanImages = images.filter(img => img.type === 'gtb_plan');
          console.log('[WiringDiagram] Found GTB plan images:', gtbPlanImages);

          // Get the most recent GTB plan (highest ID = most recent)
          const gtbPlanImage = gtbPlanImages.length > 0
            ? gtbPlanImages.reduce((latest, current) =>
                (current.id > latest.id ? current : latest)
              )
            : null;

          console.log('[WiringDiagram] Selected GTB plan image:', gtbPlanImage);

          if (gtbPlanImage && gtbPlanImage.url_viewer) {
            console.log('[WiringDiagram] Setting visio URL:', gtbPlanImage.url_viewer);
            setVisioImageUrl(gtbPlanImage.url_viewer);
          } else {
            console.log('[WiringDiagram] No GTB plan image found');
          }
        } else {
          console.error('[WiringDiagram] Response not OK:', response.status);
        }
      } catch (error) {
        console.error('[WiringDiagram] Error fetching Visio image:', error);
      }
    };

    fetchVisioImage();
  }, [siteName]);

  // Update COM A data when count changes
  const handleComACountChange = (value) => {
    setComACount(value);
    const newData = Array(value).fill(null).map((_, i) =>
      comAData[i] || { point: i + 1, equipment: '', address: '' }
    );
    setComAData(newData);
  };

  // Update COM B data when count changes
  const handleComBCountChange = (value) => {
    setComBCount(value);
    const newData = Array(value).fill(null).map((_, i) =>
      comBData[i] || { point: i + 1, equipment: '', address: '' }
    );
    setComBData(newData);
  };

  const handleClear = () => {
    setDo12Data(Array(12).fill(null).map((_, i) => ({ point: i + 1, equipment: '' })));
    setComACount(3);
    setComBCount(3);
    setComAData(Array(3).fill(null).map((_, i) => ({ point: i + 1, equipment: '', address: '' })));
    setComBData(Array(3).fill(null).map((_, i) => ({ point: i + 1, equipment: '', address: '' })));
    setAspPort('comA');
    setAspIpAddress('192.168.1.100');
    setComAProtocol('modbus');
    setComBProtocol('modbus');
    setComASerial({ parity: 'none', speed: '9600', stopBits: '1' });
    setComBSerial({ parity: 'none', speed: '9600', stopBits: '1' });
  };

  const handlePrint = () => {
    // Show modal with instructions before printing
    Modal.warning({
      title: '⚠️ ACTION REQUISE: Désactiver les en-têtes et pieds de page',
      width: 700,
      content: (
        <div style={{ lineHeight: '2' }}>
          <div style={{
            background: '#fff7e6',
            border: '2px solid #ffa940',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#d46b08' }}>
              🚫 IMPORTANT: La date, l'URL et le titre DOIVENT être désactivés manuellement
            </p>
          </div>

          <p style={{ fontSize: '15px', marginBottom: '12px' }}>
            <strong>Étape 1:</strong> Cliquez sur "OK" ci-dessous pour ouvrir l'impression
          </p>

          <p style={{ fontSize: '15px', marginBottom: '8px' }}>
            <strong>Étape 2:</strong> Dans la fenêtre d'impression du navigateur:
          </p>

          <div style={{
            background: '#f0f0f0',
            borderLeft: '4px solid #1890ff',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                Cliquez sur <strong>"Plus de paramètres"</strong> (ou "More settings")
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#ff4d4f' }}>Décochez "En-têtes et pieds de page"</strong>
                <br/>
                <span style={{ fontSize: '13px', color: '#666' }}>(Uncheck "Headers and footers")</span>
              </li>
              <li style={{ marginBottom: '8px' }}>
                Réglez les marges sur "Aucune" ou "Minimales"
              </li>
              <li>
                Cliquez sur "Enregistrer" ou "Imprimer"
              </li>
            </ol>
          </div>

          <div style={{
            background: '#fff1f0',
            border: '1px solid #ffa39e',
            borderRadius: '4px',
            padding: '12px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#cf1322' }}>
              ❌ Sans cette étape, vous verrez toujours la date et l'URL dans le PDF
            </p>
          </div>
        </div>
      ),
      onOk: () => {
        // Temporarily clear the page title to remove "Vite + React" from headers
        const originalTitle = document.title;
        document.title = '';

        // Use setTimeout to ensure title change is applied before print dialog
        setTimeout(() => {
          window.print();

          // Restore original title after print dialog closes
          setTimeout(() => {
            document.title = originalTitle;
          }, 100);
        }, 100);
      },
      okText: 'OK - Ouvrir l\'impression maintenant',
      cancelText: 'Annuler',
      okButtonProps: { size: 'large', type: 'primary' },
    });
  };

  const updateDO12 = (index, value) => {
    const newData = [...do12Data];
    newData[index] = { ...newData[index], equipment: value };
    setDo12Data(newData);
  };

  const updateComA = (index, field, value) => {
    const newData = [...comAData];
    newData[index] = { ...newData[index], [field]: value };
    setComAData(newData);
  };

  const updateComB = (index, field, value) => {
    const newData = [...comBData];
    newData[index] = { ...newData[index], [field]: value };
    setComBData(newData);
  };

  const do12Columns = [
    {
      title: 'Point DO12',
      dataIndex: 'point',
      key: 'point',
      width: 120,
      render: (text) => <Text strong>DO{text}</Text>
    },
    {
      title: 'Équipement',
      dataIndex: 'equipment',
      key: 'equipment',
      render: (text, record, index) => (
        <Input
          placeholder="Nom de l'équipement"
          value={text}
          onChange={(e) => updateDO12(index, e.target.value)}
        />
      )
    }
  ];

  const comAColumns = [
    {
      title: 'Point',
      dataIndex: 'point',
      key: 'point',
      width: 100,
      render: (text) => <Text strong>COM A-{text}</Text>
    },
    {
      title: 'Équipement',
      dataIndex: 'equipment',
      key: 'equipment',
      width: 300,
      render: (text, record, index) => (
        <Input
          placeholder="Nom de l'équipement"
          value={text}
          onChange={(e) => updateComA(index, 'equipment', e.target.value)}
        />
      )
    },
    {
      title: `Adresse ${comAProtocol === 'modbus' ? 'Modbus' : 'BACnet'}`,
      dataIndex: 'address',
      key: 'address',
      render: (text, record, index) => (
        <Input
          placeholder={comAProtocol === 'modbus' ? 'Ex: 1, 2, 3...' : 'Ex: Device ID'}
          value={text}
          onChange={(e) => updateComA(index, 'address', e.target.value)}
        />
      )
    }
  ];

  const comBColumns = [
    {
      title: 'Point',
      dataIndex: 'point',
      key: 'point',
      width: 100,
      render: (text) => <Text strong>COM B-{text}</Text>
    },
    {
      title: 'Équipement',
      dataIndex: 'equipment',
      key: 'equipment',
      width: 300,
      render: (text, record, index) => (
        <Input
          placeholder="Nom de l'équipement"
          value={text}
          onChange={(e) => updateComB(index, 'equipment', e.target.value)}
        />
      )
    },
    {
      title: `Adresse ${comBProtocol === 'modbus' ? 'Modbus' : 'BACnet'}`,
      dataIndex: 'address',
      key: 'address',
      render: (text, record, index) => (
        <Input
          placeholder={comBProtocol === 'modbus' ? 'Ex: 1, 2, 3...' : 'Ex: Device ID'}
          value={text}
          onChange={(e) => updateComB(index, 'address', e.target.value)}
        />
      )
    }
  ];

  return (
    <div className="print-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <Title level={2}>
              <FileTextOutlined /> Schéma de Câblage
            </Title>
            <Text type="secondary">Site: {siteName}</Text>
          </div>

          {/* Module Configuration Selector */}
          <Card
            className="no-print"
            styles={{ body: { padding: '10px 16px' } }}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              marginBottom: '12px'
            }}
          >
            <Row gutter={[12, 0]} align="middle">
              <Col xs={24} md={10}>
                <Space direction="vertical" size={0}>
                  <Text strong style={{ color: '#fff', fontSize: '13px' }}>
                    <ApiOutlined /> Configuration Système
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={14} style={{ textAlign: 'right' }}>
                <Radio.Group
                  value={moduleConfig}
                  onChange={(e) => setModuleConfig(e.target.value)}
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="ps-asp">
                    <Text style={{ fontSize: '12px' }}>PS + AS-P (2 Modules)</Text>
                  </Radio.Button>
                  <Radio.Button value="ps-asp-do12">
                    <Text style={{ fontSize: '12px' }}>PS + AS-P + DO12 (3 Modules)</Text>
                  </Radio.Button>
                </Radio.Group>
              </Col>
            </Row>
          </Card>

          <Divider style={{ margin: '12px 0' }} />

          {/* Module Configuration Overview - Professional Design */}
          <Card
            type="inner"
            className="module-overview-section"
            title={
              <Space>
                <ApiOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                <Text strong style={{ fontSize: '18px' }}>Configuration Modules GTB</Text>
              </Space>
            }
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}
            styles={{
              header: {
                background: 'rgba(255,255,255,0.95)',
                borderBottom: '2px solid #1890ff',
                borderRadius: '8px 8px 0 0'
              },
              body: { padding: '32px 24px' }
            }}
          >
            <Row gutter={[24, 24]} justify="center">
              {/* Slot 1 - PS Module */}
              <Col xs={24} md={8}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    borderRadius: '12px',
                    border: '2px solid #ffa940',
                    boxShadow: '0 4px 12px rgba(255, 169, 64, 0.2)',
                    background: '#fff',
                    transition: 'all 0.3s ease'
                  }}
                  styles={{ body: { padding: '24px', textAlign: 'center' } }}
                >
                  <Badge.Ribbon text="Slot 1" color="orange">
                    <div style={{ paddingTop: 20 }}>
                      <div style={{
                        width: 200,
                        height: 200,
                        margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(255, 169, 64, 0.4)'
                      }}>
                        <img
                          src="/images/modules/ps.png"
                          alt="PS Module"
                          style={{ width: 170, height: 170, objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <Title level={3} style={{ margin: '12px 0', color: '#fa8c16' }}>PS</Title>
                      <Text strong style={{ fontSize: '14px', color: '#595959' }}>Power Supply</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>Module d'Alimentation</Text>
                    </div>
                  </Badge.Ribbon>
                </Card>
              </Col>

              {/* Slot 2 - AS-P Module */}
              <Col xs={24} md={8}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    borderRadius: '12px',
                    border: '2px solid #1890ff',
                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.2)',
                    background: '#fff',
                    transition: 'all 0.3s ease'
                  }}
                  styles={{ body: { padding: '24px', textAlign: 'center' } }}
                >
                  <Badge.Ribbon text="Slot 2" color="blue">
                    <div style={{ paddingTop: 20 }}>
                      <div style={{
                        width: 200,
                        height: 200,
                        margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(24, 144, 255, 0.4)'
                      }}>
                        <img
                          src="/images/modules/as-p.png"
                          alt="AS-P Module"
                          style={{ width: 170, height: 170, objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <Title level={3} style={{ margin: '12px 0', color: '#1890ff' }}>AS-P</Title>
                      <Text strong style={{ fontSize: '14px', color: '#595959' }}>Automate schneider</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px', marginBottom: 12, display: 'block' }}>
                        Port de Communication RS485/Bacnet
                      </Text>

                      <Divider style={{ margin: '16px 0' }} />

                      {/* Port Selection */}
                      <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <div>
                          <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                            Configuration Port:
                          </Text>
                          <Radio.Group
                            value={aspPort}
                            onChange={(e) => setAspPort(e.target.value)}
                            size="small"
                            buttonStyle="solid"
                            style={{ width: '100%' }}
                          >
                            <Radio.Button value="comA" style={{ width: '100%', marginBottom: 4 }}>
                              <ApiOutlined /> COM A
                            </Radio.Button>
                            <Radio.Button value="comB" style={{ width: '100%', marginBottom: 4 }}>
                              <ApiOutlined /> COM B
                            </Radio.Button>
                            <Radio.Button value="both" style={{ width: '100%' }}>
                              <ApiOutlined /> COM A + B
                            </Radio.Button>
                          </Radio.Group>
                        </div>

                        <div>
                          <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                            <ThunderboltOutlined /> Adresse IP:
                          </Text>
                          <Input
                            prefix={<ApiOutlined style={{ color: '#bfbfbf' }} />}
                            value={aspIpAddress}
                            onChange={(e) => setAspIpAddress(e.target.value)}
                            placeholder="192.168.1.100"
                            style={{ fontSize: '13px' }}
                          />
                        </div>
                      </Space>
                    </div>
                  </Badge.Ribbon>
                </Card>
              </Col>

              {/* Slot 3 - DO12 Module (Conditional) */}
              {moduleConfig === 'ps-asp-do12' && (
                <Col xs={24} md={8}>
                  <Card
                    hoverable
                    style={{
                      height: '100%',
                      borderRadius: '12px',
                      border: '2px solid #52c41a',
                      boxShadow: '0 4px 12px rgba(82, 196, 26, 0.2)',
                      background: '#fff',
                      transition: 'all 0.3s ease'
                    }}
                    styles={{ body: { padding: '24px', textAlign: 'center' } }}
                  >
                  <Badge.Ribbon text="Slot 3" color="green">
                    <div style={{ paddingTop: 20 }}>
                      <div style={{
                        width: 200,
                        height: 200,
                        margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(82, 196, 26, 0.4)'
                      }}>
                        <img
                          src="/images/modules/do12.png"
                          alt="DO12 Module"
                          style={{ width: 170, height: 170, objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <Title level={3} style={{ margin: '12px 0', color: '#52c41a' }}>DO12</Title>
                      <Text strong style={{ fontSize: '14px', color: '#595959' }}>Digital Outputs</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>12 Sorties Numériques 230V</Text>
                    </div>
                  </Badge.Ribbon>
                </Card>
              </Col>
              )}
            </Row>
          </Card>

          <Divider className="module-com-divider" />

          {/* COM A Table - Slot 2 */}
          <Card
            type="inner"
            className="com-section"
            title={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <Text strong style={{ fontSize: '16px' }}>Port COM A</Text>
                  {(aspPort === 'comA' || aspPort === 'both') && (
                    <Badge status="success" text="Connecté au Slot 2: AS-P" />
                  )}
                </Space>
              </Space>
            }
            extra={
              <Space wrap>
                <Text>Protocole:</Text>
                <Select
                  value={comAProtocol}
                  onChange={setComAProtocol}
                  style={{ width: 100 }}
                  size="small"
                >
                  <Option value="modbus">Modbus</Option>
                  <Option value="bacnet">BACnet</Option>
                </Select>
                <Text>Points:</Text>
                <InputNumber
                  min={1}
                  max={20}
                  value={comACount}
                  onChange={handleComACountChange}
                  style={{ width: 60 }}
                  size="small"
                />
              </Space>
            }
          >
            {/* Serial Configuration for COM A */}
            <Card size="small" styles={{ body: { padding: '8px 12px' } }} style={{ marginBottom: 12, backgroundColor: '#f0f5ff' }}>
              <Row gutter={[12, 6]}>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Parité:</Text>
                    <Select
                      value={comASerial.parity}
                      onChange={(value) => setComASerial({ ...comASerial, parity: value })}
                      style={{ width: '100%' }}
                      size="small"
                    >
                      <Option value="none">None</Option>
                      <Option value="pair">Pair</Option>
                      <Option value="impair">Impair</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Vitesse:</Text>
                    <Select
                      value={comASerial.speed}
                      onChange={(value) => setComASerial({ ...comASerial, speed: value })}
                      style={{ width: '100%' }}
                      size="small"
                    >
                      <Option value="9600">9600</Option>
                      <Option value="19200">19200</Option>
                      <Option value="38400">38400</Option>
                      <Option value="57600">57600</Option>
                      <Option value="115200">115200</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Stop Bits:</Text>
                    <Select
                      value={comASerial.stopBits}
                      onChange={(value) => setComASerial({ ...comASerial, stopBits: value })}
                      style={{ width: '100%' }}
                      size="small"
                    >
                      <Option value="1">1</Option>
                      <Option value="1.5">1.5</Option>
                      <Option value="2">2</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Config:</Text>
                    <Tag color="blue" style={{ marginTop: 2, fontSize: '11px' }}>
                      {comASerial.speed}-{comASerial.parity === 'none' ? 'N' : comASerial.parity === 'pair' ? 'E' : 'O'}-{comASerial.stopBits}
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </Card>

            <Table
              dataSource={comAData}
              columns={comAColumns}
              pagination={false}
              size="middle"
              rowKey="point"
              bordered
            />
          </Card>

          {/* COM B Table */}
          <Card
            type="inner"
            className="com-section"
            title={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <Text strong style={{ fontSize: '16px' }}>Port COM B</Text>
                  {(aspPort === 'comB' || aspPort === 'both') && (
                    <Badge status="success" text="Connecté au Slot 2: AS-P" />
                  )}
                </Space>
              </Space>
            }
            extra={
              <Space wrap>
                <Text>Protocole:</Text>
                <Select
                  value={comBProtocol}
                  onChange={setComBProtocol}
                  style={{ width: 100 }}
                  size="small"
                >
                  <Option value="modbus">Modbus</Option>
                  <Option value="bacnet">BACnet</Option>
                </Select>
                <Text>Points:</Text>
                <InputNumber
                  min={1}
                  max={20}
                  value={comBCount}
                  onChange={handleComBCountChange}
                  style={{ width: 60 }}
                  size="small"
                />
              </Space>
            }
          >
            {/* Serial Configuration for COM B */}
            <Card size="small" styles={{ body: { padding: '8px 12px' } }} style={{ marginBottom: 12, backgroundColor: '#f6ffed' }}>
              <Row gutter={[12, 6]}>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Parité:</Text>
                    <Select
                      value={comBSerial.parity}
                      onChange={(value) => setComBSerial({ ...comBSerial, parity: value })}
                      style={{ width: '100%' }}
                      size="small"
                    >
                      <Option value="none">None</Option>
                      <Option value="pair">Pair</Option>
                      <Option value="impair">Impair</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Vitesse:</Text>
                    <Select
                      value={comBSerial.speed}
                      onChange={(value) => setComBSerial({ ...comBSerial, speed: value })}
                      style={{ width: '100%' }}
                      size="small"
                    >
                      <Option value="9600">9600</Option>
                      <Option value="19200">19200</Option>
                      <Option value="38400">38400</Option>
                      <Option value="57600">57600</Option>
                      <Option value="115200">115200</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Stop Bits:</Text>
                    <Select
                      value={comBSerial.stopBits}
                      onChange={(value) => setComBSerial({ ...comBSerial, stopBits: value })}
                      style={{ width: '100%' }}
                      size="small"
                    >
                      <Option value="1">1</Option>
                      <Option value="1.5">1.5</Option>
                      <Option value="2">2</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Config:</Text>
                    <Tag color="green" style={{ marginTop: 2, fontSize: '11px' }}>
                      {comBSerial.speed}-{comBSerial.parity === 'none' ? 'N' : comBSerial.parity === 'pair' ? 'E' : 'O'}-{comBSerial.stopBits}
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </Card>

            <Table
              dataSource={comBData}
              columns={comBColumns}
              pagination={false}
              size="middle"
              rowKey="point"
              bordered
            />
          </Card>

          {moduleConfig === 'ps-asp-do12' && (
            <>
              <Divider className="do12-divider" />

              {/* DO12 Table - Slot 3 (12 Digital Outputs) */}
              <Card
                type="inner"
                className="do12-section"
                title={
                  <Space>
                    <Text strong style={{ fontSize: '16px' }}>Slot 3: DO12</Text>
                    <Text type="secondary">(12 Sorties Numériques)</Text>
                  </Space>
                }
              >
                <Table
                  dataSource={do12Data}
                  columns={do12Columns}
                  pagination={false}
                  size="middle"
                  rowKey="point"
                  bordered
                />
              </Card>
            </>
          )}

          <Divider className="do12-cable-divider" />

          {/* Cable Specifications */}
          <Card
            type="inner"
            className={`cable-specs-section ${moduleConfig === 'ps-asp' ? 'start-page2' : ''}`}
            title={
              <Space>
                <ThunderboltOutlined />
                <Text strong style={{ fontSize: '16px' }}>Spécifications de Câblage</Text>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              {moduleConfig === 'ps-asp-do12' && (
                <Col xs={24} md={moduleConfig === 'ps-asp-do12' ? 8 : 12}>
                  <Card size="small" style={{ backgroundColor: '#fff7e6', borderColor: '#ffa940' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>DO12 - Sorties Numériques</Text>
                      <Input
                        value={cableSpecs.do12}
                        onChange={(e) => setCableSpecs({ ...cableSpecs, do12: e.target.value })}
                        placeholder="Type de câble"
                      />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Câble pour alimentations 230V
                      </Text>
                    </Space>
                  </Card>
                </Col>
              )}
              <Col xs={24} md={moduleConfig === 'ps-asp-do12' ? 8 : 12}>
                <Card size="small" style={{ backgroundColor: '#e6f7ff', borderColor: '#40a9ff' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>COM A - {comAProtocol === 'modbus' ? 'Modbus' : 'BACnet'}</Text>
                    <Input
                      value={cableSpecs.comA}
                      onChange={(e) => setCableSpecs({ ...cableSpecs, comA: e.target.value })}
                      placeholder="Type de câble"
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Câble blindé pour communication
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={moduleConfig === 'ps-asp-do12' ? 8 : 12}>
                <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#52c41a' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>COM B - {comBProtocol === 'modbus' ? 'Modbus' : 'BACnet'}</Text>
                    <Input
                      value={cableSpecs.comB}
                      onChange={(e) => setCableSpecs({ ...cableSpecs, comB: e.target.value })}
                      placeholder="Type de câble"
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Câble blindé pour communication
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>

          <Divider className="cable-resume-divider" />

          {/* Project Summary */}
          <Card
            type="inner"
            className={`project-summary-section ${moduleConfig === 'ps-asp' ? 'short-spacing' : ''}`}
            title={
              <Space>
                <ApiOutlined />
                <Text strong style={{ fontSize: '16px' }}>Résumé du Projet</Text>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              {moduleConfig === 'ps-asp-do12' && (
                <Col xs={24} md={8}>
                  <Space direction="vertical" size="small">
                    <Text type="secondary">Sorties Numériques</Text>
                    <Title level={3} style={{ margin: 0 }}>
                      {do12Data.filter(d => d.equipment).length} / 12
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Points configurés
                    </Text>
                  </Space>
                </Col>
              )}
              <Col xs={24} md={moduleConfig === 'ps-asp-do12' ? 8 : 12}>
                <Space direction="vertical" size="small">
                  <Text type="secondary">COM A - {comAProtocol.toUpperCase()}</Text>
                  <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                    {comAData.filter(d => d.equipment).length} / {comACount}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Équipements connectés
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={moduleConfig === 'ps-asp-do12' ? 8 : 12}>
                <Space direction="vertical" size="small">
                  <Text type="secondary">COM B - {comBProtocol.toUpperCase()}</Text>
                  <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                    {comBData.filter(d => d.equipment).length} / {comBCount}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Équipements connectés
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>

          <Divider className="connexions-divider" />

          {/* AS-P Back View After Resume */}
          <Card
            type="inner"
            className={`connexions-section ${moduleConfig === 'ps-asp' ? 'short-spacing' : ''}`}
            title={
              <Space>
                <ThunderboltOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                <Text strong style={{ fontSize: '16px' }}>Connexions & Câblage</Text>
              </Space>
            }
          >
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{
                width: 1100,
                height: 600,
                margin: '0 auto',
                background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(24, 144, 255, 0.3)',
                border: '3px solid #1890ff',
                overflow: 'hidden'
              }}>
                <img
                  src={moduleConfig === 'ps-asp' ? '/images/modules/v2.png' : '/images/modules/v1.png'}
                  alt={`Configuration ${moduleConfig === 'ps-asp' ? '2 Modules' : '3 Modules'} - Schéma de Câblage`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            </div>
          </Card>

          <Divider className="connexions-export-divider" />

          {/* Architecture Ethernet Section */}
          <Card
            type="inner"
            className={`connexions-section ${moduleConfig === 'ps-asp' ? 'short-spacing' : ''}`}
            title={
              <Space>
                <ApiOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />
                <Text strong style={{ fontSize: '16px' }}>Architecture Ethernet</Text>
              </Space>
            }
          >
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{
                width: 1100,
                height: 600,
                margin: '0 auto',
                background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(250, 140, 22, 0.3)',
                border: '3px solid #fa8c16',
                overflow: 'visible',
                position: 'relative'
              }}>
                <img
                  src={moduleConfig === 'ps-asp' ? '/images/modules/architecture1.png' : '/images/modules/architecture2.png'}
                  alt={`Architecture Ethernet - Schéma Réseau (${moduleConfig === 'ps-asp' ? '2 Modules' : '3 Modules'})`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />

                {/* Text Overlay - Blue */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '55%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(24, 144, 255, 0.4)',
                  color: 'black',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: '1.5px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px',
                  backdropFilter: 'blur(4px)'
                }}>
                  {(() => {
                    const parts = aspIpAddress.split('.');
                    if (parts.length === 4) {
                      return `${parts[0]}.${parts[1]}.${parts[2]}.1`;
                    }
                    return '10.20.42.1';
                  })()}
                </div>

                {/* Text Overlay - Green */}
                <div style={{
                  position: 'absolute',
                  top: '82%',
                  left: '44%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(82, 196, 26, 0.4)',
                  color: 'black',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: '1.5px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px',
                  backdropFilter: 'blur(4px)'
                }}>
                  {(() => {
                    const parts = aspIpAddress.split('.');
                    if (parts.length === 4) {
                      return `${parts[0]}.${parts[1]}.${parts[2]}.15`;
                    }
                    return '10.20.42.15';
                  })()}
                </div>

                {/* Text Overlay - Orange */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '80%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(250, 140, 22, 0.4)',
                  color: 'black',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: '1.5px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px',
                  backdropFilter: 'blur(4px)'
                }}>
                  {aspIpAddress}
                </div>
              </div>
            </div>
          </Card>

          <Divider className="connexions-export-divider" />

          {/* Visio Section - GTB Plan from Database */}
          {visioImageUrl && (
            <>
              <Card
                type="inner"
                className={`connexions-section ${moduleConfig === 'ps-asp' ? 'short-spacing' : ''}`}
                title={
                  <Space>
                    <FileTextOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
                    <Text strong style={{ fontSize: '16px' }}>Visio - Plan GTB</Text>
                  </Space>
                }
              >
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{
                    width: 1100,
                    height: 600,
                    margin: '0 auto',
                    background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(114, 46, 209, 0.3)',
                    border: '3px solid #722ed1',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={visioImageUrl}
                      alt="Visio - Plan GTB"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                </div>
              </Card>

              <Divider className="connexions-export-divider" />
            </>
          )}

          {/* Export Actions */}
          <Card
            className="no-print"
            style={{ backgroundColor: '#fafafa', textAlign: 'center' }}
          >
            <Space size="large">
              <Tooltip title="IMPORTANT: Dans la boîte d'impression du navigateur, désactivez 'En-têtes et pieds de page' pour supprimer la date et l'URL">
                <Button
                  type="primary"
                  size="large"
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                >
                  Imprimer le Schéma
                </Button>
              </Tooltip>
              <Tooltip title="IMPORTANT: Dans la boîte d'impression du navigateur, désactivez 'En-têtes et pieds de page' pour supprimer la date et l'URL">
                <Button
                  size="large"
                  icon={<FilePdfOutlined />}
                  onClick={() => {
                    window.print();
                  }}
                >
                  Exporter en PDF
                </Button>
              </Tooltip>
              <Tooltip title="Réinitialiser tous les champs">
                <Button
                  danger
                  size="large"
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                >
                  Effacer Tout
                </Button>
              </Tooltip>
            </Space>
          </Card>

        </Space>
      </Card>
    </div>
  );
};

export default WiringDiagramPage;
