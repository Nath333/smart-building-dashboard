import { Card } from 'antd';
import { LAYOUT_CONSTANTS } from '../layout/layoutConstants';

const FormCard = ({ title, children, style = {}, bordered = false, size = 'default', hoverable = false }) => (
  <Card
    title={title}
    bordered={bordered}
    size={size}
    hoverable={hoverable}
    style={{
      marginBottom: LAYOUT_CONSTANTS.MARGINS.CARD,
      borderRadius: LAYOUT_CONSTANTS.BORDER_RADIUS.CARD,
      boxShadow: LAYOUT_CONSTANTS.COMMON_STYLES.CARD_SHADOW,
      transition: LAYOUT_CONSTANTS.COMMON_STYLES.TRANSITION,
      backgroundColor: LAYOUT_CONSTANTS.COLORS.BACKGROUND,
      ...style
    }}
  >
    {children}
  </Card>
);

export default FormCard;