import React, { useState, useEffect } from 'react';
import MultiImagePlanPage from '../components/common/MultiImagePlanPage';
import VisualPlanDragArea from './VisualPlan/VisualPlanDragArea';
import { fetchEquipmentCounts } from '../api/visualPlanApi';
import { getSiteName } from '../utils/siteContext';

const VisualPlanPage = () => {
  const [availableIcons, setAvailableIcons] = useState([]);
  const siteName = getSiteName();

  // Load equipment data to generate available icons list
  useEffect(() => {
    const loadEquipmentIcons = async () => {
      try {
        if (!siteName || siteName === 'unknown') return;

        const counts = await fetchEquipmentCounts(siteName);

        // Generate icon list from equipment counts
        const icons = [];

        // Add aerotherme icons
        const totalAerotherme = counts.aerotherme.reduce((sum, zone) => sum + zone.count, 0);
        for (let i = 0; i < totalAerotherme; i++) {
          icons.push({
            id: `aero-${i + 1}`,
            label: `Aero ${i + 1}`,
            moduleType: 'aerotherme'
          });
        }

        // Add clim IR icons
        const totalClimIr = counts.clim_ir.reduce((sum, zone) => sum + zone.count, 0);
        for (let i = 0; i < totalClimIr; i++) {
          icons.push({
            id: `clim-${i + 1}`,
            label: `Clim IR ${i + 1}`,
            moduleType: 'clim_ir'
          });
        }

        // Add clim wire icons
        const totalClimWire = counts.clim_wire.reduce((sum, zone) => sum + zone.count, 0);
        for (let i = 0; i < totalClimWire; i++) {
          icons.push({
            id: `climwire-${i + 1}`,
            label: `Clim Fil ${i + 1}`,
            moduleType: 'clim_wire'
          });
        }

        // Add rooftop icons
        const totalRooftop = counts.rooftop.reduce((sum, zone) => sum + zone.count, 0);
        for (let i = 0; i < totalRooftop; i++) {
          icons.push({
            id: `rooftop-${i + 1}`,
            label: `Rooftop ${i + 1}`,
            moduleType: 'rooftop'
          });
        }

        // Add comptage aerotherme icons
        const totalComptageAero = (counts.comptage_aerotherme || []).reduce((sum, zone) => sum + zone.count, 0);
        for (let i = 0; i < totalComptageAero; i++) {
          icons.push({
            id: `comptage-aero-${i + 1}`,
            label: `Comptage Aero ${i + 1}`,
            moduleType: 'comptage_aerotherme'
          });
        }

        // Add comptage climate icons
        const totalComptageClim = (counts.comptage_climate || []).reduce((sum, zone) => sum + zone.count, 0);
        for (let i = 0; i < totalComptageClim; i++) {
          icons.push({
            id: `comptage-clim-${i + 1}`,
            label: `Comptage Clim ${i + 1}`,
            moduleType: 'comptage_climate'
          });
        }

        // Add comptage rooftop icons
        const totalComptageRoof = (counts.comptage_rooftop || []).reduce((sum, zone) => sum + zone.count, 0);
        for (let i = 0; i < totalComptageRoof; i++) {
          icons.push({
            id: `comptage-roof-${i + 1}`,
            label: `Comptage Roof ${i + 1}`,
            moduleType: 'comptage_rooftop'
          });
        }

        // Add comptage lighting icons
        const totalComptageLight = (counts.comptage_lighting || []).reduce((sum, zone) => sum + zone.count, 0);
        for (let i = 0; i < totalComptageLight; i++) {
          icons.push({
            id: `comptage-light-${i + 1}`,
            label: `Comptage Éclairage ${i + 1}`,
            moduleType: 'comptage_lighting'
          });
        }

        setAvailableIcons(icons);
        console.log('📋 Available icons for multi-image:', icons);
      } catch (error) {
        console.error('❌ Error loading equipment icons:', error);
      }
    };

    loadEquipmentIcons();
  }, [siteName]);

  return (
    <MultiImagePlanPage
      pageTitle="Plan visuel - Positionnement des équipements"
      planType="VT"
      DraggableCardListComponent={VisualPlanDragArea}
      availableIcons={availableIcons}
    />
  );
};

export default VisualPlanPage;
