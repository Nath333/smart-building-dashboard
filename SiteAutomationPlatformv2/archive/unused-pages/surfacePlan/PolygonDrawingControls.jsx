
import { Button, Space, Card, Typography, Badge, Divider } from 'antd';
import { HighlightOutlined, FireOutlined, CheckOutlined, ClearOutlined, ColumnWidthOutlined, BorderOutlined } from '@ant-design/icons';

const PolygonDrawingControls = ({
  activeDrawingCardIndex,
  isDrawingPolygon,
  polygonPoints,
  setDrawingColor,
  setPolygonPoints,
  setIsDrawingPolygon,
  finishPolygon,
  // Reference line props
  isDrawingReference,
  setIsDrawingReference,
  referenceLine,
  setReferenceLine,
  scalePixelsPerMeter,
  // Rectangle scale props
  isDrawingRectangleScale,
  setIsDrawingRectangleScale,
}) => {
  const hasActiveCard = activeDrawingCardIndex !== null;
  const canFinish = isDrawingPolygon && polygonPoints.length >= 3;

  return (
    <Card
      style={{
        margin: '32px auto',
        maxWidth: 800,
        borderRadius: 16,
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: '1px solid #e1e8ed'
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HighlightOutlined style={{ color: '#1890ff', fontSize: 16 }} />
          <Typography.Text strong style={{ color: '#2c3e50' }}>
            Outils de Dessin Polygonal
          </Typography.Text>
          {hasActiveCard && (
            <Badge 
              count={`Surface #${activeDrawingCardIndex + 1}`} 
              color="#52c41a"
              style={{ marginLeft: 8 }}
            />
          )}
        </div>
      }
    >
      {!hasActiveCard ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '24px 0',
          color: '#666'
        }}>
          <Typography.Text type="secondary">
            Sélectionnez une surface pour commencer à dessiner des polygones
          </Typography.Text>
        </div>
      ) : (
        <Space size={16} style={{ width: '100%', justifyContent: 'center' }} wrap>
          {/* Reference Line Button */}
          <div style={{ textAlign: 'center' }}>
            <Button
              icon={<ColumnWidthOutlined />}
              onClick={() => {
                setIsDrawingReference(true);
                setIsDrawingPolygon(false);
                if (activeDrawingCardIndex !== null) {
                  setReferenceLine(prev => ({
                    ...prev,
                    [activeDrawingCardIndex]: []
                  }));
                }
                setPolygonPoints([]);
              }}
              disabled={isDrawingReference || isDrawingPolygon || isDrawingRectangleScale}
              size="large"
              style={{
                height: 48,
                minWidth: 140,
                borderRadius: 12,
                fontWeight: 500,
                background: (activeDrawingCardIndex !== null && scalePixelsPerMeter[activeDrawingCardIndex])
                  ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
                  : 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
                border: 'none',
                color: 'white',
                boxShadow: (activeDrawingCardIndex !== null && scalePixelsPerMeter[activeDrawingCardIndex])
                  ? '0 4px 12px rgba(82, 196, 26, 0.3)'
                  : '0 4px 12px rgba(250, 173, 20, 0.3)',
                opacity: (isDrawingReference || isDrawingPolygon || isDrawingRectangleScale) ? 0.6 : 1
              }}
            >
              {(activeDrawingCardIndex !== null && scalePixelsPerMeter[activeDrawingCardIndex]) ? 'Échelle OK' : 'Définir 0.9m'}
            </Button>
            {activeDrawingCardIndex !== null && scalePixelsPerMeter[activeDrawingCardIndex] && (
              <div style={{ fontSize: 10, color: '#52c41a', marginTop: 4 }}>
                {scalePixelsPerMeter[activeDrawingCardIndex].toFixed(1)} px/m
              </div>
            )}
          </div>

          {/* Rectangle Scale Button */}
          <div style={{ textAlign: 'center' }}>
            <Button
              icon={<BorderOutlined />}
              onClick={() => {
                setIsDrawingRectangleScale(true);
                setIsDrawingReference(false);
                setIsDrawingPolygon(false);
                setPolygonPoints([]);
              }}
              disabled={isDrawingReference || isDrawingPolygon || isDrawingRectangleScale}
              size="large"
              style={{
                height: 48,
                minWidth: 140,
                borderRadius: 12,
                fontWeight: 500,
                background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                border: 'none',
                color: 'white',
                boxShadow: '0 4px 12px rgba(114, 46, 209, 0.3)',
                opacity: (isDrawingReference || isDrawingPolygon || isDrawingRectangleScale) ? 0.6 : 1
              }}
            >
              Rectangle 1.1m
            </Button>
            <div style={{ fontSize: 10, color: '#722ed1', marginTop: 4 }}>
              Sélection auto-ligne
            </div>
          </div>

          <Divider type="vertical" style={{ height: 60, margin: '0 8px' }} />
          
          {/* Zone Froide Pleine */}
          <div style={{ textAlign: 'center' }}>
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                setDrawingColor('blue');
                setIsDrawingPolygon(true);
                setPolygonPoints([]);
              }}
              disabled={isDrawingPolygon || isDrawingRectangleScale}
              size="large"
              style={{
                height: 48,
                minWidth: 140,
                borderRadius: 12,
                fontWeight: 500,
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                color: 'white',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                opacity: (isDrawingPolygon || isDrawingRectangleScale) ? 0.6 : 1
              }}
            >
              Zone Froide
            </Button>
          </div>

          {/* Zone Froide Bordure */}
          <div style={{ textAlign: 'center' }}>
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                setDrawingColor('blue-hollow');
                setIsDrawingPolygon(true);
                setPolygonPoints([]);
              }}
              disabled={isDrawingPolygon || isDrawingRectangleScale}
              size="large"
              style={{
                height: 48,
                minWidth: 140,
                borderRadius: 12,
                fontWeight: 500,
                background: 'transparent',
                border: '2px solid #1890ff',
                color: '#1890ff',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.2)',
                opacity: (isDrawingPolygon || isDrawingRectangleScale) ? 0.6 : 1
              }}
            >
              Bordure Froide
            </Button>
          </div>
          <Divider type="vertical" style={{ height: 60, margin: '0 8px' }} />

          {/* Zone Chaude Pleine */}
          <div style={{ textAlign: 'center' }}>
            <Button
              icon={<FireOutlined />}
              onClick={() => {
                setDrawingColor('red');
                setIsDrawingPolygon(true);
                setPolygonPoints([]);
              }}
              disabled={isDrawingPolygon || isDrawingRectangleScale}
              size="large"
              style={{
                height: 48,
                minWidth: 140,
                borderRadius: 12,
                fontWeight: 500,
                background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
                border: 'none',
                color: 'white',
                boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)',
                opacity: (isDrawingPolygon || isDrawingRectangleScale) ? 0.6 : 1
              }}
            >
              Zone Chaude
            </Button>
          </div>

          {/* Zone Chaude Bordure */}
          <div style={{ textAlign: 'center' }}>
            <Button
              icon={<FireOutlined />}
              onClick={() => {
                setDrawingColor('red-hollow');
                setIsDrawingPolygon(true);
                setPolygonPoints([]);
              }}
              disabled={isDrawingPolygon || isDrawingRectangleScale}
              size="large"
              style={{
                height: 48,
                minWidth: 140,
                borderRadius: 12,
                fontWeight: 500,
                background: 'transparent',
                border: '2px solid #ff4d4f',
                color: '#ff4d4f',
                boxShadow: '0 4px 12px rgba(255, 77, 79, 0.2)',
                opacity: (isDrawingPolygon || isDrawingRectangleScale) ? 0.6 : 1
              }}
            >
              Bordure Chaude
            </Button>
          </div>
          {isDrawingReference && (
            <>
              <Divider type="vertical" style={{ height: 60, margin: '0 12px' }} />
              
              {/* Reference Line Progress Section */}
              <div style={{ textAlign: 'center' }}>
                <Badge 
                  count={activeDrawingCardIndex !== null ? (referenceLine[activeDrawingCardIndex]?.length || 0) : 0} 
                  showZero 
                  color={(activeDrawingCardIndex !== null && referenceLine[activeDrawingCardIndex]?.length === 2) ? '#52c41a' : '#faad14'}
                  style={{ marginBottom: 8 }}
                >
                  <Typography.Text style={{ 
                    fontSize: 13, 
                    color: '#666',
                    fontWeight: 500 
                  }}>
                    Points ligne
                  </Typography.Text>
                </Badge>
                
                <br />
                
                <Typography.Text style={{ fontSize: 12, color: '#52c41a' }}>
                  Cliquez 2 points = 0.9m
                </Typography.Text>
              </div>
            </>
          )}

          {isDrawingRectangleScale && (
            <>
              <Divider type="vertical" style={{ height: 60, margin: '0 12px' }} />
              
              {/* Rectangle Scale Progress Section */}
              <div style={{ textAlign: 'center' }}>
                <Typography.Text style={{ 
                  fontSize: 13, 
                  color: '#722ed1',
                  fontWeight: 500,
                  display: 'block',
                  marginBottom: 4
                }}>
                  Mode Rectangle
                </Typography.Text>
                
                <Typography.Text style={{ fontSize: 12, color: '#722ed1' }}>
                  Rectangle → auto-détection 1.1m
                </Typography.Text>
              </div>
            </>
          )}

          {isDrawingPolygon && (
            <>
              <Divider type="vertical" style={{ height: 60, margin: '0 12px' }} />
              
              {/* Progress & Finish Section */}
              <div style={{ textAlign: 'center' }}>
                <Badge 
                  count={polygonPoints.length} 
                  showZero 
                  color={canFinish ? '#52c41a' : '#faad14'}
                  style={{ marginBottom: 8 }}
                >
                  <Typography.Text style={{ 
                    fontSize: 13, 
                    color: '#666',
                    fontWeight: 500 
                  }}>
                    Points placés
                  </Typography.Text>
                </Badge>
                
                <br />
                
                <Button
                  icon={<CheckOutlined />}
                  disabled={!canFinish}
                  onClick={finishPolygon}
                  size="large"
                  style={{
                    height: 48,
                    minWidth: 140,
                    borderRadius: 12,
                    fontWeight: 500,
                    background: canFinish 
                      ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)' 
                      : undefined,
                    border: canFinish ? 'none' : undefined,
                    color: canFinish ? 'white' : undefined,
                    boxShadow: canFinish 
                      ? '0 4px 12px rgba(82, 196, 26, 0.3)' 
                      : undefined
                  }}
                >
                  Terminer
                </Button>
                
              </div>
            </>
          )}
        </Space>
      )}

    </Card>
  );
};

export default PolygonDrawingControls;
