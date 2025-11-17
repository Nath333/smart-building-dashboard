
import { Typography } from 'antd';
import { getSiteName } from '../../utils/siteContext';
import { LAYOUT_CONSTANTS } from './layoutConstants';

const { Title } = Typography;

const PageLayout = ({ 
  title, 
  showSiteName = true, 
  maxWidth = 1200, 
  centered = false, 
  children 
}) => {
  const siteName = getSiteName();
  
  const containerStyle = {
    width: '100%',
    maxWidth: `${maxWidth}px`,
    margin: '0 auto',
    padding: `${LAYOUT_CONSTANTS.PADDING.PAGE}px`,
    minHeight: '100vh',
    boxSizing: 'border-box',
  };

  const titleStyle = {
    marginBottom: `${LAYOUT_CONSTANTS.MARGINS.TITLE}px`,
    textAlign: centered ? 'center' : 'left',
    fontSize: '24px',
    fontWeight: 600,
    color: '#1a1a1a',
  };

  const displayTitle = showSiteName && siteName && siteName !== 'unknown' 
    ? `${title} – ${siteName}` 
    : title;

  return (
    <div style={containerStyle}>
      <Title level={3} style={titleStyle}>
        {displayTitle}
      </Title>
      {children}
    </div>
  );
};

export default PageLayout;