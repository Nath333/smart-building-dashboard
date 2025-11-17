
import IconFactory from './IconFactory';
import { ICON_CONFIG, VISUAL_PLAN_ICONS, GTB_PLAN_ICONS } from './IconRegistry';

const UniversalLegend = ({
  type = 'visual', // 'visual' or 'gtb'
  maxWidth = type === 'gtb' ? 900 : 850,
  gridColumns = type === 'gtb' ? 'repeat(auto-fit, minmax(180px, 1fr))' : 'repeat(auto-fit, minmax(200px, 1fr))'
}) => {
  const iconList = type === 'gtb' ? GTB_PLAN_ICONS : VISUAL_PLAN_ICONS;
  const title = type === 'gtb' ? 'Légende des modules GTB' : 'Légende des modules';

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        maxWidth,
        width: "100%",
        margin: "24px auto",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{
        fontWeight: 600,
        fontSize: 16,
        marginBottom: 16,
        color: "#262626",
        paddingLeft: 8,
        borderLeft: "4px solid #1890ff",
        marginLeft: -12
      }}>
        {title}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridColumns,
          gap: 12,
          width: "100%",
        }}
      >
        {iconList.map((iconType) => {
          const config = ICON_CONFIG[iconType];
          if (!config) {
            console.warn(`Missing icon config for type: ${iconType}`);
            return null;
          }
          const label = type === 'gtb' ? config.labelGtb : config.label;

          return (
            <div
              key={iconType}
              style={{
                background: "#fafafa",
                border: "1px solid #f0f0f0",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                minHeight: 54,
                fontSize: 14,
                fontWeight: 500,
                color: "#262626",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                transition: "all 0.2s ease",
                cursor: "default",
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = "#f5f5f5";
                e.currentTarget.style.borderColor = "#d9d9d9";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.08)";
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = "#fafafa";
                e.currentTarget.style.borderColor = "#f0f0f0";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.04)";
              }}
            >
              <IconFactory
                type={iconType}
                variant={type}
                width={36}
                height={36}
              />
              <span style={{
                flex: 1,
                lineHeight: 1.4
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UniversalLegend;