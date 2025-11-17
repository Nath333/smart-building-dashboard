import { useState, useEffect } from 'react';
import { message } from 'antd';
import { API_BASE_URL } from '../api/apiConfig';
import getDeleteUrlFromSQL from '../pages/surfacePlan/getDeleteUrlFromSQL';
import { getSiteName } from '../utils/siteContext';

const MAX_FILE_SIZE_MB = 5;

const useCardManager = () => {
  const [cards, setCards] = useState([]);
  const [imageSrc, setImageSrc] = useState(null);
  const [cropCardIndex, setCropCardIndex] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [drawingColor, setDrawingColor] = useState('blue');
  const [activeDrawingCardIndex, setActiveDrawingCardIndex] = useState(null);
  const [deleteUrls, setDeleteUrls] = useState([]);
  // Get siteName from centralized utility
  const [siteName] = useState(getSiteName());

  // Load cards from SQL on mount (similar to VtPlanPage)
  useEffect(() => {
    const loadCardsFromSQL = async () => {
      try {
        console.log('[🔄] Loading all images from SQL for site:', siteName);
        const response = await fetch(`${API_BASE_URL}/images/get-sql-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            site: siteName,
            // Load all images for the site (no title filter to get all types)
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[✅] SQL response:', data);
          
          // Ensure we have a valid array
          const images = Array.isArray(data) ? data : [];
          
          if (images.length > 0) {
            // Create cards from all images (filter by type, title as needed)
            console.log('[🔍] Processing', images.length, 'images from SQL');
            
            // Group images by URL to avoid duplicates, then by card_id
            const urlMap = new Map();
            const cardMap = new Map();
            
            images
              .filter(img => img && img.url_viewer) // Any image with valid URL
              .forEach(img => {
                // First, deduplicate by URL to handle existing bad data
                if (urlMap.has(img.url_viewer)) {
                  const existing = urlMap.get(img.url_viewer);
                  // Keep the one with more shapes data or latest ID
                  const currentShapes = img.shapes && img.shapes !== '""' && img.shapes !== '[]' ? img.shapes.length : 0;
                  const existingShapes = existing.shapes && existing.shapes !== '""' && existing.shapes !== '[]' ? existing.shapes.length : 0;
                  if (currentShapes > existingShapes || (currentShapes === existingShapes && img.id > existing.id)) {
                    urlMap.set(img.url_viewer, img);
                  }
                } else {
                  urlMap.set(img.url_viewer, img);
                }
              });

            // Now group by card_id from deduplicated images
            Array.from(urlMap.values()).forEach(img => {
              const cardId = img.card_id || `card-${img.id}`;
              if (!cardMap.has(cardId) || img.id > (cardMap.get(cardId).id || 0)) {
                cardMap.set(cardId, img);
              }
            });

            const loadedCards = Array.from(cardMap.values()).map(img => {
                let shapes = [];
                if (img.shapes && typeof img.shapes === 'string') {
                  try {
                    const parsed = JSON.parse(img.shapes);
                    shapes = Array.isArray(parsed) ? parsed : [];
                    console.log('[✅] Parsed', shapes.length, 'shapes for card ID:', img.id);
                  } catch (e) {
                    console.warn('[⚠️] Failed to parse shapes for image', img.id, ':', e);
                    shapes = [];
                  }
                } else if (Array.isArray(img.shapes)) {
                  shapes = img.shapes;
                }
                
                return {
                  image: img.url_viewer || '',
                  shapes: shapes || [],
                  card_id: img.card_id || img.id || Date.now(),
                  width: img.width || 800,
                  height: img.height || 600,
                  delete_url: img.delete_url || ''
                };
              });
            
            if (loadedCards.length > 0) {
              console.log('[✅] Successfully loaded', loadedCards.length, 'cards from SQL');
              setCards(loadedCards);
            } else {
              console.log('[ℹ️] No valid cards found - starting with empty state');
              setCards([]);
            }
          } else {
            console.log('[ℹ️] No images found for site - starting with empty state');
            setCards([]);
          }
        }
      } catch (error) {
        console.error('[❌] Failed to load from SQL:', error);
        // Ensure we always set cards to avoid undefined state
        setCards([]);
      }
    };
    
    if (siteName && siteName !== 'unknown') {
      loadCardsFromSQL();
    }
  }, [siteName]);

  useEffect(() => {
    fetchDeleteUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteName, cards]);
  const fetchDeleteUrls = async () => {
    try {
      console.log('[🔄] Fetching delete URLs for site:', siteName);
      const urls = await getDeleteUrlFromSQL(siteName); // No type filter to get all delete URLs
      console.log('[✅] Retrieved delete URLs:', urls);
      setDeleteUrls(urls);
    } catch (err) {
      console.error('❌ Failed to fetch delete URLs:', err);
      message.error("Erreur de chargement des delete URLs");
    }
  };
  const beforeUpload = (file, cardIndex) => {
    const isValidType = /^image\/(png|jpeg|jpg|webp|gif)$/.test(file.type);
    if (!isValidType) {
      message.error("Seuls les fichiers images (PNG, JPEG, WebP, GIF) sont acceptés.");
      return false;
    }

    if (file.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
      message.error(`Le fichier ne doit pas dépasser ${MAX_FILE_SIZE_MB} Mo.`);
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      setCropCardIndex(cardIndex);
    };
    reader.readAsDataURL(file);

    return false;
  };

  const onCropConfirm = (croppedDataUrl) => {
    const newCards = [...cards];
    if (cropCardIndex !== null) {
      newCards[cropCardIndex].image = croppedDataUrl;
      if (!newCards[cropCardIndex].shapes) newCards[cropCardIndex].shapes = [];
      setCards(newCards);
      setActiveDrawingCardIndex(cropCardIndex);
    }
    setImageSrc(null);
    setCropCardIndex(null);
  };

  const onRemove = (index) => {
    const newCards = [...cards];
    newCards.splice(index, 1);
    setCards(newCards);
    fetchDeleteUrls();
  };

  const handlePolygonClick = (e, cardIndex) => {
    if (!isDrawingPolygon || cardIndex !== activeDrawingCardIndex) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPolygonPoints((prev) => [...prev, { x, y }]);
  };

  const finishPolygon = () => {
    if (polygonPoints.length >= 3 && activeDrawingCardIndex !== null) {
      const newCards = [...cards];
      const shapes = newCards[activeDrawingCardIndex].shapes || [];
      shapes.push({
        id: `polygon-${Date.now()}`,
        type: 'polygon',
        color: drawingColor,
        points: polygonPoints,
      });
      newCards[activeDrawingCardIndex].shapes = shapes;
      setCards(newCards);
      setPolygonPoints([]);
      setIsDrawingPolygon(true);
    }
  };

  const addNewCard = () => {
    const newCardId = `surface-card-new-${Date.now()}`;
    setCards((prev) => [...prev, { image: null, shapes: [], card_id: newCardId }]);
  };

  const clearCards = () => {
    setCards([]);
    setPolygonPoints([]);
    setIsDrawingPolygon(false);
    setActiveDrawingCardIndex(null);
  };

  return {
    cards,
    addNewCard,
    clearCards,
    polygonPoints,
    drawingColor,
    setDrawingColor,
    finishPolygon,
    onRemove,
    beforeUpload,
    handlePolygonClick,
    imageSrc,
    setImageSrc,
    cropCardIndex,
    setCropCardIndex,
    onCropConfirm,
    isDrawingPolygon,
    setIsDrawingPolygon,
    activeDrawingCardIndex,
    setPolygonPoints,
    deleteUrls,
    fetchDeleteUrls,
  };
};

export default useCardManager;
