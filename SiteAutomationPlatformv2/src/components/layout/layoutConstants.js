/**
 * Standardized layout constants for consistent UI across all pages
 * @description Professional spacing, padding, and sizing standards
 * @version 1.0
 */
export const LAYOUT_CONSTANTS = {
  /** Padding values in pixels */
  PADDING: {
    PAGE: 24,        // Main page container padding
    CARD: 16,        // Card content padding  
    SECTION: 16,     // Section spacing
    BUTTON_GROUP: 16 // Button group padding
  },
  /** Margin values in pixels */
  MARGINS: {
    TITLE: 24,   // Title bottom margin
    SECTION: 24, // Section spacing
    CARD: 24,    // Card bottom margin
    BUTTON: 16   // Button spacing
  },
  /** Border radius values in pixels */
  BORDER_RADIUS: {
    CARD: 8,   // Card border radius
    BUTTON: 6  // Button border radius
  },
  /** Maximum width values in pixels */
  MAX_WIDTH: {
    FORM: 1000,    // Form containers
    CONTENT: 1200, // General content
    WIDE: 1600     // Wide layouts (plans)
  },
  /** General spacing values in pixels */
  SPACING: {
    SMALL: 8,   // Small gaps
    MEDIUM: 16, // Medium gaps
    LARGE: 24,  // Large gaps
    XLARGE: 32  // Extra large gaps
  },
  /** Common gradient styles */
  GRADIENTS: {
    HEADER: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    PRIMARY: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    SUCCESS: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    DANGER: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
    LIGHT: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
  },
  /** Modern UI colors */
  COLORS: {
    PRIMARY: '#1890ff',
    SUCCESS: '#52c41a',
    WARNING: '#faad14',
    ERROR: '#ff4d4f',
    BACKGROUND: '#ffffff',
    SURFACE: '#f5f5f5',
    BORDER: '#d9d9d9',
    TEXT_PRIMARY: '#262626',
    TEXT_SECONDARY: '#8c8c8c',
    TEXT_DISABLED: '#bfbfbf'
  },
  /** Common styles to reduce duplication */
  COMMON_STYLES: {
    CARD_SHADOW: '0 2px 8px rgba(0, 0, 0, 0.1)',
    CARD_HOVER_SHADOW: '0 4px 12px rgba(0, 0, 0, 0.15)',
    TRANSITION: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
    FORM_BACKGROUND: '#fafafa',
    INTERACTIVE_BACKGROUND: '#f9f9f9'
  }
};