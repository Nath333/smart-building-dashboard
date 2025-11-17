import { Form, Radio, Space } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

/**
 * État de vétusté selector component
 * Displays three color-coded options: green (good), yellow (average), red (poor)
 */
const EtatVetusteSelector = ({ value, onChange, label = "État de vétusté" }) => {
  const options = [
    {
      value: 'green',
      label: 'Bon état',
      color: '#52c41a', // Ant Design success green
      bgColor: '#f6ffed',
      borderColor: '#b7eb8f'
    },
    {
      value: 'yellow',
      label: 'État moyen',
      color: '#faad14', // Ant Design warning orange/yellow
      bgColor: '#fffbe6',
      borderColor: '#ffe58f'
    },
    {
      value: 'red',
      label: 'Mauvais état',
      color: '#ff4d4f', // Ant Design error red
      bgColor: '#fff2f0',
      borderColor: '#ffccc7'
    }
  ];

  return (
    <Form.Item label={label}>
      <Radio.Group
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%' }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          width: '100%'
        }}>
          {options.map(opt => (
            <Radio
              key={opt.value}
              value={opt.value}
              style={{
                padding: '8px 12px',
                backgroundColor: value === opt.value ? opt.bgColor : '#f5f5f5',
                border: `2px solid ${value === opt.value ? opt.borderColor : '#d9d9d9'}`,
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: value === opt.value ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transform: value === opt.value ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <Space size={6}>
                <CheckCircleFilled
                  style={{
                    color: opt.color,
                    fontSize: 16,
                    opacity: value === opt.value ? 1 : 0.4
                  }}
                />
                <span style={{
                  fontWeight: value === opt.value ? 600 : 500,
                  color: value === opt.value ? '#262626' : '#8c8c8c',
                  fontSize: '13px'
                }}>
                  {opt.label}
                </span>
              </Space>
            </Radio>
          ))}
        </div>
      </Radio.Group>
    </Form.Item>
  );
};

export default EtatVetusteSelector;
