import { Button, Row, Col } from 'antd';
import { LAYOUT_CONSTANTS } from '../layout/layoutConstants';

const ActionButtons = ({ buttons, layout = 'horizontal', centered = true, gap = LAYOUT_CONSTANTS.SPACING.MEDIUM }) => {

  const baseProps = {
    size: 'large',
    style: {
      minWidth: 200,
      transition: LAYOUT_CONSTANTS.COMMON_STYLES.TRANSITION,
      borderRadius: LAYOUT_CONSTANTS.BORDER_RADIUS.BUTTON,
    }
  };
  
  if (layout === 'grid' && buttons.length > 2) {
    return (
      <div style={{ marginTop: LAYOUT_CONSTANTS.SPACING.XLARGE }}>
        <Row gutter={[16, 16]}>
          {buttons.map((button, index) => (
            <Col span={24 / Math.min(buttons.length, 3)} key={index}>
              <Button {...baseProps} {...button} block />
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: LAYOUT_CONSTANTS.SPACING.XLARGE,
      display: 'flex',
      justifyContent: centered ? 'center' : 'flex-start',
      flexWrap: 'wrap',
      gap
    }}>
      {buttons.map((button, index) => (
        <Button key={index} {...baseProps} {...button} />
      ))}
    </div>
  );
};

export default ActionButtons;