
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Tabs, Dropdown, Button, Grid } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { LAYOUT_CONSTANTS } from './components/layout/layoutConstants';

import Page1 from './pages/SiteInfoPage';
import Page2 from './pages/EquipmentPage';
import Page3 from './pages/VisualPlanPage';
import Page4 from './pages/DevisPage';
import Page5 from './pages/GtbConfigPage';
import Page6 from './pages/GtbPlanPage';
import Page7 from './pages/WiringDiagramPage';

const { useBreakpoint } = Grid;

const tabItems = [
  { key: '1', label: '1 INFO SITE', path: '/page1', element: <Page1 /> },
  { key: '2', label: '2 ÉQUIPEMENTS', path: '/page2', element: <Page2 /> },
  { key: '3', label: '3 PLAN VISUEL', path: '/page3', element: <Page3 /> },
  { key: '4', label: '4 DEVIS', path: '/page4', element: <Page4 /> },
  { key: '5', label: '5 CONFIG GTB', path: '/page5', element: <Page5 /> },
  { key: '6', label: '6 PLAN GTB', path: '/page6', element: <Page6 /> },
  { key: '7', label: '7 CÂBLAGE', path: '/page7', element: <Page7 /> },
];

const TabNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const currentKey =
    tabItems.find((tab) => location.pathname === tab.path)?.key || '1';

  const handleTabChange = (key) => {
    const target = tabItems.find((item) => item.key === key);
    if (target) navigate(target.path);
  };

  const dropdownMenu = {
    selectedKeys: [currentKey],
    onClick: ({ key }) => handleTabChange(key),
    items: tabItems.map(({ key, label }) => ({
      key,
      label,
    }))
  };

  return (
    <div
      style={{
        padding: `${LAYOUT_CONSTANTS.SPACING.SMALL}px ${LAYOUT_CONSTANTS.PADDING.SECTION}px`,
        borderBottom: `1px solid ${LAYOUT_CONSTANTS.COLORS.BORDER}`,
        background: LAYOUT_CONSTANTS.COLORS.BACKGROUND,
        boxShadow: LAYOUT_CONSTANTS.COMMON_STYLES.CARD_SHADOW,
      }}
    >
      {isMobile ? (
        <Dropdown menu={dropdownMenu} trigger={['click']}>
          <Button size="large">
            {tabItems.find((t) => t.key === currentKey)?.label || 'Page'}
            <DownOutlined style={{ marginLeft: 8 }} />
          </Button>
        </Dropdown>
      ) : (
        <Tabs
          activeKey={currentKey}
          onChange={handleTabChange}
          tabPosition="top"
          type="line"
          size="large"
          animated
          items={tabItems.map(({ key, label }) => ({ key, label }))}
        />
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div style={{ height: '100vh', width: '100vw', backgroundColor: LAYOUT_CONSTANTS.COLORS.BACKGROUND }}>
        <TabNavigation />
        <Routes>
          <Route path="/" element={<Navigate to="/page1" />} />
          {tabItems.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
